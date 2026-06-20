"use client";

import "./services-megamenu-preview.css";
import "./support-megamenu-preview.css";

import {
  SupportHubScene,
  SupportSecurityScene,
  SupportStatusScene,
  SupportTicketScene,
} from "@/components/dashboard/support-megamenu-preview-scenes";
import { MegamenuPreviewSceneShell } from "@/components/dashboard/megamenu-preview-primitives";
import { ROUTES } from "@/constants/routes";

const SUPPORT_SCENE_BY_HREF: Record<string, string> = {
  [ROUTES.support]: "support-hub",
  [ROUTES.dashboardSupport]: "support-ticket",
  [ROUTES.systemStatus]: "support-status",
  [`${ROUTES.dashboardProfile}?tab=security`]: "support-security",
};

function SupportSceneContent({ href }: { href: string }) {
  switch (href) {
    case ROUTES.support:
      return <SupportHubScene />;
    case ROUTES.dashboardSupport:
      return <SupportTicketScene />;
    case ROUTES.systemStatus:
      return <SupportStatusScene />;
    case `${ROUTES.dashboardProfile}?tab=security`:
      return <SupportSecurityScene />;
    default:
      return <SupportHubScene />;
  }
}

export function SupportMegamenuPagePreview({ href, label }: { href: string; label: string }) {
  const scene = SUPPORT_SCENE_BY_HREF[href] ?? "support-hub";

  return (
    <MegamenuPreviewSceneShell key={href} title={label} sceneClass={`service-preview-scene--${scene}`}>
      <SupportSceneContent href={href} />
    </MegamenuPreviewSceneShell>
  );
}

export function isSupportMegamenuPreviewHref(href: string): boolean {
  return href in SUPPORT_SCENE_BY_HREF;
}
