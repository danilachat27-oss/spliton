import { describe, expect, it } from "vitest";

import { filterMetricRows, isEmptyDisplayValue } from "./display-value";

describe("display-value", () => {
  it("treats em dash as empty", () => {
    expect(isEmptyDisplayValue("—")).toBe(true);
    expect(isEmptyDisplayValue("  —  ")).toBe(true);
  });

  it("keeps meaningful values", () => {
    expect(isEmptyDisplayValue("0 USDT")).toBe(false);
    expect(isEmptyDisplayValue("Войти")).toBe(false);
  });

  it("filters metric rows", () => {
    expect(
      filterMetricRows([
        { label: "A", value: "—" },
        { label: "B", value: "12%" },
      ]),
    ).toEqual([{ label: "B", value: "12%" }]);
  });
});
