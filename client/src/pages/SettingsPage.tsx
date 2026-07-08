import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { AppShell } from "@/components/AppShell";
import {
  getPlaybackPreferences,
  getProfile,
  updatePlaybackPreferences,
  updateProfile,
  uploadAvatar,
} from "@/api/user.api";
import { MEDIA_PLACEHOLDERS } from "@/constants";
import { useAuthStore } from "@/stores/auth";
import type { PlaybackPreferences, UserProfile } from "@/types";
import { resolveMediaUrl } from "@/utils/media";

const DEFAULT_PLAYBACK_PREFERENCES: PlaybackPreferences = {
  auto_play_next: true,
  default_muted: true,
};

const readErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error
    ? error.message
    : (error as { message?: string })?.message || fallback;

export function SettingsPage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const activeTab = section === "playback" ? "playback" : "profile";
  const setAuthUser = useAuthStore((state) => state.setUser);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [preferences, setPreferences] = useState<PlaybackPreferences>(
    DEFAULT_PLAYBACK_PREFERENCES,
  );
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([getProfile(), getPlaybackPreferences()])
      .then(([profileResp, preferencesResp]) => {
        if (cancelled) {
          return;
        }

        const nextProfile = profileResp.getData();
        const nextPreferences =
          preferencesResp.getData() || DEFAULT_PLAYBACK_PREFERENCES;
        setProfile(nextProfile);
        setNickname(nextProfile?.nickname || "");
        setEmail(nextProfile?.email || "");
        setPreferences({
          ...DEFAULT_PLAYBACK_PREFERENCES,
          ...nextPreferences,
        });
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(readErrorMessage(requestError, "设置加载失败"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    setError("");

    try {
      const resp = await updateProfile({
        nickname,
        email,
      });
      const nextProfile = resp.getData();
      if (nextProfile) {
        setProfile(nextProfile);
        setAuthUser(nextProfile);
      }
      setNotice("个人资料已保存");
    } catch (requestError) {
      setError(readErrorMessage(requestError, "个人资料保存失败"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarFile = async (file?: File) => {
    if (!file) {
      return;
    }

    setUploadingAvatar(true);
    setError("");

    try {
      const resp = await uploadAvatar(file);
      const nextProfile = resp.getData();
      if (nextProfile) {
        setProfile(nextProfile);
        setAuthUser(nextProfile);
      }
      setNotice("头像已更新");
    } catch (requestError) {
      setError(readErrorMessage(requestError, "头像上传失败"));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePreferencesSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSavingPreferences(true);
    setError("");

    try {
      const resp = await updatePlaybackPreferences(preferences);
      setPreferences({
        ...DEFAULT_PLAYBACK_PREFERENCES,
        ...(resp.getData() || preferences),
      });
      setNotice("播放偏好已保存");
    } catch (requestError) {
      setError(readErrorMessage(requestError, "播放偏好保存失败"));
    } finally {
      setSavingPreferences(false);
    }
  };

  return (
    <AppShell>
      <header className="mb-section-gap">
        <Typography variant="h2" sx={{ fontSize: 32, lineHeight: "40px" }}>
          设置
        </Typography>
        <p className="mt-1 text-sm text-on-surface-variant">
          管理账户资料和播放体验
        </p>
      </header>

      <Tabs
        value={activeTab}
        onChange={(_, value) => navigate(`/settings/${value}`)}
        sx={{ mb: 3 }}
      >
        <Tab value="profile" label="个人资料" />
        <Tab value="playback" label="播放偏好" />
      </Tabs>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-10">
          <CircularProgress />
        </div>
      ) : activeTab === "profile" ? (
        <Box
          component="form"
          onSubmit={handleProfileSubmit}
          className="flex flex-col gap-4"
        >
          <section className="flex items-center gap-4 rounded-xl bg-surface-container-low p-4">
            <Avatar
              src={
                resolveMediaUrl(profile?.avatar) || MEDIA_PLACEHOLDERS.avatar
              }
              sx={{ width: 76, height: 76 }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-on-surface">
                头像
              </div>
              <div className="mt-1 text-sm text-on-surface-variant">
                支持 png、jpg、webp、gif
              </div>
              <Button
                component="label"
                startIcon={<PhotoCameraRoundedIcon />}
                disabled={uploadingAvatar}
                sx={{ mt: 1, px: 0 }}
              >
                {uploadingAvatar ? "上传中..." : "更换头像"}
                <input
                  hidden
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(event) => {
                    void handleAvatarFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </Button>
            </div>
          </section>

          <TextField
            label="昵称"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            inputProps={{ maxLength: 100 }}
          />
          <TextField
            label="邮箱"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            inputProps={{ maxLength: 100 }}
          />
          <TextField label="手机号" value={profile?.phone || ""} disabled />
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveRoundedIcon />}
            disabled={savingProfile}
            sx={{ minHeight: 48, borderRadius: 999 }}
          >
            {savingProfile ? "保存中..." : "保存个人资料"}
          </Button>
        </Box>
      ) : (
        <Box
          component="form"
          onSubmit={handlePreferencesSubmit}
          className="flex flex-col gap-3"
        >
          <section className="flex items-center justify-between rounded-xl bg-white p-4 shadow-md3">
            <div>
              <div className="text-base font-semibold text-on-surface">
                自动连播
              </div>
              <div className="mt-1 text-sm text-on-surface-variant">
                当前剧集结束后自动播放下一集
              </div>
            </div>
            <Switch
              checked={preferences.auto_play_next}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  auto_play_next: event.target.checked,
                }))
              }
              inputProps={{ "aria-label": "自动连播" }}
            />
          </section>

          <section className="flex items-center justify-between rounded-xl bg-white p-4 shadow-md3">
            <div>
              <div className="text-base font-semibold text-on-surface">
                默认静音播放
              </div>
              <div className="mt-1 text-sm text-on-surface-variant">
                打开播放页时先静音，降低自动播放失败概率
              </div>
            </div>
            <Switch
              checked={preferences.default_muted}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  default_muted: event.target.checked,
                }))
              }
              inputProps={{ "aria-label": "默认静音播放" }}
            />
          </section>

          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveRoundedIcon />}
            disabled={savingPreferences}
            sx={{ mt: 2, minHeight: 48, borderRadius: 999 }}
          >
            {savingPreferences ? "保存中..." : "保存播放偏好"}
          </Button>
        </Box>
      )}

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3200}
        onClose={() => setNotice("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setNotice("")}>
          {notice}
        </Alert>
      </Snackbar>
    </AppShell>
  );
}
