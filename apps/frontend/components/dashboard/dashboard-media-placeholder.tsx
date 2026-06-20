import { ImageIcon } from "@/lib/lucide";

import { cn } from "@/lib/utils";

type MediaPlaceholderProps = {
  /** Короткая подпись, например «Обложка — фото позже» */
  label: string;
  className?: string;
  /** Без рамок и фона (для случаев поверх градиентов/абсолютного слоя) */
  frameless?: boolean;
  /** Tailwind aspect class */
  aspectClassName?: string;
};

/** Плейсхолдер под будущие фото / скрины (помечено явно для контента) */
export function MediaPlaceholder({
  label,
  className,
  frameless = false,
  aspectClassName = "aspect-[4/3]",
}: MediaPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 border border-dashed border-white/10 bg-neutral-900/80 text-center",
        frameless && "border-0 bg-transparent",
        aspectClassName,
        className
      )}
    >
      <ImageIcon className="size-7 text-neutral-600" strokeWidth={1.25} aria-hidden />
      <span className="max-w-[85%] px-2 text-[10px] font-semibold uppercase leading-snug tracking-[0.14em] text-neutral-500">
        {label}
      </span>
    </div>
  );
}
