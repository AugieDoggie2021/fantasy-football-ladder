import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kelly: {
          base: "#00FF66",
          neon: "#6BFFB3",
          soft: "#00CC55",
        },
        turf: {
          dark: "#020812",
          mid: "#04191A",
        },
        "text-offwhite": "#E6F7EE",
        "relegation-red": {
          DEFAULT: "#FF1744",
          neon: "#FF4F7B",
        },
        "neutral-grey": "#4C5A60",
      },
      borderRadius: {
        card: "16px",
        badge: "20px",
      },
      boxShadow: {
        "neon-green-soft": "0 0 12px #00CC55",
        "neon-green-strong": "0 0 20px #00FF66",
        "neon-red-soft": "0 0 12px #FF1744",
        "neon-red-strong": "0 0 20px #FF4F7B",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
    },
  },
  plugins: [],
};
export default config;

