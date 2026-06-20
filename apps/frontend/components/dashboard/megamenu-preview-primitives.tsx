import type { ReactNode } from "react";

import "./megamenu-preview-shared.css";

import { cn } from "@/lib/utils";

export function MegamenuPreviewChrome({ title, dark }: { title: string; dark?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-5 shrink-0 items-center gap-1.5 border-b px-2",
        dark ? "border-white/10 bg-zinc-950" : "border-zinc-200/80 bg-white",
      )}
    >
      <span className="size-1.5 rounded-full bg-red-400/90" aria-hidden />
      <span className="size-1.5 rounded-full bg-amber-400/90" aria-hidden />
      <span className="size-1.5 rounded-full bg-emerald-400/90" aria-hidden />
      <span className={cn("ml-1 truncate text-[7px] font-medium", dark ? "text-zinc-500" : "text-zinc-400")}>
        {title}
      </span>
    </div>
  );
}

export function MegamenuPreviewSceneShell({
  title,
  dark,
  sceneClass,
  children,
}: {
  title: string;
  dark?: boolean;
  sceneClass: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-visible rounded-xl bg-zinc-100 ring-1 ring-zinc-200/80">
      <MegamenuPreviewChrome title={title} dark={dark} />
      <div
        className={cn(
          "service-preview-scene relative aspect-5/4 overflow-visible p-2",
          sceneClass,
          dark ? "bg-black" : "bg-[#f6f7f9]",
        )}
      >
        <div className="relative h-full overflow-visible rounded-md">
          <div className="animate-service-preview-page-in h-full overflow-visible opacity-100 motion-reduce:animate-none motion-reduce:opacity-100">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
