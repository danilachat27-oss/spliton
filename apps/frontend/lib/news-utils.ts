/** Оценка времени чтения по объёму текста (русский контент). */
export function estimateReadTimeMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export function formatReadTimeLabel(minutes: number): string {
  return `${minutes} мин`;
}
