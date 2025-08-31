# Simulation Engine As-Built Documentation

## Overview

The SimulationEngine is the core intelligence system that powers the TimeHero Simulator. It provides realistic AI-driven gameplay simulation with comprehensive decision-making, resource management, and progression tracking. The engine simulates a complete Time Hero gameplay experience from tutorial through endgame, making intelligent decisions based on persona characteristics, CSV game data, and complex prerequisite relationships.

**Status**: ✅ Production-Ready with Real-Time Data Flow & Intelligent Seed Management (Phase 8N Complete)

## Architecture Overview

```
SimulationEngine (Core Logic) ──► Web Worker ──► SimulationBridge ──► LiveMonitor ──► Widgets
├── CSV Data Processing           ├── Real-time Ticks      ├── Event Handling      ├── Data Flow         ├── Live Updates
├── AI Decision Making           ├── MapSerializer        ├── Error Management    ├── State Updates     ├── Resource Display  
├── Game Systems Integration     ├── Performance Stats    ├── Data Validation     ├── Event Processing  ├── Action Tracking
└── Persona-Driven Behavior     └── Background Processing└── Real-time Events    └── Widget Updates    └── Progress Monitoring
```

### Core Components

**Main Files**:
- `src/utils/SimulationEngine.ts` - Main simulation logic and AI decision-making
- `src/workers/simulation.worker.ts` - Web Worker for background processing  
- `src/utils/SimulationBridge.ts` - Main thread communication bridge
- `src/utils/WidgetDataAdapter.ts` - Transforms GameState to widget-friendly formats

**Game Systems**:
- `src/utils/systems/CropSystem.ts` - Crop growth and water management
- `src/utils/systems/SeedSystem.ts` - Intelligent seed collection and tower navigation (Phase 8N)
- `src/utils/systems/WaterSystem.ts` - Water retention and auto-pump systems (Phase 8N)
- `src/utils/systems/HelperSystem.ts` - Helper automation and management  
- `src/utils/systems/CombatSystem.ts` - Real combat with weapon advantages
- `src/utils/systems/CraftingSystem.ts` - Forge crafting with heat management
- `src/utils/systems/MiningSystem.ts` - Depth-based mining with material drops
- `src/utils/systems/PrerequisiteSystem.ts` - CSV dependency validation

## Core Simulation Loop

### Tick Processing

The engine processes game time in 1-minute ticks, modified by simulation speed:

```typescript
tick(): TickResult {
  // 1. Update game time
  this.updateTime(deltaTime)
  
  // 2. Process ongoing activities (crops, crafting, mining)
  const ongoingEvents = this.processOngoingActivities(deltaTime)
  
  // 3. Process all game systems
  CropSystem.processCropGrowth(this.gameState, deltaTime, this.gameDataStore)
  CraftingSystem.processCrafting(this.gameState, deltaTime, this.gameDataStore)
  MiningSystem.processMining(this.gameState, deltaTime)
  HelperSystem.processHelpers(this.gameState, deltaTime, this.gameDataStore)
  
  // 4. Process resource regeneration (energy, water)
  this.processResourceRegeneration(deltaTime)
  
  // 5. Make AI decisions based on persona schedule
  const decisions = this.makeDecisions()
  
  // 6. Execute valid actions
  const executedActions = this.executeActions(decisions)
  
  // 7. Check victory/bottleneck conditions
  const isComplete = this.checkVictoryConditions()
  const isStuck = this.checkBottleneckConditions()
  
  return { gameState, executedActions, events, deltaTime, isComplete, isStuck }
}
```

## AI Decision Making System

### Persona-Driven Behavior

The engine supports three main personas, each with different check-in patterns and behavior:

```typescript
const personas = {
  speedrunner: { weekdayCheckIns: 10, weekendCheckIns: 10, efficiency: 0.95 },
  casual: { weekdayCheckIns: 2, weekendCheckIns: 2, efficiency: 0.7 },
  'weekend-warrior': { weekdayCheckIns: 1, weekendCheckIns: 8, efficiency: 0.8 }
}
```

### Decision Process

1. **Schedule Check**: `shouldHeroActNow()` determines if the persona should act based on check-in schedule
2. **Action Generation**: Evaluates available actions across all game screens
3. **Prerequisite Validation**: Checks CSV data dependencies and resource requirements
4. **Action Scoring**: Scores actions based on persona characteristics and game state
5. **Execution**: Executes top-priority actions

### Recent Fix: Hero Check-in Logic (Phase 8J Critical Fix)

**Problem Resolved**: Simulation stalled after tick 1 due to overly restrictive check-in logic causing 8+ hour gaps between actions.

**Root Cause**: Complex persona-based scheduling calculated `minutesPerCheckin = wakingMinutes / checkinsToday`, resulting in 480+ minute waits for casual personas.

**Solution**: Completely rewrote `shouldHeroActNow()` with simpler, more frequent triggers:

```typescript
// PHASE 8J FIX: Simplified hero check-in logic
private shouldHeroActNow(): boolean {
  const currentHour = Math.floor(this.gameState.time.totalMinutes / 60) % 24
  
  // Don't act at night (6 AM - 10 PM active hours)
  if (currentHour < 6 || currentHour >= 22) return false
  
  // First check-in of the day
  if (this.lastCheckinTime === 0 || 
      this.gameState.time.day > Math.floor(this.lastCheckinTime / 1440)) {
    this.lastCheckinTime = this.gameState.time.totalMinutes
    return true
  }
  
  // Regular check-ins every 60 minutes (instead of 480+)
  const minutesPerCheckin = 60
  const timeSinceLastCheckin = this.gameState.time.totalMinutes - this.lastCheckinTime
  
  if (timeSinceLastCheckin >= minutesPerCheckin) {
    this.lastCheckinTime = this.gameState.time.totalMinutes
    return true
  }
  
  // Energy-based trigger: Act when energy > 80%
  if (this.gameState.resources.energy.current > 
      this.gameState.resources.energy.max * 0.8) {
    this.lastCheckinTime = this.gameState.time.totalMinutes
    return true
  }
  
  return false
}
```

**Additional Fixes**:
- Added missing pump water evaluation when water < 50%
- Enhanced debug logging every 10 ticks for simulation health monitoring
- Improved action scoring for cleanup and pump actions

**Results**: Actions now execute regularly every ~30 ticks instead of stalling after tick 1, with healthy resource cycles and game progression.

## Game Systems Integration

### Farm System
- **Crop Growth**: Realistic growth with water requirements and stages
- **Water Management**: Tool-based efficiency and auto-pumping systems
- **Cleanup Actions**: CSV-driven farm expansion with prerequisite checking
- **Plot Management**: Dynamic plot allocation and availability tracking

### Economic Model (Phase 8K Critical Fix)

**Core Economic Flow**: The simulation implements the correct Time Hero economic model where energy is the central currency:

```
Crops → Plant (FREE, time only) → Harvest (FREE, adds energy) → Energy → Adventures (gold) + Cleanup (plots)
```

**Key Economic Principles**:
- ✅ **Planting**: FREE action, only costs time (duration from CSV)
- ✅ **Harvesting**: FREE action, adds energy based on crop `effect` value  
- ✅ **Energy Sources**: Only from crop harvests (no regeneration)
- ✅ **Gold Sources**: Only from adventures (consumes energy)
- ✅ **Plot Expansion**: Cleanup actions (consumes energy)
- ✅ **Starting Resources**: 0 gold, 100 energy, 3 plots

**Energy Values by Crop** (from crops.csv `effect` field):
- Carrot: 1 energy, Radish: 1 energy
- Potato: 2 energy, Turnip: 2 energy, Cabbage: 3 energy
- Corn: 5 energy, Tomato: 4 energy, Spinach: 5 energy
- Strawberry: 8 energy, Beetroot: 35 energy

**Phase 8K Fixes Applied**:
- Fixed harvest execution to use `cropData.effect` for energy values
- Removed incorrect energy costs from harvest actions (now FREE)
- Removed incorrect energy costs from planting actions (now FREE)
- Eliminated all energy regeneration (only from harvests)
- Set starting gold to 0 (earn through adventures)

### Seed Management System (Phase 8N Implementation)

**Comprehensive Seed Collection & Navigation**: The simulation implements intelligent seed management with emergency collection, proactive thresholds, and smart tower navigation.

**Core Seed Flow**: Farm (depletes seeds) → Tower (manual catching) → Farm (plant & grow)

**Key Features**:
- ✅ **Emergency Collection**: ULTRA HIGH priority (9999 score) when seeds < plots count (critical shortage)
- ✅ **Proactive Collection**: HIGH priority (750 score) when seeds < 70% of buffer (4-6 seeds for 3 plots)
- ✅ **Smart Tower Exit**: Auto-return to farm when seeds ≥ target (2x plots or 6 minimum)
- ✅ **Free Emergency Catching**: Seed collection costs 0 energy during critical shortages
- ✅ **Frequency Optimization**: 2min check-ins during critical, 5min during low seeds

```typescript
// Phase 8N Seed Management Logic
const seedBuffer = Math.max(farmPlots * 2, 6) // Want 2x seeds per plot, minimum 6
const criticalThreshold = farmPlots // Critical when seeds = plots  
const lowThreshold = Math.floor(seedBuffer * 0.7) // Low when < 70% of buffer

// Emergency navigation to tower
if (seedMetrics.totalSeeds < criticalThreshold) {
  actions.push({
    id: `emergency_tower_nav_${Date.now()}`,
    type: 'move',
    target: 'tower',
    energyCost: 0, // FREE during emergencies
    // Ultra high priority scoring: 9999
  })
}

// Smart tower exit when seeds sufficient
if (!needsSeeds && seedMetrics.totalSeeds >= seedTargetBase) {
  console.log(`🚪 TOWER EXIT: Seeds sufficient (${seedMetrics.totalSeeds}/${seedTargetBase}) - returning to farm`)
  actions.push({
    type: 'move',
    target: 'farm',
    // Return immediately to prioritize farming
  })
}
```

**Tower Navigation Intelligence**:
- **Emergency Priority**: Overrides all other actions when seeds critical
- **Block Tower Exit**: Prevents leaving tower during seed shortage with very low scores
- **Smart Return Logic**: Auto-generates farm navigation when seed targets met
- **Check-in Frequency**: Adaptive intervals based on seed status (2min critical, 5min low, 5min normal)

**Seed Catching Mechanics**:
- **Manual Catching**: 5 energy/minute normally, FREE during emergencies
- **Wind Level Integration**: Uses SeedSystem for realistic catch rates
- **Proactive Targeting**: Collects seeds before running out (not just emergency)
- **Energy Management**: Emergency catching bypasses energy requirements

**Phase 8N Critical Fixes Applied**:
- Fixed duplicate `evaluateNavigationActions()` methods causing 0 valid actions
- Removed invalid GameAction properties (`toScreen`, `description`) that filtered out actions
- Added comprehensive action generation and filtering debug logging
- Implemented tower exit logic to prevent hero getting stuck at tower
- Enhanced crop counting logic (removed non-existent `cropType` property)
- Added emergency check-in frequency overrides for responsive seed management

### Adventure System  
- **Real Combat**: Pentagon weapon advantage system with boss mechanics
- **Route Management**: Short/Medium/Long adventures with scaled rewards
- **Equipment Integration**: Weapon and armor effects in combat calculations
- **Adventure Prerequisites**: CSV-based route unlocking

### Town & Crafting Systems
- **Vendor Purchases**: CSV-driven upgrade availability and pricing
- **Forge Crafting**: Heat management with material consumption
- **Mining Operations**: Depth-based progression with exponential energy costs
- **Helper Management**: Role assignment, training, and automation

## Real-Time Data Flow

### Event-Driven Architecture

The system now uses event-driven updates instead of polling:

```typescript
// In SimulationBridge.ts
bridge.onTick((tickData) => {
  console.log('🔄 LiveMonitor: Received tick event', tickData)
  updateWidgets(tickData.gameState)
})

// In LiveMonitorView.vue  
const updateWidgets = (gameState: GameState | null) => {
  if (!gameState || !WidgetDataAdapter.validateGameState(gameState)) return
  
  // Transform to widget-friendly format
  widgetData.resources = WidgetDataAdapter.transformResources(gameState)
  widgetData.progression = WidgetDataAdapter.transformProgression(gameState)
  widgetData.location = WidgetDataAdapter.transformLocation(gameState)
  // ... update other widget data
}
```

### Data Transformation

The `WidgetDataAdapter` handles Map→Object conversion and provides safe defaults:

```typescript
export class WidgetDataAdapter {
  static transformResources(gameState: GameState | null): WidgetResources {
    if (!gameState?.resources) return defaultResources
    
    return {
      energy: gameState.resources.energy,
      gold: gameState.resources.gold,
      water: gameState.resources.water,
      seeds: Object.fromEntries(gameState.resources.seeds.entries()),
      materials: Object.fromEntries(gameState.resources.materials.entries())
    }
  }
}
```

## CSV Data Integration

### Game Data Store Integration

The engine receives validated CSV data through the Web Worker:

```typescript
// Worker validates CSV data on initialization
if (!gameData.allItems || gameData.allItems.length === 0) {
  throw new Error('No CSV items provided. CSV data must be loaded.')
}

// Engine accesses data through gameDataStore interface
const item = this.gameDataStore.getItemById(itemId)
const categoryItems = this.gameDataStore.itemsByCategory[category]
```

### CSV File Structure Support

The engine processes 27 CSV files (17 unified + 10 specialized):
- **Farm Data**: Crops, cleanup actions, farm stages
- **Town Data**: Vendors, upgrades, blueprints  
- **Adventure Data**: Routes, enemies, boss mechanics
- **Helper Data**: Gnome roles, training, housing
- **Crafting Data**: Recipes, materials, forge operations

## Performance & Error Handling

### Bottleneck Detection

The system monitors for simulation bottlenecks:

```typescript
private checkBottleneckConditions(): boolean {
  const hasProgress = (
    currentPlots > this.lastProgressCheck.plots ||
    currentLevel > this.lastProgressCheck.level ||
    currentGold > this.lastProgressCheck.gold + 100
  )
  
  if (!hasProgress && daysSinceProgress >= 3) {
    const cause = this.identifyBottleneckCause()
    console.warn(`Bottleneck detected: ${cause}`)
    return true
  }
  
  return false
}
```

### Victory Conditions

Victory is achieved through:
- **Plot Count**: Reaching 90 plots (Great Estate)
- **Hero Level**: Reaching level 15 (maximum)

### Error Handling

- **Graceful Degradation**: Individual system failures don't crash the simulation
- **CSV Validation**: Comprehensive prerequisite and dependency checking
- **Resource Limits**: Storage caps with overflow warnings
- **State Validation**: GameState structure validation before widget updates

## Web Worker Architecture

### Cross-Thread Communication

The engine runs in a Web Worker for non-blocking simulation:

```typescript
// Worker sends real-time tick updates
postMessage({
  type: 'tick',
  data: {
    gameState: serializedState,
    executedActions: tickResult.executedActions,
    events: tickResult.events,
    tickCount: stats.tickCount,
    isComplete: tickResult.isComplete,
    isStuck: tickResult.isStuck
  }
})

// Bridge handles events and forwards to UI
private handleTickMessage(data: any): void {
  const gameState = this.deserializeGameState(data.gameState)
  
  for (const handler of this.tickHandlers) {
    handler({
      gameState,
      executedActions: data.executedActions,
      events: data.events,
      tickCount: data.tickCount,
      // ... other tick data
    })
  }
}
```

### MapSerializer Integration

Complex Map objects are serialized for cross-thread transfer:

```typescript
// Inventory maps serialized as arrays
inventory: {
  tools: Array.from(gameState.inventory.tools.entries()),
  weapons: Array.from(gameState.inventory.weapons.entries()),
  // ...
}

// Deserialized back to Maps in main thread
inventory: {
  tools: new Map(serializedState.inventory.tools),
  weapons: new Map(serializedState.inventory.weapons),
  // ...
}
```

## Integration Points

### Live Monitor Integration
- **Real-time widgets**: ResourcesWidget, CurrentAction, FarmVisualizer
- **Event-driven updates**: No polling, pure event-based data flow
- **Data transformation**: Maps converted to plain objects for Vue reactivity
- **Error boundaries**: Widget updates fail gracefully with defaults

### Configuration Integration
- **Persona selection**: Affects check-in frequency and decision-making
- **Parameter overrides**: Modify simulation behavior through configuration
- **CSV data validation**: Ensures data integrity before simulation starts

## Current Status

✅ **Working Systems**:
- Real-time simulation with persona-driven AI
- Complete farm, town, adventure, and crafting systems  
- Event-driven data flow to Live Monitor widgets
- CSV data integration with validation
- Bottleneck detection and victory conditions
- Comprehensive error handling and logging

✅ **Recent Fixes Applied**:
- **Phase 8N Seed Management**: Comprehensive seed collection system with emergency and proactive collection
- **Phase 8N Navigation Intelligence**: Smart tower exit logic and adaptive check-in frequencies  
- **Phase 8N Action Pipeline**: Fixed duplicate methods and invalid properties causing 0 valid actions
- **Phase 8N Debug System**: Enhanced action generation/filtering logging for future debugging
- **Phase 8N Critical Fixes**: Resolved hero getting stuck at tower by implementing return-to-farm logic
- **Phase 8K Economic Fix**: Completely corrected the economic model to match game design
- **Phase 8K**: Fixed harvest actions to give energy (not gold) using CSV `effect` values  
- **Phase 8K**: Removed incorrect energy costs from harvest and planting actions
- **Phase 8K**: Eliminated all energy regeneration - energy only from crop harvests
- **Phase 8K**: Set starting gold to 0 and starting plots to 3 per farm_stages.csv
- **Phase 8J Critical Fix**: Rewrote `shouldHeroActNow()` to prevent simulation stalling
- **Phase 8J**: Added missing pump water evaluation and enhanced debug logging
- **Phase 8J**: Improved action scoring for cleanup and pump actions
- Implemented event-driven widget updates
- Added WidgetDataAdapter for data transformation  
- Enhanced debugging throughout data pipeline
- Validated CSV data flow from store to worker

✅ **Testing Verified**:
- **Phase 8N**: Complete seed management cycle - farm → tower → collect seeds → return to farm ✅
- **Phase 8N**: Emergency seed collection triggers at 0 seeds with ultra-high priority (9999)
- **Phase 8N**: Proactive seed collection activates at 3/6 seeds with high priority (750)
- **Phase 8N**: Smart tower exit auto-returns to farm when seeds sufficient (8/6 seeds)
- **Phase 8N**: Free emergency catching bypasses energy costs during critical shortages
- **Phase 8N**: Adaptive check-in frequency (2min critical, 5min low seeds, 5min normal)
- **Phase 8N**: Action pipeline generates valid moves after fixing duplicate methods
- **Phase 8N**: Enhanced debug logging captures action generation and filtering issues
- **Phase 8K**: Correct economic flow - harvests add energy, no energy costs for farming
- **Phase 8K**: Energy only from crop harvests (35 for beetroot, 1-8 for others)
- **Phase 8K**: Planting and harvesting are FREE actions (time-based only)
- **Phase 8K**: Starting resources correct (0 gold, 100 energy, 3 plots)
- **Phase 8J**: Continuous action execution beyond tick 1 (fixed simulation stalling)
- **Phase 8J**: Regular action cycles every ~30 ticks with healthy resource progression
- **Phase 8J**: Energy-based triggers working (energy accumulation from harvests)
- End-to-end data flow from SimulationEngine to UI widgets
- Real-time resource updates (energy, gold, water)
- Action execution and event logging
- Persona behavior differences (speedrunner vs casual)
- CSV data validation and error handling
