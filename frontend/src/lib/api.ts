import * as SecureStore from "expo-secure-store";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

export type ApiError = {
  status: number;
  message: string;
};

export async function getStoredSessionToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync("session_token");
  } catch {
    return null;
  }
}

export async function setStoredSessionToken(token: string | null): Promise<void> {
  try {
    if (!token) {
      await SecureStore.deleteItemAsync("session_token");
      return;
    }
    await SecureStore.setItemAsync("session_token", token);
  } catch {
    // ignore
  }
}

export async function apiFetch<T>(
  path: string,
  opts: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const token = opts.token;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers ? (opts.headers as Record<string, string>) : {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (opts.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...opts,
    headers,
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const message =
      (data as any)?.detail ||
      (data as any)?.message ||
      `Request failed (${res.status})`;
    const err: ApiError = { status: res.status, message };
    throw err;
  }

  return data as T;
}
