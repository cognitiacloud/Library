# DEALEROS MUHAMMAD DECISION BOARD (V1)

STATUS: INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.

Owner: Muhammad Firoz · Date: 2026-07-03 · Version: V1

Purpose: the consolidated board of open founder decisions for Budget Wheels
DealerOS. The open-decision material is otherwise scattered across sibling
docs — the decision asks in `BUDGET_WHEELS_DEALEROS_EXECUTIVE_STRATEGY_V1.md`
Section 10, the stack recommendations in
`DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md` Sections 2–3, and the open
decisions in `DEALEROS_AI_MODEL_HARNESS_AND_CONNECTOR_REGISTRY_V1.md`
Section 19. This board pulls them into one owner-facing list with options,
trade-offs, and recommended defaults, and indexes the decision material that
deliberately stays where it is (roadmap gates, defaults already locked in
their specs). The analysis of record for every decision remains in the cited
sibling section; this board summarizes, it does not replace. If this board
and a sibling ever disagree, the sibling's analysis governs and this board
must be re-versioned.

---

## 1. How to read this board

Decision states:

- **PROPOSED** — a recommended default exists; nothing proceeds on it until
  Muhammad approves or substitutes.
- **BLOCKED** — cannot responsibly be decided yet; carries a
  `SKIPPED_WITH_REASON:` or `NEEDS_EXTERNAL_RESEARCH:` marker (Section 6).
- **LOCKED (V1)** — a sibling doc has locked a default for V1; revisiting it
  means re-versioning that doc, not editing this board.

Rules:

1. Only Muhammad Firoz (owner / final decision-maker per `CONTEXT_PACK.md`
   Section 1) can move a decision out of PROPOSED or BLOCKED.
2. Every decision, once made, is itself receipted
   (`human_approval_granted`), following the gate rule in
   `DEALEROS_30_60_90_DAY_BUILD_ROADMAP_V1.md` Section 8.
3. At V1, **nothing on this board is decided**. A future version records
   date + receipt reference per decided entry.
4. A recommended default is a starting position, not a commitment; adopting
   a default here authorizes design work only — never a deploy, migration,
   live integration, or outreach.

## 2. Strategy decisions (analysis of record: `BUDGET_WHEELS_DEALEROS_EXECUTIVE_STRATEGY_V1.md` §10)

Strategy Section 10 states these eight asks as the V1 decision record; this
board adds the option set and trade-offs behind each.

| ID | Ask | Options considered | Trade-offs | Recommended default | Analysis of record | State |
|---|---|---|---|---|---|---|
| D-S1 | V1 build target | (a) Wedge-only (traffic desk + Sales Closer + AI-assisted follow-up + receipts); (b) several modules built in parallel; (c) connector-first coexistence play | (a) fastest falsifiable proof, single wedge metric, but defers equity/service/demand-gen value; (b) broader demo surface but scope sprawl with one founder-operator (strategy risk #5); (c) meets franchise-adjacent stores where they are but depends on integrations we do not have (strategy risk #9) | (a) Wedge-only; everything else sequenced behind it | Strategy §6 (sequencing), §9 (risks 5, 9) | PROPOSED |
| D-S2 | Dedicated repo | (a) Create `cognitiacloud/dealeros` in Week 1 and lift `build-packets/` scaffolds; (b) keep building inside this Library repo; (c) defer repo until more design is done | (b) violates the repo-reality note — the Library is a document archive, not the production codebase; (c) delays the only path to falsifiable tenant-zero gates | (a) Create the repo Week 1, with the layout proposed in architecture §3 | Architecture §3; `CONTEXT_PACK.md` §9 | PROPOSED |
| D-S3 | Tenant-zero acceptance bar | (a) Ratify gates T0-1…T0-8 as written; (b) trim gates to move faster; (c) add gates | (b) weakens the bar that protects the no-outreach boundary; (c) risks an unpassable bar before anything runs | (a) Ratify as written; revise only at re-version | Strategy §5.1 | PROPOSED |
| D-S4 | Pricing principles | (a) Per-rooftop flat + transparent, no per-seat, Demandara attach, priced under the replaced stack; (b) per-seat pricing; (c) quote-gated pricing like incumbents | (a) transparency is itself a differentiator in a 100% quote-gated category; (b)–(c) reproduce documented dealer pain and erase the positioning | (a) Confirm the four principles — principles only; price points stay blocked (D-B1) | Strategy §8 | PROPOSED |
| D-S5 | Claim-safe language register | (a) Adopt the register now for all future-facing copy; (b) draft copy ad hoc and review later | (b) invites exactly the overclaim drift named in strategy risk #8 | (a) Adopt now; wedge phrasing per strategy §6, prohibitions per `CONTEXT_PACK.md` §7 | Strategy §6, §9 (risk 8) | PROPOSED |
| D-S6 | Legal counsel scope | (a) Approve the three-item scope (CASL/PIPEDA/PIPA product-behavior review; VSA/OMVIC listing-linter rule text; AI-disclosure copy); (b) narrower scope; (c) defer engagement | (b)–(c) leave hard policy gates and the ad pre-flight running on unreviewed rule text longer | (a) Approve the scope; the counsel work itself is blocked (D-B2) | Strategy §10 item 6, §9 (risks 3, 4) | PROPOSED |
| D-S7 | Agent-economy layer | (a) Hold at internal skeleton (Module 15) until layers 1–3 validate at tenant-zero, explicit go/no-go later; (b) accelerate agent-economy work now | (b) builds reward mechanics on an unvalidated evidence base and raises token/securities-perception risk (strategy risk #10) | (a) Hold; defaults inside the skeleton are already locked (see Section 5) | Strategy §3, §9 (risk 10); `DEALEROS_AGENT_ECONOMY_COMPATIBILITY_SKELETON_V1.md` §8 | PROPOSED |
| D-S8 | Review cadence | (a) 30/60/90-day checkpoints against the roadmap; strategy re-versioned (V2) after the Week-4 internal demo; (b) ad hoc review | (b) removes the standing moment where this board gets decided entries | (a) Adopt; this board re-versions alongside the strategy doc | Strategy §10 item 8 | PROPOSED |

## 3. Architecture and stack decisions (analysis of record: `DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md` §2–3)

Every row of architecture Section 2 is explicitly "RECOMMENDATION — pending
owner approval". Full rationale and the alternatives-considered text live
there; this board compresses each to the choice and its one-line trade-off.
Approving D-S2 (repo creation + layout) plus this table clears the stack for
the Week-1 scaffold.

| ID | Layer | Recommended default | Main alternatives | One-line trade-off | State |
|---|---|---|---|---|---|
| D-A1 | Language | TypeScript everywhere (strict) | Go for services; Python | Alternatives split the type system from the domain schema the build packets already encode | PROPOSED |
| D-A2 | Repo shape | Monorepo (pnpm workspaces + Turborepo or Nx) | Polyrepo | Polyrepo drifts across 9+ packages; tool pick within the default is blocked (D-B3) | PROPOSED (tool choice BLOCKED) |
| D-A3 | Desk UI + dealer websites | Next.js (App Router), two apps | Remix; SPA + static site | SSR/ISR is needed for VDP + local-SEO page generation | PROPOSED |
| D-A4 | API layer | Node (Fastify) REST + typed client; tRPC acceptable desk-internal | NestJS; Next.js API routes only | Demandara API, webhooks, and jobs need a UI-independent service | PROPOSED |
| D-A5 | Database | PostgreSQL 16+ with RLS | MySQL; SQLite/Turso | RLS is the tenancy backbone; alternatives weaken it | PROPOSED |
| D-A6 | ORM/query | Drizzle ORM or Kysely + SQL migrations | Prisma | RLS policies must live in checked-in SQL, never ORM magic | PROPOSED |
| D-A7 | Job queue | Redis + BullMQ | pg-boss / Graphile Worker (acceptable substitute); SQS/Cloud Tasks | Postgres-based queue is one less service if the owner prefers fewer moving parts; cloud queues lock a vendor early | PROPOSED |
| D-A8 | Object storage | S3-compatible bucket (MinIO local) | Binaries in Postgres; vendor SDK coupling | `assetRef` stays storage-agnostic; photo volumes rule out Postgres | PROPOSED |
| D-A9 | AI providers | Via the model router only (OpenAI / Anthropic / OpenRouter / local Ollama) | Direct SDK calls from app code | Direct calls are forbidden — they bypass redaction and receipts | PROPOSED |
| D-A10 | Auth | Session-based auth in our API; RoleKey RBAC from core.ts | Auth0 / Clerk / WorkOS | Tenant/role model lives in our DB regardless; hosted-IdP go/no-go is blocked (D-B4) | PROPOSED (vendor go/no-go BLOCKED) |
| D-A11 | Observability | Structured JSON logs + OpenTelemetry traces; provider TBD | Hosted vendors | Receipts are the audit trail, logs/traces the ops trail; vendor pick is blocked (D-B5) | PROPOSED (vendor BLOCKED) |

Local-first default (architecture §2): `docker compose` with Postgres,
Redis, MinIO, and optional Ollama is the reference environment until the
owner gates anything beyond it.

## 4. AI harness / connector registry decisions (analysis of record: `DEALEROS_AI_MODEL_HARNESS_AND_CONNECTOR_REGISTRY_V1.md` §19)

| ID | Decision | Options | Trade-offs | Recommended default | State |
|---|---|---|---|---|---|
| D-H1 | Promote `AiTaskKind`, `ModelProviderKind`, `ModelUsageRecord` into `schemas/core.ts` | (a) Promote in the dedicated repo's first schema pass; (b) keep them module-local | (a) Cognitia receipts and the connector registry share one vocabulary (the SCHEMA_NOTEs already flag this); (b) avoids core.ts churn but forks the vocabulary | (a) Promote | PROPOSED |
| D-H2 | Receipt requirement for sandbox promotion | (a) Sandbox promotion requires a receipt like live does (uniform ladder); (b) receipts start only at live | (a) more approvals, but no ambiguity about where governance begins on the mock→sandbox→live ladder; (b) lighter, but creates an ungoverned middle rung | (a) Uniform ladder, pending owner sign-off | PROPOSED |
| D-H3 | Per-tenant routing overrides | (a) Local-only-direction overrides in V1 (a tenant may pin more tasks local, never route a local-pinned task external); (b) fully bidirectional overrides; (c) no overrides | (a) overrides can only strengthen the privacy posture; (b) could route local-pinned tasks to external models; (c) blocks legitimate privacy-tenant needs | (a) Adopt | PROPOSED |
| D-H4 | Per-tenant cost budgets | (a) Daily/monthly budgets on top of per-call caps, added in the dedicated repo; (b) per-call caps only | (a) protects against runaway aggregate spend and the usage ledger already supports the query; (b) simpler but caps nothing cumulative | (a) Add | PROPOSED |

## 5. Decision material that stays where it is (index)

Not everything decision-shaped belongs on this board. The following lists
are indexed here, not duplicated:

| Where | What | Why it stays there |
|---|---|---|
| `DEALEROS_30_60_90_DAY_BUILD_ROADMAP_V1.md` §8 | Owner decision gates G1–G5 plus the standing gate (mock→sandbox→live promotions, `piiToExternalModelsAllowed` changes, `humanApprovalRequiredFor` changes) | Time-sequenced execution gates, not open design choices; each is decided at its checkpoint and receipted |
| `DEALEROS_AGENT_ECONOMY_COMPATIBILITY_SKELETON_V1.md` §8 | Module 15 decision summary — defaults locked for V1 | LOCKED (V1); the only open agent-economy question at this altitude is D-S7 |
| `DEALEROS_COMPETITOR_RESEARCH_MATRIX_V1.md` §6 | Decision defaults and acceptance criteria drawn from the competitor analysis | Defaults stated with their evidence in place |
| `DEALEROS_DEALERMINE_STYLE_CRM_BDC_SPEC_V1.md` §12 | Decision-ready acceptance checklist for the CRM/BDC spec | Spec-level acceptance, decided when that spec is reviewed |
| `DEALEROS_FEATURE_MAP_AND_MODULE_ARCHITECTURE_V1.md` | Phase tags (`[MVP]` / `[V1.1]` / `[LATER]`) on every feature | The per-feature scope default; ratifying D-S1 + D-S3 adopts the `[MVP]` column as the build list |

## 6. Blocked decisions (cannot responsibly be decided yet)

| ID | Decision | Why blocked | Marker |
|---|---|---|---|
| D-B1 | Actual price points and packaging | Requires real market conversations (no dealership outreach authorized) and incumbent per-rooftop price benchmarks that are not public | SKIPPED_WITH_REASON: outreach blocked. NEEDS_EXTERNAL_RESEARCH: verified per-rooftop pricing for TMS, DealerMine, AutoAlert, Car Wars; count of independent used-car rooftops in BC/Canada |
| D-B2 | CASL/PIPEDA/PIPA product-behavior rule text; VSA/OMVIC listing-linter rule text; AI-disclosure copy | Requires legal counsel — not started (scope approval is D-S6) | SKIPPED_WITH_REASON: requires legal counsel |
| D-B3 | Monorepo tool: Turborepo vs Nx | Current licensing/feature specifics must be verified before scaffold | NEEDS_EXTERNAL_RESEARCH: Turborepo vs Nx licensing/features |
| D-B4 | Hosted IdP (Auth0/Clerk/WorkOS) go/no-go | Vendor pricing and data-residency terms unverified; default remains session-based auth in our API (D-A10) | NEEDS_EXTERNAL_RESEARCH: hosted-IdP pricing/data-residency terms |
| D-B5 | Observability vendor | Requires a vendor with Canadian data residency | NEEDS_EXTERNAL_RESEARCH: hosted observability vendors with Canadian data residency |
| D-B6 | Anything monetary/reward-shaped in the agent economy | Deferred behind explicit owner decision + legal review | SKIPPED_WITH_REASON: owner decision + legal review required (see `DEALEROS_AGENT_ECONOMY_COMPATIBILITY_SKELETON_V1.md` §6) |

## 7. Standing rule

Nothing on this board is decided at V1. The board re-versions (V2) alongside
`BUDGET_WHEELS_DEALEROS_EXECUTIVE_STRATEGY_V1.md` after the Week-4 internal
demo (per D-S8), at which point decided entries record their date and
`human_approval_granted` receipt reference.

---

## Boundaries honored

- This is a design/decision document only: no production deploy, no
  production migrations, no "production ready" language; adopting any default
  here authorizes design work, never a deploy or live integration.
- No dealership or customer outreach is authorized by any entry; the
  outreach approval packet remains unsent, and pricing conversations
  (D-B1) stay blocked until owner approval.
- No secrets, no real API keys; connectors and model providers remain
  mock-by-default, live mode gated by human approval + proof receipt.
- No live CRM/DMS writes and no live DealerMine/TMS/AutoAlert integration
  performed or implied.
- No pricing promises, revenue forecasts, or guarantees; the tier sketch
  referenced in D-S4 is an internal hypothesis only.
- No crypto/token/securities language; the agent economy remains an
  internal-only skeleton (D-S7, D-B6).
- No unsupported compliance claims; all counsel-dependent items are marked
  SKIPPED_WITH_REASON (D-B2).
- Unverifiable vendor facts are marked NEEDS_EXTERNAL_RESEARCH; nothing is
  invented beyond what the research files and sibling docs state.
