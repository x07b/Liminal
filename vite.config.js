import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

function communityWall() {
  const attach = async (server) => {
    const { createPortal } = await import("./server/portal.js");
    const store = createPortal({
      dataDir: resolve(process.env.LIMINAL_DATA_DIR || "data"),
    });
    server.middlewares.use(store.handler);
    server.httpServer?.once("close", () => store.close());
  };
  return {
    name: "liminal-community-wall",
    configureServer: attach,
    configurePreviewServer: attach,
  };
}
export default defineConfig({
  build: { outDir: "dist" },
  plugins: [react(), communityWall()],
  server: {
    fs: {
      deny: [
        ".env",
        ".env.*",
        "*.{crt,pem}",
        "**/.git/**",
        "**/data/**",
        "**/work/**",
        "**/server/**",
      ],
    },
  },
});
