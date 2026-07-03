# DealerOS Build Packets

STATUS: INTERNAL — REFERENCE SCAFFOLDS ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.

These packets are the executable half of the DealerOS V1 design: dependency-free
TypeScript schemas, mock adapters, and deterministic tests that pin down the
domain model and the governance rules (mock-by-default connectors, human
approval gates, proof receipts, PII redaction) before the real application repo
exists. They are meant to be lifted into the dedicated DealerOS repo
(recommended: `cognitiacloud/dealeros`) as the starting vocabulary — see
`../docs/DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md`.

## Layout

| Directory | Module | Contents |
|---|---|---|
| `schemas/` | M1–M5, M7, M9 | `core.ts` — canonical domain types: tenancy chain, users/roles, Customer 360, inventory, traffic events, leads, appointments, deals, campaigns, opportunity scores |
| `cognitia/` | M11, M15 | Proof receipt schema, hash-chained in-memory proof emitter, claim-safe summary templates, agent-economy skeleton (passports, actions, work-event definitions) |
| `connectors/` | M12 | Connector registry (mock/sandbox/live modes, env-var-name-only secrets, live gated on approval receipts) + mock DealerMine/TMS/CSV-feed/SMS/calendar adapters |
| `ai-harness/` | M13 | Model provider interface, task-based router with fallback, PII redaction gate, policy gate (no PII to external models), usage ledger, prompt registry |
| `demandara/` | M10 | API contracts for the 9 Demandara endpoints + in-memory adapter: lead intake, redacted context packs, drafts (always human-approval-gated), attribution, proof report |
| `equity-mining/` | M7 | AutoAlert-style deterministic mock scoring: factor definitions, reason codes, bands, inventory matching, claim-safe next-best-action generator |
| `traffic-desk/` | M4 | SLA due-at math per source, round-robin assignment, traffic-outcome and appointment state machines with human-approval guards |
| `website/` | M9 | Claim-safety linter, VDP SEO meta builders, schema.org JSON-LD builders, CASL-aware form schemas, UTM/attribution capture, AEO answer blocks |

## Running

```bash
./run-tests.sh   # typecheck (strict) + compile + run every *.test.ts with plain node
```

Dev-only dependencies (`typescript`, `@types/node`) are installed locally and
gitignored. There are **no runtime dependencies, no network calls, no secrets,
no live integrations** anywhere in these packets. All fixtures are fake data.

## Rules encoded here (do not regress)

1. Connectors default to `mock`; `live` mode requires a human-approval proof receipt at configuration time.
2. Secret **values** never appear anywhere — only env var **names**; registration rejects strings that look like real secrets.
3. Raw PII never goes to external model providers; the redaction gate runs before every model call.
4. Every AI-drafted outbound artifact is `requiresHumanApproval: true` — nothing auto-sends.
5. Every significant action emits a hash-chained proof receipt with a claim-safe summary.
6. All logic is deterministic under injected timestamps — no wall-clock reads inside scored/tested paths.
