/**
 * BUDGET WHEELS DEALEROS — CORE DOMAIN SCHEMA (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD ONLY. NOT PRODUCTION READY.
 *
 * This file is the canonical vocabulary for DealerOS. It is a dependency-free
 * TypeScript reference schema intended to be moved into the dedicated DealerOS
 * application repo (see DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md). It
 * contains no runtime behavior, no I/O, no secrets, and no live integrations.
 *
 * Conventions:
 * - Tenancy chain: Tenant (contract) → DealerGroup? → Dealer → Rooftop.
 * - Every tenant-owned record carries `tenantId` plus the narrowest scope it
 *   belongs to; row-level isolation is enforced on `tenantId`.
 * - Times are ISO-8601 UTC strings (`IsoTimestamp`).
 * - Money is integer cents plus currency to avoid float drift.
 * - PII-bearing fields are marked `// PII` so the redaction gate
 *   (ai-harness packet) and proof receipts (cognitia packet) can reference
 *   a single source of truth.
 */

// ---------------------------------------------------------------------------
// Scalar + ID types
// ---------------------------------------------------------------------------

export type IsoTimestamp = string; // e.g. "2026-07-03T18:00:00Z"

export interface Money {
  amountCents: number;
  currency: 'CAD' | 'USD';
}

/** Branded string IDs: prevents cross-entity ID mixups at compile time. */
export type Brand<T extends string> = string & { readonly __brand?: T };

export type TenantId = Brand<'TenantId'>;
export type DealerGroupId = Brand<'DealerGroupId'>;
export type DealerId = Brand<'DealerId'>;
export type RooftopId = Brand<'RooftopId'>;
export type UserId = Brand<'UserId'>;
export type TeamId = Brand<'TeamId'>;
export type CustomerId = Brand<'CustomerId'>;
export type HouseholdId = Brand<'HouseholdId'>;
export type VehicleId = Brand<'VehicleId'>;
export type LeadId = Brand<'LeadId'>;
export type TrafficEventId = Brand<'TrafficEventId'>;
export type AppointmentId = Brand<'AppointmentId'>;
export type DealId = Brand<'DealId'>;
export type CampaignId = Brand<'CampaignId'>;
export type OpportunityId = Brand<'OpportunityId'>;
export type ConnectorId = Brand<'ConnectorId'>;
export type ReceiptId = Brand<'ReceiptId'>;
export type AgentPassportId = Brand<'AgentPassportId'>;
export type AgentActionId = Brand<'AgentActionId'>;
export type TaskId = Brand<'TaskId'>;
export type WebsiteId = Brand<'WebsiteId'>;

// ---------------------------------------------------------------------------
// MODULE 1 — Multi-tenant dealership foundation
// ---------------------------------------------------------------------------

export interface Tenant {
  tenantId: TenantId;
  name: string;
  status: 'trial' | 'active' | 'suspended' | 'churned';
  plan: 'tenant_zero' | 'starter' | 'pro' | 'group';
  region: 'ca' | 'us';
  dataResidency: 'ca' | 'us';
  createdAt: IsoTimestamp;
  settings: TenantSettings;
}

export interface TenantSettings {
  branding: { displayName: string; logoAssetRef?: string; primaryColorHex?: string };
  /** Names of env vars only — never secret values. See connectors packet. */
  connectorSecretEnvVarNames: string[];
  aiPolicy: {
    externalModelsAllowed: boolean;
    piiToExternalModelsAllowed: false; // hard-off in V1; flip requires policy review
    localOnlyMode: boolean;
    aiDisclosureFooter: string; // e.g. "Drafted with AI assistance, reviewed by our team."
  };
  approvals: {
    /** Actions that always require a named human approver before side effects. */
    humanApprovalRequiredFor: ExternalSideEffectKind[];
  };
  retention: { customerDataMonths: number; receiptRetentionMonths: number };
}

export type ExternalSideEffectKind =
  | 'send_sms'
  | 'send_email'
  | 'place_call'
  | 'post_listing'
  | 'publish_page'
  | 'crm_export'
  | 'dms_export'
  | 'calendar_write';

export interface DealerGroup {
  dealerGroupId: DealerGroupId;
  tenantId: TenantId;
  name: string;
}

export interface Dealer {
  dealerId: DealerId;
  tenantId: TenantId;
  dealerGroupId?: DealerGroupId;
  name: string; // e.g. "Budget Wheels"
  legalName?: string;
  /** e.g. BC VSA dealer registration number — displayed where required by ad rules. */
  licenseNumbers: { authority: string; number: string }[];
  defaultCurrency: 'CAD' | 'USD';
}

export interface Rooftop {
  rooftopId: RooftopId;
  tenantId: TenantId;
  dealerId: DealerId;
  name: string;
  address: PostalAddress; // PII-adjacent (business address, public)
  phone?: string;
  timezone: string; // IANA, e.g. "America/Vancouver"
  websiteId?: WebsiteId;
}

export interface PostalAddress {
  line1: string;
  line2?: string;
  city: string;
  region: string; // province/state code
  postalCode: string;
  country: 'CA' | 'US';
}

export type RoleKey =
  | 'owner'            // tenant owner (Muhammad-equivalent at the dealer)
  | 'general_manager'
  | 'sales_manager'
  | 'salesperson'
  | 'bdc_manager'
  | 'bdc_agent'
  | 'service_advisor'
  | 'marketing'
  | 'auditor'          // read-only + proof ledger access
  | 'platform_admin';  // Cognitia-side operator; every access is receipted

export interface User {
  userId: UserId;
  tenantId: TenantId;
  dealerIds: DealerId[];
  rooftopIds: RooftopId[];
  name: string;            // PII
  email: string;           // PII
  phone?: string;          // PII
  roles: RoleKey[];
  teamIds: TeamId[];
  active: boolean;
  createdAt: IsoTimestamp;
}

export interface Team {
  teamId: TeamId;
  tenantId: TenantId;
  dealerId: DealerId;
  name: string;
  kind: 'sales' | 'bdc' | 'service' | 'management';
  memberUserIds: UserId[];
}

// ---------------------------------------------------------------------------
// MODULE 2 — Customer 360
// ---------------------------------------------------------------------------

export type ConsentChannel = 'email' | 'sms' | 'voice' | 'mail';

/**
 * CASL-aware consent record. `basis` distinguishes express consent from
 * implied consent (existing business relationship), which expires.
 */
export interface ConsentRecord {
  channel: ConsentChannel;
  status: 'granted' | 'implied' | 'revoked' | 'unknown';
  basis: 'express' | 'implied_ebr' | 'implied_inquiry' | 'none';
  capturedAt?: IsoTimestamp;
  expiresAt?: IsoTimestamp; // implied consent windows expire under CASL
  source?: string;          // e.g. "website_form:test_drive", "in_person"
  receiptId?: ReceiptId;    // consent_captured proof receipt
}

export interface ContactMethod {
  kind: 'email' | 'mobile' | 'landline' | 'address';
  value: string;            // PII
  verified: boolean;
  preferred: boolean;
  doNotContact: boolean;
}

export interface Customer {
  customerId: CustomerId;
  tenantId: TenantId;
  dealerId: DealerId;
  householdId?: HouseholdId;
  firstName: string;        // PII
  lastName: string;         // PII
  contactMethods: ContactMethod[];
  consents: ConsentRecord[];
  preferredLanguage?: 'en' | 'fr' | string;
  tags: string[];
  /** Lifecycle segment used by equity mining + campaigns. */
  segment: 'prospect' | 'active_lead' | 'sold_customer' | 'service_only' | 'orphan_owner' | 'inactive';
  ownedVehicles: OwnedVehicle[];
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  /** Duplicate detection: cluster key of suspected duplicates awaiting merge review. */
  duplicateClusterKey?: string;
  privacy: {
    deleteRequestedAt?: IsoTimestamp;
    exportRequestedAt?: IsoTimestamp;
    anonymizedAt?: IsoTimestamp;
  };
}

/** A vehicle the customer owns/leases — the substrate for equity mining. */
export interface OwnedVehicle {
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  estimatedMileage?: number;
  mileageAsOf?: IsoTimestamp;
  acquisition: 'purchased_here' | 'leased_here' | 'financed_here' | 'external' | 'unknown';
  finance?: {
    kind: 'loan' | 'lease' | 'cash';
    startDate?: IsoTimestamp;
    termMonths?: number;
    estimatedPayment?: Money;
    estimatedPayoff?: Money;   // only if lawfully known/estimated
    maturityDate?: IsoTimestamp;
  };
  warrantyEndDate?: IsoTimestamp;
  lastServiceAt?: IsoTimestamp;
}

// ---------------------------------------------------------------------------
// MODULE 3 — Inventory CRM
// ---------------------------------------------------------------------------

export type VehicleStatus =
  | 'incoming' | 'in_recon' | 'available' | 'pending' | 'sold' | 'wholesale' | 'archived';

export interface Vehicle {
  vehicleId: VehicleId;
  tenantId: TenantId;
  dealerId: DealerId;
  rooftopId: RooftopId;
  vin: string;
  stockNumber: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  bodyStyle?: 'suv' | 'truck' | 'sedan' | 'van' | 'coupe' | 'hatchback' | 'wagon' | 'other';
  drivetrain?: 'fwd' | 'rwd' | 'awd' | '4x4';
  fuel?: 'gas' | 'diesel' | 'hybrid' | 'phev' | 'ev';
  mileageKm: number;
  askingPrice: Money;      // must satisfy all-in price rules for BC advertising
  internalCost?: Money;    // permission-gated: managers only
  status: VehicleStatus;
  statusChangedAt: IsoTimestamp;
  acquiredAt?: IsoTimestamp;
  photos: { assetRef: string; order: number; kind: 'exterior' | 'interior' | 'detail' | 'damage' }[];
  features: string[];
  disclosures: VehicleDisclosure[];
  externalRefs: { kind: 'carfax' | 'inspection' | 'market_price' | 'listing'; provider: string; refId: string }[];
  merchandising: MerchandisingState;
}

/** BC Motor Dealer Act-style declarations live here, not in free text. */
export interface VehicleDisclosure {
  kind: 'accident_damage' | 'prior_rental' | 'prior_taxi' | 'out_of_province' | 'rebuilt' | 'flood' | 'odometer' | 'other';
  detail: string;
  required: boolean;
}

export interface MerchandisingState {
  daysInInventory: number;
  listingCompletenessScore: number; // 0..100, deterministic checklist score
  merchandisingScore: number;       // 0..100, photo/desc/price-competitiveness composite
  seoContent?: {
    title: string;
    metaDescription: string;
    vdpBodyDraft: string;      // AI-drafted, human-approved before publish
    approvedBy?: UserId;
    approvalReceiptId?: ReceiptId;
  };
}

// ---------------------------------------------------------------------------
// MODULE 4 — TMS traffic desk
// ---------------------------------------------------------------------------

export type TrafficSourceKind =
  | 'phone' | 'internet_lead' | 'walk_in' | 'website_form' | 'website_chat'
  | 'marketplace' | 'after_hours' | 'service_drive' | 'referral' | 'partner';

export interface TrafficEvent {
  trafficEventId: TrafficEventId;
  tenantId: TenantId;
  dealerId: DealerId;
  rooftopId: RooftopId;
  occurredAt: IsoTimestamp;
  source: TrafficSourceKind;
  /** e.g. "autotrader_ca", "facebook_marketplace", "google_business_profile", "demandara_campaign" */
  sourceDetail?: string;
  campaignId?: CampaignId;
  utm?: { source?: string; medium?: string; campaign?: string; term?: string; content?: string };
  customerId?: CustomerId;   // linked after identification/dedup
  leadId?: LeadId;           // linked when the event opens or touches a lead
  vehicleId?: VehicleId;     // vehicle of interest, if known
  assignedToUserId?: UserId;
  assignedAt?: IsoTimestamp;
  sla: SlaState;
  outcome?: TrafficOutcome;
  notes?: string;            // PII possible — redact before model calls
  receiptId?: ReceiptId;     // lead_received proof receipt
}

export interface SlaState {
  /** Response due by; e.g. internet leads 15 min, after-hours next business morning 09:00 (`morningStartHour`). */
  firstResponseDueAt: IsoTimestamp;
  firstRespondedAt?: IsoTimestamp;
  breached: boolean;
  escalatedToUserId?: UserId;
}

export interface TrafficOutcome {
  state: 'open' | 'appointment_set' | 'shown' | 'no_show' | 'sold' | 'lost';
  soldDealId?: DealId;
  lostReason?: LostReason;
  recordedByUserId?: UserId;
  recordedAt?: IsoTimestamp;
}

export type LostReason =
  | 'bought_elsewhere' | 'no_response' | 'financing_declined' | 'price'
  | 'vehicle_sold' | 'not_ready' | 'bad_contact_info' | 'duplicate' | 'other';

// ---------------------------------------------------------------------------
// MODULE 5 — Lead pipeline / Sales Closer
// ---------------------------------------------------------------------------

export type LeadStage =
  | 'new' | 'working' | 'qualified' | 'appointment_set' | 'shown'
  | 'negotiating' | 'deal_draft' | 'sold' | 'lost' | 'dormant';

export interface Lead {
  leadId: LeadId;
  tenantId: TenantId;
  dealerId: DealerId;
  rooftopId: RooftopId;
  customerId: CustomerId;
  stage: LeadStage;
  stageChangedAt: IsoTimestamp;
  sourceTrafficEventId: TrafficEventId;
  assignedToUserId?: UserId;
  qualification: LeadQualification;
  interestVehicleIds: VehicleId[];
  appointmentIds: AppointmentId[];
  objections: { code: string; note?: string; raisedAt: IsoTimestamp }[];
  followUpPlan?: FollowUpPlan;
  dealId?: DealId;
  lostReason?: LostReason;
  /** True when an AI-drafted touch contributed to the booked appointment. */
  aiAssistedAppointment: boolean;
  receiptIds: ReceiptId[];
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface LeadQualification {
  intent: 'unknown' | 'browsing' | 'shopping' | 'ready_to_buy';
  budgetRange?: { min?: Money; max?: Money };
  desiredVehicle?: { bodyStyle?: string; make?: string; model?: string; yearMin?: number; yearMax?: number };
  hasTradeIn?: boolean;
  tradeIn?: { vin?: string; year?: number; make?: string; model?: string; estimatedMileage?: number };
  needsFinancing?: boolean;
  timeline?: 'this_week' | 'this_month' | 'this_quarter' | 'someday';
}

export interface FollowUpPlan {
  cadence: { dayOffset: number; channel: ConsentChannel; templateKey: string }[];
  pausedReason?: 'opt_out' | 'human_hold' | 'sold' | 'lost';
  nextTouchAt?: IsoTimestamp;
}

export interface Appointment {
  appointmentId: AppointmentId;
  tenantId: TenantId;
  dealerId: DealerId;
  rooftopId: RooftopId;
  leadId: LeadId;
  customerId: CustomerId;
  vehicleId?: VehicleId;
  kind: 'visit' | 'test_drive' | 'service' | 'delivery' | 'trade_appraisal';
  scheduledFor: IsoTimestamp;
  status: 'draft' | 'proposed' | 'confirmed' | 'completed' | 'no_show' | 'cancelled';
  /** Drafted-by matters: AI drafts require human confirm before outbound comms. */
  draftedBy: 'human' | 'agent';
  confirmedByUserId?: UserId;
  receiptId?: ReceiptId;
}

export interface Deal {
  dealId: DealId;
  tenantId: TenantId;
  dealerId: DealerId;
  rooftopId: RooftopId;
  leadId: LeadId;
  customerId: CustomerId;
  vehicleId: VehicleId;
  status: 'draft' | 'pending_approval' | 'signed' | 'delivered' | 'unwound';
  vehiclePrice: Money;
  tradeIn?: { vin?: string; allowance: Money };
  financing?: { kind: 'cash' | 'loan' | 'lease'; lenderRef?: string };
  soldAt?: IsoTimestamp;
  attribution?: DealAttribution;
}

/** Closed-loop attribution back to source/campaign — feeds Demandara reporting. */
export interface DealAttribution {
  firstTouch: { source: TrafficSourceKind; campaignId?: CampaignId };
  lastTouch: { source: TrafficSourceKind; campaignId?: CampaignId };
  aiAssisted: boolean;
  touchCount: number;
}

// ---------------------------------------------------------------------------
// MODULE 9/10 — Campaigns (Demandara-owned, DealerOS-recorded)
// ---------------------------------------------------------------------------

export interface Campaign {
  campaignId: CampaignId;
  tenantId: TenantId;
  dealerId: DealerId;
  name: string;
  channel: 'seo_page' | 'aeo_page' | 'email' | 'sms' | 'social' | 'listing' | 'referral' | 'review' | 'paid';
  status: 'draft' | 'pending_approval' | 'active' | 'paused' | 'archived';
  createdBy: 'human' | 'demandara';
  approvedByUserId?: UserId;
  targetSegment?: Customer['segment'];
  utmCampaign?: string;
  startAt?: IsoTimestamp;
  endAt?: IsoTimestamp;
  receiptId?: ReceiptId; // campaign_generated
}

// ---------------------------------------------------------------------------
// MODULE 7 — Opportunity score (shape only; scoring engine in equity packet)
// ---------------------------------------------------------------------------

export type OpportunityReasonCode =
  | 'lease_maturity_near' | 'finance_term_late' | 'positive_equity_estimated'
  | 'payment_upgrade_possible' | 'high_mileage_vs_term' | 'warranty_ending'
  | 'service_visit_recent' | 'service_only_customer' | 'orphan_owner'
  | 'vehicle_aging' | 'inventory_match_available' | 'engagement_recent'
  | 'website_behavior_intent' | 'household_opportunity' | 'trade_in_window';

export interface OpportunityScore {
  opportunityId: OpportunityId;
  tenantId: TenantId;
  dealerId: DealerId;
  customerId: CustomerId;
  ownedVehicleVin?: string;
  score: number; // 0..100
  band: 'hot' | 'warm' | 'watch';
  reasonCodes: OpportunityReasonCode[];
  factors: { code: OpportunityReasonCode; weight: number; contribution: number; evidence: string }[];
  recommendedPitch: string;      // claim-safe, human-reviewed before use
  matchedInventoryVehicleIds: VehicleId[];
  nextBestAction: NextBestAction;
  generatedAt: IsoTimestamp;
  modelVersion: string;          // scoring model/prompt registry version
  receiptId?: ReceiptId;         // equity_score_generated
  result?: { state: 'contacted' | 'appointment' | 'sold' | 'dismissed'; recordedAt: IsoTimestamp };
}

export interface NextBestAction {
  kind: 'call_task' | 'sms_draft' | 'email_draft' | 'service_offer' | 'no_action';
  assigneeUserId?: UserId;
  draftText?: string;            // never sent without human approval
  requiresHumanApproval: true;   // V1: all outbound from opportunities is approval-gated
  dueAt?: IsoTimestamp;
}

// ---------------------------------------------------------------------------
// Shared task primitive (BDC work items, approvals, follow-ups)
// ---------------------------------------------------------------------------

export interface WorkTask {
  taskId: TaskId;
  tenantId: TenantId;
  dealerId: DealerId;
  kind: 'call' | 'follow_up' | 'approval' | 'appraisal' | 'listing_fix' | 'review_request' | 'other';
  subject: string;
  relatedTo?: { leadId?: LeadId; customerId?: CustomerId; vehicleId?: VehicleId; opportunityId?: OpportunityId };
  assigneeUserId?: UserId;
  status: 'open' | 'in_progress' | 'done' | 'skipped';
  dueAt?: IsoTimestamp;
  createdBy: 'human' | 'agent' | 'system';
  receiptId?: ReceiptId;
}
