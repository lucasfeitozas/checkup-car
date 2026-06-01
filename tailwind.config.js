/** @type {import('tailwindcss').Config} */
module.exports = {
  // Especifique APENAS as pastas do seu código fonte.
  // Nunca use "./**/*.ts" pois ele vai ler pastas de cache como .expo/ e travar em 99%
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        primary: "var(--primary)",
        accent: "var(--accent)",
        text: "var(--text)",
        muted: "var(--muted)",
        border: "var(--border)",
      },
    },
  },
  plugins: [],
};
