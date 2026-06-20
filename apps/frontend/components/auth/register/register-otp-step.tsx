"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Music } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

export type RegisterOtpStepProps = {
  trimmedEmail: string;
  otp: string;
  setOtp: (value: string) => void;
  onComplete: () => void;
  submitError?: string;
  resendSec: number;
  isResending: boolean;
  onResend: () => void;
  onChangeEmail: () => void;
};

function OtpSlotNote({ index, digit }: { index: number; digit: string | undefined }) {
  const filled = Boolean(digit && digit !== " ");

  return (
    <div
      className="pointer-events-none flex h-5 w-full shrink-0 items-start justify-center"
      aria-hidden
    >
      {filled ? (
        <span
          className={cn(
            "inline-flex origin-bottom",
            index % 2 === 0 ? "-rotate-[7deg]" : "rotate-[7deg]"
          )}
        >
          <Music
            key={`${index}-${digit}`}
            className="size-[14px] text-teal-800/55 animate-revshare-otp-note"
            strokeWidth={1.65}
          />
        </span>
      ) : null}
    </div>
  );
}

export function RegisterOtpStep({
  trimmedEmail,
  otp,
  setOtp,
  onComplete,
  submitError,
  resendSec,
  isResending,
  onResend,
  onChangeEmail,
}: RegisterOtpStepProps) {
  return (
    <>
      <h2 className="text-balance text-[1.65rem] font-semibold leading-tight tracking-tight sm:text-[2rem]">
        Введите 6-значный код, отправленный на вашу электронную почту
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
        Код отправлен на адрес{" "}
        <span className="font-semibold text-neutral-900">{trimmedEmail}</span>. Если письма нет
        во входящих, проверьте папку «Спам».
      </p>

      <div className="mt-10 flex justify-center">
        <InputOTP
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          inputMode="numeric"
          autoComplete="one-time-code"
          value={otp}
          onChange={setOtp}
          onComplete={onComplete}
          containerClassName="items-start gap-2 sm:gap-2.5"
        >
          <InputOTPGroup className="items-start gap-2 sm:gap-2.5">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <InputOTPSlot index={i} />
                <OtpSlotNote index={i} digit={otp[i]} />
              </div>
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      {submitError ? (
        <p
          role="alert"
          className="mt-8 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-center text-[13px] font-medium leading-snug text-rose-900"
        >
          {submitError}
        </p>
      ) : null}

      <div className="mt-10">
        <Button
          type="button"
          variant="secondary"
          className={cn(
            "h-[52px] w-full rounded-full border border-neutral-200 bg-neutral-100 text-[15px] font-medium text-neutral-500 shadow-none",
            resendSec === 0 &&
              !isResending &&
              "border-neutral-200 bg-neutral-100 text-neutral-900 hover:bg-neutral-200/80"
          )}
          disabled={resendSec > 0 || isResending}
          onClick={() => void onResend()}
        >
          {isResending
            ? "Отправляем…"
            : resendSec > 0
              ? `Отправить ещё раз (${resendSec}s)`
              : "Отправить ещё раз"}
        </Button>
      </div>

      <p className="mt-10 text-center text-[13px] leading-relaxed text-neutral-500">
        Не удаётся пройти аутентификацию?{" "}
        <button
          type="button"
          className="font-semibold text-neutral-900 underline decoration-neutral-900 underline-offset-4"
          onClick={onChangeEmail}
        >
          изменить email
        </button>
      </p>
    </>
  );
}
