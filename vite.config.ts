import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [
    // Must come before react()
    tanstackStart({
      server: {
        entry: "server",
        // Deploy target: Vercel serverless functions
        // Outputs to .vercel/output/ which Vercel auto-detects.
        preset: "vercel",
      },
    }),
    viteReact(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
