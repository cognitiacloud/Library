/**
 * BUDGET WHEELS DEALEROS — connectors/mocks (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Module 12 — Mock adapters. Every adapter here is deterministic, reads only
 * inline fixtures (all data fake/reserved), performs zero I/O, and reports
 * liveCallMade: false ALWAYS. Outbound-shaped capabilities (SMS, calendar)
 * only queue/draft and require a human-approval proof receipt.
 */

import type {
  Customer,
  IsoTimestamp,
  ReceiptId,
  TrafficEvent,
  Vehicle,
} from '../schemas/core';
import type {
  CalendarWriteInput,
  CalendarWriteResult,
  ConnectorAdapter,
  ConnectorCapability,
  ConnectorProvider,
  HealthResult,
  ImportCustomersInput,
  ImportCustomersResult,
  ImportInventoryInput,
  ImportInventoryResult,
  ImportServiceHistoryInput,
  ImportServiceHistoryResult,
  ImportTrafficInput,
  ImportTrafficResult,
  SendMessageInput,
  SendMessageResult,
  ServiceHistoryRecord,
  TenantConnectorConfig,
} from './registry';

// ---------------------------------------------------------------------------
// Shared helper — every mock health check is offline by construction
// ---------------------------------------------------------------------------

function mockHealth(config: TenantConnectorConfig, adapterName: string): HealthResult {
  return {
    ok: true,
    mode: config.mode,
    liveCallMade: false,
    detail: `${adapterName}: fixture-backed mock adapter; no network I/O performed (mode=${config.mode})`,
  };
}

// ---------------------------------------------------------------------------
// MockDealerMineAdapter — customers:import + service_history:import
// ---------------------------------------------------------------------------

/** All fixture data below is fake/reserved — no real customer PII. */
const DEALERMINE_CUSTOMER_FIXTURES: Omit<Customer, 'tenantId'>[] = [
  {
    customerId: 'cust_fixture_dm_001',
    dealerId: 'dealer_bw_fixture_01',
    firstName: 'Avery',
    lastName: 'Fixture',
    contactMethods: [
      { kind: 'email', value: 'avery.fixture@example.invalid', verified: false, preferred: true, doNotContact: false },
    ],
    consents: [
      {
        channel: 'email',
        status: 'implied',
        basis: 'implied_ebr',
        capturedAt: '2026-01-15T18:00:00Z',
        expiresAt: '2027-01-15T18:00:00Z',
        source: 'dealermine_import',
      },
    ],
    tags: ['imported:dealermine_mock'],
    segment: 'sold_customer',
    ownedVehicles: [
      {
        vin: '2T1BURHE5JC000001',
        year: 2018,
        make: 'Toyota',
        model: 'Corolla',
        trim: 'LE',
        estimatedMileage: 88500,
        mileageAsOf: '2026-05-01T00:00:00Z',
        acquisition: 'financed_here',
        finance: {
          kind: 'loan',
          startDate: '2022-06-01T00:00:00Z',
          termMonths: 72,
          estimatedPayment: { amountCents: 38900, currency: 'CAD' },
        },
        lastServiceAt: '2026-04-18T17:30:00Z',
      },
    ],
    createdAt: '2022-06-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    privacy: {},
  },
  {
    customerId: 'cust_fixture_dm_002',
    dealerId: 'dealer_bw_fixture_01',
    firstName: 'Jordan',
    lastName: 'Placeholder',
    contactMethods: [
      { kind: 'mobile', value: '+1-604-555-0100', verified: false, preferred: true, doNotContact: false },
    ],
    consents: [
      { channel: 'sms', status: 'unknown', basis: 'none', source: 'dealermine_import' },
    ],
    tags: ['imported:dealermine_mock'],
    segment: 'service_only',
    ownedVehicles: [
      {
        vin: '1FTEW1EP5KF000002',
        year: 2019,
        make: 'Ford',
        model: 'F-150',
        trim: 'XLT',
        estimatedMileage: 112000,
        mileageAsOf: '2026-06-10T00:00:00Z',
        acquisition: 'external',
        lastServiceAt: '2026-06-10T16:00:00Z',
      },
    ],
    createdAt: '2024-02-20T00:00:00Z',
    updatedAt: '2026-06-10T16:00:00Z',
    privacy: {},
  },
];

const DEALERMINE_SERVICE_HISTORY_FIXTURES: ServiceHistoryRecord[] = [
  {
    externalRef: 'dm_ro_90001',
    customerExternalRef: 'cust_fixture_dm_001',
    vin: '2T1BURHE5JC000001',
    serviceAt: '2026-04-18T17:30:00Z',
    odometerKm: 88100,
    lineItems: [
      { opCode: 'LOF', description: 'Lube, oil, filter', declined: false },
      { opCode: 'BRK-INSP', description: 'Brake inspection — rear pads at 4mm', declined: true },
    ],
  },
  {
    externalRef: 'dm_ro_90002',
    customerExternalRef: 'cust_fixture_dm_002',
    vin: '1FTEW1EP5KF000002',
    serviceAt: '2026-06-10T16:00:00Z',
    odometerKm: 111850,
    lineItems: [
      { opCode: 'TIRE-ROT', description: 'Tire rotation', declined: false },
    ],
  },
];

export class MockDealerMineAdapter implements ConnectorAdapter {
  readonly provider: ConnectorProvider = 'dealermine';
  readonly capabilities: ConnectorCapability[] = ['customers:import', 'service_history:import'];

  healthCheck(config: TenantConnectorConfig): HealthResult {
    return mockHealth(config, 'MockDealerMineAdapter');
  }

  importCustomers(config: TenantConnectorConfig, input: ImportCustomersInput): ImportCustomersResult {
    const limit = input.limit ?? DEALERMINE_CUSTOMER_FIXTURES.length;
    const records: Customer[] = DEALERMINE_CUSTOMER_FIXTURES
      .slice(0, limit)
      .map((fixture) => ({ ...fixture, tenantId: config.tenantId }));
    return { mode: config.mode, liveCallMade: false, records, sourceProvider: this.provider };
  }

  importServiceHistory(config: TenantConnectorConfig, input: ImportServiceHistoryInput): ImportServiceHistoryResult {
    const records = DEALERMINE_SERVICE_HISTORY_FIXTURES.filter((rec) => {
      if (input.customerExternalRef && rec.customerExternalRef !== input.customerExternalRef) return false;
      if (input.since && rec.serviceAt < input.since) return false;
      return true;
    });
    return { mode: config.mode, liveCallMade: false, records };
  }
}

// ---------------------------------------------------------------------------
// MockTmsTrafficAdapter — traffic:import
// ---------------------------------------------------------------------------

const TMS_TRAFFIC_FIXTURES: Omit<TrafficEvent, 'tenantId'>[] = [
  {
    trafficEventId: 'traffic_fixture_tms_001',
    dealerId: 'dealer_bw_fixture_01',
    rooftopId: 'rooftop_bw_fixture_01',
    occurredAt: '2026-07-01T16:05:00Z',
    source: 'phone',
    sourceDetail: 'tms_canada_mock',
    sla: { firstResponseDueAt: '2026-07-01T16:20:00Z', firstRespondedAt: '2026-07-01T16:12:00Z', breached: false },
    outcome: { state: 'appointment_set', recordedAt: '2026-07-01T16:30:00Z' },
  },
  {
    trafficEventId: 'traffic_fixture_tms_002',
    dealerId: 'dealer_bw_fixture_01',
    rooftopId: 'rooftop_bw_fixture_01',
    occurredAt: '2026-07-02T02:40:00Z',
    source: 'after_hours',
    sourceDetail: 'tms_canada_mock',
    sla: { firstResponseDueAt: '2026-07-02T16:05:00Z', breached: false },
  },
  {
    trafficEventId: 'traffic_fixture_tms_003',
    dealerId: 'dealer_bw_fixture_01',
    rooftopId: 'rooftop_bw_fixture_01',
    occurredAt: '2026-06-28T19:15:00Z',
    source: 'walk_in',
    sourceDetail: 'tms_canada_mock',
    sla: { firstResponseDueAt: '2026-06-28T19:15:00Z', firstRespondedAt: '2026-06-28T19:15:00Z', breached: false },
    outcome: { state: 'lost', lostReason: 'not_ready', recordedAt: '2026-06-28T20:00:00Z' },
  },
];

export class MockTmsTrafficAdapter implements ConnectorAdapter {
  readonly provider: ConnectorProvider = 'tms_canada';
  readonly capabilities: ConnectorCapability[] = ['traffic:import'];

  healthCheck(config: TenantConnectorConfig): HealthResult {
    return mockHealth(config, 'MockTmsTrafficAdapter');
  }

  importTraffic(config: TenantConnectorConfig, input: ImportTrafficInput): ImportTrafficResult {
    const records: TrafficEvent[] = TMS_TRAFFIC_FIXTURES
      .filter((fixture) => !input.since || fixture.occurredAt >= input.since)
      .map((fixture) => ({ ...fixture, tenantId: config.tenantId }));
    return { mode: config.mode, liveCallMade: false, records };
  }
}

// ---------------------------------------------------------------------------
// MockInventoryCsvFeedAdapter — inventory:import with a tiny CSV parser
// ---------------------------------------------------------------------------

/** Inline fixture feed; the quoted `features` cells contain commas on purpose. */
export const INVENTORY_CSV_FIXTURE = [
  'vin,stockNumber,year,make,model,trim,mileageKm,priceCad,features',
  '2T1BURHE5JC000101,BW-1001,2018,Toyota,Corolla,LE,88500,15990.00,"heated seats, backup camera"',
  '1FTEW1EP5KF000102,BW-1002,2019,Ford,F-150,XLT,112000,32500.00,"tow package, 4x4, ""box liner"""',
  '3VWFE21C04M000103,BW-1003,2004,Volkswagen,Jetta,,198000,4995.00,cloth seats',
].join('\n');

/**
 * Minimal RFC-4180-ish line parser: handles quoted cells containing commas
 * and doubled quotes (""). Deterministic, no dependencies.
 */
export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

export class MockInventoryCsvFeedAdapter implements ConnectorAdapter {
  readonly provider: ConnectorProvider = 'inventory_feed_csv';
  readonly capabilities: ConnectorCapability[] = ['inventory:import'];

  healthCheck(config: TenantConnectorConfig): HealthResult {
    return mockHealth(config, 'MockInventoryCsvFeedAdapter');
  }

  importInventory(config: TenantConnectorConfig, input: ImportInventoryInput): ImportInventoryResult {
    const raw = input.rawFeedOverride ?? INVENTORY_CSV_FIXTURE;
    const lines = raw.split('\n').filter((line) => line.trim().length > 0);
    const warnings: string[] = [];
    if (lines.length === 0) {
      return { mode: config.mode, liveCallMade: false, records: [], warnings: ['empty feed'] };
    }
    const header = parseCsvLine(lines[0]);
    const records: Partial<Vehicle>[] = [];
    for (let rowIdx = 1; rowIdx < lines.length; rowIdx++) {
      const cells = parseCsvLine(lines[rowIdx]);
      if (cells.length !== header.length) {
        warnings.push(`row ${rowIdx}: expected ${header.length} cells, got ${cells.length} — skipped`);
        continue;
      }
      const cell = (name: string): string => {
        const idx = header.indexOf(name);
        return idx >= 0 ? cells[idx].trim() : '';
      };
      const record: Partial<Vehicle> = {
        tenantId: config.tenantId,
        vin: cell('vin'),
        stockNumber: cell('stockNumber'),
        year: Number(cell('year')),
        make: cell('make'),
        model: cell('model'),
        trim: cell('trim') === '' ? undefined : cell('trim'),
        mileageKm: Number(cell('mileageKm')),
        askingPrice: {
          amountCents: Math.round(Number(cell('priceCad')) * 100),
          currency: 'CAD',
        },
        features: cell('features') === ''
          ? []
          : cell('features').split(',').map((f) => f.trim()).filter((f) => f.length > 0),
        status: 'incoming',
      };
      records.push(record);
    }
    return { mode: config.mode, liveCallMade: false, records, warnings };
  }
}

// ---------------------------------------------------------------------------
// MockSmsAdapter — message:send (queues drafts, NEVER sends)
// ---------------------------------------------------------------------------

export interface SmsOutboxEntry {
  toContactRefRedacted: string;
  body: string;
  approvalReceiptId: ReceiptId;
  requiresHumanApproval: true;
  queuedAt: IsoTimestamp;
  status: 'queued_draft_never_sent';
}

export class MockSmsAdapter implements ConnectorAdapter {
  readonly provider: ConnectorProvider = 'twilio_sms';
  readonly capabilities: ConnectorCapability[] = ['message:send'];
  /** Drafts land here and stop here — nothing is ever transmitted. */
  readonly outbox: SmsOutboxEntry[] = [];

  healthCheck(config: TenantConnectorConfig): HealthResult {
    return mockHealth(config, 'MockSmsAdapter');
  }

  sendMessage(config: TenantConnectorConfig, input: SendMessageInput): SendMessageResult {
    if (!input.approvalReceiptId) {
      throw new Error(
        'MockSmsAdapter.sendMessage: approvalReceiptId (human_approval_granted proof receipt) is required before an outbound draft may even be queued',
      );
    }
    this.outbox.push({
      toContactRefRedacted: input.toContactRefRedacted,
      body: input.body,
      approvalReceiptId: input.approvalReceiptId,
      requiresHumanApproval: true,
      queuedAt: input.asOf,
      status: 'queued_draft_never_sent',
    });
    return {
      mode: config.mode,
      liveCallMade: false,
      queued: true,
      outboxSize: this.outbox.length,
      disposition: 'queued_draft_never_sent',
    };
  }
}

// ---------------------------------------------------------------------------
// MockCalendarAdapter — calendar:write (drafts only, never confirms/writes)
// ---------------------------------------------------------------------------

export class MockCalendarAdapter implements ConnectorAdapter {
  readonly provider: ConnectorProvider = 'google_calendar';
  readonly capabilities: ConnectorCapability[] = ['calendar:write'];

  healthCheck(config: TenantConnectorConfig): HealthResult {
    return mockHealth(config, 'MockCalendarAdapter');
  }

  writeCalendarDraft(config: TenantConnectorConfig, input: CalendarWriteInput): CalendarWriteResult {
    return {
      mode: config.mode,
      liveCallMade: false,
      draft: {
        title: input.title,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        status: 'draft',
        requiresHumanApproval: true,
        createdAt: input.asOf,
      },
      disposition: 'draft_only_not_written',
    };
  }
}
