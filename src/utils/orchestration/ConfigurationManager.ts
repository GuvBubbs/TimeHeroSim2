// ConfigurationManager.ts - Phase 10G Implementation
// Handles all simulation configuration logic extracted from SimulationEngine

import type { 
  SimulationConfig, 
  AllParameters,
  GameState,
  TimeState,
  ResourceState,
  ProgressionState,
  InventoryState,
  ProcessState,
  HelperState,
  LocationState,
  AutomationState,
  PriorityState,
  TowerState
} from '@/types'

/**
 * ConfigurationManager - Centralized configuration handling
 * Extracted from SimulationEngine to simplify orchestrator
 */
export class ConfigurationManager {
  
  /**
   * Extract parameters from configuration
   */
  static extractParametersFromConfig(config: SimulationConfig): AllParameters {
    let baseParameters = ConfigurationManager.createDefaultParameters()
    
    // Apply parameter overrides
    if (config.parameterOverrides && config.parameterOverrides.size > 0) {
      baseParameters = ConfigurationManager.applyParameterOverrides(baseParameters, config.parameterOverrides)
    }
    
    return baseParameters
  }

  /**
   * Create default parameters - simplified but structurally correct
   */
  static createDefaultParameters(): AllParameters {
    // Create minimal but structurally correct parameters to avoid complex type mapping
    // Real parameter values should come from SimulationConfig or be loaded from game data
    return {
      farm: {
        initialState: { plots: 3, water: 0, energy: 3, unlockedLandStages: ['farm'] },
        cropMechanics: { growthTimeMultiplier: 1.0, waterConsumptionRate: 1.0, witheredCropChance: 0.1, harvestWindowMinutes: 60, energyConversionEfficiency: 1.0 },
        waterSystem: { pumpEfficiency: 1.0, evaporationRate: 0.1, rainChance: 0.05, maxWaterStorage: 20, autoPumpThreshold: 0.3 },
        landExpansion: { cleanupEnergyMultiplier: 1.0, cleanupTimeMultiplier: 1.0, autoCleanupEnabled: false, prioritizeCleanupOrder: ['meadow_path_short'] },
        automation: { autoPlant: true, plantingStrategy: 'balanced', autoWater: true, wateringThreshold: 0.3, autoHarvest: true, harvestTiming: 'optimal', priorityWeights: { planting: 0.3, watering: 0.3, harvesting: 0.2, pumping: 0.1, cleanup: 0.1 } },
        helperEfficiency: { wateringSpeed: 1.0, plantingSpeed: 1.0, harvestingSpeed: 1.0, pumpingBonus: 0.2 }
      },
      tower: {
        catchMechanics: { manualCatchRate: 0.8, manualCatchRadius: 100, windSpeedMultiplier: 1.0, seedDensity: 1.0, netEfficiencyMultiplier: 1.5 },
        autoCatcher: { baseRate: 0.3, levelBonus: [0, 0.1, 0.2], seedPoolBias: [1.0, 0.8], offlineMultiplier: 0.5, prioritization: 'balanced', targetSeedRatios: new Map() },
        unlockProgression: { reachLevelCosts: [50, 150], reachLevelEnergy: [10, 15], skipPrerequisites: false, autoUnlockAtPhase: ['Early'] },
        decisionLogic: { visitFrequency: 30, catchDuration: 10, upgradeThreshold: 100, seedTargetMultiplier: 1.5 }
      },
      town: {
        purchasingBehavior: { goldReserve: 50, buyThreshold: 100, priorityList: ['tool'], skipExpensive: false, vendorPriorities: { blacksmith: 0.8, agronomist: 0.7, landSteward: 0.9, carpenter: 0.6, skillsTrainer: 0.5 } },
        blueprintStrategy: { buyAheadOfTime: true, onlyBuyWhenReady: false, stockpileBlueprints: false, toolPriorities: ['watering_can'], weaponPriorities: ['sword'], forgePriorities: ['furnace'] },
        skillTraining: { carryCapacityTarget: 100, trainingEnergyReserve: 20, skillPriorities: ['farming'], maxSkillLevel: 10 },
        materialTrading: { enableTrading: true, tradeThreshold: 50, emergencyBuying: true, woodBuyingThreshold: 10 }
      },
      adventure: {
        combatMechanics: { damageMultiplier: 1.0, defenseMultiplier: 1.0, weaponAdvantageBonus: 0.2, weaponDisadvantage: 0.2, heroHP: { baseHP: 100, hpPerLevel: 10, maxLevel: 20 } },
        routeSelection: { difficultyPreference: 'short', riskTolerance: 0.5, explorationBias: 0.3, repeatRoutes: true, routePriorities: ['short'] },
        lootEvaluation: { valueWeights: new Map(), inventoryManagement: 'optimal', sellThreshold: 0.8 },
        offlineLogic: { enableOfflineAdventures: true, offlineSuccessRate: 0.7, maxOfflineHours: 8 }
      },
      forge: {
        heatManagement: { heatGainMultiplier: 1.0, heatLossRate: 0.1, optimalHeatRange: 500, maxHeatThreshold: 5000, heatStrategy: 'optimal', autoCooling: false },
        craftingStrategy: { masterCraftAttempts: true, qualityThreshold: 0.8, priorityList: ['tool'], autoStoking: true, materialReserve: 10 },
        fuelManagement: { fuelType: 'wood', stockpileThreshold: 50, emergencyBuying: true, fuelEfficiency: 1.0 }
      },
      mine: {
        digStrategy: { maxDepth: 50, depthIncrement: 5, safetyThreshold: 0.2, retreatWhenLowEnergy: true },
        toolManagement: { repairThreshold: 0.3, upgradePreference: 'efficiency', autoRepair: true, sharpnessTarget: 0.8 },
        resourcePriorities: { targetMaterials: ['iron'], quantityTargets: new Map(), sellThreshold: 100 }
      },
      helpers: {
        recruitment: { housingPriority: 0.8, skillRequirements: new Map(), maxHelpers: 10, autoRescue: true },
        taskAssignment: { roleRotation: false, skillMatching: true, taskPriorities: ['farming'], efficiencyThreshold: 0.7 },
        training: { enableTraining: true, trainingEnergyBudget: 100, levelTargets: new Map(), trainingPriority: ['farming'], trainingSchedule: 'continuous', stopAtLevel: 10 }
      },
      resources: {
        energyThresholds: { criticalLevel: 5, lowLevel: 20, fullLevel: 100, restingThreshold: 0.2 },
        waterThresholds: { criticalLevel: 2, lowLevel: 5, fullLevel: 20, conservationThreshold: 0.3 },
        goldManagement: { savingsTarget: 1000, emergencyReserve: 50, investmentRatio: 0.7, spendingPriorities: ['tools'] }
      },
      decisions: {
        globalBehavior: { decisionInterval: 30, lookAheadTime: 60, decisionStrategy: 'balanced', randomness: 0.1, learningRate: 0.05, persistenceBias: 0.2 },
        screenPriorities: { weights: new Map(), dynamicAdjustment: true, adjustmentFactors: { energyLow: new Map(), seedsLow: new Map(), goldHigh: new Map(), newUnlock: new Map() } },
        actionEvaluation: { immediateValueWeight: 0.6, futureValueWeight: 0.4, riskWeight: 0.2, valueCalculation: 'logarithmic', actionCooldowns: new Map() },
        interrupts: { enabled: true, emergencyMode: { threshold: 0.9, actions: ['rest'] } },
        optimization: { primaryGoal: 'balanced', subGoals: { minimizeDays: 0.3, maximizeEfficiency: 0.4, exploreContent: 0.2, minimizeRisk: 0.1 } }
      }
    }
  }

  /**
   * Apply parameter overrides
   */
  static applyParameterOverrides(baseParameters: AllParameters, overrides: Map<string, any>): AllParameters {
    const result = JSON.parse(JSON.stringify(baseParameters))
    
    for (const [path, value] of overrides) {
      ConfigurationManager.setParameterByPath(result, path, value)
    }
    
    return result
  }

  /**
   * Set parameter by dot notation path
   */
  static setParameterByPath(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    let current = obj
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current)) {
        current[key] = {}
      }
      current = current[key]
    }
    
    current[keys[keys.length - 1]] = value
  }

  /**
   * Merge parameters from serialized data
   */
  static mergeParameters(base: AllParameters, serialized: any): AllParameters {
    return { ...base, ...serialized }
  }

  /**
   * Extract persona from configuration
   */
  static extractPersonaFromConfig(config: SimulationConfig): any {
    if (config.quickSetup?.personaId) {
      const personaMap = {
        'speedrunner': { name: 'Speedrunner', strategy: 'aggressive', riskTolerance: 0.8, explorationBias: 0.2 },
        'casual': { name: 'Casual Player', strategy: 'balanced', riskTolerance: 0.5, explorationBias: 0.5 },
        'weekend_warrior': { name: 'Weekend Warrior', strategy: 'efficient', riskTolerance: 0.3, explorationBias: 0.7 }
      }
      return personaMap[config.quickSetup.personaId as keyof typeof personaMap] || personaMap['casual']
    }
    return { name: 'Default', strategy: 'balanced', riskTolerance: 0.5, explorationBias: 0.5 }
  }

  /**
   * Initialize complete game state
   */
  static initializeGameState(): GameState {
    return {
      time: ConfigurationManager.initializeTimeState(),
      resources: ConfigurationManager.initializeResourcesState(),
      progression: ConfigurationManager.initializeProgressionState(),
      inventory: ConfigurationManager.initializeInventoryState(),
      processes: ConfigurationManager.initializeProcessState(),
      helpers: ConfigurationManager.initializeHelperState(),
      location: ConfigurationManager.initializeLocationState(),
      automation: ConfigurationManager.initializeAutomationState(),
      priorities: ConfigurationManager.initializePriorityState(),
      tower: ConfigurationManager.initializeTowerState()
    }
  }

  /**
   * Initialize time state
   */
  static initializeTimeState(): TimeState {
    return {
      totalMinutes: 0,
      day: 1,
      hour: 6,
      minute: 0,
      speed: 1
    }
  }

    /**
   * Initialize resources state - Correct starting conditions per starting-conditions.md
   */
  static initializeResourcesState(): ResourceState {
    return {
      energy: { current: 3, max: 100, regenerationRate: 0 }, // Starting energy: 3 (gain through harvesting)
      gold: 75, // Enough for Sword I & Tower Reach 1 blueprints
      water: { current: 0, max: 20, autoGenRate: 0 }, // Start empty, pump to fill
      seeds: new Map([
        ['carrot', 1], // 1 Carrot seed
        ['radish', 1]  // 1 Radish seed (2 seeds total for 3 plots = need tower)
      ]),
      materials: new Map() // Start with no materials
    }
  }

  /**
   * Initialize progression state - FIXED: Tower unlocked from start for tutorial gameplay
   */
  static initializeProgressionState(): ProgressionState {
    return {
      heroLevel: 1,
      experience: 0,
      farmStage: 1,
      farmPlots: 3,
      availablePlots: 3,
      currentPhase: 'Tutorial',
      completedAdventures: [],
      completedCleanups: new Set(),
      unlockedUpgrades: [],
      unlockedAreas: ['farm', 'town'], // Tower must be built before access
      builtStructures: new Set(['farm']),
      victoryConditionsMet: false
    }
  }

  /**
   * Initialize inventory state
   */
  static initializeInventoryState(): InventoryState {
    return {
      tools: new Map(),
      weapons: new Map(),
      armor: new Map(),
      blueprints: new Map(),
      capacity: 50,
      currentWeight: 0
    }
  }

  /**
   * Initialize tower state - starts unbuilt
   */
  static initializeTowerState(): TowerState {
    return {
      isBuilt: false,           // CRITICAL: Tower starts unbuilt
      currentReach: 0,          // No reach until built
      blueprintsOwned: [],      // No blueprints initially
      autoCatcherTier: 0,       // No auto-catcher until built
      seedsCatching: null       // No catching process initially
    }
  }

  /**
   * Initialize process state
   */
  static initializeProcessState(): ProcessState {
    return {
      crops: [],
      adventure: null,
      crafting: [],
      mining: null
      // Note: seedCatching moved to tower.seedsCatching
    }
  }

  /**
   * Initialize helper state
   */
  static initializeHelperState(): HelperState {
    return {
      gnomes: [],
      housingCapacity: 3,
      availableRoles: ['farming', 'water_management'],
      rescueQueue: []
    }
  }

  /**
   * Initialize location state
   */
  static initializeLocationState(): LocationState {
    return {
      currentScreen: 'farm',
      timeOnScreen: 0,
      screenHistory: ['farm'],
      navigationReason: 'Initial spawn'
    }
  }

  /**
   * Initialize automation state
   */
  static initializeAutomationState(): AutomationState {
    return {
      plantingEnabled: true,
      plantingStrategy: 'optimal',
      wateringEnabled: true,
      harvestingEnabled: true,
      autoCleanupEnabled: false,
      targetCrops: new Map([['carrot', 0.5], ['radish', 0.5]]),
      wateringThreshold: 0.3,
      energyReserve: 10
    }
  }

  /**
   * Initialize priority state
   */
  static initializePriorityState(): PriorityState {
    return {
      cleanupOrder: ['meadow_path_short', 'meadow_path_long', 'pine_vale_short'],
      toolCrafting: ['watering_can', 'pickaxe', 'scythe'],
      helperRescue: ['farming', 'water_management', 'seed_collection'],
      adventurePriority: ['short', 'medium', 'long'],
      vendorPriority: ['agronomist', 'blacksmith', 'carpenter', 'landSteward', 'skillsTrainer']
    }
  }

  /**
   * Initialize starting seeds
   */
  static initializeSeeds(): Map<string, number> {
    return new Map([
      ['carrot', 1],
      ['radish', 1]
    ])
  }

  /**
   * Initialize starting materials (empty per starting-conditions.md)
   */
  static initializeMaterials(): Map<string, number> {
    return new Map()
  }

  /**
   * Validate configuration object
   */
  static validateConfiguration(config: SimulationConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Basic validation
    if (!config) {
      errors.push('Configuration is required')
      return { valid: false, errors }
    }

    // Quick setup validation
    if (config.quickSetup?.personaId && !['speedrunner', 'casual', 'weekend_warrior'].includes(config.quickSetup.personaId)) {
      errors.push(`Invalid persona ID: ${config.quickSetup.personaId}`)
    }

    // Parameter override validation
    if (config.parameterOverrides) {
      for (const [path, value] of config.parameterOverrides) {
        if (!path || typeof path !== 'string') {
          errors.push(`Invalid parameter override path: ${path}`)
        }
        if (value === undefined || value === null) {
          errors.push(`Invalid parameter override value for path: ${path}`)
        }
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Apply difficulty modifiers to base parameters
   */
  static applyDifficultyModifiers(parameters: AllParameters, difficulty: 'easy' | 'normal' | 'hard'): AllParameters {
    const modified = JSON.parse(JSON.stringify(parameters))

    switch (difficulty) {
      case 'easy':
        modified.decisions.priorities.safety = Math.min(1, modified.decisions.priorities.safety * 1.2)
        modified.farm.priorities.wateringThreshold = Math.max(0.1, modified.farm.priorities.wateringThreshold * 0.8)
        break
      case 'hard':
        modified.decisions.priorities.safety = Math.max(0, modified.decisions.priorities.safety * 0.8)
        modified.farm.priorities.wateringThreshold = Math.min(0.9, modified.farm.priorities.wateringThreshold * 1.2)
        break
      case 'normal':
      default:
        // No modifications for normal difficulty
        break
    }

    return modified
  }
}
