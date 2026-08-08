import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Dev server forwards /api/* to the local Express server so the browser
    // sees one origin — the session cookie needs no CORS ceremony. In
    // production Vercel does the same via rewrites (vercel.json).
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
