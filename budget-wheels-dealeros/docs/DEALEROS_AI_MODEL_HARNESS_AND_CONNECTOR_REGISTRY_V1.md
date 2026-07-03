# DealerOS AI Model Harness and Connector Registry (Modules 13 + 12) — V1

STATUS: INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.

Owner: Muhammad Firoz · Date: 2026-07-03 · Version: V1

---

## 1. Purpose and scope

This report specifies **Module 13 (AI harness / model router)** and **Module 12 (Connector registry)** for Budget Wheels DealerOS. It documents what the reference build packets already implement, then states the go-forward design, defaults, and acceptance criteria. It is decision-ready for the dedicated repo (`cognitiacloud/dealeros`, a Week-1 roadmap item per `CONTEXT_PACK.md` Section 9) — it is not a description of running production software.

Source-of-truth packets (reference scaffolds, dependency-free TypeScript, zero network I/O):

| File | Module | Implements |
|---|---|---|
| `build-packets/ai-harness/provider.ts` | 13 | Task/provider vocabulary, mock providers, `DEFAULT_ROUTING`, `ModelRouter`, `PolicyDeniedError` |
| `build-packets/ai-harness/redaction.ts` | 13 | `redactPii()` pipeline, `DefaultPolicyGate` |
| `build-packets/ai-harness/usage-ledger.ts` | 13 | `InMemoryUsageLedger`, `InMemoryPromptRegistry`, `sha256Hex` |
| `build-packets/connectors/registry.ts` | 12 | `ConnectorProvider` catalog, `TenantConnectorConfig`, `assertNoRawSecret`, `ConnectorRegistry` |
| `build-packets/connectors/mocks.ts` | 12 | DealerMine / TMS / CSV-feed / SMS / Calendar mock adapters with fixture data |

Siblings this report depends on and stays consistent with: `DEALEROS_AI_BDC_AND_SALES_CLOSER_SPEC_V1.md` (the largest consumer of AI tasks), `DEALEROS_FEATURE_MAP_AND_MODULE_ARCHITECTURE_V1.md` (module boundaries), `DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md` and `DEALEROS_DEALERMINE_STYLE_CRM_BDC_SPEC_V1.md` (the two import connectors mocked first), and `DEALEROS_DEMANDARA_DEMAND_GEN_HARNESS_V1.md` (campaign/content tasks). Vendor facts come only from `research/dealermine.md` and `research/tms-canada.md`.

Governing rule inherited from `CONTEXT_PACK.md` Section 4: **mock mode by default for every connector and model provider; live mode always gated by human approval + proof receipt.** Everything below is designed around that rule, not in spite of it.

---

## PART A — MODULE 13: AI HARNESS / MODEL ROUTER

## 2. Provider abstraction

`ModelProviderKind` has exactly five values in V1 (`provider.ts`):

| # | Kind | `isExternal` | What it is | V1 status |
|---|---|---|---|---|
| 1 | `openai` | true | External API provider | Mocked via `MockExternalProvider` — no SDK, no network |
| 2 | `anthropic` | true | External API provider | Mocked via `MockExternalProvider` — no SDK, no network |
| 3 | `openrouter` | true | External multi-model gateway | Mocked via `MockExternalProvider` — no SDK, no network |
| 4 | `ollama_local` | false | Local runtime on dealer/our hardware | Stood in by `MockLocalProvider` with kind override |
| 5 | `mock_local` | false | Deterministic fixture provider | Fully implemented; universal fallback |

Every provider implements one interface: `{ kind, isExternal, complete(req: ModelRequest): ModelResponse }`. The scaffold is synchronous; real providers go async behind the same shape in the dedicated repo. `isExternal` is the single bit the policy gate keys on — a provider cannot be "a little external."

`ModelRequest` carries: `task`, `tenantId`, `promptKey` + `promptVersion` (pins the prompt-registry template that ran), `input` (already redacted when `containsPii` is false), `containsPii` (the caller's post-redaction declaration — gates external routing hard), and `maxCostCents` (per-request ceiling).

`ModelResponse` carries token counts, `costCents`, `fallbackUsed`, and — deliberately typed as the literal `true`, not `boolean` — `requiresHumanApproval: true`. **Every model output in V1 is a draft.** Nothing reaches a customer, listing, or page without a named human approver. The type system makes "auto-send" unrepresentable, which is the code-level form of the "sales desk with a paper trail — not a magic chatbot" metaphor.

Both mock providers append a claim-safe footer to every draft ("…requires human approval before any outbound use. No guarantees of price, availability, financing, or outcome.") and derive output deterministically from `sha256Hex(input, 8)`, so tests assert exact equality.

## 3. The 15-task catalog and default routing

`AiTaskKind` enumerates the 15 AI tasks from `CONTEXT_PACK.md` Module 13, one-to-one. `DEFAULT_ROUTING` (reproduced exactly from `provider.ts`) assigns each a primary provider, fallback, target model (mock names only in the scaffold), and per-call cost cap:

| AiTaskKind | Primary | Fallback | Model (mock) | Cap ¢/call | Main consumer |
|---|---|---|---|---|---|
| `lead_classification` | anthropic | mock_local | mock-anthropic-small | 10 | Module 6 AI BDC |
| `intent_detection` | anthropic | mock_local | mock-anthropic-small | 10 | Module 6 AI BDC |
| `vehicle_matching` | anthropic | mock_local | mock-anthropic-small | 15 | Modules 3, 6, 7 |
| `reply_drafting` | anthropic | mock_local | mock-anthropic-mid | 25 | Module 6 / Sales Closer |
| `objection_handling` | anthropic | mock_local | mock-anthropic-mid | 25 | Module 5 Sales Closer |
| `equity_opportunity_explanation` | anthropic | mock_local | mock-anthropic-mid | 25 | Module 7 equity mining |
| `listing_copy` | openai | mock_local | mock-openai-mid | 25 | Module 3 inventory |
| `seo_content` | openai | mock_local | mock-openai-mid | 40 | Module 9 demand gen |
| `aeo_answer_generation` | openai | mock_local | mock-openai-mid | 25 | Module 9 demand gen |
| `followup_sequence` | anthropic | mock_local | mock-anthropic-small | 15 | Modules 5, 6 |
| `call_summary` | **ollama_local** | mock_local | mock-ollama-local | 5 | Modules 4, 6 |
| `manager_coaching` | **ollama_local** | mock_local | mock-ollama-local | 5 | Module 4 traffic desk |
| `source_attribution_analysis` | openrouter | mock_local | mock-openrouter-mixed | 20 | Modules 9, 10 |
| `anomaly_detection` | anthropic | mock_local | mock-anthropic-small | 10 | Modules 4, 14 |
| `compliance_check` | **ollama_local** | mock_local | mock-ollama-local | 5 | Module 14 |

Routing decisions and rationale:

1. **Privacy-sensitive tasks pin to a LOCAL primary.** `call_summary`, `manager_coaching`, and `compliance_check` operate on raw conversation transcripts, employee performance records, and compliance-flagged text — the inputs most likely to contain residual PII even after redaction, and the ones where a redaction miss is most damaging. Pinning them to `ollama_local` means the PII question never reaches an external boundary at all: defense-in-depth ahead of the redaction pass and the policy gate.
2. **Every task falls back to `mock_local`.** A policy denial, provider outage, or cost-cap breach never strands a request on an external-only path; the dealer always gets a (clearly mock/degraded) draft plus a ledger record explaining why.
3. **Cost caps are deliberately small and per-call.** The router enforces `min(request.maxCostCents, route.maxCostCentsPerCall)`. Defaults above are placeholders for tuning; the shape (two ceilings, min wins) is the decision. NEEDS_EXTERNAL_RESEARCH: real per-token pricing for candidate external models before caps are calibrated — no vendor pricing is asserted here.
4. **Model names are mocks.** Selecting real model IDs is a dedicated-repo decision. SKIPPED_WITH_REASON: choosing concrete external models requires live API access, current vendor pricing/terms review, and eval results — none permitted in this workspace.
5. **Routing is per-tenant overridable.** `RoutingConfig` is plain data; V1 ships `DEFAULT_ROUTING` as the only reviewed config, with tenant overrides allowed only toward *more* local (see Section 8).

## 4. Redaction pipeline

`redactPii(text, knownPii)` in `redaction.ts` runs before any model call, in this fixed pass order:

| Pass | Kind | Detector | Notes |
|---|---|---|---|
| 1 | `email` | RFC-loose regex | Runs first so names embedded in addresses are consumed whole |
| 2 | `phone` | NA formats: `604-555-1234`, `(604) 555-1234`, `+1 604 555 1234`, `604.555.1234` | Digit lookarounds prevent partial matches inside longer digit runs |
| 3 | `vin` | 17-char VIN, letters excluding I/O/Q, must contain ≥1 digit | |
| 4 | `postal_code` | Canadian postal code (`V6B 1A1` / `V6B-1A1` / `v6b1a1`) | BC/Canada tenant-zero focus |
| 5 | `name` | Exact-match pass over `knownPii.names` from Customer 360, **longest first** | "Jordan Lee-Smith" wins over "Jordan Lee"; regex-escaped |

Output contract:

- **Placeholder scheme:** each unique original value becomes `[KIND_N]` (e.g. `[EMAIL_1]`, `[PHONE_2]`); repeated occurrences of the same original reuse the same placeholder, so the model can still reason about "the same customer email appearing twice."
- **`original_hash`:** each `Redaction` records the first 8 hex chars of `sha256(original)` — enough to correlate a redaction with a Customer 360 record or a Cognitia receipt, not enough to reverse. The raw value never leaves the redaction boundary.
- The `redactions[]` list (kind, hash, placeholder) is what gets attached to receipts/audit rows — never the originals.

Recall is favored over precision by design: over-redacting costs draft quality; under-redacting costs privacy. Go-forward additions for the dedicated repo (V1.1 candidates, same pass architecture): street addresses, driver's licence numbers, SIN patterns, plate numbers, and a known-PII pass extended beyond names to all Customer 360 contact-method values. SKIPPED_WITH_REASON: validating recall against realistic dealership text requires a fixture corpus in the dedicated repo; no real customer data may be used to build it.

## 5. Policy gate

`DefaultPolicyGate.checkModelCall()` evaluates rules in this order and returns `'allow'` or `{ deny: reason }`:

| # | Rule | Deny reason string |
|---|---|---|
| 1 | Local (non-external) providers are **always allowed** | — |
| 2 | External + `containsPii === true` → deny. **Hard rule, no tenant override in V1.** | `pii_to_external_model_blocked_v1` |
| 3 | External + tenant `localOnlyMode` → deny | `tenant_local_only_mode` |
| 4 | External + tenant has not enabled external models → deny | `tenant_external_models_not_allowed` |

Rule 2 is not a configuration default — it is enforced by the type system. In `schemas/core.ts`, `TenantSettings.aiPolicy.piiToExternalModelsAllowed` is typed as the **literal `false`** ("hard-off in V1; flip requires policy review"), and the gate does not even consult a flag for it. No admin toggle, migration, or tenant contract can flip it without a code change plus policy review. This is the strongest privacy statement in the platform and should be quoted (claim-safely, internally) in `DEALEROS_AI_BDC_AND_SALES_CLOSER_SPEC_V1.md` review discussions.

Deny reasons are stable machine-readable strings because they flow into the usage ledger (`gateReason`) and into Cognitia receipts (`policy_gate_result`, Module 11).

## 6. Router flow, fallback, and PolicyDeniedError semantics

`ModelRouter.route(req, tenantPolicy, now)` executes exactly two attempts — primary, then fallback — with this per-attempt sequence:

1. **Provider configured?** If not, record `outcome: 'error'` (`provider_not_configured:<kind>`) and continue to fallback.
2. **Policy gate.** On deny, record `outcome: 'denied'` with the gate reason and continue.
3. **Complete.** On thrown provider error, record `outcome: 'error'` (`provider_error:<msg>`) and continue.
4. **Cost cap.** If `costCents > min(req.maxCostCents, route.maxCostCentsPerCall)`, the overrun is recorded at its **real** cost as an `'error'` row (`cost_cap_exceeded:<actual>><cap>`), and the fallback is tried. (Cost is only knowable post-call in the scaffold; real adapters should pre-estimate where the vendor API allows it.)
5. **Success.** The response is returned with `fallbackUsed` set truthfully, and an `'ok'` ledger row is written.

Terminal semantics when both attempts fail:

- If **any** attempt was policy-denied, throw `PolicyDeniedError` carrying the most recent gate reason. Callers (AI BDC, Sales Closer, listing assistant) must catch it and surface "blocked by policy" — a governance outcome to show the dealer, never a retry-until-it-works condition.
- Otherwise rethrow the last operational error.

Invariant worth stating as a test: **every attempt — allowed, denied, or errored — produces exactly one ledger record.** There is no code path where the harness touches a provider silently.

## 7. Usage ledger

`ModelUsageRecord` (one row per attempt): `tenantId`, `task`, `provider`, `model`, `promptKey`, `promptVersion`, `inputTokens`, `outputTokens`, `costCents`, `outcome: 'ok' | 'denied' | 'error'`, optional `gateReason`, caller-supplied `timestamp` (no wall-clock reads — deterministic under test).

`InMemoryUsageLedger` behavior to preserve in the persisted version:

- Rejects non-finite/negative token or cost values on insert.
- **Freezes each record on insert** — append-only in spirit; history cannot be mutated after the fact.
- Query surface: `recordsFor(tenantId)`, `totalCostCents(tenantId)`, `byTask(tenantId)` returning per-task call/ok/denied/error counts, token totals, and cost. This is the raw material for tenant-facing AI spend dashboards and for monthly proof-backed reports (`DEALEROS_DEMANDARA_DEMAND_GEN_HARNESS_V1.md`).

Go-forward: the persisted ledger becomes a proper table with tenant isolation (Module 1) and feeds Cognitia receipts — a model call that produced an outbound draft links its ledger row hash into the `ai_reply_drafted` receipt's `data_refs`.

## 8. Prompt registry (versioning, hash, approval receipts)

`InMemoryPromptRegistry` (usage-ledger.ts):

- Keyed by `promptKey@version`; each entry stores `purpose` and the **full sha256 of the template text** — pins exactly what ran.
- **Versions are immutable:** re-registering identical text is a no-op; re-registering different text under the same version throws. Editing a prompt means minting a new version.
- Every `ModelRequest` names its `promptKey`/`promptVersion`, and every ledger row carries them — so any draft in the system can be traced to the byte-exact template that produced it.

Go-forward (dedicated repo): persist the registry and add **an approval receipt per prompt version** — a `human_approval_granted` Cognitia receipt (Module 11) recording who reviewed the template before it could serve tenant traffic, with the template hash in `payload_hash`. Default: unapproved versions may serve only `mock_local`. SKIPPED_WITH_REASON: receipt-linked prompt approval requires the persisted Cognitia ledger and the dedicated repo; the in-memory scaffold intentionally stops at immutability + hashing.

## 9. Eval harness plan

Design (plan only): a golden set per `AiTaskKind` — fixture inputs (fake/reserved data only) with expected properties, not exact strings, for external models: required disclaimers present, no invented price/availability, no PII placeholders leaked, claim-safe footer intact, JSON shape valid for classification tasks. Runs: (a) on every prompt-version registration, (b) on every routing change, (c) scheduled drift checks. Results land in the usage ledger dimensioned by `promptVersion`, so "did v3 beat v2" is a ledger query. Acceptance gates per task block promotion of a prompt version that regresses its golden set.

SKIPPED_WITH_REASON: building and running the eval harness needs the dedicated code repo, a curated fixture corpus (fake/reserved data), and — for external-model evals — live API access under vendor terms. None are available in this Library workspace; only the design is committed here.

## 10. Local-only mode

For privacy-sensitive dealers (or during procurement review), `TenantSettings.aiPolicy.localOnlyMode = true` makes the policy gate deny **every** external attempt with `tenant_local_only_mode`; routing then lands on `ollama_local`/`mock_local` fallbacks. Consequences to set expectations on, honestly: lower draft quality than external frontier models, zero external per-token spend, and a complete ledger trail showing that nothing left the boundary — which is itself a sellable audit artifact for PIPEDA/PIPA(BC)-sensitive dealers (Module 14). Default for tenant-zero Budget Wheels: `localOnlyMode: false`, `externalModelsAllowed: false` — i.e., effectively local-only until a human flips `externalModelsAllowed` after review. No performance or compliance guarantees are claimed for either mode.

---

## PART B — MODULE 12: CONNECTOR REGISTRY

## 11. Connector provider catalog

`ConnectorProvider` in `registry.ts` enumerates **31 providers**. Capabilities marked ✅ have a working mock adapter in `mocks.ts` today; all others are catalog slots (type-level only). Mode ladder for every provider is `mock → sandbox → live`; **every provider ships and stays in `mock` unless explicitly promoted** (Section 12).

| Provider | Category | Planned capabilities | V1 state | Roadmap wave |
|---|---|---|---|---|
| `dealermine` | CRM/DMS | customers:import, service_history:import | ✅ `MockDealerMineAdapter` | 1 (migration) |
| `tms_canada` | CRM/DMS | traffic:import | ✅ `MockTmsTrafficAdapter` | 1 (migration) |
| `cdk` | CRM/DMS | customers:import, service_history:import, inventory:import | slot | 4 |
| `reynolds` | CRM/DMS | customers:import, service_history:import, inventory:import | slot | 4 |
| `dealersocket` | CRM/DMS | customers:import, lead:export | slot | 4 |
| `vinsolutions` | CRM/DMS | customers:import, lead:export | slot | 4 |
| `dealertrack` | CRM/DMS | customers:import, inventory:import | slot | 4 |
| `quorum` | CRM/DMS | customers:import, service_history:import | slot | 4 |
| `dealercenter` | CRM/DMS | customers:import, inventory:import | slot | 4 |
| `autosync` | CRM/DMS | inventory:import, inventory:export | slot | 3 |
| `inventory_feed_csv` | Inventory feed | inventory:import | ✅ `MockInventoryCsvFeedAdapter` (RFC-4180-ish parser) | 1 |
| `inventory_feed_xml` | Inventory feed | inventory:import | slot | 2 |
| `inventory_feed_json` | Inventory feed | inventory:import | slot | 2 |
| `autotrader_listing` | Listing/presence | listing:post, inventory:export | slot (where allowed) | 3 |
| `facebook_marketplace` | Listing/presence | listing:post | slot (where allowed) | 3 |
| `kijiji_autos` | Listing/presence | listing:post | slot (where allowed) | 3 |
| `google_business_profile` | Listing/presence | listing:post | slot (where allowed) | 3 |
| `twilio_sms` | Comms | message:send | ✅ `MockSmsAdapter` (outbox, never sends) | 2 |
| `voice_agent` | Comms | message:send (voice) | slot | 3 |
| `gmail` | Comms | message:send | slot | 2 |
| `outlook` | Comms | message:send | slot | 2 |
| `google_calendar` | Comms | calendar:write | ✅ `MockCalendarAdapter` (draft-only) | 2 |
| `microsoft_calendar` | Comms | calendar:write | slot | 2 |
| `stripe` | Money (later) | TBD | slot | 5 |
| `quickbooks` | Money (later) | TBD | slot | 5 |
| `openai` | Model provider | (routed via Module 13) | slot | 2 |
| `anthropic` | Model provider | (routed via Module 13) | slot | 2 |
| `openrouter` | Model provider | (routed via Module 13) | slot | 2 |
| `ollama` | Model provider | (routed via Module 13) | slot | 1 |
| `n8n` | Orchestration | TBD | slot | 5 |
| `mcp_gateway` | Orchestration | TBD | slot | 5 |

"Where allowed" on listing surfaces is load-bearing: NEEDS_EXTERNAL_RESEARCH per marketplace — official API existence, partner-program terms, and automation policies (see `research/marketplaces.md`); no marketplace API capability is asserted here. Likewise, NEEDS_EXTERNAL_RESEARCH: whether DealerMine/Quorum and TMS (tmscan.com) expose partner APIs for the import capabilities modeled — `research/dealermine.md` and `research/tms-canada.md` document products and one Quorum↔Autovance/TMS integration press release, not public API availability; both vendor sites blocked direct fetches. The mock adapters model the *shape* of the data we would need, not any confirmed vendor endpoint.

The nine `ConnectorCapability` values (`customers:import`, `service_history:import`, `traffic:import`, `inventory:import`, `inventory:export`, `lead:export`, `message:send`, `calendar:write`, `listing:post`) are the complete capability vocabulary; adapters declare a subset, and method presence must match declarations.

## 12. Mode ladder and the live-mode gate

`ConnectorMode = 'mock' | 'sandbox' | 'live'`, with hard registry behavior (all cited from `ConnectorRegistry.configure()` in `registry.ts`):

1. **Mock by default:** omitted `mode` resolves to `'mock'`. There is no way to configure a connector "accidentally live."
2. **Live requires a receipt:** `configure()` **throws** when `mode === 'live'` and `liveApprovalReceiptId` is absent — the field is documented as a `human_approval_granted` Cognitia proof receipt. Promotion to live is therefore an auditable human decision, not a settings toggle: the receipt records who approved, when, and under what policy gate (Module 11).
3. **Sandbox** is for vendor-supplied test environments — same approval discipline recommended (default: sandbox promotion also requires a receipt; decision open, see Section 16), but only live is type-enforced in the packet.
4. Configs are frozen on store; changing mode means writing a new config, which re-runs every validation.

Ladder policy per connector class: import-only connectors (feeds, CRM/DMS reads) may reach live earliest; outbound side-effect connectors (SMS, email, calendar, listings, lead export) additionally require **per-action** approval receipts (Section 15) even after the connector itself is live.

## 13. Secret hygiene

Two-layer rule, both implemented:

1. **Env var NAMES only.** `TenantConnectorConfig.secretEnvVarNames: string[]` stores names like `DEALERMINE_API_KEY` — never values. The same convention exists at `TenantSettings.connectorSecretEnvVarNames` in `schemas/core.ts`. Secret *values* live only in the deployment environment's secret store (dedicated repo concern).
2. **`assertNoRawSecret()`** runs on every `secretEnvVarNames` entry **and on `displayName`** at configure time. It throws on known secret prefixes — `sk-`, `xoxb-`, `AKIA`, `-----BEGIN`, `bearer ` (case-insensitive) — and on the cheap entropy hint "longer than 60 chars with no spaces." Deliberately simple: a tripwire against paste accidents, not a scanner; the dedicated repo adds real secret scanning in CI.

SKIPPED_WITH_REASON: actual secret provisioning, rotation policy, and vault selection require the dedicated repo and a deployment environment; no secrets exist or are handled in this workspace.

## 14. Least-privilege scopes and health checks

**Scopes.** Every config's `scopes` entries must match `^[a-z0-9_]+:[a-z0-9_]+$` (`resource:action`), enforced at configure time — e.g. `customers:read`, `inventory:write`. Default stance: request the minimum scopes the declared capabilities need; a connector with `customers:import` capability gets `customers:read`, never a blanket grant. Scope-to-capability mapping review is part of live-promotion approval.

**Health checks never call live.** `ConnectorRegistry.healthCheckAll()` behavior (cited from `registry.ts`):

- `healthCheckPolicy: 'never_live'` (recommended default for every connector): a live-mode config is **downgraded to mock** before the adapter's `healthCheck()` runs; if the adapter still reports `liveCallMade: true`, the registry **throws** — a policy violation, not a warning.
- `'live_if_enabled'`: live health checks only when the connector is both live and enabled; mock adapters report `liveCallMade: false` always.
- Every `HealthResult` and every capability result carries `mode` + `liveCallMade`, so "did anything touch a live API" is answerable from return values alone — and is asserted in the packet tests (`connectors.test.ts`).

## 15. Receipts for every external side effect

Per `CONTEXT_PACK.md` Module 11, every connector sync emits `connector_sync_completed` or `connector_sync_failed` receipts (with `connector_id`, `actor_type: 'connector'`, `external_side_effect`, `payload_hash`). The packet already forces the approval half of this at the type level:

- All outbound-shaped inputs (`SendMessageInput`, `CalendarWriteInput`, `ExportLeadInput`, `ExportInventoryInput`, `PostListingInput`) carry `requiresHumanApproval: true` as a **literal type** plus an `approvalReceiptId` field.
- `MockSmsAdapter.sendMessage()` **throws** without an `approvalReceiptId` — a draft cannot even be *queued* unapproved, and everything queued lands in an outbox with status `queued_draft_never_sent`. Nothing is ever transmitted.
- `MockCalendarAdapter` returns `disposition: 'draft_only_not_written'`.

Go-forward: the registry wraps every adapter call, emitting the sync receipt automatically so adapter authors cannot forget it. SKIPPED_WITH_REASON: receipt emission wiring depends on the Cognitia adapter packet's persisted ledger (dedicated repo).

## 16. Migration path: DealerMine / TMS import mocks

The two Wave-1 mocks are the **switching-dealer story**: a dealer leaving DealerMine or TMS lands in DealerOS with history intact.

- `MockDealerMineAdapter` models `customers:import` (contact methods with consent status/basis — e.g. `implied_ebr` with expiry, matching CASL patterns in Module 14) and `service_history:import` (repair orders with op codes and **declined-work flags** — the raw material for Module 7/8 opportunity mining, mirroring the declined-maintenance playbook documented in `research/dealermine.md`).
- `MockTmsTrafficAdapter` models `traffic:import`: traffic events with source, SLA fields, and outcomes — feeding the traffic desk described in `DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md` so a switching dealer's accountability reporting has no blank-slate gap.
- All fixture data is fake/reserved (`example.invalid` emails, 555-01xx numbers, fixture VINs). Realistic import likely means dealer-exported CSV/reports before (or instead of) any vendor API — which is why `inventory_feed_csv` with its embedded parser is also Wave 1. NEEDS_EXTERNAL_RESEARCH: DealerMine/TMS data-export formats actually available to a departing dealer.

## 17. Connector roadmap ordering

| Wave | Connectors | Rationale |
|---|---|---|
| 1 | `inventory_feed_csv`, `dealermine`, `tms_canada` (mock→sandbox), `ollama` | Migration path + inventory ingestion + local model; zero outbound risk |
| 2 | `twilio_sms`, `gmail`/`outlook`, `google_calendar`/`microsoft_calendar`, `inventory_feed_xml`/`json`, `openai`/`anthropic`/`openrouter` | First outbound drafts (approval-gated) + external models behind Module 13 gate |
| 3 | `autotrader_listing`, `facebook_marketplace`, `kijiji_autos`, `google_business_profile`, `voice_agent`, `autosync` | Listing/presence, pending per-marketplace policy research |
| 4 | Franchise CRM/DMS: `cdk`, `reynolds`, `dealersocket`, `vinsolutions`, `dealertrack`, `quorum`, `dealercenter` | Beyond the independent-dealer wedge; partner-program dependent |
| 5 | `stripe`, `quickbooks`, `n8n`, `mcp_gateway` | Money + orchestration, explicitly "later" per `CONTEXT_PACK.md` |

No wave implies a live integration commitment; every promotion beyond mock is individually receipt-gated. SKIPPED_WITH_REASON: sandbox/live adapters for any wave require vendor accounts/contracts and the dedicated repo.

---

## 18. Acceptance criteria (V1, testable in the scaffold today)

1. Router never calls an external provider when `containsPii === true` — attempt is ledger-recorded as `denied: pii_to_external_model_blocked_v1`, fallback proceeds locally.
2. `localOnlyMode` tenants produce zero external `'ok'` ledger rows across all 15 tasks.
3. Every `route()` invocation yields ≥1 ledger record; failed double-attempts yield exactly 2 plus a thrown `PolicyDeniedError` (if any denial) or the last error.
4. Cost-cap breach records the real cost as `'error'` and returns a fallback response with `fallbackUsed: true`.
5. `redactPii` replaces all fixture emails/phones/VINs/postal codes/known names; identical originals share one placeholder; every redaction carries an 8-char `original_hash`.
6. Prompt registry rejects same-version re-registration with different text; ledger rows always carry `promptKey`/`promptVersion`.
7. `configure()` throws on: live without `liveApprovalReceiptId`; secret-looking strings in `secretEnvVarNames`/`displayName`; malformed scopes. Omitted mode is `'mock'`.
8. `healthCheckAll()` under `never_live` downgrades live configs to mock and throws if an adapter reports a live call; all mock adapters report `liveCallMade: false` for every operation.
9. `MockSmsAdapter` throws without an approval receipt; approved drafts terminate in the outbox as `queued_draft_never_sent`.
10. All of the above run offline, deterministically, with caller-supplied timestamps — no network, no wall clock, no secrets.

## 19. Open decisions

1. Promote `AiTaskKind`, `ModelProviderKind`, and `ModelUsageRecord` into `schemas/core.ts` so Cognitia receipts and the connector registry share the vocabulary (SCHEMA_NOTEs already flag this). Default: yes, in the dedicated repo's first schema pass.
2. Whether sandbox promotion requires a receipt like live does. Default recommendation: yes (uniform ladder), pending owner sign-off.
3. Per-tenant routing overrides: proposal is local-only-direction overrides in V1 (a tenant may pin more tasks local, never route a local-pinned task external). Default: adopt.
4. Daily/monthly per-tenant cost budgets on top of per-call caps (ledger already supports the query). Default: add in dedicated repo.

## Boundaries honored

- **No secrets, no real API keys:** env var NAMES only; `assertNoRawSecret` enforced at configure time; no secret values exist anywhere in packets or this doc.
- **No live CRM/DMS writes, no live calls of any kind:** every provider and connector is mock-by-default; all adapters are fixture-backed with `liveCallMade: false` by construction; health checks never touch live APIs under the default policy.
- **Live mode gated by human approval + proof receipt:** `liveApprovalReceiptId` is required for live configuration, and outbound-shaped actions additionally require per-action `human_approval_granted` receipts; `requiresHumanApproval: true` is a literal type on every model response and outbound input.
- **No real customer PII:** all fixtures are fake/reserved; PII to external models is hard-off in V1 (`piiToExternalModelsAllowed` typed literal `false`); redaction runs before any model call.
- **No dealership/customer outreach:** mock SMS/calendar adapters queue drafts that are never sent (`queued_draft_never_sent`, `draft_only_not_written`).
- **No production deploy, no migrations, not production ready:** everything here is design plus dependency-free reference scaffolding for the future `cognitiacloud/dealeros` repo; no guarantees of performance, compliance, or outcomes are made or authorized.
- **No invented vendor facts:** vendor statements trace to `research/dealermine.md` / `research/tms-canada.md`; unverifiable items are marked NEEDS_EXTERNAL_RESEARCH; blocked work is marked SKIPPED_WITH_REASON.
- **No crypto/token language, no public claims:** internal design document only.
