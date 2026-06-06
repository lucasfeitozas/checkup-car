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
      fontFamily: {
        jakarta: [
          "PlusJakartaSans_400Regular",
          "PlusJakartaSans_500Medium",
          "PlusJakartaSans_600SemiBold",
          "PlusJakartaSans_700Bold",
        ],
      },
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        text: "var(--color-text)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
      },
    },
  },
  plugins: [],
};
