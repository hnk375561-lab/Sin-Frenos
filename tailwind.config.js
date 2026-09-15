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
        'paper': '#F6F3FF',
        'ink': '#171130',
        'border': '#E0D6F2',
        'oxide-red': '#FF2E88',
        'archive-green': '#C7F000',

        // Paleta "auto-*" (Placa Técnica / dark mode) — convive con la
        // paleta "Archivo" (paper/ink/oxide-red) de arriba. Se restauran
        // estos tokens porque siguen en uso activo en ~90 archivos de
        // src/* (Footer, WishlistButton, Badge, SearchClient, chips/badges
        // sobre foto, overlays oscuros, etc.) aunque no formen parte del
        // rediseño "Archivo Automotor" de la home. Ver commit 7d0afcb7
        // para el detalle histórico de esta paleta.
        'auto-dark': '#171130',
        'auto-darker': '#0D0A1D',
        'auto-surface': '#271D4B',
        'auto-border': '#413367',
        'auto-text': '#F6F3FF',
        'auto-text-secondary': '#B8B0D8',
        'auto-accent': '#FF2E88',
        'auto-accent-strong': '#FF5BA3',
        'auto-accent-orange': '#23D9FF',
        'auto-accent-warning': '#C7F000',
        'auto-gold': '#23D9FF',
        
        // Colores neutrales derivados
        neutral: {
          50: '#FCFAFF',
          100: '#F0EBFF',
          200: '#ECE7FA',
          300: '#D8CDF7',
          400: '#BCB1DB',
          500: '#8E82B0',
          600: '#6C618B',
          700: '#4E446C',
          800: '#342B51',
          900: '#221A3D',
          950: '#171130',
        },
        
        // Colores de superficie
        'surface-page': '#F6F3FF',
        'surface-alt': '#ECE7FA',
        'surface-card': '#FFFFFF',
        'surface-card-hover': '#F0EBFF',
        'surface-elevated': '#FFFFFF',
        'surface-input': '#FFFFFF',
        'surface-header': '#F6F3FF',
        'surface-drawer': '#FFFFFF',
        'surface-chip': '#FFFFFF',
        'inverse': '#171130',
        'edge': '#E0D6F2',
        'edge-strong': '#BCB1DB',
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
