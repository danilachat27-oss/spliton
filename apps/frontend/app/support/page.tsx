import { SupportHelpCenterPage } from "@/components/support/support-help-center-page";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { supportPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return supportPageMetaAsync("meta.support.title", "meta.support.description");
}

export default function SupportRoutePage() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-black">
      <DashboardHeader />
      <main className="relative z-10 flex-1 text-white">
        <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-10 sm:px-6 sm:pt-12 lg:px-8">
          <SupportHelpCenterPage />
        </div>
      </main>
    </div>
  );
}
