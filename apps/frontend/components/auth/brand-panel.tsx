"use client";

import NextImage from "next/image";
import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";

export function BrandPanel() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-[300px] flex-1 flex-col bg-black px-8 py-10 text-white sm:min-h-[320px] sm:px-10 sm:py-12 lg:min-h-dvh lg:px-12 lg:py-14">
      <div className="max-w-lg font-sans">
        <h1 className="text-balance text-[1.75rem] font-bold leading-[1.15] tracking-[-0.02em] text-white sm:text-[2rem] lg:text-[2.25rem]">
          {t("auth.brand.loginTitle")}
        </h1>
        <p className="mt-3 max-w-md text-base font-normal leading-[1.55] text-neutral-400">
          {t("auth.brand.loginDescription")}
        </p>
      </div>

      <div className="-mt-4 flex flex-1 items-start justify-center pb-8 lg:-mt-6 lg:pb-10">
        <div className="w-full max-w-[600px]">
          <div className="relative mx-auto aspect-9/16 w-full min-h-[440px] max-h-[min(80dvh,1040px)] overflow-hidden rounded-2xl">
            <NextImage
              src="/images/loginphotos.png"
              alt=""
              fill
              className="object-contain object-center"
              sizes="(max-width: 1024px) 92vw, 600px"
              priority
            />
          </div>

          <div className="mt-4 p-1">
            <p className="text-sm font-semibold text-white">{t("auth.brand.telegramTitle")}</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-400">
              {t("auth.brand.telegramBody")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-white px-3 text-xs font-semibold text-black transition-colors hover:bg-neutral-200"
              >
                {t("auth.brand.telegramPrimary")}
              </Link>
              <Link
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-white/10 px-3 text-xs font-semibold text-white transition-colors hover:bg-white/15"
              >
                {t("auth.brand.telegramSecondary")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
