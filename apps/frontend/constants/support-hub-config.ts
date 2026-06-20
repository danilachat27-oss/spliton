import type { LucideIcon } from "@/lib/lucide";
import {
  Activity,
  ArrowDownUp,
  MessageSquarePlus,
  PieChart,
  Shield,
  Store,
} from "@/lib/lucide";

import { ROUTES } from "@/constants/routes";

export type SupportQuickActionId =
  | "openTicket"
  | "systemStatus"
  | "depositsWithdrawals"
  | "buyUnits"
  | "secondaryMarket"
  | "accountSecurity";

export type SupportQuickAction = {
  id: SupportQuickActionId;
  titleKey: string;
  descriptionKey: string;
  href: string;
  icon: LucideIcon;
};

/** Typed navigation shortcuts — no fabricated balances or rates. */
export const SUPPORT_QUICK_ACTIONS: SupportQuickAction[] = [
  {
    id: "openTicket",
    titleKey: "support.quick.openTicket.title",
    descriptionKey: "support.quick.openTicket.description",
    href: ROUTES.dashboardSupport,
    icon: MessageSquarePlus,
  },
  {
    id: "systemStatus",
    titleKey: "support.quick.systemStatus.title",
    descriptionKey: "support.quick.systemStatus.description",
    href: ROUTES.systemStatus,
    icon: Activity,
  },
  {
    id: "depositsWithdrawals",
    titleKey: "support.quick.deposits.title",
    descriptionKey: "support.quick.deposits.description",
    href: ROUTES.dashboardPayouts,
    icon: ArrowDownUp,
  },
  {
    id: "buyUnits",
    titleKey: "support.quick.buyUnits.title",
    descriptionKey: "support.quick.buyUnits.description",
    href: ROUTES.dashboardCatalog,
    icon: PieChart,
  },
  {
    id: "secondaryMarket",
    titleKey: "support.quick.secondary.title",
    descriptionKey: "support.quick.secondary.description",
    href: ROUTES.dashboardSecondaryMarket,
    icon: Store,
  },
  {
    id: "accountSecurity",
    titleKey: "support.quick.security.title",
    descriptionKey: "support.quick.security.description",
    href: `${ROUTES.dashboardProfile}?tab=security`,
    icon: Shield,
  },
];

export type SupportProductDocLink = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  href: string;
};

/** Static product & legal links — complements CMS docs category. */
export const SUPPORT_PRODUCT_DOC_LINKS: SupportProductDocLink[] = [
  {
    id: "terms",
    titleKey: "support.docs.terms.title",
    descriptionKey: "support.docs.terms.description",
    href: ROUTES.terms,
  },
  {
    id: "privacy",
    titleKey: "support.docs.privacy.title",
    descriptionKey: "support.docs.privacy.description",
    href: ROUTES.privacy,
  },
  {
    id: "trust",
    titleKey: "support.docs.trust.title",
    descriptionKey: "support.docs.trust.description",
    href: ROUTES.trust,
  },
  {
    id: "guide-selection",
    titleKey: "support.docs.guideSelection.title",
    descriptionKey: "support.docs.guideSelection.description",
    href: ROUTES.guideSelection,
  },
  {
    id: "guide-deal",
    titleKey: "support.docs.guideDeal.title",
    descriptionKey: "support.docs.guideDeal.description",
    href: ROUTES.guideDealStructure,
  },
];
