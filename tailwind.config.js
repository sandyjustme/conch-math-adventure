/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"ZCOOL KuaiLe"', "sans-serif"],
        body: ['"Noto Sans SC"', "sans-serif"],
      },
      colors: {
        ocean: {
          sky: "#BFEBFF",
          surface: "#0B4D6E",
          shallow: "#1B7FA8",
          deep: "#043352",
        },
        shell: {
          light: "#FFF8E7",
          DEFAULT: "#F5A623",
          dark: "#D4891A",
        },
        cafe: {
          bg: "#FAF7F2",
          wood: "#8B6914",
          warm: "#FEF3C7",
        },
      },
    },
  },
  plugins: [],
};
