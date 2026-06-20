"use client";

import { useCallback, useMemo } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import type { AdminBreadcrumbItem } from "@/features/admin/ui/admin-breadcrumbs";
import {
  ADMIN_MESSAGES,
  adminSectionLabelForLocale,
  complianceKindLabelForLocale,
  complianceSeverityLabelForLocale,
  formatAdminStatusLabel,
  formatAuditActionLabel,
  formatAuditEntityLabel,
  adminDomainLabel,
  adminKycStatusLabel,
  adminLegalPolicyTypeLabel,
  adminReportTypeLabel,
  adminTreasuryTypeLabel,
  formatNotificationCategoryLabel,
  formatRoleUserCountForLocale,
  formatRoundStatusLabel,
  formatTrackStatusLabel,
  adminRoleLabelForLocale,
  ledgerOperationLabelForLocale,
  permissionLevelLabelForLocale,
} from "@/lib/i18n/admin-messages";

const PORTAL_KEYS = [
  "brandTitle",
  "brandSubtitle",
  "breadcrumbRoot",
  "searchPlaceholder",
  "searchSectionPlaceholder",
  "refresh",
  "viewAll",
  "envProduction",
  "envStaging",
  "envLocal",
] as const;

const TABLE_KEYS = [
  "id",
  "user",
  "email",
  "name",
  "roles",
  "status",
  "amount",
  "fee",
  "net",
  "asset",
  "txHash",
  "confirmations",
  "created",
  "updated",
  "actions",
  "track",
  "units",
  "pricePerUnit",
  "total",
  "seller",
  "buyer",
  "address",
  "available",
  "locked",
  "holder",
  "admin",
  "action",
  "entity",
  "result",
  "ip",
  "category",
  "priority",
  "assigned",
  "subject",
  "ticket",
  "risk",
  "type",
  "note",
  "period",
] as const;

const ACTION_KEYS = [
  "open",
  "view",
  "review",
  "block",
  "unblock",
  "assignRole",
  "approve",
  "reject",
  "hold",
  "complete",
  "reconcile",
  "manualReview",
  "markCompleted",
  "markFailed",
  "confirm",
  "cancel",
  "detail",
  "all",
  "allRoles",
  "allStatuses",
] as const;

const EMPTY_KEYS = ["noData", "noDataHint", "loadError", "retry", "loading"] as const;

const CONFIRM_KEYS = [
  "blockUserTitle",
  "blockUserDesc",
  "blockUserConfirm",
  "unblockUserTitle",
  "unblockUserDesc",
  "unblockUserConfirm",
  "withdrawalTitle",
  "withdrawalApproveDesc",
  "withdrawalRejectDesc",
  "withdrawalHoldDesc",
  "depositDesc",
] as const;

function pickGroup<K extends string>(
  t: (key: string, fallback?: string) => string,
  prefix: string,
  keys: readonly K[],
): Record<K, string> {
  return Object.fromEntries(keys.map((k) => [k, t(`${prefix}.${k}`)])) as Record<K, string>;
}

export function useAdminI18n() {
  const { locale, t } = useI18n();

  const portal = useMemo(
    () => pickGroup(t, "admin.portal", PORTAL_KEYS),
    [t],
  );

  const table = useMemo(() => pickGroup(t, "admin.table", TABLE_KEYS), [t]);

  const actions = useMemo(() => pickGroup(t, "admin.actions", ACTION_KEYS), [t]);

  const empty = useMemo(() => pickGroup(t, "admin.empty", EMPTY_KEYS), [t]);

  const confirm = useMemo(() => pickGroup(t, "admin.confirm", CONFIRM_KEYS), [t]);

  const formatAdminStatus = useCallback(
    (status: string) => formatAdminStatusLabel(status, locale),
    [locale],
  );

  const formatTrackStatus = useCallback(
    (status: string) => formatTrackStatusLabel(status, locale),
    [locale],
  );

  const formatRoundStatus = useCallback(
    (status: string) => formatRoundStatusLabel(status, locale),
    [locale],
  );

  const adminRoleLabel = useCallback(
    (code: string) => adminRoleLabelForLocale(code, locale),
    [locale],
  );

  const adminSectionLabel = useCallback(
    (sectionId: string) => adminSectionLabelForLocale(sectionId, locale),
    [locale],
  );

  const formatAuditEntity = useCallback(
    (entity: string) => formatAuditEntityLabel(entity, locale),
    [locale],
  );

  const formatAuditAction = useCallback(
    (action: string) => formatAuditActionLabel(action, locale),
    [locale],
  );

  const formatRoleUserCount = useCallback(
    (count: number) => formatRoleUserCountForLocale(count, locale),
    [locale],
  );

  const notificationCategoryLabel = useCallback(
    (category: string) => formatNotificationCategoryLabel(category, locale),
    [locale],
  );

  const adminDomainLabelFn = useCallback(
    (domain: Parameters<typeof adminDomainLabel>[0], value: string) =>
      adminDomainLabel(domain, value, locale),
    [locale],
  );

  const adminKycStatusLabelFn = useCallback(
    (status: string) => adminKycStatusLabel(status, locale),
    [locale],
  );

  const adminLegalPolicyTypeLabelFn = useCallback(
    (type: string) => adminLegalPolicyTypeLabel(type, locale),
    [locale],
  );

  const adminReportTypeLabelFn = useCallback(
    (type: string) => adminReportTypeLabel(type, locale),
    [locale],
  );

  const adminTreasuryTypeLabelFn = useCallback(
    (type: string) => adminTreasuryTypeLabel(type, locale),
    [locale],
  );

  const complianceKindLabel = useCallback(
    (kind: string) => complianceKindLabelForLocale(kind, locale),
    [locale],
  );

  const complianceSeverityLabel = useCallback(
    (severity: string) => complianceSeverityLabelForLocale(severity, locale),
    [locale],
  );

  const ledgerOperationLabel = useCallback(
    (op: string) => ledgerOperationLabelForLocale(op, locale),
    [locale],
  );

  const permissionLevelLabel = useCallback(
    (level: string) => permissionLevelLabelForLocale(level, locale),
    [locale],
  );

  const navGroupLabel = useCallback(
    (groupId: string) => t(`admin.navGroup.${groupId}`),
    [t],
  );

  const readOnlyBanner = useCallback(
    (area: string) => t("admin.readOnly").replace("{area}", area),
    [t],
  );

  const verifyingAccess = useMemo(() => t("admin.layout.verifyingAccess"), [t]);

  const adminBreadcrumbs = useCallback(
    (sectionLabel: string): AdminBreadcrumbItem[] => [
      { label: portal.breadcrumbRoot, href: ROUTES.admin },
      { label: sectionLabel },
    ],
    [portal.breadcrumbRoot],
  );

  const adminSectionBreadcrumbs = useCallback(
    (sectionId: string) => adminBreadcrumbs(adminSectionLabel(sectionId)),
    [adminBreadcrumbs, adminSectionLabel],
  );

  return {
    locale,
    t,
    messages: ADMIN_MESSAGES[locale],
    portal,
    table,
    actions,
    empty,
    confirm,
    formatAdminStatus,
    formatTrackStatus,
    formatRoundStatus,
    adminRoleLabel,
    adminSectionLabel,
    formatAuditEntity,
    formatAuditAction,
    formatRoleUserCount,
    notificationCategoryLabel,
    adminDomainLabel: adminDomainLabelFn,
    adminKycStatusLabel: adminKycStatusLabelFn,
    adminLegalPolicyTypeLabel: adminLegalPolicyTypeLabelFn,
    adminReportTypeLabel: adminReportTypeLabelFn,
    adminTreasuryTypeLabel: adminTreasuryTypeLabelFn,
    complianceKindLabel,
    complianceSeverityLabel,
    ledgerOperationLabel,
    permissionLevelLabel,
    navGroupLabel,
    readOnlyBanner,
    verifyingAccess,
    adminBreadcrumbs,
    adminSectionBreadcrumbs,
  };
}
