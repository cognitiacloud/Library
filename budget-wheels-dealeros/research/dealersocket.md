# Research: DealerSocket / Solera

STATUS: INTERNAL — RESEARCH NOTES. Compiled 2026-07-03 from public sources.

Scope: DealerSocket (a Solera company): DealerSocket CRM (Blackbird UI), IDMS
(independent/BHPH DMS), Inventory+, DealerFire websites/digital marketing
(Engine6), PrecisePrice digital retail, RevenueRadar equity mining, Desking,
plus the Feb-2026 Solera AI investment / CRM upgrade for NADA Show 2026.
Method: 9 web searches over official vendor pages, 2024–2026 press releases,
review aggregators (G2, Capterra, TrustRadius, Software Finder, Ringlead),
and DealerRefresh threads. Vendor and forum pages blocked direct fetching
(HTTP 403 via proxy), so feature detail is sourced from search-result
extracts plus press coverage; anything not verifiable is flagged
`NEEDS_EXTERNAL_RESEARCH`.

## Products covered

### 1. DealerSocket CRM (Blackbird UI) — core CRM

**Positioning.** "A unified solution for franchise and independent auto
dealers" — CRM is the flagship, sold standalone or bundled with DMS,
inventory, websites, and digital retail. Blackbird is the modernized CRM
interface generation (role-based dashboards, built-in desking, mobile).
Solera (parent since 2021) is repositioning it as "one modern, AI-driven
customer platform for dealerships of all sizes" ahead of NADA Show 2026.

**Key features (verified from vendor page extracts + reviews):**
- **Sales floor tracking + "Quick Up"** — showroom traffic logging in the core
  package; mobile driver's-license scanner + Quick Up enter a walk-in into the
  CRM in seconds, and that record feeds directly into desking. (Closest
  analogue to our TMS traffic desk: the "up" is a first-class CRM object.)
- **Internet lead management** — lead capture/routing from OEM programs,
  marketplaces, websites; automated follow-up cadences. (Known gaps:
  Facebook/Google ad leads not reliably ingested — see weaknesses.)
- **In-app Desking** — next-generation desking runs inside the CRM; a single
  worksheet centralizes financing, leasing, incentives, and trade-in data;
  customizable workflow; deals push to DMS.
- **Configurable dashboards + checklists** — role-based, real-time views
  positioned around "sales process and accountability."
- **Mobile app** — full customer profiles, communication tools, and desking on
  the go; "tap-and-go" for upping a customer, texting, finding a vehicle.
- **2026 CRM upgrade (announced Feb 2026, debuting at NADA Show 2026):**
  - Conversational AI lead response — "respond to every lead with timely,
    dealership-branded follow-up — 24/7 and at scale."
  - Modernized email experience incl. **video-in-email** (salespeople/BDC
    record and send personalized video from within CRM) + refreshed editor.
  - Integrated call management via **Solera Call Services** — 24/7 live +
    AI-assisted phone coverage alongside internet and showroom leads.
  - Broader Solera AI stack: AI-powered service scheduling, voice assistants,
    advanced analytics, conversational AI across channels.
  - NEEDS_EXTERNAL_RESEARCH: whether these 2026 AI features are GA, priced
    separately, or Canada-available; announcement is pre-launch marketing.

**Pricing notes (public).** No published price list; third-party sites
(TrustRadius/Software Finder) put DealerSocket CRM starting around
US$750/month, customized by dealership size and modules. Multi-year contracts
with auto-renewal clauses are standard; dealers report aggressive enforcement
(at least one dealer reported being sued over an auto-renewal). No free plan.

**Strengths.**
- Breadth: CRM + DMS + inventory + websites + digital retail + equity mining
  from one vendor — one throat to choke, one data platform.
- Deep, mature desking inside the CRM (differentiator vs. lighter CRMs).
- Serves franchise AND independent dealers (most rivals pick one).
- Officially serves the United States, **Canada**, and Australia.
- Big new owner (Solera) now funding a dedicated CRM R&D program.

**Weaknesses / complaints (G2, Capterra, DealerRefresh, 2024–2026).**
- Post-Solera support collapse is the #1 theme: "support from both the CRM and
  website side has been among the worst in 20 years"; large staff cuts incl.
  veteran people; multiple CSM turnovers/year; one dealer's inventory-feed
  issue unresolved for four months; training resources reported gone.
- Performance decay: "in the last 6 months things have gotten steadily worse…
  connections so slow and search features sporadically disappearing"; app
  "frequently unresponsive or glitchy."
- Lead-ingestion gaps: Facebook/Google ad leads not always landing in the CRM.
- Complexity vs. rigidity: Blackbird called "incredibly complex, but at the
  same time, incredibly rigid"; "most users do not even scratch the surface";
  sales teams call it clunky.
- Data hygiene: creates duplicate leads instead of merging; custom reports
  "can be a pain."
- Contract lock-in: multi-year terms + auto-renewal + litigation posture.
- Ratings split: ~3.8/5 on G2 (65 reviews) vs 1.5/5 on Capterra (2 reviews —
  small n, but directionally consistent with forums).

**Canada relevance.** Marketed and sold in Canada (vendor states US, Canada,
Australia coverage). No public evidence of CASL-specific consent tooling,
OMVIC/provincial disclosure packs, or French-language UI.
NEEDS_EXTERNAL_RESEARCH: CASL consent depth, Quebec French support, Canadian
data residency.

### 2. RevenueRadar — equity mining

**Positioning.** "Equity mining tool for dealerships… turns insights into
actions for your sales and marketing teams." DealerSocket's answer to
AutoAlert; integrated into DealerSocket CRM rather than sold as a standalone
overlay. Notably, DealerSocket publicly brought RevenueRadar to Canada
(Canadian Auto World coverage), so it competes in our home market.

**Key features / mechanics (verified):**
- **11 "Radars"** — persistent queries that continuously scan the DMS/CRM
  database and send **"pings"** when a customer is "in a unique position to
  spend." Pings surface throughout the CRM (not a separate inbox).
- Named radar/alert types found in public sources:
  - **Equity alert** — positive-equity customers; generates custom upgrade
    offers with monthly-savings comparisons.
  - **Lease-end / contract-end** — lease maturity, finance payoff, contract
    end approaching.
  - **Service-to-sale** — flags high-equity/high-intent customers in the
    service drive and routes them to sales.
  - **Service-not-sold** — services here, bought elsewhere (conquest).
  - **Sold-not-serviced** — bought here, never serviced (fixed-ops recapture).
  - **Declined service** — open declined-work follow-up.
  - **Lower APR** — refinance/rate-improvement opportunity.
  - **Lease over-mileage** — early lease exit pitch.
  - NEEDS_EXTERNAL_RESEARCH: names of the remaining radars of the 11 (likely
    warranty-end / in-market / mileage-based; not verifiable from extracts).
- Works with most major third-party DMSes, not only IDMS.
- Feeds sales AND service departments plus marketing campaign lists (upgrade
  offers, equity alerts, lease-end reminders as tailored campaigns).
- Vendor pushes a "mining core vehicles" playbook — use Radars to buy back
  specific inventory the dealer needs (acquisition angle, ties to Inventory+
  sourcing).

**Pricing notes.** Not public; sold as CRM add-on (also listed on SoftwareOne
marketplace as a separate SKU). NEEDS_EXTERNAL_RESEARCH: per-rooftop price.

**Strengths.** Native CRM integration (pings appear in the workflows
salespeople already use); both sales-side and fixed-ops radars; Canada
availability.

**Weaknesses.** A DealerRefresh thread titled "DealerSocket's Revenue Radar
and the struggles…" indicates real-world adoption/accuracy pain (contents
unfetchable — NEEDS_EXTERNAL_RESEARCH: read thread 5107 for specifics).
Generic equity-mining critiques apply: ping quality depends on clean DMS data
and payoff/valuation accuracy; no public evidence of per-ping outcome
tracking or auditable reason codes.

### 3. IDMS — independent dealer management system

**Positioning.** "The premier dealer management system for independent
automotive dealers," designed specifically for independent and BHPH
(buy-here-pay-here) dealers — the product aimed squarely at our avatar
(independent used-car dealer).

**Key features (verified):**
- Web-based, mobile-capable, configurable workflows, 50+ integrations.
- Manages "the entire vehicle, sales, customer, and payment lifecycle."
- BHPH toolset: collections, delinquency tracking, loan management.
- Auto-generation of contracts, disclosures, and deal documents with built-in
  compliance checks (US-oriented).
- Bundles with Inventory+ (sourcing/pricing/appraisal), Desking (synced
  payments, trade-ins, compliance-ready forms), and DealerSocket CRM.
- 2024–2025: "next-generation DMS" refresh; TCN partnership adds omnichannel
  contact-center capabilities (relevant to BHPH collections calling).

**Pricing notes.** Not public; quote-based.

**Strengths.** One of few credible independent/BHPH DMSes from a major
vendor; end-to-end (deal docs through payments); real CRM attached.

**Weaknesses.** G2 reviews mixed; forum thread ("Independent Dealer looking at
DealerSocket's Blackbird CRM and IDMS") reflects hesitancy — easy for basic
tasks, complex-but-rigid beyond that. US-compliance-first document library.
NEEDS_EXTERNAL_RESEARCH: whether IDMS deal-document/compliance packs cover
Canadian provinces (BC MVSA, OMVIC) at all.

**Canada relevance.** IDMS marketing is US-centric (BHPH is a largely US
model); DealerSocket claims Canadian operations overall, but Canadian IDMS
fit is unproven — a wedge for us: independent Canadian dealers are
underserved by IDMS's US-first compliance assumptions.

### 4. Inventory+ — inventory management

**Positioning.** "Maximize Profit Per Day™ on every vehicle." A merchandising
+ sourcing + pricing engine built around the **Ideal Inventory Model™** —
"every lot unit has a chance to sell at a profit."

**Key features (verified):**
- Trademarked **Profit Per Day™** metric as the organizing KPI (vs. vAuto's
  turn-rate orthodoxy) — pricing/stocking decisions ranked by expected profit
  per day on lot.
- Data-driven pricing combining the dealer's own transaction history + local
  and national market data; claims up to 20% front-end gross lift.
- **Sourcing/buy-sell lists** with vehicle recommendations ("Absolute
  Sourcing," launched 2020) — tells the dealer which cars to go buy.
- New-car pricing incl. bulk handling of factory incentives/rebates across
  lots or groups (2020 launch).
- Appraisal tools with real-time market data (bundled into IDMS pitch).

**Strengths.** Profit-per-day framing resonates with independents; integrated
appraisal→pricing→merchandising loop; feeds RevenueRadar's "mining core
vehicles" acquisition play.

**Weaknesses.** Far smaller market-data footprint than vAuto/Cox; little
recent (2024–2026) public innovation news vs. the CRM side.
NEEDS_EXTERNAL_RESEARCH: Canadian market-data coverage (Canadian Black Book /
CARFAX Canada equivalency) for Inventory+ pricing.

### 5. DealerFire — websites + digital marketing (Engine6)

**Positioning.** "Award-winning responsive websites & digital marketing" for
franchise and independent dealers; the web/demand-gen arm of the suite.

**Key features (verified):**
- **Engine6** website platform — pitched as giving dealers "more control over
  their virtual presence than any other platform": geo-targeting levers, SEO
  tools, inventory display, extensive site customizations.
- Managed SEO + "award-winning automotive content" (blog/content marketing);
  vendor cites customers seeing ~300% organic-traffic lift.
- Paid search / digital advertising management; social-engagement-to-website-
  traffic programs (2025 PR push).
- Automated replies to inquiries; native compatibility with the DealerSocket
  data platform (site behavior visible to CRM).
- Third-party roundups list DealerFire plans starting ~US$1,299/month.

**Strengths.** CRM-connected website analytics; real managed-content service;
independents accepted (many website vendors are franchise-only).

**Weaknesses.** Post-Solera website-side support named specifically in the
"worst in 20 years" complaint; no public evidence of AEO/AI-overview
optimization, schema-depth guarantees, or lead-to-sale attribution loops.
NEEDS_EXTERNAL_RESEARCH: DealerFire schema.org implementation depth and
Canadian French-language site support.

### 6. PrecisePrice — digital retail

**Positioning.** "The industry's only digital retail solution that can
integrate DealerSocket Desking and push deals to your DMS" (launched 2017;
still the marketed DR product — no publicly named successor found).

**Key features (verified):**
- Online payment configuration on real vehicles: shopper sees "their actual
  payment," structured with the same math as the in-store desk.
- Deal transfers website → showroom desking → DMS (the online deal and the
  desk deal are the same object — no re-keying).
- **Save and Finish Later** — shopper texts/emails themselves a shortcode and
  resumes the deal on any device *without providing personal information*
  (deliberately low-friction, anti-lead-form design).

**Strengths.** Desk-integrated DR (payment parity between web and showroom)
is the right architecture; shortcode resume is customer-friendly.

**Weaknesses.** Little public 2024–2026 innovation news; DR category has
moved fast (Cox Accelerate My Deal, Tekion, etc.). NEEDS_EXTERNAL_RESEARCH:
current PrecisePrice roadmap/successor status under Solera and Canadian
finance-product support (weekly/bi-weekly payments common in Canada).

## What DealerOS should copy conceptually

1. **Pings inside the workflow, not a separate tool.** RevenueRadar's best
   idea: equity alerts surface *throughout the CRM* where salespeople already
   work. Our Module 7 engine must render hot scores/reason codes on Customer
   360, the traffic desk board, and the service bridge — never only in a
   standalone "mining" screen.
2. **Named, legible radar taxonomy.** "11 Radars" is great productization:
   equity, lease-end, service-not-sold, sold-not-serviced, declined service,
   lower APR, over-mileage. Ship our equity engine as a named, countable set
   of opportunity types with per-type reporting.
3. **Quick Up + license-scan showroom intake.** DL-scan → CRM record → desking
   hand-off is the bar for our TMS traffic desk: a walk-in becomes a tracked
   traffic event in under 30 seconds and flows to the deal draft, no re-entry.
4. **Desking inside the CRM, one worksheet.** Financing, leasing, incentives,
   trade-in in a single in-app worksheet feeding the deal draft (Module 5);
   PrecisePrice-style payment parity between website DR and the desk should
   extend to our Demand Gen VDPs.
5. **"Save and Finish Later" shortcode resume.** Low-friction, no-PII-required
   deal resumption is a conversion and privacy win — fits consent-first design.
6. **Profit Per Day™-style single KPI for inventory.** One economic metric
   ordering every stocking/pricing/recon decision; pair with days-in-inventory
   and merchandising score in Module 3.
7. **Mining-to-acquisition loop.** "Mine core vehicles" — equity pings buy
   back exactly the used inventory you need — connects Module 7 to Module 3.
8. **One-vendor breadth for independents.** IDMS proves independents will buy
   CRM+DMS+inventory+websites from one vendor. Our all-in-one thesis is
   validated; execution (support, speed) is where they fail.

## What DealerOS should do better

1. **Support and speed as product.** The loudest post-Solera complaint is
   collapsed support and a slowing app. Counter with published support SLAs,
   in-app status page, tenant-visible incident log (Cognitia events), and
   performance budgets in build packets.
2. **No lead left behind — provably.** Their Facebook/Google ad-lead ingestion
   gaps are fatal for a demand-gen-led dealer. Every lead emits a
   `lead_received` receipt with source/campaign; a daily reconciliation report
   compares CRM counts vs. ad-platform counts. "Prove every lead arrived."
3. **Simple by default, deep by permission.** "Incredibly complex, but
   incredibly rigid" is complexity without configurability. Ship opinionated
   role-based defaults with progressive disclosure and per-tenant workflow
   config (Module 1), not a monolithic process editor.
4. **No multi-year auto-renew traps.** Month-to-month or annual with
   plain-language renewal notices. Against a vendor known to sue dealers over
   auto-renewals, contract fairness is a sales weapon for independents.
5. **Duplicate handling done right.** They create duplicate leads instead of
   merging; our Customer 360 has duplicate detection with a
   `duplicate_detected` receipt and human-approved merges.
6. **Canada-first compliance.** IDMS's compliance doc engine is US-oriented.
   We ship CASL consent capture/expiry (24-month implied-consent windows),
   PIPEDA/PIPA-BC data-rights flows, BC MVSA/OMVIC disclosure awareness, and
   weekly/bi-weekly payment desking — none publicly shown by DealerSocket.
7. **Equity pings with receipts and outcomes.** Their pings are
   fire-and-forget; ours carry reason codes, recommended pitch, vehicle match,
   human approval, and result tracking — a ping→appointment→sold funnel per
   radar type, not just "pings sent."
8. **AI that is auditable, not just announced.** Solera's 2026 conversational
   AI push is pre-launch marketing with no visible governance story. Our AI
   BDC ships with approval gates, redaction, AI disclosure, and a model-usage
   ledger from day one (Modules 6, 13, 14).

## How Cognitia proof receipts make our version harder to copy

- **Every ping is a receipt.** `equity_score_generated` receipts carry reason
  codes, data refs, and payload hash. Cloning our radar taxonomy doesn't clone
  the auditable score → draft → approval → outcome trail without rebuilding an
  event-sourced core — a multi-year replatform for a 20-year-old CRM codebase.
- **Lead-ingestion proof.** `lead_received` + `connector_sync_completed` /
  `connector_sync_failed` receipts answer the exact failure mode DealerSocket
  users complain about (silent ad-lead loss).
- **AI with a paper trail.** Their conversational AI answers leads; ours emits
  `ai_reply_drafted` → `human_approval_granted` → `followup_sent` chains with
  consent basis per message. Post-Solera trust damage makes "prove what the
  vendor's AI did" a resonant counter-position.
- **Vendor-accountability mirror.** The same ledger that audits agents audits
  us: incident and sync-failure receipts are tenant-visible, turning their #1
  weakness (opaque support) into our moat. Tenant-level events (settings,
  connector enable/disable, live-mode approvals) are receipted too — the
  anti-lock-in posture is structural, not contractual.

## How Demandara integration makes our version more revenue-native

- **Closed attribution loop DealerFire lacks.** DealerFire stops at the lead
  form; Demandara pushes leads via `POST /api/demandara/leads` and reads sale
  outcomes back via `GET /api/demandara/outcomes` and `/revenue-attribution` —
  campaigns scored on sold units and gross, not sessions or "300% organic."
- **Radar pings become campaigns automatically.** RevenueRadar hands a list to
  the dealer's marketing team; DealerOS hands equity segments to Demandara
  (`POST /api/demandara/campaigns`), which generates the upgrade-offer
  campaign, follow-up sequence, and appointment drafts — with proof receipts —
  closing the mine→market→book loop.
- **Sales Closer beats video-in-email.** Their 2026 email refresh adds
  video-in-email; our Sales Closer runs governed lead→appointment→deal
  workflows with `appointment_drafted`/`appointment_confirmed` receipts and
  booked-appointment attribution — engagement features vs. a revenue workflow.
- **Monthly proof-backed marketing report.** `GET /api/demandara/proof-report`
  productizes what every dealer forum asks: "what did this vendor actually
  make me?" — a report their web, CRM, and mining products can't generate
  because they don't share an outcome ledger.
- **Website behavior as a radar input.** UTM capture and site behavior from
  our Demand Gen engine feed Module 7 scoring — equity pings are demand-aware,
  where RevenueRadar mines DMS history only.

## Sources

- [DealerSocket home — Dealership Management Solutions](https://dealersocket.com/)
- [DealerSocket CRM solutions page](https://dealersocket.com/solutions/crm-software/)
- [DealerSocket CRM product page](https://dealersocket.com/products/crm/)
- [DealerSocket Desking product page](https://dealersocket.com/products/crm/sales/desking/)
- [Solera: Landmark AI Investment and Major DealerSocket CRM Upgrade Ahead of NADA Show 2026 (Feb 3, 2026)](https://www.solera.com/blog/2026/02/03/solera-announces-landmark-ai-investment-and-major-dealersocket-crm-upgrade-ahead-of-nada-show-2026/)
- [GlobeNewswire: same announcement (Feb 4, 2026)](https://www.globenewswire.com/news-release/2026/02/04/3231866/0/en/solera-announces-landmark-ai-investment-and-major-dealersocket-crm-upgrade-ahead-of-nada-show-2026.html)
- [DealerSocket on dealer.solera.com](https://www.dealer.solera.com/products/dealersocket/)
- [RevenueRadar product page](https://dealersocket.com/products/automotive-equity-mining-tool-revenueradar/)
- [Revenue Radar on dealer.solera.com](https://www.dealer.solera.com/products/dealersocket/revenue-radar/)
- [DealerSocket equity mining solutions page](https://dealersocket.com/solutions/equity-mining/)
- [DealerSocket: Mining Core Vehicles with Revenue Radar](https://dealersocket.com/mining-core-vehicles/)
- [Auto Dealer Today: DealerSocket Launches Advanced Data-Mining Tool](https://www.autodealertodaymagazine.com/news/dealersocket-launches-advanced-data-mining-tool)
- [Canadian Auto World: DealerSocket brings RevenueRadar to Canada](http://www.canadianautoworld.ca/marketing-e-commerce/dealersocket-brings-revenueradar-to-canada)
- [SoftwareOne Marketplace: DealerSocket RevenueRadar SKU](https://platform.softwareone.com/product/dealersocket-revenueradar/PCP-2869-5685)
- [IDMS product page](https://dealersocket.com/products/idms/)
- [DealerSocket independent DMS / BHPH solutions page](https://dealersocket.com/solutions/dms-independent/)
- [TCN + DealerSocket partnership press release](https://www.tcn.com/newsroom/press-releases/tcn-dealersocket-announce-new-partnership-advancing-dealersockets-next-generation-dealer-management-system/)
- [Dealer News Today: DealerSocket updates IDMS](https://www.dealernewstoday.com/dealersocket-updates-independent-dms-platform-idms/)
- [Inventory+ product page](https://dealersocket.com/products/inventory-management/)
- [BusinessWire: DealerSocket launches New Car Pricing and Absolute Sourcing for Inventory+](https://www.businesswire.com/news/home/20200204005863/en/DealerSocket-Launches-New-Car-Pricing-and-Absolute-Sourcing-for-Its-Inventory)
- [PrecisePrice / digital retail product page](https://dealersocket.com/products/digital-retail/)
- [PRNewswire: DealerSocket launches Precise Price retailing tool](https://www.prnewswire.com/news-releases/dealersocket-launches-precise-price-retailing-tool-putting-customers-at-center-of-deal-300398441.html)
- [DealerFire.com](https://www.dealerfire.com/)
- [DealerFire product page on dealersocket.com](https://dealersocket.com/products/dealerfire/)
- [PRNewswire: DealerFire social-to-website traffic strategies](https://www.prnewswire.com/news-releases/dealerfire-helps-dealerships-turn-social-media-engagement-into-website-traffic-with-proven-strategies-302730292.html)
- [DealerRefresh: "Is anyone using DealerSocket? Are you happy with it?"](https://forum.dealerrefresh.com/threads/is-anyone-using-dealer-socket-are-you-happy-with-it.10564/)
- [DealerRefresh: "Independent Dealer looking at DealerSocket's Blackbird CRM and IDMS"](https://forum.dealerrefresh.com/threads/independent-dealer-looking-at-dealersockets-blackbird-crm-and-idms.5198/)
- [DealerRefresh: "Thinking of moving everything to DealerSocket…" (page 2)](https://forum.dealerrefresh.com/threads/thinking-of-moving-everything-to-dealersocket-talk-me-out-of-it-or-confirm-my-thinking.7726/page-2)
- [DealerRefresh: "DealerSocket's Revenue Radar and the struggles…"](https://forum.dealerrefresh.com/threads/dealersockets-revenue-radar-and-the-struggles.5107/)
- [G2: DealerSocket reviews](https://www.g2.com/products/dealersocket/reviews)
- [G2: IDMS reviews](https://www.g2.com/products/idms/reviews)
- [Capterra: DealerSocket CRM listing](https://www.capterra.com/p/10002712/DealerSocket-CRM/)
- [TrustRadius: DealerSocket CRM pricing](https://www.trustradius.com/products/dealersocket-crm/pricing)
- [Software Finder: DealerSocket CRM pricing & features](https://softwarefinder.com/crm/dealersocket-crm)
- [Ringlead Automotive: DealerSocket Review 2026](https://www.ringlead.ca/blog/compare/dealersocket-review-2026/)

## Boundaries honored

- Public marketing/product info only; no signups, demos, vendor contact,
  or outreach. No fabricated features: unverifiable items are marked
  `NEEDS_EXTERNAL_RESEARCH`.
- Internal research notes only — no public claims authorized; nothing here is
  a claim of feature parity or a "DealerSocket replacement" statement.
- No live CRM/DMS integration implied; connector references are design-level
  (mock-default) per CONTEXT_PACK.md.
