"use client";



import Link from "next/link";



import { useI18n } from "@/components/providers/i18n-provider";

import { complianceBlockingMessage } from "@/lib/i18n/compliance-blocking-labels";

import { ROUTES } from "@/constants/routes";

import type { EligibilityResult } from "@/services/legal.service";

import { cn } from "@/lib/utils";



export function EligibilityNotice({

  result,

  className,

}: {

  result: EligibilityResult | null;

  className?: string;

}) {

  const { t } = useI18n();



  if (!result || result.allowed) return null;



  const headline =

    complianceBlockingMessage(result.blockingCode, t) ?? t("compliance.operationUnavailable");



  return (

    <div

      className={cn(

        "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950",

        className,

      )}

      role="status"

    >

      <p className="font-medium">{headline}</p>

      {result.blockingCode === "KYC_REQUIRED" || result.blockingCode === "KYC_IN_REVIEW" ? (

        <Link

          href={ROUTES.dashboardProfile}

          className="mt-2 inline-block font-medium text-lime-800 underline-offset-2 hover:underline"

        >

          {t("compliance.goVerification")}

        </Link>

      ) : result.blockingCode === "CONSENT_REQUIRED" ? (

        <p className="mt-1 text-xs text-amber-900/80">

          {t("compliance.acceptInProfile")}{" "}

          <Link href={ROUTES.dashboardProfile} className="font-medium underline-offset-2 hover:underline">

            {t("compliance.legalCenterLink")}

          </Link>

          .

        </p>

      ) : null}

    </div>

  );

}


