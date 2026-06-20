import { Geist_Mono, Inter } from "next/font/google";

import "./globals.css";
import "@/styles/surfaces.css";

import { ConditionalSiteFooter } from "@/components/layout/conditional-site-footer";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppProviders } from "@/components/providers/app-providers";
import { rootLayoutMetaAsync } from "@/lib/i18n/page-metadata";
import { getPublicApiBaseUrl } from "@/lib/public-env";
import { resolveServerLocale } from "@/lib/i18n/server-locale";

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

export async function generateMetadata() {
  return rootLayoutMetaAsync();
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialLocale = await resolveServerLocale();
  const apiOrigin = getPublicApiBaseUrl();

  return (
    <html
      lang={initialLocale}
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="dns-prefetch" href={apiOrigin} />
        <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" />
      </head>
      <body
        className="flex min-h-dvh flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <AppProviders initialLocale={initialLocale}>
          <AuthGuard>
            <div className="flex min-h-0 flex-1 flex-col bg-black">{children}</div>
            <ConditionalSiteFooter />
          </AuthGuard>
        </AppProviders>
      </body>
    </html>
  );
}
