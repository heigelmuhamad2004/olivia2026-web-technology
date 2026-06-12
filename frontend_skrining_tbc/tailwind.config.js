/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        ink: "#171717",
        body: "#4d4d4d",
        mute: "#888888",
        hairline: "#ebebeb",
        "hairline-strong": "#a1a1a1",
        canvas: "#ffffff",
        "canvas-soft": "#fafafa",
        "canvas-soft-2": "#f5f5f5",
      },
      borderRadius: {
        "pill-sm": "64px",
        pill: "100px",
      },
      keyframes: {
        "marquee-left": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "marquee-right": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0%)" },
        },
        "marquee-vertical": {
          "0%": { transform: "translateY(0%)" },
          "100%": { transform: "translateY(-100%)" },
        },
      },
      animation: {
        "marquee-left": "marquee-left var(--duration,40s) linear infinite",
        "marquee-right": "marquee-right var(--duration,40s) linear infinite",
        "marquee-vertical": "marquee-vertical var(--duration,40s) linear infinite",
      },
    },
  },
  plugins: [],
}
