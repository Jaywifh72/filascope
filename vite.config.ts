import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
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
      includeAssets: ["favicon.png", "og-image.png"],
      manifest: {
        name: "FilaScope - 3D Printer Filament Database",
        short_name: "FilaScope",
        description: "Explore thousands of 3D printer filaments with detailed technical specs, printer compatibility, and transmissivity data.",
        theme_color: "#0A0C10",
        background_color: "#0A0C10",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        categories: ["utilities", "productivity", "shopping"],
        icons: [
          {
            src: "/pwa-icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable any"
          },
          {
            src: "/pwa-icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable any"
          }
        ],
        shortcuts: [
          {
            name: "Browse Filaments",
            short_name: "Filaments",
            url: "/",
            icons: [{ src: "/pwa-icons/icon-96x96.png", sizes: "96x96" }]
          },
          {
            name: "Compare Materials",
            short_name: "Compare",
            url: "/compare",
            icons: [{ src: "/pwa-icons/icon-96x96.png", sizes: "96x96" }]
          },
          {
            name: "Browse Deals",
            short_name: "Deals",
            url: "/deals",
            icons: [{ src: "/pwa-icons/icon-96x96.png", sizes: "96x96" }]
          }
        ]
      },
      workbox: {
        // Cache strategies for different resource types
        runtimeCaching: [
          {
            // Cache API responses (Supabase data)
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache images
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            // Cache self-hosted fonts
            urlPattern: /\/fonts\/.*\.woff2$/,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            // Cache static assets
            urlPattern: /\.(?:js|css)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
        // Skip waiting and claim clients immediately
        skipWaiting: true,
        clientsClaim: true,
        // Clean up old caches
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: true,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Recharts — only loaded when charts are needed
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-") || id.includes("node_modules/victory-vendor")) {
            return "recharts";
          }
          // Radix UI primitives
          if (id.includes("node_modules/@radix-ui")) {
            return "radix-ui";
          }
          // Supabase client
          if (id.includes("node_modules/@supabase")) {
            return "supabase";
          }
          // React core
          if (id.includes("node_modules/react-dom")) {
            return "react-dom";
          }
          // Router
          if (id.includes("node_modules/react-router")) {
            return "react-router";
          }
          // Tanstack Query
          if (id.includes("node_modules/@tanstack")) {
            return "tanstack";
          }
        },
      },
    },
  },
}));
