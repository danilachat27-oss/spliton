import { test, expect } from "@playwright/test";

import { ROUTES } from "../../constants/routes";
import { mockStaffSession, sectionForbiddenHeading } from "../helpers/mock-staff-session";

test.describe("Admin P1 — fees readonly", () => {
  test("BUSINESS_ANALYST settings blocked in UI", async ({ page }) => {
    await mockStaffSession(page, { roles: ["BUSINESS_ANALYST"] });
    await page.goto("/admin/settings");
    await expect(page.getByText(sectionForbiddenHeading())).toBeVisible({ timeout: 30_000 });
  });

  test("SUPER_ADMIN sees fee save on settings", async ({ page }) => {
    await mockStaffSession(page, { roles: ["SUPER_ADMIN"] });
    await page.route("**/platform-fees**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          json: {
            primaryPurchaseFeePct: "2.5",
            withdrawalFeeUsdt: "5",
            secondaryMarketFeePct: "1",
            premiumMonthlyUsdt: "0",
          },
        });
        return;
      }
      await route.continue();
    });
    await page.goto(ROUTES.admin);
    await expect(page.getByTestId("admin-nav-settings")).toBeVisible({ timeout: 30_000 });
    await page.goto("/admin/settings");
    await expect(page.getByRole("button", { name: /сохранить комиссии/i })).toBeVisible({
      timeout: 30_000,
    });
  });
});

test.describe("Admin P1 — referrals UX", () => {
  test("referrals page loads partner table actions", async ({ page }) => {
    await mockStaffSession(page, { roles: ["SUPER_ADMIN"] });
    await page.route("**/referrals/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/summary")) {
        await route.fulfill({
          json: { totalInvites: 0, pendingRewards: 0, pendingPartnerApplications: 1, topReferrers: [] },
        });
        return;
      }
      if (url.includes("/rewards")) {
        await route.fulfill({ json: { items: [] } });
        return;
      }
      if (url.includes("/partners")) {
        await route.fulfill({
          json: {
            items: [
              {
                id: "p-1",
                userId: "u-1",
                userEmail: "partner@example.com",
                partnerType: "AFFILIATE",
                status: "APPLIED",
                statusLabel: "Заявка отправлена",
                tier: "BRONZE",
                commissionPercent: null,
                payoutMethod: "USDT",
                applicationNote: "Test",
                rejectedReason: null,
                approvedAt: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          },
        });
        return;
      }
      await route.continue();
    });
    await page.goto(ROUTES.admin);
    await expect(page.getByTestId("admin-nav-referrals")).toBeVisible({ timeout: 30_000 });
    await page.goto(ROUTES.adminReferrals);
    await expect(page.getByRole("button", { name: "Открыть" })).toBeVisible({ timeout: 30_000 });
  });
});

test.describe("Admin P1 — notifications", () => {
  test("notifications page loads with guard and empty state", async ({ page }) => {
    await mockStaffSession(page, { roles: ["SUPER_ADMIN"] });
    await page.route("**/api/admin/v1/notifications**", async (route) => {
      const url = route.request().url();
      if (url.includes("/unread-count")) {
        await route.fulfill({ json: { count: 0 } });
        return;
      }
      if (route.request().method() === "GET") {
        await route.fulfill({ json: { items: [], total: 0, page: 1, pageSize: 50, hasMore: false } });
        return;
      }
      await route.continue();
    });
    await page.goto(ROUTES.admin);
    await page.goto("/admin/notifications");
    await expect(page.getByText(/операторские уведомления/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/загрузка уведомлений/i)).toBeHidden({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /прочитать все/i })).toBeVisible();
  });

  test("notifications API error shows retry", async ({ page }) => {
    await mockStaffSession(page, { roles: ["SUPER_ADMIN"] });
    await page.route("**/api/admin/v1/notifications**", async (route) => {
      await route.fulfill({ status: 500, json: { code: "INTERNAL_ERROR" } });
    });
    await page.goto(ROUTES.admin);
    await page.goto("/admin/notifications");
    await expect(page.getByRole("button", { name: /повторить/i })).toBeVisible({ timeout: 30_000 });
  });
});
