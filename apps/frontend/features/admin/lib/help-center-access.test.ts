import { describe, expect, it } from "vitest";

import {
  canDeleteHelpContent,
  canManageHelpCategories,
  canMutateHelpArticles,
  canPublishHelpArticles,
  canViewHelpCenter,
} from "@/features/admin/lib/help-center-access";

describe("help-center-access", () => {
  it("CONTENT_MANAGER has full CMS access", () => {
    const roles = ["CONTENT_MANAGER"];
    expect(canViewHelpCenter(roles)).toBe(true);
    expect(canManageHelpCategories(roles)).toBe(true);
    expect(canMutateHelpArticles(roles)).toBe(true);
    expect(canPublishHelpArticles(roles)).toBe(true);
    expect(canDeleteHelpContent(roles)).toBe(true);
  });

  it("SUPPORT_MANAGER can publish articles but not manage categories", () => {
    const roles = ["SUPPORT_MANAGER"];
    expect(canViewHelpCenter(roles)).toBe(true);
    expect(canManageHelpCategories(roles)).toBe(false);
    expect(canMutateHelpArticles(roles)).toBe(true);
    expect(canPublishHelpArticles(roles)).toBe(true);
    expect(canDeleteHelpContent(roles)).toBe(false);
  });

  it("SUPPORT is read-only", () => {
    const roles = ["SUPPORT"];
    expect(canViewHelpCenter(roles)).toBe(true);
    expect(canManageHelpCategories(roles)).toBe(false);
    expect(canMutateHelpArticles(roles)).toBe(false);
    expect(canPublishHelpArticles(roles)).toBe(false);
    expect(canDeleteHelpContent(roles)).toBe(false);
  });

  it("INVESTOR has no help center admin access", () => {
    const roles = ["INVESTOR"];
    expect(canViewHelpCenter(roles)).toBe(false);
  });
});
