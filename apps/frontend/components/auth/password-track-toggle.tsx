"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

const barDelays = ["0ms", "65ms", "130ms", "195ms", "260ms", "325ms", "390ms"];

type PasswordTrackToggleProps = {
  showPassword: boolean;
  /** Анимация «идёт трек» только когда в поле есть символы и пароль скрыт. */
  isPlaying: boolean;
  onToggle: () => void;
};

/**
 * Мини-«плеер»: дорожка + полоски. Клик — показать/скрыть пароль.
 */
export function PasswordTrackToggle({
  showPassword,
  isPlaying,
  onToggle,
}: PasswordTrackToggleProps) {
  const { t } = useI18n();
  const hideLabel = t("auth.password.hide");
  const showLabel = t("auth.password.show");
  return (
    <button
      type="button"
      onClick={onToggle}
      title={showPassword ? hideLabel : showLabel}
      aria-pressed={showPassword}
      aria-label={showPassword ? hideLabel : showLabel}
      className={cn(
        "absolute right-2 top-1/2 flex -translate-y-1/2 flex-col items-center gap-1 rounded-lg border px-2 py-1.5 transition-colors",
        "border-neutral-200 bg-neutral-50/95 hover:border-neutral-300 hover:bg-neutral-100",
        showPassword && "opacity-90"
      )}
    >
      <div className="relative h-[2px] w-[26px] overflow-hidden rounded-full bg-neutral-200">
        <span
          className={cn(
            "absolute top-0 block h-full w-[34%] rounded-full bg-neutral-600",
            showPassword && "left-[22%]",
            !showPassword && isPlaying && "left-0 animate-Spliton-track-head",
            !showPassword && !isPlaying && "left-0"
          )}
        />
      </div>
      <div className="flex h-[13px] items-end gap-[2px]">
        {[4, 10, 6, 12, 8, 11, 5].map((h, i) => (
          <span
            key={i}
            className={cn(
              "inline-block w-[2px] rounded-full bg-neutral-600",
              isPlaying && "animate-Spliton-track-eq"
            )}
            style={{
              height: `${h}px`,
              animationDelay: barDelays[i] ?? "0ms",
            }}
          />
        ))}
      </div>
    </button>
  );
}
