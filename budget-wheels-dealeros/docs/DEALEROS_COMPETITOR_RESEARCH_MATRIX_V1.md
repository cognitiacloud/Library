# DEALEROS_COMPETITOR_RESEARCH_MATRIX_V1

STATUS: INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.
Owner: Muhammad Firoz · Date: 2026-07-03 · Version: V1

## 1. Purpose and method

This report condenses the 11-file competitor research corpus in `research/` into one
decision-ready matrix for Budget Wheels DealerOS (tenant-zero: independent used-car
dealer, Vancouver/BC). It answers four questions per product: what to copy, what to
beat, why the Cognitia proof ledger makes our version harder to copy, and why the
Demandara loop makes it more revenue-native.

Inputs (exact filenames): `research/tms-canada.md`, `research/dealermine.md`,
`research/autoalert.md`, `research/vinsolutions.md`, `research/dealersocket.md`,
`research/cdk.md`, `research/dealercenter-dealertrack.md`, `research/autosync-trader.md`,
`research/ai-bdc.md`, `research/marketplaces.md`, `research/canada-compliance.md`.
Sibling docs: module and platform design in `DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md`,
doc index in `DEALEROS_DELIVERY_MEMO_V1.md`, asset inventory in
`BUDGET_WHEELS_WHAT_WE_BUILT_SO_FAR_V1.md`. Module numbers below refer to
`CONTEXT_PACK.md` Section 6.

Method notes: all findings are from public sources compiled 2026-07-03; many vendor
sites blocked direct fetch, so details come from search extracts and press coverage.
All vendor performance numbers in this report are VENDOR CLAIMS, never our claims.
Unverifiable items are carried forward in Section 7 as `NEEDS_EXTERNAL_RESEARCH`;
nothing is fabricated. 40 product rows across 11 category tables (A–K).

## 2. Competitor matrix

Column key (identical in every table): Product | Best feature | Weakness/gap |
Copy conceptually | Improve on | How Cognitia proof makes it harder to copy |
How Demandara makes it more revenue-native.

### A. Traffic desk / showroom traffic management (`research/tms-canada.md`)

| Product | Best feature | Weakness/gap | Copy conceptually | Improve on | How Cognitia proof makes it harder to copy | How Demandara makes it more revenue-native |
|---|---|---|---|---|---|---|
| TMS (Traffic Management Services, Canada) | 30+ yr Canadian incumbency; software + human field-rep "action plans"; traffic log → Autovance desking → DMS hand-off | Legacy PHP core; mobile only ~2024; no visible AI/SLA/attribution; demo-gated hidden pricing; franchise/OEM-centric | Traffic event as atomic unit; AI-generated weekly manager action-plan narrative; one-click traffic event → deal draft (Module 4) | One system vs. four subscriptions; self-serve independent pricing; AI does the logging | Desk log becomes tamper-evident: receipts per event, assignment, edit, SLA breach — vs. editable logs staff openly game | Sources scored by cost-per-sold via `/revenue-attribution`, not tally marks; field-rep binder replaced by receipt-linked monthly report |
| TraxSales VisualProof | Camera ground truth: photo-verified timestamps; 15–25% unlogged-traffic gap metric; revenue-per-guest per associate | Hardware install; counts bodies not identity/outcome; still needs a CRM to act | "Logged vs. actual" gap report computed from any available signal (Module 4) | Consent-clean signals (check-in, one-tap log) instead of cameras | Receipts distinguish auto-captured vs. hand-entered vs. edited-after events, and by whom | Gap events trigger governed recovery follow-up, not just a report |
| Lot Watch (Proactive Dealer Solutions) | Real-time text alert for unassisted customers still on the lot; passive 24/7 lot/showroom/service-drive coverage | WiFi sniffing is privacy-fraught (MAC randomization, PIPEDA/PIPA-BC consent); anonymous counts; product is a BDC-consulting attach | Real-time interception alert while the customer is physically present | PIPEDA/PIPA-clean consented capture as a marketable differentiator | An alert that fired and was ignored is itself a receipt; escalation chain permanently recorded | Intercepted-but-lost visitors enter approval-gated resurrection sequences |
| Car Wars | Missed Opportunity Alert anatomy (summary + customer info + CRM deep link + one-tap callback); CRISP named phone standard | Phone-only slice; separate subscription; alert-fatigue risk | Four-part alert payload; named, scoreable process standard for every traffic event | SLA timers + escalation chains + permanent record, across all channels not just phone | Who-was-alerted / what-happened is receipted — coaching runs on evidence | Call outcomes join campaign attribution; missed calls feed Sales Closer (Module 5) |

### B. Canadian CRM + managed BDC (`research/dealermine.md`)

| Product | Best feature | Weakness/gap | Copy conceptually | Improve on | How Cognitia proof makes it harder to copy | How Demandara makes it more revenue-native |
|---|---|---|---|---|---|---|
| DealerMine Service CRM (+ AI Batch Texting) | Complete service campaign taxonomy (due / declined / recall / confirmation / no-show rebooking); recall check inside the booking call; intent-categorized SMS replies | Franchise DMS repair-order dependent; aggregate "18% lift" claims with no per-action evidence; near-zero review footprint | Named prebuilt campaign types with per-type outcomes (Module 8); recall/declined-work lookup in every appointment draft; intent triage buckets (Module 6) | Independent-first signals (works with no service department); per-action attribution instead of aggregate lift | `consent_basis` on every outreach receipt vs. "ensuring privacy compliance" as a footnote; auditable campaign outcomes | Service-to-sales opportunities become governed Sales Closer sequences with receipts and sold attribution |
| DealerMine Sales CRM + Next Generation Desking | Traffic / Web Leads / Appointments / Work Plans on one dashboard; desking in the same tool | Follower feature set; up-board, SLA timers, sold/lost discipline not visibly first-class | Four-workstream dashboard framing; per-salesperson Work Plan task queues (Modules 4–5) | Own the "traffic desk" word: SLA timers, no-show tracking, sold/lost reasons | Per-actor lost-lead report auto-generated from receipts (their Westwood report was bespoke) | Work plans fed by campaign-attributed leads; outcomes retrain spend |
| DealerMine Managed BDC + MORI AI Voice | Human call centre at scale (AutoCanada anchor; 100+ calls/agent/day claimed); MORI deployment modes (after-hours / overflow / department) | Labour economics (~4–10% YoY growth); doesn't scale down to a 30-car lot; report-level attribution only | Hybrid "AI answers, humans escalate" framing; voice adoption ramp starting after-hours (Module 12) | Software-scaled AI BDC margins; per-associate AND per-agent accountability productized | `actor_id` + `agent_passport_id` vs. `human_approver_id` distinguishes who booked what — automatic, tamper-evident | Voice is a channel in the same pipeline; every booked call attributable to a Demandara campaign |

### C. Equity mining / opportunity engines (`research/autoalert.md`)

| Product | Best feature | Weakness/gap | Copy conceptually | Improve on | How Cognitia proof makes it harder to copy | How Demandara makes it more revenue-native |
|---|---|---|---|---|---|---|
| AutoAlert AlertMiner / Pro / CXM (Pando) | Eight named alert types; daily equity recalculation; service-drive real-time interrupt; hot list pushed into rep agendas | Expensive vs. CRM-bundled mining; hard navigation, weak email builder; cannot prove reps worked the leads; franchise/lease-book assumptions; CXM forces dual systems | Small named alert taxonomy + reason codes + recommended pitch; pending-service pre-visit prep; built-in benchmarks (Module 7) | Independent-signal scoring (finance term age, mileage, market price, web behavior); native to the CRM — no swivel chair | `equity_score_generated` receipts carry inputs, model/prompt version, reason codes — auditable scoring vs. black box; follow-through disputes resolve to receipt chains | Alerts flow to governed campaigns/1:1 drafts; closed-loop alert → campaign → appointment → sold attribution |
| automotiveMastermind | Behavior Prediction Score 0–100 with three sub-scores; per-channel talk tracks; household/third-party data enrichment | Premium quote-only pricing; franchise focus; Canadian conquest coverage weaker than US | Score + reason + pitch shipped together on a deal-sheet-style record | Transparent reason codes a dealer can inspect; independent-dealer pricing | Reason codes + `data_refs` on every score receipt — targeting is reconstructable for dealer or regulator | Talk tracks become approved drafts with send + outcome tracking in one loop |
| DealerSocket RevenueRadar | 11 named "Radars" pinging inside the CRM where reps already work; sales + fixed-ops + acquisition ("mine core vehicles"); sold in Canada | Fire-and-forget pings; unaudited "$424K average gross" marketing; depends on clean DMS data | Pings surfaced throughout the workflow, never a separate screen; radar-type-level reporting; mining-to-acquisition loop (Modules 3+7) | Ping → appointment → sold funnel per radar type with result tracking | Every ping is a receipt with reason codes vs. mutable CRM activity log | Radar segments auto-become Demandara campaigns; website behavior joins radar inputs |

### D. Franchise mega-CRM — Cox / VinSolutions (`research/vinsolutions.md`)

| Product | Best feature | Weakness/gap | Copy conceptually | Improve on | How Cognitia proof makes it harder to copy | How Demandara makes it more revenue-native |
|---|---|---|---|---|---|---|
| VinSolutions Connect CRM | Single customer record merging sales + service in real time; manager-grade desking/reporting; dedicated Performance Manager | Support latency is the top complaint; aging UI (5+ clicks); broken ADF lead forwarding; 3-day GM lead outage; crashing mobile app | One record as spine — marketing and AI conversations write to the same timeline (Module 2); opportunity insights with "missed" as a first-class state (Module 4) | Lead-integrity guarantees; ≤2-click core tasks; transparent pricing; support SLAs we can show | `lead_received` + payload hash + reconciliation report = "we can prove no lead was silently dropped" — a direct strike at their verified failure | Outcomes retrain campaigns in both directions, vs. one-way campaign-of-origin reporting |
| Connect Automotive Intelligence + AMP | Buying Signals from Cox property data; predicted trade-in fields (year/make/model + confidence + likelihood); equity-aware personalized offers | Black-box classifications; Cox data moat structurally weak in Canada (AutoTrader.ca is Trader-owned); managed-service dependency; archaic email tech | Prediction + confidence + reason shape on the record (Module 7); behavior-triggered outreach; equity-aware offer with payment framing | Own the signals independents actually have: own site, service drive, campaigns; CASL-native consent | Hot score + reason codes + exact `data_refs` visible; every AI draft receipted with approval state | Full-funnel demand gen (SEO/AEO/reviews/listings) vs. email + Meta ads; proof report replaces account-manager narrative |
| Vinessa | CRM-native AI assistant — all conversations live on the customer record; signal-triggered GenAI messaging | Scripted-feel heritage; no voice; no audit trail of what the AI said vs. what a human approved | Assistant messages because behavior changed, not because a cadence timer fired (Module 6) | Approval-first autonomy; AI disclosure; escalation to a named salesperson with an SLA timer | `ai_reply_drafted` → `human_approval_granted` chains make AI conduct provable | Assistant conversations carry campaign attribution into the monthly proof report |

### E. Franchise + independent suite — DealerSocket / Solera (`research/dealersocket.md`)

| Product | Best feature | Weakness/gap | Copy conceptually | Improve on | How Cognitia proof makes it harder to copy | How Demandara makes it more revenue-native |
|---|---|---|---|---|---|---|
| DealerSocket CRM (Blackbird) | Quick Up + driver's-license scan: walk-in into CRM in seconds, feeding desking; in-CRM one-worksheet desking; franchise AND independent coverage | Post-Solera support collapse; performance decay; FB/Google ad-lead ingestion gaps; duplicate leads; multi-year auto-renew lock-in | Sub-30-second walk-in capture → traffic event → deal draft (Module 4); role-based dashboards and checklists | Simple by default, deep by permission; month-to-month fairness; duplicate merge with `duplicate_detected` receipts | `connector_sync_completed/failed` receipts answer silent ad-lead loss; tenant-visible incident log mirrors accountability back onto us | Daily reconciliation of CRM counts vs. ad-platform counts; every lead scored to sold |
| IDMS | Credible independent/BHPH DMS from a major vendor; auto-generated deal docs with compliance checks; 50+ integrations | US-compliance-first document library; "complex but rigid"; Canadian fit unproven | End-to-end vehicle/sales/customer/payment lifecycle in one system for independents | Canada-first deal math (GST/PST, weekly/bi-weekly payments) + BC MVSA disclosure fields | Document generation and disclosure events receipted — audit-ready deal jackets | Deal outcomes close attribution loops IDMS never sees |
| Inventory+ | Profit Per Day as the organizing KPI; Ideal Inventory Model; sourcing/buy lists; appraisal → pricing → merchandising loop | Smaller market-data footprint than vAuto; little recent innovation; Canadian data coverage unverified | Single economic KPI ordering stocking/pricing/recon, paired with days-in-inventory + merchandising score (Module 3) | Independent-scale pricing intelligence with Canadian semantics (km, CAD, CARFAX Canada) | Pricing and repricing decisions receipted with market-data refs | Aging units auto-prioritized in campaigns; sold outcomes feed stocking decisions |
| DealerFire (Engine6) + PrecisePrice | CRM-connected site analytics; managed SEO content; web-to-desk payment parity; Save-and-Finish-Later shortcode resume with no PII | Website support named in "worst in 20 years" complaint; no AEO/AI-overview story; attribution stops at the lead; DR product stale since 2017 | Same deal object website → desk; low-friction no-PII deal resume; site behavior visible to CRM (Modules 5, 9) | schema.org depth, AEO answer blocks, lead-to-sale attribution | `campaign_attributed` receipts back every ROI number vs. "300% organic" assertions | Web engine natively feeds sold/lost outcomes back into campaign targeting |

### F. Enterprise DMS platform — CDK Global (`research/cdk.md`)

| Product | Best feature | Weakness/gap | Copy conceptually | Improve on | How Cognitia proof makes it harder to copy | How Demandara makes it more revenue-native |
|---|---|---|---|---|---|---|
| CDK DXP + AIVA / Intelligence Suite | One platform across sales/service/inventory/F&I; suite tiering by dealer size; AIVA conversational Q&A over the dealer's own data; new CDP | Opaque pricing and fee stacking (directional ~$30K/mo all-in reports); June 2024 outage took ~15,000 rooftops down ~2 weeks; no public AI-governance story | Named, countable AI features ("Traffic Answers", "Lead Summary"); Foundations-vs-Fundamentals tiering for land-and-expand (Module 1) | Resilience as a feature: daily exports, degraded mode, printable fallbacks, published RTO targets; transparent pricing | Incident timeline is a ledger query, not a forensics engagement; receipts show who touched dealer data under what consent basis | CDP unifies data but does nothing for demand gen; our loop reconciles spend → traffic → sold in one chain |
| CDK CRM (Elead) | Tablet-first showroom app; CRM-native Virtual BDC service; 300+ prebuilt reports; native DMS sync | Support is the top complaint — dealers cannot self-serve config changes; glitches; CDK contract gravity | Mobile/tablet-first lot workflow; group dashboards; BDC packaged as an outcome service (Modules 4, 6) | Self-serve tenant configuration with audit receipts instead of gatekeeping; AI BDC at software margins | Config changes are receipted, not phoned in; BDC work distinguishable by actor type | "Your BDC, with receipts" — BDC outcomes tied to campaign spend |
| CDK Modern Retail Suite | One deal object website → CRM → desking → F&I; "pennable" desking with live lender data; eContracting cuts contracts-in-transit | Franchise/new-car centric (lender/incentive/residual rails); value depends on full CDK stack | "No rekeying, ever" as a design law; live rate/fee/tax data in the first pencil (BC taxes/fees) (Module 5) | Independent used-car deal math; outside-financing-friendly workflows | Deal-draft field lineage receipted from web form to signature | Deal-builder pages on our VDPs feed straight to deal drafts with attribution intact |
| Fortellis | Real API platform + app marketplace + certification program; standard-API vision | Monetized gatekeeping: certification fees + per-dealer writeback tolls (the litigated "CDK tax") | Docs + marketplace + partner-program shape for our connector registry (Module 12) | Free/cheap self-serve connectors — openness as a weapon | Receipts make openness safe: every connector side effect gated and logged | Partners join the attribution chain instead of being taxed at the gate |

### G. Independent DMS + F&I rails (`research/dealercenter-dealertrack.md`)

| Product | Best feature | Weakness/gap | Copy conceptually | Improve on | How Cognitia proof makes it harder to copy | How Demandara makes it more revenue-native |
|---|---|---|---|---|---|---|
| DealerCenter (Nowcom) | True all-in-one at independent prices (DMS + CRM + credit + websites + BHPH); mobile VIN/DL scan; deep lender rails; praised support | Owner is a competing lender (Westlake sibling) — conflict-of-interest optics; add-on pricing fatigue; buggy updates; no visible Canadian offering; no proof/attribution layer | Deal-record anatomy (worksheet, lender offers, docs, notes, events); compare-offers desking; BHPH self-service portal (Modules 3, 5) | Neutrality with a data-rights registry; Canada-first fit; traffic accountability beyond lead storage | Receipts on credit pulls and connector syncs answer their top reliability complaints; "your data works for you, provably" | Websites become demand assets with outcome feedback vs. free brochure sites |
| Dealertrack Canada | National credit-app network — one deal to virtually all Canadian lenders; free-to-dealer (lender-funded); bilingual EN/FR; DealTransfer data pipe | Infrastructure, not workflow; legacy UI; slow innovation; crash complaints (mostly US DMS side) | One clean documented CRM ↔ credit-network data path; flagship Canadian connector, mock mode first (Module 12) | Treat as the rail to integrate, not a competitor to displace | Connector receipts prove every submitted app and response with payload hash | Finance-page leads route through the same attribution chain as all other sources |
| Dealertrack Reg & Titling (Accelerated Title) | Cycle-time as product: trade-in title release from weeks to a claimed 4–6 days, with 24/7 tracking | US DMV mechanics don't map to Canadian provincial registries; sold to Vitu — roadmap uncertain | Dollarized cycle-time KPIs: lead response time, lien-release days, days-in-inventory (Modules 3–4) | BC-equivalent workflows (lien payout, ICBC transfer) as tracked KPIs in a later module | Cycle-time claims computed from timestamped receipts, not marketing copy | Faster trade-in cycle feeds the mined-equity → acquired-unit → published-VDP flywheel |

### H. Canadian marketplace-owned suite — Trader / AutoSync (`research/autosync-trader.md`)

| Product | Best feature | Weakness/gap | Copy conceptually | Improve on | How Cognitia proof makes it harder to copy | How Demandara makes it more revenue-native |
|---|---|---|---|---|---|---|
| Activix CRM | Dealer-legible modules (Showroom Control, Client Portfolio & Equity, Groups & BDC); bilingual Canadian DNA; published support stats; built-in CASL consent tracking | AI bolted on via Matador; equity depth unverified; thin third-party review base; consent is tracking, not proof | Concrete module naming; consent as a first-class CRM object; support responsiveness as marketing (Modules 1, 2, 14) | Consent-expiry math + hard policy gates + exportable consent evidence | `consent_captured` receipts with basis and computed expiry = proof, vs. a preference field | Re-permission campaigns (expired implied → express) become a revenue play, not a legal chore |
| TAdvantage + TRFFK | Price iQ badges rendered on the dealer's own VDPs; Cost-Per-VDP / Cost-Per-Lead ad optimization; inventory-synced ad refresh | Template sameness; weak organic SEO beyond inventory pages; attribution stops at VDP/lead; agency-managed, not dealer-operated | Marketplace-signal merchandising on owned surfaces; campaign lifecycle tied to inventory status lifecycle (Modules 3, 9) | Attribution to sold; own-site SEO/AEO equity that reduces marketplace dependence | `sold_attributed` chained to `lead_received` is evidence, vs. VDP-view dashboards | Cost-per-sold by campaign answers "should I cut my AutoTrader spend?" — a question Trader cannot ask itself |
| MotoCommerce (Motoinsight) | "Build My Deal" progressive deal builder on VDPs and marketplace; "Buy Online" badge; claimed conversion lift in Trader pilot | Digital-retail completion rates low industry-wide; desk rework; franchise-program centric | VDP → payments → trade-in → financing → deposit funnel shape for our finance/trade pages (Modules 5, 9) | Deal drafts land on the same desk object; Canadian finance products (weekly/bi-weekly payments) | Consumer deal-build steps receipted into the deal draft's lineage | Deal-builder events are attribution signals feeding lead scoring |
| Matador AI (via AutoSync) | 24/7 conversational AI across chat/SMS/email; exclusive Canadian distribution locks out rivals | Partner bolt-on — suite is multiple stitched codebases; no public approval gates or audit trail; Activix integration depth unverified | 24/7 coverage story; virtual-BDC framing (Module 6) | Native AI inside the CRM: one data model, consent state in-context, same escalation humans | Dealer-visible trail of what the bot said and did, under whose approval — absent across the whole suite | AI conversations carry campaign lineage; outcomes retrain targeting |

### I. AI BDC / conversational AI (`research/ai-bdc.md`)

| Product | Best feature | Weakness/gap | Copy conceptually | Improve on | How Cognitia proof makes it harder to copy | How Demandara makes it more revenue-native |
|---|---|---|---|---|---|---|
| Impel | "Conversation Highlights" AI→human handoff artifact; 51-day dynamic cadence; inventory-grounded conversations; fine-tuned LLMs | Harsh dealer-forum sentiment (awkward interactions, setup labor); bolt-on outside the CRM; no meaningful voice; group-tier pricing | Structured handoff packet (summary, intent, budget, matches, next action); named long cadence, e.g. "45-day resurrection ladder" (Modules 5–6) | Baked-in agent working the same desk as humans; approval-first autonomy | Handoff is a receipt pair (`ai_reply_drafted` → `human_approval_requested`) with dispute path | AI conversations attributed to campaigns; AI-assisted appointments in the proof report |
| Conversica | Dead-lead reactivation at scale; long-tenured incumbent; multi-language claims | ~$2,999/mo + setup — enterprise-only; email-first, no voice; interpretation gaps; slow dashboard | "Revive the leads you gave up on" as a named, reported workflow ("Resurrection report: N revived, M appointments") | Independent pricing; resurrection gated by CASL consent-expiry checks | Resurrection outreach receipts carry consent basis — re-engagement is provably lawful | Lost-lead cohorts become governed Demandara campaign audiences |
| Numa | DMS-grounded voice ("voice with a brain"); missed-call rescue text-back; Appointment Agent books into genuinely open slots | Service-first, thinner sales BDC; pricing opacity; Canada posture unknown | Ground every answer in live inventory/appointment state; missed call → traffic event + instant text-back (Modules 4, 6) | Voice via connector registry, mock-first, human-approved live mode — honestly staged | Grounded answers cite `data_refs` (`inventory_context_used` receipts) | Rescued calls enter the same attribution pipeline as web leads |
| BDC.AI | Tri-channel including voice; hot transfer of live qualified calls; human QA review of every AI interaction | Young vendor, thin independent review footprint; self-reported metrics; still a bolt-on | Hot-transfer mechanic; QA queue as the approval inbox; prebuilt lifecycle revenue campaigns (Modules 5–6, 8) | QA reviews as receipts with dispute paths — evidence, not a staffing claim | Their humans review chats; our reviews ARE receipts | Recovered-revenue campaigns attributed to sold outcomes, not claimed dollars |
| Podium | Omnichannel inbox + sentiment/urgency alerts; review flywheel; accessible add-on pricing; large install base | Shallow automotive depth (no inventory-grounded answers, no DMS voice); AI is an add-on SKU on a horizontal platform | "Customer frustrated" / "hot buyer" alert types on the traffic desk; post-sale review-request automation (Modules 4, 9) | Automotive-native grounding; reviews feed our own local SEO engine | `review_requested` receipts; sentiment escalations tracked to outcome | Reputation joins revenue reporting instead of living in a separate dashboard |
| AutoRaptor + DealersCloud | AI inside the CRM for independents; transparent flat pricing, unlimited users, fast onboarding; sub-2-minute response SLA; marketplace feeds | AI layer shallow and new; no equity mining, proof layer, or demand-gen engine; US-centric | The packaging posture: flat price, unlimited seats, 3–7-day onboarding, "AI inside" headline | Same posture plus depth: equity mining, service bridge, demand gen, proof | The proof ledger is exactly the depth they lack at a comparable price point | A demand-gen engine none of the independent CRMs ship |

### J. Marketplaces / listing ecosystems (`research/marketplaces.md`)

| Product | Best feature | Weakness/gap | Copy conceptually | Improve on | How Cognitia proof makes it harder to copy | How Demandara makes it more revenue-native |
|---|---|---|---|---|---|---|
| AutoTrader.ca | Largest Canadian buyer audience; Price iQ badges (claimed +31%/+60% VDP lead lift); Go/Smart/Pro tiers; DemandAI intent layer announced | Rep-driven opaque pricing; vendor-graded metrics (VDP views, "engagements"); structural conflict — owns the software that measures the marketplace | Claim-safe "priced vs. market" indicator on our VDPs and listing assistant, driving repricing tasks (Module 3) | Outcome-attributed CPL from the dealer's own data — a renewal negotiating weapon | `lead_received` receipts create a dealer-owned record of what the marketplace actually delivered | One ROI table across AutoTrader/Kijiji/FB/Google/own site; owned-traffic shift proven over time |
| CarGurus (.ca) | IMV + Deal Rating badges — the category's strongest consumer-trust device; Best Match ranking factors published | "Price suppression tax"; algorithm blind to recon evidence; documented 602% renewal increase case; vendor-attributed lead counting | Merchandising score decomposed into the exact factors marketplaces rank on, with per-factor fixes (Module 3) | Recon-evidence "why this price" block justifying above-IMV pricing | Inspection/disclosure refs on the inventory record back the price story with dated receipts | Gross-per-lead and close-rate per source vs. CPL-only economics |
| Kijiji Autos | Canadian reach at lower cost; one feed publishes to two sites; free clickable website links; CARFAX Canada price analysis | Weaker intent data; price-shopper leads; basic dealer analytics | One canonical inventory record exporting to per-marketplace dialects; CARFAX-anchored price trust (Modules 3, 12) | Structured capture + SLA timers for chat leads that currently die in inboxes | Every chat lead consent-stamped and receipted at ingestion | Outbound website links feed owned-site attribution loops |
| Facebook Marketplace (Meta) | Historically near-zero-cost local lead volume for sub-$15k inventory; sanctioned path is Automotive Inventory Ads | Policy minefield: business-page vehicle posting banned since 2023; instant 30-day bans; unstructured, unattributed Messenger leads | Compliance guardrails as product: mark-sold-within-24h automation, ban-risk lint before publish (Modules 3, 12) | Legitimate Messenger→CRM capture with consent, SLA timers, receipts — no gray-market posting | `inventory_context_used` + approval receipts form the compliance trail the policy regime implicitly demands | AIA catalog campaigns tied to inventory lifecycle and sold attribution |
| Google Vehicle Ads / GBP | Highest-intent channel; feed spec is the de facto clean-inventory schema; strict price-honesty policy | Organic whiplash (GBP vehicle listings deprecated Nov 2025); disapprovals punish sloppy feeds and price mismatches | Google required-field list as our baseline export schema; ~4-hour refresh; full-snapshot semantics (Modules 3, 12) | Feed hygiene as a first-class job: price-mismatch and missing-field pre-flight before disapproval | Feed publishes receipted with payload hash — "the feed said $12,900 at 09:00" is provable | Vehicle Ads spend allocated by cost-per-sold, not impressions |

### K. Compliance-productized benchmark (`research/canada-compliance.md`)

| Product | Best feature | Weakness/gap | Copy conceptually | Improve on | How Cognitia proof makes it harder to copy | How Demandara makes it more revenue-native |
|---|---|---|---|---|---|---|
| Kimoby (Service Lane OS) | CASL-compliant SMS as a first-class onboarding topic; consent capture at service write-up; sender ID + opt-out baked into templates | Service-lane-centric, not a full CRM/traffic desk; template hygiene rather than enforced gates; no per-message consent-basis ledger | Consent capture at natural workflow moments; compliance pre-inserted in every template (Modules 2, 8, 14) | Hard policy gates (non-consented sends blocked, `policy_gate_result=denied`); consent-expiry engine | `policy_gate_result` on every send receipt proves non-compliant sends were BLOCKED, not just avoided | Consent-aware growth: compliance panel (sent vs. blocked, consent coverage, opt-out honor time) inside the monthly proof report |

## 3. Category verdicts

1. **Traffic desk (A).** A fragmented, aging niche: TMS owns Canadian franchise trust through people, not product; Car Wars owns phones; Lot Watch owns the lot; TraxSales sells cameras to catch what nobody logs; a meaningful share of independents still run paper logs. Nobody unifies channels, nobody enforces (alerts without escalation records), and the only Canadian player is legacy and demo-gated. Module 4 wins by unifying all traffic in one governed pipeline with SLA timers, privacy-clean capture, and a provable logged-vs-actual gap.
2. **Canadian CRM + managed BDC (B).** DealerMine/Quorum is the credible Canadian incumbent, but its engine is franchise DMS data and Saint John labour; accountability artifacts are bespoke reports and aggregate lift claims. Independents are structurally underserved. We copy their campaign taxonomy and hybrid AI/human framing, and beat them on software margins, per-action receipts, and independent-first signals.
3. **Equity mining (C).** Mature category with a documented fatal flaw: the tools surface opportunities but cannot prove or enforce follow-through (the top-cited program-failure reason). All incumbents assume lease books and OEM feeds. Module 7 wins on independent signals, receipts per opportunity stage, and native placement in the same CRM — no swivel chair, no black-box score.
4. **Franchise mega-CRM (D).** VinSolutions holds share through Cox bundle gravity, desking, and reporting — not user love. Its US marketplace data moat is structurally weak in Canada (AutoTrader.ca is Trader's), and its verified failures (lead forwarding, outages, support) are exactly what a receipt ledger disproves. Copy the single-record spine and opportunity-insights framing; attack on lead integrity, click count, and Canadian signals.
5. **DealerSocket/Solera suite (E).** Validates our all-in-one thesis for both franchise and independent dealers, then fails on execution: post-acquisition support collapse, performance decay, lead-ingestion gaps, contract traps. Quick Up, in-CRM desking, Profit Per Day, and Save-and-Finish-Later are the best mechanics to copy; support-as-product and contract fairness are the wedge.
6. **Enterprise DMS (F).** CDK defines the ceiling (one deal object, suite breadth, agentic AI demos) and the cautionary tale (opaque pricing, integration tolls, antitrust settlement, the June 2024 outage). Not our direct competitor at tenant-zero scale, but the source of two permanent sales angles: resilience/exit-friendliness and governed AI with receipts.
7. **Independent DMS + F&I rails (G).** DealerCenter is the strongest US independent all-in-one and has no visible Canadian offering — our clearest whitespace signal. Dealertrack Canada is not a competitor but the mandatory Canadian financing rail; DealTransfer-style round-trip is table stakes for our connector registry (mock-first per hard boundaries).
8. **Marketplace-owned suite (H).** Trader/AutoSync is our most important Canadian competitor cluster: it owns the demand faucet and sells the software that measures it. Its suite is stitched acquisitions with a bolt-on AI and attribution that stops at VDP/lead — it can never honestly answer "should I cut my AutoTrader spend?" DealerOS is structurally on the dealer's side of that conflict.
9. **AI BDC (I).** Crowded, distrusted, and bifurcated: enterprise bolt-ons dealers resent vs. independent CRMs with shallow AI. The community's stated bar — AI baked into the CRM — is unmet at depth by anyone. Voice with live-data grounding is the battleground; verifiable per-action proof of AI conduct is the white space nobody occupies.
10. **Marketplaces/listings (J).** Marketplaces grade their own homework, monetize dependence, and punish feed sloppiness. The dealer needs three things nobody sells them: outcome-attributed channel ROI, feed/compliance hygiene, and structured capture of chat leads. Cars.com/Cars Commerce (US) supplies the pattern library — per-VIN AI video and unified cross-channel reporting — worth copying even though the marketplace itself barely matters in Canada.
11. **Compliance (K).** CASL/PIPEDA/PIPA-BC, VSA advertising rules, and AI-liability precedent (Moffatt v. Air Canada; the Toronto BMW chatbot incident) collectively define a product surface no incumbent fully occupies: consent-expiry math, hard policy gates, ad-compliance pre-flight, AI disclosure with authority limits. Activix and Kimoby prove Canadian dealers buy compliance features; both stop at tracking/templates and never reach proof. This is DealerOS's most defensible category — with legal counsel review required before any compliance-adjacent claim ships.

## 4. Top 10 features to adopt across the board (ranked)

1. Named opportunity taxonomy — small set of named alerts/radars with reason codes, recommended pitch, and in-stock vehicle match (AutoAlert, RevenueRadar, Mastermind → Module 7).
2. Four-part missed-opportunity alert (summary + customer info + deep link + one-tap action) plus real-time on-lot/unworked-lead interception (Car Wars, Lot Watch → Module 4).
3. One deal object, no rekeying: website → CRM → desking → docs with web/desk payment parity (CDK Modern Retail, PrecisePrice, MotoCommerce → Modules 5, 9).
4. Sub-30-second mobile capture: DL/VIN scan → traffic event → deal draft, tablet-first on the lot (DealerSocket Quick Up, DealerCenter, Elead → Modules 3–4).
5. AI→human handoff packet + live hot transfer + human QA queue that doubles as the approval inbox (Impel Conversation Highlights, BDC.AI → Modules 5–6).
6. Live-data-grounded AI answers and missed-call rescue text-back — never script-based availability or price answers (Numa → Modules 4, 6).
7. Per-VIN "how every marketplace algorithm sees this car" preview (predicted deal rating, price-to-market, photo score) plus feed-hygiene/ban-risk pre-flight (CarGurus, Price iQ, Google/Meta policies → Modules 3, 12).
8. Named service campaign types (due/declined/recall/confirm/rebook) with recall check inside every booking flow (DealerMine → Module 8).
9. Dollarized single-number KPIs: profit-per-day, ~$35/day aging cost framing, cycle-time days (lead response, lien release) (Inventory+, vAuto lore, Accelerated Title → Modules 3–4).
10. Consent captured at natural workflow moments with sender ID/opt-out pre-inserted in every template, surfaced as a first-class CRM object (Kimoby, Activix → Modules 2, 14).

## 5. Top 10 category gaps DealerOS exploits (ranked)

1. **No verifiable per-action proof anywhere.** Every vendor ships self-reported dashboards; none offers an auditable record of what the AI or staff actually did. Cognitia receipts are category-wide white space (Module 11).
2. **Canadian independents are structurally underserved.** The strongest US independent stack (DealerCenter) has no visible Canadian offering; every Canadian incumbent centers franchise/OEM programs.
3. **CASL consent-expiry math + hard policy gates.** Incumbents treat consent as a boolean or a template; none computes 2-year/6-month implied-consent windows or blocks non-compliant sends by design (Module 14).
4. **Attribution stops at VDP/lead everywhere.** Nobody computes cost-per-SOLD and gross-per-lead across channels from the dealer's own data — the report every renewal negotiation needs (Modules 4, 10).
5. **Bolt-on AI distrust.** The dealer community's bar ("not ready unless baked into the CRM") is unmet at depth; baked-in players have shallow AI. Native + approval-first + receipted clears it (Module 6).
6. **Marketplace conflict of interest.** Trader owns marketplace + software; its analytics can never indict its own marketplace. Vendor-neutral channel ROI is a permanent wedge (Modules 9–10, 12).
7. **Fragmented traffic desk.** Showroom + phone + lot + CRM currently means four subscriptions; one governed pipeline with SLA escalation and sold/lost closure replaces them (Module 4).
8. **Support and trust collapse at incumbents.** Vin/Solera/CDK's top complaint is support opacity; tenant-visible incident logs, sync receipts, and self-serve config turn accountability into product (Modules 1, 12).
9. **Lock-in and resilience failures.** The CDK outage, auto-renew litigation, and integration tolls made exit-friendliness a buying criterion: data exports, degraded mode, fair contracts, free connectors.
10. **Twin independent-segment white spaces:** equity mining (absent from every independent DMS/CRM) and VSA/OMVIC ad-compliance pre-flight (absent from every vendor surveyed) (Modules 3, 7, 14).

## 6. Decision defaults and acceptance criteria

1. Default: a "Copy conceptually" item enters a build packet only when mapped to a numbered module, expressible with existing receipt event types, and workable in mock mode with fake data.
2. Default: any feature derived from a vendor-claimed metric ships without the metric; our version reports tenant-local, receipt-backed numbers only.
3. Default: every competitor-inspired external side effect (send, publish, sync) is draft-first, human-approved, receipted — no exceptions inherited from competitor behavior.
4. Acceptance for this doc: 40 rows, 11 category tables with the exact 7-column header, 11 verdicts, two ranked top-10 lists, full caveat carry-over, boundaries restated. All met.
5. Escalation: any row that would drive a public comparative claim goes to the owner (Muhammad Firoz) and stays internal until claim-safe review; "AutoAlert replacement"-style parity language remains prohibited per `CONTEXT_PACK.md` Section 7.

## 7. Research caveats — NEEDS_EXTERNAL_RESEARCH carry-over

Every open item from the 11 research files, grouped by source. None may be treated as fact until verified.

From `research/tms-canada.md`:
- NEEDS_EXTERNAL_RESEARCH: TMS subscription pricing, contract terms, and whether field-staff services are bundled or billed separately.
- NEEDS_EXTERNAL_RESEARCH: exact TMS report names, alert types, and whether any AI-assisted features exist.
- NEEDS_EXTERNAL_RESEARCH: dealer-community reviews of TMS specifically.
- NEEDS_EXTERNAL_RESEARCH: TraxSales hardware + SaaS pricing.
- NEEDS_EXTERNAL_RESEARCH: Lot Watch pricing; Canadian install base and PIPEDA posture.
- NEEDS_EXTERNAL_RESEARCH: Car Wars per-rooftop pricing; current dealer reviews on alert fatigue (2024–2026).
- NEEDS_EXTERNAL_RESEARCH: Traffic Control CRM full feature list and pricing.

From `research/dealermine.md`:
- NEEDS_EXTERNAL_RESEARCH: current audited rooftop count and Canada/US split.
- NEEDS_EXTERNAL_RESEARCH: Service CRM and Sales CRM per-rooftop/per-seat pricing and contract terms.
- NEEDS_EXTERNAL_RESEARCH: Gartner Peer Insights / DrivingSales review counts, scores, and verbatims.
- NEEDS_EXTERNAL_RESEARCH: managed-BDC per-seat / per-appointment pricing model.
- NEEDS_EXTERNAL_RESEARCH: MORI pricing, language support (French), sales-call capability, live booking write-back scope outside DealerMine's scheduler.
- NEEDS_EXTERNAL_RESEARCH: AI Batch Texting CASL consent-workflow specifics.

From `research/autoalert.md`:
- NEEDS_EXTERNAL_RESEARCH: which patents AutoAlert actually holds.
- NEEDS_EXTERNAL_RESEARCH: actual per-rooftop monthly price ranges for dedicated equity tools.
- NEEDS_EXTERNAL_RESEARCH: whether AutoAlert's Canadian data sources include Canadian book values (e.g., Canadian Black Book) and CASL consent-state handling.
- NEEDS_EXTERNAL_RESEARCH: PureCars roadmap for AlertMiner/CXM post-acquisition.
- NEEDS_EXTERNAL_RESEARCH: automotiveMastermind current corporate-ownership wording; current Canadian availability/coverage of Mastermind conquest data.
- NEEDS_EXTERNAL_RESEARCH: feature depth of ELEAD1ONE Xchange, Dominion, CDK-bundled mining, Signal, and VINCUE if a fuller equity matrix is ever needed.

From `research/vinsolutions.md`:
- NEEDS_EXTERNAL_RESEARCH: current VinSolutions contract terms (30-day-out report conflicts with older term-commitment complaints).
- NEEDS_EXTERNAL_RESEARCH: Canadian availability of Connect Automotive Intelligence / Buying Signals and whether kbb.ca signals feed Canadian CRM records.
- NEEDS_EXTERNAL_RESEARCH: current Vinessa per-rooftop pricing and whether the GenAI tier is a separate SKU.
- NEEDS_EXTERNAL_RESEARCH: dealer satisfaction with the GenAI Vinessa generation specifically.
- NEEDS_EXTERNAL_RESEARCH: whether AMP is offered to Canadian rooftops and how it handles CASL express/implied consent.
- NEEDS_EXTERNAL_RESEARCH: whether TargetPro is still sold standalone or fully absorbed into AMP/Automotive Intelligence.

From `research/dealersocket.md`:
- NEEDS_EXTERNAL_RESEARCH: whether the 2026 CRM AI features are GA, priced separately, or Canada-available.
- NEEDS_EXTERNAL_RESEARCH: DealerSocket CASL consent depth, Quebec French support, Canadian data residency.
- NEEDS_EXTERNAL_RESEARCH: names of the remaining Radars of RevenueRadar's 11.
- NEEDS_EXTERNAL_RESEARCH: RevenueRadar per-rooftop price.
- NEEDS_EXTERNAL_RESEARCH: DealerRefresh thread 5107 specifics on RevenueRadar adoption/accuracy pain.
- NEEDS_EXTERNAL_RESEARCH: whether IDMS deal-document/compliance packs cover Canadian provinces (BC MVSA, OMVIC) at all.
- NEEDS_EXTERNAL_RESEARCH: Inventory+ Canadian market-data coverage (Canadian Black Book / CARFAX Canada equivalency).
- NEEDS_EXTERNAL_RESEARCH: DealerFire schema.org depth and French-language site support; PrecisePrice roadmap/successor status and Canadian finance-product support (weekly/bi-weekly payments).

From `research/cdk.md`:
- NEEDS_EXTERNAL_RESEARCH: reconcile the CDK/Reynolds antitrust settlement amounts across the $100M and $600M reports.
- NEEDS_EXTERNAL_RESEARCH: whether CDK CRM ships CASL-specific consent/opt-out workflows for Canadian dealers.
- NEEDS_EXTERNAL_RESEARCH: which Canadian lenders are wired into CDK eContracting.

From `research/dealercenter-dealertrack.md`:
- NEEDS_EXTERNAL_RESEARCH: exact behavior/limits of DealerCenter's AI Sales Agent (channels, escalation rules, guardrails).
- NEEDS_EXTERNAL_RESEARCH: registration/titling depth inside DealerCenter (state coverage, in-platform fees).
- NEEDS_EXTERNAL_RESEARCH: documented dealer complaints specifically about data sharing with Westlake.
- NEEDS_EXTERNAL_RESEARCH: whether DealerCenter is sold/supported for Canadian dealers at all.
- NEEDS_EXTERNAL_RESEARCH: Dealertrack Canada F&I menu depth, e-signature vendor, provincial registration workflows (e.g., ICBC in BC), and per-module fees.
- NEEDS_EXTERNAL_RESEARCH: BC-specific registration workflow vendors (ICBC broker integrations) for a future DealerOS module.

From `research/autosync-trader.md`:
- NEEDS_EXTERNAL_RESEARCH: official AutoTrader.ca dealer rate card and 2025–2026 package restructuring specifics.
- NEEDS_EXTERNAL_RESEARCH: Activix per-rooftop pricing and contract terms.
- NEEDS_EXTERNAL_RESEARCH: independent review-site sentiment on Activix and TAdvantage (2024–2026), including TAdvantage SEO performance and page speed.
- NEEDS_EXTERNAL_RESEARCH: TAdvantage tiers and whether a successor brand/version shipped after 2024.
- NEEDS_EXTERNAL_RESEARCH: TRFFK management-fee structure.
- NEEDS_EXTERNAL_RESEARCH: current MotoCommerce adoption among independent (non-franchise) used dealers.
- NEEDS_EXTERNAL_RESEARCH: Matador pricing via AutoSync; depth of Matador↔Activix data integration (shared record vs. side inbox); any AI-disclosure practices.
- NEEDS_EXTERNAL_RESEARCH: whether vAuto remains in the AutoSync bundle or has been replaced in-house (2025–2026).

From `research/ai-bdc.md`:
- NEEDS_EXTERNAL_RESEARCH: Impel confirmed Canadian installs, CASL handling, French-language conversation support.
- NEEDS_EXTERNAL_RESEARCH: Conversica CASL consent-handling defaults and Canadian reference customers.
- NEEDS_EXTERNAL_RESEARCH: Numa Canadian availability, CASL posture, bilingual voice support.
- NEEDS_EXTERNAL_RESEARCH: BDC.AI pricing tiers and billing model; independent dealer reviews of BDC.AI.
- NEEDS_EXTERNAL_RESEARCH: Podium AI BDC availability/pricing in CAD, CASL consent tooling specifics, FR-CA support.
- NEEDS_EXTERNAL_RESEARCH: AutoRaptor CASL features, Canadian lead-source integrations (Kijiji Autos, AutoTrader.ca), FR support.
- NEEDS_EXTERNAL_RESEARCH: DealersCloud pricing tiers; Canadian marketplace feed support, CASL, and GST/PST handling in its deals module.

From `research/marketplaces.md`:
- NEEDS_EXTERNAL_RESEARCH: full DemandAI feature list and rollout timing.
- NEEDS_EXTERNAL_RESEARCH: actual AutoTrader.ca Go/Smart/Pro monthly prices for a 30–75 unit independent.
- NEEDS_EXTERNAL_RESEARCH: current Kijiji dealer package tier names and monthly cost.
- NEEDS_EXTERNAL_RESEARCH: current Craigslist Canadian dealer fee status.
- NEEDS_EXTERNAL_RESEARCH: exact current country-eligibility list for Google Vehicle Ads (Canada availability).

From `research/canada-compliance.md`:
- NEEDS_EXTERNAL_RESEARCH: exact CRTC record-keeping guidance text (re-verify against primary CRTC pages before any spec is finalized).
- NEEDS_EXTERNAL_RESEARCH: full text of the Nov 19, 2025 VSA Advertising Guidelines (exact section numbers) before building a listing-compliance linter.
- NEEDS_EXTERNAL_RESEARCH: how granular Activix's consent model actually is (channel-level? expiry tracking? proof export?).
- NEEDS_EXTERNAL_RESEARCH: verify no smaller vendor ships VSA/OMVIC ad-rule linting before any "first" positioning is even drafted.

## 8. Skipped items

- SKIPPED_WITH_REASON: hands-on product teardowns, trials, or demo accounts for any vendor — requires sign-ups/vendor contact, prohibited by hard boundaries.
- SKIPPED_WITH_REASON: confirming any vendor pricing or contract terms — requires vendor quotes/contracts; all pricing herein is third-party directional only.
- SKIPPED_WITH_REASON: legal validation of the compliance-feature gaps in categories H/K (consent-expiry engine wording, ad-linter claims) — requires legal counsel review before anything ships.
- SKIPPED_WITH_REASON: feature-parity validation matrix against live competitor products — requires the dedicated DealerOS code repo and a built product; this Library repo is design-only.
- SKIPPED_WITH_REASON: any connector prototype against vendor APIs (Dealertrack Canada, marketplace feeds, ADF ingestion) — requires live APIs; connector work stays mock-mode per `CONTEXT_PACK.md`.

## Boundaries honored

- No secrets, no real API keys, no live CRM/DMS writes, no live DealerMine/TMS/marketplace integrations; all connector references are design-level, mock-mode by default, live mode gated by human approval + proof receipt.
- No dealership/customer outreach performed; no vendor contact, sign-ups, or demos; public sources only.
- No fake customer proof, no public launch claims, no "production ready" language, no compliance-certification claims, no crypto/token language; vendor metrics reported as claims, never adopted as ours.
- No "AutoAlert replacement" or feature-parity claims — prohibited per `CONTEXT_PACK.md` Section 7 until parity is real; this document is internal design input only.
- Blocked or unverifiable work is marked `SKIPPED_WITH_REASON:` / `NEEDS_EXTERNAL_RESEARCH:` rather than fabricated; anything compliance-adjacent requires legal counsel before shipping.
