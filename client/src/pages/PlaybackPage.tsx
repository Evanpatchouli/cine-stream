import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Chip, IconButton, LinearProgress, Slider, Switch, Typography } from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import ScreenRotationRoundedIcon from "@mui/icons-material/ScreenRotationRounded";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";
import FullscreenExitRoundedIcon from "@mui/icons-material/FullscreenExitRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import VolumeOffRoundedIcon from "@mui/icons-material/VolumeOffRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import { AppShell } from "@/components/AppShell";
import { fetchCineDetail } from "@/api/cine.api";
import { addCollection, recordWatchHistory } from "@/api/watch.api";
import { MEDIA_PLACEHOLDERS } from "@/constants";
import { useCineStore } from "@/stores/cines";
import { resolveMediaUrl } from "@/utils/media";
import { toPlaybackPath } from "@/utils/routes";
import { throttle } from "es-toolkit/function";
import type { Cine } from "@/types";

const AUTO_PLAY_NEXT_STORAGE_KEY = "cine-stream:auto-play-next";
const AUTO_PLAY_NEXT_DELAY_SECONDS = 5;
const LONG_PRESS_TRIGGER_MS = 450;
const LONG_PRESS_PLAYBACK_RATE = 2;

const SLIDER_SX = {
  display: "block",
  height: 3,
  minHeight: 0,
  p: "0 !important",
  m: "0 !important",
  color: "white",

  "&.MuiSlider-root": {
    padding: "0 !important",
    margin: "0 !important",
  },

  "& .MuiSlider-rail": {
    height: 3,
    opacity: 0.35,
  },

  "& .MuiSlider-track": {
    height: 3,
    border: "none",
  },

  "& .MuiSlider-thumb": {
    width: 10,
    height: 10,
    boxShadow: "none",

    "&:before": {
      boxShadow: "none",
    },

    "&:hover, &.Mui-focusVisible": {
      boxShadow: "none",
    },
  },
};

const VOLUME_SLIDER_SX = {
  ...SLIDER_SX,

  "& .MuiSlider-thumb": {
    width: 9,
    height: 9,
    boxShadow: "none",

    "&:before": {
      boxShadow: "none",
    },

    "&:hover, &.Mui-focusVisible": {
      boxShadow: "none",
    },
  },
};

function readAutoPlayNextPreference() {
  try {
    return window.localStorage.getItem(AUTO_PLAY_NEXT_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function PlaybackPage() {
  const { id, episodeId } = useParams();
  const navigate = useNavigate();

  const storeCine = useCineStore((state) => state.byId(id));
  const loaded = useCineStore((state) => state.loaded);

  const [detail, setDetail] = useState<Cine | null>(null);
  const [autoPlayNext, setAutoPlayNext] = useState(readAutoPlayNextPreference);
  const [nextCountdown, setNextCountdown] = useState<number | null>(null);

  const [playerControlsVisible, setPlayerControlsVisible] = useState(false);
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  const playerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsHideTimerRef = useRef<number | null>(null);

  const longPressTimerRef = useRef<number | null>(null);
  const longPressActiveRef = useRef(false);
  const longPressTriggeredRef = useRef(false);
  const longPressRestoreRateRef = useRef(1);
  const cine = storeCine || detail;
  const episodes = useMemo(() => cine?.episodes || [], [cine?.episodes]);

  const activeEpisode = episodes.find((episode) => episode.id === episodeId) || episodes[0];

  const activeEpisodeId = activeEpisode?.id || "";

  const activeEpisodeIndex = useMemo(
    () => (activeEpisodeId ? episodes.findIndex((episode) => episode.id === activeEpisodeId) : -1),
    [activeEpisodeId, episodes],
  );

  const nextEpisode = activeEpisodeIndex >= 0 ? episodes[activeEpisodeIndex + 1] : undefined;

  const nextEpisodeId = nextEpisode?.id || "";

  const videoUrl = resolveMediaUrl(activeEpisode?.file_url);

  const posterUrl = resolveMediaUrl(cine?.backdrop) || resolveMediaUrl(cine?.poster) || MEDIA_PLACEHOLDERS.backdrop;

  useEffect(() => {
    if (!id || storeCine) {
      return;
    }

    fetchCineDetail(id)
      .then((resp) => setDetail(resp.getData()))
      .catch(() => setDetail(null));
  }, [id, storeCine]);

  useEffect(() => {
    try {
      window.localStorage.setItem(AUTO_PLAY_NEXT_STORAGE_KEY, autoPlayNext ? "true" : "false");
    } catch {
      return;
    }
  }, [autoPlayNext]);

  useEffect(() => {
    setNextCountdown(null);
  }, [activeEpisodeId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsPlayerFullscreen(document.fullscreenElement === playerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (controlsHideTimerRef.current !== null) {
        window.clearTimeout(controlsHideTimerRef.current);
      }

      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (nextCountdown === null) {
      return;
    }

    if (!autoPlayNext || !id || !nextEpisodeId) {
      setNextCountdown(null);
      return;
    }

    if (nextCountdown <= 0) {
      setNextCountdown(null);
      navigate(toPlaybackPath(id, nextEpisodeId));
      return;
    }

    const timer = window.setTimeout(() => {
      setNextCountdown((current) => (current === null ? null : current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [autoPlayNext, id, navigate, nextCountdown, nextEpisodeId]);

  useEffect(() => {
    if (!id || !episodes.length) {
      return;
    }

    const hasRouteEpisode = episodeId && episodes.some((episode) => episode.id === episodeId);

    const nextEpisodeId = hasRouteEpisode ? episodeId : episodes[0]?.id;

    if (nextEpisodeId && episodeId !== nextEpisodeId) {
      navigate(toPlaybackPath(id, nextEpisodeId), { replace: true });
    }
  }, [episodeId, episodes, id, navigate]);

  useEffect(() => {
    if (!cine) {
      return;
    }

    recordWatchHistory({
      cine_id: cine.id,
      episode_id: activeEpisode?.id,
      progress: activeEpisode ? 1 : 0,
    }).catch(() => undefined);
  }, [activeEpisode?.id, cine]);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    longPressActiveRef.current = false;
    longPressTriggeredRef.current = false;
  }, [videoUrl]);

  const saveToCollection = () => {
    if (!cine) {
      return;
    }

    addCollection(cine.id).catch(() => undefined);
  };

  const playNextEpisode = () => {
    if (!id || !nextEpisodeId) {
      return;
    }

    setNextCountdown(null);
    navigate(toPlaybackPath(id, nextEpisodeId));
  };

  const handleVideoEnded = () => {
    if (!autoPlayNext || !nextEpisodeId) {
      return;
    }

    setNextCountdown(AUTO_PLAY_NEXT_DELAY_SECONDS);
  };

  const showPlayerControls = () => {
    setPlayerControlsVisible(true);

    if (controlsHideTimerRef.current !== null) {
      window.clearTimeout(controlsHideTimerRef.current);
    }

    controlsHideTimerRef.current = window.setTimeout(() => {
      setPlayerControlsVisible(false);
      controlsHideTimerRef.current = null;
    }, 3000);
  };

  const hidePlayerControls = () => {
    if (controlsHideTimerRef.current !== null) {
      window.clearTimeout(controlsHideTimerRef.current);
      controlsHideTimerRef.current = null;
    }

    setPlayerControlsVisible(false);
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startTemporaryDoubleSpeed = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    longPressTimerRef.current = null;
    longPressActiveRef.current = true;
    longPressTriggeredRef.current = true;
    longPressRestoreRateRef.current = video.playbackRate || playbackRate || 1;

    video.playbackRate = LONG_PRESS_PLAYBACK_RATE;
    setPlaybackRate(LONG_PRESS_PLAYBACK_RATE);
  };

  const restoreTemporaryPlaybackRate = () => {
    clearLongPressTimer();

    if (!longPressActiveRef.current) {
      return;
    }

    const video = videoRef.current;
    const restoreRate = longPressRestoreRateRef.current || 1;

    if (video) {
      video.playbackRate = restoreRate;
    }

    setPlaybackRate(restoreRate);
    longPressActiveRef.current = false;
  };

  const toggleTheaterFullscreen = async () => {
    const element = playerRef.current || document.documentElement;

    if (document.fullscreenElement) {
      await document.exitFullscreen?.().catch(() => undefined);

      const orientation = screen.orientation as
        | (ScreenOrientation & {
            unlock?: () => void;
          })
        | undefined;

      orientation?.unlock?.();
      return;
    }

    if (!document.fullscreenElement && element.requestFullscreen) {
      await element.requestFullscreen().catch(() => undefined);
    }

    const orientation = screen.orientation as
      | (ScreenOrientation & {
          lock?: (orientation: string) => Promise<void>;
        })
      | undefined;

    await orientation?.lock?.("landscape").catch(() => undefined);
  };

  const togglePlay = async () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      await video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  };

  const seekTo = (value: number | number[]) => {
    const video = videoRef.current;
    const nextTime = Array.isArray(value) ? value[0] : value;

    if (!video || !Number.isFinite(nextTime)) {
      return;
    }

    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const changeVolume = (value: number | number[]) => {
    const video = videoRef.current;
    const nextVolume = Array.isArray(value) ? value[0] : value;

    if (!video || !Number.isFinite(nextVolume)) {
      return;
    }

    video.volume = nextVolume;
    video.muted = nextVolume <= 0;

    setVolume(nextVolume);
    setMuted(video.muted);
  };

  const toggleMuted = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const nextMuted = !video.muted;

    video.muted = nextMuted;

    if (!nextMuted && video.volume <= 0) {
      video.volume = 0.6;
      setVolume(0.6);
    }

    setMuted(nextMuted);
  };

  const togglePlaybackRate = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const rates = [0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];

    video.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const handleVideoSurfacePointerDown = (event: React.PointerEvent<HTMLVideoElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    clearLongPressTimer();

    longPressActiveRef.current = false;
    longPressTriggeredRef.current = false;
    longPressRestoreRateRef.current = videoRef.current?.playbackRate || playbackRate || 1;

    longPressTimerRef.current = window.setTimeout(() => {
      startTemporaryDoubleSpeed();
    }, LONG_PRESS_TRIGGER_MS);
  };

  const handleVideoSurfacePointerRelease = () => {
    restoreTemporaryPlaybackRate();
  };

  const handleVideoSurfaceClick = (event: React.MouseEvent<HTMLVideoElement>) => {
    event.preventDefault();

    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }

    if (playerControlsVisible) {
      hidePlayerControls();
    } else {
      showPlayerControls();
    }
  };

  if (!cine) {
    return (
      <AppShell flush>
        <div className="px-container-padding py-section-gap">
          <Typography variant="h2">{!loaded ? "正在加载..." : "影视不存在"}</Typography>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell flush>
      <div
        ref={playerRef}
        className="cine-player relative aspect-video w-full overflow-hidden bg-black"
        onFocusCapture={showPlayerControls}
        onMouseEnter={showPlayerControls}
        onMouseMove={showPlayerControls}
        onMouseLeave={hidePlayerControls}
        onContextMenu={(event) => event.preventDefault()}
      >
        {videoUrl ? (
          <video
            ref={videoRef}
            key={videoUrl}
            className="h-full w-full object-cover"
            src={videoUrl}
            poster={posterUrl}
            autoPlay
            muted={muted}
            playsInline
            preload="auto"
            onClick={handleVideoSurfaceClick}
            onPointerDown={handleVideoSurfacePointerDown}
            onPointerUp={handleVideoSurfacePointerRelease}
            onPointerCancel={handleVideoSurfacePointerRelease}
            onPointerLeave={handleVideoSurfacePointerRelease}
            onContextMenu={(event) => event.preventDefault()}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={(event) => {
              const video = event.currentTarget;

              setDuration(video.duration || 0);
              setCurrentTime(video.currentTime || 0);
              setVolume(video.volume);
              setMuted(video.muted);
              setPlaybackRate(video.playbackRate);
            }}
            onTimeUpdate={(event) => {
              setCurrentTime(event.currentTarget.currentTime || 0);
            }}
            onVolumeChange={(event) => {
              setVolume(event.currentTarget.volume);
              setMuted(event.currentTarget.muted);
            }}
            onRateChange={(event) => {
              setPlaybackRate(event.currentTarget.playbackRate);
            }}
            onEnded={() => {
              setIsPlaying(false);
              handleVideoEnded();
            }}
          />
        ) : (
          <>
            <img src={posterUrl} alt={cine.name} className="absolute inset-0 h-full w-full object-cover opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md">
                <PlayArrowRoundedIcon sx={{ fontSize: 36 }} />
              </div>
            </div>
          </>
        )}

        {videoUrl ? (
          <div
            className={`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-2.5 pb-2 pt-3 text-white transition-opacity duration-150 ${
              playerControlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onPointerCancel={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
          >
            <div className="flex h-[48px] flex-col justify-end">
              <div className="flex h-3 items-center">
                <Slider
                  size="small"
                  min={0}
                  max={duration || 1}
                  value={duration ? Math.min(currentTime, duration) : 0}
                  onChange={(_, value) => seekTo(value)}
                  sx={SLIDER_SX}
                  aria-label="播放进度"
                />
              </div>

              <div className="mt-1 flex h-8 items-center gap-1.5">
                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "暂停" : "播放"}
                >
                  {isPlaying ? (
                    <PauseRoundedIcon sx={{ fontSize: 23 }} />
                  ) : (
                    <PlayArrowRoundedIcon sx={{ fontSize: 25 }} />
                  )}
                </button>

                <div className="shrink-0 text-xs font-semibold leading-none text-white">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>

                <div className="ml-auto flex h-8 items-center gap-1.5">
                  <button
                    type="button"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                    onClick={toggleMuted}
                    aria-label={muted || volume <= 0 ? "取消静音" : "静音"}
                  >
                    {muted || volume <= 0 ? (
                      <VolumeOffRoundedIcon sx={{ fontSize: 21 }} />
                    ) : (
                      <VolumeUpRoundedIcon sx={{ fontSize: 21 }} />
                    )}
                  </button>

                  <div className="hidden h-3 w-16 items-center sm:flex ml-0.5 mr-1.5">
                    <Slider
                      size="small"
                      min={0}
                      max={1}
                      step={0.01}
                      value={muted ? 0 : volume}
                      onChange={(_, value) => changeVolume(value)}
                      sx={VOLUME_SLIDER_SX}
                      aria-label="音量"
                    />
                  </div>

                  <button
                    type="button"
                    className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-white/10 px-2 text-xs font-semibold leading-none text-white backdrop-blur transition hover:bg-white/20"
                    onClick={togglePlaybackRate}
                    aria-label="播放速度"
                  >
                    <SpeedRoundedIcon sx={{ fontSize: 17 }} />
                    {playbackRate}x
                  </button>

                  <button
                    type="button"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                    onClick={toggleTheaterFullscreen}
                    aria-label={isPlayerFullscreen ? "退出全屏" : "全屏播放"}
                  >
                    {isPlayerFullscreen ? (
                      <FullscreenExitRoundedIcon sx={{ fontSize: 23 }} />
                    ) : (
                      <FullscreenRoundedIcon sx={{ fontSize: 23 }} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {nextCountdown !== null && nextEpisode ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 px-container-padding text-white backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-lg border border-white/15 bg-black/70 p-4 shadow-md3">
              <div className="text-sm font-medium text-white/70">即将播放下一集</div>
              <div className="mt-2 line-clamp-2 text-lg font-semibold">{nextEpisode.name}</div>
              <div className="mt-2 text-sm text-white/75">{nextCountdown} 秒后自动播放</div>
              <div className="mt-4 flex gap-2">
                <button
                  className="flex-1 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black"
                  onClick={playNextEpisode}
                >
                  立即播放
                </button>
                <button
                  className="flex-1 rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold text-white"
                  onClick={() => setNextCountdown(null)}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        ) : null}
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

          <IconButton onClick={saveToCollection}>
            <BookmarkAddOutlinedIcon />
          </IconButton>
        </div>

        <p className="mb-6 line-clamp-3 text-base leading-6 text-on-surface-variant">
          {cine.description ||
            "在一座庞大的都市中，记忆可以被提取和出售。一名前侦探发现了一场阴谋，足以抹去整座城市的集体历史。"}
        </p>

        <button
          className="mb-section-gap flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 py-3 font-semibold text-primary"
          onClick={toggleTheaterFullscreen}
        >
          <ScreenRotationRoundedIcon />
          切换到影院视图
        </button>

        <div className="mb-section-gap flex items-center justify-between rounded-lg bg-surface-container-low px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-on-surface">自动连播</div>
            <div className="mt-0.5 text-xs text-on-surface-variant">
              {nextEpisode ? "本集结束后 5 秒播放下一集" : "当前已是最后一集"}
            </div>
          </div>

          <Switch
            checked={autoPlayNext}
            onChange={(event) => {
              setAutoPlayNext(event.target.checked);

              if (!event.target.checked) {
                setNextCountdown(null);
              }
            }}
            inputProps={{ "aria-label": "自动连播" }}
          />
        </div>

        <section className="mb-section-gap">
          <div className="mb-4 flex items-center justify-between">
            <Typography variant="h3">剧集</Typography>
            <button className="flex items-center font-semibold text-primary">
              第 1 季 <ExpandMoreRoundedIcon sx={{ fontSize: 18 }} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {episodes.map((episode, index) => {
              const episodeId = episode.id || `episode-${index}`;
              const active = episodeId === activeEpisodeId;

              return (
                <button
                  key={episode.id || index}
                  className={`overflow-hidden rounded-lg bg-surface-container text-left shadow-md3 ${
                    active ? "border-2 border-primary" : "border border-transparent"
                  }`}
                  onClick={() => {
                    if (id) {
                      setNextCountdown(null);
                      navigate(toPlaybackPath(id, episodeId));
                    }
                  }}
                >
                  <div className="relative aspect-video">
                    <img
                      src={resolveMediaUrl(episode.thumbnail) || MEDIA_PLACEHOLDERS.thumbnail}
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

          {!episodes.length ? (
            <div className="rounded-lg bg-surface-container-low p-5 text-sm text-on-surface-variant">暂无剧集</div>
          ) : null}
        </section>

        <section>
          <Typography sx={{ mb: 1.5, fontWeight: 600 }}>演员阵容</Typography>

          <div className="-mx-container-padding flex gap-2 overflow-x-auto px-container-padding pb-2 hide-scrollbar">
            {cine.cast?.length ? (
              cine.cast.map((name) => (
                <Chip key={name} label={name} variant="outlined" sx={{ flexShrink: 0, borderColor: "#c6c5d4" }} />
              ))
            ) : (
              <span className="text-sm text-on-surface-variant">暂无演员信息</span>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
