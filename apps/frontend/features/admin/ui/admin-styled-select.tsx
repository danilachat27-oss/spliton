"use client";

import type { ReactNode } from "react";

import {
  StyledSelect,
  type StyledSelectOption,
} from "@/components/ui/styled-select";
import { AdminFormField } from "@/features/admin/ui/admin-form-field";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type AdminStyledSelectProps = Omit<ComponentProps<typeof StyledSelect>, "tone" | "borderless">;

export function AdminStyledSelect(props: AdminStyledSelectProps) {
  return <StyledSelect tone="dark" borderless {...props} />;
}

export function AdminStyledSelectField({
  label,
  className,
  hint,
  info,
  error,
  htmlFor,
  ...props
}: {
  label: string;
  className?: string;
  hint?: ReactNode;
  info?: string;
  error?: string | null;
  htmlFor?: string;
} & AdminStyledSelectProps) {
  return (
    <AdminFormField
      label={label}
      htmlFor={htmlFor ?? props.id}
      hint={hint}
      info={info}
      error={error}
      className={className}
    >
      <AdminStyledSelect {...props} fullWidth={props.fullWidth ?? true} />
    </AdminFormField>
  );
}

export type { StyledSelectOption };
