// AdventureSystem - Phase 10C Implementation  
// Adventure route selection, combat execution, and reward processing
// Includes RouteEnemyRollSystem functionality (merged from separate file)
// Includes CombatSystem functionality (merged from separate file)

import type { GameState, GameAction, AllParameters } from '@/types'
import { CSVDataParser } from '../CSVDataParser'
import { BossQuirkHandler, type BossPenalties } from '../combat/BossQuirks'
import { ArmorEffectHandler, type ArmorEffectResult } from '../combat/ArmorEffects'

// ============================================================================
// COMBAT SYSTEM INTERFACES (from CombatSystem.ts)
// ============================================================================

/**
 * Enemy types in the pentagon advantage system
 */
export type EnemyType = 'slimes' | 'armored_insects' | 'predatory_beasts' | 'flying_predators' | 'venomous_crawlers' | 'living_plants'

/**
 * Weapon types in the pentagon advantage system
 */
export type WeaponType = 'spear' | 'sword' | 'bow' | 'crossbow' | 'wand'

/**
 * Boss types with unique mechanics
 */
export type BossType = 'Giant Slime' | 'Beetle Lord' | 'Alpha Wolf' | 'Sky Serpent' | 'Crystal Spider' | 'Frost Wyrm' | 'Lava Titan'

/**
 * Armor effects that can be applied during combat
 */
export type ArmorEffect = 'none' | 'Reflection' | 'Evasion' | 'Gold Magnet' | 'Regeneration' | 'Type Resist' | 'Speed Boost' | 'Critical Shield' | 'Vampiric'

/**
 * Individual enemy in a wave
 */
export interface Enemy {
  type: EnemyType
  hp: number
  damage: number
  attackSpeed: number // attacks per second
}

/**
 * Weapon data for combat calculations
 */
export interface WeaponData {
  type: WeaponType
  damage: number
  attackSpeed: number
  level: number
}

/**
 * Armor data for combat calculations
 */
export interface ArmorData {
  defense: number // 0-80 max
  effect: ArmorEffect
  effectValue?: number // For effects that need values
}

/**
 * Boss data with special mechanics
 */
export interface BossData {
  type: BossType
  hp: number
  damage: number
  attackSpeed: number
  weakness?: WeaponType
  quirk: string
}

/**
 * Result of an adventure simulation
 */
export interface AdventureResult {
  success: boolean
  finalHP: number
  totalGold: number
  totalXP: number
  events: string[]
  loot: string[]
  combatLog: string[]
}

/**
 * Combat wave configuration
 */
export interface WaveConfig {
  enemies: Enemy[]
  waveNumber: number
}

/**
 * Route configuration for adventure
 */
export interface RouteConfig {
  id: string
  length: 'Short' | 'Medium' | 'Long'
  waveCount: number
  boss: BossType
  enemyRolls: 'fixed' | number | 'random'
  goldGain: number
  xpGain: number
}

// ============================================================================
// ROUTE ENEMY ROLL INTERFACES (from RouteEnemyRollSystem)
// ============================================================================

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

interface RouteEnemyCompositions {
  [routeId: string]: {
    enemyTypes: string[]
    weights: number[]
    minCounts: number[]
    maxCounts: number[]
    totalWaves: number
  }
}

/**
 * Adventure system for route selection and combat execution
 * Includes RouteEnemyRollSystem functionality for persistent enemy rolls
 */
export class AdventureSystem {
  // ============================================================================
  // ROUTE ENEMY ROLL SYSTEM (merged from RouteEnemyRollSystem.ts)
  // ============================================================================
  
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

  // ============================================================================
  // COMBAT SYSTEM (merged from CombatSystem.ts)
  // ============================================================================

  /**
   * Pentagon advantage system - determines weapon effectiveness vs enemy types
   */
  private static readonly WEAPON_ADVANTAGES: Record<WeaponType, EnemyType> = {
    'spear': 'armored_insects',
    'sword': 'predatory_beasts', 
    'bow': 'flying_predators',
    'crossbow': 'venomous_crawlers',
    'wand': 'living_plants'
  }

  /**
   * Pentagon resistance system - determines weapon weakness vs enemy types
   */
  private static readonly WEAPON_RESISTANCES: Record<WeaponType, EnemyType> = {
    'spear': 'living_plants',
    'sword': 'flying_predators',
    'bow': 'predatory_beasts', 
    'crossbow': 'armored_insects',
    'wand': 'venomous_crawlers'
  }

  /**
   * Base enemy stats by type
   */
  private static readonly ENEMY_STATS: Record<EnemyType, Omit<Enemy, 'type'>> = {
    'slimes': { hp: 20, damage: 3, attackSpeed: 1.0 },
    'armored_insects': { hp: 30, damage: 4, attackSpeed: 0.8 },
    'predatory_beasts': { hp: 25, damage: 6, attackSpeed: 1.2 },
    'flying_predators': { hp: 20, damage: 5, attackSpeed: 1.5 },
    'venomous_crawlers': { hp: 35, damage: 4, attackSpeed: 1.0 },
    'living_plants': { hp: 40, damage: 3, attackSpeed: 0.7 }
  }

  /**
   * Boss configurations with unique mechanics
   */
  private static readonly BOSS_CONFIGS: Record<BossType, BossData> = {
    'Giant Slime': {
      type: 'Giant Slime',
      hp: 150,
      damage: 8,
      attackSpeed: 0.5,
      quirk: 'Splits at 50% HP into 2 mini-slimes (4 damage each)'
    },
    'Beetle Lord': {
      type: 'Beetle Lord', 
      hp: 200,
      damage: 10,
      attackSpeed: 0.4,
      weakness: 'spear',
      quirk: 'Hardened Shell: Takes 50% less damage from non-weakness weapons'
    },
    'Alpha Wolf': {
      type: 'Alpha Wolf',
      hp: 250,
      damage: 12,
      attackSpeed: 0.8,
      weakness: 'sword',
      quirk: 'Pack Leader: Summons 2 cubs (3 damage each) at 75% and 25% HP'
    },
    'Sky Serpent': {
      type: 'Sky Serpent',
      hp: 300,
      damage: 10,
      attackSpeed: 1.0,
      weakness: 'bow',
      quirk: 'Aerial Phase: Every 20 seconds, flies for 5 seconds (can only be hit by Bow)'
    },
    'Crystal Spider': {
      type: 'Crystal Spider',
      hp: 400,
      damage: 12,
      attackSpeed: 0.6,
      weakness: 'crossbow',
      quirk: 'Web Trap: Every 30 seconds, disables weapons for 3 seconds'
    },
    'Frost Wyrm': {
      type: 'Frost Wyrm',
      hp: 500,
      damage: 15,
      attackSpeed: 0.7,
      weakness: 'wand',
      quirk: 'Frost Armor: Gains 30 defense when below 50% HP'
    },
    'Lava Titan': {
      type: 'Lava Titan',
      hp: 600,
      damage: 18,
      attackSpeed: 0.5,
      weakness: 'wand', // Rotates in real game, simplified to wand
      quirk: 'Molten Core: Deals 2 burn damage/sec throughout entire fight'
    }
  }

  // ============================================================================
  // ADVENTURE ACTION EVALUATION (original AdventureSystem methods)
  // ============================================================================
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
    const result = AdventureSystem.simulateAdventure(
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

  // ============================================================================
  // COMBAT METHODS (merged from CombatSystem.ts)
  // ============================================================================

  /**
   * Main adventure simulation method
   * @param route Route configuration (from adventures.csv)
   * @param weapons Available weapons (Map of weapon type to weapon data)
   * @param armor Equipped armor
   * @param heroLevel Hero's current level
   * @param helpers Available helpers (for future enhancement)
   * @param parameters Simulation parameters
   * @returns Complete adventure result
   */
  static simulateAdventure(
    route: RouteConfig,
    weapons: Map<WeaponType, WeaponData>,
    armor: ArmorData | null,
    heroLevel: number,
    helpers: any[] = [],
    parameters: any = {}
  ): AdventureResult {
    const combatLog: string[] = []
    const events: string[] = []
    
    // Calculate hero HP: 100 + (Level × 20)
    const maxHP = 100 + (heroLevel * 20)
    let currentHP = maxHP
    
    combatLog.push(`🛡️ Hero Level ${heroLevel} - Starting HP: ${currentHP}`)
    
    let totalGold = 0
    let totalXP = 0
    let burnDamagePerSecond = 0 // For Lava Titan
    
    // Log equipment
    combatLog.push(`⚔️ Equipped weapons: ${Array.from(weapons.keys()).join(', ')}`)
    if (armor) {
      combatLog.push(`🛡️ Equipped armor: ${armor.defense} defense, ${armor.effect} effect`)
    }
    
    try {
      // Generate and process waves
      const waves = this.generateWaves(route, combatLog)
      
      for (let waveIndex = 0; waveIndex < waves.length; waveIndex++) {
        const wave = waves[waveIndex]
        combatLog.push(`\n🌊 Wave ${wave.waveNumber}/${waves.length}: ${wave.enemies.length} enemies`)
        
        let waveKillCount = 0
        
        // Process each enemy in the wave
        for (const enemy of wave.enemies) {
          const waveResult = this.simulateWave([enemy], weapons, armor, currentHP, combatLog)
          
          if (!waveResult.success) {
            combatLog.push(`💀 Hero defeated by ${enemy.type}!`)
            return {
              success: false,
              finalHP: 0,
              totalGold: 0,
              totalXP: 0,
              events: [`Defeated in wave ${wave.waveNumber}`],
              loot: [],
              combatLog
            }
          }
          
          currentHP = waveResult.finalHP
          totalGold += waveResult.gold
          totalXP += waveResult.xp
          waveKillCount++
          
          // Apply vampiric healing using new system
          if (armor?.effect === 'Vampiric') {
            const vampiricResult = ArmorEffectHandler.applyOnKill('Vampiric', waveKillCount - 1)
            if (vampiricResult.healAmount > 0) {
              currentHP = Math.min(maxHP, currentHP + vampiricResult.healAmount)
              combatLog.push(`${vampiricResult.effectTriggered} (${currentHP}/${maxHP})`)
            }
          }
        }
        
        // Between waves: Apply regeneration and other effects
        if (waveIndex < waves.length - 1) { // Not after last wave
          if (armor?.effect === 'Regeneration') {
            const regenResult = ArmorEffectHandler.applyBetweenWaves('Regeneration')
            if (regenResult.healAmount > 0) {
              currentHP = Math.min(maxHP, currentHP + regenResult.healAmount)
              combatLog.push(`${regenResult.effectTriggered} (${currentHP}/${maxHP})`)
            }
          }
          
          combatLog.push(`✅ Wave ${wave.waveNumber} complete - HP: ${currentHP}/${maxHP}`)
        }
      }
      
      // Boss fight
      combatLog.push(`\n👹 Boss Fight: ${route.boss}`)
      const bossResult = this.simulateBossFight(route.boss, weapons, armor, currentHP, maxHP, combatLog)
      
      if (!bossResult.success) {
        combatLog.push(`💀 Hero defeated by ${route.boss}!`)
        return {
          success: false,
          finalHP: 0,
          totalGold: totalGold,
          totalXP: totalXP,
          events: [`Defeated by boss ${route.boss}`],
          loot: [],
          combatLog
        }
      }
      
      currentHP = bossResult.finalHP
      totalGold += bossResult.gold
      totalXP += bossResult.xp
      
      // Apply route rewards
      totalGold += route.goldGain
      totalXP += route.xpGain
      
      // Apply Gold Magnet armor effect using new system
      if (armor?.effect === 'Gold Magnet') {
        const goldMagnetResult = ArmorEffectHandler.applyOnCompletion('Gold Magnet', totalGold)
        if (goldMagnetResult.goldBonus > 0) {
          totalGold += goldMagnetResult.goldBonus
          combatLog.push(goldMagnetResult.effectTriggered)
        }
      }
      
      combatLog.push(`\n🎉 Adventure Complete!`)
      combatLog.push(`💰 Total Gold: ${totalGold}`)
      combatLog.push(`⭐ Total XP: ${totalXP}`)
      combatLog.push(`❤️ Final HP: ${currentHP}/${maxHP}`)
      
      return {
        success: true,
        finalHP: currentHP,
        totalGold,
        totalXP,
        events: [`Completed ${route.id} (${route.length})`],
        loot: this.generateLoot(route),
        combatLog
      }
      
    } catch (error) {
      combatLog.push(`❌ Combat simulation error: ${error}`)
      return {
        success: false,
        finalHP: currentHP,
        totalGold: 0,
        totalXP: 0,
        events: [`Combat error: ${error}`],
        loot: [],
        combatLog
      }
    }
  }

  /**
   * Generate waves based on route configuration
   */
  private static generateWaves(route: RouteConfig, combatLog: string[]): WaveConfig[] {
    const waves: WaveConfig[] = []
    
    // Wave counts by route (from adventures.csv and combat mechanics doc)
    const waveCountMap: Record<string, Record<string, number>> = {
      'meadow_path': { 'Short': 3, 'Medium': 5, 'Long': 8 },
      'pine_vale': { 'Short': 4, 'Medium': 6, 'Long': 10 },
      'dark_forest': { 'Short': 4, 'Medium': 7, 'Long': 12 },
      'mountain_pass': { 'Short': 5, 'Medium': 8, 'Long': 14 },
      'crystal_caves': { 'Short': 5, 'Medium': 9, 'Long': 16 },
      'frozen_tundra': { 'Short': 6, 'Medium': 10, 'Long': 18 },
      'volcano_core': { 'Short': 6, 'Medium': 11, 'Long': 20 }
    }
    
    const routeKey = route.id.replace(/_short|_medium|_long/, '')
    const waveCount = waveCountMap[routeKey]?.[route.length] || route.waveCount || 3
    
    combatLog.push(`📊 Generating ${waveCount} waves for ${route.id}`)
    
    for (let i = 1; i <= waveCount; i++) {
      const enemies = this.generateWaveEnemies(route, i, waveCount)
      waves.push({
        enemies,
        waveNumber: i
      })
    }
    
    return waves
  }

  /**
   * Generate enemies for a specific wave
   */
  private static generateWaveEnemies(route: RouteConfig, waveNumber: number, totalWaves: number): Enemy[] {
    const enemies: Enemy[] = []
    
    // Enemy composition by route
    const routeEnemyTypes: Record<string, EnemyType[]> = {
      'meadow_path': ['slimes'], // Slimes only
      'pine_vale': ['armored_insects', 'slimes'],
      'dark_forest': ['predatory_beasts', 'armored_insects'],
      'mountain_pass': ['flying_predators', 'predatory_beasts'],
      'crystal_caves': ['venomous_crawlers', 'flying_predators', 'armored_insects'],
      'frozen_tundra': ['living_plants', 'venomous_crawlers', 'predatory_beasts'],
      'volcano_core': ['slimes', 'armored_insects', 'predatory_beasts', 'flying_predators', 'venomous_crawlers', 'living_plants'] // Mix all types
    }
    
    const routeKey = route.id.replace(/_short|_medium|_long/, '')
    const availableTypes = routeEnemyTypes[routeKey] || ['slimes']
    
    // Wave size increases with route difficulty and wave number
    const baseWaveSize = routeKey === 'meadow_path' ? 1 : 2
    const maxWaveSize = Math.min(5, baseWaveSize + Math.floor(waveNumber / 3))
    const waveSize = Math.floor(Math.random() * maxWaveSize) + 1
    
    for (let i = 0; i < waveSize; i++) {
      const enemyType = availableTypes[Math.floor(Math.random() * availableTypes.length)]
      const baseStats = this.ENEMY_STATS[enemyType]
      
      enemies.push({
        type: enemyType,
        hp: baseStats.hp,
        damage: baseStats.damage,
        attackSpeed: baseStats.attackSpeed
      })
    }
    
    return enemies
  }

  /**
   * Simulate combat against a wave of enemies
   */
  private static simulateWave(
    enemies: Enemy[],
    weapons: Map<WeaponType, WeaponData>,
    armor: ArmorData | null,
    startingHP: number,
    combatLog: string[]
  ): { success: boolean; finalHP: number; gold: number; xp: number } {
    let currentHP = startingHP
    let waveGold = 0
    let waveXP = 0
    
    for (const enemy of enemies) {
      combatLog.push(`⚔️ Fighting ${enemy.type} (${enemy.hp} HP, ${enemy.damage} DMG)`)
      
      // Select best weapon for this enemy
      const bestWeapon = this.selectBestWeapon(weapons, enemy.type)
      if (!bestWeapon) {
        combatLog.push(`❌ No weapons available!`)
        return { success: false, finalHP: currentHP, gold: waveGold, xp: waveXP }
      }
      
      combatLog.push(`🗡️ Using ${bestWeapon.type} (${bestWeapon.damage} DMG, ${bestWeapon.attackSpeed}x speed)`)
      
      // Calculate damage and time to kill
      const weaponDamage = this.calculateCombatDamage(bestWeapon, enemy.type)
      const timeToKill = enemy.hp / weaponDamage
      
      combatLog.push(`📊 Weapon damage: ${weaponDamage} (${timeToKill.toFixed(1)}s to kill)`)
      
      // Calculate damage taken
      let damageTaken = enemy.damage * enemy.attackSpeed * timeToKill
      
      // Apply armor defense
      if (armor && armor.defense > 0) {
        const damageReduction = Math.min(0.8, armor.defense / 100) // Max 80% reduction
        const originalDamage = damageTaken
        damageTaken = damageTaken * (1 - damageReduction)
        combatLog.push(`🛡️ Armor reduces damage: ${originalDamage.toFixed(1)} → ${damageTaken.toFixed(1)} (${(damageReduction * 100).toFixed(0)}% reduction)`)
      }
      
      // Apply armor special effects using new system
      if (armor && armor.effect !== 'none') {
        const armorResult = ArmorEffectHandler.applyDuringCombat(armor.effect, damageTaken, enemy)
        if (armorResult.effectTriggered) {
          damageTaken *= (1 - armorResult.damageReduction)
          combatLog.push(armorResult.effectTriggered)
          if (armorResult.reflectedDamage && armorResult.reflectedDamage > 0) {
            combatLog.push(`🔄 Enemy takes ${armorResult.reflectedDamage.toFixed(1)} reflected damage`)
          }
        }
      }
      
      currentHP -= Math.ceil(damageTaken)
      combatLog.push(`💔 Took ${Math.ceil(damageTaken)} damage - HP: ${currentHP}`)
      
      if (currentHP <= 0) {
        return { success: false, finalHP: 0, gold: waveGold, xp: waveXP }
      }
      
      // Enemy defeated - award gold and XP
      waveGold += Math.floor(Math.random() * 5) + 2 // 2-6 gold per enemy
      waveXP += 2 // 2 XP per enemy
    }
    
    return { success: true, finalHP: currentHP, gold: waveGold, xp: waveXP }
  }

  /**
   * Select the best weapon for fighting a specific enemy type
   */
  private static selectBestWeapon(weapons: Map<WeaponType, WeaponData>, enemyType: EnemyType): WeaponData | null {
    if (weapons.size === 0) return null
    
    // First, try to find a weapon with advantage
    for (const [weaponType, weaponData] of weapons) {
      if (this.WEAPON_ADVANTAGES[weaponType] === enemyType) {
        return weaponData
      }
    }
    
    // Next, try to find a neutral weapon (no resistance)
    for (const [weaponType, weaponData] of weapons) {
      if (this.WEAPON_RESISTANCES[weaponType] !== enemyType) {
        return weaponData
      }
    }
    
    // If all weapons are resisted, use the first available
    return Array.from(weapons.values())[0]
  }

  /**
   * Calculate damage dealt by weapon against enemy type
   */
  private static calculateCombatDamage(weapon: WeaponData, enemyType: EnemyType): number {
    const baseDamage = weapon.damage * weapon.attackSpeed
    
    // Check for advantage (1.5x damage)
    if (this.WEAPON_ADVANTAGES[weapon.type] === enemyType) {
      return baseDamage * 1.5
    }
    
    // Check for resistance (0.5x damage)
    if (this.WEAPON_RESISTANCES[weapon.type] === enemyType) {
      return baseDamage * 0.5
    }
    
    // Neutral matchup (1.0x damage)
    return baseDamage
  }

  /**
   * Simulate boss fight with unique mechanics
   */
  private static simulateBossFight(
    bossType: BossType,
    weapons: Map<WeaponType, WeaponData>,
    armor: ArmorData | null,
    startingHP: number,
    maxHP: number,
    combatLog: string[]
  ): { success: boolean; finalHP: number; gold: number; xp: number } {
    const boss = this.BOSS_CONFIGS[bossType]
    let currentHP = startingHP
    let bossHP = boss.hp
    let bossGold = 50 // Base boss gold
    let bossXP = 20 // Base boss XP
    
    combatLog.push(`👹 ${boss.type}: ${boss.hp} HP, ${boss.damage} DMG`)
    combatLog.push(`🎯 Quirk: ${boss.quirk}`)
    
    // Select weapon (prefer weakness if available)
    let bestWeapon = this.selectBestWeapon(weapons, 'slimes') // Default
    if (boss.weakness && weapons.has(boss.weakness)) {
      bestWeapon = weapons.get(boss.weakness)!
      combatLog.push(`🎯 Using ${boss.weakness} (boss weakness)`)
    } else if (bestWeapon) {
      combatLog.push(`⚔️ Using ${bestWeapon.type} (no weakness weapon available)`)
    }
    
    if (!bestWeapon) {
      combatLog.push(`❌ No weapons available for boss fight!`)
      return { success: false, finalHP: currentHP, gold: 0, xp: 0 }
    }
    
    // Simulate boss fight with quirks
    const fightResult = this.simulateBossQuirks(boss, bestWeapon, armor, currentHP, maxHP, combatLog)
    
    if (fightResult.success) {
      combatLog.push(`🎉 ${boss.type} defeated!`)
      return {
        success: true,
        finalHP: fightResult.finalHP,
        gold: bossGold,
        xp: bossXP
      }
    } else {
      return {
        success: false,
        finalHP: 0,
        gold: 0,
        xp: 0
      }
    }
  }

  /**
   * Handle boss-specific quirks with simplified challenge system
   */
  private static simulateBossQuirks(
    boss: BossData,
    weapon: WeaponData,
    armor: ArmorData | null,
    startingHP: number,
    maxHP: number,
    combatLog: string[]
  ): { success: boolean; finalHP: number } {
    let currentHP = startingHP
    
    // Calculate base combat damage and duration
    let weaponDamage = weapon.damage * weapon.attackSpeed
    if (boss.weakness === weapon.type) {
      weaponDamage *= 1.5 // Advantage multiplier
      combatLog.push(`🎯 Weapon advantage: +50% damage against ${boss.type}`)
    }
    
    // Basic combat calculation
    const fightDuration = boss.hp / weaponDamage // Time to kill boss
    let baseDamage = boss.damage * boss.attackSpeed * fightDuration
    
    // Apply armor defense
    if (armor && armor.defense > 0) {
      const damageReduction = Math.min(0.8, armor.defense / 100)
      const originalDamage = baseDamage
      baseDamage = baseDamage * (1 - damageReduction)
      combatLog.push(`🛡️ Armor reduces boss damage: ${originalDamage.toFixed(1)} → ${baseDamage.toFixed(1)}`)
    }
    
    // Get weapon map for boss challenge system
    const weaponMap = new Map<WeaponType, any>()
    weaponMap.set(weapon.type, weapon)
    
    // Apply simplified boss challenges
    const penalties = BossQuirkHandler.calculatePenalties(boss.type, weaponMap, armor, maxHP)
    
    if (penalties.bonusDamage > 0) {
      baseDamage += penalties.bonusDamage
      combatLog.push(`⚠️ ${boss.type} challenge: +${penalties.bonusDamage.toFixed(1)} bonus damage`)
    }
    
    if (penalties.durationMultiplier > 1) {
      baseDamage *= penalties.durationMultiplier
      combatLog.push(`⏱️ ${boss.type} challenge: ${penalties.durationMultiplier}x duration penalty`)
    }
    
    if (penalties.unavoidableDamage > 0) {
      currentHP -= penalties.unavoidableDamage
      combatLog.push(`💥 ${boss.type} challenge: ${penalties.unavoidableDamage.toFixed(1)} unavoidable damage - HP: ${currentHP}`)
      
      if (currentHP <= 0) {
        return { success: false, finalHP: 0 }
      }
    }
    
    // Apply final damage
    currentHP -= Math.ceil(baseDamage)
    combatLog.push(`💔 Boss combat damage: ${Math.ceil(baseDamage)} - Final HP: ${currentHP}`)
    
    // Show boss challenge recommendation if counter not available
    if (!BossQuirkHandler.hasCounter(boss.type, weaponMap, armor)) {
      const recommendation = BossQuirkHandler.getRecommendation(boss.type)
      combatLog.push(`💡 Tip: ${recommendation}`)
    }
    
    return {
      success: currentHP > 0,
      finalHP: Math.max(0, currentHP)
    }
  }

  /**
   * Generate loot based on route configuration
   */
  private static generateLoot(route: RouteConfig): string[] {
    const loot: string[] = []
    
    // Basic material drops based on route
    const routeLoot: Record<string, string[]> = {
      'meadow_path': ['Wood x5-10', 'Copper x2'],
      'pine_vale': ['Wood x20-30', 'Iron x3', 'Pine Resin x1'],
      'dark_forest': ['Wood x40-60', 'Iron x5', 'Shadow Bark x1'],
      'mountain_pass': ['Stone x30-50', 'Silver x3', 'Mountain Stone x1'],
      'crystal_caves': ['Crystal x1-2', 'Crystal x2', 'Cave Crystal x1'],
      'frozen_tundra': ['Wood x80-120', 'Mythril x1', 'Frozen Heart x1', 'Enchanted Wood x1'],
      'volcano_core': ['Obsidian x1', 'Obsidian x2', 'Molten Core x1']
    }
    
    const routeKey = route.id.replace(/_short|_medium|_long/, '')
    const possibleLoot = routeLoot[routeKey] || ['Wood x5']
    
    // Add some random loot
    for (const item of possibleLoot) {
      if (Math.random() < 0.7) { // 70% chance for each item
        loot.push(item)
      }
    }
    
    // Chance for armor drop from boss
    if (Math.random() < 0.3) { // 30% chance
      loot.push('Random Armor Piece')
    }
    
    return loot
  }

  /**
   * Get array position utility function
   */
  static getArrayPosition(priorityArray: string[], itemId: string): number {
    const index = priorityArray.indexOf(itemId)
    return index >= 0 ? (priorityArray.length - index) / priorityArray.length : 0
  }

  // ============================================================================
  // ROUTE ENEMY ROLL METHODS (merged from RouteEnemyRollSystem.ts)
  // ============================================================================

  /**
   * Get persistent enemy roll for a route+difficulty combination
   * Creates new roll if none exists
   */
  static getEnemyRoll(routeId: string, difficulty: 'Short' | 'Medium' | 'Long'): EnemyRoll {
    const key = this.generateRollKey(routeId, difficulty)
    
    if (!this.activeRolls.has(key)) {
      const newRoll = this.generateEnemyRoll(routeId, difficulty)
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
  private static generateEnemyRoll(routeId: string, difficulty: 'Short' | 'Medium' | 'Long'): EnemyRoll {
    const routeData = this.ROUTE_ENEMY_COMPOSITIONS[routeId]
    if (!routeData) {
      console.warn(`Unknown route: ${routeId}, using default composition`)
      return this.generateDefaultEnemyRoll(difficulty)
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
  static clearEnemyRoll(routeId: string, difficulty: 'Short' | 'Medium' | 'Long', outcome: 'complete' | 'failed' | 'abandoned'): void {
    const key = this.generateRollKey(routeId, difficulty)
    
    if (this.activeRolls.has(key)) {
      this.activeRolls.delete(key)
      console.log(`🗑️ Cleared enemy roll for ${routeId} (${difficulty}) - outcome: ${outcome}`)
    }
  }

  /**
   * Get all active rolls (for debugging/display)
   */
  static getActiveEnemyRolls(): Map<string, EnemyRoll> {
    return new Map(this.activeRolls)
  }

  /**
   * Check if a route has an active roll
   */
  static hasActiveEnemyRoll(routeId: string, difficulty: 'Short' | 'Medium' | 'Long'): boolean {
    const key = this.generateRollKey(routeId, difficulty)
    return this.activeRolls.has(key)
  }

  /**
   * Get enemy composition preview without creating persistent roll
   */
  static getRouteEnemyPreview(routeId: string, difficulty: 'Short' | 'Medium' | 'Long'): Array<{
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
  static updateEnemyCompositionsFromCSV(csvData: any[]): void {
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
  static persistEnemyRollsToGameState(gameState: GameState): void {
    if (!(gameState as any).temporaryData) {
      (gameState as any).temporaryData = {}
    }
    
    const rollsData: Array<{key: string, roll: EnemyRoll}> = []
    for (const [key, roll] of this.activeRolls.entries()) {
      rollsData.push({ key, roll })
    }
    
    (gameState as any).temporaryData.enemyRolls = rollsData
  }

  /**
   * Restore rolls from game state after load
   */
  static restoreEnemyRollsFromGameState(gameState: GameState): void {
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
  static cleanupOldEnemyRolls(): void {
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
  private static generateDefaultEnemyRoll(difficulty: 'Short' | 'Medium' | 'Long'): EnemyRoll {
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
    const bosses: Record<string, string> = {
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
  static getEnemyRollStatistics(): {
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
