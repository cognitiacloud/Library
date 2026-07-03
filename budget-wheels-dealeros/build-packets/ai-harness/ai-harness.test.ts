/**
 * BUDGET WHEELS DEALEROS — ai-harness/ai-harness.test (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Plain-Node test for Module 13 (model router, redaction gate, usage ledger).
 * Uses node:assert/strict only — no test framework. main() throws on the
 * first failure; each passing check logs a line. All timestamps are fixed
 * fixtures — nothing reads the wall clock.
 */

import assert from 'node:assert/strict';
import {
  DEFAULT_ROUTING,
  MockExternalProvider,
  MockLocalProvider,
  ModelRouter,
  PolicyDeniedError,
  type ModelProvider,
  type ModelProviderKind,
  type ModelRequest,
  type RoutingConfig,
} from './provider';
import { DefaultPolicyGate, redactPii, type TenantAiPolicy } from './redaction';
import { InMemoryPromptRegistry, InMemoryUsageLedger } from './usage-ledger';

const TENANT_ID = 'tenant_bw_zero_fixture';
const OTHER_TENANT_ID = 'tenant_other_fixture';
const NOW = '2026-07-03T18:00:00Z';

function policyOf(overrides: Partial<TenantAiPolicy> = {}): TenantAiPolicy {
  return {
    externalModelsAllowed: true,
    piiToExternalModelsAllowed: false,
    localOnlyMode: false,
    aiDisclosureFooter: 'Drafted with AI assistance, reviewed by our team.',
    ...overrides,
  };
}

function requestOf(overrides: Partial<ModelRequest> = {}): ModelRequest {
  return {
    task: 'reply_drafting',
    tenantId: TENANT_ID,
    promptKey: 'reply_drafting.customer_reply',
    promptVersion: '1.0.0',
    input: 'Customer [NAME_1] asked whether the 2019 RAV4 is still available and about financing options.',
    containsPii: false,
    maxCostCents: 50,
    ...overrides,
  };
}

function providersFixture(): Partial<Record<ModelProviderKind, ModelProvider>> {
  return {
    mock_local: new MockLocalProvider(),
    ollama_local: new MockLocalProvider('ollama_local', 'mock-ollama-local'),
    anthropic: new MockExternalProvider('anthropic'),
    openai: new MockExternalProvider('openai'),
    openrouter: new MockExternalProvider('openrouter'),
  };
}

function main(): void {
  // -------------------------------------------------------------------------
  // redactPii — regex passes + known-name pass
  // -------------------------------------------------------------------------
  const fixtureText =
    'Follow up with Jordan Lee at jordan.lee@example.com or 604-555-1234 ' +
    '(alt (604) 555-9876, mobile +1 604 555 4321). Trade-in VIN 1HGCM82633A004352, ' +
    'lives near V6B 1A1. Jordan Lee prefers email. Contact again: jordan.lee@example.com';

  const { redactedText, redactions } = redactPii(fixtureText, { names: ['Jordan Lee'] });

  for (const original of [
    'jordan.lee@example.com',
    '604-555-1234',
    '(604) 555-9876',
    '+1 604 555 4321',
    '1HGCM82633A004352',
    'V6B 1A1',
    'Jordan Lee',
  ]) {
    assert.ok(!redactedText.includes(original), `redacted text must not contain ${original}`);
  }
  console.log('PASS redactPii output contains no original email/phone/VIN/postal-code/name values');

  for (const placeholder of ['[EMAIL_1]', '[PHONE_1]', '[PHONE_2]', '[PHONE_3]', '[VIN_1]', '[POSTAL_CODE_1]', '[NAME_1]']) {
    assert.ok(redactedText.includes(placeholder), `redacted text must contain ${placeholder}`);
  }
  console.log('PASS redactPii inserts numbered placeholders per kind');

  const kinds = redactions.map((r) => r.kind).sort();
  assert.deepEqual(kinds, ['email', 'name', 'phone', 'phone', 'phone', 'postal_code', 'vin']);
  console.log('PASS redactPii records one redaction per unique original value');

  for (const r of redactions) {
    assert.match(r.original_hash, /^[0-9a-f]{8}$/, 'original_hash must be first 8 hex of sha256');
  }
  console.log('PASS redactPii original_hash is 8 lowercase hex chars');

  // Repeated value ("jordan.lee@example.com" appears twice) reuses [EMAIL_1].
  assert.equal(redactedText.match(/\[EMAIL_1\]/g)?.length, 2);
  assert.ok(!redactedText.includes('[EMAIL_2]'));
  console.log('PASS redactPii reuses the same placeholder for a repeated original value');

  // Determinism of the redaction pass itself.
  const secondRun = redactPii(fixtureText, { names: ['Jordan Lee'] });
  assert.deepEqual(secondRun, { redactedText, redactions });
  console.log('PASS redactPii is deterministic (same input, same output)');

  // -------------------------------------------------------------------------
  // DefaultPolicyGate
  // -------------------------------------------------------------------------
  const gate = new DefaultPolicyGate();
  const externalProvider = new MockExternalProvider('anthropic');
  const localProvider = new MockLocalProvider();

  const piiExternal = gate.checkModelCall({
    task: 'reply_drafting',
    provider: externalProvider,
    containsPii: true,
    tenantAiPolicy: policyOf(), // even with externalModelsAllowed: true
  });
  assert.notEqual(piiExternal, 'allow');
  assert.match((piiExternal as { deny: string }).deny, /pii/);
  console.log('PASS gate denies PII to external provider even when tenant allows external models');

  assert.equal(
    gate.checkModelCall({
      task: 'call_summary',
      provider: localProvider,
      containsPii: true,
      tenantAiPolicy: policyOf({ externalModelsAllowed: false, localOnlyMode: true }),
    }),
    'allow',
  );
  console.log('PASS gate allows PII to local provider (even in strictest tenant policy)');

  const externalNotAllowed = gate.checkModelCall({
    task: 'seo_content',
    provider: externalProvider,
    containsPii: false,
    tenantAiPolicy: policyOf({ externalModelsAllowed: false }),
  });
  assert.notEqual(externalNotAllowed, 'allow');
  assert.match((externalNotAllowed as { deny: string }).deny, /external_models_not_allowed/);
  console.log('PASS gate denies external provider when tenant disallows external models');

  const localOnly = gate.checkModelCall({
    task: 'seo_content',
    provider: externalProvider,
    containsPii: false,
    tenantAiPolicy: policyOf({ localOnlyMode: true }),
  });
  assert.notEqual(localOnly, 'allow');
  assert.match((localOnly as { deny: string }).deny, /local_only/);
  console.log('PASS gate denies external provider in localOnlyMode');

  assert.equal(
    gate.checkModelCall({
      task: 'seo_content',
      provider: externalProvider,
      containsPii: false,
      tenantAiPolicy: policyOf(),
    }),
    'allow',
  );
  console.log('PASS gate allows clean (non-PII) request to external provider under permissive policy');

  // -------------------------------------------------------------------------
  // MockLocalProvider determinism + claim-safe draft posture
  // -------------------------------------------------------------------------
  const detReq = requestOf();
  const detA = new MockLocalProvider().complete(detReq);
  const detB = new MockLocalProvider().complete(detReq);
  assert.deepEqual(detA, detB);
  assert.equal(detA.inputTokens, Math.ceil(detReq.input.length / 4));
  assert.equal(detA.requiresHumanApproval, true);
  assert.match(detA.text, /human approval/i);
  assert.match(detA.text, /No guarantees/i);
  console.log('PASS MockLocalProvider is deterministic, approval-gated, and claim-safe');

  const otherInput = new MockLocalProvider().complete(requestOf({ input: 'different input text entirely' }));
  assert.notEqual(otherInput.text, detA.text);
  console.log('PASS MockLocalProvider output varies with input (stable hash ref)');

  // -------------------------------------------------------------------------
  // DEFAULT_ROUTING — privacy-sensitive tasks stay local
  // -------------------------------------------------------------------------
  const providers = providersFixture();
  for (const task of ['call_summary', 'compliance_check', 'manager_coaching'] as const) {
    const primary = providers[DEFAULT_ROUTING[task].primary];
    assert.ok(primary !== undefined && !primary.isExternal, `${task} primary must be local`);
  }
  console.log('PASS DEFAULT_ROUTING keeps privacy-sensitive tasks on local primaries');

  // -------------------------------------------------------------------------
  // ModelRouter — happy path (clean request, external primary allowed)
  // -------------------------------------------------------------------------
  const ledger = new InMemoryUsageLedger();
  const router = new ModelRouter(providers, DEFAULT_ROUTING, gate, ledger);

  const okRes = router.route(requestOf(), policyOf(), NOW);
  assert.equal(okRes.providerUsed, 'anthropic');
  assert.equal(okRes.fallbackUsed, false);
  assert.equal(okRes.requiresHumanApproval, true);
  console.log('PASS router uses external primary for clean request under permissive policy');

  // -------------------------------------------------------------------------
  // ModelRouter — external primary + PII → local fallback with fallbackUsed
  // -------------------------------------------------------------------------
  const piiRes = router.route(requestOf({ containsPii: true }), policyOf(), NOW);
  assert.equal(piiRes.providerUsed, 'mock_local');
  assert.equal(piiRes.fallbackUsed, true);
  console.log('PASS router falls back to local mock when PII blocks the external primary');

  const deniedRecords = ledger.recordsFor(TENANT_ID).filter((r) => r.outcome === 'denied');
  assert.equal(deniedRecords.length, 1);
  assert.equal(deniedRecords[0]!.provider, 'anthropic');
  assert.match(deniedRecords[0]!.gateReason ?? '', /pii/);
  assert.equal(deniedRecords[0]!.costCents, 0);
  assert.equal(deniedRecords[0]!.timestamp, NOW);
  console.log('PASS denied primary attempt is recorded in the ledger with outcome=denied');

  // -------------------------------------------------------------------------
  // ModelRouter — localOnlyMode forces local even for clean requests
  // -------------------------------------------------------------------------
  const localOnlyRes = router.route(requestOf(), policyOf({ localOnlyMode: true }), NOW);
  assert.equal(localOnlyRes.providerUsed, 'mock_local');
  assert.equal(localOnlyRes.fallbackUsed, true);
  console.log('PASS localOnlyMode forces routing onto the local fallback');

  // -------------------------------------------------------------------------
  // ModelRouter — privacy task with PII runs directly on local primary
  // -------------------------------------------------------------------------
  const summaryRes = router.route(
    requestOf({ task: 'call_summary', promptKey: 'call_summary.default', containsPii: true, maxCostCents: 5 }),
    policyOf(),
    NOW,
  );
  assert.equal(summaryRes.providerUsed, 'ollama_local');
  assert.equal(summaryRes.fallbackUsed, false);
  console.log('PASS call_summary with PII runs on ollama_local primary without fallback');

  // -------------------------------------------------------------------------
  // ModelRouter — both providers external + PII → PolicyDeniedError, both recorded
  // -------------------------------------------------------------------------
  const bothExternalRouting: RoutingConfig = {
    ...DEFAULT_ROUTING,
    reply_drafting: { primary: 'openai', fallback: 'anthropic', model: 'mock-openai-mid', maxCostCentsPerCall: 25 },
  };
  const denyLedger = new InMemoryUsageLedger();
  const denyRouter = new ModelRouter(providers, bothExternalRouting, gate, denyLedger);
  assert.throws(
    () => denyRouter.route(requestOf({ containsPii: true }), policyOf(), NOW),
    (err: unknown) => err instanceof PolicyDeniedError && /pii/.test(err.reason),
  );
  const denyRecords = denyLedger.recordsFor(TENANT_ID);
  assert.equal(denyRecords.length, 2);
  assert.ok(denyRecords.every((r) => r.outcome === 'denied' && r.costCents === 0));
  assert.deepEqual(denyRecords.map((r) => r.provider), ['openai', 'anthropic']);
  console.log('PASS fully-external route with PII throws PolicyDeniedError and records both denials');

  // -------------------------------------------------------------------------
  // ModelRouter — cost cap breach on primary falls back to local
  // -------------------------------------------------------------------------
  const priceyProviders = { ...providersFixture(), anthropic: new MockExternalProvider('anthropic', undefined, 999) };
  const costLedger = new InMemoryUsageLedger();
  const costRouter = new ModelRouter(priceyProviders, DEFAULT_ROUTING, gate, costLedger);
  const cappedRes = costRouter.route(requestOf(), policyOf(), NOW);
  assert.equal(cappedRes.providerUsed, 'mock_local');
  assert.equal(cappedRes.fallbackUsed, true);
  const costErrors = costLedger.recordsFor(TENANT_ID).filter((r) => r.outcome === 'error');
  assert.equal(costErrors.length, 1);
  assert.match(costErrors[0]!.gateReason ?? '', /cost_cap_exceeded/);
  assert.equal(costErrors[0]!.costCents, 999);
  console.log('PASS cost-cap breach on primary is recorded as error and falls back to local');

  // -------------------------------------------------------------------------
  // Ledger totals + per-task rollup + tenant isolation
  // -------------------------------------------------------------------------
  const sumLedger = new InMemoryUsageLedger();
  const sumRouter = new ModelRouter(providersFixture(), DEFAULT_ROUTING, gate, sumLedger);
  const r1 = sumRouter.route(requestOf(), policyOf(), NOW);
  const r2 = sumRouter.route(requestOf({ task: 'seo_content', promptKey: 'seo_content.vdp' }), policyOf(), NOW);
  const r3 = sumRouter.route(requestOf({ containsPii: true }), policyOf(), NOW); // denied + local ok

  assert.equal(sumLedger.totalCostCents(TENANT_ID), r1.costCents + r2.costCents + r3.costCents);
  console.log('PASS ledger totalCostCents equals the sum of returned response costs');

  const byTask = sumLedger.byTask(TENANT_ID);
  assert.equal(byTask.reply_drafting?.calls, 3); // ok + denied + fallback ok
  assert.equal(byTask.reply_drafting?.okCalls, 2);
  assert.equal(byTask.reply_drafting?.deniedCalls, 1);
  assert.equal(byTask.seo_content?.calls, 1);
  assert.equal(byTask.seo_content?.okCalls, 1);
  assert.equal(byTask.seo_content?.costCents, r2.costCents);
  console.log('PASS ledger byTask rollup counts ok/denied attempts per task');

  assert.equal(sumLedger.totalCostCents(OTHER_TENANT_ID), 0);
  assert.deepEqual(sumLedger.byTask(OTHER_TENANT_ID), {});
  console.log('PASS ledger is tenant-isolated (other tenant sees zero usage)');

  // -------------------------------------------------------------------------
  // Prompt registry — deterministic sha256, immutable versions
  // -------------------------------------------------------------------------
  const registry = new InMemoryPromptRegistry();
  const entry = registry.register(
    'reply_drafting.customer_reply',
    '1.0.0',
    'Draft a claim-safe customer reply for human review.',
    'TEMPLATE: reply to {{question}} using only provided inventory facts.',
  );
  assert.match(entry.sha256, /^[0-9a-f]{64}$/);
  const again = registry.register(
    'reply_drafting.customer_reply',
    '1.0.0',
    'Draft a claim-safe customer reply for human review.',
    'TEMPLATE: reply to {{question}} using only provided inventory facts.',
  );
  assert.equal(again.sha256, entry.sha256);
  assert.throws(
    () => registry.register('reply_drafting.customer_reply', '1.0.0', 'changed', 'DIFFERENT TEMPLATE TEXT'),
    /immutable/,
  );
  assert.equal(registry.get('reply_drafting.customer_reply', '1.0.0')?.sha256, entry.sha256);
  console.log('PASS prompt registry hashes deterministically and rejects version mutation');

  console.log('\nALL CHECKS PASSED — ai-harness packet (Module 13) reference scaffold OK');
}

main();
