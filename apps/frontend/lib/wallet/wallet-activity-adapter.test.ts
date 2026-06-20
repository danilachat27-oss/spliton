import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { WalletActivityItem } from "@/services/wallet.service";

import {
  adaptWalletActivityToPayoutHistory,
  adaptWalletActivityToRecord,
} from "./wallet-activity-adapter";

const CYRILLIC = /[\u0400-\u04FF]/;

const sampleRow = (): WalletActivityItem => ({
  id: "wa-1",
  referenceId: "ref-abcdef12",
  type: "deposit",
  title: "Deposit",
  description: "Wallet top-up",
  direction: "in",
  amount: "100",
  amountSigned: "+100",
  asset: "USDT",
  units: "0",
  status: "completed",
  statusLabel: "Completed",
  userFacingLabel: "Deposit",
  createdAt: "2026-06-05T10:00:00.000Z",
  relatedEntity: {
    type: "release",
    id: "rel-1",
    releaseId: "rel-1",
    releaseTitle: "Midnight Drive",
  },
  feeAmount: null,
});

describe("wallet-activity-adapter locale", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-05T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats EN activity without Russian date or relative strings", () => {
    const record = adaptWalletActivityToRecord(sampleRow(), "en");
    expect(record.date).not.toMatch(CYRILLIC);
    expect(record.relative).not.toMatch(CYRILLIC);
    expect(record.relative).not.toMatch(/мин\.|ч\.|дн\./);
  });

  it("formats payout history date by locale", () => {
    const en = adaptWalletActivityToPayoutHistory(sampleRow(), "en");
    const es = adaptWalletActivityToPayoutHistory(sampleRow(), "es");
    expect(en.date).not.toMatch(CYRILLIC);
    expect(es.date).not.toMatch(CYRILLIC);
  });

  it("has no ru-RU in wallet-activity-adapter source", () => {
    const src = fs.readFileSync(path.join(__dirname, "wallet-activity-adapter.ts"), "utf8");
    expect(src).not.toMatch(/ru-RU/);
    expect(src).not.toMatch(/мин\. назад|ч\. назад|дн\. назад/);
  });
});
