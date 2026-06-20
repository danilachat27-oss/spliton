import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("DisputesSection guards", () => {
  it("uses admin disputes API paths and drawer", () => {
    const source = readFileSync(join(__dirname, "disputes-section.tsx"), "utf8");
    expect(source).toContain("listAdminDisputesPaginated");
    expect(source).toContain("AdminDisputeDrawer");
    expect(source).toContain("localizedAdminError");
  });

  it("registers admin disputes route in sections config", () => {
    const source = readFileSync(
      join(__dirname, "../config/admin-sections.ts"),
      "utf8",
    );
    expect(source).toContain('id: "disputes"');
    expect(source).toContain("ROUTES.adminDisputes");
  });
});
