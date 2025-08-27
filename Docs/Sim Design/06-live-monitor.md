# Time Hero Simulator - Simulation Engine & Live Monitor
## Document 6: Core Engine Architecture & Real-Time Visualization

---

## 📋 ACTUAL REQUIREMENTS & MVP GOALS

### Core Purpose
Build the **actual simulation engine** that runs Time Hero gameplay in a Web Worker, makes decisions based on personas and parameters, and provides real-time visualization through the Live Monitor interface.

### MVP Requirements (What We're Actually Building)
1. **GameState Management** - Track all game state (resources, progression, inventory)
2. **Decision Engine** - AI that evaluates and selects actions based on parameters
3. **Action Execution** - Apply actions to game state with proper effects
4. **Web Worker Architecture** - Non-blocking simulation in background thread
5. **Live Monitor UI** - Real-time visualization of simulation progress
6. **Event System** - Log and communicate state changes

### What We're NOT Building (Yet)
- Time travel debugging
- Multiplayer comparison
- Advanced AI narration
- Complex animation systems

---

## Live Monitor Screen Layout

### ASCII Mockup of Complete Live Monitor
```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ Live Monitor - Casual Test Run                                    [Export] [Stop ■] │
├────────────────────────────────────────────────────────────────────────────────────┤
│ [⏸] [▶ 100x] Day 7, 14:30 (20% complete)          [🔴 Recording] [Debug Mode ▼]   │
├────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│ ┌─────────────────────────┐ ┌──────────────────────┐ ┌──────────────────────────┐ │
│ │ 🌾 Current Location      │ │ 📊 Resources         │ │ 📈 Phase Progress         │ │
│ │ ━━━━━━━━━━━━━━━━━━━━━━ │ │ ━━━━━━━━━━━━━━━━━━━ │ │ ━━━━━━━━━━━━━━━━━━━━━━━ │ │
│ │                          │ │                      │ │                           │ │
│ │    ┌──────────────┐     │ │ Energy  ████░░ 450/600│ │ Tutorial    ████ 100%    │ │
│ │    │              │     │ │ Gold    💰 1,247      │ │ Early Game  ██░░  45%    │ │
│ │    │   🌾 FARM    │     │ │ Water   ███░░░ 45/100 │ │ Mid Game    ░░░░   0%    │ │
│ │    │              │     │ │ Seeds   127 📦        │ │ Late Game   ░░░░   0%    │ │
│ │    └──────────────┘     │ │                      │ │ Endgame     ░░░░   0%    │ │
│ │                          │ │ Materials:           │ │                           │ │
│ │ Time here: 3:45          │ │ Wood: 45  Stone: 23  │ │ Next: Clear Rocks #1      │ │
│ │ Visits today: 2          │ │ Iron: 12  Silver: 2  │ │ Blocks: Need 120 energy   │ │
│ └─────────────────────────┘ └──────────────────────┘ └──────────────────────────┘ │
│                                                                                      │
│ ┌─────────────────────────┐ ┌──────────────────────────────────────────────────┐  │
│ │ ⚡ Current Action        │ │ 🎬 Action Log                   [Auto-scroll ✓]  │  │
│ │ ━━━━━━━━━━━━━━━━━━━━━━ │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  │
│ │                          │ │                                                   │  │
│ │ Planting Carrots         │ │ 14:30 🌾 Plant carrot on plot 7 (Score: 8.5)    │  │
│ │                          │ │   └─ Low energy (450<500), high value crop       │  │
│ │ Plot: 7 / 20             │ │ 14:29 🌾 Harvest 3 ready carrots (+3 energy)     │  │
│ │ ▓▓▓▓▓▓▓░░░ 70%          │ │ 14:28 💧 Water 5 dry plots                       │  │
│ │                          │ │ 14:27 💧 Pump water (20→45 units)                │  │
│ │ Energy cost: 1           │ │ 14:25 🌾 Plant 5 carrots                         │  │
│ │ Expected gain: 3         │ │ 14:24 🏪 Buy Storage Shed II (100g)              │  │
│ │                          │ │ 14:23 📍 Travel Farm → Town (1 min)              │  │
│ └─────────────────────────┘ └──────────────────────────────────────────────────┘  │
│                                                                                      │
│ ┌─────────────────────────────────────────────────────────────────────────────┐   │
│ │ 🗺️ Farm Visualizer                                                           │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │   │
│ │                                                                                │   │
│ │  [🥕][🥕][🥕][🌱][🌱][  ][  ][  ][🚫][🚫]    Ready: 3                      │   │
│ │  [🌱][🌱][  ][  ][  ][  ][  ][  ][🚫][🚫]    Growing: 7                    │   │
│ │                                                        Empty: 10                │   │
│ │  🥕 = Ready  🌱 = Growing  💀 = Dead  🚫 = Locked    Locked: 10               │   │
│ │                                                                                │   │
│ └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│ ┌─────────────────────────────────────────────────────────────────────────────┐   │
│ │ Timeline    6:00    8:00    10:00   12:00   14:00   16:00   18:00   20:00    │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │   │
│ │ Events  ────●────────●────────────●────●●────▼───────────●──────────────────  │   │
│ │         Wake up   Check 1     Check 2  Buy    NOW    Dinner                   │   │
│ └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│ ┌────────────────────┐ ┌───────────────────┐ ┌──────────────────────────────────┐ │
│ │ 🕐 Screen Time      │ │ 🎯 Next Decision  │ │ ⚙️ Performance                   │ │
│ │ ━━━━━━━━━━━━━━━━━━ │ │ ━━━━━━━━━━━━━━━━ │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│ │                     │ │                   │ │                                   │ │
│ │ Farm     ████  42%  │ │ Action: Water     │ │ Sim Speed: 2,847 ticks/sec       │ │
│ │ Tower    ██    18%  │ │ Score: 6.2        │ │ UI FPS: 58                        │ │
│ │ Town     ██    16%  │ │ Reason: Dry plots │ │ Memory: 124 MB                    │ │
│ │ Adventure ██   20%  │ │ In: 30 seconds    │ │ CPU: 12%                          │ │
│ │ Mine     ░      4%  │ │                   │ │                                   │ │
│ └────────────────────┘ └───────────────────┘ └──────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Widget Specifications

### 1. Control Bar (Top)
**Purpose**: Primary simulation controls and status

**Components**:
- **Play/Pause Button**: Toggle simulation running state
- **Speed Selector**: 1x, 10x, 100x, Max speed options
- **Time Display**: Current game day and time with completion percentage
- **Recording Toggle**: Enable/disable session recording for replay
- **Debug Mode**: Toggle debug overlay and additional logging
- **Export Button**: Save simulation data as JSON
- **Stop Button**: Terminate simulation and return to setup

**Behavior**:
- Speed changes take effect immediately
- Recording saves every 10th frame to reduce memory
- Debug mode shows decision scoring in real-time

### 2. Current Location Widget
**Purpose**: Show where the hero is and what screen they're on

**Displays**:
- Large icon representing current game screen
- Screen name with visual emphasis
- Time spent on current screen
- Number of visits today
- Visual transition animation when changing screens

**Updates**: Every tick when location changes

### 3. Resources Widget
**Purpose**: Track all resources with visual bars

**Components**:
- **Energy Bar**: Green bar showing current/max with numeric display
- **Gold Display**: Coin icon with current amount
- **Water Bar**: Blue bar showing tank level
- **Seeds Counter**: Total seed count with storage icon
- **Materials List**: Compact grid of material counts

**Visual Indicators**:
- Red flash when resource hits cap
- Yellow pulse when resource below 20%
- Green glow when resource increasing

### 4. Phase Progress Widget
**Purpose**: Show game progression through phases

**Components**:
- Progress bars for each phase (Tutorial through Endgame)
- Current phase highlighted
- Next milestone displayed
- Blocking requirement shown if stuck

**Updates**: When major milestones completed

### 5. Current Action Widget
**Purpose**: Detailed view of what hero is doing RIGHT NOW

**Displays**:
- Action name and icon
- Progress bar if action has duration
- Resource costs/gains
- Success probability if applicable
- Plot/location specifics

**Behavior**:
- Smooth progress animation
- Color coding: Green=beneficial, Yellow=neutral, Red=risky

### 6. Action Log Widget
**Purpose**: Scrolling history of all actions taken

**Features**:
- Time-stamped entries
- Icons for action types
- Expandable details showing decision reasoning
- Score display for each action
- Auto-scroll toggle
- Filter by action type

**Entry Format**:
```
HH:MM [Icon] Action description (Score: X.X)
  └─ Reasoning or additional details
```

### 7. Farm Visualizer Widget
**Purpose**: Visual grid showing farm plot states

**Components**:
- Grid matching current farm size (3-90 plots)
- Visual indicators per plot:
  - 🥕 Ready to harvest
  - 🌱 Growing (stages 1-4)
  - 💀 Dead crop
  - 💧 Needs water (overlay)
  - 🚫 Locked plot
  - Empty plot
- Summary counts on side
- Animated hero position when planting/harvesting

**Updates**: Every farm action

### 8. Timeline Widget
**Purpose**: Show events across the day

**Components**:
- 24-hour timeline with current position marker
- Event dots sized by importance
- Hover for event details
- Upcoming events preview
- Click to jump to event (if recording enabled)

**Event Types**:
- Check-ins (persona schedule)
- Purchases
- Phase transitions
- Bottlenecks
- Achievements

### 9. Screen Time Widget
**Purpose**: Pie/bar chart of time distribution

**Displays**:
- Percentage time on each screen
- Color-coded bars
- Comparison to optimal distribution
- Trend arrows (spending more/less time)

**Updates**: Every minute of game time

### 10. Next Decision Widget
**Purpose**: Preview what AI will do next

**Shows**:
- Next planned action
- Score that led to selection
- Primary reason for choice
- Time until execution
- Alternative actions considered

**Transparency**: Makes AI decision-making visible

### 11. Performance Widget
**Purpose**: Monitor simulation performance

**Metrics**:
- Simulation speed (ticks/second)
- UI frame rate
- Memory usage with trend
- CPU usage percentage
- Dropped frames counter
- Worker thread status

**Visual Indicators**:
- Green: Optimal performance
- Yellow: Some throttling
- Red: Performance issues

---

## Widget Implementation Details

### Base Widget Component
```typescript
interface Widget {
  id: string
  title: string
  icon: string
  position: GridPosition
  size: 'small' | 'medium' | 'large' | 'wide'
  updateFrequency: 'tick' | 'second' | 'minute' | 'on-change'
  visible: boolean
  minimized: boolean
}
```

### Widget Update System
```typescript
class WidgetManager {
  private widgets: Map<string, Widget>
  private updateQueues: Map<UpdateFrequency, Set<string>>
  
  registerWidget(widget: Widget) {
    this.widgets.set(widget.id, widget)
    this.updateQueues.get(widget.updateFrequency).add(widget.id)
  }
  
  processUpdates(frequency: UpdateFrequency, data: GameState) {
    const toUpdate = this.updateQueues.get(frequency)
    for (const widgetId of toUpdate) {
      this.updateWidget(widgetId, data)
    }
  }
  
  updateWidget(id: string, data: GameState) {
    // Send update to specific widget component
    const widget = this.widgets.get(id)
    widget.update(data)
  }
}
```

### Responsive Grid Layout
```typescript
const GRID_LAYOUT = {
  columns: 12,
  rows: 8,
  gap: '1rem',
  widgets: [
    { id: 'location', position: { x: 0, y: 0, w: 3, h: 2 } },
    { id: 'resources', position: { x: 3, y: 0, w: 3, h: 2 } },
    { id: 'phase', position: { x: 6, y: 0, w: 3, h: 2 } },
    { id: 'action', position: { x: 0, y: 2, w: 3, h: 2 } },
    { id: 'log', position: { x: 3, y: 2, w: 6, h: 2 } },
    { id: 'farm', position: { x: 0, y: 4, w: 9, h: 2 } },
    { id: 'timeline', position: { x: 0, y: 6, w: 9, h: 1 } },
    { id: 'screentime', position: { x: 9, y: 0, w: 3, h: 2 } },
    { id: 'decision', position: { x: 9, y: 2, w: 3, h: 2 } },
    { id: 'performance', position: { x: 9, y: 4, w: 3, h: 2 } }
  ]
}
```

---

## Part 1: Simulation Engine Core

### 1.1 Master GameState

```typescript
// This is the source of truth for the entire simulation
interface GameState {
  // === TIME ===
  time: {
    day: number                    // Current day (1-35+)
    hour: number                   // Hour of day (0-23)
    minute: number                 // Minute (0-59)
    totalMinutes: number          // Total minutes elapsed
    ticksProcessed: number        // Total simulation ticks
  }
  
  // === RESOURCES ===
  resources: {
    energy: { current: number; max: number }
    gold: number
    water: { current: number; max: number }
    seeds: Map<string, number>    // seedId -> count
    materials: Map<string, number> // materialId -> count
  }
  
  // === PROGRESSION ===
  progression: {
    // Hero
    heroLevel: number
    heroXP: number
    heroHP: { current: number; max: number }
    
    // Farm
    farmStage: number              // 1-5
    farmPlots: number              // 3-90
    availablePlots: number         // Cleared but not planted
    
    // Unlocks
    unlockedRoutes: Set<string>    // Adventure route IDs
    unlockedUpgrades: Set<string>  // All purchased upgrade IDs
    completedCleanups: Set<string> // Farm cleanup IDs
    
    // Phase
    currentPhase: 'Tutorial' | 'Early' | 'Mid' | 'Late' | 'End' | 'Post'
  }
  
  // === INVENTORY ===
  inventory: {
    tools: Map<string, ToolState>
    weapons: Map<string, WeaponState>
    armor: ArmorPiece[]
    blueprints: Set<string>        // Purchased from town
  }
  
  // === ACTIVE PROCESSES ===
  processes: {
    crops: CropState[]             // One per plot
    crafting: CraftingQueue[]      // Items being forged
    adventure: AdventureState | null
    mining: MiningState | null
  }
  
  // === HELPERS ===
  helpers: {
    gnomes: GnomeState[]
    housingCapacity: number
  }
  
  // === LOCATION ===
  location: {
    currentScreen: GameScreen
    timeOnScreen: number           // Minutes
    lastScreenChange: number       // Total minutes when changed
  }
}

// Supporting types
interface CropState {
  plotId: number
  cropType: string | null         // null = empty
  plantedAt: number               // Total minutes
  growthStage: number            // 1-5
  waterLevel: number             // 0-1 (percent)
  isReady: boolean
  isDead: boolean
}

interface ToolState {
  id: string
  owned: boolean
  upgraded: boolean                // If forge upgraded
}

interface WeaponState {
  id: string
  level: number                    // 1-10
  damage: number
  attackSpeed: number
}

interface ArmorPiece {
  id: string
  defense: number
  effect: string
  equipped: boolean
}

interface GnomeState {
  id: string
  name: string
  level: number
  role: string | null
  xp: number
}

interface AdventureState {
  routeId: string
  startedAt: number
  duration: number
  heroHP: number
  currentWave: number
  enemiesKilled: number
  lootGained: any[]
}

interface MiningState {
  depth: number
  startedAt: number
  energyDrainRate: number
  materialsFound: Map<string, number>
}

interface CraftingQueue {
  itemId: string
  startedAt: number
  duration: number
  progress: number
}
```

### 1.2 Decision Engine

```typescript
class SimulationEngine {
  private state: GameState
  private parameters: SimulationParameters
  private gameData: GameDataStore
  private persona: Persona
  
  constructor(config: SimulationConfig) {
    this.state = this.initializeGameState()
    this.parameters = config.parameters
    this.gameData = config.gameData
    this.persona = config.persona
  }
  
  // Main simulation loop - called every tick
  tick(): TickResult {
    const actions: ExecutedAction[] = []
    
    // 1. Update time
    this.state.time.minute++
    if (this.state.time.minute >= 60) {
      this.state.time.minute = 0
      this.state.time.hour++
      if (this.state.time.hour >= 24) {
        this.state.time.hour = 0
        this.state.time.day++
      }
    }
    this.state.time.totalMinutes++
    
    // 2. Process ongoing activities
    this.processCrops()
    this.processCrafting()
    this.processAdventure()
    this.processMining()
    
    // 3. Check if hero should act (based on persona schedule)
    if (this.shouldHeroAct()) {
      const action = this.selectNextAction()
      if (action) {
        this.executeAction(action)
        actions.push(action)
      }
    }
    
    // 4. Process helper actions
    const helperActions = this.processHelpers()
    actions.push(...helperActions)
    
    // 5. Check for state changes/events
    const events = this.checkForEvents()
    
    return {
      state: this.state,
      actions,
      events,
      timestamp: this.state.time.totalMinutes
    }
  }
  
  private shouldHeroAct(): boolean {
    // Check persona schedule
    const schedule = this.persona.schedule
    const isWeekend = this.state.time.day % 7 >= 5
    const checkinsToday = isWeekend ? 
      schedule.weekend.checkIns : 
      schedule.weekday.checkIns
    
    // Simple model: spread check-ins evenly through the day
    const minutesPerCheckin = (24 * 60) / checkinsToday
    const nextCheckinMinute = Math.floor(
      this.state.time.totalMinutes / minutesPerCheckin
    ) * minutesPerCheckin
    
    return this.state.time.totalMinutes >= nextCheckinMinute
  }
  
  private selectNextAction(): GameAction | null {
    // Get all possible actions
    const actions = this.getAllPossibleActions()
    
    // Filter by prerequisites
    const eligible = actions.filter(a => this.checkPrerequisites(a))
    
    if (eligible.length === 0) return null
    
    // Score each action
    const scored = eligible.map(action => ({
      action,
      score: this.scoreAction(action)
    }))
    
    // Sort by score
    scored.sort((a, b) => b.score - a.score)
    
    // Return highest scoring action
    return scored[0]?.action || null
  }
  
  private getAllPossibleActions(): GameAction[] {
    const actions: GameAction[] = []
    
    // Farm actions
    if (this.state.location.currentScreen === 'farm') {
      // Plant actions
      for (const [seedType, count] of this.state.resources.seeds) {
        if (count > 0) {
          const emptyPlots = this.state.processes.crops.filter(
            c => c.cropType === null
          )
          if (emptyPlots.length > 0) {
            actions.push({
              type: 'plant',
              screen: 'farm',
              seedType,
              energyCost: 1,
              expectedReward: this.getCropValue(seedType)
            })
          }
        }
      }
      
      // Harvest actions
      const readyCrops = this.state.processes.crops.filter(c => c.isReady)
      if (readyCrops.length > 0) {
        actions.push({
          type: 'harvest',
          screen: 'farm',
          count: readyCrops.length,
          energyGain: readyCrops.reduce((sum, c) => 
            sum + this.getCropValue(c.cropType), 0
          )
        })
      }
      
      // Water actions
      const dryPlots = this.state.processes.crops.filter(
        c => c.waterLevel < 0.3 && c.cropType
      )
      if (dryPlots.length > 0 && this.state.resources.water.current > 0) {
        actions.push({
          type: 'water',
          screen: 'farm',
          count: Math.min(dryPlots.length, this.state.resources.water.current)
        })
      }
      
      // Cleanup actions
      const cleanups = this.gameData.getCleanupActions()
      for (const cleanup of cleanups) {
        if (!this.state.progression.completedCleanups.has(cleanup.id)) {
          actions.push({
            type: 'cleanup',
            screen: 'farm',
            cleanupId: cleanup.id,
            energyCost: cleanup.energyCost,
            plotsAdded: cleanup.plotsAdded
          })
        }
      }
    }
    
    // Screen change actions
    const screens = ['farm', 'tower', 'town', 'adventure', 'forge', 'mine']
    for (const screen of screens) {
      if (screen !== this.state.location.currentScreen) {
        actions.push({
          type: 'change_screen',
          toScreen: screen,
          timeCost: 1  // 1 minute to change screens
        })
      }
    }
    
    // Tower actions
    if (this.state.location.currentScreen === 'tower') {
      actions.push({
        type: 'catch_seeds',
        screen: 'tower',
        duration: this.parameters.tower.thresholds.activeSessionDuration,
        expectedSeeds: 10  // Based on reach level and efficiency
      })
    }
    
    // Town purchases
    if (this.state.location.currentScreen === 'town') {
      const affordable = this.getAffordableUpgrades()
      for (const upgrade of affordable) {
        actions.push({
          type: 'purchase',
          screen: 'town',
          itemId: upgrade.id,
          goldCost: upgrade.goldCost,
          category: upgrade.category
        })
      }
    }
    
    // Adventure actions
    if (this.state.location.currentScreen === 'adventure' && 
        !this.state.processes.adventure) {
      const routes = this.getAvailableRoutes()
      for (const route of routes) {
        for (const length of ['short', 'medium', 'long']) {
          actions.push({
            type: 'start_adventure',
            screen: 'adventure',
            routeId: route.id,
            length,
            energyCost: route[length].energy,
            duration: route[length].duration,
            expectedGold: route[length].gold,
            expectedXP: route[length].xp
          })
        }
      }
    }
    
    return actions
  }
  
  private checkPrerequisites(action: GameAction): boolean {
    // Check energy
    if (action.energyCost && 
        action.energyCost > this.state.resources.energy.current) {
      return false
    }
    
    // Check gold
    if (action.goldCost && 
        action.goldCost > this.state.resources.gold) {
      return false
    }
    
    // Check materials
    if (action.materialCosts) {
      for (const [mat, amount] of Object.entries(action.materialCosts)) {
        if ((this.state.resources.materials.get(mat) || 0) < amount) {
          return false
        }
      }
    }
    
    // Check prerequisites from CSV
    if (action.prerequisites) {
      for (const prereq of action.prerequisites) {
        if (!this.state.progression.unlockedUpgrades.has(prereq) &&
            !this.state.inventory.tools.has(prereq)) {
          return false
        }
      }
    }
    
    return true
  }
  
  private scoreAction(action: GameAction): number {
    let score = 0
    const params = this.parameters[action.screen]
    
    switch (action.type) {
      case 'plant':
        // Energy value is most important when low
        if (this.state.resources.energy.current < 
            params.thresholds.plantWhenEnergyBelow) {
          score = action.expectedReward * params.weights.energyValue * 2.0
        } else {
          score = action.expectedReward * params.weights.energyValue
        }
        break
        
      case 'harvest':
        // Always high priority when ready
        score = 100 + action.energyGain
        break
        
      case 'water':
        // Water if crops are drying
        score = action.count * params.weights.waterEfficiency * 10
        break
        
      case 'purchase':
        // Use priority system from parameters
        score = params.priorities[action.category] * 10
        // Reduce score if saving gold
        if (this.state.resources.gold < params.thresholds.saveGoldAbove) {
          score *= 0.5
        }
        break
        
      case 'start_adventure':
        // Consider risk vs reward
        const riskScore = 1.0 - (action.difficulty * 
                          (1.0 - params.thresholds.riskTolerance))
        score = (action.expectedGold * params.weights.goldReward +
                action.expectedXP * params.weights.xpReward) * riskScore
        break
        
      case 'change_screen':
        // Penalty for changing screens too often
        const timeSinceLast = this.state.time.totalMinutes - 
                             this.state.location.lastScreenChange
        if (timeSinceLast < 5) {
          score = -10  // Don't hop around constantly
        } else {
          score = 1  // Neutral, other actions will pull hero to screens
        }
        break
    }
    
    return score
  }
  
  private executeAction(action: GameAction): void {
    switch (action.type) {
      case 'plant':
        this.executePlant(action)
        break
      case 'harvest':
        this.executeHarvest(action)
        break
      case 'water':
        this.executeWater(action)
        break
      case 'purchase':
        this.executePurchase(action)
        break
      case 'start_adventure':
        this.startAdventure(action)
        break
      case 'change_screen':
        this.changeScreen(action)
        break
      // ... etc
    }
  }
}
```

### 1.3 Combat Simulation

```typescript
class CombatSimulator {
  // Simplified combat - not turn by turn, but statistical
  simulateCombat(
    route: AdventureRoute,
    weapons: WeaponState[],
    armor: ArmorPiece,
    heroLevel: number
  ): CombatResult {
    
    const heroHP = 100 + (heroLevel * 20)
    const defense = armor?.defense || 0
    
    let currentHP = heroHP
    let goldReward = 0
    let xpReward = 0
    let success = true
    
    // Process each wave
    for (let wave = 0; wave < route.waves; wave++) {
      const enemies = this.rollEnemies(route.enemyTypes)
      
      for (const enemy of enemies) {
        // Check weapon matchup
        const weapon = this.selectBestWeapon(weapons, enemy.type)
        const damageMultiplier = this.getMatchupMultiplier(
          weapon.type, 
          enemy.type
        )
        
        // Calculate time to kill
        const dps = weapon.damage * weapon.attackSpeed * damageMultiplier
        const timeToKill = enemy.hp / dps
        
        // Calculate damage taken
        const damageReduction = defense / 100
        const incomingDps = enemy.damage * enemy.attackSpeed * 
                           (1 - damageReduction)
        const damageTaken = incomingDps * timeToKill
        
        currentHP -= damageTaken
        
        if (currentHP <= 0) {
          success = false
          break
        }
      }
      
      if (!success) break
      
      // Wave complete, add rewards
      goldReward += route.goldPerWave
      xpReward += route.xpPerWave
    }
    
    // Boss fight if all waves cleared
    if (success && route.boss) {
      const boss = route.boss
      const weapon = this.selectBestWeapon(weapons, boss.weakness)
      
      // Simplified boss combat
      const timeToKill = boss.hp / (weapon.damage * weapon.attackSpeed)
      const damageTaken = boss.damage * timeToKill * (1 - defense/100)
      
      currentHP -= damageTaken
      
      if (currentHP > 0) {
        goldReward += boss.goldReward
        xpReward += boss.xpReward
        // Boss materials handled separately
      } else {
        success = false
      }
    }
    
    return {
      success,
      finalHP: Math.max(0, currentHP),
      goldReward: success ? goldReward : 0,
      xpReward: success ? xpReward : 0,
      duration: route.duration
    }
  }
  
  private getMatchupMultiplier(weapon: string, enemy: string): number {
    // Weapon advantage system
    const advantages = {
      'spear': 'armored_insects',
      'sword': 'beasts',
      'bow': 'flying',
      'crossbow': 'crawlers',
      'wand': 'plants'
    }
    
    if (advantages[weapon] === enemy) return 1.5
    // Check for resistance (opposite of advantage)
    for (const [w, e] of Object.entries(advantages)) {
      if (w !== weapon && e === enemy) return 0.5
    }
    return 1.0  // Neutral
  }
}
```

---

## Part 2: Web Worker Architecture

### 2.1 Worker Setup

```typescript
// simulation.worker.ts
import { SimulationEngine } from './SimulationEngine'

let engine: SimulationEngine | null = null
let running = false
let tickInterval: number | null = null

// Message handler
self.addEventListener('message', (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'init':
      initializeEngine(data)
      break
    case 'start':
      startSimulation()
      break
    case 'pause':
      pauseSimulation()
      break
    case 'stop':
      stopSimulation()
      break
    case 'setSpeed':
      setSimulationSpeed(data.speed)
      break
    case 'getState':
      sendState()
      break
  }
})

function initializeEngine(config: SimulationConfig) {
  engine = new SimulationEngine(config)
  
  // Send initial state
  self.postMessage({
    type: 'initialized',
    data: {
      state: engine.getState(),
      config
    }
  })
}

function startSimulation() {
  if (!engine || running) return
  
  running = true
  let lastTick = performance.now()
  const targetTickRate = 1000 / 30  // 30 ticks per second at 1x speed
  
  const tick = () => {
    if (!running) return
    
    const now = performance.now()
    const delta = now - lastTick
    
    if (delta >= targetTickRate) {
      // Process tick
      const result = engine!.tick()
      
      // Send update to main thread
      self.postMessage({
        type: 'tick',
        data: result
      })
      
      lastTick = now
    }
    
    // Continue loop
    tickInterval = requestAnimationFrame(tick)
  }
  
  tick()
}

function pauseSimulation() {
  running = false
  if (tickInterval) {
    cancelAnimationFrame(tickInterval)
    tickInterval = null
  }
}
```

### 2.2 Main Thread Bridge

```typescript
// SimulationBridge.ts
export class SimulationBridge {
  private worker: Worker | null = null
  private listeners = new Map<string, Set<Function>>()
  
  async initialize(config: SimulationConfig): Promise<void> {
    // Create worker
    this.worker = new Worker(
      new URL('./simulation.worker.ts', import.meta.url),
      { type: 'module' }
    )
    
    // Set up message handler
    this.worker.addEventListener('message', (event) => {
      this.handleWorkerMessage(event.data)
    })
    
    // Initialize engine
    this.worker.postMessage({
      type: 'init',
      data: config
    })
    
    // Wait for initialization
    return new Promise((resolve) => {
      this.once('initialized', resolve)
    })
  }
  
  private handleWorkerMessage(message: WorkerMessage) {
    const listeners = this.listeners.get(message.type)
    if (listeners) {
      listeners.forEach(fn => fn(message.data))
    }
  }
  
  on(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
  }
  
  once(event: string, handler: Function) {
    const wrapper = (data: any) => {
      handler(data)
      this.off(event, wrapper)
    }
    this.on(event, wrapper)
  }
  
  off(event: string, handler: Function) {
    this.listeners.get(event)?.delete(handler)
  }
  
  start() {
    this.worker?.postMessage({ type: 'start' })
  }
  
  pause() {
    this.worker?.postMessage({ type: 'pause' })
  }
  
  setSpeed(speed: number) {
    this.worker?.postMessage({ 
      type: 'setSpeed', 
      data: { speed } 
    })
  }
  
  terminate() {
    this.worker?.terminate()
    this.worker = null
  }
}
```

---

## Part 3: Live Monitor UI

### 3.1 Main Monitor Component

```vue
<template>
  <div class="live-monitor">
    <!-- Control Bar -->
    <div class="control-bar bg-sim-surface border-b border-sim-border p-2 flex items-center justify-between">
      <div class="controls flex gap-2">
        <button @click="togglePause" 
                class="px-3 py-1 bg-sim-accent text-white rounded hover:bg-blue-600">
          <i :class="isPaused ? 'fas fa-play' : 'fas fa-pause'"></i>
        </button>
        <button @click="stop" 
                class="px-3 py-1 bg-sim-error text-white rounded hover:bg-red-600">
          <i class="fas fa-stop"></i>
        </button>
        
        <select v-model="speed" @change="changeSpeed" 
                class="bg-sim-bg border border-sim-border rounded px-2 py-1 text-sim-text">
          <option value="1">1x</option>
          <option value="10">10x</option>
          <option value="100">100x</option>
          <option value="-1">Max</option>
        </select>
      </div>
      
      <div class="time-display text-sim-text">
        Day {{ gameTime.day }}, {{ formatTime(gameTime.hour, gameTime.minute) }}
        <span class="text-sim-muted ml-2">({{ completionPercent }}%)</span>
      </div>
    </div>
    
    <!-- Main Display Grid -->
    <div class="monitor-grid grid grid-cols-3 gap-4 p-4">
      <!-- Left Column -->
      <div class="space-y-4">
        <!-- Location Display -->
        <LocationDisplay 
          :current-screen="currentScreen"
          :time-on-screen="timeOnScreen"
        />
        
        <!-- Current Action -->
        <CurrentAction 
          :action="currentAction"
          :progress="actionProgress"
        />
        
        <!-- Recent Actions Log -->
        <ActionLog 
          :entries="recentActions"
          :max-visible="10"
        />
      </div>
      
      <!-- Center Column -->
      <div class="space-y-4">
        <!-- Screen Visualizer -->
        <ScreenVisualizer 
          :screen="currentScreen"
          :state="screenState"
        />
        
        <!-- Event Timeline -->
        <EventTimeline 
          :events="events"
          :current-time="gameTime.totalMinutes"
        />
      </div>
      
      <!-- Right Column -->
      <div class="space-y-4">
        <!-- Resources -->
        <ResourcePanel 
          :resources="resources"
          :materials="materials"
        />
        
        <!-- Phase Progress -->
        <PhaseProgress 
          :current-phase="currentPhase"
          :progress="phaseProgress"
        />
        
        <!-- Screen Time Distribution -->
        <ScreenTimeChart 
          :distribution="screenTimeDistribution"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMonitorStore } from '@/stores/monitor'
import { SimulationBridge } from '@/utils/SimulationBridge'

const monitor = useMonitorStore()
const bridge = ref<SimulationBridge | null>(null)

const isPaused = ref(false)
const speed = ref(100)
const gameTime = ref({ day: 1, hour: 0, minute: 0, totalMinutes: 0 })
const currentScreen = ref('farm')
const currentAction = ref(null)
const resources = ref({})
const events = ref([])

onMounted(async () => {
  // Get config from localStorage (set by Setup screen)
  const config = JSON.parse(
    localStorage.getItem('currentSimulation') || '{}'
  )
  
  // Initialize simulation
  bridge.value = new SimulationBridge()
  await bridge.value.initialize(config)
  
  // Set up event handlers
  bridge.value.on('tick', handleTick)
  bridge.value.on('event', handleEvent)
  bridge.value.on('complete', handleComplete)
  
  // Start simulation
  bridge.value.start()
})

onUnmounted(() => {
  bridge.value?.terminate()
})

function handleTick(tickData: TickResult) {
  // Update all reactive state
  gameTime.value = tickData.state.time
  currentScreen.value = tickData.state.location.currentScreen
  resources.value = tickData.state.resources
  
  // Add actions to log
  tickData.actions.forEach(action => {
    monitor.addAction(action)
  })
  
  // Update current action
  if (tickData.actions.length > 0) {
    currentAction.value = tickData.actions[0]
  }
}

function togglePause() {
  isPaused.value = !isPaused.value
  if (isPaused.value) {
    bridge.value?.pause()
  } else {
    bridge.value?.start()
  }
}

function changeSpeed() {
  bridge.value?.setSpeed(parseInt(speed.value))
}
</script>
```

---

## Success Criteria

- [ ] GameState properly tracks all game elements
- [ ] Decision engine selects logical actions based on parameters
- [ ] Web Worker runs simulation without blocking UI
- [ ] Live Monitor displays real-time updates smoothly
- [ ] Can pause/resume/change speed during simulation
- [ ] Action log shows what AI is doing and why
- [ ] Resource tracking matches game rules
- [ ] Combat simulation produces reasonable results
- [ ] Helpers function according to roles
- [ ] Simulation completes full 35-day runs

---

## Key Architecture Insights

1. **GameState is King**: Single source of truth for everything
2. **Decision Scoring**: Mathematical model for action selection  
3. **Web Worker Isolation**: Simulation runs in background thread
4. **Event-Driven Updates**: UI reacts to worker messages
5. **Deterministic Simulation**: Same inputs = same outputs
6. **Statistical Combat**: Fast approximation, not turn-by-turn
7. **Parameter Transparency**: All weights and thresholds visible

---

*Document updated: January 2025*  
*Ready for implementation with Phase 5 parameter editor*
