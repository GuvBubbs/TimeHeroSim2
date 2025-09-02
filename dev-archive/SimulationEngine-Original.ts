// SimulationEngine - Phase 6A Core + 8O Polish Implementation + Phase 9I Event System
// Main simulation engine with enhanced AI decision-making, bottleneck detection, and event-driven architecture

import { MapSerializer } from './MapSerializer'
import { CSVDataParser } from './CSVDataParser'
import { PrerequisiteSystem } from './systems/PrerequisiteSystem'
import { CropSystem } from './systems/CropSystem'
import { HelperSystem } from './systems/HelperSystem'
import { CraftingSystem } from './systems/CraftingSystem'
import { MiningSystem } from './systems/MiningSystem'
import { CombatSystem, type WeaponData, type ArmorData, type RouteConfig, type WeaponType, type ArmorEffect } from './systems/CombatSystem'
import { WaterSystem } from './systems/WaterSystem'
import { SeedSystem, MANUAL_CATCHING, AUTO_CATCHERS } from './systems/SeedSystem'
import { TowerSystem } from './systems/TowerSystem'
import { TownSystem } from './systems/TownSystem'
import { AdventureSystem } from './systems/AdventureSystem'
import { ForgeSystem } from './systems/ForgeSystem'
import { DecisionEngine } from './ai/DecisionEngine'
import { ActionExecutor } from './execution/ActionExecutor'
import { StateManager } from './state'
import { ProcessManager } from './processes'
import { validationService } from './validation'
import { eventBus, type IEventBus } from './events'
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
  GameScreen,
  BlueprintState
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
  private decisionEngine: DecisionEngine
  private actionExecutor: ActionExecutor
  private stateManager: StateManager
  private processManager: ProcessManager
  private eventBus: IEventBus
  private isRunning: boolean = false
  private tickCount: number = 0
  private lastProgressCheck?: {
    day: number
    plots: number
    level: number
    gold: number
    lastProgressDay: number
  }
  
  constructor(config: SimulationConfig, gameDataStore?: any) {
    this.config = config
    this.parameters = this.extractParametersFromConfig(config)
    
    if (!gameDataStore) {
      throw new Error('SimulationEngine requires a valid gameDataStore with CSV data')
    }
    
    this.gameDataStore = gameDataStore
    this.persona = this.extractPersonaFromConfig(config)
    this.gameState = this.initializeGameState()
    this.decisionEngine = new DecisionEngine()
    this.actionExecutor = new ActionExecutor()
    this.stateManager = new StateManager(this.gameState)
    this.processManager = new ProcessManager()
    this.actionExecutor.setStateManager(this.stateManager)
    
    // Phase 9H: Initialize centralized validation service
    validationService.initialize(gameDataStore)
    
    // Phase 9I: Initialize event bus
    this.eventBus = eventBus
    this.setupEventBusIntegration()
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
          plots: 3, // FIXED: Start with 3 plots per farm_stages.csv (Tutorial area 3>8)
          water: 100,
          energy: 0, // PHASE 8N: Start with 0 energy - gain through harvesting
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
      },
      // Adventure system parameters
      adventure: {
        combatMechanics: {
          riskTolerance: 0.6
        },
        energyManagement: {
          minimumEnergyReserve: 30
        },
        routing: {
          priorityOrder: ['meadow_path', 'pine_vale', 'dark_forest']
        }
      },
      // Decision system parameters
      decisions: {
        interrupts: {
          enabled: true
        },
        screenPriorities: {
          weights: new Map([
            ['farm', 1.0],
            ['tower', 0.7],
            ['town', 0.6],
            ['adventure', 0.8],
            ['forge', 0.5],
            ['mine', 0.4]
          ]),
          adjustmentFactors: {
            energyLow: new Map([
              ['farm', 1.2],
              ['adventure', 0.3]
            ]),
            goldHigh: new Map([
              ['town', 1.3],
              ['forge', 1.1]
            ])
          }
        },
        actionEvaluation: {
          immediateValueWeight: 0.7,
          futureValueWeight: 0.3,
          riskWeight: 0.4
        },
        globalBehavior: {
          randomness: 0.1
        }
      },
      // Tower system parameters
      tower: {
        decisionLogic: {
          seedTargetMultiplier: 2,
          catchDuration: 3,
          upgradeThreshold: 0.5
        },
        catchMechanics: {
          manualCatchRate: 60
        },
        autoCatcher: {
          enabled: true
        },
        unlockProgression: {
          reachLevelCosts: [100, 250, 500, 1000],
          reachLevelEnergy: [5, 50, 200, 1000] // Match CSV: tower_reach_1=5, tower_reach_2=50, etc.
        }
      },
      // Town system parameters
      town: {
        purchasing: {
          vendorPriorities: ['blacksmith', 'general', 'trainer']
        },
        blueprintStrategy: {
          toolPriorities: ['hoe', 'watering_can', 'axe', 'pickaxe']
        },
        skillTraining: {
          enabled: true
        }
      },
      // Forge system parameters
      forge: {
        heatManagement: {
          maxConcurrentItems: 3
        },
        craftingPriorities: {
          toolOrder: ['hoe_i', 'watering_can_ii', 'axe_i', 'pickaxe_i']
        }
      },
      // Mining system parameters
      mine: {
        depthStrategy: {
          targetDepth: 5
        },
        energyManagement: {
          minimumEnergyReserve: 40,
          drainRate: 3
        }
      },
      // Helper system parameters
      helpers: {
        roleAssignment: {
          priorities: ['waterer', 'harvester', 'planter', 'cleaner']
        },
        training: {
          enabled: true,
          costPerSession: 50
        }
      }
    } as any
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
    
    // Phase 9A: Start with 2 seeds (1 carrot, 1 radish)
    // With 3 plots, this leaves 1 empty, encouraging seed collection
    seeds.set('carrot', 1)
    seeds.set('radish', 1)
    
    console.log('🌰 Phase 9A: Starting with 2 seeds (1 carrot, 1 radish) for 3 plots')
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
    
    // Initialize all materials to 0 - players must earn them through gameplay
    materials.set('wood', 0)
    materials.set('stone', 5)
    materials.set('copper', 0)
    materials.set('iron', 0)
    materials.set('silver', 0)
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
          current: 3, // Start with 3 energy - plant, harvest for 2 more to reach 5 for tower_reach_1
          max: 50, // Energy max capacity is 50
          regenerationRate: 0 // No energy regen - energy only from crop harvests
        },
        gold: 75, // Start with 75 gold to buy sword 1 & Tower Reach 1 blueprints
        water: {
          current: 0, // Start with 0 water - pump to fill tank
          max: 20, // Start with 20 water capacity
          autoGenRate: 10 * (farmParams.waterSystem?.pumpEfficiency || 0)
        },
        seeds: this.initializeSeeds(),
        materials: this.initializeMaterials()
      },
      progression: {
        heroLevel: 1,
        experience: 0,
        farmStage: 1,
        farmPlots: farmParams.initialState.plots || 3, // FIXED: Default to 3 plots
        availablePlots: farmParams.initialState.plots || 3, // FIXED: Default to 3 plots
        currentPhase: 'Early',
        completedAdventures: [],
        completedCleanups: new Set<string>(),
        unlockedUpgrades: [],
        unlockedAreas: ['farm'], // Only farm initially - other areas unlocked when structures built
        builtStructures: new Set(['farm']), // Farm always built, other structures need blueprints + building
        victoryConditionsMet: false
      },
      inventory: {
        tools: new Map(),
        weapons: new Map(), // Start empty - must purchase blueprints and craft weapons
        armor: new Map(),
        blueprints: new Map(), // Start empty - must purchase blueprints from town vendors
        capacity: 100,
        currentWeight: 0
      },
      processes: {
        crops: [], // FIXED: Start with completely empty plots - no pre-planted crops
        adventure: null,
        crafting: [],
        mining: null,
        seedCatching: null // Start with no active seed catching - must navigate to tower and start manually
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
        energyReserve: 5 // Lower threshold for early game - farmParams.automation.autoPlant.energyThreshold
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
    console.log('⏰ SimulationEngine: tick() called, tickCount:', this.tickCount, 'totalMinutes:', this.gameState.time.totalMinutes, 'isRunning:', this.isRunning)
    
    // Debug materials to see if they're changing
    const currentWood = this.gameState.resources.materials.get('wood') || 0
    const currentStone = this.gameState.resources.materials.get('stone') || 0
    console.log(`🪨 MATERIALS DEBUG: wood=${currentWood}, stone=${currentStone}`)
    
    const startTime = this.gameState.time.totalMinutes
    const deltaTime = this.calculateDeltaTime()
    
    try {
      // Update time
      this.updateTime(deltaTime)
      
      // Process all ongoing activities using unified ProcessManager
      const processResult = this.processManager.tick(deltaTime, this.gameState, this.gameDataStore)
      
      // Debug logging for ProcessManager (Phase 9G)
      if (processResult.completed.length > 0 || processResult.failed.length > 0 || processResult.events.length > 0) {
        console.log('🔄 ProcessManager: Activity detected', {
          completed: processResult.completed.length,
          failed: processResult.failed.length, 
          events: processResult.events.length,
          activeProcesses: this.processManager.getActiveProcesses().length
        })
      }
      
      // Add process events to ongoing events
      const ongoingEvents = processResult.events.map(processEvent => ({
        timestamp: processEvent.timestamp,
        type: processEvent.type,
        description: processEvent.description,
        importance: processEvent.importance
      }))
      
      // Process other systems that aren't yet in ProcessManager
      try {
        // Process helper automation
        HelperSystem.processHelpers(this.gameState, deltaTime, this.gameDataStore)
      } catch (error) {
        console.error('Error in HelperSystem.processHelpers:', error)
      }
      
      try {
        // Phase 8N: Process auto-pump water generation
        WaterSystem.processAutoPumpGeneration(this.gameState, deltaTime)
      } catch (error) {
        console.error('Error in WaterSystem.processAutoPumpGeneration:', error)
      }
      
      try {
        // Phase 8N: Process auto-catcher seed collection
        const towerReach = this.getCurrentTowerReach()
        SeedSystem.processAutoCatcher(this.gameState, deltaTime, towerReach)
      } catch (error) {
        console.error('Error in SeedSystem.processAutoCatcher:', error)
      }
      
      // Process adventures if active
      this.processActiveAdventures(deltaTime)
      
      // FIXED: Disabled resource regeneration - energy should only come from crop harvests
      // this.processResourceRegeneration(deltaTime)
      
      // Make AI decisions using DecisionEngine
      const decisionResult = this.decisionEngine.getNextActions(this.gameState, this.parameters, this.gameDataStore)
      const decisions = decisionResult.actions
      
      // Execute actions using ActionExecutor
      const executedActions: GameAction[] = []
      const actionEvents: GameEvent[] = []
      
      for (const action of decisions) {
        try {
          const result = this.actionExecutor.execute(action, this.gameState, this.parameters, this.gameDataStore)
          if (result.success) {
            executedActions.push(action)
            actionEvents.push(...result.events)
          } else if (result.error) {
            console.warn(`Action ${action.type} failed: ${result.error}`)
          }
        } catch (error) {
          console.error(`Error executing action ${action.type}:`, error)
        }
      }
      
      // FIXED: Update DecisionEngine lastCheckinTime after successful actions
      if (executedActions.length > 0) {
        this.decisionEngine.updateLastCheckin(this.gameState)
        console.log(`🎯 DECISION ENGINE: Updated lastCheckinTime to ${this.gameState.time.totalMinutes} after ${executedActions.length} actions`)
      }
      
      // Update automation systems
      this.updateAutomation()
      
      // Update phase progression
      this.updatePhaseProgression()
      
      // Check victory/completion conditions
      const isComplete = this.checkVictoryConditions()
      const isStuck = this.checkBottleneckConditions()
      
      this.tickCount++
      
      // CRITICAL FIX: Debug logging every 10 ticks to track simulation progress
      if (this.tickCount % 10 === 0) {
        console.log(`🎮 Tick ${this.tickCount}:`, {
          energy: Math.round(this.gameState.resources.energy.current),
          water: Math.round(this.gameState.resources.water.current),
          plots: this.gameState.progression.farmPlots,
          shouldAct: this.shouldHeroActNow(),
          possibleActions: decisions.length,
          executedActions: executedActions.length,
          minutesSinceCheckin: this.gameState.time.totalMinutes - this.lastCheckinTime,
          currentHour: this.gameState.time.hour
        })
      }
      
      // Log action executions for debugging
      if (executedActions.length > 0) {
        console.log(`⚡ Tick ${this.tickCount}: Executed ${executedActions.length} actions:`, executedActions.map(a => `${a.type}(${a.target})`))
      }
      
      return {
        gameState: this.gameState,
        executedActions,
        events: [...ongoingEvents, ...actionEvents],
        deltaTime,
        isComplete,
        isStuck
      }
    } catch (error) {
      console.error('Critical error in simulation tick:', error)
      // Return safe fallback state
      return {
        gameState: this.gameState,
        executedActions: [],
        events: [{
          timestamp: this.gameState.time.totalMinutes,
          type: 'error',
          description: `Simulation error: ${error}`,
          importance: 'high'
        }],
        deltaTime,
        isComplete: false,
        isStuck: true
      }
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
   * Processes active adventures (if any)
   */
  private processActiveAdventures(deltaTime: number): void {
    // Adventures are processed immediately in executeAction for now
    // Future enhancement: support for longer adventures that take time
    if (this.gameState.processes.adventure) {
      // Adventure in progress - could add time-based processing here
      // For now, adventures complete immediately when executed
    }
  }

  /**
   * Processes resource regeneration (energy and water)
   */
  private processResourceRegeneration(deltaTime: number): void {
    // Energy is only gained from crop harvests, not passive regeneration

    // Water auto-pump generation if unlocked
    if (this.gameState.resources.water.autoGenRate > 0) {
      const waterRegen = this.gameState.resources.water.autoGenRate * deltaTime
      this.gameState.resources.water.current = Math.min(
        this.gameState.resources.water.max,
        this.gameState.resources.water.current + waterRegen
      )
    }
  }

  /**
   * Processes ongoing activities (crops, crafting, adventures, seed catching)
   */
  // PHASE 9G: REMOVED - processOngoingActivities() method
  // This method (~100 lines) has been moved to ProcessManager
  // ProcessManager now handles crop growth, seed catching, crafting, mining, and adventure processes
  // The unified system provides better lifecycle management and fixes the seed catching completion bug
  
  // NOTE: Decision-making methods moved to DecisionEngine - these are no longer used

  /**
   * Evaluates farm-specific actions
   */
  // NOTE: Farm evaluation methods moved to DecisionEngine - no longer needed here

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
    
    // Evaluate plot expansion cleanups first (higher priority) - IMPROVED for early game
    for (const cleanup of plotExpansionCleanups) {
      if (this.shouldConsiderCleanup(cleanup)) {
        const energyCost = parseInt(cleanup.energy_cost) || 0
        const plotsAdded = parseInt(cleanup.plots_added) || 0
        
        // CRITICAL FIX: Prioritize plot expansion aggressively in early game
        let priority = 1.0
        if (this.gameState.progression.farmPlots < 10) {
          priority = 2.0 // Double priority when few plots
        } else if (this.gameState.progression.farmPlots < 20) {
          priority = 1.5 // Higher priority in early-mid game
        }
        
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
            materials: cleanup.materials_gain || '',
            priority: priority // Add priority for scoring
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
   * Evaluates build actions for purchased blueprints
   */
  private evaluateBuildActions(): GameAction[] {
    const actions: GameAction[] = []
    
    // Check all purchased blueprints that haven't been built yet
    for (const [blueprintId, blueprint] of this.gameState.inventory.blueprints) {
      if (blueprint.purchased && !blueprint.isBuilt) {
        const buildAction = this.evaluateBuildAction(blueprintId, blueprint)
        if (buildAction) {
          actions.push(buildAction)
        }
      }
    }
    
    return actions
  }

  /**
   * PHASE 9A: Generate town navigation from farm when blueprint purchases needed
   */
  private evaluateTownNavigationFromFarm(): GameAction[] {
    const actions: GameAction[] = []
    
    // Only generate when currently at farm
    if (this.gameState.location.currentScreen !== 'farm') {
      return actions
    }
    
    // Check if hero needs tower access and can afford blueprint
    if (this.needsTowerAccess()) {
      const blueprintNeeded = !this.gameState.inventory.blueprints.has('blueprint_tower_reach_1')
      const canAffordBlueprint = this.gameState.resources.gold >= 25
      
      if (blueprintNeeded && canAffordBlueprint) {
        console.log(`🏃‍♂️ GENERATING TOWN NAVIGATION: Blueprint needed, ${this.gameState.resources.gold} gold available`)
        
        actions.push({
          id: `move_to_town_for_blueprint_${Date.now()}`,
          type: 'move',
          screen: 'farm', // Current screen
          target: 'town', // Target screen  
          duration: 1,
          energyCost: 0,
          goldCost: 0,
          prerequisites: [],
          expectedRewards: {},
          description: 'Navigate to town for blueprint purchase',
          toScreen: 'town' // Explicit target for move actions
        })
      }
    }
    
    // Future: Add other urgent town navigation needs (weapon blueprints, etc.)
    
    return actions
  }

  /**
   * Evaluates building a specific blueprint
   */
  private evaluateBuildAction(blueprintId: string, blueprint: BlueprintState): GameAction | null {
    const buildCost = blueprint.buildCost
    
    // Check energy requirements
    if (buildCost.energy && this.gameState.resources.energy.current < buildCost.energy) {
      console.log(`❌ BUILD BLOCKED: Insufficient energy for ${blueprintId} (${this.gameState.resources.energy.current} < ${buildCost.energy})`)
      return null
    }
    
    // Check material requirements
    if (buildCost.materials) {
      for (const [materialName, amount] of buildCost.materials) {
        const available = this.gameState.resources.materials.get(materialName) || 0
        if (available < amount) {
          console.log(`❌ BUILD BLOCKED: Insufficient ${materialName} for ${blueprintId} (${available} < ${amount})`)
          return null
        }
      }
    }
    
    // Generate build action
    const structureId = blueprintId.replace('blueprint_', '')
    
    console.log(`🏗️ GENERATING BUILD ACTION: ${structureId} with ULTRA-HIGH priority (900)`)
    
    return {
      id: `build_${structureId}_${Date.now()}`,
      type: 'build',
      screen: 'farm',
      target: structureId,
      duration: buildCost.time || 5, // Default 5 minutes if no time specified
      energyCost: buildCost.energy || 0,
      goldCost: 0, // No gold cost for building (already paid for blueprint)
      prerequisites: [blueprintId], // Must own the blueprint
      expectedRewards: {
        items: [structureId] // Building the structure
      },
      description: `Build ${structureId} from purchased blueprint`,
      score: 900 // ULTRA HIGH PRIORITY - Critical for progression, must execute before other actions
    }
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
   * Evaluates tower-specific actions (Phase 8N: Enhanced with SeedSystem)
   */
  private evaluateTowerActions(): GameAction[] {
    const actions: GameAction[] = []
    const towerParams = this.parameters.tower
    
    if (!towerParams) return actions
    
    // Get current tower metrics using SeedSystem
    const towerReach = this.getCurrentTowerReach()
    const windLevel = SeedSystem.getCurrentWindLevel(towerReach)
    const seedMetrics = SeedSystem.getSeedMetrics(this.gameState)
    
    // Manual seed catching (Phase 8N: Enhanced with wind mechanics, aggressive in early game)
    const farmPlots = this.gameState.progression.farmPlots || 3
    const seedTargetBase = Math.max(farmPlots * 2, 6)  // At least 6 seeds, 2x farm plots
    const needsSeeds = seedMetrics.totalSeeds < seedTargetBase
    
    // PHASE 8N FIX: Navigate back to farm when seeds are sufficient
    if (!needsSeeds && seedMetrics.totalSeeds >= seedTargetBase) {
      console.log(`🚪 TOWER EXIT: Seeds sufficient (${seedMetrics.totalSeeds}/${seedTargetBase}) - returning to farm`)
      actions.push({
        id: `tower_to_farm_${Date.now()}`,
        type: 'move',
        screen: 'tower',
        target: 'farm',
        duration: 1,
        energyCost: 0,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: {}
      })
      return actions // Return immediately to prioritize farm return
    }
    
    if (needsSeeds && this.gameState.resources.energy.current > 30) {
      const catchDuration = towerParams.decisionLogic?.catchDuration || 3
      
      // Use SeedSystem to calculate expected catch rate
      const catchRate = MANUAL_CATCHING.calculateCatchRate(
        windLevel.level,
        this.getBestNet(),
        this.getPersonaCatchingSkill()
      )
      
      const expectedSeeds = Math.floor(catchRate.seedsPerMinute * catchDuration)
      
      actions.push({
        id: `catch_seeds_${Date.now()}`,
        type: 'catch_seeds',
        screen: 'tower',
        target: 'manual_catch',
        duration: catchDuration,
        energyCost: 0, // FIXED: Seed catching costs no energy
        goldCost: 0,
        prerequisites: [],
        expectedRewards: {
          items: ['seeds_mixed']
        }
      })
    }
    
    // Auto-catcher upgrades (Phase 8N: Enhanced with SeedSystem rates)
    if (this.gameState.resources.gold >= 1000) {
      const currentAutoCatcher = this.getAutoCatcherTier()
      const nextTier = this.getNextAutoCatcherTier(currentAutoCatcher)
      
      if (nextTier) {
        const tierData = AUTO_CATCHERS[nextTier]
        
        actions.push({
          id: `upgrade_autocatcher_${nextTier}_${Date.now()}`,
          type: 'purchase',
          screen: 'tower',
          target: nextTier,
          duration: 1,
          energyCost: 0,
          goldCost: tierData.cost,
          prerequisites: [],
          expectedRewards: {}
        })
      }
    }
    
    // Tower reach upgrades
    if (towerParams.unlockProgression?.reachLevelCosts && 
        this.gameState.resources.energy.current > 50) {
      const currentReach = this.getCurrentTowerReach()
      const nextCost = towerParams.unlockProgression.reachLevelCosts[currentReach]
      
      if (nextCost && this.gameState.resources.gold >= nextCost) {
        actions.push({
          id: `tower_reach_upgrade_${Date.now()}`,
          type: 'purchase',
          screen: 'tower',
          target: `tower_reach_${currentReach + 1}`,
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
    
    // CRITICAL: Blueprint purchase flow - check if hero needs tower access
    const blueprintPurchases = this.evaluateBlueprintPurchases()
    actions.push(...blueprintPurchases)
    
    // PHASE 9A: Navigate back to farm after blueprint purchases to build structures
    const returnToFarmActions = this.evaluateReturnToFarmForBuilding()
    actions.push(...returnToFarmActions)
    
    // Phase 8L: Material trading for gold generation
    const materialSales = this.evaluateMaterialSales()
    actions.push(...materialSales)
    
    // Phase 8L: Emergency wood bundles from Agronomist
    const emergencyWoodActions = this.evaluateEmergencyWood()
    actions.push(...emergencyWoodActions)
    
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
   * Evaluates blueprint purchases needed for progression
   */
  private evaluateBlueprintPurchases(): GameAction[] {
    const actions: GameAction[] = []
    
    // Check if hero needs tower access for seed collection
    if (this.needsTowerAccess()) {
      const towerBlueprint = this.evaluateTowerBlueprintPurchase()
      if (towerBlueprint) {
        actions.push(towerBlueprint)
      }
    }
    
    // Future: Add other blueprint purchases (pumps, storage, gnome housing, etc.)
    
    return actions
  }

  /**
   * PHASE 9A: Navigate back to farm after blueprint purchases to build structures
   */
  private evaluateReturnToFarmForBuilding(): GameAction[] {
    const actions: GameAction[] = []
    
    // Only generate when currently in town
    if (this.gameState.location.currentScreen !== 'town') {
      return actions
    }
    
    // Check if hero has purchased blueprints that need to be built
    let hasUnbuiltBlueprints = false
    for (const [blueprintId, blueprint] of this.gameState.inventory.blueprints) {
      if (blueprint.purchased && !blueprint.isBuilt) {
        hasUnbuiltBlueprints = true
        console.log(`🏠 UNBUILT BLUEPRINT FOUND: ${blueprintId}`)
        break
      }
    }
    
    if (hasUnbuiltBlueprints) {
      console.log(`🏠 GENERATING FARM NAVIGATION: Need to return to farm to build purchased blueprints`)
      
      actions.push({
        id: `move_farm_for_building_${Date.now()}`,
        type: 'move',
        screen: 'town',
        target: 'farm',
        toScreen: 'farm',
        duration: 1,
        energyCost: 0,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: {},
        description: 'Return to farm to build purchased blueprints',
        score: 600 // Very high priority - hero needs to get back to build
      })
    }
    
    return actions
  }

  /**
   * Determines if hero needs tower access for seed collection
   */
  private needsTowerAccess(): boolean {
    // Already have tower built
    if (this.gameState.progression.builtStructures.has('tower_reach_1')) {
      return false
    }
    
    // Already purchased tower blueprint but haven't built it yet
    if (this.gameState.inventory.blueprints.has('blueprint_tower_reach_1')) {
      return false
    }
    
    // Check if seeds are low using existing SeedSystem logic
    const seedMetrics = SeedSystem.getSeedMetrics(this.gameState)
    const farmPlots = this.gameState.progression.farmPlots || 3
    const seedBuffer = Math.max(farmPlots * 2, 6) // Want 2x seeds per plot, minimum 6 seeds
    const lowThreshold = Math.floor(seedBuffer * 0.7) // Low when < 70% of buffer
    
    return seedMetrics.totalSeeds < lowThreshold
  }

  /**
   * Evaluates purchasing blueprint_tower_reach_1 if conditions are met - generates navigation OR purchase
   */
  private evaluateTowerBlueprintPurchase(): GameAction | null {
    const TOWER_BLUEPRINT_COST = 25
    
    // Check if can afford it
    if (this.gameState.resources.gold < TOWER_BLUEPRINT_COST) {
      return null
    }
    
    // CRITICAL FIX: Check if hero is in town
    const currentScreen = this.gameState.location.currentScreen
    
    if (currentScreen !== 'town') {
      // Hero needs to navigate to town first - HIGH PRIORITY
      console.log(`🏃‍♂️ NAVIGATION NEEDED: Generate town navigation for blueprint purchase (${TOWER_BLUEPRINT_COST} gold available)`)
      return {
        id: `navigate_town_for_blueprint_${Date.now()}`,
        type: 'move',
        screen: currentScreen, // Current screen  
        target: 'town',
        duration: 1,
        energyCost: 0,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: {}
      }
    } else {
      // Hero is in town - generate purchase action
      console.log(`💰 PURCHASE READY: Generate blueprint purchase in town (${TOWER_BLUEPRINT_COST} gold available)`)
      return {
        id: `purchase_blueprint_tower_reach_1_${Date.now()}`,
        type: 'purchase',
        screen: 'town',
        target: 'blueprint_tower_reach_1',
        duration: 1,
        energyCost: 0,
        goldCost: TOWER_BLUEPRINT_COST,
        prerequisites: [], // No prerequisites for basic tower blueprint
        expectedRewards: { 
          items: ['blueprint_tower_reach_1']
        }
      }
    }
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
      
      // Handle both Map and plain object formats (after serialization)
      const weightEntries = weights instanceof Map ? weights.entries() : Object.entries(weights)
      
      for (const [screen, weight] of weightEntries) {
        if (screen !== current && weight > 0) {
          const reason = this.getNavigationReason(screen as GameScreen)
          if (reason.score > 3) { // Navigate if there's a reasonable reason
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
        // Navigate to tower if we need seeds or have energy to catch
        const totalSeeds = Array.from(this.gameState.resources.seeds.values()).reduce((a, b) => a + b, 0)
        const seedScore = totalSeeds < 20 ? 8 : 3
        const energyScore = this.gameState.resources.energy.current > 50 ? 2 : 0
        return { reason: 'Need seeds', score: Math.max(seedScore, energyScore) }
        
      case 'town':
        // Navigate to town if we have gold to spend or need upgrades
        const gold = this.gameState.resources.gold
        let townScore = gold >= 100 ? 7 : gold >= 50 ? 5 : 2  // FIXED: >= instead of >
        
        // PHASE 9A: High priority for town when blueprint purchases are needed
        if (this.needsTowerAccess()) {
          const blueprintNeeded = !this.gameState.inventory.blueprints.has('blueprint_tower_reach_1')
          if (blueprintNeeded && gold >= 25) {
            townScore = 500  // Very high priority for critical blueprint purchase
            return { reason: 'CRITICAL: Buy tower blueprint', score: townScore }
          }
        }
        
        return { reason: 'Purchase upgrades', score: townScore }
        
      case 'adventure':
        // Navigate for adventure if have good energy and equipment
        const energy = this.gameState.resources.energy.current
        const heroLevel = this.gameState.progression.heroLevel
        const hasWeapons = this.gameState.inventory.weapons.size > 0
        let adventureScore = 2 // Base exploration score
        
        // Phase 8L: More accessible early game adventures
        if (energy >= 80 && hasWeapons) adventureScore += 4  // FIXED: >= instead of >
        if (heroLevel >= 3) adventureScore += 2
        if (heroLevel >= 1 && energy >= 60) adventureScore += 2  // ADDED: Early level boost
        if (energy >= 60) adventureScore += 1
        
        return { reason: 'Ready for adventure', score: adventureScore }
        
      case 'forge':
        // Navigate to forge if we have materials to craft
        const materials = Array.from(this.gameState.resources.materials.values()).reduce((a, b) => a + b, 0)
        const materialsScore = materials > 10 ? 6 : materials > 5 ? 4 : 1
        const goldForTools = gold > 50 ? 2 : 0
        return { reason: 'Craft tools/weapons', score: Math.max(materialsScore, goldForTools) }
        
      case 'mine':
        // Navigate to mine if have good energy and need materials  
        const mineScore = energy > 70 && materials < 20 ? 7 : 
                          energy > 50 ? 4 : 2
        return { reason: 'Gather materials', score: mineScore }
        
      default:
        return { reason: 'General exploration', score: 3 }
    }
  }

  /**
   * Selects the best crop to plant based on current strategy (Phase 8N: Enhanced with SeedSystem)
   */
  private selectCropToPlant(): string | null {
    // Use SeedSystem for intelligent seed selection
    const seedSelection = SeedSystem.selectSeedForPlanting(this.gameState, this.gameState.resources.seeds)
    
    if (seedSelection.selectedSeed) {
      console.log(`🌱 Selected ${seedSelection.selectedSeed} using ${seedSelection.strategy} strategy`)
      return seedSelection.selectedSeed
    }
    
    return null
  }

  /**
   * Evaluate emergency actions that need immediate attention (PHASE 8N)
   */
  private evaluateEmergencyActions(): GameAction[] {
    const actions: GameAction[] = []

    // PROACTIVE SEED COLLECTION WITH BETTER THRESHOLDS (Phase 8N)
    const seedMetrics = SeedSystem.getSeedMetrics(this.gameState)
    const farmPlots = this.gameState.progression.farmPlots || 3
    
    // IMPROVED: More aggressive seed collection thresholds
    const seedBuffer = Math.max(farmPlots * 2, 6) // Want 2x seeds per plot, minimum 6 seeds
    const criticalThreshold = farmPlots // Critical when seeds = plots  
    const lowThreshold = Math.floor(seedBuffer * 0.7) // Low when < 70% of buffer
    
    const isCritical = seedMetrics.totalSeeds < criticalThreshold
    const isLow = seedMetrics.totalSeeds < lowThreshold
    const needsSeeds = isCritical || isLow
    
    console.log(`🔍 SEED CHECK: ${seedMetrics.totalSeeds}/${seedBuffer} seeds (${farmPlots} plots), critical: ${isCritical}, low: ${isLow}, energy: ${this.gameState.resources.energy.current}`)

    if (needsSeeds && this.gameState.resources.energy.current >= 0) {
      const urgency = isCritical ? 'CRITICAL' : 'LOW'
      console.log(`🚨 SEED ${urgency}: ${seedMetrics.totalSeeds} seeds < ${isCritical ? criticalThreshold : lowThreshold} threshold - forcing tower actions`)

      // Force navigation to tower if not already there
      if (this.gameState.location.currentScreen !== 'tower') {
        actions.push({
          id: `emergency_tower_nav_${Date.now()}`,
          type: 'move',
          screen: this.gameState.location.currentScreen,
          target: 'tower',
          duration: 1,
          energyCost: 0,
          goldCost: 0,
          prerequisites: [],
          expectedRewards: {}
        })
      } else {
        // If already at tower, force seed catching action
        const towerReach = this.getCurrentTowerReach()
        const windLevel = SeedSystem.getCurrentWindLevel(towerReach)
        const catchRate = MANUAL_CATCHING.calculateCatchRate(
          windLevel.level,
          this.getBestNet(),
          this.getPersonaCatchingSkill()
        )
        const catchDuration = 5 // Extended duration for emergency catching
        const expectedSeeds = Math.floor(catchRate.seedsPerMinute * catchDuration)

        actions.push({
          id: `emergency_catch_seeds_${Date.now()}`,
          type: 'catch_seeds',
          screen: 'tower',
          target: 'manual_catch',
          duration: catchDuration,
          energyCost: 0, // FIXED: Seed catching costs no energy (same as normal catch)
          goldCost: 0,
          prerequisites: [],
          expectedRewards: {
            items: ['seeds_mixed']
          }
        })
      }
    }

    // Emergency energy management (harvest ready crops when energy very low)
    if (this.gameState.resources.energy.current <= 10) {
      const readyToHarvest = this.gameState.processes.crops.filter(crop => crop.readyToHarvest)
      if (readyToHarvest.length > 0) {
        actions.push({
          id: `emergency_harvest_${Date.now()}`,
          type: 'harvest',
          screen: 'farm',
          target: readyToHarvest[0].plotId,
          duration: 5,
          energyCost: 0,
          goldCost: 0,
          prerequisites: [],
          expectedRewards: {}
        })
      }
    }

    return actions
  }







  /**
   * Enhanced action scoring using parameter-based evaluation
   */
  private scoreAction(action: GameAction): number {
    // PHASE 9A: Ultra-high priority for blueprint purchase navigation
    if (action.type === 'move' && action.target === 'town' && action.description?.includes('blueprint purchase')) {
      const urgencyScore = 800 // Ultra-high priority
      console.log(`🎯 BLUEPRINT NAVIGATION SCORE: ${urgencyScore} for ${action.description}`)
      return urgencyScore
    }

    // PHASE 9A: Ultra-high priority for build actions (critical progression)
    if (action.type === 'build') {
      const buildScore = action.score || 900 // Use pre-set score or default to 900
      console.log(`🏗️ BUILD ACTION SCORE: ${buildScore} for build ${action.target}`)
      return buildScore
    }

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
        
      case 'cleanup':
        // CRITICAL FIX: Score cleanup actions based on priority and plot value
        score = 70 // High base score for cleanup
        
        const plotsAdded = action.expectedRewards?.plots || 0
        const priority = (action.expectedRewards as any)?.priority || 1.0
        
        // Extra points for plot expansion (critical for progression)
        if (plotsAdded > 0) {
          score += plotsAdded * 20 // 20 points per plot
        }
        
        // Apply priority multiplier from evaluateCleanupActions
        score *= priority
        
        // Boost score in early game when plots are scarce
        if (this.gameState.progression.farmPlots < 10) {
          score *= 1.5
        }
        break
        
      case 'pump':
        // High priority when water is low
        score = 50
        const waterPercent = this.gameState.resources.water.current / this.gameState.resources.water.max
        if (waterPercent < 0.3) {
          score = 90 // Very high priority when water critical
        } else if (waterPercent < 0.5) {
          score = 70 // High priority when water low
        }
        break
        
      case 'move':
        // Navigation scoring based on screen priorities
        const targetScreen = action.target as string
        
        // PHASE 9A: ULTRA HIGH PRIORITY for town navigation when blueprint purchases needed
        if (targetScreen === 'town' && this.needsTowerAccess()) {
          const blueprintNeeded = !this.gameState.inventory.blueprints.has('blueprint_tower_reach_1')
          const canAfford = this.gameState.resources.gold >= 25
          
          if (blueprintNeeded && canAfford) {
            score = 800 // ULTRA HIGH priority for critical blueprint purchase navigation
            console.log(`🏃‍♂️ ULTRA HIGH TOWN NAV SCORE: ${score} (blueprint needed, ${this.gameState.resources.gold} gold available)`)
            break
          }
        }
        
        // PHASE 8N: PROACTIVE PRIORITY for tower navigation during seed shortage
        if (targetScreen === 'tower') {
          const seedMetrics = SeedSystem.getSeedMetrics(this.gameState)
          const farmPlots = this.gameState.progression.farmPlots || 3
          const seedBuffer = Math.max(farmPlots * 2, 6)
          const criticalThreshold = farmPlots
          const lowThreshold = Math.floor(seedBuffer * 0.7)
          
          const isCritical = seedMetrics.totalSeeds < criticalThreshold
          const isLow = seedMetrics.totalSeeds < lowThreshold
          
          if (isCritical) {
            score = 998 // Just slightly lower than catch_seeds to ensure proper sequencing
            console.log(`🚨 CRITICAL TOWER NAV SCORE: ${score} (${seedMetrics.totalSeeds} seeds < ${criticalThreshold} critical)`)
            break
          } else if (isLow) {
            score = 700 // High priority for proactive navigation
            console.log(`⚠️ PROACTIVE TOWER NAV SCORE: ${score} (${seedMetrics.totalSeeds} seeds < ${lowThreshold} buffer)`)
            break
          }
        }
        
        // PHASE 8N: PREVENT navigation away from tower during seed shortage
        if (this.gameState.location.currentScreen === 'tower') {
          const seedMetrics = SeedSystem.getSeedMetrics(this.gameState)
          const farmPlots = this.gameState.progression.farmPlots || 3
          const seedBuffer = Math.max(farmPlots * 2, 6)
          const criticalThreshold = farmPlots
          const lowThreshold = Math.floor(seedBuffer * 0.7)
          
          const isCritical = seedMetrics.totalSeeds < criticalThreshold
          const isLow = seedMetrics.totalSeeds < lowThreshold
          
          if (isCritical && targetScreen !== 'tower') {
            score = 1 // Very low score to discourage leaving tower during critical shortage
            console.log(`🚫 BLOCKING TOWER EXIT: Low score ${score} for moving to ${targetScreen} during CRITICAL seed shortage`)
            break
          } else if (isLow && targetScreen !== 'tower') {
            score = 5 // Low score to discourage leaving tower when running low
            console.log(`🚫 DISCOURAGING TOWER EXIT: Low score ${score} for moving to ${targetScreen} during seed shortage`)
            break
          }
        }
        
        if (decisionParams?.screenPriorities?.weights) {
          const weights = decisionParams.screenPriorities.weights
          const weight = weights instanceof Map ? 
            (weights.get(targetScreen) || 1) : 
            (weights[targetScreen] || 1)
          score = weight * 10
          
          // Apply dynamic adjustments based on resource levels
          if (decisionParams.screenPriorities.adjustmentFactors) {
            const adjustments = decisionParams.screenPriorities.adjustmentFactors
            
            // Low energy adjustments
            if (this.gameState.resources.energy.current < 30 && adjustments.energyLow) {
              const energyMap = adjustments.energyLow
              const energyAdjustment = energyMap instanceof Map ? 
                (energyMap.get(targetScreen) || 1) : 
                (energyMap[targetScreen] || 1)
              score *= energyAdjustment
            }
            
            // High gold adjustments
            if (this.gameState.resources.gold > 200 && adjustments.goldHigh) {
              const goldMap = adjustments.goldHigh
              const goldAdjustment = goldMap instanceof Map ? 
                (goldMap.get(targetScreen) || 1) : 
                (goldMap[targetScreen] || 1)
              score *= goldAdjustment
            }
          }
        } else {
          score = 20 // Default navigation score
        }
        break
        
      case 'adventure':
        // Adventure scoring based on energy and potential gold rewards
        score = 30 // Base score for adventure
        
        // Higher score when we have good energy (adventures consume energy)
        if (this.gameState.resources.energy.current > 60) {
          score += 30 // Significant bonus when energy is high
        }
        
        // Bonus for expected gold rewards 
        const goldReward = action.expectedRewards?.gold || 0
        score += goldReward * 0.5 // Scale gold rewards into score
        
        // Bonus when gold is low (need income source)
        if (this.gameState.resources.gold < 100) {
          score += 20 // Adventures are primary gold source
        }
        break
        
      case 'catch_seeds':
        // PHASE 8N: Seed collection priority (critical when seeds low)
        const seedMetrics = SeedSystem.getSeedMetrics(this.gameState)
        const farmPlots = this.gameState.progression.farmPlots || 3
        const seedsPerPlot = seedMetrics.totalSeeds / farmPlots
        
        // Base score for seed catching
        score = 25
        
        // PROACTIVE SEED COLLECTION PRIORITY (Phase 8N: Improved thresholds)
        const seedBuffer = Math.max(farmPlots * 2, 6) // Want 2x seeds per plot, minimum 6
        const criticalThreshold = farmPlots // Critical when seeds = plots
        const lowThreshold = Math.floor(seedBuffer * 0.7) // Low when < 70% of buffer
        
        const isCritical = seedMetrics.totalSeeds < criticalThreshold
        const isLow = seedMetrics.totalSeeds < lowThreshold
        
        if (isCritical) {
          // ULTRA HIGH PRIORITY: Critical seed shortage
          if (this.gameState.location.currentScreen === 'tower') {
            score = 9999  // ULTRA MAXIMUM priority when at tower during critical shortage
            console.log(`🚨 ULTRA HIGH PRIORITY: catch_seeds at tower during CRITICAL shortage: ${score}`)
          } else {
            score = 999  // MAXIMUM priority when critical (but not at tower)
            console.log(`🚨 CRITICAL PRIORITY: catch_seeds when seeds critically low: ${score}`)
          }
        } else if (isLow) {
          // HIGH PRIORITY: Proactive seed collection when running low  
          if (this.gameState.location.currentScreen === 'tower') {
            score = 750  // High priority for proactive collection at tower
            console.log(`⚠️ HIGH PRIORITY: catch_seeds at tower for proactive collection: ${score}`)
          } else {
            score = 400  // Moderate priority when low (need to navigate first)
            console.log(`⚠️ MODERATE PRIORITY: catch_seeds when seeds running low: ${score}`)
          }
        } else if (seedsPerPlot < 3) {
          score = 200  // Standard priority for maintaining buffer
        }
        
        // PHASE 8N: Seed catching costs no energy (always free)
        console.log(`🎯 SEED CATCH SCORE: ${score} (${seedMetrics.totalSeeds} seeds, ${seedsPerPlot.toFixed(1)} per plot, at ${this.gameState.location.currentScreen})`)
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
    
    // PHASE 8N: Free water pumping - no energy cost
    // this.gameState.resources.energy.current -= action.energyCost
    
    events.push({
      timestamp: this.gameState.time.totalMinutes,
      type: 'action_pump',
      description: `Pumped ${waterToAdd} water`,
      importance: 'low'
    })
    
    return true
  }
  private getBlueprintBuildCost(blueprintId: string): { energy?: number; materials?: Map<string, number>; time?: number } {
    // Map blueprint ID to build action ID (remove blueprint_ prefix)
    const buildActionId = blueprintId.replace('blueprint_', '')
    
    try {
      // Query build action from farm_actions.csv
      const buildAction = this.gameDataStore.getItemById(buildActionId)
      if (buildAction) {
        const cost: { energy?: number; materials?: Map<string, number>; time?: number } = {}
        
        if (buildAction.energy_cost) {
          cost.energy = parseInt(buildAction.energy_cost) || 0
        }
        
        if (buildAction.time) {
          cost.time = parseInt(buildAction.time) || 0
        }
        
        if (buildAction.materials_cost) {
          cost.materials = CSVDataParser.parseMaterials(buildAction.materials_cost)
        }
        
        return cost
      }
    } catch (error) {
      console.warn(`Failed to get build cost for ${blueprintId}:`, error)
    }
    
    // Fallback costs for known blueprints
    const fallbackCosts: { [key: string]: { energy?: number; time?: number } } = {
      'blueprint_tower_reach_1': { energy: 5, time: 2 }
    }
    
    return fallbackCosts[blueprintId] || { energy: 10, time: 5 }
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
      this.eventBus.emit('state_changed', {
        changes: {
          progression: {
            currentPhase: { old: oldPhase, new: this.gameState.progression.currentPhase }
          }
        },
        source: 'updatePhaseProgression'
      })
    }
    
    if (oldStage !== this.gameState.progression.farmStage) {
      const stageNames = ['', 'Tutorial', 'Small Hold', 'Homestead', 'Manor Grounds', 'Great Estate']
      const stageName = stageNames[this.gameState.progression.farmStage] || 'Unknown'
      
      this.eventBus.emit('state_changed', {
        changes: {
          progression: {
            farmStage: { old: oldStage, new: this.gameState.progression.farmStage }
          }
        },
        source: 'updatePhaseProgression'
      })
    }
  }

  /**
   * Phase 9I: Setup event bus integration and game metadata
   */
  private setupEventBusIntegration(): void {
    console.log('🌐 SimulationEngine: Setting up event bus integration...')
    
    // Update event bus with initial game metadata
    this.updateEventBusMetadata()
    
    // Set up event handlers for various game events
    this.eventBus.on('tick_processed', (event) => {
      // Update metadata after each tick
      this.updateEventBusMetadata()
    })
    
    // Emit simulation started event
    this.eventBus.emit('simulation_started', {
      config: {
        personaId: this.persona?.id || 'unknown',
        parameters: this.config.parameterOverrides?.size || 0
      },
      personaId: this.persona?.id || 'unknown',
      startTime: Date.now()
    })
    
    console.log('✅ SimulationEngine: Event bus integration setup complete')
  }

  /**
   * Phase 9I: Update event bus with current game metadata
   */
  private updateEventBusMetadata(): void {
    this.eventBus.updateGameMetadata({
      tickCount: this.tickCount,
      gameDay: this.gameState.time.day,
      gameTime: `Day ${this.gameState.time.day}, ${this.gameState.time.hour}:${this.gameState.time.minute.toString().padStart(2, '0')}`
    })
  }

  /**
   * Phase 9I: Expose event bus for external access
   */
  getEventBus(): IEventBus {
    return this.eventBus
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
   * Updates automation systems
   */
  private updateAutomation() {
    // Update automation states based on current conditions
    this.gameState.automation.researchActive = this.gameState.progression.unlockedUpgrades.includes('auto_research')
    this.gameState.automation.combatActive = this.gameState.progression.unlockedUpgrades.includes('auto_combat')
    
    // Update next decision information for widgets
    try {
      const nextDecision = this.getNextDecision()
      this.gameState.automation.nextDecision = nextDecision
      console.log('🤖 SimulationEngine: Updated next decision:', nextDecision)
    } catch (error) {
      console.warn('Error updating next decision:', error)
      this.gameState.automation.nextDecision = null
    }
  }

  /**
   * Checks if victory conditions are met
   */
  private checkVictoryConditions(): boolean {
    // Victory conditions based on game design:
    // 1. Great Estate reached (90 plots)
    // 2. Hero level 15 (max level)
    return this.gameState.progression.farmPlots >= 90 || 
           this.gameState.progression.heroLevel >= 15
  }

  /**
   * Checks if simulation is stuck (bottleneck detection)
   */
  private checkBottleneckConditions(): boolean {
    const currentDay = this.gameState.time.day
    const currentPlots = this.gameState.progression.farmPlots
    const currentLevel = this.gameState.progression.heroLevel
    const currentGold = this.gameState.resources.gold
    
    // Initialize progress tracking if not exists
    if (!this.lastProgressCheck) {
      this.lastProgressCheck = {
        day: currentDay,
        plots: currentPlots,
        level: currentLevel,
        gold: currentGold,
        lastProgressDay: currentDay
      }
      return false
    }
    
    // Check if any progress has been made
    const hasProgress = (
      currentPlots > this.lastProgressCheck.plots ||
      currentLevel > this.lastProgressCheck.level ||
      currentGold > this.lastProgressCheck.gold + 100 // Significant gold increase
    )
    
    if (hasProgress) {
      // Update progress tracking
      this.lastProgressCheck = {
        day: currentDay,
        plots: currentPlots,
        level: currentLevel,
        gold: currentGold,
        lastProgressDay: currentDay
      }
      return false
    }
    
    // Check if stuck for 3+ days without progress
    const daysSinceProgress = currentDay - this.lastProgressCheck.lastProgressDay
    if (daysSinceProgress >= 3) {
      // Identify bottleneck cause
      const bottleneckCause = this.identifyBottleneckCause()
      console.warn(`Bottleneck detected after ${daysSinceProgress} days. Cause: ${bottleneckCause}`)
      return true
    }
    
    return false
  }

  /**
   * Identifies the likely cause of a bottleneck
   */
  private identifyBottleneckCause(): string {
    const energy = this.gameState.resources.energy.current
    const gold = this.gameState.resources.gold
    const plots = this.gameState.progression.farmPlots
    const seeds = Array.from(this.gameState.resources.seeds.values()).reduce((sum, count) => sum + count, 0)
    
    if (energy <= 10) {
      return "Low energy - hero cannot perform actions"
    }
    
    if (gold <= 50 && plots < 20) {
      return "Insufficient gold for progression purchases"
    }
    
    if (seeds <= 5 && plots > 10) {
      return "No seeds available for planting"
    }
    
    if (plots >= 40 && this.gameState.helpers.gnomes.length === 0) {
      return "Too many plots to manage without helpers"
    }
    
    return "Unknown bottleneck - check decision logic"
  }

  /**
   * Gets current game state (for external access)
   */
  getGameState(): GameState {
    return this.gameState
  }

  /**
   * Get next decision information for widget display
   */
  getNextDecision(): {
    action: string
    reason: string
    nextCheck: number
    priority?: number
    target?: string
    alternatives?: Array<{ action: string; score: number }>
  } | null {
    try {
      // Get current check-in schedule
      const nextCheckIn = this.getNextCheckInTime()
      
      // Evaluate available actions to see what would be chosen
      const availableActions = this.evaluateAvailableActions()
      
      if (availableActions.length === 0) {
        return {
          action: 'Waiting',
          reason: 'No actions available at current time',
          nextCheck: nextCheckIn,
          priority: 0
        }
      }
      
      // Get the top action that would be selected
      const topAction = availableActions[0]
      const alternatives = availableActions.slice(1, 4).map(action => ({
        action: action.type,
        score: this.scoreAction(action)
      }))
      
      return {
        action: topAction.type,
        reason: this.getActionReasoning(topAction),
        nextCheck: nextCheckIn,
        priority: this.scoreAction(topAction),
        target: topAction.target,
        alternatives
      }
    } catch (error) {
      console.error('Error getting next decision:', error)
      return {
        action: 'Error',
        reason: 'Decision system encountered an error',
        nextCheck: this.getNextCheckInTime(),
        priority: 0
      }
    }
  }

  /**
   * Get next check-in time based on persona
   */
  private getNextCheckInTime(): number {
    const currentTime = this.gameState.time.totalMinutes
    const persona = this.persona
    
    // Default check-in intervals by persona (in minutes)
    let intervalMinutes = 240 // 4 hours default
    
    if (persona?.type === 'speedrunner') {
      intervalMinutes = 144 // ~10 times per day (every 2.4 hours)
    } else if (persona?.type === 'casual') {
      intervalMinutes = 720 // 2 times per day (every 12 hours)  
    } else if (persona?.type === 'weekend-warrior') {
      const dayOfWeek = Math.floor(this.gameState.time.day) % 7
      intervalMinutes = dayOfWeek >= 5 ? 180 : 480 // More frequent on weekends
    }
    
    return currentTime + intervalMinutes
  }

  /**
   * Evaluate what actions would be available for decision making
   */
  private evaluateAvailableActions(): GameAction[] {
    const actions: GameAction[] = []
    
    // Get actions from all evaluation methods
    actions.push(...this.evaluateFarmActions())
    actions.push(...this.evaluateTowerActions()) 
    actions.push(...this.evaluateTownActions())
    actions.push(...this.evaluateAdventureActions())
    actions.push(...this.evaluateForgeActions())
    actions.push(...this.evaluateMineActions())
    actions.push(...this.evaluateHelperActions())
    actions.push(...this.evaluateNavigationActions())
    
    // Filter valid actions and sort by score
    const validActions = actions.filter(action => this.checkActionPrerequisites(action))
    validActions.sort((a, b) => this.scoreAction(b) - this.scoreAction(a))
    
    return validActions
  }

  /**
   * Get reasoning for why an action would be chosen
   */
  private getActionReasoning(action: GameAction): string {
    const score = this.scoreAction(action)
    const bottlenecks = this.getBottleneckPriorities()
    
    // Build reasoning based on action type and current game state
    const reasons: string[] = []
    
    // Check if action addresses bottlenecks
    if (this.resolvesBottleneck(action, bottlenecks)) {
      const bottleneck = bottlenecks.find(b => this.resolvesBottleneck(action, [b]))
      if (bottleneck) {
        reasons.push(`Addresses ${bottleneck.type} bottleneck`)
      }
    }
    
    // Add persona-specific reasoning
    if (this.persona?.type === 'speedrunner' && score > 7) {
      reasons.push('High efficiency action')
    } else if (this.persona?.type === 'casual' && action.energyCost < 30) {
      reasons.push('Low energy requirement')
    } else if (this.persona?.type === 'weekend-warrior') {
      const dayOfWeek = Math.floor(this.gameState.time.day) % 7
      if (dayOfWeek >= 5) {
        reasons.push('Weekend intensive activity')
      }
    }
    
    // Add resource-based reasoning
    if (action.type === 'plant' && this.gameState.resources.seeds) {
      const seedCount = this.gameState.resources.seeds instanceof Map ? 
        this.gameState.resources.seeds.size : Object.keys(this.gameState.resources.seeds).length
      if (seedCount > 5) {
        reasons.push('Abundant seeds available')
      }
    }
    
    if (action.type === 'harvest') {
      const readyCrops = this.gameState.processes.crops?.filter(crop => crop.readyToHarvest).length || 0
      if (readyCrops > 0) {
        reasons.push(`${readyCrops} crops ready to harvest`)
      }
    }
    
    // Default reasoning based on score
    if (reasons.length === 0) {
      if (score > 8) {
        reasons.push('Highest priority action')
      } else if (score > 5) {
        reasons.push('Good progression choice')
      } else {
        reasons.push('Available action to maintain progress')
      }
    }
    
    return reasons.join(', ')
  }
  
  /**
   * Get current tower reach level (Phase 8N)
   */
  private getCurrentTowerReach(): number {
    const heroLevel = this.gameState.progression.heroLevel
    const baseReach = Math.min(heroLevel, 11) // Hero level contributes to reach
    
    // Check for tower reach upgrades
    const upgrades = this.gameState.progression.unlockedUpgrades
    let reachBonus = 0
    
    if (upgrades.includes('tower_reach_11')) reachBonus = Math.max(reachBonus, 11)
    else if (upgrades.includes('tower_reach_10')) reachBonus = Math.max(reachBonus, 10)
    else if (upgrades.includes('tower_reach_9')) reachBonus = Math.max(reachBonus, 9)
    else if (upgrades.includes('tower_reach_8')) reachBonus = Math.max(reachBonus, 8)
    else if (upgrades.includes('tower_reach_7')) reachBonus = Math.max(reachBonus, 7)
    else if (upgrades.includes('tower_reach_6')) reachBonus = Math.max(reachBonus, 6)
    else if (upgrades.includes('tower_reach_5')) reachBonus = Math.max(reachBonus, 5)
    else if (upgrades.includes('tower_reach_4')) reachBonus = Math.max(reachBonus, 4)
    else if (upgrades.includes('tower_reach_3')) reachBonus = Math.max(reachBonus, 3)
    else if (upgrades.includes('tower_reach_2')) reachBonus = Math.max(reachBonus, 2)
    else if (upgrades.includes('tower_reach_1')) reachBonus = Math.max(reachBonus, 1)
    
    return Math.max(baseReach, reachBonus)
  }
  
  /**
   * Get best available net for seed catching (Phase 8N)
   */
  private getBestNet(): keyof typeof MANUAL_CATCHING.nets {
    const tools = this.gameState.inventory.tools
    
    if (tools.has('crystal_net') && tools.get('crystal_net')?.isEquipped) return 'crystal_net'
    if (tools.has('golden_net') && tools.get('golden_net')?.isEquipped) return 'golden_net'
    if (tools.has('net_ii') && tools.get('net_ii')?.isEquipped) return 'net_ii'
    if (tools.has('net_i') && tools.get('net_i')?.isEquipped) return 'net_i'
    
    return 'none'
  }
  
  /**
   * Get persona-based catching skill modifier (Phase 8N)
   */
  private getPersonaCatchingSkill(): number {
    const heroLevel = this.gameState.progression.heroLevel
    const baseSkill = 0.7 + (heroLevel - 1) * 0.02 // 0.7 to 0.9 range
    
    // Apply persona modifiers
    const personaModifier = this.persona?.efficiency || 0.7
    const finalSkill = baseSkill * personaModifier
    
    return Math.min(0.95, Math.max(0.7, finalSkill))
  }
  
  /**
   * Get current auto-catcher tier (Phase 8N)
   */
  private getAutoCatcherTier(): keyof typeof AUTO_CATCHERS | null {
    const upgrades = this.gameState.progression.unlockedUpgrades
    
    if (upgrades.includes('tier_iii')) return 'tier_iii'
    if (upgrades.includes('tier_ii')) return 'tier_ii'
    if (upgrades.includes('tier_i')) return 'tier_i'
    
    return null
  }
  
  /**
   * Get next auto-catcher tier available for purchase (Phase 8N)
   */
  private getNextAutoCatcherTier(currentTier: keyof typeof AUTO_CATCHERS | null): keyof typeof AUTO_CATCHERS | null {
    if (!currentTier) return 'tier_i'
    if (currentTier === 'tier_i') return 'tier_ii'
    if (currentTier === 'tier_ii') return 'tier_iii'
    
    return null // Already at max tier
  }

  /**
   * Process offline water generation from auto-pumps (Phase 8N)
   * @param offlineTimeMinutes Time spent offline in minutes
   */
  processOfflineWaterGeneration(offlineTimeMinutes: number): {
    waterGenerated: number
    pumpLevel: string | null
    message: string
  } {
    if (offlineTimeMinutes <= 0) {
      return { waterGenerated: 0, pumpLevel: null, message: '' }
    }
    
    const result = WaterSystem.calculateOfflineWater(
      offlineTimeMinutes,
      this.gameState.resources.water.max,
      this.gameState
    )
    
    if (result.generated > 0) {
      // Add water to current resources
      const currentWater = this.gameState.resources.water.current
      const maxWater = this.gameState.resources.water.max
      const actualAdded = Math.min(result.generated, maxWater - currentWater)
      
      this.gameState.resources.water.current += actualAdded
      
      // Create event log
      this.eventBus.emit('resource_changed', {
        resource: 'water',
        oldValue: currentWater,
        newValue: this.gameState.resources.water.current,
        delta: actualAdded,
        source: 'offline_water_generation'
      })
      
      console.log(`💧 Offline Water Generation: ${result.message}`)
      
      return {
        waterGenerated: actualAdded,
        pumpLevel: result.pumpLevel,
        message: result.message
      }
    }
    
    return { waterGenerated: 0, pumpLevel: result.pumpLevel, message: 'No auto-pump installed' }
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
   * Checks if hero should act - FIXED: Simple, frequent logic instead of complex persona scheduling
   */
  private shouldHeroActNow(): boolean {
    const currentHour = this.gameState.time.hour
    const currentMinute = this.gameState.time.minute
    
    // Don't act at night (10 PM to 6 AM)
    if (currentHour < 6 || currentHour >= 22) return false
    
    // Always act in first few minutes of simulation
    if (this.gameState.time.totalMinutes < 600) { // First 10 hours
      if (this.lastCheckinTime === 0) {
        console.log('🎬 SimulationEngine: Initial check-in at', currentHour + ':' + currentMinute.toString().padStart(2, '0'))
        this.lastCheckinTime = this.gameState.time.totalMinutes
        return true
      }
    }
    
    // Calculate time since last check-in
    const timeSinceLastCheckin = this.gameState.time.totalMinutes - this.lastCheckinTime
    
    // CRITICAL FIX: More aggressive check-ins in early game for better plot utilization
    let MIN_CHECKIN_INTERVAL = 15 // Base interval
    
    // Adjust check-in frequency based on game phase and plot utilization
    const farmPlots = this.gameState.progression.farmPlots || 3
    const activeCrops = this.gameState.processes.crops.filter(crop => crop.cropId && !crop.readyToHarvest).length
    const plotUtilization = farmPlots > 0 ? activeCrops / farmPlots : 0
    
    // PHASE 8N: Emergency check-in frequency for seed shortages
    const seedMetrics = SeedSystem.getSeedMetrics(this.gameState)
    const seedBuffer = Math.max(farmPlots * 2, 6)
    const criticalThreshold = farmPlots
    const lowThreshold = Math.floor(seedBuffer * 0.7)
    
    if (seedMetrics.totalSeeds < criticalThreshold) {
      MIN_CHECKIN_INTERVAL = 2 // URGENT: Check every 2 minutes during seed crisis
    } else if (seedMetrics.totalSeeds < lowThreshold) {
      MIN_CHECKIN_INTERVAL = 5 // FREQUENT: Check every 5 minutes when seeds running low
    } else if (plotUtilization < 0.8 && this.gameState.progression.currentPhase === 'Tutorial') {
      MIN_CHECKIN_INTERVAL = 5 // Very frequent in tutorial with low utilization
    } else if (plotUtilization < 0.6) {
      MIN_CHECKIN_INTERVAL = 8 // More frequent with poor utilization
    } else if (this.gameState.progression.currentPhase === 'Tutorial') {
      MIN_CHECKIN_INTERVAL = 10 // Frequent in tutorial phase
    }
    
    console.log(`⏰ Check-in logic: ${farmPlots} plots, ${activeCrops} active (${Math.round(plotUtilization * 100)}% util), ${seedMetrics.totalSeeds} seeds, interval: ${MIN_CHECKIN_INTERVAL}min`)
    
    if (timeSinceLastCheckin >= MIN_CHECKIN_INTERVAL) {
      console.log('🎬 SimulationEngine: Regular check-in at', currentHour + ':' + currentMinute.toString().padStart(2, '0'), '(', timeSinceLastCheckin, 'min since last)')
      this.lastCheckinTime = this.gameState.time.totalMinutes
      return true
    }
    
    // ADDITIONAL TRIGGER: Act when energy is high (prevents energy waste)
    if (this.gameState.resources.energy.current > this.gameState.resources.energy.max * 0.85) {
      if (timeSinceLastCheckin >= 30) { // But not too frequently
        console.log('🎬 SimulationEngine: High energy check-in at', currentHour + ':' + currentMinute.toString().padStart(2, '0'), '(energy:', Math.round(this.gameState.resources.energy.current), ')')
        this.lastCheckinTime = this.gameState.time.totalMinutes
        return true
      }
    }
    
    // ADDITIONAL TRIGGER: Act when water is critically low
    if (this.gameState.resources.water.current < this.gameState.resources.water.max * 0.2) {
      if (timeSinceLastCheckin >= 15) { // Emergency action
        console.log('🎬 SimulationEngine: Low water emergency check-in at', currentHour + ':' + currentMinute.toString().padStart(2, '0'), '(water:', Math.round(this.gameState.resources.water.current), ')')
        this.lastCheckinTime = this.gameState.time.totalMinutes
        return true
      }
    }
    
    // PHASE 8L: Additional trigger for ready crops (testing purposes)
    const readyToHarvest = this.gameState.processes.crops.filter(crop => crop.readyToHarvest).length
    if (readyToHarvest > 0 && timeSinceLastCheckin >= 10) {
      console.log('🎬 SimulationEngine: Ready crops check-in at', currentHour + ':' + currentMinute.toString().padStart(2, '0'), '(ready crops:', readyToHarvest, ')')
      this.lastCheckinTime = this.gameState.time.totalMinutes
      return true
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
   * Adds material using StateManager with storage limits and normalization
   */
  private addMaterial(materialName: string, amount: number): boolean {
    if (amount <= 0) {
      return false
    }

    const result = this.stateManager.updateResource({
      type: 'materials',
      operation: 'add',
      amount,
      itemId: materialName,
      enforceLimit: true
    }, `Add ${amount} ${materialName}`, 'SimulationEngine')

    if (!result.success) {
      console.warn(`⚠️ Failed to add material: ${result.error}`)
      return false
    }

    // Check if storage limit was hit
    const resourceManager = this.stateManager.getResourceManager()
    const limitResult = resourceManager.processResourceChange({
      type: 'materials',
      operation: 'add',
      amount: 0, // Just check current state
      itemId: materialName
    })

    return limitResult.hitLimit
  }

  /**
   * Consumes materials using StateManager for crafting/actions
   */
  private consumeMaterials(materials: Map<string, number>): boolean {
    const resourceManager = this.stateManager.getResourceManager()
    
    // First check if we have enough of all materials
    const requirements: { [key: string]: number } = {}
    for (const [materialName, amount] of materials.entries()) {
      requirements[materialName] = amount
    }
    
    if (!resourceManager.canAfford(requirements)) {
      return false
    }

    // Use transaction to ensure all-or-nothing consumption
    const transactionId = this.stateManager.beginTransaction()
    
    try {
      // Consume each material
      for (const [materialName, amount] of materials.entries()) {
        const result = this.stateManager.updateResource({
          type: 'materials',
          operation: 'subtract',
          amount,
          itemId: materialName
        }, `Consume ${amount} ${materialName}`, 'SimulationEngine')

        if (!result.success) {
          this.stateManager.rollbackTransaction(transactionId)
          return false
        }
      }

      // Commit the transaction
      const commitResult = this.stateManager.commitTransaction(transactionId)
      return commitResult.success
    } catch (error) {
      this.stateManager.rollbackTransaction(transactionId)
      return false
    }
  }

  /**
   * Adds a game event to the current tick's events
   */
  /**
   * Phase 8O: Get bottleneck priorities for enhanced decision making
   */
  private getBottleneckPriorities(): Array<{ type: string; priority: number; details?: any }> {
    const bottlenecks: Array<{ type: string; priority: number; details?: any }> = []
    
    // Check for water shortage (< 2x plots)
    const farmPlots = this.gameState.progression.farmPlots || 3
    const waterCurrent = this.gameState.resources.water.current
    const waterNeeded = farmPlots * 2
    
    if (waterCurrent < waterNeeded) {
      bottlenecks.push({ 
        type: 'water', 
        priority: 10,
        details: { current: waterCurrent, needed: waterNeeded, shortage: waterNeeded - waterCurrent }
      })
    }
    
    // Check for seed shortage (< plots)
    const totalSeeds = Array.from(this.gameState.resources.seeds.values()).reduce((a, b) => a + b, 0)
    if (totalSeeds < farmPlots) {
      bottlenecks.push({ 
        type: 'seeds', 
        priority: 8,
        details: { current: totalSeeds, needed: farmPlots, shortage: farmPlots - totalSeeds }
      })
    }
    
    // Check for plot shortage (>90% used)
    const plantedPlots = this.gameState.processes.crops.filter(c => c.plantedAt > 0).length
    const plotUsage = plantedPlots / farmPlots
    
    if (plotUsage > 0.9) {
      bottlenecks.push({ 
        type: 'plots', 
        priority: 7,
        details: { used: plantedPlots, total: farmPlots, usage: plotUsage }
      })
    }
    
    // Check for tool requirements for next cleanup
    const nextCleanup = this.getNextCleanupAction()
    if (nextCleanup && !this.hasRequiredTool(nextCleanup)) {
      bottlenecks.push({ 
        type: 'tool', 
        priority: 9,
        details: { action: nextCleanup.id, tool: nextCleanup.tool_required }
      })
    }
    
    return bottlenecks.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Phase 8O: Enhanced action scoring with bottleneck resolution and persona preferences
   */
  private scoreActionEnhanced(action: GameAction, bottlenecks: Array<{ type: string; priority: number }>): number {
    let score = this.scoreAction(action) // Use existing scoring as base
    
    // Apply efficiency multiplier based on action type
    const efficiencyMultiplier = this.getEfficiencyMultiplier(action)
    score *= efficiencyMultiplier
    
    // Apply persona preferences
    const personaMultiplier = this.getPersonaPreference(action)
    score *= personaMultiplier
    
    // Bottleneck resolution bonus (2x score)
    if (this.resolvesBottleneck(action, bottlenecks)) {
      console.log(`🎯 Action ${action.type} resolves bottleneck - doubling score`)
      score *= 2.0
    }
    
    // Resource efficiency bonus
    const resourceEfficiency = this.getResourceEfficiency(action)
    score *= resourceEfficiency
    
    // Time efficiency (prefer quick actions when many tasks pending)
    const pendingTaskCount = bottlenecks.length
    if (pendingTaskCount > 3 && action.time && action.time < 60) {
      score *= 1.2 // 20% bonus for quick actions when busy
    }
    
    return score
  }

  /**
   * Phase 8O: Apply persona strategy to action selection
   */
  private applyPersonaStrategy(
    scoredActions: Array<{ action: GameAction; score: number }>, 
    bottlenecks: Array<{ type: string; priority: number }>
  ): GameAction[] {
    const strategy = this.getPersonaStrategy()
    const topActions = scoredActions.slice(0, 10) // Consider top 10 actions
    
    switch (strategy) {
      case 'aggressive_expansion':
        // Speedrunner: Focus on progression, take more actions
        return this.selectTopActions(
          topActions.filter(sa => this.isProgressionAction(sa.action)).map(sa => sa.action),
          Math.min(5, topActions.length)
        )
        
      case 'steady_progress':
        // Casual: Balanced approach, fewer actions
        return this.selectTopActions(
          topActions.map(sa => sa.action),
          Math.min(2, topActions.length)
        )
        
      case 'burst_progress':
        // Weekend Warrior: Efficient batching based on day
        const isWeekend = this.gameState.time.day % 7 >= 5 // Friday-Sunday
        const actionCount = isWeekend ? Math.min(6, topActions.length) : Math.min(1, topActions.length)
        
        return this.selectTopActions(
          topActions.map(sa => sa.action),
          actionCount
        )
        
      default:
        return this.selectTopActions(topActions.map(sa => sa.action), 3)
    }
  }

  /**
   * Get efficiency multiplier based on action type and current tools
   */
  private getEfficiencyMultiplier(action: GameAction): number {
    // Tool-based efficiency
    if (action.type === 'cleanup' && action.target) {
      const requiredTool = this.getRequiredTool(action.target)
      if (requiredTool && this.hasUpgradedTool(requiredTool)) {
        return 1.25 // 25% bonus for upgraded tools
      }
    }
    
    // Mining efficiency
    if (action.type === 'mine' && this.gameState.inventory.tools.has('pickaxe_3')) {
      return 1.3 // 30% bonus for advanced pickaxe
    }
    
    return 1.0 // Base efficiency
  }

  /**
   * Get persona preference multiplier for action types
   */
  private getPersonaPreference(action: GameAction): number {
    if (!this.persona?.id) return 1.0
    
    const preferences = {
      speedrunner: {
        farming: 0.7,      // Lower priority on farming
        adventures: 1.2,   // High priority on progression  
        crafting: 1.0,     // Maximum efficiency in crafting
        mining: 0.8,       // Good mining efficiency
        cleanup: 1.1       // Focus on expansion
      },
      casual: {
        farming: 1.0,      // Focus on reliable farming
        adventures: 0.6,   // Less risky adventures
        crafting: 0.7,     // Some crafting mistakes
        mining: 0.5,       // Minimal mining
        cleanup: 0.8       // Steady cleanup
      },
      'weekend-warrior': {
        farming: 0.9,      // Good farming on active days
        adventures: 1.1,   // Big adventure pushes
        crafting: 0.8,     // Batch crafting
        mining: 1.0,       // Deep mining sessions
        cleanup: 0.7       // Focus on other activities
      }
    }
    
    const personaPrefs = preferences[this.persona.id] || preferences.casual
    const actionCategory = this.getActionCategory(action)
    
    return personaPrefs[actionCategory] || 1.0
  }

  /**
   * Check if action resolves any current bottlenecks
   */
  private resolvesBottleneck(action: GameAction, bottlenecks: Array<{ type: string; priority: number }>): boolean {
    for (const bottleneck of bottlenecks) {
      switch (bottleneck.type) {
        case 'water':
          if (action.type === 'pump' || action.type === 'water') return true
          break
        case 'seeds':
          if (action.type === 'catch_seeds' || action.screen === 'tower') return true
          break
        case 'plots':
          if (action.type === 'cleanup' && action.effects?.includes('plots_added')) return true
          break
        case 'tool':
          if (action.type === 'craft' && action.target?.includes('tool')) return true
          break
      }
    }
    return false
  }

  /**
   * Get resource efficiency rating for action
   */
  private getResourceEfficiency(action: GameAction): number {
    const energyCost = action.energyCost || 0
    const goldCost = action.goldCost || 0
    const timeCost = action.time || 1
    
    // Prefer low-cost, high-value actions
    if (energyCost <= 10 && goldCost <= 50) {
      return 1.2 // 20% bonus for efficient actions
    }
    
    if (energyCost > 50 || goldCost > 500) {
      return 0.8 // 20% penalty for expensive actions
    }
    
    return 1.0
  }

  /**
   * Get persona strategy type
   */
  private getPersonaStrategy(): string {
    if (!this.persona?.id) return 'steady_progress'
    
    const strategies = {
      speedrunner: 'aggressive_expansion',
      casual: 'steady_progress',
      'weekend-warrior': 'burst_progress'
    }
    
    return strategies[this.persona.id] || 'steady_progress'
  }

  /**
   * Check if action is progression-focused
   */
  private isProgressionAction(action: GameAction): boolean {
    return action.type === 'adventure' || 
           action.type === 'cleanup' || 
           action.type === 'craft' ||
           (action.type === 'buy' && action.target?.includes('blueprint'))
  }

  /**
   * Get action category for persona preferences
   */
  private getActionCategory(action: GameAction): string {
    if (action.type === 'plant' || action.type === 'harvest' || action.type === 'water') {
      return 'farming'
    }
    if (action.type === 'adventure') {
      return 'adventures'  
    }
    if (action.type === 'craft') {
      return 'crafting'
    }
    if (action.type === 'mine') {
      return 'mining'
    }
    if (action.type === 'cleanup') {
      return 'cleanup'
    }
    return 'farming' // Default fallback
  }

  /**
   * Get next cleanup action that should be prioritized
   */
  private getNextCleanupAction(): any {
    // Find the next available cleanup based on progression
    const farmStage = this.gameState.progression.farmStage || 1
    
    // This would normally query the CSV data for next cleanup
    // For now, return a basic structure
    return {
      id: 'next_cleanup',
      tool_required: 'hoe'
    }
  }

  /**
   * Check if hero has required tool for action
   */
  private hasRequiredTool(action: any): boolean {
    if (!action.tool_required) return true
    return this.gameState.inventory.tools.has(action.tool_required)
  }

  /**
   * Check if hero has upgraded version of tool
   */
  private hasUpgradedTool(toolName: string): boolean {
    const upgradedTools = [`${toolName}_plus`, `${toolName}_master`]
    return upgradedTools.some(tool => this.gameState.inventory.tools.has(tool))
  }

  /**
   * Get required tool for cleanup action
   */
  private getRequiredTool(actionTarget: string): string | null {
    // Tool requirements mapping
    const toolMapping = {
      'till_soil': 'hoe',
      'clear_boulders': 'hammer', 
      'remove_stumps': 'axe',
      'level_ground': 'shovel'
    }
    
    for (const [pattern, tool] of Object.entries(toolMapping)) {
      if (actionTarget.includes(pattern)) {
        return tool
      }
    }
    
    return null
  }

  /**
   * Phase 8L: Executes material selling action
   */
  private executeSellMaterialAction(action: GameAction): { success: boolean; events: GameEvent[] } {
    const events: GameEvent[] = []
    
    if (!action.target || !action.materialCosts) {
      return { success: false, events: [] }
    }
    
    const materialName = action.target
    const sellAmount = action.materialCosts[materialName] || 0
    const goldValue = action.expectedRewards?.gold || 0
    
    // Check if we have enough materials
    const available = this.gameState.resources.materials.get(materialName) || 0
    if (available < sellAmount) {
      return { success: false, events: [] }
    }
    
    // Execute the sale
    this.gameState.resources.materials.set(materialName, available - sellAmount)
    this.gameState.resources.gold += goldValue
    
    events.push({
      timestamp: this.gameState.time.totalMinutes,
      type: 'material_sale',
      description: `Sold ${sellAmount} ${materialName} for ${goldValue} gold`,
      importance: 'medium'
    })
    
    return { success: true, events }
  }

  /**
   * Executes building a structure from a blueprint
   */
  private executeBuildAction(action: GameAction): { success: boolean; events: GameEvent[] } {
    const events: GameEvent[] = []
    
    if (!action.target) {
      return { success: false, events: [] }
    }
    
    const structureId = action.target
    const blueprintId = `blueprint_${structureId}`
    
    // Verify blueprint ownership
    const blueprint = this.gameState.inventory.blueprints.get(blueprintId)
    if (!blueprint || !blueprint.purchased || blueprint.isBuilt) {
      console.log(`❌ BUILD FAILED: Invalid blueprint state for ${blueprintId}`)
      return { success: false, events: [] }
    }
    
    // Consume energy
    this.gameState.resources.energy.current -= action.energyCost
    
    // Consume materials if required
    if (blueprint.buildCost.materials) {
      for (const [materialName, amount] of blueprint.buildCost.materials) {
        const current = this.gameState.resources.materials.get(materialName) || 0
        this.gameState.resources.materials.set(materialName, current - amount)
      }
    }
    
    // Mark blueprint as built
    blueprint.isBuilt = true
    this.gameState.inventory.blueprints.set(blueprintId, blueprint)
    
    // Add structure to built structures
    this.gameState.progression.builtStructures.add(structureId)
    
    // CRITICAL: Unlock corresponding screen access
    this.updateUnlockedAreasFromBuiltStructures()
    
    // Add to unlocked upgrades for compatibility with existing systems
    this.gameState.progression.unlockedUpgrades.push(structureId)
    
    events.push({
      timestamp: this.gameState.time.totalMinutes,
      type: 'structure_built',
      description: `Built ${structureId} from blueprint (${action.duration} min, ${action.energyCost} energy)`,
      importance: 'high'
    })
    
    console.log(`🏗️ STRUCTURE BUILT: ${structureId} - screen access updated`)
    
    return { success: true, events }
  }

  /**
   * Updates unlockedAreas based on built structures
   */
  private updateUnlockedAreasFromBuiltStructures(): void {
    const structureToArea: { [key: string]: string } = {
      'tower_reach_1': 'tower',
      // Future: Add other structure -> area mappings
    }
    
    // Update unlocked areas based on built structures
    const newAreas = new Set(this.gameState.progression.unlockedAreas)
    
    for (const structureId of this.gameState.progression.builtStructures) {
      const areaId = structureToArea[structureId]
      if (areaId && !newAreas.has(areaId)) {
        newAreas.add(areaId)
        console.log(`🔓 AREA UNLOCKED: ${areaId} (from building ${structureId})`)
      }
    }
    
    this.gameState.progression.unlockedAreas = Array.from(newAreas)
  }

  /**
   * Phase 8L: Evaluates material selling opportunities at town material trader
   */
  private evaluateMaterialSales(): GameAction[] {
    const actions: GameAction[] = []
    
    // Material trade rates as per Phase 8L specification
    const MATERIAL_TRADE_RATES = {
      stone: { price: 2, minQty: 10 },
      wood: { price: 3, minQty: 10 },
      copper: { price: 5, minQty: 5 },
      iron: { price: 10, minQty: 5 },
      silver: { price: 25, minQty: 3 },
      crystal: { price: 100, minQty: 1 },
      mythril: { price: 500, minQty: 1 },
      obsidian: { price: 1000, minQty: 1 }
    }
    
    // Only sell materials if we're low on gold (< 200) to avoid hoarding
    if (this.gameState.resources.gold >= 200) {
      return actions
    }
    
    // Check each material for selling opportunity
    for (const [materialName, tradeRate] of Object.entries(MATERIAL_TRADE_RATES)) {
      const availableAmount = this.gameState.resources.materials.get(materialName) || 0
      
      // Only sell if we have significantly more than minimum (keep some for crafting)
      const excessAmount = availableAmount - (tradeRate.minQty * 2) // Keep 2x minimum as buffer
      
      if (excessAmount >= tradeRate.minQty) {
        const sellAmount = Math.min(excessAmount, tradeRate.minQty * 3) // Sell up to 3x minimum at once
        const goldValue = sellAmount * tradeRate.price
        
        actions.push({
          id: `sell_${materialName}_${Date.now()}`,
          type: 'sell_material',
          screen: 'town',
          target: materialName,
          duration: 1,
          energyCost: 0,
          goldCost: 0,
          prerequisites: [],
          materialCosts: { [materialName]: sellAmount },
          expectedRewards: { gold: goldValue }
        })
      }
    }
    
    return actions
  }

  /**
   * Phase 8L: Evaluates emergency wood purchase from Agronomist
   */
  private evaluateEmergencyWood(): GameAction[] {
    const actions: GameAction[] = []
    
    const currentWood = this.gameState.resources.materials.get('wood') || 0
    
    // Only buy emergency wood if very low (< 10) and have gold
    if (currentWood >= 10) {
      return actions
    }
    
    // Emergency wood bundles as per specification
    const EMERGENCY_WOOD = {
      small: { cost: 50, amount: 10, prereq: null },
      medium: { cost: 200, amount: 50, prereq: 'farm_stage_2' },
      large: { cost: 800, amount: 250, prereq: 'farm_stage_3' }
    }
    
    // Choose best bundle we can afford and have prerequisites for
    let selectedBundle: { id: string; cost: number; amount: number } | null = null
    
    for (const [bundleId, bundle] of Object.entries(EMERGENCY_WOOD)) {
      if (this.gameState.resources.gold >= bundle.cost) {
        // Check prerequisites
        if (bundle.prereq === null || 
            (bundle.prereq === 'farm_stage_2' && this.gameState.progression.farmStage >= 2) ||
            (bundle.prereq === 'farm_stage_3' && this.gameState.progression.farmStage >= 3)) {
          selectedBundle = { id: bundleId, cost: bundle.cost, amount: bundle.amount }
        }
      }
    }
    
    if (selectedBundle) {
      actions.push({
        id: `buy_emergency_wood_${selectedBundle.id}_${Date.now()}`,
        type: 'purchase',
        screen: 'town',
        target: `emergency_wood_${selectedBundle.id}`,
        duration: 1,
        energyCost: 0,
        goldCost: selectedBundle.cost,
        prerequisites: [],
        expectedRewards: { 
          materials: { wood: selectedBundle.amount }
        }
      })
    }
    
    return actions
  }

  /**
   * Enhanced prerequisite checking using CSV data relationships (Phase 6E)
   */
  private checkActionPrerequisites(action: GameAction): boolean {
    console.log(`🔍 PREREQ CHECK: ${action.type} action (energy: ${this.gameState.resources.energy.current}/${action.energyCost || 0}, gold: ${this.gameState.resources.gold}/${action.goldCost || 0})`)
    
    // 1. Energy requirements
    if (action.energyCost && action.energyCost > this.gameState.resources.energy.current) {
      console.log(`❌ PREREQ FAILED: Insufficient energy (${this.gameState.resources.energy.current} < ${action.energyCost})`)
      return false
    }
    
    // 2. Gold requirements
    if (action.goldCost && action.goldCost > this.gameState.resources.gold) {
      console.log(`❌ PREREQ FAILED: Insufficient gold (${this.gameState.resources.gold} < ${action.goldCost})`)
      return false
    }
    
    // 3. Material requirements
    if (action.materialCosts) {
      for (const [material, amount] of Object.entries(action.materialCosts)) {
        const available = this.gameState.resources.materials.get(material.toLowerCase()) || 0
        if (available < amount) {
          console.log(`❌ PREREQ FAILED: Insufficient ${material} (${available} < ${amount})`)
          return false
        }
      }
    }
    
    // 4. CSV-based prerequisite validation
    if (action.prerequisites && action.prerequisites.length > 0) {
      for (const prereqId of action.prerequisites) {
        // Phase 9H: Use centralized validation service for prerequisite checking
        const prereqResult = validationService.validateItemPrerequisites({ prerequisites: [prereqId] }, this.gameState, this.gameDataStore)
        if (!prereqResult.satisfied) {
          console.log(`❌ PREREQ FAILED: Missing prerequisite ${prereqId}`)
          return false
        }
      }
    }
    
    console.log(`✅ BASIC PREREQS PASSED: ${action.type} - proceeding to action-specific checks`)
    
    // 5. Action-specific prerequisites
    switch (action.type) {
      case 'adventure':
        return this.checkAdventurePrerequisites(action)
      case 'craft':
        return this.checkCraftingPrerequisites(action)
      case 'catch_seeds':
        return this.checkTowerPrerequisites(action)
      case 'move':
        const moveTarget = action.toScreen || action.target  
        return this.checkScreenAccessPrerequisites(moveTarget)
      case 'rescue':
        return this.checkHelperRescuePrerequisites(action)
      default:
        console.log(`✅ PREREQ PASSED: ${action.type} (no specific requirements)`)
        return true
    }
  }



  /**
   * Get current auto-catcher level (Phase 8N)
   */
  private getAutoCatcherLevel(): number {
    const upgrades = this.gameState.progression.unlockedUpgrades
    
    if (upgrades.includes('tier_iii')) return 3
    if (upgrades.includes('tier_ii')) return 2
    if (upgrades.includes('tier_i')) return 1
    
    return 0
  }

  /**
   * Get current tower reach level (Phase 8N)
   */
  private getTowerReachLevel(): number {
    // Simplified tower reach calculation - would normally check tower upgrades
    const heroLevel = this.gameState.progression.heroLevel
    const baseReach = Math.min(heroLevel, 11) // Hero level contributes to reach
    
    // Check for tower reach upgrades
    const upgrades = this.gameState.progression.unlockedUpgrades
    let reachBonus = 0
    
    if (upgrades.includes('tower_reach_11')) reachBonus = Math.max(reachBonus, 11)
    else if (upgrades.includes('tower_reach_10')) reachBonus = Math.max(reachBonus, 10)
    else if (upgrades.includes('tower_reach_9')) reachBonus = Math.max(reachBonus, 9)
    else if (upgrades.includes('tower_reach_8')) reachBonus = Math.max(reachBonus, 8)
    else if (upgrades.includes('tower_reach_7')) reachBonus = Math.max(reachBonus, 7)
    else if (upgrades.includes('tower_reach_6')) reachBonus = Math.max(reachBonus, 6)
    else if (upgrades.includes('tower_reach_5')) reachBonus = Math.max(reachBonus, 5)
    else if (upgrades.includes('tower_reach_4')) reachBonus = Math.max(reachBonus, 4)
    else if (upgrades.includes('tower_reach_3')) reachBonus = Math.max(reachBonus, 3)
    else if (upgrades.includes('tower_reach_2')) reachBonus = Math.max(reachBonus, 2)
    else if (upgrades.includes('tower_reach_1')) reachBonus = Math.max(reachBonus, 1)
    
    return Math.max(baseReach, reachBonus)
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
      
      if (routeItem) {
        // Phase 9H: Use centralized validation service
        return validationService.validateItemPrerequisites(routeItem, this.gameState, this.gameDataStore).satisfied
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
    console.log(`🔍 TOWER PREREQ CHECK: current screen = '${this.gameState.location.currentScreen}', action = ${action.type}`)
    
    // Tower actions require being at the tower screen
    if (this.gameState.location.currentScreen !== 'tower') {
      console.log(`❌ TOWER PREREQ FAILED: Not at tower (current: '${this.gameState.location.currentScreen}')`)
      return false
    }
    
    // Check auto-catcher requirements (optional)
    if (action.requiresAutoCatcher && this.getAutoCatcherLevel() === 0) {
      console.log(`❌ TOWER PREREQ FAILED: Requires auto-catcher but level is 0`)
      return false
    }
    
    // Check tower reach level for advanced seed types (optional)
    const reachLevel = this.getTowerReachLevel()
    if (action.seedTier && action.seedTier > reachLevel) {
      console.log(`❌ TOWER PREREQ FAILED: Seed tier ${action.seedTier} > reach level ${reachLevel}`)
      return false
    }
    
    console.log(`✅ TOWER PREREQ PASSED: At tower screen, action can proceed`)
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
        // CRITICAL: Tower only accessible after tower_reach_1 is built
        const hasTower = this.gameState.progression.builtStructures.has('tower_reach_1')
        if (!hasTower) {
          console.log(`🚫 TOWER ACCESS BLOCKED: tower_reach_1 not built yet`)
        }
        return hasTower
      case 'town':
        return this.gameState.progression.currentPhase !== 'Tutorial' ||
               this.gameState.progression.unlockedUpgrades.includes('town_access')
      case 'adventure':
        // CRITICAL FIX: Allow basic adventures from Tutorial phase for economic flow
        // Heroes need to convert energy to gold early in the game
        return this.gameState.progression.heroLevel >= 1 || // Lowered from 3 to 1
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
      const helperItem = this.gameDataStore.getItemById((action as any).helperId)
      if (helperItem) {
        // Phase 9H: Use centralized validation service
        const prereqResult = validationService.validateItemPrerequisites(helperItem, this.gameState, this.gameDataStore)
        if (!prereqResult.satisfied) {
          return false
        }
      }
    } catch (error) {
      console.warn('Failed to check helper prerequisites:', error)
    }
    
    return true
  }
}
