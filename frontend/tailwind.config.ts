import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: { 950: "#061a34", 900: "#08254a", 800: "#0d315e", 700: "#123d72" },
        brand: { 400: "#38a9f5", 500: "#168af1", 600: "#086bd3" },
      },
      boxShadow: { panel: "0 10px 30px rgba(0, 0, 0, .14)" },
    },
  },
  plugins: [],
};

export default config;
