# BUDGET WHEELS DEALEROS — SHARED CONTEXT PACK (V1)

STATUS: INTERNAL — DESIGN/ARCHITECTURE ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.

This file is the single source of truth for every document and build packet in
`budget-wheels-dealeros/`. All writers must stay consistent with it.

## 1. Mission

Design and plan Budget Wheels DealerOS: a full AI-native dealership CRM +
traffic-management (TMS) + inventory + demand-generation + proof-control
platform. This is our own CRM, not a connector to existing CRMs. Dealers using
it should not need DealerMine, TMS Canada, VinSolutions, DealerSocket,
AutoAlert, or Impel unless they specifically want integrations — but the
platform stays connector-ready.

Owner / final decision-maker: Muhammad Firoz (founder/operator).

## 2. Empire formula

- **Demandara** books the buyer (GTM, demand gen, AI BDC, Sales Closer, marketing automation, SEO/AEO/AIO, attribution).
- **Budget Wheels DealerOS** runs the dealer workflow (CRM, TMS traffic desk, inventory, equity mining, service bridge, websites).
- **Cognitia** proves the work (proof receipt ledger, policy gates, audit events, agent identity, data rights registry, approvals, reputation, tenant controls).
- **Agent economy** rewards verified agent actions later (internal only: agent passports, action ledger, proof receipts, work-credit candidates, reputation events, dispute/approval paths. NO token, NO crypto, NO securities language, NO public marketplace).

## 3. Brand/project definitions

- **Budget Wheels** — tenant-zero and dealer-market brand; first proof environment (independent used-car dealer avatar, Vancouver/BC).
- **Budget Wheels DealerOS** — the actual multi-tenant SaaS platform.
- **Demandara** — the GTM/demand-gen/revenue workflow engine that plugs into DealerOS.
- **Demand Gen** — subsystem creating/optimizing dealer websites, inventory pages, local SEO pages, AEO answer pages, AI-overview-friendly pages, category/finance/trade-in pages, campaigns, social/listing content, lead forms, review/referral flows, attribution reports, lead-to-sale feedback loops.
- **Cognitia** — trust/proof/control/governance layer.
- **Sales Closer** — Demandara workflow moving a lead from inquiry → appointment/test drive → deal draft through governed follow-up and proof.

## 4. Hard boundaries (apply to every doc and packet)

No secrets. No real API keys. No live CRM writes. No live DMS writes. No
dealership/customer outreach. No production deploy. No production migrations.
No fake customer proof. No public launch claims. No crypto/token
implementation. No unsupported compliance claims. No "production ready"
language. If blocked/sensitive/missing: mark `SKIPPED_WITH_REASON` and
continue. Mock mode by default for every connector and model provider. Live
mode always gated by human approval + proof receipt.

## 5. What exists already (internal/demo/design only)

Independent used-car dealer avatar (Vancouver/BC); core offer "Proof-Backed
Used-Car Lead-to-Close Engine"; dealer closer field schema; used-car dealer
proof report template; Budget Wheels client-zero dealer demo script;
claim-safe used-car dealer content pack; unsent dealer outreach approval
packet; claim-safe dealer demo storyboard; dealer demo static visual
prototype spec; static frame copy deck; render prompt pack; frame generation
memo; visual QA packet; internal demo preview packet; slide deck outline;
demo video script + voiceover plan; internal review packet; 15 static
internal demo frames using fake/reserved data.

Boundaries so far: no live dealership CRM, no live DMS integration, no live
DealerMine/TMS integration, no real customer PII, no public proof claims, no
outreach sent, all demo data fake/reserved/local-only.

Product metaphor: **"A dealership sales desk with a paper trail — not a magic chatbot."**

## 6. The 15 core modules

1. **Multi-tenant dealership foundation** — tenant/dealer/group/rooftop, users, roles, teams, salesperson assignment, manager permissions, audit logs, per-tenant settings/branding/connectors/websites/proof ledger.
2. **Customer 360** — profile, household, contact methods, consent status, communication/lead/service/ownership/trade-in history, finance/lease status if known, notes/tasks, duplicate detection, privacy controls.
3. **Inventory CRM** — VIN, stock number, YMMT, mileage, price, cost (if allowed), status lifecycle (incoming/available/pending/sold/wholesale/archived), photos, features, damage/disclosure, Carfax/inspection refs, market price data, days-in-inventory, listing completeness score, SEO-ready vehicle page content, merchandising score, AI listing assistant.
4. **TMS traffic desk** — phone/internet/walk-in/website/marketplace/after-hours/service-drive/referral/partner leads, appointment board, no-show tracking, assignment, SLA timers, source/campaign tracking, manager dashboard, sold/lost reasons, follow-up accountability, traffic-to-sale reporting.
5. **Lead pipeline / Sales Closer** — stages, qualification, buyer intent, budget range, desired vehicle, trade-in y/n, financing y/n, appointment/test-drive drafts, objection tracking, follow-up plan, human approval, deal draft, sold/lost reason, proof receipts, AI-assisted booked appointment attribution.
6. **AI BDC agent** — instant lead response, availability answers, similar-vehicle recommendation, price/payment explanation with disclaimers, financing routing, trade-in intake, appointment/test-drive drafts, follow-up drafts, lost-lead resurrection, service-to-sales drafts, escalation to human, call/chat/SMS summarization, proof receipt creation.
7. **Equity mining / opportunity engine** (AutoAlert-style) — score on lease maturity, finance term age, estimated equity, payment-to-upgrade, service recency, mileage, vehicle age, warranty end, trade-in likelihood, inventory match, engagement, website behavior, prior purchase source, service-only/sold/orphan/household segments. Output: hot score, reason codes, recommended pitch, vehicle match, next best action, call task, SMS/email draft, human approval, proof receipt, result tracking.
8. **Service CRM / fixed ops bridge** — service appointment history, declined service, recalls, maintenance reminders, tire/storage, service-to-sales leads, equity alerts from service drive, BDC service campaigns, advisor tasks, retention.
9. **Website + Demand Gen engine** — homepage, inventory pages, VDPs, local SEO pages, city/service-area pages, category pages (SUVs/trucks/sedans/vans/EV-hybrid), finance pages, bad/no-credit pages (legal review), trade-in page, appointment/test-drive forms, FAQ, buying guides, schema.org (Vehicle/AutoDealer/LocalBusiness/FAQPage/BreadcrumbList/Organization), AEO answer blocks, AIO-friendly sections, UTM capture, source/campaign attribution, CRM outcome feedback to Demandara.
10. **Demandara connector/harness** — campaigns, landing pages, social/listing drafts, lead push, context retrieval, reply drafts, appointment drafts, follow-up tasks, outcomes, lead-to-sale attribution, monthly proof-backed marketing reports. API surface: `POST /api/demandara/leads`, `GET /api/demandara/context/:leadId`, `POST /api/demandara/reply-drafts`, `POST /api/demandara/appointment-drafts`, `POST /api/demandara/followups`, `POST /api/demandara/campaigns`, `GET /api/demandara/outcomes`, `GET /api/demandara/revenue-attribution`, `GET /api/demandara/proof-report`.
11. **Cognitia proof adapter** — every important action emits a receipt. Event types: lead_received, consent_captured, customer_created, duplicate_detected, vehicle_matched, inventory_context_used, equity_score_generated, ai_reply_drafted, human_approval_requested, human_approval_granted, appointment_drafted, appointment_confirmed, test_drive_completed, followup_sent, crm_updated, sold_marked, lost_reason_recorded, review_requested, campaign_generated, campaign_attributed, connector_sync_completed, connector_sync_failed. Receipt fields: receipt_id, tenant_id, dealer_id, rooftop_id, actor_type (human|agent|system|connector), actor_id, agent_passport_id?, human_approver_id?, customer_ref_redacted, lead_id, vehicle_id, deal_id?, campaign_id?, connector_id?, event_type, action_requested, action_taken, policy_gate_result, consent_basis, data_refs, external_side_effect (y/n), payload_hash, timestamp, rollback_path, dispute_path, claim_safe_summary.
12. **Connector registry** — mock/sandbox/live modes; DealerMine, TMS, CDK, Reynolds, DealerSocket, VinSolutions, Dealertrack, Quorum, DealerCenter, AutoSync; inventory feeds (CSV/XML/JSON/AutoTrader-like/website feed); Twilio/SMS; voice agent provider; Gmail/Outlook; Google/Microsoft Calendar; Stripe later; QuickBooks later; OpenAI; Anthropic; OpenRouter; Ollama/local; n8n; MCP Gateway; FB Marketplace/Kijiji/AutoTrader listing assistants where allowed; Google Business Profile where allowed. Rules: env var names only, no raw secret storage, tenant-scoped config, mock default, live gated by human approval, proof receipt for every external side effect, health checks never call live APIs unless explicitly enabled.
13. **AI harness / model router** — OpenAI, Anthropic, OpenRouter, local Ollama, future local GPU; task-based routing, cost controls, privacy controls, no raw PII to external models unless policy allows, redaction before model call, tool-call approval gates, model usage ledger, prompt/version registry, eval harness, fallback model, local-only mode. AI tasks: lead classification, intent detection, vehicle matching, reply drafting, objection handling, equity opportunity explanation, listing copy, SEO content, AEO answers, follow-up sequences, call summary, manager coaching, source attribution analysis, anomaly detection, compliance check.
14. **Compliance / enterprise readiness** — SOC 2 *readiness* (not certification), audit logs, RBAC, tenant isolation, consent tracking, CASL/PIPEDA/PIPA (BC) for Canada, GDPR-ready data rights patterns, TCPA/CAN-SPAM if US later, AI disclosure, opt-out handling, retention, right to delete/export, data minimization, encrypted secrets, webhook verification, rate limiting, activity logs, connector permission scopes, policy gates, human approval on sensitive actions.
15. **Agent economy skeleton** — internal primitives only: agent_passports, agent_actions, proof_receipts, work_credit_candidates, reputation_events, dispute_events, human_review_events. Work events: lead_answered, lead_qualified, vehicle_matched, appointment_drafted, appointment_confirmed, followup_completed, equity_opportunity_created, service_to_sales_opportunity_created, listing_generated, campaign_generated, sold_attributed, review_generated, connector_sync_completed. For each: definition of work, evidence required, proof receipt required, human approval requirement, dispute path, reputation impact later.

## 7. Claim-safe positioning

Internal thesis: "Budget Wheels DealerOS is an AI-native, proof-backed
dealership CRM and traffic operating system."

Claim-safe public wedge (later): "Turn more dealership leads into
appointments with AI-assisted follow-up, traffic accountability, and
proof-backed sales workflows."

NEVER claim publicly: production ready; replaces every DMS; guaranteed
sales; live DealerMine/TMS integration; compliance certified; SOC 2
certified; GDPR certified; AutoAlert replacement (unless feature parity is
real); real customer proof until validated.

## 8. Document conventions

- Every doc starts with a status banner: `STATUS: INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.`
- Every doc ends with a `## Boundaries honored` section restating relevant hard boundaries.
- Version suffix `V1` in filenames; owner is Muhammad Firoz; date 2026-07-03.
- Use `SKIPPED_WITH_REASON:` markers where work is blocked (e.g., anything needing a live API, real vendor contract, legal counsel, or a dedicated code repo).
- Cross-reference sibling docs by filename.
- Terminology: "tenant" (contract-level account) → "dealer group" → "dealer" → "rooftop" (physical location). "Traffic event" = any inbound contact/visit. "Proof receipt" = Cognitia audit record. "Work event" = agent-economy-countable action.
- TypeScript is the reference language for build packets; packets are REFERENCE SCAFFOLDS to be moved into a dedicated DealerOS repo — this Library repo is NOT the production codebase.

## 9. Repo reality note

This work lives in `cognitiacloud/Library` (a document library repo) on
branch `claude/budget-wheels-dealerios-kn6v86` because that is the
designated workspace for this run. The actual DealerOS application repo does
not exist yet; creating it (recommended name: `cognitiacloud/dealeros`) is a
Week-1 roadmap item. All code here is dependency-free reference scaffolding
(plain TypeScript type files + plain-Node mock tests), safe to run, with no
network calls, no secrets, no migrations, and no deploy.
