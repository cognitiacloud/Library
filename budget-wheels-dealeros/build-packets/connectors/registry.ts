/**
 * BUDGET WHEELS DEALEROS — connectors/registry (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Module 12 — Connector registry. Tenant-scoped connector configuration with
 * mock-by-default modes, env-var-NAME-only secret references, least-privilege
 * scopes, live mode gated on a human-approval proof receipt, and health checks
 * that never touch live APIs unless explicitly allowed by policy.
 */

import type {
  ConnectorId,
  Customer,
  IsoTimestamp,
  Lead,
  ReceiptId,
  TenantId,
  TrafficEvent,
  Vehicle,
  VehicleId,
} from '../schemas/core';

// ---------------------------------------------------------------------------
// Providers, modes, capabilities
// ---------------------------------------------------------------------------

export type ConnectorProvider =
  // CRM / DMS
  | 'dealermine'
  | 'tms_canada'
  | 'cdk'
  | 'reynolds'
  | 'dealersocket'
  | 'vinsolutions'
  | 'dealertrack'
  | 'quorum'
  | 'dealercenter'
  | 'autosync'
  // Inventory feeds
  | 'inventory_feed_csv'
  | 'inventory_feed_xml'
  | 'inventory_feed_json'
  // Listing / presence surfaces (where allowed)
  | 'autotrader_listing'
  | 'facebook_marketplace'
  | 'kijiji_autos'
  | 'google_business_profile'
  // Comms
  | 'twilio_sms'
  | 'voice_agent'
  | 'gmail'
  | 'outlook'
  | 'google_calendar'
  | 'microsoft_calendar'
  // Money (later)
  | 'stripe'
  | 'quickbooks'
  // Model providers / orchestration
  | 'openai'
  | 'anthropic'
  | 'openrouter'
  | 'ollama'
  | 'n8n'
  | 'mcp_gateway';

export type ConnectorMode = 'mock' | 'sandbox' | 'live';

export type ConnectorCapability =
  | 'customers:import'
  | 'service_history:import'
  | 'traffic:import'
  | 'inventory:import'
  | 'inventory:export'
  | 'lead:export'
  | 'message:send'
  | 'calendar:write'
  | 'listing:post';

// ---------------------------------------------------------------------------
// Tenant-scoped connector configuration
// ---------------------------------------------------------------------------

export interface TenantConnectorConfig {
  connectorId: ConnectorId;
  tenantId: TenantId;
  provider: ConnectorProvider;
  mode: ConnectorMode;
  displayName: string;
  /** Env var NAMES only (e.g. "DEALERMINE_API_KEY") — never secret values. */
  secretEnvVarNames: string[];
  /** Least-privilege permission scopes, e.g. "customers:read". */
  scopes: string[];
  enabled: boolean;
  /** REQUIRED when mode === 'live': human_approval_granted proof receipt. */
  liveApprovalReceiptId?: ReceiptId;
  healthCheckPolicy: 'never_live' | 'live_if_enabled';
}

/** configure() input: mode may be omitted and defaults to 'mock'. */
export type TenantConnectorConfigInput =
  Omit<TenantConnectorConfig, 'mode'> & { mode?: ConnectorMode };

// ---------------------------------------------------------------------------
// Raw-secret guard — env var NAMES are fine, secret-looking VALUES are not
// ---------------------------------------------------------------------------

const RAW_SECRET_PATTERN = /(sk-|xoxb-|AKIA|-----BEGIN|bearer\s)/i;

/**
 * Throws if a string looks like a real secret value instead of an env var
 * name. Deliberately simple: known secret prefixes + "long token with no
 * spaces" as a cheap entropy hint. Applied to every secretEnvVarNames entry
 * and to displayName on registration/configuration.
 */
export function assertNoRawSecret(value: string): void {
  if (RAW_SECRET_PATTERN.test(value)) {
    throw new Error(
      `assertNoRawSecret: value matches a known secret pattern; store env var NAMES only (got a value starting "${value.slice(0, 8)}…")`,
    );
  }
  if (value.length > 60 && !/\s/.test(value)) {
    throw new Error(
      'assertNoRawSecret: value is >60 chars with no spaces — looks like a raw token, not an env var name',
    );
  }
}

// ---------------------------------------------------------------------------
// Adapter call inputs/results — every result declares mode + liveCallMade
// ---------------------------------------------------------------------------

export interface HealthResult {
  ok: boolean;
  mode: ConnectorMode;
  liveCallMade: boolean;
  detail: string;
}

/** Common envelope every capability result extends. */
export interface AdapterCallMeta {
  mode: ConnectorMode;
  liveCallMade: boolean;
}

export interface ImportCustomersInput {
  updatedSince?: IsoTimestamp;
  limit?: number;
}
export interface ImportCustomersResult extends AdapterCallMeta {
  records: Customer[];
  sourceProvider: ConnectorProvider;
}

/**
 * SCHEMA_NOTE: core.ts (Module 8) has no service-history record type yet;
 * defined locally here. Candidate for promotion to schemas/core.ts as
 * `ServiceHistoryRecord` when the service-crm packet lands.
 */
export interface ServiceHistoryRecord {
  externalRef: string;          // source-system RO / appointment id
  customerExternalRef: string;  // source-system customer key (no PII beyond ref)
  vin?: string;
  serviceAt: IsoTimestamp;
  odometerKm?: number;
  lineItems: { opCode: string; description: string; declined: boolean }[];
}
export interface ImportServiceHistoryInput {
  customerExternalRef?: string;
  since?: IsoTimestamp;
}
export interface ImportServiceHistoryResult extends AdapterCallMeta {
  records: ServiceHistoryRecord[];
}

export interface ImportTrafficInput {
  since?: IsoTimestamp;
}
export interface ImportTrafficResult extends AdapterCallMeta {
  records: TrafficEvent[];
}

export interface ImportInventoryInput {
  /** Override the adapter's inline fixture feed (still parsed locally, no I/O). */
  rawFeedOverride?: string;
}
export interface ImportInventoryResult extends AdapterCallMeta {
  records: Partial<Vehicle>[];
  warnings: string[];
}

export interface ExportInventoryInput {
  vehicles: Partial<Vehicle>[];
  requiresHumanApproval: true;
  approvalReceiptId?: ReceiptId;
}
export interface ExportInventoryResult extends AdapterCallMeta {
  accepted: number;
  disposition: string;
}

export interface ExportLeadInput {
  lead: Partial<Lead>;
  requiresHumanApproval: true;
  approvalReceiptId?: ReceiptId;
}
export interface ExportLeadResult extends AdapterCallMeta {
  queued: boolean;
  disposition: string;
}

export interface SendMessageInput {
  channel: 'sms' | 'email';
  /** Redacted contact reference — never a raw phone/email in fixtures. */
  toContactRefRedacted: string;
  body: string;
  /** All outbound drafts are human-approval-gated in V1. */
  requiresHumanApproval: true;
  /** human_approval_granted proof receipt — mocks REQUIRE it before queueing. */
  approvalReceiptId?: ReceiptId;
  /** Caller-supplied clock; no Date.now() inside adapter logic. */
  asOf: IsoTimestamp;
}
export interface SendMessageResult extends AdapterCallMeta {
  queued: boolean;
  outboxSize: number;
  disposition: 'queued_draft_never_sent';
}

export interface CalendarWriteInput {
  title: string;
  startsAt: IsoTimestamp;
  endsAt: IsoTimestamp;
  attendeeRefRedacted?: string;
  requiresHumanApproval: true;
  approvalReceiptId?: ReceiptId;
  asOf: IsoTimestamp;
}
export interface CalendarWriteResult extends AdapterCallMeta {
  draft: {
    title: string;
    startsAt: IsoTimestamp;
    endsAt: IsoTimestamp;
    status: 'draft';
    requiresHumanApproval: true;
    createdAt: IsoTimestamp;
  };
  disposition: 'draft_only_not_written';
}

export interface PostListingInput {
  vehicleId?: VehicleId;
  title: string;
  body: string;
  requiresHumanApproval: true;
  approvalReceiptId?: ReceiptId;
}
export interface PostListingResult extends AdapterCallMeta {
  queued: boolean;
  disposition: string;
}

// ---------------------------------------------------------------------------
// Adapter interface
// ---------------------------------------------------------------------------

export interface ConnectorAdapter {
  readonly provider: ConnectorProvider;
  readonly capabilities: ConnectorCapability[];
  healthCheck(config: TenantConnectorConfig): HealthResult;
  // Optional capability methods — presence should match `capabilities`.
  importCustomers?(config: TenantConnectorConfig, input: ImportCustomersInput): ImportCustomersResult;
  importServiceHistory?(config: TenantConnectorConfig, input: ImportServiceHistoryInput): ImportServiceHistoryResult;
  importTraffic?(config: TenantConnectorConfig, input: ImportTrafficInput): ImportTrafficResult;
  importInventory?(config: TenantConnectorConfig, input: ImportInventoryInput): ImportInventoryResult;
  exportInventory?(config: TenantConnectorConfig, input: ExportInventoryInput): ExportInventoryResult;
  exportLead?(config: TenantConnectorConfig, input: ExportLeadInput): ExportLeadResult;
  sendMessage?(config: TenantConnectorConfig, input: SendMessageInput): SendMessageResult;
  writeCalendarDraft?(config: TenantConnectorConfig, input: CalendarWriteInput): CalendarWriteResult;
  postListing?(config: TenantConnectorConfig, input: PostListingInput): PostListingResult;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export interface ConnectorHealthReport {
  connectorId: ConnectorId;
  tenantId: TenantId;
  provider: ConnectorProvider;
  result: HealthResult;
}

const SCOPE_PATTERN = /^[a-z0-9_]+:[a-z0-9_]+$/;

export class ConnectorRegistry {
  private readonly adapters = new Map<ConnectorProvider, ConnectorAdapter>();
  private readonly configs = new Map<string, TenantConnectorConfig>();

  register(adapter: ConnectorAdapter): void {
    if (this.adapters.has(adapter.provider)) {
      throw new Error(`ConnectorRegistry.register: adapter already registered for provider "${adapter.provider}"`);
    }
    this.adapters.set(adapter.provider, adapter);
  }

  /**
   * Validates and stores a tenant connector config.
   * - mode defaults to 'mock' (mock-by-default hard rule)
   * - 'live' REQUIRES a human-approval proof receipt id
   * - every secretEnvVarNames entry and displayName passes assertNoRawSecret
   * - scopes must be least-privilege "resource:action" strings
   */
  configure(input: TenantConnectorConfigInput): TenantConnectorConfig {
    const mode: ConnectorMode = input.mode ?? 'mock';
    if (mode === 'live' && !input.liveApprovalReceiptId) {
      throw new Error(
        `ConnectorRegistry.configure: mode 'live' for "${input.provider}" requires liveApprovalReceiptId (human approval proof receipt)`,
      );
    }
    assertNoRawSecret(input.displayName);
    for (const envVarName of input.secretEnvVarNames) {
      assertNoRawSecret(envVarName);
    }
    for (const scope of input.scopes) {
      if (!SCOPE_PATTERN.test(scope)) {
        throw new Error(
          `ConnectorRegistry.configure: scope "${scope}" is not a least-privilege "resource:action" scope`,
        );
      }
    }
    const config: TenantConnectorConfig = Object.freeze({ ...input, mode });
    this.configs.set(String(config.connectorId), config);
    return config;
  }

  get(provider: ConnectorProvider): ConnectorAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`ConnectorRegistry.get: no adapter registered for provider "${provider}"`);
    }
    return adapter;
  }

  listConfigs(): TenantConnectorConfig[] {
    return [...this.configs.values()];
  }

  /**
   * Health-checks every configured connector. NEVER performs live calls when
   * healthCheckPolicy === 'never_live': the config handed to the adapter is
   * downgraded to mock mode, and any adapter that still reports a live call
   * is treated as a policy violation. 'live_if_enabled' only permits live
   * mode when the connector is enabled (and even then, mock adapters always
   * report liveCallMade: false).
   */
  healthCheckAll(): ConnectorHealthReport[] {
    const reports: ConnectorHealthReport[] = [];
    for (const config of this.configs.values()) {
      const adapter = this.adapters.get(config.provider);
      if (!adapter) {
        reports.push({
          connectorId: config.connectorId,
          tenantId: config.tenantId,
          provider: config.provider,
          result: { ok: false, mode: config.mode, liveCallMade: false, detail: 'no adapter registered for provider' },
        });
        continue;
      }
      let effective = config;
      if (config.mode === 'live') {
        const liveAllowed = config.healthCheckPolicy === 'live_if_enabled' && config.enabled;
        if (!liveAllowed) {
          effective = { ...config, mode: 'mock' };
        }
      }
      const result = adapter.healthCheck(effective);
      if (config.healthCheckPolicy === 'never_live' && result.liveCallMade) {
        throw new Error(
          `ConnectorRegistry.healthCheckAll: adapter "${config.provider}" made a live call despite healthCheckPolicy 'never_live'`,
        );
      }
      reports.push({
        connectorId: config.connectorId,
        tenantId: config.tenantId,
        provider: config.provider,
        result,
      });
    }
    return reports;
  }
}
