import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { useNavigate, useParams } from "react-router-dom";
import { Chip, CircularProgress, LinearProgress, Slider, Snackbar, Switch, Typography } from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined";
import BookmarkAddedRoundedIcon from "@mui/icons-material/BookmarkAddedRounded";
import ScreenRotationRoundedIcon from "@mui/icons-material/ScreenRotationRounded";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";
import FullscreenExitRoundedIcon from "@mui/icons-material/FullscreenExitRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import VolumeOffRoundedIcon from "@mui/icons-material/VolumeOffRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import { AppShell } from "@/components/AppShell";
import { fetchCineDetail } from "@/api/cine.api";
import { fetchCineWatchHistory, recordWatchHistory } from "@/api/watch.api";
import { MEDIA_PLACEHOLDERS } from "@/constants";
import { useCineStore } from "@/stores/cines";
import { useCollectionStore } from "@/stores/collections";
import { resolveMediaUrl } from "@/utils/media";
import { toPlaybackPath } from "@/utils/routes";
import {
  formatProgressText,
  resolveHistoryProgress,
  resolveProgressFromPlayback,
  resolveResumePosition,
} from "@/utils/watchProgress";
import type { Cine, WatchHistoryItem } from "@/types";

const AUTO_PLAY_NEXT_STORAGE_KEY = "cine-stream:auto-play-next";
const AUTO_PLAY_NEXT_DELAY_SECONDS = 5;
const LONG_PRESS_TRIGGER_MS = 450;
const LONG_PRESS_PLAYBACK_RATE = 2;
const WATCH_PROGRESS_SYNC_INTERVAL_MS = 10000;
const WATCH_PROGRESS_SYNC_MIN_SECONDS = 5;

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

function normalizeDurationSeconds(seconds?: number | null) {
  if (!Number.isFinite(seconds) || (seconds || 0) <= 0) {
    return 0;
  }

  return Math.max(0, seconds || 0);
}

function upsertWatchHistoryItem(
  items: WatchHistoryItem[],
  nextItem: WatchHistoryItem,
) {
  return [nextItem, ...items.filter((item) => item.id !== nextItem.id)].sort(
    (left, right) => right.last_watched_at - left.last_watched_at,
  );
}

function shouldShowVideoBuffering(video: HTMLVideoElement) {
  if (video.ended) {
    return false;
  }

  if (video.seeking) {
    return true;
  }

  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return true;
  }

  return !video.paused && video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA;
}

function canSeekToPlaybackPosition(
  video: HTMLVideoElement,
  targetSeconds: number,
) {
  if (
    !Number.isFinite(targetSeconds) ||
    targetSeconds <= 0 ||
    video.readyState < HTMLMediaElement.HAVE_METADATA
  ) {
    return false;
  }

  for (let index = 0; index < video.seekable.length; index += 1) {
    const start = video.seekable.start(index);
    const end = video.seekable.end(index);

    if (targetSeconds >= start - 1 && targetSeconds <= end + 1) {
      return true;
    }
  }

  return false;
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
  const [isVideoBuffering, setIsVideoBuffering] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [seekPreviewTime, setSeekPreviewTime] = useState<number | null>(null);
  const [resumeReadyVersion, setResumeReadyVersion] = useState(0);
  const [collectionSnackbarOpen, setCollectionSnackbarOpen] = useState(false);
  const [episodeHistoryItems, setEpisodeHistoryItems] = useState<
    WatchHistoryItem[]
  >([]);
  const [episodeHistoryLoaded, setEpisodeHistoryLoaded] = useState(false);

  const playerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsHideTimerRef = useRef<number | null>(null);
  const lastSyncedPayloadRef = useRef<{
    episodeId: string;
    progress: number;
    positionSeconds: number;
    durationSeconds: number;
  } | null>(null);
  const lastSyncedAtRef = useRef(0);
  const persistWatchProgressRef = useRef<(force?: boolean) => void>(
    () => undefined,
  );
  const restoredEpisodeIdRef = useRef("");

  const longPressTimerRef = useRef<number | null>(null);
  const longPressActiveRef = useRef(false);
  const longPressTriggeredRef = useRef(false);
  const longPressRestoreRateRef = useRef(1);
  const isScrubbingRef = useRef(false);
  const cine = storeCine || detail;
  const cineId = cine?.id;
  const collectionsLoaded = useCollectionStore((state) => state.loaded);
  const isCollected = useCollectionStore((state) => state.has(cineId));
  const collectionPending = useCollectionStore((state) =>
    cineId ? state.pendingCineIds.includes(cineId) : false,
  );
  const addToCollection = useCollectionStore((state) => state.add);
  const removeFromCollection = useCollectionStore((state) => state.remove);
  const episodes = useMemo(() => cine?.episodes || [], [cine?.episodes]);
  const episodeHistoryMap = useMemo(
    () =>
      new Map(
        episodeHistoryItems
          .filter((item) => item.episode_id)
          .map((item) => [item.episode_id as string, item] as const),
      ),
    [episodeHistoryItems],
  );
  const routeEpisodeExists = useMemo(
    () => Boolean(episodeId && episodes.some((episode) => episode.id === episodeId)),
    [episodeId, episodes],
  );
  const latestHistoryEpisodeId = useMemo(
    () => episodeHistoryItems.find((item) => item.episode_id)?.episode_id || "",
    [episodeHistoryItems],
  );
  const resolvedEpisodeId = useMemo(() => {
    if (routeEpisodeExists) {
      return episodeId || "";
    }

    if (!episodeHistoryLoaded) {
      return "";
    }

    if (
      latestHistoryEpisodeId &&
      episodes.some((episode) => episode.id === latestHistoryEpisodeId)
    ) {
      return latestHistoryEpisodeId;
    }

    return episodes[0]?.id || "";
  }, [
    episodeHistoryLoaded,
    episodeId,
    episodes,
    latestHistoryEpisodeId,
    routeEpisodeExists,
  ]);
  const activeEpisode = useMemo(
    () => episodes.find((episode) => episode.id === resolvedEpisodeId) || null,
    [episodes, resolvedEpisodeId],
  );
  const activeEpisodeId = activeEpisode?.id || "";
  const activeEpisodeHistory = activeEpisodeId
    ? episodeHistoryMap.get(activeEpisodeId) || null
    : null;
  const activeSavedProgress = resolveHistoryProgress(activeEpisodeHistory);
  const staticDurationSeconds = normalizeDurationSeconds(activeEpisode?.duration_seconds);
  const resolvedDuration = duration > 0 ? duration : staticDurationSeconds;
  const activeLiveProgress = resolveProgressFromPlayback(currentTime, resolvedDuration);
  const activeEpisodeProgress =
    resolvedDuration > 0 ? activeLiveProgress : activeSavedProgress;

  const activeEpisodeIndex = useMemo(
    () => (activeEpisodeId ? episodes.findIndex((episode) => episode.id === activeEpisodeId) : -1),
    [activeEpisodeId, episodes],
  );

  const nextEpisode = activeEpisodeIndex >= 0 ? episodes[activeEpisodeIndex + 1] : undefined;

  const nextEpisodeId = nextEpisode?.id || "";

  const streamUrl = resolveMediaUrl(activeEpisode?.stream_url || activeEpisode?.file_url);
  const hlsUrl = resolveMediaUrl(activeEpisode?.hls_url);
  const videoUrl = hlsUrl || streamUrl;
  const playbackSourceKey = [activeEpisodeId, hlsUrl, streamUrl].filter(Boolean).join("|");

  const posterUrl = resolveMediaUrl(cine?.backdrop) || resolveMediaUrl(cine?.poster) || MEDIA_PLACEHOLDERS.backdrop;
  const collectionButtonDisabled = !collectionsLoaded || collectionPending;
  const displayedCurrentTime =
    seekPreviewTime === null ? currentTime : seekPreviewTime;

  const syncVideoBufferingState = (video: HTMLVideoElement | null) => {
    if (!video || isScrubbingRef.current) {
      setIsVideoBuffering(false);
      return;
    }

    setIsVideoBuffering(shouldShowVideoBuffering(video));
  };

  const syncVideoDurationState = (video: HTMLVideoElement | null) => {
    setDuration(normalizeDurationSeconds(video?.duration));
  };

  const markResumeReady = () => {
    setResumeReadyVersion((current) => current + 1);
  };

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
    if (!cineId) {
      setEpisodeHistoryItems([]);
      setEpisodeHistoryLoaded(false);
      return;
    }

    let cancelled = false;
    setEpisodeHistoryLoaded(false);

    fetchCineWatchHistory(cineId)
      .then((resp) => {
        if (cancelled) {
          return;
        }

        setEpisodeHistoryItems(resp.getData() || []);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setEpisodeHistoryItems([]);
      })
      .finally(() => {
        if (!cancelled) {
          setEpisodeHistoryLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cineId]);

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
    const flushWatchProgress = () => persistWatchProgressRef.current(true);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushWatchProgress();
      }
    };

    window.addEventListener("pagehide", flushWatchProgress);
    window.addEventListener("beforeunload", flushWatchProgress);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushWatchProgress);
      window.removeEventListener("beforeunload", flushWatchProgress);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (controlsHideTimerRef.current !== null) {
        window.clearTimeout(controlsHideTimerRef.current);
      }

      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
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
      persistWatchProgressRef.current(true);
      navigate(toPlaybackPath(id, nextEpisodeId));
      return;
    }

    const timer = window.setTimeout(() => {
      setNextCountdown((current) => (current === null ? null : current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [autoPlayNext, id, navigate, nextCountdown, nextEpisodeId]);

  useEffect(() => {
    if (!id || !episodes.length || !resolvedEpisodeId || episodeId === resolvedEpisodeId) {
      return;
    }

    navigate(toPlaybackPath(id, resolvedEpisodeId), { replace: true });
  }, [episodeId, episodes.length, id, navigate, resolvedEpisodeId]);

  useEffect(() => {
    return () => {
      persistWatchProgressRef.current(true);
    };
  }, [activeEpisodeId, cineId]);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsVideoBuffering(Boolean(videoUrl));
    setIsScrubbing(false);
    setSeekPreviewTime(null);
    isScrubbingRef.current = false;
    restoredEpisodeIdRef.current = "";

    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    longPressActiveRef.current = false;
    longPressTriggeredRef.current = false;
  }, [playbackSourceKey, videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    video.pause();
    video.removeAttribute("src");
    video.load();

    const applyDirectSource = (url: string) => {
      video.src = url;
      video.load();
      if (video.autoplay) {
        video.play().catch(() => undefined);
      }
    };

    const fallbackToStream = () => {
      if (streamUrl) {
        applyDirectSource(streamUrl);
        return;
      }

      setIsVideoBuffering(false);
    };

    if (!hlsUrl) {
      fallbackToStream();
      return () => undefined;
    }

    const supportsNativeHls =
      video.canPlayType("application/vnd.apple.mpegurl") !== "";

    if (supportsNativeHls) {
      applyDirectSource(hlsUrl);
      return () => undefined;
    }

    if (!Hls.isSupported()) {
      fallbackToStream();
      return () => undefined;
    }

    const hls = new Hls({
      enableWorker: true,
    });
    hlsRef.current = hls;

    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      hls.loadSource(hlsUrl);
    });

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (video.autoplay) {
        video.play().catch(() => undefined);
      }
    });

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (!data.fatal) {
        return;
      }

      hls.destroy();
      if (hlsRef.current === hls) {
        hlsRef.current = null;
      }
      fallbackToStream();
    });

    hls.attachMedia(video);

    return () => {
      hls.destroy();
      if (hlsRef.current === hls) {
        hlsRef.current = null;
      }
    };
  }, [hlsUrl, streamUrl]);

  useEffect(() => {
    const video = videoRef.current;

    if (
      !video ||
      !activeEpisodeId ||
      !episodeHistoryLoaded ||
      resolvedDuration <= 0 ||
      restoredEpisodeIdRef.current === activeEpisodeId
    ) {
      return;
    }

    const resumeAt = resolveResumePosition(
      activeEpisodeHistory?.position_seconds,
      activeEpisodeHistory?.duration_seconds,
      normalizeDurationSeconds(video.duration) || resolvedDuration,
    );

    if (resumeAt <= 0) {
      restoredEpisodeIdRef.current = activeEpisodeId;
      return;
    }

    if (Math.abs((video.currentTime || 0) - resumeAt) <= 1) {
      restoredEpisodeIdRef.current = activeEpisodeId;
      return;
    }

    const canResumeNow =
      canSeekToPlaybackPosition(video, resumeAt) ||
      (!hlsUrl && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA);

    if (!canResumeNow) {
      return;
    }

    if (Math.abs((video.currentTime || 0) - resumeAt) > 1) {
      video.currentTime = resumeAt;
    }
  }, [
    activeEpisodeHistory?.duration_seconds,
    activeEpisodeHistory?.position_seconds,
    activeEpisodeId,
    currentTime,
    hlsUrl,
    resumeReadyVersion,
    resolvedDuration,
    episodeHistoryLoaded,
  ]);

  const toggleCollection = async () => {
    if (!cineId) {
      return;
    }

    try {
      if (isCollected) {
        await removeFromCollection(cineId);
        return;
      }

      await addToCollection(cineId);
      setCollectionSnackbarOpen(true);
    } catch {
      return;
    }
  };

  const persistWatchProgress = (force = false) => {
    const video = videoRef.current;

    if (!video || !cineId || !activeEpisodeId) {
      return;
    }

    const durationSeconds =
      normalizeDurationSeconds(video.duration) || staticDurationSeconds;
    const positionSeconds = Number.isFinite(video.currentTime)
      ? Math.max(
        0,
        Math.min(video.currentTime || 0, durationSeconds || (video.currentTime || 0)),
      )
      : 0;

    if (durationSeconds <= 0 || positionSeconds <= 0) {
      return;
    }

    const progress = resolveProgressFromPlayback(positionSeconds, durationSeconds);
    const lastPayload = lastSyncedPayloadRef.current;
    const now = Date.now();
    const sameEpisode = lastPayload?.episodeId === activeEpisodeId;
    const sameProgress = lastPayload?.progress === progress;
    const positionDelta = Math.abs(
      (lastPayload?.positionSeconds || 0) - positionSeconds,
    );
    const durationDelta = Math.abs(
      (lastPayload?.durationSeconds || 0) - durationSeconds,
    );
    const shouldSkipForceSync =
      force &&
      sameEpisode &&
      sameProgress &&
      positionDelta < 1 &&
      durationDelta < 1;
    const shouldSkipAutoSync =
      !force &&
      sameEpisode &&
      sameProgress &&
      positionDelta < WATCH_PROGRESS_SYNC_MIN_SECONDS &&
      now - lastSyncedAtRef.current < WATCH_PROGRESS_SYNC_INTERVAL_MS;

    if (shouldSkipForceSync || shouldSkipAutoSync) {
      return;
    }

    lastSyncedPayloadRef.current = {
      episodeId: activeEpisodeId,
      progress,
      positionSeconds,
      durationSeconds,
    };
    lastSyncedAtRef.current = now;

    recordWatchHistory({
      cine_id: cineId,
      episode_id: activeEpisodeId,
      progress,
      position_seconds: positionSeconds,
      duration_seconds: durationSeconds,
    })
      .then((resp) => {
        const item = resp.getData();
        if (!item) {
          return;
        }

        setEpisodeHistoryItems((current) =>
          upsertWatchHistoryItem(current, item),
        );
      })
      .catch(() => undefined);
  };

  persistWatchProgressRef.current = persistWatchProgress;

  const playNextEpisode = () => {
    if (!id || !nextEpisodeId) {
      return;
    }

    persistWatchProgress(true);
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

  const resolveSliderValue = (value: number | number[]) =>
    Array.isArray(value) ? value[0] : value;

  const setScrubbingState = (next: boolean) => {
    isScrubbingRef.current = next;
    setIsScrubbing(next);
  };

  const previewSeek = (value: number | number[]) => {
    const nextTime = resolveSliderValue(value);

    if (!Number.isFinite(nextTime)) {
      return;
    }

    setScrubbingState(true);
    setSeekPreviewTime(nextTime);
    setIsVideoBuffering(false);
    showPlayerControls();
  };

  const commitSeek = (value: number | number[]) => {
    const video = videoRef.current;
    const nextTime = resolveSliderValue(value);

    setScrubbingState(false);
    setSeekPreviewTime(null);

    if (!video || !Number.isFinite(nextTime)) {
      return;
    }

    video.currentTime = nextTime;
    setCurrentTime(nextTime);
    syncVideoBufferingState(video);
    persistWatchProgress(true);
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
            key={playbackSourceKey || activeEpisodeId}
            className="h-full w-full object-cover"
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
            onLoadStart={() => setIsVideoBuffering(true)}
            onPlay={() => setIsPlaying(true)}
            onPlaying={(event) => {
              setIsPlaying(true);
              syncVideoBufferingState(event.currentTarget);
            }}
            onPause={(event) => {
              setIsPlaying(false);
              syncVideoBufferingState(event.currentTarget);
              persistWatchProgress(true);
            }}
            onLoadedMetadata={(event) => {
              const video = event.currentTarget;

              syncVideoDurationState(video);
              setCurrentTime(video.currentTime || 0);
              setVolume(video.volume);
              setMuted(video.muted);
              setPlaybackRate(video.playbackRate);
              markResumeReady();
            }}
            onDurationChange={(event) => {
              syncVideoDurationState(event.currentTarget);
              markResumeReady();
            }}
            onLoadedData={(event) => {
              syncVideoBufferingState(event.currentTarget);
              markResumeReady();
            }}
            onCanPlay={(event) => {
              syncVideoBufferingState(event.currentTarget);
              markResumeReady();
            }}
            onWaiting={() => setIsVideoBuffering(true)}
            onStalled={() => setIsVideoBuffering(true)}
            onSeeking={(event) => {
              if (!isScrubbingRef.current) {
                syncVideoBufferingState(event.currentTarget);
              }
            }}
            onSeeked={(event) => {
              syncVideoBufferingState(event.currentTarget);
              markResumeReady();
            }}
            onTimeUpdate={(event) => {
              setCurrentTime(event.currentTarget.currentTime || 0);
              persistWatchProgress();
            }}
            onVolumeChange={(event) => {
              setVolume(event.currentTarget.volume);
              setMuted(event.currentTarget.muted);
            }}
            onRateChange={(event) => {
              setPlaybackRate(event.currentTarget.playbackRate);
            }}
            onError={() => setIsVideoBuffering(false)}
            onEnded={(event) => {
              setIsPlaying(false);
              syncVideoBufferingState(event.currentTarget);
              persistWatchProgress(true);
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

        {videoUrl && isVideoBuffering && !isScrubbing ? (
          <div className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white shadow-lg shadow-black/20 backdrop-blur-sm">
              <CircularProgress
                size={22}
                thickness={4}
                sx={{ color: "rgba(255, 255, 255, 0.92)" }}
              />
            </div>
          </div>
        ) : null}

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
                  max={resolvedDuration || 1}
                  value={resolvedDuration ? Math.min(displayedCurrentTime, resolvedDuration) : 0}
                  onChange={(_, value) => previewSeek(value)}
                  onChangeCommitted={(_, value) => commitSeek(value)}
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
                  {formatTime(displayedCurrentTime)} / {formatTime(resolvedDuration)}
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

          <button
            type="button"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
              isCollected
                ? "border-primary/20 bg-primary text-white"
                : "border-outline-variant bg-surface text-on-surface"
            } ${collectionButtonDisabled ? "cursor-not-allowed opacity-60" : ""}`}
            onClick={toggleCollection}
            disabled={collectionButtonDisabled}
            aria-label={isCollected ? "取消收藏" : "收藏"}
          >
            {isCollected ? (
              <BookmarkAddedRoundedIcon sx={{ fontSize: 20 }} />
            ) : (
              <BookmarkAddOutlinedIcon sx={{ fontSize: 20 }} />
            )}
          </button>
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
              const savedEpisodeProgress = episodeId
                ? resolveHistoryProgress(episodeHistoryMap.get(episodeId))
                : 0;
              const episodeProgress = active
                ? activeEpisodeProgress || savedEpisodeProgress
                : savedEpisodeProgress;
              const showProgress = episodeProgress > 0;

              return (
                <button
                  key={episode.id || index}
                  className={`overflow-hidden rounded-lg bg-surface-container text-left shadow-md3 ${
                    active ? "border-2 border-primary" : "border border-transparent"
                  }`}
                  onClick={() => {
                    if (id) {
                      persistWatchProgress(true);
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

                    {showProgress ? (
                      <>
                        <LinearProgress
                          variant="determinate"
                          value={episodeProgress}
                          sx={{
                            mt: 1,
                            height: 4,
                            borderRadius: 999,
                            bgcolor: "#e1e3e4",
                            "& .MuiLinearProgress-bar": { bgcolor: "#000666" },
                          }}
                        />
                        <div className="mt-1 text-[11px] text-on-surface-variant">
                          {active
                            ? `正在播放 · ${formatProgressText(episodeProgress)}`
                            : formatProgressText(episodeProgress)}
                        </div>
                      </>
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

      <Snackbar
        open={collectionSnackbarOpen}
        autoHideDuration={3000}
        onClose={(_, reason) => {
          if (reason === "clickaway") {
            return;
          }

          setCollectionSnackbarOpen(false);
        }}
        message="收藏成功"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
          left: "50%",
          right: "auto",
          transform: "translateX(-50%)",
          width: "max-content",
          maxWidth: "calc(100% - 32px)",
        }}
        slotProps={{
          content: {
            sx: {
              minWidth: 0,
              width: "auto",
              flexGrow: 0,
              height: 40,
              borderRadius: 999,
              bgcolor: "rgba(20, 20, 24, 0.92)",
              color: "#fff",
              boxShadow: "0 10px 28px rgba(0, 0, 0, 0.22)",
              backdropFilter: "blur(12px)",
              display: "inline-flex",
              alignItems: "center",
              px: 2.25,
              py: 0,
              "& .MuiSnackbarContent-message": {
                display: "flex",
                alignItems: "center",
                padding: 0,
                fontSize: 15,
                lineHeight: 1,
                fontWeight: 600,
                letterSpacing: "0.01em",
              },
            },
          },
        }}
      />
    </AppShell>
  );
}
