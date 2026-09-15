/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta "Archivo Automotor Verificado"
        'paper': '#F4F4F5',
        'ink': '#09090B',
        'border': '#3F3F46',
        'oxide-red': '#C2410C',
        'archive-green': '#166534',

        // Paleta "auto-*" (Placa Técnica / dark mode) — convive con la
        // paleta "Archivo" (paper/ink/oxide-red) de arriba. Se restauran
        // estos tokens porque siguen en uso activo en ~90 archivos de
        // src/* (Footer, WishlistButton, Badge, SearchClient, chips/badges
        // sobre foto, overlays oscuros, etc.) aunque no formen parte del
        // rediseño "Archivo Automotor" de la home. Ver commit 7d0afcb7
        // para el detalle histórico de esta paleta.
        'auto-dark': '#09090B',
        'auto-darker': '#000000',
        'auto-surface': '#27272A',
        'auto-border': '#3F3F46',
        'auto-text': '#F4F4F5',
        'auto-text-secondary': '#A1A1AA',
        'auto-accent': '#C2410C',
        'auto-accent-strong': '#C2410C',
        'auto-accent-orange': '#C2410C',
        'auto-accent-warning': '#166534',
        'auto-gold': '#C2410C',
        
        // Colores neutrales derivados
        neutral: {
          50: '#FCFAFF',
          100: '#18181B',
          200: '#27272A',
          300: '#3F3F46',
          400: '#71717A',
          500: '#A1A1AA',
          600: '#A1A1AA',
          700: '#A1A1AA',
          800: '#27272A',
          900: '#18181B',
          950: '#09090B',
        },
        
        // Colores de superficie
        'surface-page': '#F4F4F5',
        'surface-alt': '#27272A',
        'surface-card': '#FFFFFF',
        'surface-card-hover': '#18181B',
        'surface-elevated': '#FFFFFF',
        'surface-input': '#FFFFFF',
        'surface-header': '#F4F4F5',
        'surface-drawer': '#FFFFFF',
        'surface-chip': '#FFFFFF',
        'inverse': '#09090B',
        'edge': '#3F3F46',
        'edge-strong': '#71717A',
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
        serif: [
          'var(--font-serif)',
          'Georgia',
          'Times New Roman',
          'serif',
        ],
        display: [
          'var(--font-display)',
          'var(--font-serif)',
          'Georgia',
          'serif',
        ],
        mono: [
          'var(--font-mono)',
          '"Fira Code"',
          '"Courier New"',
          'monospace',
        ],
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(20, 17, 12, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(20, 17, 12, 0.1)',
        'md': '0 4px 6px -1px rgba(20, 17, 12, 0.1)',
        'lg': '0 10px 15px -3px rgba(20, 17, 12, 0.1)',
        'xl': '0 20px 25px -5px rgba(20, 17, 12, 0.1)',
        'auto-sm': '0 1px 2px rgba(0, 0, 0, 0.5)',
        'auto-md': '0 4px 6px rgba(0, 0, 0, 0.6)',
        'auto-lg': '0 10px 15px rgba(0, 0, 0, 0.7)',
        'auto-xl': '0 20px 25px rgba(0, 0, 0, 0.8)',
      },
      letterSpacing: {
        'tightest': '-0.04em',
        'tighter': '-0.02em',
        'tight': '-0.01em',
        'normal': '0em',
        'wide': '0.02em',
        'wider': '0.05em',
        'widest': '0.1em',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      aspectRatio: {
        'square': '1 / 1',
        'video': '16 / 9',
        '4/5': '4 / 5',
        '5/4': '5 / 4',
        '3/2': '3 / 2',
        '2/3': '2 / 3',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
