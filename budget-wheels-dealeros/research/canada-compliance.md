# Research: Canadian dealership compliance landscape

STATUS: INTERNAL — RESEARCH NOTES. Compiled 2026-07-03 from public sources.

SCOPE NOTE: High-level competitive/product-design intelligence only. This is
NOT legal advice and must not be treated as a compliance checklist. Anything
DealerOS ships that makes a compliance-adjacent claim needs legal counsel
review first (see CONTEXT_PACK.md hard boundaries: "No unsupported compliance
claims").

## Products covered

For this category, "products" = the regulatory regimes DealerOS must be
designed around, plus two Canadian dealer-software vendors that have already
productized compliance (useful as feature benchmarks).

### 1. CASL (Canada's Anti-Spam Legislation, administered by CRTC)

- **Positioning:** Federal regime governing every commercial electronic
  message (CEM) a dealer sends — email, SMS, some social/messaging. The single
  biggest daily-workflow constraint on an AI BDC and follow-up engine.
- **Key mechanics (verified from CRTC guidance and secondary sources):**
  - Two consent bases: **express** (opt-in, does not expire, revocable
    anytime) and **implied** (based on an "existing business relationship").
  - Implied-consent windows: roughly **2 years after a purchase/formal
    agreement**, and **6 months after an inquiry** where the prospect gave
    contact info. Implied consent expires; express does not.
  - Every CEM must: identify the sender, include contact info, and include a
    working **unsubscribe mechanism** — free, "readily performed," the
    contact means operational for **at least 60 days**, and the opt-out
    honored **within 10 business days**, even if the request arrives through
    another channel.
  - **Burden of proof is on the sender.** The CRTC expects organizations to
    be able to prove the consent they rely on for each message.
  - Penalties: administrative monetary penalties up to **$1M per violation
    (individuals) / $10M per violation (corporations)**. Recent enforcement
    example: **Hudson's Bay Company fined $120,000 in 2024** for promotional
    texts without adequate consent documentation.
- **Pricing notes:** N/A (regulation). Compliance cost is workflow + records.
- **Strengths (as a "product"):** Clear two-tier consent model; CRTC
  publishes plain-language FAQs and implied-consent guidance dealers can act on.
- **Weaknesses / complaints:** Implied-consent expiry math (per-contact,
  per-event, rolling windows) is genuinely hard to track manually; most
  dealer CRMs treat consent as a single boolean and leave the dealer exposed.
- **Canada relevance:** Universal — applies to every DealerOS tenant from day one.
- NEEDS_EXTERNAL_RESEARCH: exact CRTC record-keeping guidance text (crtc.gc.ca
  pages returned 403 via our fetch proxy; summaries above come from search
  snippets of the CRTC pages plus law-firm guides and should be re-verified
  against the primary pages before any spec is finalized).

### 2. BC Vehicle Sales Authority (VSA) + Motor Dealer Act BC

- **Positioning:** BC's delegated regulator for retail vehicle sales.
  Licenses dealers and salespeople, administers the Motor Dealer Act and
  publishes binding-in-practice Advertising Guidelines (current edition
  effective **November 19, 2025**).
- **Key mechanics (verified):**
  - **Licensing:** anyone selling **more than 5 vehicles/year** is deemed a
    dealer; every retail salesperson must hold a VSA salesperson licence
    (19+, mandatory Salesperson Licensing Course, 45-day conditional licence,
    employment verified before issuance). Dealers pay application fees plus
    contributions to the **Motor Dealer Customer Compensation Fund**.
  - **All-in ("total") price advertising:** any advertised price must be the
    **total price the consumer pays except taxes**. Non-negotiable dealer
    fees (documentation/admin) must be inside the advertised price; if fees
    aren't disclosed, **the advertised price is assumed to be the Total Price**.
  - **Required ad content:** dealer registration number, stock number, and
    VIN in each vehicle ad; if cash and finance prices differ, **both prices
    must appear**; credit offers require the full credit-offer details.
  - **Disclosure duties:** prior use as **taxi, rental, lease, or emergency
    vehicle**; out-of-province registration history; rebuilt/salvage/altered
    status (ICBC Vehicle Status categories: normal, rebuilt, salvage,
    altered); duty to disclose all known **material defects**.
- **Pricing notes:** licensing fees scale with vehicle type/volume and
  D-plates; N/A as software pricing.
- **Strengths:** VSA publishes bulletins, online-advertising tips, and
  guidelines PDFs — a machine-checkable rule set is realistically derivable.
- **Weaknesses / complaints:** Rules live in scattered PDFs and bulletins;
  no vendor we found offers automated VSA ad-rule linting for listings.
- **Canada relevance:** Governs tenant-zero (Budget Wheels, Vancouver/BC) directly.
- NEEDS_EXTERNAL_RESEARCH: full text of the Nov 19, 2025 VSA Advertising
  Guidelines PDF (fetch blocked, 403) — need exact section numbers for
  "was/now" pricing, free-offer rules, and demonstrator-vehicle rules before
  building a listing-compliance linter.

### 3. PIPEDA + BC PIPA (privacy regimes)

- **Positioning:** Private-sector privacy law. **BC PIPA** (deemed
  "substantially similar" to PIPEDA) governs intra-BC handling; **PIPEDA**
  applies when personal information crosses provincial/national borders —
  which a multi-tenant SaaS almost always triggers.
- **Key mechanics (verified):**
  - Consent required for collection/use/disclosure; an organization **cannot
    make consent to unnecessary collection a condition of service**;
    individuals may **withdraw consent** on reasonable notice.
  - **Access + correction rights:** individuals can see and correct their
    personal information; PIPEDA requires complete, timely, low/no-cost access.
  - **No general right to erasure** under BC/AB PIPA (rights are access +
    correction), BUT organizations must **destroy or anonymize** personal
    information once it's no longer needed for legal/business purposes —
    i.e., retention schedules are mandatory even without a "delete my data" right.
  - **Data residency:** PIPEDA does **not** mandate Canadian storage.
    Cross-border transfer is permitted with "comparable protection"
    (contractual safeguards with processors) plus **transparency to
    individuals** that data may be stored/processed outside Canada. Hard
    residency rules are public-sector (BC FIPPA, NS) or contractual, not
    private-sector dealership law.
  - Relevant precedent: OPC Finding #2009-023 — a vehicle-repair complaint
    email reused for marketing without consent was a violation (purpose
    limitation applies directly to dealer service-to-sales workflows).
- **Weaknesses / complaints:** Two overlapping statutes confuse dealers;
  purpose-limitation violations (service data reused for sales pitches) are
  the classic dealership failure mode — exactly what the DealerOS equity
  mining and service-to-sales modules will touch.
- **Canada relevance:** Universal; BC PIPA specifically for tenant-zero.

### 4. Expansion regimes: OMVIC (Ontario) + Quebec Law 25

- **Positioning:** The two regimes that dominate a Canada-wide roadmap after BC.
- **Key mechanics (verified):**
  - **OMVIC all-in pricing (law since 2010):** advertised price must include
    all fees/charges **except HST and licensing**; ads must prominently show
    dealer info, past-use disclosures, all-in price, and details of any
    included extended warranty. Penalties: up to **$25,000** (discipline) /
    **$250,000** (prosecution). A **late-2025 CBC Marketplace investigation
    found 6 of 15 GTA dealerships charged more than advertised** — enforcement
    attention is active right now.
  - **Quebec Law 25:** applies to anyone handling Quebec residents' personal
    information regardless of location; requires **Privacy Impact
    Assessments**, explicit consent rules, and **72-hour breach
    notification**; penalties up to **$25M**. Even an out-of-province dealer
    selling to a Quebec buyer is captured.
- **Canada relevance:** Design the compliance engine as **per-province policy
  packs** now, so BC → ON → QC expansion is configuration, not re-architecture.

### 5. Activix CRM (Canadian dealer CRM — compliance benchmark)

- **Positioning:** Quebec-based automotive CRM, "most innovative CRM in North
  America," **840+ Canadian dealerships**; also white-labeled/offered via
  AutoSync. Its MatadorAI messaging layer automates sales/service responses 24/7.
- **Key compliance features (from vendor marketing):** "smart and
  CASL-compliant" automation — **built-in CASL compliance tracking** covering
  consent records, opt-out requests, and communication preferences;
  Broadcast, Service AI, appointment booking/rescheduling, Sequences.
- **Pricing notes:** not published. NEEDS_EXTERNAL_RESEARCH: Activix pricing
  tiers and how granular its consent model actually is (channel-level? expiry
  tracking? proof export?).
- **Strengths:** Canada-first DNA; CASL handled as a product feature, not an
  afterthought; large Canadian install base = credibility.
- **Weaknesses:** Consent features are described as tracking, not *proof* —
  no public evidence of exportable, audit-grade consent evidence per message;
  no VSA/OMVIC advertising-rule tooling found.
- **Canada relevance:** The closest thing to a Canadian compliance-aware CRM
  incumbent DealerOS will be compared against.

### 6. Kimoby (dealership messaging / "Service Lane OS" — compliance benchmark)

- **Positioning:** Quebec City-based dealership engagement/texting platform,
  now "Service Lane OS" (approvals, payments, loaners, follow-up) on top of
  CDK, Reynolds, PBS, Tekion, Serti; **1,000+ dealerships** in North America.
- **Key compliance features:** publishes its own **"CASL-Compliant Text
  Messaging Explained"** help documentation — consent capture at write-up,
  sender identification and opt-out language baked into templates.
- **Pricing notes:** not published publicly.
- **Strengths:** Treats CASL-compliant SMS as a first-class onboarding topic;
  strong service-drive workflow (the exact surface DealerOS module 8 targets).
- **Weaknesses:** Service-lane-centric, not a full CRM/traffic desk; CASL
  handling is documentation + template hygiene rather than enforced policy
  gates; no per-message consent-basis ledger visible publicly.
- **Canada relevance:** Benchmark for SMS consent UX in Canadian service drives.

### Cross-cutting: AI disclosure expectations (no statute yet, real liability now)

- **AIDA is dead as drafted:** Bill C-27 (CPPA + AIDA) died when Parliament
  was prorogued in **January 2025**; in June 2025 the AI minister confirmed
  AIDA is off the table as drafted ("light, tight, right" approach promised).
  **There is currently no AI-specific Canadian law in force.**
- **But liability is already established:** *Moffatt v. Air Canada* (BC Civil
  Resolution Tribunal, 2024) — company held liable for **negligent
  misrepresentation by its website chatbot**; the "chatbot is a separate
  entity" defense was rejected. Directly on point for a BC-first AI BDC.
- **Dealership-specific incident:** a Toronto **BMW dealership's AI chatbot
  generated a car buy-back offer** the store tried to revoke (CBC, 2026);
  public backlash forced reinstatement. The customer's stated frustration:
  **he didn't know he was talking to an AI**.
- **Emerging norms** (from legal/industry commentary): disclose AI
  involvement; define hard authority limits (what the AI may never offer,
  price, or commit to); provide human recourse; log everything. US state
  laws (California bot-disclosure, Colorado AI Act) are shaping cross-border
  vendor expectations even without Canadian statute.

## What DealerOS should copy conceptually

1. **Consent as a first-class CRM object (Activix):** consent status,
   channel, basis, and preferences live on the customer record and gate the
   messaging layer — copy the concept, then exceed it (see below).
2. **Compliance baked into templates (Kimoby):** every outbound SMS/email
   template ships with sender identification and unsubscribe language
   pre-inserted; the user cannot send a CEM without them.
3. **Consent capture at natural workflow moments (Kimoby service write-up):**
   collect express consent at lead intake, appointment booking, service
   check-in — moments the customer is already engaged — rather than as a
   separate campaign.
4. **Plain-language regulator guidance as product UI (VSA/OMVIC bulletins):**
   surface "why this rule exists" microcopy next to every compliance gate so
   salespeople learn the rule instead of fighting the software.
5. **Per-province rule packs (OMVIC vs VSA divergence):** all-in price means
   "everything except taxes" in BC but "everything except HST and licensing"
   in Ontario — model advertising rules as versioned, province-scoped policy
   data, not hardcoded logic.

## What DealerOS should do better

1. **CASL consent-expiry engine, not a boolean.** Track per-contact,
   per-channel consent with basis (express / implied-EBR / implied-inquiry),
   source event, capture evidence, and a computed expiry (2-year purchase
   clock, 6-month inquiry clock, rolling on new events). Alert types:
   `consent_expiring_30d`, `consent_expired_blocked`, `implied_basis_renewed`.
   No incumbent visibly does expiry math.
2. **Hard policy gates, not warnings.** AI BDC drafts to a contact with no
   valid consent basis are blocked at the gate (policy_gate_result=denied),
   with a compliant re-permission path suggested. Opt-outs propagate across
   all channels within the workflow same-day (statute allows 10 business
   days; beat it by design).
3. **VSA/OMVIC listing linter.** Before a vehicle page or marketplace listing
   publishes, an automated check verifies: total price present and
   fee-inclusive, dealer number + stock number + VIN present, dual
   cash/finance prices when applicable, prior-use and rebuilt-status
   disclosures pulled from the inventory record's disclosure fields. Report
   name: "Ad Compliance Pre-Flight." Nobody in the Canadian dealer stack
   offers this today (verified absence in vendor marketing; treat as
   NEEDS_EXTERNAL_RESEARCH for smaller vendors before claiming "first").
4. **AI disclosure by default + authority limits.** Every AI BDC surface
   self-identifies as AI-assisted (Moffatt/BMW lessons), and the model router
   enforces a hard "may not commit" list: no price commitments, no buy-back
   offers, no financing approvals — those always route to human approval.
   This is already consistent with modules 6/13/14 in the context pack.
5. **Retention/deletion automation PIPA-style.** Since BC PIPA requires
   destroy-or-anonymize when data is no longer needed, ship per-tenant
   retention schedules with automated anonymization jobs and an access-request
   export workspace (access + correction are the rights that actually exist).
6. **Data-residency as a sellable option, not a scramble.** Offer
   Canadian-region hosting by default with documented processor contracts for
   any cross-border subprocessor — legally optional for private-sector
   dealers, commercially persuasive, and future-proof for public-sector-adjacent
   or Quebec deals.

## How Cognitia proof receipts make our version harder to copy

- **CASL's burden of proof IS our product.** The sender must prove consent;
  Cognitia's `consent_captured` receipts (with consent_basis, data_refs,
  payload_hash, timestamp) turn every consent event into tamper-evident
  evidence. A dealer facing a CRTC inquiry exports a consent evidence report
  per contact — incumbents log preferences; we produce *proof*. Copying this
  requires rebuilding an audit ledger, not adding a field.
- **Every gate decision is a receipt.** `policy_gate_result` on every
  `ai_reply_drafted` / `followup_sent` receipt means the dealer can show not
  only that they complied, but that non-compliant sends were *blocked* —
  a defensibility narrative no template-hygiene competitor can tell.
- **Moffatt-proofing the AI BDC.** `human_approval_granted` receipts on every
  externally visible commitment give the dealer a documented chain showing
  the AI never made unauthorized offers — the exact evidence the BMW
  dealership lacked.
- **Ad-compliance receipts.** Listing publishes emit receipts capturing the
  pre-flight check result and the disclosure fields shown — a dated record
  that the ad carried total price, VIN, and prior-use disclosures at publish
  time, useful if a VSA/OMVIC complaint arrives months later.

## How Demandara integration makes our version more revenue-native

- **Consent-aware demand gen.** Demandara campaign pushes flow through the
  same consent gates (`POST /api/demandara/leads` carries consent basis at
  capture; UTM + consent captured together), so the growth engine can never
  outrun the compliance engine — and re-permission campaigns (winning back
  expired implied consent as express opt-ins) become a *revenue* play run by
  Demandara, not a legal chore.
- **Compliance as a conversion asset.** All-in-price-compliant listings and
  "no hidden fees — VSA-compliant pricing" merchandising directly answer the
  distrust the CBC Marketplace exposé created; Demandara's AEO/SEO pages can
  target "out-the-door price" and "dealer fees BC" queries with genuinely
  compliant content competitors can't safely mimic.
- **Proof-backed marketing reports close the loop.** Demandara's monthly
  proof report (`GET /api/demandara/proof-report`) can include a compliance
  panel — messages sent vs. blocked, consent coverage %, opt-out honor time —
  making "governed growth" a differentiated report the dealer principal shows
  their OMVIC/VSA auditor and their 20-group.

## Sources

- [CRTC — Guidance on Implied Consent under CASL](https://crtc.gc.ca/eng/com500/guide.htm)
- [CRTC — CASL FAQ](https://crtc.gc.ca/eng/com500/faq500.htm)
- [Gowling WLG — Doing Business in Canada: CASL](https://gowlingwlg.com/en/insights-resources/guides/2023/doing-business-in-canada-casl)
- [SendCheckIt — CASL Compliance Guide (2026)](https://sendcheckit.com/blog/casl-compliance-guide)
- [TALK-Q — SMS Messaging Regulation in Canada 2025](https://talk-q.com/sms-messaging-regulation-in-canada)
- [Kimoby — CASL-Compliant Text Messaging Explained](https://help.kimoby.com/casl-compliant-text-messaging-explained)
- [ISED — Texting for good client relations (CASL)](https://ised-isde.canada.ca/site/canada-anti-spam-legislation/en/texting-good-client-relations)
- [VSA BC — Advertising Guidelines PDF (effective Nov 19, 2025)](https://vsabc.ca/wp-content/uploads/2023/02/VSA-Advertising-Guidelines-3.pdf)
- [VSA BC — Industry Bulletin: Important Considerations When Advertising Vehicles (2022-08-31)](https://www.mvsabc.com/Industry-Landing/info-centre/communications/bulletin_2022_08_31/)
- [VSA BC — Dealer fees consumer facts](https://vsabc.ca/consumers/get-information-about-vehicle-purchasing/consumer-protection-facts/dealer-fees/)
- [VSA BC — Buying Used (rebuilt/prior-use disclosure)](https://vsabc.ca/consumers/get-information-about-vehicle-purchasing/buying-a-vehicle/buying-used/)
- [VSA BC — main site (licensing overview)](https://vsabc.ca/)
- [BC Laws — Motor Dealer Act](https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/96316_01)
- [BC Laws — Salesperson Licensing Regulation](https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/202_2017)
- [BC Laws — Personal Information Protection Act (PIPA)](https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/03063_01)
- [OPC — PIPEDA overview](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/)
- [OPC — Q&A: PIPEDA vs Alberta/BC PIPAs](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/r_o_p/02_05_d_26/)
- [BLG — The right to erasure of personal information in Canada](https://www.blg.com/en/insights/2021/05/the-right-to-erasure-of-personal-information)
- [OPC — PIPEDA Finding #2009-023 (repair email used for marketing)](https://www.priv.gc.ca/en/opc-actions-and-decisions/investigations/investigations-into-businesses/2009/pipeda-2009-023/)
- [Lumen IT — Canadian Data Residency: What the Law Actually Requires](https://www.lumenit.ca/guides/data-residency-canada)
- [Pilotcore — Canadian Data Residency Requirements: PIPEDA & Cloud](https://pilotcore.io/blog/canadian-data-residency-and-the-public-cloud)
- [LEGISinfo — Bill C-27 status](https://www.parl.ca/legisinfo/en/bill/44-1/c-27)
- [Gowling WLG — Federal privacy reform: where we left off (2025)](https://gowlingwlg.com/en/insights-resources/articles/2025/federal-privacy-reform)
- [McCarthy Tétrault — Moffatt v. Air Canada: Misrepresentation by an AI Chatbot](https://www.mccarthy.ca/en/insights/blogs/techlex/moffatt-v-air-canada-misrepresentation-ai-chatbot)
- [ABA — BC Tribunal Confirms Companies Liable for AI Chatbot Information](https://www.americanbar.org/groups/business_law/resources/business-law-today/2024-february/bc-tribunal-confirms-companies-remain-liable-information-provided-ai-chatbot/)
- [CBC — Dealership revoked offer to buy back customer's BMW, blaming AI chatbot](https://www.cbc.ca/news/business/ai-chatbot-bmw-dealership-9.7230226)
- [Baker Tilly — AI legal risks for dealerships](https://www.bakertilly.com/insights/up-to-speed-ai-legal-risks-for-dealerships)
- [OMVIC — Advertising Guideline](https://www.omvic.ca/selling/dealer-guidelines-and-resources/advertising-guideline/)
- [CBC Marketplace — Ontario dealerships adding extra charges over advertised price](https://www.cbc.ca/news/marketplace/car-dealerships-ontario-price-9.6969143)
- [READY HUB — Canadian Dealership Compliance Guide 2026 (provincial regimes incl. Law 25)](https://readyhub.ca/blog/2026/03/canadian-dealership-compliance-guide-provincial-regulations/)
- [Activix — CRM](https://www.activix.ca/en/crm)
- [AutoSync — Activix Dealer CRM](https://www.autosync.ca/dealer-crm)
- [Kimoby — Dealership Engagement System](https://www.kimoby.com/dealership-engagement-system)

## Boundaries honored

Research compiled from public marketing/regulatory/news sources only; no
sign-ups, no outreach, no vendor contact. No legal advice given or implied;
unverified items are marked NEEDS_EXTERNAL_RESEARCH. No compliance
certification claims made or authorized. No secrets, no live integrations,
no production claims.
