import { describe, expect, it, vi, beforeEach } from "vitest";

import { ADMIN_API_PATHS } from "@/features/admin/api/admin-api.config";
import {
  archiveAdminHelpArticle,
  publishAdminHelpArticle,
} from "@/services/admin/adminHelpCenter.service";

const mockClient = {
  patch: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
  getPaginated: vi.fn(),
};

vi.mock("@/features/admin/api/admin-api.config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/admin/api/admin-api.config")>();
  return {
    ...actual,
    getAdminDataSource: () => "live" as const,
  };
});

describe("adminHelpCenter publish/archive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("publishAdminHelpArticle calls publish endpoint", async () => {
    const published = { id: "art-1", status: "published" as const };
    mockClient.patch.mockResolvedValue(published);

    const result = await publishAdminHelpArticle("art-1", mockClient as never);

    expect(mockClient.patch).toHaveBeenCalledWith(ADMIN_API_PATHS.helpArticlePublish("art-1"), {});
    expect(result.status).toBe("published");
  });

  it("archiveAdminHelpArticle calls archive endpoint", async () => {
    const archived = { id: "art-1", status: "archived" as const };
    mockClient.patch.mockResolvedValue(archived);

    const result = await archiveAdminHelpArticle("art-1", mockClient as never);

    expect(mockClient.patch).toHaveBeenCalledWith(ADMIN_API_PATHS.helpArticleArchive("art-1"), {});
    expect(result.status).toBe("archived");
  });
});
