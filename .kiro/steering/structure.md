# Project Structure & Organization

## Root Structure
```
├── Docs/                    # Design documentation and references
│   ├── Sim Design/         # Original design specs (9 documents)
│   ├── App Build/          # As-built technical documentation  
│   └── Time Hero Game Design Reference/  # Game design docs
├── public/
│   └── Data/               # CSV game data files (27 total)
│       ├── Actions/        # Farm, forge, tower actions (4 files)
│       ├── Data/           # Core game data (17 files)
│       └── Unlocks/        # Town vendors and upgrades (6 files)
├── src/                    # Vue application source
└── dist/                   # Build output (GitHub Pages)
```

## Source Code Organization

### Components (`src/components/`)
- **GameConfiguration/**: Data editing components (modals, tables, filters)
- **layout/**: App shell and navigation components
- Organized by feature, not by component type

### Views (`src/views/`)
Main application pages corresponding to the 7 core features:
- `DashboardView.vue` - System status and monitoring
- `ConfigurationView.vue` - CSV data editing interface
- `UpgradeTreeView.vue` - Interactive dependency graph
- `PersonasView.vue` - Player behavior profiles
- `SimulationSetupView.vue` - Simulation parameters
- `LiveMonitorView.vue` - Real-time simulation display
- `ReportsView.vue` - Analysis and export

### Stores (`src/stores/`)
Pinia stores organized by domain:
- `gameData.ts` - CSV data management
- `configuration.ts` - UI configuration state
- `navigation.ts` - App navigation state
- `app.ts` - Global application state

### Types (`src/types/`)
- `game-data.ts` - Core game data interfaces
- `csv-data.ts` - CSV parsing types
- `index.ts` - Type exports

### Utils (`src/utils/`)
- `csvLoader.ts` - CSV file loading and parsing
- `graphBuilder.ts` - Dependency graph construction

### Composables (`src/composables/`)
- `useGameData.ts` - Game data access logic
- `useDataFilters.ts` - Data filtering functionality

## Data File Organization

### CSV Data Structure (`public/Data/`)
**Actions/** (4 files):
- Farm, forge, tower actions
- Town material trader

**Data/** (17 unified schema files):
- Core game entities (weapons, armor, crops, etc.)
- Adventure and progression data
- XP and phase transitions

**Unlocks/** (6 files):
- Town vendor configurations
- Skill trainer and specialist unlocks

## Naming Conventions
- **Files**: kebab-case for all files
- **Components**: PascalCase Vue components
- **Stores**: camelCase store names
- **Types**: PascalCase interfaces
- **CSS Classes**: Tailwind utility classes

## Import Patterns
```typescript
// Use @ alias for src imports
import { useGameData } from '@/composables/useGameData'
import type { GameDataItem } from '@/types/game-data'

// Relative imports for same directory
import EditItemModal from './EditItemModal.vue'
```

## File Responsibilities
- **Views**: Page-level components, route handling
- **Components**: Reusable UI elements, no direct data access
- **Stores**: State management, data persistence
- **Composables**: Shared reactive logic
- **Utils**: Pure functions, no Vue dependencies
- **Types**: TypeScript definitions only