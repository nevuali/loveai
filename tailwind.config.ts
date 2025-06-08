import type { Config } from "tailwindcss";

const config: Config = {
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
          light: "#8b5cf6",
          medium: "#7c3aed", 
          dark: "#6b21d6",
          darker: "#581c87",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // AI Love Dark Theme Colors
        dark: {
          bg: "#0A0A0F",
          surface: "#12121A",
          elevated: "#1A1A25",
          border: "#242430",
        },
        purple: {
          50: "#faf7ff",
          100: "#f3edff", 
          200: "#e9d8ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7c3aed",
          800: "#6b21d6",
          900: "#581c87",
          950: "#3b0764",
          dark: "#2d1b69",
          darker: "#1e1148",
          darkest: "#120a2e",
        },
        glass: {
          light: "rgba(139, 92, 246, 0.05)",
          medium: "rgba(139, 92, 246, 0.1)",
          dark: "rgba(0, 0, 0, 0.4)",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        'sans': ['Google Sans', 'Roboto', 'system-ui', 'sans-serif'],
        'display': ['Google Sans Display', 'Google Sans', 'Montserrat', 'Inter', 'system-ui', 'sans-serif'],
        'body': ['Google Sans', 'Roboto', 'Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'gemini': ['Google Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s infinite",
        "float": "float 3s ease-in-out infinite",
        "electric-pulse": "electric-pulse 1.5s ease-in-out infinite",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 212, 255, 0.6)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "electric-pulse": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '16px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glass-lg': '0 20px 40px rgba(0, 0, 0, 0.4)',
        'electric': '0 0 20px rgba(0, 212, 255, 0.5)',
        'electric-lg': '0 0 40px rgba(0, 212, 255, 0.7)',
        'neon-blue': '0 0 30px rgba(0, 240, 255, 0.6)',
        'neon-purple': '0 0 30px rgba(168, 85, 247, 0.6)',
      }
    },
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("tailwindcss-animate"),
    function({ addUtilities }: any) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      })
    }
  ],
} satisfies Config;

export default config;
