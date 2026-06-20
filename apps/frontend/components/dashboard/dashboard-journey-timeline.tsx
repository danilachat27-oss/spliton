import { cn } from "@/lib/utils";

export type JourneyStep = {
  n: string;
  title: string;
  text: string;
};

export function DashboardJourneyTimeline({
  steps,
  className,
}: {
  steps: readonly JourneyStep[];
  className?: string;
}) {
  return (
    <div className={cn("relative mx-auto max-w-2xl", className)} aria-label="Шаги сценария инвестора">
      <span
        className="absolute left-[47px] top-3 h-[calc(100%-20px)] w-px bg-white/10 sm:left-[55px]"
        aria-hidden
      />

      <ol className="space-y-5 sm:space-y-6">
        {steps.map((step, index) => {
          const stepNum = String(index + 1).padStart(2, "0");

          return (
            <li
              key={step.n}
              className="group relative grid grid-cols-[40px_20px_minmax(0,1fr)] items-start gap-2 sm:grid-cols-[48px_20px_minmax(0,1fr)] sm:gap-3"
            >
              <p className="pt-1.5 text-right font-mono text-[11px] font-semibold tabular-nums text-zinc-500">
                {stepNum}
              </p>

              <div className="relative flex justify-center pt-2">
                <span
                  className={cn(
                    "relative z-10 inline-block size-2.5 shrink-0 rounded-full",
                    index === 0 ? "bg-[#B7F500]" : "bg-zinc-600",
                  )}
                  aria-hidden
                />
              </div>

              <article className="min-w-0 rounded-2xl bg-[#0c0c0e] px-4 py-4 transition hover:bg-[#111114] sm:px-5 sm:py-[18px]">
                <h3 className="text-base font-semibold leading-snug tracking-tight text-white sm:text-[17px]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{step.text}</p>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
