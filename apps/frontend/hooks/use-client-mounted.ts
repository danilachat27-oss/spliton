"use client";

import { useEffect, useState } from "react";

/** True only after the component has mounted on the client (safe for hydration-sensitive UI). */
export function useClientMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}