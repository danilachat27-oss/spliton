import { Suspense } from "react";

import { BrandPanel } from "@/components/auth/brand-panel";
import { LoginForm } from "@/components/auth/login-form";
import { LoginPageFallback } from "@/components/auth/login-page-fallback";
import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import { criticalPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return criticalPageMetaAsync("meta.auth.login.title", "meta.auth.login.description");
}

export default function LoginPage() {
  return (
    <AuthSplitLayout brand={<BrandPanel />}>
      <Suspense fallback={<LoginPageFallback />}>
        <LoginForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
