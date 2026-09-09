import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import Pages from "vite-plugin-pages";

export default defineConfig({
  envDir: "../../",

  plugins: [
    react(),
    tailwindcss(),

    Pages({
      dirs: "src/pages/public",
      moduleId: "~public-pages",
      resolver: "react",
    }),

    Pages({
      dirs: "src/pages/authenticated",
      moduleId: "~authenticated-pages",
      resolver: "react",
    }),
  ],
});
