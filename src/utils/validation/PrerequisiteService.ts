/**
 * PrerequisiteService - Phase 9H Implementation
 * 
 * Enhanced prerequisite checking system with caching and optimized performance.
 * Consolidates all prerequisite logic with improved error messages and debugging.
 */

import type { GameState } from '@/types/game-state'
import type { GameDataItem } from '@/types/game-data'
import { CSVDataParser } from '../CSVDataParser'
import { DependencyGraph } from './DependencyGraph'

export interface PrerequisiteResult {
  satisfied: boolean
  missingPrerequisites: string[]
  reasons: string[]
}

export interface PrerequisiteCache {
  [gameStateHash: string]: {
    [itemId: string]: PrerequisiteResult
  }
}

export class PrerequisiteService {
  private static instance: PrerequisiteService | null = null
  private dependencyGraph: DependencyGraph
  private cache: PrerequisiteCache = {}
  private lastGameStateHash: string = ''
  private gameDataStore: any = null

  private constructor() {
    this.dependencyGraph = new DependencyGraph()
  }

  /**
   * Gets singleton instance
   */
  static getInstance(): PrerequisiteService {
    if (!PrerequisiteService.instance) {
      PrerequisiteService.instance = new PrerequisiteService()
    }
    return PrerequisiteService.instance
  }

  /**
   * Initializes the service with game data
   */
  initialize(gameDataStore: any): void {
    this.gameDataStore = gameDataStore
    
    // Build dependency graph from all game data
    if (gameDataStore?.allItems) {
      this.dependencyGraph.buildFromGameData(gameDataStore.allItems)
    }
  }

  /**
   * Checks if all prerequisites for an item are met
   * Main interface matching user requirements: enhanced PrerequisiteSystem functionality
   */
  checkPrerequisites(
    item: GameDataItem | any, 
    gameState: GameState,
    gameDataStore?: any
  ): boolean {
    const result = this.checkPrerequisitesDetailed(item, gameState, gameDataStore)
    return result.satisfied
  }

  /**
   * Detailed prerequisite checking with reasons
   */
  checkPrerequisitesDetailed(
    item: GameDataItem | any, 
    gameState: GameState,
    gameDataStore?: any
  ): PrerequisiteResult {
    // Use provided gameDataStore or fallback to initialized one
    const dataStore = gameDataStore || this.gameDataStore
    
    if (!item) {
      return {
        satisfied: false,
        missingPrerequisites: [],
        reasons: ['Item is null or undefined']
      }
    }

    // Check cache first
    const gameStateHash = this.hashGameState(gameState)
    const cacheKey = item.id || item.name || 'unknown'
    
    if (this.cache[gameStateHash]?.[cacheKey]) {
      return this.cache[gameStateHash][cacheKey]
    }

    // Get prerequisites from item
    const prerequisites = this.getItemPrerequisites(item)
    
    if (prerequisites.length === 0) {
      const result: PrerequisiteResult = {
        satisfied: true,
        missingPrerequisites: [],
        reasons: []
      }
      this.cacheResult(gameStateHash, cacheKey, result)
      return result
    }

    // Check each prerequisite
    const missingPrerequisites: string[] = []
    const reasons: string[] = []

    for (const prereqId of prerequisites) {
      const prereqResult = this.hasPrerequisite(prereqId, gameState, dataStore)
      if (!prereqResult.satisfied) {
        missingPrerequisites.push(prereqId)
        reasons.push(...prereqResult.reasons)
      }
    }

    const result: PrerequisiteResult = {
      satisfied: missingPrerequisites.length === 0,
      missingPrerequisites,
      reasons
    }

    this.cacheResult(gameStateHash, cacheKey, result)
    return result
  }

  /**
   * Checks if a specific prerequisite is met
   * Enhanced version of PrerequisiteSystem.hasPrerequisite with detailed reasons
   */
  hasPrerequisite(
    prereqId: string, 
    gameState: GameState,
    gameDataStore?: any
  ): PrerequisiteResult {
    if (!prereqId) {
      return { satisfied: true, missingPrerequisites: [], reasons: [] }
    }
    
    const normalizedPrereq = CSVDataParser.normalizeId(prereqId)
    
    // 1. Check if it's a completed cleanup action
    if (gameState.progression.completedCleanups.has(normalizedPrereq)) {
      return { satisfied: true, missingPrerequisites: [], reasons: [] }
    }
    
    // 2. Check if it's an unlocked upgrade
    if (gameState.progression.unlockedUpgrades.includes(normalizedPrereq)) {
      return { satisfied: true, missingPrerequisites: [], reasons: [] }
    }
    
    // 3. Check if it's a crafted tool/weapon (craft_ prefix)
    if (normalizedPrereq.startsWith('craft_')) {
      const toolId = normalizedPrereq.replace('craft_', '')
      
      // Check tools inventory
      if (gameState.inventory.tools.has(toolId)) {
        return { satisfied: true, missingPrerequisites: [], reasons: [] }
      }
      
      // Check weapons inventory (for weapon crafting)
      for (const [weaponType, weapon] of gameState.inventory.weapons.entries()) {
        if (weaponType === toolId && weapon.level > 0) {
          return { satisfied: true, missingPrerequisites: [], reasons: [] }
        }
      }
      
      return {
        satisfied: false,
        missingPrerequisites: [normalizedPrereq],
        reasons: [`Tool/weapon '${toolId}' not crafted yet`]
      }
    }
    
    // 4. Check farm stage requirements
    if (normalizedPrereq.startsWith('farm_stage_')) {
      const requiredStage = parseInt(normalizedPrereq.replace('farm_stage_', ''))
      if (!isNaN(requiredStage)) {
        const satisfied = gameState.progression.farmStage >= requiredStage
        return {
          satisfied,
          missingPrerequisites: satisfied ? [] : [normalizedPrereq],
          reasons: satisfied ? [] : [`Farm stage ${requiredStage} required (current: ${gameState.progression.farmStage})`]
        }
      }
    }
    
    // 5. Check hero level requirements
    if (normalizedPrereq.startsWith('hero_level_')) {
      const requiredLevel = parseInt(normalizedPrereq.replace('hero_level_', ''))
      if (!isNaN(requiredLevel)) {
        const satisfied = gameState.progression.heroLevel >= requiredLevel
        return {
          satisfied,
          missingPrerequisites: satisfied ? [] : [normalizedPrereq],
          reasons: satisfied ? [] : [`Hero level ${requiredLevel} required (current: ${gameState.progression.heroLevel})`]
        }
      }
    }
    
    // 6. Check blueprint prerequisites (must be purchased/unlocked first)
    if (normalizedPrereq.startsWith('blueprint_')) {
      const satisfied = gameState.progression.unlockedUpgrades.includes(normalizedPrereq)
      return {
        satisfied,
        missingPrerequisites: satisfied ? [] : [normalizedPrereq],
        reasons: satisfied ? [] : [`Blueprint '${normalizedPrereq}' not purchased yet`]
      }
    }
    
    // 7. Check deed prerequisites (land ownership)
    if (normalizedPrereq.includes('deed')) {
      const satisfied = gameState.progression.unlockedUpgrades.includes(normalizedPrereq)
      return {
        satisfied,
        missingPrerequisites: satisfied ? [] : [normalizedPrereq],
        reasons: satisfied ? [] : [`Deed '${normalizedPrereq}' not acquired yet`]
      }
    }
    
    // 8. Check specific farm stage names based on plot counts
    const farmStageMapping: Record<string, number> = {
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
      const satisfied = gameState.progression.farmPlots >= requiredPlots
      return {
        satisfied,
        missingPrerequisites: satisfied ? [] : [normalizedPrereq],
        reasons: satisfied ? [] : [`${requiredPlots} farm plots required for '${normalizedPrereq}' (current: ${gameState.progression.farmPlots})`]
      }
    }
    
    // 9. Try to find the prerequisite as a general item in the game data
    const dataStore = gameDataStore || this.gameDataStore
    if (dataStore) {
      try {
        const item = dataStore.getItemById(normalizedPrereq)
        if (item) {
          // If it's a general item, check if it's been unlocked/completed
          const satisfied = gameState.progression.unlockedUpgrades.includes(normalizedPrereq) ||
                           gameState.progression.completedCleanups.has(normalizedPrereq)
          return {
            satisfied,
            missingPrerequisites: satisfied ? [] : [normalizedPrereq],
            reasons: satisfied ? [] : [`Item '${item.name}' (${normalizedPrereq}) not unlocked yet`]
          }
        }
      } catch (error) {
        // Item not found in data store
      }
    }
    
    // 10. Default: prerequisite not met
    return {
      satisfied: false,
      missingPrerequisites: [normalizedPrereq],
      reasons: [`Unknown prerequisite '${normalizedPrereq}' not satisfied`]
    }
  }

  /**
   * Validates that a tool requirement is met
   */
  checkToolRequirement(toolRequired: string, gameState: GameState): PrerequisiteResult {
    if (!toolRequired || toolRequired.toLowerCase() === 'hands') {
      return { satisfied: true, missingPrerequisites: [], reasons: [] }
    }
    
    const normalizedTool = CSVDataParser.normalizeId(toolRequired)
    const satisfied = gameState.inventory.tools.has(normalizedTool)
    
    return {
      satisfied,
      missingPrerequisites: satisfied ? [] : [normalizedTool],
      reasons: satisfied ? [] : [`Tool '${toolRequired}' required but not owned`]
    }
  }

  /**
   * Gets dependency chain for an item
   */
  getDependencyChain(itemId: string): string[] {
    return this.dependencyGraph.getAllPrerequisites(itemId)
  }

  /**
   * Checks for circular dependencies
   */
  detectCircularDependencies(): Array<{ path: string[], isCycle: boolean }> {
    return this.dependencyGraph.detectCircularDependencies()
  }

  /**
   * Clears cache (useful when game state changes significantly)
   */
  clearCache(): void {
    this.cache = {}
    this.lastGameStateHash = ''
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): { size: number, hitRate: number } {
    const totalEntries = Object.values(this.cache)
      .reduce((sum, gameStateCache) => sum + Object.keys(gameStateCache).length, 0)
    
    return {
      size: totalEntries,
      hitRate: 0 // TODO: Implement hit rate tracking
    }
  }

  /**
   * Extracts prerequisites from an item
   */
  private getItemPrerequisites(item: any): string[] {
    if (item.prerequisites && Array.isArray(item.prerequisites)) {
      return item.prerequisites
    }
    
    if (item.prerequisite && typeof item.prerequisite === 'string') {
      return CSVDataParser.parsePrerequisites(item.prerequisite)
    }
    
    return []
  }

  /**
   * Creates a hash of the game state for caching
   */
  private hashGameState(gameState: GameState): string {
    // Create a hash based on key progression elements
    const key = [
      gameState.progression.heroLevel,
      gameState.progression.farmStage,
      gameState.progression.farmPlots,
      gameState.progression.unlockedUpgrades.length,
      gameState.progression.completedCleanups.size,
      Array.from(gameState.inventory.tools.keys()).sort().join(','),
      Array.from(gameState.inventory.weapons.keys()).sort().join(',')
    ].join('|')
    
    return key
  }

  /**
   * Caches a prerequisite result
   */
  private cacheResult(gameStateHash: string, itemId: string, result: PrerequisiteResult): void {
    if (!this.cache[gameStateHash]) {
      this.cache[gameStateHash] = {}
    }
    this.cache[gameStateHash][itemId] = result
    
    // Clear old cache entries if game state changed
    if (this.lastGameStateHash && this.lastGameStateHash !== gameStateHash) {
      delete this.cache[this.lastGameStateHash]
    }
    this.lastGameStateHash = gameStateHash
  }
}

// Export singleton instance for easy access
export const prerequisiteService = PrerequisiteService.getInstance()
