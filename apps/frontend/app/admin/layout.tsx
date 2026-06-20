import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Server root layout for `/admin`.
 * Auth shell lives in `(portal)/layout.tsx`; `/admin/login` stays outside the portal group.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}