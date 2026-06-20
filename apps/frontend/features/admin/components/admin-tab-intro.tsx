type AdminTabIntroProps = {
  kicker: string;
  title: string;
  description: string;
};

/** Единый вводный блок под шапкой страницы «Панель оператора». */
export function AdminTabIntro({ kicker, title, description }: AdminTabIntroProps) {
  return (
    <div className="mb-6 space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{kicker}</p>
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
