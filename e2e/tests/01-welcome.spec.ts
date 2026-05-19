/**
 * mellō — Welcome screen tests
 *
 * Spec: voice/onboarding-script.md — Pre-room section
 *
 * The welcome screen is intentionally minimal: the name, the tagline, and a
 * single [Begin] button. These tests confirm that structure is present and
 * that no voice violations have crept in.
 */

import { test, expect } from '@playwright/test';
import { assertVoiceCompliant } from '../fixtures/voice-rules';

test.describe('Welcome screen — /', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('GET / returns 200', async ({ page }) => {
    // page.goto resolves to the final response; check its status
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('page contains the mellō wordmark (with macron)', async ({ page }) => {
    // The ō macron is voice-critical — the plain "o" form is never used
    await expect(page.locator('body')).toContainText('mellō');
  });

  test('page contains the tagline', async ({ page }) => {
    // Exact tagline from onboarding-script.md Pre-room section
    await expect(page.locator('body')).toContainText(
      'future self — a place to think slowly',
    );
  });

  test('page has a visible [Begin] button', async ({ page }) => {
    // Begin is a Next.js <Link> inside <Button asChild> — renders as an <a>,
    // so the accessible role is 'link', not 'button'.
    const beginBtn = page.getByRole('link', { name: /begin/i });
    await expect(beginBtn).toBeVisible();
  });

  test('voice compliance — no forbidden language on welcome screen', async ({
    page,
  }) => {
    await assertVoiceCompliant(page);
  });
});
