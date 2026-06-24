import { create } from "zustand";
import { persist } from "zustand/middleware";
import { loginByPhonePassword } from "@/api/user.api";
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
          const resp = await loginByPhonePassword(phone, password);
          const user = resp.getData();
          if (!resp.isSuccess() || !user) {
            throw new Error(resp.getMessage() || "登录失败");
          }
          set({
            token: user.token,
            user,
            loading: false,
            error: "",
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
