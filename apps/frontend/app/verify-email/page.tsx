import { Suspense } from "react";

import { VerifyEmailScreen } from "@/components/auth/verify-email-screen";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16 text-neutral-900">
          <h1 className="text-3xl font-semibold">Подтверждение email</h1>
          <p className="mt-4 text-neutral-600">Подготовка страницы подтверждения...</p>
        </main>
      }
    >
      <VerifyEmailScreen />
    </Suspense>
  );
}
