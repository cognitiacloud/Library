# BUDGET_WHEELS_DEALEROS_EXECUTIVE_STRATEGY_V1

STATUS: INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.

Owner: Muhammad Firoz · Date: 2026-07-03 · Version: V1

This is the flagship strategy document for Budget Wheels DealerOS. It synthesizes
`CONTEXT_PACK.md`, the research corpus (`research/tms-canada.md`,
`research/dealermine.md`, `research/autoalert.md`, `research/ai-bdc.md`,
`research/canada-compliance.md`), and the reference scaffolds
(`build-packets/README.md`). Sibling docs referenced:
`DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md`,
`DEALEROS_MUHAMMAD_DECISION_BOARD_V1.md`, `DEALEROS_DELIVERY_MEMO_V1.md`,
`BUDGET_WHEELS_WHAT_WE_BUILT_SO_FAR_V1.md`.

---

## 1. Product thesis and the metaphor

**Thesis (internal):** Budget Wheels DealerOS is an AI-native, proof-backed
dealership CRM and traffic operating system — one platform that replaces the
independent dealer's fragmented stack (traffic log + CRM + equity mining +
AI BDC + website vendor) and makes every AI and human action auditable.

**The metaphor: "A dealership sales desk with a paper trail — not a magic chatbot."**

This metaphor is the product strategy compressed into one sentence:

1. **"A dealership sales desk"** — the atomic unit is the traffic event (phone-up,
   internet lead, walk-in), not the chat message. The system runs the desk the way
   a disciplined GM runs it: every up logged, assigned, timed, followed up, and
   closed out with a sold/lost reason (Module 4).
2. **"With a paper trail"** — every significant action, human or AI, emits a
   Cognitia proof receipt: who acted, what they did, under what consent basis,
   with what approval, hash-chained and disputable (Module 11). The paper desk
   log dealers already trust becomes tamper-evident evidence instead of an
   editable binder.
3. **"Not a magic chatbot"** — the AI drafts; humans approve. `research/ai-bdc.md`
   documents the category's open wound: dealers are openly hostile to bolt-on AI
   that talks to customers unsupervised ("AI BDC is not ready unless it's baked
   into the CRM"). DealerOS inverts the failure: AI baked into the same desk the
   humans work, approval-first by default, every escalation a structured handoff
   packet with a receipt pair. The category's weakness becomes our safety story.

Why AI-native matters here: the root failure of the traffic-desk category is
manual entry (salespeople don't log ups — `research/tms-canada.md` cites vendor
gap figures of 15–40% unlogged traffic). DealerOS makes the AI do the logging —
auto-creating traffic events from inbound calls, web leads, and check-ins — so
the human confirms instead of types.

## 2. Market gap — what the research shows

Synthesis of the five research files. Four gaps compound into one opening.

### 2.1 The fragmented 3–4 subscription stack

Today a well-run store buys the desk in pieces:

| Job | Incumbent slice | Evidence (research file) |
|---|---|---|
| Showroom traffic log | TMS (tmscan.com) | `research/tms-canada.md` — web-based showroom log + field-rep interpretation |
| Phone-up accountability | Car Wars / CallRevu | `research/tms-canada.md` — CRISP scoring, missed-opportunity alerts |
| Lot/door ground truth | TraxSales / Lot Watch | `research/tms-canada.md` — camera counts, WiFi sniffing |
| CRM + follow-up | VinSolutions / DealerSocket / DealerMine | `research/dealermine.md` |
| Equity mining | AutoAlert AlertMiner (quote-only, franchise price points) | `research/autoalert.md` |
| AI BDC | Impel / Conversica / Numa / Podium (bolt-ons) | `research/ai-bdc.md` |
| Website / demand gen | separate vendor entirely | all files — attribution dies at every seam |

Every seam loses attribution; every subscription is priced and demo-gated for
franchise stores. DealerOS Module 4 + 5 + 6 + 7 + 9 is that whole table in one
tenant-scoped platform with one record set.

### 2.2 Franchise-first incumbents underserve Canadian independents

- TMS's center of gravity is OEM programs and the Quorum/Autovance/XSELLERATOR
  franchise stack (`research/tms-canada.md`).
- DealerMine's engine runs on franchise DMS repair-order data, GM Canada data
  share, and an AutoCanada anchor; its managed BDC "doesn't scale down
  gracefully to a 30-car independent lot" (`research/dealermine.md`).
- AutoAlert/Mastermind assume lease books, OEM incentives, and franchise DMS
  feeds; the model degrades for independents with thin lease books
  (`research/autoalert.md`).
- Enterprise AI BDC pricing (reported ~$1,000–3,000+/mo) locks independents out;
  the accessible tier (AutoRaptor, DealersCloud) is shallow — no equity mining,
  no demand gen, no proof layer (`research/ai-bdc.md`).
- No surveyed vendor leads with CASL/PIPEDA/PIPA-BC or FR-CA support
  (`research/ai-bdc.md`, `research/canada-compliance.md`).

### 2.3 No proof/audit layer anywhere in the category

Every vendor sells self-reported dashboards and aggregate marketing math
("18% lift", "$424K average gross", "2.7x more appointments") — assertions, not
evidence. `research/ai-bdc.md` states it plainly: "Nobody offers verifiable
proof of what the AI did... This is white space." Meanwhile CASL puts the
burden of proof of consent on the sender (`research/canada-compliance.md`), and
the documented #1 equity-mining failure mode is unverifiable follow-through
(`research/autoalert.md`). The category needs receipts; nobody sells receipts.

### 2.4 Paper desk logs are still common

ADSCO still sells paper desk-log binders in 2026, and the long tail of
up-systems persists because independents never got a product priced and shaped
for them (`research/tms-canada.md`). The bottom of the market is not fought
over — it is unserved.

**Conclusion:** the gap is a single, independent-dealer-priced, Canada-first
platform where the traffic desk, CRM, inventory, AI follow-up, equity mining,
and demand gen share one record set — and where every action is provable.

## 3. Empire formula — how the four layers compound

Per `CONTEXT_PACK.md` Section 2, the strategy is four layers, each making the
next more valuable:

1. **Demandara books the buyer.** Demand gen, SEO/AEO pages, campaigns, AI BDC
   drafting, Sales Closer — leads arrive via `POST /api/demandara/leads` with
   UTM/source/consent lineage intact (Modules 9–10).
2. **DealerOS runs the workflow.** Traffic desk, lead pipeline, inventory,
   equity mining, service bridge — the operational system of record where the
   appointment, the vehicle, and the deal draft live (Modules 1–8).
3. **Cognitia proves the work.** Every step emits a proof receipt with actor
   identity, policy-gate result, consent basis, payload hash, approval trail,
   and dispute path (Module 11). Outcomes flow back through
   `GET /api/demandara/outcomes` and `/revenue-attribution`, so marketing spend
   is tuned by receipted sold outcomes, not form fills.
4. **Agent economy rewards verified actions later.** Internal-only primitives —
   agent passports, work events, work-credit candidates, reputation events
   (Module 15). No token, no crypto, no public marketplace. The receipts from
   layer 3 are the evidence base; nothing here launches until layers 1–3 are
   validated.

**The compounding loop:** Demandara creates demand → DealerOS converts it and
records the trade-in into inventory → Demand Gen instantly merchandises the
acquired unit → Cognitia receipts make the whole chain auditable → the monthly
proof-backed report makes the dealer trust the system more → more workflows
move into the system → more receipts → better attribution → better spend
allocation. Competitors sell one slice; each of our layers raises the
switching cost of leaving all four.

## 4. The 10 north-star product goals, restated as strategy

Canonical statement for V1 (mapped to `CONTEXT_PACK.md` modules; the delivery
sequencing lives in `DEALEROS_DELIVERY_MEMO_V1.md`):

| # | North-star goal | Strategic meaning | Modules |
|---|---|---|---|
| 1 | Every traffic event captured, timed, and closed out | Own the desk log — the category's atomic unit — with AI doing the logging | 4, 6 |
| 2 | Instant, governed first response to every lead | Beat the 23-hour industry response failure with draft+approve, never unsupervised sends | 5, 6 |
| 3 | Lead → appointment as the wedge metric | One receipt-backed number the dealer can audit, not vendor math | 5, 10, 11 |
| 4 | Every important action emits a proof receipt | The paper trail is the product, not a feature | 11 |
| 5 | Consent as data, enforced by hard gates | CASL expiry math + policy gates that block non-consented sends | 2, 14 |
| 6 | Equity opportunities that work for independents | Score on finance-term age, mileage, market price, web behavior — not lease books | 7 |
| 7 | One record set, no swivel chair | CRM + traffic + inventory + AI + website on the same tenant-scoped core | 1–9 |
| 8 | Demand-to-sold attribution across every seam | Demandara loop closes at sold/lost, not at the form fill | 9, 10 |
| 9 | Connector-ready, mock-by-default | Coexist with DealerMine/TMS/DMS stacks; live mode always human-approved | 12 |
| 10 | Independent-dealer economics | Transparent per-rooftop pricing, no per-seat gouging, days-not-months onboarding | 1, business model |

Strategy reading: goals 1–3 win the deal, goals 4–5 win Canada, goals 6–8 keep
the account, goals 9–10 open the market. Any roadmap item that advances none of
the ten is cut.

## 5. Tenant-zero plan — Budget Wheels as first proof environment

Budget Wheels (independent used-car dealer avatar, Vancouver/BC) is the first
proof environment. Per `BUDGET_WHEELS_WHAT_WE_BUILT_SO_FAR_V1.md`, there is
still no product — so tenant-zero is where design becomes evidence. **No
outreach of any kind until every gate below passes and Muhammad approves.**

### 5.1 What we validate at tenant-zero (acceptance criteria)

| Gate | What is validated | Acceptance criteria (all mock/fake data) |
|---|---|---|
| T0-1 | Multi-tenant foundation | Budget Wheels tenant created in the dedicated repo; roles, audit logs, tenant isolation tests pass (see `DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md`) |
| T0-2 | Traffic desk end-to-end | 100% of simulated traffic events (phone/web/walk-in/after-hours) logged, assigned, SLA-timed; every state change emits a receipt |
| T0-3 | Sales Closer loop | Lead → AI draft → human approval → appointment draft → sold/lost, fully receipted; zero auto-sends observed in testing |
| T0-4 | Proof report reproducibility | Monthly proof report regenerates identically from the receipt ledger alone; every claimed appointment resolves to a receipt chain |
| T0-5 | Consent engine | Express/implied basis + expiry computed per contact/channel; non-consented drafts blocked with `policy_gate_result=denied` |
| T0-6 | Ad Compliance Pre-Flight | Simulated BC listings pass total-price / VIN / stock-number / disclosure checks; failures block publish (rule text pending legal review) |
| T0-7 | Demandara loop (mock) | Lead in via mock `POST /api/demandara/leads`; outcome + attribution back via mock `GET` endpoints |
| T0-8 | Operator usability | Muhammad can run a full demo-day scenario solo, from lead to proof report, without engineering help |

### 5.2 Only after all gates pass

Internal demo (Week-4 script per `BUDGET_WHEELS_WHAT_WE_BUILT_SO_FAR_V1.md`) →
owner review → decision on first real-dealer conversations via the (still
unsent) outreach approval packet.

- SKIPPED_WITH_REASON: real Budget Wheels customer data, live inventory feeds,
  and any dealership outreach — blocked by hard boundaries (no real customer
  data, no outreach) until owner approval and, where applicable, legal review.
- SKIPPED_WITH_REASON: T0 gate implementation itself — requires the dedicated
  code repo (`cognitiacloud/dealeros`), a Week-1 roadmap item; only reference
  scaffolds exist in `build-packets/` today.

## 6. Wedge → expansion sequencing

**Claim-safe wedge (the only future public message authorized for drafting):**
"Turn more dealership leads into appointments with AI-assisted follow-up,
traffic accountability, and proof-backed sales workflows." No guarantees, no
lift percentages, no "replaces X" claims.

| Stage | Offer | Why this order | Research basis |
|---|---|---|---|
| 0. Wedge | Traffic desk + Sales Closer + AI-assisted follow-up + proof receipts | Fastest visible pain (unlogged ups, slow follow-up); single wedge metric (lead→appointment) | `research/tms-canada.md`, `research/ai-bdc.md` |
| 1. Equity mining | Independent-tuned opportunity engine, named alerts, receipted follow-through | Uses data the wedge already captured; attacks the category's proven follow-through failure | `research/autoalert.md` |
| 2. Service bridge | Declined-work/recall/reminder campaigns, service-to-sales alerts | DealerMine's playbook, software-scaled and receipted; opens fixed-ops budget | `research/dealermine.md` |
| 3. Website / demand gen | SEO/AEO pages, compliant listings, UTM capture, Demandara attach | Attribution loop now has outcomes to feed on; compliance-clean listings differentiate | `research/canada-compliance.md` |
| 4. Connectors | DealerMine/TMS/DMS/marketplace connectors, mock→sandbox→live | Meet franchise-adjacent stores where they are; live mode approval-gated | Module 12; `build-packets/README.md` rules |
| 5. Dealer groups | Multi-rooftop dashboards, group benchmarks, per-rooftop receipts | Group visibility is the proven upsell (AlertMiner Pro, TraxSales multi-rooftop) | `research/autoalert.md`, `research/tms-canada.md` |

Sequencing rule: a stage ships only when the previous stage's receipts prove it
worked at tenant-zero (and later, at each dealer). Expansion is earned, not
assumed.

## 7. Moat design — why this is hard to copy

The moat is the *combination* of five data assets in one record set, spinal
rather than featural:

1. **CRM data** — Customer 360 with consent state, history, household.
2. **Inventory data** — VIN-level lifecycle, disclosures, merchandising state.
3. **Demand data** — campaign/UTM lineage from Demandara on every lead.
4. **Proof receipts** — append-only, hash-chained evidence for every action
   (`build-packets/cognitia/` already encodes the emitter).
5. **Outcome attribution** — sold/lost reasons joined back to source, campaign,
   actor, and receipt chain.

Why copying is expensive:

- **A ledger is a spine, not a feature.** Competitors log activity in mutable
  CRM tables. Retrofitting receipts with policy gates, approval trails, and
  dispute paths under a 20-year-old CRM (DealerMine) or a bolt-on AI (Impel)
  means re-instrumenting every write path — all three research files reach the
  same conclusion independently.
- **Cross-layer data is the value.** An equity score that sees inventory match
  + web behavior + consent state + service recency only exists when all five
  assets share one tenant core. Point vendors would each need the other four.
- **Compliance moat compounds in Canada.** CASL burden-of-proof + VSA/OMVIC ad
  rules as per-province policy packs (per `research/canada-compliance.md`) is
  structural work incumbents show no sign of doing.
- **Receipts create switching costs honestly.** The longer a tenant runs, the
  more verified work history (and later, agent reputation) lives in the ledger;
  leaving means abandoning the evidence base — lock-in by value, not by
  contract.
- Honest limit: UI, alert taxonomies, and cadences are copyable in a quarter.
  The moat is only real if the receipt spine ships in V1 and never regresses
  (build-packet rule 5: "Every significant action emits a hash-chained proof
  receipt").

## 8. Business model sketch (internal, claim-safe)

Internal working hypotheses only. No revenue promises, no forecasts, and no
pricing is public or final.

**Principles:**

1. **Per-rooftop SaaS, flat and transparent** — published pricing is itself a
   differentiator in a category that is 100% quote-gated (every research file
   confirms hidden pricing).
2. **No per-seat gouging** — unlimited users per rooftop (AutoRaptor's posture,
   per `research/ai-bdc.md`); a 2-person independent and a 12-person store pay
   the same tier price.
3. **Demandara attach** — demand gen/website engine sold as an attach to the
   DealerOS subscription, keeping attribution in one contract.
4. **Priced under the stack it replaces** — target meaningfully below the sum
   of the 3–4 subscriptions in Section 2.1, and inside the independent tier
   observed in the market (~$200–1,500/mo range per `research/ai-bdc.md`
   third-party estimates).

**Tier sketch (hypotheses, CAD, per rooftop / month — to be validated):**

| Tier | Contents | Maps to stage |
|---|---|---|
| Desk | Traffic desk + CRM + AI-assisted follow-up (approval-first) + proof receipts | Wedge |
| Closer | + Equity mining + service bridge + full Sales Closer | Stages 1–2 |
| Engine | + Website/demand gen + Demandara attach + connectors | Stages 3–4 |
| Group | Multi-rooftop pricing for dealer groups | Stage 5 |

- SKIPPED_WITH_REASON: actual price points and packaging — requires real market
  conversations (blocked: no dealership outreach authorized) and incumbent
  price benchmarks that are not public.
- NEEDS_EXTERNAL_RESEARCH: verified per-rooftop pricing for TMS, DealerMine,
  AutoAlert, and Car Wars (all flagged unverified in the research files);
  count of independent used-car rooftops in BC/Canada for market sizing.
- SKIPPED_WITH_REASON: revenue model spreadsheet — premature before tenant-zero
  gates pass; would create implied forecasts this document must not contain.

## 9. Top risks and mitigations

| # | Risk | Type | Mitigation |
|---|---|---|---|
| 1 | Incumbent bundling: PureCars-owned AutoAlert or Cox/Solera bundle "good enough" mining + AI into CRMs independents already see | Competitive | Move fast on the unserved independent tier; moat = receipt spine + Canada compliance, which bundlers show no roadmap for; stay connector-ready to coexist rather than fight head-on |
| 2 | Accessible all-in-ones (AutoRaptor, DealersCloud) add depth before we ship | Competitive | Their gap list is our roadmap (no equity mining, no proof layer, no demand gen, US-centric); ship the wedge + receipts first — the part they cannot bolt on |
| 3 | CASL/PIPEDA/VSA misstep — a compliance-adjacent claim or a blocked-send bug becomes a liability | Compliance | Hard policy gates over warnings; consent engine with expiry math; NO compliance claims without legal counsel review; per-province policy packs versioned as data. SKIPPED_WITH_REASON: legal review of all compliance-adjacent product copy — requires counsel |
| 4 | AI liability (Moffatt v. Air Canada pattern; Toronto BMW chatbot incident per `research/canada-compliance.md`) | Compliance/Trust | AI disclosure by default; hard "may-not-commit" list (no prices, no buy-backs, no approvals); human approval on every externally visible action; every commitment carries an approval receipt |
| 5 | Scope sprawl: 15 modules, one founder-operator | Execution | Wedge-first sequencing (Section 6); tenant-zero gates as the only definition of done; anything not advancing a north-star goal is cut; dedicated repo before any feature work |
| 6 | Design-to-product gap: nothing runs yet ("honest gap" in `BUDGET_WHEELS_WHAT_WE_BUILT_SO_FAR_V1.md`) | Execution | Week-1 repo creation; lift build-packets as starting vocabulary; T0 gates give a falsifiable build plan |
| 7 | Trust: dealers burned by bolt-on AI distrust the category | Trust | Approval-first autonomy as the headline; receipts make every AI claim inspectable; never publish lift metrics that are not receipt-backed and dealer-specific |
| 8 | Proof-layer overclaim: "proof" language drifting into certification/guarantee territory | Trust/Claims | Claim-safe language register enforced (`build-packets/website/` claims linter); "proof receipt" always defined as an internal audit record, never a certification |
| 9 | Connector dependence: dealers demand live DMS/DealerMine integration before buying | Execution/Competitive | Wedge works standalone (own CRM, own desk); connectors mock→sandbox→live with human-approved live mode; never promise live integrations we do not have |
| 10 | Agent-economy language triggers token/securities perception | Compliance | Internal-only skeleton; no token, no crypto, no public marketplace, no external rewards until legal review and explicit owner decision |

## 10. Decision asks for Muhammad

Full option analysis lives in `DEALEROS_MUHAMMAD_DECISION_BOARD_V1.md`; this
section states the asks this strategy depends on.

1. **Approve the wedge** (Section 6, stage 0) as the only V1 build target —
   everything else is sequenced behind it.
2. **Authorize creation of the dedicated repo** `cognitiacloud/dealeros` and
   the lift of `build-packets/` scaffolds into it (Week-1 item per
   `CONTEXT_PACK.md` Section 9).
3. **Ratify the tenant-zero gates** (Section 5.1, T0-1…T0-8) as the acceptance
   bar that must pass before any outreach conversation is even scheduled.
4. **Confirm the pricing principles** (per-rooftop, transparent, no per-seat
   gouging, Demandara attach) so packaging work can proceed without price
   points.
5. **Approve the claim-safe language register** for all future-facing copy
   (wedge phrasing in Section 6; prohibitions in `CONTEXT_PACK.md` Section 7).
6. **Engage legal counsel scope** for: CASL/PIPEDA/PIPA product behavior
   review, VSA/OMVIC listing-linter rule text, and AI-disclosure copy.
   SKIPPED_WITH_REASON: all three items require legal counsel — not started.
7. **Hold the agent-economy layer** at internal-skeleton status (Module 15)
   until layers 1–3 are validated at tenant-zero — explicit go/no-go later.
8. **Set the review cadence**: 30/60/90-day checkpoints against the roadmap,
   with this document re-versioned (V2) after the Week-4 internal demo.

---

## Boundaries honored

- No secrets, no real API keys; connector and model-provider configs are
  mock-by-default, live mode gated by human approval + proof receipt.
- No live CRM writes, no live DMS writes, no live DealerMine/TMS/AutoAlert
  integration performed or implied.
- No dealership or customer outreach performed; the outreach approval packet
  remains unsent; tenant-zero outreach is explicitly gated on owner approval.
- No real customer data; all demo/test data is fake/reserved/local-only.
- No production deploy, no production migrations, no "production ready"
  language; this is a design/strategy document only.
- No fake customer proof; no public launch claims; no revenue promises or
  forecasts; no guarantees, rankings, or certification claims (SOC 2 readiness
  ≠ certification).
- No crypto/token/securities language; agent economy remains an internal-only
  skeleton.
- No unsupported compliance claims; compliance-adjacent items are marked for
  legal counsel and flagged SKIPPED_WITH_REASON.
- Unverifiable vendor facts are marked NEEDS_EXTERNAL_RESEARCH; no vendor
  facts invented beyond what the research files state.
