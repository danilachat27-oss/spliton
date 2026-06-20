export type CopyResult = "ok" | "unsupported" | "error";

export async function copyTextToClipboard(value: string): Promise<CopyResult> {
  if (!value.trim()) return "error";
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return "ok";
    }
    return "unsupported";
  } catch {
    return "error";
  }
}
