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
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(120deg, #E0218A 0%, #9B2FB4 45%, #16A9E8 100%)",
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
