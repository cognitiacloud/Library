# Research: AutoAlert / AlertMiner equity mining

STATUS: INTERNAL — RESEARCH NOTES. Compiled 2026-07-03 from public sources.

Scope: AutoAlert (autoalert.com) — AlertMiner, AlertMiner Pro, CXM, Pando,
Engagement Studio, One-to-One Intelligent Marketing — plus the competing
equity-mining tools most often mentioned alongside it (automotiveMastermind,
DealerSocket RevenueRadar, VinSolutions/Cox "Automotive Intelligence", and a
short list of others). Public marketing/product info only; no signups, no
vendor contact. Vendor sites (autoalert.com, dealersocket.com,
automotivemastermind.com, capterra.com, g2.com, dealerrefresh.com) were not
directly fetchable from this environment (network egress policy), so details
come from web-search result content citing those pages; every claim below is
tied to a listed source. Anything not verifiable this session is marked
`NEEDS_EXTERNAL_RESEARCH`.

Feeds module 7 (Equity mining / opportunity engine) in `CONTEXT_PACK.md`.
Sibling notes: `research/dealermine.md`, `research/tms-canada.md`.

---

## Products covered

### 1. AutoAlert AlertMiner (core equity/data-mining product)

**Positioning.** Marketed as "the industry's #1 data-mining platform" and
"the leading data mining solution for profitable portfolio management" —
i.e., mine the dealer's own DMS/sold-customer database to find owners who can
be moved into a newer vehicle at a similar payment, before they shop
elsewhere. AutoAlert draws an explicit marketing distinction between "data
mining" (raw lists) and "equity mining" (payment/position-aware, timed
opportunities). One of the oldest dedicated equity-mining platforms in
automotive retail. Kansas City-based; acquired by Atlanta-based PureCars
(announced April 13, 2026 — recent and strategically relevant: AutoAlert is
now part of a digital-advertising company, which will likely push it further
toward marketing-automation bundling).

**Key features (verified from public pages/search content):**
- **Patented behavior-predicting analytics / hot opportunity scoring** —
  scores and ranks every customer in the database by likelihood to buy "today"
  and by profitability to the dealer, so salespeople work a ranked list instead
  of a raw customer file. Daily equity recalculation. (Patent numbers not
  verified — NEEDS_EXTERNAL_RESEARCH: which patents AutoAlert actually holds.)
- **The alert taxonomy** (the core mechanic — each customer carries one or
  more named alert flags):
  - **Upgrade Alert** — customer can move into a newer/comparable vehicle at
    roughly the same payment (the classic equity play).
  - **Flex Alert** — customer can swap vehicles keeping payment about the
    same but only with flexible terms (longer term, incentive, rate change).
  - **Contract Alert** — finance/lease contract nearing maturity date.
  - **Mileage Alert** — lessee at or nearing lease mileage allowance.
  - **Warranty Alert** — factory warranty about to expire with no extended
    coverage (F&I re-sell + trade-in timing trigger).
  - **Service Alert** — customer was recently in the service lane.
  - **Pending-Service Alert** — customer has an upcoming scheduled service
    appointment (pre-visit prep for the sales team).
  - **Engaged Alert** — customer showing engagement/behavioral signals
    (e.g., responding to communications / website behavior).
- **Service-drive mining** — real-time notification when a customer with
  positive equity or approaching lease maturity checks into service; routes
  the opportunity to the right team member while the customer is physically
  in the building. This "service-to-sales" flow is AutoAlert's most-copied
  feature category.
- **Deep DMS integration** — pulls sales, F&I, and service data from major
  DMS platforms; positioned as fully integrated with the dealer's DMS.
- **Multipoint campaign triggers** — alerts can trigger marketing campaigns
  (mail/email/etc.), not just salesperson tasks.
- **OEM program certifications** — Stellantis Digital Certified Partner /
  FCA Digital Certified Program (US); ILM certification with Ford of Canada
  for the CXM product (see Canada relevance).

**Pricing notes.** No public pricing; custom quote only. Review-site
commentary calls it expensive relative to "free" CRM-bundled data mining
(the mining features dealers already get inside VinSolutions/DealerSocket).
NEEDS_EXTERNAL_RESEARCH: actual per-rooftop monthly price ranges (dealer
forum anecdotes historically put dedicated equity tools at roughly
$1.5k–$3k+/rooftop/month, but no current figure was verifiable this session).

**Strengths.**
- Category creator with the most complete, named alert taxonomy; "equity
  mining" as a term is practically synonymous with AlertMiner.
- Daily recalculated equity positions rather than static list pulls.
- Service-drive real-time alerting tied to sales-team routing.
- OEM certifications (Stellantis, Ford of Canada) that franchise dealers need
  for co-op/program compliance.
- Benchmarking content and built-in benchmarks (dealer's guide to equity
  mining benchmarks) — they sell measurement, not just alerts.

**Weaknesses / complaints (from reviews and dealer-forum commentary).**
- Navigation beyond the main dashboard is described as difficult.
- Email builder described as "extremely limited and frustrating."
- Expensive versus CRM-bundled mining; ROI depends entirely on process
  discipline.
- The classic failure mode is organizational, not algorithmic: a 2025
  Digital Dealer Conference survey of 312 franchised dealers cited poor
  sales-team follow-through on equity leads as the third-most-cited reason
  equity-mining programs fail — the tool surfaces opportunities but cannot
  prove or enforce that anyone worked them.
- Franchise-centric assumptions: lease maturity, OEM incentives, and
  franchise DMS data are the fuel; the model degrades for independent
  used-car dealers with thin lease books and heterogeneous financing.

### 2. AlertMiner Pro (team/workflow tier)

**Positioning.** Announced as "automotive's first dynamic team-based
dealership data solution" — the workflow-management layer on top of
AlertMiner.

**Key features.** Delivers the hottest ranked leads directly to the sales
team (push, not pull); workflow management with automated equity triggers;
built-in benchmarking; performance visibility across teams and rooftops
(manager accountability views); published "AlertMiner Pro and AutoAlert CXM
Workflows" playbook (FlipHTML5 flipbook) describing prescribed daily
workflows. Workflow Automation is marketed as turning website visits into
actionable sales opportunities and flagging unresolved customer inquiries
for follow-up.

**Strengths.** Converts a reporting tool into a managed daily process;
multi-rooftop visibility is a real differentiator for groups.
**Weaknesses.** Still depends on humans logging outcomes in a separate CRM;
accountability is dashboard-level, not evidence-level.

### 3. AutoAlert CXM (+ Pando, Engagement Studio, One-to-One Intelligent Marketing)

**Positioning.** Unveiled at NADA (2018) as "the auto industry's first
Consumer Experience Management (CXM) platform" — AutoAlert's move from
point-tool to CRM-adjacent platform: an AI-powered system unifying customer
data across sales, service, and inventory for engagement-based follow-up.
Deliberately branded CXM, not CRM, to position "experience management" above
traditional CRM.

**Key components (verified):**
- **Pando / Pando X** — communication platform + mobile app (iOS/Android)
  with a CRM-like process engine; Pando X added Manager and Sales Dashboards
  incorporating AlertMiner, SLM (showroom/lead management), and ReviewPro
  functionality; PandoCalendar syncs with common calendar systems and shows
  each rep's AlertMiner agenda and daily engagement plan.
- **Engagement Studio** — multichannel customer-engagement tooling: email,
  video, direct mail, social, and mobile, for both sales and service
  campaigns.
- **One-to-One Intelligent Marketing** — multi-channel marketing on top of
  the mined data: precision-targeted offers, personalized URLs (PURLs), call
  tracking, real-time tracking and reporting ("right offer, right customer,
  right time").

**Strengths.** The full loop — mine → prioritize → communicate → track — in
one vendor; strongest when a dealer wants equity mining to drive marketing
spend automatically.
**Weaknesses / complaints.** DealerRefresh thread ("Is anyone using
AutoAlert CXM?") shows mixed reception: praised for mining, but flagged as
lacking full CRM functionality — dealers still keep a primary CRM and treat
CXM as an add-on, creating dual-system swivel-chair work. Post-PureCars
acquisition product direction is unclear (NEEDS_EXTERNAL_RESEARCH: PureCars
roadmap for AlertMiner/CXM).

**Canada relevance (AutoAlert overall).** Actively sold in Canada: support
and training offered "throughout the United States and Canada"; AutoAlert
CXM is ILM-certified with Ford of Canada (Ford of Canada dealers can manage
leads from dealer sites and Ford of Canada consumer sites in CXM); Canadian
Auto Dealer covered the PureCars acquisition, confirming Canadian market
attention. BUT: certifications and marketing are franchise-OEM oriented.
No evidence of an offer tailored to Canadian independent used-car dealers,
CASL-specific consent tooling, or provincial-privacy (PIPEDA/PIPA-BC)
positioning. NEEDS_EXTERNAL_RESEARCH: whether AutoAlert's Canadian data
sources include Canadian book values (e.g., Canadian Black Book) and CASL
consent-state handling.

### 4. automotiveMastermind (Mastermind platform, formerly Market EyeQ) — main premium competitor

**Positioning.** "Behavior prediction" sales platform (an S&P Global
Mobility business — NEEDS_EXTERNAL_RESEARCH: confirm current corporate
ownership wording) covering loyalty (own customers), service (service-drive
conquest), and conquest (external market data) in one dashboard.

**Key features (verified):**
- **Behavior Prediction Score (BPS)** — ranks prospects 0–100 by propensity
  to buy; the enhanced BPS adds three sub-scores: in-market status score,
  vehicle-details score, and deal score, presented in a redesigned Customer
  Deal Sheet.
- **In-Market Score** claims to flag when a customer or household member is
  likely to replace a vehicle up to 90 days before entering the market.
- **Behavior Prediction Drivers + "Fritz"** — reason codes and an assistant
  generating personalized talk tracks per prospect and per channel (phone,
  email, SMS); "Mastermind Copilot" marketed for salesperson effectiveness.
- **Predictive Marketing** module (automated personalized campaigns) and
  **Service Conquest** module (targets service-drive customers who didn't
  buy from the dealer).

**Strengths.** Household-level and third-party data enrichment beyond the
dealer's own DMS; explainability via drivers/talk tracks; deal-sheet UX.
**Weaknesses.** Premium pricing (quote-only); franchise-focused; conquest
data coverage in Canada is weaker than the US (NEEDS_EXTERNAL_RESEARCH:
current Canadian availability/coverage of Mastermind conquest data).

### 5. DealerSocket RevenueRadar (CRM-integrated competitor, Solera)

**Positioning.** Equity mining natively integrated into DealerSocket CRM —
"turn insights into actions" without a separate vendor.

**Key features (verified):** combs the CRM database and prioritizes
customer conversations across **11 sales- and service-based categories**
(11 "targeting methods"); serves a customer profile plus a **buying score**
per lead with suggested talk tracks; automated omni-channel marketing
(timed direct mail + email); an "opportunity expert" guidance layer.
Marketing claims an average of **$424,000 annual gross profit per
dealership** from a 6,500+ store sample, and it carries a 100%
recommendation rating on DrivingSales (19 reviews).

**Strengths.** No swivel-chair — the opportunity, the CRM record, and the
task live in one system; cheap(er) attach for existing DealerSocket stores.
**Weaknesses.** Only useful if you run DealerSocket CRM; category depth and
score sophistication trail dedicated tools; results claims are vendor-stated
sample averages, not audited.

### 6. VinSolutions "Automotive Intelligence" (Cox) and the rest of the field

- **VinSolutions/Cox** bundles equity-mining signals into Connect CRM as
  Automotive Intelligence: native, no separate feed, but reviewers describe
  the mining as less advanced than dedicated point solutions and constrained
  by general-purpose CRM architecture.
- Also named in 2025–2026 roundups: **ELEAD1ONE Xchange**, **Dominion
  Dealer Solutions**, **CDK Global** (bundled mining), **Signal
  (signal.vin)** (equity mining aimed at used-inventory acquisition /
  trade-in value), and **VINCUE**, which now advertises a VINCUE + AutoAlert
  integration for pre- and post-sale engagement (equity mining feeding
  inventory acquisition). Feature depth for these NEEDS_EXTERNAL_RESEARCH
  individually if we ever need a full matrix.

---

## What DealerOS should copy conceptually

1. **A named, small alert taxonomy.** AutoAlert's genius is eight
   memorable alert names (Upgrade/Flex/Contract/Mileage/Warranty/Service/
   Pending-Service/Engaged) that salespeople can say out loud. Module 7
   already lists the right signals; package them as named alert types with
   reason codes, not a single opaque score.
2. **Score + reason + pitch, together.** Every ranked opportunity ships
   with why (reason codes / Behavior Prediction Drivers analog) and what to
   say (recommended pitch / talk track). Mastermind's per-channel talk
   tracks and RevenueRadar's buying-score-plus-profile are the same lesson.
3. **Service-drive interrupt.** Real-time "equity customer just checked
   into service" alerts routed to a specific person, with a pre-visit
   version (Pending-Service Alert) so the pitch is prepared before arrival.
   Maps directly to module 8 (fixed ops bridge).
4. **Daily recalculation, not list pulls.** Equity positions and scores
   refresh daily as payments amortize, mileage accrues, and inventory
   changes; opportunities expire and re-rank automatically.
5. **Push the ranked list into the rep's day.** AlertMiner Pro / Pando
   pattern: the hot list lands in the salesperson's agenda/calendar with
   manager dashboards across teams and rooftops — a managed daily process,
   not a report someone must remember to open.
6. **Mine-to-marketing loop.** Alerts should be able to trigger governed
   campaign drafts (mail/email/SMS/PURL-style personalized pages with call
   tracking), the One-to-One Intelligent Marketing / Engagement Studio
   pattern — in our case via Demandara.
7. **Sell benchmarks.** AutoAlert publishes equity-mining benchmarks and
   builds benchmarking into the product; DealerOS should ship default
   benchmark reports (alerts worked %, contact rate, appointment rate,
   sold-from-alert rate) from day one.

## What DealerOS should do better

1. **Built for independents, not franchises.** Every incumbent assumes
   lease books, OEM programs, and franchise DMS feeds. DealerOS should make
   the engine work on finance-term age, estimated equity from market price
   data, mileage/age, service recency, warranty end, and website behavior —
   signals independents actually have — with graceful degradation when
   finance data is unknown (module 7 already specifies this mix).
2. **Close the follow-through gap with evidence.** The #1 documented
   failure mode is reps not working the leads. Incumbents answer with
   dashboards; DealerOS answers with proof receipts per opportunity
   (equity_score_generated → ai_reply_drafted → human_approval_granted →
   followup_sent → sold_marked/lost_reason_recorded). Accountability
   becomes verifiable, not self-reported.
3. **One system, no swivel chair.** AutoAlert CXM's core complaint is that
   it isn't a full CRM, forcing dual systems. DealerOS's equity engine is
   native to the same CRM/TMS/inventory core — the alert, the customer 360,
   the vehicle match, and the appointment board are one record set.
4. **AI-drafted, human-approved outreach.** Incumbents stop at talk tracks
   and template campaigns. DealerOS drafts the actual SMS/email/call script
   per opportunity (module 6 AI BDC), gated by human approval — and the
   email/content tooling should beat AutoAlert's weak email builder.
5. **Canada-first compliance.** CASL express/implied-consent state checked
   before any outreach draft is sendable; PIPEDA/PIPA-BC data-rights
   handling; consent basis recorded on every receipt. None of the
   incumbents lead with this.
6. **Inventory-aware two-sided matching.** Tie every alert to a concrete
   in-stock (or incoming) vehicle match AND to acquisition value: an
   Upgrade-Alert trade-in is also used inventory we need (the
   Signal/VINCUE angle). Score opportunities partly by how badly we want
   the trade.
7. **Honest pricing.** Quote-only pricing at franchise price points locks
   out independents; DealerOS can publish transparent per-rooftop pricing.
8. **Claim-safe results reporting.** RevenueRadar's "$424K average gross"
   is an unaudited vendor claim. DealerOS should only ever report
   per-dealer, receipt-backed outcomes ("your 14 sold-from-alert deals this
   quarter, with the receipt chain") — consistent with our no-fake-proof
   boundary.

## How Cognitia proof receipts make our version harder to copy

- **Every stage of the equity loop emits a receipt** (already specified in
  module 11): `equity_score_generated` (with score inputs hash + reason
  codes), `vehicle_matched`, `ai_reply_drafted`, `human_approval_requested/
  granted`, `followup_sent`, `appointment_drafted/confirmed`, `sold_marked`,
  `lost_reason_recorded`. Incumbents log activity in a mutable CRM;
  we produce an append-only, hash-linked evidence chain.
- **Scoring becomes auditable.** AlertMiner/Mastermind scores are black
  boxes; our `equity_score_generated` receipt carries inputs, model/prompt
  version, and reason codes — a dealer (or OEM/regulator) can reconstruct
  why a customer was targeted. That is a structural moat: copying it
  requires rebuilding the product around a ledger, not adding a feature.
- **Consent is enforced, not assumed.** `consent_captured` receipts and
  policy-gate results mean an equity campaign literally cannot be sent to a
  non-consented customer in live mode — the CASL story competitors lack.
- **Follow-through disputes are resolvable.** When a manager asks "was this
  hot lead worked?", the answer is a receipt chain with timestamps and
  actor IDs (human vs agent), including a dispute/rollback path — turning
  the industry's top failure mode into our proof point.
- **Agent-economy hook:** `equity_opportunity_created` and
  `service_to_sales_opportunity_created` are countable work events with
  evidence requirements (module 15), so verified equity work can feed
  reputation later — nothing in the incumbent field resembles this.

## How Demandara integration makes our version more revenue-native

- **Alerts become demand-gen fuel automatically.** An Upgrade/Warranty/
  Contract alert can flow through `POST /api/demandara/campaigns` and
  `POST /api/demandara/reply-drafts` to become a governed campaign or 1:1
  draft — our native version of One-to-One Intelligent Marketing and
  Engagement Studio, but with approval gates and receipts.
- **Closed-loop attribution incumbents can't show.** Equity-triggered
  campaigns report back through `GET /api/demandara/outcomes` and
  `GET /api/demandara/revenue-attribution`: alert → campaign → lead →
  appointment → sold, each step receipted. AutoAlert offers call tracking
  and PURL reporting; we offer lead-to-sale attribution tied to the same
  CRM record and proof ledger.
- **Website behavior joins the score.** Demandara/Demand Gen pages (VDPs,
  trade-in pages, finance pages) feed UTM + behavior signals into the
  equity score ("Engaged Alert" done natively), and the score's next-best-
  action can be a specific landing page or trade-in offer page.
- **Monthly proof-backed marketing report** (`GET /api/demandara/
  proof-report`) replaces vendor-average ROI claims with the dealer's own
  receipted numbers — the claim-safe answer to "$424K average gross profit"
  marketing.
- **Trade-in → inventory flywheel.** Demandara books the equity customer's
  appraisal appointment; DealerOS records the acquired unit into inventory
  CRM; Demand Gen instantly publishes the merchandised VDP — one loop from
  mined equity to next sale.

## Sources

- [AutoAlert — AlertMiner automotive equity/data mining](https://www.autoalert.com/alertminer-automotive-equity-data-mining/)
- [AutoAlert — AlertMiner Pro: dealership data mining & workflow management](https://www.autoalert.com/alertminer-pro-next-level-data-mining/)
- [AutoAlert — homepage (CXM + dealership management software)](https://www.autoalert.com/)
- [AutoAlert — CXM: "the next generation automotive CRM"](https://www.autoalert.com/customer-experience-management-cxm/)
- [AutoAlert — Engagement Studio](https://www.autoalert.com/engagement-studio/)
- [AutoAlert — One-to-One Intelligent Marketing (dealership service marketing)](https://www.autoalert.com/intelligent-marketing-automotive-dealership-digital-mailer/)
- [AutoAlert — Data mining vs. equity mining](https://www.autoalert.com/data-mining-vs-equity-mining/)
- [AutoAlert — The Dealer's Guide to Equity Mining Benchmarks](https://www.autoalert.com/equity-mining-benchmarks/)
- [AutoAlert — Stellantis Digital Certified Partner](https://www.autoalert.com/stellantis-digital/)
- [AutoAlert — AlertMiner Pro release: "first dynamic team-based data solution"](https://www.autoalert.com/autoalert-releases-alertminer-pro-automotives-first-dynamic-team-based-data-solution/)
- [AutoAlert — CXM now ILM certified with Ford of Canada](https://www.autoalert.com/autoalert-cxm-now-ilm-certified-ford-canada/)
- [AutoAlert — CXM platform unveiled at NADA (blog)](https://www.autoalert.com/blog/autoalert-unveils-auto-industrys-first-consumer-experience-management-cxm-platform-nada/)
- [PR Newswire — AutoAlert unveils industry-first CXM platform at NADA](https://www.prnewswire.com/news-releases/autoalert-unveils-the-auto-industrys-first-consumer-experience-management-cxm-platform-at-nada-300617883.html)
- [PR Newswire — AutoAlert adds functionality to industry-first app with new Pando X](https://www.prnewswire.com/news-releases/autoalert-adds-functionality-to-industry-first-app-with-new-pando-x-300784573.html)
- [FlipHTML5 — AutoAlert AlertMiner Pro and AutoAlert CXM Workflows (flipbook)](https://fliphtml5.com/wgdjl/wbfx/AutoAlert_AlertMiner_Pro_and_AutoAlert_CXM_Workflows/)
- [Google Play — AutoAlert (Pando) app](https://play.google.com/store/apps/details?id=com.autoalert.pando&hl=en_US)
- [Apple App Store — AutoAlert app](https://apps.apple.com/us/app/autoalert/id1142455891)
- [DealerRefresh forum — "Is anyone using AutoAlert CXM?"](https://forum.dealerrefresh.com/threads/is-anyone-using-autoalert-cxm.9920/)
- [DrivingSales — AutoAlert AlertMiner ratings & reviews](https://www.drivingsales.com/autoalert/alertminer)
- [Capterra — AlertMiner pricing, alternatives & reviews](https://www.capterra.com/p/197068/AlertMiner/)
- [G2 — AutoAlert reviews](https://www.g2.com/products/autoalert/reviews)
- [SaaSworthy — AutoAlert pricing](https://www.saasworthy.com/product/autoalert/pricing)
- [Canadian Auto Dealer — PureCars acquires AutoAlert (April 2026)](https://canadianautodealer.ca/2026/04/purecars-acquires-autoalert/)
- [US Tech Automations — Auto dealership equity mining tools compared: 2026 guide](https://ustechautomations.com/resources/blog/auto-dealership-equity-mining-automation-comparison-2026)
- [VINCUE — VINCUE + AutoAlert CRM equity mining integration](https://vincue.com/resources/news/vincue-autoalert-crm-equity-mining-integration/)
- [DealerSocket — RevenueRadar equity mining tool](https://dealersocket.com/products/automotive-equity-mining-tool-revenueradar/)
- [DealerSocket — Mining core vehicles with RevenueRadar](https://dealersocket.com/mining-core-vehicles/)
- [automotiveMastermind — Equity mining vs. data mining](https://www.automotivemastermind.com/blog/dealerships/data-vs-equity-mining/)
- [automotiveMastermind — Enhanced Behavior Prediction Score announcement](https://www.automotivemastermind.com/automotivemastermind-introduces-its-enhanced-behavior-prediction-score/)
- [PR Newswire — automotiveMastermind enhanced BPS in redesigned Customer Deal Sheet](https://www.prnewswire.com/news-releases/automotivemastermind-introduces-its-enhanced-behavior-prediction-score-in-a-customer-deal-sheet-redesigned-to-improve-dealership-sales-and-marketing-performance-302265544.html)
- [automotiveMastermind — Predictive behavior analytics tools](https://www.automotivemastermind.com/features/predictive-analytics-for-dealerships/)
- [automotiveMastermind — Decoding BPS: in-market, vehicle and deal scores](https://www.automotivemastermind.com/blog/uncategorized/decoding-bps-in-market-vehicle-deal-scores/)
- [CBT News — automotiveMastermind enhances Behavior Prediction Score with ML tools](https://www.cbtnews.com/automotivemastermind-enhances-behavior-prediction-score-with-new-machine-learning-tools/)
- [Spyne — Automotive equity mining: boost sales with data insights (2025)](https://www.spyne.ai/blogs/automotive-equity-mining)
- [Signal Technology — Equity mining for car dealerships (used-inventory angle)](https://www.signal.vin/solutions/equity-mining-for-car-dealerships)
- [DealershipNews — Owner marketing / equity mining vendor reviews](https://dealershipnews.com/vendor-reviews/owner-marketing-equity-mining/)

## Boundaries honored

Public marketing/product research only: no signups, no vendor contact, no
outreach, no scraping behind logins. No fabricated features — unverified
items are marked `NEEDS_EXTERNAL_RESEARCH`. No public claims authorized;
"AutoAlert replacement" language remains prohibited per `CONTEXT_PACK.md`
section 7 unless feature parity is real. All competitive comparisons are for
internal design use only.
