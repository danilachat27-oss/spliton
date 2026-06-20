"use client";

import * as React from "react";
import { ChevronDown } from "@/lib/lucide";

import { LocaleFlag } from "@/components/i18n/locale-flag";
import { useI18n } from "@/components/providers/i18n-provider";
import { LOCALE_OPTIONS, type AppLocale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

type LanguageSelectorProps = {
  className?: string;
  buttonClassName?: string;
  variant?: "light" | "dark" | "admin";
  /** Compatibility prop. */
  placement?: string;
  /** Полноширинный вид для mobile drawer (флаг + название, dropdown слева на всю ширину). */
  layout?: "default" | "menu";
  /** Выравнивание выпадающего списка относительно кнопки. */
  menuAlign?: "start" | "end";
};

export function LanguageSelector({
  className,
  buttonClassName,
  variant = "light",
  layout = "default",
  menuAlign = "end",
}: LanguageSelectorProps) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const current = LOCALE_OPTIONS.find((item) => item.code === locale) ?? LOCALE_OPTIONS[0];

  React.useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [open]);

  const isDarkShell = variant === "dark" || variant === "admin";

  const shellClass =
    layout === "menu"
      ? "border-0 bg-transparent text-zinc-200 hover:bg-white/5"
      : variant === "admin"
        ? "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
        : variant === "dark"
          ? "border-0 bg-transparent text-zinc-200 hover:bg-white/5"
          : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50";

  const isMenu = layout === "menu";

  const menuRowClass =
    "flex h-auto w-full items-center gap-3 rounded-none px-0 py-3.5 text-left text-[17px] font-medium leading-snug tracking-[-0.01em] text-white transition-colors";

  return (
    <div ref={rootRef} className={cn("relative", isMenu && "w-full", className)}>
      <button
        type="button"
        className={cn(
          isMenu ? menuRowClass : "inline-flex h-9 items-center gap-2 rounded-xl px-2.5 text-sm font-medium transition-colors",
          !isMenu && shellClass,
          buttonClassName,
        )}
        aria-label={t("language.select")}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        <LocaleFlag locale={current.code} size={isMenu ? "md" : "md"} />
        <span className={cn(isMenu ? "min-w-0 flex-1 truncate" : "hidden sm:inline")}>{current.label}</span>
        {!isMenu ? (
          <span className="shrink-0 text-[11px] font-bold tracking-wide opacity-70">{current.shortCode}</span>
        ) : null}
        <ChevronDown
          className={cn(
            "size-[18px] shrink-0 text-white/70 transition-transform duration-200",
            open && "-rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        isMenu ? (
          <ul role="listbox" aria-label={t("language.select")} className="pb-1">
            {LOCALE_OPTIONS.map((option) => (
              <li key={option.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.code === locale}
                  className={cn(
                    "flex w-full items-center gap-3 py-2.5 pl-5 text-left text-[17px] font-normal leading-snug tracking-[-0.01em] transition-colors",
                    option.code === locale ? "text-white" : "text-white/90 hover:text-white",
                  )}
                  onClick={() => {
                    setLocale(option.code as AppLocale);
                    setOpen(false);
                  }}
                >
                  <LocaleFlag locale={option.code} size="md" />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
        <ul
          role="listbox"
          aria-label={t("language.select")}
          className={cn(
            "absolute z-[220] mt-2 min-w-[11rem] overflow-hidden rounded-2xl border shadow-xl",
            menuAlign === "start" ? "left-0" : "right-0",
            isDarkShell ? "border-white/10 bg-[#111111]" : "border-neutral-200 bg-white",
          )}
        >
          {LOCALE_OPTIONS.map((option) => (
            <li key={option.code}>
              <button
                type="button"
                role="option"
                aria-selected={option.code === locale}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  option.code === locale
                    ? isDarkShell
                      ? "bg-white/10 text-white"
                      : "bg-neutral-100 text-neutral-900"
                    : isDarkShell
                      ? "text-zinc-300 hover:bg-white/5 hover:text-white"
                      : "text-neutral-700 hover:bg-neutral-50",
                )}
                onClick={() => {
                  setLocale(option.code as AppLocale);
                  setOpen(false);
                }}
              >
                <LocaleFlag locale={option.code} size="md" />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                <span
                  className={cn(
                    "shrink-0 text-[11px] font-bold tracking-wide",
                    isDarkShell ? "text-zinc-500" : "text-neutral-400",
                  )}
                >
                  {option.shortCode}
                </span>
              </button>
            </li>
          ))}
        </ul>
        )
      ) : null}
    </div>
  );
}
