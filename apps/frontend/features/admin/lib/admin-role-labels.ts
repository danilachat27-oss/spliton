/** Русские названия ролей операторской панели Spliton */

export const ADMIN_ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Супер-админ",
  ADMIN: "Администратор",
  ACCOUNTANT: "Бухгалтерия",
  BUSINESS_ANALYST: "Бизнес-аналитик",
  CONTENT_MANAGER: "Контент-менеджер",
  NEWS_MANAGER: "Новости и объявления",
  SUPPORT_MANAGER: "Руководитель поддержки",
  SUPPORT: "Поддержка",
  COMPLIANCE: "Комплаенс",
  INVESTOR: "Держатель",
  ARTIST: "Артист",
  USER: "Пользователь",
};

export function adminRoleLabel(code: string): string {
  return ADMIN_ROLE_LABELS[code] ?? code.replace(/_/g, " ").toLowerCase();
}
