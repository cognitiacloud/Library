/**
 * BUDGET WHEELS DEALEROS — website/website.test (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Plain-Node mock tests: fixed fixtures only, all data fake/reserved
 * (555-01xx phone range, fictional dealer, placeholder VIN). No Date.now()
 * in any asserted logic.
 */

import assert from 'node:assert/strict';
import type {
  Dealer,
  DealerId,
  Rooftop,
  RooftopId,
  TenantId,
  Vehicle,
  VehicleId,
} from '../schemas/core';
import { BANNED_PUBLIC_CLAIMS, lintClaimSafety } from './claims';
import { buildVdpMeta, formatMoney, slugify } from './seo';
import {
  AVAILABILITY_BY_STATUS,
  autoDealerJsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
  localBusinessJsonLd,
  organizationJsonLd,
  vehicleJsonLd,
} from './structured-data';
import {
  CONSENT_FIELD_KEY,
  QUOTE_FORM,
  TEST_DRIVE_FORM,
  TRADE_IN_FORM,
  validateSubmission,
} from './forms';
import { attributionFromRequest, parseUtm } from './utm';
import { AEO_DIRECT_ANSWER_MAX_CHARS, buildAeoBlock, sampleLocalPages } from './local-pages';

function check(name: string, fn: () => void): void {
  fn();
  console.log(`ok - ${name}`);
}

// ---------------------------------------------------------------------------
// Fixtures (all fake/reserved data)
// ---------------------------------------------------------------------------

const tenantId = 't0_budget_wheels' as TenantId;
const dealerId = 'dealer_bw' as DealerId;
const rooftopId = 'rooftop_bw_van' as RooftopId;

const vehicle: Vehicle = {
  vehicleId: 'veh_0001' as VehicleId,
  tenantId,
  dealerId,
  rooftopId,
  vin: '1FAKE00000TEST000', // placeholder, not a real VIN
  stockNumber: 'BW-1042',
  year: 2019,
  make: 'Toyota',
  model: 'RAV4',
  trim: 'XLE',
  bodyStyle: 'suv',
  drivetrain: 'awd',
  fuel: 'gas',
  mileageKm: 42500,
  askingPrice: { amountCents: 2199500, currency: 'CAD' },
  status: 'available',
  statusChangedAt: '2026-07-01T12:00:00Z',
  photos: [{ assetRef: 'assets/veh_0001/ext_front.jpg', order: 1, kind: 'exterior' }],
  features: ['Heated seats', 'Backup camera', 'All-wheel drive'],
  disclosures: [],
  externalRefs: [],
  merchandising: { daysInInventory: 12, listingCompletenessScore: 90, merchandisingScore: 82 },
};

const dealer: Dealer = {
  dealerId,
  tenantId,
  name: 'Budget Wheels',
  legalName: 'Budget Wheels Auto Sales Ltd. (fictional)',
  licenseNumbers: [{ authority: 'BC VSA', number: 'FAKE-00000' }],
  defaultCurrency: 'CAD',
};

const rooftop: Rooftop = {
  rooftopId,
  tenantId,
  dealerId,
  name: 'Budget Wheels — Vancouver',
  address: {
    line1: '123 Example Street',
    city: 'Vancouver',
    region: 'BC',
    postalCode: 'V5K 0A1',
    country: 'CA',
  },
  phone: '+1-604-555-0100', // reserved 555-01xx range
  timezone: 'America/Vancouver',
};

const dealerSite = { name: 'Budget Wheels', city: 'Vancouver' };

function main(): void {
  // -------------------------------------------------------------------------
  // claims: linter basics
  // -------------------------------------------------------------------------

  check('lintClaimSafety passes clean copy', () => {
    const r = lintClaimSafety('Browse used cars in Vancouver and book a test drive online.');
    assert.equal(r.ok, true);
    assert.deepEqual(r.violations, []);
  });

  check("lintClaimSafety flags 'guaranteed' (case-insensitive, with index)", () => {
    const r = lintClaimSafety('Guaranteed to pass any inspection.');
    assert.equal(r.ok, false);
    assert.equal(r.violations.length, 1); // 'guarantee' suppressed inside 'guaranteed'
    assert.equal(r.violations[0]!.phrase, 'guaranteed');
    assert.equal(r.violations[0]!.index, 0);
  });

  check("lintClaimSafety: longer phrase wins ('soc 2 certified' over 'certified')", () => {
    const r = lintClaimSafety('We are SOC 2 Certified.');
    assert.equal(r.ok, false);
    assert.deepEqual(r.violations.map((v) => v.phrase), ['soc 2 certified']);
  });

  check('BANNED_PUBLIC_CLAIMS covers the required minimum set', () => {
    for (const phrase of [
      'production ready', 'guaranteed', 'guarantee', '#1', 'best price', 'certified',
      'soc 2 certified', 'gdpr certified', 'lowest price', 'we will beat any price',
      'no credit check',
    ]) {
      assert.ok(BANNED_PUBLIC_CLAIMS.includes(phrase), `missing banned phrase: ${phrase}`);
    }
  });

  // -------------------------------------------------------------------------
  // seo: formatMoney + VDP meta
  // -------------------------------------------------------------------------

  check("formatMoney → '$21,995 CAD' (no decimals, thousands separator)", () => {
    assert.equal(formatMoney({ amountCents: 2199500, currency: 'CAD' }), '$21,995 CAD');
    assert.equal(formatMoney({ amountCents: 99900, currency: 'USD' }), '$999 USD');
    assert.equal(formatMoney({ amountCents: 123456789, currency: 'CAD' }), '$1,234,568 CAD');
  });

  check('buildVdpMeta: title pattern + <= 60 chars', () => {
    const meta = buildVdpMeta(vehicle, dealerSite);
    assert.equal(meta.title, '2019 Toyota RAV4 XLE | Budget Wheels');
    assert.ok(meta.title.length <= 60, `title too long: ${meta.title.length}`);
  });

  check('buildVdpMeta: metaDescription <= 155, includes price + city, claim-safe', () => {
    const meta = buildVdpMeta(vehicle, dealerSite);
    assert.ok(meta.metaDescription.length <= 155, `desc too long: ${meta.metaDescription.length}`);
    assert.ok(meta.metaDescription.includes('$21,995 CAD'), meta.metaDescription);
    assert.ok(meta.metaDescription.includes('Vancouver'), meta.metaDescription);
    assert.equal(lintClaimSafety(meta.title + ' ' + meta.metaDescription).ok, true);
  });

  check('buildVdpMeta: canonicalPath slug is lowercase year-make-model-stock', () => {
    const meta = buildVdpMeta(vehicle, dealerSite);
    assert.equal(meta.canonicalPath, '/inventory/2019-toyota-rav4-bw-1042');
  });

  check('buildVdpMeta: og tags mirror title/desc and carry price + image', () => {
    const meta = buildVdpMeta(vehicle, dealerSite);
    assert.equal(meta.ogTags['og:title'], meta.title);
    assert.equal(meta.ogTags['og:description'], meta.metaDescription);
    assert.equal(meta.ogTags['og:url'], meta.canonicalPath);
    assert.equal(meta.ogTags['product:price:amount'], '21995');
    assert.equal(meta.ogTags['product:price:currency'], 'CAD');
    assert.equal(meta.ogTags['og:image'], 'assets/veh_0001/ext_front.jpg');
    assert.equal(meta.requiresHumanApproval, true);
  });

  check('slugify handles punctuation and casing', () => {
    assert.equal(slugify('2021 Mercedes-Benz GLC 300!'), '2021-mercedes-benz-glc-300');
  });

  check("claim-unsafe vehicle description ('guaranteed') → lint flags + buildVdpMeta throws", () => {
    const unsafeVehicle: Vehicle = {
      ...vehicle,
      merchandising: {
        ...vehicle.merchandising,
        seoContent: {
          title: '2019 Toyota RAV4 XLE',
          metaDescription: 'A well-kept compact SUV.',
          vdpBodyDraft: 'Guaranteed to pass any inspection — buy with total confidence.',
        },
      },
    };
    const lint = lintClaimSafety(unsafeVehicle.merchandising.seoContent!.vdpBodyDraft);
    assert.equal(lint.ok, false);
    assert.ok(lint.violations.some((v) => v.phrase === 'guaranteed'));
    assert.throws(() => buildVdpMeta(unsafeVehicle, dealerSite), /claim_safety_violation/);
  });

  // -------------------------------------------------------------------------
  // structured-data: JSON-LD builders
  // -------------------------------------------------------------------------

  check('vehicleJsonLd: Offer price is cents→dollars with currency + availability', () => {
    const ld = vehicleJsonLd(vehicle, dealer, 'https://example.test/inventory/2019-toyota-rav4-bw-1042');
    assert.equal(ld['@context'], 'https://schema.org');
    assert.equal(ld['@type'], 'Vehicle');
    const offers = ld.offers as { '@type': string; price: number; priceCurrency: string; availability: string };
    assert.equal(offers['@type'], 'Offer');
    assert.equal(offers.price, 21995); // 2199500 cents
    assert.equal(offers.priceCurrency, 'CAD');
    assert.equal(offers.availability, 'https://schema.org/InStock');
  });

  check('vehicleJsonLd: sold vehicle maps to SoldOut', () => {
    const soldLd = vehicleJsonLd({ ...vehicle, status: 'sold' }, dealer, 'https://example.test/x');
    const offers = soldLd.offers as { availability: string };
    assert.equal(offers.availability, 'https://schema.org/SoldOut');
    assert.equal(AVAILABILITY_BY_STATUS.pending, 'https://schema.org/LimitedAvailability');
  });

  check('autoDealerJsonLd / localBusinessJsonLd: PostalAddress mapping', () => {
    for (const ld of [autoDealerJsonLd(dealer, rooftop), localBusinessJsonLd(dealer, rooftop)]) {
      const address = ld.address as Record<string, string>;
      assert.equal(address['@type'], 'PostalAddress');
      assert.equal(address.streetAddress, '123 Example Street');
      assert.equal(address.addressLocality, 'Vancouver');
      assert.equal(address.addressRegion, 'BC');
      assert.equal(address.addressCountry, 'CA');
    }
    assert.equal(autoDealerJsonLd(dealer, rooftop)['@type'], 'AutoDealer');
    assert.equal(localBusinessJsonLd(dealer, rooftop)['@type'], 'LocalBusiness');
  });

  check('organizationJsonLd: name + optional url', () => {
    const ld = organizationJsonLd(dealer, 'https://budgetwheels.example.test');
    assert.equal(ld['@type'], 'Organization');
    assert.equal(ld.name, 'Budget Wheels');
    assert.equal(ld.url, 'https://budgetwheels.example.test');
  });

  check('faqPageJsonLd: mainEntity length + Question/Answer shape', () => {
    const ld = faqPageJsonLd([
      { question: 'Do you take trade-ins?', answer: 'Yes, after an in-person appraisal.' },
      { question: 'Are prices in CAD?', answer: 'Yes, all pricing is in CAD.' },
    ]);
    assert.equal(ld['@type'], 'FAQPage');
    const mainEntity = ld.mainEntity as { '@type': string; name: string; acceptedAnswer: { '@type': string; text: string } }[];
    assert.equal(mainEntity.length, 2);
    assert.equal(mainEntity[0]!['@type'], 'Question');
    assert.equal(mainEntity[0]!.acceptedAnswer['@type'], 'Answer');
    assert.equal(mainEntity[1]!.name, 'Are prices in CAD?');
  });

  check('breadcrumbJsonLd: 1-based ListItem positions', () => {
    const ld = breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Inventory', path: '/inventory' },
      { name: '2019 Toyota RAV4', path: '/inventory/2019-toyota-rav4-bw-1042' },
    ]);
    const items = ld.itemListElement as { position: number; name: string; item: string }[];
    assert.deepEqual(items.map((i) => i.position), [1, 2, 3]);
    assert.equal(items[2]!.item, '/inventory/2019-toyota-rav4-bw-1042');
  });

  // -------------------------------------------------------------------------
  // forms: definitions + validation
  // -------------------------------------------------------------------------

  const validTestDrive: Record<string, string> = {
    firstName: 'Test',
    lastName: 'Person',
    email: 'test.person@example.test',
    phone: '604-555-0134', // reserved fake number
    stockNumber: 'BW-1042',
    preferredTime: 'afternoon',
    [CONSENT_FIELD_KEY]: 'true',
  };

  check('valid test-drive submission (incl. dashed phone shape) → ok', () => {
    const r = validateSubmission(TEST_DRIVE_FORM, validTestDrive);
    assert.deepEqual(r, { ok: true, errors: [] });
  });

  check("missing consent checkbox → 'consent_required'", () => {
    const { [CONSENT_FIELD_KEY]: _omit, ...noConsent } = validTestDrive;
    const r = validateSubmission(TEST_DRIVE_FORM, noConsent);
    assert.equal(r.ok, false);
    assert.deepEqual(r.errors, ['consent_required']);
  });

  check("consent checkbox 'false' still → 'consent_required'", () => {
    const r = validateSubmission(TEST_DRIVE_FORM, { ...validTestDrive, [CONSENT_FIELD_KEY]: 'false' });
    assert.deepEqual(r.errors, ['consent_required']);
  });

  check("honeypot filled → exactly { ok:false, errors:['spam_detected'] }", () => {
    const r = validateSubmission(TEST_DRIVE_FORM, {
      ...validTestDrive,
      [TEST_DRIVE_FORM.honeypotFieldKey]: 'https://spam.example.test',
    });
    assert.deepEqual(r, { ok: false, errors: ['spam_detected'] });
  });

  check('required-field + email/phone shape errors', () => {
    const r = validateSubmission(TEST_DRIVE_FORM, {
      firstName: 'Test',
      // lastName missing
      email: 'not-an-email',
      phone: '12345', // too short
      stockNumber: 'BW-1042',
      [CONSENT_FIELD_KEY]: 'true',
    });
    assert.equal(r.ok, false);
    assert.ok(r.errors.includes('missing_required:lastName'), r.errors.join(','));
    assert.ok(r.errors.includes('invalid_email:email'), r.errors.join(','));
    assert.ok(r.errors.includes('invalid_phone:phone'), r.errors.join(','));
  });

  check('trade-in form includes vin/year/make/model/mileage fields', () => {
    const keys = TRADE_IN_FORM.fields.map((f) => f.key);
    for (const k of ['vin', 'year', 'make', 'model', 'mileage']) {
      assert.ok(keys.includes(k), `trade-in form missing field: ${k}`);
    }
  });

  check('every form: CASL consent block + honeypot present in fields', () => {
    for (const form of [TEST_DRIVE_FORM, TRADE_IN_FORM, QUOTE_FORM]) {
      assert.equal(form.consent.required, true);
      assert.equal(form.consent.wordingKey, 'casl_express_v1');
      assert.ok(form.consent.channelsCovered.length > 0);
      const keys = form.fields.map((f) => f.key);
      assert.ok(keys.includes(CONSENT_FIELD_KEY), `${form.formKey} missing consent field`);
      assert.ok(keys.includes(form.honeypotFieldKey), `${form.formKey} missing honeypot field`);
    }
  });

  // -------------------------------------------------------------------------
  // utm: parsing + attribution
  // -------------------------------------------------------------------------

  check('parseUtm picks the five utm_* keys and drops unknown keys', () => {
    const utm = parseUtm({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'july_suv_push',
      gclid: 'abc123',
      foo: 'bar',
      utm_term: '',
    });
    assert.deepEqual(utm, { source: 'google', medium: 'cpc', campaign: 'july_suv_push' });
    assert.ok(!('gclid' in utm));
    assert.ok(!('foo' in utm));
  });

  check("facebook referrer → source 'marketplace' + sourceDetail 'facebook_marketplace'", () => {
    const a = attributionFromRequest({
      query: { utm_source: 'fb' },
      referrer: 'https://www.facebook.com/marketplace/item/123',
      landingPath: '/inventory/2019-toyota-rav4-bw-1042',
    });
    assert.equal(a.source, 'marketplace');
    assert.equal(a.sourceDetail, 'facebook_marketplace');
    assert.equal(a.landingPath, '/inventory/2019-toyota-rav4-bw-1042');
    assert.deepEqual(a.utm, { source: 'fb' });
  });

  check('kijiji + autotrader referrers also classify as marketplace', () => {
    const k = attributionFromRequest({ query: {}, referrer: 'https://www.kijiji.ca/v-cars/x', landingPath: '/' });
    assert.equal(k.source, 'marketplace');
    assert.equal(k.sourceDetail, 'kijiji');
    const at = attributionFromRequest({ query: {}, referrer: 'https://www.autotrader.ca/a/x', landingPath: '/' });
    assert.equal(at.source, 'marketplace');
    assert.equal(at.sourceDetail, 'autotrader_ca');
  });

  check("no referrer → default source 'website_form', no sourceDetail", () => {
    const a = attributionFromRequest({ query: {}, landingPath: '/trade-in' });
    assert.equal(a.source, 'website_form');
    assert.equal(a.sourceDetail, undefined);
  });

  check("non-marketplace referrer keeps 'website_form' but records host", () => {
    const a = attributionFromRequest({ query: {}, referrer: 'https://www.google.com/', landingPath: '/' });
    assert.equal(a.source, 'website_form');
    assert.equal(a.sourceDetail, 'google.com');
  });

  // -------------------------------------------------------------------------
  // local-pages: AEO blocks + samples
  // -------------------------------------------------------------------------

  check('buildAeoBlock rejects answers over 320 chars', () => {
    const tooLong = 'a'.repeat(AEO_DIRECT_ANSWER_MAX_CHARS + 1);
    assert.throws(() => buildAeoBlock('Q?', tooLong, []), /aeo_direct_answer_too_long/);
    const atLimit = buildAeoBlock('Q?', 'a'.repeat(AEO_DIRECT_ANSWER_MAX_CHARS), []);
    assert.equal(atLimit.directAnswer.length, AEO_DIRECT_ANSWER_MAX_CHARS);
  });

  check('buildAeoBlock rejects claim-unsafe answers', () => {
    assert.throws(
      () => buildAeoBlock('Why buy here?', 'We have the best price in town.', []),
      /claim_safety_violation/,
    );
  });

  check('sampleLocalPages: 3 configs, all claim-safe and approval-gated', () => {
    const pages = sampleLocalPages();
    assert.equal(pages.length, 3);
    for (const page of pages) {
      assert.equal(page.requiresHumanApproval, true);
      assert.ok(page.aeoBlocks.length > 0, `${page.pageKey} has no AEO blocks`);
      assert.ok(page.targetKeywords.length > 0, `${page.pageKey} has no keywords`);
      const allCopy = JSON.stringify(page);
      const lint = lintClaimSafety(allCopy);
      assert.equal(lint.ok, true, `${page.pageKey} claim violations: ${JSON.stringify(lint.violations)}`);
    }
    assert.deepEqual(pages.map((p) => p.kind), ['city', 'trade_in', 'faq']);
  });

  console.log('ALL WEBSITE PACKET CHECKS PASSED');
}

main();
