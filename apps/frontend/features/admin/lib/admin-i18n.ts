import type { AppLocale } from "@/lib/i18n/types";
import {
  ADMIN_MESSAGES,
  adminDomainLabel,
  adminKycStatusLabel,
  adminLegalPolicyTypeLabel,
  adminReportTypeLabel,
  adminRoleLabelForLocale,
  adminSectionLabelForLocale,
  adminTreasuryTypeLabel,
  complianceKindLabelForLocale,
  complianceSeverityLabelForLocale,
  formatAdminStatusLabel,
  formatAuditActionLabel,
  formatAuditEntityLabel,
  formatRoleUserCountForLocale,
  formatRoundStatusLabel,
  formatTrackStatusLabel,
  ledgerOperationLabelForLocale,
  permissionLevelLabelForLocale,
} from "@/lib/i18n/admin-messages";

function msg(locale: AppLocale, key: string, fallback?: string): string {
  return ADMIN_MESSAGES[locale][key] ?? ADMIN_MESSAGES.ru[key] ?? fallback ?? key;
}

function pickRecord<K extends string>(
  locale: AppLocale,
  prefix: string,
  keys: readonly K[],
): Record<K, string> {
  return Object.fromEntries(keys.map((k) => [k, msg(locale, `${prefix}.${k}`)])) as Record<K, string>;
}

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

const NAV_GROUP_KEYS = [
  "main",
  "usersAccess",
  "content",
  "finance",
  "market",
  "operations",
  "analytics",
  "system",
] as const;

const SECTION_IDS = [
  "dashboard",
  "operatorTasks",
  "riskSignals",
  "users",
  "roles",
  "audit",
  "tracks",
  "artists",
  "genres",
  "labels",
  "rounds",
  "holdings",
  "wallets",
  "deposits",
  "withdrawals",
  "revenue",
  "platformRevenue",
  "secondaryMarket",
  "marketTrades",
  "marketSuspicious",
  "support",
  "news",
  "helpCenter",
  "compliance",
  "kyc",
  "referrals",
  "legal",
  "treasury",
  "reports",
  "settings",
  "systemStatus",
  "notifications",
  "updates",
  "docs",
  "analyticsOverview",
  "analyticsFinance",
  "analyticsUsers",
  "analyticsTracks",
  "analyticsMarket",
  "analyticsRevenue",
  "analyticsRisk",
  "analyticsOperations",
] as const;

const ROLE_CODES = [
  "SUPER_ADMIN",
  "ADMIN",
  "ACCOUNTANT",
  "CONTENT_MANAGER",
  "SUPPORT_MANAGER",
  "COMPLIANCE",
  "SUPPORT",
  "BUSINESS_ANALYST",
  "NEWS_MANAGER",
  "INVESTOR",
  "ARTIST",
  "USER",
] as const;

const PERMISSION_LEVELS = ["full", "read", "limited", "none"] as const;

const STATUS_KEYS = [
  "pending",
  "approved",
  "rejected",
  "completed",
  "failed",
  "manual_review",
  "on_hold",
  "cancelled",
  "canceled",
  "paused",
  "frozen",
  "suspicious",
  "confirming",
  "active",
  "blocked",
  "draft",
  "preview",
  "processing",
  "open",
  "reviewed",
  "in_progress",
  "waiting_user",
  "escalated",
  "closed",
  "high",
  "medium",
  "low",
  "danger",
  "warning",
  "info",
] as const;

const TRACK_STATUS_KEYS = [
  "draft",
  "review",
  "published",
  "active",
  "paused",
  "completed",
  "archived",
] as const;

const ROUND_STATUS_KEYS = ["draft", "live", "paused", "completed", "cancelled"] as const;

const COMPLIANCE_KIND_KEYS = ["user", "withdrawal", "trade"] as const;

const COMPLIANCE_SEVERITY_KEYS = ["critical", "high", "medium", "low"] as const;

const AUDIT_ENTITY_KEYS = [
  "user",
  "withdrawal",
  "deposit",
  "wallet",
  "track",
  "round",
  "listing",
  "trade",
  "report",
  "support_ticket",
  "compliance",
  "revenue_event",
  "platform_fees",
] as const;

const AUDIT_ACTION_KEYS = [
  "user.status_change",
  "user_role_assign",
  "user.role_assign",
  "user_role_remove",
  "user.role_remove",
  "user.role.assign",
  "withdrawal.requested",
  "withdrawal.approve",
  "withdrawal.reject",
  "deposit.completed",
  "compliance.risk_flag.create",
  "compliance.risk_flag.status_change",
  "compliance.user.block",
  "compliance.user.unblock",
  "compliance.operation.freeze",
  "compliance.operation.release",
  "listing.freeze",
  "listing.cancel",
  "trade.mark_suspicious",
  "report.generate",
  "round.create",
  "round.update",
  "track.create",
  "track.update",
  "track.cover_update",
  "track.media_update",
  "track.publish",
  "track.pause",
  "track.archive",
  "track.submit_review",
  "track.financial_terms_update",
  "track.units_update",
  "revenue_event.create",
  "distribution.run",
  "platform_fees.update",
  "support_ticket.status_change",
  "support_ticket.assign",
  "support_ticket.note",
] as const;

const LEDGER_OPS = [
  "deposit",
  "withdrawal",
  "payout",
  "trade_buy",
  "trade_sell",
  "platform_fee",
  "secondary_fee",
  "withdrawal_fee",
  "lock",
  "unlock",
  "adjustment",
] as const;

function labelsForLocale(locale: AppLocale) {
  return {
    portal: pickRecord(locale, "admin.portal", PORTAL_KEYS),
    navGroup: pickRecord(locale, "admin.navGroup", NAV_GROUP_KEYS),
    section: Object.fromEntries(
      SECTION_IDS.map((id) => [id, adminSectionLabelForLocale(id, locale)]),
    ) as Record<string, string>,
    role: Object.fromEntries(ROLE_CODES.map((code) => [code, adminRoleLabelForLocale(code, locale)])),
    permission: pickRecord(locale, "admin.permission", PERMISSION_LEVELS),
    status: pickRecord(locale, "admin.status", STATUS_KEYS),
    trackStatus: pickRecord(locale, "admin.trackStatus", TRACK_STATUS_KEYS),
    roundStatus: pickRecord(locale, "admin.roundStatus", ROUND_STATUS_KEYS),
    complianceKind: pickRecord(locale, "admin.compliance.kind", COMPLIANCE_KIND_KEYS),
    complianceSeverity: pickRecord(locale, "admin.compliance.severity", COMPLIANCE_SEVERITY_KEYS),
    table: pickRecord(locale, "admin.table", TABLE_KEYS),
    empty: pickRecord(locale, "admin.empty", EMPTY_KEYS),
    auditEntity: Object.fromEntries(
      AUDIT_ENTITY_KEYS.map((k) => [k, formatAuditEntityLabel(k, locale)]),
    ),
    auditAction: Object.fromEntries(
      AUDIT_ACTION_KEYS.map((k) => [k, formatAuditActionLabel(k, locale)]),
    ),
    actions: pickRecord(locale, "admin.actions", ACTION_KEYS),
    confirm: pickRecord(locale, "admin.confirm", CONFIRM_KEYS),
    ledger: pickRecord(locale, "admin.ledger", LEDGER_OPS),
    readOnly: msg(locale, "admin.readOnly"),
  };
}

/** @deprecated Use useAdminI18n().portal or labelsForLocale(locale).portal */
export const ADMIN_PORTAL = pickRecord("ru", "admin.portal", PORTAL_KEYS);

/** @deprecated Use labelsForLocale(locale).navGroup */
export const ADMIN_NAV_GROUP_LABELS = pickRecord("ru", "admin.navGroup", NAV_GROUP_KEYS);

/** @deprecated Use adminSectionLabel(id, locale) or useAdminI18n().adminSectionLabel */
export const ADMIN_SECTION_LABELS: Record<string, string> = Object.fromEntries(
  SECTION_IDS.map((id) => [id, adminSectionLabelForLocale(id, "ru")]),
);

/** @deprecated Use adminRoleLabel(code, locale) or useAdminI18n().adminRoleLabel */
export const ADMIN_ROLE_LABELS: Record<string, string> = Object.fromEntries(
  ROLE_CODES.map((code) => [code, adminRoleLabelForLocale(code, "ru")]),
);

/** @deprecated Use permissionLevelLabel(level, locale) */
export const PERMISSION_LEVEL_LABELS: Record<string, string> = pickRecord(
  "ru",
  "admin.permission",
  PERMISSION_LEVELS,
);

/** @deprecated Use formatAdminStatus(status, locale) */
export const ADMIN_STATUS_LABELS: Record<string, string> = pickRecord("ru", "admin.status", STATUS_KEYS);

/** @deprecated Use formatTrackStatus(status, locale) */
export const TRACK_STATUS_LABELS: Record<string, string> = pickRecord(
  "ru",
  "admin.trackStatus",
  TRACK_STATUS_KEYS,
);

/** @deprecated Use formatRoundStatus(status, locale) */
export const ROUND_STATUS_LABELS: Record<string, string> = pickRecord(
  "ru",
  "admin.roundStatus",
  ROUND_STATUS_KEYS,
);

/** @deprecated Use complianceKindLabel(kind, locale) */
export const COMPLIANCE_KIND_LABELS: Record<string, string> = pickRecord(
  "ru",
  "admin.compliance.kind",
  COMPLIANCE_KIND_KEYS,
);

/** @deprecated Use complianceSeverityLabel(severity, locale) */
export const COMPLIANCE_SEVERITY_LABELS: Record<string, string> = pickRecord(
  "ru",
  "admin.compliance.severity",
  COMPLIANCE_SEVERITY_KEYS,
);

/** @deprecated Use useAdminI18n().table */
export const ADMIN_TABLE = pickRecord("ru", "admin.table", TABLE_KEYS);

/** @deprecated Use useAdminI18n().empty */
export const ADMIN_EMPTY = pickRecord("ru", "admin.empty", EMPTY_KEYS);

/** @deprecated Use formatAuditEntity(entity, locale) */
export const AUDIT_ENTITY_LABELS: Record<string, string> = Object.fromEntries(
  AUDIT_ENTITY_KEYS.map((k) => [k, formatAuditEntityLabel(k, "ru")]),
);

/** @deprecated Use formatAuditAction(action, locale) */
export const AUDIT_ACTION_LABELS: Record<string, string> = Object.fromEntries(
  AUDIT_ACTION_KEYS.map((k) => [k, formatAuditActionLabel(k, "ru")]),
);

/** @deprecated Use t("admin.readOnly", { area }) via useAdminI18n */
export const ADMIN_READ_ONLY = msg("ru", "admin.readOnly");

/** @deprecated Use useAdminI18n().actions */
export const ADMIN_ACTIONS = pickRecord("ru", "admin.actions", ACTION_KEYS);

/** @deprecated Use useAdminI18n().confirm */
export const ADMIN_CONFIRM = pickRecord("ru", "admin.confirm", CONFIRM_KEYS);

/** @deprecated Use ledgerOperationLabel(op, locale) */
export const LEDGER_OPERATION_LABELS: Record<string, string> = pickRecord(
  "ru",
  "admin.ledger",
  LEDGER_OPS,
);

export function formatAdminStatus(status: string, locale: AppLocale = "ru"): string {
  return formatAdminStatusLabel(status, locale);
}

export function formatTrackStatus(status: string, locale: AppLocale = "ru"): string {
  return formatTrackStatusLabel(status, locale);
}

export function formatRoundStatus(status: string, locale: AppLocale = "ru"): string {
  return formatRoundStatusLabel(status, locale);
}

export function formatAuditEntity(entity: string, locale: AppLocale = "ru"): string {
  return formatAuditEntityLabel(entity, locale);
}

export function formatAuditAction(action: string, locale: AppLocale = "ru"): string {
  return formatAuditActionLabel(action, locale);
}

export function adminSectionLabel(sectionId: string, locale: AppLocale = "ru"): string {
  return adminSectionLabelForLocale(sectionId, locale);
}

export function adminRoleLabel(code: string, locale: AppLocale = "ru"): string {
  return adminRoleLabelForLocale(code, locale);
}

export function formatRoleUserCount(count: number, locale: AppLocale = "ru"): string {
  return formatRoleUserCountForLocale(count, locale);
}

export function permissionLevelLabel(level: string, locale: AppLocale = "ru"): string {
  return permissionLevelLabelForLocale(level, locale);
}

export function complianceKindLabel(kind: string, locale: AppLocale = "ru"): string {
  return complianceKindLabelForLocale(kind, locale);
}

export function complianceSeverityLabel(severity: string, locale: AppLocale = "ru"): string {
  return complianceSeverityLabelForLocale(severity, locale);
}

export function ledgerOperationLabel(op: string, locale: AppLocale = "ru"): string {
  return ledgerOperationLabelForLocale(op, locale);
}

export {
  adminDomainLabel,
  adminKycStatusLabel,
  adminLegalPolicyTypeLabel,
  adminReportTypeLabel,
  adminTreasuryTypeLabel,
};

export { labelsForLocale };
