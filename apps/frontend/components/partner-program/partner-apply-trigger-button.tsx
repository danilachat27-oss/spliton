"use client";

import { ArrowRight } from "@/lib/lucide";

import { usePartnerApplyModal } from "@/components/partner-program/partner-apply-context";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PartnerApplyTriggerButton({ className }: { className?: string }) {
  const { openModal } = usePartnerApplyModal();

  return (
    <button
      type="button"
      onClick={() => {
        openModal();
        if (typeof window !== "undefined") {
          window.location.hash = "partner-apply";
        }
      }}
      className={cn(className)}
    >
      Подать заявку
      <ArrowRight className="ml-2 size-4" aria-hidden />
    </button>
  );
}
