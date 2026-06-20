"use client";

import dynamic from "next/dynamic";

import { AdminChartSkeleton } from "@/features/admin/analytics/components/admin-chart-states";

function chartLoading() {
  return <AdminChartSkeleton />;
}

export const AdminLineChart = dynamic(
  () => import("./admin-charts").then((m) => ({ default: m.AdminLineChart })),
  { loading: chartLoading, ssr: false },
);

export const AdminBarChart = dynamic(
  () => import("./admin-charts").then((m) => ({ default: m.AdminBarChart })),
  { loading: chartLoading, ssr: false },
);

export const AdminMultiLineChart = dynamic(
  () => import("./admin-charts").then((m) => ({ default: m.AdminMultiLineChart })),
  { loading: chartLoading, ssr: false },
);

export const AdminDonutChart = dynamic(
  () => import("./admin-charts").then((m) => ({ default: m.AdminDonutChart })),
  { loading: chartLoading, ssr: false },
);

export const AdminColumnChart = dynamic(
  () => import("./admin-charts").then((m) => ({ default: m.AdminColumnChart })),
  { loading: chartLoading, ssr: false },
);