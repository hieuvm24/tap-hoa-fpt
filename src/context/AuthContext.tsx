"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AuthUser, LoginData, RegisterData } from "@/types/auth";
import { api } from "@/lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<{ success: boolean; error?: string; redirect?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (
    data: Partial<Pick<AuthUser, "name" | "phone" | "avatar">>
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.auth
      .me()
      .then((res) => {
        if (res.success && res.data?.user) setUser(res.data.user);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (data: LoginData) => {
    const res = await api.auth.login(data.email, data.password);
    if (!res.success || !res.data) {
      return { success: false, error: res.error || "Đăng nhập thất bại" };
    }
    setUser(res.data.user);
    return { success: true, redirect: res.data.redirect };
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await api.auth.register(data);
    if (!res.success || !res.data) {
      return { success: false, error: res.error || "Đăng ký thất bại" };
    }
    setUser(res.data.user);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    api.auth.logout();
    setUser(null);
    // Xoa du lieu UX nhay cam tren may dung chung
    try {
      localStorage.removeItem("taphoa_search_history");
      localStorage.removeItem("taphoa_recently_viewed");
    } catch {
      /* ignore */
    }
  }, []);

  const updateProfile = useCallback(
    async (data: Partial<Pick<AuthUser, "name" | "phone" | "avatar">>) => {
      const res = await api.auth.updateProfile(data);
      if (res.success && res.data?.user) setUser(res.data.user);
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, isLoading, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
