import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f7f5",
          100: "#dcece4",
          500: "#2f6f52",
          600: "#255a42",
          700: "#1c4633",
        },
      },
    },
  },
  plugins: [],
};

export default config;
