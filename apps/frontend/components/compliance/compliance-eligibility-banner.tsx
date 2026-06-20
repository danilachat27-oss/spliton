"use client";



import Link from "next/link";



import { useI18n } from "@/components/providers/i18n-provider";

import { complianceBlockingMessage } from "@/lib/i18n/compliance-blocking-labels";

import { ROUTES } from "@/constants/routes";

import type { EligibilityResult } from "@/services/legal.service";

import { cn } from "@/lib/utils";



type Props = {

  result: EligibilityResult | null;

  className?: string;

};



export function ComplianceEligibilityBanner({ result, className }: Props) {

  const { t } = useI18n();



  if (!result || result.allowed) return null;



  const headline =

    complianceBlockingMessage(result.blockingCode, t) ?? t("compliance.operationUnavailable");



  return (

    <div

      className={cn(

        "rounded-2xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950",

        className,

      )}

      role="status"

    >

      <p className="font-semibold">{headline}</p>

      <p className="mt-2 flex flex-wrap gap-3 text-xs font-medium">

        <Link href={ROUTES.dashboardProfile} className="underline-offset-2 hover:underline">

          {t("compliance.profileLegalCenter")}

        </Link>

        <Link href={ROUTES.support} className="underline-offset-2 hover:underline">

          {t("actions.support")}

        </Link>

      </p>

    </div>

  );

}


