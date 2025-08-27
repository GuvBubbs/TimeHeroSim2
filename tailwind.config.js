/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Gaming dark theme colors - Base palette
        'sim-bg': '#0f172a',         // slate-900 - Main background
        'sim-surface': '#1e293b',    // slate-800 - Cards, modals, elevated surfaces
        'sim-surface-hover': '#334155', // slate-700 - Hover state for surfaces
        'sim-border': '#475569',     // slate-600 - Default borders
        'sim-border-light': '#64748b', // slate-500 - Lighter borders
        'sim-text': '#f8fafc',       // slate-50 - Primary text (brighter)
        'sim-muted': '#cbd5e1',      // slate-300 - Disabled/placeholder text (brighter)
        
        // Interactive colors - much brighter
        'sim-primary': '#3b82f6',    // blue-500 - Primary action color
        'sim-primary-light': '#60a5fa', // blue-400 - Lighter primary
        'sim-primary-dark': '#2563eb', // blue-600 - Darker primary
        'sim-accent': '#3b82f6',     // blue-500 - Primary action color
        
        // Card variations
        'sim-card': '#1e293b',       // slate-800 - Card background
        'sim-card-dark': '#0f172a',  // slate-900 - Darker card variant
        
        // State colors
        'sim-success': '#10b981',    // emerald-500
        'sim-warning': '#f59e0b',    // amber-500  
        'sim-error': '#ef4444',      // red-500
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      }
    }
  },
  plugins: []
}
