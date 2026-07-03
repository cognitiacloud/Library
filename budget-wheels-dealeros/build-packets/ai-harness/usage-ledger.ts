/**
 * BUDGET WHEELS DEALEROS — ai-harness/usage-ledger (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Module 13 — Model usage ledger + prompt/version registry. Every model call
 * attempt (allowed, denied, or errored) lands here so tenants can see exactly
 * what the AI harness did, what it cost, and why anything was blocked. The
 * ledger is append-only in spirit: records are frozen on insert and versions
 * in the prompt registry are immutable once registered.
 *
 * Timestamps are always supplied by the caller (`now`) — never read from the
 * wall clock inside this module — so behavior stays deterministic under test.
 */

import { createHash } from 'node:crypto';
import type { IsoTimestamp, TenantId } from '../schemas/core';
import type { AiTaskKind, ModelProviderKind } from './provider';

// ---------------------------------------------------------------------------
// Shared deterministic hashing helper (used by redaction + mock providers too)
// ---------------------------------------------------------------------------

/** sha256 hex digest of a UTF-8 string, optionally truncated to `length` chars. */
export function sha256Hex(value: string, length?: number): string {
  const digest = createHash('sha256').update(value, 'utf8').digest('hex');
  return length === undefined ? digest : digest.slice(0, length);
}

// ---------------------------------------------------------------------------
// Usage records
// ---------------------------------------------------------------------------

// SCHEMA_NOTE: ModelUsageRecord is packet-local; it is a candidate for
// schemas/core (or a persistence schema) so Cognitia receipts and tenant
// billing views can reference the same shape.
export interface ModelUsageRecord {
  tenantId: TenantId;
  task: AiTaskKind;
  provider: ModelProviderKind;
  model: string;
  promptKey: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
  outcome: 'ok' | 'denied' | 'error';
  /** Populated for 'denied' (policy gate reason) and 'error' (failure tag). */
  gateReason?: string;
  timestamp: IsoTimestamp;
}

/** Minimal ledger surface the ModelRouter depends on. */
export interface UsageLedger {
  record(rec: ModelUsageRecord): void;
}

export interface TaskUsageSummary {
  calls: number;
  okCalls: number;
  deniedCalls: number;
  errorCalls: number;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
}

export class InMemoryUsageLedger implements UsageLedger {
  private readonly entries: ModelUsageRecord[] = [];

  record(rec: ModelUsageRecord): void {
    for (const [field, value] of [
      ['inputTokens', rec.inputTokens],
      ['outputTokens', rec.outputTokens],
      ['costCents', rec.costCents],
    ] as const) {
      if (!Number.isFinite(value) || value < 0) {
        throw new Error(`usage ledger rejects non-finite/negative ${field}: ${value}`);
      }
    }
    // Freeze a copy so callers cannot mutate ledger history after the fact.
    this.entries.push(Object.freeze({ ...rec }));
  }

  /** All records for one tenant, in insertion order. */
  recordsFor(tenantId: TenantId): readonly ModelUsageRecord[] {
    return this.entries.filter((rec) => rec.tenantId === tenantId);
  }

  /** Total cost across all outcomes (denied/error rows carry their real cost, usually 0). */
  totalCostCents(tenantId: TenantId): number {
    let total = 0;
    for (const rec of this.entries) {
      if (rec.tenantId === tenantId) total += rec.costCents;
    }
    return total;
  }

  byTask(tenantId: TenantId): Partial<Record<AiTaskKind, TaskUsageSummary>> {
    const out: Partial<Record<AiTaskKind, TaskUsageSummary>> = {};
    for (const rec of this.entries) {
      if (rec.tenantId !== tenantId) continue;
      let summary = out[rec.task];
      if (summary === undefined) {
        summary = {
          calls: 0,
          okCalls: 0,
          deniedCalls: 0,
          errorCalls: 0,
          inputTokens: 0,
          outputTokens: 0,
          costCents: 0,
        };
        out[rec.task] = summary;
      }
      summary.calls += 1;
      if (rec.outcome === 'ok') summary.okCalls += 1;
      else if (rec.outcome === 'denied') summary.deniedCalls += 1;
      else summary.errorCalls += 1;
      summary.inputTokens += rec.inputTokens;
      summary.outputTokens += rec.outputTokens;
      summary.costCents += rec.costCents;
    }
    return out;
  }
}

// ---------------------------------------------------------------------------
// Prompt / version registry
// ---------------------------------------------------------------------------

// SCHEMA_NOTE: PromptRegistryEntry is packet-local; a persisted prompt registry
// (with approval receipts per version) belongs in the dedicated DealerOS repo.
export interface PromptRegistryEntry {
  promptKey: string;
  version: string;
  purpose: string;
  /** Full sha256 hex of the prompt template text — pins what was actually run. */
  sha256: string;
}

/**
 * Immutable prompt registry: a (promptKey, version) pair can only ever map to
 * one template hash. Re-registering the identical template is a no-op;
 * re-registering different text under the same version throws.
 */
export class InMemoryPromptRegistry {
  private readonly entries = new Map<string, PromptRegistryEntry>();

  private static keyOf(promptKey: string, version: string): string {
    return `${promptKey}@${version}`;
  }

  register(promptKey: string, version: string, purpose: string, templateText: string): PromptRegistryEntry {
    const key = InMemoryPromptRegistry.keyOf(promptKey, version);
    const sha256 = sha256Hex(templateText);
    const existing = this.entries.get(key);
    if (existing !== undefined) {
      if (existing.sha256 !== sha256) {
        throw new Error(`prompt version is immutable: ${key} already registered with a different template hash`);
      }
      return existing;
    }
    const entry: PromptRegistryEntry = Object.freeze({ promptKey, version, purpose, sha256 });
    this.entries.set(key, entry);
    return entry;
  }

  get(promptKey: string, version: string): PromptRegistryEntry | undefined {
    return this.entries.get(InMemoryPromptRegistry.keyOf(promptKey, version));
  }

  list(): PromptRegistryEntry[] {
    return [...this.entries.values()];
  }
}
