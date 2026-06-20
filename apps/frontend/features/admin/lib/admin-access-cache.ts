/** In-memory cache: verified admin JWT for this browser session (until reload). */
let verifiedAccessToken: string | null = null;

export function isAdminAccessVerified(accessToken: string): boolean {
  return verifiedAccessToken === accessToken;
}

export function markAdminAccessVerified(accessToken: string): void {
  verifiedAccessToken = accessToken;
}

/** Keep verification after JWT refresh (same browser session). */
export function rekeyAdminAccessVerified(
  previousToken: string | null,
  nextToken: string,
): void {
  if (previousToken && verifiedAccessToken === previousToken) {
    verifiedAccessToken = nextToken;
  }
}

export function clearAdminAccessVerified(): void {
  verifiedAccessToken = null;
}
