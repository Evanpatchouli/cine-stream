import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import MovieFilterRoundedIcon from "@mui/icons-material/MovieFilterRounded";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { useAuthStore } from "@/stores/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const rememberPhone = useAuthStore((state) => state.rememberPhone);
  const rememberedPhone = useAuthStore((state) => state.rememberedPhone);
  const setRememberPhone = useAuthStore((state) => state.setRememberPhone);
  const [phone, setPhone] = useState(rememberedPhone);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setForgotPasswordNotice("");
    try {
      await login(phone, password);
      navigate("/hall", { replace: true });
    } catch {
      // 错误信息由 auth store 写入 error，页面留在登录态展示失败原因。
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-container-padding py-10">
      <Box className="flex w-full max-w-[400px] flex-col gap-section-gap">
        <header className="flex flex-col items-center gap-element-gap pt-8 text-center">
          <MovieFilterRoundedIcon sx={{ fontSize: 70, color: "#000666" }} />
          <Typography
            variant="h1"
            sx={{ color: "#000666", fontSize: 45, fontWeight: 700 }}
          >
            CineStream
          </Typography>
          <Typography variant="body1" sx={{ color: "#454652" }}>
            登录后继续您的观影之旅
          </Typography>
        </header>

        <Box component="form" onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error ? <Alert severity="error">{error}</Alert> : null}
          {forgotPasswordNotice ? (
            <Alert severity="info">{forgotPasswordNotice}</Alert>
          ) : null}
          <TextField
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="手机号"
            type="tel"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIphoneRoundedIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              bgcolor: "#fff",
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                minHeight: 64,
              },
            }}
          />
          <TextField
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="密码"
            type={showPassword ? "text" : "password"}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockRoundedIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    type="button"
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                    onClick={() => setShowPassword((visible) => !visible)}
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    {showPassword ? (
                      <VisibilityOffRoundedIcon />
                    ) : (
                      <VisibilityRoundedIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              bgcolor: "#fff",
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                minHeight: 64,
              },
            }}
          />

          <div className="mt-1 flex items-center justify-between">
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberPhone}
                  color="primary"
                  onChange={(event) => setRememberPhone(event.target.checked)}
                />
              }
              label="记住手机号"
              sx={{ color: "#454652" }}
            />
            <button
              type="button"
              className="font-semibold text-primary"
              onClick={() => {
                setForgotPasswordNotice("暂未开放自助找回密码，请联系管理员重置密码。");
              }}
            >
              忘记密码？
            </button>
          </div>

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              minHeight: 64,
              borderRadius: 999,
              bgcolor: "#000666",
              fontSize: 22,
              boxShadow: "0 8px 18px rgba(0,6,102,0.18)",
            }}
          >
            登录
          </Button>

          <Typography className="pt-5 text-center" sx={{ color: "#454652" }}>
            还没有账号？{" "}
            <span className="font-semibold text-primary">请联系管理员添加</span>
          </Typography>
        </Box>
      </Box>
    </main>
  );
}
