import path from "node:path"
import { TanStackRouterVite } from "@tanstack/router-vite-plugin"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react({
      // Enable JSX runtime for React 19
      jsxRuntime: "automatic",
    }),
    TanStackRouterVite(),
  ],
  server: {
    allowedHosts: [
      "dev.lan",
      "dev.local",
      "localhost",
      "localhost:5173",
      "dev.lan:5173",
      "dev.local:5173",
      "localhost:5173",
      "localhost:5175",
      "dev.furyhawk.lol",
    ],
    proxy: {
      "/fury-api": {
        target: "https://api.furyhawk.lol",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/fury-api/, ""),
      },
    },
  },
  build: {
    // Enable tree-shaking by default
    rollupOptions: {
      output: {
        // Split vendor code into separate chunks for better caching
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "@tanstack/react-query",
            "@chakra-ui/react",
          ],
          leaflet: ["leaflet", "react-leaflet"],
        },
      },
    },
  },
});
