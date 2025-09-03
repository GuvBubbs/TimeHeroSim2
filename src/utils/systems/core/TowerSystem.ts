// TowerSystem - Phase 10B Core Game Loop System
// Tower navigation, seed catching, and reach upgrade system implementing GameSystem interface

import type { GameState, GameAction, AllParameters, SimulationConfig } from '@/types'
import { SeedSystem, MANUAL_CATCHING, AUTO_CATCHERS } from '../support/SeedSystem'
import { 
  type ActionResult, 
  type SystemTickResult, 
  type ValidationResult,
  type EvaluationContext,
  createSuccessResult,
  createFailureResult,
  createTickResult
} from '../GameSystem'

/**
 * Tower system for seed catching and reach upgrades - implements GameSystem contract
 */
export class TowerSystem {
  // =============================================================================
  // GAMESYSTEM INTERFACE IMPLEMENTATION
  // =============================================================================

  /**
   * Evaluate tower-related actions that can be performed
   */
  static evaluateActions(
    state: GameState, 
    config: SimulationConfig | AllParameters,
    context: EvaluationContext
  ): GameAction[] {
    const actions: GameAction[] = []
    const parameters = this.extractTowerParameters(config)
    
    if (!parameters) return actions
    
    // Get current tower metrics using SeedSystem
    const towerReach = this.getCurrentTowerReach(state)
    const windLevel = SeedSystem.getCurrentWindLevel(towerReach)
    const seedMetrics = SeedSystem.getSeedMetrics(state)
    
    // Manual seed catching (Phase 8N: Enhanced with wind mechanics, aggressive in early game)
    const farmPlots = state.progression.farmPlots || 3
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
    
    if (needsSeeds && state.resources.energy.current > 30) {
      const catchDuration = parameters.decisionLogic?.catchDuration || 3
      
      // Use SeedSystem to calculate expected catch rate
      const catchRate = MANUAL_CATCHING.calculateCatchRate(
        windLevel.level,
        this.getBestNet(state),
        this.getPersonaCatchingSkill(state)
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
    if (state.resources.gold >= 1000) {
      const currentAutoCatcher = this.getAutoCatcherTier(state)
      const nextTier = this.getNextAutoCatcherTier(currentAutoCatcher)
      
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
    if (parameters.unlockProgression?.reachLevelCosts && 
        state.resources.energy.current > 50) {
      const currentReach = this.getCurrentTowerReach(state)
      const nextCost = parameters.unlockProgression.reachLevelCosts[currentReach]
      
      if (nextCost && state.resources.gold >= nextCost) {
        actions.push({
          id: `upgrade_reach_${currentReach + 1}_${Date.now()}`,
          type: 'purchase',
          screen: 'tower',
          target: `tower_reach_${currentReach + 1}`,
          duration: 2,
          energyCost: 0,
          goldCost: nextCost,
          prerequisites: [],
          expectedRewards: {}
        })
      }
    }
    
    return actions
  }

  /**
   * Execute a tower-related action
   */
  static execute(action: GameAction, state: GameState): ActionResult {
    try {
      switch (action.type) {
        case 'catch_seeds':
          return this.executeCatchSeedAction(action, state)
        case 'purchase':
          if (action.target?.includes('autocatcher')) {
            return this.executeAutoCatcherUpgrade(action, state)
          } else if (action.target?.includes('tower_reach')) {
            return this.executeReachUpgrade(action, state)
          }
          return createFailureResult(`Unknown tower purchase: ${action.target}`)
        default:
          return createFailureResult(`Unknown tower action type: ${action.type}`)
      }
    } catch (error) {
      return createFailureResult(`Error executing tower action: ${error}`)
    }
  }

  /**
   * Process tower systems during simulation tick
   */
  static tick(deltaTime: number, state: GameState): SystemTickResult {
    const stateChanges: Record<string, any> = {}
    const events: any[] = []

    try {
      // Process ongoing seed catching
      const seedCatchingResult = this.processSeedCatching(state, deltaTime, null)
      if (seedCatchingResult.completed) {
        Object.assign(stateChanges, seedCatchingResult.stateChanges)
        events.push(...seedCatchingResult.events)
      }

      // Process auto-catchers
      const towerReach = this.getCurrentTowerReach(state)
      const autoCatcherResult = SeedSystem.processAutoCatcher(state, deltaTime, towerReach)
      if (autoCatcherResult && autoCatcherResult.seedsGained > 0) {
        events.push({
          type: 'autocatcher_seeds',
          description: `Auto-catcher collected ${autoCatcherResult.seedsGained} seeds`,
          importance: 'low'
        })
      }

    } catch (error) {
      events.push({
        type: 'tower_error',
        description: `Error in tower tick: ${error}`,
        importance: 'high'
      })
    }

    return createTickResult(stateChanges, events)
  }

  /**
   * Validate if a tower action can be executed
   */
  static canExecute(action: GameAction, state: GameState): ValidationResult {
    switch (action.type) {
      case 'catch_seeds':
        return this.canCatchSeeds(action, state)
      case 'purchase':
        return this.canPurchase(action, state)
      default:
        return { canExecute: false, reason: `Unknown action type: ${action.type}` }
    }
  }

  // =============================================================================
  // PARAMETER EXTRACTION
  // =============================================================================

  /**
   * Extract tower parameters from configuration
   */
  private static extractTowerParameters(config: SimulationConfig | AllParameters): any {
    if ('tower' in config) {
      return config.tower
    }
    // Default tower parameters
    return {
      priorities: { upgradeOrder: ['reach', 'autocatcher', 'nets'] },
      decisionLogic: { catchDuration: 3 },
      unlockProgression: { reachLevelCosts: { 1: 100, 2: 250, 3: 500 } }
    }
  }

  // =============================================================================
  // TOWER REACH SYSTEM (MOVED FROM SIMULATIONENGINE)
  // =============================================================================

  /**
   * Get current tower reach level
   * MOVED FROM SimulationEngine.getCurrentTowerReach()
   */
  static getCurrentTowerReach(gameState: GameState): number {
    let reach = 1 // Base reach
    
    // Check built tower reaches
    for (let level = 1; level <= 11; level++) {
      if (gameState.progression.builtStructures.has(`tower_reach_${level}`)) {
        reach = Math.max(reach, level)
      }
    }
    
    return reach
  }  // =============================================================================
  // ACTION EXECUTION METHODS  
  // =============================================================================

  /**
   * Execute seed catching action
   */
  private static executeCatchSeedAction(action: GameAction, state: GameState): ActionResult {
    // Check if already catching seeds
    if (state.processes.seedCatching && !state.processes.seedCatching.isComplete) {
      return createFailureResult('Already catching seeds')
    }

    // Start seed catching process
    state.processes.seedCatching = {
      startedAt: state.time.totalMinutes,
      duration: action.duration,
      progress: 0,
      windLevel: SeedSystem.getCurrentWindLevel(this.getCurrentTowerReach(state)).level,
      netType: this.getBestNet(state) as string,
      expectedSeeds: 0,
      isComplete: false
    }

    return createSuccessResult(
      `Started catching seeds for ${action.duration} minutes`,
      { 'processes.seedCatching': state.processes.seedCatching }
    )
  }

  /**
   * Execute auto-catcher upgrade
   */
  private static executeAutoCatcherUpgrade(action: GameAction, state: GameState): ActionResult {
    if (state.resources.gold < action.goldCost) {
      return createFailureResult('Not enough gold for auto-catcher upgrade')
    }

    // Add the structure to built structures
    state.progression.builtStructures.add(action.target!)
    state.resources.gold -= action.goldCost

    return createSuccessResult(
      `Upgraded auto-catcher to ${action.target}`,
      {
        'progression.builtStructures': state.progression.builtStructures,
        'resources.gold': state.resources.gold
      }
    )
  }

  /**
   * Execute tower reach upgrade
   */
  private static executeReachUpgrade(action: GameAction, state: GameState): ActionResult {
    if (state.resources.gold < action.goldCost) {
      return createFailureResult('Not enough gold for reach upgrade')
    }

    if (state.resources.energy.current < action.energyCost) {
      return createFailureResult('Not enough energy for reach upgrade')
    }

    // Add the structure to built structures
    state.progression.builtStructures.add(action.target!)
    state.resources.gold -= action.goldCost
    state.resources.energy.current -= action.energyCost

    return createSuccessResult(
      `Upgraded tower reach to ${action.target}`,
      {
        'progression.builtStructures': state.progression.builtStructures,
        'resources.gold': state.resources.gold,
        'resources.energy.current': state.resources.energy.current
      }
    )
  }

  // =============================================================================
  // VALIDATION METHODS
  // =============================================================================

  /**
   * Validate seed catching action
   */
  private static canCatchSeeds(action: GameAction, state: GameState): ValidationResult {
    // Check if already catching seeds
    if (state.processes.seedCatching && !state.processes.seedCatching.isComplete) {
      return { canExecute: false, reason: 'Already catching seeds' }
    }

    // Check if in tower location
    if (state.location.currentScreen !== 'tower') {
      return { canExecute: false, reason: 'Must be in tower to catch seeds' }
    }

    return { canExecute: true }
  }

  /**
   * Validate purchase action
   */
  private static canPurchase(action: GameAction, state: GameState): ValidationResult {
    if (state.resources.gold < action.goldCost) {
      return { 
        canExecute: false, 
        reason: 'Not enough gold',
        missingResources: { gold: action.goldCost - state.resources.gold }
      }
    }

    if (state.resources.energy.current < action.energyCost) {
      return { 
        canExecute: false, 
        reason: 'Not enough energy',
        missingResources: { energy: action.energyCost - state.resources.energy.current }
      }
    }

    return { canExecute: true }
  }

  // =============================================================================
  // EXISTING METHODS (Phase 9C Implementation)
  // =============================================================================

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
      const towerReach = this.getCurrentTowerReach(gameState)
      const windLevel = SeedSystem.getCurrentWindLevel(towerReach)
      const catchRate = MANUAL_CATCHING.calculateCatchRate(
        windLevel.level,
        this.getBestNet(gameState),
        this.getPersonaCatchingSkill(gameState)
      )
      
      const seedsGained = Math.floor(catchRate.seedsPerMinute * process.duration)
      const seedPool = catchRate.seedPool
      
      // Add seeds to inventory
      const seedTypes = this.selectSeedsFromPool(seedPool, seedsGained, gameDataStore)
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
