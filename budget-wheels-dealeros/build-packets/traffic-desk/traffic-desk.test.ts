/**
 * BUDGET WHEELS DEALEROS — traffic-desk/traffic-desk.test (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Plain-Node mock tests: fixed timestamps only (no Date.now() anywhere in
 * asserted logic). Calendar facts used below: 2026-07-01 = Wednesday,
 * 2026-07-03 = Friday, 2026-07-05 = Sunday, 2026-07-06 = Monday.
 */

import assert from 'node:assert/strict';
import type { SlaState, UserId } from '../schemas/core';
import {
  DEFAULT_SLA_POLICY,
  computeFirstResponseDueAt,
  isBreached,
  markResponded,
  newSlaState,
} from './sla';
import { RoundRobinAssigner } from './assignment';
import {
  TransitionError,
  transitionAppointment,
  transitionTraffic,
} from './state-machine';

function check(name: string, fn: () => void): void {
  fn();
  console.log(`ok - ${name}`);
}

function main(): void {
  // -------------------------------------------------------------------------
  // SLA: due-at math (pure UTC per the documented scaffold simplification)
  // -------------------------------------------------------------------------

  check('internet_lead during business hours → occurredAt + 15 min', () => {
    const due = computeFirstResponseDueAt('2026-07-01T15:00:00Z', 'internet_lead', DEFAULT_SLA_POLICY);
    assert.equal(due, '2026-07-01T15:15:00.000Z');
  });

  check('website_chat during business hours → occurredAt + 2 min', () => {
    const due = computeFirstResponseDueAt('2026-07-01T10:30:00Z', 'website_chat', DEFAULT_SLA_POLICY);
    assert.equal(due, '2026-07-01T10:32:00.000Z');
  });

  check('walk_in during business hours → immediate greet (due = occurredAt)', () => {
    const due = computeFirstResponseDueAt('2026-07-01T14:00:00Z', 'walk_in', DEFAULT_SLA_POLICY);
    assert.equal(due, '2026-07-01T14:00:00.000Z');
  });

  check('after_hours lead Friday night → Monday morning slot (09:00 UTC)', () => {
    const due = computeFirstResponseDueAt('2026-07-03T23:30:00Z', 'after_hours', DEFAULT_SLA_POLICY);
    assert.equal(due, '2026-07-06T09:00:00.000Z');
  });

  check('website_form arriving Sunday → Monday morning + 15 min', () => {
    const due = computeFirstResponseDueAt('2026-07-05T17:00:00Z', 'website_form', DEFAULT_SLA_POLICY);
    assert.equal(due, '2026-07-06T09:15:00.000Z');
  });

  check('fixed-minutes lead after close on a business day → next business morning + minutes', () => {
    // Wednesday 21:00 UTC is past closeHour 18 → Thursday 09:15.
    const due = computeFirstResponseDueAt('2026-07-01T21:00:00Z', 'internet_lead', DEFAULT_SLA_POLICY);
    assert.equal(due, '2026-07-02T09:15:00.000Z');
  });

  check('early-morning arrival on a business day → same-day morning + minutes', () => {
    // Monday 06:00 UTC, before morningStartHour → Monday 09:15 (documented behavior).
    const due = computeFirstResponseDueAt('2026-07-06T06:00:00Z', 'internet_lead', DEFAULT_SLA_POLICY);
    assert.equal(due, '2026-07-06T09:15:00.000Z');
  });

  // -------------------------------------------------------------------------
  // SLA: breach detection + markResponded
  // -------------------------------------------------------------------------

  check('breach detection: not breached before due, breached after due', () => {
    const sla: SlaState = newSlaState('2026-07-01T15:00:00Z', 'internet_lead');
    assert.equal(sla.firstResponseDueAt, '2026-07-01T15:15:00.000Z');
    assert.equal(isBreached(sla, '2026-07-01T15:10:00Z'), false);
    assert.equal(isBreached(sla, '2026-07-01T15:15:00.000Z'), false); // exactly at due = still in SLA
    assert.equal(isBreached(sla, '2026-07-01T15:16:00Z'), true);
  });

  check('markResponded (on time) clears breach exposure permanently', () => {
    const sla = newSlaState('2026-07-01T15:00:00Z', 'internet_lead');
    const responded = markResponded(sla, '2026-07-01T15:05:00Z');
    assert.equal(responded.firstRespondedAt, '2026-07-01T15:05:00Z');
    assert.equal(responded.breached, false);
    // Even long after the due time, an on-time response is never breached.
    assert.equal(isBreached(responded, '2026-07-02T09:00:00Z'), false);
    // Immutability: the original state object was not touched.
    assert.equal(sla.firstRespondedAt, undefined);
    assert.equal(isBreached(sla, '2026-07-02T09:00:00Z'), true);
  });

  check('markResponded (late) freezes the breach as recorded', () => {
    const sla = newSlaState('2026-07-01T15:00:00Z', 'internet_lead');
    const late = markResponded(sla, '2026-07-01T16:00:00Z');
    assert.equal(late.breached, true);
    assert.equal(isBreached(late, '2026-07-10T00:00:00Z'), true);
  });

  // -------------------------------------------------------------------------
  // Round-robin assignment
  // -------------------------------------------------------------------------

  const a = 'user_a' as UserId;
  const b = 'user_b' as UserId;
  const c = 'user_c' as UserId;
  const x = 'user_x' as UserId;
  const y = 'user_y' as UserId;

  check('round-robin cycles [a, b, c] → a, b, c, a deterministically', () => {
    const rr = new RoundRobinAssigner([a, b, c]);
    assert.deepEqual(
      [rr.next('internet_lead'), rr.next('internet_lead'), rr.next('internet_lead'), rr.next('internet_lead')],
      [a, b, c, a],
    );
  });

  check('per-source override pool is used for that source only', () => {
    const rr = new RoundRobinAssigner([a, b, c], { phone: [x, y] });
    assert.deepEqual([rr.next('phone'), rr.next('phone'), rr.next('phone')], [x, y, x]);
    // Default pool cursor untouched by phone assignments.
    assert.deepEqual([rr.next('website_form'), rr.next('marketplace')], [a, b]);
    const state = rr.getState();
    assert.deepEqual(state.pools['phone'], { userIds: [x, y], cursor: 1 });
    assert.deepEqual(state.pools['__default__'], { userIds: [a, b, c], cursor: 2 });
  });

  check('skip(userId) removes the user from every pool', () => {
    const rr = new RoundRobinAssigner([a, b, c], { phone: [b, x] });
    rr.skip(b); // off shift
    assert.deepEqual(
      [rr.next('internet_lead'), rr.next('internet_lead'), rr.next('internet_lead')],
      [a, c, a],
    );
    assert.deepEqual([rr.next('phone'), rr.next('phone')], [x, x]);
    const state = rr.getState();
    assert.deepEqual(state.pools['__default__']!.userIds, [a, c]);
    assert.deepEqual(state.pools['phone']!.userIds, [x]);
  });

  check('empty pool (everyone skipped) throws instead of silently dropping the lead', () => {
    const rr = new RoundRobinAssigner([a]);
    rr.skip(a);
    assert.throws(() => rr.next('internet_lead'), /no assignable users/);
  });

  // -------------------------------------------------------------------------
  // Traffic outcome state machine
  // -------------------------------------------------------------------------

  check('happy path: open → appointment_set → shown → sold (with dealId)', () => {
    let state = transitionTraffic('open', 'appointment_set');
    state = transitionTraffic(state, 'shown');
    state = transitionTraffic(state, 'sold', { dealId: 'deal_001' });
    assert.equal(state, 'sold');
  });

  check('sold without ctx.dealId throws TransitionError', () => {
    assert.throws(() => transitionTraffic('shown', 'sold', {}), TransitionError);
    assert.throws(() => transitionTraffic('shown', 'sold'), /requires ctx.dealId/);
  });

  check('lost without ctx.lostReason throws TransitionError', () => {
    assert.throws(() => transitionTraffic('open', 'lost'), TransitionError);
    assert.throws(() => transitionTraffic('appointment_set', 'lost', {}), /requires ctx.lostReason/);
    // With a reason it succeeds.
    assert.equal(transitionTraffic('open', 'lost', { lostReason: 'no_response' }), 'lost');
  });

  check('no_show → appointment_set re-book is allowed', () => {
    const state = transitionTraffic('appointment_set', 'no_show');
    assert.equal(transitionTraffic(state, 'appointment_set'), 'appointment_set');
  });

  check('sold and lost are terminal; skipping stages is rejected', () => {
    assert.throws(() => transitionTraffic('sold', 'open'), TransitionError);
    assert.throws(() => transitionTraffic('lost', 'appointment_set'), TransitionError);
    assert.throws(() => transitionTraffic('open', 'shown'), TransitionError);
  });

  // -------------------------------------------------------------------------
  // Appointment status state machine
  // -------------------------------------------------------------------------

  const human = { draftedBy: 'human' as const };
  const agent = { draftedBy: 'agent' as const };
  const approver = 'user_mgr' as UserId;

  check('agent-drafted appointment cannot be proposed without a human confirmer', () => {
    assert.throws(() => transitionAppointment('draft', 'proposed', agent), TransitionError);
    assert.throws(() => transitionAppointment('draft', 'proposed', agent), /human approval/);
  });

  check('agent-drafted appointment proposes fine with confirmedByUserId', () => {
    const status = transitionAppointment('draft', 'proposed', { ...agent, confirmedByUserId: approver });
    assert.equal(status, 'proposed');
  });

  check('human-drafted appointment needs no confirmer for draft → proposed', () => {
    assert.equal(transitionAppointment('draft', 'proposed', human), 'proposed');
  });

  check('appointment happy path: proposed → confirmed → completed', () => {
    let status = transitionAppointment('proposed', 'confirmed', human);
    status = transitionAppointment(status, 'completed', human);
    assert.equal(status, 'completed');
  });

  check('completed is terminal', () => {
    assert.throws(() => transitionAppointment('completed', 'proposed', human), TransitionError);
    assert.throws(() => transitionAppointment('completed', 'cancelled', human), TransitionError);
  });

  check('cancelled is terminal; no_show → proposed re-book is allowed', () => {
    assert.throws(() => transitionAppointment('cancelled', 'proposed', human), TransitionError);
    assert.equal(transitionAppointment('no_show', 'proposed', human), 'proposed');
  });

  check('appointment cannot skip stages (draft → confirmed rejected)', () => {
    assert.throws(() => transitionAppointment('draft', 'confirmed', human), TransitionError);
  });

  console.log('ALL CHECKS PASSED (traffic-desk)');
}

main();
