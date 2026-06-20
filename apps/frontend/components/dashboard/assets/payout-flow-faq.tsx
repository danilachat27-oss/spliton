"use client";

import { ChevronDown } from "@/lib/lucide";
import { useCallback, useId, useState } from "react";

import type { PayoutFaqItem } from "@/components/dashboard/assets/payout-flow-mock-data";
import { cn } from "@/lib/utils";

export type { PayoutFaqItem };

type PayoutFlowFaqListProps = {
  items: PayoutFaqItem[];
  /** id of the initially expanded item; if omitted, all items start collapsed */
  defaultOpenId?: string | null;
};

export function PayoutFlowFaqList({ items, defaultOpenId = null }: PayoutFlowFaqListProps) {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(defaultOpenId);

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <ul className="mt-5 divide-y divide-neutral-200/60 border-t border-neutral-200/60" role="list">
      {items.map((item) => {
        const open = openId === item.id;
        const panelId = `${baseId}-${item.id}-panel`;
        const btnId = `${baseId}-${item.id}-btn`;
        return (
          <li key={item.id} className="py-0">
            <button
              id={btnId}
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => toggle(item.id)}
              className="flex w-full items-start justify-between gap-3 py-4 text-left transition hover:bg-neutral-100/50"
            >
              <span className="text-sm font-semibold leading-snug text-neutral-900">{item.question}</span>
              <ChevronDown
                className={cn("mt-0.5 size-4 shrink-0 text-neutral-400 transition-transform", open && "rotate-180")}
                aria-hidden
              />
            </button>
            <div id={panelId} role="region" aria-labelledby={btnId} hidden={!open}>
              <p className="pb-4 pr-8 text-sm leading-relaxed text-neutral-600">{item.answer}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
