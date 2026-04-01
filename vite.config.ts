/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    optimizeDeps: {
        include: ["globe.gl", "three", "satellite.js"],
    },
    server: {
        proxy: {
            "/api/celestrak": {
                target: "https://celestrak.org",
                changeOrigin: true,
                rewrite: (p) =>
                    p.replace(/^\/api\/celestrak/, "/NORAD/elements"),
            },
        },
    },
    test: {
        globals: true,
        environment: "node",
    },
});
