/**
 * BUDGET WHEELS DEALEROS — equity-mining/scoring (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Module 7: equity mining / opportunity engine (AutoAlert-style, scaffold).
 *
 * Deterministic scoring engine:
 * - All date math derives from the `asOf` parameter — never Date.now().
 * - Weights are "points": each factor contributes weight * contribution01
 *   points; the sum is clamped to 0..100 (weights intentionally over-provision
 *   so a many-signal customer saturates at 100).
 * - Bands: hot >= 70, warm >= 40, else watch.
 * - Every dollar figure produced here is an internal PROXY/ESTIMATE, never an
 *   appraisal or an offer. All outbound drafts are claim-safe and carry
 *   requiresHumanApproval: true (V1 hard rule from ../schemas/core).
 */

import { createHash } from 'node:crypto';
import type {
  ConsentChannel,
  Customer,
  IsoTimestamp,
  NextBestAction,
  OpportunityId,
  OpportunityReasonCode,
  OpportunityScore,
  OwnedVehicle,
  UserId,
  Vehicle,
  VehicleId,
} from '../schemas/core';

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface ScoringInputs {
  customer: Customer;
  /** The specific owned/leased vehicle being scored (one score per vehicle). */
  ownedVehicle: OwnedVehicle;
  /** Candidate dealer inventory for matching + value proxies. */
  inventory: Vehicle[];
  /** Deterministic "now" — every piece of date math derives from this. */
  asOf: IsoTimestamp;
  engagement?: {
    lastInboundAt?: IsoTimestamp;
    websiteVdpViewsLast30d?: number;
  };
}

export interface FactorEvaluation {
  fires: boolean;
  /** Normalized 0..1 strength of the signal when it fires (0 when it does not). */
  contribution01: number;
  /** Human-readable, claim-safe justification. Non-empty whenever fires=true. */
  evidence: string;
}

export interface FactorDefinition {
  code: OpportunityReasonCode;
  /** Max points this factor can add to the 0..100 score. */
  weight: number;
  evaluate(inputs: ScoringInputs): FactorEvaluation;
}

export const MODEL_VERSION = 'mock-scoring-v1';
export const BAND_HOT_MIN = 70;
export const BAND_WARM_MIN = 40;

// ---------------------------------------------------------------------------
// Deterministic date/number helpers (asOf-driven; no Date.now())
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30.4375; // 365.25 / 12
/** Straight-line, zero-interest payment proxy horizon (mock only). */
const PAYMENT_PROXY_MONTHS = 60;
const MAX_INVENTORY_MATCHES = 3;

function parseIsoMs(iso: IsoTimestamp): number {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) throw new Error(`equity-mining: invalid ISO timestamp "${iso}"`);
  return ms;
}

function daysBetween(fromIso: IsoTimestamp, toIso: IsoTimestamp): number {
  return (parseIsoMs(toIso) - parseIsoMs(fromIso)) / MS_PER_DAY;
}

function monthsBetween(fromIso: IsoTimestamp, toIso: IsoTimestamp): number {
  return daysBetween(fromIso, toIso) / DAYS_PER_MONTH;
}

function addDaysIso(iso: IsoTimestamp, days: number): IsoTimestamp {
  return new Date(parseIsoMs(iso) + days * MS_PER_DAY).toISOString();
}

/** Vehicle age in years, measured from Jan 1 of the model year (mock proxy). */
function vehicleAgeYears(modelYear: number, atIso: IsoTimestamp): number {
  return (parseIsoMs(atIso) - Date.UTC(modelYear, 0, 1)) / (MS_PER_DAY * 365.25);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function clamp01(n: number): number {
  return clamp(n, 0, 1);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Plain deterministic money formatting for evidence strings (no locales). */
function fmtCents(amountCents: number, currency = 'CAD'): string {
  return `${currency} $${(amountCents / 100).toFixed(0)}`;
}

// ---------------------------------------------------------------------------
// Inventory matching heuristic
// ---------------------------------------------------------------------------

/** Small deterministic model-name → body-style familiarity map (mock only). */
const BODY_STYLE_MODEL_HINTS: Record<string, 'suv' | 'truck' | 'sedan' | 'van'> = {
  'cr-v': 'suv', 'crv': 'suv', 'rav4': 'suv', 'escape': 'suv', 'tucson': 'suv',
  'rogue': 'suv', 'equinox': 'suv', 'forester': 'suv', 'highlander': 'suv',
  'pilot': 'suv', 'santa fe': 'suv', 'cx-5': 'suv', 'cx5': 'suv', 'explorer': 'suv',
  '4runner': 'suv', 'outback': 'suv',
  'f-150': 'truck', 'f150': 'truck', 'silverado': 'truck', 'sierra': 'truck',
  'ram': 'truck', 'tacoma': 'truck', 'tundra': 'truck', 'ranger': 'truck',
  'colorado': 'truck', 'frontier': 'truck',
  'civic': 'sedan', 'corolla': 'sedan', 'camry': 'sedan', 'accord': 'sedan',
  'elantra': 'sedan', 'altima': 'sedan', 'sentra': 'sedan', 'jetta': 'sedan',
  'mazda3': 'sedan', 'fusion': 'sedan', 'malibu': 'sedan',
  'sienna': 'van', 'odyssey': 'van', 'caravan': 'van', 'pacifica': 'van',
};

export function inferBodyStyle(model?: string): 'suv' | 'truck' | 'sedan' | 'van' | undefined {
  if (!model) return undefined;
  const lower = model.toLowerCase();
  for (const [hint, style] of Object.entries(BODY_STYLE_MODEL_HINTS)) {
    if (lower.includes(hint)) return style;
  }
  return undefined;
}

/** Explicit desiderata hint from customer tags, e.g. 'prefers:suv'. */
function preferredBodyStyleFromTags(customer: Customer): string | undefined {
  const tag = customer.tags.find((t) => t.startsWith('prefers:'));
  return tag ? tag.slice('prefers:'.length) : undefined;
}

/**
 * Heuristic match: status must be 'available'; familiarity by body style
 * (customer tag preference or style inferred from owned model) or same make;
 * price within a band derived from the current payment proxy
 * (payment * 60 months, straight-line, zero-interest — MOCK ONLY).
 * No payment known → familiarity + availability only. Cheapest 3 returned.
 */
export function matchInventory(
  customer: Customer,
  ownedVehicle: OwnedVehicle,
  inventory: Vehicle[],
): Vehicle[] {
  const preferredStyle = preferredBodyStyleFromTags(customer);
  const inferredStyle = inferBodyStyle(ownedVehicle.model);
  const ownedMake = ownedVehicle.make?.toLowerCase();

  const paymentCents = ownedVehicle.finance?.estimatedPayment?.amountCents;
  const targetPriceCents = paymentCents !== undefined ? paymentCents * PAYMENT_PROXY_MONTHS : undefined;

  const candidates = inventory.filter((v) => {
    if (v.status !== 'available') return false;
    const familiar =
      (preferredStyle !== undefined && v.bodyStyle === preferredStyle) ||
      (inferredStyle !== undefined && v.bodyStyle === inferredStyle) ||
      (ownedMake !== undefined && v.make.toLowerCase() === ownedMake);
    if (!familiar) return false;
    if (targetPriceCents !== undefined) {
      const price = v.askingPrice.amountCents;
      if (price < targetPriceCents * 0.5 || price > targetPriceCents * 1.3) return false;
    }
    return true;
  });

  candidates.sort((a, b) =>
    a.askingPrice.amountCents - b.askingPrice.amountCents ||
    String(a.vehicleId).localeCompare(String(b.vehicleId)),
  );
  return candidates.slice(0, MAX_INVENTORY_MATCHES);
}

// ---------------------------------------------------------------------------
// Equity estimate proxy (mock — never an appraisal)
// ---------------------------------------------------------------------------

export interface EquityEstimate {
  equityCents: number;
  valueProxyCents: number;
  basis: 'comparable_same_model' | 'comparable_same_make' | 'straight_line_proxy';
}

/**
 * Value proxy: average asking price of comparable available inventory
 * (same make+model, else same make within 2 model years), discounted 5% per
 * model-year the owned vehicle trails the comparables; else a straight-line
 * proxy from payment * term. Estimate only — never shown to a customer as-is.
 */
export function estimateEquity(ownedVehicle: OwnedVehicle, inventory: Vehicle[]): EquityEstimate | undefined {
  const payoffCents = ownedVehicle.finance?.estimatedPayoff?.amountCents;
  if (payoffCents === undefined) return undefined;

  const make = ownedVehicle.make?.toLowerCase();
  const model = ownedVehicle.model?.toLowerCase();
  const available = inventory.filter((v) => v.status === 'available');

  const pickProxy = (comps: Vehicle[]): number | undefined => {
    if (comps.length === 0) return undefined;
    const avgPrice = comps.reduce((s, v) => s + v.askingPrice.amountCents, 0) / comps.length;
    const avgYear = comps.reduce((s, v) => s + v.year, 0) / comps.length;
    const yearGap = ownedVehicle.year !== undefined ? Math.max(0, avgYear - ownedVehicle.year) : 0;
    return Math.floor(avgPrice * Math.pow(0.95, yearGap));
  };

  let basis: EquityEstimate['basis'] = 'comparable_same_model';
  let valueProxyCents = pickProxy(
    available.filter((v) => make !== undefined && model !== undefined &&
      v.make.toLowerCase() === make && v.model.toLowerCase() === model),
  );
  if (valueProxyCents === undefined) {
    basis = 'comparable_same_make';
    valueProxyCents = pickProxy(
      available.filter((v) => make !== undefined && v.make.toLowerCase() === make &&
        ownedVehicle.year !== undefined && Math.abs(v.year - ownedVehicle.year) <= 2),
    );
  }
  if (valueProxyCents === undefined) {
    const paymentCents = ownedVehicle.finance?.estimatedPayment?.amountCents;
    const termMonths = ownedVehicle.finance?.termMonths;
    if (paymentCents === undefined || termMonths === undefined) return undefined;
    basis = 'straight_line_proxy';
    valueProxyCents = Math.floor(paymentCents * termMonths * 0.55);
  }
  return { equityCents: valueProxyCents - payoffCents, valueProxyCents, basis };
}

// ---------------------------------------------------------------------------
// Factor definitions (all 15 OpportunityReasonCode values implemented)
// ---------------------------------------------------------------------------

const notFired = (why: string): FactorEvaluation => ({ fires: false, contribution01: 0, evidence: why });

export const FACTOR_DEFINITIONS: readonly FactorDefinition[] = [
  {
    code: 'lease_maturity_near',
    weight: 28,
    evaluate({ ownedVehicle, asOf }) {
      const fin = ownedVehicle.finance;
      if (fin?.kind !== 'lease' || fin.maturityDate === undefined) return notFired('no lease maturity date');
      const monthsTo = monthsBetween(asOf, fin.maturityDate);
      if (monthsTo < -1 || monthsTo > 9) return notFired(`lease maturity ${round1(monthsTo)} months out — outside window`);
      const contribution01 = clamp01((12 - Math.max(monthsTo, 0)) / 12);
      return {
        fires: true,
        contribution01,
        evidence: `lease matures in ~${round1(monthsTo)} months (as of ${asOf})`,
      };
    },
  },
  {
    code: 'finance_term_late',
    weight: 22,
    evaluate({ ownedVehicle, asOf }) {
      const fin = ownedVehicle.finance;
      if (fin?.kind !== 'loan' || fin.startDate === undefined || fin.termMonths === undefined || fin.termMonths <= 0) {
        return notFired('no loan start/term data');
      }
      const elapsed = monthsBetween(fin.startDate, asOf);
      const frac = elapsed / fin.termMonths;
      if (frac < 0.6) return notFired(`only ${Math.round(frac * 100)}% of financing term elapsed`);
      const contribution01 = clamp01((frac - 0.5) / 0.45);
      return {
        fires: true,
        contribution01,
        evidence: `~${round1(elapsed)} of ${fin.termMonths} financing months elapsed (${Math.round(frac * 100)}%)`,
      };
    },
  },
  {
    code: 'positive_equity_estimated',
    weight: 18,
    evaluate({ ownedVehicle, inventory }) {
      const est = estimateEquity(ownedVehicle, inventory);
      if (est === undefined) return notFired('no payoff/value proxy available');
      if (est.equityCents <= 0) return notFired('equity proxy not positive');
      const ratio = est.equityCents / est.valueProxyCents;
      return {
        fires: true,
        contribution01: clamp01(ratio / 0.35),
        evidence: `estimated equity proxy ${fmtCents(est.equityCents)} against value proxy ${fmtCents(est.valueProxyCents)} (basis: ${est.basis}) — internal estimate only, not an appraisal`,
      };
    },
  },
  {
    code: 'payment_upgrade_possible',
    weight: 10,
    evaluate(inputs) {
      const { customer, ownedVehicle, inventory, asOf } = inputs;
      const fin = ownedVehicle.finance;
      const paymentCents = fin?.estimatedPayment?.amountCents;
      if (paymentCents === undefined || paymentCents <= 0) return notFired('no current payment known');
      // Gate: only meaningful late in a loan or on any lease.
      const isLease = fin?.kind === 'lease';
      const loanFrac = fin?.kind === 'loan' && fin.startDate !== undefined && fin.termMonths !== undefined && fin.termMonths > 0
        ? monthsBetween(fin.startDate, asOf) / fin.termMonths
        : 0;
      if (!isLease && loanFrac < 0.5) return notFired('too early in financing term for upgrade math');
      const matches = matchInventory(customer, ownedVehicle, inventory);
      if (matches.length === 0) return notFired('no matched inventory to compare payments');
      const proxies = matches.map((v) => v.askingPrice.amountCents / PAYMENT_PROXY_MONTHS);
      const minProxy = Math.min(...proxies);
      if (minProxy > paymentCents * 1.05) return notFired('matched inventory payment proxies exceed current payment');
      const savingsFrac = (paymentCents - minProxy) / paymentCents;
      return {
        fires: true,
        contribution01: clamp01(savingsFrac / 0.2),
        evidence: `cheapest matched unit's straight-line payment proxy ${fmtCents(Math.round(minProxy))}/mo vs current ~${fmtCents(paymentCents)}/mo (zero-interest mock proxy, not a quote)`,
      };
    },
  },
  {
    code: 'high_mileage_vs_term',
    weight: 10,
    evaluate({ ownedVehicle, asOf }) {
      if (ownedVehicle.estimatedMileage === undefined || ownedVehicle.year === undefined) {
        return notFired('no mileage/model-year data');
      }
      const readingAt = ownedVehicle.mileageAsOf ?? asOf;
      const ageYears = Math.max(0.5, vehicleAgeYears(ownedVehicle.year, readingAt));
      const paceKmPerYear = ownedVehicle.estimatedMileage / ageYears;
      if (paceKmPerYear < 20_000) return notFired(`mileage pace ~${Math.round(paceKmPerYear)} km/yr is within typical range`);
      const contribution01 = Math.max(0.15, clamp01((paceKmPerYear - 20_000) / 15_000));
      return {
        fires: true,
        contribution01,
        evidence: `~${Math.round(paceKmPerYear)} km/yr pace (${ownedVehicle.estimatedMileage} km over ~${round1(ageYears)} yrs) exceeds 20,000 km/yr`,
      };
    },
  },
  {
    code: 'warranty_ending',
    weight: 8,
    evaluate({ ownedVehicle, asOf }) {
      if (ownedVehicle.warrantyEndDate === undefined) return notFired('no warranty end date known');
      const monthsTo = monthsBetween(asOf, ownedVehicle.warrantyEndDate);
      if (monthsTo < -1 || monthsTo > 6) return notFired(`warranty end ${round1(monthsTo)} months out — outside window`);
      return {
        fires: true,
        contribution01: clamp01((6 - Math.max(monthsTo, 0)) / 6),
        evidence: `warranty window ends in ~${round1(monthsTo)} months (as of ${asOf})`,
      };
    },
  },
  {
    code: 'service_visit_recent',
    weight: 8,
    evaluate({ ownedVehicle, asOf }) {
      if (ownedVehicle.lastServiceAt === undefined) return notFired('no service history on file');
      const daysSince = daysBetween(ownedVehicle.lastServiceAt, asOf);
      if (daysSince < 0 || daysSince > 90) return notFired(`last service ${round1(daysSince)} days ago — outside 90-day window`);
      return {
        fires: true,
        contribution01: Math.max(0.15, clamp01(1 - daysSince / 90)),
        evidence: `serviced here ~${round1(daysSince)} days ago — relationship is warm`,
      };
    },
  },
  {
    code: 'service_only_customer',
    weight: 14,
    evaluate({ customer }) {
      if (customer.segment !== 'service_only') return notFired('not a service-only customer');
      return {
        fires: true,
        contribution01: 1,
        evidence: 'services with us but has not purchased here (segment: service_only)',
      };
    },
  },
  {
    code: 'orphan_owner',
    weight: 16,
    evaluate({ customer }) {
      if (customer.segment !== 'orphan_owner') return notFired('not an orphan owner');
      return {
        fires: true,
        contribution01: 1,
        evidence: 'no active salesperson relationship on file (segment: orphan_owner)',
      };
    },
  },
  {
    code: 'vehicle_aging',
    weight: 12,
    evaluate({ ownedVehicle, asOf }) {
      if (ownedVehicle.year === undefined) return notFired('no model year known');
      const age = vehicleAgeYears(ownedVehicle.year, asOf);
      if (age < 6) return notFired(`vehicle ~${round1(age)} yrs old — below aging threshold`);
      return {
        fires: true,
        contribution01: clamp01((age - 5) / 5),
        evidence: `vehicle is ~${round1(age)} years old (model year ${ownedVehicle.year})`,
      };
    },
  },
  {
    code: 'inventory_match_available',
    weight: 12,
    evaluate({ customer, ownedVehicle, inventory }) {
      const matches = matchInventory(customer, ownedVehicle, inventory);
      if (matches.length === 0) return notFired('no available inventory matches the heuristic');
      return {
        fires: true,
        contribution01: clamp01(0.4 + 0.2 * matches.length),
        evidence: `${matches.length} available in-stock unit(s) match familiarity + budget-proxy heuristic`,
      };
    },
  },
  {
    code: 'engagement_recent',
    weight: 8,
    evaluate({ engagement, asOf }) {
      if (engagement?.lastInboundAt === undefined) return notFired('no recent inbound contact');
      const daysSince = daysBetween(engagement.lastInboundAt, asOf);
      if (daysSince < 0 || daysSince > 45) return notFired(`last inbound ${round1(daysSince)} days ago — outside 45-day window`);
      return {
        fires: true,
        contribution01: Math.max(0.2, clamp01(1 - daysSince / 45)),
        evidence: `customer reached out ~${round1(daysSince)} days ago`,
      };
    },
  },
  {
    code: 'website_behavior_intent',
    weight: 8,
    evaluate({ engagement }) {
      const views = engagement?.websiteVdpViewsLast30d ?? 0;
      if (views < 3) return notFired(`${views} VDP view(s) in 30 days — below intent threshold`);
      return {
        fires: true,
        contribution01: clamp01(views / 10),
        evidence: `${views} vehicle-detail-page views in the last 30 days`,
      };
    },
  },
  {
    code: 'household_opportunity',
    weight: 4,
    evaluate({ customer }) {
      if (customer.householdId === undefined) return notFired('no household link on file');
      return {
        fires: true,
        contribution01: 0.5,
        evidence: `linked to household ${String(customer.householdId)} — other members may have vehicle needs`,
      };
    },
  },
  {
    code: 'trade_in_window',
    weight: 10,
    evaluate({ ownedVehicle, asOf }) {
      const fin = ownedVehicle.finance;
      const reasons: string[] = [];
      if (fin?.kind === 'loan' && fin.startDate !== undefined && fin.termMonths !== undefined && fin.termMonths > 0) {
        const frac = monthsBetween(fin.startDate, asOf) / fin.termMonths;
        if (frac >= 0.7) reasons.push(`loan ${Math.round(frac * 100)}% elapsed`);
      }
      if (fin?.kind === 'lease' && fin.maturityDate !== undefined) {
        const monthsTo = monthsBetween(asOf, fin.maturityDate);
        if (monthsTo >= -1 && monthsTo <= 9) reasons.push(`lease matures in ~${round1(monthsTo)} months`);
      }
      if (ownedVehicle.year !== undefined && vehicleAgeYears(ownedVehicle.year, asOf) >= 8) {
        reasons.push(`vehicle ~${round1(vehicleAgeYears(ownedVehicle.year, asOf))} yrs old`);
      }
      if (reasons.length === 0) return notFired('no trade-in window signals');
      return {
        fires: true,
        contribution01: clamp01(0.4 + 0.3 * reasons.length),
        evidence: `trade-in window signals: ${reasons.join('; ')}`,
      };
    },
  },
];

// ---------------------------------------------------------------------------
// Claim-safe pitch templates (no guarantees, no superlatives, no commitments)
// ---------------------------------------------------------------------------

const PITCH_TEMPLATES: Record<OpportunityReasonCode, string> = {
  lease_maturity_near: 'Their lease appears to be approaching maturity, so they may be eligible to explore end-of-lease options — worth a conversation.',
  finance_term_late: 'They appear to be in the later stretch of their financing term, which can be a natural time to review options.',
  positive_equity_estimated: 'Internal estimates suggest they may have positive equity in their current vehicle; a no-obligation appraisal could clarify.',
  payment_upgrade_possible: 'Based on rough internal payment estimates, a newer vehicle may fit near their current budget — subject to lender review.',
  high_mileage_vs_term: 'Their estimated mileage is trending above typical pace, which sometimes makes an earlier trade conversation useful.',
  warranty_ending: 'Their factory warranty window may be ending soon; they might want to talk through options before it lapses.',
  service_visit_recent: 'They visited our service drive recently, so the relationship is warm — a light check-in may be well received.',
  service_only_customer: 'They service with us but have not purchased here; a respectful introduction to the sales team may be welcome.',
  orphan_owner: 'They do not currently have an assigned salesperson; reconnecting could be a helpful next step.',
  vehicle_aging: 'Their vehicle is getting older, and they may be starting to think about what comes next.',
  inventory_match_available: 'We currently have in-stock vehicles that may fit their situation — worth mentioning if they are curious.',
  engagement_recent: 'They reached out to us recently, so a timely, low-pressure follow-up may be appropriate.',
  website_behavior_intent: 'Recent website activity suggests they may be browsing inventory; a helpful, no-pressure note could be timely.',
  household_opportunity: 'Another household member may also have vehicle needs worth exploring, with their permission.',
  trade_in_window: 'Several signals suggest this may be a reasonable window to discuss a trade-in, with no obligation.',
};

const PITCH_PREFIX =
  'DRAFT — internal talking points only; estimates, not commitments; requires human review before any customer contact. ';

function buildRecommendedPitch(topCodes: OpportunityReasonCode[]): string {
  if (topCodes.length === 0) {
    return `${PITCH_PREFIX}No strong opportunity signals at this time; no outreach recommended.`;
  }
  return PITCH_PREFIX + topCodes.slice(0, 2).map((c) => PITCH_TEMPLATES[c]).join(' ');
}

// ---------------------------------------------------------------------------
// scoreOpportunity
// ---------------------------------------------------------------------------

export interface ScoreOptions {
  /** Deterministic seed for the opportunityId (e.g. `${customerId}:${vin}:${asOf}`). */
  idSeed: string;
}

function deriveOpportunityId(idSeed: string): OpportunityId {
  const hex = createHash('sha256').update(idSeed).digest('hex').slice(0, 16);
  return `opp_${hex}` as OpportunityId;
}

export function scoreOpportunity(inputs: ScoringInputs, opts: ScoreOptions): OpportunityScore {
  const fired = FACTOR_DEFINITIONS
    .map((def) => ({ def, result: def.evaluate(inputs) }))
    .filter(({ result }) => result.fires)
    .map(({ def, result }) => ({
      code: def.code,
      weight: def.weight,
      contribution: round2(def.weight * clamp01(result.contribution01)),
      evidence: result.evidence,
    }));

  // Highest contribution first; code tie-break keeps ordering deterministic.
  fired.sort((a, b) => b.contribution - a.contribution || a.code.localeCompare(b.code));

  const rawScore = fired.reduce((sum, f) => sum + f.contribution, 0);
  const score = clamp(Math.round(rawScore), 0, 100);
  const band: OpportunityScore['band'] = score >= BAND_HOT_MIN ? 'hot' : score >= BAND_WARM_MIN ? 'warm' : 'watch';

  const matches = matchInventory(inputs.customer, inputs.ownedVehicle, inputs.inventory);
  const reasonCodes = fired.map((f) => f.code);

  const result: OpportunityScore = {
    opportunityId: deriveOpportunityId(opts.idSeed),
    tenantId: inputs.customer.tenantId,
    dealerId: inputs.customer.dealerId,
    customerId: inputs.customer.customerId,
    ...(inputs.ownedVehicle.vin !== undefined ? { ownedVehicleVin: inputs.ownedVehicle.vin } : {}),
    score,
    band,
    reasonCodes,
    factors: fired,
    recommendedPitch: buildRecommendedPitch(reasonCodes),
    matchedInventoryVehicleIds: matches.map((v): VehicleId => v.vehicleId),
    nextBestAction: { kind: 'no_action', requiresHumanApproval: true }, // replaced below
    generatedAt: inputs.asOf,
    modelVersion: MODEL_VERSION,
  };
  result.nextBestAction = generateNextBestAction(result, inputs.customer);
  return result;
}

// ---------------------------------------------------------------------------
// Next best action (consent-aware; always human-approval-gated)
// ---------------------------------------------------------------------------

/**
 * CASL-aware usability check: express grants always usable; implied consent
 * usable only while unexpired (relative to `asOf`, i.e. score.generatedAt).
 */
export function hasUsableConsent(customer: Customer, channel: ConsentChannel, asOf: IsoTimestamp): boolean {
  return customer.consents.some((c) => {
    if (c.channel !== channel) return false;
    if (c.status === 'granted') return true;
    if (c.status === 'implied') {
      return c.expiresAt === undefined || parseIsoMs(c.expiresAt) > parseIsoMs(asOf);
    }
    return false;
  });
}

const DRAFT_DISCLOSURE = '(Drafted with AI assistance; a team member reviews before sending.)';

function topPitchSentences(score: OpportunityScore): string {
  const codes = score.reasonCodes.slice(0, 2);
  if (codes.length === 0) return PITCH_TEMPLATES.engagement_recent;
  return codes.map((c) => PITCH_TEMPLATES[c]).join(' ');
}

/**
 * SCHEMA_NOTE: consent-aware channel selection needs the customer's
 * ConsentRecords, which core's OpportunityScore does not embed. The customer
 * is therefore taken as an explicit second parameter here; if this pattern
 * sticks, core could add a redacted consent snapshot onto OpportunityScore.
 */
export function generateNextBestAction(
  score: OpportunityScore,
  customer: Customer,
  assigneeUserId?: UserId,
): NextBestAction {
  const asOf = score.generatedAt;
  const assignee = assigneeUserId !== undefined ? { assigneeUserId } : {};

  if (score.band === 'watch') {
    return { kind: 'no_action', requiresHumanApproval: true, ...assignee };
  }

  if (score.band === 'hot') {
    return {
      kind: 'call_task',
      requiresHumanApproval: true,
      dueAt: addDaysIso(asOf, 1),
      ...assignee,
      draftText:
        `CALL TASK (AI-drafted; requires human approval before any customer contact). ` +
        `Customer: ${customer.firstName} ${customer.lastName}. Suggested talking points: ${topPitchSentences(score)} ` +
        `Keep the tone low-pressure, confirm contact preferences on the call, and log the outcome either way. ${DRAFT_DISCLOSURE}`,
    };
  }

  // warm — consent-aware channel choice, falling back to an internal call task.
  if (hasUsableConsent(customer, 'sms', asOf)) {
    return {
      kind: 'sms_draft',
      requiresHumanApproval: true,
      dueAt: addDaysIso(asOf, 3),
      ...assignee,
      draftText:
        `Hi ${customer.firstName}, this is the team at your dealership. Based on your current vehicle, ` +
        `you may be eligible to explore an upgrade — no obligation, and we're happy to answer questions. ` +
        `Would a quick chat be helpful? Reply STOP to opt out. ${DRAFT_DISCLOSURE}`,
    };
  }
  if (hasUsableConsent(customer, 'email', asOf)) {
    return {
      kind: 'email_draft',
      requiresHumanApproval: true,
      dueAt: addDaysIso(asOf, 3),
      ...assignee,
      draftText:
        `Subject: A quick check-in about your vehicle\n\n` +
        `Hi ${customer.firstName},\n\n${topPitchSentences(score)} ` +
        `These are internal estimates only — not a commitment, quote, or appraisal. ` +
        `If you'd like, reply and we can set up a no-obligation conversation.\n\n` +
        `To stop receiving these notes, reply "unsubscribe". ${DRAFT_DISCLOSURE}`,
    };
  }
  return {
    kind: 'call_task',
    requiresHumanApproval: true,
    dueAt: addDaysIso(asOf, 3),
    ...assignee,
    draftText:
      `CALL TASK (AI-drafted; requires human approval before any customer contact — no usable SMS/email consent on file). ` +
      `Customer: ${customer.firstName} ${customer.lastName}. Suggested talking points: ${topPitchSentences(score)} ` +
      `Confirm consent preferences first if the customer engages. ${DRAFT_DISCLOSURE}`,
  };
}
