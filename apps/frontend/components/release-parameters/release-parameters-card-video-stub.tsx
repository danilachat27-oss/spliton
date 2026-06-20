"use client";

import { Play } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

type VideoStubMode = "full" | "chrome";

/**
 * Заглушка видео-обложки релиза.
 * `full` — на весь контейнер (родитель `relative` + этот блок `absolute inset-0`).
 * `chrome` — узкая колонка с подписью «Видео» (legacy / отладка).
 */
export function ReleaseParametersCardVideoStub({
  className,
  mode = "full",
}: {
  className?: string;
  mode?: VideoStubMode;
}) {
  const { t } = useI18n();
  const bg =
    "bg-[radial-gradient(90%_70%_at_50%_18%,rgba(56,189,248,0.16),transparent_52%),linear-gradient(180deg,#151515_0%,#060606_100%)]";

  if (mode === "full") {
    return (
      <div className={cn("absolute inset-0 overflow-hidden", bg, className)}>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,transparent_40%,rgba(255,255,255,0.045)_50%,transparent_60%)] opacity-70" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="flex size-[72px] items-center justify-center rounded-full bg-white/[0.08] text-white backdrop-blur-[2px]"
            aria-hidden
          >
            <Play className="ml-1 size-8 fill-white text-white" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex min-h-[160px] w-full flex-1 flex-col justify-between overflow-hidden",
        bg,
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,transparent_42%,rgba(255,255,255,0.04)_50%,transparent_58%)] opacity-60" />
      <p className="relative px-3 pt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {t("catalog.releaseParameters.video.label")}
      </p>
      <div className="relative flex flex-1 items-center justify-center py-3">
        <div
          className="flex size-[52px] items-center justify-center rounded-full bg-white/[0.08] text-white backdrop-blur-[1px]"
          aria-hidden
        >
          <Play className="ml-0.5 size-5 fill-white text-white" strokeWidth={1.5} />
        </div>
      </div>
      <p className="relative bg-black/50 px-3 py-2 text-[10px] leading-snug text-zinc-600">
        {t("catalog.releaseParameters.video.stub")}
      </p>
    </div>
  );
}
