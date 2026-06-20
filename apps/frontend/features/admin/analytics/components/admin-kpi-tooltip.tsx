"use client";

import { AdminInfoHint } from "@/features/admin/ui/admin-info-hint";

type AdminKpiTooltipProps = {
  text: string;
};

export function AdminKpiTooltip({ text }: AdminKpiTooltipProps) {
  return <AdminInfoHint text={text} stopPropagation />;
}
