import { create } from "zustand";
import { fetchCines } from "@/api/http";
import { images, mockCines, mockEpisodes } from "@/data/mock";
import type { Cine } from "@/types";

interface CineState {
  cines: Cine[];
  loaded: boolean;
  load: (token: string) => Promise<void>;
  byId: (id?: string) => Cine;
}

function normalizeServerCines(list: Cine[]): Cine[] {
  if (!list.length) {
    return mockCines;
  }
  return list.map((item, index) => ({
    ...mockCines[index % mockCines.length],
    ...item,
    id: item.id,
    poster: item.poster || mockCines[index % mockCines.length].poster,
    backdrop: item.backdrop || images.player,
    episodes: item.episodes?.length
      ? item.episodes.map((episode, episodeIndex) => ({
          ...mockEpisodes[episodeIndex % mockEpisodes.length],
          ...episode,
          thumbnail:
            episode.thumbnail ||
            mockEpisodes[episodeIndex % mockEpisodes.length].thumbnail,
        }))
      : mockEpisodes,
  }));
}

export const useCineStore = create<CineState>()((set, get) => ({
  cines: mockCines,
  loaded: false,
  load: async (token) => {
    if (!token) {
      return;
    }
    try {
      const data = await fetchCines(token);
      set({ cines: normalizeServerCines(data), loaded: true });
    } catch {
      set({ cines: mockCines, loaded: true });
    }
  },
  byId: (id) => {
    return (
      get().cines.find((cine) => cine.id === id) ||
      get().cines[0] ||
      mockCines[0]
    );
  },
}));
