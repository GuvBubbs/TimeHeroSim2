// TownSystem - Phase 9C Implementation
// Town vendor interactions, blueprint purchases, and material trading

import type { GameState, GameAction, AllParameters } from '@/types'
import { SeedSystem } from './SeedSystem'

/**
 * Town system for vendor interactions and blueprint purchases
 */
export class TownSystem {
  /**
   * Evaluates town-specific actions (Phase 6E Implementation)
   */
  static evaluateActions(gameState: GameState, parameters: AllParameters, gameDataStore: any): GameAction[] {
    const actions: GameAction[] = []
    const townParams = parameters.town
    
    if (!townParams) return actions
    
    // CRITICAL: Blueprint purchase flow - check if hero needs tower access
    const blueprintPurchases = TownSystem.evaluateBlueprintPurchases(gameState, gameDataStore)
    actions.push(...blueprintPurchases)
    
    // PHASE 9A: Navigate back to farm after blueprint purchases to build structures
    const returnToFarmActions = TownSystem.evaluateReturnToFarmForBuilding(gameState)
    actions.push(...returnToFarmActions)
    
    // Phase 8L: Material trading for gold generation
    const materialSales = TownSystem.evaluateMaterialSales(gameState, gameDataStore)
    actions.push(...materialSales)
    
    // Phase 8L: Emergency wood bundles from Agronomist
    const emergencyWoodActions = TownSystem.evaluateEmergencyWood(gameState, gameDataStore)
    actions.push(...emergencyWoodActions)
    
    // Purchase decisions based on vendor priorities
    if (gameState.resources.gold >= 50) {
      const affordableUpgrades = TownSystem.getAffordableUpgrades(gameState, gameDataStore)
      
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
    if (townParams.skillTraining && gameState.resources.gold >= 200) {
      const trainingOptions = TownSystem.getAvailableTraining(gameState, gameDataStore)
      
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
    if (gameState.progression.builtStructures.has('tower_reach_1')) {
      return false
    }
    
    // Already purchased tower blueprint but haven't built it yet
    if (gameState.inventory.blueprints.has('blueprint_tower_reach_1')) {
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
   * Evaluate emergency wood purchases
   */
  static evaluateEmergencyWood(gameState: GameState, gameDataStore: any): GameAction[] {
    const actions: GameAction[] = []
    
    // Emergency wood if we're critically low
    const wood = gameState.resources.materials.get('wood') || 0
    if (wood < 10 && gameState.resources.gold >= 20) {
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
    
    // Get all vendor items
    const vendors = gameDataStore.getItemsByType('vendor') || []
    
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

  /**
   * Get array position utility function
   */
  static getArrayPosition(priorityArray: string[], itemId: string): number {
    const index = priorityArray.indexOf(itemId)
    return index >= 0 ? (priorityArray.length - index) / priorityArray.length : 0
  }
}
