// SeedSystem - Phase 8N Implementation
// Complete seed catching mechanics with wind levels and auto-catchers

import type { GameState } from '@/types'

/**
 * Wind level configuration with reach requirements and seed pools
 */
export const WIND_LEVELS = {
  // Level: { name, reachRequired, seedLevels, catchDifficulty }
  1: { name: 'Ground', reach: 1, seedLevels: [0], difficulty: 1.0 },
  2: { name: 'Breeze', reach: 2, seedLevels: [0, 1], difficulty: 1.1 },
  3: { name: 'Gust', reach: 3, seedLevels: [0, 1, 2], difficulty: 1.2 },
  4: { name: 'Gale', reach: 4, seedLevels: [1, 2, 3], difficulty: 1.3 },
  5: { name: 'Jet Stream', reach: 5, seedLevels: [2, 3, 4], difficulty: 1.5 },
  6: { name: 'Cloud Layer', reach: 6, seedLevels: [3, 4, 5], difficulty: 1.7 },
  7: { name: 'Stratosphere', reach: 7, seedLevels: [4, 5, 6], difficulty: 2.0 },
  8: { name: 'Mesosphere', reach: 8, seedLevels: [5, 6, 7], difficulty: 2.3 },
  9: { name: 'Thermosphere', reach: 9, seedLevels: [6, 7, 8], difficulty: 2.6 },
  10: { name: 'Exosphere', reach: 10, seedLevels: [7, 8, 9], difficulty: 3.0 },
  11: { name: 'Low Orbit', reach: 11, seedLevels: [8, 9], difficulty: 3.5 }
} as const

/**
 * Manual catching configuration
 */
export const MANUAL_CATCHING = {
  baseRate: 1,  // seeds per minute at difficulty 1.0
  
  nets: {
    none: { efficiency: 1.0 },
    net_i: { efficiency: 1.2, cost: 75 },      // +20%
    net_ii: { efficiency: 1.4, cost: 400 },    // +40%
    golden_net: { efficiency: 1.6, cost: 2500 }, // +60%
    crystal_net: { efficiency: 1.8, cost: 15000 } // +80%
  },
  
  /**
   * Calculate catch rate for manual seed catching
   */
  calculateCatchRate(windLevel: number, netType: keyof typeof MANUAL_CATCHING.nets, personaSkill: number): {
    seedsPerMinute: number
    seedPool: number[]
  } {
    const level = WIND_LEVELS[windLevel as keyof typeof WIND_LEVELS]
    if (!level) return { seedsPerMinute: 0, seedPool: [] }
    
    const net = this.nets[netType]
    const baseRate = this.baseRate / level.difficulty
    const withNet = baseRate * net.efficiency
    const withSkill = withNet * personaSkill  // 0.7-0.95 based on persona
    
    return {
      seedsPerMinute: withSkill,
      seedPool: level.seedLevels  // Which seed types can appear
    }
  }
}

/**
 * Auto-catcher system configuration
 */
export const AUTO_CATCHERS = {
  tier_i: {
    cost: 1000,
    materials: { iron: 10 },
    rate: 0.1,  // 1 seed per 10 minutes
    poolReduction: 2,  // highest reach - 2
    description: 'Basic passive seed collection'
  },
  
  tier_ii: {
    cost: 5000,
    materials: { silver: 5 },
    rate: 0.2,  // 1 seed per 5 minutes
    poolReduction: 2,  // highest reach - 2
    description: 'Improved passive collection'
  },
  
  tier_iii: {
    cost: 30000,
    materials: { crystal: 3 },
    prereq: 'reach_5',
    rate: 0.5,  // 1 seed per 2 minutes
    poolReduction: 1,  // highest reach - 1
    description: 'Advanced passive collection'
  }
}

/**
 * Seed distribution strategies by game phase
 */
export const SEED_STRATEGY = {
  earlyGame: {
    plotCount: [3, 20],
    strategy: 'focus',
    distribution: {
      highestTier: 0.7,   // 70% best seeds
      midTier: 0.3,       // 30% backup
      lowTier: 0          // No low tier
    }
  },
  
  midGame: {
    plotCount: [20, 40],
    strategy: 'balanced',
    distribution: {
      highestTier: 0.4,   // 40% best seeds
      midTier: 0.4,       // 40% mid tier
      lowTier: 0.2        // 20% quick turnover
    }
  },
  
  lateGame: {
    plotCount: [40, 90],
    strategy: 'diversified',
    distribution: {
      highestTier: 0.3,   // 30% best seeds (600/2000)
      midTier: 0.4,       // 40% mid tier (800/2000)
      lowTier: 0.3        // 30% backup (600/2000)
    }
  }
}

/**
 * Seed type to tier mapping (simplified for Phase 8N)
 */
export const SEED_TIER_MAP = {
  // Tier 0 (Ground level)
  'turnip': 0,
  'carrot': 0,
  'radish': 0,
  
  // Tier 1 (Low reach)
  'potato': 1,
  'cabbage': 1,
  'corn': 1,
  
  // Tier 2 (Medium reach)  
  'tomato': 2,
  'strawberry': 2,
  'spinach': 2,
  
  // Tier 3 (High reach)
  'onion': 3,
  'garlic': 3,
  'cucumber': 3,
  
  // Tier 4 (Very high reach)
  'leek': 4,
  'wheat': 4,
  'asparagus': 4,
  
  // Tier 5+ (Extreme reach)
  'cauliflower': 5,
  'caisim': 5,
  'pumpkin': 6,
  'watermelon': 7,
  'honeydew': 7,
  'pineapple': 8,
  'beetroot': 8,
  'eggplant': 8,
  'soybean': 9,
  'yam': 9
} as const

/**
 * Seed catching and distribution system for Phase 8N
 */
export class SeedSystem {
  /**
   * Get available seed pool based on tower reach and auto-catcher
   */
  static getSeedPool(highestReach: number, autoCatcherTier?: keyof typeof AUTO_CATCHERS): {
    availableSeeds: string[]
    effectiveReach: number
    tierRange: number[]
  } {
    let effectiveReach = highestReach
    
    // Apply auto-catcher reduction
    if (autoCatcherTier) {
      const reduction = AUTO_CATCHERS[autoCatcherTier].poolReduction
      effectiveReach = Math.max(1, highestReach - reduction)
    }
    
    // Get seed levels available at this reach
    const windLevel = Math.min(effectiveReach, 11)
    const tierRange = WIND_LEVELS[windLevel as keyof typeof WIND_LEVELS]?.seedLevels || [0]
    
    // Find seeds matching these tiers
    const availableSeeds: string[] = []
    for (const [seedType, tier] of Object.entries(SEED_TIER_MAP)) {
      if (tierRange.includes(tier)) {
        availableSeeds.push(seedType)
      }
    }
    
    return {
      availableSeeds,
      effectiveReach,
      tierRange
    }
  }

  /**
   * Process manual seed catching
   */
  static processManualCatching(
    gameState: GameState, 
    deltaTime: number, 
    windLevel: number,
    netType: keyof typeof MANUAL_CATCHING.nets = 'none',
    isActiveSession: boolean = true
  ): {
    seedsGained: number
    seedTypes: string[]
    energyUsed: number
  } {
    if (!isActiveSession) {
      return { seedsGained: 0, seedTypes: [], energyUsed: 0 }
    }
    
    // Get persona skill level (0.7-0.95)
    const personaSkill = this.getPersonaCatchingSkill(gameState)
    
    // Calculate catch rate
    const catchRate = MANUAL_CATCHING.calculateCatchRate(windLevel, netType, personaSkill)
    
    // Calculate seeds gained this tick
    const seedsGainedFloat = catchRate.seedsPerMinute * deltaTime
    const seedsGained = Math.floor(seedsGainedFloat)
    
    const seedTypes: string[] = []
    const energyCost = 5 * deltaTime // 5 energy per minute of catching
    
    if (seedsGained > 0 && gameState.resources.energy.current >= energyCost) {
      // Select random seeds from available pool
      const seedPool = this.getSeedsFromTierRange(catchRate.seedPool)
      
      for (let i = 0; i < seedsGained; i++) {
        if (seedPool.length > 0) {
          const randomSeed = seedPool[Math.floor(Math.random() * seedPool.length)]
          seedTypes.push(randomSeed)
          
          // Add to inventory
          const current = gameState.resources.seeds.get(randomSeed) || 0
          gameState.resources.seeds.set(randomSeed, current + 1)
        }
      }
      
      // Consume energy
      gameState.resources.energy.current -= energyCost
      
      return { seedsGained, seedTypes, energyUsed: energyCost }
    }
    
    return { seedsGained: 0, seedTypes: [], energyUsed: 0 }
  }

  /**
   * Process auto-catcher passive collection
   */
  static processAutoCatcher(
    gameState: GameState, 
    deltaTime: number, 
    highestReach: number
  ): {
    seedsGained: number
    seedType: string | null
    autoCatcherTier: keyof typeof AUTO_CATCHERS | null
  } {
    const autoCatcherTier = this.getHighestAutoCatcherTier(gameState)
    
    if (!autoCatcherTier) {
      return { seedsGained: 0, seedType: null, autoCatcherTier: null }
    }
    
    const catcher = AUTO_CATCHERS[autoCatcherTier]
    const seedsGainedFloat = deltaTime * catcher.rate
    const seedsGained = Math.floor(seedsGainedFloat)
    
    if (seedsGained > 0) {
      const seedPool = this.getSeedPool(highestReach, autoCatcherTier)
      
      if (seedPool.availableSeeds.length > 0) {
        const randomSeed = seedPool.availableSeeds[Math.floor(Math.random() * seedPool.availableSeeds.length)]
        
        // Add to inventory
        const current = gameState.resources.seeds.get(randomSeed) || 0
        gameState.resources.seeds.set(randomSeed, current + seedsGained)
        
        return { seedsGained, seedType: randomSeed, autoCatcherTier }
      }
    }
    
    return { seedsGained: 0, seedType: null, autoCatcherTier }
  }

  /**
   * Select optimal seed for planting based on game phase strategy
   */
  static selectSeedForPlanting(gameState: GameState, availableSeeds: Map<string, number>): {
    selectedSeed: string | null
    strategy: string
    distribution: any
  } {
    if (availableSeeds.size === 0) {
      return { selectedSeed: null, strategy: 'none', distribution: null }
    }
    
    const plotCount = gameState.progression.farmPlots
    let strategy = SEED_STRATEGY.earlyGame
    let strategyName = 'early'
    
    // Determine game phase strategy
    if (plotCount >= 40) {
      strategy = SEED_STRATEGY.lateGame
      strategyName = 'late'
    } else if (plotCount >= 20) {
      strategy = SEED_STRATEGY.midGame
      strategyName = 'mid'
    }
    
    // Convert seeds to array with energy values
    const seedArray = Array.from(availableSeeds.entries())
      .filter(([_, count]) => count > 0)
      .map(([seed, count]) => ({
        seed,
        count,
        energyValue: this.getSeedEnergyValue(seed),
        tier: SEED_TIER_MAP[seed as keyof typeof SEED_TIER_MAP] || 0
      }))
    
    if (seedArray.length === 0) {
      return { selectedSeed: null, strategy: strategyName, distribution: strategy.distribution }
    }
    
    // Sort by energy value (descending)
    seedArray.sort((a, b) => b.energyValue - a.energyValue)
    
    // Apply distribution strategy
    const totalSeeds = seedArray.length
    const highTierCount = Math.ceil(totalSeeds * 0.3)
    const midTierCount = Math.ceil(totalSeeds * 0.4)
    
    const highTier = seedArray.slice(0, highTierCount)
    const midTier = seedArray.slice(highTierCount, highTierCount + midTierCount)
    const lowTier = seedArray.slice(highTierCount + midTierCount)
    
    // Weighted random selection
    const roll = Math.random()
    const dist = strategy.distribution
    
    if (roll < dist.highestTier && highTier.length > 0) {
      const selected = highTier[Math.floor(Math.random() * highTier.length)]
      return { selectedSeed: selected.seed, strategy: strategyName, distribution: dist }
    } else if (roll < dist.highestTier + dist.midTier && midTier.length > 0) {
      const selected = midTier[Math.floor(Math.random() * midTier.length)]
      return { selectedSeed: selected.seed, strategy: strategyName, distribution: dist }
    } else if (lowTier.length > 0) {
      const selected = lowTier[Math.floor(Math.random() * lowTier.length)]
      return { selectedSeed: selected.seed, strategy: strategyName, distribution: dist }
    }
    
    // Fallback to first available seed
    return { selectedSeed: seedArray[0].seed, strategy: strategyName, distribution: dist }
  }

  /**
   * Get current wind level based on tower reach
   */
  static getCurrentWindLevel(towerReach: number): {
    level: number
    name: string
    difficulty: number
    seedPool: number[]
  } {
    const level = Math.min(towerReach, 11)
    const windData = WIND_LEVELS[level as keyof typeof WIND_LEVELS] || WIND_LEVELS[1]
    
    return {
      level,
      name: windData.name,
      difficulty: windData.difficulty,
      seedPool: windData.seedLevels
    }
  }

  /**
   * Get persona-based catching skill modifier
   */
  private static getPersonaCatchingSkill(gameState: GameState): number {
    // This would ideally come from the persona system
    // For now, use a simplified calculation based on hero level
    const heroLevel = gameState.progression.heroLevel
    const baseSkill = 0.7 + (heroLevel - 1) * 0.02 // 0.7 to 0.9 range
    
    return Math.min(0.95, Math.max(0.7, baseSkill))
  }

  /**
   * Get highest owned auto-catcher tier
   */
  private static getHighestAutoCatcherTier(gameState: GameState): keyof typeof AUTO_CATCHERS | null {
    const upgrades = gameState.progression.unlockedUpgrades
    
    if (upgrades.includes('tier_iii')) return 'tier_iii'
    if (upgrades.includes('tier_ii')) return 'tier_ii'
    if (upgrades.includes('tier_i')) return 'tier_i'
    
    return null
  }

  /**
   * Get seeds from tier range
   */
  private static getSeedsFromTierRange(tierRange: number[]): string[] {
    const seeds: string[] = []
    
    for (const [seedType, tier] of Object.entries(SEED_TIER_MAP)) {
      if (tierRange.includes(tier)) {
        seeds.push(seedType)
      }
    }
    
    return seeds
  }

  /**
   * Get energy value for a seed type
   */
  private static getSeedEnergyValue(seedType: string): number {
    // Simplified energy values - in full implementation would come from CSV
    const energyValues: { [key: string]: number } = {
      'turnip': 5,
      'carrot': 3,
      'radish': 2,
      'potato': 8,
      'cabbage': 12,
      'corn': 20,
      'tomato': 15,
      'strawberry': 25,
      'spinach': 18,
      'onion': 22,
      'garlic': 30,
      'cucumber': 35,
      'leek': 28,
      'wheat': 40,
      'asparagus': 50,
      'cauliflower': 45,
      'caisim': 38,
      'pumpkin': 60,
      'watermelon': 80,
      'honeydew': 70,
      'pineapple': 100,
      'beetroot': 85,
      'eggplant': 75,
      'soybean': 120,
      'yam': 110
    }
    
    return energyValues[seedType] || 5
  }

  /**
   * Get comprehensive seed metrics for decision making
   */
  static getSeedMetrics(gameState: GameState): {
    totalSeeds: number
    seedVariety: number
    averageTier: number
    strategy: string
    autoCatcherRate: number
    optimalSeed: string | null
  } {
    const seedCounts = Array.from(gameState.resources.seeds.entries())
    const totalSeeds = seedCounts.reduce((sum, [_, count]) => sum + count, 0)
    const seedVariety = seedCounts.filter(([_, count]) => count > 0).length
    
    // Calculate average tier
    let weightedTierSum = 0
    let totalWeightedSeeds = 0
    
    for (const [seedType, count] of seedCounts) {
      if (count > 0) {
        const tier = SEED_TIER_MAP[seedType as keyof typeof SEED_TIER_MAP] || 0
        weightedTierSum += tier * count
        totalWeightedSeeds += count
      }
    }
    
    const averageTier = totalWeightedSeeds > 0 ? weightedTierSum / totalWeightedSeeds : 0
    
    // Get strategy
    const plotCount = gameState.progression.farmPlots
    let strategy = 'early'
    if (plotCount >= 40) strategy = 'late'
    else if (plotCount >= 20) strategy = 'mid'
    
    // Get auto-catcher rate
    const autoCatcherTier = this.getHighestAutoCatcherTier(gameState)
    const autoCatcherRate = autoCatcherTier ? AUTO_CATCHERS[autoCatcherTier].rate * 60 : 0 // Convert to per hour
    
    // Get optimal seed for planting
    const optimalResult = this.selectSeedForPlanting(gameState, gameState.resources.seeds)
    
    return {
      totalSeeds,
      seedVariety,
      averageTier: Math.round(averageTier * 10) / 10,
      strategy,
      autoCatcherRate,
      optimalSeed: optimalResult.selectedSeed
    }
  }
}
