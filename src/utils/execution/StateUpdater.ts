// StateUpdater - Centralized state mutation logic
// Phase 9E Implementation

import type { GameState } from '../../types'
import type { StateChanges } from './types/ActionResult'

/**
 * Handles centralized state updates with validation and rollback support
 */
export class StateUpdater {
  
  /**
   * Apply state changes to game state
   */
  applyChanges(gameState: GameState, changes: StateChanges): void {
    if (changes.resources) {
      this.updateResources(gameState, changes.resources)
    }

    if (changes.location) {
      this.updateLocation(gameState, changes.location)
    }

    if (changes.progression) {
      this.updateProgression(gameState, changes.progression)
    }

    if (changes.inventory) {
      this.updateInventory(gameState, changes.inventory)
    }

    if (changes.processes) {
      this.updateProcesses(gameState, changes.processes)
    }

    if (changes.helpers) {
      this.updateHelpers(gameState, changes.helpers)
    }

    if (changes.automation) {
      this.updateAutomation(gameState, changes.automation)
    }
  }

  /**
   * Create a rollback function for the current state
   */
  createRollback(gameState: GameState): () => void {
    // Create a deep copy of critical state sections
    const backup = {
      resources: {
        energy: { ...gameState.resources.energy },
        water: { ...gameState.resources.water },
        gold: gameState.resources.gold,
        materials: new Map(gameState.resources.materials),
        seeds: new Map(gameState.resources.seeds)
      },
      location: { ...gameState.location },
      progression: { ...gameState.progression },
      // Add more sections as needed
    }

    return () => {
      // Restore backed up state
      gameState.resources.energy = backup.resources.energy
      gameState.resources.water = backup.resources.water
      gameState.resources.gold = backup.resources.gold
      gameState.resources.materials = backup.resources.materials
      gameState.resources.seeds = backup.resources.seeds
      gameState.location = backup.location
      gameState.progression = backup.progression
    }
  }

  private updateResources(gameState: GameState, resourceChanges: any): void {
    if (resourceChanges.energy !== undefined) {
      gameState.resources.energy.current = Math.max(0, Math.min(
        gameState.resources.energy.max,
        resourceChanges.energy
      ))
    }

    if (resourceChanges.water !== undefined) {
      gameState.resources.water.current = Math.max(0, Math.min(
        gameState.resources.water.max,
        resourceChanges.water
      ))
    }

    if (resourceChanges.gold !== undefined) {
      gameState.resources.gold = Math.max(0, resourceChanges.gold)
    }

    if (resourceChanges.materials) {
      for (const [material, amount] of resourceChanges.materials) {
        gameState.resources.materials.set(material, Math.max(0, amount))
      }
    }

    if (resourceChanges.seeds) {
      for (const [seed, amount] of resourceChanges.seeds) {
        gameState.resources.seeds.set(seed, Math.max(0, amount))
      }
    }
  }

  private updateLocation(gameState: GameState, locationChanges: any): void {
    if (locationChanges.currentScreen) {
      gameState.location.currentScreen = locationChanges.currentScreen
    }

    if (locationChanges.timeOnScreen !== undefined) {
      gameState.location.timeOnScreen = locationChanges.timeOnScreen
    }

    if (locationChanges.navigationReason) {
      gameState.location.navigationReason = locationChanges.navigationReason
    }
  }

  private updateProgression(gameState: GameState, progressionChanges: any): void {
    if (progressionChanges.farmPlots !== undefined) {
      gameState.progression.farmPlots = Math.max(0, progressionChanges.farmPlots)
    }

    if (progressionChanges.availablePlots !== undefined) {
      gameState.progression.availablePlots = Math.max(0, progressionChanges.availablePlots)
    }

    if (progressionChanges.farmStage !== undefined) {
      gameState.progression.farmStage = progressionChanges.farmStage
    }

    if (progressionChanges.heroLevel !== undefined) {
      gameState.progression.heroLevel = Math.max(1, progressionChanges.heroLevel)
    }

    if (progressionChanges.experience !== undefined) {
      gameState.progression.experience = Math.max(0, progressionChanges.experience)
    }

    if (progressionChanges.currentPhase) {
      gameState.progression.currentPhase = progressionChanges.currentPhase
    }

    if (progressionChanges.completedCleanups) {
      gameState.progression.completedCleanups = progressionChanges.completedCleanups
    }

    if (progressionChanges.completedAdventures) {
      gameState.progression.completedAdventures = progressionChanges.completedAdventures
    }

    if (progressionChanges.unlockedUpgrades) {
      gameState.progression.unlockedUpgrades = progressionChanges.unlockedUpgrades
    }
  }

  private updateInventory(gameState: GameState, inventoryChanges: any): void {
    if (inventoryChanges.blueprints) {
      for (const [id, blueprint] of inventoryChanges.blueprints) {
        gameState.inventory.blueprints.set(id, blueprint)
      }
    }

    if (inventoryChanges.tools) {
      for (const [id, tool] of inventoryChanges.tools) {
        gameState.inventory.tools.set(id, tool)
      }
    }

    if (inventoryChanges.weapons) {
      for (const [id, weapon] of inventoryChanges.weapons) {
        gameState.inventory.weapons.set(id, weapon)
      }
    }

    if (inventoryChanges.armor) {
      for (const [id, armorPiece] of inventoryChanges.armor) {
        gameState.inventory.armor.set(id, armorPiece)
      }
    }
  }

  private updateProcesses(gameState: GameState, processChanges: any): void {
    if (processChanges.crops) {
      gameState.processes.crops = processChanges.crops
    }

    if (processChanges.crafting) {
      gameState.processes.crafting = processChanges.crafting
    }

    if (processChanges.mining) {
      gameState.processes.mining = processChanges.mining
    }

    if (processChanges.seedCatching) {
      gameState.processes.seedCatching = processChanges.seedCatching
    }

    if (processChanges.adventure) {
      gameState.processes.adventure = processChanges.adventure
    }
  }

  private updateHelpers(gameState: GameState, helperChanges: any): void {
    if (helperChanges.gnomes) {
      gameState.helpers.gnomes = helperChanges.gnomes
    }

    if (helperChanges.housingCapacity !== undefined) {
      gameState.helpers.housingCapacity = Math.max(0, helperChanges.housingCapacity)
    }
  }

  private updateAutomation(gameState: GameState, automationChanges: any): void {
    if (automationChanges.wateringEnabled !== undefined) {
      gameState.automation.wateringEnabled = automationChanges.wateringEnabled
    }

    if (automationChanges.energyReserve !== undefined) {
      gameState.automation.energyReserve = Math.max(0, automationChanges.energyReserve)
    }

    if (automationChanges.nextDecision) {
      gameState.automation.nextDecision = automationChanges.nextDecision
    }
  }
}
