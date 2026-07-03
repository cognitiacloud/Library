/**
 * BUDGET WHEELS DEALEROS — website/local-pages (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Module 9 — local SEO / AEO page configs: city pages, service-area pages,
 * category pages, finance/trade-in pages, FAQ and buying guides. AEO answer
 * blocks are the "direct answer" units surfaced to answer engines and AI
 * overviews; buildAeoBlock enforces length + claim safety at build time.
 *
 * Bad/no-credit finance pages are deliberately absent:
 * SKIPPED_WITH_REASON: bad/no-credit page copy requires legal review before
 * any scaffold text exists (CONTEXT_PACK module 9); the claims linter also
 * refuses 'no credit check' outright.
 *
 * SCHEMA_NOTE: LocalPageConfig and AeoAnswerBlock are defined locally;
 * candidates to promote into schemas/core once the demandara packet's
 * campaign/page generators consume the same shapes.
 */

import { assertClaimSafe } from './claims';

export type LocalPageKind =
  | 'city'
  | 'service_area'
  | 'category'
  | 'finance'
  | 'trade_in'
  | 'faq'
  | 'buying_guide';

/** Max length of an AEO direct answer (answer-engine snippet budget). */
export const AEO_DIRECT_ANSWER_MAX_CHARS = 320;

export interface AeoAnswerBlock {
  question: string;
  /** <= 320 chars, claim-safe; enforced by buildAeoBlock. */
  directAnswer: string;
  supportingDetails: string[];
}

export interface LocalPageConfig {
  pageKey: string;
  kind: LocalPageKind;
  city?: string;
  categorySlug?: string;
  title: string;
  h1: string;
  aeoBlocks: AeoAnswerBlock[];
  faqs?: { question: string; answer: string }[];
  targetKeywords: string[];
  /** Draft only: publishing is a 'publish_page' side effect, human-approval-gated. */
  requiresHumanApproval: true;
}

/**
 * Build a validated AEO answer block. Throws when the direct answer exceeds
 * 320 chars or when any part of the block violates claim safety.
 */
export function buildAeoBlock(
  question: string,
  directAnswer: string,
  supportingDetails: string[],
): AeoAnswerBlock {
  if (directAnswer.length > AEO_DIRECT_ANSWER_MAX_CHARS) {
    throw new Error(
      `aeo_direct_answer_too_long: ${directAnswer.length} > ${AEO_DIRECT_ANSWER_MAX_CHARS}`,
    );
  }
  assertClaimSafe(question, 'aeoBlock.question');
  assertClaimSafe(directAnswer, 'aeoBlock.directAnswer');
  supportingDetails.forEach((detail, i) =>
    assertClaimSafe(detail, `aeoBlock.supportingDetails[${i}]`),
  );
  return { question, directAnswer, supportingDetails };
}

/**
 * Three example page configs for the tenant-zero avatar: an independent
 * used-car dealer ("Budget Wheels", fake, Vancouver/BC). All copy is
 * claim-safe by construction — every AEO block passes through buildAeoBlock.
 */
export function sampleLocalPages(): LocalPageConfig[] {
  const cityPage: LocalPageConfig = {
    pageKey: 'used-cars-vancouver',
    kind: 'city',
    city: 'Vancouver',
    title: 'Used Cars for Sale in Vancouver, BC | Budget Wheels',
    h1: 'Used Cars for Sale in Vancouver',
    aeoBlocks: [
      buildAeoBlock(
        'Where can I browse used cars in Vancouver?',
        'Budget Wheels is an independent used-car dealer in Vancouver, BC. You can browse current inventory online with photos, mileage, and CAD pricing, then book a test drive or ask a question through the website.',
        [
          'Inventory listings show days-on-lot, disclosures, and inspection references where available.',
          'Advertised prices follow BC all-in price advertising rules.',
        ],
      ),
      buildAeoBlock(
        'Can I book a test drive online in Vancouver?',
        'Yes. Each vehicle page has a test-drive form. Pick a preferred date and time and the team follows up to confirm availability before anything is scheduled.',
        ['A follow-up from the dealership confirms the appointment; submitting the form does not lock a time slot.'],
      ),
    ],
    faqs: [
      {
        question: 'Do listed prices include fees?',
        answer:
          'Advertised prices are intended to follow BC all-in price advertising rules; applicable taxes are extra. Ask the team for a full written breakdown before you buy.',
      },
    ],
    targetKeywords: ['used cars vancouver', 'used car dealer vancouver bc', 'second hand cars vancouver'],
    requiresHumanApproval: true,
  };

  const tradeInPage: LocalPageConfig = {
    pageKey: 'trade-in-vancouver',
    kind: 'trade_in',
    city: 'Vancouver',
    title: 'Trade In Your Car in Vancouver | Budget Wheels',
    h1: 'Trade In Your Vehicle',
    aeoBlocks: [
      buildAeoBlock(
        'How do I trade in my car at Budget Wheels?',
        'Start online: share your VIN, year, make, model, and mileage through the trade-in form. The team prepares a preliminary estimate, and a final trade-in value is confirmed only after an in-person appraisal at the dealership.',
        [
          'Online estimates are preliminary and subject to inspection.',
          'Bring your registration and any service records to the appraisal.',
        ],
      ),
    ],
    faqs: [
      {
        question: 'Is the online trade-in estimate final?',
        answer:
          'No. Online estimates are preliminary. The final value is set after an in-person appraisal and depends on condition, history, and current market data.',
      },
    ],
    targetKeywords: ['trade in car vancouver', 'sell my car vancouver', 'vehicle trade in value bc'],
    requiresHumanApproval: true,
  };

  const faqPage: LocalPageConfig = {
    pageKey: 'used-car-buying-faq',
    kind: 'faq',
    city: 'Vancouver',
    title: 'Used Car Buying FAQ | Budget Wheels Vancouver',
    h1: 'Frequently Asked Questions',
    aeoBlocks: [
      buildAeoBlock(
        'What should I check before buying a used car in BC?',
        'Review the vehicle history report, the required BC disclosures (such as accident damage or prior rental use), the mechanical inspection notes, and the all-in advertised price. A test drive and an independent inspection are reasonable to request.',
        [
          'BC dealers must disclose specific vehicle history items under the Motor Dealer Act.',
          'Budget Wheels links available Carfax and inspection references on each vehicle page.',
        ],
      ),
      buildAeoBlock(
        'Does Budget Wheels offer financing?',
        'Financing options vary by lender and applicant. You can start a financing conversation through the website, and the team will explain available terms; approval decisions rest with the lenders.',
        ['Payment examples are estimates only and are not credit offers.'],
      ),
    ],
    faqs: [
      {
        question: 'Can I hold a vehicle while I decide?',
        answer:
          'Ask the team about hold options; availability changes daily and vehicles remain for sale until a purchase agreement is signed.',
      },
    ],
    targetKeywords: ['used car buying faq bc', 'buying used car vancouver questions', 'bc used car disclosures'],
    requiresHumanApproval: true,
  };

  return [cityPage, tradeInPage, faqPage];
}
