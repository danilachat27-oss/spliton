export function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(value: string, locale = "ru-RU"): string {
  const date = parseIsoDate(value);
  if (!date) return "";
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export type CalendarCell = {
  date: Date;
  iso: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
};

export function buildCalendarMonth(
  year: number,
  month: number,
  selectedIso?: string,
  today = new Date(),
): CalendarCell[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);
  const todayIso = toIsoDate(today);
  const cells: CalendarCell[] = [];

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const iso = toIsoDate(date);
    cells.push({
      date,
      iso,
      inCurrentMonth: date.getMonth() === month,
      isToday: iso === todayIso,
      isSelected: iso === selectedIso,
    });
  }

  return cells;
}

export function monthLabel(year: number, month: number, locale: string): string {
  const label = new Date(year, month, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function weekdayLabels(locale: string): string[] {
  const monday = new Date(2024, 0, 1);
  return Array.from({ length: 7 }, (_, index) =>
    new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index).toLocaleDateString(
      locale,
      { weekday: "short" },
    ),
  );
}
