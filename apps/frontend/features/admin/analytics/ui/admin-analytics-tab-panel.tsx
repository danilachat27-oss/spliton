"use client";

type Props = {
  activeTab: string;
  tabId: string;
  children: React.ReactNode;
};

export function AdminAnalyticsTabPanel({ activeTab, tabId, children }: Props) {
  if (activeTab !== tabId) return null;
  return <>{children}</>;
}
