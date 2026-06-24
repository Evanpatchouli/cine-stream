export function toPlaybackPath(cineId: string, episodeId?: string | null) {
  const encodedCineId = encodeURIComponent(cineId);
  const encodedEpisodeId = episodeId ? encodeURIComponent(episodeId) : "";
  return encodedEpisodeId
    ? `/play/${encodedCineId}/${encodedEpisodeId}`
    : `/play/${encodedCineId}`;
}
