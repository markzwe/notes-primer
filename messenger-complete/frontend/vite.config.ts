import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5175,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:3002",
      "/socket.io": { target: "http://127.0.0.1:3002", ws: true },
    },
  },
});
