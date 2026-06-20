import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ReleaseSectionShell({
  id,
  title,
  subtitle,
  children,
  className,
  headerAlign = "center",
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  headerAlign?: "center" | "left";
}) {
  return (
    <section id={id} data-release-parameters-section className={className}>
      <div
        className={cn(
          headerAlign === "center" && "mx-auto max-w-3xl text-center",
          headerAlign === "left" && "max-w-3xl text-left",
        )}
      >
        <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl md:text-2xl">{title}</h2>
        {subtitle ? (
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 sm:text-sm">{subtitle}</p>
        ) : null}
      </div>
      <div className="mt-4 md:mt-5">{children}</div>
    </section>
  );
}
