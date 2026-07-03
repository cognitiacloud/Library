# DEALEROS MULTI-TENANT SAAS ARCHITECTURE (V1)

STATUS: INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.

Owner: Muhammad Firoz · Date: 2026-07-03 · Version: V1

This is the technical architecture reference for Budget Wheels DealerOS: the
tenancy model, recommended stack, dedicated-repo scaffold, service boundaries,
API layers, environment/promotion model, migration policy, security
architecture, data-residency posture, and the scaling path from a single
independent dealer (tenant-zero: Budget Wheels, Vancouver BC) to a dealer
group. Everything here is a design decision awaiting owner approval — nothing
in this document authorizes a deploy, a migration against any production
database, or a live integration.

Companion docs: module inventory and feature scope live in
`DEALEROS_FEATURE_MAP_AND_MODULE_ARCHITECTURE_V1.md`; the receipt ledger this
architecture must host is specified in `DEALEROS_COGNITIA_PROOF_ADAPTER_V1.md`;
model routing and connector governance are in
`DEALEROS_AI_MODEL_HARNESS_AND_CONNECTOR_REGISTRY_V1.md`; the desk workflows
the app layer serves are in `DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md` and
`DEALEROS_DEMANDARA_DEMAND_GEN_HARNESS_V1.md`. The canonical domain vocabulary
is `build-packets/schemas/core.ts` (referred to below as core.ts).

---

## 1. Tenancy model

### 1.1 Hierarchy (from core.ts)

```
Tenant (contract-level account, billing + plan + region + settings)
  └── DealerGroup?   (optional; only for multi-store operators)
        └── Dealer   (legal dealership entity; license numbers live here)
              └── Rooftop (physical location; address, timezone, website)
```

Rules, all already encoded as types in core.ts:

1. Every tenant-owned row carries `tenantId` **plus** the narrowest scope it
   belongs to (`dealerId`, `rooftopId` where meaningful). `tenantId` is the
   isolation key; the narrower IDs are for assignment, reporting, and RBAC.
2. `DealerGroup` is optional. Tenant-zero (Budget Wheels) is
   Tenant → Dealer → Rooftop with no group row. The group layer exists in the
   schema from day one so a group sale later is a data change, not a migration
   of the isolation model (see Section 10).
3. Users (`User` in core.ts) belong to a tenant and hold arrays of
   `dealerIds` / `rooftopIds` — a salesperson can work two rooftops without a
   second account.
4. IDs are branded string types (`Brand<'TenantId'>` etc.) so cross-entity ID
   mixups fail at compile time.

### 1.2 Isolation strategy: shared schema, row-level isolation on tenantId

| Option | Verdict | Why |
|---|---|---|
| Shared tables + Postgres Row-Level Security on `tenantId` | **RECOMMENDATION** | One schema to migrate; RLS enforced in the database, not just app code; cheapest at 1–200 tenants; matches core.ts convention |
| Schema-per-tenant | Rejected for V1 | Migration fan-out; connection-pool complexity; no benefit at our scale |
| Database-per-tenant | Deferred | Revisit only if a group/enterprise tenant contractually demands physical isolation; keep as a documented escape hatch, not a build item |

Mechanics (design intent, to be implemented in the dedicated repo):

1. Every request resolves an authenticated principal → `tenantId`, and the API
   layer sets `SET LOCAL app.tenant_id = $1` inside the transaction.
2. Every tenant-owned table has `ENABLE ROW LEVEL SECURITY` plus a policy of
   the shape `USING (tenant_id = current_setting('app.tenant_id')::uuid)`.
3. The application role has no `BYPASSRLS`. A separate, receipted
   `platform_admin` path (RoleKey `platform_admin` in core.ts) is the only
   cross-tenant read, and every such access emits a proof receipt per
   `DEALEROS_COGNITIA_PROOF_ADAPTER_V1.md`.
4. Acceptance criterion: an integration test suite that creates two tenants,
   writes interleaved rows, and proves zero cross-tenant reads through every
   API endpoint — required before any tenant beyond Budget Wheels is created.

### 1.3 Per-tenant surfaces

Each tenant carries (all shapes already in `TenantSettings` in core.ts):

| Surface | Storage | Notes |
|---|---|---|
| Settings + branding | `tenants.settings` JSONB, typed by `TenantSettings` | displayName, logo asset ref, primary color |
| AI policy | same | `externalModelsAllowed`, `piiToExternalModelsAllowed: false` (hard-off V1), `localOnlyMode`, disclosure footer |
| Connector config | tenant-scoped connector rows | env var **names** only, never secret values; mock mode default (see `DEALEROS_AI_MODEL_HARNESS_AND_CONNECTOR_REGISTRY_V1.md`) |
| Approval policy | same settings blob | `humanApprovalRequiredFor: ExternalSideEffectKind[]` |
| Proof ledger | append-only `proof_receipts` table partitioned by `tenant_id` | hash-chained per tenant; a tenant can export its own chain without seeing anyone else's |
| Websites | per-rooftop `websiteId` | rendered by apps/websites with tenant branding |

---

## 2. Recommended stack (RECOMMENDATION — pending owner approval)

Every row below is a recommendation, not a decision. Owner (Muhammad Firoz)
approves or substitutes before the dedicated repo is scaffolded.

| Layer | Recommendation | Rationale | Alternatives considered |
|---|---|---|---|
| Language | TypeScript everywhere (strict) | Build packets are already strict TS; one language across desk UI, websites, API, jobs; branded ID types carry over unchanged | Go for services (faster runtime, but splits the type system from the domain schema); Python (weaker end-to-end typing for this domain) |
| Repo shape | Monorepo (pnpm workspaces + Turborepo or Nx) | Domain package shared by every app/service without publishing; atomic cross-cutting changes | Polyrepo (rejected: 9+ packages would drift); NEEDS_EXTERNAL_RESEARCH: Turborepo vs Nx current licensing/feature specifics — verify before scaffold |
| Desk UI + dealer websites | Next.js (App Router), two apps | One framework for the authenticated desk and the public SEO/AEO websites; SSR/ISR fits VDP + local-SEO page generation in `DEALEROS_DEMANDARA_DEMAND_GEN_HARNESS_V1.md` | Remix (viable, smaller ecosystem for our needs); SPA + separate static site (loses SSR for SEO pages) |
| API layer | Node (Fastify) service exposing REST + typed client; tRPC acceptable for desk-internal calls | Explicit REST needed anyway for the Demandara API and webhooks; Fastify for schema-validated routes and rate-limit plugins | NestJS (heavier, more ceremony); Next.js API routes only (rejected: jobs and Demandara API need a UI-independent service) |
| Database | PostgreSQL 16+ with RLS | RLS is the tenancy backbone (Section 1.2); JSONB for settings; mature migrations | MySQL (weaker RLS story); SQLite/Turso (fine for demos, not for RLS-centric multi-tenancy) |
| ORM/query | Drizzle ORM or Kysely + SQL migrations | Types stay close to SQL; RLS policies live in checked-in SQL migrations, never ORM magic | Prisma (fine, but RLS + `SET LOCAL` per-transaction flows are less direct) |
| Job queue | Redis + BullMQ | SLA timers, scoring runs, feed ingestion are delayed/repeat jobs — BullMQ's model fits; Redis also serves rate-limit counters | Postgres-based queue e.g. pg-boss/Graphile Worker (viable simpler alternative, one less service — acceptable substitute if owner prefers fewer moving parts); SQS/Cloud Tasks (vendor lock before we've picked a cloud) |
| Object storage | S3-compatible bucket (vehicle photos, logo assets, export bundles) | `assetRef` strings in core.ts stay storage-agnostic; presigned upload/download; MinIO gives a local dev story | Storing binaries in Postgres (rejected: photo volumes); vendor-specific SDK coupling (avoid; use S3 API) |
| AI providers | Via the model router only — OpenAI / Anthropic / OpenRouter / **local Ollama** | Router, redaction gate, and usage ledger are specified in `DEALEROS_AI_MODEL_HARNESS_AND_CONNECTOR_REGISTRY_V1.md`; Ollama enables `localOnlyMode: true` privacy tenants where no lead text leaves the box | Direct SDK calls from app code (forbidden — bypasses redaction + receipts) |
| Auth | Session-based auth in our API with an audited user store; RoleKey RBAC from core.ts | Roles/teams are domain objects, not vendor concepts | Auth0/Clerk/WorkOS (faster start, but tenant/role model must live in our DB regardless; NEEDS_EXTERNAL_RESEARCH: current vendor pricing/data-residency terms before choosing a hosted IdP) |
| Observability | Structured JSON logs + OpenTelemetry traces; provider TBD | Receipts are the audit trail; logs/traces are the ops trail — keep them distinct | NEEDS_EXTERNAL_RESEARCH: hosted observability vendors with Canadian data residency |

Local-first default: `docker compose` with Postgres, Redis, MinIO, and
optional Ollama must bring the whole platform up offline, in mock connector
mode, with fake seed data. That compose file is the reference environment
until the owner gates anything beyond it.

---

## 3. Dedicated repo scaffold (RECOMMENDATION: `cognitiacloud/dealeros`)

This Library repo is a document library, not the production codebase (see
CONTEXT_PACK.md Section 9). Creating `cognitiacloud/dealeros` is a Week-1
roadmap item and requires owner action.

SKIPPED_WITH_REASON: Repo creation, CI setup, and branch protection — requires
the dedicated GitHub repo, which does not exist yet and is an owner-gated
action. Layout below is the proposal to apply on day one.

```
cognitiacloud/dealeros/
├── apps/
│   ├── desk/               # Next.js — authenticated dealer desk (TMS board, pipeline, inventory, approvals)
│   └── websites/           # Next.js — public dealer websites: VDPs, SEO/AEO pages, lead forms
├── packages/
│   ├── domain/             # LIFTED FROM build-packets/schemas + traffic-desk + equity-mining
│   ├── proof/              # LIFTED FROM build-packets/cognitia — receipt schema, hash-chained emitter
│   ├── connectors/         # LIFTED FROM build-packets/connectors — registry, mock adapters, mode gating
│   ├── ai/                 # LIFTED FROM build-packets/ai-harness — router, redaction gate, usage ledger
│   └── ui/                 # shared desk/website components, tenant theming
├── services/
│   ├── api/                # Fastify — internal desk API + Demandara API + public form intake + webhooks
│   └── jobs/               # BullMQ workers — SLA timers, scoring, feeds, receipt anchoring, retention
├── docs/                   # architecture decision records; this document's successor lives here
├── infra/                  # docker-compose.local.yml, IaC stubs (NOT applied — see Section 7)
└── tooling/                # eslint config, tsconfig base, claim-safety linter from build-packets/website
```

Migration note — build packets are the seed:

1. `build-packets/schemas/core.ts` becomes `packages/domain/src/core.ts`
   verbatim first, then splits by module. The packets' six "do not regress"
   rules (mock-default connectors, env-var-names-only, redaction before model
   calls, `requiresHumanApproval: true` on all AI outbound, hash-chained
   receipts, injected timestamps) become CI-enforced lint/test gates in the
   new repo.
2. `build-packets/run-tests.sh` tests move with their packages and must pass
   in the new repo before any new feature code lands.
3. Nothing in this Library repo becomes a runtime dependency of dealeros; the
   Library remains the design archive.

---

## 4. Service boundaries and background jobs

### 4.1 Services (V1: two deployable services + two apps)

| Unit | Owns | Never does |
|---|---|---|
| `services/api` | AuthN/Z, tenancy context, all reads/writes, Demandara endpoints, webhook receipt + verification, enqueueing jobs | Long-running work; direct model calls outside the ai package; external side effects without an approval receipt |
| `services/jobs` | Everything scheduled or retryable (table below) | Serving HTTP to users; skipping the proof emitter |
| `apps/desk` | UI only; talks to services/api | Direct DB access |
| `apps/websites` | Public rendering + form posts to services/api | Storing PII locally; calling connectors |

Deliberately a modular monolith pair, not microservices: module boundaries are
package boundaries inside the monorepo. Split a package into its own service
only when a concrete scaling or isolation need appears (Section 10).

### 4.2 Background job catalog (initial)

| Job | Trigger | Default schedule/SLA | Emits receipts |
|---|---|---|---|
| SLA timers | on TrafficEvent create → delayed job at `firstResponseDueAt` | internet leads 15 min; after-hours due next business morning 09:00 local (per `DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md`); breach → escalate + mark `sla.breached` | yes (escalation) |
| Equity scoring runs | nightly per tenant + on-demand | 02:00 rooftop-local; deterministic under injected timestamps per `DEALEROS_AUTOALERT_STYLE_EQUITY_MINING_SPEC_V1.md` | `equity_score_generated` |
| Inventory feed ingestion | cron per connector | hourly default; mock feeds only this phase | `connector_sync_completed` / `connector_sync_failed` |
| Receipt ledger maintenance | continuous | append + hash-chain verify job daily; tamper-check alert on chain break | self-verifying |
| Follow-up plan ticks | delayed per `FollowUpPlan.nextTouchAt` | creates approval-gated drafts only — nothing auto-sends | `followup_sent` only after human approval |
| Duplicate detection sweep | nightly | populates `duplicateClusterKey`; merges are human actions | `duplicate_detected` |
| Retention/data-rights sweep | daily | applies `TenantSettings.retention`; executes delete/export requests | yes |
| Model usage ledger rollup | hourly | cost controls per tenant AI policy | no (ops metric) |

Job rules: every job is idempotent, tenant-scoped (worker sets the same
`app.tenant_id` transaction context), retried with backoff, and dead-lettered
with an alert. No job may create an external side effect without a
pre-existing human-approval receipt.

---

## 5. API layers

| Layer | Consumers | Auth | Notes |
|---|---|---|---|
| Internal desk API | apps/desk | Session cookie + RoleKey RBAC | Full domain surface; per-role field masking (e.g. `internalCost` managers-only per core.ts) |
| Demandara API | Demandara engine | Per-tenant service credential (env-var-name reference) + HMAC on webhooks | Exactly the 9 endpoints in CONTEXT_PACK.md Section 6 module 10 (`POST /api/demandara/leads` … `GET /api/demandara/proof-report`); context responses are PII-redacted context packs per `DEALEROS_DEMANDARA_DEMAND_GEN_HARNESS_V1.md` |
| Public website forms | apps/websites visitors | None (anonymous) — strictly write-only intake | Creates TrafficEvent + consent capture only; CASL-aware consent fields required; rate-limited + bot-filtered; never reads CRM data |
| Webhooks (inbound) | Connectors (mock this phase) | Signature verification mandatory (HMAC or provider scheme), timestamp tolerance, replay protection | Unverified payloads are dropped and logged, never processed |

Versioning default: path version (`/api/v1/...`) from day one; additive
changes don't bump, breaking changes do. All three layers share one Fastify
service in V1 with distinct route trees, auth guards, and rate-limit buckets.

---

## 6. Environments and promotion

| Env | Purpose | Data | Connectors | Deploy authority |
|---|---|---|---|---|
| local | docker compose; all dev work | fake seed data only | mock | any developer |
| preview | per-PR ephemeral build | fake seed data | mock | CI, auto-torn-down |
| staging | owner review of tenant-zero flows | fake/reserved data only — no real customer PII | mock (sandbox only with explicit owner approval per connector) | CI on main, behind auth |
| production | **DOES NOT EXIST THIS PHASE** | — | — | **NONE. Hard boundary: no production deploy until an explicit owner gate.** |

Promotion is local → preview → staging and stops there. The owner gate for a
future production environment requires, at minimum: the tenant-isolation
acceptance test of Section 1.2 (acceptance criterion, item 4 of the
mechanics list) passing, the security checklist of Section 8
implemented, a named go/no-go decision by Muhammad Firoz recorded as a proof
receipt, and legal review of any public-facing claims. None of that is
authorized or scheduled by this document.

SKIPPED_WITH_REASON: Cloud provider selection, IaC apply, DNS, TLS, and
hosting cost modeling — requires real infrastructure accounts and vendor
contracts; this phase is design-only and local/preview environments only.

---

## 7. Database migration policy

1. **Dev/local/preview/staging migrations: allowed.** Plain SQL migration
   files, checked in, forward-only, reviewed like code. Every migration that
   touches a tenant-owned table must include its RLS policy in the same file.
2. **Production migrations: forbidden this phase.** There is no production
   database, and creating one is behind the owner gate. Restated as a hard
   boundary: no production migrations.
3. Migration hygiene defaults: every table gets `tenant_id` NOT NULL +
   composite index `(tenant_id, <natural key>)`; destructive migrations
   (drops, type narrowing) require a two-step expand/contract pattern and a
   checked-in rollback note; migration CI job runs the full suite from empty
   DB on every PR.
4. Seed data is fake/reserved only, generated by a checked-in script;
   importing any real customer dataset is out of scope until consent, legal
   review, and the owner gate exist.

---

## 8. Security architecture

| Control | Design | Source of truth |
|---|---|---|
| RBAC | `RoleKey` enum from core.ts (`owner`, `general_manager`, `sales_manager`, `salesperson`, `bdc_manager`, `bdc_agent`, `service_advisor`, `marketing`, `auditor`, `platform_admin`); route guards + field masking; `auditor` read-only + ledger access; every `platform_admin` access receipted | core.ts + Section 1.2 |
| Tenant isolation | Postgres RLS, no app-role bypass, isolation test suite | Section 1.2 |
| Audit | Two layers: ops logs/traces (Section 2) and the hash-chained proof ledger for business-significant actions | `DEALEROS_COGNITIA_PROOF_ADAPTER_V1.md` |
| Secrets | Env var **names** stored, values injected at runtime from an env/secret manager; connector registration rejects strings that look like real secrets (rule already encoded in build packets); no secrets in repo, logs, or receipts | build-packets README rules 2 |
| Webhook verification | Mandatory signature + timestamp + replay protection on every inbound webhook; drop-and-log on failure | Section 5 |
| Rate limiting | Per-IP on public forms; per-credential on Demandara API; per-user on desk API; Redis-backed buckets | Section 5 |
| PII handling | `// PII` markers in core.ts drive the redaction gate; no raw PII to external model providers (`piiToExternalModelsAllowed: false` hard-off in V1); `localOnlyMode` routes to Ollama | `DEALEROS_AI_MODEL_HARNESS_AND_CONNECTOR_REGISTRY_V1.md` |
| Approval gates | All AI-drafted outbound artifacts `requiresHumanApproval: true`; external side effects (`ExternalSideEffectKind`) require named human approver + receipt | core.ts + build-packets rules 1, 4 |
| Encryption | TLS in transit everywhere; encryption at rest via storage layer; presigned, expiring URLs for photo assets | Section 2 |
| Compliance posture | SOC 2 **readiness** practices only — explicitly not a certification claim; CASL/PIPEDA/PIPA(BC) patterns (consent records, retention, delete/export) are schema-level in core.ts | CONTEXT_PACK.md module 14 |

SKIPPED_WITH_REASON: Penetration testing, formal threat model sign-off, and
any compliance attestation — requires the dedicated repo with running code,
real infrastructure, and (for attestations) external auditors/legal counsel.

---

## 9. Data residency (Canadian dealers)

1. core.ts already carries `Tenant.region` and `Tenant.dataResidency`
   (`'ca' | 'us'`). Default for all launch tenants: `dataResidency: 'ca'`.
2. Design stance: single-region deployment in a Canadian region when
   infrastructure is eventually provisioned — Postgres, Redis, object storage,
   and backups all in-region. Multi-region is out of scope until a US tenant
   exists; the field exists so that day is a routing decision, not a schema
   change.
3. PIPEDA/PIPA(BC) do not flatly prohibit cross-border processing but require
   transparency and comparable protection; keeping data in-country is the
   simpler defensible default for dealer trust. This is a design position,
   not legal advice. SKIPPED_WITH_REASON: formal residency/transfer legal
   opinion — requires legal counsel.
4. NEEDS_EXTERNAL_RESEARCH: current Canadian-region availability and terms for
   the specific managed Postgres/Redis/object-storage and observability
   vendors shortlisted at provisioning time; do not assume any vendor's
   regional coverage without checking.
5. AI caveat: external model providers may process data outside Canada. The
   redaction gate (no raw PII outbound) plus per-tenant `localOnlyMode`
   (Ollama in-region/on-box) is the mitigation; tenants who require strict
   residency for lead text set `localOnlyMode: true`.

---

## 10. Scaling path: independent dealer → dealer group

| Stage | Tenants | What changes | What must NOT change |
|---|---|---|---|
| 0. Tenant-zero | Budget Wheels only | Single Postgres, single API + jobs instance, compose-based | Isolation model, receipt chain, approval gates |
| 1. A few independents | ~2–20 | Same topology; per-tenant branding/connectors exercised for real; tenant onboarding runbook | Schema — no per-tenant forks |
| 2. First dealer group | 1 tenant with DealerGroup + multiple Dealers/Rooftops | Group-level reporting rollups; RBAC scope checks across `dealerIds[]`; per-rooftop SLA calendars/timezones | `tenantId` remains the isolation key; group is aggregation, not isolation |
| 3. Load growth | 50+ | Read replicas; partition hot tables (`traffic_events`, `proof_receipts`) by tenant; split jobs workers by queue (SLA vs scoring vs feeds); consider extracting websites rendering | API contracts of Section 5 |
| 4. Enterprise ask | group demanding physical isolation | Documented escape hatch: dedicated DB for that tenant behind the same API | Application code paths — must work for both placements |

The core bet: because isolation is `tenantId`-RLS from day one and the group
layer is already in the schema, scaling is capacity work, not re-architecture.

---

## 11. Consolidated SKIPPED_WITH_REASON list

1. SKIPPED_WITH_REASON: Creating `cognitiacloud/dealeros`, CI, branch
   protection — requires the dedicated repo (owner-gated Week-1 action).
2. SKIPPED_WITH_REASON: Cloud account provisioning, IaC apply, DNS/TLS,
   hosting cost quotes — requires real infrastructure accounts and vendor
   contracts.
3. SKIPPED_WITH_REASON: Production environment, production database,
   production migrations — hard boundary this phase; owner gate not granted.
4. SKIPPED_WITH_REASON: Live connector integrations (DealerMine, TMS, CDK,
   Reynolds, Twilio, calendars, listing sites) — requires live APIs and
   vendor agreements; mock adapters only.
5. SKIPPED_WITH_REASON: Hosted auth/observability vendor selection —
   requires vendor evaluation with current pricing/residency terms
   (see NEEDS_EXTERNAL_RESEARCH items in Sections 2 and 9).
6. SKIPPED_WITH_REASON: Data-residency and cross-border transfer legal
   opinion; compliance attestations — requires legal counsel / auditors.
7. SKIPPED_WITH_REASON: Load/penetration testing and capacity benchmarks —
   requires running code in the dedicated repo on real infrastructure.
8. SKIPPED_WITH_REASON: Importing any real customer or dealership data —
   requires consent, legal review, and the owner gate; fake/reserved
   fixtures only.

---

## Boundaries honored

- No production deploy and no production migrations: production does not
  exist in this design's environment model (Section 6) and creating it is
  behind an explicit owner gate held by Muhammad Firoz.
- No secrets and no real API keys: env var names only, secret-lookalike
  rejection, no secret values in repo, logs, or receipts (Section 8).
- No live CRM/DMS writes and no live integrations: all connectors mock-mode
  by default; live mode requires human approval plus a proof receipt, and no
  live mode is enabled this phase (Sections 4–5, 11).
- No real customer PII and no dealership/customer outreach: fake/reserved
  data only in every environment; all AI-drafted outbound is
  `requiresHumanApproval: true` and nothing auto-sends (Sections 4, 7, 8).
- No "production ready" language, no certification claims: this document is
  design-only; SOC 2 is treated strictly as readiness practices, not a
  certification (Section 8); no public claims authorized.
- No fake proof: the proof ledger design records real internal actions with
  hash-chaining; no fabricated customer evidence anywhere.
- No crypto/token language: the agent-economy layer referenced via
  `DEALEROS_COGNITIA_PROOF_ADAPTER_V1.md` is internal primitives only.
- Blocked or unverifiable items are explicitly marked with
  SKIPPED_WITH_REASON and NEEDS_EXTERNAL_RESEARCH rather than invented.
