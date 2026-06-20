import { DashboardSectionSubheaderShell } from "@/components/dashboard/dashboard-section-subheader-shell";

export { ProfileSectionNav as ProfileSecondaryHeader } from "@/components/dashboard/profile/profile-section-nav";

export function ProfileSecondaryHeaderFallback() {
  return (
    <DashboardSectionSubheaderShell>
      <div className="h-11 sm:h-12">
        <div className="mb-2 h-4 w-56 animate-pulse rounded bg-neutral-100" />
      </div>
    </DashboardSectionSubheaderShell>
  );
}
