"use client";

import Image from "next/image";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

const RING_R = 86;
const RING_C = 2 * Math.PI * RING_R;

type RegisterBrandPanelProps = {
  step: 1 | 2 | 3;
  className?: string;
};

export function RegisterBrandPanel({ step, className }: RegisterBrandPanelProps) {
  const { t } = useI18n();
  const progress = (step - 1) / 2;
  const dashOffset = RING_C * (1 - progress);

  return (
    <div
      className={cn(
        "flex min-h-[300px] flex-1 flex-col bg-black px-8 py-10 text-white sm:min-h-[320px] sm:px-10 sm:py-12 lg:min-h-dvh lg:px-12 lg:py-14",
        className,
      )}
    >
      <div className="max-w-lg font-sans">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/80">
          {t("auth.brand.registerEyebrow")}
        </p>
        <h1 className="mt-2 text-balance text-[1.65rem] font-bold leading-[1.15] tracking-[-0.02em] text-white sm:text-[1.85rem] lg:text-[2rem]">
          {t("auth.brand.registerTitle")}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-400">
          {t("auth.brand.registerDescription")}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-10 lg:py-6">
        <div
          className="relative flex w-[min(280px,78vw)] items-center justify-center"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label={t("auth.brand.registerProgressAria")}
        >
          <div className="relative aspect-square w-full max-w-[260px]">
            <svg
              className="absolute inset-0 size-full -rotate-90 text-neutral-600"
              viewBox="0 0 200 200"
              aria-hidden
            >
              <circle
                cx="100"
                cy="100"
                r={RING_R}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.35}
                strokeWidth="4"
              />
              <circle
                cx="100"
                cy="100"
                r={RING_R}
                fill="none"
                stroke="white"
                strokeOpacity={0.9}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={dashOffset}
                className="transition-[stroke-dashoffset] duration-700 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative size-18 sm:size-20" aria-hidden>
                <Image
                  src="/images/LOGO/mini-logo.png"
                  alt=""
                  fill
                  className="object-contain"
                  sizes="80px"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
