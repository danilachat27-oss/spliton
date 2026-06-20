import { describe, expect, it } from "vitest";

import { normalizeLocale } from "./normalize-locale";

describe("normalizeLocale", () => {
  it("maps ka to ru", () => {
    expect(normalizeLocale("ka")).toBe("ru");
  });

  it("maps invalid to ru", () => {
    expect(normalizeLocale("xx")).toBe("ru");
  });

  it("accepts es and pt", () => {
    expect(normalizeLocale("es")).toBe("es");
    expect(normalizeLocale("pt-BR")).toBe("pt");
  });
});
