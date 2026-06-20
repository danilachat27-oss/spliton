"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { tf } from "@/lib/i18n/financial-messages";

export function FooterRegisterQr() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useI18n();
  const [qrTargetUrl, setQrTargetUrl] = useState<string>(
    isAuthenticated ? ROUTES.dashboard : ROUTES.register,
  );

  useEffect(() => {
    const path = isAuthenticated ? ROUTES.dashboard : ROUTES.register;
    setQrTargetUrl(`${window.location.origin}${path}`);
  }, [isAuthenticated]);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrTargetUrl)}`;

  const displayName = user?.profile?.displayName?.trim();
  const greeting = displayName
    ? tf(t("footer.qr.authenticated.greetingNamed"), { name: displayName })
    : t("footer.qr.authenticated.greeting");

  if (isAuthenticated) {
    return (
      <div className="flex flex-col items-stretch rounded-2xl bg-[#0a0a0a] p-6 sm:p-8 lg:max-w-[320px] lg:justify-self-end">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          {t("footer.qr.authenticated.eyebrow")}
        </p>
        <h3 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">{greeting}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          {t("footer.qr.authenticated.description")}
        </p>
        <Link
          href={ROUTES.dashboard}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          {t("footer.qr.authenticated.cta")}
        </Link>
        <div className="mt-8 flex justify-center rounded-xl bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- внешний QR */}
          <img
            src={qrSrc}
            alt={t("footer.qr.authenticated.qrAlt")}
            width={168}
            height={168}
            className="size-[168px]"
          />
        </div>
        <p className="mt-4 text-center text-[11px] leading-snug text-zinc-600">
          {t("footer.qr.authenticated.qrHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch rounded-2xl bg-[#0a0a0a] p-6 sm:p-8 lg:max-w-[320px] lg:justify-self-end">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
        {t("footer.qr.guest.eyebrow")}
      </p>
      <h3 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
        {t("footer.qr.guest.title")}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t("footer.qr.guest.description")}</p>
      <Link
        href={ROUTES.register}
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-black transition hover:bg-zinc-200"
      >
        {t("footer.qr.guest.cta")}
      </Link>
      <div className="mt-8 flex justify-center rounded-xl bg-white p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- внешний QR */}
        <img src={qrSrc} alt={t("footer.qr.guest.qrAlt")} width={168} height={168} className="size-[168px]" />
      </div>
      <p className="mt-4 text-center text-[11px] leading-snug text-zinc-600">{t("footer.qr.guest.qrHint")}</p>
    </div>
  );
}
