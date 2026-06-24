import { Button, LinearProgress, Typography } from "@mui/material";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { AppShell } from "@/components/AppShell";
import { images } from "@/data/mock";

const historyItems = [
  {
    title: "首都之影",
    episode: '第 2 季 第 4 集 • “投票”',
    image: images.player,
    time: "45:12",
    progress: 75,
  },
  {
    title: "庄园低语",
    episode: '第 1 季 第 1 集 • “到达”',
    image: images.gildedPoster,
    time: "12:05",
    progress: 20,
  },
  {
    title: "霓虹漂移",
    episode: '第 3 季 第 10 集 • “终章”',
    image: images.hood,
    time: "已看完",
    progress: 100,
  },
  {
    title: "咖啡与雨",
    episode: "电影",
    image: images.morning,
    time: "",
    progress: 5,
    muted: true,
  },
];

export function HistoryPage() {
  return (
    <AppShell>
      <Typography variant="h2" sx={{ mb: 3, fontSize: 32, lineHeight: "40px" }}>
        最近观看
      </Typography>
      <section className="flex flex-col gap-4">
        {historyItems.map((item) => (
          <article
            key={item.title}
            className={`flex overflow-hidden rounded-xl bg-white shadow-md3 ${
              item.muted ? "opacity-70" : ""
            }`}
          >
            <div className="relative h-[72px] w-32 shrink-0 bg-surface-variant">
              <img src={item.image || images.neonPoster} alt={item.title} className="h-full w-full object-cover" />
              {item.time ? (
                <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] text-white">
                  {item.time}
                </span>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center p-3">
              <h2 className="truncate text-base font-medium">{item.title}</h2>
              <p className="mt-0.5 text-sm text-on-surface-variant">
                {item.episode}
              </p>
              <LinearProgress
                variant="determinate"
                value={item.progress}
                sx={{
                  mt: 1,
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
        ))}
      </section>
      <div className="mt-8 flex justify-center">
        <Button
          variant="outlined"
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
