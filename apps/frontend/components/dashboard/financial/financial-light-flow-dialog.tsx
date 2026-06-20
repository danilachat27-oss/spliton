"use client";

import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { CheckCircle2, XCircle } from "@/lib/lucide";

import { SplitonLoader } from "@/components/ui/spliton-loader";
import { cn } from "@/lib/utils";

export type FinancialLightFlowStep = "processing" | "success" | "failed";

type Action = {
  label: string;
  onClick?: () => void;
  href?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: FinancialLightFlowStep;
  blockDismiss?: boolean;
  title: string;
  description?: string;
  children?: React.ReactNode;
  primaryAction?: Action;
  secondaryAction?: Action;
};

function ActionButton({ action, variant }: { action: Action; variant: "primary" | "secondary" }) {
  const className = cn(
    "inline-flex h-11 flex-1 items-center justify-center rounded-xl px-4 text-sm font-semibold",
    variant === "primary"
      ? "bg-neutral-900 text-white hover:bg-neutral-800"
      : "border border-neutral-200 text-neutral-800 hover:bg-neutral-50",
  );

  if (action.href) {
    return (
      <Link href={action.href} onClick={action.onClick} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  );
}

export function FinancialLightFlowDialog({
  open,
  onOpenChange,
  step,
  blockDismiss = false,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
}: Props) {
  const dismissBlocked = blockDismiss || step === "processing";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (dismissBlocked && !next) return;
        onOpenChange(next);
      }}
      modal
    >
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-[127] bg-black/60 backdrop-blur-[2px]",
            dismissBlocked && "pointer-events-none",
          )}
        />
        <Dialog.Popup
          className="fixed left-1/2 top-1/2 z-[128] w-[min(100vw-1.5rem,460px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl"
          onKeyDown={(e) => {
            if (dismissBlocked && e.key === "Escape") e.preventDefault();
          }}
        >
          {step === "processing" ? (
            <div className="flex flex-col items-center py-4 text-center">
              <SplitonLoader size="md" variant="dark" />
              <Dialog.Title className="mt-5 text-lg font-semibold text-neutral-950">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-2 text-sm text-neutral-600">{description}</Dialog.Description>
              ) : null}
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3">
                {step === "success" ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  <Dialog.Title className="text-lg font-semibold text-neutral-950">{title}</Dialog.Title>
                  {description ? (
                    <Dialog.Description className="mt-1 text-sm text-neutral-600">{description}</Dialog.Description>
                  ) : null}
                </div>
              </div>
              {children ? <div className="mt-4">{children}</div> : null}
              {(primaryAction || secondaryAction) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {secondaryAction ? <ActionButton action={secondaryAction} variant="secondary" /> : null}
                  {primaryAction ? <ActionButton action={primaryAction} variant="primary" /> : null}
                </div>
              )}
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
