import { create } from "zustand";
import {
  addCollection as requestAddCollection,
  fetchCollections,
  removeCollection as requestRemoveCollection,
} from "@/api/watch.api";
import type { WatchCollectionItem } from "@/types";

interface CollectionState {
  items: WatchCollectionItem[];
  loaded: boolean;
  loading: boolean;
  error: string;
  pendingCineIds: string[];
  load: () => Promise<void>;
  clear: () => void;
  has: (cineId?: string) => boolean;
  add: (cineId: string) => Promise<void>;
  remove: (cineId: string) => Promise<void>;
}

function mergePendingCineIds(current: string[], cineId: string, add: boolean) {
  if (add) {
    return current.includes(cineId) ? current : [...current, cineId];
  }

  return current.filter((id) => id !== cineId);
}

function upsertCollectionItem(
  items: WatchCollectionItem[],
  nextItem: WatchCollectionItem,
) {
  return [
    nextItem,
    ...items.filter((item) => item.cine_id !== nextItem.cine_id),
  ];
}

export const useCollectionStore = create<CollectionState>()((set, get) => ({
  items: [],
  loaded: false,
  loading: false,
  error: "",
  pendingCineIds: [],
  load: async () => {
    if (get().loading) {
      return;
    }

    set({ loading: true, error: "" });

    try {
      const resp = await fetchCollections();
      const data = resp.getData();
      set({
        items: data?.list || [],
        loaded: true,
        loading: false,
        error: "",
      });
    } catch (error) {
      set({
        items: [],
        loaded: true,
        loading: false,
        error: (error as { message?: string })?.message || "收藏列表加载失败",
      });
    }
  },
  clear: () =>
    set({
      items: [],
      loaded: false,
      loading: false,
      error: "",
      pendingCineIds: [],
    }),
  has: (cineId) => {
    if (!cineId) {
      return false;
    }

    return get().items.some((item) => item.cine_id === cineId);
  },
  add: async (cineId) => {
    set((state) => ({
      pendingCineIds: mergePendingCineIds(state.pendingCineIds, cineId, true),
      error: "",
    }));

    try {
      const resp = await requestAddCollection(cineId);
      const item = resp.getData();

      set((state) => ({
        items: item ? upsertCollectionItem(state.items, item) : state.items,
        loaded: true,
        error: "",
        pendingCineIds: mergePendingCineIds(
          state.pendingCineIds,
          cineId,
          false,
        ),
      }));
    } catch (error) {
      set((state) => ({
        error: (error as { message?: string })?.message || "收藏失败",
        pendingCineIds: mergePendingCineIds(
          state.pendingCineIds,
          cineId,
          false,
        ),
      }));
      throw error;
    }
  },
  remove: async (cineId) => {
    set((state) => ({
      pendingCineIds: mergePendingCineIds(state.pendingCineIds, cineId, true),
      error: "",
    }));

    try {
      await requestRemoveCollection(cineId);
      set((state) => ({
        items: state.items.filter((item) => item.cine_id !== cineId),
        loaded: true,
        error: "",
        pendingCineIds: mergePendingCineIds(
          state.pendingCineIds,
          cineId,
          false,
        ),
      }));
    } catch (error) {
      set((state) => ({
        error: (error as { message?: string })?.message || "取消收藏失败",
        pendingCineIds: mergePendingCineIds(
          state.pendingCineIds,
          cineId,
          false,
        ),
      }));
      throw error;
    }
  },
}));
