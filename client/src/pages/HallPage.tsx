import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Chip, IconButton, InputBase, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { AppShell } from "@/components/AppShell";
import { fetchWatchHistory } from "@/api/watch.api";
import { MEDIA_PLACEHOLDERS } from "@/constants";
import { useCineStore } from "@/stores/cines";
import { resolveMediaUrl } from "@/utils/media";
import { toPlaybackPath } from "@/utils/routes";
import { formatProgressText, resolveHistoryProgress } from "@/utils/watchProgress";
import type { Cine, WatchHistoryItem } from "@/types";

function PosterCard({ cine }: { cine: Cine }) {
  const navigate = useNavigate();
  const genreText = cine.genre?.length ? cine.genre.join(" / ") : "剧情";
  return (
    <article
      className="cursor-pointer"
      onClick={() => navigate(toPlaybackPath(cine.id))}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface-variant shadow-md3">
        <img
          className="h-full w-full object-cover"
          src={resolveMediaUrl(cine.poster) || MEDIA_PLACEHOLDERS.poster}
          alt={cine.name}
        />
        {cine.badge ? (
          <span className="absolute left-2 top-2 rounded-sm bg-error px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            {cine.badge}
          </span>
        ) : null}
      </div>
      <h3 className="mt-2 truncate text-base font-medium text-on-surface">
        {cine.name}
      </h3>
      <p className="mt-1 text-xs font-medium text-on-surface-variant">
        {cine.meta || `${genreText} • ${cine.year || "2024"}`}
      </p>
    </article>
  );
}

function ContinueCard({
  item,
}: {
  item: WatchHistoryItem;
}) {
  const navigate = useNavigate();
  const title = item.cine?.name || "未知影视";
  const episodeName = item.episode?.name ? ` - ${item.episode.name}` : "";
  const image =
    resolveMediaUrl(
      item.episode?.thumbnail || item.cine?.backdrop || item.cine?.poster,
    ) ||
    MEDIA_PLACEHOLDERS.thumbnail;
  const progress = resolveHistoryProgress(item);

  return (
    <article
      className="w-[240px] shrink-0 cursor-pointer"
      onClick={() => navigate(toPlaybackPath(item.cine_id, item.episode_id))}
    >
      <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-variant shadow-md3">
        <img src={image} alt={title} className="h-full w-full object-cover" />
        <div className="absolute bottom-0 left-0 h-1 w-full bg-surface-variant">
          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <h3 className="mt-2 truncate text-sm font-semibold">
        {title}
        {episodeName}
      </h3>
      <p className="mt-0.5 text-xs text-on-surface-variant">{formatProgressText(progress)}</p>
    </article>
  );
}

export function HallPage() {
  const cines = useCineStore((state) => state.cines);
  const loading = useCineStore((state) => state.loading);
  const error = useCineStore((state) => state.error);
  const loadCines = useCineStore((state) => state.load);
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const searchKeyword = submittedKeyword.trim();
  const isSearching = Boolean(searchKeyword);
  const visibleCines = cines;
  const trending = visibleCines.slice(0, 2);
  const featured = visibleCines[0] || null;
  const picked = visibleCines.slice(1, 3);
  const continueItems = useMemo(
    () => history.filter((item) => {
      const progress = resolveHistoryProgress(item);
      return progress > 0 && progress < 100;
    }),
    [history],
  );

  useEffect(() => {
    fetchWatchHistory()
      .then((resp) => setHistory(resp.getData() || []))
      .catch(() => setHistory([]));
  }, []);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextKeyword = searchText.trim();
    setSearchText(nextKeyword);
    setSubmittedKeyword(nextKeyword);
    void loadCines(nextKeyword || undefined);
  };

  const handleClearSearch = () => {
    setSearchText("");
    setSubmittedKeyword("");
    void loadCines();
  };

  return (
    <AppShell>
      <Box
        component="form"
        className="relative mb-7 flex h-[52px] items-center bg-[#f1f3f4] px-3"
        onSubmit={handleSearchSubmit}
      >
        <IconButton type="submit" aria-label="搜索" sx={{ mr: 0.5 }}>
          <SearchRoundedIcon sx={{ color: "#767683" }} />
        </IconButton>
        <InputBase
          placeholder="搜索剧集、类型、演员..."
          fullWidth
          value={searchText}
          onChange={(event) => {
            const value = event.target.value;
            setSearchText(value);
            if (!value.trim() && submittedKeyword) {
              setSubmittedKeyword("");
              void loadCines();
            }
          }}
          inputProps={{ "aria-label": "搜索影视" }}
          sx={{ color: "#454652", fontSize: 16 }}
        />
        {searchText ? (
          <IconButton
            type="button"
            aria-label="清空搜索"
            onClick={handleClearSearch}
          >
            <CloseRoundedIcon sx={{ color: "#767683" }} />
          </IconButton>
        ) : null}
      </Box>

      <div className="-mx-container-padding mb-8 flex gap-2 overflow-x-auto px-container-padding hide-scrollbar">
        {["全部", "剧情", "惊悚", "喜剧", "科幻", "爱情"].map(
          (label, index) => (
            <Chip
              key={label}
              label={label}
              color={index === 0 ? "primary" : "default"}
              variant={index === 0 ? "filled" : "outlined"}
              sx={{ flexShrink: 0, borderColor: "#c6c5d4" }}
            />
          ),
        )}
      </div>

      {isSearching ? (
        <section>
          <Typography variant="h3" sx={{ mb: 2 }}>
            搜索结果
          </Typography>
          {visibleCines.length ? (
            <div className="grid grid-cols-2 gap-4">
              {visibleCines.map((cine) => (
                <PosterCard key={cine.id} cine={cine} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-surface-container-low p-5 text-sm text-on-surface-variant">
              {loading
                ? "正在加载影视..."
                : error || `没有找到与“${searchKeyword}”相关的影视`}
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="mb-section-gap">
            <Typography variant="h3" sx={{ mb: 2 }}>
              热门推荐
            </Typography>
            {trending.length ? (
              <div className="grid grid-cols-2 gap-4">
                {trending.map((cine) => (
                  <PosterCard key={cine.id} cine={cine} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-surface-container-low p-5 text-sm text-on-surface-variant">
                {loading ? "正在加载影视..." : error || "暂无影视内容"}
              </div>
            )}
          </section>

          <section className="-mx-container-padding mb-section-gap px-container-padding">
            <Typography variant="h3" sx={{ mb: 2 }}>
              继续观看
            </Typography>
            {continueItems.length ? (
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                {continueItems.slice(0, 8).map((item) => (
                  <ContinueCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-surface-container-low p-5 text-sm text-on-surface-variant">
                暂无观看记录
              </div>
            )}
          </section>

          <section>
            <Typography variant="h3" sx={{ mb: 2 }}>
              为你精选
            </Typography>
            {featured ? (
              <div className="grid grid-cols-2 gap-4 auto-rows-[160px]">
                <div
                  className="relative col-span-2 row-span-2 cursor-pointer overflow-hidden rounded-xl shadow-md3"
                  onClick={() => navigate(toPlaybackPath(featured.id))}
                >
                  <img
                    src={
                      resolveMediaUrl(featured.backdrop || featured.poster) ||
                      MEDIA_PLACEHOLDERS.backdrop
                    }
                    alt={featured.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 text-white">
                    {featured.badge ? (
                      <span className="mb-2 w-max rounded bg-white/20 px-2 py-1 text-[10px]">
                        {featured.badge}
                      </span>
                    ) : null}
                    <h3 className="text-2xl font-semibold leading-tight">
                      {featured.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm">
                      {featured.description || featured.meta || "暂无简介"}
                    </p>
                  </div>
                </div>
                {picked.map((cine) => (
                  <div
                    key={cine.id}
                    className="relative cursor-pointer overflow-hidden rounded-xl shadow-md3"
                    onClick={() => navigate(toPlaybackPath(cine.id))}
                  >
                    <img
                      src={
                        resolveMediaUrl(cine.backdrop || cine.poster) ||
                        MEDIA_PLACEHOLDERS.backdrop
                      }
                      alt={cine.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/70 to-transparent p-2">
                      <span className="text-sm font-semibold text-white">
                        {cine.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-surface-container-low p-5 text-sm text-on-surface-variant">
                暂无精选内容
              </div>
            )}
          </section>
        </>
      )}

      <button
        className="fixed bottom-5 right-[calc(50%-174px)] hidden h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg"
        aria-label="播放"
      >
        <PlayArrowRoundedIcon />
      </button>
    </AppShell>
  );
}
