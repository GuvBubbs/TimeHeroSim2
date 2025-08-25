# Tech Stack & Development Guide

## Core Stack
- **Framework**: Vue 3 with Composition API + TypeScript
- **Build Tool**: Vite 
- **Package Manager**: pnpm
- **State Management**: Pinia stores
- **Styling**: Tailwind CSS (dark theme) + Headless UI
- **Data Processing**: PapaParse for CSV loading
- **Visualization**: Cytoscape.js (upgrade tree), Chart.js (analytics)
- **Performance**: Web Workers for simulation engine

## Key Dependencies
```json
{
  "vue": "^3.5.18",
  "pinia": "^2.3.1", 
  "vue-router": "^4.5.1",
  "@headlessui/vue": "^1.7.23",
  "cytoscape": "^3.33.1",
  "papaparse": "^5.5.3",
  "tailwindcss": "3.4.16"
}
```

## Common Commands
```bash
# Development
pnpm dev              # Start dev server with HMR
pnpm build            # Build for production  
pnpm preview          # Preview production build

# Type checking
vue-tsc -b            # TypeScript compilation check
```

## Architecture Patterns
- **Composition API**: Use `<script setup>` syntax in Vue components
- **Pinia Stores**: Modular stores for different game systems
- **Path Aliases**: Use `@/` for src imports (configured in vite.config.ts)
- **CSV as Source of Truth**: All game data loaded from public/Data/ CSV files
- **Web Workers**: Heavy simulation logic runs in background workers

## Code Style
- TypeScript strict mode enabled
- Vue 3 Composition API with `<script setup>`
- Tailwind utility classes for styling
- Pinia stores for state management
- Interface definitions in src/types/

## Data Architecture
- **27 CSV files**: 17 unified schema + 10 specialized formats
- **GameDataItem interface**: Standardized structure for core game data
- **Material system**: "Crystal x2;Silver x5" → `{Crystal: 2, Silver: 5}`
- **Real-time validation**: Cross-file consistency checking

## Deployment
- **Target**: GitHub Pages static deployment
- **Base URL**: `/TimeHeroSim2/` (configured in vite.config.ts)
- **Build output**: dist/ directory