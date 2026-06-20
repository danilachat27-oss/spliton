import { describe, expect, it } from "vitest";

import { fieldErrorMap, fieldErrorMessage } from "./admin-form-field-errors";

describe("fieldErrorMap", () => {
  it("maps validation keys to field names", () => {
    const map = fieldErrorMap(
      ["admin.drawer.news.error.titleRequired", "admin.drawer.news.error.slugInvalid"],
      {
        "admin.drawer.news.error.titleRequired": "title",
        "admin.drawer.news.error.slugInvalid": "slug",
      },
    );
    expect(map).toEqual({
      title: "admin.drawer.news.error.titleRequired",
      slug: "admin.drawer.news.error.slugInvalid",
    });
  });

  it("returns first error per field", () => {
    const map = fieldErrorMap(
      ["admin.drawer.news.error.slugRequired", "admin.drawer.news.error.slugInvalid"],
      {
        "admin.drawer.news.error.slugRequired": "slug",
        "admin.drawer.news.error.slugInvalid": "slug",
      },
    );
    expect(map.slug).toBe("admin.drawer.news.error.slugRequired");
  });
});

describe("fieldErrorMessage", () => {
  it("translates mapped field error", () => {
    const msg = fieldErrorMessage(
      { title: "err.key" },
      "title",
      (k) => `translated:${k}`,
    );
    expect(msg).toBe("translated:err.key");
  });

  it("returns null when field has no error", () => {
    expect(fieldErrorMessage({}, "title", (k) => k)).toBeNull();
  });
});
