"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { CalendarDays } from "@/lib/lucide";

import { DatePickerCalendar, toIsoDate } from "@/components/ui/date-picker-calendar";
import { Button } from "@/components/ui/button";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { adminFieldInput } from "@/features/admin/lib/admin-ui";
import { formatDisplayDate } from "@/lib/date/calendar-utils";
import { cn } from "@/lib/utils";

type AdminDatePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
};

export function AdminDatePicker({
  id,
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  "aria-label": ariaLabel,
}: AdminDatePickerProps) {
  const { locale, t } = useAdminI18n();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    if (!open) setDraft(value);
  }, [open, value]);

  const localeTag = locale === "en" ? "en-US" : locale === "pt" ? "pt-PT" : locale === "es" ? "es-ES" : "ru-RU";
  const display = value ? formatDisplayDate(value, localeTag) : "";
  const resolvedPlaceholder = placeholder ?? t("admin.datePicker.placeholder");

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  const clear = () => {
    onChange("");
    setDraft("");
    setOpen(false);
  };

  const pickToday = () => {
    const today = toIsoDate(new Date());
    setDraft(today);
  };

  return (
    <>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-9 w-full items-center justify-between gap-2 rounded-xl px-3 text-left text-[13px] transition",
          adminFieldInput,
          !display && "text-zinc-500",
          disabled && "cursor-not-allowed opacity-60",
          className,
        )}
      >
        <span className={cn("truncate", display && "text-zinc-100")}>
          {display || resolvedPlaceholder}
        </span>
        <CalendarDays className="size-4 shrink-0 text-zinc-500" aria-hidden />
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-[1px]" />
          <Dialog.Popup className="admin-portal fixed left-1/2 top-1/2 z-[210] w-[min(360px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-zinc-950 p-5 shadow-2xl shadow-black/50">
            <Dialog.Title className="mb-4 text-base font-semibold text-zinc-100">
              {t("admin.datePicker.title")}
            </Dialog.Title>

            <DatePickerCalendar value={draft} onSelect={setDraft} locale={localeTag} />

            <div className="mt-5 flex items-center justify-between gap-2 border-t border-zinc-800/80 pt-4">
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={clear}>
                  {t("admin.datePicker.clear")}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={pickToday}>
                  {t("admin.datePicker.today")}
                </Button>
              </div>
              <Button type="button" size="sm" onClick={apply}>
                {t("admin.datePicker.apply")}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
