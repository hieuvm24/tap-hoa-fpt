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

export type RegisterResult =
  | { success: true; needsVerification?: false }
  | {
      success: true;
      needsVerification: true;
      email: string;
      emailed?: boolean;
      message?: string;
      demoCode?: string;
    }
  | { success: false; error?: string; needsVerification?: boolean; email?: string };

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    data: LoginData
  ) => Promise<{
    success: boolean;
    error?: string;
    redirect?: string;
    needsVerification?: boolean;
    email?: string;
  }>;
  register: (data: RegisterData) => Promise<RegisterResult>;
  verifyEmail: (
    email: string,
    code: string
  ) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email: string) => Promise<{
    success: boolean;
    error?: string;
    demoCode?: string;
    emailed?: boolean;
    message?: string;
  }>;
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
      const needsVerification =
        (res.error || "").toLowerCase().includes("chưa xác nhận") ||
        (res.error || "").toLowerCase().includes("xac nhan");
      return {
        success: false,
        error: res.error || "Đăng nhập thất bại",
        needsVerification,
        email: needsVerification ? data.email : undefined,
      };
    }
    setUser(res.data.user);
    return { success: true, redirect: res.data.redirect };
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<RegisterResult> => {
    const res = await api.auth.register(data);
    if (!res.success || !res.data) {
      return { success: false, error: res.error || "Đăng ký thất bại" };
    }
    if (res.data.needsVerification && res.data.email) {
      return {
        success: true,
        needsVerification: true,
        email: res.data.email,
        emailed: res.data.emailed,
        message: res.data.message,
        demoCode: res.data.demoCode,
      };
    }
    if (res.data.user) {
      setUser(res.data.user);
      return { success: true };
    }
    return { success: false, error: "Đăng ký thất bại" };
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    const res = await api.auth.verifyEmail(email, code);
    if (!res.success || !res.data?.user) {
      return { success: false, error: res.error || "Xác nhận thất bại" };
    }
    setUser(res.data.user);
    return { success: true };
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    const res = await api.auth.resendVerification(email);
    if (!res.success || !res.data) {
      return { success: false, error: res.error || "Không gửi lại được mã" };
    }
    return {
      success: true,
      demoCode: res.data.demoCode,
      emailed: res.data.emailed,
      message: res.data.message,
    };
  }, []);

  const logout = useCallback(() => {
    api.auth.logout();
    setUser(null);
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
      verifyEmail,
      resendVerification,
      logout,
      updateProfile,
    }),
    [
      user,
      isLoading,
      login,
      register,
      verifyEmail,
      resendVerification,
      logout,
      updateProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
