# DEALEROS SEO / AEO / AIO WEBSITE ENGINE — MODULE 9 SPEC (V1)

STATUS: INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.

Owner: Muhammad Firoz · Date: 2026-07-03 · Version: V1

Scope: Module 9 (Website + Demand Gen engine) per CONTEXT_PACK.md §6. This spec covers
website philosophy, page taxonomy, VDP anatomy, schema.org strategy, AEO/AIO readiness,
local SEO for tenant-zero (Budget Wheels, Vancouver BC), the content pipeline, lead
capture forms, UTM/attribution, the measurement plan, and merchandising sync with
marketplace listings. Reference scaffolds documented here live in
`build-packets/website/` (claims.ts, seo.ts, structured-data.ts, local-pages.ts,
forms.ts, utm.ts, website.test.ts). Sibling docs: DEALEROS_DEMANDARA_DEMAND_GEN_HARNESS_V1.md
(Module 10 campaign/attribution surface this engine feeds),
DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md (Module 4 TrafficEvent consumer),
DEALEROS_COGNITIA_PROOF_ADAPTER_V1.md (Module 11 publish receipts), and
DEALEROS_COMPETITOR_RESEARCH_MATRIX_V1.md (incumbent website-vendor landscape).

---

## 1. Website philosophy: a demand asset, not a brochure

1. **The dealer site is an owned demand asset that DealerOS generates and operates.**
   Marketplace traffic is rented at roughly $80–175 per lead-equivalent (directional,
   US-skewed benchmarks; see research/marketplaces.md §8). Every page this engine ships
   exists to shift lead mix from rented to owned over time, with the shift proven in
   Demandara attribution reports — not asserted.
2. **Every page feeds the traffic desk.** There are no dead-end pages. Each page carries
   at least one conversion path (form, click-to-call, inventory link) and every inbound
   request is classified into a Module 4 `TrafficEvent` with UTM, source, sourceDetail,
   and landingPath (see §11). A page that cannot emit a traffic event does not ship.
3. **Contrast with the incumbent pattern.** TAdvantage-style template sites are
   conversion shells for marketplace-fed traffic, criticized for sameness and weak
   organic SEO beyond inventory pages (research/autosync-trader.md §3). DealerOS ships
   local SEO pages, category pages, AEO answer blocks, and schema.org markup so the
   dealer builds equity in their own traffic — the exact dependency the marketplace-owned
   suite monetizes.
4. **Claim-safe by construction.** Nothing reaches a public surface without passing
   `lintClaimSafety` (build-packets/website/claims.ts) and human approval. Publishing is
   an external side effect (`publish_page`) that emits a Cognitia proof receipt.
5. **Canada-first semantics.** Kilometres, CAD, BC all-in price advertising, CARFAX
   Canada references, CASL express consent. US-built website tools consistently get
   these wrong (research/marketplaces.md, "What DealerOS should do better" #5).

## 2. Page taxonomy (full set)

| # | Page type | Path pattern (default) | Primary job | Generator / config | Structured data |
|---|-----------|------------------------|-------------|--------------------|-----------------|
| 1 | Homepage | `/` | Brand + NAP anchor, inventory entry | tenant branding (Module 1) | Organization, AutoDealer |
| 2 | SRP / inventory search | `/inventory` (+ filter params, canonicalized) | Browse/filter live inventory | Inventory CRM (Module 3) feed | BreadcrumbList; ItemList candidate (V2) |
| 3 | VDP (vehicle detail) | `/inventory/{year}-{make}-{model}-{stockNumber}` | Convert shopper on one VIN | `buildVdpMeta` + `vehicleJsonLd` | Vehicle+Offer, BreadcrumbList |
| 4 | City page | `/used-cars-{city}` (e.g. `used-cars-vancouver`) | Local organic + AEO capture | `LocalPageConfig` kind `city` | LocalBusiness, FAQPage, BreadcrumbList |
| 5 | Service-area page | `/service-area/{area}` (Burnaby, Surrey, Richmond, North Van…) | Adjacent-market capture without fake addresses | `LocalPageConfig` kind `service_area` | LocalBusiness (single real address), FAQPage |
| 6 | Category page | `/used-{category}-{city}` (SUVs, trucks, sedans, vans, EV-hybrid) | Segment intent + internal links to VDPs | `LocalPageConfig` kind `category` | BreadcrumbList, FAQPage |
| 7 | Finance page | `/financing` | Route financing intent to a governed conversation | `LocalPageConfig` kind `finance` | FAQPage |
| 8 | Trade-in page | `/trade-in` | Trade-in intake → TRADE_IN_FORM | `LocalPageConfig` kind `trade_in` | FAQPage |
| 9 | FAQ page | `/faq` | Question capture (AEO/AIO) | `LocalPageConfig` kind `faq` | FAQPage |
| 10 | Buying guides | `/guides/{slug}` | Top-of-funnel education, citable facts | `LocalPageConfig` kind `buying_guide` | FAQPage where Q/A present, BreadcrumbList |

Notes and defaults:

- Bad/no-credit finance pages: **SKIPPED_WITH_REASON: bad/no-credit page copy requires
  legal counsel review before any scaffold text exists (CONTEXT_PACK.md Module 9). The
  claims linter refuses `no credit check`, `guaranteed approval`, and `everyone approved`
  outright (claims.ts BANNED_PUBLIC_CLAIMS), so no such page can be generated even by
  accident.** The finance page (#7) routes credit-challenged intent to a human
  conversation instead.
- `LocalPageKind` in local-pages.ts is the authoritative enum: `city | service_area |
  category | finance | trade_in | faq | buying_guide`. Homepage/SRP/VDP are rendered
  from tenant + inventory data, not `LocalPageConfig`.
- Default V1 tenant-zero page set: 1 homepage, 1 SRP, ~30–75 VDPs (inventory-driven),
  1 Vancouver city page, 4 service-area pages, 5 category pages, finance, trade-in,
  FAQ, 3 buying guides. All drafts; publish gated per §8.
- Every `LocalPageConfig` and `VdpMeta` carries `requiresHumanApproval: true` as a
  literal type — the scaffold cannot express an auto-publish page.

## 3. VDP anatomy

The VDP is the highest-value page type: it is what marketplace ranking factors imitate
and what Google Vehicle Ads feeds must exactly match. Top-to-bottom anatomy:

1. **Photo gallery.** Ordered by `photo.order`; first photo becomes `og:image`
   (seo.ts). Merchandising target: real photos, not stockers — photo count/quality is a
   documented cross-marketplace ranking factor (research/marketplaces.md §8). Default
   minimum for "listing complete": 8 photos (Module 3 listing completeness score input).
2. **Price block — BC all-in price note.** Advertised price is intended to follow BC
   all-in price advertising rules (Motor Dealer Act regime; tenant-zero copy in
   local-pages.ts already states this): the advertised number includes fees, with taxes
   extra and said so. The same number must appear in page copy, meta description,
   JSON-LD Offer, and any marketplace/Google feed (§13 consistency check).
   SKIPPED_WITH_REASON: exact BC VSA all-in-price legal wording and footnote text
   requires legal counsel sign-off; the scaffold carries placeholder claim-safe copy only.
3. **Vehicle facts table.** Year/make/model/trim, VIN, stock number, mileage in km,
   body style, fuel, transmission, days-on-lot. Extractable facts, one per row (§6/§7).
4. **Disclosures block.** BC-required vehicle history disclosures (e.g. accident
   damage, prior rental/lease use) plus Carfax/inspection references from Module 3.
   This block doubles as the "why this price" evidence answer to IMV-style deal ratings
   (research/marketplaces.md, "What DealerOS should do better" #2).
5. **AI-drafted description.** Passes `assertClaimSafe` before it can even build (§8).
6. **Conversion block.** TEST_DRIVE_FORM and QUOTE_FORM (§10) with `stockNumber` as a
   hidden field, plus click-to-call.
7. **AEO block.** 1–2 vehicle-relevant Q/A units (e.g. "Can I test drive this
   {model} in Vancouver?") built via `buildAeoBlock`.

### 3.1 SEO meta from `buildVdpMeta` (seo.ts) — actual constraints

| Field | Constraint (as implemented) |
|-------|------------------------------|
| `title` | ≤ 60 chars (`TITLE_MAX_CHARS`). Pattern `"YYYY Make Model Trim | Dealer Name"`. Deterministic degradation: drop trim → drop `" | Dealer"` suffix → hard-slice to 60 and trim end. |
| `metaDescription` | ≤ 155 chars (`META_DESCRIPTION_MAX_CHARS`). Required sentence first: `"Used {vehicle} for {price} at {dealer} in {city}."`; falls back to the shorter no-trim/no-dealer form if over budget. Optional extras appended only while they fit: `" {n,nnn} km."` then `" Ask a question or book a test drive online."`; final hard-slice guard. |
| price formatting | `formatMoney`: integer dollars, comma thousands, `"$21,995 CAD"` style; no decimals, no locale/ICU dependence. |
| `canonicalPath` | `/inventory/{slug}` where slug = `slugify("{year} {make} {model} {stockNumber}")` — lowercase, non-alphanumerics collapsed to `-`, edges trimmed. |
| `ogTags` | `og:title`, `og:description`, `og:type=product`, `og:url` (canonical path), `product:price:amount` (integer dollars), `product:price:currency`; `og:image` = first photo by `order` when present. |
| claim safety | Input gate: `vehicle.features` joined text and any `merchandising.seoContent` (title, metaDescription, vdpBodyDraft) must pass `assertClaimSafe` or the build throws. Output gate: emitted title, metaDescription, and every og tag value are linted again. |
| publish gate | Return type includes `requiresHumanApproval: true`; publish is a `publish_page` external side effect gated upstream. |

### 3.2 VDP JSON-LD from `vehicleJsonLd` (structured-data.ts)

- `@type: Vehicle` with `vehicleIdentificationNumber` (VIN), `sku` (stock number),
  `brand`, `model`, `vehicleModelDate`, `mileageFromOdometer` as QuantitativeValue with
  `unitCode: 'KMT'` (UN/CEFACT kilometres — Canada-correct), `itemCondition:
  UsedCondition`, optional `vehicleConfiguration` (trim), `bodyType`, `fuelType`.
- Nested `Offer`: price as a number in dollars (cents/100), `priceCurrency`,
  `availability` mapped from `VehicleStatus` via `AVAILABILITY_BY_STATUS`
  (available→InStock, pending→LimitedAvailability, sold→SoldOut, incoming/in_recon→
  PreOrder, wholesale/archived→OutOfStock), `url` = page URL, `seller` = AutoDealer node.
- The status→availability map means a sold unit's page immediately signals SoldOut —
  the on-site twin of the "mark sold within 24h" marketplace compliance rule (§13).

## 4. schema.org strategy — the six implemented builders

All builders are pure functions in build-packets/website/structured-data.ts; they return
plain serializable objects, perform no I/O, and render as one `<script
type="application/ld+json">` block each.

| Builder | schema.org @type | Renders on | Notes |
|---------|------------------|-----------|-------|
| `vehicleJsonLd` | Vehicle + nested Offer | Every VDP | See §3.2. One per page; price must equal displayed price. |
| `autoDealerJsonLd` | AutoDealer | Homepage; contact page | Per rooftop: name, PostalAddress, `currenciesAccepted` (CAD default), legalName/telephone when present. |
| `localBusinessJsonLd` | LocalBusiness | City + service-area pages | Broader type for local-SEO pages; single real rooftop address (no fake locations). |
| `organizationJsonLd` | Organization | Site-wide (layout head) | Identity block: name, optional legalName, website URL. |
| `faqPageJsonLd` | FAQPage (Question/Answer mainEntity) | FAQ page; any page with a `faqs` array (city, trade-in, finance, category, guides) | Q/A come from claim-safe `LocalPageConfig.faqs`. |
| `breadcrumbJsonLd` | BreadcrumbList (1-based positions) | SRP, VDP, category, guides | Mirrors visible breadcrumb nav exactly. |

Defaults: exactly one Organization block per page; one page-type block (Vehicle,
LocalBusiness, or FAQPage) per page; BreadcrumbList wherever depth ≥ 2. Address data
flows from Module 1 tenant settings so JSON-LD, page footer, and GBP NAP can never
diverge (§7).

## 5. AEO strategy (answer-engine optimization)

1. **Direct-answer blocks.** `buildAeoBlock(question, directAnswer, supportingDetails)`
   (local-pages.ts) enforces `AEO_DIRECT_ANSWER_MAX_CHARS = 320` — it throws
   `aeo_direct_answer_too_long` above that — and runs `assertClaimSafe` on the
   question, the answer, and every supporting detail. 320 chars is the snippet budget
   we design to; answers must be self-contained and quotable out of context.
2. **Question-shaped headings.** Each AEO block renders as an `<h2>`/`<h3>` phrased as
   the literal question a shopper asks ("Where can I browse used cars in Vancouver?",
   "Is the online trade-in estimate final?"), followed immediately by the direct answer
   paragraph, then supporting details as a list. Sample blocks for tenant-zero exist in
   `sampleLocalPages()` (city, trade-in, FAQ pages).
3. **FAQPage markup.** Any page's `faqs` array renders visible Q/A plus
   `faqPageJsonLd`, so the same content serves classic rich results and answer engines.
4. **Coverage plan (tenant-zero defaults).** Each city/category page: ≥ 2 AEO blocks;
   FAQ page: ≥ 8; each buying guide: ≥ 3; each VDP: 1–2 vehicle-templated blocks.
   Question inventory is drafted from real traffic-desk questions (Module 4 lost/asked
   reasons) — the AI BDC's most-asked questions become next month's AEO blocks (see
   DEALEROS_AI_BDC_AND_SALES_CLOSER_SPEC_V1.md).
5. **Honesty constraint.** AEO answers state process truthfully ("submitting the form
   does not lock a time slot"; "final trade-in value is confirmed only after an
   in-person appraisal") — claim-safe answers are also the answers AI engines can cite
   without harming the dealer.

## 6. AIO / AI-overview readiness

Design targets so AI overviews and assistant-style engines can extract, trust, and cite
the dealer's pages:

1. **Extractable facts.** One fact per sentence/row; vehicle facts in tables; prices,
   mileage, and hours in consistent machine-parseable formats (`formatMoney`,
   `formatInt` give deterministic renderings).
2. **Consistent NAP.** Name/address/phone identical (string-identical, from one Module 1
   source of truth) across page footer, JSON-LD, GBP, and marketplace profiles.
3. **Structured data everywhere.** §4 blocks on every page; feed price and on-page
   structured data must exactly match the VDP price (Google feed rule,
   research/marketplaces.md §7).
4. **Citable, claim-safe stats.** Buying guides carry verifiable, sourced statements
   (BC disclosure requirements, documented process steps) rather than superlatives; the
   linter bans `#1`, `best price`, `lowest price`, `guaranteed` — which is also what
   keeps AI citation of our pages safe for the dealer.
5. **Stable canonicals.** Slug pattern in §3.1 keeps VDP URLs stable for a VIN's
   lifetime; sold VDPs stay live with SoldOut availability plus links to similar
   in-stock units (default retention: 90 days, then 301 to the category page).
6. **NEEDS_EXTERNAL_RESEARCH:** which structured-data and freshness signals specific
   AI-overview systems actually weight is not publicly documented by vendors; we design
   to the extractability principles above and measure (§12) rather than assert.

## 7. Local SEO — Vancouver tenant-zero

1. **GBP (Google Business Profile).** Keep categories, NAP, hours, photos, and website
   link consistent with site JSON-LD. Note: Google **deprecated the free "Vehicles for
   Sale" GBP listing surface on November 12, 2025** (research/marketplaces.md §7);
   organic inventory distribution now flows through Search surfaces, so the dealer's own
   structured VDPs and (optional, paid) Vehicle Ads feed carry that load. GBP posts and
   Q&A remain claim-safe drafted + human-approved. SKIPPED_WITH_REASON: actual GBP
   setup/edits require a live Google account and the real dealership entity — design
   only here; connector is registered in
   DEALEROS_AI_MODEL_HARNESS_AND_CONNECTOR_REGISTRY_V1.md (mock mode default).
2. **City page (`used-cars-vancouver`)** is the local hub: AEO blocks, FAQ markup,
   LocalBusiness JSON-LD, links to category pages and live inventory.
3. **Service-area pages** for Burnaby, Surrey, Richmond, North Vancouver describe real
   service of those areas from the single real rooftop — no fake addresses, no doorway
   spam; each page needs unique local copy and its own AEO blocks to earn indexation.
4. **Review flows — requests only, consent-gated.** DealerOS drafts review REQUESTS
   (never reviews), sent only to verified purchasers with valid consent, after human
   approval, each emitting a `review_requested` proof receipt (Module 11 event type).
   No incentivized reviews, no gating (routing unhappy customers away from public
   review), no fake proof. SKIPPED_WITH_REASON: sending any review request requires a
   live customer relationship and outreach approval — none is authorized; unsent-drafts
   pattern only, per the existing unsent dealer outreach approval packet.
5. **Citations/local links.** Consistent listings on Canadian directories.
   NEEDS_EXTERNAL_RESEARCH: current authoritative Canadian citation sources for auto
   dealers (beyond GBP/Kijiji dealer page — Kijiji notably allows clickable website
   links on ads, research/marketplaces.md §5) need a verification pass before we build
   a citation checklist.

## 8. Content pipeline (draft → lint → approve → publish → receipt)

1. **AI drafts** (Module 13 task types: `listing copy`, `SEO content`, `AEO answers`)
   generate page copy from inventory + tenant data. No raw PII reaches external models;
   redaction runs first (Module 13 policy).
2. **Claim-safety lint.** Every string that could reach a public page passes
   `lintClaimSafety`; builders (`buildVdpMeta`, `buildAeoBlock`) call `assertClaimSafe`
   and throw on violations — claim-unsafe copy cannot even construct a draft object.
   BANNED_PUBLIC_CLAIMS includes `production ready`, `guaranteed`, `#1`, `best price`,
   `lowest price`, `certified` (banned wholesale until legal review defines supportable
   certification language), `no credit check`, `guaranteed approval`, `everyone
   approved`, `replaces every dms`.
3. **Human approval.** Every draft carries `requiresHumanApproval: true`. A named
   approver reviews rendered preview + diff; approval emits `human_approval_requested`
   then `human_approval_granted` receipts.
4. **Publish.** `publish_page` is an external side effect: executed only after approval,
   emitting a proof receipt with `actor_type`, `human_approver_id`, `payload_hash`,
   `external_side_effect: y`, timestamp, and rollback path (unpublish/restore previous
   version). Receipt schema per DEALEROS_COGNITIA_PROOF_ADAPTER_V1.md.
5. **Feedback loop.** Published pages report performance (§12) back through Demandara
   outcomes so next month's drafts target proven gaps
   (DEALEROS_DEMANDARA_DEMAND_GEN_HARNESS_V1.md).

Acceptance: zero paths from model output to public page that bypass steps 2–4;
verified in scaffold tests (website.test.ts) for the lint/build gates.

## 9. Lead capture forms (forms.ts)

Three V1 forms, all sharing contact fields, a CASL express-consent block, and a honeypot:

| Form | formKey | Extra fields | Consent channels |
|------|---------|--------------|------------------|
| Test drive | `test_drive_v1` | stockNumber (hidden), preferredDate, preferredTime (morning/afternoon/evening), comments | email, sms, voice |
| Trade-in | `trade_in_v1` | vin (PII-sensitive), year, make, model, mileage km, condition (excellent/good/fair/needs_work) | email, sms, voice |
| Quote/question | `quote_v1` | stockNumber (hidden), message | email, sms |

Implemented mechanics to preserve in the production repo:

1. **CASL express consent.** Every form: `consent.required: true`, versioned wording key
   `casl_express_v1`, fixed checkbox key `CONSENT_FIELD_KEY = 'caslConsent'`, label
   "Yes, Budget Wheels may contact me about my inquiry. I can unsubscribe at any time."
   Missing/unchecked → `consent_required` error; a granted consent is stored as a
   ConsentRecord and emits `consent_captured` (Module 11).
   SKIPPED_WITH_REASON: final CASL wording and channel-scope language requires legal
   counsel review; `casl_express_v1` is a placeholder version key by design.
2. **Honeypot anti-spam.** Hidden field `HONEYPOT_FIELD_KEY = 'websiteUrl'`; non-empty
   value short-circuits validation to `{ ok:false, errors:['spam_detected'] }` before
   any other check.
3. **Validation order (validateSubmission):** honeypot → required-present
   (`missing_required:<key>`) → shape checks on non-empty values
   (`invalid_email` / `invalid_phone` — E.164-ish, optional `+` then 10–15 digits after
   separator stripping — / `invalid_option`) → consent checkbox must be exactly
   `'true'`.
4. **PII flags.** `piiSensitive` per field (names, email, phone, VIN, free-text
   comments) drives redaction before any model call (Module 13).
5. **Handoff.** A valid submission creates a TrafficEvent + lead (Module 4/5) and can be
   pushed via `POST /api/demandara/leads`; every accepted submission emits
   `lead_received`.

## 10. UTM and attribution capture into TrafficEvent (utm.ts)

1. `parseUtm` keeps exactly the five standard params (`utm_source/medium/campaign/
   term/content` → `source/medium/campaign/term/content`), dropping empties and unknown
   keys (gclid/fbclid deferred — candidate V2 fields).
2. `attributionFromRequest` classifies every inbound request: default source
   `website_form`; referrer hosts containing `facebook`/`kijiji`/`autotrader` flip
   source to `marketplace` with canonical sourceDetail (`facebook_marketplace`,
   `kijiji`, `autotrader_ca`); any other referrer keeps default source with the raw host
   as sourceDetail. `referrerHost` normalizes (lowercase, strips `www.`, tolerates
   scheme-less referrers).
3. Output feeds `TrafficEvent.utm/source/sourceDetail` plus `landingPath` — one
   attribution vocabulary shared by the traffic desk
   (DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md) and Demandara revenue attribution, so
   "which page and which channel produced this sold unit" is answerable end to end.
4. Default UTM conventions for our own campaigns: `utm_source` = channel
   (google/meta/kijiji/email), `utm_medium` = paid/organic/email/social,
   `utm_campaign` = Demandara campaign id — so campaign attribution joins cleanly.

## 11. Measurement plan

SKIPPED_WITH_REASON: all live measurement requires Search Console / analytics /
Semrush-class accounts wired to a real deployed site — none exists and none is
authorized; below is the design-only metric contract with mock fixtures in the scaffold.

| Metric | Definition | Default cadence | Owner surface |
|--------|-----------|-----------------|---------------|
| Indexed pages | site pages indexed vs. published | weekly | demand-gen report |
| Rankings | tracked keyword positions (targetKeywords per LocalPageConfig) | weekly | demand-gen report |
| AEO/AIO presence | tracked questions where our page is cited/snippeted (method TBD; NEEDS_EXTERNAL_RESEARCH: reliable AI-overview citation tracking tooling) | monthly | demand-gen report |
| Form conversion | valid submissions ÷ page sessions, per formKey and per page | weekly | traffic desk |
| Spam/consent quality | spam_detected rate; consent_required failure rate | weekly | traffic desk |
| Lead→appointment→sold by page | TrafficEvent → lead → appointment → sold chain grouped by landingPath | monthly | Demandara `GET /api/demandara/revenue-attribution` |
| Cost per sold by source | owned vs. marketplace vs. paid, receipt-backed | monthly | proof-backed marketing report (`GET /api/demandara/proof-report`) |
| VDP merchandising health | photo count, completeness score, price-vs-market, days-on-lot per VIN | daily | Inventory CRM (Module 3) |

Acceptance criteria for the measurement layer: every row above computable from
DealerOS-owned data (TrafficEvents, leads, receipts) without trusting vendor-attributed
numbers — the outcome-attributed-CPL wedge (research/marketplaces.md, "What DealerOS
should do better" #1).

## 12. Merchandising sync with marketplace listings

The website VDP and the marketplace listing are two renderings of one canonical VIN
record (Module 3). Sync rules, grounded in research/marketplaces.md and
research/autosync-trader.md:

1. **One record, many dialects.** Canonical inventory exports to per-marketplace feed
   dialects (AutoTrader.ca, Kijiji CSV dual-publish, Google Merchant CSV/TSV, Meta
   catalog). Google's required-field list (VIN, store_code, dealer name/address, price,
   condition, make, model, trim, year, mileage for used) is the baseline schema; default
   refresh every 4 hours; full-snapshot semantics (absent = delisted).
2. **Price consistency is a hard gate.** Feed price = VDP displayed price = JSON-LD
   Offer price, always. Google's "Dishonest Pricing Practices" policy (Oct 28, 2025)
   kills listings/accounts over mismatches; BC all-in advertising points the same
   direction. Lint runs before every feed push; mismatch blocks the sync and opens a task.
3. **Mark-sold propagation.** Status change to `sold` flips site availability to SoldOut
   immediately and drives marketplace delisting within 24 hours (Meta's rule; 3+
   "unavailable inventory" complaints risk account review). `connector_sync_completed` /
   `connector_sync_failed` receipts with payload hashes prove what was sent when.
4. **Shared merchandising score.** The same factors marketplaces rank on — price
   competitiveness vs. market, photo count/quality, listing freshness/age,
   trim/options completeness, history report attached, dealer rating, lead response
   time (CarGurus Best Match factors; cross-marketplace guidance) — are computed once
   per VIN and shown with per-factor fixes before the listing goes live anywhere.
5. **Days-on-market urgency.** Days-on-lot renders internally with dollarized aging
   framing (community rule of thumb: past day ~30–35, roughly $35/day in net profit —
   internal decision support only, never public copy) to prioritize repricing, photo
   refresh, and Demandara spend on at-risk units.
6. **Priced-vs-market indicator (claim-safe).** Trader's Price iQ badge lead-lift data
   (+31% "Good", +60% "Great" per Trader-published figures — vendor-self-reported)
   shows buyers respond to price grading. DealerOS may show a claim-safe
   "priced vs. market data" context block on VDPs using Module 3 market price data, with
   the recon-evidence disclosure block (§3, item 4) justifying above-market pricing.
   NEEDS_EXTERNAL_RESEARCH: licensing terms for any third-party market-price data
   source before any badge-like public rendering ships.
7. **SKIPPED_WITH_REASON:** actual feed pushes to AutoTrader.ca/Kijiji/Google/Meta
   require vendor contracts, live accounts, and connector credentials — none exists;
   connectors stay mock-mode per Module 12 with live mode human-approval-gated.

## 13. V1 acceptance criteria (engine as a whole)

1. Every generated page type in §2 renders from scaffold types with valid JSON-LD
   (parseable, correct @type, price/NAP matching page copy).
2. `buildVdpMeta` outputs satisfy §3.1 constraints for the full mock inventory,
   including degenerate cases (long trims, missing trim, missing photos).
3. No public string bypasses `lintClaimSafety`; banned-phrase injection in any input
   fails the build (covered in website.test.ts).
4. All three forms validate per §9 ordering; consentless or honeypot-tripped
   submissions never create leads.
5. Every inbound request yields a TrafficEvent with attribution per §10; marketplace
   referrers classify to canonical sourceDetail values.
6. Publish, consent, lead, review-request, and sync events emit Cognitia receipts with
   the Module 11 field set.
7. No live network calls anywhere in the scaffold; everything runs from mock data.

## 14. Open items (carry-forward)

1. NEEDS_EXTERNAL_RESEARCH: Google Vehicle Ads Canada eligibility specifics (docs page
   403'd in research pass) before designing the Merchant Center feed connector config.
2. NEEDS_EXTERNAL_RESEARCH: AutoTrader.ca Go/Smart/Pro package facts and Kijiji dealer
   tier names/pricing (only third-party estimates exist) for the §12 channel-ROI model.
3. Legal counsel queue: BC all-in-price footnote wording; CASL consent wording
   (`casl_express_v1` finalization); bad/no-credit page viability; "certified"
   vocabulary rules.
4. Repo item: promote `LocalPageConfig`, `AeoAnswerBlock`, `FormFieldDef`, `FormDef`
   into schemas/core once the Demandara packet consumes the same shapes (SCHEMA_NOTE
   in local-pages.ts and forms.ts); implementation belongs in the dedicated
   `cognitiacloud/dealeros` repo (CONTEXT_PACK.md §9), not this Library.

## Boundaries honored

- Design/architecture only. NOT PRODUCTION READY; no production deploy, migrations, or
  live network calls; all referenced code is dependency-free reference scaffolding in
  this Library repo, to be moved to a dedicated DealerOS repo.
- No public claims authorized: no "production ready", no guarantees, no "#1", no
  certification claims, no fake proof, no token/crypto language. The claims linter
  enforcing this is itself part of the spec.
- No live CRM/DMS writes; no marketplace/GBP/Google/Meta accounts created or called;
  all connectors mock-mode by default, live mode gated by human approval + proof receipt.
- No real customer PII; tenant-zero data is the fake/reserved Budget Wheels avatar.
- No dealership/customer outreach: review requests exist as unsent, consent-gated,
  approval-gated drafts only.
- Blocked or sensitive work is marked SKIPPED_WITH_REASON (bad/no-credit pages, legal
  wording, live GBP/feed/measurement integrations); unverifiable vendor facts are
  marked NEEDS_EXTERNAL_RESEARCH, never invented.
