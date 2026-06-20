"use client";

import * as React from "react";

import { ROUTES } from "@/constants/routes";
import {
  AdminReferenceCombobox,
  type AdminReferenceOption,
} from "@/features/admin/components/admin-reference-combobox";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import {
  createAdminArtist,
  listAdminArtists,
} from "@/services/admin/adminArtists.service";

type AdminArtistComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  id?: string;
  placeholder?: string;
  inputClassName?: string;
};

function normalizeName(raw: string) {
  return raw.trim().replace(/\s+/g, " ");
}

function matchKey(raw: string) {
  return normalizeName(raw).toLowerCase();
}

export function AdminArtistCombobox({
  value,
  onChange,
  readOnly = false,
  id,
  placeholder,
  inputClassName,
}: AdminArtistComboboxProps) {
  const a = useAdminI18n();
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
        const rows = await listAdminArtists(search, client);
        setItems(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            isActive: r.isActive ?? true,
            hint: r.releaseCount ? String(r.releaseCount) : undefined,
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
    const row = items.find((i) => matchKey(i.name) === matchKey(value));
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
      dictionaryHref={ROUTES.adminArtists}
      referenceHintKind="artist"
      referenceHintAction={a.t("admin.reference.action.addInDictionary")}
      helperText="Выберите артиста из справочника. Если артиста ещё нет, добавьте его — он появится в общем списке артистов."
      createLabel="Добавить артиста"
      loadingLabel="Загрузка артистов…"
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
          const created = await createAdminArtist({ name }, client);
          await load();
          onChange(created.name);
        } catch (e) {
          setError(localizedAdminError(e));
        } finally {
          setCreating(false);
        }
      }}
      normalize={normalizeName}
      matchKey={matchKey}
    />
  );
}
