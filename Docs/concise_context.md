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
├── Data/           # CSV files with game configuration
│   ├── Actions/    # Farm, forge, tower actions
│   ├── Data/       # Crops, weapons, adventures, etc.
│   └── Unlocks/    # Town vendors and upgrades
├── Docs/
│   └── Sim Design/ # 9 design documents (00-08)
└── src/            # Vue application (to be built)
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
**Pre-development**: Design phase complete, ready to begin implementation
- 9 design documents created (00-08 + concise_context)
- All CSV data files prepared and validated
- Tech stack decisions finalized
- Ready to begin Phase 0: Foundation & Scaffolding

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
All game entities use an ID-based prerequisite system:
- Items have unique IDs and prerequisite arrays
- Creates dependency chains for progression
- Examples: `meadow_path_short` → `meadow_path_long` → `pine_vale_short`

## Related Documents
- **Game Design**: `Time Hero - Unified Game Design & Progression.md`
- **Combat System**: `Time Hero - Combat Mechanics & Balance.md`
- **Phase Plan**: `phased-development-plan.md`

## Notes
- Simulation accuracy accepts approximations in player behavior
- Focus on identifying bottlenecks and progression issues
- LLM-friendly export planned for future analysis