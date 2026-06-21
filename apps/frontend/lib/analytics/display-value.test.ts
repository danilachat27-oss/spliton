import { describe, expect, it } from "vitest";

import { emptyDateLabel, emptyValueLabel, filterMetricRows, isEmptyDisplayValue } from "./display-value";

describe("display-value", () => {
  it("treats dash markers as empty", () => {
    expect(isEmptyDisplayValue("-")).toBe(true);
    expect(isEmptyDisplayValue("  \u2014  ")).toBe(true);
  });

  it("keeps meaningful values and human-readable empty labels", () => {
    expect(isEmptyDisplayValue(emptyValueLabel("ru"))).toBe(false);
    expect(isEmptyDisplayValue("0 USDT")).toBe(false);
    expect(isEmptyDisplayValue("Войти")).toBe(false);
  });

  it("filters metric rows", () => {
    expect(
      filterMetricRows([
        { label: "A", value: "-" },
        { label: "B", value: "12%" },
      ]),
    ).toEqual([{ label: "B", value: "12%" }]);
  });

  it("emptyDateLabel is localized", () => {
    expect(emptyDateLabel("ru")).toBe("Дата не указана");
    expect(emptyDateLabel("en")).toBe("Date not specified");
  });
});
