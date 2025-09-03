// ArmorEffects - Phase 8M Simple Armor Effect Implementation
// Handles armor special effects with straightforward trigger mechanics

// Local type definitions for combat-related types
export type ArmorEffect = 
  | 'none'
  | 'Reflection' 
  | 'Evasion'
  | 'Critical Shield'
  | 'Type Resist'
  | 'Speed Boost'
  | 'Regeneration'
  | 'Vampiric'
  | 'Gold Magnet'

export interface Enemy {
  name: string
  health: number
  damage: number
  type?: string
}

export interface ArmorEffectData {
  chance?: number           // Proc chance (0-1)
  healAmount?: number       // HP to heal
  goldMultiplier?: number   // Gold bonus multiplier
  damageReduction?: number  // Damage reduction (0-1)
  reflectPercent?: number   // Damage reflection (0-1)
  maxTriggersPerWave?: number // Max effects per wave
}

/**
 * Armor effect configurations with simple implementations
 */
export const ARMOR_EFFECTS: Record<ArmorEffect, ArmorEffectData> = {
  'none': {},
  
  'Reflection': {
    chance: 0.15,              // 15% chance
    reflectPercent: 0.30,      // Reflect 30% damage back
    damageReduction: 0.30      // Take 70% damage when reflecting
  },
  
  'Evasion': {
    chance: 0.10,              // 10% chance
    damageReduction: 1.0       // Complete dodge (0% damage taken)
  },
  
  'Gold Magnet': {
    goldMultiplier: 1.25       // +25% gold from adventure
  },
  
  'Regeneration': {
    healAmount: 3              // Heal 3 HP between waves
  },
  
  'Type Resist': {
    chance: 0.25,              // 25% of enemies (simplified)
    damageReduction: 0.40      // 40% less damage from type
  },
  
  'Speed Boost': {
    // +20% attack speed after taking damage (effect applied in next combat)
    // Simplified: just track that it was triggered
  },
  
  'Critical Shield': {
    chance: 0.20,              // 20% chance (simplified from "first hit per wave")
    damageReduction: 1.0       // Absorb attack completely
  },
  
  'Vampiric': {
    healAmount: 1,             // Heal 1 HP per kill
    maxTriggersPerWave: 5      // Max 5 HP per wave
  }
}

export interface ArmorEffectResult {
  damageReduction: number    // How much to reduce incoming damage (0-1)
  healAmount: number         // HP to heal
  goldBonus: number         // Additional gold to award
  effectTriggered: string   // Description of what happened
  reflectedDamage?: number  // Damage reflected back to enemy
}

/**
 * Handler for armor special effects
 */
export class ArmorEffectHandler {
  /**
   * Apply armor effect during combat (when taking damage)
   * @param armorEffect Type of armor effect
   * @param incomingDamage Damage being dealt to hero
   * @param enemy Enemy causing the damage
   * @returns Effect result with damage modification and healing
   */
  static applyDuringCombat(
    armorEffect: ArmorEffect,
    incomingDamage: number,
    enemy?: Enemy
  ): ArmorEffectResult {
    const result: ArmorEffectResult = {
      damageReduction: 0,
      healAmount: 0,
      goldBonus: 0,
      effectTriggered: ''
    }

    const effectData = ARMOR_EFFECTS[armorEffect]
    if (!effectData) return result

    // Check if effect triggers (random chance)
    const shouldTrigger = !effectData.chance || Math.random() < effectData.chance

    if (!shouldTrigger) return result

    switch (armorEffect) {
      case 'Reflection':
        result.damageReduction = effectData.damageReduction || 0
        result.reflectedDamage = incomingDamage * (effectData.reflectPercent || 0)
        result.effectTriggered = `✨ Reflection: Reflected ${result.reflectedDamage.toFixed(1)} damage back`
        break

      case 'Evasion':
        result.damageReduction = effectData.damageReduction || 0
        result.effectTriggered = '💨 Evasion: Completely dodged the attack!'
        break

      case 'Critical Shield':
        result.damageReduction = effectData.damageReduction || 0
        result.effectTriggered = '🛡️ Critical Shield: Absorbed the attack!'
        break

      case 'Type Resist':
        result.damageReduction = effectData.damageReduction || 0
        const enemyType = enemy ? enemy.type : 'enemy'
        result.effectTriggered = `🛡️ Type Resist: Reduced damage from ${enemyType}`
        break

      case 'Speed Boost':
        // Speed boost doesn't reduce current damage, just affects next combat
        result.effectTriggered = '⚡ Speed Boost: Attack speed increased for next enemy'
        break
    }

    return result
  }

  /**
   * Apply armor effect between waves (healing effects)
   * @param armorEffect Type of armor effect
   * @returns Healing amount
   */
  static applyBetweenWaves(armorEffect: ArmorEffect): ArmorEffectResult {
    const result: ArmorEffectResult = {
      damageReduction: 0,
      healAmount: 0,
      goldBonus: 0,
      effectTriggered: ''
    }

    if (armorEffect === 'Regeneration') {
      const effectData = ARMOR_EFFECTS['Regeneration']
      result.healAmount = effectData.healAmount || 0
      result.effectTriggered = `💚 Regeneration: +${result.healAmount} HP between waves`
    }

    return result
  }

  /**
   * Apply armor effect on enemy kill (vampiric healing)
   * @param armorEffect Type of armor effect
   * @param killsThisWave Number of kills already this wave (for max tracking)
   * @returns Healing amount
   */
  static applyOnKill(armorEffect: ArmorEffect, killsThisWave: number = 0): ArmorEffectResult {
    const result: ArmorEffectResult = {
      damageReduction: 0,
      healAmount: 0,
      goldBonus: 0,
      effectTriggered: ''
    }

    if (armorEffect === 'Vampiric') {
      const effectData = ARMOR_EFFECTS['Vampiric']
      const maxHealing = effectData.maxTriggersPerWave || 5

      if (killsThisWave < maxHealing) {
        result.healAmount = effectData.healAmount || 0
        result.effectTriggered = `🩸 Vampiric healing: +${result.healAmount} HP`
      }
    }

    return result
  }

  /**
   * Apply armor effect on adventure completion (gold bonuses)
   * @param armorEffect Type of armor effect
   * @param baseGold Original gold amount
   * @returns Modified gold amount and bonus
   */
  static applyOnCompletion(armorEffect: ArmorEffect, baseGold: number): ArmorEffectResult {
    const result: ArmorEffectResult = {
      damageReduction: 0,
      healAmount: 0,
      goldBonus: 0,
      effectTriggered: ''
    }

    if (armorEffect === 'Gold Magnet') {
      const effectData = ARMOR_EFFECTS['Gold Magnet']
      const multiplier = effectData.goldMultiplier || 1
      result.goldBonus = Math.floor(baseGold * (multiplier - 1))
      result.effectTriggered = `💰 Gold Magnet: +${result.goldBonus} bonus gold`
    }

    return result
  }

  /**
   * Get description of armor effect
   */
  static getEffectDescription(armorEffect: ArmorEffect): string {
    switch (armorEffect) {
      case 'none':
        return 'No special effect'
      case 'Reflection':
        return '15% chance to reflect 30% damage back to enemy'
      case 'Evasion':
        return '10% chance to completely dodge an attack'
      case 'Gold Magnet':
        return '+25% gold from this adventure'
      case 'Regeneration':
        return 'Heal 3 HP between waves'
      case 'Type Resist':
        return '40% less damage from specific enemy types'
      case 'Speed Boost':
        return '+20% attack speed after taking damage'
      case 'Critical Shield':
        return 'Chance to absorb attacks completely'
      case 'Vampiric':
        return 'Heal 1 HP per enemy killed (max 5 per wave)'
      default:
        return 'Unknown effect'
    }
  }
}
