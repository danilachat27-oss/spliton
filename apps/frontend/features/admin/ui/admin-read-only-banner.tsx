"use client";

import { Eye } from "@/lib/lucide";




import { adminCard } from "@/features/admin/lib/admin-ui";

import { cn } from "@/lib/utils";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";



type AdminReadOnlyBannerProps = {

  area: string;

  className?: string;

};



export function AdminReadOnlyBanner({ area, className }: AdminReadOnlyBannerProps) {
  const a = useAdminI18n();

  return (

    <div

      className={cn(

        adminCard("mb-4 flex items-center gap-3 border-amber-200/80 bg-amber-50/50 px-4 py-3"),

        className,

      )}

    >

      <Eye className="size-4 shrink-0 text-amber-700" aria-hidden />

      <p className="text-sm text-amber-900">

        {a.readOnlyBanner(area)}

      </p>

    </div>

  );

}

