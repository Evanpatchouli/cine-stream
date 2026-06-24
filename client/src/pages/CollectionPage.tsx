import { useNavigate } from "react-router-dom";
import { Chip, IconButton, Typography } from "@mui/material";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import DownloadDoneRoundedIcon from "@mui/icons-material/DownloadDoneRounded";
import { AppShell } from "@/components/AppShell";
import { useCineStore } from "@/stores/cines";
import { mockCines } from "@/data/mock";

export function CollectionPage() {
  const cines = useCineStore((state) => state.cines);
  const navigate = useNavigate();
  const collection = [
    cines[3] || mockCines[3],
    cines[4] || mockCines[4],
    cines[5] || mockCines[5],
    cines[6] || mockCines[6],
    cines[7] || mockCines[7],
  ];

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

      <div className="grid grid-cols-2 gap-4">
        {collection.map((cine) => (
          <article
            key={cine.id}
            className="cursor-pointer"
            onClick={() => navigate(`/play/${cine.id}`)}
          >
            <div className="relative mb-2 aspect-[2/3] overflow-hidden rounded-lg shadow-md3">
              <img src={cine.poster} alt={cine.name} className="h-full w-full object-cover" />
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
              {cine.meta || "第 1 季 • 10 集"}
          </p>
        </article>
      ))}
      </div>
    </AppShell>
  );
}
