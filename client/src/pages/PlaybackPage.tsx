import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Chip, IconButton, LinearProgress, Typography } from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import ScreenRotationRoundedIcon from "@mui/icons-material/ScreenRotationRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { AppShell } from "@/components/AppShell";
import { images, mockEpisodes } from "@/data/mock";
import { useCineStore } from "@/stores/cines";

export function PlaybackPage() {
  const { id } = useParams();
  const cine = useCineStore((state) => state.byId(id));
  const episodes = useMemo(
    () => (cine.episodes?.length ? cine.episodes : mockEpisodes),
    [cine.episodes],
  );
  const [activeEpisodeId, setActiveEpisodeId] = useState(
    episodes[0]?.id || "episode-0",
  );
  const activeEpisode =
    episodes.find((episode) => episode.id === activeEpisodeId) || episodes[0];
  const videoUrl = activeEpisode?.file_url;

  const rotateForTheater = async () => {
    const element = document.documentElement;
    if (!document.fullscreenElement && element.requestFullscreen) {
      await element.requestFullscreen().catch(() => undefined);
    }
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
    };
    await orientation.lock?.("landscape").catch(() => undefined);
  };

  return (
    <AppShell flush>
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {videoUrl ? (
          <video
            className="h-full w-full object-cover"
            src={videoUrl}
            poster={cine.backdrop || images.player}
            controls
          />
        ) : (
          <>
            <img
              src={cine.backdrop || images.player}
              alt={cine.name}
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md">
                <PlayArrowRoundedIcon sx={{ fontSize: 36 }} />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="px-container-padding py-section-gap">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <Typography variant="h2">{cine.name}</Typography>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-on-surface-variant">
              <span>{cine.year || "2024"}</span>
              <span className="h-1 w-1 rounded-full bg-outline-variant" />
              <span>{cine.season || "第 1 季"}</span>
              <span className="h-1 w-1 rounded-full bg-outline-variant" />
              <span className="rounded border border-outline-variant px-1.5 py-0.5 text-[10px]">
                {cine.rating || "16+"}
              </span>
            </div>
          </div>
          <IconButton>
            <BookmarkAddOutlinedIcon />
          </IconButton>
        </div>

        <p className="mb-6 line-clamp-3 text-base leading-6 text-on-surface-variant">
          {cine.description ||
            "在一座庞大的都市中，记忆可以被提取和出售。一名前侦探发现了一场阴谋，足以抹去整座城市的集体历史。"}
        </p>

        <button
          className="mb-section-gap flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 py-3 font-semibold text-primary"
          onClick={rotateForTheater}
        >
          <ScreenRotationRoundedIcon />
          切换到影院视图
        </button>

        <section className="mb-section-gap">
          <div className="mb-4 flex items-center justify-between">
            <Typography variant="h3">剧集</Typography>
            <button className="flex items-center font-semibold text-primary">
              第 1 季 <ExpandMoreRoundedIcon sx={{ fontSize: 18 }} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {episodes.map((episode, index) => {
              const active = (episode.id || `episode-${index}`) === activeEpisodeId;
              return (
                <button
                  key={episode.id || index}
                  className={`overflow-hidden rounded-lg bg-surface-container text-left shadow-md3 ${
                    active ? "border-2 border-primary" : "border border-transparent"
                  }`}
                  onClick={() => setActiveEpisodeId(episode.id || `episode-${index}`)}
                >
                  <div className="relative aspect-video">
                    <img
                      src={episode.thumbnail || images.player}
                      alt={episode.name}
                      className="h-full w-full object-cover"
                    />
                    {active ? (
                      <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                        正在播放
                      </span>
                    ) : null}
                    <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] text-white">
                      {episode.duration || "45:00"}
                    </span>
                  </div>
                  <div className="p-2">
                    <div className="truncate text-sm font-semibold">
                      {index + 1}. {episode.name}
                    </div>
                    {active ? (
                      <LinearProgress
                        variant="determinate"
                        value={episode.progress || 33}
                        sx={{
                          mt: 1,
                          height: 4,
                          borderRadius: 999,
                          bgcolor: "#e1e3e4",
                          "& .MuiLinearProgress-bar": { bgcolor: "#000666" },
                        }}
                      />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <Typography sx={{ mb: 1.5, fontWeight: 600 }}>演员阵容</Typography>
          <div className="-mx-container-padding flex gap-2 overflow-x-auto px-container-padding pb-2 hide-scrollbar">
            {["Elias Thorne", "Sarah Lin", "Marcus Vance", "Elena Rostova"].map(
              (name) => (
                <Chip
                  key={name}
                  label={name}
                  variant="outlined"
                  sx={{ flexShrink: 0, borderColor: "#c6c5d4" }}
                />
              ),
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
