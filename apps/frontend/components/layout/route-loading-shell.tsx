import { cn } from "@/lib/utils";

type RouteLoadingShellProps = {
  variant?: "dark" | "light";
  className?: string;
  minHeight?: string;
};

/** Lightweight route loading UI — avoids importing DashboardHeader / heavy chrome. */
export function RouteLoadingShell({
  variant = "dark",
  className,
  minHeight = "min-h-[50vh]",
}: RouteLoadingShellProps) {
  const isLight = variant === "light";

  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col",
        isLight ? "bg-white" : "bg-black",
        className,
      )}
    >
      <div
        className={cn(
          "h-14 shrink-0 border-b",
          isLight ? "border-zinc-200 bg-white" : "border-white/8 bg-black",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center gap-4 px-6",
          isLight ? "bg-white" : "bg-[#141416]",
          minHeight,
        )}
        role="status"
        aria-live="polite"
      >
        <div
          className={cn(
            "size-16 animate-pulse rounded-full border-4 border-t-transparent",
            isLight ? "border-zinc-200" : "border-white/15",
          )}
        />
      </div>
    </div>
  );
}
