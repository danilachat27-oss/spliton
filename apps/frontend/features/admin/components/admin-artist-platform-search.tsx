"use client";

import { ExternalLink, Search } from "@/lib/lucide";

import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { ARTIST_PLATFORM_SEARCH_TARGETS } from "@/features/admin/lib/admin-artist-platform-search";
import { adminBtnOutline } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

type AdminArtistPlatformSearchProps = {
  artistName: string;
  className?: string;
};

export function AdminArtistPlatformSearch({ artistName, className }: AdminArtistPlatformSearchProps) {
  const a = useAdminI18n();
  const query = artistName.trim();
  const disabled = !query;

  return (
    <div className={cn("space-y-2.5", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {a.t("admin.artists.platformSearch.label")}
      </p>
      <div className="flex flex-wrap gap-2">
        {ARTIST_PLATFORM_SEARCH_TARGETS.map((platform) => (
          <a
            key={platform.id}
            href={disabled ? undefined : platform.buildUrl(query)}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            className={cn(
              adminBtnOutline,
              "h-8 gap-1.5 rounded-lg px-3 text-xs font-medium",
              disabled && "pointer-events-none opacity-40",
            )}
          >
            <Search className="size-3.5 shrink-0 opacity-80" aria-hidden />
            {a.t(platform.labelKey)}
            <ExternalLink className="size-3 shrink-0 opacity-60" aria-hidden />
          </a>
        ))}
      </div>
      {disabled ? (
        <p className="text-xs leading-relaxed text-zinc-600">{a.t("admin.artists.platformSearch.hint")}</p>
      ) : null}
    </div>
  );
}