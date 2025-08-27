// SimulationEngine - Phase 6A Core Implementation
// Main simulation engine that runs the game logic

import { MapSerializer } from './MapSerializer'
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
          regenRate: 1 // 1 energy per minute base
        },
        gold: 100, // Starting gold
        water: {
          current: farmParams.initialState.water,
          max: farmParams.waterSystem.maxWaterStorage,
          pumpRate: 10 * farmParams.waterSystem.pumpEfficiency
        },
        seeds: {
          'turnip': 12,
          'beet': 8,
          'carrot': 5,
          'potato': 15
        },
        materials: {
          'wood': 25,
          'stone': 18,
          'iron': 7,
          'silver': 2
        }
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
    
    // Comprehensive decision making using parameter system
    
    // 1. Emergency actions first (based on decision parameters)
    if (this.parameters.decisions?.interrupts?.enabled) {
      const emergencyActions = this.evaluateEmergencyActions()
      actions.push(...emergencyActions)
    }
    
    // 2. Screen-specific actions based on current location
    const screenActions = this.evaluateScreenActions()
    actions.push(...screenActions)
    
    // 3. Screen navigation decisions
    const navigationActions = this.evaluateNavigationActions()
    actions.push(...navigationActions)
    
    // 4. Score and prioritize all actions
    const scoredActions = actions.map(action => ({
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
    
    return actions
  }

  /**
   * Placeholder methods for other screen actions
   */
  private evaluateTowerActions(): GameAction[] { return [] }
  private evaluateTownActions(): GameAction[] { return [] }
  private evaluateAdventureActions(): GameAction[] { return [] }
  private evaluateForgeActions(): GameAction[] { return [] }
  private evaluateMineActions(): GameAction[] { return [] }

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
        const totalSeeds = Object.values(this.gameState.resources.seeds).reduce((a, b) => a + b, 0)
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
    const availableSeeds = Object.keys(this.gameState.resources.seeds).filter(
      crop => this.gameState.resources.seeds[crop] > 0
    )
    
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
