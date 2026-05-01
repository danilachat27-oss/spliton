"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { RESEND_SECONDS } from "@/components/auth/register/constants";
import {
  emailErrorMessage,
  emailPattern,
  validatePasswordStep,
  type FieldErrors,
  type FormErrorState,
} from "@/components/auth/register/validation";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/components/providers/auth-provider";
import { ApiError } from "@/services/auth.service";

export type UseRegisterFlowOptions = {
  onStepChange?: (step: 1 | 2 | 3) => void;
};

export function useRegisterFlow(options?: UseRegisterFlowOptions) {
  const onStepChange = options?.onStepChange;
  const router = useRouter();
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

  const trimmedEmail = email.trim();
  const emailValid = trimmedEmail.length > 0 && emailPattern.test(trimmedEmail);
  const showEmailError = emailTouched && Boolean(emailErrorMessage(trimmedEmail));
  const emailMessage = emailTouched ? emailErrorMessage(trimmedEmail) : undefined;
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

  const goToOtpStep = React.useCallback(async () => {
    const msg = emailErrorMessage(trimmedEmail);
    setEmailTouched(true);
    if (msg) {
      setErrors((prev) => ({ ...prev, email: msg }));
      return;
    }
    clearSubmitError();
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
  }, [trimmedEmail, clearSubmitError]);

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
  }, []);

  const backToEmailFromPassword = React.useCallback(() => {
    setStep(1);
    setPassword("");
    setConfirmPassword("");
    setTermsAccepted(false);
    setOtp("");
    setErrors({});
  }, []);

  const onSubmitPasswordStep = React.useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      clearSubmitError();
      const nextErrors = validatePasswordStep({
        password,
        confirmPassword,
        termsAccepted,
      });
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      if (Object.keys(nextErrors).length > 0) return;

      setIsSubmitting(true);
      try {
        await register({
          email: trimmedEmail,
          password,
          acceptedTerms: termsAccepted,
        });
        const next = new URLSearchParams();
        next.set("email", trimmedEmail);
        router.push(`${ROUTES.verifyEmail}?${next.toString()}`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          setErrors((prev) => ({
            ...prev,
            submit: "Аккаунт с этим email уже существует.",
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
