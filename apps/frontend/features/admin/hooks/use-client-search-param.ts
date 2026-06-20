"use client";

import { usePathname } from "next/navigation";

/**
 * Reads a query param on the client without `useSearchParams` (avoids Suspense remounts).
 * Re-reads on pathname change; does not patch history (that broke Next.js navigation).
 */
export function useClientSearchParam(name: string): string | null {
  const pathname = usePathname();

  if (typeof window === "undefined") {
    return null;
  }

  // pathname in the render path ensures a fresh read after App Router navigations.
  void pathname;
  return new URLSearchParams(window.location.search).get(name);
}
