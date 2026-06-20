import Link from "next/link";
import { ArrowRight } from "@/lib/lucide";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const steps = [
  { n: "1", title: "Изучите релиз", text: "Параметры сделки, юниты и прогнозный сценарий дохода." },
  { n: "2", title: "Войдите в проект", text: "Покупка доли в USDT (TRC20) в несколько кликов." },
  { n: "3", title: "Следите за метриками", text: "Динамика, начисления и события доступны в реальном времени." },
  { n: "4", title: "Управляйте ликвидностью", text: "Вторичный рынок помогает перераспределять позиции внутри платформы." },
] as const;

const card = "rounded-2xl bg-[#111111] p-5 ring-1 ring-white/[0.06] transition-colors hover:ring-[#B7F500]/20 md:p-6";

export function DashboardHowItWorks({ className }: { className?: string }) {
  return (
    <section
      id="secondary"
      className={cn("scroll-mt-24 border-t border-white/8 py-12 md:py-16 lg:py-20", className)}
      aria-labelledby="dash-how-heading"
    >
      <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Сценарий пользователя</p>
          <h2 id="dash-how-heading" className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Как устроен продукт
          </h2>
          <p className="mt-2 max-w-xl text-sm text-zinc-500">Главный путь: от выбора релиза до управления доходностью и выходом из позиции.</p>
        </div>
        <Link
          href={ROUTES.dashboardSecondaryMarket}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[#d4f570] transition hover:text-[#e8ff9a]"
        >
          Перейти к рынку
          <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
        </Link>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {steps.map((s) => (
          <li key={s.n} className={card}>
            <span className="mb-4 flex size-9 items-center justify-center rounded-full bg-[#B7F500]/12 text-xs font-bold text-[#d4f570] ring-1 ring-[#B7F500]/25">
              {s.n}
            </span>
            <h3 className="text-[15px] font-semibold text-white">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
