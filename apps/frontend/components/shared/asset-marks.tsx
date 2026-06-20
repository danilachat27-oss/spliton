import Image from "next/image";

import { cn } from "@/lib/utils";

const MARK_CLASS = "relative block size-7 shrink-0 overflow-hidden rounded-full";

/** Официальный логотип Tether (USDT) из пакета cryptocurrency-icons. */
export function UsdtMark({ className }: { className?: string }) {
  return (
    <span className={cn(MARK_CLASS, className)}>
      <Image src="/images/currency/usdt.svg" alt="" fill className="object-cover" sizes="28px" />
    </span>
  );
}

export function UntMark({ className }: { className?: string }) {
  return (
    <span className={cn(MARK_CLASS, "bg-white", className)}>
      <Image src="/images/urrency/units.png" alt="" fill className="object-contain p-0.5" sizes="28px" />
    </span>
  );
}
