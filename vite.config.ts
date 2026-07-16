import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  // 无 VITE_ 前缀的密钥只在这里（Node 侧）可见，不会进浏览器 bundle
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["mascot.png"],
        manifest: {
          name: "海螺咖啡馆 · 数学探险",
          short_name: "海螺咖啡馆",
          description: "海底探险主题的数学学习游戏",
          theme_color: "#0F3050",
          background_color: "#FFF4E6",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          icons: [
            { src: "/mascot.png", sizes: "192x192", type: "image/png" },
            { src: "/mascot.png", sizes: "512x512", type: "image/png" },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts",
                expiration: {
                  maxEntries: 4,
                  maxAgeSeconds: 365 * 24 * 60 * 60,
                },
              },
            },
          ],
        },
      }),
    ],
    server: {
      port: 5173,
      proxy: {
        "/api/deepseek": {
          target: "https://api.deepseek.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/deepseek/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              const key = env.DEEPSEEK_API_KEY;
              if (key) proxyReq.setHeader("Authorization", `Bearer ${key}`);
            });
          },
        },
        // TTS 走本地代理服务器（npm run dev:server），火山凭据只在服务端
        "/api/tts": {
          target: "http://localhost:3456",
          changeOrigin: true,
        },
      },
    },
  };
});
