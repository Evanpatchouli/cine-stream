import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chip, IconButton, Typography } from "@mui/material";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import DownloadDoneRoundedIcon from "@mui/icons-material/DownloadDoneRounded";
import { AppShell } from "@/components/AppShell";
import { fetchCollections } from "@/api/watch.api";
import { MEDIA_PLACEHOLDERS } from "@/constants";
import { resolveMediaUrl } from "@/utils/media";
import { toPlaybackPath } from "@/utils/routes";
import type { WatchCollectionItem } from "@/types";

export function CollectionPage() {
  const [collection, setCollection] = useState<WatchCollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCollections()
      .then((resp) => setCollection(resp.getData() || []))
      .catch(() => setCollection([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="mb-section-gap flex items-center justify-between">
        <Typography
          variant="h1"
          sx={{ fontSize: 45, lineHeight: "52px", fontWeight: 700 }}
        >
          我的收藏
        </Typography>
        <IconButton>
          <FilterListRoundedIcon sx={{ color: "#191c1d" }} />
        </IconButton>
      </div>

      <div className="-mx-container-padding mb-5 flex gap-3 overflow-x-auto px-container-padding pb-2 hide-scrollbar">
        {["全部", "剧集", "电影", "纪录片"].map((label, index) => (
          <Chip
            key={label}
            label={label}
            color={index === 0 ? "primary" : "default"}
            variant={index === 0 ? "filled" : "outlined"}
            sx={{ flexShrink: 0, borderColor: "#c6c5d4" }}
          />
        ))}
      </div>

      {collection.length ? (
        <div className="grid grid-cols-2 gap-4">
          {collection.map((item) => {
            const cine = item.cine;
            if (!cine) {
              return null;
            }
            return (
              <article
                key={item.id}
                className="cursor-pointer"
                onClick={() => navigate(toPlaybackPath(cine.id))}
              >
                <div className="relative mb-2 aspect-[2/3] overflow-hidden rounded-lg shadow-md3">
                  <img
                    src={resolveMediaUrl(cine.poster) || MEDIA_PLACEHOLDERS.poster}
                    alt={cine.name}
                    className="h-full w-full object-cover"
                  />
                  {cine.badge ? (
                    <span className="absolute left-2 top-2 rounded-sm bg-error px-2 py-0.5 text-sm font-semibold text-white">
                      {cine.badge === "已下载" ? (
                        <span className="inline-flex items-center gap-1 rounded bg-white/80 px-1 text-on-surface">
                          <DownloadDoneRoundedIcon sx={{ fontSize: 14 }} />
                          已下载
                        </span>
                      ) : (
                        cine.badge
                      )}
                    </span>
                  ) : null}
                </div>
                <h3 className="truncate text-base font-medium">{cine.name}</h3>
                <p className="truncate text-sm text-on-surface-variant">
                  {cine.meta || cine.season || "暂无副标题"}
                </p>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg bg-surface-container-low p-5 text-sm text-on-surface-variant">
          {loading ? "正在加载收藏..." : "暂无收藏"}
        </div>
      )}
    </AppShell>
  );
}
