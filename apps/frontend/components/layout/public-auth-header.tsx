"use client";

import Link from "next/link";
import NextImage from "next/image";
import { CircleHelp, Search } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { useLocalizedNavItems } from "@/hooks/use-localized-nav";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export function PublicAuthHeader({ className }: { className?: string }) {
  const { t } = useI18n();
  const navItems = useLocalizedNavItems();

  return (
    <header
      className={cn(
        "sticky top-0 z-[120] overflow-hidden border-b border-transparent bg-black text-white",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-black" aria-hidden />
      <div className="w-full">
        <div className="relative z-[1] flex h-12 items-center gap-2 px-3 sm:h-14 sm:gap-3 sm:px-4 lg:h-[64px] lg:px-5">
          <Link
            href={ROUTES.dashboard}
            className="inline-flex h-9 items-center rounded-md px-1.5 hover:bg-white/8"
          >
            <NextImage
              src="/images/LOGO/mini-logo.png"
              alt="Spliton"
              width={28}
              height={28}
              className="size-7 object-contain"
              priority
            />
          </Link>

          <nav className="hidden min-w-0 items-center gap-0.5 overflow-x-auto sm:flex lg:gap-1">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="shrink-0 rounded-md px-2 py-1.5 text-[11px] font-semibold text-white/80 transition-colors hover:bg-white/8 hover:text-white lg:px-2.5"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              aria-label={t("navigation.publicAuth.search")}
              className="hidden size-9 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/8 hover:text-white sm:inline-flex"
            >
              <Search className="size-4" strokeWidth={1.75} />
            </button>
            <Link
              href={ROUTES.support}
              aria-label={t("navigation.publicAuth.support")}
              className="hidden size-9 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/8 hover:text-white sm:inline-flex"
            >
              <CircleHelp className="size-4" strokeWidth={1.75} />
            </Link>
            <Link
              href={ROUTES.login}
              className="hidden rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/90 transition-colors hover:bg-white/8 hover:text-white sm:inline-flex"
            >
              {t("navigation.publicAuth.login")}
            </Link>
            <Link
              href={ROUTES.register}
              className="inline-flex rounded-md bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-black transition-colors hover:bg-neutral-200"
            >
              {t("navigation.publicAuth.register")}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
