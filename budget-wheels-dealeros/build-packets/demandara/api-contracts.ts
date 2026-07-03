/**
 * BUDGET WHEELS DEALEROS — demandara/api-contracts (BUILD PACKET, V1)
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only. Module 10: Demandara connector/harness.
 *
 * Request/response contracts for the 9 Demandara adapter endpoints:
 *
 *   1. POST /api/demandara/leads                — push a lead into DealerOS
 *   2. GET  /api/demandara/context/:leadId      — REDACTED context pack for AI use
 *   3. POST /api/demandara/reply-drafts         — register an AI reply draft (never auto-sent)
 *   4. POST /api/demandara/appointment-drafts   — draft an appointment (human confirm required)
 *   5. POST /api/demandara/followups            — create/update a follow-up plan
 *   6. POST /api/demandara/campaigns            — register a campaign
 *   7. GET  /api/demandara/outcomes             — per-lead outcome rows since a timestamp
 *   8. GET  /api/demandara/revenue-attribution  — per-campaign closed-loop attribution
 *   9. GET  /api/demandara/proof-report         — claim-safe monthly proof report
 *
 * Governance rules encoded in these types:
 * - Every request carries `tenantId`; every mutating request carries an
 *   `idempotencyKey` (safe retries, no double records).
 * - Every AI/outbound draft response carries `requiresHumanApproval: true`.
 *   Nothing in this API can cause an outbound send by itself.
 * - The context endpoint returns a REDACTED view only: no names, no emails,
 *   no phone numbers, no raw customer ids. Raw PII stays inside DealerOS.
 */

import type {
  Appointment,
  AppointmentId,
  Brand,
  Campaign,
  CampaignId,
  ConsentChannel,
  ConsentRecord,
  CustomerId,
  DealId,
  DealerId,
  FollowUpPlan,
  IsoTimestamp,
  LeadId,
  LeadQualification,
  LeadStage,
  LostReason,
  Money,
  ReceiptId,
  RooftopId,
  TenantId,
  TrafficEventId,
  TrafficSourceKind,
  VehicleId,
  VehicleStatus,
} from '../schemas/core';

// SCHEMA_NOTE: core.ts has no reply-draft entity (NextBestAction.draftText is
// the closest primitive), so the draft id + entity are defined in this packet.
export type ReplyDraftId = Brand<'ReplyDraftId'>;

// ---------------------------------------------------------------------------
// Shared request bases
// ---------------------------------------------------------------------------

/** Every Demandara request is tenant-scoped. */
export interface DemandaraRequestBase {
  tenantId: TenantId;
}

/** Every mutating Demandara request is idempotent under `idempotencyKey`. */
export interface DemandaraMutationBase extends DemandaraRequestBase {
  idempotencyKey: string;
}

// ---------------------------------------------------------------------------
// 1. POST /api/demandara/leads
// ---------------------------------------------------------------------------

/**
 * POST /api/demandara/leads
 * Demandara pushes a booked/captured lead into DealerOS. DealerOS performs
 * duplicate detection, creates Customer + TrafficEvent + Lead, records the
 * consent evidence, and emits proof receipts (lead_received, consent_captured,
 * customer_created, duplicate_detected when applicable).
 */
export interface LeadIntakeRequest extends DemandaraMutationBase {
  dealerId: DealerId;
  rooftopId: RooftopId;
  source: TrafficSourceKind;
  /** e.g. "demandara_campaign", "autotrader_ca", "facebook_marketplace". */
  sourceDetail?: string;
  utm?: { source?: string; medium?: string; campaign?: string; term?: string; content?: string };
  campaignId?: CampaignId;
  /** PII — accepted inbound only; NEVER echoed back through the context endpoint. */
  contact: { firstName: string; lastName: string; email?: string; phone?: string };
  /** CASL-aware consent evidence captured at the point of lead submission. */
  consent: {
    channel: ConsentChannel;
    basis: ConsentRecord['basis'];
    capturedAt: IsoTimestamp;
    source: string; // e.g. "website_form:test_drive"
  };
  interest: { vehicleId?: VehicleId; freeText?: string };
  occurredAt: IsoTimestamp;
}

export interface LeadIntakeResponse {
  leadId: LeadId;
  customerId: CustomerId;
  trafficEventId: TrafficEventId;
  /** The lead_received proof receipt. */
  receiptId: ReceiptId;
  /** Set when the inbound contact matched an existing customer (same email or phone). */
  duplicateOfCustomerId?: CustomerId;
}

// ---------------------------------------------------------------------------
// 2. GET /api/demandara/context/:leadId
// ---------------------------------------------------------------------------

/** GET /api/demandara/context/:leadId — path param modeled as a field. */
export interface LeadContextRequest extends DemandaraRequestBase {
  leadId: LeadId;
}

/** Only consent states an external AI caller ever needs; 'unknown' is omitted. */
export type RedactedConsentStatus = 'granted' | 'implied' | 'revoked';

export interface RedactedVehicleInterest {
  vehicleId: VehicleId;
  year: number;
  make: string;
  model: string;
  askingPrice: Money;
  status: VehicleStatus;
}

/** PII-free activity line: system-generated summaries only, never free text. */
export interface RedactedActivityEntry {
  at: IsoTimestamp;
  kind: string; // e.g. "lead_received", "ai_reply_drafted"
  summary: string;
}

/**
 * GET /api/demandara/context/:leadId
 *
 * This is the AI-FACING view of a lead. Raw PII stays inside DealerOS:
 * no name, no email, no phone, no raw customer id, no customer-authored free
 * text ever appears here. `customerRefRedacted` is a one-way hash reference
 * ("cust_..."), the same redacted ref used on proof receipts, so AI output
 * and receipts can be correlated without exposing identity.
 */
export interface LeadContextResponse {
  leadId: LeadId;
  /** One-way redacted customer reference — never a name/email/phone/raw id. */
  customerRefRedacted: string;
  stage: LeadStage;
  /** Qualification snapshot; trade-in VIN is stripped before leaving DealerOS. */
  qualification: LeadQualification;
  interestVehicles: RedactedVehicleInterest[];
  recentActivity: RedactedActivityEntry[];
  /** Per-channel consent state so drafting respects opt-outs by construction. */
  consentSummary: Partial<Record<ConsentChannel, RedactedConsentStatus>>;
  dealerDisplayName: string;
}

// ---------------------------------------------------------------------------
// 3. POST /api/demandara/reply-drafts
// ---------------------------------------------------------------------------

/**
 * POST /api/demandara/reply-drafts
 * Registers an AI-proposed reply for a lead. Drafts are NEVER auto-sent:
 * they enter DealerOS as 'pending_human_approval' work items, and any actual
 * send happens later inside DealerOS behind its own approval + consent gates.
 */
export interface ReplyDraftRequest extends DemandaraMutationBase {
  leadId: LeadId;
  channel: ConsentChannel;
  /** Claim-safe one-line intent, e.g. "answer availability question". */
  intentSummary: string;
  proposedText: string;
}

export interface ReplyDraftResponse {
  draftId: ReplyDraftId;
  status: 'pending_human_approval';
  requiresHumanApproval: true;
  /** The ai_reply_drafted proof receipt. */
  receiptId: ReceiptId;
}

// ---------------------------------------------------------------------------
// 4. POST /api/demandara/appointment-drafts
// ---------------------------------------------------------------------------

/**
 * POST /api/demandara/appointment-drafts
 * Creates a core Appointment with status 'draft' and draftedBy 'agent'.
 * A named human must confirm before any outbound contact happens.
 */
export interface AppointmentDraftRequest extends DemandaraMutationBase {
  leadId: LeadId;
  kind: Appointment['kind'];
  scheduledFor: IsoTimestamp;
  vehicleId?: VehicleId;
}

export interface AppointmentDraftResponse {
  appointmentId: AppointmentId;
  status: 'draft';
  draftedBy: 'agent';
  requiresHumanApproval: true;
  /** The appointment_drafted proof receipt. */
  receiptId: ReceiptId;
}

// ---------------------------------------------------------------------------
// 5. POST /api/demandara/followups
// ---------------------------------------------------------------------------

/**
 * POST /api/demandara/followups
 * Creates or replaces the follow-up plan for a lead. If any cadence channel
 * has revoked consent (opt-out), the plan is stored PAUSED with
 * pausedReason 'opt_out' and no next touch is scheduled.
 */
export interface FollowUpUpsertRequest extends DemandaraMutationBase {
  leadId: LeadId;
  cadence: FollowUpPlan['cadence'];
}

export interface FollowUpUpsertResponse {
  leadId: LeadId;
  planStatus: 'active' | 'paused';
  pausedReason?: FollowUpPlan['pausedReason'];
  nextTouchAt?: IsoTimestamp;
  /** The crm_updated proof receipt. */
  receiptId: ReceiptId;
}

// ---------------------------------------------------------------------------
// 6. POST /api/demandara/campaigns
// ---------------------------------------------------------------------------

/**
 * POST /api/demandara/campaigns
 * Registers a campaign in DealerOS. Campaigns created by 'demandara' are
 * stored as 'pending_approval' — a human activates them; agent-created
 * campaigns never go live on their own.
 */
export interface CampaignRegisterRequest extends DemandaraMutationBase {
  dealerId: DealerId;
  name: string;
  channel: Campaign['channel'];
  createdBy: Campaign['createdBy'];
  targetSegment?: Campaign['targetSegment'];
  utmCampaign?: string;
  startAt?: IsoTimestamp;
  endAt?: IsoTimestamp;
}

export interface CampaignRegisterResponse {
  campaignId: CampaignId;
  /** 'pending_approval' when createdBy === 'demandara'; 'draft' otherwise. */
  status: Campaign['status'];
  /** The campaign_generated proof receipt. */
  receiptId: ReceiptId;
}

// ---------------------------------------------------------------------------
// 7. GET /api/demandara/outcomes
// ---------------------------------------------------------------------------

/** GET /api/demandara/outcomes?since=<iso> */
export interface OutcomesRequest extends DemandaraRequestBase {
  /** Return rows for leads updated at or after this timestamp. */
  since: IsoTimestamp;
}

export interface LeadOutcomeRow {
  leadId: LeadId;
  campaignId?: CampaignId;
  stage: LeadStage;
  appointmentStates: Appointment['status'][];
  sold: boolean;
  soldDealId?: DealId;
  lost: boolean;
  lostReason?: LostReason;
  /** Number of proof receipts attached to this lead's journey. */
  receiptsCount: number;
  updatedAt: IsoTimestamp;
}

export interface OutcomesResponse {
  since: IsoTimestamp;
  rows: LeadOutcomeRow[];
}

// ---------------------------------------------------------------------------
// 8. GET /api/demandara/revenue-attribution
// ---------------------------------------------------------------------------

/** GET /api/demandara/revenue-attribution?since=<iso> */
export interface RevenueAttributionRequest extends DemandaraRequestBase {
  /** Optional: only count leads created at or after this timestamp. */
  since?: IsoTimestamp;
}

/**
 * Per-campaign closed-loop row. `sold`, `gross`, and `aiAssistedCount` are
 * computed from Deal.attribution (first/last touch campaign references).
 */
export interface CampaignAttributionRow {
  campaignId: CampaignId;
  campaignName: string;
  leads: number;
  appointments: number;
  /** Appointments recorded as completed (shows). */
  shows: number;
  sold: number;
  gross: Money;
  /** Sold deals where Deal.attribution.aiAssisted is true. */
  aiAssistedCount: number;
}

export interface RevenueAttributionResponse {
  rows: CampaignAttributionRow[];
}

// ---------------------------------------------------------------------------
// 9. GET /api/demandara/proof-report
// ---------------------------------------------------------------------------

/**
 * Fixed disclaimer attached to every proof report. Reports are built from
 * internal, unaudited operational counts and must never be published as-is.
 */
export const PROOF_REPORT_DISCLAIMER =
  'INTERNAL DRAFT — figures are internal, unaudited operational counts from a reference scaffold. They are not audited results, not a performance guarantee, and not authorized for public claims. Human review and approval are required before sharing outside the dealership.';

/** GET /api/demandara/proof-report?periodStart=<iso>&periodEnd=<iso> */
export interface ProofReportRequest extends DemandaraRequestBase {
  periodStart: IsoTimestamp;
  periodEnd: IsoTimestamp;
  /** Optional display label, e.g. "2026-07"; derived from periodStart if omitted. */
  label?: string;
}

export interface ProofReportCampaignRow {
  campaignId: CampaignId;
  campaignName: string;
  leadsReceived: number;
  appointmentsConfirmed: number;
  sold: number;
  gross: Money;
}

/**
 * GET /api/demandara/proof-report
 * Claim-safe monthly report: every number is backed by the proof receipts
 * listed in `receiptIds`, and the fixed disclaimer travels with the struct.
 */
export interface ProofReportResponse {
  period: { start: IsoTimestamp; end: IsoTimestamp; label: string };
  totals: {
    leadsReceived: number;
    aiDraftsCreated: number;
    humanApprovedDrafts: number;
    appointmentsConfirmed: number;
    sold: number;
  };
  perCampaign: ProofReportCampaignRow[];
  /** Proof receipts emitted inside the period — the evidence behind the totals. */
  receiptIds: ReceiptId[];
  disclaimer: typeof PROOF_REPORT_DISCLAIMER;
  /** The report itself is an outbound-facing artifact: human review before sharing. */
  requiresHumanApproval: true;
}
