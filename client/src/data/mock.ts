import type { Cine, Episode } from "@/types";

export const images = {
  neonPoster: "/media/neon-poster.png",
  gildedPoster: "/media/gilded-poster.png",
  quantum: "/media/quantum.png",
  forest: "/media/forest.png",
  gates: "/media/gates.png",
  morning: "/media/morning.png",
  velocity: "/media/velocity.png",
  bridge: "/media/bridge.png",
  romance: "/media/romance.png",
  hood: "/media/hood.png",
  crown: "/media/crown.png",
  car: "/media/car.png",
  player: "/media/player.png",
  avatar: "/media/avatar.png",
};

export const mockEpisodes: Episode[] = [
  {
    id: "ep-1",
    name: "觉醒",
    duration: "45:00",
    thumbnail: "/media/player.png",
    progress: 33,
  },
  {
    id: "ep-2",
    name: "被窃回声",
    duration: "42:15",
    thumbnail: "/media/quantum.png",
  },
  {
    id: "ep-3",
    name: "霓虹之雨",
    duration: "48:30",
    thumbnail: "/media/neon-poster.png",
  },
  {
    id: "ep-4",
    name: "高楼之上",
    duration: "41:05",
    thumbnail: "/media/forest.png",
  },
];

export const mockCines: Cine[] = [
  {
    id: "neon-echoes",
    name: "霓虹回响",
    genre: "惊悚",
    year: "2024",
    season: "第 1 季",
    rating: "16+",
    poster: images.neonPoster,
    backdrop: images.player,
    meta: "惊悚 • 2024",
    progressText: "剩余 35 分钟",
    progress: 65,
    description:
      "在一座庞大的都市中，记忆可以被提取和出售。一名前侦探发现了一场阴谋，足以抹去整座城市的集体历史。",
    episodes: mockEpisodes,
  },
  {
    id: "gilded-secret",
    name: "鎏金秘闻",
    genre: "剧情",
    season: "第 2 季",
    poster: images.gildedPoster,
    meta: "剧情 • 第 2 季",
    badge: "新剧集",
  },
  {
    id: "lost-gates",
    name: "失落之门",
    genre: "原创",
    poster: images.gates,
    backdrop: images.gates,
    description:
      "当一扇古老的传送门在现代都市之下被发现，一段史诗般的旅程就此开始。",
  },
  {
    id: "silent-bridge",
    name: "寂静之桥",
    poster: images.bridge,
    meta: "第 1 季：第 4 集 • 剩余 45 分钟",
    progress: 68,
  },
  {
    id: "coffee-chaos",
    name: "咖啡与喧嚣",
    poster: images.romance,
    meta: "电影 • 1 小时 50 分钟",
  },
  {
    id: "neon-nights",
    name: "霓虹之夜",
    poster: images.hood,
    meta: "第 2 季：第 1 集 • 刚刚上线",
    badge: "新剧集",
  },
  {
    id: "crown-shadow",
    name: "王冠之影",
    poster: images.crown,
    meta: "第 1 季 • 10 集",
  },
  {
    id: "code-red",
    name: "红色警报",
    poster: images.car,
    meta: "电影 • 离线",
    badge: "已下载",
  },
];
