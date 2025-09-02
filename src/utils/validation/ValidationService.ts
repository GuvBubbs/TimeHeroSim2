/**
 * ValidationService - Phase 9H Implementation
 * 
 * Centralized validation service for all game actions and state.
 * Provides the main interface: validator.canPerform(action, gameState)
 */

import type { GameAction, GameState } from '@/types'
import type { ValidationResult, ExecutionContext } from '../execution/types/ActionResult'
import { PrerequisiteService } from './PrerequisiteService'
import { ActionValidator } from '../execution/ActionValidator'

export interface ActionValidationResult {
  canPerform: boolean
  errors: string[]
  warnings: string[]
  missingPrerequisites: string[]
  resourceIssues: string[]
  locationIssues: string[]
}

export interface ResourceValidation {
  energy: { required: number; available: number; sufficient: boolean }
  gold: { required: number; available: number; sufficient: boolean }
  water: { required: number; available: number; sufficient: boolean }
  materials: Array<{ type: string; required: number; available: number; sufficient: boolean }>
  seeds: Array<{ type: string; required: number; available: number; sufficient: boolean }>
}

export class ValidationService {
  private static instance: ValidationService | null = null
  private prerequisiteService: PrerequisiteService
  private actionValidator: ActionValidator

  private constructor() {
    this.prerequisiteService = PrerequisiteService.getInstance()
    this.actionValidator = new ActionValidator()
  }

  /**
   * Gets singleton instance
   */
  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService()
    }
    return ValidationService.instance
  }

  /**
   * Initializes the validation service
   */
  initialize(gameDataStore: any): void {
    this.prerequisiteService.initialize(gameDataStore)
  }

  /**
   * Main validation interface - checks if an action can be performed
   * This is the primary interface requested by the user
   */
  canPerform(action: GameAction, gameState: GameState, gameDataStore?: any): ActionValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const missingPrerequisites: string[] = []
    const resourceIssues: string[] = []
    const locationIssues: string[] = []

    try {
      // 1. Basic action validation using existing ActionValidator
      const executionContext: ExecutionContext = {
        gameState,
        gameDataStore: gameDataStore || null,
        parameters: null, // Will be provided by caller if needed
        timestamp: Date.now()
      }

      const actionValidation = this.actionValidator.validate(action, executionContext)
      errors.push(...actionValidation.errors)
      warnings.push(...actionValidation.warnings)

      // Categorize errors
      for (const error of actionValidation.errors) {
        if (error.includes('energy') || error.includes('gold') || error.includes('water') || 
            error.includes('material') || error.includes('seed')) {
          resourceIssues.push(error)
        } else if (error.includes('location') || error.includes('screen')) {
          locationIssues.push(error)
        }
      }

      // 2. Prerequisite validation
      const prerequisiteResult = this.validatePrerequisites(action, gameState, gameDataStore)
      if (!prerequisiteResult.satisfied) {
        errors.push(...prerequisiteResult.reasons)
        missingPrerequisites.push(...prerequisiteResult.missingPrerequisites)
      }

      // 3. Action-specific validation
      const actionSpecificResult = this.validateActionSpecific(action, gameState, gameDataStore)
      errors.push(...actionSpecificResult.errors)
      warnings.push(...actionSpecificResult.warnings)

    } catch (error) {
      errors.push(`Validation error: ${error}`)
    }

    return {
      canPerform: errors.length === 0,
      errors,
      warnings,
      missingPrerequisites,
      resourceIssues,
      locationIssues
    }
  }

  /**
   * Validates resource requirements for an action
   */
  validateResources(action: GameAction, gameState: GameState): ResourceValidation {
    const validation: ResourceValidation = {
      energy: { required: 0, available: gameState.resources.energy.current, sufficient: true },
      gold: { required: 0, available: gameState.resources.gold, sufficient: true },
      water: { required: 0, available: gameState.resources.water.current, sufficient: true },
      materials: [],
      seeds: []
    }

    // Energy validation
    if (action.energyCost && action.energyCost > 0) {
      validation.energy.required = action.energyCost
      validation.energy.sufficient = gameState.resources.energy.current >= action.energyCost
    }

    // Gold validation
    if (action.goldCost && action.goldCost > 0) {
      validation.gold.required = action.goldCost
      validation.gold.sufficient = gameState.resources.gold >= action.goldCost
    }

    // Water validation (for watering actions - no specific waterCost in GameAction)
    if (action.type === 'water') {
      // Assume 1 water per water action
      validation.water.required = 1
      validation.water.sufficient = gameState.resources.water.current >= 1
    }

    // Material validation
    if (action.materialCosts) {
      for (const [materialType, amount] of Object.entries(action.materialCosts)) {
        const available = gameState.resources.materials.get(materialType) || 0
        validation.materials.push({
          type: materialType,
          required: amount as number,
          available,
          sufficient: available >= (amount as number)
        })
      }
    }

    // Seed validation (for planting actions)
    if (action.type === 'plant' && action.target) {
      const available = gameState.resources.seeds.get(action.target) || 0
      validation.seeds.push({
        type: action.target,
        required: 1,
        available,
        sufficient: available >= 1
      })
    }

    return validation
  }

  /**
   * Validates state consistency and integrity
   */
  validateGameState(gameState: GameState): { valid: boolean; issues: string[] } {
    const issues: string[] = []

    // Resource validation
    if (gameState.resources.energy.current < 0) {
      issues.push('Energy cannot be negative')
    }
    if (gameState.resources.energy.current > gameState.resources.energy.max) {
      issues.push('Energy cannot exceed maximum')
    }
    if (gameState.resources.gold < 0) {
      issues.push('Gold cannot be negative')
    }
    if (gameState.resources.water.current < 0) {
      issues.push('Water cannot be negative')
    }
    if (gameState.resources.water.current > gameState.resources.water.max) {
      issues.push('Water cannot exceed maximum')
    }

    // Progression validation
    if (gameState.progression.heroLevel < 1) {
      issues.push('Hero level must be at least 1')
    }
    if (gameState.progression.farmStage < 1) {
      issues.push('Farm stage must be at least 1')
    }
    if (gameState.progression.farmPlots < 0) {
      issues.push('Farm plots cannot be negative')
    }

    // Time validation
    if (gameState.time.day < 1) {
      issues.push('Day must be at least 1')
    }
    if (gameState.time.hour < 0 || gameState.time.hour > 23) {
      issues.push('Hour must be between 0 and 23')
    }
    if (gameState.time.minute < 0 || gameState.time.minute > 59) {
      issues.push('Minute must be between 0 and 59')
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }

  /**
   * Validates a specific item's prerequisites
   */
  validateItemPrerequisites(item: any, gameState: GameState, gameDataStore?: any): {
    satisfied: boolean;
    missingPrerequisites: string[];
    reasons: string[];
  } {
    return this.prerequisiteService.checkPrerequisitesDetailed(item, gameState, gameDataStore)
  }

  /**
   * Gets dependency information for debugging
   */
  getDependencyInfo(itemId: string): {
    dependencies: string[];
    dependents: string[];
    circularDependencies: Array<{ path: string[], isCycle: boolean }>;
  } {
    return {
      dependencies: this.prerequisiteService.getDependencyChain(itemId),
      dependents: [], // TODO: Implement if needed
      circularDependencies: this.prerequisiteService.detectCircularDependencies()
    }
  }

  /**
   * Clears validation caches
   */
  clearCache(): void {
    this.prerequisiteService.clearCache()
  }

  /**
   * Gets validation statistics
   */
  getStats(): {
    cacheStats: { size: number; hitRate: number };
    circularDependencies: number;
  } {
    const circularDeps = this.prerequisiteService.detectCircularDependencies()
    return {
      cacheStats: this.prerequisiteService.getCacheStats(),
      circularDependencies: circularDeps.length
    }
  }

  /**
   * Validates prerequisites for an action
   */
  private validatePrerequisites(action: GameAction, gameState: GameState, gameDataStore?: any): {
    satisfied: boolean;
    missingPrerequisites: string[];
    reasons: string[];
  } {
    // For actions that need item lookup, get the item first
    if (action.type === 'cleanup' || action.type === 'purchase' || action.type === 'build') {
      try {
        const dataStore = gameDataStore
        if (dataStore && action.target) {
          const item = dataStore.getItemById(action.target)
          if (item) {
            return this.prerequisiteService.checkPrerequisitesDetailed(item, gameState, gameDataStore)
          }
        }
      } catch (error) {
        return {
          satisfied: false,
          missingPrerequisites: [action.target || 'unknown'],
          reasons: [`Could not find item data for ${action.target}`]
        }
      }
    }

    // For other actions, no specific prerequisites by default
    return {
      satisfied: true,
      missingPrerequisites: [],
      reasons: []
    }
  }

  /**
   * Action-specific validation logic
   */
  private validateActionSpecific(action: GameAction, gameState: GameState, gameDataStore?: any): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = []
    const warnings: string[] = []

    switch (action.type) {
      case 'plant':
        this.validatePlantingSpecific(action, gameState, errors, warnings)
        break
      case 'harvest':
        this.validateHarvestingSpecific(action, gameState, errors, warnings)
        break
      case 'adventure':
        this.validateAdventureSpecific(action, gameState, errors, warnings)
        break
      case 'craft':
        this.validateCraftingSpecific(action, gameState, errors, warnings)
        break
      // Add more action-specific validations as needed
    }

    return { errors, warnings }
  }

  /**
   * Validates planting actions
   */
  private validatePlantingSpecific(action: GameAction, gameState: GameState, errors: string[], warnings: string[]): void {
    if (!action.target) {
      errors.push('Plant action requires a crop type')
      return
    }

    // Check if we have the seed
    const seedCount = gameState.resources.seeds.get(action.target) || 0
    if (seedCount === 0) {
      errors.push(`No seeds available for ${action.target}`)
    }

    // Check if we have available plots
    if (gameState.progression.availablePlots <= 0) {
      errors.push('No available farm plots for planting')
    }
  }

  /**
   * Validates harvesting actions
   */
  private validateHarvestingSpecific(action: GameAction, gameState: GameState, errors: string[], warnings: string[]): void {
    // Check if there are crops ready to harvest
    const readyCrops = gameState.processes.crops.filter((crop: any) => 
      crop.readyToHarvest
    )
    
    if (readyCrops.length === 0) {
      errors.push('No crops ready to harvest')
    }
  }

  /**
   * Validates adventure actions
   */
  private validateAdventureSpecific(action: GameAction, gameState: GameState, errors: string[], warnings: string[]): void {
    // Hero health is typically managed through progression or a separate system
    // For now, skip hero health validation since it's not in the current GameState interface
    // This can be enhanced when hero health is properly modeled
    
    // Check if an adventure is already active
    if (gameState.processes.adventure) {
      errors.push('An adventure is already in progress')
    }
  }

  /**
   * Validates crafting actions
   */
  private validateCraftingSpecific(action: GameAction, gameState: GameState, errors: string[], warnings: string[]): void {
    // Check if there are active crafting processes (forge capacity)
    if (gameState.processes.crafting.length >= 3) { // Assume max 3 concurrent crafting
      errors.push('Forge is at capacity (too many concurrent crafting processes)')
    }
    
    // Additional forge heat validation would go here when heat is properly modeled
    // For now, we'll rely on the existing ActionValidator for basic validation
  }
}

// Export singleton instance for easy access
export const validationService = ValidationService.getInstance()
