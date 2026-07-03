# DEALEROS MODULE 4 — TMS TRAFFIC DESK: PRODUCT SPECIFICATION

STATUS: INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.

Owner: Muhammad Firoz · Date: 2026-07-03 · Version: V1

Scope: full product spec for Module 4 (TMS traffic desk) per `CONTEXT_PACK.md`.
Reference scaffolds: `build-packets/traffic-desk/sla.ts`, `assignment.ts`,
`state-machine.ts`, and the Module 4 shapes in `build-packets/schemas/core.ts`.
Competitive grounding: `research/tms-canada.md`. Siblings:
`DEALEROS_FEATURE_MAP_AND_MODULE_ARCHITECTURE_V1.md` (MVP cutline),
`BUDGET_WHEELS_DEALEROS_EXECUTIVE_STRATEGY_V1.md` (goal #1, gate T0-2),
`DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md`, `DEALEROS_DELIVERY_MEMO_V1.md`.

---

## 1. Purpose and accountability philosophy

The traffic desk is the atomic surface of DealerOS: every inbound contact or
visit becomes a `TrafficEvent` with timestamp, source, assignee, SLA timer,
outcome, and proof receipt. Every category vendor monetizes exactly this
object (`research/tms-canada.md`); DealerOS makes it the spine of the CRM.

**Root cause we attack.** The category's failure mode is not bad reports —
it is that traffic never gets logged. Lot Watch pitches that most dealers
lose 35–40% of floor traffic to non-logging; TraxSales sells cameras to
expose a claimed 15–25% gap (`research/tms-canada.md`). Every incumbent
answer adds hardware or people. Our answer removes the manual step:

1. **AI auto-creates traffic events** for every source with a software
   signal: calls, internet leads, website forms/chat, marketplace messages,
   after-hours contacts, partner pushes. The AI BDC (Module 6) summarizes
   and classifies; the system cannot receive these without logging them.
2. **Humans confirm walk-ins** — the only source with no inherent software
   signal. There the job shrinks from "fill in a desk-log form" to a one-tap
   confirm on the up-rotation screen ("who's up next" → tap → event exists,
   timestamped, assigned, receipted).
3. **Fairness makes salespeople want to log** (Section 5): the same tap that
   logs the walk-in protects the salesperson's turn on the floor — per
   `research/tms-canada.md`, salespeople resist logging until the system
   visibly protects their rotation.

**Named process standard.** Car Wars trains dealers on a branded standard
(CRISP — `research/tms-canada.md`). DealerOS names its own — **TRACE**
(internal name; no public use authorized) — and scores every event against it:

| Letter | Standard | Evidence checked |
|---|---|---|
| T | **T**imestamped capture | Event exists with `occurredAt` ≤ 5 min after signal (auto) or same visit (walk-in) |
| R | **R**esponse within SLA | `SlaState.firstRespondedAt` ≤ `firstResponseDueAt` |
| A | **A**ssignment on rotation | `assignedToUserId` set by rotation (not cherry-picked) |
| C | **C**ommitted next step | Appointment set, or outcome state advanced same day |
| E | **E**xplained ending | Terminal state reached with `dealId` (sold) or `lostReason` (lost) |

TRACE score = letters satisfied (0–5) per event; averages roll up per
salesperson/source/rooftop into the manager dashboard (Section 9) — a
coaching vocabulary, the real function of CRISP.

## 2. Traffic source taxonomy — all 10 `TrafficSourceKind` values

Canonical enum from `build-packets/schemas/core.ts`; capture mechanics
define who/what creates each `TrafficEvent`.

| # | Source | Created by | Capture mechanics | Human role |
|---|---|---|---|---|
| 1 | `phone` | System (auto) | Inbound call on tracked line → telephony connector (mock in V1) posts call metadata; AI BDC drafts call summary into `notes` (redacted before model call) | Confirm/annotate summary |
| 2 | `internet_lead` | System (auto) | ADF/XML or portal lead email parsed; `sourceDetail` (e.g. `"autotrader_ca"`), UTM and `campaignId` captured | None at capture |
| 3 | `walk_in` | Human (one tap) | Up-rotation screen: next salesperson taps "I'm up" → event created with `occurredAt = now`, assignee = tapper; optional consented check-in kiosk pre-fills customer | One tap; enrich later |
| 4 | `website_form` | System (auto) | DealerOS website form submit (Module 9) → event + UTM + `vehicleId` if VDP form; consent checkboxes write `ConsentRecord` | None at capture |
| 5 | `website_chat` | System (auto) | Chat session with contact intent → AI BDC transcript summary; anonymous window-shopping sessions do NOT create events (threshold: contact info or explicit request) | Takeover on escalation |
| 6 | `marketplace` | System (auto) | Marketplace message threads (FB Marketplace / Kijiji / AutoTrader, where connector permitted) polled via connector in mock mode; `sourceDetail` carries the marketplace | Reply approval |
| 7 | `after_hours` | System (auto) | Any auto-capturable signal arriving outside rooftop business hours is dual-tagged: `source: 'after_hours'`, original channel in `sourceDetail` (e.g. `"website_form"`) | Next-morning triage queue |
| 8 | `service_drive` | Human-assisted | Service advisor one-tap "sales interest" flag on a service appointment (Module 8 bridge); equity-mining hot scores (Module 7) can draft one for advisor confirmation | Advisor confirms |
| 9 | `referral` | Human | Logged by staff from the customer record ("referred by") — household linkage via `HouseholdId`; referral source customer recorded in `sourceDetail` | Full manual entry (rare, low volume) |
| 10 | `partner` | System (auto) | Demandara push via `POST /api/demandara/leads` (Module 10) or partner feed; carries `campaignId` + UTM lineage end-to-end | None at capture |

Design rules:

1. 8 of 10 sources are system-created; manual typing survives only for
   `referral` and the walk-in confirm tap.
2. Every event carries `sourceDetail`, `campaignId?`, `utm?` at creation —
   attribution is captured at the door, never reconstructed later.
3. Duplicate suppression: a `phone` call from a number attached to an open
   `internet_lead` event within 72h links to the existing event/lead via
   `customerId` dedup and emits a `duplicate_detected` receipt.
4. `after_hours` is a timing overlay, not a channel — reporting pivots on
   either the overlay or the underlying channel in `sourceDetail`.

## 3. First-response SLA policy

Mirrors `DEFAULT_SLA_POLICY` in `build-packets/traffic-desk/sla.ts` exactly —
tenant-zero defaults for the Budget Wheels avatar; rooftops override
per-tenant.

| Source | First response due | Why this default |
|---|---|---|
| `phone` | 5 min | A missed/mishandled call is the hottest perishable lead; 5 min covers callback on a missed ring. Car Wars built a company on this window (`research/tms-canada.md`) |
| `internet_lead` | 15 min | Portal leads are simultaneously shopped to competitors; 15 min is aggressive but achievable with AI-drafted, human-approved replies (Module 6) |
| `website_form` | 15 min | Same buyer behavior as internet leads; our own forms deserve at least portal-grade urgency |
| `website_chat` | 2 min | Chat is synchronous — the visitor is on the page now; past 2 min they are gone. AI BDC holds the session while a human is summoned |
| `marketplace` | 30 min | Marketplace shoppers message several dealers; expectations are slower than chat but a same-half-hour reply still differentiates |
| `walk_in` | 0 min | Immediate greet — due the instant the customer is on the floor. The timer exists so an *unassisted* walk-in becomes a breach that alerts a manager while the customer is still present (Lot Watch's one good idea, done without WiFi sniffing) |
| `service_drive` | 30 min | Customer is captive in the lounge ~1–2h; 30 min lets a salesperson reach them before pickup without ambushing the advisor's workflow |
| `referral` | 60 min | Warm and patient, but still same-hour: the referrer's credibility is on the line |
| `partner` | 60 min | Partner/Demandara-routed leads arrive pre-qualified with expectations set upstream; an hour keeps the partner SLA honest without starving hotter queues |
| `after_hours` | next business morning | Clock defers to `morningStartHour` (09:00) on the next business day; no fake "5-minute response" theater at 2 a.m. |

Mechanics (as implemented in `sla.ts`):

1. Business hours: Mon–Fri 09:00–18:00, **UTC placeholder** in the scaffold.
   SKIPPED_WITH_REASON: rooftop-timezone business-hours math
   (`Rooftop.timezone`, IANA, incl. DST) is deferred to the dedicated code
   repo per the file-header note in `sla.ts`.
2. Fixed-minute sources arriving **outside** business hours: due at next
   business morning + N minutes — the clock starts when someone can
   plausibly respond (`computeFirstResponseDueAt`).
3. `next_business_morning` walks forward day-by-day: a 06:00 Monday arrival
   is due 09:00 that Monday; Friday night is due Monday 09:00.
4. Breach is evaluated against a caller-supplied `now` (pure, deterministic
   tests). Once `markResponded` runs, the verdict is **frozen**: an on-time
   response clears exposure permanently; a late response stays recorded as a
   breach forever — the tamper-evidence posture applied to time.
5. `SlaState.escalatedToUserId` records who the breach escalated to
   (Section 4).

## 4. Missed-opportunity alert anatomy

We adopt the Car Wars Missed Opportunity Alert payload shape — summary +
customer info + CRM deep link + one-tap callback (`research/tms-canada.md`)
— and add what no incumbent publicly shows: an escalation chain with receipts.

**Alert payload (four parts + receipts):**

| Part | Content | Source |
|---|---|---|
| 1. Summary | One-paragraph claim-safe recap: source, vehicle of interest, what the customer asked, why this breached | AI BDC summary (Module 6), redaction gate applied before any model call |
| 2. Customer | Name + best contact method + consent status badge (no outbound suggestion if consent basis is `none`/`revoked`) | Customer 360 (Module 2) |
| 3. Deep link | Direct link to the `TrafficEvent` detail screen, pre-focused on the reply composer | Traffic desk UI |
| 4. Click-to-call / click-to-draft | One-tap callback via telephony connector (mock in V1) or one-tap AI reply draft for approval | Modules 6/12 |
| 5. Receipt | The alert itself emits a receipt; ignoring an alert is therefore itself on the record | Module 11 |

**Escalation chain (tenant-zero defaults, per-rooftop configurable):**

1. **T+0 (breach):** alert to `assignedToUserId`; receipt records alert sent.
2. **T+15 min unacknowledged:** escalate to sales manager
   (`SlaState.escalatedToUserId` set); immediate for `walk_in` breaches —
   the customer is physically present.
3. **T+60 min unacknowledged:** escalate to GM/owner; dashboard "red row."
4. **Acknowledgment** = opening the deep link or recording a response;
   receipted with actor + timestamp.

**Alert-fatigue controls** (the cited risk of call-alert products;
NEEDS_EXTERNAL_RESEARCH per `research/tms-canada.md` on dealer sentiment):
one live alert per traffic event; digest-batching for `referral`/`partner`;
quiet hours follow rooftop hours; per-user daily cap with digest overflow.

SKIPPED_WITH_REASON: live SMS/push alert delivery requires the Twilio/push
connector in live mode (vendor contract + human approval gate); V1 delivers
in-app and to the mock connector only.

## 5. Assignment and up-rotation fairness

Implemented in `build-packets/traffic-desk/assignment.ts`
(`RoundRobinAssigner`). Behavior as scaffolded:

1. **One default pool + optional per-source override pools** — e.g. phone-ups
   to the phone/BDC pool, walk-ins to the floor pool; sources without an
   override draw from the default pool.
2. **Independent cursors per pool** — deterministic, independently
   inspectable cycling; no randomness, no manager thumb on the scale.
3. **`skip(userId)`** removes a user from every pool (off shift, at lunch),
   preserving the remaining rotation order; no-op for unknown users.
4. **Empty pool throws** rather than silently dropping the event — an
   unassignable event is a loud failure escalated to the manager.
5. **`getState()`** exposes a deep-copied snapshot so the "who's up next"
   board renders the actual rotation, not a parallel guess.

**Why fairness drives adoption.** Per `research/tms-canada.md`, salespeople
fight the log when the up system feels gameable (skating, cherry-picking,
favorites); pure fairness tools (Sky Up System) exist solely to sell "who's
up next." Our exchange with the salesperson is explicit: *the log is what
protects your turn.* Tapping "I'm up" logs the walk-in, locks your place in
the receipted rotation history, and starts the TRACE score feeding your own
traffic-to-sale numbers (Section 10). Skate disputes stop being
he-said-she-said: rotation state, every `next()` draw, and every `skip()`
are receipted.

Persistence, shift schedules, skill-based routing — SKIPPED_WITH_REASON:
dedicated DealerOS code repo required (`cognitiacloud/dealeros`, Week-1 item
per `DEALEROS_DELIVERY_MEMO_V1.md`).

## 6. Appointment board and no-show/re-book flow

Two coupled state machines from `build-packets/traffic-desk/state-machine.ts`;
both throw `TransitionError` on any illegal transition or failed guard, so
the UI can only offer moves the machine allows.

### 6.1 Traffic outcome state machine (`TRAFFIC_TRANSITIONS`)

```
open ────────────→ appointment_set | sold | lost   (walk-ins can sell same-day)
appointment_set ─→ shown | no_show | lost
shown ───────────→ sold | lost
no_show ─────────→ appointment_set | lost           (re-book path)
sold, lost ──────→ (terminal)
```

Guards (`transitionTraffic`):

- `sold` **requires** `ctx.dealId` — "no deal, no sold mark."
- `lost` **requires** `ctx.lostReason` — the accountability rule; no
  unexplained terminals ever reach reporting (Section 8).

### 6.2 Appointment status state machine (`APPOINTMENT_TRANSITIONS`)

```
draft ──────→ proposed | cancelled
proposed ───→ confirmed | cancelled
confirmed ──→ completed | no_show | cancelled
no_show ────→ proposed                              (re-book path)
completed, cancelled → (terminal)
```

Guard (`transitionAppointment`): an appointment with `draftedBy: 'agent'`
may **not** move `draft → proposed` without `ctx.confirmedByUserId` — a named
human must sign off before the first step that could reach the customer.
This is the Module 11 human-approval gate expressed as a state-machine
invariant, not a UI convention.

### 6.3 Appointment board behavior

1. **Board columns** mirror appointment statuses with today/tomorrow/
   this-week lanes; each card shows customer, vehicle, kind
   (`visit | test_drive | service | delivery | trade_appraisal`), drafted-by
   badge (human vs agent), and confirm state.
2. **Show/no-show is timestamp-verified**, not coordinator-reported: a
   `confirmed` appointment past `scheduledFor` + grace (default 30 min) with
   no check-in prompts a one-tap `completed` / `no_show` decision from the
   assignee, escalating to the manager if undecided by end of day.
   (TraxSales sells timestamp-verified show rates as a camera feature — ours
   falls out of the workflow.)
3. **No-show re-book flow:** `no_show`'s only forward edge is `proposed` —
   the default posture is *re-book, don't bury*. A no-show auto-opens a
   Sales Closer follow-up task (Module 5) with an AI-drafted re-book message
   awaiting human approval; the traffic outcome moves to `appointment_set`
   only when a new slot is confirmed, or to `lost` with a mandatory reason.
4. Every appointment transition emits its receipt (Section 11).

## 7. Logged-vs-actual gap metric (software signals only)

The category's killer number is "X% of your traffic was never logged"
(TraxSales claims 15–25%; Lot Watch 35–40% — `research/tms-canada.md`).
Incumbents compute it with cameras (TraxSales) or WiFi sniffing (Lot Watch).
We compute it from software signals we already possess — **no cameras, no
MAC-address collection, nothing a PIPEDA/PIPA-BC assessment would flag as
covert tracking** (compliance frame: `research/canada-compliance.md`).

**Gap formula per source:** `gap = (signal_count − logged_event_count) / signal_count`,
computed per rooftop per day, where the signal denominators are:

| Source | Signal denominator (software) | Coverage honesty |
|---|---|---|
| `phone` | Inbound call records on tracked lines (telephony connector; mock in V1) | High once call tracking is live |
| `internet_lead` | Lead emails/ADF received by the intake parser | Near-total (parser is the creator) |
| `website_form` / `website_chat` | Form submits + contact-intent chat sessions from our own website (Module 9) | Near-total |
| `marketplace` | Message threads visible to the connector | Partial — only connected marketplaces |
| `after_hours` | Off-hours signals across all auto channels | Near-total |
| `partner` | Demandara `POST /api/demandara/leads` deliveries | Total (API is the creator) |
| `walk_in` | Consented check-in kiosk uses + booked-appointment arrivals + guest-WiFi **opt-in** count (explicit consent screen only) | **Partial and stated as such** — without cameras there is no full walk-in denominator; the metric reports "confirmed-signal walk-ins" and never extrapolates |
| `service_drive` | Service appointments marked sales-interest vs. total service appointments (opportunity-rate proxy) | Proxy, labeled as proxy |
| `referral` | No independent signal | Excluded from gap metric |

Auto-captured sources are created by the system itself, so their gap trends
to zero **by construction** — the entire point. The gap report's job at
tenant-zero is (a) proving the auto-capture claim internally with receipts
(each records auto-captured vs hand-entered vs edited-after-the-fact, and by
whom), and (b) surfacing the honest residual: walk-ins without check-in
signals — a coaching number, not a surveillance number. Claim-safety rule:
gap numbers stay internal until validated; the "15–25% / 35–40%" figures are
competitors' marketing claims, never presentable as our measurements.

SKIPPED_WITH_REASON: guest-WiFi opt-in flow requires legal counsel review of
consent screen text (PIPA-BC) before any pilot; excluded from MVP.

## 8. Sold/lost reason discipline

1. **Machine-enforced:** per Section 6.1 guards, no traffic event reaches a
   terminal without a `dealId` (sold) or `lostReason` (lost) — reporting can
   never contain an unexplained ending.
2. **Canonical reasons** (`LostReason` in `core.ts`): `bought_elsewhere`,
   `no_response`, `financing_declined`, `price`, `vehicle_sold`, `not_ready`,
   `bad_contact_info`, `duplicate`, `other`.
3. **`other` is rationed:** free-text note required; > 15% weekly `other`
   share per salesperson is dashboard-flagged — either the taxonomy is
   missing a reason (extend it) or discipline is slipping (coach it).
4. **Reasons drive automation:** `not_ready` → long-cadence follow-up plan;
   `no_response` → lost-lead resurrection drafts (both human-approved,
   Modules 5/6); `financing_declined` → finance-route playbook;
   `vehicle_sold` → similar-vehicle match (Module 3); `bought_elsewhere` and
   `price` → weekly action plan (Section 9) as pricing/inventory signals.
5. Every terminal mark emits `sold_marked` or `lost_reason_recorded` with
   `recordedByUserId` — reasons are owned, not anonymous.

## 9. Manager dashboard and AI-generated weekly action plan

TMS has survived 30+ years by pairing reports with humans who "analyze and
interpret data to provide action plans" (`research/tms-canada.md`) — a
services layer that likely prices out small independents. DealerOS ships the
AI equivalent of the field rep.

**Live dashboard (manager/GM roles):**

1. Today's traffic by source with SLA status (green/amber/red rows; red =
   breached and unacknowledged).
2. "Who's up next" rotation state per pool (`RoundRobinAssigner.getState()`).
3. Appointment board summary: today's confirmed / shown / no-show counts.
4. TRACE scoreboard per salesperson (rolling 7 days).
5. Logged-vs-actual gap tiles per source (Section 7).
6. Open escalations addressed to me (Section 4).

**AI weekly action plan** (generated Monday, rooftop-local morning, by the
AI harness — Module 13 — from traffic-desk data only; redaction gate applies):

1. **Format:** one page; 3–5 numbered observations, each with evidence
   (linked receipts/report rows), a suggested action, and an owner. Claim-safe
   language template enforced; AI-disclosure footer per
   `TenantSettings.aiPolicy.aiDisclosureFooter`.
2. **Example shapes** (mock data at tenant-zero): "internet_lead SLA hit-rate
   fell; breaches cluster 12:00–14:00 — consider lunch-cover rotation";
   "`price` lost-reasons concentrate on stock > 60 days-in-inventory —
   review pricing on N flagged units (Module 3 link)".
3. **Human-in-the-loop:** the plan is a draft; accepting an item creates
   `WorkTask`s with owners and due dates, receipted. The plan itself emits a
   receipt (Section 11) — TMS's field-rep binder becomes a signed, auditable
   artifact.
4. NEEDS_EXTERNAL_RESEARCH: TMS's actual report names and action-plan format
   (no public documentation per `research/tms-canada.md`) — we design from
   first principles, not their deliverable.

## 10. Traffic-to-sale reporting

Closes the loop incumbents leave open (TMS stops at "lead and sales
statistics"; TraxSales at revenue-per-guest — `research/tms-canada.md`).

1. **Funnel per source / salesperson / campaign:** events → responded-in-SLA
   → appointments set → shown → sold, with stage conversion percentages; all
   six outcome states are countable because terminals are guarded (Section 8).
2. **Attribution:** each `Deal` carries `DealAttribution` (first/last touch,
   `aiAssisted`, touch count) linked through `Lead.sourceTrafficEventId` to
   the originating `TrafficEvent` and its UTM/`campaignId` lineage — enabling
   *cost per sold unit by campaign* once Demandara supplies spend via
   `GET /api/demandara/outcomes` and `/revenue-attribution` (mock in V1).
3. **Desking hand-off seam:** one-click "start deal draft from traffic event"
   (the TMS→Autovance→XSELLERATOR seam per `research/tms-canada.md`, owned
   natively); the draft pre-loads customer, vehicle, and trade-in context
   from the same record set — no swivel-chair.
4. **Standard reports (V1):** Daily desk log (auto-filled); Source
   performance; Salesperson scorecard (TRACE + funnel + gross where
   permissioned via `internalCost` gating); Lost-reason mix; Appointment
   show-rate (timestamp-verified); SLA compliance + escalation log. Every
   report row drills down to its receipts — vendor math replaced by
   inspectable math.

## 11. Proof receipts emitted at each step

Module 11 (Cognitia adapter) event types from `CONTEXT_PACK.md`, mapped to
traffic-desk moments; receipt fields per the canonical list (actor_type,
payload_hash, policy_gate_result, claim_safe_summary, …).

| Desk moment | Receipt event type |
|---|---|
| Traffic event auto-created / walk-in confirmed | `lead_received` |
| Consent checkbox on form/kiosk | `consent_captured` |
| New customer identified from event | `customer_created` |
| Cross-channel dedup linkage | `duplicate_detected` |
| Vehicle of interest attached | `vehicle_matched` |
| AI reply/summary drafted | `ai_reply_drafted` |
| Human approval requested / granted (agent appointment draft → proposed; alert callbacks) | `human_approval_requested`, `human_approval_granted` |
| Appointment drafted / confirmed | `appointment_drafted`, `appointment_confirmed` |
| Test drive completed | `test_drive_completed` |
| Follow-up (incl. no-show re-book) sent after approval | `followup_sent` |
| Outcome state transitions, assignment, SLA response recorded | `crm_updated` |
| Sold terminal (with dealId) | `sold_marked` |
| Lost terminal (with reason) | `lost_reason_recorded` |

Proposed catalog additions (SCHEMA_NOTE for the cognitia packet; today these
ride on `crm_updated` typed payloads): `sla_breached`, `alert_sent`,
`escalation_acknowledged`, `action_plan_generated`. Decision owner: Muhammad;
default = ship V1 on `crm_updated` subtypes, promote in V1.1 if report
queries need them.

Net effect (per `research/tms-canada.md`): the desk log is tamper-evident.
Competitors' logs are editable records that staff openly game — the exact
problem TraxSales sells cameras to catch. An alert that fired and was
ignored is itself a receipt.

## 12. Acceptance criteria — tenant-zero (gate T0-2 expanded)

Extends gate T0-2 in `BUDGET_WHEELS_DEALEROS_EXECUTIVE_STRATEGY_V1.md` and
the MVP criteria in `DEALEROS_FEATURE_MAP_AND_MODULE_ARCHITECTURE_V1.md` §6.
All criteria run on mock/fake data, zero external network calls, in the
dedicated repo once it exists.

| # | Criterion | Pass condition |
|---|---|---|
| 1 | All 10 sources loggable | Each `TrafficSourceKind` produces a valid event via its Section 2 mechanic; auto sources require zero keystrokes; walk-in ≤ 1 tap + ≤ 30 s enrichment |
| 2 | 100% receipted | Every event, assignment, SLA response, transition, and alert has a resolvable receipt chain in the viewer |
| 3 | SLA determinism | Injected-clock tests reproduce every row of the Section 3 table, incl. out-of-hours deferral and Friday-night → Monday-morning `after_hours` |
| 4 | Breach → alert → escalation | A simulated 15-min internet-lead breach fires the four-part alert; unacknowledged escalation reaches manager then GM on the Section 4 timers; all three hops receipted |
| 5 | Rotation fairness | Deterministic round-robin over N simulated events distributes ±1 across pool members; `skip()` preserves order; empty pool raises a manager-visible failure |
| 6 | Guarded terminals | UI/API cannot record `sold` without `dealId` nor `lost` without `lostReason` (attempts raise `TransitionError`); agent-drafted appointment cannot reach `proposed` without a named human confirmer |
| 7 | No-show re-book | A `confirmed` appointment driven to `no_show` opens a re-book task with an approval-gated draft; both re-book and lost paths complete cleanly |
| 8 | Gap metric honesty | Gap report computes per-source from Section 7 denominators, labels walk-in coverage partial, and drills to receipts distinguishing auto vs hand-entered vs edited events |
| 9 | Weekly action plan | Generated from ≥ 2 weeks of simulated traffic; every observation links to evidence; accepting an item creates receipted `WorkTask`s; AI-disclosure footer present |
| 10 | Traffic-to-sale linkage | A simulated event walked to `sold` renders in the funnel with `DealAttribution` resolving back to the originating event and campaign |
| 11 | Operator usability | Muhammad runs a full day-in-the-life scenario (all sources → outcomes → weekly plan) solo, per gate T0-8 |

SKIPPED_WITH_REASON (blocked, tracked, not silently dropped):
- Live telephony/call-tracking, SMS alert delivery, marketplace connectors —
  vendor contracts + live-mode approval gates required; mock-only in V1.
- Call-recording and guest-WiFi consent screen texts — legal counsel review
  (PIPA-BC/PIPEDA) required before any pilot.
- Rooftop-timezone SLA math, persistence, shift schedules, desk UI —
  dedicated code repo (`cognitiacloud/dealeros`) required; this Library repo
  is not the production codebase.
- Benchmarking against real Car Wars/TMS/TraxSales pricing and report
  formats — NEEDS_EXTERNAL_RESEARCH per `research/tms-canada.md`; not public,
  no fabrication.

---

## Boundaries honored

- No secrets, no real API keys; all connectors referenced (telephony, SMS,
  marketplace, Demandara) are mock-mode by default; live mode is gated by
  human approval + proof receipt and is not enabled in this phase.
- No live CRM/DMS writes; no live DealerMine/TMS/Car Wars/marketplace
  integration — competitor facts come only from `research/tms-canada.md`;
  unverifiable items carry NEEDS_EXTERNAL_RESEARCH, none invented.
- No dealership or customer outreach; no real customer PII — all scenarios
  and metrics are fake/reserved/local-only; no cameras, no WiFi MAC
  collection; consent-first capture design pending legal review.
- No production deploy or migrations — all code cited is dependency-free
  reference scaffolding in `build-packets/`; the dedicated repo is a Week-1
  roadmap item.
- No public claims, no "production ready" language, no guarantees, no
  certification claims; competitor gap percentages are their marketing
  claims, never our measurements; TRACE is internal-only.
- No crypto/token language; agent-economy linkage limited to internal work
  events per `CONTEXT_PACK.md` Module 15.
