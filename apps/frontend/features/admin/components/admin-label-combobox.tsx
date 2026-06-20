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
  createAdminLabel,
  listAdminLabels,
} from "@/services/admin/adminLabels.service";

type AdminLabelComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  id?: string;
  placeholder?: string;
  inputClassName?: string;
};

function normalizeName(raw: string) {
  return raw.trim().replace(/_/g, "-").replace(/\s+/g, " ");
}

function matchKey(raw: string) {
  const s = normalizeName(raw).toLowerCase();
  return s
    .replace(/[-_]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function AdminLabelCombobox({
  value,
  onChange,
  readOnly = false,
  id,
  placeholder,
  inputClassName,
}: AdminLabelComboboxProps) {
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
        const rows = await listAdminLabels(search, client, { activeOnly: true });
        setItems(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            isActive: r.isActive,
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
      dictionaryHref={ROUTES.adminLabels}
      referenceHintKind="label"
      helperText="Лейбл дистрибуции или правообладателя. Выберите из справочника или создайте новый."
      createLabel="Добавить лейбл"
      loadingLabel="Загрузка лейблов…"
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
          const created = await createAdminLabel({ name }, client);
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
