// AdventureSystem - Phase 9C Implementation
// Adventure route selection, combat execution, and reward processing

import type { GameState, GameAction, AllParameters } from '@/types'
import { CombatSystem, type WeaponData, type ArmorData, type RouteConfig, type WeaponType, type ArmorEffect } from './CombatSystem'
import { CSVDataParser } from '../CSVDataParser'

/**
 * Adventure system for route selection and combat execution
 */
export class AdventureSystem {
  /**
   * Evaluates adventure-specific actions (Phase 6E Implementation)
   */
  static evaluateActions(gameState: GameState, parameters: AllParameters, gameDataStore: any): GameAction[] {
    const actions: GameAction[] = []
    const adventureParams = parameters.adventure
    
    if (!adventureParams || gameState.processes.adventure) return actions // Already on adventure
    
    // Route selection based on risk tolerance and rewards
    const availableRoutes = AdventureSystem.getAvailableAdventureRoutes(gameState, gameDataStore)
    
    for (const route of availableRoutes) {
      // Apply routing priorities if available - simplified for now
      let routePriority = 1.0
      
      // Risk assessment
      const riskLevel = AdventureSystem.calculateAdventureRisk(route, gameState)
      const riskTolerance = 0.5 // Default risk tolerance
      
      if (riskLevel <= riskTolerance && routePriority > 0.3) {
        // Consider different duration options
        for (const duration of ['short', 'medium', 'long']) {
          const routeData = route[duration as keyof typeof route]
          if (!routeData) continue
          
          const energyReq = 30 // Default minimum energy reserve
          if (gameState.resources.energy.current >= energyReq + routeData.energyCost) {
            actions.push({
              id: `adventure_${route.id}_${duration}_${Date.now()}`,
              type: 'adventure',
              screen: 'adventure',
              target: `${route.id}_${duration}`,
              duration: routeData.duration,
              energyCost: routeData.energyCost,
              goldCost: 0,
              prerequisites: route.prerequisites || [],
              expectedRewards: {
                gold: routeData.goldReward,
                experience: routeData.xpReward,
                items: routeData.loot || []
              }
            })
          }
        }
      }
    }
    
    return actions
  }

  /**
   * Execute adventure action with combat simulation
   */
  static executeAdventureAction(action: GameAction, gameState: GameState, parameters: AllParameters, gameDataStore: any): { 
    success: boolean
    totalGold: number
    totalXP: number
    finalHP: number
    loot: string[]
    combatLog: string[] 
  } {
    if (!action.target) {
      return { success: false, totalGold: 0, totalXP: 0, finalHP: 0, loot: [], combatLog: ['No adventure target specified'] }
    }

    // Parse route configuration from action target (e.g., "meadow_path_short")
    const routeConfig = AdventureSystem.parseRouteConfig(action.target, gameDataStore)
    if (!routeConfig) {
      return { success: false, totalGold: 0, totalXP: 0, finalHP: 0, loot: [], combatLog: ['Invalid route configuration'] }
    }

    // Convert game state weapons to combat system format
    const weapons = AdventureSystem.convertWeaponsForCombat(gameState, gameDataStore)
    if (weapons.size === 0) {
      return { success: false, totalGold: 0, totalXP: 0, finalHP: 0, loot: [], combatLog: ['No weapons equipped'] }
    }

    // Convert game state armor to combat system format
    const armor = AdventureSystem.convertArmorForCombat(gameState)

    // Get hero level
    const heroLevel = gameState.progression.heroLevel

    // Run combat simulation
    const result = CombatSystem.simulateAdventure(
      routeConfig,
      weapons,
      armor,
      heroLevel,
      [], // helpers - not implemented yet
      parameters.adventure || {}
    )

    return {
      success: result.success,
      totalGold: result.totalGold,
      totalXP: result.totalXP,
      finalHP: result.finalHP,
      loot: result.loot,
      combatLog: result.combatLog
    }
  }

  /**
   * Parse route configuration from adventure target string
   */
  static parseRouteConfig(target: string, gameDataStore: any): RouteConfig | null {
    // Parse target like "meadow_path_short" into route config
    const parts = target.split('_')
    if (parts.length < 3) return null

    const length = parts[parts.length - 1]
    const routeId = parts.slice(0, -1).join('_')

    // Get adventure data from CSV
    const adventureData = gameDataStore.getItemById(target)
    if (!adventureData) return null

    // Map length to proper case
    const lengthMap: Record<string, 'Short' | 'Medium' | 'Long'> = {
      'short': 'Short',
      'medium': 'Medium', 
      'long': 'Long'
    }

    const routeLength = lengthMap[length.toLowerCase()]
    if (!routeLength) return null

    return {
      id: routeId,
      length: routeLength,
      waveCount: AdventureSystem.getWaveCountForRoute(routeId, routeLength),
      boss: adventureData.boss as any, // Boss type from CSV
      enemyRolls: adventureData.enemy_rolls || 'fixed',
      goldGain: CSVDataParser.parseNumericValue(adventureData.gold_gain, 0),
      xpGain: 60 + (routeLength === 'Long' ? 20 : routeLength === 'Medium' ? 10 : 0) // Base XP + length bonus
    }
  }

  /**
   * Get wave count for a specific route and length
   */
  static getWaveCountForRoute(routeId: string, length: 'Short' | 'Medium' | 'Long'): number {
    const waveCountMap: Record<string, Record<string, number>> = {
      'meadow_path': { 'Short': 3, 'Medium': 5, 'Long': 8 },
      'pine_vale': { 'Short': 4, 'Medium': 6, 'Long': 10 },
      'dark_forest': { 'Short': 4, 'Medium': 7, 'Long': 12 },
      'mountain_pass': { 'Short': 5, 'Medium': 8, 'Long': 14 },
      'crystal_caves': { 'Short': 5, 'Medium': 9, 'Long': 16 },
      'frozen_tundra': { 'Short': 6, 'Medium': 10, 'Long': 18 },
      'volcano_core': { 'Short': 6, 'Medium': 11, 'Long': 20 }
    }

    return waveCountMap[routeId]?.[length] || 3
  }

  /**
   * Convert game state weapons to combat system format
   */
  static convertWeaponsForCombat(gameState: GameState, gameDataStore: any): Map<WeaponType, WeaponData> {
    const combatWeapons = new Map<WeaponType, WeaponData>()

    // Get equipped weapons from game state
    for (const [weaponType, weaponInfo] of gameState.inventory.weapons) {
      if (!weaponInfo || weaponInfo.level <= 0) continue

      // Get weapon data from CSV for this level
      const weaponId = `${weaponType}_${weaponInfo.level}`
      const weaponData = gameDataStore.getItemById(weaponId)
      
      if (weaponData) {
        combatWeapons.set(weaponType as WeaponType, {
          type: weaponType as WeaponType,
          damage: CSVDataParser.parseNumericValue(weaponData.damage, 10),
          attackSpeed: parseFloat(weaponData.attackSpeed) || 1.0,
          level: weaponInfo.level
        })
      }
    }

    return combatWeapons
  }

  /**
   * Convert game state armor to combat system format
   */
  static convertArmorForCombat(gameState: GameState): ArmorData | null {
    // For now, return a basic armor setup since armor system isn't fully implemented
    // In a full implementation, this would check equipped armor from inventory
    const equippedArmor = Array.from(gameState.inventory.armor.values())[0]
    
    if (!equippedArmor) {
      return null // No armor equipped
    }

    // Parse armor data (simplified for now)
    // Note: ArmorState interface may not have defense/effect properties yet
    return {
      defense: (equippedArmor as any).defense || 0,
      effect: ((equippedArmor as any).effect as ArmorEffect) || 'none'
    }
  }

  /**
   * Get available adventure routes based on unlocked content
   */
  static getAvailableAdventureRoutes(gameState: GameState, gameDataStore: any): any[] {
    const routes: any[] = []
    
    // Get all adventure items from CSV
    const adventures = gameDataStore.getItemsByType('adventure') || []
    
    for (const adventure of adventures) {
      // Check if prerequisites are met
      if (adventure.prerequisite) {
        const prereqs = adventure.prerequisite.split(';')
        let hasAllPrereqs = true
        
        for (const prereq of prereqs) {
          if (!gameState.progression.completedAdventures.includes(prereq.trim()) && 
              !gameState.progression.unlockedAreas.includes(prereq.trim()) &&
              !gameState.progression.builtStructures.has(prereq.trim())) {
            hasAllPrereqs = false
            break
          }
        }
        
        if (!hasAllPrereqs) continue
      }
      
      // Parse route data
      const routeData = {
        id: adventure.id,
        prerequisites: adventure.prerequisite ? adventure.prerequisite.split(';').map((p: string) => p.trim()) : [],
        short: adventure.length === 'Short' ? {
          duration: parseInt(adventure.time) || 5,
          energyCost: CSVDataParser.parseNumericValue(adventure.energy_cost, 10),
          goldReward: CSVDataParser.parseNumericValue(adventure.gold_gain, 25),
          xpReward: 60,
          loot: adventure.common_drop ? adventure.common_drop.split(';') : []
        } : null,
        medium: adventure.length === 'Medium' ? {
          duration: parseInt(adventure.time) || 8,
          energyCost: CSVDataParser.parseNumericValue(adventure.energy_cost, 25),
          goldReward: CSVDataParser.parseNumericValue(adventure.gold_gain, 75),
          xpReward: 70,
          loot: adventure.common_drop ? adventure.common_drop.split(';') : []
        } : null,
        long: adventure.length === 'Long' ? {
          duration: parseInt(adventure.time) || 15,
          energyCost: CSVDataParser.parseNumericValue(adventure.energy_cost, 50),
          goldReward: CSVDataParser.parseNumericValue(adventure.gold_gain, 150),
          xpReward: 80,
          loot: adventure.common_drop ? adventure.common_drop.split(';') : []
        } : null
      }
      
      routes.push(routeData)
    }
    
    return routes
  }

  /**
   * Calculate adventure risk level
   */
  static calculateAdventureRisk(route: any, gameState: GameState): number {
    // Simple risk calculation based on hero level vs expected adventure difficulty
    // Lower hero level = higher risk
    const heroLevel = gameState.progression.heroLevel
    const baseRisk = 0.3
    const levelAdjustment = Math.max(0, (5 - heroLevel) * 0.1)
    
    return Math.min(1.0, baseRisk + levelAdjustment)
  }

  /**
   * Get array position utility function
   */
  static getArrayPosition(priorityArray: string[], itemId: string): number {
    const index = priorityArray.indexOf(itemId)
    return index >= 0 ? (priorityArray.length - index) / priorityArray.length : 0
  }
}
