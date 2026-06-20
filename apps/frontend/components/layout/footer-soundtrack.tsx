/**
 * Нижний декор футера: анимированные линейные графики в стиле платформы (доходность / рынок).
 */
export function FooterSoundtrack({
  variant = "default",
  className,
}: {
  variant?: "default" | "around-title";
  className?: string;
}) {
  const isAroundTitle = variant === "around-title";
  const accentLine = isAroundTitle
    ? "M0 86 C180 84 340 82 500 78 C590 76 640 58 720 50 C800 58 850 76 940 78 C1100 82 1260 84 1440 86"
    : "M0 82 C48 79 96 74 144 76 C192 78 240 66 288 68 C336 70 384 54 432 58 C480 62 528 44 576 48 C624 52 672 36 720 40 C768 44 816 28 864 32 C912 36 960 22 1008 26 C1056 30 1104 18 1152 22 C1200 26 1248 14 1296 18 C1344 22 1392 10 1440 14";

  const accentArea = `${accentLine} L1440 96 L0 96 Z`;

  const midLine = isAroundTitle
    ? "M0 90 C220 88 420 86 560 84 C640 82 680 70 720 66 C760 70 800 82 880 84 C1020 86 1220 88 1440 90"
    : "M0 74 C120 72 240 68 360 70 C480 72 600 62 720 64 C840 66 960 54 1080 58 C1200 62 1320 48 1440 52";

  const baseLine = isAroundTitle
    ? "M0 94 C260 92 520 91 720 90 C920 91 1180 92 1440 94"
    : "M0 88 C180 86 360 84 540 82 C720 80 900 76 1080 78 C1260 80 1350 74 1440 72";

  const gridYs = [24, 40, 56, 72];

  return (
    <div className={`relative w-full overflow-hidden bg-black ${className ?? ""}`} aria-hidden>
      <div className="relative z-0 mx-auto max-w-[1600px] px-0">
        <svg
          className={`block w-full ${isAroundTitle ? "h-[82px] sm:h-[92px] md:h-[104px]" : "h-[72px] sm:h-[84px] md:h-[96px]"}`}
          viewBox="0 0 1440 96"
          preserveAspectRatio="none"
          role="presentation"
        >
          <defs>
            <linearGradient id="footer-chart-accent-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
              <stop offset="18%" stopColor="#ffffff" stopOpacity="0.62" />
              <stop offset="82%" stopColor="#ffffff" stopOpacity="0.72" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.22" />
            </linearGradient>
            <linearGradient id="footer-chart-accent-fill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
              <stop offset="55%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <clipPath id="footer-chart-clip">
              <rect x="0" y="0" width="1440" height="96" />
            </clipPath>
          </defs>

          <g clipPath="url(#footer-chart-clip)">
            {gridYs.map((y) => (
              <line
                key={y}
                x1={0}
                y1={y}
                x2={1440}
                y2={y}
                className="stroke-white/[0.04]"
                strokeWidth={0.5}
              />
            ))}

            <g className="animate-footer-chart-drift">
              <path
                d={baseLine}
                fill="none"
                className="stroke-white/10"
                strokeWidth={0.85}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={midLine}
                fill="none"
                className="stroke-white/14"
                strokeWidth={0.9}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            <path
              d={accentArea}
              fill="url(#footer-chart-accent-fill)"
              className="animate-footer-chart-area-pulse"
            />

            <path
              d={accentLine}
              fill="none"
              stroke="url(#footer-chart-accent-stroke)"
              strokeWidth={1.35}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={100}
              className="animate-footer-chart-line-flow"
            />

            <g className="animate-footer-chart-dot-pulse">
              <circle cx={1440} cy={14} r={2.5} fill="#ffffff" fillOpacity={0.9} />
              <circle cx={1440} cy={14} r={6} fill="#ffffff" fillOpacity={0.12} />
            </g>
          </g>
        </svg>
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-1 bg-[linear-gradient(90deg,rgba(0,0,0,0.85)_0%,transparent_14%,transparent_86%,rgba(0,0,0,0.85)_100%),linear-gradient(180deg,rgba(0,0,0,0.55)_0%,transparent_45%)]"
        aria-hidden
      />
    </div>
  );
}
