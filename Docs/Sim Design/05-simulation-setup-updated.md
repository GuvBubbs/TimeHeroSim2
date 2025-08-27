# Time Hero Simulator - Phase 5: Simulation Setup & Parameter Control
## Document 5 (Updated): Configuration & System Parameter Editing

---

## Overview

Phase 5 provides the interface for configuring simulations and exposing all internal simulation parameters for fine-tuning. This includes a simplified single-page setup for basic configuration and persona selection, plus detailed parameter editing screens for each game system that make the simulation logic transparent and adjustable.

---

## Part 1: Basic Simulation Setup (Single Page)

### Quick Configuration Screen

```typescript
interface QuickSetup {
  // Basic identification
  name: string
  description?: string
  
  // Persona selection (from Phase 4)
  personaId: 'speedrunner' | 'casual' | 'weekend-warrior' | 'custom'
  
  // Duration
  duration: {
    mode: 'fixed' | 'completion' | 'bottleneck'
    maxDays?: number
    bottleneckThreshold?: number // Days without progress
  }
  
  // Speed
  speed: 'realtime' | 'fast' | 'maximum'
  
  // Data source
  dataSource: 'current' | 'default' | 'saved'
  savedConfigId?: string
  
  // Launch options
  enableParameterOverrides: boolean
  generateDetailedLogs: boolean
  recordForPlayback: boolean
}
```

### UI Layout
```
┌────────────────────────────────────────────────────────┐
│ Simulation Setup                     [Parameter Editor] │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Name: [_________________________________]              │
│                                                        │
│ Select Persona:                                        │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                     │
│ │ ⚡  │ │ 😊  │ │ 📅  │ │ ➕  │                     │
│ │Speed│ │Casual│ │Week │ │Custom│                     │
│ └─────┘ └─────┘ └─────┘ └─────┘                     │
│                                                        │
│ Duration:                                              │
│ ○ Fixed [35] days                                     │
│ ● Run until complete                                  │
│ ○ Stop if stuck for [3] days                          │
│                                                        │
│ Speed: [Fast (100x) ▼]                                │
│                                                        │
│ ☑ Show parameter overrides                            │
│ ☐ Generate detailed logs                              │
│                                                        │
│ [🎯 Quick Presets] [💾 Save] [🚀 Launch Simulation]   │
└────────────────────────────────────────────────────────┘
```

---

## Part 2: Detailed Parameter Editing Screens

These screens expose all the internal simulation logic parameters, making the "black box" transparent and allowing fine-tuning of any aspect of the simulation.

### Parameter Editor Navigation

```typescript
interface ParameterEditor {
  screens: {
    'farm': FarmParameters
    'tower': TowerParameters
    'town': TownParameters
    'adventure': AdventureParameters
    'forge': ForgeParameters
    'mine': MineParameters
    'helpers': HelperParameters
    'resources': ResourceParameters
    'decisions': DecisionParameters
  }
  
  globalOverrides: Map<string, any>
  screenSpecificOverrides: Map<string, Map<string, any>>
}
```

---

## 2.1 Farm System Parameters

### Core Farm Mechanics

```typescript
interface FarmParameters {
  // Initial state
  initialState: {
    plots: number                    // Starting plots (default: 3)
    seeds: SeedInventory             // Starting seeds
    water: number                     // Starting water (default: 20)
    energy: number                    // Starting energy (default: 50)
    unlockedLandStages: string[]     // Which cleanups are available
  }
  
  // Crop mechanics
  cropMechanics: {
    growthTimeMultiplier: number     // Speed up/down growth (default: 1.0)
    waterConsumptionRate: number     // Water per plot per tick (default: 1)
    witheredCropChance: number       // Chance crop dies without water (default: 0.1)
    harvestWindowMinutes: number     // Time before crop withers (default: 30)
    energyConversionEfficiency: number // Energy gained vs CSV value (default: 1.0)
  }
  
  // Water system
  waterSystem: {
    pumpEfficiency: number           // Water per pump action (default: varies by upgrade)
    evaporationRate: number          // Water lost per hour (default: 0)
    rainChance: number               // Random rain events (default: 0)
    maxWaterStorage: number          // Override tank capacity
    autoPumpThreshold: number        // When to auto-pump (default: 20%)
  }
  
  // Land expansion
  landExpansion: {
    cleanupEnergyMultiplier: number  // Energy cost modifier (default: 1.0)
    cleanupTimeMultiplier: number    // Time to complete modifier (default: 1.0)
    autoCleanupEnabled: boolean      // Auto-clean when resources available
    prioritizeCleanupOrder: string[] // Order to clean obstacles
    plotsPerCleanup: number[]        // Override plots gained
  }
  
  // Automation behavior
  automation: {
    autoPlant: boolean                // Auto-plant when plots empty
    plantingStrategy: 'highest-value' | 'fastest-growth' | 'balanced' | 'diverse'
    autoWater: boolean                // Auto-water when needed
    wateringThreshold: number        // Water level to trigger (default: 30%)
    autoHarvest: boolean              // Auto-harvest when ready
    harvestTiming: 'immediate' | 'batch' | 'optimal'
    
    // Decision weights
    priorityWeights: {
      planting: number                // Weight for planting actions (default: 1.0)
      watering: number                // Weight for watering actions (default: 1.5)
      harvesting: number              // Weight for harvesting actions (default: 2.0)
      pumping: number                 // Weight for pumping water (default: 1.2)
      cleanup: number                 // Weight for land cleanup (default: 0.8)
    }
  }
  
  // Gnome assistance (when helpers available)
  helperEfficiency: {
    wateringSpeed: number             // Plots per minute per gnome
    plantingSpeed: number             // Seeds per minute per gnome
    harvestingSpeed: number           // Plots per minute per gnome
    pumpingBonus: number              // Extra water per pump with helper
  }
}
```

### Farm Parameter UI

```
┌─────────────────────────────────────────────────┐
│ Farm System Parameters                         │
├─────────────────────────────────────────────────┤
│ Initial State:                                │
│   Starting Plots: [3____] (3-8)              │
│   Starting Seeds: [Carrot: 10][Radish: 5]    │
│   Starting Water: [20___] Starting Energy: [50] │
│                                               │
│ Growth Mechanics:                             │
│   Growth Speed:     [1.0x] ───────────○───    │
│   Water Usage:      [1.0x] ────────○──────    │
│   Wither Chance:    [10%]  ──○────────────    │
│   Harvest Window:   [30] minutes              │
│                                               │
│ Automation:                                   │
│   ☑ Auto-plant    Strategy: [Highest Value ▼]│
│   ☑ Auto-water    Threshold: [30%] ──────○   │
│   ☑ Auto-harvest  Timing: [Immediate ▼]      │
│                                               │
│ Priority Weights:                             │
│   Plant:   [1.0] ────────○────────           │
│   Water:   [1.5] ───────────○─────           │
│   Harvest: [2.0] ──────────────○──           │
│   Pump:    [1.2] ─────────○───────           │
│   Cleanup: [0.8] ────○─────────────          │
└─────────────────────────────────────────────────┘
```

---

## 2.2 Tower System Parameters

```typescript
interface TowerParameters {
  // Seed catching mechanics
  catchMechanics: {
    manualCatchRate: number          // Seeds per minute active play
    manualCatchRadius: number        // Catch hitbox size
    windSpeedMultiplier: number      // Speed of seed movement
    seedDensity: number              // Seeds per spawn wave
    netEfficiencyMultiplier: number  // Bonus from net upgrades
  }
  
  // Auto-catcher behavior
  autoCatcher: {
    baseRate: number                 // Seeds per hour base
    levelBonus: number[]              // Bonus per auto-catcher level
    seedPoolBias: number[]            // Weight for each seed level
    offlineMultiplier: number        // Efficiency when offline
    
    // Smart catching
    prioritization: 'random' | 'highest-tier' | 'needed' | 'balanced'
    targetSeedRatios: Map<string, number>  // Desired seed inventory ratios
  }
  
  // Unlock progression
  unlockProgression: {
    reachLevelCosts: number[]        // Override gold costs
    reachLevelEnergy: number[]       // Override energy costs
    skipPrerequisites: boolean       // Ignore normal prerequisites
    autoUnlockAtPhase: string[]      // Auto-unlock at game phase
  }
  
  // Decision logic
  decisionLogic: {
    visitFrequency: number           // How often to check tower
    catchDuration: number            // Minutes to spend catching
    upgradeThreshold: number         // When to buy upgrades (gold ratio)
    seedTargetMultiplier: number    // How many seeds to maintain (x plots)
  }
}
```

---

## 2.3 Adventure System Parameters

```typescript
interface AdventureParameters {
  // Combat mechanics
  combatMechanics: {
    damageMultiplier: number         // Global damage modifier
    defenseMultiplier: number        // Global defense modifier
    weaponAdvantageBonus: number     // Extra damage with advantage (default: 1.5x)
    weaponDisadvantage: number       // Reduced damage with resistance (default: 0.5x)
    
    heroHP: {
      baseHP: number                 // Starting HP
      hpPerLevel: number             // HP gained per level
      maxLevel: number               // Level cap
    }
    
    weaponSwitchTime: number         // Seconds to switch weapons
    combatSpeed: number              // Speed up/down combat
  }
  
  // Enemy rolls
  enemyGeneration: {
    waveSize: number[]               // Override wave sizes
    enemyTypeWeights: Map<string, number>  // Bias enemy spawns
    bossHealthMultiplier: number    // Boss HP modifier
    bossDamageMultiplier: number    // Boss damage modifier
    
    rollPersistence: boolean        // Keep same roll after failure
    rerollOnSuccess: boolean        // New roll after victory
    guaranteedComposition: string[] // Force specific enemies
  }
  
  // Risk assessment
  riskCalculation: {
    hpSafetyMargin: number          // Required HP buffer (default: 20%)
    defenseWeight: number           // Importance of defense
    weaponCoverageWeight: number    // Importance of type coverage
    bossWeaknessWeight: number      // Importance of boss counter
    
    riskTolerance: {              // Override persona risk tolerance
      safe: number                  // Max risk for safe (default: 0.2)
      moderate: number              // Max risk for moderate (default: 0.5)
      dangerous: number             // Max risk for dangerous (default: 0.8)
    }
  }
  
  // Route selection
  routeSelection: {
    strategy: 'optimal' | 'safe' | 'risky' | 'random' | 'scripted'
    scriptedSequence: string[]      // Predefined route order
    
    priorityFactors: {
      gold: number                  // Weight gold rewards
      materials: number             // Weight material drops
      xp: number                    // Weight XP gains
      completion: number            // Weight finishing routes
      gnomeRescue: number          // Weight rescuing helpers
    }
    
    energyThreshold: number         // Min energy before attempting
    backtrackingAllowed: boolean   // Can repeat completed routes
    difficultyPreference: 'short' | 'medium' | 'long' | 'adaptive'
  }
  
  // Loot and rewards
  lootSystem: {
    dropRateMultiplier: number     // Modify drop chances
    goldMultiplier: number         // Modify gold rewards
    xpMultiplier: number           // Modify XP gains
    guaranteedDrops: string[]       // Force specific drops
    
    armorStrategy: 'keep-best' | 'keep-effects' | 'sell-all'
    armorUpgradePriority: string[] // Which effects to prioritize
  }
}
```

---

## 2.4 Forge System Parameters

```typescript
interface ForgeParameters {
  // Crafting mechanics
  craftingMechanics: {
    baseSuccessRate: number         // Starting success chance
    heatBandWidth: number           // Size of optimal heat zone
    heatDecayRate: number          // Heat loss per second
    craftTimeMultiplier: number    // Speed up/down crafting
    
    batchSizeOverride: number      // Force batch size
    masterCraftChance: number      // Double output chance
  }
  
  // Material refinement
  refinement: {
    refinementTimeMultiplier: number  // Speed modifier
    refinementEnergyMultiplier: number // Energy cost modifier
    autoRefineThreshold: number       // Auto-refine when > X raw
    refinementStrategy: 'immediate' | 'batch' | 'as-needed'
  }
  
  // Tool crafting priorities
  toolPriorities: {
    toolOrder: string[]             // Order to craft tools
    weaponOrder: string[]          // Order to craft weapons
    
    upgradeThresholds: {
      toolUpgrade: number          // When to upgrade tools (materials)
      weaponUpgrade: number        // When to upgrade weapons (level)
      skipToNext: boolean          // Skip tiers if possible
    }
  }
  
  // Decision logic
  decisionLogic: {
    visitFrequency: number         // How often to check forge
    energyReserve: number          // Keep X energy in reserve
    materialReserve: Map<string, number> // Keep materials for other uses
    
    priorityQueue: string[]        // What to craft first
    emergencyCrafting: boolean    // Craft immediately if needed
  }
  
  // Heat management
  heatManagement: {
    manualBellowsEfficiency: number // Heat gained per pump
    autoBellowsRate: number        // Heat maintained automatically
    optimalHeatRange: [number, number] // Best temperature range
    perfectHeatBonus: number       // Success bonus at perfect heat
  }
}
```

---

## 2.5 Mining System Parameters

```typescript
interface MineParameters {
  // Mining mechanics
  miningMechanics: {
    energyDrainBase: number        // Base energy per minute
    energyDrainExponent: number    // Exponential growth (default: 2)
    depthSpeed: number             // Meters per minute
    
    materialDropRate: number      // Materials per 30 seconds
    materialQuantityMultiplier: number // Quantity modifier
    rareMaterialChance: number    // Chance for bonus materials
  }
  
  // Depth management
  depthManagement: {
    maxDepth: number              // Override maximum depth
    shortcutCosts: number[]       // Override shortcut costs
    autoReturnThreshold: number   // Return when energy < X%
    
    depthStrategy: 'shallow' | 'deep' | 'burst' | 'efficient'
    targetDepths: number[]         // Preferred mining depths
  }
  
  // Tool sharpening
  toolSharpening: {
    sharpenDuration: number       // Time to sharpen
    sharpenBonus: number          // Efficiency boost
    sharpenDurationMinutes: number // How long buff lasts
    autoSharpenThreshold: number  // When to auto-sharpen
  }
  
  // Pickaxe efficiency
  pickaxeEfficiency: {
    energyReduction: number[]      // Per pickaxe tier
    materialBonus: number[]        // Per pickaxe tier
    depthSpeedBonus: number[]     // Per pickaxe tier
    
    upgradeStrategy: 'asap' | 'efficient' | 'conservative'
  }
  
  // Decision logic
  decisionLogic: {
    miningFrequency: number       // How often to mine
    minEnergyRequired: number     // Don't mine below X energy
    materialTargets: Map<string, number> // Target quantities
    
    sessionDuration: number       // Minutes per mining session
    depthVsEfficiency: number    // Balance deep vs sustainable
  }
}
```

---

## 2.6 Town System Parameters

```typescript
interface TownParameters {
  // Purchasing behavior
  purchasingBehavior: {
    goldReserve: number           // Keep X gold in reserve
    buyThreshold: number          // Buy when have X% over cost
    
    priorityList: string[]        // Order of purchases
    skipExpensive: boolean        // Skip if > X% of current gold
    
    vendorPriorities: {
      blacksmith: number          // Weight for tools/weapons
      agronomist: number         // Weight for farm upgrades
      landSteward: number        // Weight for land deeds
      carpenter: number          // Weight for tower upgrades
      skillsTrainer: number      // Weight for hero skills
    }
  }
  
  // Blueprint management
  blueprintStrategy: {
    buyAheadOfTime: boolean      // Buy before needed
    onlyBuyWhenReady: boolean   // Only buy if can craft
    stockpileBlueprints: boolean // Buy all available
    
    toolPriorities: string[]     // Which tools first
    weaponPriorities: string[]   // Which weapons first
    forgePriorities: string[]    // Which forge upgrades first
  }
  
  // Skill training
  skillTraining: {
    carryCapacityTarget: number  // Target carry level
    trainingEnergyReserve: number // Keep X energy for training
    
    skillPriorities: string[]    // Order to train skills
    maxSkillLevel: number        // Stop at level X
  }
  
  // Material trading
  materialTrading: {
    enableTrading: boolean       // Use material trader
    tradeThreshold: number       // Trade when > X excess
    
    tradePairs: Array<{
      from: string
      to: string
      minQuantity: number
      maxQuantity: number
    }>
    
    emergencyBuying: boolean     // Buy materials if needed
    woodBuyingThreshold: number // Buy wood bundles when < X
  }
}
```

---

## 2.7 Helper System Parameters

```typescript
interface HelperParameters {
  // Helper acquisition
  acquisition: {
    rescueOrder: string[]         // Order to rescue gnomes
    housingStrategy: 'immediate' | 'delayed' | 'optimal'
    buildHousingAhead: boolean   // Build before rescue
  }
  
  // Role assignment
  roleAssignment: {
    strategy: 'balanced' | 'focused' | 'adaptive' | 'custom'
    customRoles: Map<string, string> // Gnome ID -> Role
    
    roleDistribution: {
      waterer: number            // How many waterers
      pump: number               // How many pump operators
      sower: number              // How many sowers
      harvester: number          // How many harvesters
      miner: number              // How many miner friends
      fighter: number            // How many fighters
      support: number            // How many supporters
      catcher: number            // How many catchers
      forager: number            // How many foragers
      refiner: number            // How many refiners
    }
    
    adaptiveThresholds: {
      switchToWaterer: number    // Switch when water < X%
      switchToHarvester: number  // Switch when crops ready > X
      switchToMiner: number      // Switch when mining
    }
  }
  
  // Training
  training: {
    enableTraining: boolean      // Train helpers
    trainingEnergyBudget: number // Max energy per day
    
    levelTargets: Map<string, number> // Target level per role
    trainingPriority: string[]   // Order to train
    
    trainingSchedule: 'continuous' | 'periodic' | 'milestone'
    stopAtLevel: number          // Max training level
  }
  
  // Efficiency modifiers
  efficiency: {
    baseEfficiency: number       // Global helper efficiency
    levelScaling: number         // Efficiency per level
    fatigueRate: number         // Efficiency loss over time
    
    synergyBonus: number        // Bonus for multiple helpers
    specialization: number      // Bonus for same-role helpers
  }
}
```

---

## 2.8 Resource Management Parameters

```typescript
interface ResourceParameters {
  // Storage management
  storageManagement: {
    energyStorageBuffer: number  // Keep X% capacity free
    seedStorageBuffer: number   // Keep X% capacity free
    waterStorageBuffer: number  // Keep X% capacity free
    materialStorageBuffer: Map<string, number> // Per material
    
    overflowStrategy: 'stop' | 'waste' | 'convert'
    prioritySorting: string[]    // Which resources to prioritize
  }
  
  // Resource generation
  generation: {
    energyGenerationMultiplier: number
    goldGenerationMultiplier: number
    materialDropMultiplier: number
    
    passiveGeneration: {
      energy: number            // Passive energy per hour
      gold: number              // Passive gold per hour
      water: number             // Passive water per hour
    }
  }
  
  // Consumption rates
  consumption: {
    energyConsumptionMultiplier: number
    waterConsumptionMultiplier: number
    seedConsumptionMultiplier: number
    
    minimumReserves: {
      energy: number           // Never go below X energy
      gold: number             // Never go below X gold
      water: number            // Never go below X water
      seeds: number            // Never go below X seeds total
    }
  }
  
  // Exchange rates
  exchangeRates: {
    energyToGold: number       // Conversion rate
    goldToEnergy: number       // Conversion rate
    materialValues: Map<string, number> // Gold value per material
  }
}
```

---

## 2.9 Decision Engine Parameters

```typescript
interface DecisionParameters {
  // Global decision making
  globalBehavior: {
    decisionInterval: number     // Seconds between decisions
    lookAheadTime: number       // Minutes to plan ahead
    
    decisionStrategy: 'optimal' | 'greedy' | 'balanced' | 'random'
    randomness: number          // 0-1, adds noise to decisions
    
    learningRate: number        // Adapt based on outcomes
    persistenceBias: number     // Tendency to stick with current task
  }
  
  // Screen priorities
  screenPriorities: {
    weights: Map<GameScreen, number>  // Base weight per screen
    
    dynamicAdjustment: boolean
    adjustmentFactors: {
      energyLow: Map<GameScreen, number>     // When energy < 20%
      seedsLow: Map<GameScreen, number>      // When seeds < 20%
      goldHigh: Map<GameScreen, number>      // When gold > 1000
      newUnlock: Map<GameScreen, number>     // When something unlocked
    }
  }
  
  // Action evaluation
  actionEvaluation: {
    immediateValueWeight: number    // Short-term gain
    futureValueWeight: number       // Long-term gain
    riskWeight: number             // Risk aversion
    
    valueCalculation: 'linear' | 'logarithmic' | 'exponential'
    
    actionCooldowns: Map<string, number>  // Min time between actions
    actionChains: Array<string[]>         // Forced action sequences
  }
  
  // Interrupt conditions
  interrupts: {
    enabled: boolean
    
    conditions: Array<{
      trigger: string           // e.g., "energy < 10"
      action: string           // What to do
      priority: number         // Override priority
    }>
    
    emergencyMode: {
      threshold: number        // When to panic
      actions: string[]        // Emergency action sequence
    }
  }
  
  // Optimization goals
  optimization: {
    primaryGoal: 'speed' | 'efficiency' | 'completion' | 'exploration'
    
    subGoals: {
      minimizeDays: number     // Weight for speed
      maximizeEfficiency: number // Weight for resource efficiency
      exploreContent: number   // Weight for trying everything
      minimizeRisk: number     // Weight for safety
    }
    
    milestones: Array<{
      condition: string        // e.g., "day >= 10"
      adjustGoals: Map<string, number>  // New weights
    }>
  }
}
```

---

## Part 3: Parameter Override System

### Override Management

```typescript
interface OverrideSystem {
  // Global overrides that affect everything
  globalOverrides: {
    timeMultiplier: number      // Speed up/slow down everything
    difficultyMultiplier: number // Make everything easier/harder
    randomSeed: number          // For reproducible randomness
  }
  
  // System-specific overrides
  systemOverrides: Map<string, any>
  
  // Conditional overrides
  conditionalOverrides: Array<{
    condition: string          // e.g., "day >= 10"
    overrides: Map<string, any>
    duration?: number          // How long to apply
  }>
  
  // Save/load configurations
  savedConfigs: Array<{
    name: string
    description: string
    overrides: Map<string, any>
    timestamp: Date
  }>
}
```

### Override UI

```
┌──────────────────────────────────────────────────┐
│ Parameter Overrides                              │
├──────────────────────────────────────────────────┤
│ Quick Presets:                                   │
│ [Easy Mode] [Hard Mode] [Speed Run] [Exploration]│
│                                                   │
│ Active Overrides:                                │
│ ┌────────────────────────────────────────────┐  │
│ │ farm.cropMechanics.growthTime: 0.5x        │  │
│ │ adventure.combat.damageMulti: 1.5x         │  │
│ │ resources.generation.energy: 2.0x          │  │
│ │ decisions.globalBehavior.random: 0.1       │  │
│ └────────────────────────────────────────────┘  │
│                                                   │
│ Add Override:                                    │
│ Path: [_____________________________]            │
│ Value: [____________]                            │
│ [Add] [Clear All] [Save Config] [Load Config]   │
└──────────────────────────────────────────────────┘
```

---

## Part 4: Integration with Simulation Engine

### Configuration Compiler

```typescript
class ConfigurationCompiler {
  compile(
    quickSetup: QuickSetup,
    parameters: AllParameters,
    overrides: OverrideSystem
  ): CompiledConfiguration {
    // 1. Start with default parameters
    let config = this.loadDefaults()
    
    // 2. Apply parameter screen modifications
    config = this.mergeParameters(config, parameters)
    
    // 3. Apply global overrides
    config = this.applyGlobalOverrides(config, overrides.globalOverrides)
    
    // 4. Apply system overrides
    config = this.applySystemOverrides(config, overrides.systemOverrides)
    
    // 5. Apply persona-specific modifications
    config = this.applyPersonaModifiers(config, quickSetup.personaId)
    
    // 6. Validate configuration
    const validation = this.validate(config)
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`)
    }
    
    return config
  }
}
```

### Parameter Validation

```typescript
interface ParameterValidator {
  validate(params: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Check ranges
    if (params.farm.cropMechanics.growthTimeMultiplier < 0.1) {
      warnings.push('Very fast growth may cause balance issues')
    }
    
    // Check dependencies
    if (params.adventure.routeSelection.strategy === 'scripted' 
        && !params.adventure.routeSelection.scriptedSequence?.length) {
      errors.push('Scripted strategy requires sequence')
    }
    
    // Check conflicts
    if (params.resources.consumption.minimumReserves.energy > 
        params.farm.initialState.energy) {
      warnings.push('Starting energy below minimum reserve')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}
```

---

## Part 5: Testing & Debugging Features

### Parameter Testing Tools

```typescript
interface ParameterTesting {
  // A/B testing
  compareConfigs: {
    configA: AllParameters
    configB: AllParameters
    runCount: number
    metrics: string[]
  }
  
  // Parameter sweep
  parameterSweep: {
    parameter: string
    values: number[]
    baseConfig: AllParameters
    outputMetric: string
  }
  
  // Sensitivity analysis
  sensitivityAnalysis: {
    parameters: string[]
    range: [number, number]
    samples: number
    targetMetric: string
  }
  
  // Regression testing
  regressionTests: Array<{
    name: string
    config: AllParameters
    expectedOutcome: any
    tolerance: number
  }>
}
```

---

## Success Criteria

Phase 5 is complete when:

- [ ] Single-page quick setup works with persona selection
- [ ] All 9 parameter screens implemented and accessible
- [ ] Parameters actually affect simulation behavior
- [ ] Override system working and persistent
- [ ] Validation prevents invalid configurations
- [ ] Can save/load parameter configurations
- [ ] Integration with Phase 6 simulation engine tested

---

## Conclusion

This updated Phase 5 design exposes the entire simulation engine's internal logic through detailed parameter screens, making it possible to:

1. Understand exactly how the simulation makes decisions
2. Fine-tune any aspect of the game mechanics
3. Test edge cases and balance scenarios
4. Debug simulation behavior
5. Create reproducible test configurations

The parameter system serves as both a configuration interface and a window into the simulation's "brain," essential for validating game balance.
