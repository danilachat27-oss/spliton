import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function AnalyticsStatCard({
  label,
  value,
  hint,
  href,
  backgroundSrc,
  priority,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  backgroundSrc?: string;
  priority?: boolean;
}) {
  const valueClassName =
    "mt-2 truncate font-mono text-2xl font-bold tabular-nums leading-none tracking-tight text-white sm:text-[1.75rem]";

  return (
    <div className="relative overflow-hidden rounded-2xl px-3.5 py-4 ring-1 ring-white/[0.08]">      {backgroundSrc ? (
        <>
          <Image
            src={backgroundSrc}
            alt=""
            fill
            priority={priority}
            className="object-cover object-center"
            sizes="(max-width: 640px) 50vw, 280px"
          />
          <div className="absolute inset-0 bg-black/50" aria-hidden />
        </>
      ) : (
        <div className="absolute inset-0 bg-[#111111]" aria-hidden />
      )}
      <div className="relative z-10 min-w-0">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          {label}
        </div>
        {href ? (
          <Link
            href={href}
            className={cn(valueClassName, "block transition hover:text-zinc-200 hover:underline underline-offset-2")}
            title={value}
          >
            {value}
          </Link>
        ) : (
          <div className={valueClassName} title={value}>
            {value}
          </div>
        )}
        {hint ? <div className="mt-1.5 font-sans text-[11px] text-zinc-400">{hint}</div> : null}
      </div>
    </div>
  );
}
