"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import type { ReferralRewardStatus } from "@/components/referral/referral-mock-data";
import {
  fetchReferralInvites,
  fetchReferralMe,
  fetchReferralRewards,
  type ReferralInviteRow,
  type ReferralMe,
  type ReferralRewardRow,
} from "@/services/referrals.service";

export type ReferralProgramDataState = {
  loading: boolean;
  error: string | null;
  me: ReferralMe | null;
  invites: ReferralInviteRow[];
  rewards: ReferralRewardRow[];
  refresh: () => void;
};

export function useReferralProgramData(): ReferralProgramDataState {
  const { user, authorizedFetch } = useAuth();
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<ReferralMe | null>(null);
  const [invites, setInvites] = useState<ReferralInviteRow[]>([]);
  const [rewards, setRewards] = useState<ReferralRewardRow[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setMe(null);
      setInvites([]);
      setRewards([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [profile, invitePage, rewardPage] = await Promise.all([
        fetchReferralMe(authorizedFetch),
        fetchReferralInvites(authorizedFetch, 1, 50),
        fetchReferralRewards(authorizedFetch, { page: 1, pageSize: 100 }),
      ]);
      setMe(profile);
      setInvites(invitePage.items);
      setRewards(rewardPage.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, user]);

  useEffect(() => {
    void load();
  }, [load]);

  return { loading, error, me, invites, rewards, refresh: load };
}
