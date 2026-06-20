"use client";

import { ArrowRight, Quote } from "@/lib/lucide";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { PartnerFaqList } from "@/components/partner-program/partner-faq-list";
import { PartnerApplyTriggerButton } from "@/components/partner-program/partner-apply-trigger-button";
import { PartnerHowScene } from "@/components/partner-program/partner-how-scene";
import { useI18n } from "@/components/providers/i18n-provider";
import { buttonVariants } from "@/components/ui/button";
import type { PartnerProgramTabId } from "@/constants/dashboard/partner-program";
import {
  partnerApplyMailto,
  partnerBenefits,
  partnerFaqItems,
  partnerFormats,
  partnerHowSteps,
  PARTNER_CONTACT_EMAIL,
  partnerRequirements,
  partnerVoices,
} from "@/constants/partner-program-mock";
import { ROUTES } from "@/constants/routes";
import { isLiveServicesEnabled } from "@/lib/public-env";
import { cn } from "@/lib/utils";

const surfaceCard = "rounded-2xl bg-[#111111]";

function PartnerVoicesBlock() {
  const { t } = useI18n();
  const [activeId, setActiveId] = useState(partnerVoices[0]!.id);
  const voice = partnerVoices.find((v) => v.id === activeId) ?? partnerVoices[0]!;

  return (
    <div className="relative">
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Trust</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-500">
          Истории из комьюнити — без лишнего пафоса, в тоне продукта.
        </p>
      </div>

      <div
        className="mx-auto mt-8 flex max-w-full flex-wrap items-center justify-center gap-2 sm:gap-2.5"
        role="tablist"
        aria-label={t("partner.community.trust.tabsAria")}
      >
        {partnerVoices.map((v) => {
          const on = v.id === activeId;
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActiveId(v.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-2 text-left text-xs font-medium transition-all ring-1 sm:text-[13px]",
                on
                  ? "bg-white/14 text-white ring-white/22"
                  : "bg-black/45 text-zinc-400 ring-white/10 hover:bg-white/7 hover:text-zinc-200",
              )}
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-black/80 text-[11px] font-semibold text-zinc-200 ring-1 ring-white/10">
                {v.avatarLetter}
              </span>
              {v.tabLabel}
            </button>
          );
        })}
      </div>

      <div className="relative mx-auto mt-10 max-w-[640px] px-2 sm:px-0">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          {[12, -10, -14, 8].map((deg, i) => (
            <div
              key={deg}
              className="absolute aspect-4/3 w-[88%] max-w-[520px] rounded-2xl bg-[#0a0a0a] ring-1 ring-white/4"
              style={{
                transform: `rotate(${deg}deg) translateY(${i * 4}px) scale(${0.92 - i * 0.04})`,
                opacity: 0.22 - i * 0.04,
                zIndex: 0 - i,
              }}
            />
          ))}
        </div>

        <article className="relative z-10 overflow-hidden rounded-3xl bg-[#141414]/95 px-6 py-8 ring-1 ring-white/12 backdrop-blur-[2px] sm:px-9 sm:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_60%_at_80%_0%,rgba(255,255,255,0.1),transparent_55%)]" aria-hidden />
          <Quote className="absolute right-5 top-5 size-16 text-white/6 sm:right-8 sm:top-8 sm:size-20" aria-hidden />
          <div className="relative space-y-4">
            {voice.quote.map((p, idx) => (
              <p key={`${voice.id}-${idx}`} className="text-sm leading-relaxed text-zinc-200 sm:text-base">
                {p}
              </p>
            ))}
          </div>
          <footer className="relative mt-8 flex items-center gap-3 border-t border-white/8 pt-6">
            <span className="flex size-10 items-center justify-center rounded-full bg-white/14 text-sm font-semibold text-white ring-1 ring-white/20">
              {voice.avatarLetter}
            </span>
            <div>
              <p className="text-sm font-medium text-white">{voice.tabLabel}</p>
              <p className="text-xs text-zinc-500">{voice.role}</p>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}

export type PartnerProgramPageContentProps = {
  activeTab: PartnerProgramTabId;
};

export function PartnerProgramPageContent({ activeTab }: PartnerProgramPageContentProps) {
  const liveMarketing = !isLiveServicesEnabled();
  const liveApply = isLiveServicesEnabled();

  return (
    <div className="space-y-10 pb-8 md:space-y-12">
      {activeTab === "about" ? (
        <div className="space-y-10">
          <section
            className={cn(
              "relative overflow-hidden rounded-3xl px-6 py-8 sm:px-8 sm:py-10",
              "bg-linear-to-br from-[#181818] via-[#141414] to-[#101010]",
            )}
          >
            <Image
              src="/images/partner-programtab=about/back.jpg"
              alt=""
              fill
              className="object-cover object-center opacity-55"
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/28" aria-hidden />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_75%_at_80%_0%,rgba(255,255,255,0.15),transparent_55%)]" aria-hidden />

            <div className="relative grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                  Монетизируйте своё влияние с Spliton
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-200">
                  Развивайтесь вместе с платформой revenue share по музыкальным трекам. Партнёрка - для профессионального и
                  медийного сотрудничества;{" "}
                  <Link href={ROUTES.referralProgram} className="text-[#d4f570] underline-offset-4 hover:underline">
                    реферальная программа
                  </Link>{" "}
                  остаётся в кабинете для личных приглашений.
                </p>
                <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {liveApply ? (
                    <PartnerApplyTriggerButton
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "h-11 border-0 bg-[#B7F500] px-6 text-sm font-semibold text-black hover:bg-[#c8ff3d]",
                      )}
                    />
                  ) : (
                    <a
                      href={partnerApplyMailto("Заявка: партнёрская программа Spliton")}
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "h-11 border-0 bg-[#B7F500] px-6 text-sm font-semibold text-black hover:bg-[#c8ff3d]",
                      )}
                    >
                      Подать заявку
                      <ArrowRight className="ml-2 size-4" aria-hidden />
                    </a>
                  )}
                  <Link
                    href={ROUTES.referralProgram}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "h-11 border-0 bg-[#0a0a0a]/80 text-zinc-100 hover:bg-white/8",
                    )}
                  >
                    Реферальная программа для пользователей
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl bg-black/45 p-4 text-right backdrop-blur-sm">
                {liveMarketing ? (
                  <>
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">Расч. месячная выплата</p>
                    <p className="mt-3 text-7xl font-semibold leading-none tracking-tight text-white md:text-8xl">7 388</p>
                    <p className="mt-2 text-base font-medium text-zinc-200">USDT</p>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">Партнёрская программа</p>
                    <p className="mt-3 text-lg font-semibold leading-snug text-white">Условия и выплаты</p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                      Индивидуально по договорённости. Доход не гарантируется и зависит от формата сотрудничества.
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8" aria-labelledby="what-title">
            <Image
              src="/images/partner-programtab=about/back.jpg"
              alt=""
              fill
              className="object-cover object-center opacity-65"
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/55" aria-hidden />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_70%_at_14%_12%,rgba(255,255,255,0.16),transparent_58%)]" aria-hidden />

            <div className="relative space-y-8">
              <div className="max-w-3xl rounded-3xl bg-black/55 p-6 backdrop-blur-[1px] sm:p-8">
                <h2 id="what-title" className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                  Что это за программа
                </h2>
                <p className="mt-2 text-xl font-medium leading-snug text-zinc-200 sm:text-2xl">Имиджевый, но продуктовый контур Spliton.</p>
                <p className="mt-5 text-sm leading-relaxed text-zinc-200 sm:text-base">
                  Партнёрская программа соединяет платформу с теми, кто усиливает доверие и охват: медиа, комьюнити-лидеры,
                  rights-экосистема и стратегические игроки. Это не замена реферальной механики — разные цели и договорённости.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
                  Ценность — в прозрачных условиях, доступе к материалам и совместном росте вокруг музыкальных rights и USDT
                  (TRC20) в продукте.
                </p>
              </div>

              <section aria-labelledby="formats-title">
                <h3 id="formats-title" className="text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Форматы партнёрства
                </h3>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {partnerFormats.map((f, index) => (
                    <article
                      key={f.id}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl bg-zinc-900/48 p-5 backdrop-blur-[2px] sm:p-6",
                        index > 1 && "sm:col-span-2",
                      )}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 transition-opacity duration-300 group-hover:opacity-80"
                        style={{
                          background:
                            "linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.08) 100%)",
                        }}
                        aria-hidden
                      />
                      <div className="relative">
                        <h4 className="text-2xl font-semibold tracking-tight text-white sm:text-[30px]">{f.title}</h4>
                        <p className="mt-1 text-xl leading-snug text-zinc-200 sm:text-2xl">({f.subtitle})</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </section>

          <section aria-labelledby="benefits-title">
            <h2 id="benefits-title" className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Наши преимущества
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { id: "a1", title: "До 50% комиссии в USDT", img: "/images/partner-programtab=about/2.jpg" },
                { id: "a2", title: "Прозрачная аналитика и выделенная поддержка", img: "/images/partner-programtab=about/3.jpg" },
                { id: "a3", title: "Co-marketing и ранний доступ", img: "/images/partner-programtab=about/4.jpg" },
              ].map((b) => (
                <div key={b.id} className={cn("relative overflow-hidden p-6", surfaceCard)}>
                  <Image src={b.img} alt="" fill className="object-cover object-center opacity-25" sizes="(max-width: 1200px) 33vw, 360px" />
                  <div className="pointer-events-none absolute inset-0 bg-black/55" aria-hidden />
                  <h3 className="relative font-semibold text-white">{b.title}</h3>
                </div>
              ))}
            </div>
          </section>

          {liveMarketing ? (
            <section className={cn("relative overflow-hidden p-6 sm:p-8", surfaceCard)} aria-label="Ключевые показатели">
              <Image
                src="/images/partner-programtab=about/back.jpg"
                alt=""
                fill
                className="object-cover object-center opacity-20"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
              <div className="pointer-events-none absolute inset-0 bg-black/60" aria-hidden />
              <div className="relative grid gap-5 md:grid-cols-3">
                <div>
                  <p className="text-sm text-[#d4f570]">Более</p>
                  <p className="mt-1 text-5xl font-semibold text-white">15 000</p>
                  <p className="text-xl text-zinc-300">партнёров</p>
                </div>
                <div>
                  <p className="text-sm text-[#d4f570]">Более</p>
                  <p className="mt-1 text-5xl font-semibold text-white">120</p>
                  <p className="text-xl text-zinc-300">сообществ</p>
                </div>
                <div>
                  <p className="text-sm text-[#d4f570]">Более</p>
                  <p className="mt-1 text-5xl font-semibold text-white">20 000</p>
                  <p className="text-xl text-zinc-300">USDT средний доход</p>
                </div>
              </div>
            </section>
          ) : (
            <section className={cn("p-6 sm:p-8", surfaceCard)} aria-label="О программе">
              <p className="text-lg font-semibold text-white">Партнёрская программа в разработке</p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
                Мы не публикуем демонстрационную статистику и отзывы. На этой странице — описание форматов, требования и
                форма заявки; финальные условия согласуются индивидуально.
              </p>
            </section>
          )}

          <PartnerHowScene />
        </div>
      ) : null}

      {activeTab === "process" ? (
        <div className="space-y-10">
          <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8" aria-labelledby="how-title">
            <Image
              src="/images/partner-programtab=about/back.jpg"
              alt=""
              fill
              className="object-cover object-center opacity-45"
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/52" aria-hidden />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_15%_10%,rgba(255,255,255,0.12),transparent_58%)]" aria-hidden />
            <div className="relative">
              <h2 id="how-title" className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Как это устроено
              </h2>
              <p className="mt-2 text-sm text-zinc-300 sm:text-base">Пять шагов от заявки до регулярной отчётности.</p>
              <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {partnerHowSteps.map((s, i) => (
                  <li key={s.id} className="relative rounded-2xl bg-zinc-900/52 p-5 pt-8 backdrop-blur-[2px]">
                    <span className="absolute -top-3 left-5 flex size-8 items-center justify-center rounded-full bg-zinc-950 text-xs font-bold text-zinc-100">
                      {i + 1}
                    </span>
                    <h3 className="font-semibold text-white">{s.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-300 sm:text-sm">{s.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="rounded-3xl bg-[#121212] p-6 sm:p-8" aria-labelledby="req-title">
            <h2 id="req-title" className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Кого мы рассматриваем
            </h2>
            <p className="mt-2 text-sm text-zinc-400 sm:text-base">Критерии отбора и качество взаимодействия с аудиторией.</p>
            <ul className="mt-7 space-y-4">
              {partnerRequirements.map((r) => (
                <li key={r} className="flex gap-3 rounded-xl bg-zinc-900/45 px-4 py-3 text-sm leading-relaxed text-zinc-200 sm:text-base">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-zinc-200" aria-hidden />
                  {r}
                </li>
              ))}
            </ul>
          </section>

          <section
            id="apply"
            className="relative overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-10 sm:py-14"
            aria-labelledby="apply-title"
          >
            <Image
              src="/images/partner-programtab=about/back.jpg"
              alt=""
              fill
              className="object-cover object-center opacity-35"
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/60" aria-hidden />
            <div className="relative">
              <h2 id="apply-title" className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Присоединяйтесь к росту Spliton
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-300 sm:text-base">
              Напишите на{" "}
              <a href={`mailto:${PARTNER_CONTACT_EMAIL}`} className="font-mono text-white hover:underline">
                {PARTNER_CONTACT_EMAIL}
              </a>{" "}
              или отправьте заявку одним кликом - в письме укажите ссылку на площадку и желаемый формат партнёрства.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                {liveApply ? (
                  <Link
                    href={`${ROUTES.partnerProgram}?tab=about#partner-apply`}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "h-11 min-w-[220px] border-0 bg-white px-8 text-sm font-semibold text-black hover:bg-zinc-200",
                    )}
                  >
                    Отправить заявку
                  </Link>
                ) : (
                  <a
                    href={partnerApplyMailto("Партнёрская программа Spliton — заявка")}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "h-11 min-w-[220px] border-0 bg-white px-8 text-sm font-semibold text-black hover:bg-zinc-200",
                    )}
                  >
                    Отправить заявку
                  </a>
                )}
                <Link
                  href={ROUTES.support}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-11 border-0 bg-black/65 text-zinc-100 hover:bg-white/10",
                  )}
                >
                  Вопросы в поддержку
                </Link>
              </div>
              <p className="mt-6 text-xs text-zinc-400">
                {liveApply
                  ? "Пройдите короткий опрос и отправьте заявку в партнёрском кабинете на вкладке «О программе»."
                  : "Онлайн-форма в кабинете подключится позже — сейчас точка входа через почту партнёрской команды."}
              </p>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "community" ? (
        <section className="relative overflow-hidden rounded-3xl px-4 py-12 sm:px-8 sm:py-14" aria-labelledby="voices-title">
          <Image
            src="/images/partner-programtab=about/back.jpg"
            alt=""
            fill
            className="object-cover object-center opacity-42"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/58" aria-hidden />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_65%_at_18%_8%,rgba(255,255,255,0.13),transparent_60%)]" aria-hidden />
          <h2 id="voices-title" className="sr-only">
            {liveMarketing ? "Отзывы партнёров" : "Партнёрское комьюнити"}
          </h2>
          <div className="relative">
            {liveMarketing ? (
              <PartnerVoicesBlock />
            ) : (
              <div className="mx-auto max-w-xl rounded-2xl bg-[#141414]/90 px-6 py-8 text-center">
                <p className="text-lg font-semibold text-white">Партнёрское комьюнити</p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                  Мы готовим материалы и кейсы для партнёров. Пока доступны условия программы, FAQ и форма заявки — без
                  демонстрационных отзывов и статистики.
                </p>
                <p className="mt-4 text-xs text-zinc-500">
                  Доход и результаты партнёров зависят от формата сотрудничества и не гарантируются.
                </p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === "faq" ? (
        <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8" aria-labelledby="faq-title">
          <Image
            src="/images/partner-programtab=about/back.jpg"
            alt=""
            fill
            className="object-cover object-center opacity-36"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/60" aria-hidden />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(88%_62%_at_14%_8%,rgba(255,255,255,0.12),transparent_60%)]" aria-hidden />

          <div className="relative">
            <h2 id="faq-title" className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Вопросы и ответы
            </h2>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">Партнёрский контур и отличия от реферальной программы.</p>
            <div className="mt-6 rounded-2xl bg-[#131313]/85 p-2 backdrop-blur-[2px] sm:p-3">
              <PartnerFaqList items={partnerFaqItems} defaultOpenId={partnerFaqItems[0]?.id ?? null} />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
