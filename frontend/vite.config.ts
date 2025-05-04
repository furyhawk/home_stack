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
  plugins: [react(), TanStackRouterVite()],
  server: {
    allowedHosts: ["dev.lan", "dev.local", "localhost", "dev.lan:5173", "dev.local:5173", "localhost:5173","dev.furyhawk.lol"],
  }
})
