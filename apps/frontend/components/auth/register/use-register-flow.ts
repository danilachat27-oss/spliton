"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { RESEND_SECONDS } from "@/components/auth/register/constants";
import { readReferralAttribution } from "@/lib/referral-attribution";
import {
  emailErrorMessage,
  emailPattern,
  validatePasswordStep,
  type FieldErrors,
  type FormErrorState,
} from "@/components/auth/register/validation";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { ApiError } from "@/services/auth.service";

export type UseRegisterFlowOptions = {
  onStepChange?: (step: 1 | 2 | 3) => void;
};

export function useRegisterFlow(options?: UseRegisterFlowOptions) {
  const onStepChange = options?.onStepChange;
  const router = useRouter();
  const { t } = useI18n();
  const { register, resendEmail } = useAuth();
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const emailFieldRef = React.useRef<HTMLDivElement>(null);

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [email, setEmail] = React.useState("");
  const [emailFocused, setEmailFocused] = React.useState(false);
  const [emailTouched, setEmailTouched] = React.useState(false);

  const [otp, setOtp] = React.useState("");
  const [resendSec, setResendSec] = React.useState(0);

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<FormErrorState>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [duplicateEmailConflict, setDuplicateEmailConflict] = React.useState(false);
  const [isResendingExistingEmail, setIsResendingExistingEmail] = React.useState(false);

  const trimmedEmail = email.trim();
  const emailValid = trimmedEmail.length > 0 && emailPattern.test(trimmedEmail);
  const showEmailError =
    emailTouched && Boolean(emailErrorMessage(trimmedEmail, t));
  const emailMessage = emailTouched ? emailErrorMessage(trimmedEmail, t) : undefined;
  const trackPlaying = !showPassword && password.length > 0;

  React.useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  React.useEffect(() => {
    if (step !== 2 || resendSec <= 0) return;
    const id = window.setTimeout(() => setResendSec((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [step, resendSec]);

  React.useEffect(() => {
    if (step === 3) {
      const id = window.requestAnimationFrame(() => passwordRef.current?.focus());
      return () => window.cancelAnimationFrame(id);
    }
  }, [step]);

  React.useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const el = emailFieldRef.current;
      if (!el || el.contains(e.target as Node)) return;
      setEmailFocused(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const clearError = React.useCallback((key: keyof FieldErrors) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearSubmitError = React.useCallback(() => {
    setErrors((prev) => {
      if (!prev.submit) return prev;
      const next = { ...prev };
      delete next.submit;
      return next;
    });
  }, []);

  const clearDuplicateConflict = React.useCallback(() => {
    setDuplicateEmailConflict(false);
  }, []);

  const goToOtpStep = React.useCallback(async () => {
    const msg = emailErrorMessage(trimmedEmail, t);
    setEmailTouched(true);
    if (msg) {
      setErrors((prev) => ({ ...prev, email: msg }));
      return;
    }
    clearSubmitError();
    clearDuplicateConflict();
    setIsRequestingOtp(true);
    try {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.email;
        return next;
      });
      setOtp("");
      setResendSec(RESEND_SECONDS);
      setStep(3);
    } finally {
      setIsRequestingOtp(false);
    }
  }, [trimmedEmail, clearSubmitError, clearDuplicateConflict]);

  const handleResendOtp = React.useCallback(async () => {
    if (resendSec > 0 || isResending) return;
    setIsResending(true);
    clearSubmitError();
    try {
      await resendEmail(trimmedEmail);
      setResendSec(RESEND_SECONDS);
    } catch {
      setErrors((prev) => ({
        ...prev,
        submit: "Не удалось отправить код повторно.",
      }));
    } finally {
      setIsResending(false);
    }
  }, [resendSec, isResending, trimmedEmail, clearSubmitError, resendEmail]);

  const onOtpComplete = React.useCallback(() => {
    setStep(3);
  }, []);

  const changeEmailFromOtp = React.useCallback(() => {
    setStep(1);
    setOtp("");
    setErrors({});
    setDuplicateEmailConflict(false);
  }, []);

  const backToEmailFromPassword = React.useCallback(() => {
    setStep(1);
    setPassword("");
    setConfirmPassword("");
    setTermsAccepted(false);
    setOtp("");
    setErrors({});
    setDuplicateEmailConflict(false);
  }, []);

  const resendForExistingEmail = React.useCallback(async () => {
    if (!trimmedEmail || isResendingExistingEmail) return;
    setIsResendingExistingEmail(true);
    try {
      await resendEmail(trimmedEmail);
      const next = new URLSearchParams();
      next.set("email", trimmedEmail);
      router.push(`${ROUTES.verifyEmail}?${next.toString()}`);
    } catch {
      setErrors((prev) => ({
        ...prev,
        submit: "Не удалось отправить письмо подтверждения. Попробуйте ещё раз.",
      }));
    } finally {
      setIsResendingExistingEmail(false);
    }
  }, [trimmedEmail, isResendingExistingEmail, resendEmail, router]);

  const onSubmitPasswordStep = React.useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      clearSubmitError();
      const nextErrors = validatePasswordStep(
        {
        password,
        confirmPassword,
        termsAccepted,
        },
        t,
      );
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      if (Object.keys(nextErrors).length > 0) return;
      setDuplicateEmailConflict(false);

      setIsSubmitting(true);
      try {
        const ref = readReferralAttribution();
        await register({
          email: trimmedEmail,
          password,
          acceptedTerms: termsAccepted,
          acceptedPrivacy: termsAccepted,
          referralCode: ref.referralCode,
          utmSource: ref.utmSource,
          utmCampaign: ref.utmCampaign,
        });
        const next = new URLSearchParams();
        next.set("email", trimmedEmail);
        router.push(`${ROUTES.verifyEmail}?${next.toString()}`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          setDuplicateEmailConflict(true);
          setErrors((prev) => ({
            ...prev,
            submit:
              "Аккаунт с этим email уже существует. Если email ещё не подтверждён, отправьте письмо повторно.",
          }));
          return;
        }
        setErrors((prev) => ({
          ...prev,
          submit: "Не удалось создать аккаунт. Попробуйте ещё раз.",
        }));
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      clearSubmitError,
      trimmedEmail,
      password,
      confirmPassword,
      termsAccepted,
      register,
      router,
    ]
  );

  return {
    step,
    emailFieldRef,
    email,
    setEmail,
    emailFocused,
    setEmailFocused,
    onEmailBlur: () => setEmailTouched(true),
    trimmedEmail,
    showEmailError,
    emailMessage,
    emailValid,
    errors,
    clearError,
    duplicateEmailConflict,
    isResendingExistingEmail,
    resendForExistingEmail,
    isRequestingOtp,
    goToOtpStep,
    otp,
    setOtp,
    onOtpComplete,
    resendSec,
    isResending,
    handleResendOtp,
    changeEmailFromOtp,
    passwordRef,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    termsAccepted,
    setTermsAccepted,
    showPassword,
    setShowPassword,
    trackPlaying,
    isSubmitting,
    onSubmitPasswordStep,
    backToEmailFromPassword,
  };
}

export type RegisterFlow = ReturnType<typeof useRegisterFlow>;
