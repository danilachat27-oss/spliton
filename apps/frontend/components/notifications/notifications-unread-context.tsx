"use client";

import * as React from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { fetchUnreadCount } from "@/services/notifications.service";

type NotificationsUnreadContextValue = {
  unread: number;
  refresh: () => Promise<void>;
  setUnread: React.Dispatch<React.SetStateAction<number>>;
};

const NotificationsUnreadContext = React.createContext<NotificationsUnreadContextValue | null>(null);

export function NotificationsUnreadProvider({
  apiBasePath,
  children,
}: {
  apiBasePath: string;
  children: React.ReactNode;
}) {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const [unread, setUnread] = React.useState(0);

  const refresh = React.useCallback(async () => {
    if (!isAuthenticated) {
      setUnread(0);
      return;
    }
    try {
      const count = await fetchUnreadCount(authorizedFetch, apiBasePath);
      setUnread(count);
    } catch {
      setUnread(0);
    }
  }, [apiBasePath, authorizedFetch, isAuthenticated]);

  React.useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 60_000);
    return () => clearInterval(timer);
  }, [refresh]);

  const value = React.useMemo(
    () => ({ unread, refresh, setUnread }),
    [unread, refresh],
  );

  return (
    <NotificationsUnreadContext.Provider value={value}>{children}</NotificationsUnreadContext.Provider>
  );
}

export function useNotificationsUnread() {
  return React.useContext(NotificationsUnreadContext);
}