@# Time Hero Simulator - Product Overview

## What is this?
The Time Hero Simulator is a web-based game balance testing tool for Time Hero, an idle farming game for the Playdate console. It validates the game economy through statistical simulation, helping identify bottlenecks and optimize the 3-4 week player journey from tutorial to endgame.

## Key Features
- **Dashboard**: System status and recent simulations
- **Game Configuration**: View/edit all CSV data with CRUD operations  
- **Upgrade Tree**: Interactive dependency graph (Civ V style)
- **Player Personas**: Behavior profiles (Speedrunner, Casual, Weekend Warrior)
- **Simulation Setup**: Configure simulation parameters
- **Live Monitor**: Real-time visualization of running simulations
- **Reports**: Analysis and export of simulation results

## Current Status
Phase 1-2 Implementation: Data layer and configuration system working. Ready for Phase 3: Upgrade Tree Visualization.

## Target Users
Game developers and designers working on Time Hero who need to validate game balance and identify progression issues through data-driven simulation.

## Design Principles
- Desktop-only (MacBook Air resolution: 1440x900)
- No backend - fully client-side
- CSV files remain source of truth
- Focus on core functionality over visual polish initially
- Simulation accuracy accepts approximations in player behavior