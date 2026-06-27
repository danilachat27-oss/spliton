import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Admin updates module", () => {
  it("registers updates routes in admin sections config", () => {
    const source = readFileSync(
      join(__dirname, "../config/admin-sections.ts"),
      "utf8",
    );
    expect(source).toContain('id: "updates"');
    expect(source).toContain("ROUTES.adminUpdates");
  });

  it("mounts AdminUpdateNotice in admin layout", () => {
    const source = readFileSync(
      join(__dirname, "../components/admin-layout-client.tsx"),
      "utf8",
    );
    expect(source).toContain("AdminUpdateNotice");
  });

  it("notice component loads active updates and supports dismiss", () => {
    const source = readFileSync(
      join(__dirname, "../components/admin-update-notice.tsx"),
      "utf8",
    );
    expect(source).toContain("fetchAdminUpdatesActive");
    expect(source).toContain("dismissAdminUpdate");
    expect(source).toContain("admin.updates.dismiss");
  });

  it("history section loads updates and hides manage for read-only matrix", () => {
    const source = readFileSync(join(__dirname, "admin-updates-section.tsx"), "utf8");
    expect(source).toContain("fetchAdminUpdatesHistory");
    expect(source).toContain('canMatrixAction(user?.roles, "updates", "mutate")');
    expect(source).toContain("admin.updates.empty");
  });

  it("manage section is gated by updates mutate permission", () => {
    const source = readFileSync(
      join(__dirname, "admin-updates-manage-section.tsx"),
      "utf8",
    );
    expect(source).toContain('canMatrixAction(user?.roles, "updates", "mutate")');
    expect(source).toContain("AdminReadOnlyBanner");
  });
});
