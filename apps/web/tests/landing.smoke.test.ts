import { test, expect } from '@playwright/test';

test.describe('Landing Page Smoke Tests', () => {
  test('loads landing page, verifies title, and checks primary call-to-action', async ({
    page,
  }) => {
    await page.goto('/');

    // 1. Verify page title
    await expect(page).toHaveTitle(/Pairly/);

    // 2. Verify primary call-to-action button "Start a room" is visible and interactive
    const startRoomBtn = page.locator('[data-testid="start-room-btn"]');
    await expect(startRoomBtn).toBeVisible();
    await expect(startRoomBtn).toContainText('Start a room');

    // 3. Verify Theme Toggle presence and state change
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible();

    const html = page.locator('html');
    const initialHasDark = await html.evaluate((el) =>
      el.classList.contains('dark')
    );

    // Click theme toggle
    await themeToggle.click();

    // Verify dark class toggled
    const toggledHasDark = await html.evaluate((el) =>
      el.classList.contains('dark')
    );
    expect(toggledHasDark).not.toBe(initialHasDark);
  });
});
