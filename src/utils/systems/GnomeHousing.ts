// GnomeHousing - Phase 8M Gnome Housing Validation System
// Implements housing requirements where rescued gnomes need housing to be active

import type { GameState, GnomeState } from '@/types'

export interface HousingStructure {
  name: string
  capacity: number
  cost: number
  prerequisite: string
}

/**
 * Available gnome housing structures
 */
export const GNOME_HOUSING: HousingStructure[] = [
  { name: 'gnome_hut', capacity: 1, cost: 500, prerequisite: 'first_gnome' },
  { name: 'gnome_house', capacity: 2, cost: 2000, prerequisite: 'homestead' },
  { name: 'gnome_lodge', capacity: 3, cost: 10000, prerequisite: 'manor_grounds' },
  { name: 'gnome_hall', capacity: 4, cost: 50000, prerequisite: 'great_estate' },
  { name: 'gnome_village', capacity: 5, cost: 250000, prerequisite: 'gnome_hall' }
]

export interface HousingValidationResult {
  activeGnomes: number
  inactiveGnomes: number
  totalCapacity: number
  rescuedGnomes: number
  needsMoreHousing: boolean
  housingStructures: string[]
}

/**
 * Gnome housing management system
 */
export class GnomeHousingSystem {
  /**
   * Calculate total housing capacity based on built structures
   * @param gameState Current game state
   * @returns Total housing capacity
   */
  static calculateHousingCapacity(gameState: GameState): number {
    let totalCapacity = 0
    
    // Check each housing structure in game state
    for (const structure of GNOME_HOUSING) {
      // Check if this housing structure is built
      // (In a full implementation, this would check gameState.buildings or similar)
      // For now, we'll check if it's in the unlocked upgrades as a proxy
      if (gameState.progression.unlockedUpgrades.includes(structure.name)) {
        totalCapacity += structure.capacity
      }
    }
    
    return totalCapacity
  }

  /**
   * Get list of built housing structures
   * @param gameState Current game state
   * @returns Array of built housing structure names
   */
  static getBuiltHousingStructures(gameState: GameState): string[] {
    const builtStructures: string[] = []
    
    for (const structure of GNOME_HOUSING) {
      if (gameState.progression.unlockedUpgrades.includes(structure.name)) {
        builtStructures.push(structure.name)
      }
    }
    
    return builtStructures
  }

  /**
   * Validate gnome housing and update assignment status
   * @param gameState Current game state
   * @returns Housing validation result
   */
  static validateGnomeHousing(gameState: GameState): HousingValidationResult {
    if (!gameState.helpers?.gnomes) {
      return {
        activeGnomes: 0,
        inactiveGnomes: 0,
        totalCapacity: 0,
        rescuedGnomes: 0,
        needsMoreHousing: false,
        housingStructures: []
      }
    }

    const rescuedGnomes = gameState.helpers.gnomes.length
    const totalCapacity = this.calculateHousingCapacity(gameState)
    const housingStructures = this.getBuiltHousingStructures(gameState)
    
    const activeGnomes = Math.min(rescuedGnomes, totalCapacity)
    const inactiveGnomes = rescuedGnomes - activeGnomes
    const needsMoreHousing = inactiveGnomes > 0

    // Update gnome assignment status based on housing
    this.updateGnomeAssignments(gameState, activeGnomes)

    return {
      activeGnomes,
      inactiveGnomes,
      totalCapacity,
      rescuedGnomes,
      needsMoreHousing,
      housingStructures
    }
  }

  /**
   * Update gnome assignment status based on available housing
   * @param gameState Current game state
   * @param maxActiveGnomes Maximum number of gnomes that can be active
   */
  static updateGnomeAssignments(gameState: GameState, maxActiveGnomes: number): void {
    if (!gameState.helpers?.gnomes) return

    // Sort gnomes by level (higher level gnomes get priority for housing)
    const sortedGnomes = [...gameState.helpers.gnomes].sort((a, b) => (b.level || 0) - (a.level || 0))

    // Activate up to maxActiveGnomes gnomes
    for (let i = 0; i < sortedGnomes.length; i++) {
      const gnome = sortedGnomes[i]
      if (i < maxActiveGnomes) {
        gnome.isAssigned = true
        // Clear any housing-related status
        if (gnome.currentTask === 'waiting_for_housing') {
          gnome.currentTask = 'idle'
        }
      } else {
        gnome.isAssigned = false
        gnome.currentTask = 'waiting_for_housing'
        gnome.role = null // Clear role for unhoused gnomes
      }
    }
  }

  /**
   * Get next available housing structure to build
   * @param gameState Current game state
   * @returns Next housing structure that can be built, or null if none
   */
  static getNextHousingStructure(gameState: GameState): HousingStructure | null {
    for (const structure of GNOME_HOUSING) {
      // Check if not already built
      if (!gameState.progression.unlockedUpgrades.includes(structure.name)) {
        // Check if prerequisite is met
        if (structure.prerequisite === 'first_gnome' || 
            gameState.progression.unlockedUpgrades.includes(structure.prerequisite)) {
          return structure
        }
      }
    }
    return null
  }

  /**
   * Get housing recommendation message
   * @param validationResult Housing validation result
   * @returns Human-readable housing status message
   */
  static getHousingStatusMessage(validationResult: HousingValidationResult): string {
    if (validationResult.rescuedGnomes === 0) {
      return 'No gnomes have been rescued yet.'
    }

    if (validationResult.inactiveGnomes === 0) {
      return `All ${validationResult.activeGnomes} rescued gnomes are housed and active.`
    }

    return `${validationResult.inactiveGnomes} gnomes waiting for housing. ` +
           `Build more housing structures to activate them.`
  }

  /**
   * Check if a specific gnome can be assigned a role
   * @param gnome The gnome to check
   * @param gameState Current game state
   * @returns True if gnome can be assigned a role (is housed)
   */
  static canAssignRole(gnome: GnomeState, gameState: GameState): boolean {
    const validation = this.validateGnomeHousing(gameState)
    
    // Check if this gnome is one of the active ones
    return gnome.isAssigned === true
  }

  /**
   * Get housing structure by name
   * @param structureName Name of the housing structure
   * @returns Housing structure data or null if not found
   */
  static getHousingStructure(structureName: string): HousingStructure | null {
    return GNOME_HOUSING.find(structure => structure.name === structureName) || null
  }

  /**
   * Calculate cost to house all rescued gnomes
   * @param gameState Current game state
   * @returns Total cost to build enough housing for all gnomes
   */
  static calculateHousingCost(gameState: GameState): number {
    const validation = this.validateGnomeHousing(gameState)
    
    if (validation.inactiveGnomes === 0) {
      return 0 // No additional housing needed
    }

    let totalCost = 0
    let housingNeeded = validation.inactiveGnomes

    // Find the most cost-effective housing structures to build
    for (const structure of GNOME_HOUSING) {
      if (!gameState.progression.unlockedUpgrades.includes(structure.name) && housingNeeded > 0) {
        // Check if prerequisite is met
        if (structure.prerequisite === 'first_gnome' || 
            gameState.progression.unlockedUpgrades.includes(structure.prerequisite)) {
          totalCost += structure.cost
          housingNeeded -= structure.capacity
        }
      }
    }

    return totalCost
  }
}
