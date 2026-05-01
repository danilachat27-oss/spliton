import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import "./globals.css";
import "@/styles/surfaces.css";

import { ConditionalSiteFooter } from "@/components/layout/conditional-site-footer";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppProviders } from "@/components/providers/app-providers";

const inter = Inter({
  variable: "--font-app-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-app-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RevShare",
    template: "%s · RevShare",
  },
  description:
    "Платформа revenue share для музыкальных треков: баланс USDT (TRC20), доли дохода, выплаты и вторичный рынок.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-background text-foreground">
        <AppProviders>
          <AuthGuard>
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            <ConditionalSiteFooter />
          </AuthGuard>
        </AppProviders>
      </body>
    </html>
  );
}

