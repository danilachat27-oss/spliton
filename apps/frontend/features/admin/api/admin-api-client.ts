import { ApiError } from "@/services/auth.service";

import { getAdminApiBaseUrl } from "./admin-api.config";
import type { ApiErrorBody, AdminListQuery, PaginatedResponse } from "./types";

export type AdminFetchFn = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

function buildQuery(query?: AdminListQuery): string {
  if (!query) return "";
  const p = new URLSearchParams();
  if (query.page != null) p.set("page", String(query.page));
  if (query.pageSize != null) p.set("pageSize", String(query.pageSize));
  if (query.search) p.set("search", query.search);
  if (query.sortBy) p.set("sortBy", query.sortBy);
  if (query.sortDir) p.set("sortDir", query.sortDir);
  if (query.dateFrom) p.set("dateFrom", query.dateFrom);
  if (query.dateTo) p.set("dateTo", query.dateTo);
  if (query.status) p.set("status", query.status);
  if (query.role) p.set("role", query.role);
  if (query.q) p.set("q", query.q);
  if (query.categoryId) p.set("categoryId", query.categoryId);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/**
 * Versioned admin HTTP client. Inject `authorizedFetch` from AuthProvider in hooks.
 */
export class AdminApiClient {
  constructor(private readonly fetchFn: AdminFetchFn) {}

  private url(path: string, query?: AdminListQuery): string {
    return `${getAdminApiBaseUrl()}${path}${buildQuery(query)}`;
  }

  private async parseError(res: Response): Promise<never> {
    let message = res.statusText || "Request failed";
    let code = `HTTP_${res.status}`;
    try {
      const body = (await res.json()) as ApiErrorBody & {
        code?: string;
        message?: string | string[];
      };
      if (body?.error?.message) message = body.error.message;
      if (body?.error?.code) code = body.error.code;
      if (!body?.error?.code && body.code) code = body.code;
      if (!body?.error?.message && body.message) {
        message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
      }
    } catch {
      /* non-json */
    }
    throw new ApiError(res.status, message, code);
  }

  async get<T>(path: string, query?: AdminListQuery): Promise<T> {
    const res = await this.fetchFn(this.url(path, query), { method: "GET" });
    if (!res.ok) await this.parseError(res);
    return res.json() as Promise<T>;
  }

  async getPaginated<T>(path: string, query?: AdminListQuery): Promise<PaginatedResponse<T>> {
    return this.get<PaginatedResponse<T>>(path, query);
  }

  async post<T>(
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const res = await this.fetchFn(this.url(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: body != null ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) await this.parseError(res);
    return res.json() as Promise<T>;
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    const res = await this.fetchFn(this.url(path), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) await this.parseError(res);
    return res.json() as Promise<T>;
  }

  async delete<T>(path: string): Promise<T> {
    const res = await this.fetchFn(this.url(path), { method: "DELETE" });
    if (!res.ok) await this.parseError(res);
    return res.json() as Promise<T>;
  }

  async postForm<T>(path: string, formData: FormData): Promise<T> {
    const res = await this.fetchFn(this.url(path), {
      method: "POST",
      body: formData,
    });
    if (!res.ok) await this.parseError(res);
    return res.json() as Promise<T>;
  }
}
