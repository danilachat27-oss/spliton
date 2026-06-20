import type { LucideIcon } from "@/lib/lucide";
import {
  ChartCandlestick,
  Coins,
  LayoutDashboard,
  Music2,
  ScrollText,
  Users,
  Wallet,
} from "@/lib/lucide";

import { ROUTES } from "@/constants/routes";

import type { AdminTabId } from "../lib/admin-tabs";

export const ADMIN_SECTION_NAV: Array<{
  tab: AdminTabId;
  label: string;
  icon: LucideIcon;
}> = [
  { tab: "overview", label: "Обзор", icon: LayoutDashboard },
  { tab: "releases", label: "Релизы", icon: Music2 },
  { tab: "investors", label: "Инвесторы", icon: Users },
  { tab: "finances", label: "Финансы", icon: Wallet },
  { tab: "payouts", label: "Выплаты", icon: Coins },
  { tab: "market", label: "Рынок", icon: ChartCandlestick },
  { tab: "audit", label: "Аудит", icon: ScrollText },
];

export function adminTabHref(tab: AdminTabId): string {
  return tab === "overview" ? ROUTES.admin : `${ROUTES.admin}?tab=${tab}`;
}
