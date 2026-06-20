/** Map validation i18n keys to form field names for inline AdminFormField errors. */
export function fieldErrorMap<T extends string>(
  errors: string[],
  mapping: Record<string, T>,
): Partial<Record<T, string>> {
  const out: Partial<Record<T, string>> = {};
  for (const key of errors) {
    const field = mapping[key];
    if (field && !out[field]) out[field] = key;
  }
  return out;
}

export function fieldErrorMessage(
  fieldErrors: Partial<Record<string, string>>,
  field: string,
  translate: (key: string) => string,
): string | null {
  const key = fieldErrors[field];
  return key ? translate(key) : null;
}
