/**
 * BUDGET WHEELS DEALEROS — demandara/service (BUILD PACKET, V1)
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only. Module 10: Demandara connector/harness.
 *
 * In-memory implementation of the 9 Demandara adapter operations over
 * core-typed entities, plus the DealerOS-side hooks (human approval, outcome
 * recording) that feed the outcome/attribution/proof endpoints.
 *
 * Determinism rules honored here:
 * - Every mutating method takes an explicit `now: IsoTimestamp`; there is no
 *   Date.now() anywhere in the logic.
 * - Ids come from an injected counter seed (constructor), never Math.random.
 * - Same idempotencyKey twice returns the SAME response and creates no
 *   duplicate records.
 *
 * Governance rules honored here:
 * - This adapter NEVER performs outbound sends: every proof emit carries
 *   `externalSideEffect: false` (hard-typed).
 * - AI reply drafts and appointment drafts are always pending human approval.
 * - The AI context pack is redacted by construction (see getContext).
 * - Claim-unsafe draft text (guarantees etc.) is rejected at intake.
 */

import { createHash } from 'node:crypto';
import type {
  Appointment,
  AppointmentId,
  Campaign,
  CampaignId,
  ConsentChannel,
  ConsentRecord,
  Customer,
  CustomerId,
  Deal,
  DealId,
  DealerId,
  FollowUpPlan,
  IsoTimestamp,
  Lead,
  LeadId,
  LeadQualification,
  LostReason,
  Money,
  ReceiptId,
  RooftopId,
  TenantId,
  TrafficEvent,
  TrafficEventId,
  UserId,
  Vehicle,
  VehicleId,
} from '../schemas/core';
import type {
  AppointmentDraftRequest,
  AppointmentDraftResponse,
  CampaignAttributionRow,
  CampaignRegisterRequest,
  CampaignRegisterResponse,
  FollowUpUpsertRequest,
  FollowUpUpsertResponse,
  LeadContextRequest,
  LeadContextResponse,
  LeadIntakeRequest,
  LeadIntakeResponse,
  LeadOutcomeRow,
  OutcomesRequest,
  OutcomesResponse,
  ProofReportCampaignRow,
  ProofReportRequest,
  ProofReportResponse,
  RedactedActivityEntry,
  RedactedConsentStatus,
  RedactedVehicleInterest,
  ReplyDraftId,
  ReplyDraftRequest,
  ReplyDraftResponse,
  RevenueAttributionRequest,
  RevenueAttributionResponse,
} from './api-contracts';
import { PROOF_REPORT_DISCLAIMER } from './api-contracts';

// ---------------------------------------------------------------------------
// Proof emitter port (narrow structural port — packet stays independent)
// ---------------------------------------------------------------------------

// SCHEMA_NOTE: this port deliberately does NOT import from ../cognitia; build
// packets stay independent. The real wiring adapts the cognitia packet's
// InMemoryProofEmitter (cognitia/receipts.ts) behind this interface with a
// one-line field mapping (camelCase port -> snake_case ledger wire format,
// receipt_id -> receiptId). The event names below are a subset of the
// Module-11 ProofEventType vocabulary defined in cognitia/receipts.ts.
export type DemandaraProofEventType =
  | 'lead_received'
  | 'consent_captured'
  | 'customer_created'
  | 'duplicate_detected'
  | 'inventory_context_used'
  | 'ai_reply_drafted'
  | 'appointment_drafted'
  | 'human_approval_granted'
  | 'appointment_confirmed'
  | 'crm_updated'
  | 'sold_marked'
  | 'lost_reason_recorded'
  | 'campaign_generated';

export interface ProofEmitInput {
  tenantId: TenantId;
  dealerId: DealerId;
  rooftopId: RooftopId;
  actorType: 'human' | 'agent' | 'system' | 'connector';
  actorId: string;
  eventType: DemandaraProofEventType;
  /** Always a redacted ref ("cust_...") — never a raw id/name/email/phone. */
  customerRefRedacted: string;
  actionRequested: string;
  actionTaken: string;
  consentBasis: ConsentRecord['basis'];
  leadId?: LeadId;
  vehicleId?: VehicleId;
  dealId?: DealId;
  campaignId?: CampaignId;
  /** Hard-typed false: this adapter drafts and records; it never sends. */
  externalSideEffect: false;
}

export interface ProofEmitterPort {
  emit(input: ProofEmitInput, timestamp: IsoTimestamp): { receiptId: string };
}

// ---------------------------------------------------------------------------
// Local entities + helpers
// ---------------------------------------------------------------------------

// SCHEMA_NOTE: core.ts has no reply-draft entity; defined locally (the id
// type lives in ./api-contracts). Candidate for promotion into core.ts.
export interface ReplyDraft {
  draftId: ReplyDraftId;
  tenantId: TenantId;
  dealerId: DealerId;
  leadId: LeadId;
  channel: ConsentChannel;
  intentSummary: string;
  proposedText: string;
  status: 'pending_human_approval' | 'approved' | 'rejected';
  requiresHumanApproval: true;
  createdAt: IsoTimestamp;
  approvedByUserId?: UserId;
  approvalReceiptId?: ReceiptId;
}

/** DealerOS-side outcome input for recordOutcome (not one of the 9 endpoints). */
export type LeadOutcomeInput =
  | { result: 'sold'; vehicleId: VehicleId; salePrice: Money }
  | { result: 'lost'; lostReason: LostReason };

/** Sentinel used when a receipt has no customer in scope (e.g. campaigns). */
export const NO_CUSTOMER_REF = 'cust_none';

/** Fixed actor id for receipts emitted on behalf of the Demandara agent. */
export const DEMANDARA_ACTOR_ID = 'agent:demandara_adapter_v1';

// SCHEMA_NOTE: mirrors cognitia/receipts.ts redactCustomerRef (duplicated to
// keep packets independent): 'cust_' + first 10 hex chars of sha256(id).
export function redactCustomerRef(customerId: CustomerId | string): string {
  return 'cust_' + createHash('sha256').update(String(customerId), 'utf8').digest('hex').slice(0, 10);
}

function isoAddMinutes(iso: IsoTimestamp, minutes: number): IsoTimestamp {
  return new Date(Date.parse(iso) + minutes * 60_000).toISOString().replace('.000Z', 'Z');
}

function isoAddDays(iso: IsoTimestamp, days: number): IsoTimestamp {
  return isoAddMinutes(iso, days * 24 * 60);
}

function isoGte(a: IsoTimestamp, b: IsoTimestamp): boolean {
  return Date.parse(a) >= Date.parse(b);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Deterministic claim-safety guard for draft text. The full linter lives in
 * the website packet; this minimal deny-list keeps obviously claim-unsafe
 * language (guarantees, certainty claims) out of the draft store entirely.
 */
const CLAIM_UNSAFE_PHRASES = ['guarantee', 'production ready', 'no risk', '100%', 'certified'] as const;

function assertClaimSafeDraftText(text: string): void {
  const lowered = text.toLowerCase();
  for (const phrase of CLAIM_UNSAFE_PHRASES) {
    if (lowered.includes(phrase)) {
      throw new Error(`claim-unsafe draft text rejected: contains "${phrase}"`);
    }
  }
}

interface ReceiptLogEntry {
  receiptId: ReceiptId;
  eventType: DemandaraProofEventType;
  at: IsoTimestamp;
  leadId?: LeadId;
  campaignId?: CampaignId;
}

export interface DemandaraAdapterConfig {
  tenantId: TenantId;
  dealerId: DealerId;
  rooftopId: RooftopId;
  /** Public-facing dealer name — the ONLY display string in the context pack. */
  dealerDisplayName: string;
  defaultCurrency?: 'CAD' | 'USD';
  /** Starting value for the deterministic id counter (default 1). */
  idSeed?: number;
}

// ---------------------------------------------------------------------------
// In-memory adapter
// ---------------------------------------------------------------------------

export class InMemoryDemandaraAdapter {
  // Stores are public readonly for reference-scaffold tests; treat as read-only.
  readonly customers = new Map<CustomerId, Customer>();
  readonly leads = new Map<LeadId, Lead>();
  readonly trafficEvents = new Map<TrafficEventId, TrafficEvent>();
  readonly appointments = new Map<AppointmentId, Appointment>();
  readonly deals = new Map<DealId, Deal>();
  readonly campaigns = new Map<CampaignId, Campaign>();
  readonly vehicles = new Map<VehicleId, Vehicle>();
  readonly replyDrafts = new Map<ReplyDraftId, ReplyDraft>();

  /** Normalized "email:<addr>" / "phone:<digits>" -> customer, for dedup. */
  private readonly contactIndex = new Map<string, CustomerId>();
  /** PII-free, system-generated activity lines per lead (context pack source). */
  private readonly activityByLead = new Map<LeadId, RedactedActivityEntry[]>();
  /** "op|idempotencyKey" -> stored response (safe retries, no double records). */
  private readonly idempotencyCache = new Map<string, unknown>();
  /** Local index of every receipt emitted through the port (proof report source). */
  private readonly receiptLog: ReceiptLogEntry[] = [];

  private idCounter: number;

  constructor(
    private readonly proof: ProofEmitterPort,
    private readonly config: DemandaraAdapterConfig,
  ) {
    this.idCounter = config.idSeed ?? 1;
  }

  /** Seed inventory so context packs can resolve vehicle interest. Mock-only. */
  seedVehicles(vehicles: Vehicle[]): void {
    for (const vehicle of vehicles) this.vehicles.set(vehicle.vehicleId, vehicle);
  }

  // -------------------------------------------------------------------------
  // 1. POST /api/demandara/leads
  // -------------------------------------------------------------------------

  intakeLead(req: LeadIntakeRequest, now: IsoTimestamp): LeadIntakeResponse {
    this.assertTenant(req.tenantId);
    return this.idempotent<LeadIntakeResponse>('intakeLead', req.idempotencyKey, () => {
      // --- duplicate detection: same normalized email or phone → same customer
      const emailKey = req.contact.email ? 'email:' + normalizeEmail(req.contact.email) : undefined;
      const phoneKey = req.contact.phone ? 'phone:' + normalizePhone(req.contact.phone) : undefined;
      let existingCustomerId: CustomerId | undefined;
      let matchedKey: string | undefined;
      if (emailKey !== undefined && this.contactIndex.has(emailKey)) {
        existingCustomerId = this.contactIndex.get(emailKey);
        matchedKey = emailKey;
      } else if (phoneKey !== undefined && this.contactIndex.has(phoneKey)) {
        existingCustomerId = this.contactIndex.get(phoneKey);
        matchedKey = phoneKey;
      }

      const isDuplicate = existingCustomerId !== undefined;
      const customer = isDuplicate
        ? this.mustGetCustomer(existingCustomerId as CustomerId)
        : this.createCustomer(req, now);
      if (isDuplicate) {
        // Link to the existing customer; a human reviews the merge later.
        customer.duplicateClusterKey =
          'dupc_' + createHash('sha256').update(matchedKey as string, 'utf8').digest('hex').slice(0, 10);
        customer.segment = 'active_lead';
        customer.updatedAt = now;
        this.mergeContactMethods(customer, req);
      }
      // Register/refresh contact index keys for future dedup.
      if (emailKey !== undefined) this.contactIndex.set(emailKey, customer.customerId);
      if (phoneKey !== undefined) this.contactIndex.set(phoneKey, customer.customerId);

      // --- consent evidence (upserted per channel)
      const consentRecord: ConsentRecord = {
        channel: req.consent.channel,
        status: req.consent.basis === 'express' ? 'granted' : req.consent.basis === 'none' ? 'unknown' : 'implied',
        basis: req.consent.basis,
        capturedAt: req.consent.capturedAt,
        source: req.consent.source,
      };
      this.upsertConsent(customer, consentRecord);

      // --- traffic event + lead
      const trafficEventId: TrafficEventId = this.nextId('te');
      const leadId: LeadId = this.nextId('lead');
      const trafficEvent: TrafficEvent = {
        trafficEventId,
        tenantId: this.config.tenantId,
        dealerId: req.dealerId,
        rooftopId: req.rooftopId,
        occurredAt: req.occurredAt,
        source: req.source,
        sourceDetail: req.sourceDetail,
        campaignId: req.campaignId,
        utm: req.utm,
        customerId: customer.customerId,
        leadId,
        vehicleId: req.interest.vehicleId,
        // Scaffold SLA: flat 15-minute first-response window. The per-source
        // due-at math (after-hours rollover etc.) lives in the traffic-desk packet.
        sla: { firstResponseDueAt: isoAddMinutes(req.occurredAt, 15), breached: false },
        // PII possible in free text — kept inside DealerOS, NEVER exposed via getContext.
        notes: req.interest.freeText,
      };
      this.trafficEvents.set(trafficEventId, trafficEvent);

      const qualification: LeadQualification = { intent: 'unknown' };
      const lead: Lead = {
        leadId,
        tenantId: this.config.tenantId,
        dealerId: req.dealerId,
        rooftopId: req.rooftopId,
        customerId: customer.customerId,
        stage: 'new',
        stageChangedAt: now,
        sourceTrafficEventId: trafficEventId,
        qualification,
        interestVehicleIds: req.interest.vehicleId ? [req.interest.vehicleId] : [],
        appointmentIds: [],
        objections: [],
        aiAssistedAppointment: false,
        receiptIds: [],
        createdAt: now,
        updatedAt: now,
      };
      this.leads.set(leadId, lead);
      this.pushActivity(
        leadId,
        now,
        'lead_received',
        `Inbound lead recorded via ${req.source}` +
          (req.campaignId ? ` under campaign ${req.campaignId}` : '') +
          '; free-text details, if any, stay inside DealerOS and are excluded from AI context.',
      );

      // --- proof receipts
      if (!isDuplicate) {
        this.emitProof(
          {
            eventType: 'customer_created',
            customerId: customer.customerId,
            leadId,
            actionRequested: 'create customer record from inbound lead contact',
            actionTaken: 'customer record created',
            consentBasis: req.consent.basis,
          },
          now,
        );
      }
      consentRecord.receiptId = this.emitProof(
        {
          eventType: 'consent_captured',
          customerId: customer.customerId,
          leadId,
          actionRequested: `record ${req.consent.channel} consent evidence from ${req.consent.source}`,
          actionTaken: `consent recorded with status '${consentRecord.status}'`,
          consentBasis: req.consent.basis,
        },
        now,
      );
      if (isDuplicate) {
        this.emitProof(
          {
            eventType: 'duplicate_detected',
            customerId: customer.customerId,
            leadId,
            actionRequested: 'match inbound contact against existing customers',
            actionTaken: 'matched an existing customer; linked lead and held cluster for human merge review',
            consentBasis: req.consent.basis,
          },
          now,
        );
      }
      const leadReceivedReceiptId = this.emitProof(
        {
          eventType: 'lead_received',
          customerId: customer.customerId,
          leadId,
          vehicleId: req.interest.vehicleId,
          campaignId: req.campaignId,
          actionRequested: 'accept lead pushed by Demandara',
          actionTaken: 'traffic event and lead created',
          consentBasis: req.consent.basis,
        },
        now,
      );
      trafficEvent.receiptId = leadReceivedReceiptId;

      const response: LeadIntakeResponse = {
        leadId,
        customerId: customer.customerId,
        trafficEventId,
        receiptId: leadReceivedReceiptId,
      };
      if (isDuplicate) response.duplicateOfCustomerId = customer.customerId;
      return response;
    });
  }

  // -------------------------------------------------------------------------
  // 2. GET /api/demandara/context/:leadId
  // -------------------------------------------------------------------------

  /**
   * Builds the REDACTED, AI-facing context pack. Raw PII stays inside
   * DealerOS: no name, no email, no phone, no raw customer id, no
   * customer-authored free text. Only system-generated summaries, redacted
   * refs, consent states, and inventory facts leave this method.
   */
  getContext(req: LeadContextRequest, now: IsoTimestamp): LeadContextResponse {
    this.assertTenant(req.tenantId);
    const lead = this.mustGetLead(req.leadId);
    const customer = this.mustGetCustomer(lead.customerId);

    // Trade-in VIN is stripped before the qualification snapshot leaves DealerOS.
    const { tradeIn, ...qualificationRest } = lead.qualification;
    const qualification: LeadQualification = tradeIn
      ? {
          ...qualificationRest,
          tradeIn: {
            year: tradeIn.year,
            make: tradeIn.make,
            model: tradeIn.model,
            estimatedMileage: tradeIn.estimatedMileage,
          },
        }
      : { ...qualificationRest };

    const interestVehicles: RedactedVehicleInterest[] = lead.interestVehicleIds
      .map((vehicleId) => this.vehicles.get(vehicleId))
      .filter((vehicle): vehicle is Vehicle => vehicle !== undefined)
      .map((vehicle) => ({
        vehicleId: vehicle.vehicleId,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        askingPrice: vehicle.askingPrice,
        status: vehicle.status,
      }));

    const consentSummary: Partial<Record<ConsentChannel, RedactedConsentStatus>> = {};
    for (const consent of customer.consents) {
      if (consent.status === 'granted' || consent.status === 'implied' || consent.status === 'revoked') {
        consentSummary[consent.channel] = consent.status;
      }
    }

    if (interestVehicles.length > 0) {
      this.emitProof(
        {
          eventType: 'inventory_context_used',
          customerId: customer.customerId,
          leadId: lead.leadId,
          vehicleId: interestVehicles[0].vehicleId,
          actionRequested: 'include inventory facts in the AI context pack',
          actionTaken: `included ${interestVehicles.length} vehicle(s) in the redacted context pack`,
          consentBasis: 'none',
        },
        now,
      );
    }

    return {
      leadId: lead.leadId,
      customerRefRedacted: redactCustomerRef(customer.customerId),
      stage: lead.stage,
      qualification,
      interestVehicles,
      recentActivity: (this.activityByLead.get(lead.leadId) ?? []).slice(-10),
      consentSummary,
      dealerDisplayName: this.config.dealerDisplayName,
    };
  }

  // -------------------------------------------------------------------------
  // 3. POST /api/demandara/reply-drafts
  // -------------------------------------------------------------------------

  createReplyDraft(req: ReplyDraftRequest, now: IsoTimestamp): ReplyDraftResponse {
    this.assertTenant(req.tenantId);
    const lead = this.mustGetLead(req.leadId);
    assertClaimSafeDraftText(req.proposedText);
    assertClaimSafeDraftText(req.intentSummary);
    return this.idempotent<ReplyDraftResponse>('createReplyDraft', req.idempotencyKey, () => {
      const draftId: ReplyDraftId = this.nextId('draft');
      const draft: ReplyDraft = {
        draftId,
        tenantId: this.config.tenantId,
        dealerId: lead.dealerId,
        leadId: lead.leadId,
        channel: req.channel,
        intentSummary: req.intentSummary,
        proposedText: req.proposedText,
        status: 'pending_human_approval',
        requiresHumanApproval: true,
        createdAt: now,
      };
      this.replyDrafts.set(draftId, draft);
      if (lead.stage === 'new') {
        lead.stage = 'working';
        lead.stageChangedAt = now;
      }
      lead.updatedAt = now;
      this.pushActivity(lead.leadId, now, 'ai_reply_drafted', `AI reply drafted for ${req.channel}; held for human approval, not sent.`);
      const receiptId = this.emitProof(
        {
          eventType: 'ai_reply_drafted',
          customerId: lead.customerId,
          leadId: lead.leadId,
          actionRequested: `draft a ${req.channel} reply (${req.intentSummary})`,
          actionTaken: 'reply draft stored as pending_human_approval; nothing sent',
          consentBasis: 'none',
        },
        now,
      );
      return { draftId, status: 'pending_human_approval', requiresHumanApproval: true, receiptId };
    });
  }

  // -------------------------------------------------------------------------
  // 4. POST /api/demandara/appointment-drafts
  // -------------------------------------------------------------------------

  createAppointmentDraft(req: AppointmentDraftRequest, now: IsoTimestamp): AppointmentDraftResponse {
    this.assertTenant(req.tenantId);
    const lead = this.mustGetLead(req.leadId);
    return this.idempotent<AppointmentDraftResponse>('createAppointmentDraft', req.idempotencyKey, () => {
      const appointmentId: AppointmentId = this.nextId('appt');
      const appointment: Appointment = {
        appointmentId,
        tenantId: this.config.tenantId,
        dealerId: lead.dealerId,
        rooftopId: lead.rooftopId,
        leadId: lead.leadId,
        customerId: lead.customerId,
        vehicleId: req.vehicleId,
        kind: req.kind,
        scheduledFor: req.scheduledFor,
        status: 'draft',
        draftedBy: 'agent',
      };
      this.appointments.set(appointmentId, appointment);
      lead.appointmentIds.push(appointmentId);
      lead.updatedAt = now;
      this.pushActivity(lead.leadId, now, 'appointment_drafted', `Appointment (${req.kind}) drafted for ${req.scheduledFor}; human confirmation required.`);
      const receiptId = this.emitProof(
        {
          eventType: 'appointment_drafted',
          customerId: lead.customerId,
          leadId: lead.leadId,
          vehicleId: req.vehicleId,
          actionRequested: `draft a ${req.kind} appointment for ${req.scheduledFor}`,
          actionTaken: 'appointment stored with status draft (draftedBy agent); no outbound contact',
          consentBasis: 'none',
        },
        now,
      );
      appointment.receiptId = receiptId;
      return { appointmentId, status: 'draft', draftedBy: 'agent', requiresHumanApproval: true, receiptId };
    });
  }

  // -------------------------------------------------------------------------
  // 5. POST /api/demandara/followups
  // -------------------------------------------------------------------------

  upsertFollowUpPlan(req: FollowUpUpsertRequest, now: IsoTimestamp): FollowUpUpsertResponse {
    this.assertTenant(req.tenantId);
    const lead = this.mustGetLead(req.leadId);
    if (req.cadence.length === 0) throw new Error('follow-up cadence must not be empty');
    return this.idempotent<FollowUpUpsertResponse>('upsertFollowUpPlan', req.idempotencyKey, () => {
      const customer = this.mustGetCustomer(lead.customerId);
      const optedOut = req.cadence.some((step) =>
        customer.consents.some((c) => c.channel === step.channel && c.status === 'revoked'),
      );
      const firstStep = [...req.cadence].sort((a, b) => a.dayOffset - b.dayOffset)[0];
      const plan: FollowUpPlan = optedOut
        ? { cadence: req.cadence, pausedReason: 'opt_out' }
        : { cadence: req.cadence, nextTouchAt: isoAddDays(now, firstStep.dayOffset) };
      lead.followUpPlan = plan;
      lead.updatedAt = now;
      const planStatus = optedOut ? 'paused' : 'active';
      this.pushActivity(lead.leadId, now, 'followup_plan_updated', `Follow-up plan upserted (${planStatus}); sends remain human-approval-gated.`);
      const receiptId = this.emitProof(
        {
          eventType: 'crm_updated',
          customerId: lead.customerId,
          leadId: lead.leadId,
          actionRequested: `upsert a ${req.cadence.length}-step follow-up plan`,
          actionTaken: optedOut
            ? 'plan stored PAUSED (opt_out): a cadence channel has revoked consent'
            : 'plan stored active; every touch still requires human approval before sending',
          consentBasis: 'none',
        },
        now,
      );
      const response: FollowUpUpsertResponse = { leadId: lead.leadId, planStatus, receiptId };
      if (optedOut) response.pausedReason = 'opt_out';
      else response.nextTouchAt = plan.nextTouchAt;
      return response;
    });
  }

  // -------------------------------------------------------------------------
  // 6. POST /api/demandara/campaigns
  // -------------------------------------------------------------------------

  registerCampaign(req: CampaignRegisterRequest, now: IsoTimestamp): CampaignRegisterResponse {
    this.assertTenant(req.tenantId);
    return this.idempotent<CampaignRegisterResponse>('registerCampaign', req.idempotencyKey, () => {
      const campaignId: CampaignId = this.nextId('camp');
      // Agent-created campaigns never self-activate: pending_approval by rule.
      const status: Campaign['status'] = req.createdBy === 'demandara' ? 'pending_approval' : 'draft';
      const campaign: Campaign = {
        campaignId,
        tenantId: this.config.tenantId,
        dealerId: req.dealerId,
        name: req.name,
        channel: req.channel,
        status,
        createdBy: req.createdBy,
        targetSegment: req.targetSegment,
        utmCampaign: req.utmCampaign,
        startAt: req.startAt,
        endAt: req.endAt,
      };
      this.campaigns.set(campaignId, campaign);
      const receiptId = this.emitProof(
        {
          eventType: 'campaign_generated',
          campaignId,
          actionRequested: `register ${req.channel} campaign "${req.name}" (createdBy ${req.createdBy})`,
          actionTaken: `campaign stored with status '${status}'; human approval required before activation`,
          consentBasis: 'none',
          actorType: req.createdBy === 'demandara' ? 'agent' : 'human',
        },
        now,
      );
      campaign.receiptId = receiptId;
      return { campaignId, status, receiptId };
    });
  }

  // -------------------------------------------------------------------------
  // 7. GET /api/demandara/outcomes
  // -------------------------------------------------------------------------

  getOutcomes(req: OutcomesRequest): OutcomesResponse {
    this.assertTenant(req.tenantId);
    const rows: LeadOutcomeRow[] = [];
    for (const lead of this.leads.values()) {
      if (!isoGte(lead.updatedAt, req.since)) continue;
      const row: LeadOutcomeRow = {
        leadId: lead.leadId,
        campaignId: this.campaignOfLead(lead),
        stage: lead.stage,
        appointmentStates: lead.appointmentIds
          .map((id) => this.appointments.get(id))
          .filter((a): a is Appointment => a !== undefined)
          .map((a) => a.status),
        sold: lead.stage === 'sold',
        soldDealId: lead.dealId,
        lost: lead.stage === 'lost',
        lostReason: lead.lostReason,
        receiptsCount: lead.receiptIds.length,
        updatedAt: lead.updatedAt,
      };
      rows.push(row);
    }
    rows.sort((a, b) => String(a.leadId).localeCompare(String(b.leadId)));
    return { since: req.since, rows };
  }

  // -------------------------------------------------------------------------
  // 8. GET /api/demandara/revenue-attribution
  // -------------------------------------------------------------------------

  getRevenueAttribution(req: RevenueAttributionRequest): RevenueAttributionResponse {
    this.assertTenant(req.tenantId);
    const currency = this.config.defaultCurrency ?? 'CAD';
    const rows: CampaignAttributionRow[] = [];
    for (const campaign of this.campaigns.values()) {
      const campaignLeads = [...this.leads.values()].filter(
        (lead) =>
          this.campaignOfLead(lead) === campaign.campaignId &&
          (req.since === undefined || isoGte(lead.createdAt, req.since)),
      );
      const leadIds = new Set(campaignLeads.map((l) => l.leadId));
      const campaignAppointments = [...this.appointments.values()].filter((a) => leadIds.has(a.leadId));
      // Sold/gross/aiAssisted come from Deal.attribution (first OR last touch,
      // counted once per deal).
      const attributedDeals = [...this.deals.values()].filter(
        (deal) =>
          deal.soldAt !== undefined &&
          deal.attribution !== undefined &&
          (deal.attribution.firstTouch.campaignId === campaign.campaignId ||
            deal.attribution.lastTouch.campaignId === campaign.campaignId) &&
          (req.since === undefined || isoGte(deal.soldAt, req.since)),
      );
      rows.push({
        campaignId: campaign.campaignId,
        campaignName: campaign.name,
        leads: campaignLeads.length,
        appointments: campaignAppointments.length,
        shows: campaignAppointments.filter((a) => a.status === 'completed').length,
        sold: attributedDeals.length,
        gross: {
          amountCents: attributedDeals.reduce((sum, deal) => sum + deal.vehiclePrice.amountCents, 0),
          currency,
        },
        aiAssistedCount: attributedDeals.filter((deal) => deal.attribution?.aiAssisted === true).length,
      });
    }
    rows.sort((a, b) => String(a.campaignId).localeCompare(String(b.campaignId)));
    return { rows };
  }

  // -------------------------------------------------------------------------
  // 9. GET /api/demandara/proof-report
  // -------------------------------------------------------------------------

  getProofReport(req: ProofReportRequest): ProofReportResponse {
    this.assertTenant(req.tenantId);
    const inPeriod = (at: IsoTimestamp): boolean => isoGte(at, req.periodStart) && isoGte(req.periodEnd, at);
    const periodLog = this.receiptLog.filter((entry) => inPeriod(entry.at));
    const count = (eventType: DemandaraProofEventType): number =>
      periodLog.filter((entry) => entry.eventType === eventType).length;

    const currency = this.config.defaultCurrency ?? 'CAD';
    const perCampaign: ProofReportCampaignRow[] = [];
    for (const campaign of this.campaigns.values()) {
      const forCampaign = periodLog.filter((entry) => entry.campaignId === campaign.campaignId);
      const soldDeals = [...this.deals.values()].filter(
        (deal) =>
          deal.soldAt !== undefined &&
          inPeriod(deal.soldAt) &&
          (deal.attribution?.firstTouch.campaignId === campaign.campaignId ||
            deal.attribution?.lastTouch.campaignId === campaign.campaignId),
      );
      perCampaign.push({
        campaignId: campaign.campaignId,
        campaignName: campaign.name,
        leadsReceived: forCampaign.filter((e) => e.eventType === 'lead_received').length,
        appointmentsConfirmed: forCampaign.filter((e) => e.eventType === 'appointment_confirmed').length,
        sold: soldDeals.length,
        gross: { amountCents: soldDeals.reduce((sum, d) => sum + d.vehiclePrice.amountCents, 0), currency },
      });
    }
    perCampaign.sort((a, b) => String(a.campaignId).localeCompare(String(b.campaignId)));

    return {
      period: { start: req.periodStart, end: req.periodEnd, label: req.label ?? req.periodStart.slice(0, 7) },
      totals: {
        leadsReceived: count('lead_received'),
        aiDraftsCreated: count('ai_reply_drafted') + count('appointment_drafted'),
        humanApprovedDrafts: count('human_approval_granted'),
        appointmentsConfirmed: count('appointment_confirmed'),
        sold: count('sold_marked'),
      },
      perCampaign,
      receiptIds: periodLog.map((entry) => entry.receiptId),
      disclaimer: PROOF_REPORT_DISCLAIMER,
      requiresHumanApproval: true,
    };
  }

  // -------------------------------------------------------------------------
  // DealerOS-side hooks (not among the 9 Demandara endpoints): human approval,
  // appointment confirmation, opt-out handling, and outcome recording.
  // -------------------------------------------------------------------------

  /** A named human approves a reply draft. Approval is NOT a send: any actual
   *  outbound message goes through DealerOS's own consent + side-effect gates. */
  approveReplyDraft(draftId: ReplyDraftId, approvedByUserId: UserId, now: IsoTimestamp): { receiptId: ReceiptId } {
    const draft = this.replyDrafts.get(draftId);
    if (!draft) throw new Error(`unknown reply draft: ${draftId}`);
    if (draft.status !== 'pending_human_approval') throw new Error(`draft ${draftId} is not pending approval`);
    draft.status = 'approved';
    draft.approvedByUserId = approvedByUserId;
    const lead = this.mustGetLead(draft.leadId);
    lead.updatedAt = now;
    this.pushActivity(draft.leadId, now, 'human_approval_granted', 'A named human approved the AI reply draft.');
    const receiptId = this.emitProof(
      {
        eventType: 'human_approval_granted',
        customerId: lead.customerId,
        leadId: draft.leadId,
        actorType: 'human',
        actorId: String(approvedByUserId),
        actionRequested: 'approve AI reply draft',
        actionTaken: 'draft approved; sending remains gated by DealerOS outbound controls',
        consentBasis: 'none',
      },
      now,
    );
    draft.approvalReceiptId = receiptId;
    return { receiptId };
  }

  /** A named human confirms an agent-drafted appointment. */
  confirmAppointment(appointmentId: AppointmentId, confirmedByUserId: UserId, now: IsoTimestamp): { receiptId: ReceiptId } {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) throw new Error(`unknown appointment: ${appointmentId}`);
    if (appointment.status !== 'draft' && appointment.status !== 'proposed') {
      throw new Error(`appointment ${appointmentId} cannot be confirmed from status '${appointment.status}'`);
    }
    appointment.status = 'confirmed';
    appointment.confirmedByUserId = confirmedByUserId;
    const lead = this.mustGetLead(appointment.leadId);
    if (lead.stage === 'new' || lead.stage === 'working' || lead.stage === 'qualified') {
      lead.stage = 'appointment_set';
      lead.stageChangedAt = now;
    }
    if (appointment.draftedBy === 'agent') lead.aiAssistedAppointment = true;
    lead.updatedAt = now;
    this.setTrafficOutcome(lead, { state: 'appointment_set', recordedByUserId: confirmedByUserId, recordedAt: now });
    this.pushActivity(appointment.leadId, now, 'appointment_confirmed', 'A named human confirmed the drafted appointment.');
    const receiptId = this.emitProof(
      {
        eventType: 'appointment_confirmed',
        customerId: lead.customerId,
        leadId: lead.leadId,
        vehicleId: appointment.vehicleId,
        campaignId: this.campaignOfLead(lead),
        actorType: 'human',
        actorId: String(confirmedByUserId),
        actionRequested: 'confirm agent-drafted appointment',
        actionTaken: 'appointment confirmed by a named human',
        consentBasis: 'none',
      },
      now,
    );
    return { receiptId };
  }

  /** Records a channel opt-out: revokes consent and pauses every affected
   *  follow-up plan for that customer (CASL opt-out handling). */
  recordOptOut(leadId: LeadId, channel: ConsentChannel, now: IsoTimestamp): { receiptId: ReceiptId } {
    const lead = this.mustGetLead(leadId);
    const customer = this.mustGetCustomer(lead.customerId);
    this.upsertConsent(customer, {
      channel,
      status: 'revoked',
      basis: 'none',
      capturedAt: now,
      source: 'demandara:opt_out',
    });
    customer.updatedAt = now;
    for (const candidate of this.leads.values()) {
      if (candidate.customerId !== customer.customerId) continue;
      const plan = candidate.followUpPlan;
      if (plan && plan.pausedReason === undefined && plan.cadence.some((step) => step.channel === channel)) {
        plan.pausedReason = 'opt_out';
        plan.nextTouchAt = undefined;
        candidate.updatedAt = now;
        this.pushActivity(candidate.leadId, now, 'followup_paused', `Follow-up plan paused: ${channel} opt-out recorded.`);
      }
    }
    const receiptId = this.emitProof(
      {
        eventType: 'consent_captured',
        customerId: customer.customerId,
        leadId,
        actionRequested: `record ${channel} opt-out`,
        actionTaken: 'consent revoked; affected follow-up plans paused',
        consentBasis: 'none',
        actorType: 'system',
        actorId: 'system:optout_handler',
      },
      now,
    );
    return { receiptId };
  }

  /** DealerOS records the final outcome; feeds outcomes/attribution/proof. */
  recordOutcome(leadId: LeadId, outcome: LeadOutcomeInput, now: IsoTimestamp): { dealId?: DealId; receiptId: ReceiptId } {
    const lead = this.mustGetLead(leadId);
    const trafficEvent = this.trafficEvents.get(lead.sourceTrafficEventId);
    if (outcome.result === 'sold') {
      const dealId: DealId = this.nextId('deal');
      const touch = {
        source: trafficEvent?.source ?? 'internet_lead',
        campaignId: trafficEvent?.campaignId,
      } as const;
      const deal: Deal = {
        dealId,
        tenantId: this.config.tenantId,
        dealerId: lead.dealerId,
        rooftopId: lead.rooftopId,
        leadId: lead.leadId,
        customerId: lead.customerId,
        vehicleId: outcome.vehicleId,
        status: 'signed',
        vehiclePrice: outcome.salePrice,
        soldAt: now,
        attribution: {
          // Scaffold: single-touch journey, so first == last touch.
          firstTouch: { ...touch },
          lastTouch: { ...touch },
          aiAssisted: this.hasAiTouch(lead),
          touchCount: (this.activityByLead.get(lead.leadId) ?? []).length,
        },
      };
      this.deals.set(dealId, deal);
      lead.stage = 'sold';
      lead.stageChangedAt = now;
      lead.dealId = dealId;
      lead.updatedAt = now;
      this.pausePlan(lead, 'sold');
      this.setTrafficOutcome(lead, { state: 'sold', soldDealId: dealId, recordedAt: now });
      this.pushActivity(leadId, now, 'sold_marked', 'Deal marked sold; attribution recorded.');
      const receiptId = this.emitProof(
        {
          eventType: 'sold_marked',
          customerId: lead.customerId,
          leadId,
          dealId,
          vehicleId: outcome.vehicleId,
          campaignId: touch.campaignId,
          actorType: 'human',
          actorId: 'human:desk_manager',
          actionRequested: 'mark lead sold with deal + attribution',
          actionTaken: 'deal recorded; lead moved to sold; source/campaign attribution stored',
          consentBasis: 'none',
        },
        now,
      );
      return { dealId, receiptId };
    }
    lead.stage = 'lost';
    lead.stageChangedAt = now;
    lead.lostReason = outcome.lostReason;
    lead.updatedAt = now;
    this.pausePlan(lead, 'lost');
    this.setTrafficOutcome(lead, { state: 'lost', lostReason: outcome.lostReason, recordedAt: now });
    this.pushActivity(leadId, now, 'lost_reason_recorded', `Lead marked lost (${outcome.lostReason}).`);
    const receiptId = this.emitProof(
      {
        eventType: 'lost_reason_recorded',
        customerId: lead.customerId,
        leadId,
        campaignId: this.campaignOfLead(lead),
        actorType: 'human',
        actorId: 'human:desk_manager',
        actionRequested: 'mark lead lost with reason',
        actionTaken: `lead moved to lost with reason '${outcome.lostReason}'`,
        consentBasis: 'none',
      },
      now,
    );
    return { receiptId };
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private assertTenant(tenantId: TenantId): void {
    if (tenantId !== this.config.tenantId) {
      throw new Error('tenant mismatch: this adapter instance is scoped to a single tenant');
    }
  }

  /** Deterministic ids from the injected counter seed — never Math.random. */
  private nextId(prefix: string): string {
    return `${prefix}_${String(this.idCounter++).padStart(4, '0')}`;
  }

  private idempotent<T>(op: string, idempotencyKey: string, compute: () => T): T {
    const cacheKey = `${op}|${idempotencyKey}`;
    const cached = this.idempotencyCache.get(cacheKey);
    if (cached !== undefined) return cached as T;
    const result = compute();
    this.idempotencyCache.set(cacheKey, result);
    return result;
  }

  private mustGetLead(leadId: LeadId): Lead {
    const lead = this.leads.get(leadId);
    if (!lead) throw new Error(`unknown lead: ${leadId}`);
    return lead;
  }

  private mustGetCustomer(customerId: CustomerId): Customer {
    const customer = this.customers.get(customerId);
    if (!customer) throw new Error(`unknown customer: ${customerId}`);
    return customer;
  }

  private createCustomer(req: LeadIntakeRequest, now: IsoTimestamp): Customer {
    const customerId: CustomerId = this.nextId('cust');
    const customer: Customer = {
      customerId,
      tenantId: this.config.tenantId,
      dealerId: req.dealerId,
      firstName: req.contact.firstName,
      lastName: req.contact.lastName,
      contactMethods: [],
      consents: [],
      tags: [],
      segment: 'active_lead',
      ownedVehicles: [],
      createdAt: now,
      updatedAt: now,
      privacy: {},
    };
    this.customers.set(customerId, customer);
    this.mergeContactMethods(customer, req);
    return customer;
  }

  private mergeContactMethods(customer: Customer, req: LeadIntakeRequest): void {
    const add = (kind: 'email' | 'mobile', value: string, normalized: string): void => {
      const exists = customer.contactMethods.some(
        (m) => m.kind === kind && (m.kind === 'email' ? normalizeEmail(m.value) : normalizePhone(m.value)) === normalized,
      );
      if (!exists) {
        customer.contactMethods.push({
          kind,
          value,
          verified: false,
          preferred: customer.contactMethods.length === 0,
          doNotContact: false,
        });
      }
    };
    if (req.contact.email) add('email', req.contact.email, normalizeEmail(req.contact.email));
    if (req.contact.phone) add('mobile', req.contact.phone, normalizePhone(req.contact.phone));
  }

  /** One consent record per channel: newer evidence replaces older. */
  private upsertConsent(customer: Customer, record: ConsentRecord): void {
    const index = customer.consents.findIndex((c) => c.channel === record.channel);
    if (index >= 0) customer.consents[index] = record;
    else customer.consents.push(record);
  }

  private campaignOfLead(lead: Lead): CampaignId | undefined {
    return this.trafficEvents.get(lead.sourceTrafficEventId)?.campaignId;
  }

  /** True when any AI draft touched this lead (reply draft or agent appointment). */
  private hasAiTouch(lead: Lead): boolean {
    if (lead.aiAssistedAppointment) return true;
    for (const draft of this.replyDrafts.values()) if (draft.leadId === lead.leadId) return true;
    return lead.appointmentIds.some((id) => this.appointments.get(id)?.draftedBy === 'agent');
  }

  private pausePlan(lead: Lead, reason: 'sold' | 'lost'): void {
    const plan = lead.followUpPlan;
    if (plan && plan.pausedReason === undefined) {
      plan.pausedReason = reason;
      plan.nextTouchAt = undefined;
    }
  }

  private setTrafficOutcome(lead: Lead, outcome: NonNullable<TrafficEvent['outcome']>): void {
    const trafficEvent = this.trafficEvents.get(lead.sourceTrafficEventId);
    if (trafficEvent) trafficEvent.outcome = outcome;
  }

  /** PII-free by construction: only system-generated template strings go in. */
  private pushActivity(leadId: LeadId, at: IsoTimestamp, kind: string, summary: string): void {
    const entries = this.activityByLead.get(leadId) ?? [];
    entries.push({ at, kind, summary });
    this.activityByLead.set(leadId, entries);
  }

  private emitProof(
    event: {
      eventType: DemandaraProofEventType;
      customerId?: CustomerId;
      actorType?: ProofEmitInput['actorType'];
      actorId?: string;
      actionRequested: string;
      actionTaken: string;
      consentBasis: ConsentRecord['basis'];
      leadId?: LeadId;
      vehicleId?: VehicleId;
      dealId?: DealId;
      campaignId?: CampaignId;
    },
    now: IsoTimestamp,
  ): ReceiptId {
    const { receiptId } = this.proof.emit(
      {
        tenantId: this.config.tenantId,
        dealerId: this.config.dealerId,
        rooftopId: this.config.rooftopId,
        actorType: event.actorType ?? 'agent',
        actorId: event.actorId ?? DEMANDARA_ACTOR_ID,
        eventType: event.eventType,
        customerRefRedacted: event.customerId !== undefined ? redactCustomerRef(event.customerId) : NO_CUSTOMER_REF,
        actionRequested: event.actionRequested,
        actionTaken: event.actionTaken,
        consentBasis: event.consentBasis,
        leadId: event.leadId,
        vehicleId: event.vehicleId,
        dealId: event.dealId,
        campaignId: event.campaignId,
        externalSideEffect: false,
      },
      now,
    );
    const typedReceiptId: ReceiptId = receiptId;
    this.receiptLog.push({
      receiptId: typedReceiptId,
      eventType: event.eventType,
      at: now,
      leadId: event.leadId,
      campaignId: event.campaignId,
    });
    if (event.leadId !== undefined) {
      const lead = this.leads.get(event.leadId);
      if (lead) lead.receiptIds.push(typedReceiptId);
    }
    return typedReceiptId;
  }
}
