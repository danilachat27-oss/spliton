import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { coordinatedRefresh } from "@/lib/auth/auth-tab-sync";
import type { SafeUser } from "@/types/auth";

const user: SafeUser = {
  id: "u1",
  email: "a@b.c",
  status: "ACTIVE",
  profile: { displayName: "A" },
  roles: ["INVESTOR"],
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("coordinatedRefresh", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("BroadcastChannel", undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("runs refresh when lock is free", async () => {
    const refreshFn = vi.fn(async () => ({
      user,
      accessToken: "token-1",
      ts: Date.now(),
    }));

    const result = await coordinatedRefresh(refreshFn);
    expect(refreshFn).toHaveBeenCalledTimes(1);
    expect(result?.accessToken).toBe("token-1");
  });

  it("waits instead of parallel refresh while lock is held", async () => {
    vi.useFakeTimers();
    localStorage.setItem(
      "spliton:auth:refresh-lock",
      JSON.stringify({ id: "other-tab", ts: Date.now() }),
    );

    const refreshFn = vi.fn(async () => ({
      user,
      accessToken: "token-2",
      ts: Date.now(),
    }));

    const pending = coordinatedRefresh(refreshFn);
    await vi.advanceTimersByTimeAsync(12_100);
    const result = await pending;
    vi.useRealTimers();

    expect(refreshFn).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
