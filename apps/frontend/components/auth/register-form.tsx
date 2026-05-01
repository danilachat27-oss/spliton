"use client";

import * as React from "react";

import { AUTH_FIELD_BORDER } from "@/components/auth/auth-field-classes";
import {
  getEmailSuggestions,
  shouldShowEmailSuggestions,
} from "@/components/auth/register/email-suggestions";
import { RegisterEmailStep } from "@/components/auth/register/register-email-step";
import { RegisterOtpStep } from "@/components/auth/register/register-otp-step";
import { RegisterPasswordStep } from "@/components/auth/register/register-password-step";
import {
  useRegisterFlow,
  type UseRegisterFlowOptions,
} from "@/components/auth/register/use-register-flow";
import { cn } from "@/lib/utils";

type RegisterFormProps = {
  className?: string;
} & UseRegisterFlowOptions;

export function RegisterForm({ className, onStepChange }: RegisterFormProps) {
  const flow = useRegisterFlow({ onStepChange });
  const suggestions = React.useMemo(() => getEmailSuggestions(flow.email), [flow.email]);
  const showSuggestions =
    flow.emailFocused && shouldShowEmailSuggestions(flow.email);
  const fieldStyle = { borderColor: AUTH_FIELD_BORDER } as React.CSSProperties;

  return (
    <div className={cn("w-full text-neutral-900", className)}>
      {flow.step === 1 ? (
        <RegisterEmailStep
          fieldStyle={fieldStyle}
          emailFieldRef={flow.emailFieldRef}
          email={flow.email}
          setEmail={flow.setEmail}
          setEmailFocused={flow.setEmailFocused}
          onEmailBlur={flow.onEmailBlur}
          trimmedEmail={flow.trimmedEmail}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          showEmailError={flow.showEmailError}
          emailMessage={flow.emailMessage}
          errors={{ email: flow.errors.email, submit: flow.errors.submit }}
          clearError={flow.clearError}
          emailValid={flow.emailValid}
          isRequestingOtp={flow.isRequestingOtp}
          onContinue={flow.goToOtpStep}
        />
      ) : null}

      {flow.step === 2 ? (
        <RegisterOtpStep
          trimmedEmail={flow.trimmedEmail}
          otp={flow.otp}
          setOtp={flow.setOtp}
          onComplete={flow.onOtpComplete}
          submitError={flow.errors.submit}
          resendSec={flow.resendSec}
          isResending={flow.isResending}
          onResend={flow.handleResendOtp}
          onChangeEmail={flow.changeEmailFromOtp}
        />
      ) : null}

      {flow.step === 3 ? (
        <RegisterPasswordStep
          fieldStyle={fieldStyle}
          passwordRef={flow.passwordRef}
          trimmedEmail={flow.trimmedEmail}
          password={flow.password}
          setPassword={flow.setPassword}
          confirmPassword={flow.confirmPassword}
          setConfirmPassword={flow.setConfirmPassword}
          termsAccepted={flow.termsAccepted}
          setTermsAccepted={flow.setTermsAccepted}
          showPassword={flow.showPassword}
          setShowPassword={flow.setShowPassword}
          trackPlaying={flow.trackPlaying}
          errors={{
            password: flow.errors.password,
            confirmPassword: flow.errors.confirmPassword,
            terms: flow.errors.terms,
            submit: flow.errors.submit,
          }}
          clearError={flow.clearError}
          isSubmitting={flow.isSubmitting}
          duplicateEmailConflict={flow.duplicateEmailConflict}
          isResendingExistingEmail={flow.isResendingExistingEmail}
          onResendExistingEmail={flow.resendForExistingEmail}
          onSubmit={flow.onSubmitPasswordStep}
          onBackToEmail={flow.backToEmailFromPassword}
        />
      ) : null}
    </div>
  );
}
