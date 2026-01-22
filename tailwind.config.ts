import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/client/**/*.{js,ts,jsx,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3B82F6",
          light: "#60A5FA",
          dark: "#2563EB",
        },
        background: {
          light: "#F8FAFC",
          dark: "#0F172A",
        },
        sidebar: {
          light: "#FFFFFF",
          dark: "#1E293B",
        },
        border: {
          light: "#E2E8F0",
          dark: "#334155",
        },
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      zIndex: {
        base: 0,
        sidebar: 10,
        header: 20,
        search: 50,
        toast: 60,
      },
    },
  },
  plugins: [],
};

export default config;