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
  plugins: [react()],
  build: {
    // Improves build performance and error handling
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  server: {
    allowedHosts: [
      "dev.lan",
      "dev.local",
      "localhost",
      "dev.lan:5173",
      "dev.local:5173",
      "localhost:5173",
      "localhost:5175",
      "dev.furyhawk.lol",
    ],
  },
});
