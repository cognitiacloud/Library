# DEALEROS COGNITIA PROOF ADAPTER — MODULE 11 SPEC (V1)

STATUS: INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.

Owner: Muhammad Firoz · Date: 2026-07-03 · Version: V1

Scope: Module 11 (Cognitia proof adapter) as scaffolded in
`build-packets/cognitia/receipts.ts`, with linkage to
`build-packets/cognitia/agent-economy.ts` (Module 15) and
`build-packets/schemas/core.ts`. Siblings this spec depends on:
`DEALEROS_AI_BDC_AND_SALES_CLOSER_SPEC_V1.md` (which flows emit receipts),
`DEALEROS_AUTOALERT_STYLE_EQUITY_MINING_SPEC_V1.md` (equity receipts),
`DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md` (traffic/SLA receipts),
`DEALEROS_FEATURE_MAP_AND_MODULE_ARCHITECTURE_V1.md` (module placement), and
the planned `DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md` (tenant isolation
of the ledger).

---

## 1. Why proof receipts are the platform spine

1. **Dealers have been burned by vendor claims.** Independent dealers like
   Budget Wheels (tenant-zero, Vancouver BC) have paid for CRMs that promised
   follow-up and delivered dashboards nobody could audit — activity claims
   without inspectable evidence (see
   `DEALEROS_COMPETITOR_RESEARCH_MATRIX_V1.md`). Our counter-position is not
   a louder claim — it is a *paper trail*.
2. **The product metaphor is the spec.** "A dealership sales desk with a paper
   trail — not a magic chatbot" (CONTEXT_PACK Section 5). Every important
   action — human, agent, system, or connector — produces one receipt; none
   can be manufactured after the fact without breaking the chain.
3. **Receipts are the trust product, not a logging feature.** The dealer's
   monthly proof report (Section 10), Demandara marketing reporting (Module
   10, `GET /api/demandara/proof-report`), agent work-credit candidates
   (Module 15), and compliance audit trails (Module 14) all read the same
   ledger. One spine, four consumers.
4. **Receipts are the AI-governance enforcement point.** Emitter invariants
   (Section 6) make it structurally impossible to record an agent-caused
   external side effect without a named human approver, or any side effect on
   a denied gate. Governance lives in the write path, not in a policy PDF.
5. **Internal honesty rule:** receipts prove *what the system recorded, in
   what order, under which gate and consent basis* — not business outcomes.
   No public claim may be made from them until validated (CONTEXT_PACK
   Section 7).

---

## 2. The receipt schema — every field of `ProofReceipt`, with rationale

Source of truth: `ProofReceipt` in `build-packets/cognitia/receipts.ts`.
Wire/ledger format is snake_case on purpose (serialized to Cognitia as-is);
in-app domain types in `build-packets/schemas/core.ts` stay camelCase.

| # | Field | Type | Required | Rationale |
|---|-------|------|----------|-----------|
| 1 | `receipt_id` | `ReceiptId` | yes | Stable citation handle. Domain records point back at receipts (`Lead.receiptIds`, `Appointment.receiptId`, `ConsentRecord.receiptId`, `OpportunityScore.receiptId` in core.ts). Emitter assigns `rcpt_` + zero-padded sequence in the scaffold. |
| 2 | `tenant_id` | `TenantId` | yes | Row-level isolation key. Ledgers are strictly per-tenant; no cross-tenant chain, no cross-tenant query. |
| 3 | `dealer_id` | `DealerId` | yes | Dealer-level reporting scope inside a tenant (tenant → dealer group → dealer → rooftop). |
| 4 | `rooftop_id` | `RooftopId` | yes | Physical-location attribution: traffic accountability and SLA reporting are rooftop-level in `DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md`. |
| 5 | `actor_type` | `'human' \| 'agent' \| 'system' \| 'connector'` | yes | The first question an auditor asks: *who did this — a person, an AI, a scheduler, or an integration?* Drives the approver invariant (agents need approvers for side effects). |
| 6 | `actor_id` | `string` | yes | Specific actor: a `UserId`, an `AgentPassportId`, a system job name, or a `ConnectorId`. Free string because the referent type varies by `actor_type`. |
| 7 | `agent_passport_id` | `AgentPassportId?` | optional | When an agent acted, ties the receipt to its passport (`AgentPassport` in agent-economy.ts) and therefore to an exact `model_provider_ref` and `prompt_registry_key`. Every AI action is traceable to a prompt version. |
| 8 | `human_approver_id` | `UserId?` | optional | The named human who approved the action. Mandatory (enforced) whenever an agent caused an external side effect. Accountability is a person, not a role. |
| 9 | `customer_ref_redacted` | `string` | yes | ALWAYS from `redactCustomerRef()` or `NO_CUSTOMER_REF` (`'cust_none'`) — never a raw id or name. Lets receipts be retained, exported, and shown without carrying PII (Section 11). Emitter rejects values not starting `cust_`. |
| 10 | `lead_id` | `LeadId?` | optional | Joins the receipt to the lead pipeline (Module 5) without duplicating lead content into the ledger. |
| 11 | `vehicle_id` | `VehicleId?` | optional | Joins to inventory (Module 3) — e.g. which unit was matched or test-driven. |
| 12 | `deal_id` | `DealId?` | optional | Joins to the deal for `sold_marked` and attribution receipts. |
| 13 | `campaign_id` | `CampaignId?` | optional | Joins to Demandara campaigns for `campaign_generated` / `campaign_attributed`. |
| 14 | `connector_id` | `ConnectorId?` | optional | Joins to the connector registry (Module 12) for sync receipts and any externally-caused event. |
| 15 | `event_type` | `ProofEventType` | yes | One of exactly 22 values (Section 3). Closed vocabulary → reports and policies can be exhaustive; new event types are a schema change, not a string. |
| 16 | `action_requested` | `string` | yes | What was asked for, before gating. Distinct from what happened, so denied/queued actions are still first-class evidence ("agent asked to send SMS; gate said no"). |
| 17 | `action_taken` | `string` | yes | What actually happened. The requested/taken pair is the core honesty mechanism — most audit disputes are exactly the gap between the two. |
| 18 | `policy_gate_result` | `PolicyGateResult` | yes | `{ gateKey, result: 'allow' \| 'deny' \| 'needs_human_approval', reason }`. Records *which* gate ruled and *why*, not just the verdict (Section 6). |
| 19 | `consent_basis` | `ConsentRecord['basis']` | yes | `'express' \| 'implied_ebr' \| 'implied_inquiry' \| 'none'` — CASL-aware vocabulary reused from core.ts so consent language cannot drift between CRM and ledger (Section 9). |
| 20 | `data_refs` | `string[]` | yes | Opaque references to evidence records (no PII in the refs themselves): conversation refs, SLA state refs, approval-task refs. The receipt cites evidence; it does not embed it. |
| 21 | `external_side_effect` | `boolean` | yes | Did anything leave the system (SMS, email, listing post, calendar write, CRM/DMS export)? The single most important filter for audits and for the agent-approver invariant. |
| 22 | `payload_hash` | `string` | yes | sha256 hex of the canonicalized receipt body (every field except the two hash fields). Any later edit to the body is detectable (Section 4). |
| 23 | `prev_receipt_hash` | `string` | yes | Receipt-hash of the previous ledger entry, or the literal `'GENESIS'` for the first. Chains order and content: you cannot silently insert, delete, or reorder receipts without breaking every later link. |
| 24 | `timestamp` | `IsoTimestamp` | yes | ISO-8601 UTC. Passed *into* `emit()` by the caller — no `Date.now()` inside logic — so receipt creation is deterministic and testable. |
| 25 | `rollback_path` | `string` | yes | How to undo or compensate this action (Section 8). Forces the "how do we take it back?" question to be answered at write time, not incident time. |
| 26 | `dispute_path` | `string` | yes | Where a human contests this record, e.g. `cognitia://disputes/new?receipt=<id>`. Every receipt is contestable by construction (Section 8). |
| 27 | `claim_safe_summary` | `string` | yes | Factual, past-tense, template-generated sentence. The only receipt text ever shown in dealer-facing UI or reports (Section 5). |

Emitter split: callers supply `ProofReceiptInput` (everything above except
`receipt_id`, `payload_hash`, `prev_receipt_hash`, `timestamp`,
`claim_safe_summary`); the emitter fills the rest. Callers can neither pick
their own hashes nor write their own summaries.

---

## 3. The 22-event catalog

Exactly the `ProofEventType` union in receipts.ts — no additions, no renames.
"Typical gate result" is the default expectation; a gate may rule differently
per tenant policy. "Ext" = typical `external_side_effect`.

| # | event_type | When emitted | Typical actor_type | Typical gate result | Ext |
|---|------------|--------------|--------------------|---------------------|-----|
| 1 | `lead_received` | A traffic event is ingested from any source (phone, internet lead, walk-in, website, marketplace, after-hours, service drive, referral, partner) and linked via `TrafficEvent.receiptId` | system / connector | allow | no |
| 2 | `consent_captured` | A `ConsentRecord` is created or updated — grant, implied-consent start, revocation/opt-out | human / system | allow | no |
| 3 | `customer_created` | A new `Customer` record is created (form intake, desk entry, connector import) | human / system | allow | no |
| 4 | `duplicate_detected` | Dedup pass assigns a `duplicateClusterKey`; record held for human merge review — never auto-merged | system | allow (merge itself gated separately) | no |
| 5 | `vehicle_matched` | Matching logic records in-stock inventory against a stated customer need (`Lead.interestVehicleIds`) | agent | allow | no |
| 6 | `inventory_context_used` | An AI draft consumed inventory context (price, availability, disclosures) — provenance for what the model saw | agent | allow | no |
| 7 | `equity_score_generated` | Module 7 produces an `OpportunityScore` with reason codes and factors (see `DEALEROS_AUTOALERT_STYLE_EQUITY_MINING_SPEC_V1.md`); human review required before any outreach | agent | allow (outreach gated separately) | no |
| 8 | `ai_reply_drafted` | BDC agent drafts a customer reply; draft is held, never sent by the agent (see `DEALEROS_AI_BDC_AND_SALES_CLOSER_SPEC_V1.md`) | agent | needs_human_approval | no |
| 9 | `human_approval_requested` | Any gate returns `needs_human_approval` and an approval `WorkTask` is created | agent / system | needs_human_approval (that verdict is what this receipt records) | no |
| 10 | `human_approval_granted` | A named human approves a pending action; `human_approver_id` set | human | allow | no |
| 11 | `appointment_drafted` | Appointment/test-drive proposal drafted (`Appointment.status='draft'`, `draftedBy='agent'` or `'human'`); drafting alone never contacts the customer | agent / human | allow (draft-only) | no |
| 12 | `appointment_confirmed` | Customer-side confirmation evidence recorded (inbound reply, call log); `confirmedByUserId` set. The outbound confirmation message is a separate `followup_sent` | human / system | allow | no |
| 13 | `test_drive_completed` | Staff logs a completed test drive against lead + vehicle | human | allow | no |
| 14 | `followup_sent` | A human-approved outbound touch actually went out on a consented channel | agent (with approver) / human | allow (post-approval) | yes |
| 15 | `crm_updated` | A material CRM write: stage change, qualification fields, merge, note of record | any | allow | no |
| 16 | `sold_marked` | Deal marked sold (`Deal.status`, `soldAt`); RBAC restricts who may do this | human | allow | no |
| 17 | `lost_reason_recorded` | A `LostReason` is recorded on a lead/traffic outcome | human / system | allow | no |
| 18 | `review_requested` | Human-approved review request sent to a delivered, consented customer; review CONTENT is never authored by agents | agent (with approver) / human | allow (post-approval) | yes |
| 19 | `campaign_generated` | Campaign draft created at `status='pending_approval'` (Demandara, Module 10); activation is a separate human-approved step | agent | allow (draft-only; activation gated) | no |
| 20 | `campaign_attributed` | Attribution link recorded between a campaign and an outcome (`DealAttribution`) | system | allow | no |
| 21 | `connector_sync_completed` | A connector run finished in its configured mode (mock by default; live requires prior approval, Module 12) | connector | allow | mock: no · live: yes |
| 22 | `connector_sync_failed` | A connector run failed; no external writes confirmed for the run | connector | allow (recording a failure is always allowed) | no |

Acceptance criterion: every flow in the sibling specs that names one of these
events MUST link the resulting domain record to the receipt (e.g.
`TrafficEvent.receiptId`, `Lead.receiptIds`) — an event with no receipt is a
bug, and a receipt with no reachable domain record is a bug.

---

## 4. Hash chain and tamper evidence — what it proves and what it does not

### 4.1 Mechanics (as implemented in `InMemoryProofEmitter`)

1. **Payload hash.** `computePayloadHash()` = sha256 hex of the *canonicalized*
   receipt body — all fields except `payload_hash` and `prev_receipt_hash`.
   Canonicalization (`canonicalize()`) recursively sorts object keys and drops
   `undefined` fields, so the same logical receipt always hashes identically
   regardless of key insertion order.
2. **Link hash.** `computeReceiptHash()` = sha256 of
   `payload_hash + '|' + prev_receipt_hash`. Each new receipt stores the
   *link hash of its predecessor* in `prev_receipt_hash`. Because the link
   hash covers the predecessor's own `prev_receipt_hash`, it binds both the
   body **and the position** of every earlier receipt.
3. **GENESIS anchor.** The first receipt in a tenant ledger stores the literal
   string `'GENESIS'` (`GENESIS_HASH`). It marks the deliberate start of the
   chain — a per-tenant, plain-text anchor, nothing more.
4. **Verification.** `verifyChain()` walks index 0 → end and checks two things
   per entry: (a) stored `payload_hash` equals a fresh `computePayloadHash()`
   — failure reason `payload_hash mismatch (receipt body altered)`; (b) stored
   `prev_receipt_hash` equals `computeReceiptHash(previous)` (or `GENESIS` at
   index 0) — failure reason `prev_receipt_hash mismatch (chain link broken)`.
   Returns `{ valid, failedAtIndex?, reason? }`, so the UI can point at the
   first bad entry.

### 4.2 What tampering detection proves

- Editing any field of any stored receipt changes its payload hash →
  detected at that index.
- Deleting, inserting, or reordering receipts breaks the next entry's
  `prev_receipt_hash` → detected at the first affected link.
- An attacker who edits receipt *i* must recompute and rewrite hashes for
  *every* receipt after *i* to make the chain verify again — tampering is
  forced to be wholesale, not surgical.

### 4.3 Honest limits — what it does NOT prove

1. **Tamper-evident, not tamper-proof.** A party with full write access can
   rewrite the ledger from any point forward and recompute all hashes;
   `verifyChain()` would then pass. Detecting *that* requires an anchor held
   outside the writer's control (periodic export of the latest link hash to a
   store the tenant can compare against) — a Cognitia-central concern
   (Section 12), not in the in-process scaffold.
2. **No truth guarantee.** The chain proves internal consistency and ordering,
   not that the described action actually happened or happened correctly —
   garbage receipted honestly is still garbage. Truth checks come from
   evidence review (`data_refs`, `WORK_EVENT_DEFINITIONS` in
   agent-economy.ts) and disputes, not the chain.
3. **No completeness guarantee.** An event never emitted leaves no gap the
   chain can reveal. Completeness is enforced upstream by the
   emit-on-every-important-action rule and flow-level test coverage.
4. **No non-repudiation.** Receipts are unsigned in V1; nothing
   cryptographically ties a receipt to an author key. SKIPPED_WITH_REASON:
   receipt signing (per-tenant keys, custody, rotation) needs dedicated
   infrastructure and a security review in the dedicated code repo.
5. **Not a blockchain and never described as one.** Single writer, single
   store, per-tenant, no consensus, no distribution, no tokens. Approved
   vocabulary: "hash-chained, append-only ledger", "tamper-evident".
   Blockchain/crypto language is a hard boundary (CONTEXT_PACK Section 4).

---

## 5. Claim-safe summary generation rules

1. **Templates only.** `claim_safe_summary` is generated exclusively by
   `buildClaimSafeSummary()` from `SUMMARY_TEMPLATES` — one fixed template per
   event type, taking only receipt fields (redacted customer ref plus optional
   lead/vehicle/deal/campaign/connector tags). No free text, no model-written
   summaries, no caller-supplied summaries (the emitter overwrites the field).
2. **Style contract:** factual, past tense, one sentence, no superlatives, no
   guarantees, no raw PII. Governance-relevant templates state the safeguard
   in the sentence itself, e.g. `ai_reply_drafted` → "…the draft was held for
   human approval and was not sent."; `equity_score_generated` → "…human
   review required before any outreach."; `connector_sync_failed` → "…no
   external writes were confirmed for this run."
3. **Banned vocabulary (default lint list for any new template, enforced by a
   template test in the dedicated repo):** guarantee/guaranteed, best, #1,
   production ready, certified, compliant/compliance-certified, always,
   never (as a performance claim), instantly, revolutionary, proven (as an
   outcome claim), closed the deal / made the sale (agents draft; humans
   sell), and any token/crypto term. New templates are reviewed against
   CONTEXT_PACK Section 7 before merge.
4. **PII redaction.** Every customer mention is the output of
   `redactCustomerRef()`: `'cust_'` + first 10 hex chars of sha256(customerId)
   — deterministic per customer (so receipts for the same person correlate),
   one-way (no raw id or name recoverable). Events with no customer in scope
   use `NO_CUSTOMER_REF` (`'cust_none'`). The emitter hard-rejects any
   `customer_ref_redacted` not starting with `cust_`. Names, phones, emails,
   and message bodies never enter a receipt; they live behind `data_refs`.
5. **Why this matters:** the summary is the only receipt text a dealer, an
   auditor, or a monthly report ever displays. If the template layer is
   claim-safe, every downstream surface inherits it.

---

## 6. Policy gates — allow / deny / needs_human_approval

1. **Shape.** `PolicyGateResult = { gateKey, result, reason }`. `gateKey`
   names the specific gate (e.g. `outbound_comms.consent_check`), `reason` is
   a human-readable justification. A verdict without a named gate and reason
   is not accepted.
2. **Where gates sit.** Gates run *before* the action executes and the
   verdict is recorded *in* the receipt. Order in every flow:
   action proposed → gate(s) evaluated → (a) `allow`: execute, emit receipt
   with the verdict; (b) `deny`: do NOT execute, emit a receipt recording the
   denial (`action_requested` ≠ `action_taken`); (c) `needs_human_approval`:
   hold the action, emit `human_approval_requested`, create an approval
   `WorkTask`, and proceed only after `human_approval_granted`.
3. **Emitter enforcement (from `assertInvariants`):** a receipt with
   `external_side_effect: true` and a `deny` verdict is rejected — the ledger
   cannot record "we did it anyway." Agent-caused external side effects
   without a `human_approver_id` are rejected.
4. **Default gate set (V1, tenant-configurable via
   `TenantSettings.approvals.humanApprovalRequiredFor`):**

| gateKey | Guards | Default verdict logic |
|---------|--------|-----------------------|
| `outbound_comms.consent_check` | send_sms / send_email / place_call | deny if channel consent revoked/unknown or implied consent expired; else needs_human_approval for agent-drafted sends (all `ExternalSideEffectKind` comms are approval-listed in V1) |
| `outbound_comms.human_approval` | any agent-drafted outbound | needs_human_approval always in V1 (`NextBestAction.requiresHumanApproval: true` is hard-typed) |
| `publishing.disclosure_check` | post_listing / publish_page | deny if required `VehicleDisclosure` items are missing from copy inputs; else needs_human_approval |
| `connector.live_mode` | crm_export / dms_export / calendar_write, any live connector call | deny unless connector is explicitly live-enabled AND a prior human approval receipt exists (mock default, Module 12) |
| `data.merge_review` | duplicate merges | needs_human_approval always (auto-merge prohibited) |
| `ai.pii_egress` | any external model call | deny raw PII egress (`piiToExternalModelsAllowed: false` is hard-off in V1, core.ts); redaction gate per Module 13 |

---

## 7. Human approval linkage

1. **The pair.** `human_approval_requested` and `human_approval_granted` are
   two separate receipts. The request records the gate verdict and the exact
   `action_requested`; the grant records the named `human_approver_id` and
   repeats the same `action_requested` string. Pairing rule: a grant is valid
   only if its `action_requested` matches its request receipt (linked via
   `data_refs` carrying the request's receipt id and the approval task ref).
2. **Approval is not execution.** The action that follows (e.g.
   `followup_sent`) is a third receipt carrying `external_side_effect: true`,
   the same `human_approver_id`, and `data_refs` back to the approval pair.
   Audit question "who approved this send?" is answered by one field plus a
   two-hop citation, all inside the ledger.
3. **Denials are receipts too.** A human rejecting a draft is recorded as a
   `HumanReviewEvent` with `decision: 'rejected'` (agent-economy.ts) plus a
   `crm_updated` receipt; the drafted action is never re-attempted without a
   new request. There is deliberately no `human_approval_denied` event in the
   22-type vocabulary — the review event plus the absence of a grant is the
   evidence, and the vocabulary stays exactly at the Module-11 list.
4. **Scale note.** Approval fatigue is a real risk; V1 accepts it for
   tenant-zero. Any relaxation (e.g. auto-approve templated follow-ups) is a
   policy-gate change requiring owner sign-off, and remains fully receipted.

---

## 8. `rollback_path` and `dispute_path` semantics

### 8.1 rollback_path

1. A short, structured instruction for undoing or compensating the action,
   written at emit time. Convention: `<event or system>: <compensation>` —
   e.g. `crm_updated: restore prior snapshot ref`.
2. Three classes, and the string must be honest about which applies:
   - **Reversible in-system** (crm_updated, vehicle_matched, stage changes):
     restore the prior snapshot referenced in `data_refs`.
   - **Compensable, not reversible** (followup_sent, review_requested,
     post_listing): a sent message cannot be unsent. The rollback path names
     the compensation: send a human-approved correction, suppress the
     channel, delist, and record the compensating action as its own receipt.
   - **Non-reversible record-of-fact** (lead_received, test_drive_completed,
     connector_sync_failed): rollback path is `none: record-of-fact; correct
     via superseding receipt` — the ledger is append-only, so corrections are
     new receipts, never edits.
3. Rollback is never automatic in V1. The path is instructions for a human
   (or a supervised job), and executing it emits new receipts.

### 8.2 dispute_path

1. A URI-style pointer into the dispute flow:
   `cognitia://disputes/new?receipt=<id>`. Every receipt carries one; every
   record is contestable by construction.
2. Opening a dispute creates a `DisputeEvent` (agent-economy.ts): opened by a
   named `UserId`, with a reason, moving through
   `open → resolved_upheld | resolved_overturned`. Work-event-level dispute
   guidance (who reviews, what evidence decides) is defined per event in
   `WORK_EVENT_DEFINITIONS` (prefix `cognitia://disputes/new?work_event=…`).
3. Effects of a resolved-overturned dispute: linked `WorkCreditCandidate`
   moves to `rejected`/`disputed`, a negative `ReputationEvent` may be
   recorded against the agent passport, and a superseding correction receipt
   is emitted. The original receipt is never deleted or edited.

---

## 9. `consent_basis` propagation from `ConsentRecord`

1. **Single vocabulary.** `ConsentBasis = ConsentRecord['basis']` — the
   receipt type is *derived from* core.ts, so the CASL-aware values
   (`express`, `implied_ebr`, `implied_inquiry`, `none`) cannot drift between
   the CRM and the ledger.
2. **Propagation rule.** At action time, the flow resolves the governing
   `ConsentRecord` for the customer + channel and copies its `basis` into the
   receipt. The receipt captures the basis *as of the action*, so a later
   revocation does not retroactively falsify history.
3. **Expiry.** Implied consent expires under CASL (`ConsentRecord.expiresAt`).
   The `outbound_comms.consent_check` gate treats an expired implied basis as
   no consent → deny; the denial receipt still records the (expired) basis
   plus the gate reason, which is exactly the evidence an auditor wants.
4. **`none` is legitimate** for events with no communications nexus
   (connector syncs, internal scoring, inventory matches) and for inbound
   record-of-fact events. `none` on an *outbound* receipt with
   `external_side_effect: true` is a red-flag query in the ledger browser
   (Section 10) and should be impossible if the consent gate is wired
   correctly — acceptance test material.
5. **Closing the loop:** `consent_captured` receipts write their own
   `receipt_id` back onto the `ConsentRecord` (`ConsentRecord.receiptId`), so
   the consent record and its proof cite each other.

---

## 10. Tenant proof ledger UX sketch (dealer-facing)

Design only; screens to be built in the dedicated repo.

1. **Receipts browser** (roles: `owner`, `general_manager`, `auditor`;
   `auditor` is read-only by definition in core.ts):
   - Filters: date range, event_type (22-value picker), actor_type, specific
     agent passport, rooftop, external-side-effect-only, gate result,
     consent basis, lead/deal/vehicle id.
   - List row: timestamp · event_type badge · claim_safe_summary ·
     actor chip (human name / agent display_name / connector) · gate verdict
     chip (green allow / red deny / amber approval) · side-effect icon.
   - Detail drawer: all fields; `data_refs` as links (resolved only if the
     viewer's role can see the target); approval pair navigation; buttons
     "Open dispute" (dispute_path) and "View rollback instructions"
     (rollback_path).
   - **Chain status banner:** result of the latest `verifyChain()` run —
     "Ledger verified through receipt N at <time>" or, on failure, the
     `failedAtIndex` and reason, pinned red. Verification runs on a schedule
     and before every export.
2. **Monthly proof report** (per dealer, generated from receipts only; the
   template heir of the internal "used-car dealer proof report template",
   CONTEXT_PACK Section 5; served to Demandara via
   `GET /api/demandara/proof-report`, Module 10):
   - Counts per event type; drafts vs approved vs sent funnel
     (`ai_reply_drafted` → `human_approval_granted` → `followup_sent`).
   - External side effects listed individually, each with its named approver.
   - Denied-gate log (what the system refused to do, and why).
   - Consent posture: sends by basis; zero-tolerance check for
     `none`-basis outbound.
   - Disputes opened/resolved; chain verification statement for the period.
   - Fixed footer on every report: "Internal record of system activity.
     Not an outcome guarantee. Not audited or certified by any third party."
3. Platform-side access (`platform_admin`) is itself receipted — every
   Cognitia-operator read of a tenant ledger emits a `crm_updated`-class
   audit record per Module 1's audit-log requirement.

---

## 11. Retention and export

1. **Retention is tenant policy:** `TenantSettings.retention.receiptRetentionMonths`
   (core.ts). Proposed default for tenant-zero: **84 months** (7 years),
   deliberately longer than `customerDataMonths` — receipts must outlive the
   conversations they attest to. NEEDS_EXTERNAL_RESEARCH: exact record-keeping
   durations advisable under PIPEDA / BC PIPA and BC Motor Dealer Act
   record rules are not established by our research files; the 84-month
   default is a placeholder pending counsel.
   SKIPPED_WITH_REASON: setting a legally-grounded retention schedule
   requires legal counsel; not decided here.
2. **Right-to-delete interaction.** Receipts contain no raw PII by
   construction (Section 5), so deleting/anonymizing a customer
   (`Customer.privacy`) does not require editing receipts — the chain
   survives deletion intact. `data_refs` pointing at purged evidence resolve
   to tombstones ("evidence purged per retention policy at <date>"), which is
   itself a receipted act. The residual linkability of the deterministic
   `cust_` hash (same customer → same ref) is a known trade-off: it is what
   makes per-customer audit trails possible; whether it requires a per-tenant
   salt is flagged for the same legal review.
3. **Expiry ≠ silent deletion.** When retention lapses, receipts are exported
   to tenant-controlled cold storage and the ledger records a
   retention-export receipt; the chain head continues.
4. **Export format:** JSONL, one canonical-JSON receipt per line, in chain
   order, accompanied by a manifest (tenant, range, count, final link hash,
   `verifyChain()` result at export time). Anyone holding the export can
   re-run verification with ~30 lines of code and no DealerOS software.
   Surfaces: ledger-browser download (owner/auditor) and the Module 10 proof
   endpoints. SKIPPED_WITH_REASON: signed/notarized exports and customer-side
   verification portals need key infrastructure in the dedicated repo.

---

## 12. What Cognitia central adds later (beyond the in-process emitter)

The scaffold is an in-process, in-memory emitter (`InMemoryProofEmitter`) —
correct semantics, no durability. The intended evolution, in order:

1. Durable per-tenant append-only store behind the same `ProofEmitter`
   interface (emit / verifyChain / getLedger unchanged).
2. External chain-head anchoring (Section 4.3 limit #1): periodic checkpoint
   of the latest link hash to a store outside the writer's control, plus
   scheduled re-verification and alerting.
3. Receipt signing and verifiable exports (key custody, rotation).
4. Cross-product ledger reads: Demandara consuming DealerOS receipts for
   attribution reports without duplicating them.
5. Central dispute/approval consoles and reputation aggregation over
   agent passports (Module 15 consumers).

SKIPPED_WITH_REASON: the Cognitia central ledger service (durable store,
anchoring, signing, cross-product APIs, its own tenancy and SLAs) needs
dedicated infrastructure and the dedicated code repo
(recommended: `cognitiacloud/dealeros` per CONTEXT_PACK Section 9); only the
in-process emitter contract is specified in this Library repo.

---

## 13. Acceptance criteria (V1, mock mode)

1. All 22 `ProofEventType` values emit through the reference flows; every
   emitting flow's domain record links back via its `receiptId` field(s).
2. `verifyChain()` returns `valid: true` on an untampered ledger; mutating
   any single stored field or removing/reordering any receipt yields
   `valid: false` with the correct `failedAtIndex` and reason.
3. Emitter rejects: raw customer refs (not `cust_`-prefixed); external side
   effects on `deny`; agent-caused external side effects without
   `human_approver_id`.
4. Every `claim_safe_summary` is template-generated; a lint test proves no
   template contains banned vocabulary (Section 5.3) and no receipt contains
   a name, phone number, or email address.
5. Every `followup_sent` / `review_requested` receipt in test fixtures can be
   traced through `data_refs` to a matching approval pair with identical
   `action_requested`.
6. Zero receipts exist with `external_side_effect: true` and
   `consent_basis: 'none'` on a communications event.
7. Export produces chain-ordered JSONL whose manifest verification passes on
   re-import with an independent verifier script.

---

## Boundaries honored

- INTERNAL — DESIGN ONLY. Nothing here is production ready, and no public
  claims are authorized from this document or from any receipt content.
- No secrets, no real API keys, no live CRM/DMS writes, no production deploy
  or migrations. The emitter is a mock-mode, in-process reference scaffold;
  every connector referenced defaults to mock, and live mode is always gated
  by human approval plus a proof receipt.
- No real customer PII: receipts carry only one-way redacted customer refs;
  all fixture data is fake/reserved/local-only. No dealership or customer
  outreach is performed or implied.
- No fake proof: receipts describe recorded system activity only; the spec
  explicitly documents what the hash chain does NOT prove, and the monthly
  report carries a no-guarantee footer.
- No crypto/token/blockchain language or implementation: the ledger is a
  single-writer, per-tenant, hash-chained append-only log — tamper-evident,
  not a blockchain. The agent-economy linkage stays internal-only with no
  monetary concepts.
- No unsupported compliance claims: CASL/PIPEDA/PIPA handling is designed-for,
  not certified; retention defaults are placeholders pending legal counsel
  (marked SKIPPED_WITH_REASON / NEEDS_EXTERNAL_RESEARCH above).
- Blocked items are marked inline: receipt signing, legally-grounded
  retention schedule, notarized exports, and the Cognitia central ledger
  service all carry SKIPPED_WITH_REASON markers rather than invented designs.
