/**
 * BUDGET WHEELS DEALEROS — demandara/demandara.test (BUILD PACKET, V1)
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only. Deterministic tests for Module 10.
 *
 * Full-loop test with a stub ProofEmitterPort: campaign → 2 lead intakes (one
 * duplicate contact) → redacted context → reply/appointment drafts (always
 * pending human approval) → follow-up plan + opt-out pause → sold/lost
 * outcomes → revenue attribution → claim-safe proof report → idempotency.
 * All fixture people are fake; contact values use reserved example ranges.
 */

import assert from 'node:assert/strict';
import type { IsoTimestamp, UserId, Vehicle } from '../schemas/core';
import { PROOF_REPORT_DISCLAIMER } from './api-contracts';
import type { LeadIntakeRequest } from './api-contracts';
import {
  DEMANDARA_ACTOR_ID,
  InMemoryDemandaraAdapter,
  type ProofEmitInput,
  type ProofEmitterPort,
} from './service';

// ---------------------------------------------------------------------------
// Stub proof emitter — collects every emitted event for assertions
// ---------------------------------------------------------------------------

class StubProofEmitter implements ProofEmitterPort {
  readonly emitted: { input: ProofEmitInput; timestamp: IsoTimestamp; receiptId: string }[] = [];
  private counter = 0;

  emit(input: ProofEmitInput, timestamp: IsoTimestamp): { receiptId: string } {
    const receiptId = 'stub_rcpt_' + String(++this.counter).padStart(4, '0');
    this.emitted.push({ input, timestamp, receiptId });
    return { receiptId };
  }

  byType(eventType: ProofEmitInput['eventType']): ProofEmitInput[] {
    return this.emitted.filter((e) => e.input.eventType === eventType).map((e) => e.input);
  }
}

// ---------------------------------------------------------------------------
// Fixtures (all fake / reserved values; deterministic timestamps)
// ---------------------------------------------------------------------------

const TENANT = 't_bw_demo';
const DEALER = 'd_bw_demo';
const ROOFTOP = 'r_bw_main';
const APPROVER: UserId = 'user_sales_mgr_01';

const BASE_MS = Date.parse('2026-07-03T18:00:00Z');
function at(minutes: number): IsoTimestamp {
  return new Date(BASE_MS + minutes * 60_000).toISOString().replace('.000Z', 'Z');
}

function makeVehicle(): Vehicle {
  return {
    vehicleId: 'veh_rav4_001',
    tenantId: TENANT,
    dealerId: DEALER,
    rooftopId: ROOFTOP,
    vin: '2T3ZFREV0KW999999', // fake VIN, fixture only
    stockNumber: 'BW-1001',
    year: 2019,
    make: 'Toyota',
    model: 'RAV4',
    trim: 'LE',
    bodyStyle: 'suv',
    drivetrain: 'awd',
    fuel: 'gas',
    mileageKm: 84210,
    askingPrice: { amountCents: 1899500, currency: 'CAD' },
    status: 'available',
    statusChangedAt: at(0),
    photos: [],
    features: ['heated seats', 'backup camera'],
    disclosures: [],
    externalRefs: [],
    merchandising: { daysInInventory: 12, listingCompletenessScore: 80, merchandisingScore: 75 },
  };
}

function makeLeadRequest(overrides: Partial<LeadIntakeRequest> & { idempotencyKey: string }): LeadIntakeRequest {
  return {
    tenantId: TENANT,
    dealerId: DEALER,
    rooftopId: ROOFTOP,
    source: 'website_form',
    sourceDetail: 'demandara_campaign',
    utm: { source: 'google', medium: 'organic', campaign: 'july_seo' },
    contact: { firstName: 'Jordan', lastName: 'Testcase', email: 'jordan.testcase@example.com' },
    consent: { channel: 'email', basis: 'express', capturedAt: at(5), source: 'website_form:test_drive' },
    interest: { vehicleId: 'veh_rav4_001' },
    occurredAt: at(5),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const stub = new StubProofEmitter();
  const adapter = new InMemoryDemandaraAdapter(stub, {
    tenantId: TENANT,
    dealerId: DEALER,
    rooftopId: ROOFTOP,
    dealerDisplayName: 'Budget Wheels (Internal Demo)',
    defaultCurrency: 'CAD',
    idSeed: 1,
  });
  adapter.seedVehicles([makeVehicle()]);

  // --- campaign registered by Demandara → pending_approval + receipt --------
  const campaign = adapter.registerCampaign(
    {
      tenantId: TENANT,
      idempotencyKey: 'camp-1',
      dealerId: DEALER,
      name: 'July Local SEO Push',
      channel: 'seo_page',
      createdBy: 'demandara',
      utmCampaign: 'july_seo',
    },
    at(0),
  );
  assert.equal(campaign.status, 'pending_approval');
  assert.equal(stub.byType('campaign_generated').length, 1);
  console.log('ok: demandara-created campaign is pending_approval with a campaign_generated receipt');

  // --- lead 1: brand-new contact --------------------------------------------
  const lead1Request = makeLeadRequest({
    idempotencyKey: 'lead-1',
    campaignId: campaign.campaignId,
    contact: {
      firstName: 'Jordan',
      lastName: 'Testcase',
      email: 'jordan.testcase@example.com',
      phone: '+1 604 555 0100', // reserved fictional number
    },
    interest: {
      vehicleId: 'veh_rav4_001',
      freeText: 'Hi, this is Jordan Testcase — call me at 604 555 0100 about the AWD one.',
    },
  });
  const lead1 = adapter.intakeLead(lead1Request, at(5));
  assert.equal(lead1.duplicateOfCustomerId, undefined);
  assert.equal(stub.byType('customer_created').length, 1);
  assert.equal(stub.byType('consent_captured').length, 1);
  assert.equal(stub.byType('lead_received').length, 1);
  console.log('ok: lead 1 intake created customer + traffic event + lead with receipts');

  // --- lead 2: duplicate contact (same email, different name/phone) ---------
  const lead2 = adapter.intakeLead(
    makeLeadRequest({
      idempotencyKey: 'lead-2',
      campaignId: campaign.campaignId,
      source: 'website_chat',
      contact: { firstName: 'Jordy', lastName: 'T.', email: 'Jordan.Testcase@Example.com' },
      interest: { vehicleId: 'veh_rav4_001' },
      occurredAt: at(10),
    }),
    at(10),
  );
  assert.equal(lead2.customerId, lead1.customerId);
  assert.equal(lead2.duplicateOfCustomerId, lead1.customerId);
  assert.notEqual(lead2.leadId, lead1.leadId);
  assert.equal(adapter.customers.size, 1);
  assert.equal(adapter.leads.size, 2);
  assert.equal(stub.byType('duplicate_detected').length, 1);
  assert.equal(stub.byType('customer_created').length, 1); // no second customer
  const sharedCustomer = adapter.customers.get(lead1.customerId);
  assert.ok(sharedCustomer?.duplicateClusterKey?.startsWith('dupc_'));
  console.log('ok: duplicate contact linked to existing customer, cluster key set, duplicate_detected emitted');

  // --- idempotency: same idempotencyKey twice → same leadId, no new records -
  const countsBefore = { leads: adapter.leads.size, emitted: stub.emitted.length };
  const lead1Retry = adapter.intakeLead(lead1Request, at(12));
  assert.deepEqual(lead1Retry, lead1);
  assert.equal(adapter.leads.size, countsBefore.leads);
  assert.equal(stub.emitted.length, countsBefore.emitted);
  console.log('ok: idempotent retry returned the same leadId and created no double records');

  // --- context pack: redacted, no raw PII -----------------------------------
  const context = adapter.getContext({ tenantId: TENANT, leadId: lead1.leadId }, at(15));
  const contextJson = JSON.stringify(context).toLowerCase();
  for (const banned of ['jordan', 'testcase', 'example.com', '5550100', '555 0100', '604']) {
    assert.ok(!contextJson.includes(banned), `context pack leaked PII fragment: ${banned}`);
  }
  assert.ok(context.customerRefRedacted.startsWith('cust_'));
  assert.notEqual(context.customerRefRedacted, String(lead1.customerId));
  assert.equal(context.stage, 'new');
  assert.equal(context.interestVehicles.length, 1);
  assert.equal(context.interestVehicles[0].make, 'Toyota');
  assert.equal(context.interestVehicles[0].model, 'RAV4');
  assert.equal(context.interestVehicles[0].askingPrice.amountCents, 1899500);
  assert.equal(context.interestVehicles[0].status, 'available');
  assert.equal(context.consentSummary.email, 'granted');
  assert.equal(context.dealerDisplayName, 'Budget Wheels (Internal Demo)');
  assert.ok(context.recentActivity.length > 0);
  assert.equal(stub.byType('inventory_context_used').length, 1);
  console.log('ok: context pack has redacted ref + vehicle facts and NO raw name/email/phone/free-text');

  // --- reply draft: never auto-sent, claim-safe text enforced ---------------
  const replyDraft = adapter.createReplyDraft(
    {
      tenantId: TENANT,
      idempotencyKey: 'reply-1',
      leadId: lead1.leadId,
      channel: 'email',
      intentSummary: 'answer availability question and offer a test drive time',
      proposedText: 'Thanks for reaching out — that vehicle is currently available. Would a short test drive this week work for you?',
    },
    at(20),
  );
  assert.equal(replyDraft.status, 'pending_human_approval');
  assert.equal(replyDraft.requiresHumanApproval, true);
  assert.equal(stub.byType('ai_reply_drafted').length, 1);
  assert.throws(
    () =>
      adapter.createReplyDraft(
        {
          tenantId: TENANT,
          idempotencyKey: 'reply-bad',
          leadId: lead1.leadId,
          channel: 'email',
          intentSummary: 'close the deal',
          proposedText: 'We guarantee the lowest price in town!',
        },
        at(21),
      ),
    /claim-unsafe/,
  );
  const replyRetry = adapter.createReplyDraft(
    {
      tenantId: TENANT,
      idempotencyKey: 'reply-1',
      leadId: lead1.leadId,
      channel: 'email',
      intentSummary: 'answer availability question and offer a test drive time',
      proposedText: 'Thanks for reaching out — that vehicle is currently available. Would a short test drive this week work for you?',
    },
    at(22),
  );
  assert.equal(replyRetry.draftId, replyDraft.draftId);
  assert.equal(stub.byType('ai_reply_drafted').length, 1);
  console.log('ok: reply draft is pending human approval, claim-unsafe text rejected, retries idempotent');

  // --- appointment draft: status draft, draftedBy agent ---------------------
  const appointmentDraft = adapter.createAppointmentDraft(
    {
      tenantId: TENANT,
      idempotencyKey: 'appt-1',
      leadId: lead1.leadId,
      kind: 'test_drive',
      scheduledFor: at(2 * 24 * 60),
      vehicleId: 'veh_rav4_001',
    },
    at(25),
  );
  assert.equal(appointmentDraft.status, 'draft');
  assert.equal(appointmentDraft.draftedBy, 'agent');
  assert.equal(appointmentDraft.requiresHumanApproval, true);
  assert.equal(stub.byType('appointment_drafted').length, 1);
  const storedAppointment = adapter.appointments.get(appointmentDraft.appointmentId);
  assert.equal(storedAppointment?.status, 'draft');
  assert.equal(storedAppointment?.draftedBy, 'agent');
  console.log('ok: appointment draft stored as draft/agent with appointment_drafted receipt');

  // --- human approval + confirmation ----------------------------------------
  adapter.approveReplyDraft(replyDraft.draftId, APPROVER, at(30));
  assert.equal(stub.byType('human_approval_granted').length, 1);
  adapter.confirmAppointment(appointmentDraft.appointmentId, APPROVER, at(35));
  assert.equal(stub.byType('appointment_confirmed').length, 1);
  assert.equal(adapter.appointments.get(appointmentDraft.appointmentId)?.status, 'confirmed');
  assert.equal(adapter.leads.get(lead1.leadId)?.stage, 'appointment_set');
  assert.equal(adapter.leads.get(lead1.leadId)?.aiAssistedAppointment, true);
  console.log('ok: named human approved the reply draft and confirmed the appointment (receipted)');

  // --- follow-up plans: active for lead 1, paused on opt-out for lead 2 -----
  const followUp1 = adapter.upsertFollowUpPlan(
    {
      tenantId: TENANT,
      idempotencyKey: 'fu-lead1-1',
      leadId: lead1.leadId,
      cadence: [
        { dayOffset: 1, channel: 'email', templateKey: 'day1_checkin' },
        { dayOffset: 3, channel: 'email', templateKey: 'day3_options' },
      ],
    },
    at(40),
  );
  assert.equal(followUp1.planStatus, 'active');
  assert.equal(followUp1.nextTouchAt, at(40 + 24 * 60));
  const followUp2 = adapter.upsertFollowUpPlan(
    {
      tenantId: TENANT,
      idempotencyKey: 'fu-lead2-1',
      leadId: lead2.leadId,
      cadence: [{ dayOffset: 2, channel: 'email', templateKey: 'day2_checkin' }],
    },
    at(45),
  );
  assert.equal(followUp2.planStatus, 'active');
  adapter.recordOptOut(lead2.leadId, 'email', at(50));
  assert.equal(adapter.leads.get(lead2.leadId)?.followUpPlan?.pausedReason, 'opt_out');
  const followUp2AfterOptOut = adapter.upsertFollowUpPlan(
    {
      tenantId: TENANT,
      idempotencyKey: 'fu-lead2-2',
      leadId: lead2.leadId,
      cadence: [{ dayOffset: 2, channel: 'email', templateKey: 'day2_checkin' }],
    },
    at(55),
  );
  assert.equal(followUp2AfterOptOut.planStatus, 'paused');
  assert.equal(followUp2AfterOptOut.pausedReason, 'opt_out');
  assert.equal(followUp2AfterOptOut.nextTouchAt, undefined);
  console.log('ok: follow-up plan active for lead 1; opt-out revokes consent and pauses lead 2 plans');

  // --- outcomes: lead 1 sold with attribution, lead 2 lost ------------------
  const soldOutcome = adapter.recordOutcome(
    lead1.leadId,
    { result: 'sold', vehicleId: 'veh_rav4_001', salePrice: { amountCents: 1899500, currency: 'CAD' } },
    at(60),
  );
  assert.ok(soldOutcome.dealId);
  assert.equal(stub.byType('sold_marked').length, 1);
  const deal = adapter.deals.get(soldOutcome.dealId as NonNullable<typeof soldOutcome.dealId>);
  assert.equal(deal?.attribution?.lastTouch.campaignId, campaign.campaignId);
  assert.equal(deal?.attribution?.aiAssisted, true);
  adapter.recordOutcome(lead2.leadId, { result: 'lost', lostReason: 'no_response' }, at(65));
  assert.equal(stub.byType('lost_reason_recorded').length, 1);
  console.log('ok: sold outcome created a deal with campaign attribution; lost outcome recorded a reason');

  // --- GET /outcomes since a timestamp ---------------------------------------
  const outcomes = adapter.getOutcomes({ tenantId: TENANT, since: '2026-07-01T00:00:00Z' });
  assert.equal(outcomes.rows.length, 2);
  const lead1Row = outcomes.rows.find((r) => r.leadId === lead1.leadId);
  const lead2Row = outcomes.rows.find((r) => r.leadId === lead2.leadId);
  assert.equal(lead1Row?.stage, 'sold');
  assert.equal(lead1Row?.sold, true);
  assert.equal(lead1Row?.soldDealId, soldOutcome.dealId);
  assert.deepEqual(lead1Row?.appointmentStates, ['confirmed']);
  assert.ok((lead1Row?.receiptsCount ?? 0) >= 5);
  assert.equal(lead2Row?.lost, true);
  assert.equal(lead2Row?.lostReason, 'no_response');
  const sinceLater = adapter.getOutcomes({ tenantId: TENANT, since: at(61) });
  assert.equal(sinceLater.rows.length, 1); // only lead 2 changed after the sale
  console.log('ok: outcomes endpoint returns per-lead stage/appointments/sold-lost/receipt counts since a timestamp');

  // --- revenue attribution from Deal.attribution -----------------------------
  const attribution = adapter.getRevenueAttribution({ tenantId: TENANT });
  const campaignRow = attribution.rows.find((r) => r.campaignId === campaign.campaignId);
  assert.ok(campaignRow, 'expected an attribution row for the campaign');
  assert.equal(campaignRow.leads, 2);
  assert.equal(campaignRow.appointments, 1);
  assert.equal(campaignRow.shows, 0);
  assert.equal(campaignRow.sold, 1);
  assert.deepEqual(campaignRow.gross, { amountCents: 1899500, currency: 'CAD' });
  assert.equal(campaignRow.aiAssistedCount, 1);
  console.log('ok: revenue attribution shows the campaign with sold:1, gross sum, and aiAssistedCount:1');

  // --- proof report: totals backed by receipts, fixed disclaimer -------------
  const report = adapter.getProofReport({
    tenantId: TENANT,
    periodStart: '2026-07-01T00:00:00Z',
    periodEnd: '2026-07-31T23:59:59Z',
  });
  assert.deepEqual(report.totals, {
    leadsReceived: 2,
    aiDraftsCreated: 2, // 1 reply draft + 1 appointment draft
    humanApprovedDrafts: 1,
    appointmentsConfirmed: 1,
    sold: 1,
  });
  const reportCampaignRow = report.perCampaign.find((r) => r.campaignId === campaign.campaignId);
  assert.equal(reportCampaignRow?.leadsReceived, 2);
  assert.equal(reportCampaignRow?.appointmentsConfirmed, 1);
  assert.equal(reportCampaignRow?.sold, 1);
  assert.equal(reportCampaignRow?.gross.amountCents, 1899500);
  assert.equal(report.receiptIds.length, stub.emitted.length);
  assert.equal(report.disclaimer, PROOF_REPORT_DISCLAIMER);
  assert.ok(/unaudited/i.test(report.disclaimer));
  assert.ok(/internal/i.test(report.disclaimer));
  assert.equal(report.requiresHumanApproval, true);
  assert.equal(report.period.label, '2026-07');
  console.log('ok: proof report totals match the receipt log, every receipt is listed, disclaimer is fixed and claim-safe');

  // --- global governance invariants over every emitted receipt ---------------
  for (const { input } of stub.emitted) {
    assert.equal(input.externalSideEffect, false);
    assert.ok(input.customerRefRedacted.startsWith('cust_'));
    assert.equal(input.tenantId, TENANT);
  }
  assert.ok(stub.emitted.some((e) => e.input.actorId === DEMANDARA_ACTOR_ID));
  assert.equal(stub.emitted.length, 18);
  console.log('ok: every receipt is tenant-scoped, redacted, and records zero external side effects (18 receipts total)');

  console.log('ALL DEMANDARA PACKET CHECKS PASSED');
}

main();
