"use client";

import * as React from "react";
import { Check, Copy } from "@/lib/lucide";

import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { cn } from "@/lib/utils";

type CopyValueButtonProps = {
  value: string;
  label?: string;
  className?: string;
};

/** Copy control for wallet/deposit/withdraw rows (same UX as AdminCopyButton). */
export function CopyValueButton({ value, label = "Копировать", className }: CopyValueButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  async function onCopy() {
    const result = await copyTextToClipboard(value);
    if (result === "ok") {
      setFailed(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      setCopied(false);
      setFailed(true);
      window.setTimeout(() => setFailed(false), 2500);
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void onCopy();
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800",
        className,
      )}
      title={label}
      aria-label={label}
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-emerald-600" />
          <span className="text-emerald-700">Скопировано</span>
        </>
      ) : failed ? (
        <span className="text-rose-600">Не удалось</span>
      ) : (
        <>
          <Copy className="size-3.5" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
