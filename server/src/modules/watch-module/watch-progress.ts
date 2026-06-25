const WATCH_PROGRESS_COMPLETED_RATIO = 0.98;
const WATCH_PROGRESS_COMPLETED_MARGIN_SECONDS = 3;

export interface WatchProgressPayload {
  progress?: number;
  position_seconds?: number;
  duration_seconds?: number;
}

export interface NormalizedWatchProgressPayload {
  progress: number;
  position_seconds: number;
  duration_seconds: number;
}

function clampNonNegative(value?: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value || 0);
}

function clampProgress(value?: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function toWatchedProgress(ratio: number): number {
  const progress = clampProgress(ratio * 100);
  return ratio > 0 && progress <= 0 ? 1 : progress;
}

export function normalizeWatchProgressPayload(
  payload: WatchProgressPayload,
): NormalizedWatchProgressPayload {
  const durationSeconds = clampNonNegative(payload.duration_seconds);
  const fallbackProgress = clampProgress(payload.progress);
  const rawPositionSeconds = clampNonNegative(payload.position_seconds);

  if (durationSeconds <= 0) {
    return {
      progress: fallbackProgress,
      position_seconds: rawPositionSeconds,
      duration_seconds: 0,
    };
  }

  const positionSeconds = Math.min(rawPositionSeconds, durationSeconds);
  const watchedRatio = durationSeconds ? positionSeconds / durationSeconds : 0;
  const remainingSeconds = durationSeconds - positionSeconds;
  const completed =
    watchedRatio >= WATCH_PROGRESS_COMPLETED_RATIO ||
    remainingSeconds <= WATCH_PROGRESS_COMPLETED_MARGIN_SECONDS;

  if (completed) {
    return {
      progress: 100,
      position_seconds: durationSeconds,
      duration_seconds: durationSeconds,
    };
  }

  return {
    progress: toWatchedProgress(watchedRatio),
    position_seconds: positionSeconds,
    duration_seconds: durationSeconds,
  };
}
