import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { SPLITON_SESSION_COOKIE } from "@/lib/auth/session-cookie";

import { proxy } from "./proxy";

function requestFor(path: string, cookies?: Record<string, string>) {
  const url = `https://spliton.test${path}`;
  const req = new NextRequest(url);
  if (cookies) {
    for (const [name, value] of Object.entries(cookies)) {
      req.cookies.set(name, value);
    }
  }
  return req;
}

describe("proxy route guard", () => {
  it("redirects protected routes without session cookie", () => {
    const res = proxy(requestFor("/assets/overview"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("/login");
    expect(location).toContain("next=%2Fassets%2Foverview");
  });

  it("allows protected routes with spliton_session=1", () => {
    const res = proxy(
      requestFor("/dashboard/secondary-market", { [SPLITON_SESSION_COOKIE]: "1" }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it.each([
    "/app",
    "/catalog",
    "/analytics/releases",
    "/guide/selection",
    "/catalog/market-overview",
    "/fees",
    "/news",
    "/support",
  ])("does not redirect public route %s", (path) => {
    const res = proxy(requestFor(path));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it.each([
    ["/assets/payouts/withdraw", "next=%2Fassets%2Fpayouts%2Fwithdraw"],
    ["/dashboard/profile", "next=%2Fdashboard%2Fprofile"],
    ["/dashboard/secondary-market", "next=%2Fdashboard%2Fsecondary-market"],
  ])("redirects protected route %s without session", (path, nextParam) => {
    const res = proxy(requestFor(path));
    expect(res.status).toBe(307);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("/login");
    expect(location).toContain(nextParam);
  });
});
