import type { Metadata } from "next";

import { AdminLoginPage } from "@/features/admin/components/admin-login-page";
import { ADMIN_MESSAGES } from "@/lib/i18n/admin-messages";
import { DEFAULT_LOCALE } from "@/lib/i18n/types";

const loginMeta = ADMIN_MESSAGES[DEFAULT_LOCALE];

export const metadata: Metadata = {
  title: loginMeta["admin.login.title"],
  description: loginMeta["admin.login.description"],
  robots: { index: false, follow: false },
};

export default function AdminLoginRoute() {
  return <AdminLoginPage />;
}
