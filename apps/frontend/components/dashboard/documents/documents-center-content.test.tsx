import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { DocumentsCenterContent } from "@/components/dashboard/documents/documents-center-content";

vi.mock("@/components/dashboard/dashboard-header", () => ({
  DashboardHeader: () => null,
}));

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    accessToken: null,
    authorizedFetch: vi.fn(),
    isAuthenticated: true,
  }),
}));

vi.mock("@/components/providers/i18n-provider", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "en",
  }),
}));

vi.mock("@/lib/public-env", () => ({
  isLiveAccountEnabled: () => false,
  getPublicApiBaseUrl: () => "http://localhost:4001",
}));

describe("documents center live guards", () => {
  it("uses isLiveAccountEnabled instead of wallet data source", () => {
    const source = readFileSync(
      join(process.cwd(), "components/dashboard/documents/documents-center-content.tsx"),
      "utf8",
    );
    expect(source).toContain("isLiveAccountEnabled");
    expect(source).not.toContain("getWalletDataSource");
  });

  it("shows i18n live-required message, not hardcoded RU", () => {
    const html = renderToStaticMarkup(<DocumentsCenterContent />);
    expect(html).toContain("documents.liveRequired");
    expect(html).not.toContain("Документы и квитанции");
  });
});
