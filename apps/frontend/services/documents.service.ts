import { parseApiClientError } from "@/lib/api/api-client-error";
import { getPublicApiBaseUrl } from "@/lib/public-env";

export const DOCUMENTS_API_PATHS = {
  list: "/api/v1/documents",
  document: (id: string) => `/api/v1/documents/${id}`,
  download: (id: string) => `/api/v1/documents/${id}/download`,
  statement: "/api/v1/documents/statement",
  depositReceipt: (depositId: string) => `/api/v1/wallet/deposits/${depositId}/receipt`,
} as const;

export type UserDocument = {
  id: string;
  kind: string;
  format: string;
  status: string;
  fileSizeBytes: number | null;
  expiresAt: string | null;
  createdAt: string;
  completedAt: string | null;
  downloadCount: number;
};

export type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>;

export function isDocumentReady(status: string) {
  const normalized = status.toLowerCase();
  return normalized === "completed" || normalized === "ready";
}

async function authFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${getPublicApiBaseUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export async function requestDepositReceipt(depositId: string): Promise<UserDocument> {
  return authFetch(DOCUMENTS_API_PATHS.depositReceipt(depositId), { method: "POST" });
}

export async function requestWalletStatement(body: {
  dateFrom?: string;
  dateTo?: string;
  format?: "pdf" | "xlsx";
}): Promise<UserDocument> {
  return authFetch(DOCUMENTS_API_PATHS.statement, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function downloadUserDocument(
  id: string,
  authorizedFetch: AuthorizedFetch,
): Promise<{
  filename: string;
  mimeType: string;
  blob: Blob;
}> {
  const res = await authorizedFetch(DOCUMENTS_API_PATHS.download(id));
  if (!res.ok) throw await parseApiClientError(res);
  const data = (await res.json()) as {
    filename: string;
    mimeType: string;
    contentBase64: string;
  };
  const binary = atob(data.contentBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return {
    filename: data.filename,
    mimeType: data.mimeType,
    blob: new Blob([bytes], { type: data.mimeType }),
  };
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
