import { create } from "zustand";
import { persist } from "zustand/middleware";
import { loginByPhonePassword } from "@/api/http";
import type { LoginUser } from "@/types";

interface AuthState {
  token: string;
  user: LoginUser | null;
  loading: boolean;
  error: string;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: "",
      user: null,
      loading: false,
      error: "",
      login: async (phone, password) => {
        set({ loading: true, error: "" });
        try {
          const user = await loginByPhonePassword(phone, password);
          set({
            token: user.token,
            user,
            loading: false,
            error: "",
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : "登录失败",
          });
          throw error;
        }
      },
      logout: () => set({ token: "", user: null, error: "" }),
    }),
    {
      name: "cine-stream-auth",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    },
  ),
);
