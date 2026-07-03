/**
 * BUDGET WHEELS DEALEROS — ai-harness/redaction (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Module 13 — Redaction gate + model-call policy gate. `redactPii` strips
 * emails, NA phone numbers, VINs, Canadian postal codes, and known names from
 * text before it is handed to any model provider; the DefaultPolicyGate then
 * decides whether a given provider may see the request at all.
 *
 * V1 invariant (mirrors TenantSettings.aiPolicy.piiToExternalModelsAllowed,
 * which is typed `false` in schemas/core): PII may NEVER be sent to an
 * external model provider, regardless of any tenant setting. The gate does
 * not even consult a flag for it.
 */

import type { TenantSettings } from '../schemas/core';
import type { AiTaskKind, ModelProviderKind } from './provider';
import { sha256Hex } from './usage-ledger';

// SCHEMA_NOTE: TenantAiPolicy is a local alias of TenantSettings['aiPolicy'];
// if more packets need it, promote a named export to schemas/core.
export type TenantAiPolicy = TenantSettings['aiPolicy'];

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

export type RedactionKind = 'email' | 'phone' | 'vin' | 'name' | 'postal_code';

export interface Redaction {
  kind: RedactionKind;
  /** First 8 hex chars of sha256(original) — enough to correlate, not to reverse. */
  original_hash: string;
  /** e.g. "[EMAIL_1]" — what the original was replaced with in redactedText. */
  placeholder: string;
}

export interface RedactPiiResult {
  redactedText: string;
  redactions: Redaction[];
}

/** RFC-loose email matcher — favors recall over precision for a redaction gate. */
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/**
 * North-American phone formats: 604-555-1234, (604) 555-1234, +1 604 555 1234,
 * 604.555.1234. Digit lookarounds stop partial matches inside longer runs.
 */
const PHONE_RE = /(?<!\d)(?:\+1[\s.-]?)?(?:\(\d{3}\)[\s.-]?|\d{3}[\s.-])\d{3}[\s.-]\d{4}(?!\d)/g;

/** 17-char VIN: letters exclude I, O, Q; must contain at least one digit. */
const VIN_RE = /\b(?=[A-HJ-NPR-Z0-9]*\d)[A-HJ-NPR-Z0-9]{17}\b/g;

/** Canadian postal code, e.g. V6B 1A1 / V6B-1A1 / v6b1a1. */
const POSTAL_CODE_RE = /\b[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d\b/g;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const PLACEHOLDER_LABELS: Record<RedactionKind, string> = {
  email: 'EMAIL',
  phone: 'PHONE',
  vin: 'VIN',
  name: 'NAME',
  postal_code: 'POSTAL_CODE',
};

/**
 * Redact PII from free text before any model call.
 *
 * Pass order matters: emails first (so names embedded in addresses are
 * consumed whole), then phones, VINs, postal codes, and finally the
 * exact-match pass over `knownPii.names` (longest names first so
 * "Jordan Lee-Smith" wins over "Jordan Lee"). Repeated occurrences of the
 * same original value reuse the same placeholder.
 */
export function redactPii(
  text: string,
  knownPii: { names?: string[] } = {},
): RedactPiiResult {
  const redactions: Redaction[] = [];
  const memo = new Map<string, string>(); // `${kind}:${original}` -> placeholder
  const counters: Record<RedactionKind, number> = {
    email: 0,
    phone: 0,
    vin: 0,
    name: 0,
    postal_code: 0,
  };
  let out = text;

  const runPass = (kind: RedactionKind, regex: RegExp): void => {
    out = out.replace(regex, (match) => {
      const key = `${kind}:${match}`;
      let placeholder = memo.get(key);
      if (placeholder === undefined) {
        counters[kind] += 1;
        placeholder = `[${PLACEHOLDER_LABELS[kind]}_${counters[kind]}]`;
        memo.set(key, placeholder);
        redactions.push({ kind, original_hash: sha256Hex(match, 8), placeholder });
      }
      return placeholder;
    });
  };

  runPass('email', EMAIL_RE);
  runPass('phone', PHONE_RE);
  runPass('vin', VIN_RE);
  runPass('postal_code', POSTAL_CODE_RE);

  const names = (knownPii.names ?? [])
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
    .sort((a, b) => b.length - a.length);
  for (const name of names) {
    runPass('name', new RegExp(`\\b${escapeRegExp(name)}\\b`, 'g'));
  }

  return { redactedText: out, redactions };
}

// ---------------------------------------------------------------------------
// Policy gate
// ---------------------------------------------------------------------------

export interface PolicyGateInput {
  task: AiTaskKind;
  /** Structural subset of ModelProvider — a full provider instance also fits. */
  provider: { kind: ModelProviderKind; isExternal: boolean };
  containsPii: boolean;
  tenantAiPolicy: TenantAiPolicy;
}

export type PolicyGateResult = 'allow' | { deny: string };

export interface PolicyGate {
  checkModelCall(input: PolicyGateInput): PolicyGateResult;
}

/**
 * Default V1 gate. Local (non-external) providers are always allowed.
 * External providers are denied when:
 *  - the request contains PII (hard rule, no tenant override in V1), or
 *  - the tenant runs in localOnlyMode, or
 *  - the tenant has not allowed external models.
 */
export class DefaultPolicyGate implements PolicyGate {
  checkModelCall(input: PolicyGateInput): PolicyGateResult {
    const { provider, containsPii, tenantAiPolicy } = input;
    if (!provider.isExternal) {
      return 'allow';
    }
    if (containsPii) {
      // piiToExternalModelsAllowed is typed `false` in core — hard-off in V1.
      return { deny: 'pii_to_external_model_blocked_v1' };
    }
    if (tenantAiPolicy.localOnlyMode) {
      return { deny: 'tenant_local_only_mode' };
    }
    if (!tenantAiPolicy.externalModelsAllowed) {
      return { deny: 'tenant_external_models_not_allowed' };
    }
    return 'allow';
  }
}
