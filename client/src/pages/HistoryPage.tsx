import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, LinearProgress, Typography } from "@mui/material";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { AppShell } from "@/components/AppShell";
import { fetchWatchHistory } from "@/api/watch.api";
import { MEDIA_PLACEHOLDERS } from "@/constants";
import { resolveMediaUrl } from "@/utils/media";
import { toPlaybackPath } from "@/utils/routes";
import { formatProgressText, resolveHistoryProgress } from "@/utils/watchProgress";
import type { WatchHistoryItem } from "@/types";

function formatWatchedAt(timestamp: number) {
  if (!timestamp) {
    return "";
  }
  return new Date(timestamp).toLocaleDateString();
}

export function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWatchHistory()
      .then((resp) => setHistoryItems(resp.getData() || []))
      .catch(() => setHistoryItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <Typography variant="h2" sx={{ mb: 3, fontSize: 32, lineHeight: "40px" }}>
        最近观看
      </Typography>
      {historyItems.length ? (
        <section className="flex flex-col gap-4">
          {historyItems.map((item) => {
            const title = item.cine?.name || "未知影视";
            const episode = item.episode?.name || item.cine?.season || "未选择剧集";
            const image =
              resolveMediaUrl(
                item.episode?.thumbnail ||
                  item.cine?.backdrop ||
                  item.cine?.poster,
              ) ||
              MEDIA_PLACEHOLDERS.thumbnail;
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
                  <p className="mt-1 text-xs text-on-surface-variant">{formatProgressText(progress)}</p>
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
                <button className="px-3 text-on-surface-variant">
                  <MoreVertRoundedIcon />
                </button>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="rounded-lg bg-surface-container-low p-5 text-sm text-on-surface-variant">
          {loading ? "正在加载观看历史..." : "暂无观看历史"}
        </div>
      )}
      <div className="mt-8 flex justify-center">
        <Button
          variant="outlined"
          disabled
          sx={{
            borderRadius: 999,
            px: 4,
            color: "#000666",
            borderColor: "#c6c5d4",
            fontSize: 16,
          }}
        >
          加载更多
        </Button>
      </div>
    </AppShell>
  );
}
