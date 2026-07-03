/**
 * BUDGET WHEELS DEALEROS — website/utm (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Module 9 — UTM capture + source attribution for inbound website traffic.
 * Feeds TrafficEvent.utm / TrafficEvent.source / TrafficEvent.sourceDetail
 * (schemas/core, Module 4) so the traffic desk and Demandara reporting share
 * one attribution vocabulary. Pure string handling; no I/O.
 */

import type { TrafficEvent, TrafficSourceKind } from '../schemas/core';

/** Core's UTM shape (TrafficEvent.utm), re-exported for convenience. */
export type UtmParams = NonNullable<TrafficEvent['utm']>;

/** query-string key → UtmParams key. Unknown keys (gclid, fbclid, …) are dropped. */
const UTM_KEY_MAP: Record<string, keyof UtmParams> = {
  utm_source: 'source',
  utm_medium: 'medium',
  utm_campaign: 'campaign',
  utm_term: 'term',
  utm_content: 'content',
};

/**
 * Pick the five standard utm_* params out of a parsed query string.
 * Empty/undefined values and non-UTM keys are dropped.
 */
export function parseUtm(query: Record<string, string | undefined>): UtmParams {
  const utm: UtmParams = {};
  for (const [queryKey, utmKey] of Object.entries(UTM_KEY_MAP)) {
    const value = query[queryKey]?.trim();
    if (value) utm[utmKey] = value;
  }
  return utm;
}

/** Referrer hosts that classify the visit as 'marketplace' traffic. */
const MARKETPLACE_HOST_HINTS: { hint: string; sourceDetail: string }[] = [
  { hint: 'facebook', sourceDetail: 'facebook_marketplace' },
  { hint: 'kijiji', sourceDetail: 'kijiji' },
  { hint: 'autotrader', sourceDetail: 'autotrader_ca' },
];

export interface AttributionInput {
  query: Record<string, string | undefined>;
  referrer?: string;
  landingPath: string;
}

export interface Attribution {
  utm: UtmParams;
  source: TrafficSourceKind;
  /** e.g. "facebook_marketplace", "kijiji", or the raw referrer host. */
  sourceDetail?: string;
  landingPath: string;
}

/** Extract a lowercase hostname (sans "www.") from a referrer string, or undefined. */
export function referrerHost(referrer: string): string | undefined {
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(referrer)
    ? referrer
    : `https://${referrer}`;
  try {
    const host = new URL(candidate).hostname.toLowerCase();
    return host.replace(/^www\./, '') || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Classify an inbound website request into core's traffic vocabulary:
 * - default source: 'website_form' (the website engine's inbound kind)
 * - referrer host containing facebook/kijiji/autotrader → 'marketplace',
 *   with a canonical sourceDetail matching core's examples
 * - any other referrer → sourceDetail = referrer host, source stays default
 */
export function attributionFromRequest(input: AttributionInput): Attribution {
  const utm = parseUtm(input.query);
  let source: TrafficSourceKind = 'website_form';
  let sourceDetail: string | undefined;

  if (input.referrer) {
    const host = referrerHost(input.referrer);
    if (host) {
      sourceDetail = host;
      const marketplace = MARKETPLACE_HOST_HINTS.find((m) => host.includes(m.hint));
      if (marketplace) {
        source = 'marketplace';
        sourceDetail = marketplace.sourceDetail;
      }
    }
  }

  const attribution: Attribution = { utm, source, landingPath: input.landingPath };
  if (sourceDetail) attribution.sourceDetail = sourceDetail;
  return attribution;
}
