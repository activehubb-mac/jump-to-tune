import type { Config } from "tailwindcss";

export default {
  // darkMode: ["class"], // Removed - single light theme
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
    screens: {
      xs: "475px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
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
        // JumTunes custom colors
        neon: "hsl(var(--neon-glow))",
        electric: "hsl(var(--electric-blue))",
        "deep-purple": "hsl(var(--deep-purple))",
        glass: "hsl(var(--glass))",
        "glass-border": "hsl(var(--glass-border))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "ken-burns": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.06)" },
        },
        "ken-burns-slow": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
        "ken-burns-cinematic": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
        },
        "avatar-breathe": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        "avatar-breathe-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        "avatar-glow": {
          "0%, 100%": { boxShadow: "0 0 8px hsl(var(--primary) / 0.2)" },
          "50%": { boxShadow: "0 0 20px hsl(var(--primary) / 0.4)" },
        },
        "avatar-glow-strong": {
          "0%, 100%": { boxShadow: "0 0 12px hsl(var(--primary) / 0.3)" },
          "50%": { boxShadow: "0 0 28px hsl(var(--primary) / 0.55)" },
        },
        "avatar-glow-cinematic": {
          "0%, 100%": { boxShadow: "0 0 15px hsl(var(--primary) / 0.3), 0 0 30px hsl(var(--accent) / 0.15)" },
          "50%": { boxShadow: "0 0 35px hsl(var(--primary) / 0.5), 0 0 50px hsl(var(--accent) / 0.25)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "ken-burns": "ken-burns 6s ease-in-out infinite",
        "ken-burns-slow": "ken-burns-slow 8s ease-in-out infinite",
        "ken-burns-cinematic": "ken-burns-cinematic 10s ease-in-out infinite",
        "avatar-breathe": "avatar-breathe 4s ease-in-out infinite",
        "avatar-breathe-slow": "avatar-breathe-slow 6s ease-in-out infinite",
        "avatar-glow": "avatar-glow 3s ease-in-out infinite",
        "avatar-glow-strong": "avatar-glow-strong 3s ease-in-out infinite",
        "avatar-glow-cinematic": "avatar-glow-cinematic 4s ease-in-out infinite",
      },
      backgroundSize: {
        "200%": "200% 200%",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
