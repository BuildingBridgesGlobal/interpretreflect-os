import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      boxShadow: {
        ambient: "0 18px 60px rgba(15,23,42,0.8)",
      },
    },
  },
  plugins: [],
} as Config;
