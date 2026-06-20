import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validatePublicEnvForBuild } from "./lib/validate-public-env";

validatePublicEnvForBuild();

/**
 * Каталог приложения (apps/frontend). При нескольких lockfile в монорепо Next
 * иначе выбирает корень выше и ломает резолв `@import "tailwindcss"` (ищет в `apps/`).
 */
const appDir = path.dirname(fileURLToPath(import.meta.url));

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // React Compiler заметно замедляет первую компиляцию в dev.
  reactCompiler: isProd,
  // Playwright e2e uses 127.0.0.1; without this Next dev blocks HMR/chunks cross-origin.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    root: appDir,
  },
  experimental: {
    // lucide-react + @base-ui may break under Turbopack (see package.json dev:webpack fallback).
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    // Persist Turbopack dev compiler output between restarts (Next 16 defaults to true).
    turbopackFileSystemCacheForDev: true,
    // Cache RSC fetch results across HMR in dev (default true in Next 16).
    serverComponentsHmrCache: true,
  },
  async redirects() {
    return [{ source: "/calculator", destination: "/assets/calculator", permanent: true }];
  },
};

export default nextConfig;
