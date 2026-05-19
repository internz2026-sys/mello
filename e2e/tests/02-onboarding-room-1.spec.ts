/**
 * mellō — Onboarding Room 1 tests
 *
 * Spec: voice/onboarding-script.md — Room 1 (Arrival)
 *
 * Room 1 is the user's first contact with mellō's voice. The opening lines
 * set the emotional contract. These tests guard both the navigation path and
 * the exact wording that must appear.
 *
 * Note on name acknowledgement: after name entry the script (v0.2) echoes
 * the name as "{name}." and immediately presents the next prompt. We assert
 * on the next prompt ("what brought you here today?") as the stable signal.
 */

import { test, expect } from '@playwright/test';
import { assertVoiceCompliant } from '../fixtures/voice-rules';

// A plain test name to use throughout — no special chars, short enough
const TEST_NAME = 'Ines';

test.describe('Onboarding — Room 1 (Arrival)', () => {
  test('clicking Begin navigates to Room 1', async ({ page }) => {
    await page.goto('/');

    const beginBtn = page.getByRole('link', { name: /begin/i });
    await expect(beginBtn).toBeVisible();
    await beginBtn.click();

    // Accept any URL that contains onboarding and room-1 (or room/1, etc.)
    await expect(page).toHaveURL(/onboarding.*room[-/]?1/i);
  });

  test('Room 1 opens with the mellō greeting', async ({ page }) => {
    await page.goto('/onboarding/room-1');

    // onboarding-script.md Room 1 opening line (v0.2 reframe — practice, not Thou):
    // "Welcome."
    // No first-person AI voice; no brand intro. Second-person/observational.
    const body = page.locator('body');
    await expect(body).toContainText(/welcome/i);
  });

  test('Room 1 asks for the user name', async ({ page }) => {
    await page.goto('/onboarding/room-1');

    // onboarding-script.md v0.2: "Before anything else — what name do you go by?"
    const body = page.locator('body');
    await expect(body).toContainText(/what name do you go by/i);
  });

  test('entering a name produces an acknowledgement or next prompt', async ({
    page,
  }) => {
    await page.goto('/onboarding/room-1');

    // The name input has no accessible label — only placeholder="your name".
    // Playwright does not derive accessible name from placeholder, so
    // getByRole('textbox', { name: /.../ }) would not resolve. Use the direct
    // locator instead.
    const nameInput = page.locator('input[type="text"]').first();

    await nameInput.fill(TEST_NAME);
    await nameInput.press('Enter');

    // After submitting the name, the script (v0.2) echoes the name as:
    //   "{name}."  — a single word followed by a period
    // then presents the next prompt:
    //   "what brought you here today?"
    // Either presence confirms a correct transition.
    const body = page.locator('body');
    await expect(body).toContainText(
      /what brought you here today/i,
      { timeout: 8000 },
    );
  });

  test('voice compliance — Room 1 opening state', async ({ page }) => {
    await page.goto('/onboarding/room-1');
    await assertVoiceCompliant(page);
  });

  test('voice compliance — Room 1 after name entry', async ({ page }) => {
    await page.goto('/onboarding/room-1');

    // Placeholder-only input — no accessible label. Use direct locator.
    const nameInput = page.locator('input[type="text"]').first();

    await nameInput.fill(TEST_NAME);
    await nameInput.press('Enter');

    // Allow up to 8 s for any AI-generated text to settle before checking
    await page.waitForTimeout(800);

    await assertVoiceCompliant(page);
  });
});
