import { AnalyticsOperationsSection } from "@/features/admin/sections/analytics/analytics-operations-section";
import { AdminAnalyticsGuard } from "@/features/admin/analytics/components/admin-analytics-layout";

export default function AdminAnalyticsOperationsPage() {
  return (
    <AdminAnalyticsGuard sectionId="analyticsOperations">
      <AnalyticsOperationsSection />
    </AdminAnalyticsGuard>
  );
}
