# DEALEROS DEALERMINE-STYLE CRM + BDC SPEC (MODULES 2, 5, 8)

STATUS: INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.

Owner: Muhammad Firoz · Date: 2026-07-03 · Version: V1

## 1. Purpose and scope

This is the product spec for the sales CRM (Module 2 Customer 360), the lead
pipeline / Sales Closer (Module 5), and the service CRM / BDC layer (Module 8)
of Budget Wheels DealerOS. It adopts the workflow patterns DealerMine proved in
the Canadian market (per `research/dealermine.md`) and rebuilds them for
independents, AI-first drafting, and Cognitia proof receipts. Tenant-zero is
Budget Wheels (independent used-car dealer, Vancouver BC, no service
department) — every feature here must degrade gracefully to that avatar.

Canonical type vocabulary: `build-packets/schemas/core.ts`. Reference adapter
behavior (dedup, consent upsert, opt-out pause, draft gating):
`build-packets/demandara/service.ts`. Module boundaries:
`DEALEROS_FEATURE_MAP_AND_MODULE_ARCHITECTURE_V1.md`. Competitive framing:
`DEALEROS_COMPETITOR_RESEARCH_MATRIX_V1.md` and
`BUDGET_WHEELS_DEALEROS_EXECUTIVE_STRATEGY_V1.md`. Tenancy/RBAC assumptions:
`DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md`. CASL/PIPEDA/PIPA mechanics:
`research/canada-compliance.md`.

Non-goals of this doc: desking math, inventory merchandising (Module 3),
website/demand-gen (Module 9), equity scoring internals (Module 7 packet).

## 2. Customer 360 record (Module 2)

The Customer 360 screen renders exactly the `Customer` interface in
`build-packets/schemas/core.ts` — no shadow fields, no screen-only state.

### 2.1 Record composition

| Panel | Backing type (core.ts) | Notes |
|---|---|---|
| Identity | `Customer.firstName/lastName`, `householdId`, `preferredLanguage`, `tags` | PII-marked fields never leave DealerOS unredacted |
| Contact methods | `ContactMethod[]` (`kind`, `value`, `verified`, `preferred`, `doNotContact`) | `doNotContact` is a per-method hard block, independent of consent |
| Consent | `ConsentRecord[]` per channel (`email/sms/voice/mail`) | See 2.2; one record per channel, newest evidence wins (upsert rule from `service.ts upsertConsent`) |
| Segment | `Customer.segment` | `prospect / active_lead / sold_customer / service_only / orphan_owner / inactive` — drives campaign eligibility (Section 5) |
| Owned vehicles | `OwnedVehicle[]` | Equity-mining substrate: `acquisition`, `finance` (kind/term/maturity), `warrantyEndDate`, `lastServiceAt`, mileage-as-of |
| Activity timeline | Traffic events, leads, appointments, tasks, receipts | Every entry links its `receiptId` |
| Privacy | `Customer.privacy` (`deleteRequestedAt`, `exportRequestedAt`, `anonymizedAt`) | Delete/export requests create manager tasks with SLA timers |
| Duplicates | `Customer.duplicateClusterKey` | Presence of a cluster key surfaces the merge-review banner (Section 3) |

### 2.2 CASL-aware consent model (defaults)

`ConsentRecord` fields: `channel`, `status` (`granted/implied/revoked/unknown`),
`basis` (`express/implied_ebr/implied_inquiry/none`), `capturedAt`,
`expiresAt`, `source`, `receiptId`.

1. **Express** (`basis: express`, `status: granted`): does not expire;
   `expiresAt` unset. Revocable any time.
2. **Implied — existing business relationship** (`implied_ebr`): default
   `expiresAt = capturedAt + 24 months` (purchase/formal agreement window per
   `research/canada-compliance.md`). Rolls forward on each new qualifying
   event (new purchase, new signed agreement).
3. **Implied — inquiry** (`implied_inquiry`): default `expiresAt = capturedAt
   + 6 months`. Rolls forward on each new inbound inquiry from the customer.
4. **None/unknown**: channel is send-blocked. Unknown is not implied.
5. Expiry is evaluated at send time, not at plan-creation time. An expired
   implied consent flips effective status to `unknown` and blocks the send.
6. Alerts (per-tenant, on by default): `consent_expiring_30d`,
   `consent_expired_blocked`, `implied_basis_renewed` — each raises a
   `WorkTask` (kind `follow_up`) proposing a claim-safe express-consent ask.
7. Every consent change (capture, renewal, revocation, expiry-block) emits a
   `consent_captured` receipt; the record stores that `receiptId` so the
   burden-of-proof query "show me the evidence for this send" is one join.

NEEDS_EXTERNAL_RESEARCH: exact CRTC record-keeping guidance text must be
re-verified against primary CRTC pages before defaults 2–3 are finalized
(fetch was blocked; see `research/canada-compliance.md`). Defaults above are
design placeholders pending legal counsel review.

SKIPPED_WITH_REASON: legal sign-off on the consent-basis state machine and the
express-consent ask templates requires legal counsel; not performed here.

## 3. Duplicate detection + merge review

Detection follows the reference implementation in
`build-packets/demandara/service.ts` (`intakeLead` contact index) and extends it.

1. **Deterministic pass (V1, at intake):** normalized email
   (`trim().toLowerCase()`) and normalized phone (digits only) are indexed;
   any hit links the new lead to the existing customer, stamps
   `duplicateClusterKey = 'dupc_' + sha256(matchedKey)[0..10]`, merges contact
   methods idempotently, and emits a `duplicate_detected` receipt. No records
   are auto-merged.
2. **Fuzzy pass (V1.1, nightly batch):** candidate pairs on (last name +
   postal code), (first initial + phone suffix), (household address). Output
   is cluster suggestions only — never auto-links.
3. **Merge review queue:** any customer with a `duplicateClusterKey` appears
   in a manager queue. The reviewer sees a field-by-field diff (contact
   methods, consents, owned vehicles, segment, open leads) and chooses
   survivor + field winners.
4. **Merge rules:** consents merge conservatively — for each channel keep the
   *most restrictive* effective status (`revoked` beats `granted` beats
   `implied` beats `unknown`... revoked always wins); `doNotContact: true` on
   any method survives; owned vehicles union by VIN; open leads re-parent to
   the survivor; the loser record is tombstoned (not deleted) with a pointer.
5. **Receipts:** merge execution emits `crm_updated` with actor
   `human:<userId>`; the tombstone stores the receipt id. Undo = re-split from
   tombstone within 30 days (default), also receipted.

Acceptance criteria: same email or phone twice never creates a second
customer (proven by `service.ts` idempotency + index behavior); no merge
occurs without a named human; a merged record's consent is never more
permissive than either input.

## 4. Lead pipeline and Sales Closer flow (Module 5)

### 4.1 Stage definitions (core.ts `LeadStage`)

| Stage | Entry condition | Exit paths | Default SLA/timer |
|---|---|---|---|
| `new` | Lead created from a traffic event | `working`, `lost` | First response due 15 min (internet), per-source table in traffic-desk packet |
| `working` | First touch drafted/made | `qualified`, `dormant`, `lost` | Next touch scheduled within 24 h |
| `qualified` | Qualification fields minimally complete (4.2) | `appointment_set`, `dormant`, `lost` | Appointment proposed within 48 h |
| `appointment_set` | Human confirmed an appointment | `shown`, `lost` (no-show reroutes via rebooking, Section 5) | Confirmation touch T-24 h and T-2 h |
| `shown` | Visit/test-drive completed | `negotiating`, `lost` | Same-day recap task |
| `negotiating` | Numbers discussed / trade appraised | `deal_draft`, `lost` | Manager visibility ≥ 48 h in stage |
| `deal_draft` | Deal record in `draft/pending_approval` | `sold`, `lost` | Manager approval gate |
| `sold` | Deal `signed`; `sold_marked` receipt | terminal (post-sale flows in Section 5) | — |
| `lost` | `LostReason` recorded (mandatory) | may resurrect to `working` | Resurrection review at 30/90 days |
| `dormant` | No response after full cadence | resurrect or archive | Quarterly resurrection candidate list |

Stage changes are events: each transition emits a `crm_updated` receipt and
stamps `stageChangedAt`.

### 4.2 Qualification fields (core.ts `LeadQualification`)

Required for `qualified`: `intent` (not `unknown`), one of `budgetRange` or
`desiredVehicle`, `hasTradeIn` answered, `needsFinancing` answered,
`timeline` set. AI may pre-fill from conversation text with per-field
confidence; pre-filled values render as "AI-suggested" until a human confirms
or the customer states them explicitly.

### 4.3 Objection tracking

`Lead.objections[]` uses a controlled code list (V1): `price`, `payment`,
`trade_value`, `vehicle_condition`, `financing_fear`, `timing`, `spouse_partner`,
`shopping_competitor`, `trust`, `other`. Each objection can attach a
claim-safe rebuttal draft (AI-suggested, human-approved). Objection frequency
per vehicle and per source feeds manager coaching reports.

### 4.4 Follow-up plans

`FollowUpPlan` (core.ts): cadence steps `{dayOffset, channel, templateKey}`.
Default new-internet-lead cadence (tenant-editable): day 0 SMS + email, day 1
call task, day 3 SMS, day 7 email, day 14 call task, day 21 email, then
`dormant`. Plan pauses (`pausedReason`) on `opt_out`, `human_hold`, `sold`,
`lost` — matching `service.ts` (`upsertFollowUpPlan`, `recordOptOut`,
`pausePlan`). A plan whose cadence includes a channel with revoked consent is
stored PAUSED at creation, exactly as the reference adapter does.

### 4.5 Human approval gates (hard, V1)

1. No outbound message (SMS/email/voice/mail) sends without a named human
   approval — reply drafts are `pending_human_approval` by construction.
2. Approval is not a send: sending still passes the communication-rules gate
   (Section 9) at send time. This is two independent checks.
3. Appointment drafts (`draftedBy: 'agent'`) require human confirmation before
   any outbound confirmation message (core.ts `Appointment.status` machine).
4. Deal drafts require manager approval to reach `pending_approval → signed`.
5. Stage skips of more than one stage require a manager role.

## 5. Named campaign taxonomy (adopted from DealerMine, consent-checked)

`research/dealermine.md` verified five recurring service-campaign reasons.
DealerOS ships them as first-class named campaign types (not free-form
blasts), each with per-type outcome reporting, plus sales-side siblings.
DealerMine's batch-blast paradigm is replaced by per-recipient consent checks:
**a campaign is a query + template + gate, and every individual message is
separately consent-evaluated and receipted at send time.**

| Campaign type (key) | Trigger query | Default channel order | Independent-dealer degradation (Section 8) |
|---|---|---|---|
| `service_due` | `OwnedVehicle.lastServiceAt` age or mileage interval | SMS → email | Runs off owned-vehicle age/mileage estimates; offers partner-shop referral instead of RO booking |
| `declined_work` | Declined-service items on file | Call task → SMS | Only if a service connector or manual service notes exist; otherwise hidden |
| `recall_follow_up` | Open recall flag on an owned VIN | Call task → SMS → mail | Recall lookup is a connector (mock default); degrades to "check with manufacturer" claim-safe template |
| `appointment_confirmation` | Appointment `confirmed`, T-24 h / T-2 h | SMS → voice | Works for sales visits/test drives, not just service |
| `missed_appointment_rebooking` | Appointment `no_show` | Call task same day → SMS day 1 | Identical for sales; feeds TMS no-show accountability |
| `lost_lead_resurrection` (sales sibling) | `lost`/`dormant` 30/90 days, reason ≠ `bought_elsewhere` recent | Email → SMS | Native |
| `equity_upgrade` (sales sibling) | Module 7 `OpportunityScore` band `hot` | Call task → SMS | Native — scores on finance term/mileage/inventory match, no RO data needed |

Rules for all types:

1. Recipient set is computed at send time, per message: effective consent for
   the step's channel must be `granted` or unexpired `implied`; `doNotContact`
   methods excluded; quiet hours applied (Section 9).
2. Every generated message is a draft in the BDC queue (Section 6) —
   campaigns produce work items, not sends. Batch human approval is allowed
   (approve N drafts at once) but each send gets its own receipt.
3. Campaign registration follows `service.ts registerCampaign`: agent-created
   campaigns land `pending_approval`, never self-activate.
4. The DealerMine recall-check-in-the-booking-flow pattern is adopted: every
   appointment-draft flow runs a context lookup (open recalls, declined work,
   equity flag) so the human sees upsell context inside the same interaction.
5. Per-type outcome reporting: sent → replied → booked → shown → revenue
   proxy, reconciled to receipts (never asserted aggregates; see
   `research/dealermine.md` on the unaudited "18%" claim we will not imitate).

SKIPPED_WITH_REASON: recall data source selection (manufacturer APIs /
Transport Canada feed) requires vendor contracts and a live API; connector
stays mock with a fixture recall list.

## 6. BDC workflows (work queues, call tasks, scripts, call summary AI)

### 6.1 Work queues

All BDC work is `WorkTask` (core.ts). Queues are saved filters over tasks:

| Queue | Contents | Default sort |
|---|---|---|
| Hot inbound | `new` leads inside SLA window | `firstResponseDueAt` ascending |
| Drafts awaiting approval | Reply/appointment/campaign drafts `pending_human_approval` | Oldest first |
| Call tasks | `kind: call` (campaign-generated + follow-up plan + equity NBA) | `dueAt`, then opportunity band |
| Confirmations | `appointment_confirmation` touches due | Appointment time |
| Rebooking | No-show tasks | Same-day first |
| Merge review | Duplicate clusters (Section 3) | Cluster age |
| Consent housekeeping | `consent_expiring_30d` tasks | Expiry date |

Assignment: round-robin within team by default; managers can pin. Every task
completion records disposition + optional next task; skips require a reason
(`status: skipped` is receipted).

### 6.2 Call tasks and scripts as drafts

Scripts are versioned templates (prompt/version registry, Module 13) rendered
per task with lead context. They are **drafts/talking points, not verbatim
mandates**: the human on the phone owns the words. Script rendering never
includes raw PII in any external model call (redaction gate per core.ts PII
markers). Each script version carries a claim-safety lint (same deny-list
approach as `assertClaimSafeDraftText` in `service.ts` — no guarantees, no
"certified", no "100%").

### 6.3 Call summary AI

After a call, the associate dictates or types raw notes; the AI produces a
structured summary: intent, qualification field updates (suggested),
objections (coded), next best action, and a draft follow-up message. Human
accepts/edits before anything persists to qualification fields. Summary
creation emits a receipt (`crm_updated`); any resulting outbound draft emits
`ai_reply_drafted`. Live call transcription/recording is out of V1 scope.

SKIPPED_WITH_REASON: call recording and transcription require a telephony
vendor contract, consent-to-record legal review (two-party consent analysis
for BC), and a live API; V1 ships typed/dictated notes only.

## 7. "Managed BDC" as AI + human approval (replacing call-centre headcount)

DealerMine's moat is people in Saint John making 100+ calls/agent/day
(`research/dealermine.md`). DealerOS replaces the labour line with a
software-scaled equivalent, claim-safe by construction:

1. **AI does the volume:** instant lead response drafts, campaign message
   drafts, reply triage by intent (DealerMine Batch Texting's intent-bucket
   pattern), call summaries, resurrection drafts — all as
   `pending_human_approval` items.
2. **Humans do the sends and the phones:** the dealer's own staff (or a
   partner call centre via connector, mock-mode default) approve drafts and
   place calls. Drafts only; humans send. No autonomous outbound in V1.
3. **Accountability is per actor, automatically:** receipts carry `actor_type`
   + `actor_id` (+ `agent_passport_id` / `human_approver_id`), so DealerMine's
   bespoke "Lost Sales by BDC Associate" report is a standing query with human
   AND AI actor rows in the same table — productized, not hand-built.
4. **Adoption ramp mirrors MORI's deployment modes:** start with after-hours
   drafting only, then overflow, then all inbound — a per-tenant setting.
5. **Economics claim (internal only):** software drafting plus dealer-staff
   approval targets a cost structure a services BDC cannot match and scales
   down to a 2-person independent. This is a design thesis, not a public
   claim, and carries no performance guarantee.

SKIPPED_WITH_REASON: voice-agent provider selection (MORI-equivalent inbound
answering) requires vendor evaluation contracts and live telephony; Module 12
connector slot reserved, mock fixtures only.

## 8. Service CRM bridge for independents WITHOUT a service department

DealerMine's flagship is thin for independents because it runs on franchise
DMS repair-order data (`research/dealermine.md`). Budget Wheels has no service
department, so Module 8 is designed as a bridge with explicit graceful
degradation:

| Capability | With service dept / connector | Budget Wheels degradation (no service dept) |
|---|---|---|
| Service history | RO feed via DMS connector | `OwnedVehicle.lastServiceAt` + customer-stated notes; optional partner-shop feed later |
| `service_due` campaigns | Interval from RO history | Interval from purchase date + estimated mileage; claim-safe "time for a check-up" language, referral to partner shop |
| `declined_work` campaigns | Declined-op codes from ROs | Hidden entirely (no data source; never fabricate) |
| `recall_follow_up` | Recall feed + booking | Recall lookup connector (mock); template advises manufacturer check; call task for hot equity customers |
| Service-to-sales leads | Service-drive equity alerts | Replaced by Module 7 equity mining on finance term age, mileage, warranty end, inventory match, website behavior — no RO data required |
| Advisor tasks | Service advisor role queues | Role hidden; tasks route to sales/BDC roles |
| Online service scheduling | Scheduler UI | Disabled; appointment kinds limited to `visit/test_drive/delivery/trade_appraisal` |

Degradation rules: features with no lawful data source are hidden, not
emptily displayed; no campaign type ever invents service facts; enabling a
service connector later re-lights each row without schema change (fields
already exist in core.ts).

## 9. Communication rules (every channel, every send)

The send-time gate — one function, one order, no exceptions:

1. **Hard blocks:** `privacy.deleteRequestedAt` set → block. Contact method
   `doNotContact` → block. Channel consent `revoked` → block.
2. **Consent basis:** effective status must be `granted` (express) or
   `implied` with `expiresAt` in the future. Expired implied → block + emit
   `consent_expired_blocked` task (Section 2.2).
3. **Human approval:** the specific draft must be approved by a named human
   (approval receipt id required on the send request).
4. **Quiet hours:** default 20:00–09:00 in the *rooftop's* IANA timezone
   (core.ts `Rooftop.timezone`); sends queue until the window opens. Voice
   call tasks additionally avoid Sundays by default. Tenant-editable within
   a floor (no sends 21:00–08:00, non-editable).
5. **Rate limits:** max 1 promotional message per customer per channel per
   72 h; confirmations/transactional touches exempt (default; tenant-editable).
6. **Template compliance:** every CEM template includes sender identification,
   dealer contact info, and a working unsubscribe/opt-out line (per
   `research/canada-compliance.md`: opt-out mechanism free, operational ≥ 60
   days, honored within 10 business days).
7. **Opt-out handling:** any channel opt-out (reply STOP, link, verbal note
   logged by staff) immediately sets `status: revoked`, pauses every affected
   follow-up plan for that customer (exactly `service.ts recordOptOut`
   semantics), emits a receipt, and honors across channels when the request
   says "stop contacting me" (global opt-out flag sets `doNotContact` on all
   methods).
8. **AI disclosure:** tenant `aiPolicy.aiDisclosureFooter` appended to
   AI-drafted messages per tenant policy.

## 10. Every touch emits receipts (Module 11 wiring)

Receipt map for this spec's surface (event vocabulary from CONTEXT_PACK.md
Module 11; emission pattern per `build-packets/demandara/service.ts`):

| Action | Event type | external_side_effect |
|---|---|---|
| Lead intake / customer create / dup match | `lead_received`, `customer_created`, `duplicate_detected` | n |
| Consent capture / renewal / opt-out / expiry block | `consent_captured` | n |
| AI reply or script/summary draft | `ai_reply_drafted` | n |
| Appointment draft / human confirm | `appointment_drafted`, `appointment_confirmed` | n |
| Draft approval | `human_approval_requested`, `human_approval_granted` | n |
| Actual outbound send (post-gate) | `followup_sent` | y — carries `consent_basis`, quiet-hours check result, `policy_gate_result` |
| Stage change / merge / qualification update | `crm_updated` | n |
| Sold / lost | `sold_marked`, `lost_reason_recorded` | n |
| Campaign registration/activation | `campaign_generated` | n |

Invariant: a `followup_sent` receipt must reference the `human_approval_granted`
receipt and the consent record relied upon. A send without that chain is a
policy violation surfaced on the manager dashboard.

## 11. KPIs (all receipt-derived, never asserted)

| KPI | Definition | V1 target (internal working target, not a public claim) |
|---|---|---|
| First-response time | Traffic event → first approved outbound, median | ≤ 15 min in-hours |
| Lead → appointment rate | `appointment_confirmed` / `lead_received` | Baseline first 60 days, then +improvement tracked |
| Show rate | `shown` / confirmed appointments | Baseline, then track vs confirmation-touch coverage |
| No-show rebooking rate | Rebooked within 7 days / no-shows | ≥ 30% working target |
| Draft approval latency | Draft created → human decision, median | ≤ 2 h in-hours |
| Draft edit rate | Approved-with-edits / approved (AI quality proxy) | Trend down |
| Consent coverage | Customers with valid consent on ≥ 1 channel / active customers | Trend up; blocked-send count trend down |
| Opt-out honor time | Opt-out received → all plans paused | ≤ 1 h (system), well inside 10 business days |
| Lost-reason completeness | Lost leads with a coded reason | Required on every lost lead (schema-enforced) |
| Per-actor accountability | Appointments, sends, lost leads by human AND AI actor | Standing report (Section 7.3) |
| Campaign outcome per type | Sent → replied → booked → shown, per Section 5 type | Per-type baseline |

## 12. Acceptance criteria (decision-ready checklist)

1. Customer 360 renders only core.ts fields; consent panel shows basis +
   expiry + evidence receipt link per channel.
2. Duplicate intake path matches `service.ts` behavior bit-for-bit in the
   reference tests; no auto-merge exists anywhere.
3. Every outbound path in code review shows the two independent gates
   (approval, then send-time communication rules) — one cannot substitute for
   the other.
4. All five DealerMine-derived campaign types + two sales siblings exist as
   named types with per-type outcome queries; none can send to a recipient
   whose effective consent fails at send time.
5. Budget Wheels tenant (no service connector) shows no `declined_work`
   campaign, no advisor role, no service scheduler — and no empty shells.
6. `followup_sent` receipts always chain approval + consent references
   (Section 10 invariant enforced by a ledger check).
7. KPIs in Section 11 are computable from receipts alone in the mock
   environment (no external data source required).

## 13. Open items

- SKIPPED_WITH_REASON: legal counsel review of consent defaults, opt-out
  templates, and call-recording consent — requires counsel.
- SKIPPED_WITH_REASON: recall data feed, telephony/voice vendor, partner call
  centre connector — require vendor contracts and live APIs; mock only.
- SKIPPED_WITH_REASON: implementation of queues/gates beyond the reference
  scaffolds — belongs in the dedicated DealerOS repo (`cognitiacloud/dealeros`,
  Week-1 roadmap item per CONTEXT_PACK.md Section 9), not this Library repo.
- NEEDS_EXTERNAL_RESEARCH: CRTC primary-source record-keeping text;
  DealerMine CASL consent workflow specifics; Gartner/DrivingSales review
  verbatims (all flagged in `research/dealermine.md` and
  `research/canada-compliance.md` — do not cite beyond what those files state).

## Boundaries honored

- INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.
- No live CRM/DMS writes, no live DealerMine/TMS/telephony integration; every
  connector referenced here is mock-mode by default, live mode gated by human
  approval + proof receipt.
- No dealership/customer outreach performed or implied; all outbound behavior
  specified as drafts requiring named-human approval before any send.
- No real customer PII used; examples and fixtures are fake/reserved.
- No unsupported compliance claims: CASL/PIPEDA/PIPA mechanics are design
  inputs pending legal counsel, not certifications; no "compliant" or
  "certified" claims made.
- No guarantees, no "#1", no production-ready language; KPI targets are
  internal working targets only.
- No vendor facts invented beyond `research/dealermine.md` and
  `research/canada-compliance.md`; unverifiable items carry
  NEEDS_EXTERNAL_RESEARCH.
- No crypto/token language; agent accountability uses internal receipts and
  passports only.
