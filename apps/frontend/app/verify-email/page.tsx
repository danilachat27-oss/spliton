import { Suspense } from "react";

import { BrandPanel } from "@/components/auth/brand-panel";
import { VerifyEmailPageFallback } from "@/components/auth/verify-email-page-fallback";
import { VerifyEmailScreen } from "@/components/auth/verify-email-screen";
import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import { criticalPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return criticalPageMetaAsync("meta.auth.verify.title", "meta.auth.verify.description");
}

export default function VerifyEmailPage() {
  return (
    <AuthSplitLayout brand={<BrandPanel />}>
      <Suspense fallback={<VerifyEmailPageFallback />}>
        <VerifyEmailScreen />
      </Suspense>
    </AuthSplitLayout>
  );
}
