import { parseApiClientError } from "@/lib/api/api-client-error";
import { getPublicApiBaseUrl } from "@/lib/public-env";

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "completed" | "skipped";
  completedAt: string | null;
  actionUrl: string;
  priority: number;
  required: boolean;
  blockingReason: string | null;
};

export type OnboardingState = {
  dismissed: boolean;
  completed: boolean;
  progressPct: number;
  steps: OnboardingStep[];
};

type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>;

function url(path: string) {
  return `${getPublicApiBaseUrl()}${path}`;
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw await parseApiClientError(res);
  return res.json() as Promise<T>;
}

export async function fetchOnboarding(fetcher: AuthorizedFetch): Promise<OnboardingState> {
  const res = await fetcher(url("/api/v1/onboarding"));
  return parseJson(res);
}

export async function completeOnboardingStep(
  fetcher: AuthorizedFetch,
  stepId: string,
): Promise<OnboardingState> {
  const res = await fetcher(url(`/api/v1/onboarding/steps/${stepId}`), { method: "PATCH" });
  return parseJson(res);
}

export async function dismissOnboarding(fetcher: AuthorizedFetch): Promise<OnboardingState> {
  const res = await fetcher(url("/api/v1/onboarding/dismiss"), { method: "POST" });
  return parseJson(res);
}
