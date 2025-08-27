# Time Hero Simulator - Simulation Setup
## Document 5: Simple Config & Detailed Parameter Editing

---

## 📋 ACTUAL REQUIREMENTS & MVP GOALS

### Core Purpose
Create a **simple single-page setup** to launch simulations quickly, PLUS **detailed parameter editing screens** that expose all the simulation logic hooks and decision weights. This makes the AI behavior transparent and tweakable.

### MVP Requirements (What We're Actually Building)
1. **Single Page Quick Setup** - Pick persona and basic config
2. **Parameter Editor Screens** - One for each game system showing AI decision logic
3. **Decision Weight Visualizer** - See exactly how the AI makes choices
4. **Threshold Editor** - Modify trigger points for actions
5. **Save/Load Parameter Sets** - Store custom configurations

### What We're NOT Building (Yet)
- Multi-step wizards
- A/B testing setup
- Complex validation flows
- Batch configuration

---

## Part 1: Quick Launch Page

### ASCII UI Mockup
```
┌─────────────────────────────────────────────────────────────────┐
│ Simulation Setup                               [Back to Dashboard] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Quick Configuration                                           │
│  ───────────────────                                           │
│                                                                 │
│  Name: [Casual Test Run_________________]                     │
│                                                                 │
│  Select Persona:                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │    ⚡    │ │    😊    │ │    📅    │ │    🔧    │           │
│  │ SPEED   │ │ CASUAL  │ │ WEEKEND │ │ CUSTOM  │           │
│  │ [Select]│ │ [✓]     │ │ [Select]│ │ [Select]│           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                                 │
│  Duration: [35] days    Speed: [●] Fast (100x)                │
│                                                                 │
│  [🚀 Launch Simulation]  [⚙️ Edit Parameters]                  │
│                                                                 │
│  Recent Runs:                                                  │
│  • Casual 35-day - Completed ✓                                │
│  • Speed test - Bottleneck day 12 ✗                           │
│  • Weekend warrior - Running... 47%                            │
└─────────────────────────────────────────────────────────────────┘
```

### Quick Setup Data Structure
```typescript
interface QuickSetupConfig {
  name: string
  personaId: string  // From Phase 4
  duration: number   // Days
  speed: 'realtime' | 'fast' | 'maximum'
  
  // Auto-load last parameter edits if they exist
  parameterOverrides?: SimulationParameters
}
```

---

## Part 2: Parameter Editor Screens

### Parameter Editor Navigation
```
┌─────────────────────────────────────────────────────────────────┐
│ Parameter Editor - Casual Persona                    [< Back]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Farm] [Tower] [Adventure] [Town] [Forge] [Mine] [Helpers]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1 Farm Parameters Screen

```typescript
interface FarmParameters {
  // Decision Thresholds
  thresholds: {
    plantWhenEnergyBelow: number      // Default: 500
    harvestWhenReady: boolean         // Default: true
    harvestEarlyThreshold: number     // Default: 0.9 (90% grown)
    waterWhenDryBelow: number        // Default: 0.3
    pumpWaterWhenBelow: number       // Default: 20
    cleanupPriority: number          // Default: 0.7
  }
  
  // Decision Weights (what to prioritize)
  weights: {
    energyValue: number              // Default: 1.0
    growthSpeed: number              // Default: 0.5
    waterEfficiency: number          // Default: 0.3
    seedAvailability: number         // Default: 0.2
  }
  
  // Behavior Patterns
  patterns: {
    plantingStrategy: 'highest_value' | 'fastest_growth' | 'balanced' | 'diverse'
    wateringPattern: 'all_at_once' | 'as_needed' | 'priority_based'
    cleanupTiming: 'immediate' | 'energy_threshold' | 'scheduled'
    plotExpansion: 'aggressive' | 'conservative' | 'milestone_based'
  }
  
  // Activity Schedule
  schedule: {
    visitsPerDay: number
    morningCheckTime: number  // Hour 0-23
    eveningCheckTime: number
    weekendMultiplier: number
  }
}
```

#### Farm Parameter UI
```
┌─────────────────────────────────────────────────────────────────┐
│ Farm Parameters                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Decision Thresholds                                           │
│  ──────────────────                                            │
│  Plant when energy < [500___] (will plant crops for energy)   │
│  Harvest at [90]% growth (100% = fully grown)                 │
│  Water when moisture < [30]% (crops slow/stop below this)     │
│  Pump water when tank < [20] units                            │
│  Cleanup priority: [====●═══] 0.7 (0=never, 1=always)        │
│                                                                 │
│  Decision Weights (AI priorities)                              │
│  ──────────────                                                │
│  Energy value:        [========●=] 1.0x                        │
│  Growth speed:        [====●=====] 0.5x                        │
│  Water efficiency:    [===●======] 0.3x                        │
│  Seed availability:   [==●=======] 0.2x                        │
│                                                                 │
│  Planting Strategy: [Highest Value ▼]                          │
│  Watering Pattern:  [As Needed ▼]                              │
│  Cleanup Timing:    [Energy Threshold ▼]                       │
│                                                                 │
│  Schedule                                                       │
│  ────────                                                       │
│  Check farm [2] times per day                                  │
│  Morning: [08:00]  Evening: [20:00]                           │
│  Weekend multiplier: [2.0]x                                    │
│                                                                 │
│  [Reset to Defaults]  [Save as Preset]                         │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Tower Parameters Screen

```typescript
interface TowerParameters {
  thresholds: {
    seedStorageTarget: number        // Keep this many seeds
    minSeedsBeforeCatching: number   // Don't catch if above this
    activeSessionDuration: number    // Minutes per manual session
    autoCatcherUpgradePriority: number
  }
  
  weights: {
    seedTierValue: number[]          // Weight per seed level [0-9]
    diversityBonus: number           // Extra weight for variety
    storageEfficiency: number        // How full to keep storage
  }
  
  patterns: {
    catchingSchedule: 'regular' | 'when_low' | 'optimal_times'
    targetDistribution: 'even' | 'tier_weighted' | 'need_based'
  }
}
```

### 2.3 Adventure Parameters Screen

```typescript
interface AdventureParameters {
  thresholds: {
    minEnergyToStart: number         // Don't adventure below this
    minHPPercent: number             // Retreat if HP drops below
    riskTolerance: number            // 0=safe routes only, 1=any route
    restBetweenRuns: number          // Minutes between adventures
  }
  
  weights: {
    goldReward: number
    materialReward: number
    xpReward: number
    gnomeRescue: number              // Priority for first clears
    routeDifficulty: number          // Negative = prefer easier
  }
  
  combatSimulation: {
    weaponSwitchDelay: number        // Seconds to switch weapons
    retreatThreshold: number         // HP% to abandon adventure
    potionUsageThreshold: number     // HP% to use healing
    bossFightCaution: number         // Extra safety for bosses
  }
  
  routeSelection: {
    strategy: 'progression' | 'farming' | 'material_hunt' | 'xp_grind'
    lengthPreference: 'short' | 'medium' | 'long' | 'efficiency_based'
    repeatSuccessful: boolean        // Farm routes that work
  }
}
```

### 2.4 Town Purchase Parameters

```typescript
interface TownParameters {
  thresholds: {
    saveGoldAbove: number            // Keep emergency fund
    buyWhenBlockedBy: boolean        // Buy prerequisites immediately
    upgradeCompletionTarget: number  // % of available upgrades to buy
  }
  
  priorities: {
    energyStorage: number
    waterStorage: number
    seedStorage: number
    tools: number
    weapons: number
    landDeeds: number
    towerReach: number
    gnomeHousing: number
  }
  
  purchaseRules: {
    strategy: 'cheapest_first' | 'prerequisite_chain' | 'balanced' | 'custom'
    maxGoldPercent: number           // Max % of gold to spend at once
    emergencyReserve: number         // Always keep this much gold
  }
}
```

### 2.5 Forge Parameters

```typescript
interface ForgeParameters {
  thresholds: {
    minEnergyToCraft: number
    materialStockTarget: number      // Refine when raw > this
    toolUpgradePriority: number
    weaponUpgradePriority: number
  }
  
  craftingQueue: {
    priorityList: string[]           // Item IDs in order
    batchCrafting: boolean
    waitForOptimalHeat: boolean      // Wait for success rate
    maxFailuresBeforeSkip: number
  }
  
  refinement: {
    autoRefine: boolean
    keepRawBuffer: number            // Keep some raw materials
    refinementBatching: number       // Batch size
  }
}
```

### 2.6 Mining Parameters

```typescript
interface MiningParameters {
  thresholds: {
    minEnergyToMine: number
    targetDepth: number              // Go this deep if possible
    retreatEnergyBuffer: number      // Save energy to get out
    materialTargets: Map<string, number>  // Desired materials
  }
  
  miningStrategy: {
    pattern: 'shallow_sustainable' | 'deep_burst' | 'material_focused'
    sharpenToolFrequency: number    // How often to sharpen
    shortcutUsage: boolean           // Use built shortcuts
    energyEfficiency: number         // 0=max materials, 1=max efficiency
  }
}
```

### 2.7 Helper (Gnome) Parameters

```typescript
interface HelperParameters {
  thresholds: {
    reassignEfficiencyDrop: number   // Reassign if efficiency < this
    trainingEnergyPercent: number    // % of energy for training
    roleChangeFrequency: number      // Hours between role changes
  }
  
  roleAssignment: {
    strategy: 'balanced' | 'farm_focus' | 'progression_focus' | 'custom'
    priorities: {
      watering: number
      planting: number
      harvesting: number
      mining: number
      combat: number
      foraging: number
    }
  }
  
  training: {
    focusHighestLevel: boolean       // Train best gnome first
    targetLevel: number              // Stop training at this level
    trainingSchedule: 'continuous' | 'energy_surplus' | 'scheduled'
  }
}
```

---

## Part 3: Decision Engine Visualization

### How Decisions Are Made (Transparency View)

```
┌─────────────────────────────────────────────────────────────────┐
│ Decision Engine - Current State: FARM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Available Actions:                     Score:                 │
│  ─────────────────                      ──────                 │
│  ✓ Plant Carrots (5 energy)            8.5                    │
│    └─ High energy value (1.0 × 3.0)                           │
│    └─ Seeds available (0.2 × 2.0)                             │
│    └─ Fast growth (0.5 × 1.5)                                 │
│                                                                 │
│  ○ Water Plots (0 energy)              6.2                    │
│    └─ Plots need water (1.0 × 4.0)                            │
│    └─ Water available (0.3 × 0.7)                             │
│                                                                 │
│  ○ Go to Tower (0 energy)              3.1                    │
│    └─ Low seed count (0.2 × 5.0)                              │
│    └─ Time penalty (-2.0)                                     │
│                                                                 │
│  Selected Action: Plant Carrots (highest score)                │
│                                                                 │
│  Reasoning: Energy below threshold (450 < 500), seeds         │
│  available, high ROI crop, meets all prerequisites.           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 4: Simulation Architecture

### Core GameState Object

```typescript
interface GameState {
  // Time tracking
  time: {
    day: number
    hour: number
    minute: number
    totalMinutes: number
    realTimeElapsed: number
  }
  
  // Resources
  resources: {
    energy: { current: number; max: number }
    gold: number
    water: { current: number; max: number }
    seeds: Map<string, number>
    materials: Map<string, number>
  }
  
  // Progression
  progression: {
    heroLevel: number
    heroXP: number
    farmPlots: number
    unlockedScreens: Set<string>
    completedActions: Set<string>
    currentPhase: GamePhase
  }
  
  // Owned Items (crafted/purchased)
  inventory: {
    tools: Map<string, boolean>
    weapons: Map<string, WeaponState>
    armor: ArmorPiece[]
    blueprints: Set<string>
  }
  
  // Active Processes
  activeProcesses: {
    crops: CropState[]
    crafting: CraftingQueue
    adventure: AdventureState | null
    mining: MiningState | null
  }
  
  // Helpers
  helpers: {
    gnomes: GnomeState[]
    housing: number  // Current capacity
  }
}
```

### Decision Engine

```typescript
class DecisionEngine {
  constructor(
    private gameState: GameState,
    private gameData: GameDataStore,
    private parameters: SimulationParameters
  ) {}
  
  getNextAction(): GameAction | null {
    // 1. Get all available actions
    const available = this.getAvailableActions()
    
    // 2. Filter by prerequisites
    const eligible = available.filter(action => 
      this.checkPrerequisites(action)
    )
    
    // 3. Score each action
    const scored = eligible.map(action => ({
      action,
      score: this.scoreAction(action)
    }))
    
    // 4. Select highest scoring
    const best = scored.reduce((a, b) => 
      a.score > b.score ? a : b
    )
    
    return best?.action || null
  }
  
  private checkPrerequisites(action: GameAction): boolean {
    // Check item prerequisites
    if (action.requires) {
      for (const req of action.requires) {
        if (!this.gameState.inventory.tools.has(req) &&
            !this.gameState.inventory.weapons.has(req)) {
          return false
        }
      }
    }
    
    // Check resource costs
    if (action.energyCost > this.gameState.resources.energy.current) {
      return false
    }
    
    if (action.goldCost > this.gameState.resources.gold) {
      return false
    }
    
    // Check material costs
    if (action.materialCosts) {
      for (const [material, amount] of action.materialCosts) {
        if ((this.gameState.resources.materials.get(material) || 0) < amount) {
          return false
        }
      }
    }
    
    return true
  }
  
  private scoreAction(action: GameAction): number {
    let score = 0
    const params = this.parameters[action.screen]
    
    // Apply weights based on action type
    switch (action.type) {
      case 'plant':
        score += params.weights.energyValue * action.expectedEnergy
        score += params.weights.growthSpeed * (1 / action.growthTime)
        break
        
      case 'purchase':
        score += params.priorities[action.category] * action.value
        break
        
      case 'adventure':
        score += params.weights.goldReward * action.expectedGold
        score += params.weights.xpReward * action.expectedXP
        score -= params.weights.routeDifficulty * action.difficulty
        break
    }
    
    // Apply urgency modifiers
    if (this.gameState.resources.energy.current < params.thresholds.plantWhenEnergyBelow) {
      if (action.type === 'plant' || action.type === 'harvest') {
        score *= 2.0  // Urgent need for energy
      }
    }
    
    return score
  }
}
```

### Action Execution

```typescript
class ActionExecutor {
  executeAction(action: GameAction, state: GameState): GameState {
    const newState = { ...state }
    
    switch (action.type) {
      case 'plant':
        return this.executePlant(newState, action)
      case 'harvest':
        return this.executeHarvest(newState, action)
      case 'purchase':
        return this.executePurchase(newState, action)
      case 'craft':
        return this.executeCraft(newState, action)
      case 'adventure':
        return this.startAdventure(newState, action)
      // ... etc
    }
    
    return newState
  }
  
  private executePlant(state: GameState, action: PlantAction): GameState {
    // Find empty plot
    const emptyPlot = state.activeProcesses.crops.findIndex(c => !c)
    
    if (emptyPlot >= 0) {
      // Deduct seed
      const seedCount = state.resources.seeds.get(action.seedType) || 0
      state.resources.seeds.set(action.seedType, seedCount - 1)
      
      // Plant crop
      state.activeProcesses.crops[emptyPlot] = {
        type: action.seedType,
        plantedAt: state.time.totalMinutes,
        growth: 0,
        watered: true,
        stage: 1
      }
      
      // Deduct energy
      state.resources.energy.current -= action.energyCost
    }
    
    return state
  }
}
```

---

## Part 5: Store Implementation

```typescript
export const useSetupStore = defineStore('simulationSetup', () => {
  // Quick setup state
  const quickConfig = ref<QuickSetupConfig>({
    name: '',
    personaId: 'casual',
    duration: 35,
    speed: 'fast'
  })
  
  // Parameter overrides for each system
  const parameters = ref<SimulationParameters>({
    farm: { /* defaults */ },
    tower: { /* defaults */ },
    adventure: { /* defaults */ },
    town: { /* defaults */ },
    forge: { /* defaults */ },
    mine: { /* defaults */ },
    helpers: { /* defaults */ }
  })
  
  // Current editing screen
  const editingScreen = ref<string>('farm')
  
  // Launch simulation with current config
  async function launchSimulation() {
    const config: SimulationConfig = {
      ...quickConfig.value,
      parameters: parameters.value,
      gameData: useGameDataStore().items,
      persona: usePersonaStore().getPersona(quickConfig.value.personaId)
    }
    
    // Save to localStorage for Live Monitor
    localStorage.setItem('currentSimulation', JSON.stringify(config))
    
    // Navigate to Live Monitor
    await router.push('/live-monitor')
  }
  
  // Save/Load parameter sets
  function saveParameterSet(name: string) {
    const saved = JSON.parse(localStorage.getItem('parameterSets') || '{}')
    saved[name] = parameters.value
    localStorage.setItem('parameterSets', JSON.stringify(saved))
  }
  
  function loadParameterSet(name: string) {
    const saved = JSON.parse(localStorage.getItem('parameterSets') || '{}')
    if (saved[name]) {
      parameters.value = saved[name]
    }
  }
  
  // Reset parameters to persona defaults
  function resetToPersonaDefaults() {
    const persona = usePersonaStore().getPersona(quickConfig.value.personaId)
    if (persona) {
      parameters.value = generateDefaultParameters(persona)
    }
  }
  
  return {
    quickConfig,
    parameters,
    editingScreen,
    launchSimulation,
    saveParameterSet,
    loadParameterSet,
    resetToPersonaDefaults
  }
})
```

---

## Success Criteria

- [ ] Single page quick setup works
- [ ] Can select persona and launch immediately  
- [ ] Parameter editor shows all decision weights
- [ ] Can modify thresholds and see effects
- [ ] Decision engine visualization shows reasoning
- [ ] Parameters save/load correctly
- [ ] Integration with game data from Phase 1-3
- [ ] Ready for simulation engine in Phase 6

---

## Key Insights

1. **Transparency is Key**: Players need to see HOW the AI makes decisions
2. **Everything is Tunable**: Every threshold and weight is exposed
3. **Quick Launch + Deep Edit**: Fast path for testing, detailed path for tuning
4. **Decision Scoring**: Clear mathematical model for action selection
5. **State Management**: Clean separation between game state and decision logic

---

*Document updated: January 2025*  
*Ready for implementation with Phase 6 simulation engine*
