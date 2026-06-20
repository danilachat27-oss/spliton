"use client";

import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

type ProfileSecurityModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
};

export function ProfileSecurityModal({
  open,
  onOpenChange,
  title,
  description,
  eyebrow,
  children,
  footer,
  widthClassName = "w-[min(100vw-1.5rem,440px)]",
}: ProfileSecurityModalProps) {
  const { t } = useI18n();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-[200] bg-black/50 backdrop-blur-[2px]",
            "transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-[201] flex max-h-[min(92dvh,640px)] -translate-x-1/2 -translate-y-1/2 flex-col",
            "overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_-24px_rgba(0,0,0,0.35)]",
            "transition-[opacity,transform] duration-200",
            "data-ending-style:scale-[0.98] data-ending-style:opacity-0",
            "data-starting-style:scale-[0.98] data-starting-style:opacity-0",
            widthClassName,
          )}
        >
          <div className="relative shrink-0 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
            {eyebrow ? (
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">{eyebrow}</p>
            ) : null}
            <Dialog.Title
              className={cn(
                "text-lg font-semibold tracking-tight text-neutral-900",
                eyebrow ? "mt-1" : undefined,
              )}
            >
              {title}
            </Dialog.Title>
            {description ? (
              <Dialog.Description className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                {description}
              </Dialog.Description>
            ) : null}
            <Dialog.Close
              aria-label={t("profile.security.modal.closeAria")}
              className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-6">{children}</div>

          {footer ? (
            <footer className="shrink-0 border-0 px-5 pb-5 pt-3 sm:px-6 sm:pb-6">{footer}</footer>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ProfileSecurityModalFieldList({ children }: { children: ReactNode }) {
  return <ul className="space-y-3 pb-1">{children}</ul>;
}

export function ProfileSecurityModalField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <li>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-neutral-700">
        {label}
      </label>
      {children}
    </li>
  );
}

export function ProfileSecurityModalHints({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-1.5 rounded-xl bg-[#F5F5F5] px-4 py-3 text-xs leading-relaxed text-neutral-600">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-neutral-400" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
