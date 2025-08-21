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
        // Gaming dark theme colors
        'sim-bg': '#0f172a',        // slate-900
        'sim-surface': '#1e293b',   // slate-800
        'sim-border': '#334155',     // slate-700
        'sim-text': '#e2e8f0',       // slate-200
        'sim-muted': '#94a3b8',      // slate-400
        'sim-accent': '#3b82f6',     // blue-500
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
