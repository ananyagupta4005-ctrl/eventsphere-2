/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        bg: {
          primary: "#0A0A0F",
          secondary: "#13131C",
          tertiary: "#1F1F2E",
        },
        accent: {
          purple: "#7C5CFF",
          teal: "#2DD4BF",
          coral: "#FF6B5B",
        },
        text: {
          primary: "#F5F5F7",
          secondary: "#8A8A9E",
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
