"use client";

import * as React from "react";

export function useInlineToast(durationMs = 4000) {
  const [message, setMessage] = React.useState<string | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = React.useCallback(
    (msg: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setMessage(msg);
      timerRef.current = setTimeout(() => {
        setMessage(null);
        timerRef.current = null;
      }, durationMs);
    },
    [durationMs],
  );

  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { message, showToast, clearToast: () => setMessage(null) };
}

export function InlineToastBanner({
  message,
  onDismiss,
  className = "fixed bottom-4 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-xl bg-neutral-900 px-4 py-3 text-sm text-white shadow-lg",
}: {
  message: string | null;
  onDismiss?: () => void;
  className?: string;
}) {
  if (!message) return null;
  return (
    <div role="status" className={className}>
      <div className="flex items-start justify-between gap-3">
        <span>{message}</span>
        {onDismiss ? (
          <button
            type="button"
            className="shrink-0 text-xs text-neutral-300 hover:text-white"
            onClick={onDismiss}
          >
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}
