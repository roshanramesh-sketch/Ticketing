import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    // ✅ THIS is the SSR entry in Vite 6/7
    ssr: path.resolve(__dirname, "server/node-build.ts"),

    outDir: "dist/server",
    target: "node22",
    minify: false,
    sourcemap: true,
    emptyOutDir: true,

    rollupOptions: {
      external: [
        // Node built-ins
        "fs",
        "path",
        "url",
        "http",
        "https",
        "os",
        "crypto",
        "stream",
        "util",
        "events",
        "buffer",
        "querystring",
        "child_process",

        // External deps (runtime provided)
        "express",
        "cors",
      ],
      output: {
        format: "es",
        entryFileNames: "server.mjs",
      },
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },

  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

