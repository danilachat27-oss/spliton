"use client";

import * as React from "react";
import { Check, Copy } from "@/lib/lucide";

import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { cn } from "@/lib/utils";

type AdminCopyButtonProps = {
  value: string;
  label?: string;
  className?: string;
};

export function AdminCopyButton({ value, label = "Копировать", className }: AdminCopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const [copyError, setCopyError] = React.useState(false);

  async function copy() {
    const result = await copyTextToClipboard(value);
    if (result === "ok") {
      setCopyError(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyError(true);
      window.setTimeout(() => setCopyError(false), 2500);
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void copy();
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-200",
        className,
      )}
      title={label}
      aria-label={label}
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600" />
      ) : copyError ? (
        <span className="text-[10px] text-rose-600">!</span>
      ) : (
        <Copy className="size-3.5" />
      )}
      {copied ? <span className="sr-only">Скопировано</span> : null}
    </button>
  );
}
