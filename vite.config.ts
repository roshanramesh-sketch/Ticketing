import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const plugins: Plugin[] = [react()];

  // 🚨 IMPORTANT:
  // Only register the Express plugin in dev (vite serve)
  // This prevents Vite/esbuild from resolving server files during `vite build`
  if (command === "serve") {
    plugins.push(expressPlugin());
  }

  return {
    server: {
      host: "0.0.0.0",
      port: 8080,
      fs: {
        allow: ["./client", "./shared"],
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
      },
    },
    build: {
      outDir: "dist/spa",
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  };
});

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    configureServer: async (server) => {
      // This import will ONLY ever run in dev mode
      // It will NEVER be evaluated during `vite build`
      const { createServer } = await import(
        path.resolve(__dirname, "server/index.ts")
      );

      const app = createServer();

      // Mount Express app for /api routes
      server.middlewares.use(app);
    },
  };
}

