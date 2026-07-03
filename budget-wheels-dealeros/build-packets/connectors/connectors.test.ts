/**
 * BUDGET WHEELS DEALEROS — connectors/connectors.test (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Plain-Node test for Module 12 (connector registry + mock adapters).
 * Uses node:assert/strict only — no test framework. main() throws on the
 * first failure; each passing check logs a line.
 */

import assert from 'node:assert/strict';
import {
  assertNoRawSecret,
  ConnectorRegistry,
  type SendMessageInput,
  type TenantConnectorConfigInput,
} from './registry';
import {
  MockCalendarAdapter,
  MockDealerMineAdapter,
  MockInventoryCsvFeedAdapter,
  MockSmsAdapter,
  MockTmsTrafficAdapter,
  parseCsvLine,
} from './mocks';

const TENANT_ID = 'tenant_bw_zero_fixture';
const ASOF = '2026-07-03T18:00:00Z';

function baseConfig(overrides: Partial<TenantConnectorConfigInput> & Pick<TenantConnectorConfigInput, 'connectorId' | 'provider'>): TenantConnectorConfigInput {
  return {
    tenantId: TENANT_ID,
    displayName: 'Budget Wheels fixture connector',
    secretEnvVarNames: [],
    scopes: ['customers:read'],
    enabled: true,
    healthCheckPolicy: 'never_live',
    ...overrides,
  };
}

function main(): void {
  // -------------------------------------------------------------------------
  // assertNoRawSecret
  // -------------------------------------------------------------------------
  assert.throws(() => assertNoRawSecret('sk-abc123def456ghi789'), /secret/i);
  console.log('PASS assertNoRawSecret rejects sk- style token');

  assert.throws(() => assertNoRawSecret('xoxb-1234-5678-fixture'), /secret/i);
  console.log('PASS assertNoRawSecret rejects xoxb- style token');

  assert.throws(() => assertNoRawSecret('AKIAFIXTUREFIXTURE'), /secret/i);
  console.log('PASS assertNoRawSecret rejects AKIA style token');

  assert.throws(() => assertNoRawSecret('-----BEGIN RSA PRIVATE KEY-----'), /secret/i);
  console.log('PASS assertNoRawSecret rejects PEM header');

  assert.throws(() => assertNoRawSecret('Bearer fixturetokenvalue'), /secret/i);
  console.log('PASS assertNoRawSecret rejects bearer-prefixed value');

  assert.throws(
    () => assertNoRawSecret('x'.repeat(61)),
    /60 chars/,
  );
  console.log('PASS assertNoRawSecret rejects >60-char spaceless string');

  assertNoRawSecret('DEALERMINE_API_KEY'); // must NOT throw
  assertNoRawSecret('TWILIO_SMS_AUTH_TOKEN_NAME');
  console.log('PASS assertNoRawSecret accepts env var NAMES like DEALERMINE_API_KEY');

  // -------------------------------------------------------------------------
  // Registry: configure defaults + live gating
  // -------------------------------------------------------------------------
  const registry = new ConnectorRegistry();
  const dealerMine = new MockDealerMineAdapter();
  const tms = new MockTmsTrafficAdapter();
  const csvFeed = new MockInventoryCsvFeedAdapter();
  const sms = new MockSmsAdapter();
  const calendar = new MockCalendarAdapter();
  for (const adapter of [dealerMine, tms, csvFeed, sms, calendar]) {
    registry.register(adapter);
  }
  console.log('PASS registry registers all five mock adapters');

  assert.throws(() => registry.register(new MockSmsAdapter()), /already registered/);
  console.log('PASS registry rejects duplicate provider registration');

  const dmConfig = registry.configure(
    baseConfig({
      connectorId: 'conn_dm_01',
      provider: 'dealermine',
      secretEnvVarNames: ['DEALERMINE_API_KEY'],
      scopes: ['customers:read', 'service_history:read'],
    }),
  );
  assert.equal(dmConfig.mode, 'mock');
  console.log('PASS configure without mode defaults to mock');

  assert.throws(
    () =>
      registry.configure(
        baseConfig({ connectorId: 'conn_sms_live_bad', provider: 'twilio_sms', mode: 'live' }),
      ),
    /liveApprovalReceiptId/,
  );
  console.log('PASS live mode without approval receipt throws');

  const liveOk = registry.configure(
    baseConfig({
      connectorId: 'conn_sms_01',
      provider: 'twilio_sms',
      mode: 'live',
      liveApprovalReceiptId: 'receipt_human_approval_fixture_001',
      secretEnvVarNames: ['TWILIO_ACCOUNT_SID_NAME', 'TWILIO_AUTH_TOKEN_NAME'],
      scopes: ['message:send_draft'],
      healthCheckPolicy: 'never_live',
    }),
  );
  assert.equal(liveOk.mode, 'live');
  console.log('PASS live mode WITH approval receipt is accepted');

  assert.throws(
    () =>
      registry.configure(
        baseConfig({
          connectorId: 'conn_bad_secret',
          provider: 'cdk',
          secretEnvVarNames: ['sk-abc123def456ghi789jkl'],
        }),
      ),
    /secret/i,
  );
  console.log('PASS configure rejects raw-secret-looking secretEnvVarNames entry');

  assert.throws(
    () =>
      registry.configure(
        baseConfig({ connectorId: 'conn_bad_scope', provider: 'cdk', scopes: ['ALL ACCESS'] }),
      ),
    /least-privilege/,
  );
  console.log('PASS configure rejects malformed (non least-privilege) scope');

  assert.equal(registry.get('dealermine'), dealerMine);
  assert.throws(() => registry.get('reynolds'), /no adapter registered/);
  console.log('PASS get() returns registered adapter and throws for unregistered provider');

  // -------------------------------------------------------------------------
  // MockDealerMineAdapter — customers + service history fixtures
  // -------------------------------------------------------------------------
  const customersResult = dealerMine.importCustomers(dmConfig, {});
  assert.equal(customersResult.liveCallMade, false);
  assert.equal(customersResult.mode, 'mock');
  assert.equal(customersResult.records.length, 2);
  assert.equal(customersResult.records[0].tenantId, TENANT_ID);
  assert.equal(customersResult.records[0].ownedVehicles[0].vin, '2T1BURHE5JC000001');
  console.log('PASS DealerMine mock imports Customer-shaped fixtures stamped with config tenantId');

  const historyResult = dealerMine.importServiceHistory(dmConfig, { customerExternalRef: 'cust_fixture_dm_001' });
  assert.equal(historyResult.liveCallMade, false);
  assert.equal(historyResult.records.length, 1);
  assert.equal(historyResult.records[0].lineItems.some((li) => li.declined), true);
  console.log('PASS DealerMine mock imports service history filtered by customer ref');

  // -------------------------------------------------------------------------
  // MockTmsTrafficAdapter — TrafficEvent-shaped rows
  // -------------------------------------------------------------------------
  const tmsConfig = registry.configure(
    baseConfig({ connectorId: 'conn_tms_01', provider: 'tms_canada', scopes: ['traffic:read'] }),
  );
  const trafficResult = tms.importTraffic(tmsConfig, { since: '2026-07-01T00:00:00Z' });
  assert.equal(trafficResult.liveCallMade, false);
  assert.equal(trafficResult.records.length, 2);
  assert.equal(trafficResult.records[0].tenantId, TENANT_ID);
  assert.equal(trafficResult.records[0].source, 'phone');
  assert.equal(trafficResult.records[0].sla.breached, false);
  console.log('PASS TMS mock imports TrafficEvent-shaped rows with since-filter');

  // -------------------------------------------------------------------------
  // MockInventoryCsvFeedAdapter — CSV parsing incl. quoted commas
  // -------------------------------------------------------------------------
  assert.deepEqual(parseCsvLine('a,"b, c",d'), ['a', 'b, c', 'd']);
  assert.deepEqual(parseCsvLine('a,"say ""hi"", ok",z'), ['a', 'say "hi", ok', 'z']);
  console.log('PASS parseCsvLine handles quoted commas and doubled quotes');

  const csvConfig = registry.configure(
    baseConfig({ connectorId: 'conn_csv_01', provider: 'inventory_feed_csv', scopes: ['inventory:read'] }),
  );
  const inventoryResult = csvFeed.importInventory(csvConfig, {});
  assert.equal(inventoryResult.liveCallMade, false);
  assert.equal(inventoryResult.records.length, 3);
  assert.equal(inventoryResult.warnings.length, 0);
  const corolla = inventoryResult.records[0];
  assert.equal(corolla.vin, '2T1BURHE5JC000101');
  assert.equal(corolla.stockNumber, 'BW-1001');
  assert.equal(corolla.year, 2018);
  assert.equal(corolla.mileageKm, 88500);
  assert.deepEqual(corolla.askingPrice, { amountCents: 1599000, currency: 'CAD' });
  assert.deepEqual(corolla.features, ['heated seats', 'backup camera']); // quoted comma kept in one cell
  const f150 = inventoryResult.records[1];
  assert.deepEqual(f150.features, ['tow package', '4x4', '"box liner"']);
  const jetta = inventoryResult.records[2];
  assert.equal(jetta.trim, undefined);
  console.log('PASS CSV mock parses fixture into partial Vehicle records incl. quoted-comma features');

  // -------------------------------------------------------------------------
  // MockSmsAdapter — approval-gated queue, never sends
  // -------------------------------------------------------------------------
  const smsConfig = registry.listConfigs().find((c) => c.connectorId === 'conn_sms_01');
  assert.ok(smsConfig);
  const unapproved: SendMessageInput = {
    channel: 'sms',
    toContactRefRedacted: 'contact_ref_redacted_001',
    body: 'Hi — your test drive is being scheduled. (Drafted with AI assistance, reviewed by our team.)',
    requiresHumanApproval: true,
    asOf: ASOF,
  };
  assert.throws(() => sms.sendMessage(smsConfig, unapproved), /approvalReceiptId/);
  assert.equal(sms.outbox.length, 0);
  console.log('PASS SMS mock throws without approval receipt and queues nothing');

  const sendResult = sms.sendMessage(smsConfig, {
    ...unapproved,
    approvalReceiptId: 'receipt_human_approval_fixture_002',
  });
  assert.equal(sendResult.queued, true);
  assert.equal(sendResult.liveCallMade, false);
  assert.equal(sendResult.disposition, 'queued_draft_never_sent');
  assert.equal(sms.outbox.length, 1);
  assert.equal(sms.outbox[0].requiresHumanApproval, true);
  assert.equal(sms.outbox[0].status, 'queued_draft_never_sent');
  assert.equal(sms.outbox[0].queuedAt, ASOF);
  console.log('PASS SMS mock queues draft with approval receipt; nothing is ever sent');

  // -------------------------------------------------------------------------
  // MockCalendarAdapter — drafts only
  // -------------------------------------------------------------------------
  const calConfig = registry.configure(
    baseConfig({ connectorId: 'conn_cal_01', provider: 'google_calendar', scopes: ['calendar:write_draft'] }),
  );
  const calResult = calendar.writeCalendarDraft(calConfig, {
    title: 'Test drive — 2018 Corolla (fixture)',
    startsAt: '2026-07-05T17:00:00Z',
    endsAt: '2026-07-05T17:30:00Z',
    requiresHumanApproval: true,
    asOf: ASOF,
  });
  assert.equal(calResult.liveCallMade, false);
  assert.equal(calResult.draft.status, 'draft');
  assert.equal(calResult.draft.requiresHumanApproval, true);
  assert.equal(calResult.disposition, 'draft_only_not_written');
  console.log('PASS calendar mock produces draft-only, approval-gated calendar writes');

  // -------------------------------------------------------------------------
  // healthCheckAll — never live, liveCallMade:false for every adapter
  // -------------------------------------------------------------------------
  const reports = registry.healthCheckAll();
  assert.equal(reports.length, 5); // dm, sms(live), tms, csv, calendar
  for (const report of reports) {
    assert.equal(report.result.liveCallMade, false, `liveCallMade must be false for ${report.provider}`);
    assert.equal(report.result.ok, true);
  }
  const smsReport = reports.find((r) => r.provider === 'twilio_sms');
  assert.ok(smsReport);
  // live-mode connector with healthCheckPolicy 'never_live' is downgraded to mock for the check
  assert.equal(smsReport.result.mode, 'mock');
  console.log('PASS healthCheckAll reports liveCallMade:false for every adapter and downgrades never_live connectors');

  console.log('\nALL CHECKS PASSED — connectors packet (registry + mocks) green.');
}

main();
