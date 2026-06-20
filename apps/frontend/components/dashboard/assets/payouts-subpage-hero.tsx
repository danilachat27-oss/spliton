type PayoutsSubpageHeroProps = {
  eyebrow: string;
  title: string;
  /** Optional paragraph below the title; omitted when not provided. */
  description?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
};

export function PayoutsSubpageHero({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
}: PayoutsSubpageHeroProps) {
  const centered = align === "center";
  const light = tone === "light";
  return (
    <header className={`space-y-3 ${centered ? "text-center" : ""}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${light ? "text-white/75" : "text-neutral-400"}`}>
        {eyebrow}
      </p>
      <h1 className={`text-2xl font-semibold tracking-tight sm:text-[1.75rem] ${light ? "text-white" : "text-neutral-900"}`}>
        {title}
      </h1>
      {description ? (
        <p className={`text-sm leading-relaxed ${centered ? "mx-auto max-w-3xl" : "max-w-2xl"} ${light ? "text-white/80" : "text-neutral-500"}`}>
          {description}
        </p>
      ) : null}
    </header>
  );
}
