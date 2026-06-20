export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const minPasswordLength = 8;

export type FieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
};

export type FormErrorState = FieldErrors & { submit?: string };

export type AuthTranslate = (key: string) => string;

export function validatePasswordStep(
  values: {
    password: string;
    confirmPassword: string;
    termsAccepted: boolean;
  },
  t: AuthTranslate,
): Pick<FieldErrors, "password" | "confirmPassword" | "terms"> {
  const next: Pick<FieldErrors, "password" | "confirmPassword" | "terms"> = {};

  if (!values.password) {
    next.password = t("auth.validation.passwordRequired");
  } else if (values.password.length < minPasswordLength) {
    next.password = t("auth.validation.passwordMin").replace("{min}", String(minPasswordLength));
  }

  if (!values.confirmPassword) {
    next.confirmPassword = t("auth.validation.confirmRequired");
  } else if (values.password !== values.confirmPassword) {
    next.confirmPassword = t("auth.validation.passwordMismatch");
  }

  if (!values.termsAccepted) {
    next.terms = t("auth.validation.termsRequired");
  }

  return next;
}

export function emailErrorMessage(trimmed: string, t: AuthTranslate): string | undefined {
  if (!trimmed) return t("auth.validation.emailRequired");
  if (!emailPattern.test(trimmed)) return t("auth.validation.emailInvalid");
  return undefined;
}
