const REF_COOKIE = "spliton_ref";
const REF_UTM_COOKIE = "spliton_ref_utm";
const MAX_AGE_DAYS = 30;

function maxAgeSec() {
  return MAX_AGE_DAYS * 24 * 60 * 60;
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSec()}; SameSite=Lax${secure}`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

export function normalizeReferralCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Persist referral code from URL (`?ref=` or `?referral=`). */
export function captureReferralFromSearchParams(params: URLSearchParams) {
  const raw = params.get("ref") ?? params.get("referral");
  if (!raw) return;
  const code = normalizeReferralCode(raw);
  if (!code) return;
  setCookie(REF_COOKIE, code);
  const utmSource = params.get("utm_source") ?? params.get("utmSource");
  const utmCampaign = params.get("utm_campaign") ?? params.get("utmCampaign");
  if (utmSource || utmCampaign) {
    setCookie(REF_UTM_COOKIE, JSON.stringify({ utmSource, utmCampaign }));
  }
}

export function persistReferralCode(code: string) {
  const normalized = normalizeReferralCode(code);
  if (normalized) setCookie(REF_COOKIE, normalized);
}

export function readReferralAttribution(): {
  referralCode?: string;
  utmSource?: string;
  utmCampaign?: string;
} {
  const code = getCookie(REF_COOKIE);
  const utmRaw = getCookie(REF_UTM_COOKIE);
  let utmSource: string | undefined;
  let utmCampaign: string | undefined;
  if (utmRaw) {
    try {
      const parsed = JSON.parse(utmRaw) as { utmSource?: string; utmCampaign?: string };
      utmSource = parsed.utmSource ?? undefined;
      utmCampaign = parsed.utmCampaign ?? undefined;
    } catch {
      /* ignore */
    }
  }
  return {
    referralCode: code ? normalizeReferralCode(code) : undefined,
    utmSource,
    utmCampaign,
  };
}
