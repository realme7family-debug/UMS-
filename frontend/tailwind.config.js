/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "Segoe UI", "sans-serif"],
      },
      colors: {
        // accent red
        brand: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
        },
        // sidebar / hero navy
        navy: {
          700: "#1e2a5a",
          800: "#14204a",
          900: "#0b1534",
          950: "#070e24",
        },
        ink: "#0f172a",
        page: "#f4f6fb",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,.04), 0 4px 16px rgba(15,23,42,.06)",
      },
    },
  },
  plugins: [],
};
