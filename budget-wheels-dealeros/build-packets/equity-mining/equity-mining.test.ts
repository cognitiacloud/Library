/**
 * BUDGET WHEELS DEALEROS — equity-mining/equity-mining.test (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Plain-Node test for Module 7 (equity mining / opportunity scoring engine).
 * Uses node:assert/strict only — no test framework. main() throws on the
 * first failure; each passing check logs a line.
 */

import assert from 'node:assert/strict';
import type { NextBestAction, UserId } from '../schemas/core';
import {
  BAND_HOT_MIN,
  BAND_WARM_MIN,
  FACTOR_DEFINITIONS,
  MODEL_VERSION,
  generateNextBestAction,
  hasUsableConsent,
  matchInventory,
  scoreOpportunity,
} from './scoring';
import {
  ALL_FIXTURES,
  AS_OF,
  FIXTURE_A_FINANCE_MATURE,
  FIXTURE_B_RECENT_BUYER,
  FIXTURE_C_SERVICE_ONLY,
  FIXTURE_D_ORPHAN_LEASE,
  FIXTURE_E_KITCHEN_SINK,
} from './fixtures';

/** Claim-safe language gate for every customer-facing string this packet emits. */
const BANNED_PHRASES = ['guarantee', 'guaranteed', 'best price', '#1', 'certified', 'production ready', 'will save'];

function assertClaimSafe(text: string, label: string): void {
  const lower = text.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    assert.ok(!lower.includes(phrase), `${label} contains banned phrase "${phrase}": ${text}`);
  }
}

function main(): void {
  // -------------------------------------------------------------------------
  // Band expectations for the fixture paths
  // -------------------------------------------------------------------------
  for (const fixture of ALL_FIXTURES) {
    const score = scoreOpportunity(fixture.inputs, { idSeed: fixture.idSeed });
    assert.equal(
      score.band,
      fixture.expectedBand,
      `${fixture.name}: expected band ${fixture.expectedBand}, got ${score.band} (score ${score.score}, codes ${score.reasonCodes.join(',')})`,
    );
    console.log(`PASS ${fixture.name} band=${score.band} score=${score.score}`);
  }

  // -------------------------------------------------------------------------
  // Determinism: same inputs + same seed → deep-equal output
  // -------------------------------------------------------------------------
  const runA1 = scoreOpportunity(FIXTURE_A_FINANCE_MATURE.inputs, { idSeed: FIXTURE_A_FINANCE_MATURE.idSeed });
  const runA2 = scoreOpportunity(FIXTURE_A_FINANCE_MATURE.inputs, { idSeed: FIXTURE_A_FINANCE_MATURE.idSeed });
  assert.deepEqual(runA1, runA2);
  console.log('PASS scoreOpportunity is deterministic (two calls deep-equal)');

  const otherSeed = scoreOpportunity(FIXTURE_A_FINANCE_MATURE.inputs, { idSeed: 'a-different-seed' });
  assert.notEqual(String(otherSeed.opportunityId), String(runA1.opportunityId));
  assert.match(String(runA1.opportunityId), /^opp_[0-9a-f]{16}$/);
  console.log('PASS opportunityId derives deterministically from idSeed');

  // -------------------------------------------------------------------------
  // Score clamp 0..100 (kitchen-sink raw sum exceeds 100 → clamps to 100)
  // -------------------------------------------------------------------------
  for (const fixture of ALL_FIXTURES) {
    const score = scoreOpportunity(fixture.inputs, { idSeed: fixture.idSeed });
    assert.ok(score.score >= 0 && score.score <= 100, `${fixture.name}: score ${score.score} outside 0..100`);
  }
  console.log('PASS all fixture scores within 0..100');

  const sink = scoreOpportunity(FIXTURE_E_KITCHEN_SINK.inputs, { idSeed: FIXTURE_E_KITCHEN_SINK.idSeed });
  const sinkRawSum = sink.factors.reduce((s, f) => s + f.contribution, 0);
  assert.ok(sinkRawSum > 100, `kitchen sink raw contribution sum ${sinkRawSum} should exceed 100`);
  assert.equal(sink.score, 100);
  console.log(`PASS kitchen-sink raw sum ${Math.round(sinkRawSum)} clamps to score 100`);

  // -------------------------------------------------------------------------
  // Factor hygiene: evidence, ordering, weights, metadata
  // -------------------------------------------------------------------------
  assert.ok(new Set(FACTOR_DEFINITIONS.map((f) => f.code)).size >= 10, 'need >= 10 distinct reason codes implemented');
  console.log(`PASS FACTOR_DEFINITIONS implements ${FACTOR_DEFINITIONS.length} distinct reason codes`);

  for (const fixture of ALL_FIXTURES) {
    const score = scoreOpportunity(fixture.inputs, { idSeed: fixture.idSeed });
    for (const factor of score.factors) {
      assert.ok(factor.evidence.trim().length > 0, `${fixture.name}: fired factor ${factor.code} has empty evidence`);
      assert.ok(
        factor.contribution >= 0 && factor.contribution <= factor.weight,
        `${fixture.name}: ${factor.code} contribution ${factor.contribution} outside 0..weight(${factor.weight})`,
      );
    }
    // reasonCodes mirror fired factors, sorted by contribution descending.
    assert.deepEqual(score.reasonCodes, score.factors.map((f) => f.code), `${fixture.name}: reasonCodes != factor codes`);
    for (let i = 1; i < score.factors.length; i++) {
      const prev = score.factors[i - 1]!;
      const curr = score.factors[i]!;
      assert.ok(prev.contribution >= curr.contribution, `${fixture.name}: factors not sorted by contribution desc`);
    }
    assert.equal(score.modelVersion, MODEL_VERSION);
    assert.equal(score.generatedAt, AS_OF);
  }
  console.log('PASS every fired factor has non-empty evidence, bounded contribution, sorted reason codes');

  // Every factor evaluation stays within contribution01 bounds on all fixtures.
  for (const fixture of ALL_FIXTURES) {
    for (const def of FACTOR_DEFINITIONS) {
      const evaluation = def.evaluate(fixture.inputs);
      assert.ok(
        evaluation.contribution01 >= 0 && evaluation.contribution01 <= 1,
        `${fixture.name}/${def.code}: contribution01 ${evaluation.contribution01} outside 0..1`,
      );
      if (evaluation.fires) {
        assert.ok(evaluation.evidence.trim().length > 0, `${fixture.name}/${def.code}: fired with empty evidence`);
      }
    }
  }
  console.log('PASS factor evaluate() contribution01 stays within 0..1 across fixtures');

  // -------------------------------------------------------------------------
  // Inventory matching heuristic
  // -------------------------------------------------------------------------
  const matchesA = matchInventory(
    FIXTURE_A_FINANCE_MATURE.inputs.customer,
    FIXTURE_A_FINANCE_MATURE.inputs.ownedVehicle,
    FIXTURE_A_FINANCE_MATURE.inputs.inventory,
  );
  assert.deepEqual(matchesA.map((v) => String(v.vehicleId)), ['veh_test_cx5_19', 'veh_test_crv21']);
  console.log('PASS fixture (a) matches SUV-familiar, in-budget-band, available units (cheapest first)');

  for (const fixture of ALL_FIXTURES) {
    const score = scoreOpportunity(fixture.inputs, { idSeed: fixture.idSeed });
    assert.ok(
      !score.matchedInventoryVehicleIds.map(String).includes('veh_test_civic_sold'),
      `${fixture.name}: sold unit leaked into matches`,
    );
    assert.ok(score.matchedInventoryVehicleIds.length <= 3, `${fixture.name}: more than 3 matches`);
  }
  console.log('PASS sold inventory never matches; match list capped at 3');

  // -------------------------------------------------------------------------
  // Claim-safe language on every pitch and draft
  // -------------------------------------------------------------------------
  const assignee = 'user_test_closer' as UserId;
  const nbas: { name: string; nba: NextBestAction }[] = [];
  for (const fixture of ALL_FIXTURES) {
    const score = scoreOpportunity(fixture.inputs, { idSeed: fixture.idSeed });
    assertClaimSafe(score.recommendedPitch, `${fixture.name} recommendedPitch`);
    const nba = generateNextBestAction(score, fixture.inputs.customer, assignee);
    if (nba.draftText !== undefined) assertClaimSafe(nba.draftText, `${fixture.name} draftText`);
    nbas.push({ name: fixture.name, nba });
  }
  console.log('PASS no banned phrases in any recommendedPitch or NBA draftText');

  // -------------------------------------------------------------------------
  // Next best action: approval gate + consent-awareness
  // -------------------------------------------------------------------------
  for (const { name, nba } of nbas) {
    assert.equal(nba.requiresHumanApproval, true, `${name}: NBA missing requiresHumanApproval=true`);
  }
  console.log('PASS requiresHumanApproval === true on every next best action');

  const scoreB = scoreOpportunity(FIXTURE_B_RECENT_BUYER.inputs, { idSeed: FIXTURE_B_RECENT_BUYER.idSeed });
  const nbaB = generateNextBestAction(scoreB, FIXTURE_B_RECENT_BUYER.inputs.customer);
  assert.equal(nbaB.kind, 'no_action');
  assert.equal(nbaB.draftText, undefined);
  console.log('PASS watch fixture (b) → no_action with no draft');

  const scoreC = scoreOpportunity(FIXTURE_C_SERVICE_ONLY.inputs, { idSeed: FIXTURE_C_SERVICE_ONLY.idSeed });
  const nbaC = generateNextBestAction(scoreC, FIXTURE_C_SERVICE_ONLY.inputs.customer, assignee);
  assert.equal(scoreC.band, 'warm');
  assert.equal(nbaC.kind, 'email_draft', 'warm + revoked sms + granted email must fall back to email_draft');
  assert.equal(nbaC.assigneeUserId, assignee);
  assert.ok((nbaC.draftText ?? '').length > 0);
  console.log('PASS warm fixture (c) with revoked SMS consent → email_draft, not sms_draft');

  // Same warm customer, but with usable SMS consent → sms_draft.
  const customerCSms = {
    ...FIXTURE_C_SERVICE_ONLY.inputs.customer,
    consents: [{ channel: 'sms' as const, status: 'granted' as const, basis: 'express' as const }],
  };
  const nbaCSms = generateNextBestAction(scoreC, customerCSms);
  assert.equal(nbaCSms.kind, 'sms_draft');
  assert.ok((nbaCSms.draftText ?? '').toLowerCase().includes('stop'), 'sms draft must include an opt-out hint');
  console.log('PASS warm customer with granted SMS consent → sms_draft (with opt-out language)');

  const scoreD = scoreOpportunity(FIXTURE_D_ORPHAN_LEASE.inputs, { idSeed: FIXTURE_D_ORPHAN_LEASE.idSeed });
  const nbaD = generateNextBestAction(scoreD, FIXTURE_D_ORPHAN_LEASE.inputs.customer, assignee);
  assert.equal(scoreD.band, 'hot');
  assert.equal(nbaD.kind, 'call_task', 'fixture (d) has no usable sms consent — must be call_task, never sms_draft');
  assert.notEqual(nbaD.kind as string, 'sms_draft');
  assert.ok((nbaD.draftText ?? '').length > 0, 'hot call_task carries a claim-safe draft script');
  assert.equal(nbaD.dueAt, '2026-07-04T18:00:00.000Z'); // AS_OF + 1 day, derived from generatedAt — no Date.now()
  console.log('PASS hot fixture (d) without SMS consent → call_task with claim-safe script');

  assert.equal(
    hasUsableConsent(FIXTURE_D_ORPHAN_LEASE.inputs.customer, 'sms', AS_OF),
    false,
    'fixture (d) must have no usable sms consent',
  );
  console.log('PASS hasUsableConsent treats unknown/none consent as unusable');

  // -------------------------------------------------------------------------
  // Band threshold sanity
  // -------------------------------------------------------------------------
  assert.equal(BAND_HOT_MIN, 70);
  assert.equal(BAND_WARM_MIN, 40);
  const scoreA = scoreOpportunity(FIXTURE_A_FINANCE_MATURE.inputs, { idSeed: FIXTURE_A_FINANCE_MATURE.idSeed });
  assert.ok(scoreA.score >= BAND_HOT_MIN);
  assert.ok(scoreB.score < BAND_WARM_MIN);
  assert.ok(scoreC.score >= BAND_WARM_MIN && scoreC.score < BAND_HOT_MIN);
  console.log('PASS band thresholds: hot >= 70, warm >= 40, watch below');

  console.log('ALL EQUITY-MINING CHECKS PASSED');
}

main();
