import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 5173,
  },
  ssr: {
    noExternal: ["@mui/*", "@nest-mono/ui"],
  },
  plugins: [tsconfigPaths(), tanstackStart(), viteReact()],
});
