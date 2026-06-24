import { useNavigate } from "react-router-dom";
import { Box, Chip, IconButton, InputBase, Typography } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { AppShell } from "@/components/AppShell";
import { images, mockCines } from "@/data/mock";
import { useCineStore } from "@/stores/cines";
import type { Cine } from "@/types";

function PosterCard({ cine }: { cine: Cine }) {
  const navigate = useNavigate();
  return (
    <article
      className="cursor-pointer"
      onClick={() => navigate(`/play/${cine.id}`)}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface-variant shadow-md3">
        <img className="h-full w-full object-cover" src={cine.poster} alt={cine.name} />
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
        {cine.meta || `${cine.genre || "剧情"} • ${cine.year || "2024"}`}
      </p>
    </article>
  );
}

function ContinueCard({
  title,
  image,
  progress,
  subtitle,
}: {
  title: string;
  image: string;
  progress: number;
  subtitle: string;
}) {
  return (
    <article className="w-[240px] shrink-0">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-variant shadow-md3">
        <img src={image} alt={title} className="h-full w-full object-cover" />
        <div className="absolute bottom-0 left-0 h-1 w-full bg-surface-variant">
          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <h3 className="mt-2 truncate text-sm font-semibold">{title}</h3>
      <p className="mt-0.5 text-xs text-on-surface-variant">{subtitle}</p>
    </article>
  );
}

export function HallPage() {
  const cines = useCineStore((state) => state.cines);
  const navigate = useNavigate();
  const trending = cines.slice(0, 2);

  return (
    <AppShell>
      <Box className="relative mb-7 flex h-[52px] items-center bg-[#f1f3f4] px-3">
        <SearchRoundedIcon sx={{ color: "#767683", mr: 1 }} />
        <InputBase
          placeholder="搜索剧集、类型、演员..."
          fullWidth
          sx={{ color: "#454652", fontSize: 16 }}
        />
        <IconButton>
          <MicRoundedIcon sx={{ color: "#767683" }} />
        </IconButton>
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

      <section className="mb-section-gap">
        <Typography variant="h3" sx={{ mb: 2 }}>
          热门推荐
        </Typography>
        <div className="grid grid-cols-2 gap-4">
          {trending.map((cine) => (
            <PosterCard key={cine.id} cine={cine} />
          ))}
        </div>
      </section>

      <section className="-mx-container-padding mb-section-gap px-container-padding">
        <Typography variant="h3" sx={{ mb: 2 }}>
          继续观看
        </Typography>
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
          <ContinueCard
            title="量子裂隙 - 第 1 季 第 4 集"
            image={images.quantum}
            progress={65}
            subtitle="剩余 35 分钟"
          />
          <ContinueCard
            title="地球边缘 - 森林"
            image={images.forest}
            progress={15}
            subtitle="剩余 1 小时 10 分钟"
          />
        </div>
      </section>

      <section>
        <Typography variant="h3" sx={{ mb: 2 }}>
          为你精选
        </Typography>
        <div className="grid grid-cols-2 gap-4 auto-rows-[160px]">
          <div
            className="relative col-span-2 row-span-2 cursor-pointer overflow-hidden rounded-xl shadow-md3"
            onClick={() => navigate(`/play/${cines[0]?.id || mockCines[0].id}`)}
          >
            <img src={images.gates} alt="失落之门" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 text-white">
              <span className="mb-2 w-max rounded bg-white/20 px-2 py-1 text-[10px]">
                原创
              </span>
              <h3 className="text-2xl font-semibold leading-tight">
                失落之门
              </h3>
              <p className="mt-1 line-clamp-2 text-sm">
                当一扇古老的传送门在现代都市之下被发现，一段史诗般的旅程就此开始。
              </p>
            </div>
          </div>
          {[
            ["晨间特调", images.morning],
            ["速度", images.velocity],
          ].map(([title, image]) => (
            <div
              key={title}
              className="relative overflow-hidden rounded-xl shadow-md3"
            >
              <img src={image} alt={title} className="h-full w-full object-cover" />
              <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/70 to-transparent p-2">
                <span className="text-sm font-semibold text-white">{title}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button
        className="fixed bottom-5 right-[calc(50%-174px)] hidden h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg"
        aria-label="播放"
      >
        <PlayArrowRoundedIcon />
      </button>
    </AppShell>
  );
}
