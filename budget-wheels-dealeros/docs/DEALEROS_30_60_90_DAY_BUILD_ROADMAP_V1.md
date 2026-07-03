# DEALEROS 30/60/90-DAY BUILD ROADMAP (V1)

STATUS: INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.

Owner: Muhammad Firoz · Date: 2026-07-03 · Version: V1

This roadmap turns the DealerOS design set into a working internal system: 90
days from "documents + reference scaffolds in `cognitiacloud/Library`" to
"pilot-ready internal platform with a tenant-zero (Budget Wheels) walkthrough,
still zero public claims." It is the operational companion to
`BUDGET_WHEELS_DEALEROS_EXECUTIVE_STRATEGY_V1.md` and assumes the module
architecture in `DEALEROS_FEATURE_MAP_AND_MODULE_ARCHITECTURE_V1.md` and the
tenancy/isolation model in `DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md`.

Ground rules for every day of this roadmap (`CONTEXT_PACK.md` §4): mock mode by
default; no live CRM/DMS writes; no outreach; no production deploy; every
external side effect gated by human approval + proof receipt; fixture data only.

---

## 1. Roadmap at a glance

| Phase | Days | Theme | Ends with |
|---|---|---|---|
| P1 | 1–30 | Build the spine: repo, domain model, traffic desk, mock AI BDC, website scaffold | Internal demo package + tenant-zero walkthrough (all mock) |
| P2 | 31–60 | Harden tenant-zero: fixtures, approval-gated live-adjacent infra (disabled), connector sandbox, eval harness v0, counsel checkpoint | Hardened internal system; counsel review checkpoint held |
| P3 | 61–90 | Pilot-readiness: owner-approved limited live email/SMS with receipts, switcher import tooling, multi-rooftop views, pricing draft, go/no-go framework | Go/no-go decision packet for first external dealer conversation (conversation itself NOT started) |

---

## 2. Days 1–30 — build the spine (week by week)

### Week 1 — Repo baseline and core data model

Deliverables (numbered, dependency order):

1. Create dedicated repo `cognitiacloud/dealeros` (private). This Library repo
   stays the design library; the new repo is the code home (`CONTEXT_PACK.md` §9).
2. Repo skeleton: monorepo laid out exactly per
   `DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md` §3, which is canonical for
   M1 (`apps/desk`, `apps/websites`, `packages/domain`, `packages/proof`,
   `packages/connectors`, `packages/ai`, `packages/ui`, `services/api`,
   `services/jobs`), strict TypeScript, CI (typecheck + unit tests per PR),
   branch protection on `main`, and — deliberately — no deploy pipeline.
3. Lift `build-packets/` into `packages/domain` (and sibling packages) as the
   starting vocabulary, preserving the six "Rules encoded here" invariants from
   `build-packets/README.md` as executable tests, not comments.
4. Core data model persisted (Postgres, migrations in-repo, dev/local only):
   tenancy chain Tenant → DealerGroup? → Dealer → Rooftop exactly as in
   `build-packets/schemas/core.ts`; row-level isolation keyed on `tenantId`.
5. Tenant/dealer/rooftop seed: tenant-zero "Budget Wheels", one dealer, one
   rooftop (Vancouver BC, `America/Vancouver`), license number a placeholder.
6. Traffic desk schema: `TrafficEvent`, `SlaState`, `TrafficOutcome`, source
   kinds, SLA due-at math ported from the `traffic-desk/` packet.
7. Inventory / customer / lead model: `Vehicle` (+ disclosures +
   merchandising state), `Customer` (+ CASL-aware `ConsentRecord`), `Lead`,
   `Appointment`, `Deal`, `WorkTask` — all from `core.ts`, no shape drift
   without a schema-change PR template.
8. Proof receipt schema + emitter: hash-chained receipts from the `cognitia/`
   packet wired to a persistence layer; every write path in items 4–7 emits the
   event types listed in `DEALEROS_COGNITIA_PROOF_ADAPTER_V1.md`.
9. Connector registry skeleton: mock/sandbox/live enum, env-var-name-only
   secrets, live mode structurally requiring an approval receipt — registry
   only, zero real adapters beyond the existing mocks.

Exit criteria:
- `cognitiacloud/dealeros` exists; CI green; packets lifted with all packet
  tests passing in the new repo.
- Seeded tenant-zero queryable through a thin internal API; cross-tenant read
  attempts fail in an integration test.
- Creating a traffic event, customer, vehicle, and lead each emits a valid
  hash-chained proof receipt; chain verification test passes.
- Connector registry rejects a secret-looking value and rejects live mode
  without an approval receipt (both as tests).

Demo artifact: terminal/API walkthrough recording — seed tenant-zero, create a
traffic event, show the receipt chain verifying.

Stays mocked: everything external; no UI yet; model providers not called.

SKIPPED_WITH_REASON: creating the GitHub repo requires the owner's account
action outside this Library workspace; the step is specified here, not executed.

### Week 2 — TMS traffic desk MVP + Demandara intake skeleton

Deliverables:

1. TMS traffic desk MVP (first UI): log phone/internet/walk-in/website/
   marketplace/after-hours/service-drive/referral/partner traffic; SLA timers
   with breach + escalation surfaced per `DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md`.
2. Lead pipeline: traffic event → lead promotion, stage machine
   (`new` → … → `sold`/`lost`), assignment (round-robin from packet logic),
   sold/lost reasons mandatory on close.
3. Appointment board: draft/proposed/confirmed/completed/no_show/cancelled;
   AI-drafted appointments visibly distinct and unconfirmable without a named
   human user.
4. Source/campaign attribution: UTM capture on website-shaped fixture leads,
   first-touch/last-touch stored on `Deal.attribution`.
5. Proof receipt emitter wired end-to-end in the UI paths: `lead_received`,
   `appointment_drafted`, `appointment_confirmed`, `sold_marked`,
   `lost_reason_recorded` all observable in an internal receipt viewer.
6. Demandara lead intake / context API skeleton: `POST /api/demandara/leads`
   and `GET /api/demandara/context/:leadId` implemented against the in-memory
   adapter contract from the `demandara/` packet (see
   `DEALEROS_DEMANDARA_DEMAND_GEN_HARNESS_V1.md`); context packs redacted.

Exit criteria:
- A fixture internet lead flows: intake → SLA timer → assignment → appointment
  set → sold, with a complete receipt trail viewable per lead.
- SLA breach path demonstrably escalates (deterministic injected clock).
- Demandara endpoints pass contract tests; context pack contains zero raw PII
  fields (assert against the `// PII` inventory in `core.ts`).

Demo artifact: screen recording of the traffic desk day-in-the-life on fixture
data, ending on the receipt viewer for one sold lead.

Stays mocked: all lead sources are fixtures; Demandara is the in-memory
adapter; no email/SMS/voice anywhere; no model calls yet.

### Week 3 — AI BDC mock-first + equity mining + approval gate

Deliverables:

1. AI BDC mock-first per `DEALEROS_AI_BDC_AND_SALES_CLOSER_SPEC_V1.md`:
   lead classification, intent detection, reply/appointment/follow-up drafts —
   behind the AI harness router (`packages/ai`) with a deterministic mock
   provider default. Real model providers stay off everywhere in P1: they are
   Module 12 connectors, so promoting them out of mock is a §8 standing-gate
   decision requiring an owner approval receipt plus the cost cap set at Gate
   G1 — earliest Days 31–60, local dev only, never CI (see §6 item 5). The
   redaction gate must be proven on (tests below) before that promotion can
   even be proposed.
2. Equity mining mock scoring on real-shaped fixture data: deterministic factor
   scoring, bands, reason codes, inventory matching, next-best-action from the
   `equity-mining/` packet, per `DEALEROS_AUTOALERT_STYLE_EQUITY_MINING_SPEC_V1.md`.
3. Reply / appointment / follow-up draft tools in the UI: every draft is
   `requiresHumanApproval: true`; there is no send button — only
   "approve draft" which records the approval and does nothing outbound.
4. Human approval gate UI: queue of pending drafts, named approver, approve /
   edit-then-approve / reject with reason; each decision emits
   `human_approval_requested` / `human_approval_granted` receipts.
5. Tests: redaction gate property tests (no `// PII`-marked field reaches a
   provider payload), approval-gate bypass attempts fail, equity scoring
   snapshot tests under injected timestamps, receipt chain integrity across a
   full BDC scenario.

Exit criteria:
- NO live SMS/calls/emails exist in the codebase — verified by a CI check that
  no outbound transport dependency is present.
- Approving a draft produces receipts but zero side effects.
- Equity run over 50 fixture customers produces stable, explainable scores
  (same input → same output).
- Redaction test suite green; usage ledger records every mock model call.

Demo artifact: recorded flow — fixture lead arrives, AI drafts reply +
appointment, manager approves in the gate UI, receipt trail shown; plus the
equity-mining "hot list" screen on fixture data.

Stays mocked: model provider, all outbound channels (non-existent by design),
equity inputs (fixture owned-vehicle records).

### Week 4 — Website scaffold, dashboard, verification, tenant-zero walkthrough

Deliverables:

1. Website / inventory / VDP / SEO / AEO scaffold per
   `DEALEROS_SEO_AEO_AIO_WEBSITE_ENGINE_V1.md`: homepage, inventory list, VDP
   template with schema.org JSON-LD and AEO answer blocks from the `website/`
   packet; claim-safety linter in CI; local render only, nothing public.
2. Campaign attribution loop closed: fixture campaign → UTM'd fixture lead →
   traffic event → sold deal → attribution visible on the campaign; feeds
   `GET /api/demandara/outcomes` and `/revenue-attribution`.
3. Manager dashboard: traffic-to-sale funnel, SLA compliance, source
   performance, appointment show/no-show, approval-queue depth — fixture data.
4. Codex verification packet: scripted checklist an independent agent/reviewer
   runs against the repo (invariants 1–6 from `build-packets/README.md`, tenant
   isolation, receipt chain verification, claim-safety lint) with pass/fail
   output committed as an artifact.
5. Internal demo package: the three weekly recordings + dashboard tour + a
   one-page claim-safe narrative (internal only).
6. Tenant-zero Budget Wheels walkthrough: the owner runs the full loop — log
   walk-in, take internet lead, approve AI draft, set appointment, mark sold,
   read the receipts — and files written feedback.

Exit criteria:
- Verification packet passes clean on a fresh clone.
- Claim-safety linter blocks a deliberately seeded banned phrase
  ("production ready", "#1", "guaranteed") in a test page.
- Owner walkthrough completed; feedback logged as issues; owner explicitly
  signs Gate G1 (below) to enter Days 31–60.

Demo artifact: the internal demo package itself.

Stays mocked: hosting (local only), all connectors, all channels, model
providers (mock everywhere in P1, including CI).

---

## 3. Days 31–60 — tenant-zero hardening

Deliverables (numbered):

1. **Fixture inventory seed**: 40–60 realistic-shaped, fully fake Budget Wheels
   vehicles (VINs from reserved/invalid ranges, fake stock numbers), full
   merchandising state, disclosures exercised, photos as placeholder assets.
2. **Walkthrough feedback burn-down**: every Gate-G1 issue triaged; P0/P1 fixed.
3. **Send-window infrastructure built but disabled**: outbound message
   scheduler honoring per-tenant quiet hours, CASL-relevant consent checks, and
   channel opt-outs — compiled in, feature-flagged OFF at the tenant level,
   with a test proving the flag cannot be enabled without an owner approval
   receipt. Still zero transport adapters that can actually send.
4. **Connector sandbox for one inventory feed**: CSV/XML inventory-feed
   connector run in `sandbox` mode against a local fake feed file; sync
   emits `connector_sync_completed` / `connector_sync_failed` receipts;
   mapping report shows field-level lineage.
   NEEDS_EXTERNAL_RESEARCH: real AutoTrader.ca/AutoSync-style feed specs beyond
   `research/autosync-trader.md` and `research/marketplaces.md`; no invented
   vendor field names — sandbox uses our documented fake format until verified.
5. **Eval harness v0** per `DEALEROS_AI_MODEL_HARNESS_AND_CONNECTOR_REGISTRY_V1.md`:
   golden-set fixtures for lead classification, reply drafting tone/claim
   safety, and equity explanations; eval runs stay on mock/local providers in
   V1 per `DEALEROS_AI_BDC_AND_SALES_CLOSER_SPEC_V1.md` §11.7; scored runs
   recorded in the usage ledger; regression threshold gates merges touching
   prompts (prompt/version registry live).
6. **Duplicate detection + privacy paths hardened**: merge-review queue,
   right-to-delete and export flows exercised on fixture customers, receipts
   emitted.
7. **Compliance counsel review checkpoint (prepared + held)**: assemble a
   counsel briefing pack — consent model, CASL express/implied windows, BC
   advertising/disclosure handling, AI-disclosure footer, opt-out flows —
   drawing on `research/canada-compliance.md`.
   SKIPPED_WITH_REASON: the legal review itself requires licensed counsel; this
   roadmap schedules the checkpoint and briefing pack only. Until counsel
   responds, compliance features stay labeled "designed-for, not verified."

Exit criteria:
- Full demo runs on the seeded fixture inventory with zero hand-edited data.
- Send-window flag verified OFF; enabling attempt without approval receipt
  fails in test and in the UI.
- Sandbox feed sync is idempotent (re-run produces no duplicates) and fully
  receipted.
- Eval harness v0 produces a baseline scorecard checked into the repo.
- Counsel briefing pack delivered to counsel; questions logged; Gate G2 review
  held with the owner.

Demo artifact: "hardened tenant-zero" recording — feed sync, dedup review,
eval scorecard, disabled send-window UI showing the locked state.

Stays mocked/disabled: all outbound sending (infra present, disabled), all
CRM/DMS connectors (mock), voice entirely, hosting (local/internal only).

---

## 4. Days 61–90 — pilot-readiness (still no public claims)

Deliverables (numbered):

1. **Owner-approved limited live mode for email/SMS with receipts**: scope is
   internal-recipient testing only — owner-controlled test inboxes/phones on a
   code-enforced allowlist, tenant-zero only. Requires: Gate G3 signed, counsel
   feedback incorporated, transport adapter configured via env-var names only,
   every send preceded by a `human_approval_granted` receipt and followed by a
   `followup_sent` receipt with `external_side_effect: y`. Any recipient off
   the allowlist is a hard block, not a warning.
   SKIPPED_WITH_REASON: selecting/contracting the SMS/email vendor requires a
   real vendor account and contract review; the adapter interface is built,
   vendor onboarding is an owner task.
2. **DealerMine/TMS import tooling for switchers**: file-based import (CSV/
   export-dump shaped) mapping customers, owned vehicles, service history, and
   open leads into DealerOS shapes, with dry-run diff, dedup pass, consent
   status defaulting to `unknown` (never assumed granted), and per-row import
   receipts. Built and tested against fake export fixtures modeled on
   `research/dealermine.md` and `research/tms-canada.md`.
   NEEDS_EXTERNAL_RESEARCH: actual DealerMine/TMS export layouts are unverified
   beyond those research files; the importer ships with our documented fixture
   format plus a mapping layer for when a real sample is lawfully obtained.
3. **Dealer-group multi-rooftop views**: group-level dashboard (funnel, SLA,
   source performance rolled up), rooftop switcher, per-rooftop permissions
   honored, tested with a synthetic 2-dealer/3-rooftop tenant alongside
   tenant-zero to prove isolation.
4. **Pricing model draft (internal)**: cost model (infra + model usage from the
   ledger + support load), 2–3 packaging options aligned to Tenant `plan`
   values (`starter`/`pro`/`group`), competitor price anchors marked
   NEEDS_EXTERNAL_RESEARCH where `research/` files lack verified current
   pricing. No prices communicated externally.
5. **Go/no-go decision framework for first external dealer conversation**:
   a scored checklist (see §8 Gate G5) the owner uses to decide whether to
   *begin preparing* outreach. Outreach itself stays blocked pending the
   separate owner-approved outreach approval packet referenced in
   `CONTEXT_PACK.md` §5 — this roadmap does not authorize any contact.
6. **Verification packet v2 + pilot runbook**: updated Codex verification
   checklist covering live-mode gating, allowlist enforcement, import
   idempotency; internal runbook for operating tenant-zero day-to-day.

Exit criteria:
- 10 consecutive approved live test sends (owner-owned endpoints only) each
  with a complete receipt pair; zero sends without approval in logs.
- Import dry-run + real import of a 1,000-row fake DealerMine-shaped export
  completes idempotently with a reconciliation report.
- Multi-rooftop tenant shows correct rollups; cross-tenant isolation tests
  still green.
- Pricing draft and go/no-go framework reviewed with owner at Gate G5; a
  written go/no-go decision exists (either answer is a valid exit).

Demo artifact: pilot-readiness review deck (internal) + live-mode receipt trail
export for the 10 test sends.

Stays mocked/blocked: all real-dealer data (none exists in the system), voice
calls, CRM/DMS write-back, marketplace posting, any deploy for real dealers,
any outreach.

---

## 5. Dependency-ordered milestone table

| # | Milestone | Days | Depends on | Owner sign-off |
|---|---|---|---|---|
| M1 | `cognitiacloud/dealeros` repo + CI + packets lifted | 1–3 | — | — |
| M2 | Core schema persisted + tenant-zero seed + isolation tests | 3–5 | M1 | — |
| M3 | Proof emitter wired to all write paths | 4–7 | M2 | — |
| M4 | Connector registry skeleton | 5–7 | M2 | — |
| M5 | Traffic desk MVP UI + lead pipeline + appointment board | 8–12 | M2, M3 | — |
| M6 | Attribution capture + Demandara intake/context APIs | 11–14 | M5 | — |
| M7 | AI BDC mock-first + approval gate UI | 15–19 | M5, M3 | — |
| M8 | Equity mining mock scoring + hot list | 17–21 | M2 | — |
| M9 | Website/VDP/SEO/AEO scaffold + claim-safety lint in CI | 22–26 | M2 | — |
| M10 | Manager dashboard + attribution loop closed | 24–27 | M6, M9 | — |
| M11 | Verification packet v1 + internal demo package | 27–29 | M5–M10 | — |
| M12 | Tenant-zero owner walkthrough | 29–30 | M11 | **G1** |
| M13 | Fixture inventory seed + feedback burn-down | 31–38 | M12 | — |
| M14 | Send-window infra (disabled) | 35–45 | M7 | — |
| M15 | Inventory-feed connector sandbox | 38–48 | M4, M13 | — |
| M16 | Eval harness v0 + prompt registry gating | 40–52 | M7, M8 | — |
| M17 | Counsel briefing pack sent; checkpoint held | 45–60 | M14 | **G2** |
| M18 | Limited live email/SMS (allowlisted, receipted) | 61–72 | M14, M17 | **G3** |
| M19 | DealerMine/TMS switcher import tooling | 61–78 | M13 | — |
| M20 | Multi-rooftop group views + isolation proof | 66–80 | M2, M10 | — |
| M21 | Pricing model draft | 75–85 | M16 usage data | **G4** |
| M22 | Go/no-go framework + pilot-readiness review | 80–90 | M18–M21 | **G5** |

---

## 6. Staffing / agent-harness assumptions

1. Human staffing: 1 owner-operator (Muhammad Firoz — decisions, approvals,
   walkthroughs, vendor/counsel engagement) + effectively 1–2 FTE-equivalents
   of engineering capacity delivered primarily through supervised AI coding
   agents. No hires assumed in 90 days.
2. Agent harness: coding agents work in the dedicated repo on short-lived
   branches; every merge requires CI green + the verification checklist;
   agents never hold secrets (env-var names only, per registry rules).
3. Independent verification: a separate "verifier" agent run (the Codex
   verification packet, M11/M22) reviews invariants rather than the authoring
   agent grading itself.
4. Throughput assumption: week-scale milestones above assume roughly 20–30
   supervised agent-hours/week plus 8–10 owner-hours/week for review and
   approvals. If owner review time drops below ~5 h/week, expect P1 to slip by
   1–2 weeks — the approval gates are intentionally not removable to recover
   schedule.
5. Model usage: mock provider in CI always, and everywhere during P1. Real
   providers become usable only after Gate G1, where the owner sets the monthly
   cost cap and signs the standing-gate approval receipt (§8 item 6) promoting
   the model-provider connectors out of mock — and then only metered, in local
   dev, tracked in the usage ledger. Eval runs (M16) stay on mock/local
   providers in V1 per `DEALEROS_AI_BDC_AND_SALES_CLOSER_SPEC_V1.md` §11.7;
   live provider keys in production remain [LATER] per
   `DEALEROS_FEATURE_MAP_AND_MODULE_ARCHITECTURE_V1.md` M13.

---

## 7. Top 10 execution risks and mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Scope creep across 15 modules stalls the spine | High | High | Weeks 1–4 lock to the module subset above; everything else needs an owner-approved scope change |
| 2 | Schema drift between Library packets and the new repo | Med | High | Packets lifted once (M1); `core.ts` in `packages/domain` becomes the single source; Library copies marked frozen |
| 3 | Approval gate quietly bypassed by a convenience code path | Med | Critical | CI check that no outbound transport exists pre-M14; post-M14, allowlist + approval receipt asserted in integration tests on every send path |
| 4 | Fixture data accidentally shaped like real PII | Low | High | Reserved/invalid VIN ranges, fake phone/email patterns, a fixture-linter that rejects plausible real identifiers |
| 5 | Counsel checkpoint slips and blocks live mode | Med | Med | Gate G3 hard-depends on G2; if counsel is delayed, Days 61–90 reorder to M19/M20/M21 first — live mode moves, it is never un-gated |
| 6 | Vendor facts assumed instead of verified (feeds, exports, pricing) | Med | Med | NEEDS_EXTERNAL_RESEARCH markers enforced in review; importers/connectors built against our documented fake formats with adapter layers |
| 7 | AI draft quality unacceptable to a real dealer workflow | Med | Med | Eval harness v0 (M16) with claim-safety and tone golden sets before any live send; owner reviews eval scorecards at G3 |
| 8 | Receipt volume/perf makes the proof ledger a bottleneck | Low | Med | Hash-chain per tenant, async emission with backpressure test in M3; receipts are append-only and never on the UI hot path |
| 9 | Single-owner bottleneck on approvals and decisions | High | Med | Weekly fixed review block; gates batched; everything else proceeds without sign-off by design |
| 10 | Temptation to demo externally before gates pass | Med | Critical | Status banners in every artifact; go/no-go framework (G5) is the only path to external conversation; outreach packet remains blocked |

---

## 8. Owner decision gates (explicit list)

Only Muhammad Firoz can pass a gate; every gate decision is itself receipted
(`human_approval_granted`).

1. **G1 (Day ~30)** — Accept the P1 spine after the tenant-zero walkthrough;
   set the model-usage cost cap; approve or defer promoting the model-provider
   connectors out of mock for local dev use (a standing-gate decision per
   item 6, receipted); approve entering P2.
2. **G2 (Day ~60)** — Counsel checkpoint reviewed: accept the briefing pack
   outcome and decide what (if anything) it changes for send-window rules.
3. **G3 (Days 61–72)** — Enable limited live email/SMS: approve vendor choice,
   allowlist contents (owner-controlled endpoints only), and the live-mode
   flag flip for tenant-zero.
4. **G4 (Day ~85)** — Accept the internal pricing model draft (no external
   communication of pricing).
5. **G5 (Day ~90)** — Go/no-go on *preparing* a first external dealer
   conversation, scored on: verification packet v2 clean; 10/10 receipted test
   sends; counsel feedback incorporated; eval scorecard ≥ agreed baseline;
   import tooling proven on fixtures; claim-safe talk track drafted. A "go"
   still only unlocks preparation of the outreach approval packet — sending
   any outreach requires that separate packet's own approval.
6. **Standing gate** — Any new connector moving from mock → sandbox or
   sandbox → live; any change to `piiToExternalModelsAllowed`; any change to
   `humanApprovalRequiredFor` defaults.

---

## 9. What we will NOT do in 90 days

1. No deploy to production for real dealers — tenant-zero runs internally;
   no external dealer gets credentials or data in the system.
2. No public launch, public website claims, or marketing pages presented as
   live product claims — website engine output stays internal.
3. No paid ads of any kind (search, social, marketplace boosts).
4. No compliance claims — no "CASL compliant", "PIPEDA compliant", "SOC 2"
   anything; only "designed-for, pending counsel/verification" language.
5. No customer or dealership outreach — no emails, SMS, calls, DMs, or demos to
   external dealers; the outreach approval packet remains unsent and blocked.
6. No live CRM/DMS writes and no live DealerMine/TMS/CDK/etc. integration —
   connectors reach sandbox-on-fake-data at most.
7. No real customer PII enters the system — fixtures only, enforced by the
   fixture linter.
8. No production migrations against any shared/hosted environment.
9. No token/crypto/marketplace mechanics in the agent-economy skeleton
   (internal primitives only, per `DEALEROS_AGENT_ECONOMY_COMPATIBILITY_SKELETON_V1.md`).
10. No "production ready" language in any artifact, including this one.

---

## Boundaries honored

- **No production deploy, no production migrations**: all 90 days run
  local/internal; deploy pipeline deliberately absent in P1; §9 items 1 and 8.
- **No live CRM/DMS writes; no live DealerMine/TMS integration**: connectors
  mock by default, sandbox only on fake data (M15); import tooling operates on
  fake export fixtures (M19).
- **No dealership/customer outreach; no public launch claims**: limited live
  sends in P3 target owner-controlled endpoints on a hard allowlist only;
  external outreach stays blocked behind the separate outreach approval packet
  (§8 G5, §9 items 2 and 5).
- **No real customer PII; no fake customer proof**: fixture-only data with a
  fixture linter; proof receipts describe internal fixture actions and are
  never presented as customer proof.
- **No secrets, no real API keys**: env-var names only; registry rejects
  secret-looking values; agents never hold secrets.
- **Live mode gated by human approval + proof receipt**: send-window flag,
  connector mode changes, and every live send require a named-approver receipt;
  structurally enforced and tested.
- **No crypto/token language; no unsupported compliance claims; no
  "production ready" claims**: claim-safety linter in CI (M9); compliance
  posture stays "designed-for, pending counsel" until Gate G2 outcomes say
  otherwise.
- Blocked or unverifiable items are marked inline with `SKIPPED_WITH_REASON:`
  (repo creation, counsel engagement, vendor contracting) and
  `NEEDS_EXTERNAL_RESEARCH:` (feed formats, export layouts, competitor
  pricing) rather than invented.
