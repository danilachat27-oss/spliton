import { AnalyticsUsersSection } from "@/features/admin/sections/analytics/analytics-users-section";
import { AdminAnalyticsGuard } from "@/features/admin/analytics/components/admin-analytics-layout";

export default function AdminAnalyticsUsersPage() {
  return (
    <AdminAnalyticsGuard sectionId="analyticsUsers">
      <AnalyticsUsersSection />
    </AdminAnalyticsGuard>
  );
}
