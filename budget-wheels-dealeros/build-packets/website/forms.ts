/**
 * BUDGET WHEELS DEALEROS — website/forms (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Module 9 — website lead-form schemas + submission validation. CASL-aware:
 * every form carries an express-consent block ('casl_express_v1' wording key,
 * see ConsentRecord in schemas/core) and a honeypot anti-spam field.
 *
 * SCHEMA_NOTE: FormFieldDef/FormDef are defined locally in this packet;
 * candidates to promote into schemas/core once the demandara packet's lead
 * push (`POST /api/demandara/leads`) consumes the same shapes.
 *
 * Convention: the consent checkbox always uses CONSENT_FIELD_KEY, since
 * FormDef.consent (per spec) carries wording/channels but not a field key.
 */

import type { ConsentChannel } from '../schemas/core';

export type FormFieldKind =
  | 'text'
  | 'email'
  | 'phone'
  | 'select'
  | 'checkbox'
  | 'textarea'
  | 'hidden';

export interface FormFieldDef {
  key: string;
  label: string;
  kind: FormFieldKind;
  required: boolean;
  options?: string[];
  /** True when the value is PII and must be redacted before any model call. */
  piiSensitive: boolean;
}

export interface FormDef {
  formKey: string;
  fields: FormFieldDef[];
  consent: {
    required: true;
    /** Versioned CASL express-consent wording; text lives in the content pack. */
    wordingKey: 'casl_express_v1';
    channelsCovered: ConsentChannel[];
  };
  /** Hidden field humans never fill; bots do. Non-empty ⇒ spam. */
  honeypotFieldKey: string;
}

/** Fixed key of the consent checkbox on every DealerOS form. */
export const CONSENT_FIELD_KEY = 'caslConsent';
/** Fixed key of the honeypot field on every DealerOS form. */
export const HONEYPOT_FIELD_KEY = 'websiteUrl';

// ---------------------------------------------------------------------------
// Shared field fragments
// ---------------------------------------------------------------------------

const CONTACT_FIELDS: FormFieldDef[] = [
  { key: 'firstName', label: 'First name', kind: 'text', required: true, piiSensitive: true },
  { key: 'lastName', label: 'Last name', kind: 'text', required: true, piiSensitive: true },
  { key: 'email', label: 'Email', kind: 'email', required: true, piiSensitive: true },
  { key: 'phone', label: 'Phone', kind: 'phone', required: false, piiSensitive: true },
];

const CONSENT_FIELD: FormFieldDef = {
  key: CONSENT_FIELD_KEY,
  label: 'Yes, Budget Wheels may contact me about my inquiry. I can unsubscribe at any time.',
  kind: 'checkbox',
  required: true,
  piiSensitive: false,
};

const HONEYPOT_FIELD: FormFieldDef = {
  key: HONEYPOT_FIELD_KEY,
  label: 'Leave this field empty',
  kind: 'hidden',
  required: false,
  piiSensitive: false,
};

// ---------------------------------------------------------------------------
// Form definitions
// ---------------------------------------------------------------------------

export const TEST_DRIVE_FORM: FormDef = {
  formKey: 'test_drive_v1',
  fields: [
    ...CONTACT_FIELDS,
    { key: 'stockNumber', label: 'Vehicle stock number', kind: 'hidden', required: true, piiSensitive: false },
    { key: 'preferredDate', label: 'Preferred date', kind: 'text', required: false, piiSensitive: false },
    {
      key: 'preferredTime',
      label: 'Preferred time of day',
      kind: 'select',
      required: false,
      options: ['morning', 'afternoon', 'evening'],
      piiSensitive: false,
    },
    { key: 'comments', label: 'Anything we should know?', kind: 'textarea', required: false, piiSensitive: true },
    CONSENT_FIELD,
    HONEYPOT_FIELD,
  ],
  consent: { required: true, wordingKey: 'casl_express_v1', channelsCovered: ['email', 'sms', 'voice'] },
  honeypotFieldKey: HONEYPOT_FIELD_KEY,
};

export const TRADE_IN_FORM: FormDef = {
  formKey: 'trade_in_v1',
  fields: [
    ...CONTACT_FIELDS,
    // VIN identifies a specific owner's vehicle → treat as PII-sensitive.
    { key: 'vin', label: 'VIN', kind: 'text', required: false, piiSensitive: true },
    { key: 'year', label: 'Year', kind: 'text', required: true, piiSensitive: false },
    { key: 'make', label: 'Make', kind: 'text', required: true, piiSensitive: false },
    { key: 'model', label: 'Model', kind: 'text', required: true, piiSensitive: false },
    { key: 'mileage', label: 'Mileage (km)', kind: 'text', required: true, piiSensitive: false },
    {
      key: 'condition',
      label: 'Overall condition',
      kind: 'select',
      required: false,
      options: ['excellent', 'good', 'fair', 'needs_work'],
      piiSensitive: false,
    },
    CONSENT_FIELD,
    HONEYPOT_FIELD,
  ],
  consent: { required: true, wordingKey: 'casl_express_v1', channelsCovered: ['email', 'sms', 'voice'] },
  honeypotFieldKey: HONEYPOT_FIELD_KEY,
};

export const QUOTE_FORM: FormDef = {
  formKey: 'quote_v1',
  fields: [
    ...CONTACT_FIELDS,
    { key: 'stockNumber', label: 'Vehicle stock number', kind: 'hidden', required: true, piiSensitive: false },
    { key: 'message', label: 'Your question', kind: 'textarea', required: false, piiSensitive: true },
    CONSENT_FIELD,
    HONEYPOT_FIELD,
  ],
  consent: { required: true, wordingKey: 'casl_express_v1', channelsCovered: ['email', 'sms'] },
  honeypotFieldKey: HONEYPOT_FIELD_KEY,
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface SubmissionResult {
  ok: boolean;
  errors: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** After stripping separators: optional +, then 10–15 digits (E.164-ish). */
const PHONE_RE = /^\+?\d{10,15}$/;

/**
 * Validate a raw submission (all values arrive as strings, per HTML forms).
 * Order of checks:
 * 1. honeypot non-empty → immediate { ok:false, errors:['spam_detected'] }
 * 2. required fields present and non-blank → 'missing_required:<key>'
 * 3. email/phone shape on non-empty values → 'invalid_email:<key>' / 'invalid_phone:<key>'
 * 4. consent checkbox must be exactly 'true' → 'consent_required'
 */
export function validateSubmission(
  form: FormDef,
  values: Record<string, string>,
): SubmissionResult {
  const honeypotValue = (values[form.honeypotFieldKey] ?? '').trim();
  if (honeypotValue !== '') {
    return { ok: false, errors: ['spam_detected'] };
  }

  const errors: string[] = [];

  for (const field of form.fields) {
    if (field.key === form.honeypotFieldKey) continue;
    const value = (values[field.key] ?? '').trim();

    if (field.key === CONSENT_FIELD_KEY) continue; // handled below
    if (field.required && value === '') {
      errors.push(`missing_required:${field.key}`);
      continue;
    }
    if (value === '') continue;

    if (field.kind === 'email' && !EMAIL_RE.test(value)) {
      errors.push(`invalid_email:${field.key}`);
    }
    if (field.kind === 'phone' && !PHONE_RE.test(value.replace(/[\s().-]/g, ''))) {
      errors.push(`invalid_phone:${field.key}`);
    }
    if (field.kind === 'select' && field.options && !field.options.includes(value)) {
      errors.push(`invalid_option:${field.key}`);
    }
    if (field.kind === 'checkbox' && field.required && value !== 'true') {
      errors.push(`missing_required:${field.key}`);
    }
  }

  if (form.consent.required && (values[CONSENT_FIELD_KEY] ?? '').trim() !== 'true') {
    errors.push('consent_required');
  }

  return { ok: errors.length === 0, errors };
}
