# DealerOS Module 10 — Demandara Demand-Gen Harness (Connector Contract Spec)

STATUS: INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.

Owner: Muhammad Firoz · Date: 2026-07-03 · Version: V1

---

## 1. Purpose and scope

This document specifies the contract between **Demandara** (the GTM/demand-gen/revenue
workflow engine) and **Budget Wheels DealerOS** (the dealership system of record). It is
the design companion to two reference scaffolds that already exist in this Library repo:

- `build-packets/demandara/api-contracts.ts` — the request/response types for all 9 endpoints.
- `build-packets/demandara/service.ts` — an in-memory, deterministic, mock-only adapter implementing them.

Sibling docs this spec depends on and cross-references:

1. `DEALEROS_FEATURE_MAP_AND_MODULE_ARCHITECTURE_V1.md` — where Module 10 sits among the 15 modules.
2. `DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md` — TrafficEvent, SLA timers, and source vocabulary that lead intake writes into.
3. `DEALEROS_DEALERMINE_STYLE_CRM_BDC_SPEC_V1.md` — the AI BDC draft/approve workflow that consumes reply and appointment drafts.
4. `DEALEROS_COMPETITOR_RESEARCH_MATRIX_V1.md` and `research/marketplaces.md` — channel and merchandising facts used in Sections 7 and 10.

SKIPPED_WITH_REASON: HTTP framework wiring, auth middleware, TLS, and route registration
are not designed here — they belong in the dedicated code repo (`cognitiacloud/dealeros`,
a Week-1 roadmap item per `CONTEXT_PACK.md` Section 9). This spec defines the contract those
routes must satisfy.

## 2. Integration philosophy

**Demandara is the GTM brain. DealerOS is the system of record.** Demandara decides what to
say, when to follow up, which campaign to run; DealerOS owns customers, consent, inventory,
appointments, deals, and the proof ledger. The contract enforces this asymmetry:

| # | Principle | Enforcement in the contract |
|---|-----------|-----------------------------|
| 1 | All Demandara actions arrive as **drafts/requests, never direct sends** | `ReplyDraftResponse.requiresHumanApproval: true` (literal type); appointments stored `status: 'draft'`, `draftedBy: 'agent'`; campaigns stored `pending_approval` |
| 2 | Nothing in this API can cause an outbound side effect | Every proof emit from the adapter is hard-typed `externalSideEffect: false` in `ProofEmitInput` |
| 3 | Raw PII flows **inbound only** | `LeadIntakeRequest.contact` is accepted but never echoed; the context endpoint returns a redacted view (Section 5) |
| 4 | Every request is tenant-scoped | `DemandaraRequestBase.tenantId`; adapter throws on tenant mismatch (`assertTenant`) |
| 5 | Every mutation is idempotent | `DemandaraMutationBase.idempotencyKey`; same key returns the same response, creates no duplicates |
| 6 | Every meaningful action returns a proof receipt | Each mutating response carries a `receiptId` (Cognitia event types per Module 11) |
| 7 | Consent is respected by construction | Follow-up plans auto-pause on revoked consent; context pack carries per-channel consent so drafting can't ignore opt-outs |
| 8 | Claim-unsafe text is rejected at the door | `assertClaimSafeDraftText` deny-list ("guarantee", "production ready", "no risk", "100%", "certified") throws at intake |

Product metaphor (per `CONTEXT_PACK.md`): a dealership sales desk with a paper trail — not a
magic chatbot. Demandara proposes; a named human at the desk disposes; Cognitia receipts both.

## 3. The 9 endpoints, one by one

All routes live under `/api/demandara/`. Mutations are POST with `idempotencyKey`; reads are
GET. Field shapes below are the **actual** shapes from `api-contracts.ts`.

### 3.1 `POST /api/demandara/leads` — lead push

- Request `LeadIntakeRequest` (mutation base + fields): `dealerId`, `rooftopId`,
  `source: TrafficSourceKind`, `sourceDetail?` (e.g. `"autotrader_ca"`, `"facebook_marketplace"`),
  `utm?` (`{source?, medium?, campaign?, term?, content?}`), `campaignId?`,
  `contact` (`{firstName, lastName, email?, phone?}` — PII, inbound only),
  `consent` (`{channel, basis, capturedAt, source}` — CASL-aware evidence),
  `interest` (`{vehicleId?, freeText?}`), `occurredAt`.
- Response `LeadIntakeResponse`: `leadId`, `customerId`, `trafficEventId`,
  `receiptId` (the `lead_received` receipt), `duplicateOfCustomerId?`.
- Receipts emitted: `customer_created` (new customers only), `consent_captured`,
  `duplicate_detected` (when matched), `lead_received`.

### 3.2 `GET /api/demandara/context/:leadId` — redacted AI context pack

- Request `LeadContextRequest`: `tenantId`, `leadId` (path param modeled as a field).
- Response `LeadContextResponse`: `leadId`, `customerRefRedacted` (one-way hash ref, `"cust_..."`),
  `stage: LeadStage`, `qualification` (trade-in VIN stripped), `interestVehicles:
  RedactedVehicleInterest[]` (`vehicleId, year, make, model, askingPrice, status` only),
  `recentActivity: RedactedActivityEntry[]` (system-generated summaries, last 10),
  `consentSummary` (per-channel `granted | implied | revoked`; `unknown` omitted),
  `dealerDisplayName`.
- Receipt emitted: `inventory_context_used` when vehicle facts are included.

### 3.3 `POST /api/demandara/reply-drafts` — register an AI reply draft

- Request `ReplyDraftRequest`: `leadId`, `channel: ConsentChannel`, `intentSummary`
  (claim-safe one-liner), `proposedText`.
- Response `ReplyDraftResponse`: `draftId`, `status: 'pending_human_approval'`,
  `requiresHumanApproval: true`, `receiptId` (`ai_reply_drafted`).
- Behavior: claim-unsafe text throws; lead in stage `new` advances to `working`; the draft
  is a work item for the BDC queue in `DEALEROS_DEALERMINE_STYLE_CRM_BDC_SPEC_V1.md`.
  Approval itself is not a send — actual sends stay behind DealerOS outbound gates.

### 3.4 `POST /api/demandara/appointment-drafts` — draft an appointment

- Request `AppointmentDraftRequest`: `leadId`, `kind` (`visit | test_drive | service |
  delivery | trade_appraisal`), `scheduledFor`, `vehicleId?`.
- Response `AppointmentDraftResponse`: `appointmentId`, `status: 'draft'`,
  `draftedBy: 'agent'`, `requiresHumanApproval: true`, `receiptId` (`appointment_drafted`).
- A named human confirms via the DealerOS-side hook (`confirmAppointment`), which moves the
  lead to `appointment_set`, sets `aiAssistedAppointment: true`, and emits `appointment_confirmed`.

### 3.5 `POST /api/demandara/followups` — upsert a follow-up plan

- Request `FollowUpUpsertRequest`: `leadId`, `cadence` (array of
  `{dayOffset, channel, templateKey}`; must be non-empty).
- Response `FollowUpUpsertResponse`: `leadId`, `planStatus: 'active' | 'paused'`,
  `pausedReason?` (`'opt_out'` when any cadence channel has revoked consent),
  `nextTouchAt?` (earliest `dayOffset` from now, only when active), `receiptId` (`crm_updated`).
- Every individual touch still requires human approval before sending; opt-out pauses the
  whole plan with no next touch scheduled.

### 3.6 `POST /api/demandara/campaigns` — register a campaign

- Request `CampaignRegisterRequest`: `dealerId`, `name`, `channel` (see Section 6 taxonomy),
  `createdBy` (`'human' | 'demandara'`), `targetSegment?`, `utmCampaign?`, `startAt?`, `endAt?`.
- Response `CampaignRegisterResponse`: `campaignId`, `status` (`'pending_approval'` when
  `createdBy === 'demandara'`, `'draft'` otherwise), `receiptId` (`campaign_generated`).
- Agent-created campaigns never self-activate.

### 3.7 `GET /api/demandara/outcomes?since=<iso>` — per-lead outcomes

- Request `OutcomesRequest`: `tenantId`, `since` (leads updated at or after this timestamp).
- Response `OutcomesResponse`: `since`, `rows: LeadOutcomeRow[]` where each row is
  `{leadId, campaignId?, stage, appointmentStates[], sold, soldDealId?, lost, lostReason?,
  receiptsCount, updatedAt}`. Rows sorted by `leadId` for deterministic polling.

### 3.8 `GET /api/demandara/revenue-attribution?since=<iso>` — closed-loop attribution

- Request `RevenueAttributionRequest`: `tenantId`, `since?` (only leads created at/after).
- Response `RevenueAttributionResponse`: `rows: CampaignAttributionRow[]` where each row is
  `{campaignId, campaignName, leads, appointments, shows, sold, gross: Money, aiAssistedCount}`.
- `sold`/`gross`/`aiAssistedCount` come from `Deal.attribution` (first **or** last touch
  matching the campaign, counted once per deal); `shows` counts appointments with status
  `completed`. Full walkthrough in Section 7.

### 3.9 `GET /api/demandara/proof-report?periodStart=<iso>&periodEnd=<iso>` — monthly proof report

- Request `ProofReportRequest`: `tenantId`, `periodStart`, `periodEnd`, `label?`
  (defaults to `periodStart.slice(0, 7)`, e.g. `"2026-07"`).
- Response `ProofReportResponse`: `period {start, end, label}`, `totals {leadsReceived,
  aiDraftsCreated, humanApprovedDrafts, appointmentsConfirmed, sold}`, `perCampaign:
  ProofReportCampaignRow[]` (`{campaignId, campaignName, leadsReceived,
  appointmentsConfirmed, sold, gross}`), `receiptIds: ReceiptId[]` (the evidence),
  `disclaimer: typeof PROOF_REPORT_DISCLAIMER`, `requiresHumanApproval: true`.
- Details and the fixed disclaimer text in Section 8.

## 4. Lead intake pipeline and duplicate detection

The `intakeLead` pipeline in `service.ts`, in execution order:

1. **Tenant check** — `assertTenant` throws on mismatch; the adapter instance is single-tenant.
2. **Idempotency gate** — cache key `"intakeLead|" + idempotencyKey`; a replay returns the
   stored response and creates zero new records.
3. **Duplicate detection** — normalize contact points: email lowercased/trimmed
   (`normalizeEmail`), phone reduced to digits (`normalizePhone`). Look up
   `"email:<addr>"` first, then `"phone:<digits>"` in the contact index.
   - **Match** → reuse the existing customer; set `duplicateClusterKey`
     (`"dupc_" + sha256(matchedKey)[0..10]`) so a human can review the merge later — the
     system links, it never auto-merges; refresh segment to `active_lead`; merge any new
     contact methods (first method on a customer becomes `preferred`).
   - **No match** → create a new `Customer` with the inbound name and contact methods.
   - Both branches (re)register the email/phone keys in the index for future dedup.
4. **Consent evidence** — upsert one `ConsentRecord` per channel: status derived from basis
   (`express → granted`, `none → unknown`, otherwise `implied`), with `capturedAt` and
   `source` (e.g. `"website_form:test_drive"`) preserved as evidence.
5. **TrafficEvent** — created with source, `sourceDetail`, `campaignId`, UTM set, and a
   scaffold SLA of a flat 15-minute first-response window (`firstResponseDueAt`). Per-source
   due-at math (after-hours rollover etc.) is owned by `DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md`.
   `interest.freeText` lands in `TrafficEvent.notes` — possible PII, kept inside DealerOS,
   never exposed via the context endpoint.
6. **Lead** — created at stage `new` with `qualification.intent: 'unknown'`, linked to the
   traffic event and any interest vehicle.
7. **Proof receipts** — `customer_created` (new only), `consent_captured` (receipt id stored
   on the consent record), `duplicate_detected` (duplicates only), then `lead_received`
   (receipt id stored on the traffic event and returned as the response `receiptId`).

Duplicate behavior visible to Demandara: the response still returns a fresh `leadId` and
`trafficEventId` (every inquiry is a real traffic event), but `duplicateOfCustomerId` is set
so Demandara can thread the conversation instead of treating the person as new.

## 5. Redacted context pack — what the AI sees vs what stays home

`GET /api/demandara/context/:leadId` is the only read Demandara's models get. Redaction is
by construction, not by filter-at-the-edge:

| Data | AI sees (context pack) | Stays inside DealerOS |
|------|------------------------|----------------------|
| Identity | `customerRefRedacted` = `"cust_" + sha256(customerId)[0..10]` — same ref used on proof receipts, so AI output and receipts correlate without identity | Name, email, phone, raw `customerId`, household, contact methods |
| Free text | Never — activity entries are system-generated template strings only | `TrafficEvent.notes` and any customer-authored text |
| Qualification | Intent, budget range, desired vehicle, timeline, trade-in year/make/model/mileage | Trade-in **VIN** (stripped before the snapshot leaves DealerOS) |
| Inventory | `year, make, model, askingPrice, status` per interest vehicle | `internalCost`, disclosures, damage detail, stock/VIN internals |
| Consent | Per-channel `granted | implied | revoked` so drafts respect opt-outs by construction | Consent evidence records, sources, expiry timestamps |
| History | Last 10 `RedactedActivityEntry` rows (`at, kind, summary`) | Full activity, receipts payloads, user identities |
| Branding | `dealerDisplayName` — the only display string | Everything else about the tenant |

Reading inventory facts is itself receipted (`inventory_context_used`), so the ledger shows
exactly which vehicle facts were available to any AI draft.

## 6. Campaign lifecycle and per-channel taxonomy

Lifecycle (states from `Campaign['status']` in `schemas/core.ts`):

```
demandara-created ──> pending_approval ──(named human approves)──> active ──> paused ──> archived
human-created ──────> draft ────────────(human submits/approves)──> active ──> paused ──> archived
```

Rules: `createdBy: 'demandara'` always enters at `pending_approval` (never `draft`, never
`active`); only a named human transitions to `active` (recorded via `approvedByUserId` +
a `human_approval_granted` receipt); pausing/archiving is human-only; every registration
emits `campaign_generated` with actor type `agent` or `human` matching `createdBy`.

Taxonomy — defaults per `Campaign['channel']` (naming convention:
`{yyyymm}_{channel}_{theme}`; `utmCampaign` mirrors the name):

| Channel | What it covers | Default target segment | Example name / utmCampaign |
|---------|----------------|------------------------|----------------------------|
| `seo_page` | Local SEO / city / category pages on the dealer site | prospect | `202607_seo_page_used_suv_vancouver` |
| `aeo_page` | Answer-engine / AI-overview-friendly answer pages | prospect | `202607_aeo_page_best_used_suv_under_15k` |
| `email` | Consent-gated email sequences | active_lead, orphan_owner | `202607_email_july_service_to_sales` |
| `sms` | Consent-gated SMS sequences (CASL express consent only) | active_lead | `202607_sms_appt_reminders` |
| `social` | Organic social posts + boosted content drafts | prospect | `202607_social_under15k_suv_push` |
| `listing` | Marketplace listing content (Section 9) — always approval-gated | prospect | `202607_listing_autotrader_refresh` |
| `referral` | Referral asks to sold customers | sold_customer | `202607_referral_sold_q2` |
| `review` | Post-delivery review requests | sold_customer | `202607_review_post_delivery` |
| `paid` | Paid search/social/vehicle ads | prospect | `202607_paid_google_vehicle_ads` |

## 7. Closed-loop attribution — the loop, walked end to end

The chain: **UTM capture → TrafficEvent → Lead → Deal.attribution →
`GET /api/demandara/revenue-attribution`**. Concrete fake example (all data fake/reserved;
ids follow the scaffold's deterministic counter with `idSeed: 1`):

1. **Campaign registered.** Demandara calls `POST /api/demandara/campaigns` with
   `{name: "202607_social_under15k_suv_push", channel: "social", createdBy: "demandara",
   utmCampaign: "202607_social_under15k_suv_push"}` → `camp_0001`, status
   `pending_approval`. Desk manager (fake persona) approves → `active`.
2. **UTM capture.** A fake shopper clicks the boosted post and lands on
   `/inventory/2018-hyundai-tucson?utm_source=facebook&utm_medium=social&utm_campaign=202607_social_under15k_suv_push`
   with referrer `m.facebook.com`. `attributionFromRequest` in `build-packets/website/utm.ts`
   parses the five `utm_*` keys, matches the referrer host against the marketplace hints, and
   classifies `{source: 'marketplace', sourceDetail: 'facebook_marketplace', utm: {...}}`.
3. **Lead push.** The website engine submits the test-drive form via
   `POST /api/demandara/leads` carrying that attribution plus `campaignId: camp_0001` and
   fake contact "Jordan Example / jordan@example.test / 604-555-0100" with express email
   consent. Intake creates `cust_0002`, `te_0003` (with the UTM set and `campaignId` stored
   on the TrafficEvent), `lead_0004`, and receipts `customer_created`, `consent_captured`,
   `lead_received`.
4. **AI-assisted working.** Demandara fetches the context pack (sees `cust_1a…`-style
   redacted ref, the 2018 Tucson at $14,500 CAD, email consent `granted`), registers reply
   draft `draft_0005` (`ai_reply_drafted`), a human approves it
   (`human_approval_granted`), and appointment draft `appt_0006` for a test drive is
   confirmed by a named human (`appointment_confirmed`; lead → `appointment_set`;
   `aiAssistedAppointment: true`).
5. **Deal + attribution.** The desk marks the lead sold at $14,500.00 CAD via the
   DealerOS-side hook `recordOutcome` → `deal_0007` with
   `attribution: {firstTouch: {source: 'marketplace', campaignId: 'camp_0001'},
   lastTouch: {source: 'marketplace', campaignId: 'camp_0001'}, aiAssisted: true,
   touchCount: 5}` (scaffold is single-touch, so first == last; touchCount = the five
   activity entries logged before the sale), `soldAt` set,
   `sold_marked` receipt emitted, follow-up plan auto-paused with reason `sold`.
6. **Attribution read-back.** `GET /api/demandara/revenue-attribution` returns:

| campaignId | campaignName | leads | appointments | shows | sold | gross | aiAssistedCount |
|------------|--------------|-------|--------------|-------|------|-------|-----------------|
| camp_0001 | 202607_social_under15k_suv_push | 1 | 1 | 0 | 1 | {amountCents: 1450000, currency: "CAD"} | 1 |

`shows` stays 0 until the desk marks the appointment `completed` (a Module 4 action).
Multi-touch journeys (first ≠ last touch, weighting models) are a V2 concern; the `Deal.
attribution` shape already carries both touches so no schema change is needed.

## 8. Monthly proof-backed marketing report

`GET /api/demandara/proof-report` builds the monthly report **from the receipt log, not from
entity state**: totals are counts of receipts emitted inside the period
(`lead_received`, `ai_reply_drafted` + `appointment_drafted`, `human_approval_granted`,
`appointment_confirmed`, `sold_marked`), per-campaign rows join receipt `campaignId`s with
period-sold deals, and `receiptIds` lists every receipt behind the numbers so any figure can
be audited line-by-line. Two hard rules travel with the struct:

1. **Fixed disclaimer** (`PROOF_REPORT_DISCLAIMER`, verbatim): "INTERNAL DRAFT — figures are
   internal, unaudited operational counts from a reference scaffold. They are not audited
   results, not a performance guarantee, and not authorized for public claims. Human review
   and approval are required before sharing outside the dealership."
2. **`requiresHumanApproval: true`** — the report is an outbound-facing artifact; a named
   human reviews before it leaves the dealership.

This is the receipt-backed answer to "should I renew AutoTrader.ca Go/Smart/Pro, cut Kijiji,
or move budget to Vehicle Ads?" described in `research/marketplaces.md` — per-source
cost-per-sold from the dealer's own ledger, instead of vendor-attributed metrics.

## 9. Listing and social content drafts for marketplaces

Demandara drafts listing/social content; DealerOS gates publication. **Post-listing is always
approval-gated** — a draft becomes a `campaign_generated`-receipted campaign (`channel:
'listing'` or `'social'`) at `pending_approval`, and any actual publish runs through the
Module 12 connector registry with its own human approval + proof receipt.

Grounding from `research/marketplaces.md` (the only vendor facts this spec relies on):

- **Feed formats:** syndication is overwhelmingly FTP + CSV (some flat XML), each marketplace
  with its own column dialect; Google's vehicle feed (CSV/TSV, full-snapshot semantics —
  absent = delisted, ~4-hour refresh, required fields VIN/store_code/price/condition/
  make/model/trim/year + mileage for used) is the baseline schema for a clean export; Kijiji
  dual-publishes one feed to classic Kijiji and Kijiji Autos; ADF/XML remains the inbound
  lead interchange standard.
- **Merchandising factors drafts must optimize:** price competitiveness vs market value,
  photo count/quality, listing freshness/age, trim/options completeness, attached vehicle
  history report, dealer rating, lead response time (consistent across CarGurus Best Match
  and Autotrader/Cars guidance). Draft generation scores content against these before it
  reaches a human.
- **Compliance lint before approval:** true asking price only (Meta bans fake $1/$100 prices;
  Google's Oct 28, 2025 "Dishonest Pricing Practices" policy), mark-sold-within-24h checks,
  feed/VDP price consistency, BC (VSA-regulated) all-in-price advertising language.

NEEDS_EXTERNAL_RESEARCH: AutoTrader.ca Go/Smart/Pro pricing, Kijiji dealer tier names/costs,
Google Vehicle Ads Canada eligibility, and full AutoTrader DemandAI capability list — flagged
in `research/marketplaces.md`; not invented here.

SKIPPED_WITH_REASON: actual per-marketplace feed column mappings and publish API contracts
require vendor accounts/contracts and their partner documentation; V1 ships draft generation
+ approval gating only, with connector mappings deferred to the connector registry packet
and the dedicated repo.

## 10. Failure, retry, and connector_sync receipts

Retry policy (Demandara client side), keyed on the idempotency guarantee — replays with the
same `idempotencyKey` return the stored response and create no duplicates:

| Failure | Retry? | Policy |
|---------|--------|--------|
| Network error / timeout / 5xx | Yes | Same `idempotencyKey`, exponential backoff (1s, 5s, 30s, 2m, 10m; max 5), then dead-letter queue with alert |
| 400 validation (empty cadence, claim-unsafe text, unknown lead) | No | Dead-letter immediately; fix the payload — claim-unsafe rejections are a content bug, not a transport bug |
| 403 tenant mismatch | No | Configuration alert; never retried (possible cross-tenant wiring fault) |
| 409 idempotency conflict (same key, different payload) | No | Dead-letter + alert; keys must be unique per logical operation (`op|idempotencyKey` namespace) |
| GET failures | Yes | Safe to retry freely; reads are side-effect-free and deterministic (rows sorted by id) |

Sync receipts: the demandara adapter's own event vocabulary (`DemandaraProofEventType`)
deliberately excludes `connector_sync_*` — batch operations are the connector registry's
job (Module 12). Required wiring: every scheduled batch (outcome polling via
`GET /api/demandara/outcomes`, attribution pulls, future listing feed pushes) emits
`connector_sync_completed` on success or `connector_sync_failed` on failure, with payload
hash, row counts, and the `since` watermark — so "the feed said $12,900 at 09:00" is provable
when a marketplace disapproves a listing or a vendor invoice disputes lead counts (per
`research/marketplaces.md`). Watermark rule: advance `since` only after a
`connector_sync_completed` receipt exists for the batch; a failed batch replays from the
prior watermark (idempotency makes replays safe).

## 11. API versioning strategy

1. **V1 is additive-only.** The scaffold routes are unversioned (`/api/demandara/*`) and are
   declared contract-version 1. Within v1: new optional request fields and new response
   fields are allowed; removing/renaming fields, changing literal types (e.g.
   `requiresHumanApproval: true`), or weakening redaction guarantees is a breaking change.
2. **Explicit version header.** Clients send `X-Demandara-Contract-Version: 1`; responses
   echo it. Absent header = v1 (grandfathering the scaffold).
3. **Breaking changes get a path prefix** (`/api/demandara/v2/...`) with both versions served
   through a deprecation window of at least one full monthly proof-report cycle, so period
   reports never mix contract semantics.
4. **Types are the contract.** `api-contracts.ts` is the single source of truth; the
   dedicated repo publishes it as a shared package consumed by both sides so drift is a
   compile error, not a runtime surprise. Governance invariants (tenant scoping, idempotency
   keys, `requiresHumanApproval`, redaction) are version-independent floors: no future
   version may relax them.
5. SKIPPED_WITH_REASON: package publication, CI contract tests, and route-level
   version negotiation need the dedicated code repo (`cognitiacloud/dealeros`); not
   implementable in this document library.

## 12. Acceptance criteria (design-level, testable against the mock adapter)

1. Replaying any mutation with the same `idempotencyKey` returns a byte-identical response
   and adds zero records to any store.
2. Two lead pushes with the same normalized email or phone yield one customer, two leads,
   two traffic events, `duplicateOfCustomerId` set on the second response, and a
   `duplicate_detected` receipt — and never an automatic merge.
3. The context pack for any lead contains no name, email, phone, raw customer id, trade-in
   VIN, `internalCost`, or customer-authored free text (property test over seeded data).
4. Every reply draft and appointment draft response carries `requiresHumanApproval: true`,
   and no adapter code path emits a receipt with `externalSideEffect: true`.
5. A campaign registered with `createdBy: 'demandara'` is `pending_approval`; it reaches
   `active` only through a human action that leaves a `human_approval_granted` receipt.
6. A follow-up plan whose cadence includes a revoked-consent channel is stored `paused` with
   `pausedReason: 'opt_out'` and no `nextTouchAt`; a later opt-out pauses every affected plan.
7. The Section 7 walkthrough reproduces exactly on a fresh adapter with `idSeed: 1`:
   the attribution row reads leads 1 / appointments 1 / sold 1 / gross 1,450,000 cents CAD /
   aiAssistedCount 1.
8. Every number in a proof report is reproducible by re-counting the receipts listed in
   `receiptIds`, and the report carries the fixed disclaimer verbatim plus
   `requiresHumanApproval: true`.
9. Draft text containing any deny-list phrase is rejected before storage.

SKIPPED_WITH_REASON: end-to-end HTTP tests, load/rate-limit tests, and live connector
verification require the dedicated repo and live-mode approvals; the criteria above are
scoped to the in-memory reference adapter.

## Boundaries honored

- **Design only; not production ready; no public claims authorized.** This spec and its
  referenced scaffolds are reference material for a future dedicated repo.
- **No live sends, ever, from this API.** Every Demandara action arrives as a draft or
  request; every adapter receipt is hard-typed `externalSideEffect: false`; sends remain
  behind DealerOS human approval + consent gates. No dealership/customer outreach occurred.
- **No live CRM/DMS writes, no live marketplace APIs, no vendor contracts.** Marketplace
  facts come only from `research/marketplaces.md`; unverifiable specifics are marked
  NEEDS_EXTERNAL_RESEARCH, not invented. Mock mode is the default for every connector.
- **No real customer data.** All examples use fake/reserved personas and deterministic
  scaffold ids; PII handling is specified so raw PII never leaves DealerOS via this API.
- **No secrets, no production deploy, no migrations.** The scaffolds are dependency-free,
  network-free TypeScript in this Library repo.
- **Claim-safe language throughout**: no guarantees, no certification claims, no fake proof;
  the proof-report disclaimer and the draft-text deny-list enforce this in the contract
  itself. No crypto/token language anywhere.
