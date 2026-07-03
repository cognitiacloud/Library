/**
 * BUDGET WHEELS DEALEROS — equity-mining/fixtures (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Deterministic fixtures for the Module 7 opportunity scoring engine.
 * ALL DATA IS FAKE: obviously-fake names ('Test Buyer'), fake VINs
 * ('VINFAKE...'), fixture IDs, and a frozen AS_OF timestamp so every
 * date-math path is reproducible. No real customer PII anywhere.
 */

import type {
  ConsentRecord,
  Customer,
  CustomerId,
  DealerId,
  HouseholdId,
  IsoTimestamp,
  OwnedVehicle,
  RooftopId,
  TenantId,
  Vehicle,
  VehicleId,
  VehicleStatus,
} from '../schemas/core';
import type { ScoringInputs } from './scoring';

export const AS_OF: IsoTimestamp = '2026-07-03T18:00:00Z';

export const TENANT_ID = 'tenant_test_bw' as TenantId;
export const DEALER_ID = 'dealer_test_bw' as DealerId;
export const ROOFTOP_ID = 'rooftop_test_main' as RooftopId;

// ---------------------------------------------------------------------------
// Builders (fill required core fields with deterministic fixture defaults)
// ---------------------------------------------------------------------------

export interface VehicleFixtureSpec {
  vehicleId: string;
  vin: string;
  stockNumber: string;
  year: number;
  make: string;
  model: string;
  bodyStyle?: Vehicle['bodyStyle'];
  mileageKm: number;
  askingPriceCents: number;
  status?: VehicleStatus;
}

export function makeVehicle(spec: VehicleFixtureSpec): Vehicle {
  return {
    vehicleId: spec.vehicleId as VehicleId,
    tenantId: TENANT_ID,
    dealerId: DEALER_ID,
    rooftopId: ROOFTOP_ID,
    vin: spec.vin,
    stockNumber: spec.stockNumber,
    year: spec.year,
    make: spec.make,
    model: spec.model,
    ...(spec.bodyStyle !== undefined ? { bodyStyle: spec.bodyStyle } : {}),
    mileageKm: spec.mileageKm,
    askingPrice: { amountCents: spec.askingPriceCents, currency: 'CAD' },
    status: spec.status ?? 'available',
    statusChangedAt: '2026-06-01T00:00:00Z',
    photos: [],
    features: [],
    disclosures: [],
    externalRefs: [],
    merchandising: { daysInInventory: 32, listingCompletenessScore: 80, merchandisingScore: 75 },
  };
}

export interface CustomerFixtureSpec {
  customerId: string;
  firstName: string;
  lastName: string;
  segment: Customer['segment'];
  consents: ConsentRecord[];
  ownedVehicles: OwnedVehicle[];
  householdId?: string;
  tags?: string[];
}

export function makeCustomer(spec: CustomerFixtureSpec): Customer {
  return {
    customerId: spec.customerId as CustomerId,
    tenantId: TENANT_ID,
    dealerId: DEALER_ID,
    ...(spec.householdId !== undefined ? { householdId: spec.householdId as HouseholdId } : {}),
    firstName: spec.firstName,
    lastName: spec.lastName,
    contactMethods: [],
    consents: spec.consents,
    tags: spec.tags ?? [],
    segment: spec.segment,
    ownedVehicles: spec.ownedVehicles,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    privacy: {},
  };
}

function consent(
  channel: ConsentRecord['channel'],
  status: ConsentRecord['status'],
  basis: ConsentRecord['basis'],
  expiresAt?: IsoTimestamp,
): ConsentRecord {
  return { channel, status, basis, ...(expiresAt !== undefined ? { expiresAt } : {}) };
}

// ---------------------------------------------------------------------------
// Fixture inventory (all fake VINs / fixture prices)
// ---------------------------------------------------------------------------

export const FIXTURE_INVENTORY: Vehicle[] = [
  makeVehicle({
    vehicleId: 'veh_test_crv21', vin: 'VINFAKE0000000CRV1', stockNumber: 'T-1001',
    year: 2021, make: 'Honda', model: 'CR-V', bodyStyle: 'suv',
    mileageKm: 62_000, askingPriceCents: 2_690_000,
  }),
  makeVehicle({
    vehicleId: 'veh_test_cx5_19', vin: 'VINFAKE0000000CX51', stockNumber: 'T-1002',
    year: 2019, make: 'Mazda', model: 'CX-5', bodyStyle: 'suv',
    mileageKm: 98_000, askingPriceCents: 1_990_000,
  }),
  makeVehicle({
    vehicleId: 'veh_test_rav4_24', vin: 'VINFAKE0000000RAV1', stockNumber: 'T-1003',
    year: 2024, make: 'Toyota', model: 'RAV4', bodyStyle: 'suv',
    mileageKm: 21_000, askingPriceCents: 3_350_000,
  }),
  makeVehicle({
    vehicleId: 'veh_test_corolla_22', vin: 'VINFAKE0000000COR1', stockNumber: 'T-1004',
    year: 2022, make: 'Toyota', model: 'Corolla', bodyStyle: 'sedan',
    mileageKm: 45_000, askingPriceCents: 2_190_000,
  }),
  makeVehicle({
    vehicleId: 'veh_test_f150_20', vin: 'VINFAKE0000000F151', stockNumber: 'T-1005',
    year: 2020, make: 'Ford', model: 'F-150', bodyStyle: 'truck',
    mileageKm: 88_000, askingPriceCents: 3_490_000,
  }),
  // Sold unit: must be excluded by matchInventory's status filter even though
  // it would match on make/body style.
  makeVehicle({
    vehicleId: 'veh_test_civic_sold', vin: 'VINFAKE0000000CIV1', stockNumber: 'T-1006',
    year: 2021, make: 'Honda', model: 'Civic', bodyStyle: 'sedan',
    mileageKm: 51_000, askingPriceCents: 2_250_000, status: 'sold',
  }),
];

// ---------------------------------------------------------------------------
// Scoring fixtures — four distinct paths + one saturation case
// ---------------------------------------------------------------------------

export interface EquityFixture {
  name: string;
  expectedBand: 'hot' | 'warm' | 'watch';
  idSeed: string;
  inputs: ScoringInputs;
}

/** (a) Financed here, 52 of 60 months elapsed, positive equity proxy, matching inventory → HOT. */
export const FIXTURE_A_FINANCE_MATURE: EquityFixture = (() => {
  const owned: OwnedVehicle = {
    vin: 'VINFAKEOWNED0000A1',
    year: 2019,
    make: 'Honda',
    model: 'CR-V',
    estimatedMileage: 118_000,
    mileageAsOf: '2026-06-01T00:00:00Z',
    acquisition: 'financed_here',
    finance: {
      kind: 'loan',
      startDate: '2022-03-01T00:00:00Z', // ~52.1 of 60 months elapsed at AS_OF
      termMonths: 60,
      estimatedPayment: { amountCents: 38_500, currency: 'CAD' },
      estimatedPayoff: { amountCents: 420_000, currency: 'CAD' },
    },
    lastServiceAt: '2026-06-10T00:00:00Z',
  };
  return {
    name: 'fixture_a_finance_mature',
    expectedBand: 'hot',
    idSeed: 'cust_test_a:VINFAKEOWNED0000A1:2026-07-03',
    inputs: {
      customer: makeCustomer({
        customerId: 'cust_test_a',
        firstName: 'Test',
        lastName: 'Buyer',
        segment: 'sold_customer',
        householdId: 'hh_test_a',
        consents: [
          consent('sms', 'granted', 'express'),
          consent('email', 'granted', 'express'),
        ],
        ownedVehicles: [owned],
      }),
      ownedVehicle: owned,
      inventory: FIXTURE_INVENTORY,
      asOf: AS_OF,
      engagement: { lastInboundAt: '2026-06-20T00:00:00Z' },
    },
  };
})();

/** (b) Bought 6 months ago, engaged but nothing else — too early → WATCH. */
export const FIXTURE_B_RECENT_BUYER: EquityFixture = (() => {
  const owned: OwnedVehicle = {
    vin: 'VINFAKEOWNED0000B1',
    year: 2024,
    make: 'Hyundai',
    model: 'Tucson',
    estimatedMileage: 14_000,
    mileageAsOf: '2026-06-01T00:00:00Z',
    acquisition: 'financed_here',
    finance: {
      kind: 'loan',
      startDate: '2026-01-05T00:00:00Z', // ~6 of 72 months elapsed at AS_OF
      termMonths: 72,
      estimatedPayment: { amountCents: 41_000, currency: 'CAD' },
      estimatedPayoff: { amountCents: 2_750_000, currency: 'CAD' },
    },
  };
  return {
    name: 'fixture_b_recent_buyer',
    expectedBand: 'watch',
    idSeed: 'cust_test_b:VINFAKEOWNED0000B1:2026-07-03',
    inputs: {
      customer: makeCustomer({
        customerId: 'cust_test_b',
        firstName: 'Test',
        lastName: 'Recent',
        segment: 'sold_customer',
        consents: [
          consent('sms', 'granted', 'express'),
          consent('email', 'implied', 'implied_ebr', '2027-01-05T00:00:00Z'),
        ],
        ownedVehicles: [owned],
      }),
      ownedVehicle: owned,
      inventory: FIXTURE_INVENTORY,
      asOf: AS_OF,
      engagement: { lastInboundAt: '2026-06-25T00:00:00Z', websiteVdpViewsLast30d: 2 },
    },
  };
})();

/**
 * (c) Service-only customer, 9-year-old vehicle, recent service visit → WARM.
 * SMS consent revoked, email granted → warm NBA must fall back to email_draft.
 */
export const FIXTURE_C_SERVICE_ONLY: EquityFixture = (() => {
  const owned: OwnedVehicle = {
    vin: 'VINFAKEOWNED0000C1',
    year: 2017,
    make: 'Honda',
    model: 'CR-V',
    estimatedMileage: 160_000,
    mileageAsOf: '2026-06-01T00:00:00Z',
    acquisition: 'external',
    lastServiceAt: '2026-06-15T00:00:00Z',
  };
  return {
    name: 'fixture_c_service_only',
    expectedBand: 'warm',
    idSeed: 'cust_test_c:VINFAKEOWNED0000C1:2026-07-03',
    inputs: {
      customer: makeCustomer({
        customerId: 'cust_test_c',
        firstName: 'Test',
        lastName: 'Loyal',
        segment: 'service_only',
        consents: [
          consent('sms', 'revoked', 'none'),
          consent('email', 'granted', 'express'),
        ],
        ownedVehicles: [owned],
      }),
      ownedVehicle: owned,
      inventory: FIXTURE_INVENTORY,
      asOf: AS_OF,
    },
  };
})();

/**
 * (d) Orphan owner, lease maturing in ~3 months, NO usable sms/email consent
 * → HOT, and the next best action must be a call_task (never sms_draft).
 */
export const FIXTURE_D_ORPHAN_LEASE: EquityFixture = (() => {
  const owned: OwnedVehicle = {
    vin: 'VINFAKEOWNED0000D1',
    year: 2023,
    make: 'Toyota',
    model: 'RAV4',
    estimatedMileage: 86_000, // above-pace for a 2023 → high_mileage_vs_term fires
    mileageAsOf: '2026-06-01T00:00:00Z',
    acquisition: 'leased_here',
    finance: {
      kind: 'lease',
      startDate: '2022-10-01T00:00:00Z',
      termMonths: 48,
      estimatedPayment: { amountCents: 52_000, currency: 'CAD' },
      maturityDate: '2026-10-01T00:00:00Z', // ~2.9 months after AS_OF
    },
    warrantyEndDate: '2026-09-15T00:00:00Z',
    lastServiceAt: '2026-06-05T00:00:00Z',
  };
  return {
    name: 'fixture_d_orphan_lease',
    expectedBand: 'hot',
    idSeed: 'cust_test_d:VINFAKEOWNED0000D1:2026-07-03',
    inputs: {
      customer: makeCustomer({
        customerId: 'cust_test_d',
        firstName: 'Test',
        lastName: 'Orphan',
        segment: 'orphan_owner',
        consents: [
          consent('sms', 'unknown', 'none'),
          consent('email', 'unknown', 'none'),
        ],
        ownedVehicles: [owned],
      }),
      ownedVehicle: owned,
      inventory: FIXTURE_INVENTORY,
      asOf: AS_OF,
    },
  };
})();

/**
 * (e) Saturation case: fires nearly every factor so the raw weighted sum
 * exceeds 100 points — exercises the clamp (score must equal exactly 100).
 */
export const FIXTURE_E_KITCHEN_SINK: EquityFixture = (() => {
  const owned: OwnedVehicle = {
    vin: 'VINFAKEOWNED0000E1',
    year: 2018,
    make: 'Honda',
    model: 'CR-V',
    estimatedMileage: 200_000,
    mileageAsOf: '2026-06-01T00:00:00Z',
    acquisition: 'leased_here',
    finance: {
      kind: 'lease',
      startDate: '2022-08-01T00:00:00Z',
      termMonths: 48,
      estimatedPayment: { amountCents: 60_000, currency: 'CAD' },
      estimatedPayoff: { amountCents: 300_000, currency: 'CAD' },
      maturityDate: '2026-08-01T00:00:00Z',
    },
    warrantyEndDate: '2026-08-01T00:00:00Z',
    lastServiceAt: '2026-06-28T00:00:00Z',
  };
  return {
    name: 'fixture_e_kitchen_sink',
    expectedBand: 'hot',
    idSeed: 'cust_test_e:VINFAKEOWNED0000E1:2026-07-03',
    inputs: {
      customer: makeCustomer({
        customerId: 'cust_test_e',
        firstName: 'Test',
        lastName: 'Everything',
        segment: 'orphan_owner',
        householdId: 'hh_test_e',
        tags: ['prefers:suv'],
        consents: [consent('sms', 'granted', 'express')],
        ownedVehicles: [owned],
      }),
      ownedVehicle: owned,
      inventory: FIXTURE_INVENTORY,
      asOf: AS_OF,
      engagement: { lastInboundAt: '2026-07-01T00:00:00Z', websiteVdpViewsLast30d: 12 },
    },
  };
})();

export const ALL_FIXTURES: EquityFixture[] = [
  FIXTURE_A_FINANCE_MATURE,
  FIXTURE_B_RECENT_BUYER,
  FIXTURE_C_SERVICE_ONLY,
  FIXTURE_D_ORPHAN_LEASE,
  FIXTURE_E_KITCHEN_SINK,
];
