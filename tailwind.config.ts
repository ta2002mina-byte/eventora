import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          DEFAULT: "#C81E6B",
          50: "#FDF1F6",
          100: "#FBDCE9",
          200: "#F6B8D2",
          300: "#F08FB8",
          400: "#E85C9B",
          500: "#DC2E80",
          600: "#C81E6B",
          700: "#A81659",
          800: "#7D1043",
          900: "#52092C",
        },
        lavender: {
          DEFAULT: "#F6BAD3",
          50: "#FFF5F9",
          100: "#FDEBF2",
          200: "#FBD9E6",
          300: "#F6BAD3",
          400: "#EF93B9",
          500: "#E56A9E",
        },
        gold: {
          DEFAULT: "#F2A65A",
          50: "#FEF6EC",
          100: "#FCE8CE",
          200: "#F8D1A0",
          300: "#F5B978",
          400: "#F2A65A",
          500: "#E88A32",
          600: "#C06D1F",
        },
        warmwhite: "#FDF7FA",
        charcoal: {
          DEFAULT: "#1B1B3A",
          600: "#3D3D5C",
          400: "#6B6B8D",
        },
        border: {
          DEFAULT: "#F0DCE6",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1rem",
        pill: "999px",
      },
      boxShadow: {
        soft: "0 4px 20px -4px rgba(200, 30, 107, 0.14)",
        softer: "0 2px 10px -2px rgba(200, 30, 107, 0.10)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "toast-in": "toast-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
