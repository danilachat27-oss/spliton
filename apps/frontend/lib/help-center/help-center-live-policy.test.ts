import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { isLiveHelpCenterEnabled } from "@/lib/public-env";

const SUPPORT_COMPONENTS = [
  "components/support/support-help-center-page.tsx",
  "components/support/support-article-page-content.tsx",
  "components/support/support-category-page-content.tsx",
];

const FORBIDDEN_STATIC = [
  "SUPPORT_FAQ_GROUPS",
  "SUPPORT_TOPIC_CARDS",
  "SUPPORT_KB_CATEGORIES",
  "SUPPORT_FEATURED_ARTICLES",
];

describe("help center live policy", () => {
  it("isLiveHelpCenterEnabled follows SUPPORT_DATA_SOURCE", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPPORT_DATA_SOURCE", "live");
    expect(isLiveHelpCenterEnabled()).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_SUPPORT_DATA_SOURCE", "mock");
    expect(isLiveHelpCenterEnabled()).toBe(false);
    vi.unstubAllEnvs();
  });

  it("support UI components do not import static FAQ constants", () => {
    const root = process.cwd();
    for (const rel of SUPPORT_COMPONENTS) {
      const src = readFileSync(join(root, rel), "utf8");
      for (const token of FORBIDDEN_STATIC) {
        expect(src.includes(token), `${rel} must not reference ${token}`).toBe(false);
      }
    }
  });

  it("support-center constants file only exposes helpdesk email", () => {
    const root = process.cwd();
    const src = readFileSync(join(root, "constants/support-center.ts"), "utf8");
    expect(src).toContain("SUPPORT_HELPDESK_EMAIL");
    for (const token of FORBIDDEN_STATIC) {
      expect(src.includes(token)).toBe(false);
    }
  });
});
