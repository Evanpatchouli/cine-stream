import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import BookmarksRoundedIcon from "@mui/icons-material/BookmarksRounded";
import TheaterComedyRoundedIcon from "@mui/icons-material/TheaterComedyRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

interface AppShellProps {
  children: ReactNode;
  flush?: boolean;
}

const navItems = [
  {
    path: "/space",
    label: "我的空间",
    icon: <PersonRoundedIcon />,
  },
  {
    path: "/history",
    label: "观看历史",
    icon: <HistoryRoundedIcon />,
  },
  {
    path: "/collection",
    label: "我的收藏",
    icon: <BookmarksRoundedIcon />,
  },
  {
    path: "/hall",
    label: "影厅",
    icon: <TheaterComedyRoundedIcon />,
  },
];

export function AppShell({ children, flush = false }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box className="min-h-screen bg-background">
      <AppBar
        position="fixed"
        color="inherit"
        elevation={1}
        sx={{
          left: 0,
          right: 0,
          mx: "auto",
          maxWidth: 600,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <Toolbar sx={{ minHeight: 64, px: 2, justifyContent: "space-between" }}>
          <IconButton edge="start" onClick={() => setOpen(true)}>
            <MenuRoundedIcon sx={{ color: "#000666" }} />
          </IconButton>
          <Typography
            component={Link}
            to="/hall"
            sx={{
              color: "#000666",
              textDecoration: "none",
              fontSize: 24,
              lineHeight: "32px",
              fontWeight: 700,
            }}
          >
            CineStream
          </Typography>
          <IconButton
            aria-label="搜索影视"
            title="搜索影视"
            onClick={() =>
              navigate("/hall", {
                state: { focusSearchRequest: Date.now() },
              })
            }
          >
            <SearchRoundedIcon sx={{ color: "#454652" }} />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: "80%",
            maxWidth: 480,
            bgcolor: "#f3f4f5",
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16,
            px: 2,
            py: 4,
          },
        }}
      >
        <Typography sx={{ px: 2, mb: 3, color: "#000666", fontWeight: 700 }}>
          菜单
        </Typography>
        <List sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                onClick={() => setOpen(false)}
                sx={{
                  borderRadius: 999,
                  color: active ? "#000666" : "#454652",
                  bgcolor: active ? "rgba(0,6,102,0.10)" : "transparent",
                  "&:hover": { bgcolor: "#e1e3e4" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: active ? 700 : 500 }}
                />
              </ListItemButton>
            );
          })}
        </List>
        <Box sx={{ mt: "auto", px: 2 }}>
          <ListItemButton
            component={Link}
            to="/settings"
            onClick={() => {
              setOpen(false);
            }}
            sx={{
              borderRadius: 999,
              color: location.pathname.startsWith("/settings")
                ? "#000666"
                : "#454652",
              bgcolor: location.pathname.startsWith("/settings")
                ? "rgba(0,6,102,0.10)"
                : "transparent",
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <SettingsRoundedIcon />
            </ListItemIcon>
            <ListItemText
              primary="设置"
              primaryTypographyProps={{
                fontWeight: location.pathname.startsWith("/settings")
                  ? 700
                  : 500,
              }}
            />
          </ListItemButton>
        </Box>
      </Drawer>

      <main
        className={
          flush
            ? "mx-auto min-h-screen max-w-[600px] pt-16"
            : "mx-auto min-h-screen max-w-[600px] px-container-padding pb-section-gap pt-20"
        }
      >
        {children}
      </main>
    </Box>
  );
}
