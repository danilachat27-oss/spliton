/** Tron TRC20 address: starts with T, 34 chars, base58 alphabet without 0/O/I/l */
const TRC20_ADDRESS_RE = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

export function isValidTrc20Address(address: string): boolean {
  return TRC20_ADDRESS_RE.test(address.trim());
}

export function normalizeTrc20Address(address: string): string {
  return address.trim();
}
