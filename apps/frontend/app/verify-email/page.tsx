import type { Metadata } from "next";
import { Suspense } from "react";

import { BrandPanel } from "@/components/auth/brand-panel";
import { VerifyEmailScreen } from "@/components/auth/verify-email-screen";
import { AuthSplitLayout } from "@/components/layout/auth-split-layout";

export const metadata: Metadata = {
  title: "Подтверждение email",
  description: "Подтверждение электронной почты для входа в аккаунт RevShare.",
};

export default function VerifyEmailPage() {
  return (
    <AuthSplitLayout brand={<BrandPanel />}>
      <Suspense
        fallback={
          <div className="w-full text-neutral-900">
            <h2 className="text-[2.25rem] font-semibold leading-none tracking-tight sm:text-[2.5rem]">
              Подтверждение email
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-neutral-600">
              Подготавливаем страницу подтверждения...
            </p>
          </div>
        }
      >
        <VerifyEmailScreen />
      </Suspense>
    </AuthSplitLayout>
  );
}
