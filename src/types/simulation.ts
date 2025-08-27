// Simulation Setup Types for Phase 5
// Based on design specs from 05-simulation-setup-updated.md

export interface QuickSetup {
  // Basic identification
  name: string
  
  // Persona selection (from Phase 4)
  personaId: 'speedrunner' | 'casual' | 'weekend-warrior' | 'custom'
  customPersonaId?: string // If using custom persona
  
  // Duration
  duration: {
    mode: 'fixed' | 'completion' | 'bottleneck'
    maxDays?: number
    bottleneckThreshold?: number // Days without progress
  }
  
  // Data source
  dataSource: 'current' | 'default' | 'saved'
  savedConfigId?: string
  
  // Launch options
  enableParameterOverrides: boolean
  generateDetailedLogs: boolean
}

export interface SimulationConfig {
  // Combined configuration for the simulation engine
  id: string
  createdAt: string
  lastModified: string
  
  // Quick setup
  quickSetup: QuickSetup
  
  // Parameter overrides (Phase 5B-5D)
  parameterOverrides?: Map<string, any>
  
  // Validation state
  isValid: boolean
  validationErrors: string[]
}

export interface SimulationPreset {
  id: string
  name: string
  description: string
  icon: string
  quickSetup: Partial<QuickSetup>
}

export interface SimulationSetupState {
  // Current configuration being edited
  currentConfig: QuickSetup
  
  // Available presets
  presets: SimulationPreset[]
  
  // Saved configurations
  savedConfigs: Map<string, SimulationConfig>
  
  // UI state
  showParameterEditor: boolean
  validationErrors: string[]
  isDirty: boolean
}

// Duration mode options
export interface DurationModeOption {
  value: 'fixed' | 'completion' | 'bottleneck'
  label: string
  description: string
  defaultConfig?: Partial<QuickSetup['duration']>
}

// Phase 5B: Detailed Parameter Interfaces
// Farm System Parameters
export interface FarmParameters {
  initialState: {
    plots: number
    water: number
    energy: number
    unlockedLandStages: string[]
  }
  
  cropMechanics: {
    growthTimeMultiplier: number
    waterConsumptionRate: number
    witheredCropChance: number
    harvestWindowMinutes: number
    energyConversionEfficiency: number
  }
  
  waterSystem: {
    pumpEfficiency: number
    evaporationRate: number
    rainChance: number
    maxWaterStorage: number
    autoPumpThreshold: number
  }
  
  landExpansion: {
    cleanupEnergyMultiplier: number
    cleanupTimeMultiplier: number
    autoCleanupEnabled: boolean
    prioritizeCleanupOrder: string[]
  }
  
  automation: {
    autoPlant: boolean
    plantingStrategy: 'highest-value' | 'fastest-growth' | 'balanced' | 'diverse'
    autoWater: boolean
    wateringThreshold: number
    autoHarvest: boolean
    harvestTiming: 'immediate' | 'batch' | 'optimal'
    
    priorityWeights: {
      planting: number
      watering: number
      harvesting: number
      pumping: number
      cleanup: number
    }
  }
  
  helperEfficiency: {
    wateringSpeed: number
    plantingSpeed: number
    harvestingSpeed: number
    pumpingBonus: number
  }
}

// Tower System Parameters
export interface TowerParameters {
  catchMechanics: {
    manualCatchRate: number
    manualCatchRadius: number
    windSpeedMultiplier: number
    seedDensity: number
    netEfficiencyMultiplier: number
  }
  
  autoCatcher: {
    baseRate: number
    levelBonus: number[]
    seedPoolBias: number[]
    offlineMultiplier: number
    prioritization: 'random' | 'highest-tier' | 'needed' | 'balanced'
    targetSeedRatios: Map<string, number>
  }
  
  unlockProgression: {
    reachLevelCosts: number[]
    reachLevelEnergy: number[]
    skipPrerequisites: boolean
    autoUnlockAtPhase: string[]
  }
  
  decisionLogic: {
    visitFrequency: number
    catchDuration: number
    upgradeThreshold: number
    seedTargetMultiplier: number
  }
}

// Town System Parameters
export interface TownParameters {
  purchasingBehavior: {
    goldReserve: number
    buyThreshold: number
    priorityList: string[]
    skipExpensive: boolean
    
    vendorPriorities: {
      blacksmith: number
      agronomist: number
      landSteward: number
      carpenter: number
      skillsTrainer: number
    }
  }
  
  blueprintStrategy: {
    buyAheadOfTime: boolean
    onlyBuyWhenReady: boolean
    stockpileBlueprints: boolean
    toolPriorities: string[]
    weaponPriorities: string[]
    forgePriorities: string[]
  }
  
  skillTraining: {
    carryCapacityTarget: number
    trainingEnergyReserve: number
    skillPriorities: string[]
    maxSkillLevel: number
  }
  
  materialTrading: {
    enableTrading: boolean
    tradeThreshold: number
    emergencyBuying: boolean
    woodBuyingThreshold: number
  }
}

// Adventure System Parameters
export interface AdventureParameters {
  combatMechanics: {
    damageMultiplier: number
    defenseMultiplier: number
    weaponAdvantageBonus: number
    weaponDisadvantage: number
    
    heroHP: {
      baseHP: number
      hpPerLevel: number
      maxLevel: number
    }
    
    weaponSwitchTime: number
    combatSpeed: number
  }
  
  enemyGeneration: {
    waveSize: number[]
    enemyTypeWeights: Map<string, number>
    bossHealthMultiplier: number
    bossDamageMultiplier: number
    rollPersistence: boolean
    rerollOnSuccess: boolean
  }
  
  riskCalculation: {
    hpSafetyMargin: number
    defenseWeight: number
    weaponCoverageWeight: number
    bossWeaknessWeight: number
    
    riskTolerance: {
      safe: number
      moderate: number
      dangerous: number
    }
  }
  
  routeSelection: {
    strategy: 'optimal' | 'safe' | 'risky' | 'random' | 'scripted'
    scriptedSequence: string[]
    
    priorityFactors: {
      gold: number
      materials: number
      xp: number
      completion: number
      gnomeRescue: number
    }
    
    energyThreshold: number
    backtrackingAllowed: boolean
    difficultyPreference: 'short' | 'medium' | 'long' | 'adaptive'
  }
  
  lootSystem: {
    dropRateMultiplier: number
    goldMultiplier: number
    xpMultiplier: number
    armorStrategy: 'keep-best' | 'keep-effects' | 'sell-all'
    armorUpgradePriority: string[]
  }
}

// Forge System Parameters
export interface ForgeParameters {
  craftingMechanics: {
    baseSuccessRate: number
    heatBandWidth: number
    heatDecayRate: number
    craftTimeMultiplier: number
    batchSizeOverride: number
    masterCraftChance: number
  }
  
  refinement: {
    refinementTimeMultiplier: number
    refinementEnergyMultiplier: number
    autoRefineThreshold: number
    refinementStrategy: 'immediate' | 'batch' | 'as-needed'
  }
  
  toolPriorities: {
    toolOrder: string[]
    weaponOrder: string[]
    
    upgradeThresholds: {
      toolUpgrade: number
      weaponUpgrade: number
      skipToNext: boolean
    }
  }
  
  decisionLogic: {
    visitFrequency: number
    energyReserve: number
    materialReserve: Map<string, number>
    priorityQueue: string[]
    emergencyCrafting: boolean
  }
  
  heatManagement: {
    manualBellowsEfficiency: number
    autoBellowsRate: number
    optimalHeatRange: [number, number]
    perfectHeatBonus: number
  }
}

// Mine System Parameters
export interface MineParameters {
  miningMechanics: {
    energyDrainBase: number
    energyDrainExponent: number
    depthSpeed: number
    materialDropRate: number
    materialQuantityMultiplier: number
    rareMaterialChance: number
  }
  
  depthManagement: {
    maxDepth: number
    shortcutCosts: number[]
    autoReturnThreshold: number
    depthStrategy: 'shallow' | 'deep' | 'burst' | 'efficient'
    targetDepths: number[]
  }
  
  toolSharpening: {
    sharpenDuration: number
    sharpenBonus: number
    sharpenDurationMinutes: number
    autoSharpenThreshold: number
  }
  
  pickaxeEfficiency: {
    energyReduction: number[]
    materialBonus: number[]
    depthSpeedBonus: number[]
    upgradeStrategy: 'asap' | 'efficient' | 'conservative'
  }
  
  decisionLogic: {
    miningFrequency: number
    minEnergyRequired: number
    materialTargets: Map<string, number>
    sessionDuration: number
    depthVsEfficiency: number
  }
}

// Helper System Parameters
export interface HelperParameters {
  acquisition: {
    rescueOrder: string[]
    housingStrategy: 'immediate' | 'delayed' | 'optimal'
    buildHousingAhead: boolean
  }
  
  roleAssignment: {
    strategy: 'balanced' | 'focused' | 'adaptive' | 'custom'
    customRoles: Map<string, string>
    
    roleDistribution: {
      waterer: number
      pump: number
      sower: number
      harvester: number
      miner: number
      fighter: number
      support: number
      catcher: number
      forager: number
      refiner: number
    }
    
    adaptiveThresholds: {
      switchToWaterer: number
      switchToHarvester: number
      switchToMiner: number
    }
  }
  
  training: {
    enableTraining: boolean
    trainingEnergyBudget: number
    levelTargets: Map<string, number>
    trainingPriority: string[]
    trainingSchedule: 'continuous' | 'periodic' | 'milestone'
    stopAtLevel: number
  }
  
  efficiency: {
    baseEfficiency: number
    levelScaling: number
    fatigueRate: number
    synergyBonus: number
    specialization: number
  }
}

// Resource Management Parameters
export interface ResourceParameters {
  storageManagement: {
    energyStorageBuffer: number
    seedStorageBuffer: number
    waterStorageBuffer: number
    materialStorageBuffer: Map<string, number>
    overflowStrategy: 'stop' | 'waste' | 'convert'
    prioritySorting: string[]
  }
  
  generation: {
    energyGenerationMultiplier: number
    goldGenerationMultiplier: number
    materialDropMultiplier: number
    
    passiveGeneration: {
      energy: number
      gold: number
      water: number
    }
  }
  
  consumption: {
    energyConsumptionMultiplier: number
    waterConsumptionMultiplier: number
    seedConsumptionMultiplier: number
    
    minimumReserves: {
      energy: number
      gold: number
      water: number
      seeds: number
    }
  }
  
  exchangeRates: {
    energyToGold: number
    goldToEnergy: number
    materialValues: Map<string, number>
  }
}

// Decision Engine Parameters
export interface DecisionParameters {
  globalBehavior: {
    decisionInterval: number
    lookAheadTime: number
    decisionStrategy: 'optimal' | 'greedy' | 'balanced' | 'random'
    randomness: number
    learningRate: number
    persistenceBias: number
  }
  
  screenPriorities: {
    weights: Map<string, number>
    dynamicAdjustment: boolean
    adjustmentFactors: {
      energyLow: Map<string, number>
      seedsLow: Map<string, number>
      goldHigh: Map<string, number>
      newUnlock: Map<string, number>
    }
  }
  
  actionEvaluation: {
    immediateValueWeight: number
    futureValueWeight: number
    riskWeight: number
    valueCalculation: 'linear' | 'logarithmic' | 'exponential'
    actionCooldowns: Map<string, number>
  }
  
  interrupts: {
    enabled: boolean
    emergencyMode: {
      threshold: number
      actions: string[]
    }
  }
  
  optimization: {
    primaryGoal: 'speed' | 'efficiency' | 'completion' | 'exploration'
    
    subGoals: {
      minimizeDays: number
      maximizeEfficiency: number
      exploreContent: number
      minimizeRisk: number
    }
  }
}

// Combined Parameters Interface
export interface AllParameters {
  farm: FarmParameters
  tower: TowerParameters
  town: TownParameters
  adventure: AdventureParameters
  forge: ForgeParameters
  mine: MineParameters
  helpers: HelperParameters
  resources: ResourceParameters
  decisions: DecisionParameters
}

// Parameter Override System
export interface ParameterOverride {
  path: string // e.g., "farm.automation.autoPlant"
  value: any
  originalValue: any
  description?: string
}

// Parameter Screen Navigation
export interface ParameterScreen {
  id: keyof AllParameters
  name: string
  description: string
  icon: string
  component: string
}
