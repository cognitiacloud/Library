# Research: TMS Canada / Traffic Management Services

STATUS: INTERNAL — RESEARCH NOTES. Compiled 2026-07-03 from public sources.

Category: dealership showroom traffic management — phone-up logging, internet
leads, walk-ins, showroom traffic flow, lead/sales statistics, manager
reporting, salesperson accountability, traffic-source performance, process
discipline ("desk log" / "up system" category).

RESEARCH ACCESS NOTE: The vendor's site (tmscan.com) and several category
vendor sites actively block automated fetching (HTTP 403), and the sandbox
proxy denied a direct connection to tmscan.com. All vendor details below were
compiled from search-index snippets of the official pages, the Quorum press
release (two mirrors), app-store listings, and third-party pages. Anything
that could not be verified from those snippets is flagged
`NEEDS_EXTERNAL_RESEARCH`. No sign-ups, no contact, no fabrication.

---

## Products covered

### 1. TMS — Traffic Management Services / "TMS Canada" (tmscan.com)

The primary research target. Note the real domain is **tmscan.com**, not
tmscanada.ca. Corporate identity behind the product is **Craigie Consulting
Ltd.** (principal: Bruce Craigie), listed as the developer of the TMSCAN.COM
mobile apps and referenced by name in Quorum's press release ("Bruce Craigie
and his team at TMS"). ZoomInfo lists the entity as "TMS - CAN Enterprise."
Contact points published: 416-523-1800 (Toronto area code), 1-877-665-6787,
support@tmscan.com.

**Positioning (from site snippets):**
- "A structured management system designed for automobile dealerships."
- "A web-based showroom traffic management system … used by a number of
  dealerships across Canada to manage the flow of traffic inside the store."
- "30+ years in the industry, partnered with major manufacturers and key
  industry players throughout Canada" — i.e., OEM-program relationships are a
  core part of the pitch.
- Not software-only: "supports dealers with experienced Auto Industry Retail
  & Wholesale Field Staff" and "analyzes and interprets data to provide
  action plans." TMS sells software + in-person field consulting + data
  interpretation as one service.
- Promises "clear and accurate lead and sales statistics."

**Key verified features / capabilities:**
- Web-based showroom traffic logging (flow of traffic "inside the store").
- Lead and sales statistics reporting for managers.
- Field-staff-driven action plans (human analysts interpret the dealership's
  traffic data — a services layer, not just dashboards).
- **Quorum Autovance integration (announced 2017-11-02):** TMS users "connect
  directly with Quorum's desking tool, Autovance, and then have access to
  inventory, customer and trade-in data as well as complete the deal directly
  into Quorum's XSELLERATOR Dealership Management System." Immediately
  available to all Canadian Autovance Desk dealership customers. This is the
  classic Canadian stack: TMS traffic log → Autovance desking → XSELLERATOR
  DMS. Quote from Rick Johnston (Quorum VP, Autovance Division): "We've had a
  long-standing relationship with Bruce Craigie and his team at TMS."
- **TMSCAN.COM mobile app** (iOS App Store id 6679178023 + Google Play
  `com.tmscan.mobile`, developer Craigie Consulting Ltd. — the high App Store
  ID indicates a 2024-era release, i.e., mobile is recent for them): respond
  to leads via SMS, phone, or email; caller can choose native calling from
  their own number **or the TMS number** (number masking); push notifications
  for **new leads** and **new communications**. So the modern TMS is a
  lightweight lead-response inbox on top of the traffic log.
- Login portal at tmscan.com (`email_password.php`) — legacy PHP web app.

**Pricing:** Not public. NEEDS_EXTERNAL_RESEARCH: TMS subscription pricing,
contract terms, and whether field-staff services are bundled or billed
separately.

**Strengths:**
- Deep Canadian incumbency: 30+ years, OEM-program partnerships, Canadian
  DMS/desking integration (Quorum), Canadian field reps who physically visit
  stores. This is trust and distribution, not technology.
- The human "interpretation + action plan" layer solves the real category
  problem (dealers don't act on reports) with people instead of product.
- Simple, focused scope — showroom traffic discipline — which GMs understand.

**Weaknesses / complaints (observable, not review-sourced):**
- Near-zero public marketing footprint: no public feature tour, no pricing,
  no case studies, no G2/Capterra/SoftwareAdvice listings found for the
  dealership product; site is legacy (`home.html`, `.php` pages) and blocks
  crawlers. Evaluation requires a phone call.
- Mobile app arrived only recently (2024-era); historically web-only.
- No public evidence of AI capabilities, automated alerting, SLA timers,
  after-hours coverage, or attribution beyond "lead and sales statistics."
  NEEDS_EXTERNAL_RESEARCH: exact TMS report names, alert types, and whether
  any AI-assisted features exist (no public documentation found).
- Services-heavy model likely scales poorly and prices out small independents.
- NEEDS_EXTERNAL_RESEARCH: dealer-community reviews of TMS specifically (no
  DealerRefresh/Reddit threads about "tmscan" surfaced in searches).

**Canada relevance:** Highest of any product in this file — it IS the
Canadian incumbent for franchise-store showroom traffic management, wired
into the Quorum/Autovance ecosystem and OEM programs. But its visible center
of gravity is franchise dealers in OEM programs, not independent used-car
dealers — Budget Wheels' wedge.

---

### 2. TraxSales / VisualProof (traxsales.com, visualproof.traxsales.com)

**Positioning:** "Retail customer counting & sales accountability" — a
people-counter + "UpBoard" electronic up-log that catches the gap between
physical door traffic and what salespeople actually log.

**Key features (verified from their pages):**
- Camera-based people counting using the dealership's existing camera
  infrastructure; every entry captured with a **photo-verified timestamp**.
- **UP-log cross-reference:** compare camera counts to the UP log; "dealers
  who cross-reference TraxSales traffic counts against their UP log typically
  find a 15–25% gap — customers who entered the showroom and were never
  logged."
- Timestamp-verified show rates replace coordinator-reported appointment
  show numbers.
- **Revenue per assigned customer at the associate level** — "who earns their
  floor time."
- Multi-rooftop dashboard for dealer groups: traffic volume, conversion rate,
  and revenue-per-guest per location, to spot underperforming stores.
- Staffing signal: a ~20% difference between counted traffic and UpBoard
  opportunities flagged as possible understaffing.

**Pricing:** order page exists (visualproof.traxsales.com/order) but pricing
not captured. NEEDS_EXTERNAL_RESEARCH: hardware + SaaS pricing.

**Strengths:** independent ground truth (cameras don't lie); turns the
"salespeople don't log ups" problem into a measurable gap number.
**Weaknesses:** hardware/install dependency; counts bodies, not identity or
outcome; still needs a CRM/desk-log to act on anything; dated web presence.
**Canada relevance:** US-centric (Houston-based); no Canadian program
presence found.

---

### 3. Lot Watch — Proactive Dealer Solutions (lotwatchanalytics.com)

**Positioning:** "Lot Watch Floor Traffic Analysis" from Proactive Dealer
Solutions ("The BDC Experts") — automatic 24/7 tracking of lot, showroom, and
service-drive traffic, "unlike a greeter, always on."

**Key features (verified):**
- WiFi-based detection leveraging consumers' mobile devices (no manual
  logging) across lot + showroom + service drive.
- **Real-time text alerts to managers for unassisted customers on the lot** —
  the category's clearest "alert type" example.
- Real-time dashboard ("eye in the sky") of live dealership activity.
- Tracks staff engagement and the "road to the sale" of every customer.
- Marketing-effect monitoring: how campaigns change physical traffic.
- Headline stat used to sell the category: "most dealers lose 35–40% of floor
  traffic because it's never logged … 3–4 ups a day or 100+ ups per month."

**Pricing:** not public. NEEDS_EXTERNAL_RESEARCH.
**Strengths:** passive capture (nothing for salespeople to do); service-drive
coverage; real-time interception of ignored customers.
**Weaknesses:** WiFi sniffing is privacy-fraught (MAC randomization on modern
phones degrades it; PIPEDA/PIPA-BC consent questions in Canada); identity is
anonymous — it counts phones, not customers; PDS's core business is BDC
consulting, product is an attach.
**Canada relevance:** PDS operates in North America broadly;
NEEDS_EXTERNAL_RESEARCH: Canadian install base and PIPEDA posture.

---

### 4. Car Wars (carwars.com)

**Positioning:** "Automotive call tracking, superior phone traffic
management, and AI-fueled call insights" — owns the *phone* slice of the
traffic desk.

**Key features (verified):**
- **CRISP framework** — Connect, Request & Invite, Set, Pursue — a named,
  trainable phone-handling standard every call is scored against.
- **Missed Opportunity Alerts:** immediate text/email to managers when a
  sales lead needs attention, containing a call summary, customer info, a
  **deep link into the CRM**, and click-to-call callback.
- AI call tracking: detailed summaries and classification of every call;
  human-reviewed call recaps for accuracy.
- AI-powered call routing and real-time performance alerts; hosted cloud
  phone system; reporting designed to "build a culture of phone excellence."

**Pricing:** not public (demo-gated; third-party listing sites exist).
NEEDS_EXTERNAL_RESEARCH: per-rooftop pricing.
**Strengths:** best-in-class phone-up accountability loop (record → score →
alert → callback), a named process standard (CRISP) that trains behavior.
**Weaknesses:** phone-only slice; separate subscription on top of CRM;
alert fatigue is a commonly cited risk with call-alert products
(NEEDS_EXTERNAL_RESEARCH: current dealer reviews 2024–2026).
**Canada relevance:** sells into Canada but US-first; no Canadian OEM-program
depth like TMS. Peer: **CallRevu** (callrevu.com), "all-in-one platform for
hosted phone systems, call tracking, AI insights, and training tools."

---

### 5. Traffic Control CRM (trafficcopcrm.com) + long-tail up-systems

**Traffic Control** ("Your dealership. Your control."): manager view of
"who's up front"; **color coding** on customer records showing whether a
salesperson has phoned a prospect or past customer. Site blocks crawlers;
detail is thin. NEEDS_EXTERNAL_RESEARCH: full feature list and pricing.

Long-tail category evidence (why this niche persists):
- **Traffic Log Pro** (trafficlogpro.com): desk-log-first CRM with reputation
  and marketing tools, aimed at powersports — shows "traffic log as the CRM
  spine" is a proven wedge in adjacent verticals.
- **Sky Up System / Retail Up System** (skyupsystem.com): pure up-rotation
  fairness tools — who's next on the floor.
- **ADSCO "Desk Traffic Control Log"** — paper desk logs are still sold in
  2026. A meaningful share of independents run this category on paper.
- DealerRefresh thread "Our 'Up' system is jacked up!! … what do we do??" —
  dealers argue endlessly about rotation fairness, skate prevention, and
  getting salespeople to log at all; commentary sources repeat that unlogged
  visitors get zero follow-up and no accountability, and that salespeople
  resist logging until the system visibly protects their turn on the floor.

---

## What DealerOS should copy conceptually

1. **The desk log as the atomic unit.** Every vendor above monetizes one
   object: the traffic event (phone-up, internet lead, walk-in) with a
   timestamp, source, salesperson, and outcome. DealerOS Module 4 already
   defines "traffic event" — keep it primary, not a CRM afterthought.
2. **TMS's software + interpretation bundle.** TMS survives 30+ years by
   pairing reports with humans who "analyze and interpret data to provide
   action plans." DealerOS should ship the AI equivalent: a weekly
   manager-facing "action plan" narrative generated from traffic data, not
   just dashboards.
3. **TMS's desking hand-off.** The Autovance integration pattern — traffic
   log → desking tool with inventory/customer/trade data pre-loaded → deal in
   DMS — is the exact workflow seam DealerOS controls natively (traffic desk
   → deal draft). Keep the one-click "start deal from traffic event" motion.
4. **Car Wars' Missed Opportunity Alert anatomy.** Alert = summary + customer
   info + deep link + one-tap callback, delivered to a manager in minutes.
   Copy that four-part payload for every ignored lead/up in DealerOS.
5. **Car Wars' named process standard (CRISP).** A branded, scoreable
   phone/floor process gives managers a coaching vocabulary. DealerOS should
   name its own standard and score every traffic event against it.
6. **TraxSales' ground-truth gap metric.** "X% of your traffic was never
   logged" is the category's killer sales number (15–25% TraxSales, 35–40%
   Lot Watch). DealerOS should compute a logged-vs-actual gap wherever a
   signal exists (website sessions, calls, door counters if present).
7. **Lot Watch's unassisted-customer real-time alert** — intercept while the
   customer is still on the lot, not in tomorrow's report.
8. **Up-rotation fairness** (Sky Up System / DealerRefresh pain): visible,
   rules-based "who's up next" removes the #1 reason salespeople fight the
   log.

## What DealerOS should do better

1. **One system instead of four subscriptions.** Today a dealer needs TMS
   (showroom log) + Car Wars (phone) + Lot Watch (lot) + a CRM. DealerOS
   Module 4 unifies phone/internet/walk-in/after-hours/service-drive traffic
   in the same pipeline as the CRM and inventory — no swivel-chair, one
   source-of-truth report.
2. **Self-serve and independent-dealer priced.** TMS, Car Wars, and Lot Watch
   are all demo-gated with hidden pricing and OEM/franchise center of
   gravity. Publish pricing, onboard in a day, target Canadian independents
   first — the segment still running ADSCO paper logs.
3. **AI does the logging.** The category's root failure is manual entry.
   DealerOS's AI BDC already summarizes calls/chats/SMS; auto-create traffic
   events from inbound calls, web leads, and appointment check-ins so the
   human only confirms walk-ins instead of typing everything.
4. **SLA timers + escalation, not just alerts.** Car Wars alerts; nobody
   publicly shows enforcement. DealerOS: per-source SLA timers, escalation
   chains (salesperson → floor manager → GM), and a permanent record of who
   was alerted and what happened.
5. **Close the loop to sold/lost.** TMS reports "lead and sales statistics";
   TraxSales stops at revenue-per-guest. DealerOS ties every traffic event to
   sold/lost reason, source, campaign, and gross — true traffic-to-sale
   attribution per salesperson and per source.
6. **Modern, mobile-first UX.** TMS shipped its first mobile app circa 2024
   on a legacy PHP web core. Table stakes to beat.
7. **Privacy-clean capture for Canada.** Skip WiFi sniffing; use consented
   signals (appointment check-in, guest WiFi opt-in, salesperson one-tap
   logging) aligned with PIPEDA/PIPA-BC — a marketable differentiator against
   Lot Watch-style tracking.

## How Cognitia proof receipts make our version harder to copy

- Every traffic event, assignment, SLA breach, alert, escalation, and
  sold/lost mark emits a Cognitia receipt (`lead_received`,
  `appointment_drafted`, `followup_sent`, `sold_marked`,
  `lost_reason_recorded`, …) with actor, timestamp, payload hash, and
  approval trail. The desk log becomes tamper-evident — competitors' logs are
  editable records that managers and salespeople openly game (the exact
  problem TraxSales sells cameras to catch).
- The "logged vs. actual" gap report becomes *provable*: receipts show which
  events were auto-captured by the system vs. hand-entered vs. edited after
  the fact, and by whom.
- Manager accountability inherits the same trail: an alert that fired and was
  ignored is itself a receipt. TMS's human field-rep "action plans" become a
  signed, auditable artifact instead of a binder.
- Copying the UI is easy; copying a receipt ledger wired through every
  workflow (policy gates, human approvals, dispute paths, claim-safe
  summaries) requires rebuilding the platform's spine. That is the moat.

## How Demandara integration makes our version more revenue-native

- Traffic desk vendors start at the door; Demandara starts at demand. Every
  DealerOS traffic event carries UTM/source/campaign lineage from Demandara
  (`POST /api/demandara/leads` in, `GET /api/demandara/outcomes` and
  `/revenue-attribution` back), so "traffic source performance" means *cost
  per sold unit by campaign*, not tally marks by source — beyond anything TMS
  or Car Wars publish.
- Sales Closer runs the follow-up the desk log only measures: ignored or
  no-show traffic events trigger governed AI follow-up drafts, appointment
  drafts, and lost-lead resurrection — with human approval and receipts —
  turning the accountability report into recovered deals.
- Monthly proof-backed marketing reports (Demandara + Cognitia) replace TMS's
  field-rep interpretation service with an automated, evidence-linked
  equivalent the dealer can hand to an OEM or lender.
- Net effect: competitors sell measurement; DealerOS sells measurement +
  demand + follow-up + proof in one loop, priced for independents.

## Sources

- [TRAFFIC MANAGEMENT SERVICES — tmscan.com](https://tmscan.com/) (via search snippets; direct fetch blocked)
- [Traffic Management Showroom — tmscan.com/home.html](https://tmscan.com/home.html) (via search snippets)
- [TMS Online login — tmscan.com/email_password.php](https://tmscan.com/email_password.php)
- [Quorum Announces Integration with Traffic Management Systems (Quorum, 2017-11-02)](https://quoruminformationsystems.com/2017/11/02/2361/)
- [Quorum Announces Integration with Traffic Management Systems (Yahoo Finance CA mirror)](https://ca.finance.yahoo.com/news/quorum-announces-integration-traffic-management-104400151.html)
- [TMSCAN.COM on the Apple App Store](https://apps.apple.com/us/app/tmscan-com/id6679178023)
- [TMSCAN.COM on Google Play (developer: Craigie Consulting Ltd.)](https://play.google.com/store/apps/details?id=com.tmscan.mobile)
- [Bruce Craigie — TMS - CAN Enterprise (ZoomInfo)](https://www.zoominfo.com/p/Bruce-Craigie/-1464467954)
- [TraxSales VisualProof — People Counter for Car Dealerships (2026)](https://visualproof.traxsales.com/people-counter-for-car-dealerships)
- [TraxSales — Retail Customer Counting & Sales Accountability (order page)](https://visualproof.traxsales.com/order)
- [TraxSales — People Counting Software for Retailers](https://traxsales.com/people-counting-software-for-retailers/)
- [Lot Watch Floor Traffic Analysis — Proactive Dealer Solutions](http://www.lotwatchanalytics.com/)
- [Car Wars — Automotive Call Tracking, Phone Traffic Management](https://carwars.com/main/)
- [Car Wars — Missed Customer Opportunity Alerts](https://www.carwars.com/home/solutions/missed-opportunity-alerts/)
- [Car Wars — Features: Call Tracking, Analytics & Insights](https://carwars.com/home/resources/product-features/)
- [CallRevu — AI-Powered Communication Intelligence for Dealerships](https://www.callrevu.com/)
- [Traffic Control CRM — trafficcopcrm.com](https://www.trafficcopcrm.com/)
- [Traffic Log Pro](https://www.trafficlogpro.com/)
- [Sky Up System](https://skyupsystem.com/v/)
- [ADSCO — Desk Traffic Control Log (paper)](https://adsco.com/products/desk-traffic-control-log)
- [DealerRefresh forum — "Our 'Up' system is jacked up!! … what do we do??"](https://forum.dealerrefresh.com/threads/our-up-system-is-jacked-up-what-do-we-do.3153/page-2)
- [AutoMax — The Traffic Log: Why Your Dealership Needs One](https://automaxrecruitingandtraining.com/automotive-sales-training/dealership-traffic-log)
- [Auto Dealer Today — Checking Your Blind Spots](https://www.autodealertodaymagazine.com/309728/checking-your-blind-spots)

## Boundaries honored

Public marketing/product information only; no sign-ups, no vendor contact, no
scraping behind logins. Blocked fetches recorded honestly; unverifiable items
flagged `NEEDS_EXTERNAL_RESEARCH`. No live TMS/DealerMine integration implied
— connector work stays mock-mode per CONTEXT_PACK.md hard boundaries. No
public claims authorized; internal design research only.
