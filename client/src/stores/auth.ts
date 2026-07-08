import { create } from "zustand";
import { persist } from "zustand/middleware";
import { loginByPhonePassword } from "@/api/user.api";
import type { LoginUser } from "@/types";

interface AuthState {
  token: string;
  user: LoginUser | null;
  loading: boolean;
  error: string;
  rememberPhone: boolean;
  rememberedPhone: string;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  setRememberPhone: (rememberPhone: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: "",
      user: null,
      loading: false,
      error: "",
      rememberPhone: false,
      rememberedPhone: "",
      login: async (phone, password) => {
        set({ loading: true, error: "" });
        try {
          const normalizedPhone = phone.trim();
          const resp = await loginByPhonePassword(normalizedPhone, password);
          const user = resp.getData();
          if (!resp.isSuccess() || !user) {
            throw new Error(resp.getMessage() || "登录失败");
          }
          set({
            token: user.token,
            user,
            loading: false,
            error: "",
            rememberedPhone: get().rememberPhone ? normalizedPhone : "",
          });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : (error as { message?: string })?.message || "登录失败";
          set({
            loading: false,
            error: message,
          });
          throw error;
        }
      },
      logout: () => set({ token: "", user: null, error: "" }),
      setRememberPhone: (rememberPhone) =>
        set({
          rememberPhone,
          rememberedPhone: rememberPhone ? get().rememberedPhone : "",
        }),
    }),
    {
      name: "cine-stream-auth",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        rememberPhone: state.rememberPhone,
        rememberedPhone: state.rememberedPhone,
      }),
    },
  ),
);
