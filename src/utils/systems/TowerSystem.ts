// TowerSystem - Phase 9C Implementation
// Tower navigation, seed catching, and reach upgrade system

import type { GameState, GameAction, AllParameters } from '@/types'
import { SeedSystem, MANUAL_CATCHING, AUTO_CATCHERS } from './SeedSystem'

/**
 * Tower system for seed catching and reach upgrades
 */
export class TowerSystem {
  /**
   * Evaluates tower-specific actions (Phase 8N: Enhanced with SeedSystem)
   */
  static evaluateActions(gameState: GameState, parameters: AllParameters, gameDataStore: any): GameAction[] {
    const actions: GameAction[] = []
    const towerParams = parameters.tower
    
    if (!towerParams) return actions
    
    // Get current tower metrics using SeedSystem
    const towerReach = TowerSystem.getCurrentTowerReach(gameState)
    const windLevel = SeedSystem.getCurrentWindLevel(towerReach)
    const seedMetrics = SeedSystem.getSeedMetrics(gameState)
    
    // Manual seed catching (Phase 8N: Enhanced with wind mechanics, aggressive in early game)
    const farmPlots = gameState.progression.farmPlots || 3
    const seedTargetBase = Math.max(farmPlots * 2, 6)  // At least 6 seeds, 2x farm plots
    const needsSeeds = seedMetrics.totalSeeds < seedTargetBase
    
    // PHASE 8N FIX: Navigate back to farm when seeds are sufficient
    if (!needsSeeds && seedMetrics.totalSeeds >= seedTargetBase) {
      console.log(`🚪 TOWER EXIT: Seeds sufficient (${seedMetrics.totalSeeds}/${seedTargetBase}) - returning to farm`)
      actions.push({
        id: `tower_to_farm_${Date.now()}`,
        type: 'move',
        screen: 'tower',
        target: 'farm',
        duration: 1,
        energyCost: 0,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: {}
      })
      return actions // Return immediately to prioritize farm return
    }
    
    if (needsSeeds && gameState.resources.energy.current > 30) {
      const catchDuration = towerParams.decisionLogic?.catchDuration || 3
      
      // Use SeedSystem to calculate expected catch rate
      const catchRate = MANUAL_CATCHING.calculateCatchRate(
        windLevel.level,
        TowerSystem.getBestNet(gameState),
        TowerSystem.getPersonaCatchingSkill(gameState)
      )
      
      const expectedSeeds = Math.floor(catchRate.seedsPerMinute * catchDuration)
      
      actions.push({
        id: `catch_seeds_${Date.now()}`,
        type: 'catch_seeds',
        screen: 'tower',
        target: 'manual_catch',
        duration: catchDuration,
        energyCost: 0, // FIXED: Seed catching costs no energy
        goldCost: 0,
        prerequisites: [],
        expectedRewards: {
          items: ['seeds_mixed']
        }
      })
    }
    
    // Auto-catcher upgrades (Phase 8N: Enhanced with SeedSystem rates)
    if (gameState.resources.gold >= 1000) {
      const currentAutoCatcher = TowerSystem.getAutoCatcherTier(gameState)
      const nextTier = TowerSystem.getNextAutoCatcherTier(currentAutoCatcher)
      
      if (nextTier) {
        const tierData = AUTO_CATCHERS[nextTier]
        
        actions.push({
          id: `upgrade_autocatcher_${nextTier}_${Date.now()}`,
          type: 'purchase',
          screen: 'tower',
          target: nextTier,
          duration: 1,
          energyCost: 0,
          goldCost: tierData.cost,
          prerequisites: [],
          expectedRewards: {}
        })
      }
    }
    
    // Tower reach upgrades
    if (towerParams.unlockProgression?.reachLevelCosts && 
        gameState.resources.energy.current > 50) {
      const currentReach = TowerSystem.getCurrentTowerReach(gameState)
      const nextCost = towerParams.unlockProgression.reachLevelCosts[currentReach]
      
      if (nextCost && gameState.resources.gold >= nextCost) {
        actions.push({
          id: `tower_reach_upgrade_${Date.now()}`,
          type: 'purchase',
          screen: 'tower',
          target: `tower_reach_${currentReach + 1}`,
          duration: 2,
          energyCost: towerParams.unlockProgression.reachLevelEnergy?.[currentReach] || 20,
          goldCost: nextCost,
          prerequisites: [],
          expectedRewards: {}
        })
      }
    }
    
    return actions
  }

  /**
   * Process ongoing seed catching activities
   */
  static processSeedCatching(gameState: GameState, deltaTime: number, gameDataStore: any): {
    completed: boolean
    stateChanges: any
    events: any[]
  } {
    const process = gameState.processes.seedCatching
    
    if (!process || process.isComplete) {
      return { completed: false, stateChanges: {}, events: [] }
    }
    
    // Update progress
    const elapsed = (gameState.time.totalMinutes - process.startedAt)
    process.progress = Math.min(1.0, elapsed / process.duration)
    
    // Check if completed
    if (elapsed >= process.duration) {
      // Calculate seeds gained based on wind level and equipment
      const towerReach = TowerSystem.getCurrentTowerReach(gameState)
      const windLevel = SeedSystem.getCurrentWindLevel(towerReach)
      const catchRate = MANUAL_CATCHING.calculateCatchRate(
        windLevel.level,
        TowerSystem.getBestNet(gameState),
        TowerSystem.getPersonaCatchingSkill(gameState)
      )
      
      const seedsGained = Math.floor(catchRate.seedsPerMinute * process.duration)
      const seedPool = catchRate.seedPool
      
      // Add seeds to inventory
      const seedTypes = TowerSystem.selectSeedsFromPool(seedPool, seedsGained, gameDataStore)
      for (const seedType of seedTypes) {
        const currentAmount = gameState.resources.seeds.get(seedType) || 0
        gameState.resources.seeds.set(seedType, currentAmount + 1)
      }
      
      // Complete the process
      process.isComplete = true
      process.progress = 1.0
      
      return {
        completed: true,
        stateChanges: {
          'processes.seedCatching.isComplete': true,
          'processes.seedCatching.progress': 1.0
        },
        events: [{
          type: 'seed_catching_complete',
          description: `Caught ${seedsGained} seeds at wind level ${windLevel.level}`,
          rewards: { seeds: seedTypes }
        }]
      }
    }
    
    return { completed: false, stateChanges: {}, events: [] }
  }

  /**
   * Get current tower reach level
   */
  static getCurrentTowerReach(gameState: GameState): number {
    let reach = 1 // Base reach
    
    // Check built tower reaches
    for (let level = 1; level <= 11; level++) {
      if (gameState.progression.builtStructures.has(`tower_reach_${level}`)) {
        reach = level
      }
    }
    
    return reach
  }

  /**
   * Get best available net for catching
   */
  static getBestNet(gameState: GameState): keyof typeof MANUAL_CATCHING.nets {
    const nets = ['crystal_net', 'golden_net', 'net_ii', 'net_i', 'none'] as const
    
    for (const net of nets) {
      if (net === 'none' || gameState.inventory.tools.has(net)) {
        return net
      }
    }
    
    return 'none'
  }

  /**
   * Get persona-based catching skill modifier
   */
  static getPersonaCatchingSkill(gameState: GameState): number {
    // Default skill level - could be enhanced with persona data
    return 1.0
  }

  /**
   * Get highest owned auto-catcher tier
   */
  static getAutoCatcherTier(gameState: GameState): keyof typeof AUTO_CATCHERS | null {
    const tiers = ['tier_iii', 'tier_ii', 'tier_i'] as const
    
    for (const tier of tiers) {
      if (gameState.progression.builtStructures.has(tier)) {
        return tier
      }
    }
    
    return null
  }

  /**
   * Get next auto-catcher tier to upgrade to
   */
  static getNextAutoCatcherTier(currentTier: keyof typeof AUTO_CATCHERS | null): keyof typeof AUTO_CATCHERS | null {
    if (!currentTier) return 'tier_i'
    
    const tierProgression = {
      'tier_i': 'tier_ii',
      'tier_ii': 'tier_iii',
      'tier_iii': null
    } as const
    
    return tierProgression[currentTier] || null
  }

  /**
   * Select seeds from pool based on tier distribution
   */
  static selectSeedsFromPool(seedPool: number[], count: number, gameDataStore: any): string[] {
    // Use a simple mapping from tiers to seed types for now
    const tierToSeeds: Record<number, string[]> = {
      0: ['turnip', 'carrot', 'radish'],
      1: ['potato', 'cabbage', 'corn'],
      2: ['tomato', 'strawberry', 'spinach'],
      3: ['onion', 'garlic', 'cucumber'],
      4: ['leek', 'wheat', 'asparagus'],
      5: ['cauliflower', 'caisim'],
      6: ['pumpkin'],
      7: ['watermelon', 'honeydew'],
      8: ['pineapple', 'beetroot', 'eggplant'],
      9: ['soybean', 'yam']
    }
    
    const availableSeeds: string[] = []
    for (const tier of seedPool) {
      if (tierToSeeds[tier]) {
        availableSeeds.push(...tierToSeeds[tier])
      }
    }
    
    const selectedSeeds: string[] = []
    
    for (let i = 0; i < count; i++) {
      if (availableSeeds.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableSeeds.length)
        selectedSeeds.push(availableSeeds[randomIndex])
      }
    }
    
    return selectedSeeds
  }

  /**
   * Determines if hero needs tower access for seed collection
   */
  static needsTowerAccess(gameState: GameState): boolean {
    // Already have tower built
    if (gameState.progression.builtStructures.has('tower_reach_1')) {
      return false
    }
    
    // Already purchased tower blueprint but haven't built it yet
    if (gameState.inventory.blueprints.has('blueprint_tower_reach_1')) {
      return false
    }
    
    // Check if seeds are low using existing SeedSystem logic
    const seedMetrics = SeedSystem.getSeedMetrics(gameState)
    const farmPlots = gameState.progression.farmPlots || 3
    const seedBuffer = Math.max(farmPlots * 2, 6) // Want 2x seeds per plot, minimum 6 seeds
    const lowThreshold = Math.floor(seedBuffer * 0.7) // Low when < 70% of buffer
    
    return seedMetrics.totalSeeds < lowThreshold
  }
}
