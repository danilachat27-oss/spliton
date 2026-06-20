import type { SafeUser } from "@/types/auth";

const CHANNEL_NAME = "spliton-auth-v1";
const LOCK_KEY = "spliton:auth:refresh-lock";
const LOCK_TTL_MS = 15_000;
const SYNC_WAIT_MS = 12_000;

export type AuthSyncPayload = {
  user: SafeUser;
  accessToken: string;
  ts: number;
};

type AuthTabMessage =
  | { type: "SESSION"; payload: AuthSyncPayload }
  | { type: "LOGOUT"; ts: number };

type RefreshLock = {
  id: string;
  ts: number;
};

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

function closeChannel(): void {
  channel?.close();
  channel = null;
}

function readLock(): RefreshLock | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RefreshLock;
    if (!parsed?.id || !Number.isFinite(parsed.ts)) {
      localStorage.removeItem(LOCK_KEY);
      return null;
    }
    if (Date.now() - parsed.ts > LOCK_TTL_MS) {
      localStorage.removeItem(LOCK_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function tryAcquireRefreshLock(): string | null {
  if (typeof localStorage === "undefined") {
    return crypto.randomUUID();
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  const existing = readLock();
  if (existing) return null;

  try {
    localStorage.setItem(LOCK_KEY, JSON.stringify({ id, ts: now } satisfies RefreshLock));
    const verify = readLock();
    return verify?.id === id ? id : null;
  } catch {
    return id;
  }
}

function releaseRefreshLock(lockId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    const existing = readLock();
    if (existing?.id === lockId) {
      localStorage.removeItem(LOCK_KEY);
    }
  } catch {
    // ignore
  }
}

export function broadcastSession(payload: AuthSyncPayload): void {
  getChannel()?.postMessage({ type: "SESSION", payload } satisfies AuthTabMessage);
}

export function broadcastLogout(): void {
  getChannel()?.postMessage({ type: "LOGOUT", ts: Date.now() } satisfies AuthTabMessage);
}

function waitForSessionSync(minTs = 0): Promise<AuthSyncPayload | null> {
  return new Promise((resolve) => {
    const ch = getChannel();
    if (!ch) {
      resolve(null);
      return;
    }

    const onMessage = (event: MessageEvent<AuthTabMessage>) => {
      const msg = event.data;
      if (msg?.type === "SESSION" && msg.payload.ts >= minTs) {
        cleanup();
        resolve(msg.payload);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== LOCK_KEY || event.newValue !== null) return;
      cleanup();
      resolve(null);
    };

    const timer = window.setTimeout(() => {
      cleanup();
      resolve(null);
    }, SYNC_WAIT_MS);

    function cleanup() {
      clearTimeout(timer);
      ch?.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
    }

    ch.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);
  });
}

export function subscribeAuthTabSync(handlers: {
  onSession: (payload: AuthSyncPayload) => void;
  onLogout: () => void;
}): () => void {
  const ch = getChannel();
  if (!ch) return () => undefined;

  const onMessage = (event: MessageEvent<AuthTabMessage>) => {
    const msg = event.data;
    if (msg?.type === "SESSION") handlers.onSession(msg.payload);
    if (msg?.type === "LOGOUT") handlers.onLogout();
  };

  ch.addEventListener("message", onMessage);
  return () => {
    ch.removeEventListener("message", onMessage);
    closeChannel();
  };
}

/**
 * Serialize refresh across tabs so rotated refresh cookies are not reused
 * (backend revokes all sessions on refresh-token reuse).
 */
export async function coordinatedRefresh(
  refreshFn: () => Promise<AuthSyncPayload | null>,
): Promise<AuthSyncPayload | null> {
  const waitStartedAt = Date.now();
  let lockId = tryAcquireRefreshLock();

  if (!lockId) {
    const synced = await waitForSessionSync(waitStartedAt);
    if (synced) return synced;

    lockId = tryAcquireRefreshLock();
    if (!lockId) {
      return null;
    }
  }

  try {
    const result = await refreshFn();
    if (result) {
      broadcastSession(result);
    }
    return result;
  } finally {
    releaseRefreshLock(lockId);
  }
}
