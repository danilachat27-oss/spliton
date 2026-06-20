import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { I18nProvider } from "@/components/providers/i18n-provider";

import { LanguageSelector } from "./language-selector";

describe("LanguageSelector", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows flag and short code for current locale", () => {
    const { container } = render(
      <I18nProvider initialLocale="ru">
        <LanguageSelector />
      </I18nProvider>,
    );
    expect(screen.getByText("RU")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("switches ru→en→es→pt and persists to localStorage", () => {
    render(
      <I18nProvider initialLocale="ru">
        <LanguageSelector />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Выбор языка|Choose language/i }));
    fireEvent.click(screen.getByRole("option", { name: /English/i }));
    expect(screen.getByText("EN")).toBeInTheDocument();
    expect(localStorage.getItem("spliton_locale")).toBe("en");

    fireEvent.click(screen.getByRole("button", { name: /Choose language/i }));
    fireEvent.click(screen.getByRole("option", { name: /Español/i }));
    expect(localStorage.getItem("spliton_locale")).toBe("es");

    fireEvent.click(screen.getByRole("button", { name: /Elegir idioma/i }));
    fireEvent.click(screen.getByRole("option", { name: /Português/i }));
    expect(localStorage.getItem("spliton_locale")).toBe("pt");
  });
});
