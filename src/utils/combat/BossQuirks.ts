// BossQuirks - Phase 8M Simplified Boss Challenge System
// Implements straightforward penalties/bonuses instead of complex combat simulations

// Local type definitions for combat-related types
export type WeaponType = 'sword' | 'axe' | 'bow' | 'staff' | 'dagger' | 'spear' | 'wand'
export type BossType = 
  | 'Giant Slime'
  | 'Beetle Lord'
  | 'Alpha Wolf'
  | 'Sky Serpent'
  | 'Crystal Spider'
  | 'Frost Wyrm'
  | 'Lava Titan'

export interface ArmorData {
  defense: number
  effect?: string
}

export interface BossChallenge {
  description: string
  implementation: string
  encourages: string
}

export interface BossPenalties {
  bonusDamage: number      // Additional damage to take
  durationMultiplier: number // Multiplier for combat duration
  unavoidableDamage: number // Direct HP loss (as % of max HP)
}

/**
 * Simplified boss challenges that encourage specific gear choices
 */
export const BOSS_CHALLENGES: Record<BossType, BossChallenge> = {
  'Giant Slime': {
    description: 'Splits into minions at 50% HP',
    implementation: 'Add 50% more total damage to deal',
    encourages: 'High defense armor'
  },
  
  'Beetle Lord': {
    description: 'Hard shell reduces non-weakness damage',
    implementation: 'Takes 2x normal time without spear',
    encourages: 'Spear weapon requirement'
  },
  
  'Alpha Wolf': {
    description: 'Summons wolf cubs during fight',
    implementation: 'Add 30% more incoming damage',
    encourages: 'Reflection armor or high DPS'
  },
  
  'Sky Serpent': {
    description: 'Goes aerial periodically',
    implementation: 'Without bow, take 20% unavoidable damage',
    encourages: 'Bow weapon requirement'
  },
  
  'Crystal Spider': {
    description: 'Web traps disable weapons',
    implementation: 'Add 15% combat duration penalty',
    encourages: 'High defense to survive disabled periods'
  },
  
  'Frost Wyrm': {
    description: 'Gains armor at low HP',
    implementation: 'Last 50% HP takes 2x longer without wand',
    encourages: 'Wand for late phase'
  },
  
  'Lava Titan': {
    description: 'Constant burn damage',
    implementation: 'Fixed 10% HP loss over adventure',
    encourages: 'Regeneration armor'
  }
}

/**
 * Calculate boss-specific penalties based on equipment
 */
export class BossQuirkHandler {
  /**
   * Apply simplified boss challenge based on equipment
   * @param bossType Type of boss being fought
   * @param weapons Map of available weapons
   * @param armor Equipped armor (if any)
   * @param maxHP Hero's maximum HP
   * @returns Penalties to apply to combat
   */
  static calculatePenalties(
    bossType: BossType,
    weapons: Map<WeaponType, any>,
    armor: ArmorData | null,
    maxHP: number
  ): BossPenalties {
    const penalties: BossPenalties = {
      bonusDamage: 0,
      durationMultiplier: 1.0,
      unavoidableDamage: 0
    }

    switch (bossType) {
      case 'Giant Slime':
        // Add 50% more total damage to deal
        penalties.bonusDamage = maxHP * 0.5
        break

      case 'Beetle Lord':
        // Takes 2x normal time without spear
        if (!weapons.has('spear')) {
          penalties.durationMultiplier = 2.0
        }
        break

      case 'Alpha Wolf':
        // Add 30% more incoming damage
        penalties.bonusDamage = maxHP * 0.3
        break

      case 'Sky Serpent':
        // Without bow, take 20% unavoidable damage
        if (!weapons.has('bow')) {
          penalties.unavoidableDamage = maxHP * 0.2
        }
        break

      case 'Crystal Spider':
        // Add 15% combat duration penalty
        penalties.durationMultiplier = 1.15
        break

      case 'Frost Wyrm':
        // Last 50% HP takes 2x longer without wand
        if (!weapons.has('wand')) {
          penalties.durationMultiplier = 1.5 // Simplified to overall duration increase
        }
        break

      case 'Lava Titan':
        // Fixed 10% HP loss without regeneration armor
        if (armor?.effect !== 'Regeneration') {
          penalties.unavoidableDamage = maxHP * 0.1
        }
        break
    }

    return penalties
  }

  /**
   * Get human-readable description of boss challenge and counter-strategy
   */
  static getChallenge(bossType: BossType): BossChallenge {
    return BOSS_CHALLENGES[bossType]
  }

  /**
   * Check if player has appropriate counter for boss
   */
  static hasCounter(
    bossType: BossType, 
    weapons: Map<WeaponType, any>, 
    armor: ArmorData | null
  ): boolean {
    switch (bossType) {
      case 'Beetle Lord':
        return weapons.has('spear')
      case 'Sky Serpent':
        return weapons.has('bow')
      case 'Frost Wyrm':
        return weapons.has('wand')
      case 'Lava Titan':
        return armor?.effect === 'Regeneration'
      case 'Giant Slime':
      case 'Alpha Wolf':
      case 'Crystal Spider':
        return true // No specific weapon requirement, defense/armor dependent
      default:
        return true
    }
  }

  /**
   * Get recommendation for handling specific boss
   */
  static getRecommendation(bossType: BossType): string {
    const challenge = BOSS_CHALLENGES[bossType]
    return `${challenge.description} - ${challenge.encourages}`
  }
}
