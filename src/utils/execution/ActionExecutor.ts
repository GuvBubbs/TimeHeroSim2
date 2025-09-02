// ActionExecutor - Centralized action execution system
// Phase 9E Implementation

import type { GameAction, GameState, GameEvent, AllParameters } from '../../types'
import type { ActionResult, ExecutionContext } from './types/ActionResult'
import { ActionValidator } from './ActionValidator'
import { CSVDataParser } from '../CSVDataParser'
import { PrerequisiteSystem } from '../systems/PrerequisiteSystem'
import { CropSystem } from '../systems/CropSystem'
import { SeedSystem, MANUAL_CATCHING } from '../systems/SeedSystem'
import { AdventureSystem } from '../systems/AdventureSystem'

/**
 * Core action execution engine
 */
export class ActionExecutor {
  private validator: ActionValidator

  constructor() {
    this.validator = new ActionValidator()
  }

  /**
   * Execute a single action
   */
  execute(action: GameAction, gameState: GameState, parameters: AllParameters, gameDataStore: any): ActionResult {
    const context: ExecutionContext = {
      gameState,
      parameters,
      gameDataStore,
      timestamp: gameState.time.totalMinutes
    }

    // Validate action
    const validation = this.validator.validate(action, context)
    if (!validation.isValid) {
      return {
        success: false,
        events: [],
        error: validation.errors.join(', ')
      }
    }

    // Execute based on action type
    try {
      switch (action.type) {
        case 'plant':
          return this.executePlantAction(action, context)
        case 'harvest':
          return this.executeHarvestAction(action, context)
        case 'water':
          return this.executeWaterAction(action, context)
        case 'pump':
          return this.executePumpAction(action, context)
        case 'cleanup':
          return this.executeCleanupAction(action, context)
        case 'move':
          return this.executeMoveAction(action, context)
        case 'catch_seeds':
          return this.executeCatchSeedsAction(action, context)
        case 'purchase':
          return this.executePurchaseAction(action, context)
        case 'adventure':
          return this.executeAdventureAction(action, context)
        case 'build':
          return this.executeBuildAction(action, context)
        case 'craft':
          return this.executeCraftAction(action, context)
        case 'mine':
          return this.executeMineAction(action, context)
        case 'assign_role':
          return this.executeAssignHelperAction(action, context)
        case 'train_helper':
          return this.executeTrainHelperAction(action, context)
        case 'train':
          return this.executeTrainAction(action, context)
        case 'stoke':
          return this.executeStokeAction(action, context)
        case 'rescue':
          return this.executeRescueAction(action, context)
        case 'sell_material':
          return this.executeSellMaterialAction(action, context)
        case 'wait':
          return this.executeWaitAction(action, context)
        default:
          return {
            success: false,
            events: [],
            error: `Unknown action type: ${action.type}`
          }
      }
    } catch (error) {
      return {
        success: false,
        events: [],
        error: `Execution failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  // =====================================================================
  // ACTION EXECUTION METHODS (Extracted from SimulationEngine)
  // =====================================================================

  private executePlantAction(action: GameAction, context: ExecutionContext): ActionResult {
    const events: GameEvent[] = []

    if (!action.target) {
      return { success: false, events: [], error: 'No crop type specified' }
    }

    // Consume energy and seed
    context.gameState.resources.energy.current -= action.energyCost
    const currentSeeds = context.gameState.resources.seeds.get(action.target) || 0
    context.gameState.resources.seeds.set(action.target, currentSeeds - 1)

    // Get crop data for accurate growth info
    const cropData = context.gameDataStore.getItemById(action.target)
    const growthTime = cropData ? parseInt(cropData.time) || 10 : 10
    const stages = cropData ? this.parseGrowthStages(cropData.notes) : 3

    // Plant crop
    const plotId = `plot_${context.gameState.processes.crops.length + 1}`
    context.gameState.processes.crops.push({
      plotId: plotId,
      cropId: action.target,
      plantedAt: context.gameState.time.totalMinutes,
      growthTimeRequired: growthTime,
      waterLevel: 1.0,
      isWithered: false,
      readyToHarvest: false,
      growthProgress: 0,
      growthStage: 0,
      maxStages: stages,
      droughtTime: 0
    })

    const totalPlots = context.gameState.progression.farmPlots || 3
    const activeCrops = context.gameState.processes.crops.length

    events.push({
      timestamp: context.gameState.time.totalMinutes,
      type: 'action_plant',
      description: `Planted ${action.target} in ${plotId} (${growthTime}min growth) - ${activeCrops}/${totalPlots} plots active`,
      importance: 'medium'
    })

    return { success: true, events }
  }

  private executeHarvestAction(action: GameAction, context: ExecutionContext): ActionResult {
    const events: GameEvent[] = []

    if (!action.target) {
      return { success: false, events: [], error: 'No plot specified for harvest' }
    }

    // Find and validate crop
    const harvestCrop = context.gameState.processes.crops.find((c: any) => c.plotId === action.target)
    if (!harvestCrop || !harvestCrop.readyToHarvest) {
      return { success: false, events: [], error: `No ready crop at ${action.target}` }
    }

    // Consume energy
    context.gameState.resources.energy.current -= action.energyCost

    // Remove crop from processes
    context.gameState.processes.crops = context.gameState.processes.crops.filter(
      (c: any) => c.plotId !== action.target
    )

    // Get energy value from crop data
    const cropData = context.gameDataStore.getItemById(harvestCrop.cropId)
    const energyValue = cropData ? (parseInt(cropData.effect) || 1) : 1

    // Add energy (capped at max)
    context.gameState.resources.energy.current = Math.min(
      context.gameState.resources.energy.max,
      context.gameState.resources.energy.current + energyValue
    )

    events.push({
      timestamp: context.gameState.time.totalMinutes,
      type: 'action_harvest',
      description: `Harvested ${harvestCrop.cropId} for +${energyValue} energy`,
      importance: 'medium'
    })

    return { success: true, events }
  }

  private executeWaterAction(action: GameAction, context: ExecutionContext): ActionResult {
    const events: GameEvent[] = []

    // Determine water amount based on tool equipped
    let waterAmount = 1.0
    const tools = context.gameState.inventory.tools
    if (tools.has('rain_bringer') && tools.get('rain_bringer')?.isEquipped) {
      waterAmount = 8.0
    } else if (tools.has('sprinkler_can') && tools.get('sprinkler_can')?.isEquipped) {
      waterAmount = 4.0
    } else if (tools.has('watering_can_ii') && tools.get('watering_can_ii')?.isEquipped) {
      waterAmount = 2.0
    }

    // Use CropSystem to distribute water efficiently
    const waterUsed = CropSystem.distributeWater(context.gameState, waterAmount)

    if (waterUsed > 0) {
      // Consume water and energy
      context.gameState.resources.water.current = Math.max(0, 
        context.gameState.resources.water.current - waterUsed
      )
      context.gameState.resources.energy.current -= action.energyCost

      events.push({
        timestamp: context.gameState.time.totalMinutes,
        type: 'action_water',
        description: `Watered crops using ${waterUsed.toFixed(1)} water`,
        importance: 'low'
      })

      return { success: true, events }
    }

    return { success: false, events: [], error: 'No crops needed watering' }
  }

  private executePumpAction(action: GameAction, context: ExecutionContext): ActionResult {
    const events: GameEvent[] = []

    // Determine pump rate based on upgrades
    let pumpRate = 2
    const upgrades = context.gameState.progression.unlockedUpgrades
    if (upgrades.includes('crystal_pump')) {
      pumpRate = 60
    } else if (upgrades.includes('steam_pump')) {
      pumpRate = 30
    } else if (upgrades.includes('well_pump_iii')) {
      pumpRate = 15
    } else if (upgrades.includes('well_pump_ii')) {
      pumpRate = 8
    } else if (upgrades.includes('well_pump_i')) {
      pumpRate = 4
    }

    // Add water (limited by capacity)
    const waterToAdd = Math.min(pumpRate, 
      context.gameState.resources.water.max - context.gameState.resources.water.current
    )

    context.gameState.resources.water.current += waterToAdd

    events.push({
      timestamp: context.gameState.time.totalMinutes,
      type: 'action_pump',
      description: `Pumped ${waterToAdd} water`,
      importance: 'low'
    })

    return { success: true, events }
  }

  private executeCleanupAction(action: GameAction, context: ExecutionContext): ActionResult {
    const events: GameEvent[] = []

    if (!action.target) {
      return { success: false, events: [], error: 'No cleanup target specified' }
    }

    // Get cleanup data
    const cleanup = context.gameDataStore.getItemById(action.target)
    if (!cleanup) {
      return { success: false, events: [], error: `Cleanup ${action.target} not found` }
    }

    // Parse and consume energy
    const energyCost = CSVDataParser.parseNumericValue(cleanup.energy_cost, 0)
    context.gameState.resources.energy.current -= energyCost

    // Add plots to farm
    const plotsAdded = CSVDataParser.parseNumericValue(cleanup.plots_added, 0)
    if (plotsAdded > 0) {
      context.gameState.progression.farmPlots += plotsAdded
      context.gameState.progression.availablePlots += plotsAdded
    }

    // Mark cleanup as completed
    context.gameState.progression.completedCleanups.add(action.target)

    // Add material rewards
    if (cleanup.materials_gain) {
      const materials = CSVDataParser.parseMaterials(cleanup.materials_gain)
      for (const [materialName, amount] of materials.entries()) {
        const current = context.gameState.resources.materials.get(materialName) || 0
        context.gameState.resources.materials.set(materialName, current + amount)
      }
    }

    // Update farm stage and phase
    context.gameState.progression.farmStage = PrerequisiteSystem.getFarmStageFromPlots(
      context.gameState.progression.farmPlots
    )
    context.gameState.progression.currentPhase = PrerequisiteSystem.getCurrentPhase(context.gameState)

    const materialRewards = cleanup.materials_gain ? ` (+${cleanup.materials_gain})` : ''
    events.push({
      timestamp: context.gameState.time.totalMinutes,
      type: 'action_cleanup',
      description: `Cleared ${cleanup.name}: +${plotsAdded} plots (total: ${context.gameState.progression.farmPlots})${materialRewards}`,
      importance: 'high'
    })

    return { success: true, events }
  }

  private executeMoveAction(action: GameAction, context: ExecutionContext): ActionResult {
    const events: GameEvent[] = []

    const targetScreen = action.target || action.toScreen
    if (!targetScreen) {
      return { success: false, events: [], error: 'No target screen specified' }
    }

    const fromScreen = context.gameState.location.currentScreen

    // Update location
    context.gameState.location.currentScreen = targetScreen as any
    context.gameState.location.timeOnScreen = 0
    context.gameState.location.screenHistory.push(targetScreen as any)
    context.gameState.location.navigationReason = action.description || `AI decision: ${action.id}`

    events.push({
      timestamp: context.gameState.time.totalMinutes,
      type: 'action_move',
      description: `Moved from ${fromScreen} to ${targetScreen}`,
      importance: 'low'
    })

    return { success: true, events }
  }

  private executeCatchSeedsAction(action: GameAction, context: ExecutionContext): ActionResult {
    const events: GameEvent[] = []

    const towerReach = this.getTowerReachLevel(context.gameState)
    const windLevel = SeedSystem.getCurrentWindLevel(towerReach)
    const netType = this.getBestNet(context.gameState)
    const duration = action.duration || 5

    // Calculate expected seeds
    const catchRate = MANUAL_CATCHING.calculateCatchRate(windLevel.level, netType, this.getPersonaCatchingSkill(context))
    const expectedSeeds = Math.floor(catchRate.seedsPerMinute * duration)

    // Start seed catching process
    context.gameState.processes.seedCatching = {
      startedAt: context.gameState.time.totalMinutes,
      duration: duration,
      progress: 0,
      windLevel: windLevel.level,
      netType: netType,
      expectedSeeds: expectedSeeds,
      isComplete: false
    }

    events.push({
      timestamp: context.gameState.time.totalMinutes,
      type: 'seed_catching_started',
      description: `Started seed catching session with ${netType} net at ${windLevel.name} level (${duration} min, expecting ~${expectedSeeds} seeds)`,
      importance: 'medium'
    })

    return { success: true, events }
  }

  private executePurchaseAction(action: GameAction, context: ExecutionContext): ActionResult {
    const events: GameEvent[] = []

    if (!action.target) {
      return { success: false, events: [], error: 'No item specified for purchase' }
    }

    // Consume gold
    context.gameState.resources.gold -= action.goldCost

    // Handle blueprint purchases
    if (action.target.startsWith('blueprint_')) {
      const blueprintId = action.target
      
      context.gameState.inventory.blueprints.set(blueprintId, {
        id: blueprintId,
        purchased: true,
        isBuilt: false,
        buildCost: this.getBlueprintBuildCost(blueprintId, context.gameDataStore)
      })

      events.push({
        timestamp: context.gameState.time.totalMinutes,
        type: 'blueprint_purchase',
        description: `Purchased ${blueprintId} blueprint for ${action.goldCost} gold`,
        importance: 'high'
      })
    }
    // Handle emergency wood bundles
    else if (action.target.startsWith('emergency_wood_')) {
      const woodAmount = action.expectedRewards?.materials?.wood || 0
      if (woodAmount > 0) {
        const currentWood = context.gameState.resources.materials.get('wood') || 0
        context.gameState.resources.materials.set('wood', currentWood + woodAmount)

        events.push({
          timestamp: context.gameState.time.totalMinutes,
          type: 'emergency_purchase',
          description: `Purchased emergency wood bundle: +${woodAmount} wood for ${action.goldCost} gold`,
          importance: 'medium'
        })
      }
    }

    return { success: true, events }
  }

  private executeAdventureAction(action: GameAction, context: ExecutionContext): ActionResult {
    const events: GameEvent[] = []

    if (!action.target) {
      return { success: false, events: [], error: 'No adventure route specified' }
    }

    // Consume energy
    context.gameState.resources.energy.current -= action.energyCost

    // Execute adventure using AdventureSystem
    const combatResult = AdventureSystem.executeAdventureAction(action, context.gameState, context.parameters, context.gameDataStore)
    
    if (combatResult.success) {
      // Apply rewards
      context.gameState.resources.gold += combatResult.totalGold
      context.gameState.progression.experience += combatResult.totalXP

      events.push({
        timestamp: context.gameState.time.totalMinutes,
        type: 'adventure_complete',
        description: `Completed ${action.target} - Gold: +${combatResult.totalGold}, XP: +${combatResult.totalXP}, HP: ${combatResult.finalHP}`,
        data: { 
          gold: combatResult.totalGold, 
          xp: combatResult.totalXP, 
          hp: combatResult.finalHP,
          loot: combatResult.loot,
          combatLog: combatResult.combatLog
        },
        importance: 'high'
      })

      // Track completed adventure
      if (!context.gameState.progression.completedAdventures.includes(action.target)) {
        context.gameState.progression.completedAdventures.push(action.target)
      }
    } else {
      events.push({
        timestamp: context.gameState.time.totalMinutes,
        type: 'adventure_failed',
        description: `Failed ${action.target} - Hero defeated!`,
        data: { combatLog: combatResult.combatLog },
        importance: 'high'
      })
    }

    return { success: true, events }
  }

  // =====================================================================
  // SIMPLIFIED IMPLEMENTATIONS FOR OTHER ACTION TYPES
  // =====================================================================

  private executeBuildAction(action: GameAction, context: ExecutionContext): ActionResult {
    context.gameState.resources.energy.current -= action.energyCost
    return { 
      success: true, 
      events: [{ 
        timestamp: context.timestamp, 
        type: 'action_build', 
        description: `Built ${action.target}`, 
        importance: 'medium' 
      }] 
    }
  }

  private executeCraftAction(action: GameAction, context: ExecutionContext): ActionResult {
    context.gameState.resources.energy.current -= action.energyCost
    return { 
      success: true, 
      events: [{ 
        timestamp: context.timestamp, 
        type: 'action_craft', 
        description: `Started crafting ${action.target}`, 
        importance: 'medium' 
      }] 
    }
  }

  private executeMineAction(action: GameAction, context: ExecutionContext): ActionResult {
    context.gameState.resources.energy.current -= action.energyCost
    context.gameState.processes.mining = { depth: 1, energyDrain: 3, isActive: true, timeAtDepth: 0 }
    return { 
      success: true, 
      events: [{ 
        timestamp: context.timestamp, 
        type: 'action_mine', 
        description: 'Started mining', 
        importance: 'medium' 
      }] 
    }
  }

  private executeAssignHelperAction(action: GameAction, context: ExecutionContext): ActionResult {
    return { 
      success: true, 
      events: [{ 
        timestamp: context.timestamp, 
        type: 'action_assign_helper', 
        description: `Assigned helper ${action.target}`, 
        importance: 'medium' 
      }] 
    }
  }

  private executeTrainHelperAction(action: GameAction, context: ExecutionContext): ActionResult {
    context.gameState.resources.energy.current -= action.energyCost
    return { 
      success: true, 
      events: [{ 
        timestamp: context.timestamp, 
        type: 'action_train_helper', 
        description: `Started training ${action.target}`, 
        importance: 'medium' 
      }] 
    }
  }

  private executeTrainAction(action: GameAction, context: ExecutionContext): ActionResult {
    context.gameState.resources.energy.current -= action.energyCost
    context.gameState.progression.experience += action.expectedRewards.experience || 0
    context.gameState.resources.gold -= action.goldCost
    return { 
      success: true, 
      events: [{ 
        timestamp: context.timestamp, 
        type: 'action_train', 
        description: `Trained ${action.target} skill`, 
        importance: 'medium' 
      }] 
    }
  }

  private executeStokeAction(action: GameAction, context: ExecutionContext): ActionResult {
    return { 
      success: true, 
      events: [{ 
        timestamp: context.timestamp, 
        type: 'action_stoke', 
        description: 'Stoked the forge fire', 
        importance: 'low' 
      }] 
    }
  }

  private executeRescueAction(action: GameAction, context: ExecutionContext): ActionResult {
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
      context.gameState.helpers.gnomes.push(newGnome)
      context.gameState.resources.gold -= action.goldCost
    }
    return { 
      success: true, 
      events: [{ 
        timestamp: context.timestamp, 
        type: 'action_rescue', 
        description: `Rescued gnome ${action.target}`, 
        importance: 'high' 
      }] 
    }
  }

  private executeSellMaterialAction(action: GameAction, context: ExecutionContext): ActionResult {
    context.gameState.resources.gold += action.expectedRewards.gold || 0
    return { 
      success: true, 
      events: [{ 
        timestamp: context.timestamp, 
        type: 'action_sell_material', 
        description: `Sold material for ${action.expectedRewards.gold} gold`, 
        importance: 'low' 
      }] 
    }
  }

  private executeWaitAction(action: GameAction, context: ExecutionContext): ActionResult {
    return { 
      success: true, 
      events: [{ 
        timestamp: context.timestamp, 
        type: 'action_wait', 
        description: 'Waiting for better opportunities', 
        importance: 'low' 
      }] 
    }
  }

  // =====================================================================
  // HELPER METHODS
  // =====================================================================

  private parseGrowthStages(notes: string): number {
    if (!notes) return 3
    const match = notes.match(/Growth Stages (\\d+)/i)
    return match ? parseInt(match[1]) : 3
  }

  private getTowerReachLevel(gameState: any): number {
    const heroLevel = gameState.progression.heroLevel || 1
    const baseReach = Math.min(heroLevel, 11)
    const upgrades = gameState.progression.unlockedUpgrades || []
    let reachBonus = 0
    
    for (let i = 11; i >= 1; i--) {
      if (upgrades.includes(`tower_reach_${i}`)) {
        reachBonus = Math.max(reachBonus, i)
        break
      }
    }
    
    return Math.max(baseReach, reachBonus)
  }

  private getBestNet(gameState: any): string {
    const tools = gameState.inventory.tools
    if (tools.has('crystal_net') && tools.get('crystal_net')?.isEquipped) return 'crystal_net'
    if (tools.has('golden_net') && tools.get('golden_net')?.isEquipped) return 'golden_net'
    if (tools.has('net_ii') && tools.get('net_ii')?.isEquipped) return 'net_ii'
    if (tools.has('net_i') && tools.get('net_i')?.isEquipped) return 'net_i'
    return 'none'
  }

  private getPersonaCatchingSkill(context: ExecutionContext): number {
    const persona = context.parameters.persona
    if (persona?.type === 'speedrunner') return 1.2
    if (persona?.type === 'weekend-warrior') return 1.1
    return 1.0 // casual
  }

  private getBlueprintBuildCost(blueprintId: string, gameDataStore: any): any {
    const buildActionId = blueprintId.replace('blueprint_', '')
    const buildAction = gameDataStore.getItemById(buildActionId)
    
    if (buildAction) {
      const cost: any = {}
      if (buildAction.energy_cost) cost.energy = parseInt(buildAction.energy_cost) || 0
      if (buildAction.time) cost.time = parseInt(buildAction.time) || 0
      if (buildAction.materials_cost) cost.materials = CSVDataParser.parseMaterials(buildAction.materials_cost)
      return cost
    }
    
    return { energy: 10, time: 5 }
  }
}
