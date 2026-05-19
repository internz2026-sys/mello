/**
 * mellō voice-compliance rules.
 *
 * The voice IS the product (character-bible.md, closing note).
 * These tests encode tone as executable constraints so that any UI regression
 * that lets forbidden language reach the screen fails immediately.
 *
 * Rules derived from:
 *   voice/character-bible.md  — "What mellō never does" table + Voice DNA
 *   voice/onboarding-script.md — paired examples (the "we would NEVER say" column)
 */

import { expect, type Page } from '@playwright/test';

// ─── Forbidden patterns ────────────────────────────────────────────────────────

/**
 * Each entry is tested case-insensitively against visible page text.
 * String entries are treated as literal substrings.
 * RegExp entries are used as-is (the /i flag must be set by caller if needed —
 * here we normalise everything through a single helper).
 *
 * Exceptions:
 *  - Text inside <pre> or <code> elements is excluded (code samples may
 *    contain any string).
 *  - Elements carrying data-allow-pattern="true" are excluded (opt-out
 *    escape hatch for edge cases confirmed by voice review).
 */
export const FORBIDDEN_PATTERNS: Array<string | RegExp> = [
  // Hustle culture / pep-talk phrases
  'amazing',
  'crush it',
  "let's crush",
  'you got this',
  "let's go",
  'boost',
  'supercharge',
  'unlock',
  'level up',

  // Hollow opener that praises the user before answering
  'great question',
  'wonderful',

  // AI self-reference / breaking the practice frame (character-bible.md forbidden table)
  'as an ai',
  'as a language model',

  // Performative empathy (therapy-speak, character-bible.md)
  "i'm hearing that you feel",
  "i hear you saying",

  // Toxic positivity (character-bible.md forbidden table)
  'everything happens for a reason',

  // Bypass to advice (character-bible.md forbidden table)
  /have\s+you\s+tried/i,

  // Listicle voice (character-bible.md forbidden table)
  /here\s+are\s+\d+\s+ways/i,
  /here\s+are\s+\d+\s+(?:strategies|tips|reasons)/i,

  // Diagnoses (character-bible.md forbidden table) — describe behavior, not labels
  /that\s+sounds\s+like\s+(?:anxiety|depression|adhd|ocd|bipolar|ptsd)/i,

  // Emoji — character-bible.md bans them on user-facing surfaces.
  // Catches the main symbol ranges (Misc Symbols & Pictographs, Emoticons, Transport/Map, Supplemental).
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}]/u,

  // Exclamation points outside direct quotes.
  // A direct quote is surrounded by " or ' or " or ' or « ».
  // We match any ! that is NOT immediately preceded by a closing quote character.
  // Pattern: ! not preceded by one of: " ' " ' » )
  /(?<![\"'""'»)])\!/,
];

// ─── Helper: strip exempted text ──────────────────────────────────────────────

/**
 * Returns the visible body text of the page with exempted regions removed:
 *  - Content of <pre> and <code> elements
 *  - Content of elements with data-allow-pattern="true"
 *
 * Uses page.evaluate so it runs in the browser context.
 */
async function getCheckableText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const body = document.body.cloneNode(true) as HTMLElement;

    // Remove exempted nodes
    const exempted = body.querySelectorAll(
      'pre, code, [data-allow-pattern="true"]',
    );
    for (const el of exempted) {
      el.parentNode?.removeChild(el);
    }

    return body.innerText ?? body.textContent ?? '';
  });
}

// ─── Main assertion ────────────────────────────────────────────────────────────

/**
 * assertVoiceCompliant
 *
 * Scans all visible text on the page (minus exempted regions) and fails the
 * test if any FORBIDDEN_PATTERNS match.
 *
 * Usage:
 *   import { assertVoiceCompliant } from '../fixtures/voice-rules';
 *   await assertVoiceCompliant(page);
 */
export async function assertVoiceCompliant(page: Page): Promise<void> {
  const text = await getCheckableText(page);
  const violations: string[] = [];

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (typeof pattern === 'string') {
      // Case-insensitive substring match
      if (text.toLowerCase().includes(pattern.toLowerCase())) {
        violations.push(
          `Forbidden phrase found: "${pattern}"`,
        );
      }
    } else {
      // RegExp — apply case-insensitive flag if the pattern does not set it
      const flags = pattern.flags.includes('i') ? pattern.flags : pattern.flags + 'i';
      const re = new RegExp(pattern.source, flags);
      const match = re.exec(text);
      if (match) {
        violations.push(
          `Forbidden pattern ${pattern} matched: "${match[0]}" (context: "…${text.slice(Math.max(0, match.index - 20), match.index + 40)}…")`,
        );
      }
    }
  }

  if (violations.length > 0) {
    const message = [
      `mellō voice-compliance failure — ${violations.length} violation(s) found on ${page.url()}:`,
      ...violations.map((v) => `  • ${v}`),
      '',
      'Reference: voice/character-bible.md — "What mellō never does"',
    ].join('\n');

    // Use expect to produce a clean test failure with the message
    expect(violations, message).toHaveLength(0);
  }
}
