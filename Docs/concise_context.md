# Time Hero Simulator - Concise Context

## Project Overview
The **Time Hero Simulator** is a web-based game balance testing tool for Time Hero, an idle farming game for the Playdate console. It validates the game economy through statistical simulation, helping identify bottlenecks and optimize the 3-4 week player journey from tutorial to endgame.

## Tech Stack
- **Framework**: Vue 3 + Vite + TypeScript
- **State**: Pinia stores
- **UI**: Tailwind CSS (dark theme) + Headless UI
- **Visualization**: Cytoscape.js (upgrade tree), Chart.js (analytics)
- **Data**: PapaParse for CSV loading
- **Performance**: Web Workers for simulation engine
- **Deployment**: GitHub Pages

## Project Structure
```
/Users/d.fraser/Local Dev/TimeHeroSim2/
├── Data/           # CSV files with game configuration (27 files total)
│   ├── Actions/    # Farm, forge, tower actions (6 files)
│   ├── Data/       # Crops, weapons, adventures, etc. (12 files)
│   └── Unlocks/    # Town vendors and upgrades (6 files)
├── Docs/
│   ├── Sim Design/    # 9 design documents (00-08 + plan)
│   └── App Build/     # As-built technical documentation
│       ├── Data-Architecture-Reference.md
│       ├── Dashboard-As-Built.md
│       └── Configuration-As-Built.md
└── src/            # Vue application (Phase 1-2 implemented)
    ├── components/ # UI components with sophisticated modals
    ├── stores/     # Pinia stores for data + configuration
    ├── utils/      # CSV loading and validation system
    └── views/      # Dashboard + Configuration working
```

## Key Features
1. **Dashboard**: System status and recent simulations
2. **Game Configuration**: View/edit all CSV data with CRUD operations
3. **Upgrade Tree**: Interactive dependency graph (Civ V style)
4. **Player Personas**: Behavior profiles (Speedrunner, Casual, Weekend Warrior)
5. **Simulation Setup**: Configure simulation parameters
6. **Live Monitor**: Real-time visualization of running simulations
7. **Reports**: Analysis and export of simulation results

## Current Status
**Phase 1-2 Implementation**: Data layer and configuration system working
- 9 design documents + 3 as-built technical references complete
- All 27 CSV data files loaded and validated (17 unified + 10 specialized)
- Vue 3 + Pinia + TypeScript architecture fully implemented
- Dashboard with data health monitoring (17/17 file tracking) operational
- Configuration system with two-tier navigation and CRUD operations complete
- Sophisticated modal editing system with material management working
- Ready to continue with Phase 3: Upgrade Tree Visualization

## Development Approach
- **Phased delivery** with testable features each phase
- **Data-first** architecture using CSV files as source of truth
- **Simulation timing**: 30-second ticks, variable speed (1x to max)
- **Visual feedback**: Simulations can take minutes at 1x speed for observation
- **Persistence**: LocalStorage for simplicity

## Key Design Decisions
- Desktop-only (MacBook Air resolution: 1440x900)
- No backend - fully client-side
- CSV files remain source of truth
- Web Workers for non-blocking simulation
- Focus on core functionality over visual polish initially

## Data Model
Dual-schema architecture handles both unified and specialized data:
- **27 CSV files**: 17 unified schema + 10 specialized formats
- **GameDataItem interface**: Standardized structure for core game data
- **Material system**: "Crystal x2;Silver x5" → `{Crystal: 2, Silver: 5}`
- **Prerequisite chains**: ID-based dependency system with validation
- **Real-time validation**: Cross-file consistency and circular dependency detection
- **Examples**: `meadow_path_short` → `meadow_path_long` → `pine_vale_short`

## Key Implementation Features
- **Data Health Monitoring**: 17/17 unified files + 10/10 specialized files tracking
- **Two-Tier Navigation**: Game screens (Farm, Tower, Town, etc.) → File categories
- **Advanced Modal System**: Complex form management with material arrays
- **Real-Time Validation**: Cross-file prerequisite checking and circular dependency detection
- **Change Tracking**: Sophisticated dirty state management and save/reset functionality
- **Dynamic File Counting**: Smart badge system showing item counts per category

## Related Documents
### Design Documents (Original Specifications)
- **Game Design**: `Time Hero - Unified Game Design & Progression.md`
- **Combat System**: `Time Hero - Combat Mechanics & Balance.md`
- **Tech Stack**: `Docs/Sim Design/00-tech-stack-architecture.md`
- **Dashboard Design**: `Docs/Sim Design/01-dashboard.md`
- **Configuration Design**: `Docs/Sim Design/02-game-configuration.md`
- **Phase Plan**: `Docs/Sim Design/phased-development-plan.md`

### As-Built Documentation (Implementation Details)
- **Data Architecture**: `App Build/Data-Architecture-Reference.md`
- **Dashboard System**: `App Build/Dashboard-As-Built.md`
- **Configuration System**: `App Build/Configuration-As-Built.md`

## Notes
- Simulation accuracy accepts approximations in player behavior
- Focus on identifying bottlenecks and progression issues
- LLM-friendly export planned for future analysis