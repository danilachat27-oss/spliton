"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { parseProfilePageTabParam } from "@/constants/dashboard/profile-page";
import { ProfileSettingsContent } from "@/components/dashboard/profile/profile-settings-content";
import { ProfileSecurityContent } from "@/components/dashboard/profile/profile-security-content";
import { ProfileVerificationContent } from "@/components/dashboard/profile/profile-verification-content";
import { ProfileLegalContent } from "@/components/dashboard/profile/profile-legal-content";
import { ProfileOverviewContent } from "@/components/dashboard/profile/profile-overview-content";

export function ProfileDashboardScreen() {
  const searchParams = useSearchParams();
  const tab = useMemo(
    () => parseProfilePageTabParam(searchParams.get("tab")),
    [searchParams],
  );

  if (tab === "verification") {
    return (
      <div className="scroll-mt-24">
        <ProfileVerificationContent />
      </div>
    );
  }

  if (tab === "legal") {
    return (
      <div className="scroll-mt-24">
        <ProfileLegalContent />
      </div>
    );
  }

  if (tab === "security") {
    return (
      <div className="scroll-mt-24">
        <ProfileSecurityContent />
      </div>
    );
  }

  if (tab === "settings") {
    return (
      <div className="scroll-mt-24">
        <ProfileSettingsContent />
      </div>
    );
  }

  return (
    <div className="scroll-mt-24">
      <ProfileOverviewContent />
    </div>
  );
}

export function ProfileDashboardScreenFallback() {
  return (
    <div className="scroll-mt-24 space-y-3 sm:space-y-4" aria-busy="true">
      <div className="h-28 animate-pulse rounded-2xl bg-neutral-100" />
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <div className="h-40 animate-pulse rounded-2xl bg-neutral-100" />
        <div className="h-40 animate-pulse rounded-2xl bg-neutral-100" />
        <div className="h-44 animate-pulse rounded-2xl bg-neutral-100" />
        <div className="h-44 animate-pulse rounded-2xl bg-neutral-100" />
      </div>
    </div>
  );
}
