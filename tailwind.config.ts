import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pulled from the LYTRIX CONSULT logo
        navy: {
          DEFAULT: "#0A4D8C",
          deep: "#083763",
        },
        cyan: {
          brand: "#16A9E8",
        },
        magenta: {
          brand: "#E0218A",
        },
        ink: {
          DEFAULT: "#050B18", // near-black navy background
          soft: "#0A1424",
          card: "#0E1A2E",
        },
        // Light-theme palette for the POS demo app shell (/demo/pos).
        pos: {
          bg: "#F6F8FB", // page canvas behind the cards
          surface: "#FFFFFF",
          border: "#E8EDF4",
          muted: "#6B7A90", // secondary text
          heading: "#0F1B2D",
          brand: "#0FA98C", // pharmacy teal — primary action colour
          "brand-dark": "#0B8A72",
          "brand-soft": "#E6F7F3",
          accent: "#4C6FFF", // secondary/informational
          "accent-soft": "#EDF1FF",
          warn: "#F59E0B",
          "warn-soft": "#FEF4E6",
          danger: "#EF4759",
          "danger-soft": "#FDECEE",
          ok: "#16B364",
          "ok-soft": "#E7F8EF",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        // POS app shell — Inter, with tabular figures for aligned currency columns.
        pos: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(120deg, #E0218A 0%, #9B2FB4 45%, #16A9E8 100%)",
      },
      boxShadow: {
        // Soft, layered elevation for POS cards — no harsh drop shadows.
        card: "0 1px 2px rgba(15,27,45,0.04), 0 4px 16px rgba(15,27,45,0.05)",
        "card-hover": "0 2px 4px rgba(15,27,45,0.06), 0 12px 32px rgba(15,27,45,0.09)",
        pop: "0 8px 40px rgba(15,27,45,0.14)",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        "marquee-slow": "marquee 70s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
