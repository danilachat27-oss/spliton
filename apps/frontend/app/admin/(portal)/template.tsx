"use client";

import { usePathname } from "next/navigation";

/** Soft content transition between admin sections (shell stays mounted). */
export default function AdminPortalTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="min-h-full animate-in fade-in duration-200">
      {children}
    </div>
  );
}