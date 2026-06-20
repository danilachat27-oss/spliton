"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calculator, Library } from "@/lib/lucide";

import { UntMark } from "@/components/shared/asset-marks";
import {
  UNT_SCENE_PANELS,
  UntSceneFrame,
} from "@/components/shared/unt-explainer-scenes";
import { UNT_ACTIONS, UNT_SCENES } from "@/constants/unt-explainer-data";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

type UntExplainerProps = { className?: string };

export function UntExplainer({ className }: UntExplainerProps) {
  return (
    <section className={cn("text-neutral-900", className)} aria-labelledby="unt-explainer-title">
      <header className="flex min-h-[min(44vh,420px)] flex-col items-center justify-center gap-4 px-5 pb-10 pt-8 text-center sm:px-6 sm:pb-12 sm:pt-10">
        <div className="inline-flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
          <Image
            src="/images/urrency/units.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/75 [text-shadow:0_1px_2px_rgba(0,0,0,0.65)]">
            Spliton · образование
          </p>
          <h1
            id="unt-explainer-title"
            className="text-4xl font-semibold leading-tight tracking-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.55)] sm:text-5xl lg:text-[56px]"
          >
            Что такое UNT и релиз?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
            Пять интерактивных сцен ниже показывают путь от релиза в каталоге до начислений и secondary market.
            UNT — внутренняя единица доли дохода по конкретному релизу, не отдельная криптовалюта.
          </p>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Link
            href={ROUTES.dashboardCatalog}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/18"
          >
            <Library className="size-4" aria-hidden />
            Каталог релизов
          </Link>
          <Link
            href={ROUTES.calculator}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/18"
          >
            <Calculator className="size-4" aria-hidden />
            Калькулятор
          </Link>
          <Link
            href={ROUTES.catalogReleaseParameters}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/18"
          >
            Параметры карточки
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </header>

      <div className="rounded-3xl bg-white px-5 py-6 shadow-sm ring-1 ring-neutral-200/80 sm:px-8 sm:py-8">
        <nav className="flex flex-wrap gap-2" aria-label="Сцены объяснения UNT">
          {UNT_SCENES.map((scene) => (
            <a
              key={scene.id}
              href={`#unt-scene-${scene.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-white"
            >
              <span className="font-mono text-[10px] text-neutral-400">{scene.step}</span>
              {scene.title}
              <span className="unt-scene-live-dot size-1.5 rounded-full bg-emerald-500" aria-hidden />
            </a>
          ))}
        </nav>
        <p className="mt-3 text-sm text-neutral-500">
          Все сцены анимированы и работают на этой странице — прокрутите к нужному шагу или нажмите на чип выше.
        </p>

        <div className="mt-8 space-y-14 sm:space-y-16">
          {UNT_SCENES.map((scene, index) => {
            const Panel = UNT_SCENE_PANELS[scene.id];
            const reversed = index % 2 === 1;

            return (
              <article
                key={scene.id}
                id={`unt-scene-${scene.id}`}
                className="scroll-mt-28 grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-10"
              >
                <div className={cn(reversed && "lg:order-2")}>
                  <p className="font-mono text-xs font-semibold text-neutral-400">{scene.step}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">{scene.title}</h2>
                  <p className="mt-1 text-sm font-medium text-neutral-500">{scene.subtitle}</p>
                  <p className="mt-4 text-base leading-relaxed text-neutral-600">{scene.description}</p>
                  {scene.id === "release" ? (
                    <p className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-600">
                      <span className="font-semibold text-neutral-900">Релиз</span> — не «трек в Spotify», а продуктовая
                      карточка сделки: эмитент, раунд, объём UNT, условия выплат и статус в каталоге Spliton.
                    </p>
                  ) : null}
                  {scene.id === "pool" ? (
                    <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                      UNT не даёт copyright на музыку — только долю в пользовательском пуле дохода внутри платформы.
                    </p>
                  ) : null}
                </div>

                <div className={cn(reversed && "lg:order-1")}>
                  <UntSceneFrame label={`Spliton · ${scene.title}`}>
                    <Panel />
                  </UntSceneFrame>
                </div>
              </article>
            );
          })}
        </div>

        <section className="mt-14 border-t border-neutral-200/80 pt-10" aria-labelledby="unt-summary-title">
          <h2 id="unt-summary-title" className="text-xl font-semibold text-neutral-900 sm:text-2xl">
            Коротко про UNT
          </h2>
          <div className="mt-5 max-w-[65ch] space-y-4 text-base leading-relaxed text-neutral-600">
            <p>
              <UntMark className="mr-1 inline-block align-middle" />
              <span className="font-semibold text-neutral-900">UNT</span> — единица учёта доли дохода по релизу внутри
              Spliton. Покупая UNT на первичном рынке или на secondary, вы участвуете в распределении дохода этого
              релиза пропорционально количеству единиц.
            </p>
            <p>
              Это не акция, не криптовалюта и не гарантия дохода. Размер начислений зависит от фактических результатов
              релиза. Все суммы в интерфейсе — в USDT (TRC20), комиссии видны до подтверждения операции.
            </p>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="unt-actions-title">
          <h2 id="unt-actions-title" className="text-lg font-semibold text-neutral-900">
            Что можно делать с UNT?
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {UNT_ACTIONS.map((action) => (
              <li key={action.title} className="rounded-2xl bg-neutral-50 px-4 py-4">
                <p className="font-semibold text-neutral-900">{action.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{action.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={ROUTES.dashboardCatalog}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Смотреть релизы в каталоге
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href={ROUTES.fees}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
          >
            Комиссии и расчёты
          </Link>
        </div>
      </div>
    </section>
  );
}
