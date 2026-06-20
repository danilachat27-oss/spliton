/** Valid Tron base58 alphabet (no 0, O, I, l). */
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Unique TRC20-shaped address per e2e call.
 * Avoids shared `toAddress` pollution that triggers suspicious_address risk flags.
 */
export function uniqueTrc20Address(seed = ''): string {
  const raw = `${Date.now()}${seed}`.replace(/\D/g, '');
  let suffix = '';
  for (let i = 0; i < raw.length && suffix.length < 33; i++) {
    const digit = Number.parseInt(raw[i]!, 10);
    suffix += BASE58[digit % BASE58.length];
  }
  while (suffix.length < 33) {
    suffix += BASE58[suffix.length % BASE58.length];
  }
  return `T${suffix.slice(0, 33)}`;
}
