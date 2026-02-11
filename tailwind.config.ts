import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
        "border-hover": "hsl(var(--border-hover))",
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
        amazon: {
          DEFAULT: "hsl(var(--amazon))",
          foreground: "hsl(var(--amazon-foreground))",
        },
        // Semantic colors for status indicators
        success: {
          DEFAULT: "hsl(142 76% 36%)", // #22C55E
          light: "hsl(142 71% 45%)",   // #4ADE80
        },
        warning: {
          DEFAULT: "hsl(27 96% 61%)",  // #FB923C
          light: "hsl(32 95% 64%)",    // #FDBA74
        },
        error: {
          DEFAULT: "hsl(0 84% 60%)",   // #EF4444
          light: "hsl(0 91% 71%)",     // #F87171
        },
        info: {
          DEFAULT: "hsl(217 91% 60%)", // #3B82F6
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "pulse-subtle": {
          "0%, 100%": {
            transform: "scale(1)",
          },
          "50%": {
            transform: "scale(1.02)",
          },
        },
        "slide-up-bounce": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "60%": { transform: "translateY(-8px)", opacity: "1" },
          "80%": { transform: "translateY(4px)" },
          "100%": { transform: "translateY(0)" },
        },
        "success-check": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "70%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(1.1)" },
        },
        "pulse-live": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 0 0 hsla(180, 100%, 50%, 0.7)",
          },
          "50%": {
            opacity: "0.7",
            boxShadow: "0 0 8px 2px hsla(180, 100%, 50%, 0.4)",
          },
        },
        "ping-slow": {
          "0%": {
            transform: "scale(1)",
            opacity: "0.8",
          },
          "75%, 100%": {
            transform: "scale(2)",
            opacity: "0",
          },
        },
        "filter-activate": {
          "0%": {
            transform: "scale(1)",
          },
          "50%": {
            transform: "scale(1.03)",
          },
          "100%": {
            transform: "scale(1)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        "slide-up-bounce": "slide-up-bounce 0.5s ease-out",
        "success-check": "success-check 1.5s ease-out forwards",
        "pulse-live": "pulse-live 2s ease-in-out infinite",
        "ping-slow": "ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "filter-activate": "filter-activate 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("tailwind-scrollbar")],
} satisfies Config;
