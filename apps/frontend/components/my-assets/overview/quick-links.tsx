import Link from "next/link";
import { ArrowUpRight } from "@/lib/lucide";

import { quickLinks } from "@/components/my-assets/overview/mock-data";

export function QuickLinks() {
  return (
    <section className="rounded-md border border-neutral-200 bg-white">
      <header className="border-b border-neutral-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-neutral-900">Быстрые переходы</h3>
      </header>

      <div className="space-y-2 p-3">
        {quickLinks.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            className="flex items-start justify-between gap-3 rounded-sm border border-neutral-200 bg-white px-3 py-2.5 transition hover:border-neutral-300 hover:bg-neutral-50"
          >
            <span className="min-w-0">
              <span className="block text-sm text-neutral-900">{link.label}</span>
              <span className="mt-0.5 block text-[11px] text-neutral-500">{link.description}</span>
            </span>
            <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-neutral-400" />
          </Link>
        ))}
      </div>
    </section>
  );
}
