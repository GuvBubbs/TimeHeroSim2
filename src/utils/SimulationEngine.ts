// SimulationEngine - Phase 6A Core Implementation
// Main simulation engine that runs the game logic

import { MapSerializer } from './MapSerializer'
import { CSVDataParser } from './CSVDataParser'
import { PrerequisiteSystem } from './systems/PrerequisiteSystem'
import { CropSystem } from './systems/CropSystem'
import { HelperSystem } from './systems/HelperSystem'
import { CraftingSystem } from './systems/CraftingSystem'
import { MiningSystem } from './systems/MiningSystem'
import { CombatSystem, type WeaponData, type ArmorData, type RouteConfig, type WeaponType, type ArmorEffect } from './systems/CombatSystem'
import type { 
  SimulationConfig, 
  AllParameters,
  GameState, 
  GameAction, 
  TickResult,
  GameEvent,
  TimeState,
  ResourceState,
  ProgressionState,
  InventoryState,
  ProcessState,
  HelperState,
  LocationState,
  AutomationState,
  PriorityState,
  GameScreen
} from '@/types'

/**
 * Core simulation engine that processes game ticks and makes AI decisions
 */
export class SimulationEngine {
  private config: SimulationConfig
  private gameState: GameState
  private parameters: AllParameters
  private gameDataStore: any
  private persona: any // Persona from config
  private lastCheckinTime: number = 0
  private isRunning: boolean = false
  private tickCount: number = 0
  
  constructor(config: SimulationConfig, gameDataStore?: any) {
    this.config = config
    this.parameters = this.extractParametersFromConfig(config)
    
    if (!gameDataStore) {
      throw new Error('SimulationEngine requires a valid gameDataStore with CSV data')
    }
    
    this.gameDataStore = gameDataStore
    this.persona = this.extractPersonaFromConfig(config)
    this.gameState = this.initializeGameState()
  }



  /**
   * Extracts parameters from the compiled configuration
   * Note: Maps should already be deserialized by MapSerializer in worker
   */
  private extractParametersFromConfig(config: SimulationConfig): AllParameters {
    // First, create baseline parameters
    let parameters = this.createDefaultParameters()
    
    // Apply parameter overrides from Phase 5 parameter system
    if (config.parameterOverrides && config.parameterOverrides.size > 0) {
      parameters = this.applyParameterOverrides(parameters, config.parameterOverrides)
    }
    
    // If config contains serialized parameters directly (future enhancement)
    if ((config as any).serializedParameters) {
      // Merge with serialized parameters if available
      parameters = this.mergeParameters(parameters, (config as any).serializedParameters)
    }
    
    return parameters
  }

  /**
   * Creates default parameters structure for initial implementation
   */
  private createDefaultParameters(): AllParameters {
    // This is a placeholder - in real implementation, this would come from
    // the deserialized parameter overrides in the config
    return {
      farm: {
        initialState: {
          plots: 4,
          water: 100,
          energy: 100,
          unlockedLandStages: ['stage1']
        },
        cropMechanics: {
          growthTimeMultiplier: 1.0,
          waterConsumptionRate: 1.0,
          witheredCropChance: 0.1,
          harvestWindowMinutes: 60,
          energyConversionEfficiency: 1.0
        },
        waterSystem: {
          pumpEfficiency: 1.0,
          evaporationRate: 0.1,
          rainChance: 0.1,
          maxWaterStorage: 200,
          autoPumpThreshold: 50
        },
        automation: {
        autoPlant: {
          enabled: true,
          strategy: 'highest-value',
          energyThreshold: 20
        },
        autoWater: {
          enabled: true,
          threshold: 25,
          prioritizeNewPlants: true
        },
        autoHarvest: {
          enabled: true,
          energyThreshold: 10
        },
        plantingStrategy: 'highest-value',
        priorityWeights: {},
        targetSeedRatios: new Map()
      },
        landExpansion: {
          prioritizeCleanupOrder: ['weeds', 'rocks', 'trees'],
          autoCleanupEnabled: true,
          cleanupEnergyThreshold: 30
        },
        helperEfficiency: {}
      }
    } as any // Simplified for now
  }

  /**
   * Applies parameter overrides to the base parameters
   */
  private applyParameterOverrides(baseParameters: AllParameters, overrides: Map<string, any>): AllParameters {
    const parameters = JSON.parse(JSON.stringify(baseParameters)) // Deep clone
    
    for (const [path, value] of overrides.entries()) {
      this.setParameterByPath(parameters, path, value)
    }
    
    return parameters
  }

  /**
   * Sets a parameter value by dot-notation path (e.g., "farm.automation.autoPlant")
   */
  private setParameterByPath(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    let current = obj
    
    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current)) {
        current[key] = {}
      }
      current = current[key]
    }
    
    // Set the final value
    const finalKey = keys[keys.length - 1]
    current[finalKey] = value
  }

  /**
   * Merges serialized parameters with base parameters
   */
  private mergeParameters(base: AllParameters, serialized: any): AllParameters {
    // Deep merge logic - for now, just return base
    // TODO: Implement proper deep merge when needed
    return base
  }

  /**
   * Extracts persona from configuration
   */
  private extractPersonaFromConfig(config: SimulationConfig): any {
    // Extract persona from quickSetup
    const defaultPersona = {
      id: 'casual',
      efficiency: 0.7,
      riskTolerance: 0.3,
      optimization: 0.6,
      learningRate: 0.4,
      weekdayCheckIns: 2,
      weekendCheckIns: 2,
      avgSessionLength: 15
    }

    try {
      if (config.quickSetup?.personaId) {
        // Map common persona IDs to their characteristics
        const personaMap: { [key: string]: any } = {
          'speedrunner': {
            id: 'speedrunner',
            efficiency: 0.95,
            riskTolerance: 0.8,
            optimization: 1.0,
            learningRate: 0.1,
            weekdayCheckIns: 10,
            weekendCheckIns: 10,
            avgSessionLength: 30
          },
          'casual': {
            id: 'casual',
            efficiency: 0.7,
            riskTolerance: 0.3,
            optimization: 0.6,
            learningRate: 0.4,
            weekdayCheckIns: 2,
            weekendCheckIns: 2,
            avgSessionLength: 15
          },
          'weekend-warrior': {
            id: 'weekend-warrior',
            efficiency: 0.8,
            riskTolerance: 0.4,
            optimization: 0.8,
            learningRate: 0.3,
            weekdayCheckIns: 1,
            weekendCheckIns: 8,
            avgSessionLength: 45
          }
        }

        return personaMap[config.quickSetup.personaId] || defaultPersona
      }
    } catch (error) {
      console.warn('Failed to extract persona from config:', error)
    }

    return defaultPersona
  }

  /**
   * Initializes seeds with starting quantities
   */
  private initializeSeeds(): Map<string, number> {
    const seeds = new Map<string, number>()
    
    // Starting seeds from game design
    seeds.set('turnip', 12)
    seeds.set('beet', 8) 
    seeds.set('carrot', 5)
    seeds.set('potato', 15)
    
    return seeds
  }

  /**
   * Initializes materials with all standard and boss materials
   */
  private initializeMaterials(): Map<string, number> {
    const materials = new Map<string, number>()
    
    // Standard materials from game design document
    const standardMaterials = [
      'wood', 'stone', 'copper', 'iron', 'silver', 'crystal', 'mythril', 'obsidian'
    ]
    
    // Boss materials from adventure rewards
    const bossMaterials = [
      'pine_resin', 'shadow_bark', 'mountain_stone', 'cave_crystal', 
      'frozen_heart', 'molten_core', 'enchanted_wood'
    ]
    
    // Initialize standard materials with starting amounts
    materials.set('wood', 25)
    materials.set('stone', 18)
    materials.set('copper', 3)
    materials.set('iron', 7)
    materials.set('silver', 2)
    materials.set('crystal', 0)
    materials.set('mythril', 0)
    materials.set('obsidian', 0)
    
    // Initialize boss materials to 0 (earned through adventures)
    for (const bossMaterial of bossMaterials) {
      materials.set(bossMaterial, 0)
    }
    
    console.log('🔧 SimulationEngine: Initialized materials:', Array.from(materials.entries()))
    
    return materials
  }

  /**
   * Initializes the game state based on parameters
   */
  private initializeGameState(): GameState {
    const farmParams = this.parameters.farm
    console.log('🔧 SimulationEngine: Initializing game state with enhanced seeds/materials')

    const gameState = {
      time: {
        day: 1,
        hour: 8,
        minute: 0,
        totalMinutes: 480, // Start at 8 AM
        speed: 1
      },
      resources: {
        energy: {
          current: farmParams.initialState.energy,
          max: farmParams.initialState.energy,
          regenerationRate: 1 // 1 energy per minute base
        },
        gold: 100, // Starting gold
        water: {
          current: farmParams.initialState.water,
          max: farmParams.waterSystem.maxWaterStorage,
          autoGenRate: 10 * farmParams.waterSystem.pumpEfficiency
        },
        seeds: this.initializeSeeds(),
        materials: this.initializeMaterials()
      },
      progression: {
        heroLevel: 1,
        experience: 0,
        farmStage: 1,
        farmPlots: farmParams.initialState.plots || 4,
        availablePlots: farmParams.initialState.plots || 4,
        currentPhase: 'Early',
        completedAdventures: [],
        completedCleanups: new Set<string>(),
        unlockedUpgrades: [],
        unlockedAreas: ['farm'],
        victoryConditionsMet: false
      },
      inventory: {
        tools: new Map(),
        weapons: new Map([
          ['sword', { 
            id: 'sword_1',
            level: 1, 
            owned: true,
            durability: 100,
            maxDurability: 100,
            isEquipped: true
          }] // Start with basic sword for combat
        ]),
        armor: new Map(),
        capacity: 100,
        currentWeight: 0
      },
      processes: {
        crops: [
          {
            plotId: 'plot_1',
            cropId: 'turnip',
            plantedAt: 0,
            growthTimeRequired: 60, // 1 hour
            waterLevel: 80,
            isWithered: false,
            readyToHarvest: false
          },
          {
            plotId: 'plot_2', 
            cropId: 'beet',
            plantedAt: -30,
            growthTimeRequired: 90, // 1.5 hours  
            waterLevel: 60,
            isWithered: false,
            readyToHarvest: false
          }
        ],
        adventure: null,
        crafting: [],
        mining: null
      },
      helpers: {
        gnomes: [],
        housingCapacity: 0,
        availableRoles: [],
        rescueQueue: farmParams.landExpansion?.prioritizeCleanupOrder || []
      },
      location: {
        currentScreen: 'farm' as GameScreen,
        timeOnScreen: 0,
        screenHistory: ['farm' as GameScreen],
        navigationReason: 'Initial state'
      },
      automation: {
        plantingEnabled: true, // farmParams.automation.autoPlant.enabled,
        plantingStrategy: farmParams.automation.plantingStrategy,
        wateringEnabled: true, // farmParams.automation.autoWater.enabled,
        harvestingEnabled: true, // farmParams.automation.autoHarvest.enabled,
        autoCleanupEnabled: farmParams.landExpansion?.autoCleanupEnabled || false,
        targetCrops: new Map(), // farmParams.automation.targetSeedRatios || new Map(),
        wateringThreshold: 25, // farmParams.automation.autoWater.threshold,
        energyReserve: 20 // farmParams.automation.autoPlant.energyThreshold
      },
      priorities: {
        cleanupOrder: farmParams.landExpansion?.prioritizeCleanupOrder || [],
        toolCrafting: [],
        helperRescue: [],
        adventurePriority: [],
        vendorPriority: []
      }
    }

    console.log('🔧 SimulationEngine: Created game state with seeds:', gameState.resources.seeds)
    console.log('🔧 SimulationEngine: Created game state with materials:', gameState.resources.materials)
    
    return gameState
  }

  /**
   * Main simulation tick - advances game by one time unit
   */
  tick(): TickResult {
    const startTime = this.gameState.time.totalMinutes
    const deltaTime = this.calculateDeltaTime()
    
    // Update time
    this.updateTime(deltaTime)
    
    // Process ongoing activities
    const ongoingEvents = this.processOngoingActivities(deltaTime)
    
    // Process crop growth and water consumption
    CropSystem.processCropGrowth(this.gameState, deltaTime, this.gameDataStore)
    
    // Process helper automation
    HelperSystem.processHelpers(this.gameState, deltaTime, this.gameDataStore)
    
    // Process crafting operations
    CraftingSystem.processCrafting(this.gameState, deltaTime, this.gameDataStore)
    
    // Process mining operations
    MiningSystem.processMining(this.gameState, deltaTime)
    
    // Make AI decisions
    const decisions = this.makeDecisions()
    
    // Execute actions
    const executedActions: GameAction[] = []
    const actionEvents: GameEvent[] = []
    
    for (const action of decisions) {
      const result = this.executeAction(action)
      if (result.success) {
        executedActions.push(action)
        actionEvents.push(...result.events)
      }
    }
    
    // Update automation systems
    this.updateAutomation()
    
    // Update phase progression
    this.updatePhaseProgression()
    
    // Check victory/completion conditions
    const isComplete = this.checkVictoryConditions()
    const isStuck = this.checkBottleneckConditions()
    
    this.tickCount++
    
    return {
      gameState: this.gameState,
      executedActions,
      events: [...ongoingEvents, ...actionEvents],
      deltaTime,
      isComplete,
      isStuck
    }
  }

  /**
   * Calculates how much time should pass this tick
   */
  private calculateDeltaTime(): number {
    // Base tick is 1 minute, modified by speed
    return 1 * this.gameState.time.speed
  }

  /**
   * Updates the game time
   */
  private updateTime(deltaTime: number) {
    this.gameState.time.totalMinutes += deltaTime
    this.gameState.time.minute += deltaTime
    
    // Handle hour/day rollover
    while (this.gameState.time.minute >= 60) {
      this.gameState.time.minute -= 60
      this.gameState.time.hour++
    }
    
    while (this.gameState.time.hour >= 24) {
      this.gameState.time.hour -= 24
      this.gameState.time.day++
    }
    
    // Update time on current screen
    this.gameState.location.timeOnScreen += deltaTime
  }

  /**
   * Processes ongoing activities (crops, crafting, adventures)
   */
  private processOngoingActivities(deltaTime: number): GameEvent[] {
    const events: GameEvent[] = []
    
    // Process crop growth
    for (const crop of this.gameState.processes.crops) {
      crop.waterLevel = Math.max(0, crop.waterLevel - deltaTime * 0.1) // Water evaporation
      
      if (crop.waterLevel > 0) {
        const progress = (this.gameState.time.totalMinutes - crop.plantedAt) / crop.growthTimeRequired
        if (progress >= 1.0 && !crop.readyToHarvest) {
          crop.readyToHarvest = true
          events.push({
            timestamp: this.gameState.time.totalMinutes,
            type: 'crop_ready',
            description: `${crop.cropId} is ready to harvest`,
            importance: 'medium'
          })
        }
      } else {
        // Crop might wither without water
        if (Math.random() < this.parameters.farm.cropMechanics.witheredCropChance * deltaTime / 60) {
          crop.isWithered = true
          events.push({
            timestamp: this.gameState.time.totalMinutes,
            type: 'crop_withered',
            description: `${crop.cropId} withered due to lack of water`,
            importance: 'high'
          })
        }
      }
    }
    
    // Adventures are now processed immediately in executeAction, no ongoing processing needed
    
    // Regenerate energy
    this.gameState.resources.energy.current = Math.min(
      this.gameState.resources.energy.max,
      this.gameState.resources.energy.current + this.gameState.resources.energy.regenerationRate * deltaTime
    )
    
    return events
  }

  /**
   * Makes AI decisions based on current state and parameters
   */
  private makeDecisions(): GameAction[] {
    const actions: GameAction[] = []
    
    // Check if hero should act based on persona schedule (Phase 6E Enhancement)
    if (!this.shouldHeroActNow()) {
      return actions // No actions if not in check-in window
    }
    
    // Comprehensive decision making using parameter system
    
    // 1. Emergency actions first (based on decision parameters)
    if (this.parameters.decisions?.interrupts?.enabled) {
      const emergencyActions = this.evaluateEmergencyActions()
      actions.push(...emergencyActions)
    }
    
    // 2. Screen-specific actions based on current location
    const screenActions = this.evaluateScreenActions()
    actions.push(...screenActions)
    
    // 3. Helper management decisions  
    const helperActions = this.evaluateHelperActions()
    actions.push(...helperActions)
    
    // 4. Screen navigation decisions
    const navigationActions = this.evaluateNavigationActions()
    actions.push(...navigationActions)
    
    // 5. Filter actions by prerequisites (Phase 6E Enhancement)
    const validActions = actions.filter(action => this.checkActionPrerequisites(action))
    
    // 6. Score and prioritize valid actions
    const scoredActions = validActions.map(action => ({
      action,
      score: this.scoreAction(action)
    }))
    
    // Sort by score and return top actions
    scoredActions.sort((a, b) => b.score - a.score)
    
    // Return top 3 actions (don't overwhelm the system)
    return scoredActions.slice(0, 3).map(item => {
      item.action.score = item.score
      return item.action
    })
  }

  /**
   * Evaluates emergency actions based on critical thresholds
   */
  private evaluateEmergencyActions(): GameAction[] {
    const actions: GameAction[] = []
    const farmParams = this.parameters.farm
    
    // Emergency energy management
    if (this.gameState.resources.energy.current <= 10) {
      // Consider energy-generating activities
      const readyToHarvest = this.gameState.processes.crops.filter(crop => crop.readyToHarvest)
      if (readyToHarvest.length > 0) {
        actions.push({
          id: `emergency_harvest_${Date.now()}`,
          type: 'harvest',
          screen: 'farm',
          target: readyToHarvest[0].plotId,
          duration: 2,
          energyCost: 3,
          goldCost: 0,
          prerequisites: [],
          expectedRewards: { gold: 10, items: [readyToHarvest[0].cropId] }
        })
      }
    }
    
    // Emergency watering
    const criticallyDryPlots = this.gameState.processes.crops.filter(
      crop => crop.waterLevel < 10 && !crop.isWithered && !crop.readyToHarvest
    )
    
    if (criticallyDryPlots.length > 0 && this.gameState.automation.wateringEnabled) {
      actions.push({
        id: `emergency_water_${Date.now()}`,
        type: 'water',
        screen: 'farm',
        target: criticallyDryPlots[0].plotId,
        duration: 1,
        energyCost: 1,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: {}
      })
    }
    
    return actions
  }

  /**
   * Evaluates actions for the current screen
   */
  private evaluateScreenActions(): GameAction[] {
    const screen = this.gameState.location.currentScreen
    
    switch (screen) {
      case 'farm':
        return this.evaluateFarmActions()
      case 'tower':
        return this.evaluateTowerActions()
      case 'town':
        return this.evaluateTownActions()
      case 'adventure':
        return this.evaluateAdventureActions()
      case 'forge':
        return this.evaluateForgeActions()
      case 'mine':
        return this.evaluateMineActions()
      default:
        return []
    }
  }

  /**
   * Evaluates farm-specific actions
   */
  private evaluateFarmActions(): GameAction[] {
    const actions: GameAction[] = []
    const farmParams = this.parameters.farm
    
    // Harvest ready crops (highest priority)
    const readyToHarvest = this.gameState.processes.crops.filter(crop => crop.readyToHarvest)
    if (readyToHarvest.length > 0 && this.gameState.automation.harvestingEnabled) {
      actions.push({
        id: `harvest_${Date.now()}`,
        type: 'harvest',
        screen: 'farm',
        target: readyToHarvest[0].plotId,
        duration: 2,
        energyCost: 3,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: { gold: 10, items: [readyToHarvest[0].cropId] }
      })
    }
    
    // Water crops that need it
    const needsWatering = this.gameState.processes.crops.filter(crop => 
      crop.waterLevel < this.gameState.automation.wateringThreshold && 
      !crop.isWithered && 
      !crop.readyToHarvest
    )
    
    if (needsWatering.length > 0 && this.gameState.automation.wateringEnabled) {
      actions.push({
        id: `water_${Date.now()}`,
        type: 'water',
        screen: 'farm',
        target: needsWatering[0].plotId,
        duration: 1,
        energyCost: 1,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: {}
      })
    }
    
    // Plant new crops if we have empty plots and energy
    const emptyPlots = farmParams.initialState.plots - this.gameState.processes.crops.length
    if (emptyPlots > 0 && 
        this.gameState.automation.plantingEnabled && 
        this.gameState.resources.energy.current > this.gameState.automation.energyReserve) {
      
      const bestCrop = this.selectCropToPlant()
      if (bestCrop) {
        actions.push({
          id: `plant_${Date.now()}`,
          type: 'plant',
          screen: 'farm',
          target: bestCrop,
          duration: 2,
          energyCost: 8,
          goldCost: 0,
          prerequisites: [],
          expectedRewards: {}
        })
      }
    }
    
    // Cleanup actions for farm expansion (Phase 8B Implementation)
    const cleanupActions = this.evaluateCleanupActions()
    actions.push(...cleanupActions)
    
    return actions
  }

  /**
   * Evaluates cleanup actions for farm expansion
   */
  private evaluateCleanupActions(): GameAction[] {
    const actions: GameAction[] = []
    
    // Get all cleanup actions from CSV data
    const cleanupItems = this.gameDataStore.itemsByCategory?.cleanup || []
    
    // Prioritize cleanup actions that add plots (critical for early game)
    const plotExpansionCleanups = cleanupItems.filter(item => 
      item.plots_added && parseInt(item.plots_added) > 0
    )
    
    // Also consider repeatable resource gathering cleanups
    const resourceCleanups = cleanupItems.filter(item => 
      item.repeatable === 'TRUE' && item.materials_gain
    )
    
    // Evaluate plot expansion cleanups first (higher priority)
    for (const cleanup of plotExpansionCleanups) {
      if (this.shouldConsiderCleanup(cleanup)) {
        const energyCost = parseInt(cleanup.energy_cost) || 0
        const plotsAdded = parseInt(cleanup.plots_added) || 0
        
        actions.push({
          id: `cleanup_${cleanup.id}_${Date.now()}`,
          type: 'cleanup',
          screen: 'farm',
          target: cleanup.id,
          duration: Math.ceil(energyCost / 10), // Rough duration estimate
          energyCost: energyCost,
          goldCost: 0,
          prerequisites: cleanup.prerequisite ? cleanup.prerequisite.split(';') : [],
          expectedRewards: { 
            plots: plotsAdded,
            materials: cleanup.materials_gain || ''
          }
        })
      }
    }
    
    // Evaluate resource gathering cleanups (lower priority)
    for (const cleanup of resourceCleanups.slice(0, 2)) { // Limit to avoid spam
      if (this.shouldConsiderCleanup(cleanup)) {
        const energyCost = parseInt(cleanup.energy_cost) || 0
        
        actions.push({
          id: `cleanup_${cleanup.id}_${Date.now()}`,
          type: 'cleanup',
          screen: 'farm',
          target: cleanup.id,
          duration: Math.ceil(energyCost / 10),
          energyCost: energyCost,
          goldCost: 0,
          prerequisites: cleanup.prerequisite ? cleanup.prerequisite.split(';') : [],
          expectedRewards: { 
            materials: cleanup.materials_gain || ''
          }
        })
      }
    }
    
    return actions
  }

  /**
   * Determines if a cleanup action should be considered
   */
  private shouldConsiderCleanup(cleanup: any): boolean {
    // Check if we have enough energy
    const energyCost = parseInt(cleanup.energy_cost) || 0
    if (this.gameState.resources.energy.current < energyCost + 20) { // Keep 20 energy reserve
      return false
    }
    
    // Check if already completed (for non-repeatable cleanups)
    if (cleanup.repeatable !== 'TRUE' && 
        this.gameState.progression.completedCleanups.has(cleanup.id)) {
      return false
    }
    
    // Check prerequisites using our PrerequisiteSystem
    if (!PrerequisiteSystem.checkPrerequisites(cleanup, this.gameState, this.gameDataStore)) {
      return false
    }
    
    // Check tool requirements
    if (cleanup.tool_required && cleanup.tool_required !== 'hands') {
      if (!PrerequisiteSystem.checkToolRequirement(cleanup.tool_required, this.gameState)) {
        return false
      }
    }
    
    // For plot expansion cleanups, prioritize if we have few plots
    if (cleanup.plots_added && parseInt(cleanup.plots_added) > 0) {
      return this.gameState.progression.farmPlots < 20 // High priority early game
    }
    
    // For resource cleanups, consider if we need materials
    if (cleanup.materials_gain) {
      return true // Always useful for materials
    }
    
    return false
  }

  /**
   * Evaluates tower-specific actions (Phase 6E Implementation)
   */
  private evaluateTowerActions(): GameAction[] {
    const actions: GameAction[] = []
    const towerParams = this.parameters.tower
    
    if (!towerParams) return actions
    
    // Manual seed catching
    const totalSeeds = Array.from(this.gameState.resources.seeds.values()).reduce((a, b) => a + b, 0)
    const needsSeeds = totalSeeds < (towerParams.decisionLogic?.seedTargetMultiplier || 2) * 10
    
    if (needsSeeds && this.gameState.resources.energy.current > 20) {
      const catchDuration = towerParams.decisionLogic?.catchDuration || 2
      const expectedCatchRate = towerParams.catchMechanics?.manualCatchRate || 60
      
      actions.push({
        id: `catch_seeds_${Date.now()}`,
        type: 'catch_seeds',
        screen: 'tower',
        target: 'manual_catch',
        duration: catchDuration,
        energyCost: catchDuration * 5, // 5 energy per minute
        goldCost: 0,
        prerequisites: [],
        expectedRewards: {
          items: ['seeds_mixed'],
          resources: { seeds: Math.floor(expectedCatchRate * catchDuration / 60) }
        }
      })
    }
    
    // Auto-catcher management
    if (towerParams.autoCatcher && this.gameState.resources.gold >= 100) {
      const autoCatcherLevel = this.getAutoCatcherLevel()
      const upgradeThreshold = towerParams.decisionLogic?.upgradeThreshold || 0.5
      
      if (autoCatcherLevel === 0 || (this.gameState.resources.gold >= 200 * Math.pow(2, autoCatcherLevel))) {
        actions.push({
          id: `upgrade_autocatcher_${Date.now()}`,
          type: 'purchase',
          screen: 'tower',
          target: 'auto_catcher',
          duration: 1,
          energyCost: 0,
          goldCost: 100 * Math.pow(2, autoCatcherLevel),
          prerequisites: [],
          expectedRewards: {}
        })
      }
    }
    
    // Tower reach upgrades
    if (towerParams.unlockProgression?.reachLevelCosts && 
        this.gameState.resources.energy.current > 50) {
      const currentReach = this.getTowerReachLevel()
      const nextCost = towerParams.unlockProgression.reachLevelCosts[currentReach]
      
      if (nextCost && this.gameState.resources.gold >= nextCost) {
        actions.push({
          id: `tower_reach_upgrade_${Date.now()}`,
          type: 'purchase',
          screen: 'tower',
          target: `reach_level_${currentReach + 1}`,
          duration: 2,
          energyCost: towerParams.unlockProgression.reachLevelEnergy?.[currentReach] || 20,
          goldCost: nextCost,
          prerequisites: [],
          expectedRewards: {}
        })
      }
    }
    
    return actions
  }

  /**
   * Evaluates town-specific actions (Phase 6E Implementation)
   */
  private evaluateTownActions(): GameAction[] {
    const actions: GameAction[] = []
    const townParams = this.parameters.town
    
    if (!townParams) return actions
    
    // Purchase decisions based on vendor priorities
    if (this.gameState.resources.gold >= 50) {
      const affordableUpgrades = this.getAffordableUpgrades()
      
      for (const upgrade of affordableUpgrades) {
        // Apply vendor priorities if available
        let priority = 1.0
        if (townParams.purchasing?.vendorPriorities) {
          const vendorId = upgrade.vendorId || 'general'
          priority = this.getArrayPosition(townParams.purchasing.vendorPriorities, vendorId) || 1.0
        }
        
        // Apply blueprint strategy priorities
        if (townParams.blueprintStrategy?.toolPriorities && upgrade.category === 'tool') {
          const toolPriority = this.getArrayPosition(townParams.blueprintStrategy.toolPriorities, upgrade.id)
          priority *= toolPriority
        }
        
        if (priority > 0.5) { // Only consider higher priority items
          actions.push({
            id: `purchase_${upgrade.id}_${Date.now()}`,
            type: 'purchase',
            screen: 'town',
            target: upgrade.id,
            duration: 1,
            energyCost: 0,
            goldCost: upgrade.cost,
            prerequisites: upgrade.prerequisites || [],
            expectedRewards: { items: [upgrade.id] }
          })
        }
      }
    }
    
    // Skill training decisions
    if (townParams.skillTraining && this.gameState.resources.gold >= 200) {
      const trainingOptions = this.getAvailableTraining()
      
      for (const training of trainingOptions) {
        if (this.shouldTrainSkill(training)) {
          actions.push({
            id: `train_${training.skill}_${Date.now()}`,
            type: 'train',
            screen: 'town',
            target: training.skill,
            duration: training.duration,
            energyCost: 0,
            goldCost: training.cost,
            prerequisites: [],
            expectedRewards: { experience: training.xpGain }
          })
        }
      }
    }
    
    return actions
  }

  /**
   * Evaluates adventure-specific actions (Phase 6E Implementation)
   */
  private evaluateAdventureActions(): GameAction[] {
    const actions: GameAction[] = []
    const adventureParams = this.parameters.adventure
    
    if (!adventureParams || this.gameState.processes.adventure) return actions // Already on adventure
    
    // Route selection based on risk tolerance and rewards
    const availableRoutes = this.getAvailableAdventureRoutes()
    
    for (const route of availableRoutes) {
      // Apply routing priorities if available
      let routePriority = 1.0
      if (adventureParams.routing?.priorityOrder) {
        routePriority = this.getArrayPosition(adventureParams.routing.priorityOrder, route.id)
      }
      
      // Risk assessment
      const riskLevel = this.calculateAdventureRisk(route)
      const riskTolerance = adventureParams.combatMechanics?.riskTolerance || 0.5
      
      if (riskLevel <= riskTolerance && routePriority > 0.3) {
        // Consider different duration options
        for (const duration of ['short', 'medium', 'long']) {
          const routeData = route[duration as keyof typeof route]
          if (!routeData) continue
          
          const energyReq = adventureParams.energyManagement?.minimumEnergyReserve || 30
          if (this.gameState.resources.energy.current >= energyReq + routeData.energyCost) {
            actions.push({
              id: `adventure_${route.id}_${duration}_${Date.now()}`,
              type: 'adventure',
              screen: 'adventure',
              target: `${route.id}_${duration}`,
              duration: routeData.duration,
              energyCost: routeData.energyCost,
              goldCost: 0,
              prerequisites: route.prerequisites || [],
              expectedRewards: {
                gold: routeData.goldReward,
                experience: routeData.xpReward,
                items: routeData.loot || []
              }
            })
          }
        }
      }
    }
    
    return actions
  }

  /**
   * Evaluates forge-specific actions (Phase 6E Implementation)
   */
  private evaluateForgeActions(): GameAction[] {
    const actions: GameAction[] = []
    const forgeParams = this.parameters.forge
    
    if (!forgeParams) return actions
    
    // Crafting priorities based on tool needs and materials
    const craftingQueue = this.gameState.processes.crafting || []
    const maxConcurrent = forgeParams.heatManagement?.maxConcurrentItems || 3
    
    if (craftingQueue.length < maxConcurrent) {
      const craftableItems = this.getCraftableItems()
      
      for (const item of craftableItems) {
        // Apply crafting priorities
        let priority = 1.0
        if (forgeParams.craftingPriorities?.toolOrder) {
          priority = this.getArrayPosition(forgeParams.craftingPriorities.toolOrder, item.id)
        }
        
        // Check material requirements
        const hasResources = this.checkMaterialRequirements(item.materials)
        const heatRequired = item.heatRequirement || 50
        const currentHeat = this.getForgeHeat()
        
        if (hasResources && currentHeat >= heatRequired && priority > 0.4) {
          actions.push({
            id: `craft_${item.id}_${Date.now()}`,
            type: 'craft',
            screen: 'forge',
            target: item.id,
            duration: item.craftingTime,
            energyCost: item.energyCost,
            goldCost: 0,
            prerequisites: [],
            expectedRewards: { items: [item.id] }
          })
        }
      }
    }
    
    // Heat management
    if (this.getForgeHeat() < 30 && (this.gameState.resources.materials.get('wood') || 0) >= 5) {
      actions.push({
        id: `stoke_forge_${Date.now()}`,
        type: 'stoke',
        screen: 'forge',
        target: 'heat',
        duration: 2,
        energyCost: 5,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: {}
      })
    }
    
    return actions
  }

  /**
   * Evaluates mine-specific actions (Phase 6E Implementation)
   */
  private evaluateMineActions(): GameAction[] {
    const actions: GameAction[] = []
    const mineParams = this.parameters.mine
    
    if (!mineParams || this.gameState.processes.mining?.isActive) return actions // Already mining
    
    // Depth strategy based on energy and risk
    const energyManagement = mineParams.energyManagement
    const minimumEnergy = energyManagement?.minimumEnergyReserve || 40
    
    if (this.gameState.resources.energy.current > minimumEnergy + 30) {
      const depthStrategy = mineParams.depthStrategy?.targetDepth || 5
      const currentDepth = this.gameState.processes.mining?.depth || 0
      
      // Mining session planning
      const sessionDuration = this.calculateOptimalMiningDuration()
      const energyDrain = mineParams.energyManagement?.drainRate || 3 // per minute
      
      if (sessionDuration > 0 && this.gameState.resources.energy.current >= sessionDuration * energyDrain) {
        actions.push({
          id: `start_mining_${Date.now()}`,
          type: 'mine',
          screen: 'mine',
          target: `depth_${Math.min(currentDepth + 1, depthStrategy)}`,
          duration: sessionDuration,
          energyCost: sessionDuration * energyDrain,
          goldCost: 0,
          prerequisites: [],
          expectedRewards: {
            resources: this.calculateMiningRewards(sessionDuration)
          }
        })
      }
    }
    
    return actions
  }

  /**
   * Evaluates helper management actions (Phase 6E Implementation)
   */
  private evaluateHelperActions(): GameAction[] {
    const actions: GameAction[] = []
    const helperParams = this.parameters.helpers
    
    if (!helperParams) return actions
    
    // Helper rescue decisions based on drag-and-drop priority order
    if (this.gameState.priorities.helperRescue.length > 0) {
      const unrescuedHelpers = this.getUnrescuedHelpers()
      
      for (const helperId of unrescuedHelpers) {
        const priority = this.getArrayPosition(this.gameState.priorities.helperRescue, helperId)
        const rescueCost = this.getHelperRescueCost(helperId)
        
        // Only rescue if we have enough resources and it's high priority
        if (priority > 0.6 && this.gameState.resources.gold >= rescueCost) {
          actions.push({
            id: `rescue_${helperId}_${Date.now()}`,
            type: 'rescue',
            screen: 'farm', // Helpers typically rescued on farm
            target: helperId,
            duration: 5, // 5 minutes to rescue
            energyCost: 10,
            goldCost: rescueCost,
            prerequisites: [],
            expectedRewards: { items: [helperId] }
          })
        }
      }
    }
    
    // Helper role assignment optimization
    const availableHelpers = this.gameState.helpers.gnomes.filter(g => !g.isAssigned)
    if (availableHelpers.length > 0 && helperParams.roleAssignment?.priorities) {
      const optimalRole = this.getOptimalHelperRole()
      
      if (optimalRole) {
        const bestHelper = this.selectBestHelperForRole(availableHelpers, optimalRole)
        if (bestHelper) {
          actions.push({
            id: `assign_${bestHelper.id}_${optimalRole}_${Date.now()}`,
            type: 'assign_role',
            screen: 'farm',
            target: `${bestHelper.id}:${optimalRole}`,
            duration: 2,
            energyCost: 5,
            goldCost: 0,
            prerequisites: [],
            expectedRewards: {}
          })
        }
      }
    }
    
    // Helper training decisions
    const trainableHelpers = this.gameState.helpers.gnomes.filter(
      g => g.isAssigned && g.experience < 100 // Can be trained
    )
    
    if (trainableHelpers.length > 0 && helperParams.training?.enabled) {
      const trainingCost = helperParams.training.costPerSession || 50
      
      if (this.gameState.resources.gold >= trainingCost * 2) { // Only if we have extra gold
        const helperToTrain = trainableHelpers[0] // Train first available
        
        actions.push({
          id: `train_helper_${helperToTrain.id}_${Date.now()}`,
          type: 'train_helper', 
          screen: 'farm',
          target: helperToTrain.id,
          duration: 15, // 15 minutes training
          energyCost: 0,
          goldCost: trainingCost,
          prerequisites: [],
          expectedRewards: { experience: 25 }
        })
      }
    }
    
    // Helper housing management
    if (this.gameState.helpers.gnomes.length > this.gameState.helpers.housingCapacity) {
      const housingUpgrades = this.getAvailableHousingUpgrades()
      
      for (const housing of housingUpgrades) {
        if (this.gameState.resources.gold >= housing.cost) {
          actions.push({
            id: `build_housing_${housing.id}_${Date.now()}`,
            type: 'purchase',
            screen: 'town',
            target: housing.id,
            duration: 10,
            energyCost: 15,
            goldCost: housing.cost,
            prerequisites: housing.prerequisites || [],
            expectedRewards: { items: [housing.id] }
          })
          break // Only consider one housing upgrade at a time
        }
      }
    }
    
    return actions
  }

  /**
   * Evaluates screen navigation decisions
   */
  private evaluateNavigationActions(): GameAction[] {
    const actions: GameAction[] = []
    const current = this.gameState.location.currentScreen
    
    // Use screen priorities from decision parameters
    if (this.parameters.decisions?.screenPriorities?.weights) {
      const weights = this.parameters.decisions.screenPriorities.weights
      
      for (const [screen, weight] of weights.entries()) {
        if (screen !== current && weight > 0) {
          const reason = this.getNavigationReason(screen as GameScreen)
          if (reason.score > 5) { // Only navigate if there's a good reason
            actions.push({
              id: `navigate_${screen}_${Date.now()}`,
              type: 'move',
              screen: screen as GameScreen,
              target: screen,
              duration: 1, // 1 minute to change screens
              energyCost: 0,
              goldCost: 0,
              prerequisites: [],
              expectedRewards: {}
            })
          }
        }
      }
    }
    
    return actions
  }

  /**
   * Gets the reason and score for navigating to a specific screen
   */
  private getNavigationReason(screen: GameScreen): { reason: string; score: number } {
    switch (screen) {
      case 'farm':
        const farmTasks = this.gameState.processes.crops.filter(
          c => c.readyToHarvest || c.waterLevel < 25
        ).length
        return { reason: `${farmTasks} farm tasks pending`, score: farmTasks * 2 }
        
      case 'tower':
        // Navigate to tower if we need seeds
        const totalSeeds = Array.from(this.gameState.resources.seeds.values()).reduce((a, b) => a + b, 0)
        return { reason: 'Need seeds', score: totalSeeds < 10 ? 8 : 2 }
        
      case 'town':
        // Navigate to town if we have gold to spend
        const goldScore = this.gameState.resources.gold > 100 ? 6 : 1
        return { reason: 'Purchase upgrades', score: goldScore }
        
      default:
        return { reason: 'General exploration', score: 1 }
    }
  }

  /**
   * Selects the best crop to plant based on current strategy
   */
  private selectCropToPlant(): string | null {
    const availableSeeds = Array.from(this.gameState.resources.seeds.entries())
      .filter(([crop, amount]) => amount > 0)
      .map(([crop, amount]) => crop)
    
    if (availableSeeds.length === 0) return null
    
    // Use planting strategy from parameters
    const strategy = this.gameState.automation.plantingStrategy
    
    switch (strategy) {
      case 'highest-value':
        // Simple value-based selection (in real game, would use crop data)
        return availableSeeds[0] // Placeholder
        
      case 'fastest-growth':
        // Would select fastest growing crop
        return availableSeeds[0] // Placeholder
        
      case 'balanced':
        // Would balance value and growth time
        return availableSeeds[0] // Placeholder
        
      case 'diverse':
        // Would ensure variety in planted crops
        return availableSeeds[0] // Placeholder
        
      default:
        return availableSeeds[0]
    }
  }

  /**
   * Enhanced action scoring using parameter-based evaluation
   */
  private scoreAction(action: GameAction): number {
    let score = 0
    const farmParams = this.parameters.farm
    const decisionParams = this.parameters.decisions
    
    // Base scoring by action type
    switch (action.type) {
      case 'harvest':
        // Harvesting is always high priority
        score = 100
        
        // Bonus for energy when low
        if (this.gameState.resources.energy.current < 50) {
          score += 20
        }
        break
        
      case 'water':
        // Water urgency based on crop water levels
        score = 60
        
        // Higher score if automation is enabled
        if (this.gameState.automation.wateringEnabled) {
          score += 10
        }
        break
        
      case 'plant':
        // Planting score based on available space and energy
        score = 40
        
        // Higher score if we have excess energy
        if (this.gameState.resources.energy.current > this.gameState.automation.energyReserve + 20) {
          score += 15
        }
        
        // Use planting strategy weights if available
        if (farmParams.automation?.priorityWeights?.planting) {
          score *= farmParams.automation.priorityWeights.planting
        }
        break
        
      case 'move':
        // Navigation scoring based on screen priorities
        if (decisionParams?.screenPriorities?.weights) {
          const targetScreen = action.target as string
          const weight = decisionParams.screenPriorities.weights.get(targetScreen) || 1
          score = weight * 10
          
          // Apply dynamic adjustments based on resource levels
          if (decisionParams.screenPriorities.adjustmentFactors) {
            const adjustments = decisionParams.screenPriorities.adjustmentFactors
            
            // Low energy adjustments
            if (this.gameState.resources.energy.current < 30 && adjustments.energyLow) {
              const energyAdjustment = adjustments.energyLow.get(targetScreen) || 1
              score *= energyAdjustment
            }
            
            // High gold adjustments
            if (this.gameState.resources.gold > 200 && adjustments.goldHigh) {
              const goldAdjustment = adjustments.goldHigh.get(targetScreen) || 1
              score *= goldAdjustment
            }
          }
        } else {
          score = 20 // Default navigation score
        }
        break
        
      default:
        score = 10 // Default score for other actions
    }
    
    // Apply global decision parameters
    if (decisionParams?.actionEvaluation) {
      const evalParams = decisionParams.actionEvaluation
      
      // Immediate value vs future value weighting
      const immediateValue = action.expectedRewards?.gold || 0
      const futureValue = this.calculateFutureValue(action)
      
      const weightedValue = 
        (immediateValue * evalParams.immediateValueWeight) +
        (futureValue * evalParams.futureValueWeight)
      
      score += weightedValue
      
      // Risk adjustment
      const risk = this.calculateActionRisk(action)
      score -= (risk * evalParams.riskWeight)
    }
    
    // Energy efficiency bonus
    if (action.energyCost > 0) {
      const efficiency = (action.expectedRewards?.gold || 0) / action.energyCost
      score += efficiency * 5
    }
    
    // Apply persona-based modifications (Phase 6E Enhancement)
    score = this.applyPersonaModifications(action, score)
    
    // Randomness factor for more realistic behavior
    if (decisionParams?.globalBehavior?.randomness) {
      const randomFactor = 1 + (Math.random() - 0.5) * decisionParams.globalBehavior.randomness
      score *= randomFactor
    }
    
    return Math.max(0, score)
  }

  /**
   * Calculates the future value of an action
   */
  private calculateFutureValue(action: GameAction): number {
    // Simplified future value calculation
    switch (action.type) {
      case 'plant':
        return 15 // Planting has future harvest value
      case 'move':
        return action.target === 'town' ? 5 : 2 // Moving to town enables purchases
      default:
        return 0
    }
  }

  /**
   * Calculates the risk associated with an action
   */
  private calculateActionRisk(action: GameAction): number {
    // Simplified risk calculation
    switch (action.type) {
      case 'adventure':
        return 10 // Adventures are risky
      case 'move':
        return 1 // Low risk for navigation
      default:
        return 0 // Most actions are safe
    }
  }

  /**
   * Executes a cleanup action (farm expansion)
   */
  private executeCleanupAction(action: GameAction): { success: boolean; events: GameEvent[] } {
    const events: GameEvent[] = []
    
    if (!action.target) {
      return { success: false, events: [] }
    }
    
    // Get cleanup data from CSV
    const cleanup = this.gameDataStore.getItemById(action.target)
    if (!cleanup) {
      return { success: false, events: [] }
    }
    
    // Check prerequisites using PrerequisiteSystem
    if (!PrerequisiteSystem.checkPrerequisites(cleanup, this.gameState, this.gameDataStore)) {
      return { success: false, events: [] }
    }
    
    // Parse and check energy cost
    const energyCost = CSVDataParser.parseNumericValue(cleanup.energy_cost, 0)
    if (this.gameState.resources.energy.current < energyCost) {
      return { success: false, events: [] }
    }
    
    // Check tool requirement
    if (!PrerequisiteSystem.checkToolRequirement(cleanup.tool_required, this.gameState)) {
      return { success: false, events: [] }
    }
    
    // Consume energy
    this.gameState.resources.energy.current -= energyCost
    
    // CRITICAL: Add plots to farm
    const plotsAdded = CSVDataParser.parseNumericValue(cleanup.plots_added, 0)
    if (plotsAdded > 0) {
      this.gameState.progression.farmPlots += plotsAdded
      this.gameState.progression.availablePlots += plotsAdded
    }
    
    // Mark cleanup as completed
    this.gameState.progression.completedCleanups.add(action.target)
    
    // Parse and add material rewards
    if (cleanup.materials_gain) {
      const materials = CSVDataParser.parseMaterials(cleanup.materials_gain)
      for (const [materialName, amount] of materials.entries()) {
        this.addMaterial(materialName, amount)
      }
    }
    
    // Update farm stage based on new plot count
    this.gameState.progression.farmStage = PrerequisiteSystem.getFarmStageFromPlots(
      this.gameState.progression.farmPlots
    )
    
    // Update game phase
    this.gameState.progression.currentPhase = PrerequisiteSystem.getCurrentPhase(this.gameState)
    
    // Create event log
    const materialRewards = cleanup.materials_gain ? ` (+${cleanup.materials_gain})` : ''
    events.push({
      timestamp: this.gameState.time.totalMinutes,
      type: 'action_cleanup',
      description: `Cleared ${cleanup.name}: +${plotsAdded} plots (total: ${this.gameState.progression.farmPlots})${materialRewards}`,
      importance: 'high'
    })
    
    return { success: true, events }
  }

  /**
   * Executes an adventure action using the real combat system
   */
  private executeAdventureAction(action: GameAction): { success: boolean; totalGold: number; totalXP: number; finalHP: number; loot: string[]; combatLog: string[] } {
    if (!action.target) {
      return { success: false, totalGold: 0, totalXP: 0, finalHP: 0, loot: [], combatLog: ['No adventure target specified'] }
    }

    // Parse route configuration from action target (e.g., "meadow_path_short")
    const routeConfig = this.parseRouteConfig(action.target)
    if (!routeConfig) {
      return { success: false, totalGold: 0, totalXP: 0, finalHP: 0, loot: [], combatLog: ['Invalid route configuration'] }
    }

    // Convert game state weapons to combat system format
    const weapons = this.convertWeaponsForCombat()
    if (weapons.size === 0) {
      return { success: false, totalGold: 0, totalXP: 0, finalHP: 0, loot: [], combatLog: ['No weapons equipped'] }
    }

    // Convert game state armor to combat system format
    const armor = this.convertArmorForCombat()

    // Get hero level
    const heroLevel = this.gameState.progression.heroLevel

    // Run combat simulation
    const result = CombatSystem.simulateAdventure(
      routeConfig,
      weapons,
      armor,
      heroLevel,
      [], // helpers - not implemented yet
      this.parameters.adventure || {}
    )

    return {
      success: result.success,
      totalGold: result.totalGold,
      totalXP: result.totalXP,
      finalHP: result.finalHP,
      loot: result.loot,
      combatLog: result.combatLog
    }
  }

  /**
   * Parse route configuration from adventure target string
   */
  private parseRouteConfig(target: string): RouteConfig | null {
    // Parse target like "meadow_path_short" into route config
    const parts = target.split('_')
    if (parts.length < 3) return null

    const length = parts[parts.length - 1]
    const routeId = parts.slice(0, -1).join('_')

    // Get adventure data from CSV
    const adventureData = this.gameDataStore.getItemById(target)
    if (!adventureData) return null

    // Map length to proper case
    const lengthMap: Record<string, 'Short' | 'Medium' | 'Long'> = {
      'short': 'Short',
      'medium': 'Medium', 
      'long': 'Long'
    }

    const routeLength = lengthMap[length.toLowerCase()]
    if (!routeLength) return null

    return {
      id: routeId,
      length: routeLength,
      waveCount: this.getWaveCountForRoute(routeId, routeLength),
      boss: adventureData.boss as any, // Boss type from CSV
      enemyRolls: adventureData.enemy_rolls || 'fixed',
      goldGain: CSVDataParser.parseNumericValue(adventureData.gold_gain, 0),
      xpGain: 60 + (routeLength === 'Long' ? 20 : routeLength === 'Medium' ? 10 : 0) // Base XP + length bonus
    }
  }

  /**
   * Get wave count for a specific route and length
   */
  private getWaveCountForRoute(routeId: string, length: 'Short' | 'Medium' | 'Long'): number {
    const waveCountMap: Record<string, Record<string, number>> = {
      'meadow_path': { 'Short': 3, 'Medium': 5, 'Long': 8 },
      'pine_vale': { 'Short': 4, 'Medium': 6, 'Long': 10 },
      'dark_forest': { 'Short': 4, 'Medium': 7, 'Long': 12 },
      'mountain_pass': { 'Short': 5, 'Medium': 8, 'Long': 14 },
      'crystal_caves': { 'Short': 5, 'Medium': 9, 'Long': 16 },
      'frozen_tundra': { 'Short': 6, 'Medium': 10, 'Long': 18 },
      'volcano_core': { 'Short': 6, 'Medium': 11, 'Long': 20 }
    }

    return waveCountMap[routeId]?.[length] || 3
  }

  /**
   * Convert game state weapons to combat system format
   */
  private convertWeaponsForCombat(): Map<WeaponType, WeaponData> {
    const combatWeapons = new Map<WeaponType, WeaponData>()

    // Get equipped weapons from game state
    for (const [weaponType, weaponInfo] of this.gameState.inventory.weapons) {
      if (!weaponInfo || weaponInfo.level <= 0) continue

      // Get weapon data from CSV for this level
      const weaponId = `${weaponType}_${weaponInfo.level}`
      const weaponData = this.gameDataStore.getItemById(weaponId)
      
      if (weaponData) {
        combatWeapons.set(weaponType as WeaponType, {
          type: weaponType as WeaponType,
          damage: CSVDataParser.parseNumericValue(weaponData.damage, 10),
          attackSpeed: parseFloat(weaponData.attackSpeed) || 1.0,
          level: weaponInfo.level
        })
      }
    }

    return combatWeapons
  }

  /**
   * Convert game state armor to combat system format
   */
  private convertArmorForCombat(): ArmorData | null {
    // For now, return a basic armor setup since armor system isn't fully implemented
    // In a full implementation, this would check equipped armor from inventory
    const equippedArmor = Array.from(this.gameState.inventory.armor.values())[0]
    
    if (!equippedArmor) {
      return null // No armor equipped
    }

    // Parse armor data (simplified for now)
    // Note: ArmorState interface may not have defense/effect properties yet
    return {
      defense: (equippedArmor as any).defense || 0,
      effect: ((equippedArmor as any).effect as ArmorEffect) || 'none'
    }
  }

  /**
   * Executes a water action using the new CropSystem
   */
  private executeWaterAction(action: GameAction, events: GameEvent[]): boolean {
    // Check water availability
    if (this.gameState.resources.water.current <= 0) {
      return false
    }
    
    // Determine water amount based on tool equipped
    let waterAmount = 1.0 // Base watering amount
    
    // Check for watering tools and their efficiency
    const tools = this.gameState.inventory.tools
    if (tools.has('rain_bringer') && tools.get('rain_bringer')?.isEquipped) {
      waterAmount = 8.0 // Rain Bringer: very efficient
    } else if (tools.has('sprinkler_can') && tools.get('sprinkler_can')?.isEquipped) {
      waterAmount = 4.0 // Sprinkler Can: efficient
    } else if (tools.has('watering_can_ii') && tools.get('watering_can_ii')?.isEquipped) {
      waterAmount = 2.0 // Watering Can II: improved
    }
    
    // Use CropSystem to distribute water efficiently
    const waterUsed = CropSystem.distributeWater(this.gameState, waterAmount)
    
    if (waterUsed > 0) {
      // Consume water from resources
      this.gameState.resources.water.current = Math.max(0, 
        this.gameState.resources.water.current - waterUsed
      )
      
      // Consume energy (base cost from action)
      this.gameState.resources.energy.current -= action.energyCost
      
      events.push({
        timestamp: this.gameState.time.totalMinutes,
        type: 'action_water',
        description: `Watered crops using ${waterUsed.toFixed(1)} water`,
        importance: 'low'
      })
      
      return true
    }
    
    return false
  }

  /**
   * Executes a pump action to generate water
   */
  private executePumpAction(action: GameAction, events: GameEvent[]): boolean {
    // Check if we're at water capacity
    if (this.gameState.resources.water.current >= this.gameState.resources.water.max) {
      return false
    }
    
    // Determine pump rate based on upgrades
    let pumpRate = 2 // Base pump rate
    
    // Check for pump upgrades
    const upgrades = this.gameState.progression.unlockedUpgrades
    if (upgrades.includes('crystal_pump')) {
      pumpRate = 60 // Crystal Pump: very fast
    } else if (upgrades.includes('steam_pump')) {
      pumpRate = 30 // Steam Pump: fast
    } else if (upgrades.includes('well_pump_iii')) {
      pumpRate = 15 // Well Pump III: good
    } else if (upgrades.includes('well_pump_ii')) {
      pumpRate = 8 // Well Pump II: improved
    } else if (upgrades.includes('well_pump_i')) {
      pumpRate = 4 // Well Pump I: basic upgrade
    }
    
    // Add water (limited by capacity)
    const waterToAdd = Math.min(pumpRate, 
      this.gameState.resources.water.max - this.gameState.resources.water.current
    )
    
    this.gameState.resources.water.current += waterToAdd
    
    // Consume energy
    this.gameState.resources.energy.current -= action.energyCost
    
    events.push({
      timestamp: this.gameState.time.totalMinutes,
      type: 'action_pump',
      description: `Pumped ${waterToAdd} water`,
      importance: 'low'
    })
    
    return true
  }

  /**
   * Executes a game action
   */
  private executeAction(action: GameAction): { success: boolean; events: GameEvent[] } {
    const events: GameEvent[] = []
    
    // Check if we have enough energy
    if (this.gameState.resources.energy.current < action.energyCost) {
      return { success: false, events: [] }
    }
    
    // Consume energy
    this.gameState.resources.energy.current -= action.energyCost
    
    // Execute action based on type
    switch (action.type) {
      case 'plant':
        if (action.target) {
          const currentSeeds = this.gameState.resources.seeds.get(action.target) || 0
          if (currentSeeds > 0) {
            // Get crop data from CSV for accurate growth time and stages
            const cropData = this.gameDataStore.getItemById(action.target)
            const growthTime = cropData ? parseInt(cropData.time) || 10 : 10
            const stages = cropData ? this.parseGrowthStages(cropData.notes) : 3
            
            this.gameState.resources.seeds.set(action.target, currentSeeds - 1)
            this.gameState.processes.crops.push({
              plotId: `plot_${this.gameState.processes.crops.length + 1}`,
              cropId: action.target,
              plantedAt: this.gameState.time.totalMinutes,
              growthTimeRequired: growthTime,
              waterLevel: 1.0, // Start fully watered (0-1 scale)
              isWithered: false,
              readyToHarvest: false,
              
              // Enhanced growth tracking
              growthProgress: 0,
              growthStage: 0,
              maxStages: stages,
              droughtTime: 0
            })
            
            events.push({
              timestamp: this.gameState.time.totalMinutes,
              type: 'action_plant',
              description: `Planted ${action.target} (${growthTime}min growth, ${stages} stages)`,
              importance: 'low'
            })
          }
        }
        break
        
      case 'water':
        return this.executeWaterAction(action, events)
        
      case 'pump':
        return this.executePumpAction(action, events)
        
      case 'harvest':
        const harvestCrop = this.gameState.processes.crops.find(c => c.plotId === action.target)
        if (harvestCrop && harvestCrop.readyToHarvest) {
          // Remove crop from processes
          this.gameState.processes.crops = this.gameState.processes.crops.filter(
            c => c.plotId !== action.target
          )
          
          // Award rewards
          this.gameState.resources.gold += action.expectedRewards.gold || 0
          
          events.push({
            timestamp: this.gameState.time.totalMinutes,
            type: 'action_harvest',
            description: `Harvested ${harvestCrop.cropId}`,
            importance: 'medium'
          })
        }
        break
        
      case 'catch_seeds':
        // Add seeds to inventory
        const seedsGained = action.expectedRewards.resources?.seeds || 0
        if (seedsGained > 0) {
          // Distribute seeds randomly among available types
          const seedTypes = Array.from(this.gameState.resources.seeds.keys())
          const seedType = seedTypes[Math.floor(Math.random() * seedTypes.length)]
          const currentAmount = this.gameState.resources.seeds.get(seedType) || 0
          this.gameState.resources.seeds.set(seedType, currentAmount + seedsGained)
          
          events.push({
            timestamp: this.gameState.time.totalMinutes,
            type: 'action_catch_seeds',
            description: `Caught ${seedsGained} seeds in tower`,
            importance: 'low'
          })
        }
        break
        
      case 'train':
        // Award experience for training
        const xpGain = action.expectedRewards.experience || 0
        this.gameState.progression.experience += xpGain
        this.gameState.resources.gold -= action.goldCost
        
        events.push({
          timestamp: this.gameState.time.totalMinutes,
          type: 'action_train',
          description: `Trained ${action.target} skill for ${xpGain} XP`,
          importance: 'medium'
        })
        break
        
      case 'craft':
        // Start crafting process
        if (action.target) {
          this.gameState.processes.crafting.push({
            itemId: action.target,
            startedAt: this.gameState.time.totalMinutes,
            duration: action.duration,
            progress: 0,
            heat: this.getForgeHeat(),
            isComplete: false
          })
          
          events.push({
            timestamp: this.gameState.time.totalMinutes,
            type: 'action_craft',
            description: `Started crafting ${action.target}`,
            importance: 'medium'
          })
        }
        break
        
      case 'stoke':
        // Increase forge heat (placeholder)
        events.push({
          timestamp: this.gameState.time.totalMinutes,
          type: 'action_stoke',
          description: 'Stoked the forge fire',
          importance: 'low'
        })
        break
        
      case 'mine':
        // Start mining process
        this.gameState.processes.mining = {
          depth: 1, // Would extract from action.target
          energyDrain: 3,
          isActive: true,
          timeAtDepth: 0
        }
        
        events.push({
          timestamp: this.gameState.time.totalMinutes,
          type: 'action_mine',
          description: `Started mining at depth ${this.gameState.processes.mining.depth}`,
          importance: 'medium'
        })
        break
        
      case 'purchase':
        // Handle purchases
        this.gameState.resources.gold -= action.goldCost
        
        // Add purchased item to inventory (simplified)
        if (action.expectedRewards.items) {
          for (const item of action.expectedRewards.items) {
            // Would add to appropriate inventory section
            events.push({
              timestamp: this.gameState.time.totalMinutes,
              type: 'action_purchase',
              description: `Purchased ${item} for ${action.goldCost} gold`,
              importance: 'medium'
            })
          }
        }
        break
        
      case 'adventure':
        // Execute real combat simulation
        if (action.target) {
          const combatResult = this.executeAdventureAction(action)
          if (combatResult.success) {
            // Apply rewards immediately
            this.gameState.resources.gold += combatResult.totalGold
            this.gameState.progression.experience += combatResult.totalXP
            
            // Apply HP loss to hero
            const maxHP = 100 + (this.gameState.progression.heroLevel * 20)
            const hpLoss = maxHP - combatResult.finalHP
            
            events.push({
              timestamp: this.gameState.time.totalMinutes,
              type: 'adventure_complete',
              description: `Completed ${action.target} - Gold: +${combatResult.totalGold}, XP: +${combatResult.totalXP}, HP: ${combatResult.finalHP}/${maxHP}`,
              data: { 
                gold: combatResult.totalGold, 
                xp: combatResult.totalXP, 
                hp: combatResult.finalHP,
                loot: combatResult.loot,
                combatLog: combatResult.combatLog
              },
              importance: 'high'
            })
            
            // Add completed adventure to progression
            if (!this.gameState.progression.completedAdventures.includes(action.target)) {
              this.gameState.progression.completedAdventures.push(action.target)
            }
          } else {
            events.push({
              timestamp: this.gameState.time.totalMinutes,
              type: 'adventure_failed',
              description: `Failed ${action.target} - Hero defeated!`,
              data: { combatLog: combatResult.combatLog },
              importance: 'high'
            })
          }
        }
        break
        
      case 'move':
        // Change screens
        if (action.target && action.target !== this.gameState.location.currentScreen) {
          this.gameState.location.currentScreen = action.target as GameScreen
          this.gameState.location.timeOnScreen = 0
          this.gameState.location.screenHistory.push(action.target as GameScreen)
          this.gameState.location.navigationReason = `AI decision: ${action.id}`
          
          events.push({
            timestamp: this.gameState.time.totalMinutes,
            type: 'action_move',
            description: `Moved to ${action.target}`,
            importance: 'low'
          })
        }
        break

      case 'rescue':
        // Rescue a helper (gnome)
        if (action.target) {
          const newGnome = {
            id: action.target,
            name: action.target.replace('_gnome', '').replace('_', ' '),
            role: '',
            efficiency: 1.0,
            isAssigned: false,
            currentTask: null,
            experience: 0
          }
          
          this.gameState.helpers.gnomes.push(newGnome)
          this.gameState.resources.gold -= action.goldCost
          
          events.push({
            timestamp: this.gameState.time.totalMinutes,
            type: 'action_rescue',
            description: `Rescued ${newGnome.name} gnome`,
            importance: 'high'
          })
        }
        break
        
      case 'assign_role':
      case 'assign_helper':
        // Delegate to helper assignment handler
        return this.executeAssignHelperAction(action)
        
      case 'train_helper':
        // Delegate to helper training handler
        return this.executeTrainHelperAction(action)
        
      case 'cleanup':
        // Delegate to cleanup action handler
        return this.executeCleanupAction(action)
    }
    
    return { success: true, events }
  }

  /**
   * Executes helper assignment action
   */
  private executeAssignHelperAction(action: GameAction): { success: boolean; events: GameEvent[] } {
    const events: GameEvent[] = []
    
    if (!action.target) {
      return { success: false, events: [] }
    }
    
    const [helperId, role] = action.target.split(':')
    const helper = this.gameState.helpers.gnomes.find(g => g.id === helperId)
    
    if (!helper) {
      return { success: false, events: [] }
    }
    
    // Check if helper is housed (using isAssigned as housing indicator)
    if (!helper.isAssigned && this.gameState.helpers.housingCapacity <= this.gameState.helpers.gnomes.filter(g => g.isAssigned).length) {
      return { success: false, events: [] }
    }
    
    // Assign primary role
    helper.role = role
    helper.isAssigned = true
    
    // Handle secondary role if master_academy exists
    if (this.gameState.progression.unlockedUpgrades.includes('master_academy')) {
      // For now, store secondary role in currentTask with special prefix
      const secondaryRole = this.getOptimalSecondaryRole(helper, role)
      if (secondaryRole) {
        helper.currentTask = `secondary_${secondaryRole}`
      }
    }
    
    events.push({
      timestamp: this.gameState.time.totalMinutes,
      type: 'action_assign_helper',
      description: `Assigned ${helper.name} to ${role} role`,
      importance: 'medium'
    })
    
    return { success: true, events }
  }

  /**
   * Executes helper training action
   */
  private executeTrainHelperAction(action: GameAction): { success: boolean; events: GameEvent[] } {
    const events: GameEvent[] = []
    
    if (!action.target) {
      return { success: false, events: [] }
    }
    
    const helper = this.gameState.helpers.gnomes.find(g => g.id === action.target)
    if (!helper) {
      return { success: false, events: [] }
    }
    
    // Calculate current level from efficiency (efficiency = 1.0 + level * 0.1)
    const currentLevel = Math.floor((helper.efficiency - 1.0) / 0.1)
    
    // Calculate cost: 50 * 2^level energy
    const energyCost = 50 * Math.pow(2, currentLevel)
    const trainingTime = 30 * (currentLevel + 1) // 30 * (level + 1) minutes
    
    // Check if we have enough energy
    if (this.gameState.resources.energy.current < energyCost) {
      return { success: false, events: [] }
    }
    
    // Consume energy
    this.gameState.resources.energy.current -= energyCost
    
    // Start training process (simplified - in full implementation would be a process)
    helper.experience += 100 // Gain experience
    helper.efficiency = Math.min(2.0, 1.0 + (currentLevel + 1) * 0.1) // Increase efficiency
    
    events.push({
      timestamp: this.gameState.time.totalMinutes,
      type: 'action_train_helper',
      description: `Started training ${helper.name} (Level ${currentLevel + 1}, ${trainingTime} min)`,
      importance: 'medium'
    })
    
    return { success: true, events }
  }

  /**
   * Helper method to determine optimal secondary role for dual-role helpers
   */
  private getOptimalSecondaryRole(helper: GnomeState, primaryRole: string): string | null {
    // Simple logic to assign complementary secondary roles
    const complementaryRoles: { [key: string]: string } = {
      'waterer': 'harvester',
      'harvester': 'sower',
      'sower': 'waterer',
      'pump': 'waterer',
      'miner': 'refiner',
      'refiner': 'forager',
      'forager': 'refiner',
      'catcher': 'sower',
      'fighter': 'support',
      'support': 'fighter'
    }
    
    return complementaryRoles[primaryRole] || null
  }

  /**
   * Updates phase progression based on current game state
   * Called after significant progression events like cleanup completion
   */
  private updatePhaseProgression(): void {
    const oldPhase = this.gameState.progression.currentPhase
    const oldStage = this.gameState.progression.farmStage
    
    // Update farm stage based on plot count
    this.gameState.progression.farmStage = PrerequisiteSystem.getFarmStageFromPlots(
      this.gameState.progression.farmPlots
    )
    
    // Update game phase based on plots and hero level
    this.gameState.progression.currentPhase = PrerequisiteSystem.getCurrentPhase(this.gameState)
    
    // Log phase transitions
    if (oldPhase !== this.gameState.progression.currentPhase) {
      this.addEvent({
        timestamp: this.gameState.time.totalMinutes,
        type: 'phase_transition',
        description: `Progressed from ${oldPhase} to ${this.gameState.progression.currentPhase} phase`,
        importance: 'high'
      })
    }
    
    if (oldStage !== this.gameState.progression.farmStage) {
      const stageNames = ['', 'Tutorial', 'Small Hold', 'Homestead', 'Manor Grounds', 'Great Estate']
      const stageName = stageNames[this.gameState.progression.farmStage] || 'Unknown'
      
      this.addEvent({
        timestamp: this.gameState.time.totalMinutes,
        type: 'farm_stage_transition',
        description: `Farm expanded to ${stageName} (Stage ${this.gameState.progression.farmStage})`,
        importance: 'high'
      })
    }
  }

  /**
   * Parse growth stages from crop notes field
   */
  private parseGrowthStages(notes: string): number {
    if (!notes) return 3 // Default to 3 stages
    
    const match = notes.match(/Growth Stages (\d+)/i)
    return match ? parseInt(match[1]) : 3
  }

  /**
   * Adds a game event to the current tick's events
   */
  private addEvent(event: GameEvent): void {
    // Add event to current tick's events
    // This would be collected and returned in the tick result
    // For now, just log it
    console.log(`📝 Event: ${event.description}`)
  }

  /**
   * Updates automation systems
   */
  private updateAutomation() {
    // Automation logic would go here
    // For now, just basic checks
  }

  /**
   * Checks if victory conditions are met
   */
  private checkVictoryConditions(): boolean {
    // Simple victory condition: reach day 35 or hero level 10
    return this.gameState.time.day >= 35 || this.gameState.progression.heroLevel >= 10
  }

  /**
   * Checks if simulation is stuck (bottleneck detection)
   */
  private checkBottleneckConditions(): boolean {
    // Simple bottleneck: no energy and no progress for extended time
    return this.gameState.resources.energy.current <= 0 && 
           this.gameState.location.timeOnScreen > 60 // Stuck on same screen for 1 hour
  }

  /**
   * Gets current game state (for external access)
   */
  getGameState(): GameState {
    return this.gameState
  }

  /**
   * Sets simulation speed
   */
  setSpeed(speed: number) {
    this.gameState.time.speed = Math.max(0.1, Math.min(1000, speed))
  }

  /**
   * Pauses/resumes simulation
   */
  setRunning(running: boolean) {
    this.isRunning = running
  }

  /**
   * Gets simulation statistics
   */
  getStats() {
    return {
      tickCount: this.tickCount,
      daysPassed: this.gameState.time.day - 1,
      isRunning: this.isRunning,
      currentPhase: this.gameState.progression.currentPhase
    }
  }

  /**
   * Testing framework for validating decision engine with different personas (Phase 6E)
   */
  static validateDecisionEngine(): { 
    success: boolean; 
    results: Array<{ persona: string; actions: string[]; scores: number[] }>; 
    errors: string[] 
  } {
    const results: Array<{ persona: string; actions: string[]; scores: number[] }> = []
    const errors: string[] = []
    
    try {
      // Test scenarios for different personas
      const testPersonas = ['speedrunner', 'casual', 'weekend-warrior']
      const testConfigs = testPersonas.map(personaId => ({
        quickSetup: { personaId },
        parameterOverrides: new Map(),
        gameData: null
      }))
      
      for (let i = 0; i < testPersonas.length; i++) {
        const personaId = testPersonas[i]
        const config = testConfigs[i]
        
        try {
          // Create test engine instance
          const engine = new SimulationEngine(config)
          
          // Set up test game state scenario
          engine.setupTestScenario('early_game')
          
          // Run decision making test
          const actions = engine.makeDecisions()
          const actionTypes = actions.map(a => a.type)
          const scores = actions.map(a => a.score || 0)
          
          results.push({
            persona: personaId,
            actions: actionTypes,
            scores: scores
          })
          
          // Validate persona-specific behaviors
          const validationResult = engine.validatePersonaBehavior(personaId, actions)
          if (!validationResult.isValid) {
            errors.push(`${personaId}: ${validationResult.reason}`)
          }
          
        } catch (error) {
          errors.push(`${personaId} test failed: ${error}`)
        }
      }
      
      // Validate differences between personas
      const behaviorDifferences = SimulationEngine.validateBehaviorDifferences(results)
      if (!behaviorDifferences.hasSignificantDifferences) {
        errors.push('Personas do not show significantly different behaviors')
      }
      
      return {
        success: errors.length === 0,
        results,
        errors
      }
      
    } catch (error) {
      return {
        success: false,
        results: [],
        errors: [`Test framework error: ${error}`]
      }
    }
  }

  /**
   * Sets up a test scenario with specific game state
   */
  private setupTestScenario(scenario: 'early_game' | 'mid_game' | 'late_game'): void {
    switch (scenario) {
      case 'early_game':
        this.gameState.resources.energy.current = 100
        this.gameState.resources.energy.max = 150
        this.gameState.resources.gold = 50
        this.gameState.progression.heroLevel = 2
        this.gameState.progression.currentPhase = 'Early'
        this.gameState.progression.farmStage = 1
        // Set up some ready crops for testing
        this.gameState.processes.crops = Array(5).fill(null).map((_, i) => ({
          plotId: `plot_${i + 1}`,
          cropId: i < 3 ? 'carrot' : '',
          plantedAt: this.gameState.time.totalMinutes - (i < 2 ? 100 : 50),
          growthTimeRequired: 6, // Carrot growth time from CSV
          waterLevel: 0.8,
          isWithered: false,
          readyToHarvest: i < 2,
          
          // Enhanced growth tracking
          growthProgress: i < 2 ? 1.0 : 0.7,
          growthStage: i < 2 ? 3 : 2,
          maxStages: 3, // Carrot has 3 stages
          droughtTime: 0
        })).filter(crop => crop.cropId) // Only include plots with crops
        break
        
      case 'mid_game':
        this.gameState.resources.energy.current = 250
        this.gameState.resources.energy.max = 300
        this.gameState.resources.gold = 500
        this.gameState.progression.heroLevel = 8
        this.gameState.progression.currentPhase = 'Mid'
        this.gameState.progression.farmStage = 3
        this.gameState.progression.unlockedUpgrades = ['forge_access', 'tower_access', 'town_access']
        break
        
      case 'late_game':
        this.gameState.resources.energy.current = 400
        this.gameState.resources.energy.max = 500
        this.gameState.resources.gold = 2000
        this.gameState.progression.heroLevel = 15
        this.gameState.progression.currentPhase = 'Late'
        this.gameState.progression.farmStage = 5
        this.gameState.progression.unlockedUpgrades = ['forge_access', 'tower_access', 'town_access', 'mine_access', 'adventure_access']
        break
    }
  }

  /**
   * Validates that a persona is behaving as expected
   */
  private validatePersonaBehavior(personaId: string, actions: GameAction[]): { isValid: boolean; reason?: string } {
    if (actions.length === 0) {
      return { isValid: false, reason: 'No actions generated' }
    }
    
    const actionTypes = actions.map(a => a.type)
    const avgScore = actions.reduce((sum, a) => sum + (a.score || 0), 0) / actions.length
    
    switch (personaId) {
      case 'speedrunner':
        // Speedrunners should prioritize efficient actions
        if (avgScore < 50) {
          return { isValid: false, reason: 'Speedrunner actions have unexpectedly low scores' }
        }
        if (actionTypes.includes('water') && !actionTypes.includes('harvest') && !actionTypes.includes('plant')) {
          return { isValid: false, reason: 'Speedrunner doing inefficient watering without harvesting/planting' }
        }
        break
        
      case 'casual':
        // Casual players should avoid high-energy actions
        const hasHighEnergyAction = actions.some(a => (a.energyCost || 0) > 50)
        if (hasHighEnergyAction) {
          return { isValid: false, reason: 'Casual player attempting high-energy action' }
        }
        // Should favor safe, basic actions
        const hasSafeAction = actionTypes.some(type => ['water', 'harvest', 'plant'].includes(type))
        if (!hasSafeAction) {
          return { isValid: false, reason: 'Casual player not doing basic farming actions' }
        }
        break
        
      case 'weekend-warrior':
        // Weekend warriors should batch actions
        if (actions.length < 2) {
          return { isValid: false, reason: 'Weekend warrior not batching actions efficiently' }
        }
        break
    }
    
    return { isValid: true }
  }

  /**
   * Validates that different personas show distinct behaviors
   */
  static validateBehaviorDifferences(results: Array<{ persona: string; actions: string[]; scores: number[] }>): { 
    hasSignificantDifferences: boolean; 
    analysis: string 
  } {
    if (results.length < 2) {
      return { hasSignificantDifferences: false, analysis: 'Need at least 2 persona results to compare' }
    }
    
    // Compare average scores
    const avgScores = results.map(r => r.scores.reduce((sum, s) => sum + s, 0) / r.scores.length)
    const scoreVariance = Math.max(...avgScores) - Math.min(...avgScores)
    
    // Compare action diversity
    const uniqueActionSets = new Set(results.map(r => r.actions.join(',')))
    const actionDiversity = uniqueActionSets.size
    
    // Analyze behavior patterns
    let analysis = `Score variance: ${scoreVariance.toFixed(2)}, Action diversity: ${actionDiversity}/${results.length}`
    
    // Significant differences if:
    // 1. Score variance > 20 points OR
    // 2. At least 75% of personas have unique action sets
    const hasSignificantDifferences = scoreVariance > 20 || actionDiversity >= results.length * 0.75
    
    if (hasSignificantDifferences) {
      analysis += ' - Personas show distinct behavioral patterns ✓'
    } else {
      analysis += ' - Personas appear too similar ⚠️'
    }
    
    return { hasSignificantDifferences, analysis }
  }

  /**
   * Run comprehensive parameter configuration test
   */
  static testParameterConfigurations(): { 
    success: boolean; 
    configResults: Array<{ config: string; avgScore: number; actionCount: number }>; 
    errors: string[] 
  } {
    const configResults: Array<{ config: string; avgScore: number; actionCount: number }> = []
    const errors: string[] = []
    
    try {
      // Test different parameter configurations
      const testConfigs = [
        { name: 'high_efficiency', overrides: new Map([['farm.efficiency.energyValue', 2.0]]) },
        { name: 'risk_averse', overrides: new Map([['adventure.thresholds.riskTolerance', 0.2]]) },
        { name: 'gold_focused', overrides: new Map([['town.thresholds.saveGoldAbove', 1000]]) },
        { name: 'default', overrides: new Map() }
      ]
      
      for (const testConfig of testConfigs) {
        try {
          const config = {
            quickSetup: { personaId: 'casual' },
            parameterOverrides: testConfig.overrides,
            gameData: null
          }
          
          const engine = new SimulationEngine(config)
          engine.setupTestScenario('mid_game')
          
          const actions = engine.makeDecisions()
          const avgScore = actions.reduce((sum, a) => sum + (a.score || 0), 0) / Math.max(actions.length, 1)
          
          configResults.push({
            config: testConfig.name,
            avgScore,
            actionCount: actions.length
          })
          
        } catch (error) {
          errors.push(`${testConfig.name} config test failed: ${error}`)
        }
      }
      
      return {
        success: errors.length === 0,
        configResults,
        errors
      }
      
    } catch (error) {
      return {
        success: false,
        configResults: [],
        errors: [`Parameter test framework error: ${error}`]
      }
    }
  }

  // ===== Phase 6E Helper Methods =====

  /**
   * Gets the current auto-catcher level
   */
  private getAutoCatcherLevel(): number {
    // Placeholder - would look up from inventory/upgrades
    return 0
  }

  /**
   * Gets the current tower reach level
   */
  private getTowerReachLevel(): number {
    // Placeholder - would look up from progression
    return 1
  }

  /**
   * Gets affordable upgrades from CSV data
   */
  private getAffordableUpgrades(): Array<{
    id: string
    cost: number
    category: string
    vendorId?: string
    prerequisites?: string[]
  }> {
    const upgrades: Array<{
      id: string
      cost: number
      category: string
      vendorId?: string
      prerequisites?: string[]
    }> = []
    
    try {
      // Query town/upgrade data from CSV files
      const townItems = this.gameDataStore.itemsByGameFeature['Town'] || []
      
      for (const item of townItems) {
        // Parse cost from materials (e.g., "Gold x100")
        const goldCost = this.parseGoldCost(item.materials)
        
        if (goldCost > 0 && this.gameState.resources.gold >= goldCost) {
          // Check if already owned
          if (!this.gameState.progression.unlockedUpgrades.includes(item.id)) {
            upgrades.push({
              id: item.id,
              cost: goldCost,
              category: item.category,
              vendorId: this.parseVendorId(item.type),
              prerequisites: item.prerequisites || []
            })
          }
        }
      }
      
      // Also check specialized data for town vendors
      const townVendorData = this.gameDataStore.getSpecializedDataByFile('town_vendors.csv')
      for (const vendor of townVendorData) {
        if (vendor.cost && vendor.cost <= this.gameState.resources.gold) {
          upgrades.push({
            id: vendor.id || vendor.name,
            cost: parseInt(vendor.cost),
            category: vendor.category || 'misc',
            vendorId: vendor.vendor || 'general',
            prerequisites: vendor.prerequisites ? vendor.prerequisites.split(';') : []
          })
        }
      }
      
    } catch (error) {
      console.warn('Failed to load affordable upgrades from CSV, using fallback:', error)
      // Fallback to placeholder data if CSV loading fails
      return [
        { id: 'storage_shed_1', cost: 100, category: 'storage', vendorId: 'general' },
        { id: 'better_hoe', cost: 150, category: 'tool', vendorId: 'blacksmith' }
      ].filter(item => this.gameState.resources.gold >= item.cost)
    }
    
    return upgrades
  }

  /**
   * Gets position-based priority from drag-and-drop ordered arrays
   */
  private getArrayPosition(priorityArray: string[], itemId: string): number {
    const index = priorityArray.indexOf(itemId)
    if (index === -1) return 0.5 // Default middle priority
    
    // Convert array position to priority weight (earlier = higher priority)
    const maxIndex = priorityArray.length - 1
    return maxIndex === 0 ? 1.0 : 1.0 - (index / maxIndex) * 0.8
  }

  /**
   * Gets available skill training options
   */
  private getAvailableTraining(): Array<{
    skill: string
    cost: number
    duration: number
    xpGain: number
  }> {
    // Placeholder - would query CSV data for available training
    return [
      { skill: 'farming', cost: 250, duration: 30, xpGain: 100 },
      { skill: 'combat', cost: 300, duration: 45, xpGain: 150 }
    ]
  }

  /**
   * Determines if a skill should be trained based on current progression
   */
  private shouldTrainSkill(training: { skill: string; cost: number }): boolean {
    // Placeholder logic - would check current skill levels and needs
    return this.gameState.resources.gold >= training.cost * 1.2 // Only if we have extra gold
  }

  /**
   * Gets available adventure routes based on unlocks and progression
   */
  private getAvailableAdventureRoutes(): Array<{
    id: string
    prerequisites?: string[]
    short: { duration: number; energyCost: number; goldReward: number; xpReward: number; loot?: string[] }
    medium?: { duration: number; energyCost: number; goldReward: number; xpReward: number; loot?: string[] }
    long?: { duration: number; energyCost: number; goldReward: number; xpReward: number; loot?: string[] }
  }> {
    const routes: Array<{
      id: string
      prerequisites?: string[]
      short: { duration: number; energyCost: number; goldReward: number; xpReward: number; loot?: string[] }
      medium?: { duration: number; energyCost: number; goldReward: number; xpReward: number; loot?: string[] }
      long?: { duration: number; energyCost: number; goldReward: number; xpReward: number; loot?: string[] }
    }> = []
    
    try {
      // Query adventure data from CSV files
      const adventureItems = this.gameDataStore.itemsByGameFeature['Adventure'] || []
      
      // Group adventures by base route (remove _short, _medium, _long suffixes)
      const routeGroups: { [key: string]: any[] } = {}
      
      for (const item of adventureItems) {
        let baseRouteId = item.id
        let duration = 'short'
        
        if (item.id.endsWith('_short')) {
          baseRouteId = item.id.replace('_short', '')
          duration = 'short'
        } else if (item.id.endsWith('_medium')) {
          baseRouteId = item.id.replace('_medium', '')
          duration = 'medium'
        } else if (item.id.endsWith('_long')) {
          baseRouteId = item.id.replace('_long', '')
          duration = 'long'
        }
        
        if (!routeGroups[baseRouteId]) {
          routeGroups[baseRouteId] = []
        }
        
        routeGroups[baseRouteId].push({
          duration,
          item,
          energyCost: this.parseEnergyCost(item.materials),
          goldReward: this.parseReward(item.effects, 'gold'),
          xpReward: this.parseReward(item.effects, 'xp'),
          durationMinutes: this.parseDuration(item.description)
        })
      }
      
      // Convert groups into route objects
      for (const [routeId, variants] of Object.entries(routeGroups)) {
        const route: any = {
          id: routeId,
          prerequisites: variants[0]?.item.prerequisites || []
        }
        
        for (const variant of variants) {
          route[variant.duration] = {
            duration: variant.durationMinutes,
            energyCost: variant.energyCost,
            goldReward: variant.goldReward,
            xpReward: variant.xpReward
          }
        }
        
        // Only include routes that have at least a short variant
        if (route.short) {
          routes.push(route)
        }
      }
      
    } catch (error) {
      console.warn('Failed to load adventure routes from CSV, using fallback:', error)
      // Fallback to placeholder data
      return [
        {
          id: 'meadow_path',
          short: { duration: 15, energyCost: 20, goldReward: 30, xpReward: 25 },
          medium: { duration: 30, energyCost: 35, goldReward: 60, xpReward: 50 }
        }
      ]
    }
    
    return routes
  }

  /**
   * Calculates risk level for an adventure route
   */
  private calculateAdventureRisk(route: any): number {
    // Simplified risk calculation based on energy cost and rewards
    const baseRisk = route.short.energyCost / 100 // Higher energy = higher risk
    const heroLevel = this.gameState.progression.heroLevel
    const levelAdjustment = Math.max(0.1, 1.0 - (heroLevel - 1) * 0.1)
    
    return baseRisk * levelAdjustment
  }

  /**
   * Gets craftable items based on available materials and forge heat
   */
  private getCraftableItems(): Array<{
    id: string
    materials: { [key: string]: number }
    craftingTime: number
    energyCost: number
    heatRequirement?: number
  }> {
    const craftableItems: Array<{
      id: string
      materials: { [key: string]: number }
      craftingTime: number
      energyCost: number
      heatRequirement?: number
    }> = []
    
    try {
      // Query forge/crafting data from CSV files
      const forgeItems = this.gameDataStore.itemsByGameFeature['Forge'] || []
      
      for (const item of forgeItems) {
        // Parse materials requirements
        const materials = this.parseMaterialRequirements(item.materials)
        const energyCost = this.parseEnergyCost(item.materials)
        const craftingTime = this.parseCraftingTime(item.description)
        const heatRequirement = this.parseHeatRequirement(item.description)
        
        // Only include items that can be crafted (have material requirements)
        if (Object.keys(materials).length > 0) {
          craftableItems.push({
            id: item.id,
            materials,
            craftingTime,
            energyCost,
            heatRequirement
          })
        }
      }
      
      // Also check tools that can be crafted
      const toolItems = this.gameDataStore.itemsByCategory['tool'] || []
      for (const item of toolItems) {
        // Check if this tool can be forged (has material requirements)
        if (item.materials && item.materials.includes('Iron')) {
          const materials = this.parseMaterialRequirements(item.materials)
          if (Object.keys(materials).length > 0) {
            craftableItems.push({
              id: item.id,
              materials,
              craftingTime: 15, // Default crafting time
              energyCost: 10,
              heatRequirement: 50
            })
          }
        }
      }
      
    } catch (error) {
      console.warn('Failed to load craftable items from CSV, using fallback:', error)
      // Fallback to placeholder data
      return [
        {
          id: 'iron_hoe',
          materials: { iron: 2, wood: 1 },
          craftingTime: 10,
          energyCost: 15,
          heatRequirement: 60
        }
      ]
    }
    
    return craftableItems
  }

  /**
   * Checks if required materials are available
   */
  private checkMaterialRequirements(materials: { [key: string]: number }): boolean {
    for (const [material, required] of Object.entries(materials)) {
      const available = this.gameState.resources.materials.get(material) || 0
      if (available < required) return false
    }
    return true
  }

  /**
   * Gets current forge heat level
   */
  private getForgeHeat(): number {
    // Placeholder - would track forge state
    return 50
  }

  /**
   * Calculates optimal mining duration based on energy and risk
   */
  private calculateOptimalMiningDuration(): number {
    const availableEnergy = this.gameState.resources.energy.current
    const safetyBuffer = 40 // Keep energy reserve
    const maxSessionEnergy = availableEnergy - safetyBuffer
    const energyPerMinute = 3 // Energy drain rate
    
    return Math.max(0, Math.floor(maxSessionEnergy / energyPerMinute))
  }

  /**
   * Calculates expected rewards from a mining session
   */
  private calculateMiningRewards(duration: number): { [key: string]: number } {
    // Simplified mining rewards calculation
    const baseRate = 2 // Materials per minute
    const totalMaterials = duration * baseRate
    
    return {
      stone: Math.floor(totalMaterials * 0.4),
      iron: Math.floor(totalMaterials * 0.3),
      silver: Math.floor(totalMaterials * 0.2),
      crystal: Math.floor(totalMaterials * 0.1)
    }
  }

  /**
   * Gets list of unrescued helpers available for rescue
   */
  private getUnrescuedHelpers(): string[] {
    try {
      // Query helper data from CSV files
      const helperItems = this.gameDataStore.itemsByCategory['helper'] || []
      const allHelperIds = helperItems.map(item => item.id)
      
      // Filter out already rescued helpers
      const rescuedIds = this.gameState.helpers.gnomes.map(g => g.id)
      const unrescued = allHelperIds.filter(id => !rescuedIds.includes(id))
      
      return unrescued
      
    } catch (error) {
      console.warn('Failed to load helper data from CSV, using fallback:', error)
      // Fallback to placeholder data
      const allHelpers = ['waterer_gnome', 'harvester_gnome', 'planter_gnome', 'cleaner_gnome']
      const rescuedIds = this.gameState.helpers.gnomes.map(g => g.id)
      return allHelpers.filter(id => !rescuedIds.includes(id))
    }
  }

  /**
   * Gets the rescue cost for a specific helper
   */
  private getHelperRescueCost(helperId: string): number {
    try {
      // Query helper cost from CSV data
      const helperItem = this.gameDataStore.getItemById(helperId)
      if (helperItem) {
        const goldCost = this.parseGoldCost(helperItem.materials)
        return goldCost > 0 ? goldCost : 100 // Default cost if no gold cost specified
      }
      
    } catch (error) {
      console.warn('Failed to get helper rescue cost from CSV:', error)
    }
    
    // Fallback to placeholder costs
    const costs: { [key: string]: number } = {
      'waterer_gnome': 100,
      'harvester_gnome': 150,
      'planter_gnome': 125,
      'cleaner_gnome': 200
    }
    return costs[helperId] || 100
  }

  /**
   * Determines the optimal helper role needed based on current game state
   */
  private getOptimalHelperRole(): string | null {
    // Analyze current needs
    const dryPlots = this.gameState.processes.crops.filter(c => c.waterLevel < 30).length
    const readyToHarvest = this.gameState.processes.crops.filter(c => c.readyToHarvest).length
    const emptyPlots = this.parameters.farm.initialState.plots - this.gameState.processes.crops.length

    // Return role with highest need
    if (dryPlots > 2) return 'waterer'
    if (readyToHarvest > 3) return 'harvester'
    if (emptyPlots > 1) return 'planter'
    
    return null
  }

  /**
   * Selects the best helper for a specific role based on efficiency
   */
  private selectBestHelperForRole(helpers: any[], role: string): any | null {
    if (helpers.length === 0) return null
    
    // Simple selection - first available helper
    // In real implementation, would consider efficiency ratings
    return helpers[0]
  }

  /**
   * Gets available housing upgrades for helpers
   */
  private getAvailableHousingUpgrades(): Array<{
    id: string
    cost: number
    capacityIncrease: number
    prerequisites?: string[]
  }> {
    // Placeholder - would query CSV data for housing buildings
    return [
      { id: 'gnome_hut', cost: 300, capacityIncrease: 2 },
      { id: 'gnome_house', cost: 600, capacityIncrease: 3, prerequisites: ['gnome_hut'] },
      { id: 'gnome_lodge', cost: 1000, capacityIncrease: 5, prerequisites: ['gnome_house'] }
    ]
  }

  /**
   * Parses gold cost from material string (e.g., "Gold x100" -> 100)
   */
  private parseGoldCost(materials: string): number {
    if (!materials) return 0
    
    const goldMatch = materials.match(/Gold x(\d+)/i)
    return goldMatch ? parseInt(goldMatch[1]) : 0
  }

  /**
   * Determines vendor ID from item type
   */
  private parseVendorId(itemType: string): string {
    if (!itemType) return 'general'
    
    const typeVendorMap: { [key: string]: string } = {
      'tool': 'blacksmith',
      'weapon': 'blacksmith',
      'armor': 'blacksmith',
      'infrastructure': 'general',
      'storage': 'general',
      'upgrade': 'general'
    }
    
    return typeVendorMap[itemType.toLowerCase()] || 'general'
  }

  /**
   * Parses energy cost from materials string
   */
  private parseEnergyCost(materials: string): number {
    if (!materials) return 20 // Default energy cost
    
    const energyMatch = materials.match(/Energy x(\d+)/i)
    return energyMatch ? parseInt(energyMatch[1]) : 20
  }

  /**
   * Parses reward values from effects string
   */
  private parseReward(effects: string, rewardType: 'gold' | 'xp'): number {
    if (!effects) return 0
    
    const rewardMap = {
      'gold': /Gold \+(\d+)/i,
      'xp': /XP \+(\d+)/i
    }
    
    const match = effects.match(rewardMap[rewardType])
    return match ? parseInt(match[1]) : 0
  }

  /**
   * Parses duration from description (looks for time indicators)
   */
  private parseDuration(description: string): number {
    if (!description) return 15 // Default 15 minutes
    
    const hourMatch = description.match(/(\d+)\s*hour/i)
    if (hourMatch) return parseInt(hourMatch[1]) * 60
    
    const minuteMatch = description.match(/(\d+)\s*minute/i)
    if (minuteMatch) return parseInt(minuteMatch[1])
    
    // Default durations based on keywords
    if (description.toLowerCase().includes('long')) return 60
    if (description.toLowerCase().includes('medium')) return 30
    return 15 // Default to short
  }

  /**
   * Parses material requirements from materials string (e.g., "Iron x2;Wood x1")
   */
  private parseMaterialRequirements(materials: string): { [key: string]: number } {
    const requirements: { [key: string]: number } = {}
    
    if (!materials) return requirements
    
    // Split by semicolon and parse each material requirement
    const materialParts = materials.split(';')
    for (const part of materialParts) {
      const match = part.trim().match(/(.+?)\s*x(\d+)/i)
      if (match) {
        const material = match[1].trim().toLowerCase()
        const amount = parseInt(match[2])
        requirements[material] = amount
      }
    }
    
    return requirements
  }

  /**
   * Parses crafting time from description
   */
  private parseCraftingTime(description: string): number {
    if (!description) return 15 // Default 15 minutes
    
    const timeMatch = description.match(/(\d+)\s*minutes?\s*to\s*craft/i)
    if (timeMatch) return parseInt(timeMatch[1])
    
    // Default based on complexity keywords
    if (description.toLowerCase().includes('complex') || description.toLowerCase().includes('advanced')) return 30
    if (description.toLowerCase().includes('simple') || description.toLowerCase().includes('basic')) return 5
    
    return 15 // Default crafting time
  }

  /**
   * Parses heat requirement from description
   */
  private parseHeatRequirement(description: string): number {
    if (!description) return 50 // Default heat requirement
    
    const heatMatch = description.match(/(\d+)%?\s*heat/i)
    if (heatMatch) return parseInt(heatMatch[1])
    
    // Default based on material complexity
    if (description.toLowerCase().includes('steel') || description.toLowerCase().includes('advanced')) return 80
    if (description.toLowerCase().includes('iron') || description.toLowerCase().includes('bronze')) return 60
    if (description.toLowerCase().includes('copper') || description.toLowerCase().includes('basic')) return 40
    
    return 50 // Default heat requirement
  }

  /**
   * Applies persona-based modifications to action scoring (Phase 6E Enhancement)
   */
  private applyPersonaModifications(action: GameAction, baseScore: number): number {
    let score = baseScore
    
    // Apply persona efficiency modifier
    score *= this.persona.efficiency
    
    // Risk tolerance affects risky actions
    if (action.type === 'adventure' || action.type === 'mine') {
      const riskFactor = 0.5 + (this.persona.riskTolerance * 0.5) // Scale 0.5-1.0
      score *= riskFactor
    }
    
    // Optimization affects upgrade/purchase decisions
    if (action.type === 'purchase' || action.type === 'craft') {
      const optimizationFactor = 0.7 + (this.persona.optimization * 0.3) // Scale 0.7-1.0
      score *= optimizationFactor
    }
    
    // Learning rate affects how quickly they adopt new strategies
    if (action.type === 'rescue' || action.type === 'train_helper') {
      const learningFactor = 0.8 + (this.persona.learningRate * 0.2) // Scale 0.8-1.0
      score *= learningFactor
    }
    
    // Persona-specific behavior modifications
    switch (this.persona.id) {
      case 'speedrunner':
        // Speedrunners heavily favor efficiency and optimization
        if (action.type === 'plant' || action.type === 'harvest') {
          score *= 1.2 // Favor farm efficiency
        }
        if (action.type === 'purchase' && action.goldCost > 100) {
          score *= 1.3 // Favor expensive upgrades
        }
        break
        
      case 'casual':
        // Casual players favor simple, safe actions
        if (action.type === 'water' || action.type === 'harvest') {
          score *= 1.1 // Favor basic farming
        }
        if (action.energyCost > 50) {
          score *= 0.7 // Avoid high-energy actions
        }
        break
        
      case 'weekend-warrior':
        // Weekend warriors batch activities efficiently
        const isWeekend = this.gameState.time.day % 7 >= 5
        if (isWeekend) {
          score *= 1.2 // More active on weekends
        } else {
          score *= 0.8 // Less active on weekdays
        }
        break
    }
    
    return score
  }

  /**
   * Checks if hero should act based on persona schedule (Phase 6E Enhancement)
   */
  private shouldHeroActNow(): boolean {
    const isWeekend = this.gameState.time.day % 7 >= 5
    const checkinsToday = isWeekend ? 
      this.persona.weekendCheckIns : 
      this.persona.weekdayCheckIns
    
    if (checkinsToday <= 0) return false
    
    // Spread check-ins across waking hours (6 AM to 10 PM = 16 hours)
    const wakingMinutes = 16 * 60
    const minutesPerCheckin = wakingMinutes / checkinsToday
    
    // Calculate current position in the day (6 AM = 0)
    const currentHour = this.gameState.time.hour
    const currentMinute = this.gameState.time.minute
    const minutesSinceWakeup = Math.max(0, (currentHour - 6) * 60 + currentMinute)
    
    // Check if it's time for next check-in
    const timeSinceLastCheckin = this.gameState.time.totalMinutes - this.lastCheckinTime
    
    if (timeSinceLastCheckin >= minutesPerCheckin) {
      // Add some persona-based variance
      const variance = this.persona.learningRate * 60 // More random = more variance
      const randomOffset = (Math.random() - 0.5) * variance
      
      if (minutesSinceWakeup >= this.lastCheckinTime + minutesPerCheckin + randomOffset) {
        this.lastCheckinTime = this.gameState.time.totalMinutes
        return true
      }
    }
    
    return false
  }

  /**
   * Gets storage limit for a specific material based on purchased upgrades
   */
  private getStorageLimit(material: string): number {
    const baseLimits: { [key: string]: number } = {
      // Default storage limits from game design
      'wood': 50,
      'stone': 50, 
      'copper': 50,
      'iron': 50,
      'silver': 50,
      'crystal': 50,
      'mythril': 50,
      'obsidian': 50,
      'pine_resin': 10,
      'shadow_bark': 10,
      'mountain_stone': 10,
      'cave_crystal': 10,
      'frozen_heart': 10,
      'molten_core': 10,
      'enchanted_wood': 5
    }
    
    let limit = baseLimits[material] || 50 // Default limit
    
    // Check for storage upgrades in progression
    const upgrades = this.gameState.progression.unlockedUpgrades
    
    if (upgrades.includes('material_crate_i')) {
      limit = 50
    }
    if (upgrades.includes('material_crate_ii')) {
      limit = 100
    }
    if (upgrades.includes('material_warehouse')) {
      limit = 250
    }
    if (upgrades.includes('material_depot')) {
      limit = 500
    }
    if (upgrades.includes('material_silo')) {
      limit = 1000
    }
    if (upgrades.includes('grand_warehouse')) {
      limit = 2500
    }
    if (upgrades.includes('infinite_vault')) {
      limit = 10000
    }
    
    return limit
  }

  /**
   * Adds material with storage limits and normalization
   */
  private addMaterial(materialName: string, amount: number): boolean {
    // Normalize material name using CSVDataParser
    const normalizedName = CSVDataParser.normalizeMaterialName(materialName)
    
    if (!normalizedName || amount <= 0) {
      return false
    }
    
    const current = this.gameState.resources.materials.get(normalizedName) || 0
    const storageLimit = this.getStorageLimit(normalizedName)
    
    const newAmount = Math.min(current + amount, storageLimit)
    const actualAdded = newAmount - current
    
    this.gameState.resources.materials.set(normalizedName, newAmount)
    
    // Return true if hit storage cap (warning condition)
    const hitStorageCap = actualAdded < amount
    
    if (hitStorageCap) {
      console.warn(`⚠️ Storage limit reached for ${normalizedName}: ${newAmount}/${storageLimit}`)
      
      // Add warning event
      this.addGameEvent({
        timestamp: this.gameState.time.totalMinutes,
        type: 'storage_warning',
        description: `Storage full for ${materialName} (${newAmount}/${storageLimit})`,
        importance: 'medium'
      })
    }
    
    return hitStorageCap
  }

  /**
   * Consumes materials for crafting/actions
   */
  private consumeMaterials(materials: Map<string, number>): boolean {
    // First check if we have enough of all materials
    for (const [materialName, amount] of materials.entries()) {
      const normalizedName = CSVDataParser.normalizeMaterialName(materialName)
      const available = this.gameState.resources.materials.get(normalizedName) || 0
      
      if (available < amount) {
        return false // Not enough materials
      }
    }
    
    // Consume the materials
    for (const [materialName, amount] of materials.entries()) {
      const normalizedName = CSVDataParser.normalizeMaterialName(materialName)
      const current = this.gameState.resources.materials.get(normalizedName) || 0
      this.gameState.resources.materials.set(normalizedName, current - amount)
    }
    
    return true
  }

  /**
   * Adds a game event to the current tick's events
   */
  private addGameEvent(event: GameEvent): void {
    // Store events for the current tick - in a real implementation this would
    // be added to the current tick's event list
    console.log(`📅 Game Event: ${event.description}`)
  }

  /**
   * Enhanced prerequisite checking using CSV data relationships (Phase 6E)
   */
  private checkActionPrerequisites(action: GameAction): boolean {
    // 1. Energy requirements
    if (action.energyCost && action.energyCost > this.gameState.resources.energy.current) {
      return false
    }
    
    // 2. Gold requirements
    if (action.goldCost && action.goldCost > this.gameState.resources.gold) {
      return false
    }
    
    // 3. Material requirements
    if (action.materialCosts) {
      for (const [material, amount] of Object.entries(action.materialCosts)) {
        const available = this.gameState.resources.materials.get(material.toLowerCase()) || 0
        if (available < amount) {
          return false
        }
      }
    }
    
    // 4. CSV-based prerequisite validation
    if (action.prerequisites && action.prerequisites.length > 0) {
      for (const prereqId of action.prerequisites) {
        if (!this.hasPrerequisite(prereqId)) {
          return false
        }
      }
    }
    
    // 5. Action-specific prerequisites
    switch (action.type) {
      case 'adventure':
        return this.checkAdventurePrerequisites(action)
      case 'craft':
        return this.checkCraftingPrerequisites(action)
      case 'catch_seeds':
        return this.checkTowerPrerequisites(action)
      case 'move':
        return this.checkScreenAccessPrerequisites(action.toScreen)
      case 'rescue':
        return this.checkHelperRescuePrerequisites(action)
      default:
        return true
    }
  }

  /**
   * Checks if a specific prerequisite is met using CSV data and game state
   */
  private hasPrerequisite(prereqId: string): boolean {
    // Check unlocked upgrades
    if (this.gameState.progression.unlockedUpgrades.includes(prereqId)) {
      return true
    }
    
    // Check completed cleanups
    if (this.gameState.progression.completedCleanups.has(prereqId)) {
      return true
    }
    
    // Check owned tools/weapons
    if (this.gameState.inventory.tools.has(prereqId) || 
        this.gameState.inventory.weapons.has(prereqId)) {
      return true
    }
    
    // Check progression milestones
    switch (prereqId) {
      case 'tutorial_complete':
        return this.gameState.progression.currentPhase !== 'Tutorial'
      case 'farm_stage_2':
        return this.gameState.progression.farmStage >= 2
      case 'farm_stage_3':
        return this.gameState.progression.farmStage >= 3
      case 'hero_level_5':
        return this.gameState.progression.heroLevel >= 5
      case 'hero_level_10':
        return this.gameState.progression.heroLevel >= 10
      default:
        // Try to find in CSV data
        try {
          const item = this.gameDataStore.getItemById(prereqId)
          return item ? this.gameState.progression.unlockedUpgrades.includes(item.id) : false
        } catch {
          return false
        }
    }
  }

  /**
   * Checks adventure-specific prerequisites
   */
  private checkAdventurePrerequisites(action: GameAction): boolean {
    // Check if adventure screen is unlocked
    if (!this.checkScreenAccessPrerequisites('adventure')) {
      return false
    }
    
    // Check route prerequisites from CSV data
    try {
      const adventureItems = this.gameDataStore.itemsByGameFeature['Adventure'] || []
      const routeItem = adventureItems.find(item => 
        item.id === action.routeId || item.id === `${action.routeId}_short`
      )
      
      if (routeItem && routeItem.prerequisites) {
        for (const prereq of routeItem.prerequisites) {
          if (!this.hasPrerequisite(prereq)) {
            return false
          }
        }
      }
    } catch (error) {
      console.warn('Failed to check adventure prerequisites:', error)
    }
    
    return true
  }

  /**
   * Checks crafting-specific prerequisites
   */
  private checkCraftingPrerequisites(action: GameAction): boolean {
    // Check forge access
    if (!this.checkScreenAccessPrerequisites('forge')) {
      return false
    }
    
    // Check forge heat requirements
    const heatRequired = action.heatRequirement || 50
    const currentHeat = this.getForgeHeat()
    if (currentHeat < heatRequired) {
      return false
    }
    
    // Check required tools for advanced crafting
    if (action.craftId && action.craftId.includes('advanced')) {
      if (!this.gameState.inventory.tools.has('advanced_hammer') && 
          !this.gameState.inventory.tools.has('master_hammer')) {
        return false
      }
    }
    
    return true
  }

  /**
   * Checks tower-specific prerequisites  
   */
  private checkTowerPrerequisites(action: GameAction): boolean {
    // Check tower access
    if (!this.checkScreenAccessPrerequisites('tower')) {
      return false
    }
    
    // Check auto-catcher requirements
    if (action.requiresAutoCatcher && this.getAutoCatcherLevel() === 0) {
      return false
    }
    
    // Check tower reach level for advanced seed types
    const reachLevel = this.getTowerReachLevel()
    if (action.seedTier && action.seedTier > reachLevel) {
      return false
    }
    
    return true
  }

  /**
   * Checks screen access prerequisites
   */
  private checkScreenAccessPrerequisites(screen: string): boolean {
    switch (screen) {
      case 'farm':
        return true // Always accessible
      case 'tower':
        return this.gameState.progression.currentPhase !== 'Tutorial' ||
               this.gameState.progression.unlockedUpgrades.includes('tower_access')
      case 'town':
        return this.gameState.progression.currentPhase !== 'Tutorial' ||
               this.gameState.progression.unlockedUpgrades.includes('town_access')
      case 'adventure':
        return this.gameState.progression.heroLevel >= 3 ||
               this.gameState.progression.unlockedUpgrades.includes('adventure_access')
      case 'forge':
        return this.gameState.progression.currentPhase === 'Mid' ||
               this.gameState.progression.currentPhase === 'Late' ||
               this.gameState.progression.currentPhase === 'End' ||
               this.gameState.progression.unlockedUpgrades.includes('forge_access')
      case 'mine':
        return this.gameState.progression.currentPhase === 'Late' ||
               this.gameState.progression.currentPhase === 'End' ||
               this.gameState.progression.unlockedUpgrades.includes('mine_access')
      default:
        return true
    }
  }

  /**
   * Checks helper rescue prerequisites
   */
  private checkHelperRescuePrerequisites(action: GameAction): boolean {
    // Check if we have housing capacity
    if (this.gameState.helpers.currentHousing >= this.gameState.helpers.housingCapacity) {
      return false
    }
    
    // Check helper-specific prerequisites from CSV
    try {
      const helperItem = this.gameDataStore.getItemById(action.helperId)
      if (helperItem && helperItem.prerequisites) {
        for (const prereq of helperItem.prerequisites) {
          if (!this.hasPrerequisite(prereq)) {
            return false
          }
        }
      }
    } catch (error) {
      console.warn('Failed to check helper prerequisites:', error)
    }
    
    return true
  }
}
