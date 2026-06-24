import { create } from "zustand";
import { fetchCines } from "@/api/cine.api";
import type { Cine } from "@/types";

interface CineState {
  cines: Cine[];
  loaded: boolean;
  loading: boolean;
  error: string;
  load: () => Promise<void>;
  byId: (id?: string) => Cine | null;
}

export const useCineStore = create<CineState>()((set, get) => ({
  cines: [],
  loaded: false,
  loading: false,
  error: "",
  load: async () => {
    set({ loading: true, error: "" });
    try {
      const resp = await fetchCines();
      set({
        cines: resp.getData() || [],
        loaded: true,
        loading: false,
        error: "",
      });
    } catch (error) {
      set({
        cines: [],
        loaded: true,
        loading: false,
        error:
          (error as { message?: string })?.message || "影视列表加载失败",
      });
    }
  },
  byId: (id) => {
    return get().cines.find((cine) => cine.id === id) || null;
  },
}));
