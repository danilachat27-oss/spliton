import { AnalyticsMarketSection } from "@/features/admin/sections/analytics/analytics-market-section";
import { AdminAnalyticsGuard } from "@/features/admin/analytics/components/admin-analytics-layout";

export default function AdminAnalyticsMarketPage() {
  return (
    <AdminAnalyticsGuard sectionId="analyticsMarket">
      <AnalyticsMarketSection />
    </AdminAnalyticsGuard>
  );
}
