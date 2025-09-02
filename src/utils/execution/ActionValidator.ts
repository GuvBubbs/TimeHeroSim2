// ActionValidator - Pre-execution validation system
// Phase 9E Implementation + Phase 9H: Enhanced with centralized validation

import type { GameAction, GameState } from '../../types'
import type { ValidationResult, ExecutionContext } from './types/ActionResult'
import { PrerequisiteSystem } from '../systems/PrerequisiteSystem'
import { validationService } from '../validation'
import { CSVDataParser } from '../CSVDataParser'

/**
 * Validates actions before execution
 */
export class ActionValidator {
  
  /**
   * Validates an action before execution
   */
  validate(action: GameAction, context: ExecutionContext): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Basic action validation
    if (!action.type) {
      errors.push('Action type is required')
    }

    // Energy validation
    if (action.energyCost && action.energyCost > 0) {
      if (context.gameState.resources.energy.current < action.energyCost) {
        errors.push(`Insufficient energy: need ${action.energyCost}, have ${context.gameState.resources.energy.current}`)
      }
    }

    // Gold validation
    if (action.goldCost && action.goldCost > 0) {
      if (context.gameState.resources.gold < action.goldCost) {
        errors.push(`Insufficient gold: need ${action.goldCost}, have ${context.gameState.resources.gold}`)
      }
    }

    // Location validation (using screen property)
    if (action.screen && context.gameState.location.currentScreen !== action.screen) {
      errors.push(`Wrong location: need ${action.screen}, at ${context.gameState.location.currentScreen}`)
    }

    // Type-specific validation
    const typeValidation = this.validateActionType(action, context)
    errors.push(...typeValidation.errors)
    warnings.push(...typeValidation.warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validates specific action types
   */
  private validateActionType(action: GameAction, context: ExecutionContext): { errors: string[], warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    switch (action.type) {
      case 'plant':
        this.validatePlantAction(action, context, errors, warnings)
        break
      case 'harvest':
        this.validateHarvestAction(action, context, errors, warnings)
        break
      case 'water':
        this.validateWaterAction(action, context, errors, warnings)
        break
      case 'pump':
        this.validatePumpAction(action, context, errors, warnings)
        break
      case 'cleanup':
        this.validateCleanupAction(action, context, errors, warnings)
        break
      case 'build':
        this.validateBuildAction(action, context, errors, warnings)
        break
      case 'purchase':
        this.validatePurchaseAction(action, context, errors, warnings)
        break
      case 'adventure':
        this.validateAdventureAction(action, context, errors, warnings)
        break
      case 'move':
        this.validateMoveAction(action, context, errors, warnings)
        break
      case 'catch_seeds':
        this.validateCatchSeedsAction(action, context, errors, warnings)
        break
      case 'craft':
        this.validateCraftAction(action, context, errors, warnings)
        break
      case 'mine':
        this.validateMineAction(action, context, errors, warnings)
        break
      case 'assign_role':
        this.validateAssignHelperAction(action, context, errors, warnings)
        break
      case 'train_helper':
        this.validateTrainHelperAction(action, context, errors, warnings)
        break
    }

    return { errors, warnings }
  }

  private validatePlantAction(action: GameAction, context: ExecutionContext, errors: string[], warnings: string[]): void {
    if (!action.target) {
      errors.push('Plant action requires a crop type')
      return
    }

    // Check if we have seeds
    const seedCount = context.gameState.resources.seeds.get(action.target) || 0
    if (seedCount <= 0) {
      errors.push(`No ${action.target} seeds available`)
    }

    // Check if we have available plots
    const activeCrops = context.gameState.processes.crops?.length || 0
    const totalPlots = context.gameState.progression.farmPlots || 3
    if (activeCrops >= totalPlots) {
      errors.push('No available plots for planting')
    }

    // Location check
    if (context.gameState.location.currentScreen !== 'farm') {
      errors.push('Must be at farm to plant crops')
    }
  }

  private validateHarvestAction(action: GameAction, context: ExecutionContext, errors: string[], warnings: string[]): void {
    if (!action.target) {
      errors.push('Harvest action requires a plot ID')
      return
    }

    // Check if crop exists and is ready
    const crop = context.gameState.processes.crops?.find((c: any) => c.plotId === action.target)
    if (!crop) {
      errors.push(`No crop found at ${action.target}`)
    } else if (!crop.readyToHarvest) {
      errors.push(`Crop at ${action.target} is not ready to harvest`)
    }

    // Location check
    if (context.gameState.location.currentScreen !== 'farm') {
      errors.push('Must be at farm to harvest crops')
    }
  }

  private validateWaterAction(action: GameAction, context: ExecutionContext, errors: string[], warnings: string[]): void {
    // Check water availability
    if (context.gameState.resources.water.current <= 0) {
      errors.push('No water available')
    }

    // Check if there are crops that need water
    const dryCrops = context.gameState.processes.crops?.filter((c: any) => c.waterLevel < 1.0) || []
    if (dryCrops.length === 0) {
      warnings.push('No crops need watering')
    }

    // Location check
    if (context.gameState.location.currentScreen !== 'farm') {
      errors.push('Must be at farm to water crops')
    }
  }

  private validatePumpAction(action: GameAction, context: ExecutionContext, errors: string[], warnings: string[]): void {
    // Check if water is at capacity
    if (context.gameState.resources.water.current >= context.gameState.resources.water.max) {
      warnings.push('Water is already at maximum capacity')
    }

    // Location check (assuming pump is at farm)
    if (context.gameState.location.currentScreen !== 'farm') {
      errors.push('Must be at farm to pump water')
    }
  }

  private validateCleanupAction(action: GameAction, context: ExecutionContext, errors: string[], warnings: string[]): void {
    if (!action.target) {
      errors.push('Cleanup action requires a cleanup target')
      return
    }

    // Check if cleanup is already completed
    if (context.gameState.progression.completedCleanups?.has(action.target)) {
      errors.push(`Cleanup ${action.target} already completed`)
    }

    // Get cleanup data and check prerequisites
    const cleanup = context.gameDataStore.getItemById(action.target)
    if (!cleanup) {
      errors.push(`Cleanup ${action.target} not found in data`)
      return
    }

    // Check prerequisites
    if (!PrerequisiteSystem.checkPrerequisites(cleanup, context.gameState, context.gameDataStore)) {
      errors.push(`Prerequisites not met for ${action.target}`)
    }

    // Check tool requirement
    if (!PrerequisiteSystem.checkToolRequirement(cleanup.tool_required, context.gameState)) {
      errors.push(`Required tool not available for ${action.target}`)
    }

    // Location check
    if (context.gameState.location.currentScreen !== 'farm') {
      errors.push('Must be at farm to perform cleanup')
    }
  }

  private validateBuildAction(action: GameAction, context: ExecutionContext, errors: string[], warnings: string[]): void {
    if (!action.target) {
      errors.push('Build action requires a blueprint ID')
      return
    }

    // Check if blueprint exists in inventory
    const blueprint = context.gameState.inventory.blueprints?.get(action.target)
    if (!blueprint) {
      errors.push(`Blueprint ${action.target} not in inventory`)
      return
    }

    if (blueprint.isBuilt) {
      errors.push(`Blueprint ${action.target} already built`)
    }

    // Check material requirements
    if (blueprint.buildCost?.materials) {
      for (const [material, required] of blueprint.buildCost.materials) {
        const available = context.gameState.resources.materials.get(material) || 0
        if (available < required) {
          errors.push(`Insufficient ${material}: need ${required}, have ${available}`)
        }
      }
    }
  }

  private validatePurchaseAction(action: GameAction, context: ExecutionContext, errors: string[], warnings: string[]): void {
    if (!action.target) {
      errors.push('Purchase action requires an item ID')
      return
    }

    // Location check for purchases
    if (context.gameState.location.currentScreen !== 'town') {
      errors.push('Must be at town to make purchases')
    }

    // Check if item exists and is available
    const item = context.gameDataStore.getItemById(action.target)
    if (!item) {
      errors.push(`Item ${action.target} not found`)
      return
    }

    // Check prerequisites for the item
    if (!PrerequisiteSystem.checkPrerequisites(item, context.gameState, context.gameDataStore)) {
      errors.push(`Prerequisites not met for ${action.target}`)
    }
  }

  private validateAdventureAction(action: GameAction, context: ExecutionContext, errors: string[], warnings: string[]): void {
    if (!action.target) {
      errors.push('Adventure action requires a route ID')
      return
    }

    // Location check
    if (context.gameState.location.currentScreen !== 'adventure') {
      errors.push('Must be at adventure screen to start adventure')
    }

    // Check if already on an adventure
    if (context.gameState.processes.adventure) {
      errors.push('Already on an adventure')
    }

    // Check weapons available
    const hasWeapons = Array.from(context.gameState.inventory.weapons.values()).some((w: any) => w && w.level > 0)
    if (!hasWeapons) {
      errors.push('No weapons equipped for adventure')
    }

    // Get adventure data and check prerequisites
    const adventure = context.gameDataStore.getItemById(action.target)
    if (!adventure) {
      errors.push(`Adventure ${action.target} not found`)
      return
    }

    if (!PrerequisiteSystem.checkPrerequisites(adventure, context.gameState, context.gameDataStore)) {
      errors.push(`Prerequisites not met for ${action.target}`)
    }
  }

  private validateMoveAction(action: GameAction, context: ExecutionContext, errors: string[], warnings: string[]): void {
    const targetScreen = action.target || action.toScreen
    if (!targetScreen) {
      errors.push('Move action requires a target screen')
      return
    }

    // Check if already at target screen
    if (context.gameState.location.currentScreen === targetScreen) {
      warnings.push(`Already at ${targetScreen}`)
    }

    // Validate screen exists (basic check)
    const validScreens = ['farm', 'tower', 'town', 'adventure', 'forge', 'mine']
    if (!validScreens.includes(targetScreen)) {
      errors.push(`Invalid screen: ${targetScreen}`)
    }
  }

  private validateCatchSeedsAction(action: GameAction, context: ExecutionContext, errors: string[], warnings: string[]): void {
    // Location check
    if (context.gameState.location.currentScreen !== 'tower') {
      errors.push('Must be at tower to catch seeds')
    }

    // Check if already catching seeds
    if (context.gameState.processes.seedCatching) {
      errors.push('Already catching seeds')
    }

    // Check tower reach (basic validation)
    const towerReach = this.getTowerReachLevel(context.gameState)
    if (towerReach <= 0) {
      errors.push('Tower reach level 1 required to catch seeds')
    }
  }

  private validateCraftAction(action: GameAction, context: ExecutionContext, errors: string[], warnings: string[]): void {
    if (!action.target) {
      errors.push('Craft action requires an item ID')
      return
    }

    // Location check
    if (context.gameState.location.currentScreen !== 'forge') {
      errors.push('Must be at forge to craft items')
    }

    // Check if already crafting maximum items
    const activeCrafting = context.gameState.processes.crafting?.length || 0
    if (activeCrafting >= 3) { // Assuming max 3 concurrent crafting
      warnings.push('Forge is at maximum capacity')
    }

    // Get craft data and check requirements
    const craftData = context.gameDataStore.getItemById(action.target)
    if (!craftData) {
      errors.push(`Craft recipe ${action.target} not found`)
      return
    }

    // Check material requirements
    if (craftData.materials_cost) {
      const materials = CSVDataParser.parseMaterials(craftData.materials_cost)
      for (const [material, required] of materials) {
        const available = context.gameState.resources.materials.get(material) || 0
        if (available < required) {
          errors.push(`Insufficient ${material}: need ${required}, have ${available}`)
        }
      }
    }
  }

  private validateMineAction(action: GameAction, context: ExecutionContext, errors: string[], warnings: string[]): void {
    // Location check
    if (context.gameState.location.currentScreen !== 'mine') {
      errors.push('Must be at mine to start mining')
    }

    // Check if already mining
    if (context.gameState.processes.mining?.isActive) {
      errors.push('Already mining')
    }

    // Check pickaxe requirement
    const hasPickaxe = Array.from(context.gameState.inventory.tools.values()).some((t: any) => 
      t && t.isEquipped && t.id.includes('pickaxe')
    )
    if (!hasPickaxe) {
      errors.push('Pickaxe required for mining')
    }
  }

  private validateAssignHelperAction(action: GameAction, context: ExecutionContext, errors: string[], warnings: string[]): void {
    if (!action.target) {
      errors.push('Assign helper action requires helper ID and role')
      return
    }

    const [helperId, role] = action.target.split(':')
    if (!helperId || !role) {
      errors.push('Helper assignment requires format "helperId:role"')
      return
    }

    // Check if helper exists
    const helper = context.gameState.helpers.gnomes?.find((g: any) => g.id === helperId)
    if (!helper) {
      errors.push(`Helper ${helperId} not found`)
      return
    }

    // Check housing capacity
    const housedHelpers = context.gameState.helpers.gnomes?.filter((g: any) => g.isAssigned).length || 0
    if (!helper.isAssigned && housedHelpers >= context.gameState.helpers.housingCapacity) {
      errors.push('No housing capacity for new helper assignment')
    }
  }

  private validateTrainHelperAction(action: GameAction, context: ExecutionContext, errors: string[], warnings: string[]): void {
    if (!action.target) {
      errors.push('Train helper action requires helper ID')
      return
    }

    // Check if helper exists
    const helper = context.gameState.helpers.gnomes?.find((g: any) => g.id === action.target)
    if (!helper) {
      errors.push(`Helper ${action.target} not found`)
      return
    }

    // Check if helper is assigned
    if (!helper.isAssigned) {
      errors.push('Helper must be assigned before training')
    }

    // Calculate training cost
    const currentLevel = Math.floor((helper.efficiency - 1.0) / 0.1)
    const energyCost = 50 * Math.pow(2, currentLevel)

    // Check energy cost
    if (context.gameState.resources.energy.current < energyCost) {
      errors.push(`Insufficient energy for training: need ${energyCost}, have ${context.gameState.resources.energy.current}`)
    }
  }

  private getTowerReachLevel(gameState: any): number {
    const heroLevel = gameState.progression.heroLevel || 1
    const baseReach = Math.min(heroLevel, 11)
    
    // Check for tower reach upgrades
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
}
