import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bone: "#F4EFE6",
        oat: "#E5DCC8",
        vellum: "#FAF6EE",
        deepInk: "#1A1814",
        dawn: "#C2906B",
      },
      fontFamily: {
        voice: ["var(--font-voice)", "Georgia", "serif"],
        ui: ["var(--font-ui)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}

export default config
