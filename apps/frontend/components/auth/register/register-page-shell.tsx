"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { RegisterBrandPanel } from "@/components/auth/register/register-brand-panel";
import { RegisterForm } from "@/components/auth/register-form";
import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import { captureReferralFromSearchParams } from "@/lib/referral-attribution";

export function RegisterPageShell() {
  const searchParams = useSearchParams();
  const [brandStep, setBrandStep] = React.useState<1 | 2 | 3>(1);

  React.useEffect(() => {
    captureReferralFromSearchParams(searchParams);
  }, [searchParams]);

  return (
    <AuthSplitLayout brand={<RegisterBrandPanel step={brandStep} />}>
      <RegisterForm onStepChange={setBrandStep} />
    </AuthSplitLayout>
  );
}
