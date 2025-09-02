// ActionFilter - Action Validation and Filtering System
// Phase 9D Implementation

import type { GameState, GameAction } from '../../types'
import type { IActionFilter } from './types/DecisionTypes'

/**
 * Action validation and filtering system
 */
export class ActionFilter implements IActionFilter {
  filterValidActions(actions: GameAction[], gameState: GameState, gameDataStore: any): GameAction[] {
    const validActions = actions.filter(action => {
      try {
        const isValid = this.isActionValid(action, gameState, gameDataStore)
        console.log(`🔍 FILTER RESULT: ${action.type} (${action.target || action.id}) -> ${isValid ? 'VALID' : 'INVALID'}`)
        return isValid
      } catch (error) {
        console.log(`❌ FILTER ERROR: ${action.type} (${action.target || action.id}) -> ERROR: ${error instanceof Error ? error.message : String(error)}`)
        return false
      }
    })
    
    console.log(`🔍 FILTERED: ${validActions.length} valid actions out of ${actions.length} total`)
    return validActions
  }

  isActionValid(action: GameAction, gameState: GameState, gameDataStore: any): boolean {
    console.log(`🔍 PREREQ CHECK: ${action.type} action (energy: ${gameState.resources.energy.current}/${action.energyCost || 0}, gold: ${gameState.resources.gold}/${action.goldCost || 0})`)
    
    // Basic resource requirements
    if (!this.checkResourceRequirements(action, gameState)) {
      return false
    }
    
    // CSV-based prerequisites
    if (!this.checkPrerequisites(action, gameState, gameDataStore)) {
      return false
    }
    
    console.log(`✅ BASIC PREREQS PASSED: ${action.type} - proceeding to action-specific checks`)
    
    // Action-specific validation
    switch (action.type) {
      case 'adventure':
        return this.checkAdventurePrerequisites(action, gameState, gameDataStore)
      case 'craft':
        return this.checkCraftingPrerequisites(action, gameState, gameDataStore)
      case 'catch_seeds':
        return this.checkTowerPrerequisites(action, gameState, gameDataStore)
      case 'move':
        const moveTarget = action.toScreen || action.target  
        if (!moveTarget) {
          console.log(`❌ MOVE PREREQ FAILED: No target screen specified`)
          return false
        }
        return this.checkScreenAccessPrerequisites(moveTarget, gameState, gameDataStore)
      case 'rescue':
        return this.checkHelperRescuePrerequisites(action, gameState, gameDataStore)
      default:
        console.log(`✅ PREREQ PASSED: ${action.type} (no specific requirements)`)
        return true
    }
  }

  checkResourceRequirements(action: GameAction, gameState: GameState): boolean {
    // Energy requirements
    if (action.energyCost && action.energyCost > gameState.resources.energy.current) {
      console.log(`❌ PREREQ FAILED: Insufficient energy (${gameState.resources.energy.current} < ${action.energyCost})`)
      return false
    }
    
    // Gold requirements
    if (action.goldCost && action.goldCost > gameState.resources.gold) {
      console.log(`❌ PREREQ FAILED: Insufficient gold (${gameState.resources.gold} < ${action.goldCost})`)
      return false
    }
    
    // Material requirements
    if (action.materialCosts) {
      for (const [material, amount] of Object.entries(action.materialCosts)) {
        const available = gameState.resources.materials.get(material.toLowerCase()) || 0
        if (available < amount) {
          console.log(`❌ PREREQ FAILED: Insufficient ${material} (${available} < ${amount})`)
          return false
        }
      }
    }
    
    return true
  }

  checkPrerequisites(action: GameAction, gameState: GameState, gameDataStore: any): boolean {
    if (action.prerequisites && action.prerequisites.length > 0) {
      for (const prereqId of action.prerequisites) {
        if (!this.hasPrerequisite(prereqId, gameState, gameDataStore)) {
          console.log(`❌ PREREQ FAILED: Missing prerequisite ${prereqId}`)
          return false
        }
      }
    }
    
    return true
  }

  private hasPrerequisite(prereqId: string, gameState: GameState, gameDataStore: any): boolean {
    // Check unlocked upgrades
    if (gameState.progression.unlockedUpgrades.includes(prereqId)) {
      return true
    }
    
    // Check completed cleanups
    if (gameState.progression.completedCleanups.has(prereqId)) {
      return true
    }
    
    // Check purchased blueprints
    if (gameState.inventory.blueprints.has(prereqId)) {
      const blueprint = gameState.inventory.blueprints.get(prereqId)
      console.log(`🔍 PREREQUISITE CHECK: ${prereqId} blueprint found, purchased: ${blueprint?.purchased}`)
      if (blueprint && blueprint.purchased) {
        return true
      }
    }
    
    // Check owned tools/weapons
    if (gameState.inventory.tools.has(prereqId) || 
        gameState.inventory.weapons.has(prereqId)) {
      return true
    }
    
    // Check progression milestones
    switch (prereqId) {
      case 'tutorial_complete':
        return gameState.progression.currentPhase !== 'Tutorial'
      case 'farm_stage_2':
        return gameState.progression.farmStage >= 2
      case 'farm_stage_3':
        return gameState.progression.farmStage >= 3
      case 'hero_level_5':
        return gameState.progression.heroLevel >= 5
      case 'hero_level_10':
        return gameState.progression.heroLevel >= 10
      default:
        // Try to find in CSV data
        try {
          const item = gameDataStore.getItemById(prereqId)
          return item ? gameState.progression.unlockedUpgrades.includes(item.id) : false
        } catch {
          return false
        }
    }
  }

  private checkAdventurePrerequisites(action: GameAction, gameState: GameState, gameDataStore: any): boolean {
    // Check if adventure screen is unlocked
    if (!this.checkScreenAccessPrerequisites('adventure', gameState, gameDataStore)) {
      return false
    }
    
    // Check route prerequisites from CSV data
    try {
      const adventureItems = gameDataStore.itemsByGameFeature['Adventure'] || []
      const routeTarget = action.target || ''
      const routeItem = adventureItems.find((item: any) => 
        item.id === routeTarget || item.id === `${routeTarget}_short`
      )
      
      if (routeItem && routeItem.prerequisites) {
        for (const prereq of routeItem.prerequisites) {
          if (!this.hasPrerequisite(prereq, gameState, gameDataStore)) {
            return false
          }
        }
      }
    } catch (error) {
      console.warn('Failed to check adventure prerequisites:', error)
    }
    
    return true
  }

  private checkCraftingPrerequisites(action: GameAction, gameState: GameState, gameDataStore: any): boolean {
    // Check forge access
    if (!this.checkScreenAccessPrerequisites('forge', gameState, gameDataStore)) {
      return false
    }
    
    // Check crafting recipe prerequisites
    try {
      const craftingItem = gameDataStore.getItemById(action.target)
      if (craftingItem && craftingItem.prerequisites) {
        for (const prereq of craftingItem.prerequisites) {
          if (!this.hasPrerequisite(prereq, gameState, gameDataStore)) {
            console.log(`❌ CRAFT PREREQ FAILED: Missing ${prereq} for ${action.target}`)
            return false
          }
        }
      }
    } catch (error) {
      console.warn('Failed to check crafting prerequisites:', error)
    }
    
    return true
  }

  private checkTowerPrerequisites(action: GameAction, gameState: GameState, gameDataStore: any): boolean {
    // Check if tower screen is unlocked
    if (!this.checkScreenAccessPrerequisites('tower', gameState, gameDataStore)) {
      return false
    }
    
    // Check if hero is at the tower
    if (gameState.location.currentScreen !== 'tower') {
      console.log(`❌ TOWER PREREQ FAILED: Not at tower (currently at ${gameState.location.currentScreen})`)
      return false
    }
    
    // Check tower reach requirements for seed catching
    const targetWindLevel = action.target ? parseInt(action.target) : 1
    const currentReach = this.getTowerReachLevel(gameState)
    
    if (currentReach < targetWindLevel) {
      console.log(`❌ TOWER PREREQ FAILED: Insufficient reach (${currentReach} < ${targetWindLevel})`)
      return false
    }
    
    return true
  }

  private checkScreenAccessPrerequisites(screen: string, gameState: GameState, gameDataStore: any): boolean {
    // Basic screen access checks
    switch (screen) {
      case 'farm':
        return true // Always accessible
      case 'tower':
        return gameState.progression.unlockedAreas.includes('tower') || 
               gameState.progression.currentPhase !== 'Tutorial'
      case 'town':
        return gameState.progression.unlockedAreas.includes('town') ||
               gameState.progression.heroLevel >= 3
      case 'adventure':
        return gameState.progression.unlockedAreas.includes('adventure') ||
               gameState.progression.heroLevel >= 5
      case 'forge':
        return gameState.progression.unlockedAreas.includes('forge') ||
               gameState.progression.heroLevel >= 4
      case 'mine':
        return gameState.progression.unlockedAreas.includes('mine') ||
               gameState.progression.heroLevel >= 6
      default:
        return true
    }
  }

  private checkHelperRescuePrerequisites(action: GameAction, gameState: GameState, gameDataStore: any): boolean {
    // Check if hero has enough energy for rescue attempts
    if (gameState.resources.energy.current < 20) {
      console.log(`❌ RESCUE PREREQ FAILED: Insufficient energy for rescue (${gameState.resources.energy.current} < 20)`)
      return false
    }
    
    // For now, assume rescue actions are valid if energy requirement is met
    // TODO: Add proper helper tracking when helpers are fully implemented
    return true
  }

  private getTowerReachLevel(gameState: GameState): number {
    // Simplified tower reach calculation
    const heroLevel = gameState.progression.heroLevel
    const baseReach = Math.min(heroLevel, 11) // Hero level contributes to reach
    
    // Check for tower reach upgrades
    const upgrades = gameState.progression.unlockedUpgrades
    let reachBonus = 0
    
    // Check all tower reach levels (simplified approach)
    for (let i = 11; i >= 1; i--) {
      if (upgrades.includes(`tower_reach_${i}`)) {
        reachBonus = Math.max(reachBonus, i)
        break
      }
    }
    
    return Math.max(baseReach, reachBonus)
  }
}
