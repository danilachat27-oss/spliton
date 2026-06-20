import { describe, expect, it } from "vitest";

import {
  classifyApiError,
  isBackendUnavailableError,
  isReadOnlyFetchError,
} from "./classify-api-error";

describe("classifyApiError", () => {
  it("classifies network TypeError as backend_unavailable", () => {
    expect(classifyApiError(new TypeError("Failed to fetch"))).toBe("backend_unavailable");
    expect(isBackendUnavailableError(new TypeError("network error"))).toBe(true);
  });

  it("classifies HTTP 503 as backend_unavailable", () => {
    expect(classifyApiError({ status: 503 })).toBe("backend_unavailable");
  });

  it("classifies HTTP 401 as auth_error", () => {
    expect(classifyApiError({ status: 401 })).toBe("auth_error");
  });

  it("classifies HTTP 403 as forbidden", () => {
    expect(classifyApiError({ status: 403, code: "FORBIDDEN" })).toBe("forbidden");
  });

  it("classifies HTTP 404 as not_found", () => {
    expect(classifyApiError({ status: 404 })).toBe("not_found");
  });

  it("classifies HTTP 422 as validation_error", () => {
    expect(classifyApiError({ status: 422 })).toBe("validation_error");
  });

  it("maps unavailable user-facing strings to backend_unavailable", () => {
    expect(classifyApiError("Данные временно недоступны. Попробуйте обновить.")).toBe(
      "backend_unavailable",
    );
    expect(classifyApiError("Server is temporarily unavailable.")).toBe("backend_unavailable");
  });

  it("treats read-only fetch failures as neutral section errors", () => {
    expect(isReadOnlyFetchError(new TypeError("fetch failed"))).toBe(true);
    expect(isReadOnlyFetchError({ status: 404 })).toBe(true);
    expect(isReadOnlyFetchError({ status: 403 })).toBe(false);
  });
});
