import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Avatar, Typography } from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import PaymentRoundedIcon from "@mui/icons-material/PaymentRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { AppShell } from "@/components/AppShell";
import { getProfile } from "@/api/user.api";
import { fetchOverview } from "@/api/watch.api";
import { MEDIA_PLACEHOLDERS } from "@/constants";
import { useAuthStore } from "@/stores/auth";
import type { UserProfile, WatchOverview } from "@/types";

function SettingRow({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex w-full items-center justify-between rounded-xl bg-white p-4 text-left shadow-md3"
      onClick={onClick}
    >
      <span className="flex items-center gap-4">
        <span className={danger ? "text-error" : "text-primary"}>{icon}</span>
        <span className={`text-lg ${danger ? "text-error" : "text-on-surface"}`}>
          {label}
        </span>
      </span>
      {!danger ? <ChevronRightRoundedIcon className="text-on-surface-variant" /> : null}
    </button>
  );
}

export function SpacePage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [profile, setProfile] = useState<UserProfile | null>(user);
  const [overview, setOverview] = useState<WatchOverview>({
    watched_count: 0,
    saved_count: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    getProfile()
      .then((resp) => setProfile(resp.getData()))
      .catch(() => setProfile(user));
    fetchOverview()
      .then((resp) => {
        const data = resp.getData();
        if (data) {
          setOverview(data);
        }
      })
      .catch(() => undefined);
  }, [user]);

  return (
    <AppShell>
      <section className="mb-section-gap flex flex-col items-center">
        <div className="relative mb-4">
          <Avatar src={MEDIA_PLACEHOLDERS.avatar} sx={{ width: 112, height: 112 }} />
          <button className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg">
            <EditRoundedIcon />
          </button>
        </div>
        <Typography variant="h2" sx={{ fontSize: 32, lineHeight: "40px" }}>
          {profile?.nickname || profile?.username || "未命名用户"}
        </Typography>
        <p className="mt-1 text-base text-on-surface-variant">
          {profile?.email || profile?.phone || "未绑定联系方式"}
        </p>
        <div className="mt-6 grid w-full grid-cols-2 gap-4">
          <div className="rounded-xl bg-surface-container-low p-4 text-center">
            <div className="text-xl font-semibold text-primary">
              {overview.watched_count}
            </div>
            <div className="mt-1 text-sm text-on-surface-variant">已观看</div>
          </div>
          <div className="rounded-xl bg-surface-container-low p-4 text-center">
            <div className="text-xl font-semibold text-primary">
              {overview.saved_count}
            </div>
            <div className="mt-1 text-sm text-on-surface-variant">已保存</div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="px-2 text-sm font-semibold uppercase tracking-widest text-on-surface-variant">
          账户设置
        </h3>
        <SettingRow icon={<ManageAccountsRoundedIcon />} label="个人资料" />
        <SettingRow icon={<PaymentRoundedIcon />} label="订阅与账单" />
        <SettingRow icon={<TuneRoundedIcon />} label="播放偏好" />
        <div className="pt-4">
          <SettingRow
            icon={<LogoutRoundedIcon />}
            label="退出登录"
            danger
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          />
        </div>
      </section>
    </AppShell>
  );
}
