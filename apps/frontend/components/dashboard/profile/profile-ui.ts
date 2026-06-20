import { cn } from "@/lib/utils";

/** Белая плитка на сером фоне — без рамок и теней (OKX). */
export const profileCardClass = "rounded-2xl bg-white px-4 py-5 sm:px-6";

export function profileSectionClass(extra?: string) {
  return cn(profileCardClass, extra);
}

/** Вторичная плитка — чуть другой фон, без outline. */
export const profileMutedCardClass = "rounded-2xl bg-neutral-50 px-4 py-4 sm:px-5 sm:py-4";

/** Вложенная панель (списки методов входа, toggles). */
export const profilePanelClass = "rounded-2xl bg-neutral-50";

/** Строки внутри карточки. */
export const profileListClass = "divide-y divide-neutral-100";

export const profilePrimaryButtonClass =
  "inline-flex h-10 items-center justify-center rounded-full bg-[#B7F500] px-4 text-[13px] font-semibold text-black transition hover:bg-[#c8ff3d] active:scale-[0.98]";

export const profileSecondaryButtonClass =
  "inline-flex h-10 items-center justify-center rounded-full bg-neutral-100 px-4 text-[13px] font-semibold text-neutral-800 transition hover:bg-neutral-200/80 active:scale-[0.98]";

export const profileOutlineButtonClass =
  "inline-flex h-9 items-center justify-center rounded-full bg-neutral-100 px-4 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200/80";

export const profileInputClass =
  "h-11 w-full rounded-2xl bg-neutral-100 px-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:bg-white";

// For profile modals we keep the same input sizing/visuals,
// but expose a dedicated name to keep existing imports stable.
export const profileModalInputClass = profileInputClass;
