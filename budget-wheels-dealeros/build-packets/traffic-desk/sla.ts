/**
 * BUDGET WHEELS DEALEROS — traffic-desk/sla (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Module 4 — TMS traffic desk: first-response SLA timers. Given a traffic
 * event's source and arrival time, compute when the first human/approved
 * response is due, detect breaches against a caller-supplied `now`, and
 * record responses immutably.
 *
 * SIMPLIFICATION (deliberate for this scaffold): all business-hours math is
 * done in raw UTC. A real rooftop keeps an IANA timezone
 * (Rooftop.timezone, e.g. "America/Vancouver"); converting business hours
 * through that zone (incl. DST) is deferred to the dedicated DealerOS repo.
 * SCHEMA_NOTE: SlaPolicy is defined locally in this packet; when rooftop
 * timezone handling lands, promote it to schemas/core alongside SlaState
 * and add a `timezone` (IANA) field sourced from Rooftop.
 */

import type { IsoTimestamp, SlaState, TrafficSourceKind } from '../schemas/core';

// ---------------------------------------------------------------------------
// Policy
// ---------------------------------------------------------------------------

export interface SlaPolicy {
  /** Per-source first-response rule: fixed minutes, or defer to the next business morning. */
  perSource: Record<TrafficSourceKind, { firstResponseMinutes: number | 'next_business_morning' }>;
  /**
   * Business hours in UTC (see file-header simplification note).
   * `days` uses JS getUTCDay() numbering: 0 = Sunday … 6 = Saturday.
   */
  businessHours: { openHour: number; closeHour: number; days: number[] };
  /** UTC hour at which "next business morning" SLAs come due (e.g. 9 → 09:00). */
  morningStartHour: number;
}

/**
 * Tenant-zero defaults (Budget Wheels avatar). Mon–Fri 9–18 UTC placeholder
 * hours; real rooftops override per-tenant. walk_in = 0 minutes → immediate
 * greet: due the moment the customer is on the floor.
 */
export const DEFAULT_SLA_POLICY: SlaPolicy = {
  perSource: {
    phone: { firstResponseMinutes: 5 },
    internet_lead: { firstResponseMinutes: 15 },
    website_form: { firstResponseMinutes: 15 },
    website_chat: { firstResponseMinutes: 2 },
    marketplace: { firstResponseMinutes: 30 },
    walk_in: { firstResponseMinutes: 0 },
    service_drive: { firstResponseMinutes: 30 },
    referral: { firstResponseMinutes: 60 },
    partner: { firstResponseMinutes: 60 },
    after_hours: { firstResponseMinutes: 'next_business_morning' },
  },
  businessHours: { openHour: 9, closeHour: 18, days: [1, 2, 3, 4, 5] },
  morningStartHour: 9,
};

// ---------------------------------------------------------------------------
// Due-at computation (pure UTC math; no Date.now())
// ---------------------------------------------------------------------------

function parseIso(ts: IsoTimestamp): Date {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`sla: invalid IsoTimestamp "${ts}"`);
  }
  return d;
}

/** True when `at` falls inside the policy's (UTC) business hours. */
export function isWithinBusinessHours(at: Date, policy: SlaPolicy): boolean {
  const { openHour, closeHour, days } = policy.businessHours;
  const hour = at.getUTCHours();
  return days.includes(at.getUTCDay()) && hour >= openHour && hour < closeHour;
}

/**
 * The next business morning at `morningStartHour` UTC, strictly usable as a
 * response slot:
 * - Arrival on a business day BEFORE that day's morning slot → that same
 *   day's morning (e.g. 06:00 Monday → 09:00 Monday).
 * - Otherwise → walk forward day-by-day to the next day in
 *   businessHours.days (e.g. Friday night → Monday morning).
 */
export function nextBusinessMorning(from: Date, policy: SlaPolicy): Date {
  const { days } = policy.businessHours;
  if (days.length === 0) {
    throw new Error('sla: SlaPolicy.businessHours.days is empty — no business morning exists');
  }
  const sameDayMorning = new Date(Date.UTC(
    from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(),
    policy.morningStartHour, 0, 0, 0,
  ));
  if (days.includes(from.getUTCDay()) && from.getTime() < sameDayMorning.getTime()) {
    return sameDayMorning;
  }
  const candidate = new Date(sameDayMorning.getTime());
  for (let i = 0; i < 8; i += 1) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
    if (days.includes(candidate.getUTCDay())) return candidate;
  }
  /* istanbul-style unreachable: days validated non-empty above */
  throw new Error('sla: could not find a business day within 8 days');
}

/**
 * Compute when the first response to a traffic event is due.
 *
 * Rules:
 * - 'next_business_morning' sources → next business morning at
 *   `morningStartHour` UTC.
 * - Fixed-minutes sources arriving DURING business hours → occurredAt + N min.
 * - Fixed-minutes sources arriving OUTSIDE business hours → next business
 *   morning + N min (the clock only starts when someone can plausibly respond).
 */
export function computeFirstResponseDueAt(
  occurredAt: IsoTimestamp,
  source: TrafficSourceKind,
  policy: SlaPolicy = DEFAULT_SLA_POLICY,
): IsoTimestamp {
  const rule = policy.perSource[source];
  if (!rule) {
    throw new Error(`sla: no SLA rule for source "${source}"`);
  }
  const occurred = parseIso(occurredAt);
  if (rule.firstResponseMinutes === 'next_business_morning') {
    return nextBusinessMorning(occurred, policy).toISOString();
  }
  const minutesMs = rule.firstResponseMinutes * 60_000;
  if (isWithinBusinessHours(occurred, policy)) {
    return new Date(occurred.getTime() + minutesMs).toISOString();
  }
  const morning = nextBusinessMorning(occurred, policy);
  return new Date(morning.getTime() + minutesMs).toISOString();
}

/** Convenience: build a fresh SlaState for a new traffic event. */
export function newSlaState(
  occurredAt: IsoTimestamp,
  source: TrafficSourceKind,
  policy: SlaPolicy = DEFAULT_SLA_POLICY,
): SlaState {
  return {
    firstResponseDueAt: computeFirstResponseDueAt(occurredAt, source, policy),
    breached: false,
  };
}

// ---------------------------------------------------------------------------
// Breach detection + response recording (pure; `now` is always a parameter)
// ---------------------------------------------------------------------------

/**
 * Is this SLA breached as of `now`?
 * - Not yet responded: breached once `now` is strictly past the due time.
 * - Already responded: the breach outcome was frozen by markResponded — an
 *   on-time response clears breach exposure permanently; a late response
 *   stays recorded as a breach.
 */
export function isBreached(sla: SlaState, now: IsoTimestamp): boolean {
  if (sla.firstRespondedAt !== undefined) return sla.breached;
  return parseIso(now).getTime() > parseIso(sla.firstResponseDueAt).getTime();
}

/**
 * Record the first response (immutable update). Sets `firstRespondedAt` and
 * freezes `breached` to whether the response landed after the due time.
 */
export function markResponded(sla: SlaState, at: IsoTimestamp): SlaState {
  return {
    ...sla,
    firstRespondedAt: at,
    breached: parseIso(at).getTime() > parseIso(sla.firstResponseDueAt).getTime(),
  };
}
