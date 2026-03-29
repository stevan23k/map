import { create } from "zustand";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface User {
  username: string;
  sub?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

export interface LoginPayload {
  identifier: string; // username or email
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateUser: (data: UpdateUserPayload) => Promise<void>;
  fetchUser: () => Promise<void>;
}

// Helpers outside the store
export const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
};

const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
};

const deleteCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true, // starts loading until verify token

  fetchUser: async () => {
    const token = getCookie("access_token");
    if (!token) {
      set({ isLoading: false, user: null });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const userData = await res.json();
        set({ user: userData, isLoading: false });
      } else {
        deleteCookie("access_token");
        set({ user: null, isLoading: false });
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      set({ user: null, isLoading: false });
    }
  },

  login: async (data: LoginPayload) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to login");
    }

    const resData = await res.json();
    if (resData.access_token) setCookie("access_token", resData.access_token);
    if (resData.user) set({ user: resData.user });
  },

  register: async (data: RegisterPayload) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to register");
    }

    const resData = await res.json();
    if (resData.access_token) setCookie("access_token", resData.access_token);
    if (resData.user) set({ user: resData.user });
  },

  logout: () => {
    deleteCookie("access_token");
    set({ user: null });
  },

  updateUser: async (data: UpdateUserPayload) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${API_URL}/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update user");
    }

    const updatedUser = await res.json();
    set({ user: updatedUser });
  },
}));
