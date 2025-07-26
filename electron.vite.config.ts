import { resolve } from "path"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        external: ["@aws-sdk/client-sso-oidc"],
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    build: {
      rollupOptions: {
        input: {
          launcher: resolve(__dirname, "src/renderer/launcher.html"),
          mfaCache: resolve(__dirname, "src/renderer/mfaCache.html"),
          tabs: resolve(__dirname, "src/renderer/tabs.html"),
          preferences: resolve(__dirname, "src/renderer/preferences.html"),
        },
      },
    },
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
      },
    },
    plugins: [react()],
  },
})
