# DealerOS Agent Economy Compatibility Skeleton (Module 15)

STATUS: INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.

Owner: Muhammad Firoz · Date: 2026-07-03 · Version: V1

Reference scaffold: `build-packets/cognitia/agent-economy.ts` (plain TypeScript, dependency-free, mock-only).
Sibling docs: `DEALEROS_COGNITIA_PROOF_ADAPTER_V1.md` (receipt event types and receipt fields this skeleton consumes), `DEALEROS_AI_BDC_AND_SALES_CLOSER_SPEC_V1.md` (the agent workflows that emit most work events), `DEALEROS_AUTOALERT_STYLE_EQUITY_MINING_SPEC_V1.md` (equity work events), `DEALEROS_AI_MODEL_HARNESS_AND_CONNECTOR_REGISTRY_V1.md` (prompt/version registry and model-provider refs used by passports), `DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md` (tenant scoping and RBAC these records inherit).

---

## 1. Purpose — and what this module is explicitly NOT

Module 15 exists to make agent work **legible and auditable now**, so that reputation and internal work-credit layers **can** exist later without re-instrumenting the platform. Every AI agent action in DealerOS is already receipted through the Cognitia proof adapter (`DEALEROS_COGNITIA_PROOF_ADAPTER_V1.md`); this module adds the thin identity-and-accounting layer on top: who (which agent passport) did what (which work event), backed by which evidence, reviewed by which human, disputed by whom, with what outcome.

**PROMINENT EXCLUSIONS — read before anything else. This module contains and authorizes:**

1. **NO token.** No token, coin, points-as-currency, or tokenomics of any kind.
2. **NO crypto.** No blockchain, no on-chain anything, no wallets, no distributed ledger. The "ledger" here is an ordinary append-only tenant-scoped database table.
3. **NO securities language.** Nothing here is an investment, yield, stake, share, or instrument. Work credit candidates confer no rights and have no value.
4. **NO public marketplace.** No agent hiring market, no cross-tenant agent exchange, no public leaderboard, no external visibility of any record defined here.
5. **NO monetary value.** A work credit candidate is only an internal, reviewable claim that a defined unit of work occurred. It is not transferable, not redeemable, not visible outside the tenant.

Any future conversion of these records into any reward system is a separate owner decision requiring separate legal review (Section 7). Until then this module is **dormant by design**: it records, it never rewards.

### Why build it now anyway

| # | Reason | Consequence of skipping |
|---|--------|------------------------|
| 1 | Evidence must be captured at action time; it cannot be reconstructed later | A future reputation layer would start with zero trustworthy history |
| 2 | Anti-gaming rules (Section 6) shape how workflows log evidence today | Workflows would log "drafted" as if it were "done" |
| 3 | Cognitia's reputation ledger (Section 8) needs stable IDs and event kinds | Schema churn across the empire stack later |
| 4 | Manager trust in the AI BDC depends on legible per-agent track records now | "The AI did it" stays unauditable |

---

## 2. The seven primitives

All types live in `build-packets/cognitia/agent-economy.ts`, using the shared `Brand` ID helper from `build-packets/schemas/core.ts`. Four ID types (`WorkCreditCandidateId`, `ReputationEventId`, `DisputeEventId`, `HumanReviewEventId`) are defined locally and are candidates for promotion into `schemas/core.ts` (tracked as SCHEMA_NOTE in the file).

| # | Primitive | Type(s) | One-line role | Key fields |
|---|-----------|---------|---------------|-----------|
| 1 | **AgentPassport** | `AgentPassport` | Identity record every agent must hold before any action can be receipted or counted | `agent_passport_id`, `tenant_id`, `agent_kind` (`bdc` \| `equity` \| `listing` \| `campaign` \| `router`), `display_name`, `model_provider_ref` (connector-registry ref, never a key), `prompt_registry_key`, `status` (`active` \| `suspended` \| `retired`), `created_at` |
| 2 | **Work events** | `WorkEventKind`, `WORK_EVENT_KINDS`, `WORK_EVENT_DEFINITIONS` | The closed vocabulary of 13 countable units of work plus the governance table defining each (Section 3) | 13 string kinds; per-kind `whatCountsAsWork`, `evidenceRequired`, `proofReceiptRequired: true`, `humanApprovalRequired`, `disputePath`, `reputationImpactNote` |
| 3 | **AgentAction** | `AgentAction` | One receipted unit of agent work; every action links to exactly one proof receipt | `agent_action_id`, `agent_passport_id`, `tenant_id`, `work_event`, `receipt_id`, `human_review_state` (`not_required` \| `pending` \| `approved` \| `rejected`), `created_at` |
| 4 | **WorkCreditCandidate** | `WorkCreditCandidate` | Internal-only claim that an action may count as completed work; a CANDIDATE until evidence review | `work_credit_candidate_id`, `tenant_id`, `agent_passport_id`, `agent_action_id`, `work_event`, `receipt_id`, `evidence_refs[]`, `state` (`candidate` \| `validated` \| `rejected` \| `disputed`), `created_at` |
| 5 | **ReputationEvent** | `ReputationEvent` | Standing signal about an agent, always tied back to receipts; internal signal only | `reputation_event_id`, `tenant_id`, `agent_passport_id`, `kind` (`positive` \| `negative` \| `neutral`), `reason`, `related_receipt_id?`, `created_at` |
| 6 | **DisputeEvent** | `DisputeEvent` | A human contesting an agent action / work claim | `dispute_event_id`, `tenant_id`, `agent_action_id`, `opened_by` (UserId), `reason`, `state` (`open` \| `resolved_upheld` \| `resolved_overturned`), `opened_at`, `resolved_at?` |
| 7 | **HumanReviewEvent** | `HumanReviewEvent` | A named human reviewing an agent action that required approval | `human_review_event_id`, `tenant_id`, `agent_action_id`, `reviewer_user_id`, `decision` (`approved` \| `rejected`), `notes?`, `reviewed_at` |

Defaults (explicit):

1. Every record is tenant-scoped (`tenant_id` mandatory) and never crosses tenants — consistent with isolation rules in `DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md`.
2. `proofReceiptRequired` is the literal type `true` for all 13 work events: **no receipt, no work.** This is compile-time enforced in the scaffold.
3. New passports default to `status: 'active'` only after a human creates them; there is no self-registration path for agents.
4. All tables are append-only in design intent; corrections happen via new events (dispute, review, reputation), never edits.

---

## 3. WORK_EVENT_DEFINITIONS — the full governance table (13 work events)

Reproduced from `WORK_EVENT_DEFINITIONS` in `agent-economy.ts`. Proof receipt is required for **all 13** events (column omitted per-row would always read "yes"; shown anyway for decision-readiness). All dispute paths share the URI prefix `cognitia://disputes/new?work_event=<kind>`; the cell text below describes the human procedure that follows.

| Work event | What counts as work | Evidence required | Receipt req. | Human approval | Dispute path (after `cognitia://disputes/new?work_event=<kind>`) | Reputation impact note (later, internal only) |
|---|---|---|---|---|---|---|
| `lead_answered` | A first response to an inbound lead was delivered to the customer within the SLA window, using an approved message. | proof_receipt:lead_received; proof_receipt:followup_sent or human-logged first-contact record; human_review_event:approved for the outbound message; sla_state ref showing firstRespondedAt within firstResponseDueAt | Yes | **Yes** | Manager opens dispute_event; reviewer compares receipt timestamps against the SLA record; resolved_upheld or resolved_overturned. | Validated on-time answers add positive standing; rejected claims (draft never sent, SLA missed) add negative standing. |
| `lead_qualified` | A lead record was enriched to qualified: intent, budget range, desired vehicle, trade-in and financing flags were captured and stored. | proof_receipt:crm_updated for the qualification fields; lead ref with stage=qualified and populated LeadQualification | Yes | No | Salesperson or manager disputes accuracy; reviewer checks stored qualification against the conversation refs. | Qualifications later found fabricated or copied from defaults add negative standing; accurate ones add small positive standing. |
| `vehicle_matched` | In-stock inventory was matched to a stated customer need and the match was recorded on the lead. | proof_receipt:vehicle_matched; lead ref listing interestVehicleIds; inventory ref showing the vehicle was available at match time | Yes | No | Dispute if the match ignored stated constraints (budget, body style); reviewer replays the match inputs. | Matches the customer engages with add positive standing; irrelevant matches add neutral-to-negative standing. |
| `appointment_drafted` | An appointment or test-drive proposal was drafted with a concrete time, vehicle, and rooftop, and routed to a human for confirmation. Drafting alone never contacts the customer. | proof_receipt:appointment_drafted; appointment ref with status=draft and draftedBy=agent | Yes | No | Dispute if drafts are duplicative or unusable; reviewer samples draft quality against the lead context. | Drafts that humans confirm without edits add positive standing; drafts routinely discarded add negative standing. |
| `appointment_confirmed` | The CUSTOMER confirmed a drafted appointment. The draft alone does not count — confirmation evidence from the customer side is mandatory. | proof_receipt:appointment_confirmed; customer confirmation record ref (inbound reply, call log, or signed-in confirmation) — not the outbound draft; human_review_event:approved for the outbound confirmation message; appointment ref with status=confirmed and confirmedByUserId set | Yes | **Yes** | Dispute if no customer-side confirmation exists; reviewer requires the inbound confirmation ref, else overturns. | Confirmed appointments that are honored add strong positive standing; confirmations that no-show at high rates trigger review, and fabricated confirmations add strong negative standing. |
| `followup_completed` | A scheduled follow-up touch was sent to the customer after human approval, on a consented channel, and logged against the follow-up plan. | proof_receipt:followup_sent; human_review_event:approved for the message; consent record ref valid for the channel at send time; follow-up plan ref showing the cadence step | Yes | **Yes** | Dispute if the touch was off-plan, off-consent, or duplicated; reviewer checks the consent and plan refs. | On-plan consented touches add positive standing; any touch on a revoked-consent channel adds strong negative standing and suspends the passport pending review. |
| `equity_opportunity_created` | An equity opportunity score with reason codes, evidence factors, and a matched vehicle was generated for an owned-vehicle customer and queued for human action. | proof_receipt:equity_score_generated; opportunity ref with factors[].evidence populated; model/prompt registry version ref | Yes | No | Dispute if reason codes are unsupported by the customer record; reviewer replays the scoring inputs. | Opportunities that lead to human-validated contact add positive standing; scores contradicted by the underlying data add negative standing. |
| `service_to_sales_opportunity_created` | A service-drive customer was identified as a sales opportunity (e.g. aging vehicle plus declined repair) and a task was created for a human, with the reasoning recorded. | proof_receipt:equity_score_generated or crm_updated for the opportunity; service history ref supporting the trigger; work task ref assigned to a human | Yes | No | Service advisor disputes mischaracterized service records; reviewer checks the cited history. | Opportunities advisors accept add positive standing; noisy or repeated low-quality triggers add negative standing. |
| `listing_generated` | Listing copy (title, description, disclosure-aware content) for a specific vehicle was generated, passed the disclosure check, and was approved by a human before any publication. | proof_receipt:crm_updated or campaign_generated for the listing draft; vehicle ref with disclosures included in the copy inputs; human_review_event:approved before publish | Yes | **Yes** | Dispute if copy omitted required disclosures or misstated the vehicle; reviewer compares copy to the vehicle record. | Approved-as-drafted listings add positive standing; copy with disclosure omissions adds strong negative standing. |
| `campaign_generated` | A campaign draft (segment, channel, claim-safe copy, schedule) was produced and moved to pending_approval. Activation is a separate, human-approved step. | proof_receipt:campaign_generated; campaign ref with status=pending_approval and createdBy recorded; human_review_event:approved before status=active | Yes | **Yes** | Marketing disputes off-brand or non-claim-safe copy; reviewer checks the copy against the claim-safe rules. | Campaigns approved and activated add positive standing; drafts rejected for claim-safety violations add strong negative standing. |
| `sold_attributed` | A sold deal was linked to the agent-assisted touches that contributed to it, and a human manager confirmed the attribution record. | proof_receipt:sold_marked; proof_receipt:campaign_attributed or deal attribution ref with aiAssisted flag; human_review_event:approved by a manager for the attribution; touch-chain refs (receipts for each contributing agent touch) | Yes | **Yes** | Salesperson or manager disputes over-attribution; reviewer walks the receipt chain of touches and may overturn. | Manager-confirmed attributions add strong positive standing; overturned attribution claims add strong negative standing. |
| `review_generated` | A review request was drafted for a delivered customer, approved by a human, and sent on a consented channel. | proof_receipt:review_requested; human_review_event:approved for the request message; consent record ref valid for the channel; deal ref with status delivered | Yes | **Yes** | Dispute if the request went to a non-delivered or opted-out customer; reviewer checks the deal and consent refs. | Requests to eligible, consented customers add positive standing; requests that draw complaints add negative standing. Review CONTENT is never authored by agents. |
| `connector_sync_completed` | A scheduled or requested connector sync ran to completion in its configured mode (mock by default) with record counts and no unreconciled errors. | proof_receipt:connector_sync_completed; sync run ref with record counts and mode (mock/sandbox/live); zero unresolved connector_sync_failed receipts for the same run | Yes | No | Ops disputes silent data loss; reviewer compares source and destination counts from the run ref. | Clean runs add small positive standing; runs later found to have dropped records add negative standing for the routing agent. |

Read of the pattern: the 7 events with `humanApprovalRequired = Yes` are exactly the ones that touch a customer, an external channel, or a revenue claim. The 6 "No" events are internal drafts/derivations that a human still consumes downstream — approval happens at the point of external effect, not at every keystroke.

---

## 4. Lifecycle walkthrough — one lead reply, end to end

Canonical happy path (AI BDC agent per `DEALEROS_AI_BDC_AND_SALES_CLOSER_SPEC_V1.md`, receipts per `DEALEROS_COGNITIA_PROOF_ADAPTER_V1.md`). All data fake/mock; no live sends exist in this design.

1. **Precondition — passport exists.** The tenant's BDC agent holds `AgentPassport{agent_kind:'bdc', status:'active', model_provider_ref:'model_provider:anthropic_mock', prompt_registry_key:'bdc_reply/v3'}`. No passport → nothing below can happen.
2. **Agent drafts a reply** to an inbound lead. The draft is internal; no customer contact occurs.
3. **Action recorded.** An `AgentAction` is created with `work_event:'lead_answered'` and `human_review_state:'pending'` (the table marks this event humanApprovalRequired).
4. **Receipt attached.** The Cognitia adapter emits the proof receipt (e.g. `ai_reply_drafted` → later `followup_sent`); the action's `receipt_id` links to it. One action ↔ one receipt, always.
5. **Human approves.** A salesperson/manager reviews the draft; a `HumanReviewEvent{decision:'approved'}` is written and the action's `human_review_state` becomes `approved`. Only now may the message be sent (in mock mode: simulated send with receipt).
6. **Work credit candidate created.** A `WorkCreditCandidate{state:'candidate'}` is opened with `evidence_refs` pointing at the four items `WORK_EVENT_DEFINITIONS.lead_answered.evidenceRequired` demands (lead_received receipt, sent/first-contact record, approval event, SLA-state ref).
7. **Validation.** An evidence check (automated completeness check + human spot check) either moves the candidate to `validated` or `rejected`. Missing any required evidence ref → cannot validate, period.
8. **Dispute window.** Any user may open a `DisputeEvent` against the action (Section 6). Open dispute → candidate `state:'disputed'` until `resolved_upheld` (back to validated) or `resolved_overturned` (to rejected).
9. **Later: reputation event.** On validation/rejection/overturn, a `ReputationEvent{kind, reason, related_receipt_id}` is appended per the event's reputationImpactNote. This is a standing signal only — it gates nothing monetary and displays only in internal per-tenant admin views.

Acceptance criteria for the lifecycle (mock tests, extending `build-packets/cognitia/cognitia.test.ts` patterns):

| # | Criterion |
|---|-----------|
| 1 | An `AgentAction` cannot be created without an existing `active` passport and a `receipt_id` |
| 2 | For humanApprovalRequired events, a candidate cannot reach `validated` without a matching `HumanReviewEvent{decision:'approved'}` |
| 3 | A candidate with any missing `evidence_refs` (vs. the definition) is rejected by the validator |
| 4 | Opening a dispute flips the candidate to `disputed`; resolution restores `validated` or sets `rejected` deterministically |
| 5 | Every `ReputationEvent` traces to a receipt or a resolved dispute; free-floating reputation writes are rejected |
| 6 | All records fail closed on tenant mismatch (no cross-tenant reads or writes) |

---

## 5. Anti-gaming design

The table in Section 3 is written so that the cheap thing to fake is never the thing that counts.

1. **Outcome evidence, not effort evidence.** `appointment_confirmed` requires a **customer-side** confirmation ref (inbound reply, call log, or signed-in confirmation) — the outbound draft explicitly does not count. `sold_attributed` requires a manager-approved attribution plus the full receipt chain of contributing touches. `lead_answered` requires the SLA-state ref proving timing, not just that a draft existed.
2. **Consent as a hard gate.** `followup_completed` and `review_generated` require a consent record valid for the channel at send time. A touch on a revoked-consent channel is not merely uncredited — it adds strong negative standing and **suspends the passport pending review** (`status:'suspended'`).
3. **Approval before external effect.** All 7 customer/channel/revenue-touching events require a named `HumanReviewEvent`. An agent cannot approve itself; `reviewer_user_id` is a `UserId`, never a passport ID.
4. **Dispute + overturn flow.** Any user can open `cognitia://disputes/new?work_event=<kind>`. Reviewer procedure per event is fixed in the table (e.g. replay match inputs, walk the receipt chain, demand the inbound confirmation ref). `resolved_overturned` rejects the candidate and appends a negative `ReputationEvent`; repeated overturns for one passport trigger suspension review.
5. **Volume-gaming counters.** Draft-spam is self-defeating: `appointment_drafted` and the opportunity events carry reputationImpactNotes where routinely-discarded drafts and noisy triggers add negative standing. Quantity without human uptake trends reputation down, not up.
6. **Traceability to exact prompt version.** Passports carry `prompt_registry_key` (see `DEALEROS_AI_MODEL_HARNESS_AND_CONNECTOR_REGISTRY_V1.md`), so a burst of bad candidates is attributable to a specific prompt version and reviewable as a batch.
7. **Rate/shape anomaly review (design intent).** Default thresholds to tune with real internal data later: >20% dispute-overturn rate over trailing 50 candidates, or a no-show rate on confirmed appointments materially above the rooftop baseline, flags the passport for human review. These are starting defaults, not validated numbers.

---

## 6. Dormant by design — credits carry no value

Restated as policy, not just disclaimer:

1. A `WorkCreditCandidate` — even in `validated` state — is an internal accounting record with **no monetary value**, no transferability, no redeemability, and no visibility outside the tenant.
2. Nothing in Module 15 pays, rewards, ranks publicly, or promises anything to any agent, vendor, or person.
3. There is deliberately **no** `balance`, `wallet`, `payout`, `price`, or `exchange` concept anywhere in the scaffold, and adding one is out of scope for V1 by rule.
4. Conversion of validated credits into **any** reward, incentive, revenue-share, or compensation system is a future owner decision (Muhammad Firoz) and is blocked until completed legal review.

SKIPPED_WITH_REASON: Design of any credit-to-reward conversion mechanism — requires legal counsel (securities, employment/contractor, consumer-protection, and Canadian provincial implications) before even a design draft is appropriate; out of scope for this internal skeleton.

SKIPPED_WITH_REASON: Database migrations, API endpoints, and runtime services for these tables — requires the dedicated DealerOS code repo (recommended `cognitiacloud/dealeros`, Week-1 roadmap item); this Library repo carries reference scaffolds only.

SKIPPED_WITH_REASON: Calibration of anti-gaming thresholds (Section 5, item 7) against real usage — requires real internal operational data, which does not exist yet; all demo data is fake/reserved.

---

## 7. Compatibility with the future Cognitia reputation ledger

Cognitia is the empire's proof/governance layer; its future reputation ledger should be able to consume Module 15 records without translation. Compatibility commitments:

| # | Commitment | Mechanism |
|---|------------|-----------|
| 1 | Stable identity | `AgentPassportId` is the sole agent identity key across DealerOS and Cognitia; receipts already carry `agent_passport_id?` (see `DEALEROS_COGNITIA_PROOF_ADAPTER_V1.md`) |
| 2 | Receipt-anchored everything | Every `AgentAction` and `WorkCreditCandidate` carries a `ReceiptId`; every `ReputationEvent` carries `related_receipt_id` where applicable — Cognitia can verify any claim against its own ledger |
| 3 | Closed event vocabulary | `WorkEventKind` is a closed 13-value union mirrored from CONTEXT_PACK Module 15; additions are versioned schema changes, not free strings |
| 4 | Dispute-first semantics | `DisputeEvent` states (`open`/`resolved_upheld`/`resolved_overturned`) match the `dispute_path` field on Cognitia receipts, so one dispute surface serves both layers |
| 5 | ID promotion path | The four locally-defined ID brands are flagged in-file for promotion to `schemas/core.ts`, keeping one shared ID namespace |
| 6 | Tenant containment | Reputation remains per-tenant; any future cross-tenant aggregate is a Cognitia-side owner decision with its own privacy review, not a DealerOS default |

NEEDS_EXTERNAL_RESEARCH: Whether any external agent-identity or agent-audit interoperability convention worth aligning passport fields with exists and is stable — no vendor/standard facts are asserted here because none appear in the project research files.

Design rule going forward: DealerOS **emits** work/evidence records; Cognitia **judges** them. Module 15 never computes a reputation score itself — it appends events that a future Cognitia scorer can fold, so scoring logic can change without rewriting history.

---

## 8. Decision summary (defaults locked for V1)

1. Ship Module 15 as types + governance table + mock tests only; no service, no UI beyond internal admin read views (design-level).
2. All 13 work events require proof receipts; 7 require human approval as tabled in Section 3 — no exceptions, no config to disable.
3. Candidates validate only on complete evidence refs; disputes can overturn any validation.
4. Reputation events are append-only internal signals; no scores, no public display, no rewards.
5. Everything monetary/reward-shaped is deferred behind owner decision + legal review (Section 6).

## Boundaries honored

- **No crypto/token implementation, no securities language, no public marketplace** — Section 1 exclusions govern this entire module; work credit candidates have no monetary value and are internal-only (Section 6).
- **No production deploy, no production migrations, no "production ready" language** — this is a design/spec document over a reference scaffold; runtime work is SKIPPED_WITH_REASON pending the dedicated repo.
- **No live CRM/DMS writes, no dealership/customer outreach** — all lifecycle steps involving sends are described in mock mode; live mode remains gated by human approval + proof receipt per CONTEXT_PACK Section 4.
- **No real customer data, no fake customer proof, no public claims** — all examples use fake/reserved data; threshold calibration on real data is explicitly skipped.
- **No secrets** — passports reference model providers via connector-registry refs (`model_provider_ref`), never keys.
- **Mock mode default** — `connector_sync_completed` evidence explicitly records mode with mock as default.
- Blocked or unverifiable items are marked `SKIPPED_WITH_REASON:` / `NEEDS_EXTERNAL_RESEARCH:` inline rather than invented.
