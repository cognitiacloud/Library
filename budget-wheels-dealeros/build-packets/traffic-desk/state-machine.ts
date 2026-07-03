/**
 * BUDGET WHEELS DEALEROS — traffic-desk/state-machine (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Module 4 — TMS traffic desk: outcome + appointment state machines with
 * guard rails. Two invariants matter for the paper trail:
 * - `sold` requires a dealId and `lost` requires a lostReason, so
 *   traffic-to-sale reporting is never left with unexplained terminals.
 * - An agent-drafted appointment can never leave `draft` without a named
 *   human confirmer (human-approval gate on anything that could trigger
 *   outbound communication).
 */

import type { Appointment, DealId, LostReason, TrafficOutcome, UserId } from '../schemas/core';

// SCHEMA_NOTE: TrafficOutcomeState and AppointmentStatus are local aliases of
// TrafficOutcome['state'] and Appointment['status']; promote named exports to
// schemas/core if more packets need them.
export type TrafficOutcomeState = TrafficOutcome['state'];
export type AppointmentStatus = Appointment['status'];

/** Thrown for any invalid transition or failed guard. */
export class TransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransitionError';
  }
}

// ---------------------------------------------------------------------------
// Traffic outcome state machine
// ---------------------------------------------------------------------------

/**
 * open → appointment_set | sold | lost   (walk-ins can sell same-day)
 * appointment_set → shown | no_show | lost
 * shown → sold | lost
 * no_show → appointment_set | lost      (re-book path)
 * sold, lost → terminal
 */
export const TRAFFIC_TRANSITIONS: Readonly<Record<TrafficOutcomeState, readonly TrafficOutcomeState[]>> = {
  open: ['appointment_set', 'sold', 'lost'],
  appointment_set: ['shown', 'no_show', 'lost'],
  shown: ['sold', 'lost'],
  no_show: ['appointment_set', 'lost'],
  sold: [],
  lost: [],
};

export interface TrafficTransitionContext {
  dealId?: DealId;
  lostReason?: LostReason;
}

/**
 * Validate and perform a traffic-outcome transition. Returns the next state
 * or throws TransitionError. Guards: `sold` requires ctx.dealId; `lost`
 * requires ctx.lostReason.
 */
export function transitionTraffic(
  current: TrafficOutcomeState,
  next: TrafficOutcomeState,
  ctx: TrafficTransitionContext = {},
): TrafficOutcomeState {
  const allowed = TRAFFIC_TRANSITIONS[current];
  if (!allowed.includes(next)) {
    throw new TransitionError(
      `traffic outcome: illegal transition ${current} → ${next}` +
      (allowed.length === 0 ? ` ("${current}" is terminal)` : ` (allowed: ${allowed.join(', ')})`),
    );
  }
  if (next === 'sold' && ctx.dealId === undefined) {
    throw new TransitionError('traffic outcome: "sold" requires ctx.dealId (no deal, no sold mark)');
  }
  if (next === 'lost' && ctx.lostReason === undefined) {
    throw new TransitionError('traffic outcome: "lost" requires ctx.lostReason (accountability rule)');
  }
  return next;
}

// ---------------------------------------------------------------------------
// Appointment status state machine
// ---------------------------------------------------------------------------

/**
 * draft → proposed | cancelled
 * proposed → confirmed | cancelled
 * confirmed → completed | no_show | cancelled
 * no_show → proposed                       (re-book path)
 * completed, cancelled → terminal
 */
export const APPOINTMENT_TRANSITIONS: Readonly<Record<AppointmentStatus, readonly AppointmentStatus[]>> = {
  draft: ['proposed', 'cancelled'],
  proposed: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'no_show', 'cancelled'],
  no_show: ['proposed'],
  completed: [],
  cancelled: [],
};

export interface AppointmentTransitionContext {
  /** Who drafted the appointment; agent drafts are human-approval-gated. */
  draftedBy: Appointment['draftedBy'];
  /** Named human approver — required to propose an agent-drafted appointment. */
  confirmedByUserId?: UserId;
}

/**
 * Validate and perform an appointment-status transition. Returns the next
 * status or throws TransitionError.
 *
 * Guard (human approval): an appointment draftedBy 'agent' may NOT move
 * draft → proposed without ctx.confirmedByUserId — proposing is the first
 * step that can reach the customer, so a human must sign off first.
 */
export function transitionAppointment(
  current: AppointmentStatus,
  next: AppointmentStatus,
  ctx: AppointmentTransitionContext,
): AppointmentStatus {
  const allowed = APPOINTMENT_TRANSITIONS[current];
  if (!allowed.includes(next)) {
    throw new TransitionError(
      `appointment: illegal transition ${current} → ${next}` +
      (allowed.length === 0 ? ` ("${current}" is terminal)` : ` (allowed: ${allowed.join(', ')})`),
    );
  }
  if (
    current === 'draft' && next === 'proposed' &&
    ctx.draftedBy === 'agent' && ctx.confirmedByUserId === undefined
  ) {
    throw new TransitionError(
      'appointment: agent-drafted appointment requires ctx.confirmedByUserId (human approval) before draft → proposed',
    );
  }
  return next;
}
