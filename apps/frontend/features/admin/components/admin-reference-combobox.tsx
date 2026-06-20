"use client";

import * as React from "react";
import { AdminReferenceFieldHint, type AdminReferenceHintKind } from "@/features/admin/ui/admin-reference-field-hint";
import { Input } from "@/components/ui/input";
import {
  adminDropdownItem,
  adminDropdownPanel,
  adminFieldInput,
} from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

export type AdminReferenceOption = {
  id: string;
  name: string;
  isActive?: boolean;
  hint?: string;
};

export type AdminReferenceComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  id?: string;
  placeholder?: string;
  inputClassName?: string;
  dictionaryHref: string;
  dictionaryLabel?: string;
  referenceHintKind?: AdminReferenceHintKind;
  referenceHintPrompt?: string;
  referenceHintAction?: string;
  helperText?: string;
  showDictionaryLink?: boolean;
  createLabel?: string;
  loadingLabel?: string;
  emptyLabel?: string;
  items: AdminReferenceOption[];
  loading?: boolean;
  creating?: boolean;
  error?: string | null;
  onOpen?: () => void;
  onSearchChange?: (query: string) => void;
  onCreate?: (name: string) => void | Promise<void>;
  normalize?: (raw: string) => string;
  matchKey?: (raw: string) => string;
  allowCreate?: boolean;
  selectedInactive?: boolean;
};

function defaultNormalize(raw: string) {
  return raw.trim().replace(/_/g, "-").replace(/\s+/g, " ");
}

function defaultMatchKey(raw: string) {
  const s = defaultNormalize(raw).toLowerCase();
  return s
    .replace(/[-_]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function AdminReferenceCombobox({
  value,
  onChange,
  readOnly = false,
  id,
  placeholder,
  inputClassName,
  dictionaryHref,
  dictionaryLabel,
  referenceHintKind = "genre",
  referenceHintPrompt,
  referenceHintAction,
  helperText,
  showDictionaryLink = true,
  createLabel = "Добавить",
  loadingLabel = "Загрузка…",
  emptyLabel = "Нет совпадений в справочнике",
  items,
  loading = false,
  creating = false,
  error = null,
  onOpen,
  onSearchChange,
  onCreate,
  normalize = defaultNormalize,
  matchKey = defaultMatchKey,
  allowCreate = true,
  selectedInactive = false,
}: AdminReferenceComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const searchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const emitSearchChange = React.useCallback(
    (raw: string) => {
      if (!onSearchChange) return;
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => onSearchChange(raw), 300);
    },
    [onSearchChange],
  );

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  const activeItems = React.useMemo(
    () => items.filter((item) => item.isActive !== false),
    [items],
  );

  const canonicalize = React.useCallback(
    (raw: string) => {
      const norm = normalize(raw);
      if (!norm) return "";
      const key = matchKey(norm);
      if (!key) return norm;
      const match = activeItems.find((item) => matchKey(item.name) === key);
      return match?.name ?? norm;
    },
    [activeItems, matchKey, normalize],
  );

  const filtered = React.useMemo(() => {
    const q = normalize(draft);
    if (!q) return activeItems;
    const nq = q.toLowerCase();
    return activeItems.filter((item) => item.name.toLowerCase().includes(nq));
  }, [activeItems, draft, normalize]);

  const matched = React.useMemo(() => {
    const key = matchKey(draft);
    if (!key) return null;
    return activeItems.find((item) => matchKey(item.name) === key) ?? null;
  }, [activeItems, draft, matchKey]);

  const canCreate =
    allowCreate &&
    !readOnly &&
    Boolean(onCreate) &&
    normalize(draft).length > 0 &&
    matched === null;

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          id={id}
          value={draft}
          readOnly={readOnly}
          placeholder={placeholder}
          className={cn(adminFieldInput, inputClassName)}
          onFocus={() => {
            if (!readOnly) {
              setOpen(true);
              onOpen?.();
            }
          }}
          onChange={(e) => {
            const raw = e.target.value;
            setDraft(raw);
            emitSearchChange(raw);
            onChange(canonicalize(raw));
            setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
        />

        {selectedInactive && value ? (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
            архив
          </span>
        ) : null}

        {open && !readOnly ? (
          <div
            className={cn(
              "absolute z-[80] mt-1 max-h-60 w-full overflow-auto rounded-xl revshare-scrollbar",
              adminDropdownPanel,
            )}
          >
            {loading ? (
              <div className="px-3 py-2 text-xs text-zinc-500">{loadingLabel}</div>
            ) : filtered.length > 0 ? (
              <ul className="py-1">
                {filtered.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cn("flex w-full items-center justify-between gap-2 text-left", adminDropdownItem)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onChange(item.name);
                        setDraft(item.name);
                        setOpen(false);
                      }}
                    >
                      <span>{item.name}</span>
                      {item.hint ? <span className="text-xs text-zinc-500">{item.hint}</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-3 py-2 text-xs text-zinc-500">{emptyLabel}</div>
            )}

            {canCreate ? (
              <button
                type="button"
                className={cn("w-full text-left", adminDropdownItem)}
                disabled={creating}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void onCreate?.(normalize(draft))}
              >
                + {createLabel}:{" "}
                <span className="font-medium text-zinc-100">{normalize(draft)}</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      {helperText ? <p className="text-[11px] leading-relaxed text-zinc-500">{helperText}</p> : null}
      {showDictionaryLink && !readOnly ? (
        <AdminReferenceFieldHint
          href={dictionaryHref}
          kind={referenceHintKind}
          prompt={referenceHintPrompt}
          actionText={referenceHintAction ?? dictionaryLabel}
        />
      ) : null}
    </div>
  );
}
