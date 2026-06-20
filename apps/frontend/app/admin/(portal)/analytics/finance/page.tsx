import { AnalyticsFinanceSection } from "@/features/admin/sections/analytics/analytics-finance-section";
import { AdminAnalyticsGuard } from "@/features/admin/analytics/components/admin-analytics-layout";

export default function AdminAnalyticsFinancePage() {
  return (
    <AdminAnalyticsGuard sectionId="analyticsFinance">
      <AnalyticsFinanceSection />
    </AdminAnalyticsGuard>
  );
}
