import type { Metadata } from "next";

import { AuthGuard } from "@/components/auth/auth-guard";
import { NotificationsPageContent } from "@/components/notifications/notifications-page-content";
import { notificationsPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return notificationsPageMetaAsync("meta.notifications.title", "meta.notifications.description");
}

export default function DashboardNotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsPageContent />
    </AuthGuard>
  );
}
