/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // New light-first design system
        background: 'hsl(0 0% 100%)', // Pure white
        foreground: 'hsl(222.2 47.4% 11.2%)', // Dark text for readability
        
        // Card and surface colors
        card: {
          DEFAULT: 'hsl(0 0% 100%)', // White cards
          foreground: 'hsl(222.2 47.4% 11.2%)',
        },
        popover: {
          DEFAULT: 'hsl(0 0% 100%)',
          foreground: 'hsl(222.2 47.4% 11.2%)',
        },
        
        // Primary brand color - professional blue
        primary: {
          DEFAULT: 'hsl(221.2 83.2% 53.3%)', // Professional blue #3B82F6
          foreground: 'hsl(210 40% 98%)', // Light text on primary
          50: 'hsl(214.3 31.8% 91.4%)',
          100: 'hsl(214.3 31.8% 91.4%)',
          500: 'hsl(221.2 83.2% 53.3%)',
          600: 'hsl(221.2 83.2% 43.3%)',
          900: 'hsl(221.2 83.2% 23.3%)',
        },
        
        // Secondary colors - subtle grays
        secondary: {
          DEFAULT: 'hsl(210 40% 96%)', // Very light gray
          foreground: 'hsl(222.2 47.4% 11.2%)', // Dark text
        },
        
        // Muted colors for subtle elements
        muted: {
          DEFAULT: 'hsl(210 40% 96%)', // Light gray backgrounds
          foreground: 'hsl(215.4 16.3% 46.9%)', // Muted text
        },
        
        // Accent color - complementary purple
        accent: {
          DEFAULT: 'hsl(262.1 83.3% 57.8%)', // Purple accent
          foreground: 'hsl(210 40% 98%)',
        },
        
        // Status colors - semantic meaning
        destructive: {
          DEFAULT: 'hsl(0 84.2% 60.2%)', // Clean red
          foreground: 'hsl(210 40% 98%)',
        },
        success: {
          DEFAULT: 'hsl(142.1 76.2% 36.3%)', // Clean green  
          foreground: 'hsl(210 40% 98%)',
        },
        warning: {
          DEFAULT: 'hsl(32.1 94.6% 43.7%)', // Clean orange
          foreground: 'hsl(210 40% 98%)',
        },
        
        // Border colors - subtle and clean
        border: 'hsl(214.3 31.8% 91.4%)', // Light border
        input: 'hsl(214.3 31.8% 91.4%)', // Input borders
        ring: 'hsl(221.2 83.2% 53.3%)', // Focus rings use primary
        
        // Financial data colors - maintain functionality
        financial: {
          green: 'hsl(142.1 76.2% 36.3%)', // Positive values
          red: 'hsl(0 84.2% 60.2%)', // Negative values
          amber: 'hsl(32.1 94.6% 43.7%)', // Warnings
        },
        
        // Legacy brand colors for gradual transition
        brand: {
          blue: 'hsl(221.2 83.2% 53.3%)',
          purple: 'hsl(262.1 83.3% 57.8%)',
          indigo: 'hsl(243.4 75.4% 58.6%)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        display: ['SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'fade-in-down': 'fadeInDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 1s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(91, 124, 255, 0.3)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 30px rgba(91, 124, 255, 0.5)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 40px rgba(0, 0, 0, 0.08)',
        'soft-md': '0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 50px rgba(0, 0, 0, 0.1)',
        'soft-lg': '0 10px 15px rgba(0, 0, 0, 0.05), 0 20px 60px rgba(0, 0, 0, 0.12)',
        'glow-blue': '0 0 20px rgba(91, 124, 255, 0.3)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
        'hover-blue': '0 8px 30px rgba(91, 124, 255, 0.15)',
        'hover-purple': '0 8px 30px rgba(139, 92, 246, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
