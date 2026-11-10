import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
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
        lg: "calc(var(--radius) + 4px)",
        md: "var(--radius)",
        sm: "calc(var(--radius) - 2px)",
        DEFAULT: "var(--radius)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.4" }],
        sm: ["0.875rem", { lineHeight: "1.6" }],
        base: ["1rem", { lineHeight: "1.6" }],
        lg: ["1.125rem", { lineHeight: "1.5" }],
        xl: ["1.25rem", { lineHeight: "1.4" }],
        "2xl": ["1.5rem", { lineHeight: "1.3" }],
        "3xl": ["1.875rem", { lineHeight: "1.2" }],
        "4xl": ["2.25rem", { lineHeight: "1.1" }],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
      transitionDuration: {
        "150": "150ms",
        "200": "200ms",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 200ms ease-out",
        "slide-down": "slideDown 200ms ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-subtle": "pulseSubtle 3s ease-in-out infinite",
        "ai-pulse": "aiPulse 1.5s ease-in-out 2",
        "golden-shimmer": "goldenShimmer 3s ease-in-out infinite",
        "golden-pulse-subtle": "goldenPulseSubtle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        pulseSubtle: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        aiPulse: {
          "0%, 100%": {
            boxShadow: "0 0 0 4px rgba(245, 158, 11, 0.15)",
            borderColor: "#F59E0B",
          },
          "50%": {
            boxShadow: "0 0 0 8px rgba(245, 158, 11, 0.3)",
            borderColor: "#FBBF24",
          },
        },
        goldenShimmer: {
          "0%, 100%": {
            borderColor: "#D97706",
            boxShadow: "0 0 0 3px rgba(245, 158, 11, 0.15), 0 0 20px rgba(245, 158, 11, 0.1), inset 0 0 0 1px rgba(251, 191, 36, 0.2)",
          },
          "50%": {
            borderColor: "#FBBF24",
            boxShadow: "0 0 0 4px rgba(251, 191, 36, 0.25), 0 0 30px rgba(251, 191, 36, 0.2), inset 0 0 0 1px rgba(251, 191, 36, 0.4)",
          },
        },
        goldenPulseSubtle: {
          "0%, 100%": {
            borderColor: "#D97706",
            boxShadow: "0 0 0 3px rgba(245, 158, 11, 0.15)",
          },
          "50%": {
            borderColor: "#F59E0B",
            boxShadow: "0 0 0 3px rgba(245, 158, 11, 0.25)",
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
