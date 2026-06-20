"use client";

import { ChevronDown } from "@/lib/lucide";
import { useCallback, useId, useState } from "react";

import type { ReferralFaqItem } from "@/components/referral/referral-mock-data";
import { cn } from "@/lib/utils";

type ReferralFaqListProps = {
  items: ReferralFaqItem[];
  defaultOpenId?: string | null;
};

export function ReferralFaqList({ items, defaultOpenId = null }: ReferralFaqListProps) {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(defaultOpenId);

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <ul className="mt-4 space-y-3" role="list">
      {items.map((item) => {
        const open = openId === item.id;
        const panelId = `${baseId}-${item.id}-panel`;
        const btnId = `${baseId}-${item.id}-btn`;
        return (
          <li key={item.id} className="overflow-hidden rounded-2xl bg-zinc-900/70 backdrop-blur-[2px]">
            <button
              id={btnId}
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => toggle(item.id)}
              className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left transition hover:bg-white/8"
            >
              <span className="text-sm font-semibold leading-snug text-neutral-100">{item.question}</span>
              <ChevronDown
                className={cn("mt-0.5 size-4 shrink-0 text-neutral-500 transition-transform", open && "rotate-180")}
                aria-hidden
              />
            </button>
            <div id={panelId} role="region" aria-labelledby={btnId} hidden={!open}>
              <p className="px-5 pb-5 pr-10 text-sm leading-relaxed text-neutral-300">{item.answer}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
