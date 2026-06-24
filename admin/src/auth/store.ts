import { StoreNames } from "@/constants";
import type { Nullable } from "@cine-stream/common";
import type { LoginStore } from "@/types/store";
import type UserInfo from "@/types/userinfo";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useLoginStore = create(
  persist<LoginStore>(
    (set) => ({
      isLogin: false,
      setIsLogin: (isLogin: boolean) => set({ isLogin }),
      token: "",
      setToken: (token: string) => set({ token }),
      userInfo: null,
      setUserInfo: (userInfo: Nullable<UserInfo>) => set({ userInfo }),
      logout: () => {
        set({
          isLogin: false,
          token: "",
          userInfo: null,
        });
      },
    }),
    {
      name: StoreNames.LOGIN,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
