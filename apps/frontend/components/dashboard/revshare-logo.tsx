import NextImage from "next/image";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

/** Бренд Spliton в шапке кабинета и админки. */
export function SplitonLogo({
  className,
  href = ROUTES.dashboard,
}: {
  className?: string;
  /** Например, {@link ROUTES.admin} для консоли оператора. */
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center overflow-hidden rounded-xl",
        className,
      )}
      aria-label="Spliton"
    >
      <NextImage
        src="/images/LOGO/mini-logo.png"
        alt="Spliton"
        width={28}
        height={28}
        className="size-7 rounded-xl object-contain"
        priority
      />
    </Link>
  );
}

/** @deprecated Используйте {@link SplitonLogo}. */
export const RevShareLogo = SplitonLogo;
