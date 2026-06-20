"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "@/lib/lucide";

import { authFieldClassName } from "@/components/auth/auth-field-classes";
import { EmailSuggestionLabel } from "@/components/auth/register/email-suggestion-label";
import { GoogleMark } from "@/components/auth/google-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/constants/routes";
import { useI18n } from "@/components/providers/i18n-provider";
import { BRAND } from "@/constants/brand";
import { signInWithGoogle } from "@/services/auth.service";
import { tf } from "@/lib/i18n/auth-messages";
import { cn } from "@/lib/utils";

export type RegisterEmailStepProps = {
  fieldStyle: React.CSSProperties;
  emailFieldRef: React.RefObject<HTMLDivElement | null>;
  email: string;
  setEmail: (value: string) => void;
  setEmailFocused: (value: boolean) => void;
  onEmailBlur: () => void;
  trimmedEmail: string;
  suggestions: string[];
  showSuggestions: boolean;
  showEmailError: boolean;
  emailMessage?: string;
  errors: { email?: string; submit?: string };
  clearError: (key: "email") => void;
  emailValid: boolean;
  isRequestingOtp: boolean;
  onContinue: () => void;
};

export function RegisterEmailStep({
  fieldStyle,
  emailFieldRef,
  email,
  setEmail,
  setEmailFocused,
  onEmailBlur,
  trimmedEmail,
  suggestions,
  showSuggestions,
  showEmailError,
  emailMessage,
  errors,
  clearError,
  emailValid,
  isRequestingOtp,
  onContinue,
}: RegisterEmailStepProps) {
  const { t } = useI18n();
  return (
    <>
      <h2 className="text-[2.25rem] font-semibold leading-none tracking-tight sm:text-[2.5rem]">
        {t("auth.register.emailTitle")}
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
        {tf(t("auth.register.emailBody"), { brand: BRAND.name })}
      </p>

      <div className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="register-email" className="text-sm font-medium text-neutral-800">
            {t("auth.register.emailLabel")}
          </Label>
          <div ref={emailFieldRef} className="relative">
            <Input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) clearError("email");
              }}
              onFocus={() => setEmailFocused(true)}
              onBlur={onEmailBlur}
              className={cn(authFieldClassName, trimmedEmail ? "pr-24" : "pr-4")}
              style={fieldStyle}
              aria-invalid={showEmailError || Boolean(errors.email)}
              aria-describedby={
                showEmailError || errors.email ? "register-email-error" : undefined
              }
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              aria-controls={showSuggestions ? "register-email-suggestions" : undefined}
            />
            {trimmedEmail ? (
              <button
                type="button"
                className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                aria-label={t("auth.register.clearField")}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setEmail("");
                  clearError("email");
                }}
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            ) : null}

            {showSuggestions ? (
              <ul
                id="register-email-suggestions"
                role="listbox"
                className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-64 overflow-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
              >
                {suggestions.map((s) => (
                  <li key={s} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={email === s}
                      className="flex w-full px-4 py-3 text-left text-[15px] transition-colors hover:bg-neutral-50"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setEmail(s);
                        clearError("email");
                        setEmailFocused(true);
                      }}
                    >
                      <EmailSuggestionLabel suggestion={s} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {(showEmailError && emailMessage) || errors.email ? (
            <p
              id="register-email-error"
              className="text-[13px] font-medium leading-snug text-rose-800"
            >
              {errors.email ?? emailMessage}
            </p>
          ) : null}
        </div>

        {errors.submit ? (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] font-medium leading-snug text-rose-900"
          >
            {errors.submit}
          </p>
        ) : null}

        <Button
          type="button"
          onClick={() => void onContinue()}
          className={cn(
            "h-[52px] w-full rounded-xl text-[15px] font-semibold transition-[background-color,transform,box-shadow,border-color,color]",
            emailValid && !isRequestingOtp
              ? "border border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800 active:translate-y-px"
              : "cursor-not-allowed border border-neutral-200 bg-neutral-100 text-neutral-400 shadow-none hover:bg-neutral-100"
          )}
          disabled={!emailValid || isRequestingOtp}
        >
          {isRequestingOtp ? t("auth.register.continueSending") : t("auth.register.continue")}
        </Button>
      </div>

      <p className="mt-8 text-center text-[15px] text-neutral-600">
        {t("auth.register.hasAccount")}{" "}
        <Link
          href={ROUTES.login}
          className="font-semibold text-neutral-900 underline decoration-neutral-900 underline-offset-4"
        >
          {t("auth.register.signIn")}
        </Link>
      </p>

      <div className="relative mt-10 py-1">
        <Separator className="bg-neutral-200" />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="bg-white px-3 text-xs font-medium text-neutral-500">
            {t("auth.login.altMethod")}
          </span>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          className="flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white text-[15px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
          onClick={async () => {
            try {
              await signInWithGoogle();
            } catch {
              /* Replace with toast when OAuth is wired. */
            }
          }}
        >
          <GoogleMark className="size-[18px] shrink-0" />
          {t("auth.login.google")}
        </button>
      </div>
    </>
  );
}
