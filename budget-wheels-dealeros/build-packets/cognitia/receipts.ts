/**
 * BUDGET WHEELS DEALEROS — cognitia/receipts (BUILD PACKET, V1)
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only. Module 11: Cognitia proof adapter.
 *
 * Every important DealerOS action emits a ProofReceipt into an append-only,
 * hash-chained ledger. Receipts use snake_case field names because they are a
 * wire/ledger format (they will be serialized to Cognitia as-is), while the
 * in-app domain types in ../schemas/core stay camelCase.
 *
 * Determinism rules honored here:
 * - No Date.now() inside logic: emit() takes the timestamp as a parameter.
 * - Payload hashing uses canonical JSON (recursively sorted keys, undefined
 *   fields omitted) so the same logical receipt always hashes identically.
 * - claim_safe_summary is generated from per-event templates: factual,
 *   past-tense, no superlatives, no guarantees, no raw PII (customer
 *   references are always the redacted ref).
 */

import { createHash } from 'node:crypto';
import type {
  AgentPassportId,
  CampaignId,
  ConnectorId,
  ConsentRecord,
  CustomerId,
  DealId,
  DealerId,
  IsoTimestamp,
  LeadId,
  ReceiptId,
  RooftopId,
  TenantId,
  UserId,
  VehicleId,
} from '../schemas/core';

// ---------------------------------------------------------------------------
// Event vocabulary (exactly the 22 Module-11 event types from CONTEXT_PACK)
// ---------------------------------------------------------------------------

export type ProofEventType =
  | 'lead_received'
  | 'consent_captured'
  | 'customer_created'
  | 'duplicate_detected'
  | 'vehicle_matched'
  | 'inventory_context_used'
  | 'equity_score_generated'
  | 'ai_reply_drafted'
  | 'human_approval_requested'
  | 'human_approval_granted'
  | 'appointment_drafted'
  | 'appointment_confirmed'
  | 'test_drive_completed'
  | 'followup_sent'
  | 'crm_updated'
  | 'sold_marked'
  | 'lost_reason_recorded'
  | 'review_requested'
  | 'campaign_generated'
  | 'campaign_attributed'
  | 'connector_sync_completed'
  | 'connector_sync_failed';

export const PROOF_EVENT_TYPES: readonly ProofEventType[] = [
  'lead_received',
  'consent_captured',
  'customer_created',
  'duplicate_detected',
  'vehicle_matched',
  'inventory_context_used',
  'equity_score_generated',
  'ai_reply_drafted',
  'human_approval_requested',
  'human_approval_granted',
  'appointment_drafted',
  'appointment_confirmed',
  'test_drive_completed',
  'followup_sent',
  'crm_updated',
  'sold_marked',
  'lost_reason_recorded',
  'review_requested',
  'campaign_generated',
  'campaign_attributed',
  'connector_sync_completed',
  'connector_sync_failed',
];

// ---------------------------------------------------------------------------
// Policy gate + receipt shapes
// ---------------------------------------------------------------------------

export interface PolicyGateResult {
  /** Which policy gate evaluated the action, e.g. "outbound_comms.consent_check". */
  gateKey: string;
  result: 'allow' | 'deny' | 'needs_human_approval';
  reason: string;
}

export type ActorType = 'human' | 'agent' | 'system' | 'connector';

/** Consent basis reuses the CASL-aware vocabulary from core's ConsentRecord. */
export type ConsentBasis = ConsentRecord['basis'];

/**
 * Wire/ledger receipt record — Module 11 field list, snake_case on purpose.
 * `prev_receipt_hash` chains each receipt to the one before it (hash-chain);
 * the first receipt in a ledger links to the literal string 'GENESIS'.
 */
export interface ProofReceipt {
  receipt_id: ReceiptId;
  tenant_id: TenantId;
  dealer_id: DealerId;
  rooftop_id: RooftopId;
  actor_type: ActorType;
  actor_id: string;
  agent_passport_id?: AgentPassportId;
  human_approver_id?: UserId;
  /** ALWAYS the redacted ref from redactCustomerRef() — never a raw id/name. */
  customer_ref_redacted: string;
  lead_id?: LeadId;
  vehicle_id?: VehicleId;
  deal_id?: DealId;
  campaign_id?: CampaignId;
  connector_id?: ConnectorId;
  event_type: ProofEventType;
  action_requested: string;
  action_taken: string;
  policy_gate_result: PolicyGateResult;
  consent_basis: ConsentBasis;
  /** Opaque references to evidence records (no PII in the refs themselves). */
  data_refs: string[];
  external_side_effect: boolean;
  /** sha256 hex of the canonicalized receipt body (all fields except the two hash fields). */
  payload_hash: string;
  /** Receipt-hash of the previous ledger entry, or 'GENESIS' for the first. */
  prev_receipt_hash: string;
  timestamp: IsoTimestamp;
  /** How to undo/compensate this action, e.g. "crm_updated: restore prior snapshot ref". */
  rollback_path: string;
  /** Where a human contests this record, e.g. "cognitia://disputes/new?receipt=<id>". */
  dispute_path: string;
  /** Factual, past-tense, template-generated. No superlatives, no raw PII. */
  claim_safe_summary: string;
}

/** Caller-supplied portion of a receipt; the emitter fills in the rest. */
export type ProofReceiptInput = Omit<
  ProofReceipt,
  'receipt_id' | 'payload_hash' | 'prev_receipt_hash' | 'timestamp' | 'claim_safe_summary'
>;

export interface ChainVerificationResult {
  valid: boolean;
  failedAtIndex?: number;
  reason?: string;
}

export interface ProofEmitter {
  emit(input: ProofReceiptInput, timestamp: IsoTimestamp): ProofReceipt;
  verifyChain(): ChainVerificationResult;
  getLedger(): ProofReceipt[];
}

// ---------------------------------------------------------------------------
// Redaction + hashing helpers
// ---------------------------------------------------------------------------

export const GENESIS_HASH = 'GENESIS';

/** Sentinel redacted ref for events with no customer in scope (e.g. connector syncs). */
export const NO_CUSTOMER_REF = 'cust_none';

function sha256Hex(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * One-way customer reference: 'cust_' + first 10 hex chars of sha256(id).
 * Deterministic per customer, never reveals the raw id or any name.
 */
export function redactCustomerRef(customerId: CustomerId | string): string {
  return 'cust_' + sha256Hex(String(customerId)).slice(0, 10);
}

/** Recursively sorts object keys (dropping undefined) for stable hashing. */
function sortForCanonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForCanonical);
  if (value !== null && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      if (source[key] !== undefined) out[key] = sortForCanonical(source[key]);
    }
    return out;
  }
  return value;
}

/** Canonical JSON: stable key ordering so hashes are reproducible. */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortForCanonical(value));
}

/** The hashable body of a receipt: everything except the two hash fields. */
function receiptBody(receipt: ProofReceipt): Record<string, unknown> {
  const { payload_hash: _p, prev_receipt_hash: _q, ...body } = receipt;
  return body;
}

export function computePayloadHash(receipt: ProofReceipt): string {
  return sha256Hex(canonicalize(receiptBody(receipt)));
}

/** Link hash a successor stores in prev_receipt_hash: binds body AND position. */
export function computeReceiptHash(receipt: ProofReceipt): string {
  return sha256Hex(receipt.payload_hash + '|' + receipt.prev_receipt_hash);
}

// ---------------------------------------------------------------------------
// Claim-safe summary templates (factual, past-tense, redacted refs only)
// ---------------------------------------------------------------------------

type SummaryContext = Omit<ProofReceipt, 'payload_hash' | 'prev_receipt_hash' | 'claim_safe_summary'>;

function leadTag(r: SummaryContext): string {
  return r.lead_id ? ` (lead ${r.lead_id})` : '';
}
function vehicleTag(r: SummaryContext): string {
  return r.vehicle_id ? ` (vehicle ${r.vehicle_id})` : '';
}
function campaignTag(r: SummaryContext): string {
  return r.campaign_id ? ` (campaign ${r.campaign_id})` : '';
}
function connectorTag(r: SummaryContext): string {
  return r.connector_id ? ` (connector ${r.connector_id})` : '';
}
function dealTag(r: SummaryContext): string {
  return r.deal_id ? ` (deal ${r.deal_id})` : '';
}

const SUMMARY_TEMPLATES: Record<ProofEventType, (r: SummaryContext) => string> = {
  lead_received: (r) =>
    `Recorded an inbound lead for ${r.customer_ref_redacted}${leadTag(r)}.`,
  consent_captured: (r) =>
    `Recorded a consent update for ${r.customer_ref_redacted} on basis '${r.consent_basis}'.`,
  customer_created: (r) =>
    `Created a customer record for ${r.customer_ref_redacted}.`,
  duplicate_detected: (r) =>
    `Flagged a possible duplicate record for ${r.customer_ref_redacted}; held for human merge review.`,
  vehicle_matched: (r) =>
    `Matched inventory${vehicleTag(r)} to the stated needs of ${r.customer_ref_redacted}.`,
  inventory_context_used: (r) =>
    `Used inventory context${vehicleTag(r)} while preparing a response for ${r.customer_ref_redacted}.`,
  equity_score_generated: (r) =>
    `Generated an internal equity opportunity score for ${r.customer_ref_redacted}; human review required before any outreach.`,
  ai_reply_drafted: (r) =>
    `Drafted an AI-assisted reply for ${r.customer_ref_redacted}${leadTag(r)}; the draft was held for human approval and was not sent.`,
  human_approval_requested: (r) =>
    `Requested human approval before acting on '${r.action_requested}' for ${r.customer_ref_redacted}.`,
  human_approval_granted: (r) =>
    `Recorded that a named human approver granted approval for '${r.action_requested}' for ${r.customer_ref_redacted}.`,
  appointment_drafted: (r) =>
    `Drafted an appointment proposal for ${r.customer_ref_redacted}${leadTag(r)}; human confirmation required before outbound contact.`,
  appointment_confirmed: (r) =>
    `Recorded an appointment confirmation for ${r.customer_ref_redacted}${leadTag(r)}.`,
  test_drive_completed: (r) =>
    `Recorded a completed test drive for ${r.customer_ref_redacted}${vehicleTag(r)}.`,
  followup_sent: (r) =>
    `Sent a human-approved follow-up message to ${r.customer_ref_redacted}${leadTag(r)}.`,
  crm_updated: (r) =>
    `Updated a CRM record linked to ${r.customer_ref_redacted}.`,
  sold_marked: (r) =>
    `Marked a deal as sold for ${r.customer_ref_redacted}${dealTag(r)}.`,
  lost_reason_recorded: (r) =>
    `Recorded a lost reason for the lead linked to ${r.customer_ref_redacted}${leadTag(r)}.`,
  review_requested: (r) =>
    `Sent a human-approved review request to ${r.customer_ref_redacted}.`,
  campaign_generated: (r) =>
    `Generated a campaign draft${campaignTag(r)}; human approval required before activation.`,
  campaign_attributed: (r) =>
    `Recorded an attribution link between${campaignTag(r) || ' a campaign'} and an outcome for ${r.customer_ref_redacted}.`,
  connector_sync_completed: (r) =>
    `Completed a connector sync${connectorTag(r)} in the configured mode.`,
  connector_sync_failed: (r) =>
    `Recorded a failed connector sync${connectorTag(r)}; no external writes were confirmed for this run.`,
};

export function buildClaimSafeSummary(context: SummaryContext): string {
  return SUMMARY_TEMPLATES[context.event_type](context);
}

// ---------------------------------------------------------------------------
// In-memory hash-chained ledger
// ---------------------------------------------------------------------------

export class InMemoryProofEmitter implements ProofEmitter {
  /** Public for reference-scaffold tests (tamper simulation). Append-only in spirit. */
  readonly ledger: ProofReceipt[] = [];

  emit(input: ProofReceiptInput, timestamp: IsoTimestamp): ProofReceipt {
    this.assertInvariants(input);

    const receipt_id = ('rcpt_' + String(this.ledger.length + 1).padStart(6, '0')) as ReceiptId;
    const context: SummaryContext = { ...input, receipt_id, timestamp };
    const claim_safe_summary = buildClaimSafeSummary(context);

    const previous = this.ledger[this.ledger.length - 1];
    const prev_receipt_hash = previous ? computeReceiptHash(previous) : GENESIS_HASH;

    const unhashed: ProofReceipt = {
      ...input,
      receipt_id,
      timestamp,
      claim_safe_summary,
      payload_hash: '',
      prev_receipt_hash,
    };
    const receipt: ProofReceipt = { ...unhashed, payload_hash: computePayloadHash(unhashed) };

    this.ledger.push(receipt);
    return receipt;
  }

  /** Recomputes every payload hash and every chain link from genesis forward. */
  verifyChain(): ChainVerificationResult {
    for (let i = 0; i < this.ledger.length; i++) {
      const receipt = this.ledger[i];
      const expectedPayloadHash = computePayloadHash(receipt);
      if (receipt.payload_hash !== expectedPayloadHash) {
        return { valid: false, failedAtIndex: i, reason: 'payload_hash mismatch (receipt body altered)' };
      }
      const expectedPrev = i === 0 ? GENESIS_HASH : computeReceiptHash(this.ledger[i - 1]);
      if (receipt.prev_receipt_hash !== expectedPrev) {
        return { valid: false, failedAtIndex: i, reason: 'prev_receipt_hash mismatch (chain link broken)' };
      }
    }
    return { valid: true };
  }

  getLedger(): ProofReceipt[] {
    return this.ledger;
  }

  /** Mock-mode policy invariants — deterministic guards, no I/O. */
  private assertInvariants(input: ProofReceiptInput): void {
    if (!input.customer_ref_redacted.startsWith('cust_')) {
      throw new Error(
        'customer_ref_redacted must come from redactCustomerRef() (or NO_CUSTOMER_REF); raw ids are not accepted',
      );
    }
    if (input.external_side_effect && input.policy_gate_result.result === 'deny') {
      throw new Error('cannot record an external side effect on a denied policy gate');
    }
    if (input.external_side_effect && input.actor_type === 'agent' && !input.human_approver_id) {
      throw new Error('agent-caused external side effects require a named human_approver_id');
    }
  }
}
