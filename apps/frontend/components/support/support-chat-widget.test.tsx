import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { I18nProvider } from "@/components/providers/i18n-provider";

const mocks = vi.hoisted(() => ({
  isLiveSupportContactMode: vi.fn(() => false),
}));

vi.mock("@/lib/support/support-contact-mode", () => ({
  isLiveSupportContactMode: mocks.isLiveSupportContactMode,
}));

import { SupportChatWidget } from "./support-chat-widget";

describe("SupportChatWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("live mode shows email-only panel without demo chat", () => {
    mocks.isLiveSupportContactMode.mockReturnValue(true);

    render(
      <I18nProvider initialLocale="ru">
        <SupportChatWidget />
      </I18nProvider>,
    );

    expect(screen.getByText(/Обращения по email/i)).toBeInTheDocument();
    expect(screen.queryByText(/Демо-чат/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Начать чат/i })).not.toBeInTheDocument();
  });

  it("mock/dev mode shows demo chat entry", () => {
    mocks.isLiveSupportContactMode.mockReturnValue(false);

    render(
      <I18nProvider initialLocale="ru">
        <SupportChatWidget />
      </I18nProvider>,
    );

    expect(screen.getByText(/Демо-чат Spliton/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Начать чат/i })).toBeInTheDocument();
  });
});
