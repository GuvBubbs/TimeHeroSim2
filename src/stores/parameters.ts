// Parameter Store - Phase 5B Implementation
// Manages all simulation parameters and overrides

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  AllParameters,
  ParameterOverride,
  ParameterScreen,
  FarmParameters,
  TowerParameters,
  TownParameters,
  AdventureParameters,
  ForgeParameters,
  MineParameters,
  HelperParameters,
  ResourceParameters,
  DecisionParameters
} from '@/types'

// Default parameter values based on design specs
const createDefaultParameters = (): AllParameters => ({
  farm: {
    initialState: {
      plots: 3,
      water: 20,
      energy: 50,
      unlockedLandStages: []
    },
    cropMechanics: {
      growthTimeMultiplier: 1.0,
      waterConsumptionRate: 1.0,
      witheredCropChance: 0.1,
      harvestWindowMinutes: 30,
      energyConversionEfficiency: 1.0
    },
    waterSystem: {
      pumpEfficiency: 1.0,
      evaporationRate: 0,
      rainChance: 0,
      maxWaterStorage: 0, // 0 means use default
      autoPumpThreshold: 0.2
    },
    landExpansion: {
      cleanupEnergyMultiplier: 1.0,
      cleanupTimeMultiplier: 1.0,
      autoCleanupEnabled: false,
      prioritizeCleanupOrder: []
    },
    automation: {
      autoPlant: true,
      plantingStrategy: 'highest-value',
      autoWater: true,
      wateringThreshold: 0.3,
      autoHarvest: true,
      harvestTiming: 'immediate',
      priorityWeights: {
        planting: 1.0,
        watering: 1.5,
        harvesting: 2.0,
        pumping: 1.2,
        cleanup: 0.8
      }
    },
    helperEfficiency: {
      wateringSpeed: 1.0,
      plantingSpeed: 1.0,
      harvestingSpeed: 1.0,
      pumpingBonus: 1.0
    }
  },
  
  tower: {
    catchMechanics: {
      manualCatchRate: 60,
      manualCatchRadius: 1.0,
      windSpeedMultiplier: 1.0,
      seedDensity: 1.0,
      netEfficiencyMultiplier: 1.0
    },
    autoCatcher: {
      baseRate: 10,
      levelBonus: [0, 5, 10, 15, 20],
      seedPoolBias: [1, 1, 1, 1],
      offlineMultiplier: 0.5,
      prioritization: 'balanced',
      targetSeedRatios: new Map()
    },
    unlockProgression: {
      reachLevelCosts: [],
      reachLevelEnergy: [],
      skipPrerequisites: false,
      autoUnlockAtPhase: []
    },
    decisionLogic: {
      visitFrequency: 5,
      catchDuration: 2,
      upgradeThreshold: 0.5,
      seedTargetMultiplier: 2
    }
  },
  
  town: {
    purchasingBehavior: {
      goldReserve: 100,
      buyThreshold: 1.2,
      priorityList: [],
      skipExpensive: false,
      vendorPriorities: {
        blacksmith: 1.0,
        agronomist: 1.0,
        landSteward: 1.0,
        carpenter: 1.0,
        skillsTrainer: 1.0
      }
    },
    blueprintStrategy: {
      buyAheadOfTime: false,
      onlyBuyWhenReady: true,
      stockpileBlueprints: false,
      toolPriorities: [],
      weaponPriorities: [],
      forgePriorities: []
    },
    skillTraining: {
      carryCapacityTarget: 5,
      trainingEnergyReserve: 10,
      skillPriorities: [],
      maxSkillLevel: 10
    },
    materialTrading: {
      enableTrading: false,
      tradeThreshold: 50,
      emergencyBuying: true,
      woodBuyingThreshold: 10
    }
  },
  
  adventure: {
    combatMechanics: {
      damageMultiplier: 1.0,
      defenseMultiplier: 1.0,
      weaponAdvantageBonus: 1.5,
      weaponDisadvantage: 0.5,
      heroHP: {
        baseHP: 100,
        hpPerLevel: 20,
        maxLevel: 50
      },
      weaponSwitchTime: 2,
      combatSpeed: 1.0
    },
    enemyGeneration: {
      waveSize: [],
      enemyTypeWeights: new Map(),
      bossHealthMultiplier: 1.0,
      bossDamageMultiplier: 1.0,
      rollPersistence: false,
      rerollOnSuccess: true
    },
    riskCalculation: {
      hpSafetyMargin: 0.2,
      defenseWeight: 1.0,
      weaponCoverageWeight: 1.0,
      bossWeaknessWeight: 1.0,
      riskTolerance: {
        safe: 0.2,
        moderate: 0.5,
        dangerous: 0.8
      }
    },
    routeSelection: {
      strategy: 'optimal',
      scriptedSequence: [],
      priorityFactors: {
        gold: 1.0,
        materials: 1.0,
        xp: 1.0,
        completion: 1.0,
        gnomeRescue: 2.0
      },
      energyThreshold: 20,
      backtrackingAllowed: true,
      difficultyPreference: 'adaptive'
    },
    lootSystem: {
      dropRateMultiplier: 1.0,
      goldMultiplier: 1.0,
      xpMultiplier: 1.0,
      armorStrategy: 'keep-best',
      armorUpgradePriority: []
    }
  },
  
  forge: {
    craftingMechanics: {
      craftingSpeed: 1.0,
      successRateBonus: 0.0,
      qualityImprovement: 1.0,
      materialEfficiency: 1.0,
      autoSelectMaterials: true,
      batchCrafting: false
    },
    heatManagement: {
      heatGainMultiplier: 1.0,
      heatLossRate: 1.0,
      optimalHeatRange: 0.6,
      maxHeatThreshold: 0.9,
      heatStrategy: 'optimal',
      autoCooling: true
    },
    recipeSelection: {
      strategy: 'balanced',
      upgradePriority: 'balanced',
      priorityFactors: {
        profit: 1.0,
        materialAvailability: 2.0,
        equipmentNeed: 3.0,
        craftingTime: 1.0
      },
      materialReserve: 0.1,
      useRareMaterials: false
    },
    alloyPreferences: {
      alloyStrategy: 'balanced',
      preferredStat: 'adaptive',
      statWeights: {
        damage: 1.0,
        defense: 1.0,
        speed: 1.0,
        durability: 1.0
      },
      experimentationRate: 0.1,
      saveSuccessfulRecipes: true
    },
    automation: {
      autoCraftEquipment: true,
      autoRepairItems: true,
      queueManagement: true,
      materialOptimization: true,
      queueSize: 5,
      efficiencyThreshold: 0.8
    }
  },
  
  mine: {
    miningMechanics: {
      energyDrainBase: 1.0,
      energyDrainExponent: 2.0,
      depthSpeed: 1.0,
      materialDropRate: 1.0,
      materialQuantityMultiplier: 1.0,
      rareMaterialChance: 0.1
    },
    depthManagement: {
      maxDepth: 1000,
      shortcutCosts: [],
      autoReturnThreshold: 0.1,
      depthStrategy: 'efficient',
      targetDepths: []
    },
    toolSharpening: {
      sharpenDuration: 30,
      sharpenBonus: 1.5,
      sharpenDurationMinutes: 10,
      autoSharpenThreshold: 0.5
    },
    pickaxeEfficiency: {
      energyReduction: [0, 0.1, 0.2, 0.3, 0.4],
      materialBonus: [0, 0.1, 0.2, 0.3, 0.4],
      depthSpeedBonus: [0, 0.1, 0.2, 0.3, 0.4],
      upgradeStrategy: 'efficient'
    },
    decisionLogic: {
      miningFrequency: 2,
      minEnergyRequired: 30,
      materialTargets: new Map(),
      sessionDuration: 5,
      depthVsEfficiency: 0.5
    }
  },
  
  helpers: {
    acquisition: {
      rescueOrder: ['Waterer', 'Harvester', 'Sower', 'Pump', 'Miner', 'Fighter', 'Support', 'Catcher', 'Forager', 'Refiner'],
      housingStrategy: 'optimal',
      buildHousingAhead: false
    },
    roleAssignment: {
      strategy: 'balanced',
      customRoles: new Map(),
      roleDistribution: {
        waterer: 2,
        pump: 1,
        sower: 1,
        harvester: 2,
        miner: 1,
        fighter: 1,
        support: 1,
        catcher: 1,
        forager: 1,
        refiner: 1
      },
      adaptiveThresholds: {
        switchToWaterer: 0.2,
        switchToHarvester: 0.8,
        switchToMiner: 0.3
      }
    },
    training: {
      enableTraining: true,
      trainingEnergyBudget: 50,
      levelTargets: new Map(),
      trainingPriority: ['Waterer', 'Harvester', 'Miner', 'Fighter', 'Sower'],
      trainingSchedule: 'periodic',
      stopAtLevel: 10
    },
    efficiency: {
      baseEfficiency: 1.0,
      levelScaling: 0.1,
      fatigueRate: 0.01,
      synergyBonus: 0.1,
      specialization: 0.2,
      roleSwitchFrequency: 10,
      efficiencyThreshold: 0.8,
      workloadBalanceFactor: 1.0,
      specializationBonus: 1.2,
      autoRoleOptimization: true,
      preventOverassignment: true
    },
    decisionLogic: {
      managementFrequency: 5,
      emergencyResponseTime: 2,
      priorityOverrideThreshold: 2.0,
      idleHelperThreshold: 10,
      emergencyReassignment: true,
      crossTrainingPriority: false
    }
  },
  
  resources: {
    storageManagement: {
      energyStorageBuffer: 0.1,
      seedStorageBuffer: 0.1,
      waterStorageBuffer: 0.1,
      materialStorageBuffer: new Map(),
      overflowStrategy: 'waste',
      prioritySorting: []
    },
    generation: {
      energyGenerationMultiplier: 1.0,
      goldGenerationMultiplier: 1.0,
      materialDropMultiplier: 1.0,
      passiveGeneration: {
        energy: 0,
        gold: 0,
        water: 0
      }
    },
    consumption: {
      energyConsumptionMultiplier: 1.0,
      waterConsumptionMultiplier: 1.0,
      seedConsumptionMultiplier: 1.0,
      minimumReserves: {
        energy: 10,
        gold: 50,
        water: 5,
        seeds: 5
      }
    },
    exchangeRates: {
      energyToGold: 0.1,
      goldToEnergy: 10,
      materialValues: new Map()
    }
  },
  
  decisions: {
    globalBehavior: {
      decisionInterval: 30,
      lookAheadTime: 60,
      decisionStrategy: 'optimal',
      randomness: 0.1,
      learningRate: 0.01,
      persistenceBias: 0.2
    },
    screenPriorities: {
      weights: new Map([
        ['farm', 1.0],
        ['tower', 0.8],
        ['town', 0.6],
        ['adventure', 0.7],
        ['forge', 0.5],
        ['mine', 0.4]
      ]),
      dynamicAdjustment: true,
      adjustmentFactors: {
        energyLow: new Map(),
        seedsLow: new Map(),
        goldHigh: new Map(),
        newUnlock: new Map()
      }
    },
    actionEvaluation: {
      immediateValueWeight: 0.7,
      futureValueWeight: 0.3,
      riskWeight: 0.5,
      valueCalculation: 'linear',
      actionCooldowns: new Map()
    },
    interrupts: {
      enabled: true,
      emergencyMode: {
        threshold: 10,
        actions: ['rest', 'pump-water', 'harvest']
      }
    },
    optimization: {
      primaryGoal: 'efficiency',
      subGoals: {
        minimizeDays: 0.3,
        maximizeEfficiency: 0.4,
        exploreContent: 0.2,
        minimizeRisk: 0.1
      }
    }
  }
})

// Parameter screen definitions
export const parameterScreens: ParameterScreen[] = [
  {
    id: 'farm',
    name: 'Farm System',
    description: 'Crop growth, water, automation, and land management',
    icon: 'fa-seedling',
    component: 'FarmParameters'
  },
  {
    id: 'tower',
    name: 'Tower System',
    description: 'Seed catching, auto-catcher, and tower upgrades',
    icon: 'fa-tower-observation',
    component: 'TowerParameters'
  },
  {
    id: 'town',
    name: 'Town System',
    description: 'Purchasing, blueprints, trading, and skill training',
    icon: 'fa-building',
    component: 'TownParameters'
  },
  {
    id: 'adventure',
    name: 'Adventure System',
    description: 'Combat, risk assessment, route selection, and loot',
    icon: 'fa-fist-raised',
    component: 'AdventureParameters'
  },
  {
    id: 'forge',
    name: 'Forge System',
    description: 'Crafting, heat management, tool priorities, and refinement',
    icon: 'fa-hammer',
    component: 'ForgeParameters'
  },
  {
    id: 'mine',
    name: 'Mine System',
    description: 'Depth strategy, energy management, and material collection',
    icon: 'fa-mountain',
    component: 'MineParameters'
  },
  {
    id: 'helpers',
    name: 'Helper System',
    description: 'Gnome roles, training, efficiency, and automation',
    icon: 'fa-users',
    component: 'HelperParameters'
  },
  {
    id: 'resources',
    name: 'Resource Management',
    description: 'Storage, generation, consumption, and exchange rates',
    icon: 'fa-warehouse',
    component: 'ResourceParameters'
  },
  {
    id: 'decisions',
    name: 'Decision Engine',
    description: 'AI behavior, priorities, optimization, and interrupts',
    icon: 'fa-brain',
    component: 'DecisionParameters'
  }
]

export const useParameterStore = defineStore('parameters', () => {
  // State
  const parameters = ref<AllParameters>(createDefaultParameters())
  const overrides = ref<Map<string, ParameterOverride>>(new Map())
  const currentScreen = ref<keyof AllParameters>('farm')
  const isDirty = ref(false)
  const searchQuery = ref('')

  // Computed
  const effectiveParameters = computed(() => {
    // Apply overrides to base parameters
    const effective = JSON.parse(JSON.stringify(parameters.value)) as AllParameters
    
    for (const override of overrides.value.values()) {
      setNestedValue(effective, override.path, override.value)
    }
    
    return effective
  })

  const filteredScreens = computed(() => {
    if (!searchQuery.value) return parameterScreens
    
    const query = searchQuery.value.toLowerCase()
    return parameterScreens.filter(screen => 
      screen.name.toLowerCase().includes(query) ||
      screen.description.toLowerCase().includes(query)
    )
  })

  const hasOverrides = computed(() => overrides.value.size > 0)

  const overrideCount = computed(() => overrides.value.size)

  // Actions
  function setNestedValue(obj: any, path: string, value: any) {
    const keys = path.split('.')
    let current = obj
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
  }

  function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  function applyOverride(path: string, value: any, description?: string) {
    const originalValue = getNestedValue(parameters.value, path)
    
    overrides.value.set(path, {
      path,
      value,
      originalValue,
      description
    })
    
    isDirty.value = true
  }

  function applyArrayOverride(basePath: string, index: number, value: any, description?: string) {
    const fullPath = `${basePath}.${index}`
    applyOverride(fullPath, value, description)
  }

  function removeOverride(path: string) {
    overrides.value.delete(path)
    isDirty.value = true
  }

  function clearAllOverrides() {
    overrides.value.clear()
    isDirty.value = true
  }

  function resetParameters() {
    parameters.value = createDefaultParameters()
    overrides.value.clear()
    isDirty.value = false
  }

  function setCurrentScreen(screen: keyof AllParameters) {
    currentScreen.value = screen
  }

  function exportConfiguration() {
    return {
      parameters: parameters.value,
      overrides: Array.from(overrides.value.entries()),
      timestamp: new Date().toISOString()
    }
  }

  function importConfiguration(config: any) {
    if (config.parameters) {
      parameters.value = config.parameters
    }
    
    if (config.overrides) {
      overrides.value = new Map(config.overrides)
    }
    
    isDirty.value = true
  }

  function saveToLocalStorage() {
    try {
      const config = exportConfiguration()
      localStorage.setItem('timeHeroSim_parameters', JSON.stringify(config))
      isDirty.value = false
    } catch (error) {
      console.warn('Failed to save parameters to localStorage:', error)
    }
  }

  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('timeHeroSim_parameters')
      if (saved) {
        const config = JSON.parse(saved)
        importConfiguration(config)
        isDirty.value = false
      }
    } catch (error) {
      console.warn('Failed to load parameters from localStorage:', error)
    }
  }

  // Initialize
  loadFromLocalStorage()

  return {
    // State
    parameters,
    overrides,
    currentScreen,
    isDirty,
    searchQuery,
    
    // Computed
    effectiveParameters,
    filteredScreens,
    hasOverrides,
    overrideCount,
    
    // Actions
    applyOverride,
    applyArrayOverride,
    removeOverride,
    clearAllOverrides,
    resetParameters,
    setCurrentScreen,
    exportConfiguration,
    importConfiguration,
    saveToLocalStorage,
    loadFromLocalStorage,
    getNestedValue
  }
})
