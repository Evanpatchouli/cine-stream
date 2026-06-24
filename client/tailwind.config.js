import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#000666",
        secondary: "#4355b9",
        background: "#f8f9fa",
        surface: "#f8f9fa",
        "surface-container": "#edeeef",
        "surface-container-low": "#f3f4f5",
        "surface-container-lowest": "#ffffff",
        "surface-variant": "#e1e3e4",
        "on-surface": "#191c1d",
        "on-surface-variant": "#454652",
        outline: "#767683",
        "outline-variant": "#c6c5d4",
        error: "#ba1a1a",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      spacing: {
        "container-padding": "16px",
        "section-gap": "32px",
        "element-gap": "12px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        md3: "0 2px 8px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [forms],
};
