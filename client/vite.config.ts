import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/scores": "http://localhost:8080",
      "/snapshots": "http://localhost:8080",
      "/karma": "http://localhost:8080",
    },
  },
});
