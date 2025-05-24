
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        cappalove: {
          peach: "#FDE1D3",
          cream: "#FFF8F0",
          gold: "#E2C792",
          blue: "#D3E4FD",
          darkblue: "#A1C6F7",
          background: "#FFF8F5",
          hover: "#FEF4EF",
          border: "#F4D9CA"
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      backgroundImage: {
        'romantic-pattern': "url('data:image/svg+xml;utf8,<svg width=\"100\" height=\"100\" viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M50 12.5C41.0156 12.5 33.75 19.7656 33.75 28.75C33.75 33.2031 35.5469 37.3438 38.5156 40.2344C30.2344 43.125 25 50.9375 25 60C25 71.0938 34.0625 80 45 80C50.3125 80 55.2344 78.125 59.0625 74.9219C60.3906 76.5625 62.7344 77.5 65 77.5C70.1562 77.5 74.375 73.2812 74.375 68.125C74.375 65.8594 73.5156 63.5156 71.875 62.1875C76.7969 57.1875 78.75 50.5469 76.7969 43.8281C74.8438 37.1094 69.2188 32.1094 62.5 30.8594C60.8594 20.7031 56.0156 12.5 50 12.5Z\" fill=\"%23FDE1D3\" fill-opacity=\"0.2\"/></svg>')"
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
