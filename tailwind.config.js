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
        'sim-text': '#f1f5f9',       // slate-100 - Primary text (lighter)
        'sim-muted': '#94a3b8',      // slate-400 - Disabled/placeholder text
        
        // Interactive colors
        'sim-accent': '#3b82f6',     // blue-500 - Primary action color
        
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
