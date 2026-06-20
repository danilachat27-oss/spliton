import type { StaffRoleCode } from "@/features/admin/types/admin-roles";



export type PermissionLevel = "full" | "read" | "limited" | "none";



export type PermissionArea =

  | "Users"

  | "Roles"

  | "Tracks"

  | "Rounds"

  | "Holdings"

  | "Wallets"

  | "Deposits"

  | "Withdrawals"

  | "Revenue"

  | "Secondary Market"

  | "Platform Revenue"

  | "Reports"

  | "Support"

  | "Compliance"

  | "Settings"

  | "Audit Log";



export type PermissionMatrixRole =

  | "SUPER_ADMIN"

  | "ACCOUNTANT"

  | "CONTENT_MANAGER"

  | "SUPPORT_MANAGER"

  | "COMPLIANCE";



export const PERMISSION_AREA_LABELS: Record<PermissionArea, string> = {

  Users: "Пользователи",

  Roles: "Роли и доступы",

  Tracks: "Треки и релизы",

  Rounds: "Раунды и сделки",

  Holdings: "Юниты и владения",

  Wallets: "Кошельки",

  Deposits: "Пополнения",

  Withdrawals: "Выводы",

  Revenue: "Доходы и начисления",

  "Secondary Market": "Вторичный рынок",

  "Platform Revenue": "Доход платформы",

  Reports: "Отчёты",

  Support: "Поддержка",

  Compliance: "Риски и контроль",

  Settings: "Настройки",

  "Audit Log": "Журнал действий",

};



export const PERMISSION_MATRIX_COLUMNS: Array<{

  key: PermissionMatrixRole;

  label: string;

}> = [

  { key: "SUPER_ADMIN", label: "Гл. админ" },

  { key: "ACCOUNTANT", label: "Бухгалтерия" },

  { key: "CONTENT_MANAGER", label: "Контент" },

  { key: "SUPPORT_MANAGER", label: "Поддержка" },

  { key: "COMPLIANCE", label: "Риски" },

];



export const PERMISSION_MATRIX: Record<

  PermissionArea,

  Record<PermissionMatrixRole, PermissionLevel>

> = {

  Users: {

    SUPER_ADMIN: "full",

    ACCOUNTANT: "read",

    CONTENT_MANAGER: "none",

    SUPPORT_MANAGER: "read",

    COMPLIANCE: "read",

  },

  Roles: {

    SUPER_ADMIN: "full",

    ACCOUNTANT: "none",

    CONTENT_MANAGER: "none",

    SUPPORT_MANAGER: "none",

    COMPLIANCE: "none",

  },

  Tracks: {

    SUPER_ADMIN: "full",

    ACCOUNTANT: "none",

    CONTENT_MANAGER: "full",

    SUPPORT_MANAGER: "none",

    COMPLIANCE: "none",

  },

  Rounds: {

    SUPER_ADMIN: "full",

    ACCOUNTANT: "none",

    CONTENT_MANAGER: "full",

    SUPPORT_MANAGER: "none",

    COMPLIANCE: "none",

  },

  Holdings: {

    SUPER_ADMIN: "full",

    ACCOUNTANT: "read",

    CONTENT_MANAGER: "read",

    SUPPORT_MANAGER: "read",

    COMPLIANCE: "limited",

  },

  Wallets: {

    SUPER_ADMIN: "full",

    ACCOUNTANT: "full",

    CONTENT_MANAGER: "none",

    SUPPORT_MANAGER: "read",

    COMPLIANCE: "limited",

  },

  Deposits: {

    SUPER_ADMIN: "full",

    ACCOUNTANT: "full",

    CONTENT_MANAGER: "none",

    SUPPORT_MANAGER: "read",

    COMPLIANCE: "limited",

  },

  Withdrawals: {

    SUPER_ADMIN: "full",

    ACCOUNTANT: "full",

    CONTENT_MANAGER: "none",

    SUPPORT_MANAGER: "read",

    COMPLIANCE: "limited",

  },

  Revenue: {

    SUPER_ADMIN: "full",

    ACCOUNTANT: "full",

    CONTENT_MANAGER: "read",

    SUPPORT_MANAGER: "read",

    COMPLIANCE: "read",

  },

  "Secondary Market": {

    SUPER_ADMIN: "full",

    ACCOUNTANT: "read",

    CONTENT_MANAGER: "read",

    SUPPORT_MANAGER: "read",

    COMPLIANCE: "full",

  },

  "Platform Revenue": {

    SUPER_ADMIN: "full",

    ACCOUNTANT: "full",

    CONTENT_MANAGER: "none",

    SUPPORT_MANAGER: "none",

    COMPLIANCE: "none",

  },

  Reports: {

    SUPER_ADMIN: "full",

    ACCOUNTANT: "full",

    CONTENT_MANAGER: "read",

    SUPPORT_MANAGER: "read",

    COMPLIANCE: "read",

  },

  Support: {

    SUPER_ADMIN: "full",

    ACCOUNTANT: "none",

    CONTENT_MANAGER: "none",

    SUPPORT_MANAGER: "full",

    COMPLIANCE: "none",

  },

  Compliance: {

    SUPER_ADMIN: "full",

    ACCOUNTANT: "none",

    CONTENT_MANAGER: "none",

    SUPPORT_MANAGER: "none",

    COMPLIANCE: "full",

  },

  Settings: {

    SUPER_ADMIN: "full",

    ACCOUNTANT: "none",

    CONTENT_MANAGER: "none",

    SUPPORT_MANAGER: "none",

    COMPLIANCE: "none",

  },

  "Audit Log": {

    SUPER_ADMIN: "full",

    ACCOUNTANT: "read",

    CONTENT_MANAGER: "none",

    SUPPORT_MANAGER: "limited",

    COMPLIANCE: "read",

  },

};



export const ROLE_DESCRIPTIONS: Record<StaffRoleCode, string> = {

  SUPER_ADMIN: "Полный контроль платформы, роли, настройки и все финансовые операции.",

  ADMIN: "Администратор с расширенными правами (эквивалент главного администратора).",

  ACCOUNTANT: "Финансовая зона: кошельки, пополнения, выводы, начисления, отчёты.",

  CONTENT_MANAGER: "Треки, релизы, раунды и параметры сделок.",

  SUPPORT_MANAGER: "Обращения пользователей, операции только для чтения и эскалации.",

  COMPLIANCE: "Риски, подозрительные операции, блокировки и заморозки.",

  SUPPORT: "Поддержка (ограниченный доступ сотрудника).",

  BUSINESS_ANALYST:
    "Бизнес-аналитик: аналитика, обзор, отчёты (экспорт), доход платформы (просмотр). Без изменений данных.",

  NEWS_MANAGER: "Публикация новостей и объявлений для пользователей платформы.",
};


