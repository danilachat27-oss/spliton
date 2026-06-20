import * as React from "react";

import { GuideSectionHeader } from "./guide-section-header";

export function GuideSectionShell({
  id,
  title,
  subtitle,
  headerAlign = "center",
  children,
  className,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  headerAlign?: "center" | "left";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} data-guide-section className={className}>
      <GuideSectionHeader title={title} subtitle={subtitle} align={headerAlign} />
      <div className="mt-4 md:mt-5">{children}</div>
    </section>
  );
}
