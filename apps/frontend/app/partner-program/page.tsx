import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PartnerProgramScreen } from "@/components/partner-program/partner-program-screen";
import { partnerPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return partnerPageMetaAsync("meta.partner.title", "meta.partner.description");
}

export default function PartnerProgramPage() {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-black">
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain" data-mobile-scroll-root>
        <DashboardHeader sticky={false} />
        <PartnerProgramScreen />
      </div>
    </div>
  );
}
