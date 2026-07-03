/**
 * BUDGET WHEELS DEALEROS — website/structured-data (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Module 9 — pure JSON-LD builders (schema.org): Vehicle, AutoDealer,
 * LocalBusiness, Organization, FAQPage, BreadcrumbList. All builders return
 * plain serializable objects; nothing here performs I/O or publishing.
 */

import type { Dealer, PostalAddress, Rooftop, Vehicle, VehicleStatus } from '../schemas/core';

/** Every top-level builder returns this shape. */
export interface JsonLdObject {
  '@context': 'https://schema.org';
  '@type': string;
  [key: string]: unknown;
}

/** Nested (non-root) JSON-LD node — no '@context'. */
export interface JsonLdNode {
  '@type': string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Mappings
// ---------------------------------------------------------------------------

/** VehicleStatus → schema.org ItemAvailability URL. */
export const AVAILABILITY_BY_STATUS: Record<VehicleStatus, string> = {
  incoming: 'https://schema.org/PreOrder',
  in_recon: 'https://schema.org/PreOrder',
  available: 'https://schema.org/InStock',
  pending: 'https://schema.org/LimitedAvailability',
  sold: 'https://schema.org/SoldOut',
  wholesale: 'https://schema.org/OutOfStock',
  archived: 'https://schema.org/OutOfStock',
};

/** core PostalAddress → schema.org PostalAddress node. */
export function postalAddressJsonLd(address: PostalAddress): JsonLdNode {
  const streetAddress = address.line2
    ? `${address.line1}, ${address.line2}`
    : address.line1;
  return {
    '@type': 'PostalAddress',
    streetAddress,
    addressLocality: address.city,
    addressRegion: address.region,
    postalCode: address.postalCode,
    addressCountry: address.country,
  };
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

/**
 * schema.org Vehicle with a nested Offer. Price is integer-cents → dollars
 * (schema.org price is a number, e.g. 2199500 cents → 21995).
 */
export function vehicleJsonLd(
  vehicle: Vehicle,
  dealer: { name: string },
  pageUrl: string,
): JsonLdObject {
  const name = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .filter((p) => p !== undefined && p !== '')
    .join(' ');

  const node: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name,
    vehicleIdentificationNumber: vehicle.vin,
    sku: vehicle.stockNumber,
    brand: { '@type': 'Brand', name: vehicle.make },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    mileageFromOdometer: {
      '@type': 'QuantitativeValue',
      value: vehicle.mileageKm,
      unitCode: 'KMT', // UN/CEFACT kilometres
    },
    itemCondition: 'https://schema.org/UsedCondition',
    offers: {
      '@type': 'Offer',
      price: vehicle.askingPrice.amountCents / 100,
      priceCurrency: vehicle.askingPrice.currency,
      availability: AVAILABILITY_BY_STATUS[vehicle.status],
      url: pageUrl,
      itemCondition: 'https://schema.org/UsedCondition',
      seller: { '@type': 'AutoDealer', name: dealer.name },
    },
  };
  if (vehicle.trim) node.vehicleConfiguration = vehicle.trim;
  if (vehicle.bodyStyle) node.bodyType = vehicle.bodyStyle;
  if (vehicle.fuel) node.fuelType = vehicle.fuel;
  return node;
}

/** schema.org AutoDealer for a rooftop (physical location). */
export function autoDealerJsonLd(dealer: Dealer, rooftop: Rooftop): JsonLdObject {
  const node: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: dealer.name,
    address: postalAddressJsonLd(rooftop.address),
    currenciesAccepted: dealer.defaultCurrency,
  };
  if (dealer.legalName) node.legalName = dealer.legalName;
  if (rooftop.phone) node.telephone = rooftop.phone;
  return node;
}

/** schema.org LocalBusiness (broader type for local-SEO pages). */
export function localBusinessJsonLd(dealer: Dealer, rooftop: Rooftop): JsonLdObject {
  const node: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: dealer.name,
    address: postalAddressJsonLd(rooftop.address),
  };
  if (rooftop.phone) node.telephone = rooftop.phone;
  return node;
}

/** schema.org Organization (site-wide identity block). */
export function organizationJsonLd(
  dealer: { name: string; legalName?: string },
  websiteUrl?: string,
): JsonLdObject {
  const node: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: dealer.name,
  };
  if (dealer.legalName) node.legalName = dealer.legalName;
  if (websiteUrl) node.url = websiteUrl;
  return node;
}

/** schema.org FAQPage with Question/Answer mainEntity. */
export function faqPageJsonLd(
  faqs: { question: string; answer: string }[],
): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

/** schema.org BreadcrumbList; positions are 1-based per spec. */
export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.path,
    })),
  };
}
