import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          DEFAULT: "#2E4A3D", // deep outfield green
          dark: "#1B2E25",
          light: "#4A6B57",
        },
        stumps: "#EDE6D6", // cream, like a worn cricket ball seam / pitch dust
        scoreboard: "#D98E2B", // amber, like an old scoreboard digit
        ink: "#161A17",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
    },
  },
  plugins: [],
};
export default config;
