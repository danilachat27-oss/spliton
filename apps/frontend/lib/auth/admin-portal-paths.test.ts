import { describe, expect, it } from "vitest";

import { isAdminPortalPath } from "./admin-portal-paths";

describe("isAdminPortalPath", () => {
  it("treats /admin root and nested routes as admin portal", () => {
    expect(isAdminPortalPath("/admin")).toBe(true);
    expect(isAdminPortalPath("/admin/login")).toBe(true);
    expect(isAdminPortalPath("/admin/users")).toBe(true);
    expect(isAdminPortalPath("/admin/platform-revenue")).toBe(true);
  });

  it("does not treat public routes as admin portal", () => {
    expect(isAdminPortalPath("/login")).toBe(false);
    expect(isAdminPortalPath("/app")).toBe(false);
    expect(isAdminPortalPath("/assets/overview")).toBe(false);
  });
});
