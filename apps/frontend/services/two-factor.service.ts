import { resolveApiUrl } from "@/lib/public-env";

type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>;

export type TwoFactorSetupResult = {
  methodId: string;
  otpauthUrl: string;
};

export type TwoFactorVerifySetupResult = {
  enabled: true;
  backupCodes: string[];
};

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | { message?: string } };
    if (typeof body.message === "string") return body.message;
    if (body.message && typeof body.message.message === "string") return body.message.message;
  } catch {
    /* ignore */
  }
  return "Не удалось выполнить операцию";
}

export async function setupTwoFactor(
  fetcher: AuthorizedFetch,
): Promise<TwoFactorSetupResult> {
  const res = await fetcher(resolveApiUrl("/auth/2fa/setup"), { method: "POST" });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<TwoFactorSetupResult>;
}

export async function verifyTwoFactorSetup(
  fetcher: AuthorizedFetch,
  code: string,
): Promise<TwoFactorVerifySetupResult> {
  const res = await fetcher(resolveApiUrl("/auth/2fa/verify-setup"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<TwoFactorVerifySetupResult>;
}

export async function disableTwoFactor(
  fetcher: AuthorizedFetch,
  params: { password: string; code: string; method: "totp" | "backup_code" },
): Promise<void> {
  const res = await fetcher(resolveApiUrl("/auth/2fa/disable"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export function extractTotpSecret(otpauthUrl: string): string | null {
  try {
    const parsed = new URL(otpauthUrl.replace(/^otpauth:\/\//i, "http://"));
    return parsed.searchParams.get("secret");
  } catch {
    return null;
  }
}
