import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";
import { nitro } from "nitro/vite";   // ← Changed to named import

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },

  vite: {
    plugins: [
      nitro(),   // ← Nitro plugin for Vercel / SSR

      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        strategies: "generateSW",

        manifest: {
          name: "My OneApp",
          short_name: "My OneApp",
          description: "Send money, pay bills, withdraw cash - all in one app",
          theme_color: "#000000",
          background_color: "#0a0a0a",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          scope: "/",

          categories: ["finance", "business", "utilities"],

          shortcuts: [
            {
              name: "Send Money",
              short_name: "Send",
              url: "/send-money",
              icons: [{ src: "/mpesa-icon.png", sizes: "192x192" }],
            },
            {
              name: "Statements",
              short_name: "History",
              url: "/statements",
              icons: [{ src: "/mpesa-icon.png", sizes: "192x192" }],
            },
          ],

          icons: [
            {
              src: "/mpesa-icon.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/mpesa-icon.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },

        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,webp}"],

          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24,
                },
              },
            },
            {
              urlPattern: ({ request }) =>
                ["image", "font", "style", "script"].includes(request.destination),
              handler: "CacheFirst",
              options: {
                cacheName: "static-assets",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
          ],

          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api/],
        },

        devOptions: {
          enabled: true,
          type: "module",
          suppressWarnings: true,
          navigateFallback: "index.html",
        },
      }),
    ],
  },
});