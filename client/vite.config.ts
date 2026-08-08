import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Dev server forwards /api/* to the local Express server so the browser
    // sees one origin — the session cookie needs no CORS ceremony. In
    // production Vercel does the same via rewrites (vercel.json).
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
