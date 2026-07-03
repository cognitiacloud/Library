/**
 * BUDGET WHEELS DEALEROS — ai-harness/provider (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Module 13 — AI task kinds, model providers, task-based routing. The
 * ModelRouter puts the policy gate (redaction.ts) in front of every call,
 * enforces per-call cost caps, falls back to the configured fallback provider
 * when the primary is denied or fails, and records every attempt — allowed,
 * denied, or errored — to the usage ledger (usage-ledger.ts).
 *
 * Every provider here is a deterministic mock: no network I/O, no SDKs, no
 * secrets. Timestamps come in via the `now` parameter; nothing reads the
 * wall clock.
 */

import type { IsoTimestamp, TenantId } from '../schemas/core';
import type { PolicyGate, TenantAiPolicy } from './redaction';
import { sha256Hex, type ModelUsageRecord, type UsageLedger } from './usage-ledger';

// ---------------------------------------------------------------------------
// Task + provider vocabulary
// ---------------------------------------------------------------------------

// SCHEMA_NOTE: AiTaskKind and ModelProviderKind are packet-local; they are
// candidates for schemas/core so Cognitia receipts (ai_reply_drafted etc.) and
// the connector registry can share the same vocabulary.
export type AiTaskKind =
  | 'lead_classification'
  | 'intent_detection'
  | 'vehicle_matching'
  | 'reply_drafting'
  | 'objection_handling'
  | 'equity_opportunity_explanation'
  | 'listing_copy'
  | 'seo_content'
  | 'aeo_answer_generation'
  | 'followup_sequence'
  | 'call_summary'
  | 'manager_coaching'
  | 'source_attribution_analysis'
  | 'anomaly_detection'
  | 'compliance_check';

export type ModelProviderKind = 'openai' | 'anthropic' | 'openrouter' | 'ollama_local' | 'mock_local';

export interface ModelRequest {
  task: AiTaskKind;
  tenantId: TenantId;
  /** Key into the prompt registry (usage-ledger.ts) — pins which template ran. */
  promptKey: string;
  promptVersion: string;
  /** Should already be through redactPii() when containsPii is false. */
  input: string;
  /** Caller's declaration after redaction; gates external routing hard. */
  containsPii: boolean;
  /** Per-request cost ceiling; combined with the route's maxCostCentsPerCall. */
  maxCostCents: number;
}

export interface ModelResponse {
  text: string;
  providerUsed: ModelProviderKind;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
  fallbackUsed: boolean;
  /**
   * V1 rule: every model output is a draft. Nothing reaches a customer,
   * listing, or page without a named human approver (see core NextBestAction).
   */
  requiresHumanApproval: true;
}

/** Synchronous in this scaffold — real providers would be async behind the same shape. */
export interface ModelProvider {
  readonly kind: ModelProviderKind;
  readonly isExternal: boolean;
  complete(req: ModelRequest): ModelResponse;
}

// ---------------------------------------------------------------------------
// Deterministic mock providers
// ---------------------------------------------------------------------------

/** Claim-safe canned draft line per task — no guarantees, no fabricated proof. */
const TASK_DRAFT_LINES: Record<AiTaskKind, string> = {
  lead_classification: 'Suggested lead classification with reason codes, for human review.',
  intent_detection: 'Estimated buyer intent band based on the provided text only.',
  vehicle_matching: 'Candidate in-stock vehicle matches ranked by stated preferences.',
  reply_drafting: 'Draft customer reply covering the question asked, with no pricing or availability promises.',
  objection_handling: 'Suggested talking points that address the stated objection without overpromising.',
  equity_opportunity_explanation: 'Plain-language explanation of the equity opportunity signals, estimates only.',
  listing_copy: 'Draft listing copy from the provided vehicle facts; disclosures must be verified before publish.',
  seo_content: 'Draft SEO page content from provided inventory facts; review before publish.',
  aeo_answer_generation: 'Draft answer-block content citing only the provided facts.',
  followup_sequence: 'Proposed follow-up cadence draft respecting consent and opt-out status.',
  call_summary: 'Summary of the provided call notes; verify details before acting.',
  manager_coaching: 'Coaching observations drawn only from the provided interaction record.',
  source_attribution_analysis: 'Attribution readout limited to the provided touch data.',
  anomaly_detection: 'Flagged anomalies in the provided metrics, for human investigation.',
  compliance_check: 'Compliance review notes; not legal advice — route flagged items to counsel.',
};

const CLAIM_SAFE_FOOTER =
  'Drafted with AI assistance for internal review; requires human approval before any outbound use. ' +
  'No guarantees of price, availability, financing, or outcome.';

/**
 * Deterministic local provider: same input → same output. The draft text is
 * derived from the task plus a stable hash of the input, so tests can assert
 * exact equality. Also stands in for a local Ollama runtime via kind override.
 */
export class MockLocalProvider implements ModelProvider {
  readonly isExternal = false;

  constructor(
    readonly kind: Extract<ModelProviderKind, 'mock_local' | 'ollama_local'> = 'mock_local',
    readonly model: string = 'mock-local-draft-v1',
  ) {}

  complete(req: ModelRequest): ModelResponse {
    const ref = sha256Hex(req.input, 8);
    const text = `[MOCK DRAFT ${req.task} ref:${ref}] ${TASK_DRAFT_LINES[req.task]} ${CLAIM_SAFE_FOOTER}`;
    const inputTokens = Math.ceil(req.input.length / 4);
    return {
      text,
      providerUsed: this.kind,
      model: this.model,
      inputTokens,
      outputTokens: Math.ceil(text.length / 4),
      costCents: 0, // local compute — no per-token billing in this scaffold
      fallbackUsed: false, // router overwrites when this ran as the fallback
      requiresHumanApproval: true,
    };
  }
}

/**
 * Deterministic stand-in for an external provider (openai/anthropic/openrouter)
 * so routing, gating, and cost-cap paths can be exercised WITHOUT any network
 * call. `fixedCostCents` lets tests simulate an over-budget call.
 */
export class MockExternalProvider implements ModelProvider {
  readonly isExternal = true;

  constructor(
    readonly kind: Extract<ModelProviderKind, 'openai' | 'anthropic' | 'openrouter'>,
    readonly model: string = `mock-${kind}-model`,
    private readonly fixedCostCents?: number,
  ) {}

  complete(req: ModelRequest): ModelResponse {
    const ref = sha256Hex(req.input, 8);
    const text =
      `[MOCK EXTERNAL ${this.kind} ${req.task} ref:${ref}] Deterministic stand-in response — ` +
      `no network call was made. ${CLAIM_SAFE_FOOTER}`;
    const inputTokens = Math.ceil(req.input.length / 4);
    const outputTokens = Math.ceil(text.length / 4);
    return {
      text,
      providerUsed: this.kind,
      model: this.model,
      inputTokens,
      outputTokens,
      costCents: this.fixedCostCents ?? Math.max(1, Math.ceil((inputTokens + outputTokens) / 250)),
      fallbackUsed: false,
      requiresHumanApproval: true,
    };
  }
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

export interface RouteEntry {
  primary: ModelProviderKind;
  fallback: ModelProviderKind;
  /** Target model for the PRIMARY provider (mock names only in this scaffold). */
  model: string;
  maxCostCentsPerCall: number;
}

export type RoutingConfig = Record<AiTaskKind, RouteEntry>;

/**
 * Default task routing. Privacy-sensitive tasks (call_summary, compliance_check,
 * manager_coaching — raw conversation/PII-heavy inputs) route primary to a
 * LOCAL provider; every task falls back to mock_local so a denial or failure
 * never strands a request on an external-only path.
 */
export const DEFAULT_ROUTING: RoutingConfig = {
  lead_classification: { primary: 'anthropic', fallback: 'mock_local', model: 'mock-anthropic-small', maxCostCentsPerCall: 10 },
  intent_detection: { primary: 'anthropic', fallback: 'mock_local', model: 'mock-anthropic-small', maxCostCentsPerCall: 10 },
  vehicle_matching: { primary: 'anthropic', fallback: 'mock_local', model: 'mock-anthropic-small', maxCostCentsPerCall: 15 },
  reply_drafting: { primary: 'anthropic', fallback: 'mock_local', model: 'mock-anthropic-mid', maxCostCentsPerCall: 25 },
  objection_handling: { primary: 'anthropic', fallback: 'mock_local', model: 'mock-anthropic-mid', maxCostCentsPerCall: 25 },
  equity_opportunity_explanation: { primary: 'anthropic', fallback: 'mock_local', model: 'mock-anthropic-mid', maxCostCentsPerCall: 25 },
  listing_copy: { primary: 'openai', fallback: 'mock_local', model: 'mock-openai-mid', maxCostCentsPerCall: 25 },
  seo_content: { primary: 'openai', fallback: 'mock_local', model: 'mock-openai-mid', maxCostCentsPerCall: 40 },
  aeo_answer_generation: { primary: 'openai', fallback: 'mock_local', model: 'mock-openai-mid', maxCostCentsPerCall: 25 },
  followup_sequence: { primary: 'anthropic', fallback: 'mock_local', model: 'mock-anthropic-small', maxCostCentsPerCall: 15 },
  call_summary: { primary: 'ollama_local', fallback: 'mock_local', model: 'mock-ollama-local', maxCostCentsPerCall: 5 },
  manager_coaching: { primary: 'ollama_local', fallback: 'mock_local', model: 'mock-ollama-local', maxCostCentsPerCall: 5 },
  source_attribution_analysis: { primary: 'openrouter', fallback: 'mock_local', model: 'mock-openrouter-mixed', maxCostCentsPerCall: 20 },
  anomaly_detection: { primary: 'anthropic', fallback: 'mock_local', model: 'mock-anthropic-small', maxCostCentsPerCall: 10 },
  compliance_check: { primary: 'ollama_local', fallback: 'mock_local', model: 'mock-ollama-local', maxCostCentsPerCall: 5 },
};

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export class PolicyDeniedError extends Error {
  constructor(readonly reason: string) {
    super(`model call denied by policy gate: ${reason}`);
    this.name = 'PolicyDeniedError';
  }
}

export class ModelRouter {
  constructor(
    private readonly providers: Partial<Record<ModelProviderKind, ModelProvider>>,
    private readonly routing: RoutingConfig,
    private readonly policyGate: PolicyGate,
    private readonly ledger: UsageLedger,
  ) {}

  /**
   * Route one request: gate the primary, fall back on denial/error/cost-cap
   * breach, and record EVERY attempt to the usage ledger. If no attempt
   * succeeds: throws PolicyDeniedError when any attempt was policy-denied
   * (carrying the most recent gate reason), otherwise rethrows the last error.
   */
  route(req: ModelRequest, tenantPolicy: TenantAiPolicy, now: IsoTimestamp): ModelResponse {
    const routeEntry = this.routing[req.task];
    const costCapCents = Math.min(req.maxCostCents, routeEntry.maxCostCentsPerCall);
    const attempts: { providerKind: ModelProviderKind; isFallback: boolean }[] = [
      { providerKind: routeEntry.primary, isFallback: false },
      { providerKind: routeEntry.fallback, isFallback: true },
    ];

    const baseRecord = (provider: ModelProviderKind, model: string): Omit<ModelUsageRecord, 'inputTokens' | 'outputTokens' | 'costCents' | 'outcome' | 'gateReason'> => ({
      tenantId: req.tenantId,
      task: req.task,
      provider,
      model,
      promptKey: req.promptKey,
      promptVersion: req.promptVersion,
      timestamp: now,
    });

    let lastDenyReason: string | undefined;
    let lastError: Error | undefined;

    for (const attempt of attempts) {
      const provider = this.providers[attempt.providerKind];
      if (provider === undefined) {
        lastError = new Error(`provider_not_configured:${attempt.providerKind}`);
        this.ledger.record({
          ...baseRecord(attempt.providerKind, routeEntry.model),
          inputTokens: 0,
          outputTokens: 0,
          costCents: 0,
          outcome: 'error',
          gateReason: lastError.message,
        });
        continue;
      }

      const gateResult = this.policyGate.checkModelCall({
        task: req.task,
        provider,
        containsPii: req.containsPii,
        tenantAiPolicy: tenantPolicy,
      });
      if (gateResult !== 'allow') {
        lastDenyReason = gateResult.deny;
        this.ledger.record({
          // route model names the primary target; provider kind identifies the attempt
          ...baseRecord(provider.kind, routeEntry.model),
          inputTokens: 0,
          outputTokens: 0,
          costCents: 0,
          outcome: 'denied',
          gateReason: gateResult.deny,
        });
        continue;
      }

      let res: ModelResponse;
      try {
        res = provider.complete(req);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.ledger.record({
          ...baseRecord(provider.kind, routeEntry.model),
          inputTokens: 0,
          outputTokens: 0,
          costCents: 0,
          outcome: 'error',
          gateReason: `provider_error:${lastError.message}`,
        });
        continue;
      }

      if (res.costCents > costCapCents) {
        // Cost is only knowable post-call in this scaffold; the overrun is
        // recorded at its real cost, then the fallback is tried.
        lastError = new Error(`cost_cap_exceeded:${res.costCents}>${costCapCents}`);
        this.ledger.record({
          ...baseRecord(res.providerUsed, res.model),
          inputTokens: res.inputTokens,
          outputTokens: res.outputTokens,
          costCents: res.costCents,
          outcome: 'error',
          gateReason: lastError.message,
        });
        continue;
      }

      const finalRes: ModelResponse = { ...res, fallbackUsed: attempt.isFallback };
      this.ledger.record({
        ...baseRecord(finalRes.providerUsed, finalRes.model),
        inputTokens: finalRes.inputTokens,
        outputTokens: finalRes.outputTokens,
        costCents: finalRes.costCents,
        outcome: 'ok',
      });
      return finalRes;
    }

    if (lastDenyReason !== undefined) {
      throw new PolicyDeniedError(lastDenyReason);
    }
    throw lastError ?? new Error('model routing failed: no attempts were made');
  }
}
