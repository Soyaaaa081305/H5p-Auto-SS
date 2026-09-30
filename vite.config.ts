import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "development-csp",
      apply: "serve",
      transformIndexHtml: (html) =>
        html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, ""),
    },
  ],
});
