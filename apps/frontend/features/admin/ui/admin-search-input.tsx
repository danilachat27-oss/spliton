"use client";

import { Search } from "@/lib/lucide";

import { Input } from "@/components/ui/input";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { cn } from "@/lib/utils";

type AdminSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
};

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  className,
  id = "admin-search",
}: AdminSearchInputProps) {
  const a = useAdminI18n();
  return (
    <div className={cn("relative min-w-[200px] flex-1", className)}>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
        aria-hidden
      />
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? a.portal.searchSectionPlaceholder}
        className="h-9 bg-zinc-900/80 pl-9"
      />
    </div>
  );
}
