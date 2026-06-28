"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { LegalPolicyPublicView } from "@/components/legal/legal-policy-public-view";

export function TermsPageContent() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f6f7f9]">
      <DashboardHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <LegalPolicyPublicView typeParam="terms_of_service" />
      </main>
    </div>
  );
}
