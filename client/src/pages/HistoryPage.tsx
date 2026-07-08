import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { AppShell } from "@/components/AppShell";
import { fetchWatchHistory, removeWatchHistory } from "@/api/watch.api";
import { MEDIA_PLACEHOLDERS } from "@/constants";
import { resolveMediaUrl } from "@/utils/media";
import { toPlaybackPath } from "@/utils/routes";
import {
  formatProgressText,
  resolveHistoryProgress,
} from "@/utils/watchProgress";
import type { WatchHistoryItem } from "@/types";

const HISTORY_PAGE_SIZE = 20;

function formatWatchedAt(timestamp: number) {
  if (!timestamp) {
    return "";
  }
  return new Date(timestamp).toLocaleDateString();
}

export function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<WatchHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [activeHistory, setActiveHistory] = useState<WatchHistoryItem | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState("");
  const navigate = useNavigate();
  const hasMore = historyItems.length < total;

  const loadHistory = useCallback(async (nextPage: number, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const resp = await fetchWatchHistory({
        page: nextPage,
        size: HISTORY_PAGE_SIZE,
      });
      const data = resp.getData();
      setHistoryItems((current) =>
        append ? [...current, ...(data?.list || [])] : data?.list || [],
      );
      setPage(data?.page || nextPage);
      setTotal(data?.total || 0);
    } catch (requestError) {
      if (!append) {
        setHistoryItems([]);
        setTotal(0);
      }
      setError(
        (requestError as { message?: string })?.message || "观看历史加载失败",
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory(1, false);
  }, [loadHistory]);

  const handleDeleteHistory = async () => {
    if (!activeHistory) {
      return;
    }

    const historyId = activeHistory.id;
    setDeletingId(historyId);
    setError("");

    try {
      await removeWatchHistory(historyId);
      setHistoryItems((current) =>
        current.filter((item) => item.id !== historyId),
      );
      setTotal((current) => Math.max(0, current - 1));
      setMenuAnchorEl(null);
      setActiveHistory(null);
    } catch (requestError) {
      setError(
        (requestError as { message?: string })?.message || "删除观看记录失败",
      );
    } finally {
      setDeletingId("");
    }
  };

  return (
    <AppShell>
      <Typography variant="h2" sx={{ mb: 3, fontSize: 32, lineHeight: "40px" }}>
        最近观看
      </Typography>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {historyItems.length ? (
        <section className="flex flex-col gap-4">
          {historyItems.map((item) => {
            const title = item.cine?.name || "未知影视";
            const episode =
              item.episode?.name || item.cine?.season || "未选择剧集";
            const image =
              resolveMediaUrl(
                item.episode?.thumbnail ||
                  item.cine?.backdrop ||
                  item.cine?.poster,
              ) || MEDIA_PLACEHOLDERS.thumbnail;
            const progress = resolveHistoryProgress(item);
            return (
              <article
                key={item.id}
                className="flex cursor-pointer overflow-hidden rounded-xl bg-white shadow-md3"
                onClick={() =>
                  navigate(toPlaybackPath(item.cine_id, item.episode_id))
                }
              >
                <div className="relative h-[72px] w-32 shrink-0 bg-surface-variant">
                  <img
                    src={image}
                    alt={title}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] text-white">
                    {formatWatchedAt(item.last_watched_at)}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center p-3">
                  <h2 className="truncate text-base font-medium">{title}</h2>
                  <p className="mt-0.5 text-sm text-on-surface-variant">
                    {episode}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {formatProgressText(progress)}
                  </p>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      mt: 0.75,
                      height: 4,
                      borderRadius: 999,
                      bgcolor: "#e1e3e4",
                      "& .MuiLinearProgress-bar": { bgcolor: "#000666" },
                    }}
                  />
                </div>
                <IconButton
                  aria-label="更多操作"
                  disabled={deletingId === item.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveHistory(item);
                    setMenuAnchorEl(event.currentTarget);
                  }}
                  sx={{ alignSelf: "center", mx: 0.5, color: "#767683" }}
                >
                  <MoreVertRoundedIcon />
                </IconButton>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="rounded-lg bg-surface-container-low p-5 text-sm text-on-surface-variant">
          {loading ? "正在加载观看历史..." : "暂无观看历史"}
        </div>
      )}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => {
          setMenuAnchorEl(null);
          setActiveHistory(null);
        }}
      >
        <MenuItem
          disabled={!activeHistory || deletingId === activeHistory.id}
          onClick={(event) => {
            event.stopPropagation();
            void handleDeleteHistory();
          }}
        >
          {activeHistory && deletingId === activeHistory.id
            ? "删除中..."
            : "删除记录"}
        </MenuItem>
      </Menu>
      <div className="mt-8 flex justify-center">
        <Button
          variant="outlined"
          disabled={loading || loadingMore || !hasMore}
          onClick={() => {
            void loadHistory(page + 1, true);
          }}
          sx={{
            borderRadius: 999,
            px: 4,
            color: "#000666",
            borderColor: "#c6c5d4",
            fontSize: 16,
          }}
        >
          {loadingMore ? "加载中..." : hasMore ? "加载更多" : "已加载全部"}
        </Button>
      </div>
    </AppShell>
  );
}
