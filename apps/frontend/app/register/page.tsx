import { Suspense } from "react";

import { RegisterPageShell } from "@/components/auth/register/register-page-shell";
import { criticalPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return criticalPageMetaAsync("meta.auth.register.title", "meta.auth.register.description");
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-black" aria-hidden />}>
      <RegisterPageShell />
    </Suspense>
  );
}
