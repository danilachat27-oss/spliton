import { AnalyticsTracksSection } from "@/features/admin/sections/analytics/analytics-tracks-section";
import { AdminAnalyticsGuard } from "@/features/admin/analytics/components/admin-analytics-layout";

export default function AdminAnalyticsTracksPage() {
  return (
    <AdminAnalyticsGuard sectionId="analyticsTracks">
      <AnalyticsTracksSection />
    </AdminAnalyticsGuard>
  );
}
