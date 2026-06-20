"use client";

import * as React from "react";
import Link from "next/link";

import { authFieldClassName } from "@/components/auth/auth-field-classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/providers/i18n-provider";
import { BRAND } from "@/constants/brand";
import { ROUTES } from "@/constants/routes";
import { tf } from "@/lib/i18n/auth-messages";
import { formatApiError } from "@/lib/i18n/format-api-error";
import { forgotPasswordRequest } from "@/services/auth.service";

export function ForgotPasswordForm() {
  const { locale, t } = useI18n();
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await forgotPasswordRequest(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError(formatApiError(err, locale) || t("auth.forgot.error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full text-neutral-900">
      <h2 className="text-[2.25rem] font-semibold leading-none tracking-tight sm:text-[2.5rem]">
        {t("auth.forgot.title")}
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
        {tf(t("auth.forgot.body"), { brand: BRAND.name })}
      </p>

      {submitted ? (
        <div className="mt-8 space-y-4">
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            {t("auth.forgot.success")}
          </p>
          <Link
            href={ROUTES.login}
            className="inline-flex text-sm font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
          >
            {t("auth.forgot.backToLogin")}
          </Link>
        </div>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="forgot-email" className="text-sm font-medium text-neutral-800">
              {t("auth.forgot.emailLabel")}
            </Label>
            <Input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authFieldClassName}
              placeholder="name@example.com"
            />
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <Button
            type="submit"
            className="mt-2 h-[52px] w-full rounded-xl border border-neutral-900 bg-neutral-900 text-[15px] font-semibold text-white transition-[background-color,transform] hover:bg-neutral-800 active:translate-y-px disabled:opacity-50"
            disabled={isSubmitting}
          >
            {t("auth.forgot.submit")}
          </Button>

          <p className="text-center text-sm text-neutral-600">
            <Link
              href={ROUTES.login}
              className="font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
            >
              {t("auth.forgot.backLink")}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
