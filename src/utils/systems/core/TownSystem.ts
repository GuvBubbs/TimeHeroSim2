// TownSystem - Phase 10B Core Game Loop System
// Town vendor interactions, blueprint purchases, and material trading implementing GameSystem interface

import type { GameState, GameAction, AllParameters, SimulationConfig } from '@/types'
import { SeedSystem } from '../support/SeedSystem'
import { 
  type ActionResult, 
  type SystemTickResult, 
  type ValidationResult,
  type EvaluationContext,
  createSuccessResult,
  createFailureResult,
  createTickResult
} from '../GameSystem'

/**
 * Town system for vendor interactions and blueprint purchases - implements GameSystem contract
 */
export class TownSystem {
  /**
   * Evaluates town-specific actions (Phase 10B Implementation)
   */
  static evaluateActions(
    gameState: GameState, 
    parameters: AllParameters | SimulationConfig, 
    gameDataStoreOrContext: any
  ): GameAction[] {
    // Handle both old and new signatures for compatibility
    const actualGameDataStore = typeof gameDataStoreOrContext === 'object' && !('urgency' in gameDataStoreOrContext) 
      ? gameDataStoreOrContext 
      : null

    const actions: GameAction[] = []
    const townParams = 'town' in parameters ? parameters.town : parameters
    
    if (!townParams) return actions
    
    // CRITICAL: Blueprint purchase flow - check if hero needs tower access
    const blueprintPurchases = TownSystem.evaluateBlueprintPurchases(gameState, actualGameDataStore)
    actions.push(...blueprintPurchases)
    
    // PHASE 9A: Navigate back to farm after blueprint purchases to build structures
    const returnToFarmActions = TownSystem.evaluateReturnToFarmForBuilding(gameState)
    actions.push(...returnToFarmActions)
    
    // Phase 8L: Material trading for gold generation
    const materialSales = TownSystem.evaluateMaterialSales(gameState, actualGameDataStore)
    actions.push(...materialSales)
    
    // Phase 8L: Emergency wood bundles from Agronomist
    const emergencyWoodActions = TownSystem.evaluateEmergencyWood(gameState, actualGameDataStore)
    actions.push(...emergencyWoodActions)
    
    // Purchase decisions based on vendor priorities
    if (gameState.resources.gold >= 50) {
      const affordableUpgrades = TownSystem.getAffordableUpgrades(gameState, actualGameDataStore)
      
      for (const upgrade of affordableUpgrades) {
        // Apply vendor priorities if available - simplified for now
        let priority = 1.0
        
        // Apply blueprint strategy priorities - simplified for now
        
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
    if (townParams && 'skillTraining' in townParams && townParams.skillTraining && gameState.resources.gold >= 200) {
      const trainingOptions = TownSystem.getAvailableTraining(gameState, actualGameDataStore)
      
      for (const training of trainingOptions) {
        if (TownSystem.shouldTrainSkill(training, gameState)) {
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
  static evaluateBlueprintPurchases(gameState: GameState, gameDataStore: any): GameAction[] {
    const actions: GameAction[] = []
    
    // Check if hero needs tower access for seed collection
    if (TownSystem.needsTowerAccess(gameState)) {
      const towerBlueprint = TownSystem.evaluateTowerBlueprintPurchase(gameState)
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
  static evaluateReturnToFarmForBuilding(gameState: GameState): GameAction[] {
    const actions: GameAction[] = []
    
    // Only generate when currently in town
    if (gameState.location.currentScreen !== 'town') {
      return actions
    }
    
    // Check if hero has purchased blueprints that need to be built
    let hasUnbuiltBlueprints = false
    for (const [blueprintId, blueprint] of gameState.inventory.blueprints) {
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
  static needsTowerAccess(gameState: GameState): boolean {
    // Already have tower built
    if (gameState.tower.isBuilt) {
      return false
    }
    
    // Already purchased tower blueprint but haven't built it yet
    if (gameState.tower.blueprintsOwned.includes('tower_reach_1')) {
      return false
    }
    
    // Check if seeds are low using existing SeedSystem logic
    const seedMetrics = SeedSystem.getSeedMetrics(gameState)
    const farmPlots = gameState.progression.farmPlots || 3
    const seedBuffer = Math.max(farmPlots * 2, 6) // Want 2x seeds per plot, minimum 6 seeds
    const lowThreshold = Math.floor(seedBuffer * 0.7) // Low when < 70% of buffer
    
    return seedMetrics.totalSeeds < lowThreshold
  }

  /**
   * Evaluates purchasing blueprint_tower_reach_1 if conditions are met - generates navigation OR purchase
   */
  static evaluateTowerBlueprintPurchase(gameState: GameState): GameAction | null {
    const TOWER_BLUEPRINT_COST = 25
    
    // Check if can afford it
    if (gameState.resources.gold < TOWER_BLUEPRINT_COST) {
      return null
    }
    
    // CRITICAL FIX: Check if hero is in town
    const currentScreen = gameState.location.currentScreen
    
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
   * Evaluate material sales for gold generation
   */
  static evaluateMaterialSales(gameState: GameState, gameDataStore: any): GameAction[] {
    const actions: GameAction[] = []
    
    // Simple material sales logic - can be enhanced
    const materials = gameState.resources.materials
    
    // Sell excess wood if we have too much
    const wood = materials.get('wood') || 0
    if (wood > 200) {
      actions.push({
        id: `sell_wood_${Date.now()}`,
        type: 'sell_material',
        screen: 'town',
        target: 'wood',
        duration: 1,
        energyCost: 0,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: { gold: Math.floor(wood * 0.5) }
      })
    }
    
    return actions
  }

  /**
   * Evaluate emergency wood purchases - ONLY when actually needed for building
   */
  static evaluateEmergencyWood(gameState: GameState, gameDataStore: any): GameAction[] {
    const actions: GameAction[] = []
    
    // Emergency wood ONLY if we're critically low AND actually need it for building
    const wood = gameState.resources.materials.get('wood') || 0
    const hasTowerBlueprint = gameState.inventory.blueprints.has('blueprint_tower_reach_1')
    const towerIsBuilt = gameState.tower.isBuilt
    
    // Only buy wood if:
    // 1. We have the blueprint but tower isn't built (need wood for building)
    // 2. Wood is critically low (< 5)
    // 3. We have gold available
    // 4. We don't have more important purchases to make
    const needsWoodForTower = hasTowerBlueprint && !towerIsBuilt && wood < 5
    const hasAllBlueprints = hasTowerBlueprint // Add more blueprint checks as needed
    
    if (needsWoodForTower && hasAllBlueprints && gameState.resources.gold >= 20) {
      console.log(`🚨 EMERGENCY WOOD: Need wood for tower building (wood: ${wood}, has blueprint: ${hasTowerBlueprint})`)
      actions.push({
        id: `buy_wood_bundle_${Date.now()}`,
        type: 'purchase',
        screen: 'town',
        target: 'wood_bundle',
        duration: 1,
        energyCost: 0,
        goldCost: 20,
        prerequisites: [],
        expectedRewards: { items: ['wood'] }
      })
    } else if (wood < 10) {
      console.log(`🚫 WOOD PURCHASE BLOCKED: Not needed (wood: ${wood}, blueprint: ${hasTowerBlueprint}, tower built: ${towerIsBuilt})`)
    }
    
    return actions
  }

  /**
   * Get affordable upgrades from town vendors
   */
  static getAffordableUpgrades(gameState: GameState, gameDataStore: any): Array<{
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
    
    // Get all vendor items - use itemsByGameFeature as fallback
    const vendors = gameDataStore.itemsByType?.['vendor'] || gameDataStore.itemsByGameFeature?.['Town'] || []
    
    for (const vendor of vendors) {
      if (vendor.gold_cost && vendor.gold_cost <= gameState.resources.gold) {
        upgrades.push({
          id: vendor.id,
          cost: vendor.gold_cost,
          category: vendor.categories || 'general',
          vendorId: vendor.vendorId,
          prerequisites: vendor.prerequisite ? vendor.prerequisite.split(';') : []
        })
      }
    }
    
    return upgrades.sort((a, b) => a.cost - b.cost) // Sort by cost ascending
  }

  /**
   * Get available training options
   */
  static getAvailableTraining(gameState: GameState, gameDataStore: any): Array<{
    skill: string
    cost: number
    duration: number
    xpGain: number
  }> {
    // Simplified training options - can be enhanced with CSV data
    return [
      { skill: 'combat', cost: 200, duration: 5, xpGain: 100 },
      { skill: 'farming', cost: 150, duration: 3, xpGain: 75 },
      { skill: 'crafting', cost: 250, duration: 7, xpGain: 125 }
    ]
  }

  /**
   * Determine if a skill should be trained
   */
  static shouldTrainSkill(training: any, gameState: GameState): boolean {
    // Simple logic - train if hero level is low and we have energy
    return gameState.progression.heroLevel < 5 && gameState.resources.energy.current > 50
  }

  // =============================================================================
  // GAMESYSTEM INTERFACE IMPLEMENTATION
  // =============================================================================

  /**
   * Execute a town-related action
   */
  static execute(action: GameAction, state: GameState): ActionResult {
    try {
      switch (action.type) {
        case 'purchase':
          return this.executePurchaseAction(action, state)
        case 'sell_material':
          return this.executeSellMaterialAction(action, state)
        case 'build':
          return this.executeBuildAction(action, state)
        case 'train':
          return this.executeTrainAction(action, state)
        default:
          return createFailureResult(`Unknown town action type: ${action.type}`)
      }
    } catch (error) {
      return createFailureResult(`Error executing town action: ${error}`)
    }
  }

  /**
   * Process town systems during simulation tick
   */
  static tick(deltaTime: number, state: GameState): SystemTickResult {
    const stateChanges: Record<string, any> = {}
    const events: any[] = []

    try {
      // Check for urgent purchases needed
      if (this.needsTowerAccess(state)) {
        events.push({
          type: 'tower_access_needed',
          description: 'Hero needs tower access for seed collection',
          importance: 'medium'
        })
      }

      // Check for low materials that could be emergency purchased
      const wood = state.resources.materials.get('wood') || 0
      if (wood < 5 && state.resources.gold >= 20) {
        events.push({
          type: 'emergency_wood_available',
          description: 'Emergency wood purchase available',
          importance: 'low'
        })
      }

    } catch (error) {
      events.push({
        type: 'town_error',
        description: `Error in town tick: ${error}`,
        importance: 'high'
      })
    }

    return createTickResult(stateChanges, events)
  }

  /**
   * Validate if a town action can be executed
   */
  static canExecute(action: GameAction, state: GameState): ValidationResult {
    switch (action.type) {
      case 'purchase':
        return this.canPurchase(action, state)
      case 'sell_material':
        return this.canSellMaterial(action, state)
      case 'build':
        return this.canBuild(action, state)
      case 'train':
        return this.canTrain(action, state)
      default:
        return { canExecute: false, reason: `Unknown action type: ${action.type}` }
    }
  }

  // =============================================================================
  // ACTION EXECUTION METHODS
  // =============================================================================

  /**
   * Execute purchase action
   */
  private static executePurchaseAction(action: GameAction, state: GameState): ActionResult {
    if (state.resources.gold < action.goldCost) {
      return createFailureResult('Not enough gold for purchase')
    }

    const itemId = action.target
    if (!itemId) {
      return createFailureResult('No item specified for purchase')
    }

    // Handle blueprint purchases
    if (itemId.includes('blueprint_')) {
      const blueprint = state.inventory.blueprints.get(itemId)
      if (blueprint) {
        blueprint.purchased = true
      } else {
        state.inventory.blueprints.set(itemId, {
          id: itemId,
          purchased: true,
          isBuilt: false,
          buildCost: {
            energy: 10,
            materials: new Map([['wood', 5]]),
            time: 5
          }
        })
      }
      
      // CRITICAL FIX: Handle tower blueprint purchase
      if (itemId === 'blueprint_tower_reach_1') {
        state.tower.blueprintsOwned.push('tower_reach_1')
        console.log('🏗️ TOWER BLUEPRINT: Added tower_reach_1 to blueprintsOwned')
      }
    }

    state.resources.gold -= action.goldCost

    return createSuccessResult(
      `Purchased ${itemId} for ${action.goldCost} gold`,
      {
        'resources.gold': state.resources.gold,
        'inventory.blueprints': state.inventory.blueprints,
        'tower.blueprintsOwned': state.tower.blueprintsOwned
      }
    )
  }

  /**
   * Execute sell material action
   */
  private static executeSellMaterialAction(action: GameAction, state: GameState): ActionResult {
    const materialType = action.target
    if (!materialType) {
      return createFailureResult('No material specified for sale')
    }

    const currentAmount = state.resources.materials.get(materialType) || 0
    const sellAmount = Math.min(currentAmount, 10) // Sell up to 10 at a time

    if (sellAmount <= 0) {
      return createFailureResult(`No ${materialType} available to sell`)
    }

    const pricePerUnit = this.getMaterialPrice(materialType)
    const goldGained = sellAmount * pricePerUnit

    state.resources.materials.set(materialType, currentAmount - sellAmount)
    state.resources.gold += goldGained

    return createSuccessResult(
      `Sold ${sellAmount} ${materialType} for ${goldGained} gold`,
      {
        'resources.gold': state.resources.gold,
        [`resources.materials.${materialType}`]: currentAmount - sellAmount
      }
    )
  }

  /**
   * Execute build action
   */
  private static executeBuildAction(action: GameAction, state: GameState): ActionResult {
    const blueprintId = action.target
    if (!blueprintId) {
      return createFailureResult('No blueprint specified for building')
    }

    const blueprint = state.inventory.blueprints.get(blueprintId)
    if (!blueprint || !blueprint.purchased) {
      return createFailureResult('Blueprint not available or not purchased')
    }

    blueprint.isBuilt = true
    const structureName = blueprintId.replace('blueprint_', '')
    state.progression.builtStructures.add(structureName)

    return createSuccessResult(
      `Built ${structureName} from blueprint`,
      {
        'inventory.blueprints': state.inventory.blueprints,
        'progression.builtStructures': state.progression.builtStructures
      }
    )
  }

  /**
   * Execute train action
   */
  private static executeTrainAction(action: GameAction, state: GameState): ActionResult {
    if (state.resources.gold < action.goldCost) {
      return createFailureResult('Not enough gold for training')
    }

    const skill = action.target
    const experienceGained = action.expectedRewards?.experience || 50

    state.resources.gold -= action.goldCost
    state.progression.experience += experienceGained

    return createSuccessResult(
      `Trained ${skill} skill for ${experienceGained} experience`,
      {
        'resources.gold': state.resources.gold,
        'progression.experience': state.progression.experience
      }
    )
  }

  // =============================================================================
  // VALIDATION METHODS
  // =============================================================================

  /**
   * Validate purchase action
   */
  private static canPurchase(action: GameAction, state: GameState): ValidationResult {
    if (state.resources.gold < action.goldCost) {
      return { 
        canExecute: false, 
        reason: 'Not enough gold',
        missingResources: { gold: action.goldCost - state.resources.gold }
      }
    }

    return { canExecute: true }
  }

  /**
   * Validate sell material action
   */
  private static canSellMaterial(action: GameAction, state: GameState): ValidationResult {
    const materialType = action.target
    if (!materialType) {
      return { canExecute: false, reason: 'No material specified' }
    }

    const currentAmount = state.resources.materials.get(materialType) || 0
    if (currentAmount <= 0) {
      return { 
        canExecute: false, 
        reason: `No ${materialType} available to sell`,
        missingResources: { [materialType]: 1 }
      }
    }

    return { canExecute: true }
  }

  /**
   * Validate build action
   */
  private static canBuild(action: GameAction, state: GameState): ValidationResult {
    const blueprintId = action.target
    if (!blueprintId) {
      return { canExecute: false, reason: 'No blueprint specified' }
    }

    const blueprint = state.inventory.blueprints.get(blueprintId)
    if (!blueprint || !blueprint.purchased) {
      return { canExecute: false, reason: 'Blueprint not available' }
    }

    if (blueprint.isBuilt) {
      return { canExecute: false, reason: 'Already built' }
    }

    return { canExecute: true }
  }

  /**
   * Validate train action
   */
  private static canTrain(action: GameAction, state: GameState): ValidationResult {
    if (state.resources.gold < action.goldCost) {
      return { 
        canExecute: false, 
        reason: 'Not enough gold',
        missingResources: { gold: action.goldCost - state.resources.gold }
      }
    }

    return { canExecute: true }
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Get material price for selling
   */
  private static getMaterialPrice(materialType: string): number {
    const prices: Record<string, number> = {
      'wood': 2,
      'stone': 3,
      'copper': 5,
      'iron': 8,
      'silver': 15,
      'crystal': 50
    }
    return prices[materialType] || 1
  }

  /**
   * Get array position utility function
   */
  static getArrayPosition(priorityArray: string[], itemId: string): number {
    const index = priorityArray.indexOf(itemId)
    return index >= 0 ? (priorityArray.length - index) / priorityArray.length : 0
  }
}
