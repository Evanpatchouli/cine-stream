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
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { useAuthStore } from "@/stores/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await login(phone, password);
    navigate("/hall", { replace: true });
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
            type="password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockRoundedIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end">
                    <VisibilityOffRoundedIcon />
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
              control={<Checkbox color="primary" />}
              label="记住我"
              sx={{ color: "#454652" }}
            />
              <button type="button" className="font-semibold text-primary">
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
