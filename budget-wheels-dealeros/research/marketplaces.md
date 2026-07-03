# Research: Marketplace / listing ecosystems

STATUS: INTERNAL — RESEARCH NOTES. Compiled 2026-07-03 from public sources.

Scope: AutoTrader.ca, CarGurus, Cars.com, Facebook Marketplace vehicle listings,
Kijiji Autos, Craigslist (marginal in Canada), Google Vehicle Ads / Google
Business Profile, inventory feed formats and syndication mechanics, lead
delivery mechanics, merchandising quality factors, pricing intelligence tools.
Purpose: inform DealerOS Module 3 (Inventory CRM / listing completeness +
merchandising score + AI listing assistant), Module 4 (TMS traffic desk source
tracking), Module 9 (Website + Demand Gen), Module 12 (connector registry
listing assistants + inventory feeds).

Research method note: several vendor pages (cardog.app, canadianautodealer.ca,
developers.google.com, help.kijiji.ca) returned 403 to direct fetch through the
research proxy; findings for those rely on search-result extracts and are
flagged where thin.

---

## Products covered

### 1. AutoTrader.ca (TRADER Corporation, Canada)

**Positioning.** Canada's dominant vehicle marketplace ("Canada's largest"),
owned by TRADER Corporation (Toronto). For an independent used-car dealer in
BC, this is the single most important paid listing channel. TRADER is also a
dealer-software conglomerate, not just a marketplace: its **AutoSync** suite
bundles vAuto (pricing), EasyDeal (desking), Xtime (service), Motoinsight
(digital retail), Activix (CRM), TAdvantage (dealer websites), and TRFFK
(digital advertising), plus the Dealertrack Canada acquisition — 2,500+ dealers
subscribed, making TRADER Canada's largest dealer/OEM software provider. So
AutoTrader.ca is simultaneously a listing channel DealerOS must feed and a
platform competitor whose strategy is to own the whole dealer stack.

**Key features (verified from public sources).**
- Dealer listing packages recently simplified into three tiers — **Go, Smart,
  Pro** — scaling marketplace visibility/performance by dealership need.
- March 2026: announced an **AI-driven marketplace overhaul** with an
  intelligence layer called **DemandAI** that reportedly analyzes 50+ vehicle
  attributes and 30+ shopper-intent signals to align listings with shopper
  intent and improve dealer lead quality (Canadian Auto Dealer coverage; page
  403'd on direct fetch — NEEDS_EXTERNAL_RESEARCH: full DemandAI feature list
  and rollout timing).
- US sibling (Cox Automotive's Autotrader/b2b.autotrader.com — different
  company, similar mechanics) sells: **Spotlight** sponsored listings, **Managed
  Chat and Text** (24/7 shopper engagement so "no leads go unanswered"),
  **At Home Services** badges (home delivery, virtual walkaround, at-home test
  drive), and Connect Core / Connect Advanced franchise packages with
  "data-driven insights on which vehicles attract the most interest." Treat
  these as the mechanics pattern; do not assume identical AutoTrader.ca naming.

**Pricing notes.** Not published; sold as monthly subscription tiers by rep.
Third-party benchmark content (cardog.app, US-adjacent) puts marketplace CPL
for AutoTrader-class platforms at roughly $130–175/lead-equivalent, "pricing
becoming more aggressive 2024–2026." NEEDS_EXTERNAL_RESEARCH: actual
AutoTrader.ca Go/Smart/Pro monthly prices for a 30–75 unit independent.

**Strengths.** Largest Canadian buyer audience; Canadian data (kms, CAD,
provincial taxes, CARFAX Canada ecosystem); one vendor can supply listings +
website + CRM + desking; adding AI intent-matching at the marketplace layer.

**Weaknesses / complaints.** Cost creep and rep-driven opaque pricing; dealers
in community forums (DealerRefresh "What do you LOVE or HATE about CarGurus,
AutoTrader, Cars.com") report paying for unreliable vendor-defined metrics
(VDP views, "engagements") rather than outcomes; conflict of interest — the
marketplace also sells the software that measures the marketplace; independent
dealers get less attention than franchise groups.

**Canada relevance: maximum.** This is the anchor integration target for the
DealerOS listing-syndication connector and the anchor comparison for
proof-backed lead attribution.

### 2. CarGurus (incl. CarGurus Canada)

**Positioning.** Search-engine-style marketplace whose moat is algorithmic
price transparency: every listing is scored against **IMV (Instant Market
Value)** — an estimated fair retail price recomputed daily from comparable
listings using make/model/trim/year/mileage/options/history — and labeled with
a **Deal Rating**: Great / Good / Fair / High / Overpriced. Dealer reputation
(review score) also feeds ranking. Operates CarGurus.ca in Canada.

**Key features.**
- Deal Rating badge on every VDP/SRP tile; ranking historically favored
  best-deal-first; **Q3 2025: default sort on new-car listings changed to
  "Best Match"**, which weights price, photo count/quality, listing age, and
  dealer rating (per CarGurus dealer blog product updates Q2'25/Q4'25).
- Paid tiers (Listings / Listings Plus / Featured-style upsells) buy placement
  and branding; sponsored units appear above organic results even with worse
  deal ratings — a documented shopper complaint.
- Dealer dashboard exposes lead volume, connections (calls/emails/texts), and
  pricing-competitiveness analytics.

**Pricing notes.** Subscription priced per rooftop based on inventory size and
*lead volume the algorithm attributes to CarGurus*. Community benchmark:
$80–120 CPL-equivalent. Documented dealer case: a **602% rate increase (from
$795 to ~$5,000/month)** justified by algorithm-attributed lead volume, much of
it low-quality out-of-state inquiries on cheap units (DealerRefresh threads).

**Strengths.** Deal Rating is the single most effective consumer-trust
merchandising device in the category; strong SEO; genuine price-elastic lead
volume for aggressively priced independents.

**Weaknesses / complaints.** The "price suppression tax": dealers must
underprice to earn Great/Good badges, then pay rising subscription fees on the
volume that pricing produced. Algorithm penalizes well-reconditioned or
certified units that justifiably price above IMV; no way to feed recon
evidence into the rating. Rating-bias complaints (same car rated better on a
dealer listing than a cheaper private listing). Consumer-side complaints about
review moderation opacity and stale/duplicate listings. Renewal-time price
hikes are a recurring community grievance.

**Canada relevance: high.** CarGurus.ca is the #2-ish national marketplace for
used inventory; its deal-rating logic pressures BC independents' pricing daily.

### 3. Cars.com / Cars Commerce (incl. Dealer Inspire)

**Positioning.** US marketplace that pivoted to a "platform" story — Cars
Commerce = marketplace (Cars.com) + dealer websites (Dealer Inspire) + trade
appraisal (Accu-Trade) + media. Limited Canadian marketplace presence; studied
here mainly as the best public example of marketplace + website + reporting
convergence.

**Key features (Jan 2026 launch announcements).**
- **AI inventory video**: auto-generates VIN-specific video ads for the full
  inventory; claims 2x lift in website lead conversion vs. traditional video.
- **Market Area Expansion**: onsite product exposing a dealer's inventory
  beyond its local market (they cite 80% of buyers willing to buy out-of-market).
- **Cars Commerce Hub Reporting**: single-sign-on cross-product reporting
  console — one place for marketplace + website + media performance.
- Dealer Inspire websites: personalization, fast inventory search, claimed 55%
  lower cost per lead conversion vs. other digital providers.

**Pricing notes.** Not public; benchmark content puts Cars.com CPL at $130–175.

**Strengths.** Cleanest public articulation of VIN-level merchandising
automation (video per VIN) and unified cross-channel reporting.

**Weaknesses / complaints.** US-centric; all performance claims are
vendor-self-reported with no dealer-verifiable audit trail (relevant gap for
our proof positioning); classic third-party complaints about lead duplication
with the dealer's own website apply.

**Canada relevance: low-medium** (patterns matter; the marketplace itself
mostly doesn't).

### 4. Facebook Marketplace vehicle listings (Meta)

**Positioning.** Free-traffic firehose turned compliance minefield. Since
**end of January 2023, dealers cannot post vehicle listings from Business
Pages**; the sanctioned dealer path is paid **Automotive Inventory Ads**
(catalog-feed ads), while organic Marketplace vehicle listings are effectively
personal-account territory.

**Mechanics and rules that matter (from compliance guides, 2025–2026).**
- Listings must show the true asking price; repeated fake prices ($1/$100/$500)
  → permanent ban.
- Vehicles must be removed or marked sold within 24 hours of sale; 3+
  "unavailable inventory" complaints → account review / potential ban.
- Enforcement tightened ~May 2026: first spam violation now draws an instant
  30-day ban; second within 90 days is permanent (per CARVID compliance guide).
- Gray-market workaround economy: services that post dealer inventory through
  networks of approved/personal accounts so units "appear like any other
  listing." High account-loss risk.
- Lead delivery: Messenger conversations (organic) or lead forms/Messenger
  (paid AIA); no ADF email standard — dealers need Messenger-to-CRM capture.

**Pricing notes.** Organic is free (where permitted); Automotive Inventory Ads
are auction-priced Meta ads requiring a catalog feed.

**Strengths.** For sub-$15k independent inventory, Marketplace historically
produced huge volumes of local, price-sensitive leads at near-zero cost.

**Weaknesses / complaints.** Policy volatility; ban risk concentrated on
exactly the independent-dealer behavior (salesperson personal accounts) that
produces the leads; Messenger leads are unstructured, unattributed, and easily
lost — a real traffic-desk hole DealerOS can fix legitimately (capture,
consent, SLA timers, receipts) without violating posting policy.

**Canada relevance: high** for independents; same global policy applies.

### 5. Kijiji Autos (Kijiji, Canada)

**Positioning.** Canada's classifieds giant's dedicated auto vertical; the #2
organic channel for BC independents after AutoTrader.ca and FB Marketplace.

**Key features (from Kijiji help/business pages).**
- **Dealer subscription program** triggers at >15 vehicle listings/month; three
  package tiers (names/prices not public — NEEDS_EXTERNAL_RESEARCH: current
  tier names and monthly cost).
- One feed upload publishes to both classic Kijiji and Kijiji Autos.
- Auto **bump after 30 days** plus placement in the **Top Ad** section on
  provincial searches.
- Branded dealer page (logo, contact info, all live listings) and **free
  clickable website links** on every ad (rare — most marketplaces strip links).
- **Price analysis tool powered by CARFAX Canada** — listings get a price
  badge/analysis vs. Canadian market data (Kijiji's answer to CarGurus deal
  ratings).
- Dedicated account manager, email/phone support, dealer webinars, DealerTalk
  conference.
- Lead delivery: email leads, phone calls, and on-platform chat/messages.

**Strengths.** Real Canadian reach at lower cost than AutoTrader.ca; dual-site
syndication from one feed; outbound website links help dealer SEO/attribution.

**Weaknesses / complaints.** Weaker shopper tooling and intent data than
AutoTrader/CarGurus; leads skew price-shopper; less analytics depth for
dealers; brand-page merchandising is basic.

**Canada relevance: maximum** (Canada-only product).

### 6. Craigslist (marginal, noted for completeness)

US-centric; in Canada, Kijiji and FB Marketplace absorbed this demand years
ago. Craigslist charges dealers a per-listing fee in US "cars+trucks by
dealer" categories (US$5/listing historically). No feed API; posting tools are
scrapers/automation of terms-of-service-questionable legality.
NEEDS_EXTERNAL_RESEARCH: current Canadian dealer fee status — not verified in
this pass. Recommendation: exclude from V1 syndication targets; revisit only
on tenant demand.

### 7. Google Vehicle Ads / Google Business Profile vehicle listings

**Positioning.** Google's dealer inventory surfaces. Two distinct things,
often confused:
1. **Vehicle Ads** — paid Performance Max-style ads fed from a Merchant Center
   vehicle feed, shown on Search with photo/price/dealer name.
2. **Free "Vehicles for Sale" listings on Business Profiles** — the organic
   surface, which **Google deprecated on November 12, 2025** (SearchLab
   Digital; DealerRefresh thread "vehicle listings disappearing from Google
   Business Profiles"). Free-listing distribution now flows through Search
   surfaces rather than the GBP inventory tab.

**Feed mechanics (verified via Google developer/Merchant Center docs
extracts).**
- Format: CSV or TSV (optionally ZIP/GZ); single file containing the *entire*
  inventory for all rooftops; vehicles absent from an upload are dropped from
  Google within hours.
- Recommended refresh cadence: **every 4 hours**.
- Required fields: VIN, store_code, dealership_name, dealership_address,
  price, condition (new/used), make, model, trim, year; mileage required for
  used. Optional: image_link, body_style, vehicle_option, fuel, engine,
  transmission, color, vehicle_history_report_link.
- Feed price and on-page structured data must **exactly match** the VDP price.
- **Oct 28, 2025 "Dishonest Pricing Practices" policy**: advertised price must
  be the real transactable price — no hidden-fee games. Enforcement kills
  listings/accounts.
- Onboarding is typically via an **authorized feed provider** (website/feed
  vendors); vehicles need VIN + price + at least one image to publish.
- NEEDS_EXTERNAL_RESEARCH: exact current country eligibility list for Vehicle
  Ads (Canada availability widely reported by agencies but the Google docs
  page 403'd on direct fetch in this pass).

**Strengths.** Highest-intent channel per impression; feed spec is the de
facto reference schema for a clean inventory export.

**Weaknesses.** Whiplash on organic surfaces (GBP deprecation stranded dealers
who relied on free listings); strict disapproval regime punishes sloppy feeds
and price mismatches — which is precisely a data-quality problem DealerOS can
own.

**Canada relevance: high** (Search + GBP matter everywhere; verify Vehicle Ads
eligibility as above).

### 8. Cross-cutting: feed formats, lead delivery, pricing intelligence

- **Inventory syndication reality:** overwhelmingly **FTP + CSV**, some flat
  XML; every marketplace has its own column dialect; vendors like HomeNet,
  vAuto, Dealer.com, AutoManager, Frazer, DealerCenter act as hub-and-spoke
  syndicators. Photo hosting/ordering is part of the feed contract.
- **Lead delivery standard:** **ADF/XML** (Auto-lead Data Format) emailed to a
  CRM address remains the industry lead interchange format (adfxml.info);
  it's ancient, error handling is specified but essentially never implemented
  correctly, and marketplaces differ in how much source/campaign metadata they
  populate. Marketplace chat/text leads often bypass ADF entirely.
- **Pricing intelligence tools dealers actually use:** vAuto **Provision**
  (Velocity method: market days supply, price-to-market %, days-in-inventory
  discipline) and **ProfitTime GPS** (per-VIN investment-value scoring —
  Platinum/Gold/Silver/Bronze — recommending what to pay and how to price);
  **Lotlinx** (VIN-level risk prediction steering ad dollars to at-risk units;
  "LotGPT" chat exposes competitor days-on-lot and sell-down rates);
  Stockwave (sourcing), Accu-Trade (appraisal). Community rule of thumb: after
  day ~30–35 on lot, each additional day costs roughly **$35/day in net
  profit**.
- **Merchandising quality factors that drive marketplace rank/conversion**
  (consistent across CarGurus Best Match factors, Autotrader/Cars guidance):
  price competitiveness vs. market value, photo count and quality (real photos
  beat stockers), listing freshness/age, completeness of trim/options data,
  vehicle history report attached, dealer review rating, response time to
  leads. These are exactly the inputs DealerOS's listing completeness score
  and merchandising score must formalize.
- **Lead economics benchmarks (US-skewed, directional):** Cars.com and
  Autotrader $130–175/lead; CarGurus $80–120; TrueCar $250–400. One analysis
  shows Autotrader-sourced leads carrying ~$137 average gross vs. ~$80 for
  CarGurus (+71%) — i.e., CPL alone is a misleading metric without
  gross-per-lead and close-rate attribution, which almost no independent can
  compute today.

---

## What DealerOS should copy conceptually

1. **Deal-rating psychology (CarGurus IMV)** — a per-VIN market-position score
   with plain-language labels. DealerOS Inventory CRM should compute and show
   "how every marketplace algorithm will see this car" *before* the listing
   goes live: predicted deal rating, price-to-market %, photo score.
2. **Best Match ranking factors as a checklist (CarGurus Q3'25)** — price,
   photos, listing age, dealer rating. Make the merchandising score literally
   decompose into the factors marketplaces rank on, with per-factor fixes.
3. **One feed, many surfaces (Kijiji dual-publish; Google feed spec)** — a
   single canonical inventory record exporting to per-marketplace dialects
   (AutoTrader.ca, Kijiji CSV, Google Merchant CSV/TSV, Meta catalog). Google's
   required-field list is the baseline schema; refresh every 4 hours; full
   snapshot semantics (absent = delisted).
4. **VIN-level merchandising automation (Cars.com AI video; Lotlinx VIN
   risk)** — generate listing copy, photo QA, and (later) video per VIN, and
   direct attention/spend to at-risk aging units, not blanket campaigns.
5. **Unified cross-channel reporting console (Cars Commerce Hub)** — one
   report that shows every listing channel's traffic → lead → appointment →
   sold chain per VIN and per source.
6. **Aging-cost framing (vAuto/Lotpop)** — surface "every day past day 30
   costs ~$35" style dollarized urgency in the traffic desk and inventory
   views, tied to reason codes.
7. **Compliance guardrails as product (Meta rules, Google Dishonest Pricing
   policy)** — mark-sold-within-24h automation, price-consistency checks
   between feed / VDP / marketplace, ban-risk lint warnings before publishing.
8. **CARFAX-anchored price trust (Kijiji)** — attach Canadian-market price
   context and vehicle-history links to every listing artifact.

## What DealerOS should do better

1. **Outcome-attributed CPL, not vendor-attributed CPL.** Marketplaces grade
   their own homework (the CarGurus 602% increase was justified by leads *it*
   counted). DealerOS's TMS traffic desk + lead pipeline can compute per-source
   cost-per-*sold* and gross-per-lead from the dealer's own data, giving the
   dealer a negotiating weapon at renewal time. No marketplace will ever build
   this honestly.
2. **A recon-evidence answer to IMV.** CarGurus can't see reconditioning.
   DealerOS holds inspection refs, Carfax refs, and disclosure data — generate
   a "why this price" evidence block for VDPs and lead replies that justifies
   above-IMV pricing instead of forcing price suppression.
3. **Structured capture of unstructured marketplace leads.** Messenger/Kijiji
   chat leads die in inboxes. The AI BDC + traffic desk should ingest,
   classify, consent-stamp, SLA-time, and receipt every marketplace
   conversation — the single biggest lead-leak for independents.
4. **Feed hygiene as a first-class job.** Detect price mismatches, missing
   required fields, stale photos, sold-but-listed units *before* Google/Meta
   disapprove or ban. Marketplaces punish these errors; nobody helps the
   30-car independent prevent them.
5. **Canada-first data semantics.** Kilometres, CAD, provincial tax/fee
   disclosure norms, CARFAX Canada, BC-specific (VSA-regulated) advertising
   language — US-built tools consistently get this wrong.
6. **Independent-dealer economics.** Every incumbent's best tooling (vAuto
   ProfitTime, Cars Commerce suite) is priced and designed for franchise
   groups. DealerOS packages the same concepts (per-VIN pricing intelligence,
   merchandising scoring, channel ROI) at independent scale.
7. **Vendor-neutrality.** TRADER owns marketplace + website + CRM + desking in
   Canada; its analytics will never indict its own marketplace. DealerOS is
   structurally on the dealer's side of that conflict.

## How Cognitia proof receipts make our version harder to copy

- Every marketplace lead ingested emits `lead_received` with source, channel,
  payload hash, and timestamp — creating a tamper-evident, dealer-owned record
  of what each marketplace actually delivered (volume, duplication, quality),
  independent of the vendor's dashboard. Renewal negotiations run on receipts,
  not vendor analytics.
- `inventory_context_used` + `ai_reply_drafted` + `human_approval_granted`
  receipts on every AI-assisted marketplace reply create the compliance trail
  Meta/Google policy regimes implicitly demand (true price quoted, availability
  accurate, consent basis recorded) — a defensible answer to the ban-risk era.
- Listing publishes/updates through connectors emit `connector_sync_completed`
  / `connector_sync_failed` receipts with payload hashes, so "the feed said
  $12,900 at 09:00" is provable when a marketplace disapproves a listing or a
  buyer disputes a price.
- `sold_marked` + `campaign_attributed` receipts close the loop from a
  marketplace lead to a delivered vehicle, producing the per-source
  cost-per-sold report as *proof*, not claim. Competitors can copy a dashboard;
  they can't retroactively copy an audit ledger the dealer already trusts, and
  a marketplace-owned vendor (TRADER, Cars Commerce) has a structural conflict
  of interest in ever offering one.

## How Demandara integration makes our version more revenue-native

- Marketplace leads flow through `POST /api/demandara/leads` with source and
  campaign metadata intact, so third-party channels sit in the same
  lead-to-sale attribution model (`GET /api/demandara/revenue-attribution`) as
  the dealer's own website and campaigns — one ROI table across AutoTrader.ca,
  Kijiji, FB Marketplace, Google, and organic.
- Demandara's demand-gen engine turns marketplace weaknesses into owned
  assets: the same canonical VIN record that feeds marketplaces also generates
  SEO-ready VDPs, AEO answer blocks, and schema.org Vehicle markup on the
  dealer's own site — shifting mix from $130/lead rented traffic to owned
  traffic over time, with the attribution report proving the shift.
- Sales Closer works marketplace leads with governed follow-up (reply drafts,
  appointment drafts, human approval), so slow marketplace lead response — the
  #1 conversion killer marketplaces themselves sell Managed Chat to fix — is
  handled natively instead of via another vendor add-on.
- Monthly proof-backed marketing reports (`GET /api/demandara/proof-report`)
  give the dealer a receipt-backed answer to "should I renew Go/Smart/Pro, cut
  Kijiji, or move budget to Vehicle Ads?" — making DealerOS the system that
  allocates marketplace spend, which is the most defensible seat in the stack.

## Sources

- [Cardog: AutoTrader Canada Pricing 2025](https://cardog.app/blog/autotrader-canada-pricing)
- [Canadian Auto Dealer: AutoTrader unveils AI-driven marketplace overhaul (Mar 2026)](https://canadianautodealer.ca/2026/03/autotrader-unveils-ai-driven-marketplace-overhaul/)
- [Autotrader B2B: Independent dealer advertising solutions (US)](https://b2b.autotrader.com/dealer-marketing/independent-solutions/advertising/)
- [Autotrader B2B: Vehicle listings features (US)](https://b2b.autotrader.com/dealer-marketing/vehicle-listings/features/)
- [TRADER Corporation](https://tradercorporation.com/) and [AutoSync](https://tradercorporation.com/our-brands/dealer-software/autosync/) and [TAdvantage](https://tradercorporation.com/our-brands/dealer-software/autosync/tadvantage/)
- [Canadian Auto Dealer: TRADER launches AutoSync (2022)](https://canadianautodealer.ca/2022/06/trader-launches-autosync-to-integrate-dealer-software-stacks/)
- [TRADER acquires Dealertrack Canada](https://go.trader.ca/trader-corporation-acquires-dealertrack-canada/)
- [CarGurus Help: What is IMV?](https://cargurus.helpscoutdocs.com/article/10-what-is-imv)
- [CarGurus IMV one-pager (PDF)](https://assets.ctfassets.net/0czyc7nlfvzo/4f2pymo70GTJ6EqnoMB7GO/d50c19b3b16a83f71e4b7e35075f46c3/CarGurus-IMV-one-pager.pdf)
- [CarGurus Dealer blog: Q2'25 product updates](https://dealers.cargurus.com/blog/key-product-updates-from-q225) and [Q4'25 product updates](https://dealers.cargurus.com/blog/key-product-updates-from-q425)
- [Cardog: How CarGurus works — pricing algorithm explained](https://cardog.app/blog/how-cargurus-works)
- [DealerRefresh: Cost per lead on CarGurus?](https://forum.dealerrefresh.com/threads/cost-per-lead-on-cargurus.10079/)
- [DealerRefresh: Community Review — CarGurus](https://forum.dealerrefresh.com/threads/community-review-cargurus.11704/)
- [DealerRefresh: CarGurus price increases thread](https://forum.dealerrefresh.com/threads/cargurus-might-be-coming-for-you-soon-price-increases.7224/)
- [DealerRefresh: What do you LOVE or HATE about CarGurus, AutoTrader, Cars.com etc.?](https://forum.dealerrefresh.com/threads/what-do-you-love-or-hate-about-cargurus-autotrader-cars-com-etc.6911/)
- [SmartCustomer: CarGurus consumer reviews](https://www.smartcustomer.com/reviews/cargurus.com)
- [Cars.com press release: new dealer solutions (Jan 2026)](https://investor.cars.com/2026-01-29-Cars-com-Launches-Powerful-New-Solutions,-Helping-Dealers-Turn-Smarter-Technology-into-Real-Profit)
- [Cars Commerce: Dealer Inspire](https://www.carscommerce.inc/dealer-inspire/)
- [TXC Auto: Cars.com lead cost benchmark 2026](https://txcautoagency.com/blog-carscom-lead-cost-benchmark-2026.html)
- [Rework: Third-party lead providers — real cost and ROI](https://resources.rework.com/libraries/automotive-sales-growth/third-party-lead-providers)
- [Cox Automotive: The high cost of poor-quality leads](https://www.coxautoinc.com/learning-center/the-high-cost-of-poor-quality-leads/)
- [CBT News: Facebook Marketplace rule restricting business-page car listings](https://www.cbtnews.com/new-facebook-marketplace-rule-restricts-business-pages-from-listing-cars/)
- [Motor1: Facebook Marketplace bans dealer posting](https://www.motor1.com/news/665056/facebook-marketplace-bans-dealers/)
- [CARVID: Facebook Marketplace dealer posting rules / compliance guide](https://www.carvidapp.com/facebook-marketplace-dealer-posting-rules/)
- [Shiftly: Can dealerships use Facebook Marketplace?](https://shiftlyauto.com/blogs/can-dealerships-use-facebook-marketplace)
- [Kijiji Help: Dealer subscription benefits](https://help.kijiji.ca/helpdesk/basics/dealer-subscription-benefits) and [Subscription dealer program](https://help.kijiji.ca/helpdesk/basics/subscription-dealer-program) and [Price analysis](https://help.kijiji.ca/helpdesk/autos/basics/price-analysis)
- [Kijiji Business: Kijiji Autos for dealers](https://business.kijiji.ca/en/kijiji-autos/) and [packages](https://business.kijiji.ca/en/kijiji-autos-packages/)
- [Canadian Auto Dealer: Kijiji Autos gets CARFAX Canada-powered pricing tool](https://canadianautodealer.ca/2019/01/kijiji-autos-gets-carfax-canada-powered-pricing-tool/)
- [Google Developers: Vehicle listings feed specification](https://developers.google.com/vehicle-listings/reference/feed-specification) and [feed setup](https://developers.google.com/vehicle-listings/integration-process/feed-setup) and [onboarding](https://developers.google.com/vehicle-listings/onboarding-guide)
- [Google Merchant Center Help: Vehicle ads overview](https://support.google.com/merchants/answer/11189169?hl=en) and [Vehicle ads policies](https://support.google.com/google-ads/answer/11544533?hl=en)
- [Dealer eProcess: Google's Dishonest Pricing rule (Oct 28, 2025)](https://www.dealereprocess.com/blog-googles-new-ad-rule-the-end-of-hidden-fees-for-car-dealers-starting-october-28-2025/)
- [SearchLab Digital: Google is deprecating Vehicles for Sale (GBP)](https://searchlabdigital.com/blog/google-is-deprecating-vehicles-for-sale/)
- [DealerRefresh: vehicle listings disappearing from Google Business Profiles](https://forum.dealerrefresh.com/threads/any-dealers-notice-vehicle-listings-disappearing-from-google-business-profiles.11043/)
- [Search Engine Land: Google rolling out cars for sale in GBP](https://searchengineland.com/google-rolling-out-cars-for-sale-in-google-business-profiles-392234)
- [ADF XML info (Auto-lead Data Format)](https://adfxml.info/)
- [DealerTeam: Outbound ADF lead format](https://success.dealerteam.com/s/article/Outbound-Auto-Lead-Data-Format-ADF?language=en_US)
- [DealerRefresh: inventory feeds to power a retail site](https://forum.dealerrefresh.com/threads/first-post-i-am-looking-for-information-regarding-inventory-feeds-to-power-an-automotive-retailing-site-like-autotrader-or-cars-com.7213/)
- [DealerRefresh: HomeNet vs vAuto as inventory provider](https://forum.dealerrefresh.com/threads/homenet-vs-vauto-as-an-inventory-provider.9762/page-4)
- [vAuto](https://www.vauto.com/) — [ProfitTime GPS](https://www.vauto.com/products/profittime-gps/), [Provision](https://www.vauto.com/products/provision/), [Stockwave](https://www.vauto.com/products/stockwave/)
- [Lotlinx: VIN performance management](https://lotlinx.com/)
- [Lotpop: Top 10 used car analytics platforms](https://www.lotpop.com/top-10-used-car-analytics-platforms-for-us-dealers)
- [Dealership Guy News: LotGPT](https://news.dealershipguy.com/p/unveiling-lotgpt-automotive-s-first-dealer-facing-chat-tool-and-7-problems-it-solves-2025-10-20)

## Boundaries honored

No vendor was contacted; no accounts were created; no live APIs were called.
All findings come from public marketing pages, help docs, press coverage, and
dealer-community forums surfaced via web search. Unverifiable specifics are
marked NEEDS_EXTERNAL_RESEARCH rather than fabricated. No public claims are
authorized from this document; it is internal research input only.
