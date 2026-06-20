export const DEFAULT_FETCH_TIMEOUT_MS = 20_000;

export class FetchTimeoutError extends Error {
  constructor(message = "Request timed out") {
    super(message);
    this.name = "FetchTimeoutError";
  }
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const userSignal = init?.signal;
  const onUserAbort = () => controller.abort();
  userSignal?.addEventListener("abort", onUserAbort);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new FetchTimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    userSignal?.removeEventListener("abort", onUserAbort);
  }
}

export function raceWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS,
  label = "Operation",
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(
        () => reject(new FetchTimeoutError(`${label} timed out after ${timeoutMs}ms`)),
        timeoutMs,
      );
    }),
  ]);
}
