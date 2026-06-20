"use client";

import type { ReactNode } from "react";
import { Pencil } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { profileListClass } from "@/components/dashboard/profile/profile-ui";

export const profileSettingsListClass = cn("mt-4", profileListClass);

export function ProfileSettingsList({ children }: { children: ReactNode }) {
  return <ul className={profileSettingsListClass}>{children}</ul>;
}

export function ProfileSettingsToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <li className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-900">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-[#B7F500]" : "bg-neutral-200",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </li>
  );
}

export function ProfileSettingsEditableRow({
  label,
  hint,
  displayValue,
  editing,
  onStartEdit,
  onDone,
  editControl,
}: {
  label: string;
  hint?: string;
  displayValue: ReactNode;
  editing: boolean;
  onStartEdit: () => void;
  onDone: () => void;
  editControl: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-900">{label}</p>
        {hint ? <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{hint}</p> : null}
        {editing ? <div className="mt-3 max-w-md">{editControl}</div> : null}
        {!editing ? <p className="mt-1.5 text-sm text-neutral-700">{displayValue}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
        {editing ? (
          <button
            type="button"
            onClick={onDone}
            className="inline-flex h-9 items-center rounded-full bg-neutral-100 px-4 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-200/80"
          >
            {t("profile.settings.done")}
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartEdit}
            className="inline-flex size-9 items-center justify-center rounded-full text-neutral-400 transition hover:bg-white hover:text-neutral-700"
            aria-label={t("profile.settings.editAria").replace("{label}", label)}
          >
            <Pencil className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </li>
  );
}
