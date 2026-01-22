import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react({
        // Enable Fast Refresh for better development experience
        fastRefresh: true,
        // Use Babel for JSX transformation
        babel: {},
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@components": path.resolve(__dirname, "./src/client/components"),
        "@layouts": path.resolve(__dirname, "./src/client/layouts"),
        "@pages": path.resolve(__dirname, "./src/client/pages"),
        "@styles": path.resolve(__dirname, "./src/client/styles"),
        "@utils": path.resolve(__dirname, "./src/client/utils"),
        "@hooks": path.resolve(__dirname, "./src/hooks"),
        "@types": path.resolve(__dirname, "./src/types"),
      },
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
      dedupe: ["react", "react-dom"],
    },
    server: {
      port: parseInt(env.VITE_PORT || "3000"),
      host: true,
      open: false,
      strictPort: false,
      hmr: {
        overlay: true,
      },
      watch: {
        usePolling: false,
        interval: 100,
      },
      proxy: {
        // Proxy API requests to the Hono server during development
        "/api": {
          target: `http://localhost:${env.PORT || "3001"}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: "dist/client",
      emptyOutDir: true,
      target: "esnext",
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: mode === "production",
          drop_debugger: mode === "production",
        },
      },
      sourcemap: mode === "development",
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks for better caching
            "react-vendor": ["react", "react-dom"],
            "ui-vendor": [
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-scroll-area",
              "@radix-ui/react-separator",
              "@radix-ui/react-switch",
              "@radix-ui/react-tooltip",
            ],
            "icons-vendor": ["@react-symbols/icons", "react-icons"],
            "markdown-vendor": [
              "unified",
              "remark-parse",
              "remark-rehype",
              "rehype-stringify",
              "rehype-highlight",
              "shiki",
            ],
          },
          chunkFileNames: "assets/js/[name]-[hash].js",
          entryFileNames: "assets/js/[name]-[hash].js",
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || "";
            if (name.endsWith(".css")) {
              return "assets/css/[name]-[hash][extname]";
            }
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(name)) {
              return "assets/images/[name]-[hash][extname]";
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(name)) {
              return "assets/fonts/[name]-[hash][extname]";
            }
            return "assets/[name]-[hash][extname]";
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: false,
    },
    preview: {
      port: parseInt(env.VITE_PORT || "3000"),
      host: true,
      open: false,
      strictPort: false,
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "@radix-ui/react-dialog",
        "@radix-ui/react-dropdown-menu",
        "@radix-ui/react-scroll-area",
        "@radix-ui/react-separator",
        "@radix-ui/react-switch",
        "@radix-ui/react-tooltip",
        "react-icons",
        "@react-symbols/icons",
      ],
      exclude: [],
    },
    css: {
      modules: {
        localsConvention: "camelCase",
      },
      devSourcemap: true,
    },
    define: {
      // Expose environment variables to the client
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || "0.1.0"),
      __DEV__: mode === "development",
    },
  };
});