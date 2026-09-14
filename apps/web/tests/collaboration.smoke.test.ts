import { test, expect } from '@playwright/test';

test.describe('Collaborative Multi-User Room Join & Editor Synchronization', () => {
  test('visitor joining room link is prompted for name and both peers collaborate in editor', async ({
    browser,
  }) => {
    const roomCode = `test-room-${Date.now()}`;

    // Context 1: Host "Alice"
    const contextAlice = await browser.newContext();
    const pageAlice = await contextAlice.newPage();

    await pageAlice.goto(`/room/${roomCode}`);

    // Alice arrives via direct link with no prior session, so prompt is shown
    const promptModalAlice = pageAlice.locator('[data-testid="join-room-prompt-modal"]');
    await expect(promptModalAlice).toBeVisible({ timeout: 5000 });

    // Alice enters name and submits
    const nameInputAlice = pageAlice.locator('[data-testid="guest-name-input"]');
    await nameInputAlice.fill('Alice Developer');
    await pageAlice.locator('[data-testid="submit-join-room-btn"]').click();

    // Verify modal closes and editor mounts
    await expect(promptModalAlice).not.toBeVisible();
    const editorAlice = pageAlice.locator('[data-testid="editor-textarea"]');
    await expect(editorAlice).toBeVisible({ timeout: 5000 });

    // Context 2: Visitor "Bob" joins the same room in an isolated context
    const contextBob = await browser.newContext();
    const pageBob = await contextBob.newPage();

    await pageBob.goto(`/room/${roomCode}`);

    // Verify Bob is prompted for name (Fixing user-reported issue)
    const promptModalBob = pageBob.locator('[data-testid="join-room-prompt-modal"]');
    await expect(promptModalBob).toBeVisible({ timeout: 5000 });

    // Bob enters name and submits
    const nameInputBob = pageBob.locator('[data-testid="guest-name-input"]');
    await nameInputBob.fill('Bob Engineer');
    await pageBob.locator('[data-testid="submit-join-room-btn"]').click();

    // Verify Bob enters the room
    await expect(promptModalBob).not.toBeVisible();
    const editorBob = pageBob.locator('[data-testid="editor-textarea"]');
    await expect(editorBob).toBeVisible({ timeout: 5000 });

    // Both users have the collaborative editor open
    await expect(pageAlice.locator('[data-testid="presence-bar"]')).toBeVisible();
    await expect(pageBob.locator('[data-testid="presence-bar"]')).toBeVisible();

    await contextAlice.close();
    await contextBob.close();
  });
});
