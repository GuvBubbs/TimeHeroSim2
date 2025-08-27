// SimulationEngine - Phase 6A Core Implementation
// Main simulation engine that runs the game logic

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
  private isRunning: boolean = false
  private tickCount: number = 0
  
  constructor(config: SimulationConfig) {
    this.config = config
    this.parameters = this.extractParametersFromConfig(config)
    this.gameState = this.initializeGameState()
  }

  /**
   * Extracts parameters from the compiled configuration
   * Note: Maps should already be deserialized by MapSerializer in worker
   */
  private extractParametersFromConfig(config: SimulationConfig): AllParameters {
    // This would normally come from the parameter store, but in the worker
    // we need to reconstruct it from the configuration
    // For now, we'll use placeholder parameters
    // TODO: Integrate with actual parameter extraction
    return this.createDefaultParameters()
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
   * Initializes the game state based on parameters
   */
  private initializeGameState(): GameState {
    const farmParams = this.parameters.farm

    return {
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
          regenRate: 1 // 1 energy per minute base
        },
        gold: 100, // Starting gold
        water: {
          current: farmParams.initialState.water,
          max: farmParams.waterSystem.maxWaterStorage,
          pumpRate: 10 * farmParams.waterSystem.pumpEfficiency
        },
        seeds: {
          'turnip': 5,
          'beet': 3
        },
        materials: {}
      },
      progression: {
        heroLevel: 1,
        experience: 0,
        farmStage: 1,
        currentPhase: 'Early',
        completedAdventures: [],
        unlockedUpgrades: [],
        unlockedAreas: ['farm'],
        victoryConditionsMet: false
      },
      inventory: {
        tools: new Map(),
        weapons: new Map(),
        armor: new Map(),
        capacity: 100,
        currentWeight: 0
      },
      processes: {
        crops: [],
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
        currentScreen: 'farm',
        timeOnScreen: 0,
        screenHistory: ['farm'],
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
    
    // Process adventure
    if (this.gameState.processes.adventure) {
      const adventure = this.gameState.processes.adventure
      adventure.progress = Math.min(1.0, 
        (this.gameState.time.totalMinutes - adventure.startedAt) / adventure.duration
      )
      
      if (adventure.progress >= 1.0 && !adventure.isComplete) {
        adventure.isComplete = true
        // Award rewards
        this.gameState.progression.experience += adventure.rewards.experience
        this.gameState.resources.gold += adventure.rewards.gold
        
        events.push({
          timestamp: this.gameState.time.totalMinutes,
          type: 'adventure_complete',
          description: `Completed adventure: ${adventure.adventureId}`,
          data: adventure.rewards,
          importance: 'high'
        })
        
        this.gameState.processes.adventure = null
      }
    }
    
    // Regenerate energy
    this.gameState.resources.energy.current = Math.min(
      this.gameState.resources.energy.max,
      this.gameState.resources.energy.current + this.gameState.resources.energy.regenRate * deltaTime
    )
    
    return events
  }

  /**
   * Makes AI decisions based on current state and parameters
   */
  private makeDecisions(): GameAction[] {
    const actions: GameAction[] = []
    
    // Simple decision making for now
    
    // Check if we need to water crops
    const needsWatering = this.gameState.processes.crops.filter(crop => 
      crop.waterLevel < this.gameState.automation.wateringThreshold && !crop.isWithered
    )
    
    if (needsWatering.length > 0 && this.gameState.automation.wateringEnabled) {
      actions.push({
        id: `water_${Date.now()}`,
        type: 'water',
        screen: 'farm',
        target: needsWatering[0].plotId,
        duration: 1,
        energyCost: 5,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: {}
      })
    }
    
    // Check if we can harvest ready crops
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
        expectedRewards: {
          gold: 10,
          items: [readyToHarvest[0].cropId]
        }
      })
    }
    
    // Check if we should plant new crops
    const emptyPlots = this.parameters.farm.initialState.plots - this.gameState.processes.crops.length
    
    if (emptyPlots > 0 && 
        this.gameState.automation.plantingEnabled && 
        this.gameState.resources.energy.current > this.gameState.automation.energyReserve) {
      
      // Find best crop to plant based on strategy
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
    
    return actions
  }

  /**
   * Selects the best crop to plant based on current strategy
   */
  private selectCropToPlant(): string | null {
    const availableSeeds = Object.keys(this.gameState.resources.seeds).filter(
      crop => this.gameState.resources.seeds[crop] > 0
    )
    
    if (availableSeeds.length === 0) return null
    
    // Simple strategy: plant highest value crop for now
    // TODO: Implement full strategy logic based on parameters
    return availableSeeds[0]
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
        if (action.target && this.gameState.resources.seeds[action.target] > 0) {
          this.gameState.resources.seeds[action.target]--
          this.gameState.processes.crops.push({
            plotId: `plot_${this.gameState.processes.crops.length + 1}`,
            cropId: action.target,
            plantedAt: this.gameState.time.totalMinutes,
            growthTimeRequired: 120, // 2 hours base
            waterLevel: 100,
            isWithered: false,
            readyToHarvest: false
          })
          
          events.push({
            timestamp: this.gameState.time.totalMinutes,
            type: 'action_plant',
            description: `Planted ${action.target}`,
            importance: 'low'
          })
        }
        break
        
      case 'water':
        const crop = this.gameState.processes.crops.find(c => c.plotId === action.target)
        if (crop) {
          crop.waterLevel = Math.min(100, crop.waterLevel + 50)
          events.push({
            timestamp: this.gameState.time.totalMinutes,
            type: 'action_water',
            description: `Watered crop at ${action.target}`,
            importance: 'low'
          })
        }
        break
        
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
    }
    
    return { success: true, events }
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
}
