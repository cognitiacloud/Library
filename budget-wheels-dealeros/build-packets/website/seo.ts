/**
 * BUDGET WHEELS DEALEROS — website/seo (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Module 9 — SEO helpers for vehicle detail pages (VDPs): deterministic
 * title/meta/canonical/og builders that refuse to emit claim-unsafe copy.
 * Publishing a page is an ExternalSideEffectKind ('publish_page') and stays
 * human-approval-gated upstream — these helpers only produce drafts.
 */

import type { Money, Vehicle } from '../schemas/core';
import { assertClaimSafe, lintClaimSafety } from './claims';

export const TITLE_MAX_CHARS = 60;
export const META_DESCRIPTION_MAX_CHARS = 155;

export interface VdpMeta {
  /** <= 60 chars, pattern "YYYY Make Model Trim | Dealer Name". */
  title: string;
  /** <= 155 chars; includes formatted price and dealer city; claim-safe. */
  metaDescription: string;
  /** "/inventory/{year}-{make}-{model}-{stockNumber}", slugified lowercase. */
  canonicalPath: string;
  ogTags: Record<string, string>;
  /** Draft only: publish is a 'publish_page' side effect, human-approval-gated. */
  requiresHumanApproval: true;
}

/** "$21,995 CAD" style — integer dollars, thousands separators, no decimals. */
export function formatMoney(m: Money): string {
  const dollars = Math.round(m.amountCents / 100);
  const sign = dollars < 0 ? '-' : '';
  return `${sign}$${formatInt(Math.abs(dollars))} ${m.currency}`;
}

/** Deterministic thousands grouping (no locale/ICU dependence). */
export function formatInt(n: number): string {
  return Math.trunc(Math.abs(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Lowercase slug: alphanumerics kept, everything else collapsed to '-'. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Build VDP meta for a vehicle. Throws if any produced text — or any
 * vehicle-sourced copy that feeds the page (features, drafted SEO content) —
 * violates claim safety.
 *
 * Length strategy (documented, deterministic):
 * - title: "YYYY Make Model Trim | Dealer"; if > 60 chars drop the trim,
 *   then drop the " | Dealer" suffix, then hard-slice to 60.
 * - metaDescription: required sentence (vehicle + price + dealer + city)
 *   first; optional extras (mileage, test-drive invite) appended only while
 *   they fit under 155.
 */
export function buildVdpMeta(
  vehicle: Vehicle,
  dealer: { name: string; city: string },
): VdpMeta {
  // Refuse to build a page from claim-unsafe vehicle-sourced copy.
  const sourcedCopy: { context: string; text: string }[] = [
    { context: 'vehicle.features', text: vehicle.features.join(' | ') },
  ];
  const seo = vehicle.merchandising.seoContent;
  if (seo) {
    sourcedCopy.push({ context: 'vehicle.seoContent.title', text: seo.title });
    sourcedCopy.push({ context: 'vehicle.seoContent.metaDescription', text: seo.metaDescription });
    sourcedCopy.push({ context: 'vehicle.seoContent.vdpBodyDraft', text: seo.vdpBodyDraft });
  }
  for (const { context, text } of sourcedCopy) assertClaimSafe(text, context);

  const vehicleLineWithTrim = [
    String(vehicle.year),
    vehicle.make,
    vehicle.model,
    ...(vehicle.trim ? [vehicle.trim] : []),
  ].join(' ');
  const vehicleLineNoTrim = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  let title = `${vehicleLineWithTrim} | ${dealer.name}`;
  if (title.length > TITLE_MAX_CHARS) title = `${vehicleLineNoTrim} | ${dealer.name}`;
  if (title.length > TITLE_MAX_CHARS) title = vehicleLineWithTrim;
  if (title.length > TITLE_MAX_CHARS) title = title.slice(0, TITLE_MAX_CHARS).trimEnd();

  const price = formatMoney(vehicle.askingPrice);
  let metaDescription = `Used ${vehicleLineWithTrim} for ${price} at ${dealer.name} in ${dealer.city}.`;
  if (metaDescription.length > META_DESCRIPTION_MAX_CHARS) {
    metaDescription = `${vehicleLineNoTrim} for ${price} in ${dealer.city}.`;
  }
  const extras = [
    ` ${formatInt(vehicle.mileageKm)} km.`,
    ' Ask a question or book a test drive online.',
  ];
  for (const extra of extras) {
    if (metaDescription.length + extra.length <= META_DESCRIPTION_MAX_CHARS) {
      metaDescription += extra;
    }
  }
  if (metaDescription.length > META_DESCRIPTION_MAX_CHARS) {
    metaDescription = metaDescription.slice(0, META_DESCRIPTION_MAX_CHARS).trimEnd();
  }

  const canonicalPath = `/inventory/${slugify(
    `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.stockNumber}`,
  )}`;

  const ogTags: Record<string, string> = {
    'og:title': title,
    'og:description': metaDescription,
    'og:type': 'product',
    'og:url': canonicalPath,
    'product:price:amount': String(Math.round(vehicle.askingPrice.amountCents / 100)),
    'product:price:currency': vehicle.askingPrice.currency,
  };
  const firstPhoto = [...vehicle.photos].sort((a, b) => a.order - b.order)[0];
  if (firstPhoto) ogTags['og:image'] = firstPhoto.assetRef;

  // Final gate: everything we emit must itself be claim-safe.
  assertClaimSafe(title, 'vdpMeta.title');
  assertClaimSafe(metaDescription, 'vdpMeta.metaDescription');
  for (const [key, value] of Object.entries(ogTags)) {
    const result = lintClaimSafety(value);
    if (!result.ok) assertClaimSafe(value, `vdpMeta.ogTags[${key}]`);
  }

  return { title, metaDescription, canonicalPath, ogTags, requiresHumanApproval: true };
}
