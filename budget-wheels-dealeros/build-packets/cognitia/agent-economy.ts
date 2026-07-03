/**
 * BUDGET WHEELS DEALEROS — cognitia/agent-economy (BUILD PACKET, V1)
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only. Module 15: Agent economy skeleton.
 *
 * INTERNAL PRIMITIVES ONLY. This file deliberately contains no monetary,
 * token, or crypto concepts and no public-marketplace concepts. A "work
 * credit candidate" is nothing more than an internal, reviewable claim that
 * an agent performed a defined unit of work, always backed by a proof
 * receipt and always subject to human review and dispute.
 */

import type {
  AgentActionId,
  AgentPassportId,
  Brand,
  IsoTimestamp,
  ReceiptId,
  TenantId,
  UserId,
} from '../schemas/core';

// SCHEMA_NOTE: core.ts has no ID types for work-credit candidates, reputation
// events, dispute events, or human review events. Defined locally with the
// shared Brand helper; candidates for promotion into schemas/core.ts later.
export type WorkCreditCandidateId = Brand<'WorkCreditCandidateId'>;
export type ReputationEventId = Brand<'ReputationEventId'>;
export type DisputeEventId = Brand<'DisputeEventId'>;
export type HumanReviewEventId = Brand<'HumanReviewEventId'>;

// ---------------------------------------------------------------------------
// Agent identity
// ---------------------------------------------------------------------------

/**
 * An agent passport is the identity record every AI agent must hold before
 * any of its actions can be receipted or counted as work.
 */
export interface AgentPassport {
  agent_passport_id: AgentPassportId;
  tenant_id: TenantId;
  agent_kind: 'bdc' | 'equity' | 'listing' | 'campaign' | 'router';
  display_name: string;
  /** Reference into the connector registry (e.g. "model_provider:anthropic_mock") — never a key. */
  model_provider_ref: string;
  /** Prompt/version registry key so every action is traceable to an exact prompt version. */
  prompt_registry_key: string;
  status: 'active' | 'suspended' | 'retired';
  created_at: IsoTimestamp;
}

// ---------------------------------------------------------------------------
// Work events + agent actions
// ---------------------------------------------------------------------------

export type WorkEventKind =
  | 'lead_answered'
  | 'lead_qualified'
  | 'vehicle_matched'
  | 'appointment_drafted'
  | 'appointment_confirmed'
  | 'followup_completed'
  | 'equity_opportunity_created'
  | 'service_to_sales_opportunity_created'
  | 'listing_generated'
  | 'campaign_generated'
  | 'sold_attributed'
  | 'review_generated'
  | 'connector_sync_completed';

export const WORK_EVENT_KINDS: readonly WorkEventKind[] = [
  'lead_answered',
  'lead_qualified',
  'vehicle_matched',
  'appointment_drafted',
  'appointment_confirmed',
  'followup_completed',
  'equity_opportunity_created',
  'service_to_sales_opportunity_created',
  'listing_generated',
  'campaign_generated',
  'sold_attributed',
  'review_generated',
  'connector_sync_completed',
];

/** One receipted unit of agent work. Every action links to exactly one proof receipt. */
export interface AgentAction {
  agent_action_id: AgentActionId;
  agent_passport_id: AgentPassportId;
  tenant_id: TenantId;
  work_event: WorkEventKind;
  receipt_id: ReceiptId;
  human_review_state: 'not_required' | 'pending' | 'approved' | 'rejected';
  created_at: IsoTimestamp;
}

// ---------------------------------------------------------------------------
// Work credit candidates, reputation, disputes, human review
// ---------------------------------------------------------------------------

/**
 * Internal-only claim that an agent action may count as completed work.
 * It is a CANDIDATE until evidence review; nothing here is transferable,
 * redeemable, or visible outside the tenant.
 */
export interface WorkCreditCandidate {
  work_credit_candidate_id: WorkCreditCandidateId;
  tenant_id: TenantId;
  agent_passport_id: AgentPassportId;
  agent_action_id: AgentActionId;
  work_event: WorkEventKind;
  receipt_id: ReceiptId;
  /** Refs to the evidence records demanded by WORK_EVENT_DEFINITIONS[work_event]. */
  evidence_refs: string[];
  state: 'candidate' | 'validated' | 'rejected' | 'disputed';
  created_at: IsoTimestamp;
}

/** Standing signal about an agent, always tied back to receipts. */
export interface ReputationEvent {
  reputation_event_id: ReputationEventId;
  tenant_id: TenantId;
  agent_passport_id: AgentPassportId;
  kind: 'positive' | 'negative' | 'neutral';
  reason: string;
  related_receipt_id?: ReceiptId;
  created_at: IsoTimestamp;
}

/** A human contesting an agent action / work claim. */
export interface DisputeEvent {
  dispute_event_id: DisputeEventId;
  tenant_id: TenantId;
  agent_action_id: AgentActionId;
  opened_by: UserId;
  reason: string;
  state: 'open' | 'resolved_upheld' | 'resolved_overturned';
  opened_at: IsoTimestamp;
  resolved_at?: IsoTimestamp;
}

/** A named human reviewing an agent action that required approval. */
export interface HumanReviewEvent {
  human_review_event_id: HumanReviewEventId;
  tenant_id: TenantId;
  agent_action_id: AgentActionId;
  reviewer_user_id: UserId;
  decision: 'approved' | 'rejected';
  notes?: string;
  reviewed_at: IsoTimestamp;
}

// ---------------------------------------------------------------------------
// What counts as work — the governance table for all 13 work events
// ---------------------------------------------------------------------------

export interface WorkEventDefinition {
  /** Plain-language definition of the completed unit of work. */
  whatCountsAsWork: string;
  /** Evidence refs that MUST exist before a candidate can be validated. */
  evidenceRequired: string[];
  /** Always true: no receipt, no work. */
  proofReceiptRequired: true;
  /** True when the work involves (or claims) an external side effect or outcome. */
  humanApprovalRequired: boolean;
  /** Where and how a human contests the claim. */
  disputePath: string;
  /** How validation/rejection is expected to move reputation later (internal signal only). */
  reputationImpactNote: string;
}

const DISPUTE_PATH_PREFIX = 'cognitia://disputes/new?work_event=';

export const WORK_EVENT_DEFINITIONS: Record<WorkEventKind, WorkEventDefinition> = {
  lead_answered: {
    whatCountsAsWork:
      'A first response to an inbound lead was delivered to the customer within the SLA window, using an approved message.',
    evidenceRequired: [
      'proof_receipt:lead_received',
      'proof_receipt:followup_sent or human-logged first-contact record',
      'human_review_event:approved for the outbound message',
      'sla_state ref showing firstRespondedAt within firstResponseDueAt',
    ],
    proofReceiptRequired: true,
    humanApprovalRequired: true,
    disputePath: DISPUTE_PATH_PREFIX + 'lead_answered — manager opens dispute_event; reviewer compares receipt timestamps against the SLA record; resolved_upheld or resolved_overturned.',
    reputationImpactNote:
      'Validated on-time answers add positive standing; rejected claims (draft never sent, SLA missed) add negative standing.',
  },
  lead_qualified: {
    whatCountsAsWork:
      'A lead record was enriched to qualified: intent, budget range, desired vehicle, trade-in and financing flags were captured and stored.',
    evidenceRequired: [
      'proof_receipt:crm_updated for the qualification fields',
      'lead ref with stage=qualified and populated LeadQualification',
    ],
    proofReceiptRequired: true,
    humanApprovalRequired: false,
    disputePath: DISPUTE_PATH_PREFIX + 'lead_qualified — salesperson or manager disputes accuracy; reviewer checks stored qualification against the conversation refs.',
    reputationImpactNote:
      'Qualifications later found fabricated or copied from defaults add negative standing; accurate ones add small positive standing.',
  },
  vehicle_matched: {
    whatCountsAsWork:
      'In-stock inventory was matched to a stated customer need and the match was recorded on the lead.',
    evidenceRequired: [
      'proof_receipt:vehicle_matched',
      'lead ref listing interestVehicleIds',
      'inventory ref showing the vehicle was available at match time',
    ],
    proofReceiptRequired: true,
    humanApprovalRequired: false,
    disputePath: DISPUTE_PATH_PREFIX + 'vehicle_matched — dispute if the match ignored stated constraints (budget, body style); reviewer replays the match inputs.',
    reputationImpactNote:
      'Matches the customer engages with add positive standing; irrelevant matches add neutral-to-negative standing.',
  },
  appointment_drafted: {
    whatCountsAsWork:
      'An appointment or test-drive proposal was drafted with a concrete time, vehicle, and rooftop, and routed to a human for confirmation. Drafting alone never contacts the customer.',
    evidenceRequired: [
      'proof_receipt:appointment_drafted',
      'appointment ref with status=draft and draftedBy=agent',
    ],
    proofReceiptRequired: true,
    humanApprovalRequired: false,
    disputePath: DISPUTE_PATH_PREFIX + 'appointment_drafted — dispute if drafts are duplicative or unusable; reviewer samples draft quality against the lead context.',
    reputationImpactNote:
      'Drafts that humans confirm without edits add positive standing; drafts routinely discarded add negative standing.',
  },
  appointment_confirmed: {
    whatCountsAsWork:
      'The CUSTOMER confirmed a drafted appointment. The draft alone does not count — confirmation evidence from the customer side is mandatory.',
    evidenceRequired: [
      'proof_receipt:appointment_confirmed',
      'customer confirmation record ref (inbound reply, call log, or signed-in confirmation) — not the outbound draft',
      'human_review_event:approved for the outbound confirmation message',
      'appointment ref with status=confirmed and confirmedByUserId set',
    ],
    proofReceiptRequired: true,
    humanApprovalRequired: true,
    disputePath: DISPUTE_PATH_PREFIX + 'appointment_confirmed — dispute if no customer-side confirmation exists; reviewer requires the inbound confirmation ref, else overturns.',
    reputationImpactNote:
      'Confirmed appointments that are honored add strong positive standing; confirmations that no-show at high rates trigger review, and fabricated confirmations add strong negative standing.',
  },
  followup_completed: {
    whatCountsAsWork:
      'A scheduled follow-up touch was sent to the customer after human approval, on a consented channel, and logged against the follow-up plan.',
    evidenceRequired: [
      'proof_receipt:followup_sent',
      'human_review_event:approved for the message',
      'consent record ref valid for the channel at send time',
      'follow-up plan ref showing the cadence step',
    ],
    proofReceiptRequired: true,
    humanApprovalRequired: true,
    disputePath: DISPUTE_PATH_PREFIX + 'followup_completed — dispute if the touch was off-plan, off-consent, or duplicated; reviewer checks the consent and plan refs.',
    reputationImpactNote:
      'On-plan consented touches add positive standing; any touch on a revoked-consent channel adds strong negative standing and suspends the passport pending review.',
  },
  equity_opportunity_created: {
    whatCountsAsWork:
      'An equity opportunity score with reason codes, evidence factors, and a matched vehicle was generated for an owned-vehicle customer and queued for human action.',
    evidenceRequired: [
      'proof_receipt:equity_score_generated',
      'opportunity ref with factors[].evidence populated',
      'model/prompt registry version ref',
    ],
    proofReceiptRequired: true,
    humanApprovalRequired: false,
    disputePath: DISPUTE_PATH_PREFIX + 'equity_opportunity_created — dispute if reason codes are unsupported by the customer record; reviewer replays the scoring inputs.',
    reputationImpactNote:
      'Opportunities that lead to human-validated contact add positive standing; scores contradicted by the underlying data add negative standing.',
  },
  service_to_sales_opportunity_created: {
    whatCountsAsWork:
      'A service-drive customer was identified as a sales opportunity (e.g. aging vehicle plus declined repair) and a task was created for a human, with the reasoning recorded.',
    evidenceRequired: [
      'proof_receipt:equity_score_generated or crm_updated for the opportunity',
      'service history ref supporting the trigger',
      'work task ref assigned to a human',
    ],
    proofReceiptRequired: true,
    humanApprovalRequired: false,
    disputePath: DISPUTE_PATH_PREFIX + 'service_to_sales_opportunity_created — service advisor disputes mischaracterized service records; reviewer checks the cited history.',
    reputationImpactNote:
      'Opportunities advisors accept add positive standing; noisy or repeated low-quality triggers add negative standing.',
  },
  listing_generated: {
    whatCountsAsWork:
      'Listing copy (title, description, disclosure-aware content) for a specific vehicle was generated, passed the disclosure check, and was approved by a human before any publication.',
    evidenceRequired: [
      'proof_receipt:crm_updated or campaign_generated for the listing draft',
      'vehicle ref with disclosures included in the copy inputs',
      'human_review_event:approved before publish',
    ],
    proofReceiptRequired: true,
    humanApprovalRequired: true,
    disputePath: DISPUTE_PATH_PREFIX + 'listing_generated — dispute if copy omitted required disclosures or misstated the vehicle; reviewer compares copy to the vehicle record.',
    reputationImpactNote:
      'Approved-as-drafted listings add positive standing; copy with disclosure omissions adds strong negative standing.',
  },
  campaign_generated: {
    whatCountsAsWork:
      'A campaign draft (segment, channel, claim-safe copy, schedule) was produced and moved to pending_approval. Activation is a separate, human-approved step.',
    evidenceRequired: [
      'proof_receipt:campaign_generated',
      'campaign ref with status=pending_approval and createdBy recorded',
      'human_review_event:approved before status=active',
    ],
    proofReceiptRequired: true,
    humanApprovalRequired: true,
    disputePath: DISPUTE_PATH_PREFIX + 'campaign_generated — marketing disputes off-brand or non-claim-safe copy; reviewer checks the copy against the claim-safe rules.',
    reputationImpactNote:
      'Campaigns approved and activated add positive standing; drafts rejected for claim-safety violations add strong negative standing.',
  },
  sold_attributed: {
    whatCountsAsWork:
      'A sold deal was linked to the agent-assisted touches that contributed to it, and a human manager confirmed the attribution record.',
    evidenceRequired: [
      'proof_receipt:sold_marked',
      'proof_receipt:campaign_attributed or deal attribution ref with aiAssisted flag',
      'human_review_event:approved by a manager for the attribution',
      'touch-chain refs (receipts for each contributing agent touch)',
    ],
    proofReceiptRequired: true,
    humanApprovalRequired: true,
    disputePath: DISPUTE_PATH_PREFIX + 'sold_attributed — salesperson or manager disputes over-attribution; reviewer walks the receipt chain of touches and may overturn.',
    reputationImpactNote:
      'Manager-confirmed attributions add strong positive standing; overturned attribution claims add strong negative standing.',
  },
  review_generated: {
    whatCountsAsWork:
      'A review request was drafted for a delivered customer, approved by a human, and sent on a consented channel.',
    evidenceRequired: [
      'proof_receipt:review_requested',
      'human_review_event:approved for the request message',
      'consent record ref valid for the channel',
      'deal ref with status delivered',
    ],
    proofReceiptRequired: true,
    humanApprovalRequired: true,
    disputePath: DISPUTE_PATH_PREFIX + 'review_generated — dispute if the request went to a non-delivered or opted-out customer; reviewer checks the deal and consent refs.',
    reputationImpactNote:
      'Requests to eligible, consented customers add positive standing; requests that draw complaints add negative standing. Review CONTENT is never authored by agents.',
  },
  connector_sync_completed: {
    whatCountsAsWork:
      'A scheduled or requested connector sync ran to completion in its configured mode (mock by default) with record counts and no unreconciled errors.',
    evidenceRequired: [
      'proof_receipt:connector_sync_completed',
      'sync run ref with record counts and mode (mock/sandbox/live)',
      'zero unresolved connector_sync_failed receipts for the same run',
    ],
    proofReceiptRequired: true,
    humanApprovalRequired: false,
    disputePath: DISPUTE_PATH_PREFIX + 'connector_sync_completed — ops disputes silent data loss; reviewer compares source and destination counts from the run ref.',
    reputationImpactNote:
      'Clean runs add small positive standing; runs later found to have dropped records add negative standing for the routing agent.',
  },
};
