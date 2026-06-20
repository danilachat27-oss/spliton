import { cn } from "@/lib/utils";

type TickerAvatarProps = {
  symbol: string;
  className?: string;
};

/** Белые геометрические монограммы на чёрном круге — в духе лого Spliton. */
function TickerMark({ symbol }: { symbol: string }) {
  switch (symbol) {
    case "MNR":
      return (
        <>
          <path
            fill="currentColor"
            d="M9 34V11.5C9 9.2 10.8 8 12.8 8h2.6v8.4L21.5 8h1.8l-6.1 10.2V34H9Z"
          />
          <path
            fill="currentColor"
            d="M35 34V11.5C35 9.2 33.2 8 31.2 8h-2.6v8.4L22.5 8h-1.8l6.1 10.2V34H35Z"
          />
        </>
      );
    case "SGN":
      return (
        <>
          <path
            fill="currentColor"
            d="M27.5 9.2c5.4 0 8.5 2.8 8.5 6.8 0 3.6-2.6 5.4-7.2 5.4H21v-3.2h5.8c2.4 0 3.6-.9 3.6-2.4 0-1.6-1.4-2.6-3.8-2.6H18.4L22.6 9.2h4.9Z"
          />
          <path
            fill="currentColor"
            d="M16.5 34.8C11.1 34.8 8 32 8 28c0-3.6 2.6-5.4 7.2-5.4H23v3.2h-5.8c-2.4 0-3.6.9-3.6 2.4 0 1.6 1.4 2.6 3.8 2.6h3.6L22.4 34.8h-5.9Z"
          />
        </>
      );
    case "VLT":
      return (
        <>
          <path fill="currentColor" d="M9 10 18.6 34h2.4L13.8 14.2 9 10Z" />
          <path fill="currentColor" d="M35 10 25.4 34H23L30.2 14.2 35 10Z" />
        </>
      );
    case "GLS":
      return (
        <>
          <path
            fill="currentColor"
            d="M27.2 8.6c5.8 0 9.8 3.8 9.8 9.4 0 5.8-4.2 9.8-10.2 9.8-5.4 0-9.2-3.8-9.2-9.2 0-5.2 3.8-9 9.4-9 2.6 0 4.8.9 6.4 2.5l-2.2 2.4c-1.1-1-2.4-1.6-4-1.6-3 0-5.2 2.4-5.2 5.8s2.2 5.8 5.2 5.8c3 0 5-2 5.2-5.2H22v-3h9.8c-.4 4.8-3.8 8.2-9 8.2-5.8 0-10-4.4-10-10.2 0-5.6 4.2-10 10.2-10Z"
          />
        </>
      );
    case "AUR":
      return (
        <>
          <path fill="currentColor" d="M22 8.4 34.2 34h-3.5l-2.3-5.8H15.6L13.3 34H9.8L22 8.4Z" />
          <path fill="currentColor" d="M17.4 23.6h9.2L22 13.2l-4.6 10.4Z" />
        </>
      );
    default:
      return (
        <text
          x="22"
          y="28"
          textAnchor="middle"
          fill="currentColor"
          fontSize="13"
          fontWeight="700"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {symbol.slice(0, 2)}
        </text>
      );
  }
}

export function InstrumentTickerAvatar({ symbol, className }: TickerAvatarProps) {
  return (
    <div
      className={cn(
        "relative size-10 shrink-0 overflow-hidden rounded-full bg-[#050505] text-white ring-1 ring-white/12 sm:size-11",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 44 44" className="size-full" role="presentation">
        <TickerMark symbol={symbol} />
      </svg>
    </div>
  );
}
