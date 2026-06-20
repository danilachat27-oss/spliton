"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const CATALOG_EMPTY_IMAGE_SRC = "/images/catalog/catalog-nothing-found.png";

export function CatalogEmptyState({
  title,
  hint,
  action,
  className,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-4 py-14 text-center sm:py-16", className)}>
      <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[320px]">
        <Image
          src={CATALOG_EMPTY_IMAGE_SRC}
          alt=""
          width={640}
          height={640}
          className="h-auto w-full object-contain"
          priority={false}
        />
      </div>
      <p className="mt-6 max-w-md text-base font-medium text-zinc-200">{title}</p>
      {hint ? <p className="mt-2 max-w-md text-sm text-zinc-500">{hint}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
