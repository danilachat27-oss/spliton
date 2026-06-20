import type {
  EmailSignInPayload,
  EmailSignUpPayload,
  LoginSuccessResponse,
  LoginTwoFactorChallengeResponse,
  LogoutResponse,
  RegisterResponse,
  ResendEmailResponse,
  SafeUser,
  TwoFactorVerifyPayload,
  VerifyEmailResponse,
} from "@/types/auth";

import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

type ApiErrorBody = {
  code?: string;
  message?: string | { code?: string; message?: string };
  error?: string;
  statusCode?: number;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

import { resolveApiUrl } from "@/lib/public-env";

function resolveUrl(path: string): string {
  return resolveApiUrl(path);
}

function parseApiErrorBody(body: unknown): { message: string; code?: string } {
  const fallback = { message: "Request failed", code: undefined as string | undefined };
  if (!body || typeof body !== "object") {
    return fallback;
  }
  const typed = body as ApiErrorBody & {
    error?: { code?: string; message?: string };
  };
  if (typed.error?.code || typed.error?.message) {
    return {
      message: typed.error.message || fallback.message,
      code: typed.error.code ?? typed.code,
    };
  }
  if (typeof typed.message === "object" && typed.message) {
    return {
      message: typed.message.message || fallback.message,
      code: typed.message.code ?? typed.code,
    };
  }
  return {
    message: typeof typed.message === "string" ? typed.message : fallback.message,
    code: typed.code,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetchWithTimeout(resolveUrl(path), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const hasJson = response.headers.get("content-type")?.includes("application/json");
  const body = hasJson ? ((await response.json()) as unknown) : null;

  if (!response.ok) {
    const parsed = parseApiErrorBody(body);
    throw new ApiError(response.status, parsed.message, parsed.code);
  }

  return body as T;
}

export async function signInWithGoogle(): Promise<void> {
  throw new Error("Google sign-in is not wired yet.");
}

export async function signInWithEmail(
  payload: EmailSignInPayload,
): Promise<LoginSuccessResponse | LoginTwoFactorChallengeResponse> {
  return request<LoginSuccessResponse | LoginTwoFactorChallengeResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
    }),
  });
}

export async function requestRegistrationOtp(email: string): Promise<void> {
  await resendEmailVerification(email);
}

export async function signUpWithEmail(payload: EmailSignUpPayload): Promise<RegisterResponse> {
  return request<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      acceptedTerms: payload.acceptedTerms,
      acceptedPrivacy: payload.acceptedPrivacy,
      ...(payload.referralCode ? { referralCode: payload.referralCode } : {}),
      ...(payload.utmSource ? { utmSource: payload.utmSource } : {}),
      ...(payload.utmCampaign ? { utmCampaign: payload.utmCampaign } : {}),
    }),
  });
}

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  return request<VerifyEmailResponse>("/auth/email/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function resendEmailVerification(email: string): Promise<ResendEmailResponse> {
  return request<ResendEmailResponse>("/auth/email/resend", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyTwoFactor(
  payload: TwoFactorVerifyPayload,
): Promise<LoginSuccessResponse> {
  return request<LoginSuccessResponse>("/auth/2fa/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function refreshSessionRequest(
  refreshToken?: string | null,
): Promise<LoginSuccessResponse> {
  const trimmed = refreshToken?.trim();
  return request<LoginSuccessResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify(trimmed ? { refreshToken: trimmed } : {}),
  });
}

export async function logoutRequest(): Promise<LogoutResponse> {
  return request<LogoutResponse>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function logoutAllRequest(accessToken: string): Promise<LogoutResponse> {
  return request<LogoutResponse>("/auth/logout-all", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  });
}

export async function forgotPasswordRequest(email: string): Promise<{ success: true }> {
  return request<{ success: true }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordRequest(
  token: string,
  password: string,
): Promise<{ success: true }> {
  return request<{ success: true }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export async function meRequest(accessToken: string): Promise<SafeUser> {
  return request<SafeUser>("/users/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
