import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icons/*.png", "icons/*.ico"],
      manifest: {
        name: "Study Buddy Hub",
        short_name: "StudyBuddy",
        description: "Personal A-Level exam preparation dashboard",
        start_url: "/",
        display: "standalone",
        background_color: "#0f172a",
        theme_color: "#1765a3",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-310.png", sizes: "310x310", type: "image/png" }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: "/",
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
