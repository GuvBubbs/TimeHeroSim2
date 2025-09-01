/**
 * RouteEnemyRollSystem - Phase 8O Implementation
 * 
 * Manages persistent enemy rolls for adventure routes.
 * Stores enemy compositions per route+difficulty combination and maintains
 * them until route completion (win/fail).
 */

import type { GameState } from '@/types'

interface EnemyRoll {
  timestamp: number
  enemies: Array<{
    type: string
    count: number
    percentage: number
  }>
  totalEnemies: number
  rollSeed: number
}

interface RouteConfig {
  routeId: string
  difficulty: 'Short' | 'Medium' | 'Long'
  enemyTypes: Array<{
    name: string
    min: number
    max: number
    weight: number
  }>
  totalWaves: number
}

interface RouteEnemyCompositions {
  [routeId: string]: {
    enemyTypes: string[]
    weights: number[]
    minCounts: number[]
    maxCounts: number[]
    totalWaves: number
  }
}

export class RouteEnemyRollSystem {
  private static activeRolls: Map<string, EnemyRoll> = new Map()
  
  /**
   * Route enemy compositions based on CSV data
   */
  private static ROUTE_ENEMY_COMPOSITIONS: RouteEnemyCompositions = {
    'meadow_path': {
      enemyTypes: ['rabbit', 'squirrel', 'field_mouse'],
      weights: [50, 30, 20],
      minCounts: [2, 1, 1],
      maxCounts: [4, 3, 2],
      totalWaves: 3
    },
    'pine_vale': {
      enemyTypes: ['wolf', 'bear', 'forest_sprite'],
      weights: [40, 35, 25],
      minCounts: [1, 1, 0],
      maxCounts: [3, 2, 2],
      totalWaves: 4
    },
    'crystal_caverns': {
      enemyTypes: ['cave_spider', 'crystal_golem', 'bat_swarm'],
      weights: [45, 30, 25],
      minCounts: [2, 1, 1],
      maxCounts: [4, 2, 3],
      totalWaves: 5
    },
    'shadow_peaks': {
      enemyTypes: ['shadow_wolf', 'mountain_troll', 'ice_elemental'],
      weights: [35, 40, 25],
      minCounts: [1, 1, 1],
      maxCounts: [3, 2, 2],
      totalWaves: 6
    },
    'void_realm': {
      enemyTypes: ['void_spawn', 'chaos_demon', 'void_lord'],
      weights: [50, 35, 15],
      minCounts: [2, 1, 0],
      maxCounts: [5, 3, 1],
      totalWaves: 8
    }
  }

  /**
   * Get persistent enemy roll for a route+difficulty combination
   * Creates new roll if none exists
   */
  static getRoll(routeId: string, difficulty: 'Short' | 'Medium' | 'Long'): EnemyRoll {
    const key = this.generateRollKey(routeId, difficulty)
    
    if (!this.activeRolls.has(key)) {
      const newRoll = this.generateRoll(routeId, difficulty)
      this.activeRolls.set(key, newRoll)
      console.log(`🎲 Generated new enemy roll for ${routeId} (${difficulty})`)
    }
    
    const roll = this.activeRolls.get(key)!
    console.log(`📋 Using existing enemy roll for ${routeId} (${difficulty}): ${roll.totalEnemies} enemies`)
    
    return roll
  }

  /**
   * Generate new enemy roll for a route
   */
  private static generateRoll(routeId: string, difficulty: 'Short' | 'Medium' | 'Long'): EnemyRoll {
    const routeData = this.ROUTE_ENEMY_COMPOSITIONS[routeId]
    if (!routeData) {
      console.warn(`Unknown route: ${routeId}, using default composition`)
      return this.generateDefaultRoll(difficulty)
    }

    const roll: EnemyRoll = {
      timestamp: Date.now(),
      enemies: [],
      totalEnemies: 0,
      rollSeed: Math.floor(Math.random() * 1000000)
    }

    // Calculate difficulty multiplier
    const difficultyMultipliers = {
      'Short': 1.0,
      'Medium': 1.5,
      'Long': 2.0
    }
    const multiplier = difficultyMultipliers[difficulty]

    let totalEnemies = 0

    // Generate enemy counts based on route configuration
    routeData.enemyTypes.forEach((enemyType, index) => {
      const min = routeData.minCounts[index]
      const max = routeData.maxCounts[index]
      const weight = routeData.weights[index]
      
      // Apply difficulty multiplier to count ranges
      const adjustedMin = Math.ceil(min * multiplier)
      const adjustedMax = Math.floor(max * multiplier)
      
      // Roll enemy count based on weight and difficulty
      let count = 0
      if (adjustedMax > 0) {
        const baseCount = Math.floor(Math.random() * (adjustedMax - adjustedMin + 1)) + adjustedMin
        
        // Apply weight influence (higher weight = higher chance of max count)
        const weightInfluence = weight / 100
        const bonusChance = Math.random() < weightInfluence
        count = bonusChance ? Math.min(baseCount + 1, adjustedMax) : baseCount
      }
      
      if (count > 0) {
        roll.enemies.push({
          type: enemyType,
          count,
          percentage: 0 // Will calculate after all enemies are rolled
        })
        totalEnemies += count
      }
    })

    roll.totalEnemies = totalEnemies

    // Calculate percentages
    roll.enemies.forEach(enemy => {
      enemy.percentage = (enemy.count / totalEnemies) * 100
    })

    // Add boss enemy for longer routes
    if (difficulty === 'Long' && totalEnemies > 0) {
      const bossType = this.getBossForRoute(routeId)
      roll.enemies.push({
        type: bossType,
        count: 1,
        percentage: (1 / (totalEnemies + 1)) * 100
      })
      roll.totalEnemies += 1
      
      // Recalculate percentages with boss
      roll.enemies.forEach(enemy => {
        if (enemy.type !== bossType) {
          enemy.percentage = (enemy.count / roll.totalEnemies) * 100
        }
      })
    }

    return roll
  }

  /**
   * Clear enemy roll after route completion
   */
  static clearRoll(routeId: string, difficulty: 'Short' | 'Medium' | 'Long', outcome: 'complete' | 'failed' | 'abandoned'): void {
    const key = this.generateRollKey(routeId, difficulty)
    
    if (this.activeRolls.has(key)) {
      this.activeRolls.delete(key)
      console.log(`🗑️ Cleared enemy roll for ${routeId} (${difficulty}) - outcome: ${outcome}`)
    }
  }

  /**
   * Get all active rolls (for debugging/display)
   */
  static getActiveRolls(): Map<string, EnemyRoll> {
    return new Map(this.activeRolls)
  }

  /**
   * Check if a route has an active roll
   */
  static hasActiveRoll(routeId: string, difficulty: 'Short' | 'Medium' | 'Long'): boolean {
    const key = this.generateRollKey(routeId, difficulty)
    return this.activeRolls.has(key)
  }

  /**
   * Get enemy composition preview without creating persistent roll
   */
  static getRoutePreview(routeId: string, difficulty: 'Short' | 'Medium' | 'Long'): Array<{
    enemyType: string
    minCount: number
    maxCount: number
    probability: number
  }> {
    const routeData = this.ROUTE_ENEMY_COMPOSITIONS[routeId]
    if (!routeData) {
      return []
    }

    const difficultyMultipliers = {
      'Short': 1.0,
      'Medium': 1.5,
      'Long': 2.0
    }
    const multiplier = difficultyMultipliers[difficulty]

    return routeData.enemyTypes.map((enemyType, index) => ({
      enemyType,
      minCount: Math.ceil(routeData.minCounts[index] * multiplier),
      maxCount: Math.floor(routeData.maxCounts[index] * multiplier),
      probability: routeData.weights[index]
    }))
  }

  /**
   * Update route enemy compositions from CSV data
   */
  static updateFromCSV(csvData: any[]): void {
    console.log('📊 Updating route enemy compositions from CSV data...')
    
    // Parse route_wave_composition.csv data
    for (const row of csvData) {
      if (row.routeId && row.enemyTypes) {
        const routeId = row.routeId
        const enemyTypes = row.enemyTypes.split(';')
        const weights = row.weights?.split(';').map(Number) || enemyTypes.map(() => 33)
        const minCounts = row.minCounts?.split(';').map(Number) || enemyTypes.map(() => 1)
        const maxCounts = row.maxCounts?.split(';').map(Number) || enemyTypes.map(() => 3)
        
        this.ROUTE_ENEMY_COMPOSITIONS[routeId] = {
          enemyTypes,
          weights,
          minCounts,
          maxCounts,
          totalWaves: row.totalWaves || 3
        }
      }
    }
    
    console.log(`✅ Updated ${Object.keys(this.ROUTE_ENEMY_COMPOSITIONS).length} route compositions`)
  }

  /**
   * Persist rolls to game state for save/load
   */
  static persistToGameState(gameState: GameState): void {
    if (!gameState.temporaryData) {
      (gameState as any).temporaryData = {}
    }
    
    const rollsData = Array.from(this.activeRolls.entries()).map(([key, roll]) => ({
      key,
      roll
    }))
    
    (gameState as any).temporaryData.enemyRolls = rollsData
  }

  /**
   * Restore rolls from game state after load
   */
  static restoreFromGameState(gameState: GameState): void {
    const rollsData = (gameState as any).temporaryData?.enemyRolls
    if (!rollsData) return
    
    this.activeRolls.clear()
    
    for (const { key, roll } of rollsData) {
      this.activeRolls.set(key, roll)
    }
    
    console.log(`🔄 Restored ${this.activeRolls.size} enemy rolls from save data`)
  }

  /**
   * Clean up old rolls (older than 24 hours)
   */
  static cleanupOldRolls(): void {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
    const keysToDelete: string[] = []
    
    for (const [key, roll] of this.activeRolls.entries()) {
      if (roll.timestamp < oneDayAgo) {
        keysToDelete.push(key)
      }
    }
    
    for (const key of keysToDelete) {
      this.activeRolls.delete(key)
      console.log(`🧹 Cleaned up old enemy roll: ${key}`)
    }
  }

  /**
   * Generate roll key for route+difficulty combination
   */
  private static generateRollKey(routeId: string, difficulty: string): string {
    return `${routeId}:${difficulty}`
  }

  /**
   * Generate default roll for unknown routes
   */
  private static generateDefaultRoll(difficulty: 'Short' | 'Medium' | 'Long'): EnemyRoll {
    const baseEnemyCount = {
      'Short': 3,
      'Medium': 5,
      'Long': 8
    }

    const count = baseEnemyCount[difficulty]
    
    return {
      timestamp: Date.now(),
      enemies: [{
        type: 'unknown_enemy',
        count,
        percentage: 100
      }],
      totalEnemies: count,
      rollSeed: Math.floor(Math.random() * 1000000)
    }
  }

  /**
   * Get boss enemy for a route (Long difficulty only)
   */
  private static getBossForRoute(routeId: string): string {
    const bosses = {
      'meadow_path': 'giant_rabbit',
      'pine_vale': 'forest_guardian',
      'crystal_caverns': 'crystal_overlord',
      'shadow_peaks': 'shadow_king',
      'void_realm': 'void_emperor'
    }
    
    return bosses[routeId] || 'mysterious_boss'
  }

  /**
   * Get enemy roll statistics
   */
  static getStatistics(): {
    totalActiveRolls: number
    rollsByDifficulty: Record<string, number>
    oldestRoll: number | null
    newestRoll: number | null
  } {
    const rollsByDifficulty: Record<string, number> = {
      'Short': 0,
      'Medium': 0,
      'Long': 0
    }
    
    let oldestRoll: number | null = null
    let newestRoll: number | null = null
    
    for (const [key, roll] of this.activeRolls.entries()) {
      const difficulty = key.split(':')[1]
      if (rollsByDifficulty.hasOwnProperty(difficulty)) {
        rollsByDifficulty[difficulty]++
      }
      
      if (oldestRoll === null || roll.timestamp < oldestRoll) {
        oldestRoll = roll.timestamp
      }
      
      if (newestRoll === null || roll.timestamp > newestRoll) {
        newestRoll = roll.timestamp
      }
    }
    
    return {
      totalActiveRolls: this.activeRolls.size,
      rollsByDifficulty,
      oldestRoll,
      newestRoll
    }
  }
}
