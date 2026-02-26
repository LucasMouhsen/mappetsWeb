import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API_TARGET = "http://api.mappets.com.ar:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: API_TARGET,
        changeOrigin: true
      },
      "/public": {
        target: API_TARGET,
        changeOrigin: true
      }
    }
  }
});
