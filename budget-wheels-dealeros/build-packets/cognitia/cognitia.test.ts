/**
 * BUDGET WHEELS DEALEROS — cognitia/cognitia.test (BUILD PACKET, V1)
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only. Plain node:assert tests, no framework.
 */

import assert from 'node:assert/strict';
import {
  GENESIS_HASH,
  InMemoryProofEmitter,
  NO_CUSTOMER_REF,
  PROOF_EVENT_TYPES,
  ProofReceiptInput,
  redactCustomerRef,
} from './receipts';
import { WORK_EVENT_DEFINITIONS, WORK_EVENT_KINDS, WorkEventKind } from './agent-economy';

const RAW_CUSTOMER_ID = 'cust-raw-8842-jane-doe';

function fixture(partial: Partial<ProofReceiptInput>): ProofReceiptInput {
  return {
    tenant_id: 'ten_000001',
    dealer_id: 'dlr_000001',
    rooftop_id: 'rft_000001',
    actor_type: 'system',
    actor_id: 'sys_router',
    customer_ref_redacted: redactCustomerRef(RAW_CUSTOMER_ID),
    event_type: 'crm_updated',
    action_requested: 'update record',
    action_taken: 'record updated',
    policy_gate_result: { gateKey: 'internal.write', result: 'allow', reason: 'internal mock write' },
    consent_basis: 'implied_inquiry',
    data_refs: ['mock://record/1'],
    external_side_effect: false,
    rollback_path: 'mock://rollback/none-required',
    dispute_path: 'cognitia://disputes/new',
    ...partial,
  };
}

function main(): void {
  // --- redaction -----------------------------------------------------------
  const redactedA = redactCustomerRef(RAW_CUSTOMER_ID);
  const redactedB = redactCustomerRef(RAW_CUSTOMER_ID);
  assert.equal(redactedA, redactedB, 'redactCustomerRef must be deterministic');
  assert.notEqual(redactedA, RAW_CUSTOMER_ID, 'redacted ref must differ from raw id');
  assert.match(redactedA, /^cust_[0-9a-f]{10}$/, 'redacted ref shape: cust_ + 10 hex chars');
  assert.equal(redactedA.includes(RAW_CUSTOMER_ID), false, 'redacted ref must not embed the raw id');
  assert.notEqual(redactCustomerRef('other-customer'), redactedA, 'different ids redact differently');
  console.log('PASS redactCustomerRef is deterministic, shaped, and non-reversible-looking');

  // --- emit 5 receipts across different event types, fixed timestamps ------
  const emitter = new InMemoryProofEmitter();
  const t = (m: number): string => `2026-07-03T10:0${m}:00Z`;

  emitter.emit(
    fixture({
      event_type: 'lead_received',
      lead_id: 'lead_000001',
      action_requested: 'ingest inbound internet lead',
      action_taken: 'traffic event + lead created',
    }),
    t(0),
  );
  emitter.emit(
    fixture({
      event_type: 'ai_reply_drafted',
      actor_type: 'agent',
      actor_id: 'agent_bdc_01',
      agent_passport_id: 'apass_000001',
      lead_id: 'lead_000001',
      action_requested: 'draft first reply',
      action_taken: 'reply drafted and held for approval',
      policy_gate_result: {
        gateKey: 'outbound_comms.approval_gate',
        result: 'needs_human_approval',
        reason: 'all agent outbound requires a named approver',
      },
    }),
    t(1),
  );
  emitter.emit(
    fixture({
      event_type: 'human_approval_granted',
      actor_type: 'human',
      actor_id: 'usr_manager_01',
      human_approver_id: 'usr_manager_01',
      lead_id: 'lead_000001',
      action_requested: 'approve drafted reply',
      action_taken: 'approval recorded',
    }),
    t(2),
  );
  emitter.emit(
    fixture({
      event_type: 'appointment_confirmed',
      actor_type: 'agent',
      actor_id: 'agent_bdc_01',
      agent_passport_id: 'apass_000001',
      human_approver_id: 'usr_manager_01',
      lead_id: 'lead_000001',
      vehicle_id: 'veh_000042',
      action_requested: 'send approved confirmation',
      action_taken: 'confirmation sent; customer replied to confirm',
      external_side_effect: true,
      policy_gate_result: {
        gateKey: 'outbound_comms.consent_check',
        result: 'allow',
        reason: 'express consent on file; human approver named',
      },
      consent_basis: 'express',
    }),
    t(3),
  );
  emitter.emit(
    fixture({
      event_type: 'connector_sync_failed',
      actor_type: 'connector',
      actor_id: 'conn_runner',
      connector_id: 'conn_inventory_feed',
      customer_ref_redacted: NO_CUSTOMER_REF,
      action_requested: 'run mock inventory feed sync',
      action_taken: 'sync aborted; no external writes confirmed',
      rollback_path: 'mock://rollback/rerun-sync',
    }),
    t(4),
  );

  assert.equal(emitter.getLedger().length, 5, 'five receipts emitted');
  assert.equal(emitter.getLedger()[0].prev_receipt_hash, GENESIS_HASH, 'first receipt links to GENESIS');
  assert.equal(PROOF_EVENT_TYPES.length, 22, 'exactly 22 proof event types defined');
  console.log('PASS emitted 5 receipts across distinct event types with fixed timestamps');

  // --- chain verifies ------------------------------------------------------
  assert.deepEqual(emitter.verifyChain(), { valid: true }, 'untouched chain verifies');
  console.log('PASS verifyChain() accepts the untampered ledger');

  // --- tampering breaks the chain ------------------------------------------
  const tampered = emitter.ledger[2];
  const originalActionTaken = tampered.action_taken;
  tampered.action_taken = 'approval recorded for a different draft';
  let result = emitter.verifyChain();
  assert.equal(result.valid, false, 'body tamper must fail verification');
  assert.equal(result.failedAtIndex, 2, 'failure reported at the tampered index');
  tampered.action_taken = originalActionTaken;
  assert.equal(emitter.verifyChain().valid, true, 'restoring the field restores validity');

  const originalPrev = emitter.ledger[3].prev_receipt_hash;
  emitter.ledger[3].prev_receipt_hash = 'forged';
  result = emitter.verifyChain();
  assert.equal(result.valid, false, 'chain-link tamper must fail verification');
  emitter.ledger[3].prev_receipt_hash = originalPrev;
  assert.equal(emitter.verifyChain().valid, true, 'chain valid again after restore');
  console.log('PASS tampering with a stored receipt makes verifyChain() fail');

  // --- claim-safe summaries -------------------------------------------------
  const banned = ['guarantee', 'best', '#1', 'production ready', 'certified'];
  for (const receipt of emitter.getLedger()) {
    const summary = receipt.claim_safe_summary;
    assert.ok(summary.length > 0, 'summary is non-empty');
    const lower = summary.toLowerCase();
    for (const word of banned) {
      assert.equal(lower.includes(word), false, `summary must not contain '${word}': ${summary}`);
    }
    assert.equal(summary.includes(RAW_CUSTOMER_ID), false, `summary must not leak raw customer id: ${summary}`);
    if (receipt.customer_ref_redacted !== NO_CUSTOMER_REF) {
      assert.ok(summary.includes(receipt.customer_ref_redacted), 'summary references the redacted ref');
    }
  }
  console.log('PASS claim_safe_summary is banned-word-free and never leaks the raw customer id');

  // --- policy invariants -----------------------------------------------------
  assert.throws(
    () => emitter.emit(fixture({ customer_ref_redacted: RAW_CUSTOMER_ID }), t(5)),
    /redactCustomerRef/,
    'raw customer ids are rejected at emit time',
  );
  assert.throws(
    () =>
      emitter.emit(
        fixture({
          actor_type: 'agent',
          external_side_effect: true,
          policy_gate_result: { gateKey: 'outbound_comms.approval_gate', result: 'allow', reason: 'mock' },
        }),
        t(5),
      ),
    /human_approver_id/,
    'agent side effects without a named approver are rejected',
  );
  console.log('PASS emit() enforces redaction and human-approval invariants');

  // --- WORK_EVENT_DEFINITIONS covers all 13 kinds ---------------------------
  assert.equal(WORK_EVENT_KINDS.length, 13, 'exactly 13 work event kinds');
  assert.equal(Object.keys(WORK_EVENT_DEFINITIONS).length, 13, 'definitions table has 13 entries');
  const forbiddenEconomyWords = ['token', 'crypto', 'wallet', 'coin', 'payout', 'monetary'];
  for (const kind of WORK_EVENT_KINDS) {
    const def = WORK_EVENT_DEFINITIONS[kind as WorkEventKind];
    assert.ok(def, `definition present for ${kind}`);
    assert.ok(def.whatCountsAsWork.length > 0, `${kind}: whatCountsAsWork non-empty`);
    assert.ok(def.evidenceRequired.length > 0, `${kind}: evidenceRequired non-empty`);
    for (const evidence of def.evidenceRequired) {
      assert.ok(evidence.trim().length > 0, `${kind}: evidence entries non-empty`);
    }
    assert.equal(def.proofReceiptRequired, true, `${kind}: proof receipt always required`);
    assert.ok(def.disputePath.length > 0, `${kind}: disputePath non-empty`);
    assert.ok(def.reputationImpactNote.length > 0, `${kind}: reputationImpactNote non-empty`);
    const defText = JSON.stringify(def).toLowerCase();
    for (const word of forbiddenEconomyWords) {
      assert.equal(defText.includes(word), false, `${kind}: definition must not mention '${word}'`);
    }
  }
  assert.ok(
    WORK_EVENT_DEFINITIONS.appointment_confirmed.evidenceRequired.join(' ').toLowerCase().includes('confirmation'),
    'appointment_confirmed demands customer confirmation evidence, not just the draft',
  );
  assert.equal(
    WORK_EVENT_DEFINITIONS.appointment_confirmed.humanApprovalRequired,
    true,
    'appointment_confirmed requires human approval',
  );
  console.log('PASS WORK_EVENT_DEFINITIONS covers all 13 kinds with evidence and no economy language');

  console.log('ALL CHECKS PASSED (cognitia packet)');
}

main();
