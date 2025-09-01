// CombatSystem - Phase 8M Simplified Combat Simulation
// Implements simplified boss challenges and armor effects for strategic gameplay

import type { GameState } from '@/types'
import { BossQuirkHandler, type BossPenalties } from '../combat/BossQuirks'
import { ArmorEffectHandler, type ArmorEffectResult } from '../combat/ArmorEffects'

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

/**
 * Complete combat simulation system implementing Time Hero combat mechanics
 */
export class CombatSystem {
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
      const weaponDamage = this.calculateDamage(bestWeapon, enemy.type)
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
  private static calculateDamage(weapon: WeaponData, enemyType: EnemyType): number {
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
    const weaponMap = new Map<string, any>()
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
}
