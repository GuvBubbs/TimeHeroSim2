/**
 * PrerequisiteSystem - Phase 8B Implementation
 * 
 * Handles checking prerequisites for actions, upgrades, and other game items.
 * Supports multiple prerequisite types including completed cleanups, unlocked upgrades,
 * tool ownership, farm stages, and hero levels.
 */

import type { GameState } from '@/types/game-state'
import { CSVDataParser } from '../CSVDataParser'

export class PrerequisiteSystem {
  /**
   * Checks if all prerequisites for an item are met
   * 
   * @param item - Item with prerequisite field to check
   * @param gameState - Current game state
   * @param gameDataStore - Game data store for looking up items
   * @returns True if all prerequisites are met
   */
  static checkPrerequisites(
    item: any, 
    gameState: GameState,
    gameDataStore: any
  ): boolean {
    if (!item.prerequisite) {
      return true // No prerequisites required
    }
    
    // Parse prerequisites using CSVDataParser
    const prerequisites = CSVDataParser.parsePrerequisites(item.prerequisite)
    
    // Check each prerequisite
    for (const prereq of prerequisites) {
      if (!this.hasPrerequisite(prereq, gameState, gameDataStore)) {
        return false
      }
    }
    
    return true
  }
  
  /**
   * Checks if a specific prerequisite is met
   * 
   * @param prereqId - Prerequisite ID to check
   * @param gameState - Current game state
   * @param gameDataStore - Game data store for looking up items
   * @returns True if prerequisite is met
   */
  static hasPrerequisite(
    prereqId: string, 
    gameState: GameState,
    gameDataStore: any
  ): boolean {
    if (!prereqId) {
      return true
    }
    
    const normalizedPrereq = CSVDataParser.normalizeId(prereqId)
    
    // 1. Check if it's a completed cleanup action
    if (gameState.progression.completedCleanups.has(normalizedPrereq)) {
      return true
    }
    
    // 2. Check if it's an unlocked upgrade
    if (gameState.progression.unlockedUpgrades.includes(normalizedPrereq)) {
      return true
    }
    
    // 3. Check if it's a crafted tool/weapon (craft_ prefix)
    if (normalizedPrereq.startsWith('craft_')) {
      const toolId = normalizedPrereq.replace('craft_', '')
      
      // Check tools inventory
      if (gameState.inventory.tools.has(toolId)) {
        return true
      }
      
      // Check weapons inventory (for weapon crafting)
      for (const [weaponType, weapon] of gameState.inventory.weapons.entries()) {
        if (weaponType === toolId && weapon.level > 0) {
          return true
        }
      }
      
      return false
    }
    
    // 4. Check farm stage requirements
    if (normalizedPrereq.startsWith('farm_stage_')) {
      const requiredStage = parseInt(normalizedPrereq.replace('farm_stage_', ''))
      return !isNaN(requiredStage) && gameState.progression.farmStage >= requiredStage
    }
    
    // 5. Check hero level requirements
    if (normalizedPrereq.startsWith('hero_level_')) {
      const requiredLevel = parseInt(normalizedPrereq.replace('hero_level_', ''))
      return !isNaN(requiredLevel) && gameState.progression.heroLevel >= requiredLevel
    }
    
    // 6. Check blueprint prerequisites (must be purchased/unlocked first)
    if (normalizedPrereq.startsWith('blueprint_')) {
      return gameState.progression.unlockedUpgrades.includes(normalizedPrereq)
    }
    
    // 7. Check deed prerequisites (land ownership)
    if (normalizedPrereq.includes('deed')) {
      return gameState.progression.unlockedUpgrades.includes(normalizedPrereq)
    }
    
    // 8. Check specific farm stage names based on plot counts
    const farmStageMapping = {
      'small_hold': 20,      // Tutorial -> Early transition
      'homestead': 40,       // Early -> Mid transition  
      'homestead_deed': 40,  // Same as homestead
      'manor_grounds': 65,   // Mid -> Late transition
      'manor_grounds_deed': 65, // Same as manor_grounds
      'great_estate': 90,    // Late -> End transition
      'great_estate_deed': 90   // Same as great_estate
    }
    
    if (farmStageMapping[normalizedPrereq]) {
      const requiredPlots = farmStageMapping[normalizedPrereq]
      return gameState.progression.farmPlots >= requiredPlots
    }
    
    // 9. Try to find the prerequisite as a general item in the game data
    try {
      const item = gameDataStore.getItemById(normalizedPrereq)
      if (item) {
        // If it's a general item, check if it's been unlocked/completed
        return gameState.progression.unlockedUpgrades.includes(normalizedPrereq) ||
               gameState.progression.completedCleanups.has(normalizedPrereq)
      }
    } catch (error) {
      // Item not found in data store
    }
    
    // 10. Default: prerequisite not met
    return false
  }
  
  /**
   * Gets the current farm stage based on plot count
   * Used for phase progression tracking
   * 
   * @param plotCount - Current number of farm plots
   * @returns Farm stage number (1-5)
   */
  static getFarmStageFromPlots(plotCount: number): number {
    if (plotCount < 20) return 1      // Tutorial stage
    if (plotCount < 40) return 2      // Small Hold (Early)
    if (plotCount < 65) return 3      // Homestead (Mid)
    if (plotCount < 90) return 4      // Manor Grounds (Late)
    return 5                          // Great Estate (End)
  }
  
  /**
   * Gets the current game phase based on plot count and hero level
   * 
   * @param gameState - Current game state
   * @returns Game phase string
   */
  static getCurrentPhase(gameState: GameState): string {
    const plotCount = gameState.progression.farmPlots
    const heroLevel = gameState.progression.heroLevel
    
    // Tutorial phase: Very beginning
    if (plotCount < 20 && heroLevel < 3) {
      return 'Tutorial'
    }
    
    // Early phase: Small Hold expansion
    if (plotCount < 40 || heroLevel < 6) {
      return 'Early'
    }
    
    // Mid phase: Homestead development
    if (plotCount < 65 || heroLevel < 9) {
      return 'Mid'
    }
    
    // Late phase: Manor Grounds expansion
    if (plotCount < 90 || heroLevel < 12) {
      return 'Late'
    }
    
    // End phase: Great Estate and beyond
    return 'End'
  }
  
  /**
   * Validates that a tool requirement is met
   * 
   * @param toolRequired - Tool requirement from CSV (e.g., "hoe", "hands")
   * @param gameState - Current game state
   * @returns True if tool requirement is met
   */
  static checkToolRequirement(toolRequired: string, gameState: GameState): boolean {
    if (!toolRequired || toolRequired.toLowerCase() === 'hands') {
      return true // No tool required or hands only
    }
    
    const normalizedTool = CSVDataParser.normalizeId(toolRequired)
    
    // Check if tool is owned
    return gameState.inventory.tools.has(normalizedTool)
  }
}
