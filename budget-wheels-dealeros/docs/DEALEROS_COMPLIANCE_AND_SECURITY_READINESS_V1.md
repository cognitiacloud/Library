# DealerOS Compliance and Security Readiness (V1)

STATUS: INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.

Owner: Muhammad Firoz · Date: 2026-07-03 · Version: V1

> **THIS DOCUMENT IS NOT LEGAL ADVICE.** It is an engineering readiness plan that maps
> regulatory requirements (as summarized in `research/canada-compliance.md`) onto DealerOS
> schemas, gates, and jobs. Every regulatory interpretation below must be reviewed by
> qualified legal counsel before any compliance-adjacent feature ships or any claim is
> made to a dealer. Counsel review is a named roadmap gate (Section 9). Per
> CONTEXT_PACK.md hard boundaries: no unsupported compliance claims, ever.

Scope: Module 14 (Compliance / enterprise readiness) for the BC-first launch with
tenant-zero Budget Wheels (Vancouver, BC). Siblings this doc builds on:
`DEALEROS_COGNITIA_PROOF_ADAPTER_V1.md` (audit/receipt ledger),
`DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md` (tenant isolation, jobs),
`DEALEROS_AI_MODEL_HARNESS_AND_CONNECTOR_REGISTRY_V1.md` (redaction + connector gates),
`DEALEROS_AI_BDC_AND_SALES_CLOSER_SPEC_V1.md` (outbound approval flow),
`DEALEROS_SEO_AEO_AIO_WEBSITE_ENGINE_V1.md` (VDP/ad rendering rules).

Status vocabulary used throughout:

| Status | Meaning |
|---|---|
| **scaffolded** | Reference types/logic exist in `build-packets/` (dependency-free, mock-only; not production code) |
| **designed** | Specified in a sibling doc; no scaffold yet |
| **SKIPPED_WITH_REASON** | Blocked on live API, vendor contract, legal counsel, real customer data, or the dedicated code repo |

---

## 1. Regulatory map — BC-first launch

Source for all regime facts: `research/canada-compliance.md`. Where that file flags
unverified items, the flag is carried forward here.

### 1.1 CASL (federal — governs every outbound email/SMS the AI BDC drafts)

Key mechanics from the research file: two consent bases — **express** (does not expire,
revocable anytime) and **implied** (existing business relationship). Implied windows:
roughly **2 years after a purchase/formal agreement**, **6 months after an inquiry**.
Every CEM must identify the sender, include contact info, and carry a working
unsubscribe mechanism — free, readily performed, contact means operational **≥ 60
days**, opt-out honored **within 10 business days** even if it arrives via another
channel. **Burden of proof is on the sender.** Penalties up to $1M/violation
(individuals) / $10M/violation (corporations); HBC was fined $120,000 in 2024 over
promotional texts without adequate consent documentation.

Mapping to `build-packets/schemas/core.ts` → `ConsentRecord` (scaffolded):

| CASL mechanic | ConsentRecord field / behavior | Default / rule |
|---|---|---|
| Express vs implied basis | `basis: 'express' \| 'implied_ebr' \| 'implied_inquiry' \| 'none'` | New web-form lead with contact info → `implied_inquiry` unless an explicit opt-in checkbox was ticked (→ `express`) |
| Per-channel consent (not one boolean) | `channel: 'email' \| 'sms' \| 'voice' \| 'mail'` — one record per channel | No channel record → treat as `basis: 'none'` → outbound blocked |
| Implied expiry math | `expiresAt` computed at capture: `capturedAt + 24 months` for `implied_ebr`; `capturedAt + 6 months` for `implied_inquiry`; **unset** for `express` (does not expire) | Rolling renewal: a new qualifying event re-stamps `capturedAt`/`expiresAt` and emits a receipt |
| Burden of proof on sender | `capturedAt`, `source` (e.g. `"website_form:test_drive"`), `receiptId` → Cognitia `consent_captured` receipt with `consent_basis`, `payload_hash`, timestamp | Every consent transition MUST carry a receipt; a consent record without a receipt fails the outbound gate |
| Revocation | `status: 'revoked'` + `FollowUpPlan.pausedReason: 'opt_out'` | Opt-out propagates across **all** channels same-day by design (statute allows 10 business days; we beat it deliberately) |
| Unsubscribe mechanics in every CEM | Outbound template gate: sender identity + dealer contact info + unsubscribe link/keyword pre-inserted; a draft missing them cannot be approved | Unsubscribe endpoint kept operational permanently (statute floor: 60 days) |
| Expiry operations | Alert jobs `consent_expiring_30d`, `consent_expired_blocked`, `implied_basis_renewed` (designed — retention/consent sweep in `DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md` jobs table) | Expired implied consent → hard block + suggested re-permission path (an express-opt-in ask is itself consent-sensitive; template needs counsel review) |

V1.1 schema candidates (not yet in core.ts — flagged for the dedicated repo):
`ConsentRecord.revokedAt`, `ConsentRecord.unsubscribeHonoredAt` (proves the 10-day —
actually same-day — SLA per contact).

NEEDS_EXTERNAL_RESEARCH: exact CRTC record-keeping guidance text (crtc.gc.ca returned
403 through the fetch proxy; current summary comes from search snippets + law-firm
guides and must be re-verified against primary pages before the consent engine spec is
finalized).

### 1.2 PIPEDA + BC PIPA (privacy)

Key mechanics from the research file: consent required for collection/use/disclosure;
consent to unnecessary collection cannot be a condition of service; withdrawal on
reasonable notice; access + correction rights (complete, timely, low/no-cost); **no
general right to erasure** under BC PIPA, but organizations must **destroy or
anonymize** personal information once no longer needed — retention schedules are
mandatory regardless. Data residency is not mandated for private-sector dealers;
cross-border transfer requires comparable protection plus transparency. Precedent OPC
Finding #2009-023: a service email reused for marketing without consent was a violation
— purpose limitation applies directly to our equity-mining and service-to-sales modules.

Mapping to `Customer.privacy` + `TenantSettings.retention` (both scaffolded in core.ts):

| PIPEDA / BC PIPA mechanic | Implementing field / flow | Default / rule |
|---|---|---|
| Consent + purpose limitation | `ConsentRecord.source` records the capture purpose; equity mining / service-to-sales drafts check consent basis **for the marketing purpose**, not just any consent (the #2009-023 failure mode) | Service-only customers (`segment: 'service_only'`) get no sales CEMs without a marketing-purpose consent basis |
| Withdrawal of consent | `ConsentRecord.status: 'revoked'` + same-day propagation (Section 1.1) | — |
| Access + correction | `Customer.privacy.exportRequestedAt` → export workspace produces a human-readable + machine-readable bundle (profile, consents, comm history, receipts summary) | Target turnaround: 30 days internal SLA; no fee. Correction edits are receipted (`crm_updated`) |
| Destroy-or-anonymize | `Customer.privacy.deleteRequestedAt` → review queue → `anonymizedAt` stamped by the anonymization job; `TenantSettings.retention.customerDataMonths` drives the automatic sweep | Anonymize (irreversibly strip PII, keep aggregate stats) rather than hard-delete where receipts/deal records must legally survive; see Section 5 |
| Retention schedule | `TenantSettings.retention.customerDataMonths` / `receiptRetentionMonths`; daily retention sweep job (designed, `DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md`) | Engineering placeholders pending counsel: `customerDataMonths: 84`, `receiptRetentionMonths: 96`, deliberately set so receipts outlive what they attest to (the retention rule in `DEALEROS_COGNITIA_PROOF_ADAPTER_V1.md` §11); 84/96 is the canonical placeholder pair both docs must carry |
| Cross-border transparency | `Tenant.dataResidency: 'ca'` default; privacy notice discloses any non-Canadian subprocessors | Canadian-region hosting by default — legally optional, commercially persuasive (research file recommendation #6) |
| Breach notification | Incident-response runbook (designed, Section 6) + receipts give the incident timeline | NEEDS_EXTERNAL_RESEARCH: exact PIPEDA breach-reporting thresholds/timelines and BC PIPA notification duties are **not** covered in `research/canada-compliance.md` (only Quebec Law 25's 72-hour rule is); must be researched and counsel-reviewed before the runbook is finalized |

SKIPPED_WITH_REASON: legally grounded retention values, breach-notification thresholds,
privacy-notice wording, and Privacy Officer designation all require legal counsel; V1
ships placeholders clearly labeled as such, used only in internal/demo environments.

### 1.3 BC VSA / Motor Dealer Act (vehicle sales + advertising)

Key mechanics from the research file: selling >5 vehicles/year deems you a dealer;
salespeople must hold VSA licences. Advertising: **all-in ("total") price — everything
the consumer pays except taxes**, non-negotiable fees inside the advertised price;
required ad content includes **dealer registration number, stock number, and VIN**; if
cash and finance prices differ, **both must appear**; disclosure duties for prior
taxi/rental/lease/emergency use, out-of-province history, rebuilt/salvage/altered
status, and known material defects. Current VSA Advertising Guidelines edition
effective November 19, 2025.

Mapping to `Dealer.licenseNumbers` + VDP price rules:

| VSA mechanic | Implementing control | Where |
|---|---|---|
| Dealer registration number display | `Dealer.licenseNumbers: [{ authority: 'VSA_BC', number }]` (scaffolded) rendered in website footer, every VDP, and every generated listing/ad | core.ts; render rules in `DEALEROS_SEO_AEO_AIO_WEBSITE_ENGINE_V1.md` |
| All-in price | `Vehicle.askingPrice` is defined as the total price except taxes; VDP/listing renderer is forbidden from appending non-negotiable fees; fee line items other than taxes are a render-time error | core.ts (`askingPrice` comment); website engine VDP template |
| Stock number + VIN in ads | `Vehicle.stockNumber` + `Vehicle.vin` are required fields; listing generator refuses to publish without both | core.ts (scaffolded); listing pipeline (designed) |
| Dual cash/finance price | If a finance price is shown, the cash price must render alongside; credit offers require full credit-offer details | Ad Compliance Pre-Flight (designed) |
| Prior-use / status disclosures | `VehicleDisclosure` kinds (`prior_rental`, `prior_taxi`, `out_of_province`, `rebuilt`, `accident_damage`, `odometer`, …) with `required: true` must surface on the VDP before publish | core.ts (scaffolded); VDP template (designed) |
| Ad Compliance Pre-Flight | Automated pre-publish check: total price present + fee-inclusive, dealer number + stock number + VIN present, dual pricing when applicable, required disclosures rendered; result emitted as a receipt so a dated record exists if a VSA complaint arrives later | Designed (research file "do better" #3 + receipts section); implementation lands in the dedicated repo |
| Salesperson licensing | Gap: `User` has no license-number field. V1.1 candidate: `User.licenseNumbers` mirroring `Dealer.licenseNumbers` | core.ts gap, flagged |

NEEDS_EXTERNAL_RESEARCH: full text of the Nov 19, 2025 VSA Advertising Guidelines
(fetch blocked, 403) — exact section numbers for "was/now" pricing, free-offer rules,
and demonstrator rules are required before the linter rule set is authored.

SKIPPED_WITH_REASON: the linter's actual rule content cannot be finalized without the
primary guideline text and counsel review; only the pipeline shape is designed now.

### 1.4 Expansion regimes (design-for, do-not-build-yet)

1. **Ontario (OMVIC)** — all-in price means "everything except HST and licensing" (differs
   from BC's "except taxes"); active enforcement climate (late-2025 CBC Marketplace
   investigation). LATER.
2. **Quebec Law 25** — applies to Quebec residents' data regardless of dealer location;
   PIAs, explicit consent, 72-hour breach notification, penalties to $25M. LATER, but the
   breach runbook should be drafted to a 72-hour-capable standard now.
3. **US: TCPA / CAN-SPAM** — flagged **LATER** per CONTEXT_PACK.md module 14. No US tenant
   until a TCPA/CAN-SPAM policy pack exists (TCPA consent standards for SMS/voice differ
   materially from CASL). `Tenant.region: 'us'` remains disabled at onboarding in V1.
4. **Architecture consequence:** advertising and consent rules are **versioned,
   province-scoped policy packs** (data, not hardcoded logic), so BC → ON → QC → US is
   configuration plus counsel review, not re-architecture.

---

## 2. AI-specific commitments

No AI-specific Canadian statute is currently in force (Bill C-27/AIDA died January
2025), but liability is real today: *Moffatt v. Air Canada* (BC CRT, 2024) held a
company liable for its chatbot's misrepresentation, and a Toronto BMW dealership's AI
chatbot generated a buy-back offer the store could not quietly revoke. Both are BC-first
cautionary tales for our AI BDC. DealerOS commitments (all three are V1 invariants):

1. **AI disclosure by default.** Every AI-assisted outbound draft appends
   `TenantSettings.aiPolicy.aiDisclosureFooter` (scaffolded; e.g. "Drafted with AI
   assistance, reviewed by our team."). Chat surfaces self-identify as AI-assisted at
   session start. Removing the footer requires a tenant policy change that is itself
   receipted. (See `DEALEROS_AI_BDC_AND_SALES_CLOSER_SPEC_V1.md`, channel table.)
2. **Human approval on all outbound.** `NextBestAction.requiresHumanApproval` and every
   connector send input (`SendMessageInput`, `PostListingInput`, `CalendarWriteInput`,
   `ExportLeadInput`) are typed `requiresHumanApproval: true` — the literal type `true`,
   not `boolean` — and mocks refuse to queue without a `human_approval_granted` receipt
   id (scaffolded in `build-packets/connectors/registry.ts`). Authority limits: the AI
   may never commit to a price, a buy-back, or a financing approval; those route to a
   named human. Every approval is a receipt — the documented chain the BMW store lacked.
3. **No raw PII to external models.** `TenantSettings.aiPolicy.piiToExternalModelsAllowed`
   is **typed `false`** in core.ts (hard-off; flipping it requires a schema-level policy
   review, not a settings toggle). `build-packets/ai-harness/redaction.ts` scaffolds the
   enforcement: `redactPii` strips emails, NA phone numbers, VINs, Canadian postal codes,
   and known customer names (longest-first, placeholder-stable) before any model call,
   and `DefaultPolicyGate.checkModelCall` denies any external-provider request that still
   contains PII (`pii_to_external_model_blocked_v1`) — it does not even consult a tenant
   flag. Local providers and `localOnlyMode` are the pressure valve for PII-heavy tasks.

---

## 3. Product control matrix

| # | Requirement (regime) | Implementing control | Location | Status |
|---|---|---|---|---|
| 1 | Per-channel consent with basis + expiry (CASL) | `ConsentRecord` fields incl. `basis`, `expiresAt`, `receiptId` | `build-packets/schemas/core.ts` | scaffolded |
| 2 | Consent-expiry engine + alerts (CASL) | Sweep job computing/renewing `expiresAt`, alerts `consent_expiring_30d` etc. | jobs plan, `DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md` | designed |
| 3 | Hard outbound consent gate (CASL) | Draft to contact with no valid basis → receipt with `policy_gate_result.result = 'deny'` (per the `PolicyGateResult` union in `build-packets/cognitia/receipts.ts`), send blocked | `DEALEROS_AI_BDC_AND_SALES_CLOSER_SPEC_V1.md` + Cognitia adapter | designed |
| 4 | Unsubscribe mechanics in every CEM (CASL) | Template gate: sender ID + contact info + unsubscribe pre-inserted, unremovable | AI BDC spec, template layer | designed |
| 5 | Same-day opt-out propagation, all channels (CASL, beats 10-day statute) | `status: 'revoked'` fan-out + `FollowUpPlan.pausedReason: 'opt_out'` | core.ts (fields scaffolded); propagation job designed | designed |
| 6 | Provable consent per message (CASL burden of proof) | `consent_captured` + per-send receipts with `consent_basis`, `payload_hash`; exportable evidence report | `DEALEROS_COGNITIA_PROOF_ADAPTER_V1.md` | designed (receipt types scaffolded in cognitia packet) |
| 7 | Access/export request flow (PIPEDA/PIPA) | `Customer.privacy.exportRequestedAt` + export workspace | core.ts (field scaffolded); workspace designed | designed |
| 8 | Destroy-or-anonymize + retention schedule (BC PIPA) | `privacy.deleteRequestedAt`/`anonymizedAt`, `retention.customerDataMonths`, daily sweep | core.ts (fields scaffolded); job designed | designed |
| 9 | Purpose limitation on service data (OPC #2009-023) | Marketing-purpose consent check before equity/service-to-sales drafts | `DEALEROS_AUTOALERT_STYLE_EQUITY_MINING_SPEC_V1.md` gate | designed |
| 10 | Legally grounded retention values + notices | — | — | SKIPPED_WITH_REASON: requires legal counsel; placeholders only (84/96 months), internal/demo use only |
| 11 | Breach-notification runbook thresholds (PIPEDA/PIPA/Law 25) | — | — | SKIPPED_WITH_REASON: thresholds/timelines not in research file; needs external research + counsel |
| 12 | Dealer licence display (VSA) | `Dealer.licenseNumbers` rendered site-wide + per ad | core.ts | scaffolded (render rules designed) |
| 13 | All-in price + VIN/stock in ads, dual pricing, disclosures (VSA) | Ad Compliance Pre-Flight + VDP render rules + `VehicleDisclosure` | core.ts (fields scaffolded); linter designed | designed |
| 14 | Ad linter rule content (VSA Nov 2025 guidelines) | — | — | SKIPPED_WITH_REASON: primary guideline PDF unfetchable (403); rule text needs the source + counsel |
| 15 | AI disclosure footer | `TenantSettings.aiPolicy.aiDisclosureFooter` appended to all AI drafts | core.ts | scaffolded (append job designed) |
| 16 | Human approval on external side effects | `requiresHumanApproval: true` literal types; mocks require approval receipt | `connectors/registry.ts`, core.ts | scaffolded |
| 17 | No raw PII to external models | `redactPii` + `DefaultPolicyGate` + `piiToExternalModelsAllowed: false` type | `ai-harness/redaction.ts` | scaffolded |
| 18 | TCPA/CAN-SPAM policy pack (US) | — | — | SKIPPED_WITH_REASON: US launch is LATER; no US tenants in V1, so no live requirement yet |
| 19 | Tenant isolation | `tenantId` on every record; row-level isolation | core.ts + `DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md` | scaffolded (schema) / designed (RLS enforcement) |
| 20 | RBAC | `RoleKey` incl. `auditor` (read-only + proof ledger) and receipted `platform_admin` access | core.ts | scaffolded (roles) / designed (permission matrix) |

---

## 4. SOC 2 readiness roadmap

**Readiness ≠ certification.** DealerOS is designing toward SOC 2-style operating
practices. We have not engaged an auditor, have no report, and will not claim "SOC 2
certified", "SOC 2 compliant", or any audit outcome anywhere, internal demos included,
until a real report exists. (SOC 2 attestation also cannot even begin until the
dedicated production repo and infrastructure exist — this Library repo is design-only.)

Practice-to-mechanism mapping (Trust-Services-style areas, design targets only):

| Practice area | DealerOS mechanism | Status |
|---|---|---|
| Audit logging | Cognitia proof receipts on every material action (22 event types, `policy_gate_result`, `payload_hash`, actor identity incl. receipted `platform_admin` access) — see `DEALEROS_COGNITIA_PROOF_ADAPTER_V1.md` | designed (receipt schema scaffolded) |
| Access control / RBAC | `RoleKey` set with least-privilege defaults; `auditor` role read-only; permission matrix per module | scaffolded (roles) / designed (matrix) |
| Tenant isolation | `tenantId` on every tenant-owned record; row-level security in the app repo; isolation test suite as acceptance gate | designed; SKIPPED_WITH_REASON for enforcement code: needs the dedicated `cognitiacloud/dealeros` repo |
| Change management | PR review + CI + migration gates in the dedicated repo; prompt/version registry for AI changes (`DEALEROS_AI_MODEL_HARNESS_AND_CONNECTOR_REGISTRY_V1.md`) | designed |
| Vendor management | Connector registry doubles as the vendor inventory: provider, scopes, mode, secrets-by-env-name, live-approval receipt per connector | scaffolded (registry) / designed (subprocessor list + DPA tracking) |
| Availability | RTO targets + fallback runbook (Section 7); mock mode as degraded-operation posture | designed |

Roadmap gates (numbered, in order; each gate blocks the next):

1. **Gate R1 — dedicated repo exists** (`cognitiacloud/dealeros`, Week-1 roadmap item per
   CONTEXT_PACK.md §9): controls move from scaffold to enforced code.
2. **Gate R2 — controls implemented + isolation tests green**: RLS, RBAC matrix, receipt
   emission on all 22 event types, secrets management.
3. **Gate R3 — evidence period**: 3–6 months of receipts, access reviews, change logs.
4. **Gate R4 — external readiness assessment, then auditor engagement.**
   SKIPPED_WITH_REASON: engaging an auditor requires a vendor contract and a production
   system; out of scope for this design phase. No timeline promised.

---

## 5. Data lifecycle

Principles: collect the minimum, label PII at the schema level (core.ts `// PII`
comments are the single source of truth for the redaction gate), retain on a schedule,
anonymize rather than lose the audit trail.

| Data class | Minimization rule | Retention default (placeholder, pending counsel) | End-of-life |
|---|---|---|---|
| Customer identity + contact methods | Only what the lead/deal needs; no SIN, no driver's licence number in V1 schemas | `customerDataMonths: 84` | Anonymization job strips PII fields, stamps `privacy.anonymizedAt`, keeps aggregate stats |
| Consent records | Full history kept while customer record lives | Lives with the customer, then survives as anonymized evidence linked to receipts | Anonymized, never silently deleted (CASL proof) |
| Proof receipts | Contain `customer_ref_redacted`, hashes — no raw PII by design | `receiptRetentionMonths: 96` (must exceed `customerDataMonths`) | Cold-storage export + tombstoning per `DEALEROS_COGNITIA_PROOF_ADAPTER_V1.md` |
| Free-text notes (`TrafficEvent.notes` etc.) | Marked PII-possible; redacted before any model call | Same as customer data | Included in anonymization sweep |
| Model-call payloads | Redacted text only; usage ledger stores hashes, not content | Ledger: 24 months (placeholder) | Purge job |
| Vehicle/inventory data | Not personal data (except trade-in VIN linkage) | Business records; indefinite | Archive status |

Flows (all designed; execution job in `DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md`
runs daily and is itself receipted):

1. **Right-to-access/export:** request stamped on `privacy.exportRequestedAt` → export
   workspace bundle → delivery logged as a receipt. Acceptance: bundle generated in demo
   with fake data end-to-end, zero manual SQL.
2. **Delete/anonymize request:** stamped on `privacy.deleteRequestedAt` → human review
   (legal-hold check) → anonymization job → `anonymizedAt` + receipt. Acceptance: after
   the job, no PII-marked field for that customer is readable by any role, while deal
   aggregates and receipts still resolve.
3. **Scheduled retention sweep:** contacts past `customerDataMonths` with no legal hold
   are auto-anonymized (BC PIPA destroy-or-anonymize duty). Acceptance: sweep is
   idempotent and dry-run-able per tenant.

SKIPPED_WITH_REASON: retention values, legal-hold criteria, and export-bundle legal
sufficiency all require legal counsel review before any real-tenant use; current values
are engineering placeholders exercised only against fake/reserved demo data.

---

## 6. Security engineering checklist

All items target the dedicated repo; status here is what the scaffolds already enforce.

1. **Encrypted secrets / no raw secrets in config.** Scaffolded guard:
   `assertNoRawSecret` in `build-packets/connectors/registry.ts` rejects values matching
   secret prefixes (`sk-`, `xoxb-`, `AKIA`, PEM headers, bearer) or >60-char spaceless
   tokens; configs store env-var **names** only (`secretEnvVarNames`). Production KMS /
   sealed-secrets choice: SKIPPED_WITH_REASON — infrastructure decision for the dedicated
   repo. Acceptance: CI secret-scan + registry guard both green; no secret value ever in
   DB rows or receipts.
2. **Webhook verification.** Every inbound webhook (lead providers, Twilio, calendar)
   must be signature-verified with per-connector secrets, replay-protected (timestamp
   window + nonce), and receipted on failure. Designed; implementation needs the repo
   and per-vendor docs (NEEDS_EXTERNAL_RESEARCH: per-vendor signing schemes at
   integration time). Acceptance: unsigned/stale payloads rejected in integration tests.
3. **Rate limiting.** Per-tenant and per-connector budgets: API rate limits, model-call
   cost caps (usage ledger in `DEALEROS_AI_MODEL_HARNESS_AND_CONNECTOR_REGISTRY_V1.md`),
   outbound message throttles (also a CASL-adjacent safety: no bulk blasts by accident).
   Designed. Acceptance: limits configurable per tenant, breaches receipted.
4. **Connector permission scopes.** Scaffolded: `scopes` must match least-privilege
   `resource:action` pattern (registry enforces `SCOPE_PATTERN`); capabilities declared
   per adapter; mock-by-default; `live` mode requires a `human_approval_granted` receipt;
   health checks never touch live APIs under `never_live` (violations throw).
5. **Tenant isolation tests.** Cross-tenant read/write attempts must fail at the RLS
   layer and be receipted. Designed (Gate R2).
6. **Incident-response runbook.** Detection → containment → receipts-derived timeline →
   notification decision (counsel loop) → post-incident review. Designed;
   notification thresholds SKIPPED_WITH_REASON (Section 1.2, item 11 in matrix).

---

## 7. Incident learning — CDK June 2024 outage

Facts per `research/cdk.md`: June 18–19, 2024, BlackSuit ransomware hit CDK Global, with
a second incident during initial recovery; roughly 15,000 dealerships across the US and
Canada lost their DMS/CRM for about two weeks; dealers reverted to paper deal jackets
and hand-written repair orders. Industry lessons drawn: vendor concentration is systemic
risk, and all-in-one is also all-down-at-once.

Design consequences for DealerOS (positioned as trust features, stated claim-safely —
these are design intentions, not resilience guarantees):

1. **Export-your-data as a product stance.** Self-serve, complete tenant data export
   (customers, consents, inventory, traffic, receipts) in documented formats, any time,
   no support ticket, no exit fee. "You own your data and you can leave" — the CDK
   outage made this a buying criterion (per `research/cdk.md`).
2. **Paper-fallback runbook.** Printable traffic-desk sheets and deal jackets, an
   offline-capable appointment board target, and a documented degraded-mode procedure —
   designed in `DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md` territory rather than improvised
   mid-incident.
3. **Published internal RTO targets.** Set and rehearsed once real infrastructure
   exists. SKIPPED_WITH_REASON: meaningful RTO numbers require the production
   environment; none exists and none is claimed.
4. **Receipts as incident forensics.** Post-outage, dealers ask "what happened, who did
   it, can I prove it?" — a receipt ledger makes the incident timeline a query, not a
   forensics engagement.
5. **Connector-ready, not connector-dependent.** Mock-by-default connectors mean a
   partner outage degrades one capability, not the desk; the platform never assumes an
   external vendor is up.

---

## 8. DO-NOT-CLAIM list (restated verbatim from CONTEXT_PACK.md Section 7)

> NEVER claim publicly: production ready; replaces every DMS; guaranteed
> sales; live DealerMine/TMS integration; compliance certified; SOC 2
> certified; GDPR certified; AutoAlert replacement (unless feature parity is
> real); real customer proof until validated.

Additions specific to this document's subject matter (same force): never claim "CASL
compliant", "PIPEDA compliant", "VSA approved", "audit-proof", or "breach-proof". The
claim-safe framing is always capability-shaped: "designed to help you keep provable
consent records", "built with SOC 2-style practices in mind", "consent-aware follow-up".

---

## 9. Roadmap gates (compliance-specific)

| Gate | What it unblocks | Blocker type |
|---|---|---|
| Legal counsel review of Sections 1, 5, 6 interpretations | Any compliance-adjacent feature naming a statute in UI copy | SKIPPED_WITH_REASON: requires legal counsel |
| Primary-source verification (CRTC pages, VSA Nov 2025 PDF) | Consent-engine spec freeze; ad-linter rule authoring | NEEDS_EXTERNAL_RESEARCH (fetches blocked) |
| Dedicated repo (`cognitiacloud/dealeros`) | Enforced RLS, secrets management, webhook verification, rate limiting | SKIPPED_WITH_REASON: repo does not exist yet (Week-1 item) |
| Real infrastructure | RTO targets, encryption-at-rest specifics, SOC 2 evidence period | SKIPPED_WITH_REASON: no production deploy authorized |
| Counsel-approved breach runbook | Any tenant-facing incident commitments | SKIPPED_WITH_REASON: thresholds unresearched + counsel required |

---

## Boundaries honored

- **Not legal advice; no unsupported compliance claims.** Every regulatory reading here
  is an engineering interpretation of `research/canada-compliance.md` pending legal
  counsel review; counsel review is an explicit roadmap gate.
- **No certification claims.** SOC 2 material is readiness-only; readiness ≠
  certification is stated in Section 4; the verbatim DO-NOT-CLAIM list is restated in
  Section 8. No CASL/PIPEDA/VSA/GDPR compliance or certification is claimed.
- **No "production ready" language; design only.** All controls are scaffolded reference
  types or designs; this Library repo is not the production codebase.
- **No secrets, no live APIs, no live CRM/DMS writes, no production deploy or
  migrations.** Secrets appear as env-var names only; connectors are mock-by-default
  with live mode gated on human approval + proof receipt; blocked work is marked
  `SKIPPED_WITH_REASON` inline.
- **No real customer PII, no fake proof, no outreach.** All flows are specified against
  fake/reserved demo data; unverifiable external facts are marked
  `NEEDS_EXTERNAL_RESEARCH` and no vendor facts were invented beyond the research files.
- **No crypto/token language.** The agent-economy layer is referenced only as internal
  primitives via proof receipts.
