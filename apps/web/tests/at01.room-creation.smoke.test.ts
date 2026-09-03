import { test, expect } from '@playwright/test';

test.describe('AT-01: Instant Guest Room Creation & Routing', () => {
  test('visitor lands on home page, creates room, and arrives at room IDE within 10 seconds', async ({
    page,
  }) => {
    // 1. Visitor lands on home page
    const startTime = Date.now();
    await page.goto('/');

    await expect(page).toHaveTitle(/Pairly/);

    // 2. Locate and click primary "Start a room" CTA
    const startRoomBtn = page.locator('[data-testid="start-room-btn"]');
    await expect(startRoomBtn).toBeVisible();

    await startRoomBtn.click();

    // 3. Verify transition to Room IDE URL (/room/[code]) within 10 seconds
    await page.waitForURL(/\/room\/[a-zA-Z0-9_-]+/, { timeout: 10000 });

    const elapsedMs = Date.now() - startTime;
    expect(elapsedMs).toBeLessThanOrEqual(10000);

    // 4. Verify Room IDE workspace components are loaded
    const roomIde = page.locator('[data-testid="room-ide"]');
    await expect(roomIde).toBeVisible();

    const roomCodeBadge = page.locator('[data-testid="room-code"]');
    await expect(roomCodeBadge).toBeVisible();

    const editorViewport = page.locator('[data-testid="room-editor"]');
    await expect(editorViewport).toBeVisible();
  });
});
