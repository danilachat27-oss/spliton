"use client";

import * as React from "react";
import { Loader2, MessageCircle, Send } from "@/lib/lucide";

import { SupportEmailContactPanel } from "@/components/support/support-email-contact-panel";
import { useI18n } from "@/components/providers/i18n-provider";
import { SUPPORT_HELPDESK_EMAIL } from "@/constants/support-center";
import { tf } from "@/lib/i18n/financial-messages";
import { isLiveSupportContactMode } from "@/lib/support/support-contact-mode";
import { cn } from "@/lib/utils";

type ChatPhase = "idle" | "connecting" | "waiting" | "active";

type ChatMsg = { id: string; role: "user" | "agent" | "system"; text: string; at: string };

function nowTime() {
  return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export type SupportChatWidgetProps = {
  className?: string;
};

export function SupportChatWidget({ className }: SupportChatWidgetProps) {
  if (isLiveSupportContactMode()) {
    return <SupportEmailContactPanel className={className} />;
  }
  return <SupportChatWidgetDemo className={className} />;
}

function SupportChatWidgetDemo({ className }: SupportChatWidgetProps) {
  const { t } = useI18n();
  const [phase, setPhase] = React.useState<ChatPhase>("idle");
  const [queuePos, setQueuePos] = React.useState(3);
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const listRef = React.useRef<HTMLDivElement>(null);

  const threadSeed = React.useMemo<ChatMsg[]>(
    () => [
      { id: "p1", role: "system", text: t("support.chat.thread.system1"), at: "10:02" },
      { id: "p2", role: "user", text: t("support.chat.thread.user1"), at: "10:04" },
      { id: "p3", role: "agent", text: t("support.chat.thread.agent1"), at: "10:07" },
    ],
    [t],
  );

  const allMessages = React.useMemo(() => {
    if (phase !== "active") return [];
    return [...threadSeed, ...messages];
  }, [phase, messages, threadSeed]);

  React.useEffect(() => {
    if (phase !== "active") return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [allMessages, phase]);

  const startChat = React.useCallback(() => {
    setPhase("connecting");
    window.setTimeout(() => {
      setPhase("waiting");
      setQueuePos(2 + Math.floor(Math.random() * 4));
    }, 900);
  }, []);

  React.useEffect(() => {
    if (phase !== "waiting") return;
    const timer = window.setTimeout(() => {
      setPhase("active");
      setMessages([
        {
          id: "sys-1",
          role: "system",
          text: t("support.chat.thread.systemConnected"),
          at: nowTime(),
        },
        {
          id: "ag-1",
          role: "agent",
          text: t("support.chat.thread.agentGreeting"),
          at: nowTime(),
        },
      ]);
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [phase, t]);

  const send = React.useCallback(() => {
    const text = input.trim();
    if (!text || phase !== "active") return;
    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, role: "user", text, at: nowTime() },
      {
        id: `a-${Date.now()}`,
        role: "agent",
        text: t("support.chat.thread.autoReply"),
        at: nowTime(),
      },
    ]);
    setInput("");
  }, [input, phase, t]);

  const statusText =
    phase === "idle"
      ? t("support.chat.status.idle")
      : phase === "connecting"
        ? t("support.chat.status.connecting")
        : phase === "waiting"
          ? tf(t("support.chat.status.waiting"), { position: String(queuePos) })
          : t("support.chat.status.active");

  const badgeText =
    phase === "idle"
      ? t("support.chat.badge.idle")
      : phase === "connecting"
        ? t("support.chat.badge.connecting")
        : phase === "waiting"
          ? t("support.chat.badge.waiting")
          : t("support.chat.badge.active");

  return (
    <section
      id="support-chat"
      className={cn(
        "flex min-h-[min(480px,65dvh)] flex-col overflow-hidden rounded-3xl bg-white px-4 py-5 shadow-[0_8px_30px_-14px_rgba(0,0,0,0.08)] ring-1 ring-neutral-200/70 sm:min-h-[min(520px,68dvh)] sm:px-6 sm:py-6",
        className,
      )}
      aria-labelledby="support-chat-title"
    >
      <p
        className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-950"
        role="status"
      >
        {t("support.chat.demoBanner")}
      </p>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-neutral-100/90 pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">{t("support.chat.label")}</p>
          <div className="mt-1 flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-neutral-100 ring-1 ring-neutral-200/60">
              <MessageCircle className="size-5 text-neutral-600" strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id="support-chat-title" className="text-lg font-semibold tracking-tight text-neutral-900">
                {t("support.chat.title")}
              </h2>
              <p className="truncate text-xs text-neutral-500">{statusText}</p>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1",
            phase === "idle" && "bg-lime-100/90 text-lime-900 ring-lime-200/80",
            phase === "connecting" && "bg-amber-50 text-amber-900 ring-amber-200/80",
            phase === "waiting" && "bg-amber-50 text-amber-900 ring-amber-200/80",
            phase === "active" && "bg-blue-50 text-blue-900 ring-blue-200/80",
          )}
        >
          {badgeText}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {phase === "idle" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-2 py-10 text-center">
            <p className="max-w-md text-sm leading-relaxed text-neutral-500">{t("support.chat.idleHint")}</p>
            <button
              type="button"
              onClick={startChat}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-lime-400 px-4 text-xs font-semibold text-neutral-950 transition hover:bg-lime-300 active:scale-[0.98]"
            >
              {t("support.chat.startButton")}
            </button>
            <p className="text-[11px] text-neutral-500">{t("support.chat.demoNote")}</p>
          </div>
        ) : null}

        {phase === "connecting" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-14">
            <Loader2 className="size-8 animate-spin text-neutral-500" aria-hidden />
            <p className="text-sm text-neutral-600">{t("support.chat.connecting")}</p>
          </div>
        ) : null}

        {phase === "waiting" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-12 text-center">
            <Loader2 className="size-7 animate-spin text-amber-600" aria-hidden />
            <p className="text-sm font-medium text-neutral-900">{t("support.chat.waitingTitle")}</p>
            <p className="text-xs text-neutral-500">
              {tf(t("support.chat.waitingHint"), { position: String(queuePos) })}
            </p>
          </div>
        ) : null}

        {phase === "active" ? (
          <>
            <div
              ref={listRef}
              className="Spliton-scrollbar min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain rounded-2xl bg-neutral-50/90 px-3 py-4 ring-1 ring-neutral-100 sm:px-4"
            >
              {allMessages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "max-w-[92%] rounded-xl px-3 py-2.5 text-[13px] leading-snug sm:max-w-[85%]",
                    m.role === "user" && "ml-auto border border-neutral-200/90 bg-white text-neutral-900 shadow-sm",
                    m.role === "agent" && "mr-auto border border-neutral-100 bg-white text-neutral-900 shadow-sm",
                    m.role === "system" &&
                      "mx-auto max-w-full border border-transparent bg-transparent text-center text-[12px] text-neutral-500",
                  )}
                >
                  {m.role !== "system" ? (
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                      {m.at}
                    </span>
                  ) : null}
                  {m.text}
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-neutral-100 pt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  placeholder={t("support.chat.inputPlaceholder")}
                  className="h-11 min-w-0 flex-1 rounded-2xl border-0 bg-neutral-50 px-4 text-sm text-neutral-900 outline-none ring-1 ring-neutral-200/60 transition placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
                  aria-label={t("support.chat.inputAria")}
                />
                <button
                  type="button"
                  onClick={send}
                  className="grid size-11 shrink-0 place-items-center rounded-2xl bg-neutral-900 text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-40"
                  disabled={!input.trim()}
                  aria-label={t("support.chat.sendAria")}
                >
                  <Send className="size-4" strokeWidth={2} aria-hidden />
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <footer className="mt-4 border-t border-neutral-100 pt-4">
        <a
          href={`mailto:${SUPPORT_HELPDESK_EMAIL}?subject=Spliton%20—%20поддержка`}
          className="text-xs font-semibold text-neutral-800 underline-offset-2 hover:text-neutral-950 hover:underline"
        >
          {SUPPORT_HELPDESK_EMAIL}
        </a>
        <span className="text-xs text-neutral-500">{t("support.chat.footer.mailFallback")}</span>
      </footer>
    </section>
  );
}
