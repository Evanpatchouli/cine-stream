import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/s
export default defineConfig((configEnv) =>{
  const env = loadEnv(configEnv.mode, process.cwd())
  return {
    plugins: [react()],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: env.VITE_APP_API_TARGET_URL,
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  root: ".",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  }
});
