import { BrandPanel } from "@/components/auth/brand-panel";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import { criticalPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return criticalPageMetaAsync("meta.auth.forgot.title", "meta.auth.forgot.description");
}

export default function ForgotPasswordPage() {
  return (
    <AuthSplitLayout brand={<BrandPanel />}>
      <ForgotPasswordForm />
    </AuthSplitLayout>
  );
}
