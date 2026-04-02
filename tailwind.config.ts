import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#141211",
          secondary: "#5C5750",
          muted: "#9B9590",
          ghost: "#C8C3BC",
        },
        paper: {
          DEFAULT: "#F8F6F3",
          warm: "#F0EDE8",
          deep: "#E6E2DC",
        },
        surface: "#FFFFFF",
        accent: {
          DEFAULT: "#1B6B4F",
          deep: "#0E4A36",
          glow: "#D6EFE4",
          wash: "#EEFAF4",
        },
        negative: "#C44D2B",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        xl: "12px",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "paywall-exit": {
          from: { opacity: "1", transform: "translateY(0) scale(1)" },
          to: { opacity: "0", transform: "translateY(10px) scale(0.97)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
        "hero-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.4s ease both",
        "slide-down": "slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "paywall-exit":
          "paywall-exit 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
        spin: "spin 0.8s linear infinite",
        "hero-float": "hero-float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
