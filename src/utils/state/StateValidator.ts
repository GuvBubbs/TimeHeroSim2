// StateValidator - Phase 9F Implementation
// State consistency validation and invariant checking

import type { GameState } from '../../types'
import type { ValidationResult, StateInvariant } from './types/StateTypes'

/**
 * State validator for ensuring game state consistency
 */
export class StateValidator {
  private invariants: StateInvariant[] = []

  constructor() {
    this.setupInvariants()
  }

  /**
   * Validate game state against all invariants
   */
  validate(gameState: GameState): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    for (const invariant of this.invariants) {
      try {
        if (!invariant.validate(gameState)) {
          const message = `Invariant violation: ${invariant.name} - ${invariant.description}`
          
          if (invariant.severity === 'error') {
            errors.push(message)
          } else {
            warnings.push(message)
          }
        }
      } catch (error) {
        errors.push(`Invariant check failed for ${invariant.name}: ${error}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Add custom invariant
   */
  addInvariant(invariant: StateInvariant): void {
    this.invariants.push(invariant)
  }

  /**
   * Setup built-in state invariants
   */
  private setupInvariants(): void {
    // Resource invariants
    this.invariants.push({
      name: 'energy_bounds',
      description: 'Energy current should be between 0 and max',
      severity: 'error',
      validate: (state) => {
        const energy = state.resources.energy
        return energy.current >= 0 && energy.current <= energy.max
      }
    })

    this.invariants.push({
      name: 'water_bounds',
      description: 'Water current should be between 0 and max',
      severity: 'error',
      validate: (state) => {
        const water = state.resources.water
        return water.current >= 0 && water.current <= water.max
      }
    })

    this.invariants.push({
      name: 'gold_non_negative',
      description: 'Gold should not be negative',
      severity: 'error',
      validate: (state) => state.resources.gold >= 0
    })

    this.invariants.push({
      name: 'seed_non_negative',
      description: 'Seed quantities should not be negative',
      severity: 'error',
      validate: (state) => {
        for (const quantity of state.resources.seeds.values()) {
          if (quantity < 0) return false
        }
        return true
      }
    })

    this.invariants.push({
      name: 'material_non_negative',
      description: 'Material quantities should not be negative',
      severity: 'error',
      validate: (state) => {
        for (const quantity of state.resources.materials.values()) {
          if (quantity < 0) return false
        }
        return true
      }
    })

    // Time invariants
    this.invariants.push({
      name: 'time_consistency',
      description: 'Time values should be consistent',
      severity: 'error',
      validate: (state) => {
        const time = state.time
        return time.minute >= 0 && time.minute < 60 && 
               time.hour >= 0 && time.hour < 24 &&
               time.day >= 0 && time.totalMinutes >= 0
      }
    })

    // Progression invariants
    this.invariants.push({
      name: 'hero_level_positive',
      description: 'Hero level should be positive',
      severity: 'error',
      validate: (state) => state.progression.heroLevel > 0
    })

    this.invariants.push({
      name: 'experience_non_negative',
      description: 'Experience should not be negative',
      severity: 'error',
      validate: (state) => state.progression.experience >= 0
    })

    this.invariants.push({
      name: 'farm_plots_consistent',
      description: 'Available plots should not exceed total plots',
      severity: 'error',
      validate: (state) => {
        return state.progression.availablePlots <= state.progression.farmPlots
      }
    })

    // Process invariants
    this.invariants.push({
      name: 'crop_progress_bounds',
      description: 'Crop progress should be between 0 and 1',
      severity: 'warning',
      validate: (state) => {
        for (const crop of state.processes.crops) {
          if (crop.growthProgress < 0 || crop.growthProgress > 1) {
            return false
          }
        }
        return true
      }
    })

    this.invariants.push({
      name: 'crop_water_bounds',
      description: 'Crop water level should be between 0 and 1',
      severity: 'warning',
      validate: (state) => {
        for (const crop of state.processes.crops) {
          if (crop.waterLevel < 0 || crop.waterLevel > 1) {
            return false
          }
        }
        return true
      }
    })

    // Adventure invariants
    this.invariants.push({
      name: 'adventure_progress_bounds',
      description: 'Adventure progress should be between 0 and 1',
      severity: 'warning',
      validate: (state) => {
        if (state.processes.adventure) {
          const progress = state.processes.adventure.progress
          return progress >= 0 && progress <= 1
        }
        return true
      }
    })

    // Inventory invariants
    this.invariants.push({
      name: 'tool_durability_bounds',
      description: 'Tool durability should not exceed max durability',
      severity: 'warning',
      validate: (state) => {
        for (const tool of state.inventory.tools.values()) {
          if (tool.durability > tool.maxDurability) {
            return false
          }
        }
        return true
      }
    })

    this.invariants.push({
      name: 'weapon_durability_bounds',
      description: 'Weapon durability should not exceed max durability',
      severity: 'warning',
      validate: (state) => {
        for (const weapon of state.inventory.weapons.values()) {
          if (weapon.durability > weapon.maxDurability) {
            return false
          }
        }
        return true
      }
    })

    // Helper invariants
    this.invariants.push({
      name: 'helper_capacity',
      description: 'Number of gnomes should not exceed housing capacity',
      severity: 'warning',
      validate: (state) => {
        return state.helpers.gnomes.length <= state.helpers.housingCapacity
      }
    })

    // Location invariants
    this.invariants.push({
      name: 'valid_screen',
      description: 'Current screen should be valid',
      severity: 'error',
      validate: (state) => {
        const validScreens = ['farm', 'tower', 'town', 'adventure', 'forge', 'mine', 'menu']
        return validScreens.includes(state.location.currentScreen)
      }
    })
  }

  /**
   * Quick validation for critical invariants only
   */
  validateCritical(gameState: GameState): ValidationResult {
    const criticalInvariants = this.invariants.filter(inv => inv.severity === 'error')
    const errors: string[] = []

    for (const invariant of criticalInvariants) {
      try {
        if (!invariant.validate(gameState)) {
          errors.push(`Critical invariant violation: ${invariant.name} - ${invariant.description}`)
        }
      } catch (error) {
        errors.push(`Critical invariant check failed for ${invariant.name}: ${error}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  }

  /**
   * Get all registered invariants
   */
  getInvariants(): StateInvariant[] {
    return [...this.invariants]
  }
}
