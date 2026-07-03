# Research: CDK Global

STATUS: INTERNAL — RESEARCH NOTES. Compiled 2026-07-03 from public sources.

Scope: CDK Global (cdkglobal.com) — Dealership Xperience Platform (DXP), CDK Drive DMS,
CDK CRM (Elead), Modern Retail Suite (digital retail + F&I, ex-Roadster), Fortellis API
platform, AIVA / Intelligence Suite AI features, plus the June 2024 cyberattack/outage and
its industry lessons. All claims below are drawn from vendor pages, press releases, review
sites, and trade coverage found 2026-07-03; anything unverifiable is flagged
`NEEDS_EXTERNAL_RESEARCH`.

Context anchor: DealerOS targets independent used-car dealers in Canada first. CDK is the
incumbent giant of the *franchise* dealer world (~50% of the DMS market pre-2024 attack).
It is less a direct competitor for our first customers than the defining reference point
for "enterprise dealership platform" — and, after June 2024, the industry's cautionary
tale about single-vendor concentration.

---

## Products covered

### 1. CDK Dealership Xperience Platform (DXP) — the umbrella

- **Positioning:** "Go beyond the DMS." Launched Aug 2023 (US) as a "new category of
  software": one open, integrated cloud platform spanning sales, service, inventory,
  F&I, and intelligence, replacing the old model of a DMS plus dozens of bolt-ons.
  Launched in Canada April 2024.
- **Structure — six suites:**
  1. **Foundations Suite** — core platform for enterprise / multistore dealers (DMS
     core, common data layer). In Canada, implemented at no charge for existing CDK DMS
     customers (launch promotion).
  2. **Fundamentals Suite** — scaled-down package aimed at independents and smaller
     franchise operations; powered largely by the Elead acquisition (CRM, lead
     management, BDC workflows, marketing automation).
  3. **Vehicle Inventory Suite** — inventory management and merchandising.
  4. **Modern Retail Suite** — CRM + Digital Retailing + F&I workflow (see §3).
  5. **Fixed Operations Suite** — service lane, scheduling, fixed ops workflows.
  6. **Intelligence Suite** — analytics/AI layer (see §5).
- **Key features (platform level):** single customer/deal record across suites; open
  APIs via Fortellis; NADA 2026 additions: a **Customer Data Platform (CDP)**, expanded
  Open APIs across Dealership Operations, Modern Retail, Fixed Operations, and
  Intelligence; **AIVA** agentic assistant across DXP; **AI Summary** for CRM and
  Service; **AI Forms** (shown NADA 2025) to auto-populate/streamline buying-and-selling
  paperwork.
- **Pricing notes:** not published. Third-party estimates: base CDK DMS around
  $2,000/month plus ~$10,000 implementation (EverLogic comparison blog); enterprise DMS
  contracts cited around $10,000/month (VendorMotive); average franchise-dealer spend of
  DMS + 10–15 bolt-ons reported near $30K/month (VendorMotive). Treat all as directional,
  not quotes.
- **Strengths:** breadth (one vendor for nearly everything); deep OEM certifications;
  huge install base and data gravity; real accounting/payroll/F&I compliance depth that
  lightweight CRMs cannot match.
- **Weaknesses/complaints:** opaque pricing and long contracts; per-seat/per-module fee
  stacking; support quality complaints on Capterra/G2 (hard to reach, slow changes,
  "you have to call in for most things"); legacy UI in DMS core; and the systemic
  failure of June 2024 (see §6). Antitrust exposure: a class action alleging CDK and
  Reynolds conspired to inflate DMS and data-integration prices (class period Sept 2013 –
  Aug 2024) settled with court approval on Feb 25, 2025 — reported at $100M plus notice
  costs in the class-notice coverage, while a Dealership Guy headline referenced a $600M
  figure for CDK antitrust resolution. NEEDS_EXTERNAL_RESEARCH: reconcile the exact
  settlement amount(s) across the two reports.
- **Canada relevance:** DXP formally launched in Canada April 30, 2024. CDK Drive is a
  certified DMS for BMW Group Canada (July 2023; "CDK Drive DMS Canada Essential
  Package" with predictive digital service, dealer performance metrics, two-way data
  sharing). Canadian DMS market is contested by PBS, Serti, Reynolds, and Tekion —
  CDK's Canadian footprint is real but not dominant the way it is in the US
  (one tech-tracking site counts only a few dozen Canadian customers; low confidence).

### 2. CDK CRM (Elead)

- **Positioning:** enterprise automotive CRM, "AI-powered CRM software created for auto
  dealerships." Acquired by CDK (Elead/ELEAD1ONE) to power lead management, BDC
  workflows, and marketing automation; now sold as CDK CRM inside DXP.
- **Key features (verified from reviews/vendor pages):**
  - **Internet Lead Management (ILM)** with centralized lead routing across rooftops.
  - **Tablet-first showroom app** ("CDK Modern Retail CRM" on iOS/Android): sales staff
    run the customer/deal process from a tablet on the lot — one of its two signature
    differentiators.
  - **CRM-native Virtual BDC:** the only CRM vendor operating its own outsourced BDC
    service inside the CRM (task-based outbound follow-up, reported ~7,000 clients) —
    the other signature differentiator.
  - **BDC Campaigns** module for follow-up sequences, lead nurturing, and contact
    engagement; dedicated BDC software launched Aug 2020 for online lead management.
  - **DMS Equity Mining** — surfaces sales opportunities hiding in the dealer's own
    DMS database (their AutoAlert-style play).
  - **Desking, e-blast/email templates, phone-call monitoring.**
  - **Reporting: 300+ pre-built reports**, group dashboards spanning sales, service,
    and BDC teams.
  - **Native DMS sync** when the DMS is CDK: deals, inventory, customer records,
    service history with no third-party middleware or nightly batch imports.
  - **AI (NADA 2026): AI Summary** (condenses customer/lead history), conversational
    queries, lead prioritization, and writing assistance in the CRM.
- **Pricing notes:** review-site listing shows a CRM package at **$285/dealer/month**
  (Software Advice profile); real quotes vary by rooftop/seats and are not public.
- **Strengths:** genuinely strong reporting/analytics (repeated praise on G2 ~4.4);
  showroom tablet workflow; the Virtual BDC as a service moat; scale features (group
  dashboards, multi-rooftop routing).
- **Weaknesses/complaints:** support is the #1 complaint — unanswered emails, long
  phone queues, and dealers cannot self-serve config changes ("have to call in for most
  things to be changed"); reported glitches slowing operations; some reviewers flatly
  recommend against it. Tied to CDK contract/ecosystem gravity.
- **Canada relevance:** sold in Canada as part of DXP/Fundamentals; no Canada-specific
  CASL/PIPEDA consent tooling surfaced in public materials. NEEDS_EXTERNAL_RESEARCH:
  whether CDK CRM ships CASL-specific consent/opt-out workflows for Canadian dealers.

### 3. CDK Modern Retail Suite (digital retail + F&I; ex-Roadster)

- **Positioning:** "streamline the front office" — one connected buyer journey across
  CRM, DMS, desking, digital retail, and e-contracting; built on the 2021 acquisition of
  **Roadster** (consumer digital-retail platform).
- **Key workflow mechanics (verified):**
  - **Integrated desking:** lender rates, incentives, and residuals flow directly into
    the desking screen so managers present "pennable" (bookable-as-shown) deals
    immediately — explicitly marketed as killing the "back and forth to the tower."
  - **Sales Docs:** customers digitally sign non-financial forms from anywhere.
  - **eContracting:** lender contracts signed electronically and submitted straight
    from the **digital deal jacket**; forms auto-populated from DMS + desking data;
    contracts validated before submission to cut **contracts in transit (CIT)** and
    speed funding/cash flow.
  - **AIVA in Modern Retail:** CDK claims +25% consumer appointment scheduling.
- **Pricing notes:** not public.
- **Strengths:** true online-to-showroom deal continuity (same deal object from website
  to F&I); the desking-with-live-lender-data mechanic; measurable CIT/funding-speed
  story.
- **Weaknesses/complaints:** franchise-new-car centric (lender/incentive/residual rails
  matter most for new-car OEM programs); depends on being inside the CDK stack;
  independents with outside financing get less value.
- **Canada relevance:** included in the Canadian DXP launch; Canadian lender-network
  depth (e.g., non-prime lenders used by independent used-car dealers) not documented
  publicly. NEEDS_EXTERNAL_RESEARCH: which Canadian lenders are wired into CDK
  eContracting.

### 4. Fortellis (API platform / app marketplace)

- **Positioning:** "automotive app development network & marketplace" — CDK's answer to
  the walled-garden criticism; a developer platform where ISVs, OEMs, and dealers
  exchange data via standardized APIs, plus a Marketplace of certified apps.
- **Key mechanics (verified):**
  - Developers build against CDK/Elead APIs published on Fortellis; **apps must pass a
    paid certification** (workflow doc review, marketplace listing approval,
    certification fee) before going live.
  - **Pay-as-you-go API pricing** exists for experimentation.
  - A published **Partner Program Price Guide** lists "writeback packages" priced per
    dealer per month — i.e., third parties pay recurring fees for the right to write
    data back into the DMS (dealers ultimately absorb these costs).
  - Dealer-community threads (DealerRefresh "CDK Third Party Access Pricing Guide")
    document long-running frustration with these integration tolls — the so-called
    "CDK tax" that fed the antitrust litigation (settled 2025).
- **Strengths:** real API surface, developer docs, professional-services support; the
  standard-API vision is directionally right.
- **Weaknesses/complaints:** monetized gatekeeping — certification fees + per-dealer
  monthly writeback fees make integration expensive; Tekion's Dec 2024 suit alleges
  broader anti-competitive integration behavior (e.g., blocking an Asbury Automotive
  pilot). The 2024 outage also proved that "open platform" still meant "single point of
  failure" for anyone whose integrations all terminated in CDK.
- **Canada relevance:** Fortellis is cross-border; no Canada-specific constraints found.

### 5. AIVA + Intelligence Suite (AI layer)

- **Positioning:** "AI at CDK" — agentic AI woven through DXP rather than a chatbot
  bolt-on. AIVA = "Artificial Intelligence Virtual Assistant."
- **Key features (verified from NADA 2025/2026 materials):**
  - **AIVA for DXP:** conversational, on-the-spot Q&A over the dealer's own CDK data
    ("ask a question, get an answer") — the most popular booth demo at NADA 2026.
  - **AIVA for Fixed Operations:** 24/7 AI appointment scheduling on service.
  - **AI Summary for CRM and Service:** condensed histories for staff.
  - **AI Forms:** AI-assisted form completion in the buying/selling process.
  - **Intelligence Suite claims:** 20% more accurate forecasting; 80% reduction in
    daily KPI review time; a new **Customer Data Platform** unifying customer data.
- **Pricing notes:** not public.
- **Strengths:** the "converse with your dealership system" framing is exactly where
  the market is going; CDK has the data scale to make CDP + forecasting credible.
- **Weaknesses/complaints:** vendor-published ROI numbers, no independent verification;
  no public audit trail or approval-gate story for what AIVA does autonomously; AI is
  additive to an expensive legacy stack rather than native.

### 6. The June 2024 cyberattack/outage — what it taught the industry

- **Facts:** June 18–19, 2024, BlackSuit ransomware hit CDK; a second incident struck
  during initial recovery. Roughly **15,000 dealerships across the US and Canada** lost
  their DMS/CRM for about two weeks. Ransom demand reportedly escalated from $10M to
  $50M+ (CDK reportedly paid ~$25M; widely reported but never confirmed by CDK —
  treat as unconfirmed). Estimated **$1B+ collective dealer losses** (Anderson Economic
  Group). Class-action suits followed; separately the CDK/Reynolds DMS-pricing
  antitrust class settled with court approval Feb 2025.
- **Operational reality during the outage:** dealers reverted to paper deal jackets,
  hand-written repair orders, and crowd-sourced continuity playbooks (Dealership Guy
  published 29 dealer best practices). Competitors pounced: Tekion gave affected
  dealers free access to Tekion Digital Processing (tax/title/license); Reynolds
  offered free desking to Elead CRM users and ramped its print facility for paper forms.
- **Lessons the industry drew (verified across security/trade coverage):**
  1. **Vendor concentration is systemic risk** — one vendor at ~50% market share means
     one breach halts half the industry.
  2. **All-in-one is also all-down-at-once** — the more suites live in one cloud, the
     larger the blast radius.
  3. **Dealers need offline/degraded-mode continuity** — exportable data, printable
     work queues, local caches, documented paper fallbacks.
  4. **Vendor risk management and transparency now factor into DMS purchase decisions**
     — dealers ask about security audits, recovery SLAs, and exit paths.
  5. **Lock-in compounds the damage** — dealers couldn't switch quickly even when down,
     because data, integrations, and contracts all lived with CDK.

---

## What DealerOS should copy conceptually

1. **The "one deal object" spine (Modern Retail).** A single customer/deal record that
   travels website → CRM → desking → F&I with no rekeying is CDK's best idea. DealerOS
   already implies this via Customer 360 + Lead Pipeline + deal drafts; make "no
   rekeying, ever" an explicit design law.
2. **Desking that produces "pennable" numbers.** Even for a used-car independent, the
   mechanic of pulling live rate/fee/tax data into the first pencil — so the number
   shown is the number signed — is worth cloning at our scale (BC taxes/fees, lender
   programs when connectors allow).
3. **Tablet-first showroom workflow (Elead).** The salesperson works the lot, not a
   desktop. Our TMS traffic desk and appointment board should be designed mobile-first
   from day one.
4. **CRM-native BDC as a productized service.** Elead's Virtual BDC proves dealers will
   pay for outcomes, not software. Our AI BDC agent is the automated version — package
   it as "your BDC, with receipts," with human escalation built in.
5. **Suite tiering by dealer size (Foundations vs Fundamentals).** A cut-down
   independent-dealer tier with an upgrade path is exactly right for our
   land-and-expand: Budget Wheels tier → dealer-group tier.
6. **Named, countable AI features.** AIVA/AI Summary/AI Forms are memorable, scoped,
   demoable units. Ship "Traffic Answers" (ask your traffic desk anything), "Lead
   Summary," "Deal Forms Assist" as named features rather than an amorphous "AI."
7. **A published API surface with a partner program.** Fortellis' shape (docs,
   marketplace, certification) is right; only its toll economics are wrong.
8. **Equity mining wired into the CRM.** Elead's "DMS Equity Mining" validates module 7
   (opportunity engine) as a CRM-native feature, not a separate AutoAlert subscription.
9. **KPI/forecasting dashboards with time-saved framing.** "Cut daily KPI review time
   80%" is a compelling manager pitch; our traffic-desk manager dashboard should quote
   minutes saved, not just charts.

## What DealerOS should do better

1. **Transparent, published pricing.** CDK's opaque quotes, fee stacking, and ~$30K/mo
   all-in reality are the #1 dealer grievance. Publish flat per-rooftop pricing with
   AI included; no per-integration tolls.
2. **No integration tax.** CDK charged partners per-dealer monthly writeback fees and
   got sued for it. Our connector registry should be free/cheap and self-serve —
   openness as a weapon, with Cognitia receipts making openness safe.
3. **Resilience as a feature (the anti-CDK).** Ship degraded-mode operation: daily
   tenant data exports, printable traffic-desk sheets and deal jackets, offline-capable
   appointment board, documented paper-fallback runbook, published RTO targets. Sell
   "you own your data and you can leave" — CDK's outage made this a buying criterion.
4. **Self-serve configuration.** Elead users complain they must phone support to change
   anything. Every setting in DealerOS (routing rules, templates, SLA timers, sources)
   is tenant-admin-editable in-app, with audit receipts instead of gatekeeping.
5. **Independent-used-car-first, Canada-first.** CDK is franchise/new-car/US-first;
   its Canadian package leads with BMW certification. We lead with CASL/PIPEDA/PIPA-BC
   consent handling, GST/PST-aware deal math, Kijiji/FB Marketplace/AutoTrader.ca
   listing workflows — none of which CDK markets.
6. **AI with governance, not just demos.** AIVA has no public story on approval gates,
   audit trails, or what the agent may do autonomously. Every DealerOS AI action is
   draft-first, human-approved for external side effects, and receipted.
7. **Support as product.** Against CDK's worst-reviewed dimension, commit to in-app
   change requests with SLA timers — dogfooding our own traffic-desk accountability
   mechanics on ourselves.
8. **Verifiable ROI claims.** CDK publishes unaudited "20%/80%/25%" numbers. Our
   equivalent claims ship with proof-report receipts per tenant — numbers a dealer can
   audit, which also keeps us claim-safe.

## How Cognitia proof receipts make our version harder to copy

- CDK's platform records *data*; Cognitia records *accountable actions*. Every
  DealerOS event that matters (`lead_received`, `ai_reply_drafted`,
  `human_approval_granted`, `appointment_confirmed`, `sold_marked`,
  `connector_sync_completed`…) emits a receipt with actor identity (human vs agent),
  policy-gate result, consent basis, payload hash, and rollback/dispute paths. CDK has
  no public equivalent — bolting a cryptographic-grade audit ledger onto a 50-year-old
  DMS core and dozens of acquired products (Elead, Roadster) is an architecture
  rewrite, not a feature release.
- Post-outage, dealers now ask "what happened, who did it, can I prove it?" Receipts
  answer that natively: an incident timeline is a query, not a forensics engagement.
- The antitrust history cuts our way too: CDK monetized *access* to dealer data; we
  give dealers a signed ledger showing exactly who touched their data and under what
  consent basis — trust as the moat instead of tolls.
- AI governance: when regulators or OEMs start demanding evidence of what an AI agent
  said to a consumer (CASL consent, AI disclosure), AIVA-style assistants have no
  receipt trail to show; ours is the default output of every agent action.

## How Demandara integration makes our version more revenue-native

- CDK's stack starts when a lead arrives; marketing lives in separate products and
  third-party agencies, and attribution dies at the CRM boundary. DealerOS +
  Demandara closes the loop natively: Demandara generates demand (SEO/AEO pages,
  campaigns, listings), pushes leads via `POST /api/demandara/leads`, and reads
  outcomes back via `GET /api/demandara/outcomes` and
  `GET /api/demandara/revenue-attribution` — so every campaign is scored on sold
  units, not form fills.
- Elead's Virtual BDC is human labor sold at service margins; Demandara's AI BDC +
  Sales Closer drafts replies, appointments, and follow-ups through
  `/api/demandara/reply-drafts` and `/api/demandara/appointment-drafts`, with human
  approval and proof receipts — service-level outcomes at software cost.
- CDK's new CDP unifies data but doesn't *do* anything with it for demand gen; our
  loop feeds CRM outcomes back into campaign optimization automatically
  (lead-to-sale feedback loop, monthly proof-backed marketing reports via
  `GET /api/demandara/proof-report`).
- Net positioning: CDK sells dealers an operating cost; DealerOS + Demandara sells a
  revenue engine where marketing spend, traffic desk, and closed deals reconcile in
  one receipted attribution chain no franchise-era vendor can replicate without
  owning both sides.

## Sources

- [CDK Dealership Xperience Platform (official)](https://www.cdkglobal.com/dealership-xperience-platform)
- [Everything You Need to Know About the CDK Dealership Xperience (CDK)](https://www.cdkglobal.com/insights/everything-you-need-know-about-cdk-dealership-xperience)
- [CDK to Showcase Expansion of DXP at NADA 2025 (CDK press)](https://www.cdkglobal.com/media-center/cdk-showcase-expansion-dealership-xperience-platform-nada-show-2025)
- [CDK Showcases Automotive Retail Leadership at NADA 2026 (CDK press)](https://www.cdkglobal.com/media-center/cdk-showcases-automotive-retail-leadership-nada-2026)
- [What We Shared About Data and Intelligence at NADA 2026 (CDK)](https://www.cdkglobal.com/insights/what-we-shared-about-data-and-intelligence-nada-2026)
- [AI at CDK (official)](https://www.cdkglobal.com/ai-at-cdk)
- [AI vs. AIVA: A Guide for Dealers and Developer Partners (CDK)](https://www.cdkglobal.com/insights/ai-vs-aiva-dealers-developers)
- [AIVA for Fixed Operations (CDK)](https://www.cdkglobal.com/aiva-fixed-operations)
- [CDK CRM / Elead (official)](https://www.cdkglobal.com/elead-crm)
- [AI-Powered CRM Software (CDK CRM, official)](https://www.cdkglobal.com/automotive-crm)
- [CDK Modern Retail Suite (official)](https://www.cdkglobal.com/cdk-modern-retail-suite)
- [Streamline the Front Office With CDK Modern Retail Suite (CDK)](https://www.cdkglobal.com/insights/everything-you-need-know-about-cdk-modern-retail-suite)
- [Automotive Digital Retailing (CDK)](https://www.cdkglobal.com/automotive-digital-retailing)
- [CDK Global Acquires Roadster (F&I and Showroom Magazine)](https://www.fi-magazine.com/news/cdk-global-acquires-digital-retail-platform-roadster)
- [CDK Global Brings Digital Transformation… DXP launch (BusinessWire, Aug 2023)](https://www.businesswire.com/news/home/20230814178898/en/CDK-Global-Brings-Digital-Transformation-to-Automotive-Retail-With-New-Category-of-Software-The-CDK-Dealership-Xperience)
- [CDK Brings DXP to Canada (BusinessWire, Apr 2024)](https://www.businesswire.com/news/home/20240430796101/en/CDK-Brings-Digital-Transformation-to-Canadian-Automotive-Retail-With-New-Category-of-Software-the-CDK-Dealership-Xperience)
- [CDK DXP Canada launch (CDK press)](https://www.cdkglobal.com/media-center/cdk-brings-digital-transformation-canadian-automotive-retail-new-category-software-cdk)
- [CDK DMS Certification with BMW Group Canada (CDK press)](https://www.cdkglobal.com/media-center/cdk-global-achieves-dealer-management-system-certification-bmw-group-canada)
- [Top 5 Canadian DMS Providers (Dealer By Design blog)](https://blog.dealerbydesign.ca/top-5-canadian-dms-providers-for-automotive-dealerships)
- [ELEAD CRM Review 2026 (Ringlead Automotive)](https://www.ringlead.ca/blog/compare/elead-crm-review-2026/)
- [CDK CRM Reviews (G2)](https://www.g2.com/products/cdk-crm/reviews)
- [CDK Global Reviews (Capterra)](https://www.capterra.com/p/122988/CDK-Global/reviews/)
- [CDK Global Reviews, Demo & Pricing (Software Advice)](https://www.softwareadvice.com/crm/cdk-drive-profile/)
- [CDK BDC Software launch (BusinessWire, Aug 2020)](https://www.businesswire.com/news/home/20200831005204/en/CDK-Global-Introduces-New-BDC-Software-That-Offers-Automotive-Dealerships-Efficient-Management-of-Online-Leads)
- [CDK Modern Retail CRM app (Apple App Store)](https://apps.apple.com/us/app/cdk-modern-retail-crm/id1288617058)
- [Fortellis (official)](https://fortellis.io/)
- [CDK API Solutions (official)](https://www.cdkglobal.com/cdk-global-api-solutions)
- [Fortellis App Certification Process (Fortellis community)](https://community.fortellis.io/community/forum/app-certification-process/cdk-api-certification)
- [Fortellis App Launch Guide v5.0 (PDF)](https://community.fortellis.io/sites/default/files/Fortellis%20APP%20Launch%20Guide.pdf)
- [CDK Partner Program Price Guide — writeback packages per dealer/month (PDF)](https://www.cdkglobal.com/sites/cdk4/files/PDFfiles/Partner_Program_Price_Guide.pdf)
- [CDK Third Party Access Pricing Guide thread (DealerRefresh forum)](https://forum.dealerrefresh.com/threads/cdk-third-party-access-pricing-guide.5345/)
- [The CDK Global outage: how it happened (TechTarget)](https://www.techtarget.com/whatis/feature/The-CDK-Global-outage-Explaining-how-it-happened)
- [CDK Global Ransomware Attack (BlackFog)](https://www.blackfog.com/cdk-global-ransomware-attack/)
- [CDK Global: Lessons From the Car Dealership Cyberattack (IS Partners)](https://www.ispartnersllc.com/blog/car-dealership-cyberattack/)
- [CDK Global Breach 2024: 2-Week Auto Shutdown (Cloudskope)](https://www.cloudskope.com/breaches/cdk-global-breach-2024)
- [CDK Global Ransomware Attack Sends Shockwaves (ExtraHop)](https://www.extrahop.com/blog/CDK-Global-Ransomware-Attack-Sends-Shockwaves)
- [29 crowd-sourced dealership best practices during the CDK outage (Dealership Guy)](https://news.dealershipguy.com/p/20-crowd-sourced-dealership-best-practices-to-combat-the-cdk-global-outages)
- [CDK antitrust settlement coverage (Dealership Guy, Jan 2025)](https://news.dealershipguy.com/p/cdk-global-resolves-antitrust-case-with-600-million-settlement-2025-01-28)
- [Tekion Digital Processing CDK Outage Offer (Tekion)](https://go.tekion.com/tdp-cdk-outage-offer)
- [CDK cyberattack disrupts dealerships, competitor responses (CBT News)](https://www.cbtnews.com/cdk-global-cyberattack-disrupts-auto-dealerships-for-third-day/)
- [DMS disrupted: challengers to CDK and Reynolds (Automotive News)](https://www.autonews.com/dealers/dms-disrupted-not-just-2-giants-now/)
- [CDK Global (Wikipedia)](https://en.wikipedia.org/wiki/CDK_Global)
- [Best Dealership DMS Software 2026 (VendorMotive)](https://www.vendormotive.com/insights/best-dealership-dms-software-2026)
- [EverLogic vs CDK cost comparison (EverLogic blog)](https://blog.everlogic.com/everlogic-or-cdk-global-better-fit-for-your-dealership)

## Boundaries honored

Public marketing/review/trade sources only; no sign-ups, no vendor contact, no scraping
behind auth. No fabricated features — unverified items are marked
`NEEDS_EXTERNAL_RESEARCH`. Vendor ROI claims are attributed, not endorsed. No public
claims authorized; internal design research only. No live CRM/DMS writes; no outreach.
