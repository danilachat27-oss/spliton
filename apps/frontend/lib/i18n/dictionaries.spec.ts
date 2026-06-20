import { messageForApiError } from "./dictionaries";

describe("i18n error mapping", () => {
  it("maps wallet error to RU", () => {
    expect(messageForApiError("WALLET_INSUFFICIENT_BALANCE", "ru")).toMatch(/Недостаточно/);
  });

  it("maps wallet error to EN", () => {
    expect(messageForApiError("WALLET_INSUFFICIENT_BALANCE", "en")).toMatch(/Insufficient/);
  });

  it("falls back for unknown codes", () => {
    expect(messageForApiError("NOT_A_REAL_CODE", "ru")).toMatch(/Не удалось/);
  });

  it("sanitizes technical fallback", () => {
    expect(
      messageForApiError(undefined, "en", "Internal server error: prisma P2002"),
    ).toMatch(/Something went wrong|Operation failed|Try again/i);
  });
});
