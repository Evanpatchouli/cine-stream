import type { WatchHistoryItem } from "@/types";

const COMPLETED_RATIO = 0.98;
const COMPLETED_MARGIN_SECONDS = 3;

export function clampProgress(value?: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function toWatchedProgress(ratio: number) {
  const progress = clampProgress(ratio * 100);
  return ratio > 0 && progress <= 0 ? 1 : progress;
}

export function resolveHistoryProgress(item?: Pick<WatchHistoryItem, "progress" | "position_seconds" | "duration_seconds"> | null) {
  if (!item) {
    return 0;
  }

  if (item.duration_seconds > 0) {
    const positionSeconds = Math.max(0, Math.min(item.position_seconds || 0, item.duration_seconds));
    const watchedRatio = positionSeconds / item.duration_seconds;
    const remainingSeconds = item.duration_seconds - positionSeconds;

    if (watchedRatio >= COMPLETED_RATIO || remainingSeconds <= COMPLETED_MARGIN_SECONDS) {
      return 100;
    }

    return toWatchedProgress(watchedRatio);
  }

  return clampProgress(item.progress);
}

export function resolveProgressFromPlayback(positionSeconds?: number, durationSeconds?: number) {
  if (!Number.isFinite(positionSeconds) || !Number.isFinite(durationSeconds) || !durationSeconds || durationSeconds <= 0) {
    return 0;
  }

  const safePosition = Math.max(0, Math.min(positionSeconds || 0, durationSeconds));
  const watchedRatio = safePosition / durationSeconds;
  const remainingSeconds = durationSeconds - safePosition;

  if (watchedRatio >= COMPLETED_RATIO || remainingSeconds <= COMPLETED_MARGIN_SECONDS) {
    return 100;
  }

  return toWatchedProgress(watchedRatio);
}

export function resolveResumePosition(
  positionSeconds?: number,
  durationSeconds?: number,
  runtimeSeconds?: number,
) {
  if (!Number.isFinite(positionSeconds) || positionSeconds === undefined || positionSeconds <= 0) {
    return 0;
  }

  const safeDuration = Number.isFinite(runtimeSeconds) && runtimeSeconds && runtimeSeconds > 0
    ? runtimeSeconds
    : durationSeconds || 0;

  if (safeDuration <= 0) {
    return positionSeconds;
  }

  const safePosition = Math.max(0, Math.min(positionSeconds, safeDuration));
  const watchedRatio = safePosition / safeDuration;
  const remainingSeconds = safeDuration - safePosition;

  if (watchedRatio >= COMPLETED_RATIO || remainingSeconds <= COMPLETED_MARGIN_SECONDS) {
    return 0;
  }

  return safePosition;
}

export function formatProgressText(progress: number) {
  const safeProgress = clampProgress(progress);
  return safeProgress >= 100 ? "已看完" : `已看至 ${safeProgress}%`;
}
