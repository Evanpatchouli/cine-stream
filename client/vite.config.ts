import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig((configEnv) => {
  const env = loadEnv(configEnv.mode, process.cwd());
  const port = Number(env.VITE_APP_PORT || "5211");
  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: port,
    },
    root: ".",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
