import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chip, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import DownloadDoneRoundedIcon from "@mui/icons-material/DownloadDoneRounded";
import { AppShell } from "@/components/AppShell";
import { fetchCollections, type QueryCollectionsParams } from "@/api/watch.api";
import { MEDIA_PLACEHOLDERS } from "@/constants";
import { useCollectionStore } from "@/stores/collections";
import { resolveMediaUrl } from "@/utils/media";
import { toPlaybackPath } from "@/utils/routes";
import type { WatchCollectionItem } from "@/types";

const COLLECTION_PAGE_SIZE = 100;

const statusOptions: Array<{
  label: string;
  value?: QueryCollectionsParams["status"];
}> = [
  { label: "全部状态" },
  { label: "已下载", value: "downloaded" },
  { label: "观看中", value: "watching" },
];

export function CollectionPage() {
  const allCollections = useCollectionStore((state) => state.items);
  const storeLoaded = useCollectionStore((state) => state.loaded);
  const loadCollections = useCollectionStore((state) => state.load);
  const navigate = useNavigate();
  const [collection, setCollection] = useState<WatchCollectionItem[]>([]);
  const [activeGenre, setActiveGenre] = useState("");
  const [activeStatus, setActiveStatus] =
    useState<QueryCollectionsParams["status"]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(
    null,
  );
  const collectionLoading = loading && !collection.length;
  const activeStatusLabel =
    statusOptions.find((item) => item.value === activeStatus)?.label ||
    "全部状态";
  const genreOptions = useMemo(() => {
    const genres = allCollections.flatMap((item) => item.cine?.genre || []);
    return ["全部", ...Array.from(new Set(genres)).slice(0, 8)];
  }, [allCollections]);

  useEffect(() => {
    if (!storeLoaded) {
      void loadCollections();
    }
  }, [loadCollections, storeLoaded]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetchCollections({
      page: 1,
      size: COLLECTION_PAGE_SIZE,
      genre: activeGenre || undefined,
      status: activeStatus,
    })
      .then((resp) => {
        if (cancelled) {
          return;
        }
        setCollection(resp.getData()?.list || []);
      })
      .catch((requestError) => {
        if (cancelled) {
          return;
        }
        setCollection([]);
        setError(
          (requestError as { message?: string })?.message || "收藏列表加载失败",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeGenre, activeStatus]);

  return (
    <AppShell>
      <div className="mb-section-gap flex items-center justify-between">
        <Typography
          variant="h1"
          sx={{ fontSize: 45, lineHeight: "52px", fontWeight: 700 }}
        >
          我的收藏
        </Typography>
        <IconButton
          aria-label="筛选收藏状态"
          onClick={(event) => setFilterAnchorEl(event.currentTarget)}
        >
          <FilterListRoundedIcon sx={{ color: "#191c1d" }} />
        </IconButton>
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={() => setFilterAnchorEl(null)}
        >
          {statusOptions.map((option) => (
            <MenuItem
              key={option.label}
              selected={option.value === activeStatus}
              onClick={() => {
                setActiveStatus(option.value);
                setFilterAnchorEl(null);
              }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Menu>
      </div>

      <div className="-mx-container-padding mb-5 flex gap-3 overflow-x-auto px-container-padding pb-2 hide-scrollbar">
        {genreOptions.map((label) => {
          const selected =
            label === "全部" ? !activeGenre : activeGenre === label;
          return (
            <Chip
              key={label}
              label={label}
              clickable
              color={selected ? "primary" : "default"}
              variant={selected ? "filled" : "outlined"}
              onClick={() => setActiveGenre(label === "全部" ? "" : label)}
              sx={{ flexShrink: 0, borderColor: "#c6c5d4" }}
            />
          );
        })}
      </div>

      {collection.length ? (
        <>
          <div className="mb-4 text-xs text-on-surface-variant">
            {activeGenre || activeStatus
              ? `筛选：${activeGenre || "全部分类"} / ${activeStatusLabel}`
              : "显示全部收藏"}
          </div>
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
                      src={
                        resolveMediaUrl(cine.poster) ||
                        MEDIA_PLACEHOLDERS.poster
                      }
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
                  <h3 className="truncate text-base font-medium">
                    {cine.name}
                  </h3>
                  <p className="truncate text-sm text-on-surface-variant">
                    {cine.meta || cine.season || "暂无副标题"}
                  </p>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className="rounded-lg bg-surface-container-low p-5 text-sm text-on-surface-variant">
          {collectionLoading
            ? "正在加载收藏..."
            : error ||
              (activeGenre || activeStatus
                ? "没有符合筛选条件的收藏"
                : "暂无收藏")}
        </div>
      )}
    </AppShell>
  );
}
