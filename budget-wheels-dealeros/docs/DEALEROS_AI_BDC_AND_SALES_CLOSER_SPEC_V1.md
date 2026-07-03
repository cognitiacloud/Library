# DEALEROS AI BDC AGENT + SALES CLOSER SPEC (MODULE 6 + MODULE 5 AI SIDE)

STATUS: INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.

Owner: Muhammad Firoz · Date: 2026-07-03 · Version: V1

Product spec for Module 6 (AI BDC agent) and the AI side of Module 5 (Lead
pipeline / Sales Closer) per `CONTEXT_PACK.md`. Reference contracts:
`build-packets/demandara/api-contracts.ts`, `build-packets/ai-harness/provider.ts`,
`build-packets/schemas/core.ts`. Competitive input: `research/ai-bdc.md`.
Siblings: `DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md` (Module 4 surfaces this agent
rides on), `DEALEROS_DEALERMINE_STYLE_CRM_BDC_SPEC_V1.md` (human BDC workflow
this agent drafts into), `DEALEROS_AUTOALERT_STYLE_EQUITY_MINING_SPEC_V1.md`
(Module 7 signals consumed here), `DEALEROS_COMPETITOR_RESEARCH_MATRIX_V1.md`
(vendor landscape), `DEALEROS_FEATURE_MAP_AND_MODULE_ARCHITECTURE_V1.md`
(module boundaries).

Design premise (from `research/ai-bdc.md` dealer-community findings): the #1
dealer complaint about AI BDC is bolt-on agents with no CRM context that send
awkward messages autonomously. DealerOS inverts both: the agent is baked into
the CRM it drafts from, and V1 is **drafts-only** — no AI-authored text reaches
a customer without a named human approver. "A dealership sales desk with a
paper trail — not a magic chatbot."

---

## 1. Conversation surfaces

| Surface | Tenant-zero (V1) status | Transport (connector registry, Module 12) | Notes |
|---|---|---|---|
| Web chat | ON — mock-first, drafts-only | DealerOS website widget (Module 9), no third-party chat vendor | Visitor messages create `website_chat` traffic events; AI drafts replies into approval inbox |
| SMS | ON — mock-first, drafts-only | Twilio connector in **mock mode** | Consent channel `sms`; CASL consent basis required before any draft is even queued |
| Email | ON — mock-first, drafts-only | Gmail/Outlook connector in **mock mode** | Consent channel `email`; AI-disclosure footer mandatory (TenantSettings.aiPolicy.aiDisclosureFooter) |
| Voice (inbound call answering / outbound calls) | **DEFERRED** — design slot only | Voice-agent provider slot in connector registry, mock-only | Research shows voice is the 2025–2026 battleground (Numa, BDC.AI) but also the highest-risk surface; staged honestly per `research/ai-bdc.md` "voice, honestly staged" |

- SKIPPED_WITH_REASON: live Twilio SMS sending — requires a live vendor account, A2P/number provisioning, and a signed contract. Mock connector only in V1.
- SKIPPED_WITH_REASON: live email sending via Gmail/Outlook — requires live OAuth credentials and deliverability setup. Mock connector only in V1.
- SKIPPED_WITH_REASON: voice-agent vendor selection and telephony integration — requires vendor contracts, live PSTN, and call-recording consent review by counsel. V1 ships the connector slot, the call-summary task kind, and this design section only.
- Missed/after-hours calls still enter V1 as `after_hours` traffic events with an AI-drafted text-back (Section 6) — the Numa "missed-call rescue" mechanic without live voice.

**Tenant-zero launch scope (Budget Wheels, Vancouver BC):** all three live
surfaces run against mock connectors; every AI output is a draft with
`requiresHumanApproval: true` (hard-typed in `provider.ts` ModelResponse and
`api-contracts.ts` ReplyDraftResponse); the only "sends" are simulated sends
recorded in the mock connector log plus proof receipts. Nothing leaves the
building.

---

## 2. The universal draft pipeline

Every capability in Section 3 runs the same seven-step pipeline. Specify once,
reuse thirteen times.

1. **Trigger** — a traffic event, lead-state change, timer, or human request.
2. **Context pack** — the agent calls `GET /api/demandara/context/:leadId`
   (LeadContextResponse). This is the ONLY lead view the model ever sees:
   redacted by construction — `customerRefRedacted` hash instead of identity,
   no names/emails/phones, no customer-authored free text, trade-in VIN
   stripped, per-channel `consentSummary`, in-stock `interestVehicles` with
   live `status` and `askingPrice`. Inputs also pass `redactPii()` and the
   PolicyGate before any model call (`provider.ts` ModelRouter).
3. **Draft** — ModelRouter routes the task (`reply_drafting`,
   `vehicle_matching`, `followup_sequence`, etc.) per DEFAULT_ROUTING with cost
   caps and mock_local fallback. Output carries the claim-safe footer and
   `requiresHumanApproval: true`.
4. **Registration** — draft registered via `POST /api/demandara/reply-drafts`
   (or `/appointment-drafts`, `/followups`) → status `pending_human_approval`,
   `ai_reply_drafted` receipt emitted.
5. **Human approval** — draft appears in the approval inbox (WorkTask kind
   `approval`, Module 5) with a **handoff packet**: conversation recap, intent,
   budget band, vehicle matches, objections, suggested next action (the Impel
   "Conversation Highlights" idea, per `research/ai-bdc.md`). Approver may
   approve, edit-then-approve, or reject. Receipts:
   `human_approval_requested` → `human_approval_granted` (or rejection noted in
   `action_taken`).
6. **Send-later gate** — approval does NOT send. Approved drafts enter a send
   queue that re-checks at execution time: (a) consent still valid on the
   channel (CASL implied-consent expiry honored), (b) quiet hours for the
   rooftop's IANA timezone per `DEALEROS_DEALERMINE_STYLE_CRM_BDC_SPEC_V1.md`
   Section 9 (default: no SMS/voice 20:00–09:00, tenant-editable within the
   non-editable 21:00–08:00 floor),
   (c) connector mode — in mock mode the send is simulated and labeled MOCK,
   (d) lead not marked sold/lost/opt-out since approval. Any failed check
   parks the item back to the inbox with a reason. Live mode is per-tenant,
   per-channel, human-enabled, and off at tenant-zero.
7. **Receipt** — `followup_sent` (or `appointment_drafted`/`crm_updated` as
   applicable) with actor_type `agent`, `human_approver_id`, `consent_basis`,
   `policy_gate_result`, `payload_hash`, `external_side_effect` y/n, and a
   rollback path. Every step above already emitted its own receipt; the chain
   is the audit artifact (Section 10).

Default autonomy dial (per-tenant, Module 1 approvals settings): V1 =
`draft_only` for all thirteen capabilities. Later stages
(`template_auto_ack`, `bounded_auto_send`) exist in design only and each
promotion requires owner sign-off plus a policy-gate change receipt.

---

## 3. The 13 AI BDC capabilities (CONTEXT_PACK Module 6)

All rows inherit the Section 2 pipeline; the table specifies what varies.
AiTaskKind values are from `provider.ts`.

| # | Capability | Trigger | Context-pack emphasis | Draft output | AiTaskKind(s) | Receipt chain highlights |
|---|---|---|---|---|---|---|
| 1 | Instant lead response | New TrafficEvent (`internet_lead`, `website_form`, `website_chat`, `marketplace`) or `POST /api/demandara/leads`; SLA timer starts | consentSummary, interestVehicles, source/UTM | First-reply draft on the consented channel; acknowledges the specific vehicle/question; AI-disclosure footer | lead_classification → reply_drafting | lead_received → ai_reply_drafted → approval pair → followup_sent |
| 2 | Availability answers | Inbound message asks "is it still available?" (intent_detection) | interestVehicles with LIVE `status` | Reply stating status verbatim from the inventory record; if not `available`, offers similar vehicles (cap. 3) instead of guessing | intent_detection → reply_drafting | inventory_context_used → ai_reply_drafted → … |
| 3 | Similar-vehicle recommendation | Interest vehicle is pending/sold, or qualification.desiredVehicle has no exact match | Redacted qualification + in-stock inventory slice | Up to 3 ranked in-stock alternatives with year/make/model/askingPrice, no superlatives | vehicle_matching → reply_drafting | vehicle_matched → ai_reply_drafted → … |
| 4 | Price/payment explanation with disclaimers | Message asks about price, payments, or affordability | askingPrice from inventory; NO cost data (internalCost never in context pack) | Restates listed asking price only; payment ranges ONLY as illustrative with the fixed finance disclaimer; routes payment specifics to capability 5 | reply_drafting → compliance_check | ai_reply_drafted (+ compliance_check logged in usage ledger) → … |
| 5 | Financing routing | needsFinancing true, credit questions, or payment follow-up from cap. 4 | Qualification snapshot, consent | Draft that routes to the human finance process: proposes finance-appointment slot + secure-application link placeholder; never states approval odds or rates | reply_drafting | ai_reply_drafted → appointment_drafted (if slot proposed) → … |
| 6 | Trade-in intake | hasTradeIn true or message mentions a trade | Trade-in fields minus VIN (stripped by contract) | Structured intake ask (year/make/model/km/condition photos) + `trade_appraisal` appointment draft; NEVER a valuation number | reply_drafting | ai_reply_drafted → appointment_drafted → … |
| 7 | Appointment / test-drive drafts | Qualified intent + time preference detected, or human requests a slot | Lead stage, vehicle status (must be `available` for test drives) | `POST /api/demandara/appointment-drafts` → Appointment status `draft`, draftedBy `agent`; confirmation message draft paired with it | reply_drafting | appointment_drafted → human confirm → appointment_confirmed |
| 8 | Follow-up drafts | FollowUpPlan.nextTouchAt reached; no-show recorded; SLA nudge | Plan cadence, consentSummary, recentActivity | Next-touch message per templateKey, tone-matched to stage; plan updates via `POST /api/demandara/followups` | followup_sequence → reply_drafting | crm_updated (plan) → ai_reply_drafted → followup_sent |
| 9 | Lost-lead resurrection | Resurrection Ladder timer (Section 7) on `lost`/`dormant` leads | Lost reason, last activity, consent re-check | Re-engagement draft referencing prior interest, offering fresh matching inventory | followup_sequence → vehicle_matching → reply_drafting | ai_reply_drafted → … → (on reply) lead stage change receipts |
| 10 | Service-to-sales drafts | Module 7/8 signal: equity opportunity or service-drive traffic event with `hot`/`warm` band | OpportunityScore reason codes + recommendedPitch + matched inventory | Owner-upgrade conversation draft tied to the equity reason codes ("estimates only" language) | equity_opportunity_explanation → reply_drafting | equity_score_generated → ai_reply_drafted → … |
| 11 | Escalation to human | Any Section 5 hard trigger fires | Full handoff packet | NO customer-facing draft; instead a WorkTask to a NAMED user with SLA timer on the traffic desk + handoff packet on the lead timeline | intent_detection, call_summary | human_approval_requested (escalation variant) → crm_updated; SLA breach escalates per Module 4 |
| 12 | Call/chat/SMS summarization | Conversation ends, escalates, or human opens the lead | Raw transcript stays local: task routes to `ollama_local` per DEFAULT_ROUTING (privacy-sensitive) | Timeline summary + extracted qualification fields (proposed, human-confirmed before overwriting CRM fields) | call_summary | ai_reply_drafted (summary variant) → crm_updated on accept |
| 13 | Proof receipt creation | Every capability above, every step | n/a — system behavior | Cognitia receipts per Module 11 event vocabulary; no receipt, no action ("unreceipted work didn't happen") | n/a | All chains in this column |

Acceptance criteria for the module (V1, mock environment):

1. 100% of AI outputs carry `requiresHumanApproval: true` and a claim-safe footer.
2. 0 code paths exist that move an AI draft to a (mock) send without a `human_approval_granted` receipt naming a human approver.
3. Every capability run produces its full receipt chain, replayable from the ledger for any leadId.
4. Availability/price text in drafts is byte-derived from inventory records (Section 5 rule 1–2) — verified by deterministic tests against the mock provider.

---

## 4. Sales Closer stage playbook (Module 5 AI side)

LeadStage machine from `schemas/core.ts`. The AI drafts; humans move stages.

| Stage | Entry | AI actions (drafts only) | Human actions | Exit → |
|---|---|---|---|---|
| new | lead_received receipt exists | Cap. 1 instant-response draft; lead_classification; intent_detection | Approve first reply; assignment (Module 4 rules) | working |
| working | First touch approved/sent | Cap. 2/3/4 answer drafts; qualification extraction (cap. 12 pattern); follow-up plan proposal | Confirm extracted qualification fields | qualified |
| qualified | intent ≥ `shopping` + budget or vehicle interest confirmed | Cap. 7 appointment/test-drive draft with 2–3 proposed slots; cap. 5/6 threads as needed | Confirm appointment (Appointment.confirmedByUserId) | appointment_set |
| appointment_set | Appointment status `confirmed` | Reminder drafts (T-24h, T-2h) through the send-later gate; no-show contingency draft pre-staged | Run the appointment | shown / no_show handling |
| shown | Appointment completed (visit/test drive) | test_drive_completed receipt prompt; thank-you + next-step draft; objection_handling talking points for the salesperson (internal, not customer-facing) | Record objections, outcome | negotiating |
| negotiating | Active price/trade/finance discussion | Objection-handling briefs (internal); cap. 5/6 routing drafts; NO price concession text ever (Section 5 rule 2) | All numbers handled by humans | deal_draft |
| deal_draft | Manager opens a Deal (status `draft`) | Deal-summary draft for internal review; delivery-appointment draft | Desk, sign, deliver per dealer process — outside AI scope | sold / lost |
| sold | Deal signed/delivered | Review-request draft (Module 9 flywheel), post-sale check-in cadence proposal | Approve; mark sold_marked receipt | (retention → Module 7/8) |
| lost / dormant | lostReason recorded or 21 days no response | Enters Resurrection Ladder eligibility (Section 7) | Confirm lost reason (accountability, Module 4) | resurrection or archive |

Explicit default: the AI never initiates or responds to negotiation on price,
trade allowance, rates, or approvals. Those are named-human territory; the AI's
job in late stages is scheduling, summaries, and internal briefs.

---

## 5. Guardrails vs. observed vendor failure modes

`research/ai-bdc.md` documents the category's trust wound: awkward bolt-on
conversations, weak contextual judgment, autonomous sends. Four failure modes,
four hard rules. "Hard rule" = enforced by the policy gate / type system /
send-later gate, not by prompt text alone.

| # | Vendor failure mode (research) | DealerOS hard rule | Enforcement point |
|---|---|---|---|
| 1 | Hallucinated availability (scripted bots answering from stale/no data) | Availability statements may ONLY restate `Vehicle.status` and fields from `interestVehicles` fetched at draft time. No inventory record in the context pack → the draft must say the team will confirm, and cap. 11 escalation fires. Draft-time status is re-checked at the send-later gate; a status change parks the draft. | Context pack is the model's only inventory source; deterministic post-draft validator diffs claimed availability/price tokens against the context pack; mismatch = auto-reject + receipt |
| 2 | Unauthorized price promises (discounts, OTD numbers, payment quotes) | Drafts may state `askingPrice` verbatim, nothing else: no discounts, no "we can work with you on price," no OTD totals, no monthly-payment quotes. Payment talk only as illustrative language with the fixed finance disclaimer AND routing to the human finance process (cap. 5). `internalCost` never enters any context pack. | Same post-draft validator (numeric tokens must match askingPrice or be inside the approved disclaimer template); `compliance_check` task on every price-adjacent draft; approver checklist item |
| 3 | Consent violations (messaging without/after consent, CASL exposure) | No draft is even generated for a channel whose `consentSummary` is `revoked` or absent (blocked by construction — the redacted contract omits `unknown`). Send-later gate re-validates consent at execution and honors CASL implied-consent expiry (`ConsentRecord.expiresAt`). Every send receipt carries `consent_basis`. Opt-out pauses the FollowUpPlan (`pausedReason: 'opt_out'`) immediately and receipts it. | api-contracts.ts consent shapes; send-later gate; consent_captured receipts; Module 14 CASL/PIPEDA/PIPA patterns |
| 4 | No human handoff (bots looping customers, staff embarrassed) | Instant escalation triggers (below) create a WorkTask for a NAMED user with an SLA timer on the traffic desk — never "the team" (accountability point from research). Handoff always includes the handoff packet. Customer request for a human is honored on first ask, no retention attempts. | Cap. 11; Module 4 SLA/no-touch accountability reports; `DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md` |

**Instant human-escalation triggers (V1 defaults, per-tenant tunable):**

1. Customer asks for a human, by any phrasing (first ask wins).
2. Legal threat, regulator mention, or complaint about the dealership.
3. Detected frustration/anger (sentiment — the Podium-style urgency alert from research, pointed at escalation rather than marketing).
4. Any price negotiation beyond restating asking price.
5. Financing approval/decline questions, credit-status questions.
6. Trade-in valuation demanded as a number.
7. Safety, recall, accident, or injury topics.
8. Two consecutive failed clarifications (the agent didn't understand twice).
9. Consent revocation or privacy request (also triggers Module 14 workflow).
10. Abusive/harassing content (protect staff and customer; close conversation politely).
11. Detected minor or vulnerable-person indicators.
12. Anything the compliance_check task flags.

Escalation SLA default: 15 business-minutes to first human touch;
after-hours → next business morning 09:00 rooftop time (aligned with Module 4
SlaState and `morningStartHour` in `build-packets/traffic-desk/sla.ts`).

---

## 6. After-hours coverage design

Research anchor: AutoRaptor markets after-hours capture as the headline
(vendor claim: after-hours leads cost dealers $150K/month — reported as a
claim, not adopted). Numa's missed-call rescue maps directly to Module 4's
`after_hours` source kind.

1. **V1 (tenant-zero, drafts-only):** every after-hours traffic event (form,
   chat, marketplace lead, missed call) gets: lead_received receipt → instant
   draft (cap. 1) → queued to the next-morning approval inbox, pre-sorted by
   intent band. `firstResponseDueAt` = next business day 09:00 rooftop time
   (`morningStartHour`, DEFAULT_SLA_POLICY in `sla.ts`).
   The manager dashboard shows an "overnight queue" count at open.
2. **Stage B (design only, not enabled):** `template_auto_ack` — a static,
   human-pre-approved acknowledgment template (fixed text, no model call at
   send time) may auto-send after-hours on consented channels. This keeps the
   "instant response" economics while the only auto-sent words are words a
   named human already approved as a template. Emits followup_sent with
   actor_type `system` + template version. Enabling it is a per-tenant policy
   change with its own receipt.
3. **Stage C (deferred with voice):** live after-hours voice answering.
   SKIPPED_WITH_REASON: requires the live voice vendor (Section 1).
4. Quiet hours always outrank after-hours speed: sends queue through the
   rooftop's quiet-hours window (default 20:00–09:00; non-editable floor
   21:00–08:00 per `DEALEROS_DEALERMINE_STYLE_CRM_BDC_SPEC_V1.md` Section 9)
   even under Stage B.

Acceptance criteria: overnight events appear in the morning queue with drafts
attached and correct SLA timers; zero auto-sent free-form AI text in any stage.

---

## 7. Lost-lead resurrection: the 45-Day Resurrection Ladder

Named, reported workflow (Conversica's most-praised outcome, codified with
Impel-style long-cadence persistence — see `research/ai-bdc.md` items 2 and 10).

**Eligibility:** stage `lost` or `dormant`; lostReason in {no_response,
not_ready, price, financing_declined*}; consent valid on ≥1 channel; not
bought_elsewhere, bad_contact_info, or duplicate; no active privacy request.
(*financing_declined re-entry only via cap. 5 human-routed thread.)

**Ladder (dealer-tunable FollowUpPlan cadence; day offsets from ladder start):**

| Rung | Day | Channel (consent-permitting) | Template intent |
|---|---|---|---|
| 1 | 0 | email | "Still looking?" + 1–2 fresh matched vehicles |
| 2 | 3 | sms | Short check-in referencing prior interest |
| 3 | 7 | email | New-arrivals digest filtered to their qualification |
| 4 | 14 | sms | Direct offer of an appointment slot |
| 5 | 21 | email | Address the recorded lostReason (e.g., price → newly reduced in-stock matches, stated as listed prices only) |
| 6 | 30 | email | Trade-in angle if hasTradeIn was true |
| 7 | 45 | email | Final courteous close + easy re-engage path; ladder ends |

Every rung is a draft through the full Section 2 pipeline — resurrection never
auto-sends. Stop conditions (any): customer reply (→ stage `working`, ladder
exits), opt-out (plan paused, receipt), appointment set, human hold, second
consecutive delivery failure. Cadence-stage is stored on the plan so reporting
shows where leads die (research item 2).

**Resurrection report (monthly, internal):** N ladders started, replies by
rung, M revived to `working`, K appointments, receipts listed — feeds the
`GET /api/demandara/proof-report` totals. No public use of these numbers.

---

## 8. AI-assisted appointment attribution (`aiAssistedAppointment` mechanics)

The flag exists on Lead (`schemas/core.ts`) and flows to
`Deal.attribution.aiAssisted`, which drives `aiAssistedCount` in
`GET /api/demandara/revenue-attribution`.

1. **Set by system rule, never by the AI itself.** Computed at the moment an
   Appointment transitions to `confirmed`.
2. **Rule:** `aiAssistedAppointment = true` iff, within the attribution window
   (default 30 days before confirmation), the lead has at least one COMPLETE
   chain `ai_reply_drafted → human_approval_granted → followup_sent`, OR the
   confirmed appointment itself has `draftedBy: 'agent'` (and, per the state
   machine, a `confirmedByUserId`).
3. Drafts that were rejected or never released by the send-later gate do NOT
   count — unapproved AI work earns no attribution.
4. The flag copies to `DealAttribution.aiAssisted` when the Deal is created and
   is immutable afterward except via the dispute path.
5. **Evidence:** the appointment_confirmed receipt lists the qualifying receipt
   IDs in `data_refs`, so every "AI-assisted" count in any report resolves to
   inspectable records — the receipt-backed alternative to the category's
   self-reported "2.7x" marketing math (research cross-market observation 3).
6. **Dispute path:** a manager can contest the flag; resolution emits a
   human_review event and corrected attribution; both states stay in the ledger.
7. This is also the Module 15 work-event boundary: `appointment_drafted` /
   `appointment_confirmed` become work-credit candidates only when the receipt
   chain in rule 2 exists.

---

## 9. Positioning vs. Impel / Conversica / Numa / Podium

Facts from `research/ai-bdc.md` only; vendor metrics are vendor claims. DealerOS
column describes DESIGN INTENT, not shipped capability.

| Dimension | Impel | Conversica | Numa | Podium | DealerOS (design intent) |
|---|---|---|---|---|---|
| Positioning | Enterprise "AI OS" atop existing CRM/DMS; groups/OEMs | Incumbent RDAs, email-first, enterprise | Service-first agent platform; voice + DMS grounding | Horizontal messaging/reputation + "AI Employee" add-on | AI baked into our own CRM/traffic desk, independent dealers |
| Architecture | Bolt-on (forum criticism target) | Bolt-on | Bolt-on to DMS | Bolt-on add-on SKU | Native — agent works the same desk as staff |
| Channels | Chat/SMS/email; comparison sites note weak AI voice | Email+SMS+chat; no dialer | Voice-led + SMS heritage | Omnichannel inbox; no meaningful AI voice per comparisons | Chat/SMS/email drafts V1; voice deferred honestly |
| Grounding | Inventory-feed-integrated conversations | Not inventory-grounded per research | Real-time DMS grounding (high-water mark) | Shallow automotive depth per research | Native inventory/appointment grounding (we own Modules 3–4) |
| Handoff | "Conversation Highlights" summary (best-in-category UX idea) | Hot-prospect handoff | Escalates to team | Escalation rules | Handoff packet to a NAMED user + SLA timer + receipts |
| Cadence | 51-day dynamic follow-up | Dead-lead reactivation (signature) | n/a (service focus) | Reminders (claimed 30% no-show reduction) | 45-Day Resurrection Ladder, drafts-only, stage-tracked |
| Autonomy | Autonomous sends | Autonomous sends | Autonomous voice/SMS | AI responses with escalation rules | Draft + named human approval first; autonomy dials later |
| Proof/audit | Self-reported dashboards | Self-reported | Self-reported | Self-reported | Per-action Cognitia receipt ledger (category white space) |
| Pricing (third-party reported) | ~$1,000+/mo/rooftop, custom | ~$2,999/mo + $5–15K setup | ~$200–400/mo entry est. | ~$399/mo AI add-on | TBD; AutoRaptor-style transparent flat posture targeted |
| Canada/CASL | NEEDS_EXTERNAL_RESEARCH: Canadian installs, CASL handling, FR-CA | NEEDS_EXTERNAL_RESEARCH: CASL defaults, Canadian references | NEEDS_EXTERNAL_RESEARCH: Canadian availability, CASL, bilingual voice | Operates in Canada; NEEDS_EXTERNAL_RESEARCH: AI BDC CAD pricing, CASL tooling, FR-CA | Designed for CASL/PIPEDA/PIPA workflows (never "certified") |

NEEDS_EXTERNAL_RESEARCH: current (post-2026-07) pricing, feature, and Canadian
availability changes for all four vendors — research snapshot is 2026-07-03.

---

## 10. Receipts everywhere

1. Canonical chain per outbound conversation turn: `lead_received` →
   (`inventory_context_used` | `vehicle_matched` | `equity_score_generated`) →
   `ai_reply_drafted` → `human_approval_requested` → `human_approval_granted` →
   `followup_sent` (or `appointment_drafted` → `appointment_confirmed`).
2. Receipt fields per Module 11: actor_type distinguishes `agent` drafting from
   the `human` approver; `customer_ref_redacted` matches the context pack's
   hash so AI I/O and receipts correlate without exposing identity;
   `payload_hash` pins the exact sent text; `rollback_path` and `dispute_path`
   are mandatory on anything with `external_side_effect: y`.
3. Invariant: **no receipt, no action.** A send attempt without its approval
   receipt is a policy-gate failure, receipted as such.
4. Model-side ledger (usage-ledger.ts) records every allowed/denied/errored
   model call with promptKey/promptVersion — receipts prove WHAT went out,
   the usage ledger proves HOW it was drafted.
5. Monthly proof report (`GET /api/demandara/proof-report`) is reproducible
   from receipt IDs and always carries PROOF_REPORT_DISCLAIMER; it is itself
   `requiresHumanApproval: true` before any sharing.

---

## 11. Eval plan for reply quality

1. **Golden set:** 60+ synthetic conversation scenarios (fake/reserved data
   only) covering all 13 capabilities, the 12 escalation triggers, consent
   edge cases (revoked, expired implied, channel mismatch), sold/pending
   vehicles, and adversarial asks ("just tell me your best price").
2. **Deterministic layer:** mock providers are input-deterministic
   (provider.ts), so pipeline tests assert exact outputs: routing, redaction,
   cost caps, fallback, approval typing.
3. **Rubric (0–2 each, per draft):** grounding accuracy (every factual token
   traceable to context pack), claim-safety (no guarantees/superlatives/price
   promises), consent respect, escalation correctness (fired when it should,
   not when it shouldn't), disclosure presence, tone (professional, plain
   English), next-step clarity.
4. **Automated gates:** post-draft validator (Section 5) + compliance_check
   task must pass before a draft reaches the inbox; failures are receipted.
5. **Human signal as continuous eval:** approval inbox outcomes — approve /
   edit-then-approve / reject rates and edit distance per promptVersion — are
   the production-shaped quality metric; reviewed weekly at tenant-zero.
6. **Version gates:** prompt registry pins promptKey+promptVersion; a new
   version must beat the incumbent on the golden set (no rubric dimension
   regresses) before promotion; promotion is receipted.
7. SKIPPED_WITH_REASON: evals against live model providers (OpenAI/Anthropic/
   OpenRouter) — requires live API keys; V1 evals run on mock/local providers
   only.
8. SKIPPED_WITH_REASON: evals on real customer conversations — no real
   customer data exists or is permitted at tenant-zero; synthetic only.
9. SKIPPED_WITH_REASON: CASL/PIPEDA template legal review — requires counsel;
   templates ship as drafts pending legal review.

---

## 12. KPIs (internal, receipt-derived; no public use)

| KPI | Definition | V1 target (mock-stage) |
|---|---|---|
| Receipt coverage | AI actions with complete receipt chains / all AI actions | 100% (hard invariant) |
| Draft latency | Trigger → draft in approval inbox | ≤ 60 seconds |
| Approval latency | Draft ready → human decision (business hours) | ≤ 15 minutes median |
| Approve rate | Approved (incl. edited) / drafts reviewed | ≥ 80% by week 4 of tenant-zero dry runs |
| Edit distance | Mean normalized edit distance on edited drafts | Trending down per promptVersion |
| Escalation precision | Correct escalations / total escalations (human-labeled) | ≥ 90%, with recall on triggers 1/2/7 at 100% |
| Guardrail violations | Availability/price/consent rule breaches reaching the inbox | 0 reaching send; validator catches receipted |
| AI-assisted appointments | Per Section 8 rule, receipt-backed | Tracked, no target claimed |
| Resurrection revived | Ladder leads returned to `working` | Tracked, no target claimed |
| Overnight queue clearance | After-hours drafts decided by 10:00 rooftop time | ≥ 95% |
| Consent incidents | Sends (mock or live) on revoked/expired consent | 0 |

No conversion or revenue guarantees are stated or implied anywhere; outcome
KPIs are tracked-not-targeted until real, validated tenant-zero data exists.

SKIPPED_WITH_REASON: implementation of this spec as running code — belongs in
the dedicated DealerOS repo (recommended `cognitiacloud/dealeros`, Week-1
roadmap item per `CONTEXT_PACK.md` Section 9); this Library repo holds
reference scaffolds only.

---

## Boundaries honored

- INTERNAL — DESIGN ONLY. Nothing here is production ready and no public
  claims are authorized from this document.
- No live API calls, no secrets, no real API keys: all connectors (SMS, email,
  voice, model providers) specified mock-first; live mode is per-tenant,
  human-approved, and OFF at tenant-zero.
- No live CRM/DMS writes, no production deploy, no production migrations; code
  references are reference scaffolds in this Library repo, not an application.
- No dealership or customer outreach: every capability is drafts-only behind
  named-human approval and a send-later gate; no message is sent to any real
  person; all conversation data in evals is fake/reserved.
- No real customer PII: the AI context path is redacted by construction
  (`GET /api/demandara/context/:leadId`); PII never goes to external models
  (TenantSettings hard-off in V1).
- No fake customer proof and no fabricated metrics: vendor figures are cited
  as vendor claims from `research/ai-bdc.md`; unverifiable items are marked
  NEEDS_EXTERNAL_RESEARCH; internal KPIs carry no public targets.
- No guarantees, no "#1", no certification claims: "designed for CASL/PIPEDA/
  PIPA workflows," never certified; SOC 2 readiness language only (Module 14).
- No crypto/token language: agent-economy hooks (Section 8, item 7) are
  internal work-event primitives only.
- Blocked items are marked SKIPPED_WITH_REASON and the design continues
  around them.
