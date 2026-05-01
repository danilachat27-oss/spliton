"use client";

import * as React from "react";

import type {
  EmailSignInPayload,
  EmailSignUpPayload,
  PendingTwoFactorChallenge,
  SafeUser,
  TwoFactorVerifyPayload,
} from "@/types/auth";
import {
  ApiError,
  logoutAllRequest,
  logoutRequest,
  meRequest,
  refreshSessionRequest,
  resendEmailVerification,
  signInWithEmail,
  signUpWithEmail,
  verifyEmail,
  verifyTwoFactor,
} from "@/services/auth.service";

type AuthContextValue = {
  user: SafeUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresEmailVerification: boolean;
  pendingTwoFactorChallenge: PendingTwoFactorChallenge | null;
  register: (payload: EmailSignUpPayload) => Promise<{ requiresEmailVerification: true }>;
  verifyEmail: (token: string) => Promise<void>;
  resendEmail: (email: string) => Promise<void>;
  login: (payload: EmailSignInPayload) => Promise<"authenticated" | "2fa_required">;
  verify2fa: (payload: TwoFactorVerifyPayload) => Promise<void>;
  refreshSession: () => Promise<string | null>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  loadMe: () => Promise<SafeUser | null>;
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

const API_BASE_URL =
  process.env.VITE_API_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  "http://localhost:3001";

function resolveUrl(path: string): string {
  return `${API_BASE_URL.replace(/\/+$/, "")}${path}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SafeUser | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [requiresEmailVerification, setRequiresEmailVerification] =
    React.useState(false);
  const [pendingTwoFactorChallenge, setPendingTwoFactorChallenge] =
    React.useState<PendingTwoFactorChallenge | null>(null);

  const clearAuth = React.useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setPendingTwoFactorChallenge(null);
  }, []);

  const loadMe = React.useCallback(async (): Promise<SafeUser | null> => {
    if (!accessToken) {
      setUser(null);
      return null;
    }
    try {
      const me = await meRequest(accessToken);
      setUser(me);
      return me;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAuth();
      }
      return null;
    }
  }, [accessToken, clearAuth]);

  const refreshSession = React.useCallback(async (): Promise<string | null> => {
    try {
      const refreshed = await refreshSessionRequest();
      setAccessToken(refreshed.tokens.accessToken);
      setUser(refreshed.user);
      return refreshed.tokens.accessToken;
    } catch {
      clearAuth();
      return null;
    }
  }, [clearAuth]);

  const register = React.useCallback(
    async (payload: EmailSignUpPayload): Promise<{ requiresEmailVerification: true }> => {
      const response = await signUpWithEmail(payload);
      setRequiresEmailVerification(response.requiresEmailVerification);
      return response;
    },
    [],
  );

  const handleAuthSuccess = React.useCallback((nextUser: SafeUser, token: string) => {
    setAccessToken(token);
    setUser(nextUser);
    setPendingTwoFactorChallenge(null);
    setRequiresEmailVerification(false);
  }, []);

  const login = React.useCallback(
    async (
      payload: EmailSignInPayload,
    ): Promise<"authenticated" | "2fa_required"> => {
      const result = await signInWithEmail(payload);
      if ("requires2fa" in result) {
        setPendingTwoFactorChallenge({
          challengeId: result.challengeId,
          availableMethods: result.availableMethods,
          email: payload.email,
        });
        return "2fa_required";
      }
      handleAuthSuccess(result.user, result.tokens.accessToken);
      return "authenticated";
    },
    [handleAuthSuccess],
  );

  const verify2fa = React.useCallback(
    async (payload: TwoFactorVerifyPayload): Promise<void> => {
      const result = await verifyTwoFactor(payload);
      handleAuthSuccess(result.user, result.tokens.accessToken);
    },
    [handleAuthSuccess],
  );

  const handleVerifyEmail = React.useCallback(async (token: string): Promise<void> => {
    await verifyEmail(token);
    setRequiresEmailVerification(false);
  }, []);

  const resendEmail = React.useCallback(async (email: string): Promise<void> => {
    await resendEmailVerification(email);
  }, []);

  const logout = React.useCallback(async (): Promise<void> => {
    try {
      await logoutRequest();
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const logoutAll = React.useCallback(async (): Promise<void> => {
    try {
      if (accessToken) {
        await logoutAllRequest(accessToken);
      } else {
        await logoutRequest();
      }
    } finally {
      clearAuth();
    }
  }, [accessToken, clearAuth]);

  const authorizedFetch = React.useCallback(
    async (input: string, init?: RequestInit): Promise<Response> => {
      const target = input.startsWith("http") ? input : resolveUrl(input);
      const doRequest = (token: string | null) =>
        fetch(target, {
          credentials: "include",
          ...init,
          headers: {
            ...(init?.headers ?? {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

      let response = await doRequest(accessToken);
      if (response.status !== 401) {
        return response;
      }

      const refreshedToken = await refreshSession();
      if (!refreshedToken) {
        return response;
      }

      response = await doRequest(refreshedToken);
      if (response.status === 401) {
        clearAuth();
      }
      return response;
    },
    [accessToken, refreshSession, clearAuth],
  );

  React.useEffect(() => {
    let active = true;
    (async () => {
      const refreshed = await refreshSession();
      if (!active) return;
      if (refreshed) {
        await loadMe();
      }
      if (active) {
        setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshSession, loadMe]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isLoading,
      requiresEmailVerification,
      pendingTwoFactorChallenge,
      register,
      verifyEmail: handleVerifyEmail,
      resendEmail,
      login,
      verify2fa,
      refreshSession,
      logout,
      logoutAll,
      loadMe,
      authorizedFetch,
    }),
    [
      user,
      accessToken,
      isLoading,
      requiresEmailVerification,
      pendingTwoFactorChallenge,
      register,
      handleVerifyEmail,
      resendEmail,
      login,
      verify2fa,
      refreshSession,
      logout,
      logoutAll,
      loadMe,
      authorizedFetch,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
