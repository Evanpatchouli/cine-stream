import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/s
export default defineConfig((configEnv) => {
  const env = loadEnv(configEnv.mode, process.cwd());
  const port = Number(env.VITE_APP_PORT || "5210");
  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: port,
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
  };
});
