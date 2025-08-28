# Time Hero Simulator - Simulation Logic Overview
## How Everything Comes Together

---

## Overview

This document explains how all the simulation components work together to create a complete game balance testing system. It shows the flow from initial configuration through simulation execution to final analysis.

---

## 📊 Data Flow Architecture

```
CSV Files (27) → Pinia Stores → Configuration → Simulation Engine → Web Worker → Live Monitor
      ↓               ↓              ↓                ↓                ↓            ↓
   Game Data    User Edits    Personas +        Decision         Background    Real-time
                              Parameters         Making          Processing    Visualization
```

---

## 1. Foundation Layer: Data & Configuration

### 1.1 CSV Data Loading
- **27 CSV files** define the entire game structure
- Loaded into `gameDataStore` using dual-schema architecture:
  - 17 unified files (standard GameDataItem interface)
  - 10 specialized files (custom structures)
- Data includes: crops, adventures, upgrades, weapons, etc.
- All prerequisites and dependencies validated on load

### 1.2 User Configuration
- **Game Configuration screen** allows editing any data
- Changes tracked in `configurationStore`
- Modified data can override default CSV values
- Saved configurations stored in LocalStorage

### 1.3 Upgrade Tree Visualization
- Shows all dependencies and progression paths
- Helps identify potential bottlenecks visually
- Used by simulation to understand upgrade paths

---

## 2. Simulation Setup Layer

### 2.1 Quick Setup (Phase 5A)
```typescript
interface SimulationConfig {
  // User selections
  persona: PersonaId           // From Phase 4
  duration: DurationMode        // Fixed/completion/bottleneck
  speed: SimulationSpeed       // Realtime/fast/max
  
  // Data sources
  gameData: GameDataStore      // CSV data (potentially modified)
  parameters: AllParameters    // From parameter screens
  overrides: OverrideSystem    // Global/conditional overrides
}
```

### 2.2 Parameter Configuration (Phase 5B-5D)
Nine parameter screens expose internal logic:
1. **Farm Parameters** - Growth rates, automation behavior
2. **Tower Parameters** - Seed catching, auto-catcher rates
3. **Town Parameters** - Purchase priorities, vendor weights
4. **Adventure Parameters** - Combat mechanics, risk tolerance
5. **Forge Parameters** - Crafting success, heat management
6. **Mine Parameters** - Energy drain, depth strategy
7. **Helper Parameters** - Role assignment, training
8. **Resource Parameters** - Storage, generation, consumption
9. **Decision Parameters** - Global behavior, optimization goals

### 2.3 Configuration Compilation
```typescript
// Before simulation starts:
1. Load default parameters
2. Apply screen-specific modifications
3. Apply global overrides
4. Apply persona modifiers
5. Validate final configuration
6. Pass to simulation engine
```

---

## 3. Simulation Engine Core

### 3.1 GameState Management
The **GameState** is the single source of truth:
```typescript
interface GameState {
  time: TimeState               // Day, hour, minute tracking
  resources: ResourceState      // Energy, gold, water, seeds, materials
  progression: ProgressionState // Level, unlocks, phase
  inventory: InventoryState     // Tools, weapons, armor
  processes: ProcessState       // Crops, crafting, adventures, mining
  helpers: HelperState         // Gnomes and their roles
  location: LocationState      // Current screen and time there
}
```

### 3.2 Decision Engine Flow
Every simulation tick (1 minute game time):
```typescript
tick() {
  1. Update time
  2. Process ongoing activities (crops grow, crafting progresses)
  3. Check if hero should act (based on persona schedule)
  4. If acting:
     a. Get all possible actions
     b. Filter by prerequisites
     c. Score each action
     d. Select highest scoring action
     e. Execute action
  5. Process helper actions
  6. Check for state changes/events
  7. Return results
}
```

### 3.3 Action Scoring System
```typescript
scoreAction(action) {
  baseScore = action.expectedValue
  
  // Apply parameter weights
  score *= parameters[action.screen].weights[action.type]
  
  // Apply persona modifiers
  score *= persona.preferences[action.category]
  
  // Apply situational modifiers
  if (resources.energy.current < threshold) {
    score *= urgencyModifier
  }
  
  return score
}
```

---

## 4. Web Worker Architecture

### 4.1 Worker Thread
- Runs simulation engine in background
- Non-blocking to UI thread
- Processes ticks at configured speed
- Sends updates via messages

### 4.2 Main Thread Bridge
```typescript
class SimulationBridge {
  // Manages communication
  worker.postMessage({ type: 'tick' })
  worker.onmessage = (tickResult) => {
    updateUI(tickResult)
  }
}
```

### 4.3 Message Protocol
```typescript
// Worker → Main Thread
{
  type: 'tick',
  data: {
    state: GameState,
    actions: ExecutedAction[],
    events: GameEvent[],
    timestamp: number
  }
}

// Main Thread → Worker
{
  type: 'setSpeed' | 'pause' | 'resume',
  data: any
}
```

---

## 5. Live Monitor Visualization

### 5.1 Widget Update System
Different widgets update at different frequencies:
- **Every tick**: Current action, action log
- **Every second**: Resources, location
- **Every minute**: Screen time, timeline
- **On change**: Phase progress, inventory

### 5.2 Data Transformation Pipeline
```typescript
// From simulation to UI:
GameState → WidgetManager → Individual Widgets → Vue Components
          ↓
    Filter relevant data
          ↓
    Transform to display format
          ↓
    Update reactive properties
          ↓
    Vue renders changes
```

### 5.3 Key Widgets & Their Data Sources

| Widget | Data Source | Update Trigger |
|--------|------------|----------------|
| Phase Progress | `state.progression.currentPhase` | Phase change |
| Current Location | `state.location.currentScreen` | Screen change |
| Resources | `state.resources.*` | Any resource change |
| Equipment | `state.inventory.*` | Item acquired/upgraded |
| Current Action | Current `action` from tick | Every action |
| Action Log | Action history buffer | Every action |
| Farm Visualizer | `state.processes.crops` | Farm actions |
| Timeline | Event history | Significant events |
| Screen Time | Accumulated time per screen | Every minute |

---

## 6. Decision Making Integration

### 6.1 Persona Influence
```typescript
// Personas affect decisions through:
1. Schedule (when to act)
2. Risk tolerance (which adventures)
3. Efficiency goals (speed vs completionism)
4. Screen preferences (where to spend time)
```

### 6.2 Parameter Influence
```typescript
// Parameters affect decisions through:
1. Action weights (what's important)
2. Thresholds (when to act)
3. Priorities (what to do first)
4. Strategies (how to approach goals)
```

### 6.3 Dynamic Adaptation
```typescript
// Simulation adapts based on:
1. Current game state
2. Resource availability
3. Unlocked content
4. Bottlenecks encountered
5. Phase progression
```

---

## 7. Complete Flow Example

### Starting a Simulation:
```
1. User selects persona (Casual Player)
2. User adjusts parameters (faster growth)
3. User clicks "Launch Simulation"
4. System compiles configuration
5. Web Worker initialized with config
6. Simulation begins ticking
```

### During Simulation:
```
Tick 1: Day 1, 00:00
  - Hero at Farm
  - Check possible actions
  - Score: Plant carrot (8.5), Change screen (1.0)
  - Execute: Plant carrot
  - Update GameState
  - Send to UI
  
UI Update:
  - Current Action widget shows "Planting Carrot"
  - Farm Visualizer shows new plant
  - Resources show -1 energy
  - Action Log adds entry
```

### Decision Example:
```
Evaluating: Should we buy Storage Shed II?
  
Inputs:
  - Current gold: 150
  - Cost: 100
  - Current energy cap: 50
  - Parameter priority: 8/10
  - Persona saving threshold: 50 gold
  
Scoring:
  - Base value: 10 (from priority)
  - Gold available: ×1.0 (have enough)
  - Not saving: ×0.8 (want reserve)
  - Energy need: ×1.5 (cap limiting)
  - Final score: 12.0
  
Result: Purchase approved
```

---

## 8. Key Architecture Principles

### 8.1 Separation of Concerns
- **Data Layer**: CSV files, Pinia stores
- **Configuration Layer**: Parameters, personas, overrides
- **Logic Layer**: Simulation engine, decision making
- **Processing Layer**: Web Worker, background execution
- **Presentation Layer**: Live Monitor, widgets

### 8.2 Data Immutability
- GameState updated through actions only
- Each tick produces new state
- History can be replayed

### 8.3 Determinism
- Same configuration → Same results
- Random seed for reproducibility
- No hidden randomness

### 8.4 Performance Optimization
- Web Worker prevents UI blocking
- Widgets update only when needed
- Virtual scrolling for large lists
- Batch updates to reduce renders

---

## 9. Testing & Validation

### 9.1 Unit Testing Points
- Action prerequisite checking
- Score calculation
- State transitions
- Combat simulation

### 9.2 Integration Testing Points
- Worker communication
- Widget updates
- Data flow
- Configuration compilation

### 9.3 End-to-End Testing
- Complete 35-day simulation
- Persona behavior verification
- Parameter effect validation
- Report generation

---

## 10. Debugging Features

### 10.1 Debug Mode
When enabled:
- Shows decision scores in real-time
- Logs all state transitions
- Displays performance metrics
- Allows state inspection

### 10.2 Action Reasoning
Every action includes:
```typescript
{
  action: 'plant_carrot',
  score: 8.5,
  reasoning: 'Low energy (450<500), high value crop',
  alternatives: [
    { action: 'water', score: 6.2 },
    { action: 'change_screen', score: 1.0 }
  ]
}
```

### 10.3 State Snapshots
- Can pause and inspect complete GameState
- Export state as JSON
- Load state for debugging

---

## Conclusion

The simulation system is built on clear separation between:
1. **Configuration** (what the game is)
2. **Behavior** (how to play)
3. **Execution** (running the simulation)
4. **Visualization** (showing what's happening)

This architecture enables:
- Testing different game configurations
- Comparing player behaviors
- Identifying balance issues
- Validating game progression

The key insight is that everything flows from the GameState, which is methodically updated by the Decision Engine based on Personas and Parameters, then visualized in real-time through the Live Monitor.

---

*Document created: January 2025*  
*Purpose: Technical reference for simulation implementation*
