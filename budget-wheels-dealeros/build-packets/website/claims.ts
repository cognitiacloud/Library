/**
 * BUDGET WHEELS DEALEROS — website/claims (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Module 9 — Website + Demand Gen engine: claim-safety linter for anything
 * that could reach a public page (VDP meta, AEO answers, local-page copy,
 * FAQ answers). Mirrors CONTEXT_PACK.md §7 "NEVER claim publicly".
 *
 * Deliberate strictness for this scaffold:
 * - 'certified' is banned wholesale (covers "certified pre-owned",
 *   "SOC 2 certified", "GDPR certified") until legal review defines which
 *   certification language is actually supportable.
 * - 'no credit check' is refused outright: bad/no-credit finance pages
 *   require legal review before any copy ships (CONTEXT_PACK module 9).
 */

/** Phrases that must never appear in public-facing copy. Matched case-insensitively. */
export const BANNED_PUBLIC_CLAIMS: string[] = [
  'production ready',
  'guaranteed',
  'guarantee',
  '#1',
  'best price',
  'certified',
  'soc 2 certified',
  'gdpr certified',
  'lowest price',
  'we will beat any price',
  'no credit check',
  // Extra guards consistent with CONTEXT_PACK §7:
  'guaranteed approval',
  'everyone approved',
  'replaces every dms',
];

export interface ClaimViolation {
  /** The banned phrase (as listed in BANNED_PUBLIC_CLAIMS) that matched. */
  phrase: string;
  /** 0-based index of the match in the original text. */
  index: number;
}

export interface ClaimLintResult {
  ok: boolean;
  violations: ClaimViolation[];
}

/**
 * Case-insensitive substring scan of `text` against BANNED_PUBLIC_CLAIMS.
 * Reports every occurrence of every phrase, except matches whose span is
 * fully contained inside a longer match at the same spot (so "guaranteed"
 * reports once, not also as "guarantee"; "soc 2 certified" wins over the
 * inner "certified").
 */
export function lintClaimSafety(text: string): ClaimLintResult {
  const haystack = text.toLowerCase();
  const raw: { phrase: string; index: number; length: number }[] = [];

  for (const phrase of BANNED_PUBLIC_CLAIMS) {
    const needle = phrase.toLowerCase();
    if (needle.length === 0) continue;
    let from = 0;
    for (;;) {
      const idx = haystack.indexOf(needle, from);
      if (idx === -1) break;
      raw.push({ phrase, index: idx, length: needle.length });
      from = idx + 1;
    }
  }

  // Longest-first; drop matches fully contained in an already-kept span.
  raw.sort((a, b) => b.length - a.length || a.index - b.index);
  const kept: { phrase: string; index: number; length: number }[] = [];
  for (const m of raw) {
    const contained = kept.some(
      (k) => m.index >= k.index && m.index + m.length <= k.index + k.length,
    );
    if (!contained) kept.push(m);
  }
  kept.sort((a, b) => a.index - b.index || a.phrase.localeCompare(b.phrase));

  const violations = kept.map(({ phrase, index }) => ({ phrase, index }));
  return { ok: violations.length === 0, violations };
}

/** Convenience guard: throw a descriptive error when text is not claim-safe. */
export function assertClaimSafe(text: string, context: string): void {
  const result = lintClaimSafety(text);
  if (!result.ok) {
    const detail = result.violations
      .map((v) => `'${v.phrase}'@${v.index}`)
      .join(', ');
    throw new Error(`claim_safety_violation in ${context}: ${detail}`);
  }
}
