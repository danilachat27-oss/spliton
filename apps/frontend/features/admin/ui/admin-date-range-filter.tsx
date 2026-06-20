import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type AdminDateRange = {
  from: string;
  to: string;
};

type AdminDateRangeFilterProps = {
  value: AdminDateRange;
  onChange: (value: AdminDateRange) => void;
  className?: string;
};

export function AdminDateRangeFilter({
  value,
  onChange,
  className,
}: AdminDateRangeFilterProps) {
  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      <div>
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          С
        </label>
        <Input
          type="date"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="h-9 w-[160px] bg-zinc-900/80"
        />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          По
        </label>
        <Input
          type="date"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="h-9 w-[160px] bg-zinc-900/80"
        />
      </div>
    </div>
  );
}
