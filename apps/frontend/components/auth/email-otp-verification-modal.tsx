"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { X } from "@/lib/lucide";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

function maskEmailForOtp(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0] ?? ""}****@${domain}`;
  if (local.length <= 4) return `${local.slice(0, 1)}****@${domain}`;
  return `${local.slice(0, 2)}****${local.slice(-1)}@${domain}`;
}

export type EmailOtpVerificationModalProps = {
  open: boolean;
  email: string;
  otp: string;
  onOtpChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  title: string;
  bodyTemplate: string;
  troubleLabel: string;
  resendCountdownLabel: string;
  resendAgainLabel: string;
  resendSendingLabel: string;
  confirmLabel: string;
  closeLabel: string;
  changeEmailLabel: string;
  submitError?: string;
  resendSec: number;
  isResending: boolean;
  onResend: () => void;
  onChangeEmail: () => void;
};

export function EmailOtpVerificationModal({
  open,
  email,
  otp,
  onOtpChange,
  onConfirm,
  onClose,
  title,
  bodyTemplate,
  troubleLabel,
  resendCountdownLabel,
  resendAgainLabel,
  resendSendingLabel,
  confirmLabel,
  closeLabel,
  changeEmailLabel,
  submitError,
  resendSec,
  isResending,
  onResend,
  onChangeEmail,
}: EmailOtpVerificationModalProps) {
  const canConfirm = otp.length === 6;
  const maskedEmail = maskEmailForOtp(email);
  const bodyText = bodyTemplate.replace("{email}", maskedEmail);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 px-4 py-6 sm:px-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-otp-title"
        className="relative w-full max-w-[420px] rounded-xl bg-white px-6 pb-6 pt-5 shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 transition-colors hover:text-neutral-700"
          aria-label={closeLabel}
        >
          <X className="size-5" strokeWidth={1.75} aria-hidden />
        </button>

        <h2
          id="email-otp-title"
          className="pr-8 text-left text-[1.25rem] font-bold leading-snug tracking-tight text-neutral-900"
        >
          {title}
        </h2>
        <p className="mt-2.5 text-left text-[14px] leading-relaxed text-neutral-500">{bodyText}</p>

        <div className="mt-7">
          <InputOTP
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={onOtpChange}
            containerClassName="w-full"
          >
            <InputOTPGroup className="w-full gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {submitError ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] font-medium leading-snug text-rose-900"
          >
            {submitError}
          </p>
        ) : null}

        <div className="mt-7 flex items-end justify-between gap-4">
          <div className="min-w-0 space-y-1 text-left">
            <p className="text-[13px] font-medium text-neutral-700">{troubleLabel}</p>
            {resendSec > 0 || isResending ? (
              <p className="text-[13px] text-neutral-400">
                {isResending ? resendSendingLabel : resendCountdownLabel}
              </p>
            ) : (
              <button
                type="button"
                className="text-left text-[13px] text-neutral-400 transition-colors hover:text-neutral-600"
                onClick={() => void onResend()}
              >
                {resendAgainLabel}
              </button>
            )}
            <button
              type="button"
              className="block pt-1 text-left text-[12px] text-neutral-500 underline decoration-neutral-300 underline-offset-2 transition-colors hover:text-neutral-800"
              onClick={onChangeEmail}
            >
              {changeEmailLabel}
            </button>
          </div>

          <Button
            type="button"
            className={cn(
              "h-11 shrink-0 rounded-full px-7 text-[15px] font-semibold shadow-none transition-colors",
              canConfirm
                ? "border border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800"
                : "border border-transparent bg-[#EBEBEB] text-white hover:bg-[#EBEBEB]",
            )}
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
