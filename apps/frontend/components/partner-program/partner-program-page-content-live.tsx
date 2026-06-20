"use client";

import { PartnerApplyProvider } from "@/components/partner-program/partner-apply-context";
import {
  PartnerApplicationPanel,
  PartnerApplyModalHost,
} from "@/components/partner-program/partner-application-panel";
import { PartnerProgramPageContent } from "@/components/partner-program/partner-program-page-content";
import type { PartnerProgramTabId } from "@/constants/dashboard/partner-program";

export function PartnerProgramPageContentLive({ activeTab }: { activeTab: PartnerProgramTabId }) {
  return (
    <PartnerApplyProvider>
      <PartnerProgramPageContent activeTab={activeTab} />
      {activeTab === "about" ? (
        <div id="partner-apply-section" className="mt-12 scroll-mt-28">
          <PartnerApplicationPanel />
        </div>
      ) : null}
      <PartnerApplyModalHost />
    </PartnerApplyProvider>
  );
}
