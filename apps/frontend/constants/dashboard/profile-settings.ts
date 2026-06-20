/** Labels for settings page selects — values align with SUPPORTED_LOCALES. */

export const SETTINGS_LANGUAGE_OPTIONS = [
  { value: "ru", label: "🇷🇺 Русский" },
  { value: "en", label: "🇬🇧 English" },
  { value: "es", label: "🇪🇸 Español" },
  { value: "pt", label: "🇵🇹 Português" },
] as const;

export const SETTINGS_TIMEZONE_OPTIONS = [
  { value: "Europe/Moscow", label: "Москва (UTC+3)" },
  { value: "Europe/Kaliningrad", label: "Калининград (UTC+2)" },
  { value: "Asia/Yekaterinburg", label: "Екатеринбург (UTC+5)" },
  { value: "UTC", label: "UTC" },
] as const;

export const SETTINGS_DATE_FORMAT_OPTIONS = [
  { value: "dmy", label: "ДД.ММ.ГГГГ" },
  { value: "mdy", label: "ММ/ДД/ГГГГ" },
  { value: "ymd", label: "ГГГГ-ММ-ДД" },
] as const;

export const SETTINGS_NUMBER_GROUPING_OPTIONS = [
  { value: "space", label: "Пробел (1 234,56)" },
  { value: "thin", label: "Тонкий пробел" },
  { value: "none", label: "Без разбивки" },
] as const;
