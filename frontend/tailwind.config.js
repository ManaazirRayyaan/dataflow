/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // DataFlow dark palette
        canvas: {
          DEFAULT: "#0A0F1E",   // Page background
          surface: "#111827",   // Card surfaces
          elevated: "#1A2235",  // Hover / elevated surfaces
          border: "#1E2D3D",    // Subtle borders
        },
        brand: {
          DEFAULT: "#6366F1",   // Indigo — primary accent
          light: "#818CF8",
          muted: "#3730A3",
          glow: "rgba(99, 102, 241, 0.15)",
        },
        metric: {
          positive: "#10B981",  // Emerald — up trends
          warning: "#F59E0B",   // Amber — caution
          danger: "#EF4444",    // Red — negative
          info: "#38BDF8",      // Sky — neutral info
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
        glow: "0 0 20px rgba(99, 102, 241, 0.2)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 1.5s infinite",
        "fade-in": "fadeIn 0.3s ease-out",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(4px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
