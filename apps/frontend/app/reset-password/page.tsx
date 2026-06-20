import { Suspense } from "react";

import { BrandPanel } from "@/components/auth/brand-panel";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { ResetPasswordPageFallback } from "@/components/auth/reset-password-page-fallback";
import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import { criticalPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return criticalPageMetaAsync("meta.auth.reset.title", "meta.auth.reset.description");
}

export default function ResetPasswordPage() {
  return (
    <AuthSplitLayout brand={<BrandPanel />}>
      <Suspense fallback={<ResetPasswordPageFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
