import { expect, test } from "./fixtures";
import { clickNewChat } from "./helpers/launcher";
import { expectComposerVisible } from "./helpers/composer";

interface TestAccessory {
  id: string;
  label: string;
  priority: number;
}

function registerAccessory(accessory: TestAccessory): string {
  return `
    window.__PASEO__.composerAccessoryStore.register({
      id: ${JSON.stringify(accessory.id)},
      label: ${JSON.stringify(accessory.label)},
      priority: ${accessory.priority},
      content: () => null,
    });
  `;
}

function unregisterAccessory(id: string): string {
  return `window.__PASEO__.composerAccessoryStore.unregister(${JSON.stringify(id)});`;
}

function getRegistrations(): string {
  return `window.__PASEO__.composerAccessoryStore.getRegistrations()`;
}

test.describe("Composer accessories", () => {
  test("renders registered accessories in the track above the composer", async ({
    page,
    withWorkspace,
  }) => {
    test.setTimeout(60_000);
    const workspace = await withWorkspace({ prefix: "accessories-" });
    await workspace.navigateTo();
    await clickNewChat(page);
    await expectComposerVisible(page);

    // Register two accessories via the E2E bridge.
    await page.evaluate(registerAccessory({ id: "status", label: "Agent Status", priority: 10 }));
    await page.evaluate(registerAccessory({ id: "tools", label: "Tool Usage", priority: 20 }));

    // Verify the accessories track renders.
    await expect(page.getByTestId("accessories-track")).toBeVisible();

    // Verify the bridge API returns correct registration data.
    const regs = await page.evaluate(getRegistrations);
    expect(regs).toHaveLength(2);
    expect(regs.map((r: { id: string }) => r.id).sort()).toEqual(["status", "tools"]);

    // Verify both accessory shells are rendered with correct labels.
    const statusShell = page.getByTestId("accessory-shell-status");
    const toolsShell = page.getByTestId("accessory-shell-tools");
    await expect(statusShell).toBeVisible();
    await expect(toolsShell).toBeVisible();
    await expect(statusShell).toContainText("Agent Status");
    await expect(toolsShell).toContainText("Tool Usage");
  });

  test("expand and collapse an accessory", async ({ page, withWorkspace }) => {
    test.setTimeout(60_000);
    const workspace = await withWorkspace({ prefix: "accessories-expand-" });
    await workspace.navigateTo();
    await clickNewChat(page);
    await expectComposerVisible(page);

    await page.evaluate(
      registerAccessory({ id: "expand-test", label: "Expand Test", priority: 0 }),
    );

    const toggle = page.getByTestId("accessory-shell-toggle-expand-test");
    const body = page.getByTestId("accessory-shell-body-expand-test");

    // Initially collapsed: no body visible.
    await expect(body).not.toBeVisible();

    // Expand.
    await toggle.click();
    await expect(body).toBeVisible();

    // Collapse.
    await toggle.click();
    await expect(body).not.toBeVisible();
  });

  test("single-expand: expanding one accessory collapses the other", async ({
    page,
    withWorkspace,
  }) => {
    test.setTimeout(60_000);
    const workspace = await withWorkspace({ prefix: "accessories-single-" });
    await workspace.navigateTo();
    await clickNewChat(page);
    await expectComposerVisible(page);

    await page.evaluate(registerAccessory({ id: "first", label: "First", priority: 0 }));
    await page.evaluate(registerAccessory({ id: "second", label: "Second", priority: 10 }));

    const firstToggle = page.getByTestId("accessory-shell-toggle-first");
    const firstBody = page.getByTestId("accessory-shell-body-first");
    const secondToggle = page.getByTestId("accessory-shell-toggle-second");
    const secondBody = page.getByTestId("accessory-shell-body-second");

    // Expand first.
    await firstToggle.click();
    await expect(firstBody).toBeVisible();
    await expect(secondBody).not.toBeVisible();

    // Expand second — first should collapse (single-expand).
    await secondToggle.click();
    await expect(firstBody).not.toBeVisible();
    await expect(secondBody).toBeVisible();
  });

  test("unregister removes the accessory from the track", async ({ page, withWorkspace }) => {
    test.setTimeout(60_000);
    const workspace = await withWorkspace({ prefix: "accessories-remove-" });
    await workspace.navigateTo();
    await clickNewChat(page);
    await expectComposerVisible(page);

    await page.evaluate(registerAccessory({ id: "temp", label: "Temporary", priority: 0 }));
    const tempShell = page.getByTestId("accessory-shell-temp");
    await expect(tempShell).toBeVisible();

    // Unregister.
    await page.evaluate(unregisterAccessory("temp"));
    await expect(tempShell).not.toBeVisible();

    // The track should still be present (but empty).
    // When empty, AccessoriesTrack returns null, so the testID won't be in the DOM.
    await expect(page.getByTestId("accessories-track")).not.toBeVisible();
  });

  test("accessory with badge shows the status indicator", async ({ page, withWorkspace }) => {
    test.setTimeout(60_000);
    const workspace = await withWorkspace({ prefix: "accessories-badge-" });
    await workspace.navigateTo();
    await clickNewChat(page);
    await expectComposerVisible(page);

    // Register an accessory with a badge.
    await page.evaluate(`
      window.__PASEO__.composerAccessoryStore.register({
        id: "badged",
        label: "Badged Item",
        priority: 0,
        content: () => null,
        badge: { label: "Active", variant: "success" },
      });
    `);

    const shell = page.getByTestId("accessory-shell-badged");
    await expect(shell).toBeVisible();
    // Status badge text is rendered inside the shell.
    await expect(shell).toContainText("Active");
  });

  test("re-register with same id replaces the accessory", async ({ page, withWorkspace }) => {
    test.setTimeout(60_000);
    const workspace = await withWorkspace({ prefix: "accessories-replace-" });
    await workspace.navigateTo();
    await clickNewChat(page);
    await expectComposerVisible(page);

    await page.evaluate(registerAccessory({ id: "dynamic", label: "Original", priority: 0 }));
    const shell = page.getByTestId("accessory-shell-dynamic");
    await expect(shell).toContainText("Original");

    // Replace with new label.
    await page.evaluate(registerAccessory({ id: "dynamic", label: "Replaced", priority: 5 }));
    await expect(shell).toContainText("Replaced");
    await expect(shell).not.toContainText("Original");
  });

  test("accessory action button is visible on hover (web)", async ({ page, withWorkspace }) => {
    test.setTimeout(60_000);
    const workspace = await withWorkspace({ prefix: "accessories-action-" });
    await workspace.navigateTo();
    await clickNewChat(page);
    await expectComposerVisible(page);

    await page.evaluate(`
      window.__PASEO__.composerAccessoryStore.register({
        id: "actionable",
        label: "With Action",
        priority: 0,
        content: () => null,
        action: { label: "Refresh", icon: null, onPress: () => {} },
      });
    `);

    const actionButton = page.getByTestId("accessory-shell-action-actionable");

    // On web, action buttons start hidden (opacity 0).
    await expect(actionButton).toHaveCSS("opacity", "0");

    // Hover over the shell to reveal the action.
    const shell = page.getByTestId("accessory-shell-actionable");
    await shell.hover();
    await expect(actionButton).toHaveCSS("opacity", "1");
  });
});
