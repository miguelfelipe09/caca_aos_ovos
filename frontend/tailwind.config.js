/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#38BDF8", // light blue
        accent: "#0EA5E9",
        success: "#22C55E",
        surface: "#0B1220",
      },
    },
  },
  plugins: [],
};
