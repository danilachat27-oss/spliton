"use client";

import "./services-megamenu-preview.css";
import "./cabinet-megamenu-preview.css";
import "./profile-megamenu-preview.css";

import { profileDashboardHref } from "@/constants/dashboard/profile-page";
import {
  ProfileOverviewScene,
  ProfileSecurityScene,
  ProfileSettingsScene,
  ProfileVerificationScene,
} from "@/components/dashboard/profile-megamenu-preview-scenes";
import { MegamenuPreviewSceneShell } from "@/components/dashboard/megamenu-preview-primitives";

const PROFILE_SCENE_BY_HREF: Record<string, string> = {
  [profileDashboardHref("overview")]: "profile-overview",
  [profileDashboardHref("verification")]: "profile-verification",
  [profileDashboardHref("security")]: "profile-security",
  [profileDashboardHref("settings")]: "profile-settings",
};

function ProfileSceneContent({ href }: { href: string }) {
  switch (href) {
    case profileDashboardHref("overview"):
      return <ProfileOverviewScene />;
    case profileDashboardHref("verification"):
      return <ProfileVerificationScene />;
    case profileDashboardHref("security"):
      return <ProfileSecurityScene />;
    case profileDashboardHref("settings"):
      return <ProfileSettingsScene />;
    default:
      return <ProfileOverviewScene />;
  }
}

export function ProfileMegamenuPagePreview({ href, label }: { href: string; label: string }) {
  const scene = PROFILE_SCENE_BY_HREF[href] ?? "profile-overview";

  return (
    <MegamenuPreviewSceneShell key={href} title={label} sceneClass={`service-preview-scene--${scene}`}>
      <ProfileSceneContent href={href} />
    </MegamenuPreviewSceneShell>
  );
}

export function isProfileMegamenuPreviewHref(href: string): boolean {
  return href in PROFILE_SCENE_BY_HREF;
}
