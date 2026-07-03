# DEALEROS MODULE 7 — AUTOALERT-STYLE EQUITY MINING / OPPORTUNITY ENGINE SPEC (V1)

STATUS: INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.

Owner: Muhammad Firoz · Date: 2026-07-03 · Version: V1

Scope: full product spec for Module 7 (equity mining / opportunity engine) per
`CONTEXT_PACK.md` section 6. The reference implementation this spec documents
is `build-packets/equity-mining/scoring.ts` (deterministic scoring engine),
`build-packets/equity-mining/fixtures.ts` (frozen fixtures), and the Module 7
shapes in `build-packets/schemas/core.ts` (`OpportunityScore`,
`OpportunityReasonCode`, `NextBestAction`, `OwnedVehicle`, `WorkTask`).
Competitive grounding: `research/autoalert.md`. Sibling specs:
`DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md` (traffic-desk handoff),
`DEALEROS_DEALERMINE_STYLE_CRM_BDC_SPEC_V1.md` (BDC work queues),
`DEALEROS_FEATURE_MAP_AND_MODULE_ARCHITECTURE_V1.md` (module boundaries),
`DEALEROS_COMPETITOR_RESEARCH_MATRIX_V1.md` (vendor comparison).

---

## 1. Opportunity philosophy: mine the database we already own

Every dealer's biggest untouched lead source is the sold/service database, not
tomorrow's internet leads. AutoAlert built a category on this ("data mining vs
equity mining" — see `research/autoalert.md`): rank every known customer by
likelihood to transact now, attach a reason and a pitch, and push the ranked
list into the salesperson's day.

Module 7 design tenets:

1. **One score per (customer, owned vehicle), not per customer.** A household
   with two vehicles is two opportunities (`ScoringInputs.ownedVehicle`).
2. **Named factors, not an opaque score.** AutoAlert's durable idea is eight
   sayable alert names (Upgrade/Flex/Contract/Mileage/Warranty/Service/
   Pending-Service/Engaged). We ship 15 named `OpportunityReasonCode` values,
   each with evidence text a salesperson can read aloud.
3. **Independent-dealer signals first.** Incumbents assume lease books and OEM
   feeds. Our factor mix leans on finance-term age, mileage pace, vehicle age,
   service recency, segment (service-only/orphan), engagement, and live
   used-inventory match — signals Budget Wheels actually has — with graceful
   degradation when finance data is unknown (factors simply do not fire).
4. **Every dollar figure is a proxy, never an appraisal or offer.** Hard rule
   in `scoring.ts`; evidence strings say so explicitly.
5. **No outreach without a human.** `NextBestAction.requiresHumanApproval` is
   the literal type `true` in `core.ts` — it cannot be set false in V1.
6. **Every stage emits a proof receipt** (Module 11), because the documented
   #1 failure mode of equity programs is reps not working the leads
   (`research/autoalert.md`, 2025 Digital Dealer survey note). Incumbents
   answer with dashboards; we answer with an evidence chain.
7. **Daily recalculation, not list pulls.** Scores are regenerated on a daily
   batch (and on triggering events); opportunities expire and re-rank.

## 2. Factor catalog (as implemented in `FACTOR_DEFINITIONS`)

All 15 `OpportunityReasonCode` values from `core.ts` are implemented in
`scoring.ts`. Each factor contributes `weight × contribution01` points; the
sum is clamped to 0..100. Total available weight is 188 points — weights
intentionally over-provision so a many-signal customer saturates at 100
(exercised by `FIXTURE_E_KITCHEN_SINK` in `fixtures.ts`).

| # | Code | Weight | Fires when (evaluation window) | Contribution formula (0..1) | AutoAlert-style alert it replaces |
|---|------|--------|-------------------------------|------------------------------|-----------------------------------|
| 1 | `lease_maturity_near` | 28 | Lease with `maturityDate` between −1 and +9 months of `asOf` | `clamp01((12 − max(monthsTo,0))/12)` | **Contract Alert** (lease maturity) |
| 2 | `finance_term_late` | 22 | Loan with ≥60% of `termMonths` elapsed since `startDate` | `clamp01((frac − 0.5)/0.45)` | **Contract Alert** (finance maturity) |
| 3 | `positive_equity_estimated` | 18 | Equity proxy > 0 (needs `estimatedPayoff` + value proxy, §4) | `clamp01((equity/valueProxy)/0.35)` | **Upgrade Alert** (equity position) |
| 4 | `payment_upgrade_possible` | 10 | Known payment; lease any time or loan ≥50% elapsed; cheapest matched unit's payment proxy ≤ 1.05× current payment | `clamp01(savingsFrac/0.2)` | **Upgrade / Flex Alert** (payment parity) |
| 5 | `high_mileage_vs_term` | 10 | Mileage pace > 20,000 km/yr (mileage ÷ vehicle age at reading date, min age 0.5 yr) | `max(0.15, clamp01((pace − 20000)/15000))` | **Mileage Alert** (km-pace variant for finance-heavy independents) |
| 6 | `warranty_ending` | 8 | `warrantyEndDate` between −1 and +6 months of `asOf` | `clamp01((6 − max(monthsTo,0))/6)` | **Warranty Alert** |
| 7 | `service_visit_recent` | 8 | `lastServiceAt` within 0–90 days of `asOf` | `max(0.15, clamp01(1 − days/90))` | **Service Alert** (post-visit) |
| 8 | `service_only_customer` | 14 | `customer.segment === 'service_only'` | fixed 1.0 | Service-drive conquest (AutoAlert service-drive mining / Mastermind Service Conquest analog) |
| 9 | `orphan_owner` | 16 | `customer.segment === 'orphan_owner'` | fixed 1.0 | Orphan-owner mining (standard equity-mining segment; no single AutoAlert alert name) |
| 10 | `vehicle_aging` | 12 | Vehicle age ≥ 6 years (from Jan 1 of model year, mock proxy) | `clamp01((age − 5)/5)` | Upgrade-timing support signal (no named AutoAlert alert) |
| 11 | `inventory_match_available` | 12 | ≥1 available unit passes the matching heuristic (§4) | `clamp01(0.4 + 0.2 × matchCount)` | Inventory-aware leg of **Upgrade Alert** (our two-sided twist) |
| 12 | `engagement_recent` | 8 | `lastInboundAt` within 0–45 days of `asOf` | `max(0.2, clamp01(1 − days/45))` | **Engaged Alert** (inbound contact) |
| 13 | `website_behavior_intent` | 8 | ≥3 VDP views in last 30 days | `clamp01(views/10)` | **Engaged Alert** (website behavior) |
| 14 | `household_opportunity` | 4 | `householdId` present on customer | fixed 0.5 | Household-level mining (Mastermind household analog) |
| 15 | `trade_in_window` | 10 | Any of: loan ≥70% elapsed; lease maturity −1..+9 months; vehicle age ≥ 8 yrs | `clamp01(0.4 + 0.3 × signalCount)` | Composite Upgrade/Contract timing + the Signal/VINCUE acquisition angle |

Notes on the mapping:

1. **Pending-Service Alert is NOT implemented in V1 scoring.** `ScoringInputs`
   carries no upcoming-appointment signal. It lands in V2 via Module 8
   (service CRM) as a pre-visit interrupt; see §12 item 4.
2. **Flex Alert is only partially covered** by `payment_upgrade_possible`.
   True Flex math needs lender term/rate/incentive data we do not have (§8).
3. Every factor returns claim-safe `evidence` text when it fires (e.g.
   "estimated equity proxy CAD $X … internal estimate only, not an
   appraisal") and a stated non-fire reason when it does not — the score is
   explainable in both directions.

## 3. Scoring bands, determinism, and versioning

**Bands** (constants in `scoring.ts`): `hot` ≥ 70 (`BAND_HOT_MIN`), `warm`
≥ 40 (`BAND_WARM_MIN`), else `watch`. Fixture coverage: hot (mature loan with
equity; orphan lease), warm (service-only aging vehicle), watch (6-month-old
purchase), and a clamp-to-100 saturation case (`fixtures.ts`).

**Determinism rules (acceptance criteria for the engine):**

1. All date math derives from the `asOf` input — `Date.now()` never appears.
   Fixtures freeze `AS_OF = 2026-07-03T18:00:00Z` so every path is
   reproducible.
2. `opportunityId` is derived, not random: `opp_` + first 16 hex chars of
   `sha256(idSeed)`, with `idSeed = "{customerId}:{vin}:{asOf-date}"` by
   convention. Same inputs → same ID → idempotent daily re-scoring.
3. Fired factors sort by contribution descending with code-alphabetical
   tie-break, so `reasonCodes` ordering is stable across runs.
4. Inventory match ordering is deterministic (price asc, then `vehicleId`).
5. `modelVersion` is stamped on every `OpportunityScore`
   (`MODEL_VERSION = 'mock-scoring-v1'`). Any weight, window, threshold, or
   template change bumps the version through the Module 13 prompt/version
   registry — two scores are only comparable at equal `modelVersion`.

**Receipts per score:** every scoring run emits an `equity_score_generated`
proof receipt (Module 11) carrying the inputs hash (`payload_hash`), reason
codes, `modelVersion`, and band; `core.ts` reserves `receiptId` on
`OpportunityScore` for exactly this. Incumbent scores are black boxes; ours
can be reconstructed by an auditor (`research/autoalert.md`, moat section).

## 4. Inventory matching + equity proxy heuristics

**Matching (`matchInventory`):**

1. Candidate must have `status === 'available'` (sold/pending/incoming units
   excluded — verified by the sold-Civic fixture).
2. Familiarity gate — any of: customer tag `prefers:<bodyStyle>`; body style
   inferred from the owned model via the deterministic
   `BODY_STYLE_MODEL_HINTS` map (~40 common models → suv/truck/sedan/van);
   same make as the owned vehicle.
3. Budget band — if a current payment is known, target price = payment × 60
   months (straight-line, zero-interest, MOCK ONLY); accept units priced
   0.5×–1.3× of target. No payment known → familiarity + availability only.
4. Return the cheapest 3 (`MAX_INVENTORY_MATCHES`), price-ascending.

**Equity proxy (`estimateEquity`):** requires `estimatedPayoff`. Value proxy
basis, in order: (a) average asking price of available same-make+model comps;
(b) same-make comps within 2 model years; both discounted 5% per model-year
the owned vehicle trails the comp average; (c) straight-line fallback
`payment × termMonths × 0.55`. Equity = value proxy − payoff. The `basis` is
recorded and surfaced in evidence. Never shown to a customer as-is.

Default posture: these are placeholder heuristics good enough to rank, not to
quote. Real book values are a data partnership away (§8).

## 5. Next-best-action generation (consent-aware, always approval-gated)

Implemented in `generateNextBestAction(score, customer, assigneeUserId?)`.
Behavior (all branches set `requiresHumanApproval: true`):

| Band | Action | Due | Channel logic |
|------|--------|-----|---------------|
| watch | `no_action` | — | No outreach recommended; still approval-flagged |
| hot | `call_task` | `asOf` + 1 day | Always a human call first; draft includes talking points from top-2 pitch templates |
| warm | `sms_draft` → `email_draft` → `call_task` | `asOf` + 3 days | Consent-aware fallback chain |

Consent chain details:

1. `hasUsableConsent(customer, channel, asOf)` is CASL-aware: `granted`
   (express) always usable; `implied` usable only while `expiresAt` is in the
   future relative to `score.generatedAt`; `revoked`/`unknown` never usable.
2. Warm path: usable SMS consent → `sms_draft` (includes "Reply STOP to opt
   out"); else usable email consent → `email_draft` (includes unsubscribe
   line and "internal estimates only — not a commitment, quote, or
   appraisal"); else fall back to an internal `call_task` whose draft text
   states "no usable SMS/email consent on file" and instructs the rep to
   confirm consent preferences first.
3. Every draft carries the AI-disclosure suffix "(Drafted with AI assistance;
   a team member reviews before sending.)" per Module 14 AI-disclosure
   policy.
4. Fixture-verified edge cases: revoked SMS + granted email → email fallback
   (`FIXTURE_C_SERVICE_ONLY`); hot orphan with no usable consent → call task,
   never an SMS draft (`FIXTURE_D_ORPHAN_LEASE`).

Acceptance criteria: no code path can emit an outbound-channel action without
a usable consent record; no code path can emit `requiresHumanApproval: false`
(type-enforced); every action kind maps to a `WorkTask` (§6).

## 6. Work queues for sales and BDC

Queues are materialized as `WorkTask` records (`core.ts`) with
`relatedTo.opportunityId` set, following the AlertMiner Pro "push, not pull"
pattern (`research/autoalert.md`, copy-list item 5) and the BDC queue design
in `DEALEROS_DEALERMINE_STYLE_CRM_BDC_SPEC_V1.md`.

| Queue | Who | Contents | Default SLA |
|-------|-----|----------|-------------|
| Hot list | Assigned salesperson (orphans → sales manager for assignment) | `hot` opportunities as `call` tasks, due +1 day | Worked or escalated within 1 business day |
| Warm queue | BDC agents | `warm` opportunities as approval-pending drafts (`follow_up` tasks), due +3 days | Draft approved/edited/dismissed within 3 days |
| Approval queue | Sales manager / BDC manager | Every draft awaiting `human_approval_requested` → `granted` | 1 business day |
| Watch list | System only | `watch` opportunities; no tasks; re-scored daily | — |
| Service-drive interrupt | V2 (Module 8) | Real-time "equity customer checked into service" task | SKIPPED_WITH_REASON: requires Module 8 service check-in events and, for franchise-grade parity, a live DMS feed; V1 has only the batch `service_visit_recent` factor. |

Queue rules: one open task per opportunity (dedupe on `opportunityId`);
dismissals require a reason; daily re-score closes stale tasks whose
opportunity dropped below `warm`; manager dashboard shows worked-vs-unworked
by rep and by band, backed by receipts, not self-reports. Sold/lost outcomes
flow to the traffic desk per `DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md` so
equity-sourced deals appear in traffic-to-sale reporting like any other
source (`TrafficSourceKind` extension: opportunity-sourced events register
with `sourceDetail: 'equity_opportunity'`).

## 7. Result tracking and score→outcome feedback

1. **Result states** (on `OpportunityScore.result`): `contacted`,
   `appointment`, `sold`, `dismissed`, each with `recordedAt`.
2. **Receipt chain per opportunity** (Module 11 event types):
   `equity_score_generated` → `ai_reply_drafted` → `human_approval_requested`
   → `human_approval_granted` → `followup_sent` → `appointment_drafted` /
   `appointment_confirmed` → `sold_marked` or `lost_reason_recorded`. The
   chain answers "was this hot lead worked?" with timestamps and actor IDs.
3. **Feedback loop:** because every score is versioned and receipted, we can
   compute per-`modelVersion` outcome stats offline: band precision (share of
   hot that reached appointment/sold), per-factor lift (outcome rate when a
   factor fired vs not), and dismissal reasons. Re-weighting ships only as a
   new `MODEL_VERSION`; old scores are never mutated.
4. **Agent-economy hook** (Module 15): `equity_opportunity_created` and
   `service_to_sales_opportunity_created` are countable work events with
   evidence requirements — internal only, no token/marketplace mechanics.
5. SKIPPED_WITH_REASON: statistical validation of weights against real
   outcomes requires real customer data and months of live operation; V1
   weights are design judgment encoded in `mock-scoring-v1` and validated
   only against fixtures.

## 8. What we DON'T have vs AutoAlert (honest gap list)

| Gap | AutoAlert has | Our status |
|-----|---------------|------------|
| Behavior-predicting analytics | Patented scoring (per marketing; NEEDS_EXTERNAL_RESEARCH: which patents AutoAlert actually holds) | SKIPPED_WITH_REASON: patent landscape review requires legal counsel; our engine is deliberately transparent-heuristic, not predictive-ML, in V1. |
| Book values | Vendor-integrated vehicle valuations | SKIPPED_WITH_REASON: Canadian Black Book / KBB-style data requires a vendor contract; V1 uses the comparable-inventory proxy (§4). NEEDS_EXTERNAL_RESEARCH: whether AutoAlert's Canadian data includes Canadian book values. |
| Lender payoff feeds | Payoff/position data via DMS + finance integrations | SKIPPED_WITH_REASON: live lender/DMS APIs and data agreements; V1 uses `estimatedPayoff` only when lawfully known/recorded (`core.ts` comment). |
| OEM data feeds & certifications | Stellantis Digital Certified Partner; Ford of Canada ILM (CXM) | SKIPPED_WITH_REASON: OEM program contracts; irrelevant to tenant-zero (independent), deferred indefinitely. |
| Deep live DMS integration | Pulls sales/F&I/service from major DMS platforms daily | SKIPPED_WITH_REASON: no live DMS writes/reads per hard boundaries; V1 ingests via mock-mode connectors (Module 12) and manual/CSV import. |
| Real-time service-drive interrupt | Check-in alert routed while customer is in the building | V2 with Module 8 (see §6 table). |
| Daily equity recalculation at franchise data depth | Daily refresh on DMS-fed positions | We match the daily-recalculation pattern, but on our own thinner data. |
| Multipoint marketing campaign triggers | Engagement Studio / One-to-One Intelligent Marketing | Ours routes through Demandara (`POST /api/demandara/campaigns`) — designed but mock-only in this repo. |

Per `CONTEXT_PACK.md` section 7: "AutoAlert replacement" language is
prohibited publicly unless feature parity is real. It is not real in V1.

## 9. How independents win anyway

1. **Fresher used-inventory match.** Franchise equity tools pitch a new-car
   upgrade against OEM programs. Budget Wheels' inventory turns fast and is
   priced to market weekly; our score embeds a live match to actual in-stock
   units (`inventory_match_available`, `payment_upgrade_possible`) rather
   than a hypothetical order. The pitch is concrete: "we have 3 units on the
   lot that fit."
2. **Two-sided value.** Every upgrade opportunity's trade-in is used
   inventory we need to acquire (the Signal/VINCUE angle,
   `research/autoalert.md`). `trade_in_window` scores the acquisition side;
   V2 adds an explicit "how badly we want this trade" boost from inventory
   gaps.
3. **Traffic-desk integration, no swivel chair.** AutoAlert CXM's core
   complaint is dual-system work. Our opportunity, customer 360, vehicle
   match, appointment board, and sold/lost outcome are one record set — an
   equity opportunity that books an appointment lands on the same board and
   SLA timers as a phone-up (`DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md`).
4. **Independent-native signals.** Segment factors (`service_only_customer`
   14 pts, `orphan_owner` 16 pts) and mileage/age factors fire without any
   finance data at all — fixture C reaches `warm` with zero finance fields.
5. **Canada-first consent.** CASL express/implied handling is in the NBA
   engine itself (§5), not a bolt-on; consent basis lands on every receipt.
6. **Evidence-level accountability** instead of dashboard-level (§7) — the
   answer to the industry's documented follow-through failure mode.

## 10. Receipts + claim-safe pitch templates

**Pitch system (implemented):** one template per reason code
(`PITCH_TEMPLATES`), composed from the top-2 fired codes, always prefixed
with "DRAFT — internal talking points only; estimates, not commitments;
requires human review before any customer contact." Template language rules
(enforced by review + Module 13 compliance-check task):

1. Hedged verbs only: "appears to," "may be eligible," "worth a
   conversation." No guarantees, no superlatives, no commitments.
2. Money statements always carry "internal estimate only, not an appraisal"
   or "not a commitment, quote, or appraisal."
3. Payment statements always carry "subject to lender review" and the mock
   proxy is labeled "not a quote."
4. Outbound drafts include opt-out language (STOP / unsubscribe) and the AI
   disclosure footer.
5. Zero-signal case degrades safely: "No strong opportunity signals at this
   time; no outreach recommended."

**Receipts:** the full chain in §7 item 2, plus `vehicle_matched` when the
match set changes and `consent_captured` on any consent update. Claim-safe
reporting rule: results are only ever reported per-dealer and receipt-backed
("your N sold-from-opportunity deals this quarter, with the receipt chain") —
never vendor-average claims like RevenueRadar's "$424K average gross"
(`research/autoalert.md`, do-better item 8).

## 11. KPIs (default benchmark report, shipped from day one)

All KPIs are computed from receipts and task records, per-dealer, internal
until validated. Targets below are initial design targets, not promises.

| # | KPI | Definition | Initial target (tenant-zero) |
|---|-----|------------|------------------------------|
| 1 | Opportunities generated/day | Scores ≥ warm created by daily batch | Baseline metric (no target) |
| 2 | Hot worked % | Hot opportunities with `contacted`+ within SLA ÷ hot total | ≥ 80% |
| 3 | Approval turnaround | Median `human_approval_requested` → `granted`/rejected | ≤ 1 business day |
| 4 | Contact rate | `contacted` ÷ (hot + warm) | ≥ 40% |
| 5 | Appointment rate | `appointment` ÷ contacted | ≥ 20% |
| 6 | Sold-from-opportunity rate | `sold` ÷ (hot + warm), trailing 90 days | Baseline in Q1, target set after |
| 7 | Hot-band precision | (`appointment` + `sold`) ÷ hot | Tracked per `modelVersion` |
| 8 | Consent-block rate | Warm NBAs falling back to call task for lack of consent | Tracked; drives consent-capture campaigns |
| 9 | Trade-ins acquired from opportunities | Deals with `tradeIn` sourced from an opportunity | Baseline metric |
| 10 | Dismissal rate + top dismissal reasons | `dismissed` ÷ total, by reason | < 30%, reviewed monthly |

Acceptance criteria for Module 7 V1 "design-complete": all §3 determinism
criteria pass in the packet test suite
(`build-packets/equity-mining/equity-mining.test.ts`); all five fixtures land
in their expected bands; consent fallback behaves per §5 fixtures; every KPI
above is computable from schema fields that exist in `core.ts` today.

SKIPPED_WITH_REASON: moving this engine into the dedicated application repo
(`cognitiacloud/dealeros`), wiring the daily batch scheduler, and persisting
scores/tasks require the dedicated code repo, which does not exist yet
(`CONTEXT_PACK.md` section 9).

## 12. V2 backlog (ordered)

1. Service-drive interrupt + Pending-Service factor (Module 8 events).
2. Book-value connector slot (mock-first, per Module 12 rules) to replace the
   comparable-inventory proxy. SKIPPED_WITH_REASON: vendor contract needed.
3. Inventory-gap acquisition boost on `trade_in_window` (want-list scoring).
4. Per-channel talk tracks (Mastermind "Fritz" analog) via Module 13,
   redaction-gated, human-approved.
5. Demandara campaign triggers from alert cohorts
   (`POST /api/demandara/campaigns`) with closed-loop attribution
   (`GET /api/demandara/revenue-attribution`).
6. Outcome-informed re-weighting as `mock-scoring-v2` once real (consented)
   outcome data exists.

## Boundaries honored

- INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.
- No live CRM/DMS reads or writes; all connector behavior is mock-mode by
  default; live mode is always human-approval-gated with proof receipts.
- No real customer data: all fixtures use fake names, fake VINs, fixture IDs,
  and a frozen timestamp.
- No customer or dealership outreach: every generated draft is
  `requiresHumanApproval: true` by type and is never sent from this repo.
- No fake proof and no vendor-average results claims; results reporting is
  per-dealer and receipt-backed only.
- No invented vendor facts: AutoAlert details come solely from
  `research/autoalert.md`; unverifiable items are marked
  NEEDS_EXTERNAL_RESEARCH. No public "AutoAlert replacement" claim — feature
  parity does not exist in V1 (§8).
- All dollar figures produced by the engine are internal proxies/estimates,
  never appraisals, quotes, or offers.
- No production deploy, no migrations, no secrets; the scoring code is a
  dependency-free reference scaffold pending the dedicated
  `cognitiacloud/dealeros` repo.
- No crypto/token language: agent-economy hooks are internal work-event
  primitives only.
