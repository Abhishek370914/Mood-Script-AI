import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { apiFetch, getStoredSessionToken, setStoredSessionToken } from "../lib/api";

WebBrowser.maybeCompleteAuthSession();

export type User = {
  user_id: string;
  email: string;
  name: string;
  picture?: string | null;
};

type AuthState = {
  isBooting: boolean;
  sessionToken: string | null;
  user: User | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  exchangeSessionId: (sessionId: string) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function parseSessionId(url: string): string | null {
  try {
    // Support both #session_id=... and ?session_id=...
    const hash = url.split("#")[1] || "";
    const hashParams = new URLSearchParams(hash);
    const fromHash = hashParams.get("session_id");
    if (fromHash) return fromHash;

    const u = new URL(url);
    const fromQuery = u.searchParams.get("session_id");
    return fromQuery;
  } catch {
    // URL may be non-standard in some deep link cases
    if (url.includes("session_id=")) {
      const match = url.match(/session_id=([^&]+)/);
      return match?.[1] ?? null;
    }
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isBooting, setIsBooting] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const exchangeSessionId = useCallback(async (sessionId: string) => {
    const res = await apiFetch<{ user: User; session_token: string }>("/auth/exchange", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    });

    setSessionToken(res.session_token);
    setUser(res.user);
    await setStoredSessionToken(res.session_token);

    // Clean up hash on web so refreshing doesn't re-trigger auth
    if (Platform.OS === "web") {
      try {
        window.history.replaceState({}, "", window.location.pathname);
      } catch {
        // ignore
      }
    }
  }, []);

  const restoreSession = useCallback(async () => {
    const token = await getStoredSessionToken();
    if (!token) return;

    try {
      const me = await apiFetch<User>("/auth/me", { method: "GET", token });
      setSessionToken(token);
      setUser(me);
    } catch {
      await setStoredSessionToken(null);
      setSessionToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      // 1) If we were opened by a deep link (cold start), handle session_id first.
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const sid = parseSessionId(initialUrl);
          if (sid) {
            await exchangeSessionId(sid);
            return;
          }
        }
      } catch {
        // ignore
      }

      // 2) Otherwise, try restoring existing session.
      await restoreSession();

      if (isMounted) setIsBooting(false);
    })();

    // Hot links (app already open)
    const sub = Linking.addEventListener("url", async ({ url }) => {
      const sid = parseSessionId(url);
      if (sid) {
        try {
          await exchangeSessionId(sid);
        } finally {
          setIsBooting(false);
        }
      }
    });

    return () => {
      isMounted = false;
      sub.remove();
    };
  }, [exchangeSessionId, restoreSession]);

  const loginWithGoogle = useCallback(async () => {
    const redirectUrl =
      Platform.OS === "web" ? `${process.env.EXPO_PUBLIC_BACKEND_URL}/` : Linking.createURL("/");

    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

    if (result.type !== "success" || !result.url) {
      return;
    }

    const sid = parseSessionId(result.url);
    if (!sid) {
      throw new Error("No session_id returned from login.");
    }

    await exchangeSessionId(sid);
    setIsBooting(false);
  }, [exchangeSessionId]);

  const logout = useCallback(async () => {
    const token = sessionToken;
    setSessionToken(null);
    setUser(null);
    await setStoredSessionToken(null);

    if (token) {
      try {
        await apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST", token });
      } catch {
        // ignore
      }
    }
  }, [sessionToken]);

  const value = useMemo<AuthState>(
    () => ({
      isBooting,
      sessionToken,
      user,
      loginWithGoogle,
      logout,
      exchangeSessionId,
    }),
    [exchangeSessionId, isBooting, loginWithGoogle, logout, sessionToken, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
