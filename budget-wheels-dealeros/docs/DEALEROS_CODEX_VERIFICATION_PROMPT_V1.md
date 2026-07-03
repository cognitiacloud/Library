# DEALEROS_CODEX_VERIFICATION_PROMPT_V1

STATUS: INTERNAL — DESIGN ONLY. NOT PRODUCTION READY. NO PUBLIC CLAIMS AUTHORIZED.
Owner: Muhammad Firoz · Date: 2026-07-03 · Version: V1

Purpose: a copy-paste verification prompt for an independent coding agent
(Codex, another Claude session, or any capable model with repo access) to
audit the Budget Wheels DealerOS V1 deliverable without trusting the authoring
session's claims. Companion docs: `DEALEROS_DELIVERY_MEMO_V1.md` (doc index),
`DEALEROS_30_60_90_DAY_BUILD_ROADMAP_V1.md` (what comes next).

---

## The prompt (copy everything between the fences)

```text
ROLE: independent verification agent. You did not author this work. Your job
is to try to falsify its claims, not to improve it. Modify nothing except a
single verification report file.

TARGET: repository cognitiacloud/Library, branch
claude/budget-wheels-dealerios-kn6v86, directory budget-wheels-dealeros/.

CONTEXT: this directory claims to contain the V1 design set for "Budget
Wheels DealerOS" — an AI-native dealership CRM + traffic-desk + inventory +
demand-gen + proof-control platform. Claimed contents: 1 context pack, 19
reports in docs/, 11 research files in research/, and 8 build-packet areas in
build-packets/ with a passing dependency-free test suite. Claimed safety
posture: design-only, mock-only, no secrets, no live integrations, no
production claims.

VERIFY, IN ORDER:

1. INVENTORY. Confirm docs/ contains exactly these 19 files:
   BUDGET_WHEELS_DEALEROS_EXECUTIVE_STRATEGY_V1.md,
   BUDGET_WHEELS_WHAT_WE_BUILT_SO_FAR_V1.md,
   DEALEROS_COMPETITOR_RESEARCH_MATRIX_V1.md,
   DEALEROS_FEATURE_MAP_AND_MODULE_ARCHITECTURE_V1.md,
   DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md,
   DEALEROS_DEALERMINE_STYLE_CRM_BDC_SPEC_V1.md,
   DEALEROS_AUTOALERT_STYLE_EQUITY_MINING_SPEC_V1.md,
   DEALEROS_AI_BDC_AND_SALES_CLOSER_SPEC_V1.md,
   DEALEROS_DEMANDARA_DEMAND_GEN_HARNESS_V1.md,
   DEALEROS_COGNITIA_PROOF_ADAPTER_V1.md,
   DEALEROS_AI_MODEL_HARNESS_AND_CONNECTOR_REGISTRY_V1.md,
   DEALEROS_MULTI_TENANT_SAAS_ARCHITECTURE_V1.md,
   DEALEROS_SEO_AEO_AIO_WEBSITE_ENGINE_V1.md,
   DEALEROS_AGENT_ECONOMY_COMPATIBILITY_SKELETON_V1.md,
   DEALEROS_COMPLIANCE_AND_SECURITY_READINESS_V1.md,
   DEALEROS_30_60_90_DAY_BUILD_ROADMAP_V1.md,
   DEALEROS_CODEX_VERIFICATION_PROMPT_V1.md,
   DEALEROS_MUHAMMAD_DECISION_BOARD_V1.md,
   DEALEROS_DELIVERY_MEMO_V1.md.
   Confirm research/ has the 11 files named in DEALEROS_DELIVERY_MEMO_V1.md
   §2.5 and build-packets/ has schemas/, cognitia/, connectors/, ai-harness/,
   demandara/, equity-mining/, traffic-desk/, website/.

2. TESTS. Run: cd budget-wheels-dealeros/build-packets
   && npm install --no-fund --no-audit   # dev-only: typescript + @types/node
   && ./run-tests.sh
   Expected: strict typecheck passes, every *.test.js passes, final line
   "ALL TESTS PASSED". Report the exact final lines you observed.

3. NO LIVE SURFACES. In build-packets/ (excluding node_modules), verify by
   search: no fetch(/axios/http.request usage; no process.env reads; no
   Date.now()/new Date()/Math.random in logic (comment mentions are fine);
   no real-looking secrets (sk-…, xoxb-…, AKIA…, PEM blocks) outside the
   negative-test fixture in connectors/connectors.test.ts.

4. GOVERNANCE INVARIANTS IN CODE (read the sources, not the docs):
   a. connectors/registry.ts: mode defaults to 'mock'; configuring
      mode:'live' without liveApprovalReceiptId throws; secretEnvVarNames
      entries are validated by assertNoRawSecret.
   b. ai-harness/redaction.ts + provider.ts: PII-bearing requests to an
      external provider are denied regardless of tenant settings.
   c. cognitia/receipts.ts: receipts are hash-chained; verifyChain() detects
      tampering; claim_safe_summary templates never embed a raw customer id.
   d. Every outbound-draft shape (equity-mining next-best-action, demandara
      reply/appointment drafts, connectors SMS mock) carries
      requiresHumanApproval: true or an approval-receipt requirement.

5. DOC CONVENTIONS. Every docs/*.md starts with the STATUS banner and
   "Owner: Muhammad Firoz · Date: 2026-07-03 · Version: V1", and ends with a
   "## Boundaries honored" section.

6. CLAIM SAFETY. Search docs/ and research/ for affirmative uses (not
   quoted-as-prohibited uses) of: "production ready", "guaranteed",
   "SOC 2 certified", "GDPR certified", "#1", revenue guarantees, or any
   statement that a live DealerMine/TMS/DMS integration exists. Also confirm
   no token/crypto/securities language in
   DEALEROS_AGENT_ECONOMY_COMPATIBILITY_SKELETON_V1.md beyond explicit
   exclusion statements.

7. CROSS-DOC CONSISTENCY (spot checks):
   a. The 9 Demandara API routes are identical in CONTEXT_PACK.md Module 10,
      DEALEROS_DEMANDARA_DEMAND_GEN_HARNESS_V1.md, and
      build-packets/demandara/api-contracts.ts.
   b. The 22 proof event types match between CONTEXT_PACK.md Module 11,
      DEALEROS_COGNITIA_PROOF_ADAPTER_V1.md, and cognitia/receipts.ts.
   c. SLA numbers quoted in DEALEROS_TMS_TRAFFIC_DESK_SPEC_V1.md match
      DEFAULT_SLA_POLICY in traffic-desk/sla.ts.
   d. Scoring bands (hot ≥ 70, warm ≥ 40) match between the equity-mining
      spec and equity-mining/scoring.ts.
   e. Every filename cross-referenced in docs/*.md exists.

8. TRUTHFULNESS. BUDGET_WHEELS_WHAT_WE_BUILT_SO_FAR_V1.md must not claim any
   artifact that does not exist in the repo; its "Honest gap statement" must
   still say there is no running product.

REPORT: write VERIFICATION_REPORT.md at the repo root of your working copy
(do not modify anything else) with: PASS/FAIL per section 1-8 with evidence
(commands run, exact output lines, file:line citations for every failure),
an overall verdict, and a ranked list of any defects found. Do not fix
defects; report them. Do not deploy anything, call any external API, or
contact anyone.
```

## Expected verification outcome (authoring session's claim under test)

Sections 1–8 all PASS as of commit on 2026-07-03. If any section fails, the
defect list goes to the owner and the fix lands in a V1.1 change — the
verification report is the arbiter, not this document.

## Boundaries honored

This document authorizes a read-only audit plus one report file. It does not
authorize deploys, live API calls, migrations, outreach, fixes, or public
claims. The verification agent inherits every hard boundary in
`CONTEXT_PACK.md` §4.
