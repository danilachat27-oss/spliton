import { test, expect } from "@playwright/test";

import { ROUTES } from "../../constants/routes";
import { mockStaffSession } from "../helpers/mock-staff-session";
import { mockPaymentRequisitesApi } from "../helpers/mock-payment-requisites-api";

test.describe("Admin payment requisites smoke", () => {
  test.beforeEach(async ({ page }) => {
    await mockPaymentRequisitesApi(page);
  });

  test("SUPER_ADMIN opens page and renders all tabs", async ({ page }) => {
    await mockStaffSession(page, { roles: ["SUPER_ADMIN"] });
    await page.goto(ROUTES.adminPaymentRequisites);
    await expect(page.getByTestId("pr-tab-settings")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("pr-save-btn")).toBeVisible();

    await page.getByTestId("pr-tab-pool").click();
    await expect(page.getByTestId("pr-pool-add-btn")).toBeVisible();

    await page.getByTestId("pr-tab-preview").click();
    await expect(page.getByTestId("pr-preview-lang-en")).toBeVisible();

    await page.getByTestId("pr-tab-history").click();
    await expect(page.getByText(/update · deposit_network_settings/i)).toBeVisible();
  });

  test("ACCOUNTANT can save settings with confirmation", async ({ page }) => {
    await mockStaffSession(page, { roles: ["ACCOUNTANT"] });
    await page.goto(ROUTES.adminPaymentRequisites);
    await expect(page.getByTestId("pr-save-btn")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("pr-save-btn").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: /подтвердить|confirm/i }).click();
    await expect(page.getByText(/сохранен|saved/i)).toBeVisible({ timeout: 10_000 });
  });

  test("SUPPORT is read-only — no save or pool actions", async ({ page }) => {
    await mockStaffSession(page, { roles: ["SUPPORT"] });
    await page.goto(ROUTES.adminPaymentRequisites);
    await expect(page.getByTestId("pr-tab-settings")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("pr-save-btn")).toHaveCount(0);
    await page.getByTestId("pr-tab-pool").click();
    await expect(page.getByTestId("pr-pool-add-btn")).toHaveCount(0);
  });

  test("invalid TRC20 address shows validation error", async ({ page }) => {
    await mockStaffSession(page, { roles: ["SUPER_ADMIN"] });
    await page.goto(ROUTES.adminPaymentRequisites);
    await page.getByTestId("pr-tab-pool").click();
    await page.locator("#pr-addr").fill("not-a-tron-address");
    await page.getByTestId("pr-pool-add-btn").click();
    await page.getByRole("button", { name: /подтвердить|confirm/i }).click();
    await expect(page.getByTestId("pr-pool-error")).toBeVisible({ timeout: 10_000 });
  });

  test("preview switches locale", async ({ page }) => {
    await mockStaffSession(page, { roles: ["SUPER_ADMIN"] });
    await page.goto(ROUTES.adminPaymentRequisites);
    await page.getByTestId("pr-tab-preview").click();
    await expect(page.getByText(/Copy the address and send USDT|Send USDT TRC20 only/i)).toBeVisible({
      timeout: 30_000,
    });
    await page.getByTestId("pr-preview-lang-es").click();
    await expect(page.getByText(/Copie la dirección y envíe USDT/i)).toBeVisible({ timeout: 10_000 });
  });

  test("settings form has ES/PT locale tabs", async ({ page }) => {
    await mockStaffSession(page, { roles: ["SUPER_ADMIN"] });
    await page.goto(ROUTES.adminPaymentRequisites);
    await page.getByTestId("pr-locale-es").click();
    await expect(page.locator("#pr-warn-es")).toBeVisible();
    await page.getByTestId("pr-locale-pt").click();
    await expect(page.locator("#pr-inst-pt")).toBeVisible();
  });
});

test.describe("Admin payment requisites route guard", () => {
  test("regular user cannot access admin payment requisites", async ({ page }) => {
    await page.goto(ROUTES.adminPaymentRequisites);
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 30_000 });
  });
});
