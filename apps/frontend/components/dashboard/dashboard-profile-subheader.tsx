"use client";

import { useRouter } from "next/navigation";

import { useLocalizedProfileMenuItems } from "@/hooks/use-shell-i18n";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

/** Вертикальный список для мобильного `details` у иконки профиля */
export function DashboardProfileMobileLinks({ onNavigate }: { onNavigate: () => void }) {
  const profileItems = useLocalizedProfileMenuItems();
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <div className="border-t border-white/8 py-1">
      {profileItems.map((tab) => {
        if (tab.danger) {
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => {
                void (async () => {
                  await logout();
                  onNavigate();
                  router.push(ROUTES.login);
                })();
              }}
              className="block w-full px-3 py-2.5 text-left text-sm text-fuchsia-300/95 transition-colors hover:bg-white/[0.05] hover:text-fuchsia-200"
            >
              {tab.label}
            </button>
          );
        }
        return (
          <a
            key={tab.label}
            href={tab.href}
            onClick={onNavigate}
            className="block px-3 py-2.5 text-sm text-neutral-300 transition-colors hover:bg-white/[0.05]"
          >
            {tab.label}
          </a>
        );
      })}
    </div>
  );
}
