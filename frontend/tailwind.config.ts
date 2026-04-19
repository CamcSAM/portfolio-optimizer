import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#C41230",
          "deep-blue": "#1B3A6B",
          "mid-blue": "#2B5BA8",
          "light-red": "#FEF2F2",
          "light-blue": "#EFF6FF",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
