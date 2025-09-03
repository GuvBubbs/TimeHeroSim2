// ActionScorer - AI Action Scoring System
// Phase 9D Implementation

import type { GameState, GameAction, AllParameters } from '../../types'
import type { IActionScorer, IPersonaStrategy, ScoredAction, ScoreFactor } from './types/DecisionTypes'
import { SeedSystem } from '../systems/support/SeedSystem'

/**
 * Action scoring system with persona-based adjustments
 */
export class ActionScorer implements IActionScorer {
  scoreAction(action: GameAction, gameState: GameState, persona: IPersonaStrategy): ScoredAction {
    const baseScore = this.calculateBaseScore(action, gameState)
    const urgencyMultiplier = this.calculateUrgencyMultiplier(action, gameState)
    const futureValue = this.calculateFutureValue(action, gameState)
    
    let totalScore = baseScore * urgencyMultiplier + futureValue
    
    // Apply persona adjustments
    totalScore = persona.adjustActionScore(action, totalScore, gameState)
    
    const factors: ScoreFactor[] = [
      { name: 'Base Score', value: baseScore, reason: `Base score for ${action.type} action` },
      { name: 'Urgency', value: urgencyMultiplier, reason: 'Urgency multiplier based on current needs' },
      { name: 'Future Value', value: futureValue, reason: 'Expected long-term benefits' },
      { name: 'Persona', value: totalScore / (baseScore * urgencyMultiplier + futureValue), reason: 'Persona-based adjustments' }
    ]
    
    const reasoning = `${action.type} action scored ${Math.round(totalScore)} (base: ${Math.round(baseScore)}, urgency: ${urgencyMultiplier.toFixed(2)}x, future: ${Math.round(futureValue)})`
    
    return {
      ...action,
      score: Math.round(totalScore),
      reasoning,
      factors
    }
  }

  calculateBaseScore(action: GameAction, gameState: GameState): number {
    let score = 0

    switch (action.type) {
      case 'harvest':
        // Harvesting is always high priority
        score = 100
        
        // Bonus for energy when low
        if (gameState.resources.energy.current < 50) {
          score += 20
        }
        break
        
      case 'water':
        // Water urgency based on crop water levels
        score = 60
        
        // Higher score if automation is enabled
        if (gameState.automation.wateringEnabled) {
          score += 10
        }
        break
        
      case 'plant':
        // Planting score based on available space and energy
        score = 40
        
        // Higher score if we have excess energy
        if (gameState.resources.energy.current > gameState.automation.energyReserve + 20) {
          score += 15
        }
        break
        
      case 'cleanup':
        // CRITICAL: Score cleanup actions based on priority and plot value
        score = 70 // High base score for cleanup
        
        const plotsAdded = action.expectedRewards?.plots || 0
        const priority = (action.expectedRewards as any)?.priority || 1.0
        
        // Extra points for plot expansion (critical for progression)
        if (plotsAdded > 0) {
          score += plotsAdded * 20 // 20 points per plot
        }
        
        // Apply priority multiplier
        score *= priority
        
        // Boost score in early game when plots are scarce
        if (gameState.progression.farmPlots < 10) {
          score *= 1.5
        }
        break
        
      case 'pump':
        // High priority when water is low
        score = 50
        const waterPercent = gameState.resources.water.current / gameState.resources.water.max
        if (waterPercent < 0.3) {
          score = 90 // Very high priority when water critical
        } else if (waterPercent < 0.5) {
          score = 70 // High priority when water low
        }
        break
        
      case 'move':
        score = this.calculateNavigationScore(action, gameState)
        break
        
      case 'adventure':
        // Adventure scoring based on energy and potential gold rewards
        score = 30 // Base score for adventure
        
        // Higher score when we have good energy (adventures consume energy)
        if (gameState.resources.energy.current > 60) {
          score += 30 // Significant bonus when energy is high
        }
        
        // Bonus for expected gold rewards 
        const goldReward = action.expectedRewards?.gold || 0
        score += goldReward * 0.5 // Scale gold rewards into score
        
        // Bonus when gold is low (need income source)
        if (gameState.resources.gold < 100) {
          score += 20 // Adventures are primary gold source
        }
        break
        
      case 'catch_seeds':
        score = this.calculateSeedCatchingScore(action, gameState)
        break
        
      case 'build':
        // Build actions have ultra-high priority for progression
        score = action.score || 900 // Use pre-set score or default to 900
        break
        
      case 'purchase':
        // Purchase scoring based on gold availability and item importance
        score = 50
        
        // Higher score if we have plenty of gold
        if (gameState.resources.gold > action.goldCost * 2) {
          score += 30
        }
        
        // Blueprint purchases are higher priority
        if (action.target?.includes('blueprint')) {
          score += 40
        }
        break
        
      case 'craft':
        // Crafting score based on material availability and need
        score = 40
        
        // Higher score for weapon/tool crafting
        if (action.target?.includes('weapon') || action.target?.includes('tool')) {
          score += 20
        }
        break
        
      case 'mine':
        // Mining score based on material needs and mining depth
        score = 35
        
        // Higher score when materials are needed
        const materials = gameState.resources.materials
        const commonMaterials = ['stone', 'copper', 'iron']
        const hasLowMaterials = commonMaterials.some(mat => (materials.get(mat) || 0) < 10)
        
        if (hasLowMaterials) {
          score += 25
        }
        break
        
      default:
        score = 10 // Default score for other actions
    }
    
    return Math.max(score, 1) // Ensure minimum score of 1
  }

  calculateNavigationScore(action: GameAction, gameState: GameState): number {
    const targetScreen = action.target as string
    let score = 20 // Default navigation score
    
    // PHASE 9A: ULTRA HIGH PRIORITY for town navigation when blueprint purchases needed
    if (targetScreen === 'town' && this.needsTowerAccess(gameState)) {
      const blueprintNeeded = !gameState.inventory.blueprints.has('blueprint_tower_reach_1')
      const canAfford = gameState.resources.gold >= 25
      
      if (blueprintNeeded && canAfford) {
        return 800 // ULTRA HIGH priority for critical blueprint purchase navigation
      }
    }
    
    // PHASE 8N: PROACTIVE PRIORITY for tower navigation during seed shortage
    if (targetScreen === 'tower') {
      const seedMetrics = SeedSystem.getSeedMetrics(gameState)
      const farmPlots = gameState.progression.farmPlots || 3
      const seedBuffer = Math.max(farmPlots * 2, 6)
      const criticalThreshold = farmPlots
      const lowThreshold = Math.floor(seedBuffer * 0.7)
      
      const isCritical = seedMetrics.totalSeeds < criticalThreshold
      const isLow = seedMetrics.totalSeeds < lowThreshold
      
      if (isCritical) {
        return 998 // Just slightly lower than catch_seeds to ensure proper sequencing
      } else if (isLow) {
        return 700 // High priority for proactive navigation
      }
    }
    
    // PHASE 8N: PREVENT navigation away from tower during seed shortage
    if (gameState.location.currentScreen === 'tower') {
      const seedMetrics = SeedSystem.getSeedMetrics(gameState)
      const farmPlots = gameState.progression.farmPlots || 3
      const seedBuffer = Math.max(farmPlots * 2, 6)
      const criticalThreshold = farmPlots
      const lowThreshold = Math.floor(seedBuffer * 0.7)
      
      const isCritical = seedMetrics.totalSeeds < criticalThreshold
      const isLow = seedMetrics.totalSeeds < lowThreshold
      
      if (isCritical && targetScreen !== 'tower') {
        return 1 // Very low score to discourage leaving tower during critical shortage
      } else if (isLow && targetScreen !== 'tower') {
        return 5 // Low score to discourage leaving tower when running low
      }
    }
    
    return score
  }

  calculateSeedCatchingScore(action: GameAction, gameState: GameState): number {
    const seedMetrics = SeedSystem.getSeedMetrics(gameState)
    const farmPlots = gameState.progression.farmPlots || 3
    const seedsPerPlot = seedMetrics.totalSeeds / farmPlots
    
    // Base score for seed catching
    let score = 25
    
    // PROACTIVE SEED COLLECTION PRIORITY
    const seedBuffer = Math.max(farmPlots * 2, 6) // Want 2x seeds per plot, minimum 6
    const criticalThreshold = farmPlots // Critical when seeds = plots
    const lowThreshold = Math.floor(seedBuffer * 0.7) // Low when < 70% of buffer
    
    const isCritical = seedMetrics.totalSeeds < criticalThreshold
    const isLow = seedMetrics.totalSeeds < lowThreshold
    
    if (isCritical) {
      // ULTRA HIGH PRIORITY: Critical seed shortage
      if (gameState.location.currentScreen === 'tower') {
        score = 9999  // ULTRA MAXIMUM priority when at tower during critical shortage
      } else {
        score = 999  // MAXIMUM priority when critical (but not at tower)
      }
    } else if (isLow) {
      // HIGH PRIORITY: Proactive seed collection when running low  
      if (gameState.location.currentScreen === 'tower') {
        score = 750  // High priority for proactive collection at tower
      } else {
        score = 400  // Moderate priority when low (need to navigate first)
      }
    } else if (seedsPerPlot < 3) {
      score = 200  // Standard priority for maintaining buffer
    }
    
    return score
  }

  calculateUrgencyMultiplier(action: GameAction, gameState: GameState): number {
    let multiplier = 1.0
    
    // Energy-based urgency
    const energyPercent = gameState.resources.energy.current / gameState.resources.energy.max
    if (energyPercent < 0.2 && action.type === 'harvest') {
      multiplier *= 1.5 // Urgent need for energy
    }
    
    // Water-based urgency
    const waterPercent = gameState.resources.water.current / gameState.resources.water.max
    if (waterPercent < 0.3 && (action.type === 'pump' || action.type === 'water')) {
      multiplier *= 1.3 // Urgent need for water
    }
    
    // Gold-based urgency
    if (gameState.resources.gold < 50 && action.type === 'adventure') {
      multiplier *= 1.2 // Need income
    }
    
    // Plot utilization urgency
    const farmPlots = gameState.progression.farmPlots || 3
    const activeCrops = gameState.processes.crops.filter(crop => crop.cropId && !crop.readyToHarvest).length
    const plotUtilization = farmPlots > 0 ? activeCrops / farmPlots : 0
    
    if (plotUtilization < 0.5 && action.type === 'plant') {
      multiplier *= 1.4 // Urgent need to use plots efficiently
    }
    
    return multiplier
  }

  calculateFutureValue(action: GameAction, gameState: GameState): number {
    let futureValue = 0
    
    // Expected rewards contribute to future value
    const rewards = action.expectedRewards
    if (rewards) {
      futureValue += (rewards.gold || 0) * 0.1
      futureValue += (rewards.energy || 0) * 0.5
      futureValue += (rewards.experience || 0) * 0.2
      futureValue += (rewards.plots || 0) * 15 // Plots are very valuable
    }
    
    // Long-term progression value
    if (action.type === 'build' || action.type === 'cleanup') {
      futureValue += 20 // Building and cleanup provide long-term benefits
    }
    
    if (action.type === 'purchase' && action.target?.includes('blueprint')) {
      futureValue += 30 // Blueprints unlock new capabilities
    }
    
    return futureValue
  }

  private needsTowerAccess(gameState: GameState): boolean {
    // Already have tower built
    if (gameState.progression.builtStructures.has('tower_reach_1')) {
      return false
    }
    
    // Already purchased tower blueprint but haven't built it yet
    if (gameState.inventory.blueprints.has('blueprint_tower_reach_1')) {
      return false
    }
    
    // Check if hero needs seeds (proactive tower access)
    const seedMetrics = SeedSystem.getSeedMetrics(gameState)
    const farmPlots = gameState.progression.farmPlots || 3
    const seedBuffer = Math.max(farmPlots * 2, 6)
    const lowThreshold = Math.floor(seedBuffer * 0.7)
    
    return seedMetrics.totalSeeds < lowThreshold
  }
}
