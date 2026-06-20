"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AdminFieldInfo } from "@/features/admin/ui/admin-form-field";
import { cn } from "@/lib/utils";

type AdminCheckboxRowProps = {
  id: string;
  label: string;
  info?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function AdminCheckboxRow({
  id,
  label,
  info,
  checked,
  onCheckedChange,
  disabled,
  className,
}: AdminCheckboxRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5",
        disabled && "opacity-60",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <Label htmlFor={id} className="cursor-pointer text-sm font-medium text-zinc-200">
          {label}
        </Label>
        {info ? <AdminFieldInfo text={info} /> : null}
      </div>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(Boolean(value))}
        disabled={disabled}
        className="border-zinc-600 data-checked:border-[#B7F500] data-checked:bg-[#B7F500] data-checked:text-zinc-950"
      />
    </div>
  );
}