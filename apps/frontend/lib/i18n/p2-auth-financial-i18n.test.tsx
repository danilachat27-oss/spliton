import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LoginForm } from "@/components/auth/login-form";
import { VerifyEmailScreen } from "@/components/auth/verify-email-screen";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { AUTH_MESSAGES } from "@/lib/i18n/auth-messages";
import { DICTIONARIES, messageForApiError } from "@/lib/i18n/dictionaries";
import { FINANCIAL_MESSAGES } from "@/lib/i18n/financial-messages";
import { WIDGET_MESSAGES } from "@/lib/i18n/widget-messages";
import type { AppLocale } from "@/lib/i18n/types";

const LOCALES: AppLocale[] = ["ru", "en", "es", "pt"];

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    login: vi.fn(),
    verify2fa: vi.fn(),
    verifyEmail: vi.fn(),
    resendEmail: vi.fn(),
    pendingTwoFactorChallenge: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

vi.mock("@/services/auth.service", () => ({
  signInWithGoogle: vi.fn(),
  requestPasswordReset: vi.fn(),
  ApiError: class ApiError extends Error {
    code: string;
    constructor(code: string) {
      super(code);
      this.code = code;
    }
  },
}));

function renderWithLocale(locale: AppLocale, ui: React.ReactElement) {
  return render(<I18nProvider initialLocale={locale}>{ui}</I18nProvider>);
}

function assertNoRawKeys(text: string) {
  expect(text).not.toMatch(/^auth\./);
  expect(text).not.toMatch(/^wallet\./);
  expect(text).not.toMatch(/^withdraw\./);
  expect(text).not.toMatch(/^activity\.widgets\./);
  expect(text).not.toMatch(/^calculator\./);
  expect(text).not.toMatch(/^compliance\./);
}

describe("P2 auth/financial dictionaries", () => {
  it("auth, financial, and widget messages have parity across locales", () => {
    const ruAuth = Object.keys(AUTH_MESSAGES.ru);
    const ruFin = Object.keys(FINANCIAL_MESSAGES.ru);
    const ruWidget = Object.keys(WIDGET_MESSAGES.ru);
    for (const locale of ["en", "es", "pt"] as const) {
      expect(Object.keys(AUTH_MESSAGES[locale]).sort()).toEqual(ruAuth.sort());
      expect(Object.keys(FINANCIAL_MESSAGES[locale]).sort()).toEqual(ruFin.sort());
      expect(Object.keys(WIDGET_MESSAGES[locale]).sort()).toEqual(ruWidget.sort());
    }
  });

  it("critical auth keys resolve without raw key in all locales", () => {
    const keys = [
      "auth.login.title",
      "auth.register.emailTitle",
      "auth.forgot.title",
      "auth.reset.title",
      "auth.verify.defaultTitle",
      "auth.2fa.hint",
    ];
    for (const locale of LOCALES) {
      for (const key of keys) {
        const value = DICTIONARIES[locale][key];
        expect(value, `${locale}:${key}`).toBeTruthy();
        assertNoRawKeys(value);
      }
    }
  });

  it("localized API errors for auth codes", () => {
    for (const locale of LOCALES) {
      const invalid = messageForApiError("INVALID_CREDENTIALS", locale);
      const unverified = messageForApiError("EMAIL_NOT_VERIFIED", locale);
      assertNoRawKeys(invalid);
      assertNoRawKeys(unverified);
      expect(invalid).not.toEqual(unverified);
    }
  });

  it("withdraw validation keys exist in all locales", () => {
    for (const locale of LOCALES) {
      for (const key of ["withdraw.validationAddressFormat", "withdraw.validationMinAmount"]) {
        const value = DICTIONARIES[locale][key];
        expect(value, key).toBeTruthy();
        assertNoRawKeys(value);
      }
    }
  });
});

describe("P2 auth route renders", () => {
  it.each(LOCALES)("login renders localized title (%s)", (locale) => {
    renderWithLocale(locale, <LoginForm />);
    const title = DICTIONARIES[locale]["auth.login.title"];
    expect(screen.getByRole("heading", { level: 2, name: title })).toBeInTheDocument();
  });

  it.each(LOCALES)("forgot password renders localized title (%s)", (locale) => {
    renderWithLocale(locale, <ForgotPasswordForm />);
    const title = DICTIONARIES[locale]["auth.forgot.title"];
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
  });

  it.each(LOCALES)("verify email default state (%s)", (locale) => {
    renderWithLocale(locale, <VerifyEmailScreen />);
    const title = DICTIONARIES[locale]["auth.verify.defaultTitle"];
    expect(screen.getByText(title)).toBeInTheDocument();
  });
});
