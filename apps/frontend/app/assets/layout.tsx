import type { ReactNode } from "react";

export default function AssetsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f6f7f9]">
      <main className="scheme-light flex-1 text-neutral-900">{children}</main>
    </div>
  );
}
