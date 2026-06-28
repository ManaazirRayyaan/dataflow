/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT:  "#0A0F1E",
          surface:  "#111827",
          elevated: "#1A2235",
          border:   "#1E2D3D",
        },
        brand: {
          DEFAULT: "#6366F1",
          light:   "#818CF8",
          muted:   "#3730A3",
          glow:    "rgba(99, 102, 241, 0.15)",
        },
        metric: {
          positive: "#10B981",
          warning:  "#F59E0B",
          danger:   "#EF4444",
          info:     "#38BDF8",
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
      transitionProperty: {
        "width":      "width",
        "sidebar":    "width, margin-left",
        "transform":  "transform",
      },
      transitionDuration: {
        "200": "200ms",
        "250": "250ms",
      },
    },
  },
  plugins: [],
};
