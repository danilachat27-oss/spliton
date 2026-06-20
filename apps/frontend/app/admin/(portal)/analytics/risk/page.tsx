import { AnalyticsRiskSection } from "@/features/admin/sections/analytics/analytics-risk-section";
import { AdminAnalyticsGuard } from "@/features/admin/analytics/components/admin-analytics-layout";

export default function AdminAnalyticsRiskPage() {
  return (
    <AdminAnalyticsGuard sectionId="analyticsRisk">
      <AnalyticsRiskSection />
    </AdminAnalyticsGuard>
  );
}
