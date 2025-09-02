// FarmSystem - Phase 10B Core Game Loop System
// Complete farm management system implementing GameSystem interface

import type { GameState, CropState, GameAction, SimulationConfig, AllParameters } from '@/types'
import { 
  type GameSystem, 
  type ActionResult, 
  type SystemTickResult, 
  type ValidationResult,
  type EvaluationContext,
  createSuccessResult,
  createFailureResult,
  createTickResult
} from './GameSystem'

/**
 * Water retention upgrade configuration
 */
export const WATER_RETENTION = {
  base: {
    waterPerPlot: 1,
    durationMinutes: 30,  // Base water lasts 30 minutes
    drainRate: 1/30       // 1 water per 30 minutes
  },
  
  upgrades: {
    mulch_beds: {
      cost: 300,
      prereq: 'water_tank_ii',
      effect: {
        durationMultiplier: 1.25,  // 25% longer = 37.5 minutes
        description: 'Plots retain water 25% longer'
      }
    },
    
    irrigation_channels: {
      cost: 1500,
      prereq: ['mulch_beds', 'homestead'],
      effect: {
        durationMultiplier: 1.50,  // 50% longer = 45 minutes
        description: 'Plots retain water 50% longer'
      }
    },
    
    crystal_irrigation: {
      cost: 8000,
      prereq: ['irrigation_channels', 'manor_grounds'],
      effect: {
        durationMultiplier: 1.75,  // 75% longer = 52.5 minutes
        description: 'Plots retain water 75% longer'
      }
    }
  }
}

/**
 * Auto-pump system configuration
 */
export const AUTO_PUMP_SYSTEMS = {
  auto_pump_i: {
    cost: 200,
    prereq: 'water_tank_ii',
    materials: { copper: 5 },
    effect: {
      offlineRate: 0.10,  // 10% of cap per hour
      description: 'Generates water while offline'
    }
  },
  
  auto_pump_ii: {
    cost: 1000,
    prereq: ['auto_pump_i', 'water_tank_iii'],
    materials: { iron: 10 },
    effect: {
      offlineRate: 0.20,  // 20% of cap per hour
      description: 'Improved offline water generation'
    }
  },
  
  auto_pump_iii: {
    cost: 5000,
    prereq: ['auto_pump_ii', 'reservoir'],
    materials: { silver: 5 },
    effect: {
      offlineRate: 0.35,  // 35% of cap per hour
      description: 'Advanced offline water generation'
    }
  },
  
  crystal_pump: {
    cost: 25000,
    prereq: ['auto_pump_iii', 'crystal_reservoir'],
    materials: { crystal: 3 },
    effect: {
      offlineRate: 0.50,  // 50% of cap per hour
      description: 'Maximum offline water generation'
    }
  }
}

/**
 * Watering tool efficiency configuration
 */
export const WATERING_TOOLS = {
  hands: {
    plotsPerAction: 1,
    timePerAction: 2,  // seconds
    available: 'always'
  },
  
  watering_can_ii: {
    plotsPerAction: 2,
    timePerAction: 3,  // seconds
    craftCost: { copper: 5, wood: 3 },
    available: 'craft'
  },
  
  sprinkler_can: {
    plotsPerAction: 4,
    timePerAction: 4,  // seconds
    craftCost: { silver: 3, pine_resin: 1 },
    available: 'craft'
  },
  
  rain_bringer: {
    plotsPerAction: 8,
    timePerAction: 5,  // seconds
    craftCost: { crystal: 1, frozen_heart: 1 },
    specialEffect: 'plots_stay_wet_50_longer',
    available: 'craft'
  }
}

/**
 * Complete farm management system - implements GameSystem contract
 */
export class FarmSystem {
  // =============================================================================
  // GAMESYSTEM INTERFACE IMPLEMENTATION
  // =============================================================================

  /**
   * Evaluate farm-related actions that can be performed
   */
  static evaluateActions(
    state: GameState, 
    config: SimulationConfig | AllParameters,
    context: EvaluationContext
  ): GameAction[] {
    const actions: GameAction[] = []
    const parameters = this.extractFarmParameters(config)
    
    if (!parameters) return actions

    // Check if automation is enabled
    if (!parameters.automation?.autoPlant && !parameters.automation?.autoWater && !parameters.automation?.autoHarvest) {
      return actions
    }

    // Evaluate planting actions
    if (parameters.automation?.autoPlant && context.availableEnergy > 10) {
      const plantingActions = this.evaluatePlantingActions(state, parameters, context)
      actions.push(...plantingActions)
    }

    // Evaluate watering actions
    if (parameters.automation?.autoWater && state.resources.water.current > 0) {
      const wateringActions = this.evaluateWateringActions(state, parameters, context)
      actions.push(...wateringActions)
    }

    // Evaluate harvest actions
    if (parameters.automation?.autoHarvest) {
      const harvestActions = this.evaluateHarvestActions(state, parameters, context)
      actions.push(...harvestActions)
    }

    // Evaluate pump actions if water is low
    if (state.resources.water.current < state.resources.water.max * 0.3) {
      const pumpActions = this.evaluatePumpActions(state, parameters, context)
      actions.push(...pumpActions)
    }

    return actions
  }

  /**
   * Execute a farm-related action
   */
  static execute(action: GameAction, state: GameState): ActionResult {
    try {
      switch (action.type) {
        case 'plant':
          return this.executePlantAction(action, state)
        case 'water':
          return this.executeWaterAction(action, state)
        case 'harvest':
          return this.executeHarvestAction(action, state)
        case 'pump':
          return this.executePumpAction(action, state)
        default:
          return createFailureResult(`Unknown farm action type: ${action.type}`)
      }
    } catch (error) {
      return createFailureResult(`Error executing farm action: ${error}`)
    }
  }

  /**
   * Process farm systems during simulation tick
   */
  static tick(deltaTime: number, state: GameState): SystemTickResult {
    const stateChanges: Record<string, any> = {}
    const events: any[] = []

    try {
      // Process crop growth
      this.processCropGrowth(state, deltaTime, null)
      
      // Process auto-pump generation
      const pumpResult = this.processAutoPumpGeneration(state, deltaTime)
      if (pumpResult.waterGenerated > 0) {
        events.push({
          type: 'water_generated',
          description: `Auto-pump generated ${pumpResult.waterGenerated} water`,
          importance: 'low'
        })
      }

      // Check for crops that need attention
      const criticalCrops = this.getCriticallyDryCrops(state)
      if (criticalCrops.length > 0) {
        events.push({
          type: 'crops_dry',
          description: `${criticalCrops.length} crops need watering urgently`,
          importance: 'medium'
        })
      }

      const readyCrops = this.getReadyToHarvestCrops(state)
      if (readyCrops.length > 0) {
        events.push({
          type: 'crops_ready',
          description: `${readyCrops.length} crops are ready for harvest`,
          importance: 'medium'
        })
      }

    } catch (error) {
      events.push({
        type: 'farm_error',
        description: `Error in farm tick: ${error}`,
        importance: 'high'
      })
    }

    return createTickResult(stateChanges, events)
  }

  /**
   * Validate if a farm action can be executed
   */
  static canExecute(action: GameAction, state: GameState): ValidationResult {
    switch (action.type) {
      case 'plant':
        return this.canPlant(action, state)
      case 'water':
        return this.canWater(action, state)
      case 'harvest':
        return this.canHarvest(action, state)
      case 'pump':
        return this.canPump(action, state)
      default:
        return { canExecute: false, reason: `Unknown action type: ${action.type}` }
    }
  }

  // =============================================================================
  // PARAMETER EXTRACTION
  // =============================================================================

  /**
   * Extract farm parameters from configuration
   */
  private static extractFarmParameters(config: SimulationConfig | AllParameters): any {
    if ('farm' in config) {
      return config.farm
    }
    if ('parameterOverrides' in config && config.parameterOverrides) {
      // Extract from simulation config - simplified for now
      return {
        automation: { autoPlant: true, autoWater: true, autoHarvest: true },
        priorities: { cropPreference: ['carrot', 'radish'], wateringThreshold: 0.3 }
      }
    }
    return null
  }

  // =============================================================================
  // ACTION EVALUATION METHODS
  // =============================================================================

  /**
   * Evaluate planting actions
   */
  private static evaluatePlantingActions(
    state: GameState, 
    parameters: any, 
    context: EvaluationContext
  ): GameAction[] {
    const actions: GameAction[] = []
    
    // Find available plots
    const availablePlots = state.progression.availablePlots
    const currentCrops = state.processes.crops.length
    const freePlots = availablePlots - currentCrops

    if (freePlots > 0 && state.resources.energy.current > 5) {
      // Choose crop based on preferences
      const preferredCrops = parameters.priorities?.cropPreference || ['carrot', 'radish']
      const cropToPlant = preferredCrops[0] || 'carrot'

      // Check if we have seeds
      const seedCount = state.resources.seeds.get(cropToPlant) || 0
      if (seedCount > 0) {
        actions.push({
          id: `plant_${cropToPlant}_${Date.now()}`,
          type: 'plant',
          screen: 'farm',
          target: cropToPlant,
          duration: 2,
          energyCost: 5,
          goldCost: 0,
          prerequisites: [],
          expectedRewards: {},
          score: 300 + (freePlots * 50) // Higher score for more free plots
        })
      }
    }

    return actions
  }

  /**
   * Evaluate watering actions
   */
  private static evaluateWateringActions(
    state: GameState, 
    parameters: any, 
    context: EvaluationContext
  ): GameAction[] {
    const actions: GameAction[] = []
    
    const dryCrops = this.getCriticallyDryCrops(state)
    const wateringThreshold = parameters.priorities?.wateringThreshold || 0.3

    if (dryCrops.length > 0 && state.resources.water.current > 0) {
      actions.push({
        id: `water_crops_${Date.now()}`,
        type: 'water',
        screen: 'farm',
        target: 'all_dry',
        duration: Math.min(dryCrops.length * 0.5, 5), // 0.5 min per crop, max 5 min
        energyCost: 0,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: {},
        score: 400 + (dryCrops.length * 100) // High priority for watering
      })
    }

    return actions
  }

  /**
   * Evaluate harvest actions
   */
  private static evaluateHarvestActions(
    state: GameState, 
    parameters: any, 
    context: EvaluationContext
  ): GameAction[] {
    const actions: GameAction[] = []
    
    const readyCrops = this.getReadyToHarvestCrops(state)

    if (readyCrops.length > 0) {
      actions.push({
        id: `harvest_crops_${Date.now()}`,
        type: 'harvest',
        screen: 'farm',
        target: 'ready',
        duration: readyCrops.length * 0.5, // 0.5 min per crop
        energyCost: readyCrops.length * 2, // 2 energy per crop
        goldCost: 0,
        prerequisites: [],
        expectedRewards: {
          items: ['crops'],
          experience: readyCrops.length * 10
        },
        score: 500 + (readyCrops.length * 100) // Very high priority
      })
    }

    return actions
  }

  /**
   * Evaluate pump actions
   */
  private static evaluatePumpActions(
    state: GameState, 
    parameters: any, 
    context: EvaluationContext
  ): GameAction[] {
    const actions: GameAction[] = []
    
    const waterPercent = state.resources.water.current / state.resources.water.max
    
    if (waterPercent < 0.3 && state.resources.energy.current > 10) {
      actions.push({
        id: `pump_water_${Date.now()}`,
        type: 'pump',
        screen: 'farm',
        target: 'well',
        duration: 3,
        energyCost: 10,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: {
          water: Math.min(20, state.resources.water.max - state.resources.water.current)
        },
        score: 350 - (waterPercent * 100) // Higher score when water is lower
      })
    }

    return actions
  }

  // =============================================================================
  // ACTION EXECUTION METHODS
  // =============================================================================

  /**
   * Execute planting action
   */
  private static executePlantAction(action: GameAction, state: GameState): ActionResult {
    const cropType = action.target
    if (!cropType) {
      return createFailureResult('No crop type specified for planting')
    }

    // Check if we have seeds
    const seedCount = state.resources.seeds.get(cropType) || 0
    if (seedCount <= 0) {
      return createFailureResult(`No ${cropType} seeds available`)
    }

    // Check energy
    if (state.resources.energy.current < action.energyCost) {
      return createFailureResult('Not enough energy to plant')
    }

    // Check available plots
    const availablePlots = state.progression.availablePlots
    const currentCrops = state.processes.crops.length
    if (currentCrops >= availablePlots) {
      return createFailureResult('No free plots available')
    }

    // Execute planting
    const plotId = `plot_${currentCrops + 1}`
    const newCrop: CropState = {
      plotId,
      cropId: cropType,
      plantedAt: state.time.totalMinutes,
      growthTimeRequired: 10, // Default, should be from CSV
      waterLevel: 1.0,
      isWithered: false,
      readyToHarvest: false,
      growthProgress: 0,
      growthStage: 0,
      maxStages: 3,
      droughtTime: 0
    }

    state.processes.crops.push(newCrop)
    state.resources.seeds.set(cropType, seedCount - 1)
    state.resources.energy.current -= action.energyCost

    return createSuccessResult(
      `Planted ${cropType} in ${plotId}`,
      {
        'processes.crops': state.processes.crops,
        [`resources.seeds.${cropType}`]: seedCount - 1,
        'resources.energy.current': state.resources.energy.current
      }
    )
  }

  /**
   * Execute watering action
   */
  private static executeWaterAction(action: GameAction, state: GameState): ActionResult {
    const waterNeeded = this.calculateTotalWaterNeeded(state)
    const waterAvailable = state.resources.water.current
    const waterToUse = Math.min(waterNeeded, waterAvailable)

    if (waterToUse <= 0) {
      return createFailureResult('No water available or no crops need watering')
    }

    // Distribute water to crops
    const result = this.distributeWaterToCrops(state, waterToUse)
    state.resources.water.current -= result.waterUsed

    return createSuccessResult(
      `Watered ${result.plotsWatered} plots using ${result.waterUsed} water`,
      {
        'resources.water.current': state.resources.water.current,
        'processes.crops': state.processes.crops
      }
    )
  }

  /**
   * Execute harvest action
   */
  private static executeHarvestAction(action: GameAction, state: GameState): ActionResult {
    const readyCrops = this.getReadyToHarvestCrops(state)
    
    if (readyCrops.length === 0) {
      return createFailureResult('No crops ready for harvest')
    }

    if (state.resources.energy.current < action.energyCost) {
      return createFailureResult('Not enough energy to harvest')
    }

    // Remove harvested crops and add rewards
    let totalExperience = 0
    let totalGold = 0
    const harvestedCrops: string[] = []

    for (const crop of readyCrops) {
      // Remove crop from active crops
      const cropIndex = state.processes.crops.findIndex(c => c.plotId === crop.plotId)
      if (cropIndex >= 0) {
        state.processes.crops.splice(cropIndex, 1)
        harvestedCrops.push(crop.cropId)
        totalExperience += 10
        totalGold += 5
      }
    }

    state.resources.energy.current -= action.energyCost
    state.progression.experience += totalExperience
    state.resources.gold += totalGold

    return createSuccessResult(
      `Harvested ${harvestedCrops.length} crops: ${harvestedCrops.join(', ')}`,
      {
        'processes.crops': state.processes.crops,
        'resources.energy.current': state.resources.energy.current,
        'progression.experience': state.progression.experience,
        'resources.gold': state.resources.gold
      }
    )
  }

  /**
   * Execute pump action
   */
  private static executePumpAction(action: GameAction, state: GameState): ActionResult {
    if (state.resources.energy.current < action.energyCost) {
      return createFailureResult('Not enough energy to pump water')
    }

    const waterSpace = state.resources.water.max - state.resources.water.current
    const waterGained = Math.min(20, waterSpace) // Gain up to 20 water

    if (waterGained <= 0) {
      return createFailureResult('Water tank is already full')
    }

    state.resources.water.current += waterGained
    state.resources.energy.current -= action.energyCost

    return createSuccessResult(
      `Pumped ${waterGained} water`,
      {
        'resources.water.current': state.resources.water.current,
        'resources.energy.current': state.resources.energy.current
      }
    )
  }

  // =============================================================================
  // VALIDATION METHODS
  // =============================================================================

  /**
   * Validate planting action
   */
  private static canPlant(action: GameAction, state: GameState): ValidationResult {
    const cropType = action.target
    if (!cropType) {
      return { canExecute: false, reason: 'No crop type specified' }
    }

    // Check seeds
    const seedCount = state.resources.seeds.get(cropType) || 0
    if (seedCount <= 0) {
      return { 
        canExecute: false, 
        reason: 'No seeds available',
        missingResources: { [cropType]: 1 }
      }
    }

    // Check energy
    if (state.resources.energy.current < action.energyCost) {
      return { 
        canExecute: false, 
        reason: 'Not enough energy',
        missingResources: { energy: action.energyCost - state.resources.energy.current }
      }
    }

    // Check available plots
    const availablePlots = state.progression.availablePlots
    const currentCrops = state.processes.crops.length
    if (currentCrops >= availablePlots) {
      return { canExecute: false, reason: 'No free plots available' }
    }

    return { canExecute: true }
  }

  /**
   * Validate watering action
   */
  private static canWater(action: GameAction, state: GameState): ValidationResult {
    if (state.resources.water.current <= 0) {
      return { 
        canExecute: false, 
        reason: 'No water available',
        missingResources: { water: 1 }
      }
    }

    const dryCrops = this.getCriticallyDryCrops(state)
    if (dryCrops.length === 0) {
      return { canExecute: false, reason: 'No crops need watering' }
    }

    return { canExecute: true }
  }

  /**
   * Validate harvest action
   */
  private static canHarvest(action: GameAction, state: GameState): ValidationResult {
    const readyCrops = this.getReadyToHarvestCrops(state)
    if (readyCrops.length === 0) {
      return { canExecute: false, reason: 'No crops ready for harvest' }
    }

    if (state.resources.energy.current < action.energyCost) {
      return { 
        canExecute: false, 
        reason: 'Not enough energy',
        missingResources: { energy: action.energyCost - state.resources.energy.current }
      }
    }

    return { canExecute: true }
  }

  /**
   * Validate pump action
   */
  private static canPump(action: GameAction, state: GameState): ValidationResult {
    if (state.resources.energy.current < action.energyCost) {
      return { 
        canExecute: false, 
        reason: 'Not enough energy',
        missingResources: { energy: action.energyCost - state.resources.energy.current }
      }
    }

    if (state.resources.water.current >= state.resources.water.max) {
      return { canExecute: false, reason: 'Water tank is already full' }
    }

    return { canExecute: true }
  }

  // =============================================================================
  // CROP MANAGEMENT
  // =============================================================================

  /**
   * Process crop growth for all active crops
   * @param gameState Current game state
   * @param deltaMinutes Time elapsed since last update
   * @param gameDataStore Data store for crop information
   */
  static processCropGrowth(gameState: GameState, deltaMinutes: number, gameDataStore: any) {
    for (const crop of gameState.processes.crops) {
      if (!crop.cropId || crop.readyToHarvest) continue
      
      // Get crop data from CSV
      const cropData = gameDataStore.getItemById(crop.cropId)
      if (!cropData) continue
      
      // Parse growth time and stages from CSV data
      const growthTime = parseInt(cropData.time) || 10
      const stages = this.parseGrowthStages(cropData.notes) || 3
      
      // Ensure crop has required fields (migration from old format)
      if (crop.maxStages === undefined) {
        crop.maxStages = stages
        crop.growthProgress = crop.growthProgress || 0
        crop.growthStage = crop.growthStage || 0
        crop.droughtTime = crop.droughtTime || 0
        
        // Convert old waterLevel (0-100) to new format (0-1) if needed
        if (crop.waterLevel > 1) {
          crop.waterLevel = crop.waterLevel / 100
        }
      }
      
      // Process water drainage using retention upgrades
      this.processWaterDrainage(crop, deltaMinutes, gameState)
      
      // Calculate growth rate based on water availability (Phase 8N: 75% slower when dry)
      const growthRate = crop.waterLevel > 0.3 ? 1.0 : 0.25  // Changed from 0.5 to 0.25 (75% slower)
      
      // Update growth progress
      const growthIncrement = (deltaMinutes / growthTime) * growthRate
      crop.growthProgress = Math.min(1.0, crop.growthProgress + growthIncrement)
      
      // Update visual growth stage
      crop.growthStage = Math.min(crop.maxStages, Math.floor(crop.growthProgress * crop.maxStages))
      
      // Check if crop is ready for harvest
      if (crop.growthProgress >= 1.0) {
        crop.readyToHarvest = true
      }
    }
  }

  /**
   * Parse growth stages from crop notes field
   * @param notes Notes field from CSV (e.g., "Growth Stages 3 + Gain Energy On Harvest")
   * @returns Number of growth stages
   */
  private static parseGrowthStages(notes: string): number {
    if (!notes) return 3 // Default to 3 stages
    
    const match = notes.match(/Growth Stages (\d+)/i)
    return match ? parseInt(match[1]) : 3
  }

  /**
   * Get crops that are critically dry (need immediate watering)
   * @param gameState Current game state
   * @returns Array of crops with waterLevel < 0.2
   */
  static getCriticallyDryCrops(gameState: GameState): CropState[] {
    return gameState.processes.crops.filter(crop => 
      crop.waterLevel < 0.2
    )
  }

  /**
   * Get crops that are ready for harvest
   * @param gameState Current game state
   * @returns Array of crops ready to harvest
   */
  static getReadyToHarvestCrops(gameState: GameState): CropState[] {
    return gameState.processes.crops.filter(crop => 
      crop.readyToHarvest
    )
  }

  /**
   * Calculate total water needed to fully water all crops
   * @param gameState Current game state
   * @returns Total water needed
   */
  static calculateTotalWaterNeeded(gameState: GameState): number {
    return gameState.processes.crops
      .reduce((total, crop) => total + (1.0 - crop.waterLevel), 0)
  }

  // =============================================================================
  // WATER MANAGEMENT
  // =============================================================================

  /**
   * Calculate water retention duration based on upgrades
   */
  static calculateWaterDuration(baseMinutes: number, gameState: GameState): number {
    const retentionMultiplier = this.getRetentionMultiplier(gameState)
    return baseMinutes * retentionMultiplier
  }

  /**
   * Get water retention multiplier based on unlocked upgrades
   */
  static getRetentionMultiplier(gameState: GameState): number {
    const upgrades = gameState.progression.unlockedUpgrades
    
    // Check upgrades in order (higher tier overrides lower)
    if (upgrades.includes('crystal_irrigation')) {
      return WATER_RETENTION.upgrades.crystal_irrigation.effect.durationMultiplier
    }
    if (upgrades.includes('irrigation_channels')) {
      return WATER_RETENTION.upgrades.irrigation_channels.effect.durationMultiplier
    }
    if (upgrades.includes('mulch_beds')) {
      return WATER_RETENTION.upgrades.mulch_beds.effect.durationMultiplier
    }
    
    return 1.0 // Base retention (no upgrades)
  }

  /**
   * Process water drainage for crops with retention upgrades
   */
  static processWaterDrainage(crop: CropState, deltaTime: number, gameState: GameState): void {
    if (!crop.cropId) return
    
    const retentionMultiplier = this.getRetentionMultiplier(gameState)
    const baseDrainRate = WATER_RETENTION.base.drainRate
    
    // Apply retention multiplier to reduce drain rate
    const actualDrainRate = baseDrainRate / retentionMultiplier
    
    // Process drainage
    const waterLoss = actualDrainRate * deltaTime / 60 // Convert to per-minute rate
    crop.waterLevel = Math.max(0, Math.round((crop.waterLevel - waterLoss) * 10000) / 10000) // Fix floating point precision
    
    // Update drought time tracking
    if (crop.waterLevel <= 0) {
      crop.droughtTime = (crop.droughtTime || 0) + deltaTime
    } else {
      crop.droughtTime = 0
    }
  }

  /**
   * Distribute water to crops that need it most
   * @param gameState Current game state
   * @param waterAmount Total amount of water to distribute
   * @returns Amount of water actually used
   */
  static distributeWater(gameState: GameState, waterAmount: number): number {
    const result = this.distributeWaterToCrops(gameState, waterAmount)
    return result.waterUsed
  }

  /**
   * Distribute water efficiently to crops that need it most
   */
  static distributeWaterToCrops(gameState: GameState, waterAmount: number): {
    waterUsed: number
    plotsWatered: number
    priorities: string[]
  } {
    const cropsNeedingWater = gameState.processes.crops
      .filter(crop => crop.waterLevel < 1.0 && crop.cropId) // Only crops with plants
      .sort((a, b) => a.waterLevel - b.waterLevel) // Driest first
    
    if (cropsNeedingWater.length === 0) {
      return { waterUsed: 0, plotsWatered: 0, priorities: [] }
    }
    
    let waterUsed = 0
    let plotsWatered = 0
    const priorities: string[] = []
    
    // Prioritize critically dry plots first
    const criticalPlots = cropsNeedingWater.filter(crop => crop.waterLevel < 0.2)
    const normalPlots = cropsNeedingWater.filter(crop => crop.waterLevel >= 0.2)
    
    const allPlots = [...criticalPlots, ...normalPlots]
    
    for (const crop of allPlots) {
      if (waterUsed >= waterAmount) break
      
      const waterNeeded = 1.0 - crop.waterLevel
      const waterToGive = Math.min(waterNeeded, waterAmount - waterUsed, 1.0)
      
      if (waterToGive > 0) {
        crop.waterLevel = Math.min(1.0, Math.round((crop.waterLevel + waterToGive) * 10000) / 10000) // Fix floating point precision
        waterUsed = Math.round((waterUsed + waterToGive) * 10000) / 10000 // Fix floating point precision
        plotsWatered++
        
        const priority = crop.waterLevel < 0.2 ? 'critical' : 'normal'
        priorities.push(`${crop.cropId}:${priority}`)
      }
    }
    
    return { waterUsed, plotsWatered, priorities }
  }

  /**
   * Calculate offline water generation from auto-pumps
   */
  static calculateOfflineWater(timeDeltaMinutes: number, waterCapacity: number, gameState: GameState): {
    generated: number
    message: string
    pumpLevel: string | null
  } {
    const hoursOffline = timeDeltaMinutes / 60
    const pumpLevel = this.getHighestPumpLevel(gameState)
    
    if (!pumpLevel) {
      return { generated: 0, message: '', pumpLevel: null }
    }
    
    const pumpRate = AUTO_PUMP_SYSTEMS[pumpLevel].effect.offlineRate
    const waterGenerated = waterCapacity * pumpRate * hoursOffline
    const actualGenerated = Math.min(waterGenerated, waterCapacity)
    
    return {
      generated: Math.floor(actualGenerated),
      message: `${pumpLevel} generated ${Math.floor(actualGenerated)} water while away`,
      pumpLevel
    }
  }

  /**
   * Get the highest level auto-pump that the player owns
   */
  static getHighestPumpLevel(gameState: GameState): keyof typeof AUTO_PUMP_SYSTEMS | null {
    const upgrades = gameState.progression.unlockedUpgrades
    
    // Check in descending order of quality
    const pumpOrder: (keyof typeof AUTO_PUMP_SYSTEMS)[] = [
      'crystal_pump',
      'auto_pump_iii', 
      'auto_pump_ii',
      'auto_pump_i'
    ]
    
    for (const pump of pumpOrder) {
      if (upgrades.includes(pump)) {
        return pump
      }
    }
    
    return null
  }

  /**
   * Calculate watering efficiency based on equipped tools and helpers
   */
  static calculateWateringEfficiency(gameState: GameState): {
    totalPlotsPerMinute: number
    waterConsumed: number
    toolEfficiency: number
  } {
    const tools = gameState.inventory.tools
    let toolData = WATERING_TOOLS.hands // Default to hands
    
    // Check for equipped watering tools (best tool wins)
    const toolOrder = ['rain_bringer', 'sprinkler_can', 'watering_can_ii'] as const
    for (const toolName of toolOrder) {
      if (tools.has(toolName) && tools.get(toolName)?.isEquipped) {
        toolData = WATERING_TOOLS[toolName]
        break
      }
    }
    
    // Calculate base efficiency from tool
    const plotsPerMinute = (60 / toolData.timePerAction) * toolData.plotsPerAction
    
    // Add helper contribution (waterer helpers)
    const watererHelpers = gameState.helpers.gnomes.filter(
      g => g.isAssigned && g.role === 'waterer'
    )
    
    let helperPlots = 0
    for (const helper of watererHelpers) {
      // Assume level 1 helpers for now, or add level to GnomeState type
      const helperLevel = 1 
      helperPlots += 5 + helperLevel // 5-15 plots/min based on level
    }
    
    const totalPlotsPerMinute = plotsPerMinute + helperPlots
    const waterConsumed = totalPlotsPerMinute // 1 water per plot
    
    return {
      totalPlotsPerMinute,
      waterConsumed,
      toolEfficiency: plotsPerMinute / WATERING_TOOLS.hands.plotsPerAction // Efficiency relative to hands
    }
  }

  /**
   * Process automatic water generation from pumps (per-tick)
   */
  static processAutoPumpGeneration(gameState: GameState, deltaTime: number): {
    waterGenerated: number
    pumpLevel: string | null
  } {
    const pumpLevel = this.getHighestPumpLevel(gameState)
    
    if (!pumpLevel) {
      return { waterGenerated: 0, pumpLevel: null }
    }
    
    // Convert offline rate to per-minute rate
    const pumpRate = AUTO_PUMP_SYSTEMS[pumpLevel].effect.offlineRate
    const waterPerMinute = (gameState.resources.water.max * pumpRate) / 60
    const waterGenerated = waterPerMinute * deltaTime
    
    // Apply water to current resources (capped at max)
    const currentWater = gameState.resources.water.current
    const maxWater = gameState.resources.water.max
    const actualGenerated = Math.min(waterGenerated, maxWater - currentWater)
    
    if (actualGenerated > 0) {
      gameState.resources.water.current += actualGenerated
    }
    
    return {
      waterGenerated: Math.floor(actualGenerated * 10) / 10, // Round to 1 decimal
      pumpLevel
    }
  }

  // =============================================================================
  // INTEGRATED METRICS
  // =============================================================================

  /**
   * Get comprehensive farm metrics combining crops and water
   * @param gameState Current game state
   * @returns Detailed metrics for decision making
   */
  static getFarmMetrics(gameState: GameState): {
    totalCrops: number
    dryPlots: number
    criticalPlots: number
    readyToHarvest: number
    averageWaterLevel: number
    retentionMultiplier: number
    growthEfficiency: number
    waterPercent: number
    pumpLevel: string | null
    toolEfficiency: number
  } {
    const crops = gameState.processes.crops
    const totalCrops = crops.length
    const dryPlots = crops.filter(crop => crop.waterLevel < 0.5).length
    const criticalPlots = crops.filter(crop => crop.waterLevel < 0.2).length
    const readyToHarvest = crops.filter(crop => crop.readyToHarvest).length
    
    const averageWaterLevel = totalCrops > 0 ? 
      crops.reduce((sum, crop) => sum + crop.waterLevel, 0) / totalCrops : 0
    
    const retentionMultiplier = this.getRetentionMultiplier(gameState)
    
    // Calculate overall growth efficiency (how many crops are growing at full rate)
    const fullGrowthCrops = crops.filter(crop => crop.waterLevel > 0.3).length
    const growthEfficiency = totalCrops > 0 ? fullGrowthCrops / totalCrops : 1.0
    
    // Water metrics
    const water = gameState.resources.water
    const waterPercent = water.current / water.max
    const pumpLevel = this.getHighestPumpLevel(gameState)
    const efficiency = this.calculateWateringEfficiency(gameState)
    
    return {
      totalCrops,
      dryPlots,
      criticalPlots,
      readyToHarvest,
      averageWaterLevel: Math.round(averageWaterLevel * 100) / 100,
      retentionMultiplier,
      growthEfficiency: Math.round(growthEfficiency * 100) / 100,
      waterPercent,
      pumpLevel,
      toolEfficiency: efficiency.toolEfficiency
    }
  }
}
