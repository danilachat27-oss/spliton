"use client";

import * as React from "react";

import { ROUTES } from "@/constants/routes";
import {
  AdminReferenceCombobox,
  type AdminReferenceOption,
} from "@/features/admin/components/admin-reference-combobox";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import {
  createAdminReleaseGenre,
  listAdminReleaseGenres,
} from "@/services/admin/adminReleaseGenres.service";

type AdminGenreComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  id?: string;
  placeholder?: string;
  inputClassName?: string;
  dictionaryHref?: string;
  showDictionaryLink?: boolean;
};

function normalizeGenreInput(raw: string) {
  return raw.trim().replace(/_/g, "-").replace(/\s+/g, " ");
}

function genreKey(raw: string) {
  const s = normalizeGenreInput(raw).toLowerCase();
  return s
    .replace(/[-_]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function AdminGenreCombobox({
  value,
  onChange,
  readOnly = false,
  id,
  placeholder,
  inputClassName,
  dictionaryHref = ROUTES.adminGenres,
  showDictionaryLink = true,
}: AdminGenreComboboxProps) {
  const client = useAdminApi();
  const [items, setItems] = React.useState<AdminReferenceOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (search?: string) => {
      setLoading(true);
      setError(null);
      try {
        const rows = await listAdminReleaseGenres({ search, status: "active" }, client);
        setItems(
          rows.map((g) => ({
            id: g.id,
            name: g.name,
            isActive: g.isActive,
            hint: g.releaseCount ? String(g.releaseCount) : undefined,
          })),
        );
      } catch (e) {
        setError(localizedAdminError(e));
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  React.useEffect(() => {
    if (!readOnly) void load();
  }, [load, readOnly]);

  const selectedInactive = React.useMemo(() => {
    if (!value) return false;
    const row = items.find((i) => genreKey(i.name) === genreKey(value));
    return row ? row.isActive === false : false;
  }, [items, value]);

  return (
    <AdminReferenceCombobox
      id={id}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      placeholder={placeholder}
      inputClassName={inputClassName}
      dictionaryHref={dictionaryHref}
      referenceHintKind="genre"
      showDictionaryLink={showDictionaryLink}
      createLabel="Добавить жанр"
      loadingLabel="Загрузка жанров…"
      items={items}
      loading={loading}
      creating={creating}
      error={error}
      selectedInactive={selectedInactive}
      onOpen={() => void load(value.trim() || undefined)}
      onSearchChange={(q) => void load(q.trim() || undefined)}
      onCreate={async (name) => {
        setCreating(true);
        setError(null);
        try {
          const created = await createAdminReleaseGenre({ name }, client);
          await load();
          onChange(created.name);
        } catch (e) {
          setError(localizedAdminError(e));
        } finally {
          setCreating(false);
        }
      }}
      normalize={normalizeGenreInput}
      matchKey={genreKey}
    />
  );
}
