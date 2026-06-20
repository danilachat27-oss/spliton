import { describe, expect, it, vi } from "vitest";

import { createPrimaryOrder } from "./wallet.service";

describe("createPrimaryOrder", () => {
  it("sends Idempotency-Key header and body key", async () => {
    const authorizedFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        orderId: "order-1",
        units: "1",
        pricePerUnit: "10",
        grossAmount: "10",
      }),
    });

    await createPrimaryOrder("round-1", 2, authorizedFetch);

    expect(authorizedFetch).toHaveBeenCalledTimes(1);
    const [, init] = authorizedFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    const body = JSON.parse(init.body as string) as {
      roundId: string;
      units: number;
      idempotencyKey: string;
    };

    expect(headers["Idempotency-Key"]).toBeTruthy();
    expect(body.idempotencyKey).toBe(headers["Idempotency-Key"]);
    expect(body.roundId).toBe("round-1");
    expect(body.units).toBe(2);
  });
});
