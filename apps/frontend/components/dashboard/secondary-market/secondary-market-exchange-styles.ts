/** OKX-style exchange UI tokens for вторичный рынок. */
export const smExchange = {
  panel: "bg-black",
  input:
    "h-10 w-full rounded-lg bg-[#161616] px-3 font-mono text-sm text-white placeholder:text-zinc-600 outline-none ring-1 ring-white/8 focus:ring-[#B7F500]/40",
  inputPill:
    "h-10 w-full rounded-full bg-[#161616] py-2 pl-10 pr-3 font-mono text-sm text-white placeholder:text-zinc-600 outline-none ring-1 ring-white/8 focus:ring-[#B7F500]/40",
  chipActive: "bg-white text-black",
  chipIdle: "bg-[#161616] text-zinc-400 ring-1 ring-white/8 hover:text-zinc-200",
  chipBase: "shrink-0 rounded-full px-3 py-1.5 font-mono text-[12px] font-medium transition-colors",
  buySideActive: "bg-[#1a2e08] text-[#B7F500]",
  buySideIdle: "bg-[#161616] text-zinc-500",
  sellSideActive: "bg-[#2a1020] text-fuchsia-300",
  sellSideIdle: "bg-[#161616] text-zinc-500",
  sideToggle: "grid grid-cols-2 gap-1 rounded-lg bg-black p-0.5 font-mono text-[13px] font-semibold",
  submitBuy: "h-11 w-full rounded-full bg-[#B7F500] text-[13px] font-bold text-black transition hover:bg-[#c8ff3d]",
  submitSell: "h-11 w-full rounded-full bg-fuchsia-500 text-[13px] font-bold text-white transition hover:bg-fuchsia-400",
  rowDivider: "border-b border-white/6",
  statLabel: "font-mono text-[10px] uppercase tracking-wider text-zinc-500",
  statValue: "mt-0.5 font-mono text-[17px] font-semibold tabular-nums text-white",
} as const;
