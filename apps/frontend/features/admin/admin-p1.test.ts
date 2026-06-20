import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  canApprovePartnerApplication,
  canPatchPlatformFees,
  canSuspendPartnerApplication,
} from "@/features/admin/config/admin-rbac";
import {
  ADMIN_ROLE_MATRIX,
  canMatrixAction,
  DANGEROUS_ACTION_PHRASES,
} from "@/features/admin/config/admin-role-matrix";
import { formatApiError } from "@/lib/i18n/format-api-error";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";

const REPO_ROOT = path.resolve(__dirname, "../../../..");
const BACKEND_MATRIX = path.join(
  REPO_ROOT,
  "apps/backend/src/modules/admin/common/admin-role-matrix.ts",
);

function extractBackendMatrixSections(src: string): string[] {
  const match = src.match(
    /export type AdminMatrixSection\s*=\s*([\s\S]*?);/,
  );
  if (!match) return [];
  return [...match[1].matchAll(/\|\s*'([^']+)'/g)].map((m) => m[1]!);
}

describe("admin P1 helpers", () => {
  it("localizedAdminError sanitizes Prisma errors", () => {
    const msg = localizedAdminError(
      { code: "INTERNAL_ERROR", message: "PrismaClientKnownRequestError P2002" },
      "en",
    );
    expect(msg).not.toMatch(/Prisma/i);
  });

  it("403 maps to localized forbidden in EN", () => {
    expect(formatApiError({ code: "ADMIN_FORBIDDEN", status: 403 }, "en")).toMatch(
      /permission/i,
    );
  });

  it("only SUPER_ADMIN can patch platform fees on frontend", () => {
    expect(canPatchPlatformFees(["SUPER_ADMIN"])).toBe(true);
    expect(canPatchPlatformFees(["ADMIN"])).toBe(false);
    expect(canPatchPlatformFees(["ACCOUNTANT"])).toBe(false);
    expect(canPatchPlatformFees(["COMPLIANCE"])).toBe(false);
  });

  it("partner approve/reject roles align with backend FINANCE", () => {
    expect(canApprovePartnerApplication(["SUPER_ADMIN"])).toBe(true);
    expect(canApprovePartnerApplication(["ADMIN"])).toBe(true);
    expect(canApprovePartnerApplication(["ACCOUNTANT"])).toBe(true);
    expect(canApprovePartnerApplication(["COMPLIANCE"])).toBe(false);
    expect(canApprovePartnerApplication(["BUSINESS_ANALYST"])).toBe(false);
  });

  it("partner suspend limited to SUPER_ADMIN and COMPLIANCE", () => {
    expect(canSuspendPartnerApplication(["COMPLIANCE"])).toBe(true);
    expect(canSuspendPartnerApplication(["ACCOUNTANT"])).toBe(false);
  });

  it("settings section uses phrase confirm constant", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "sections/settings-section.tsx"),
      "utf8",
    );
    expect(src).toContain("AdminPhraseConfirmDialog");
    expect(src).toContain("confirmPhrase={DANGEROUS_ACTION_PHRASES.platformFees}");
    expect(src).not.toContain("AdminConfirmDialog");
    expect(DANGEROUS_ACTION_PHRASES.platformFees).toBe("ИЗМЕНИТЬ КОМИССИИ");
  });

  it("referrals section has no window.prompt", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "sections/referrals-section.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/window\.prompt/);
    expect(src).toContain("AdminPartnerDrawer");
    expect(src).toContain("AdminRejectReasonDialog");
  });

  it("notifications page has section guard and error retry", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "app/admin/(portal)/notifications/page.tsx"),
      "utf8",
    );
    expect(src).toContain("AdminSectionGuard");
    expect(src).toContain("AdminErrorState");
    expect(src).toContain("localizedAdminError");
  });

  it("frontend and backend AdminMatrixSection lists stay in sync", () => {
    const backendSrc = fs.readFileSync(BACKEND_MATRIX, "utf8");
    const backendSections = extractBackendMatrixSections(backendSrc).sort();
    const frontendSections = Object.keys(ADMIN_ROLE_MATRIX).sort();
    expect(frontendSections).toEqual(backendSections);
  });

  it("matrix role snapshots for P1 sections", () => {
    expect(canMatrixAction(["ACCOUNTANT"], "referrals", "approve")).toBe(true);
    expect(canMatrixAction(["ACCOUNTANT"], "treasury", "view")).toBe(true);
    expect(canMatrixAction(["SUPPORT"], "treasury", "view")).toBe(false);
    expect(canMatrixAction(["COMPLIANCE"], "legal", "view")).toBe(true);
    expect(canMatrixAction(["BUSINESS_ANALYST"], "referrals", "mutate")).toBe(false);
    expect(canMatrixAction(["SUPER_ADMIN"], "notifications", "view")).toBe(true);
  });
});
