// BottleneckAnalyzer - Automated Detection of Simulation Progression Issues
// Identifies resource shortages, prerequisite blocks, and decision failures

import type {
  SimulationResult,
  BottleneckAnalysis,
  Bottleneck,
  ResourceBottleneck,
  PrerequisiteBottleneck,
  DecisionBottleneck,
  ParameterBottleneck,
  GameTime,
  GameState
} from '@/types/reports'
import type { GameDataStore } from '@/stores/gameData'
import type { ExecutedAction } from '@/types/simulation'

interface BottleneckThresholds {
  minDelayDays: number              // Consider bottlenecks >= X days
  resourceStarvationRatio: number   // Resource below X% of needed
  decisionStuckThreshold: number    // Same low-score decision X+ times
  progressStagnationDays: number    // No meaningful progress for X+ days
}

interface StarvationPeriod {
  startDay: number
  endDay: number
  duration: number
}

export class BottleneckAnalyzer {
  private gameDataStore: GameDataStore
  private thresholds: BottleneckThresholds
  
  constructor(gameDataStore: GameDataStore) {
    this.gameDataStore = gameDataStore
    this.thresholds = {
      minDelayDays: 0.5,              // Consider bottlenecks >= 0.5 days
      resourceStarvationRatio: 0.1,    // Resource below 10% of needed
      decisionStuckThreshold: 3,       // Same low-score decision 3+ times
      progressStagnationDays: 2        // No meaningful progress for 2+ days
    }
  }
  
  async analyze(result: SimulationResult): Promise<BottleneckAnalysis> {
    const bottlenecks: Bottleneck[] = []
    
    // 1. Resource shortage bottlenecks
    bottlenecks.push(...this.detectResourceBottlenecks(result))
    
    // 2. Prerequisite blocking bottlenecks  
    bottlenecks.push(...this.detectPrerequisiteBottlenecks(result))
    
    // 3. Decision quality bottlenecks
    bottlenecks.push(...this.detectDecisionBottlenecks(result))
    
    // 4. Parameter configuration bottlenecks
    bottlenecks.push(...this.detectParameterBottlenecks(result))
    
    // Sort by severity and impact
    bottlenecks.sort((a, b) => (b.severity * b.daysLost) - (a.severity * a.daysLost))
    
    const totalDelayDays = bottlenecks.reduce((sum, b) => sum + b.daysLost, 0)
    const severity = this.calculateOverallSeverity(bottlenecks, totalDelayDays)
    
    return {
      detectedBottlenecks: bottlenecks,
      severity,
      totalDelayDays,
      categories: this.categorizeBottlenecks(bottlenecks)
    }
  }
  
  // ===== RESOURCE BOTTLENECK DETECTION =====
  
  private detectResourceBottlenecks(result: SimulationResult): ResourceBottleneck[] {
    const bottlenecks: ResourceBottleneck[] = []
    const stateHistory = result.gameStateHistory
    
    if (stateHistory.length === 0) return bottlenecks
    
    // Scan through simulation looking for resource starvation periods
    for (let i = 1; i < stateHistory.length; i++) {
      const currentState = stateHistory[i]
      const previousState = stateHistory[i - 1]
      
      // Check energy bottlenecks
      if (currentState.resources.energy.current < 10 && 
          previousState.resources.energy.current < 10) {
        
        // Find duration of energy starvation
        const starvationPeriod = this.findResourceStarvationPeriod(
          stateHistory, i, 'energy', 10
        )
        
        if (starvationPeriod.duration >= this.thresholds.minDelayDays) {
          bottlenecks.push({
            type: 'resource',
            severity: Math.min(10, starvationPeriod.duration * 2),
            startDay: starvationPeriod.startDay,
            endDay: starvationPeriod.endDay,
            daysLost: starvationPeriod.duration,
            description: `Energy starvation prevented actions for ${starvationPeriod.duration.toFixed(1)} days`,
            cause: 'Insufficient energy generation or poor energy management',
            impact: 'Unable to perform farm activities, purchases, or adventures',
            recommendation: 'Increase farming efficiency or adjust energy consumption parameters',
            gameStateSnapshot: currentState,
            relevantActions: this.getRelevantActions(result, starvationPeriod),
            parameterSettings: result.configuration.parameterOverrides,
            resource: 'energy',
            requiredAmount: 50,  // Minimum for most actions
            availableAmount: currentState.resources.energy.current,
            generationRate: this.calculateEnergyGenerationRate(stateHistory, i),
            consumptionRate: this.calculateEnergyConsumptionRate(stateHistory, i),
            timeToResolve: this.calculateTimeToResolve(stateHistory, i, 'energy', 50)
          })
        }
      }
      
      // Check gold bottlenecks
      if (currentState.resources.gold < 50 && previousState.resources.gold < 50) {
        const starvationPeriod = this.findResourceStarvationPeriod(
          stateHistory, i, 'gold', 50
        )
        
        if (starvationPeriod.duration >= this.thresholds.minDelayDays) {
          bottlenecks.push({
            type: 'resource',
            severity: Math.min(10, starvationPeriod.duration * 1.5),
            startDay: starvationPeriod.startDay,
            endDay: starvationPeriod.endDay,
            daysLost: starvationPeriod.duration,
            description: `Gold shortage blocked purchases for ${starvationPeriod.duration.toFixed(1)} days`,
            cause: 'Insufficient gold generation or expensive early purchases',
            impact: 'Unable to purchase upgrades, tools, or blueprints',
            recommendation: 'Increase adventure frequency or reduce early spending',
            gameStateSnapshot: currentState,
            relevantActions: this.getRelevantActions(result, starvationPeriod),
            parameterSettings: result.configuration.parameterOverrides,
            resource: 'gold',
            requiredAmount: 500,
            availableAmount: currentState.resources.gold,
            generationRate: this.calculateGoldGenerationRate(stateHistory, i),
            consumptionRate: this.calculateGoldConsumptionRate(stateHistory, i),
            timeToResolve: this.calculateTimeToResolve(stateHistory, i, 'gold', 500)
          })
        }
      }
    }
    
    return bottlenecks
  }
  
  private findResourceStarvationPeriod(
    stateHistory: GameState[], 
    startIndex: number, 
    resource: string, 
    threshold: number
  ): StarvationPeriod {
    let start = startIndex
    let end = startIndex
    
    // Find start of starvation period
    while (start > 0) {
      const prevState = stateHistory[start - 1]
      if (this.getResourceAmount(prevState, resource) >= threshold) break
      start--
    }
    
    // Find end of starvation period
    while (end < stateHistory.length - 1) {
      const nextState = stateHistory[end + 1]
      if (this.getResourceAmount(nextState, resource) >= threshold) break
      end++
    }
    
    const startDay = Math.floor(start / 24) + 1  // Assuming hourly snapshots
    const endDay = Math.floor(end / 24) + 1
    const duration = (end - start) / 24  // Convert to days
    
    return { startDay, endDay, duration }
  }
  
  private getResourceAmount(state: GameState, resource: string): number {
    switch (resource) {
      case 'energy':
        return state.resources.energy.current
      case 'gold':
        return state.resources.gold
      case 'water':
        return state.resources.water?.current || 0
      default:
        return state.resources.materials?.get(resource) || 0
    }
  }
  
  private calculateEnergyGenerationRate(stateHistory: GameState[], index: number): number {
    // Estimate energy generation rate from recent history
    if (index < 5) return 0
    
    const recentStates = stateHistory.slice(Math.max(0, index - 5), index)
    let totalGeneration = 0
    
    for (let i = 1; i < recentStates.length; i++) {
      const current = recentStates[i].resources.energy.current
      const previous = recentStates[i - 1].resources.energy.current
      if (current > previous) {
        totalGeneration += (current - previous)
      }
    }
    
    return totalGeneration / Math.max(1, recentStates.length - 1)
  }
  
  private calculateEnergyConsumptionRate(stateHistory: GameState[], index: number): number {
    // Estimate energy consumption rate from recent history
    if (index < 5) return 0
    
    const recentStates = stateHistory.slice(Math.max(0, index - 5), index)
    let totalConsumption = 0
    
    for (let i = 1; i < recentStates.length; i++) {
      const current = recentStates[i].resources.energy.current
      const previous = recentStates[i - 1].resources.energy.current
      if (current < previous) {
        totalConsumption += (previous - current)
      }
    }
    
    return totalConsumption / Math.max(1, recentStates.length - 1)
  }
  
  private calculateGoldGenerationRate(stateHistory: GameState[], index: number): number {
    // Similar to energy but for gold
    if (index < 5) return 0
    
    const recentStates = stateHistory.slice(Math.max(0, index - 5), index)
    let totalGeneration = 0
    
    for (let i = 1; i < recentStates.length; i++) {
      const current = recentStates[i].resources.gold
      const previous = recentStates[i - 1].resources.gold
      if (current > previous) {
        totalGeneration += (current - previous)
      }
    }
    
    return totalGeneration / Math.max(1, recentStates.length - 1)
  }
  
  private calculateGoldConsumptionRate(stateHistory: GameState[], index: number): number {
    // Similar to energy consumption but for gold
    if (index < 5) return 0
    
    const recentStates = stateHistory.slice(Math.max(0, index - 5), index)
    let totalConsumption = 0
    
    for (let i = 1; i < recentStates.length; i++) {
      const current = recentStates[i].resources.gold
      const previous = recentStates[i - 1].resources.gold
      if (current < previous) {
        totalConsumption += (previous - current)
      }
    }
    
    return totalConsumption / Math.max(1, recentStates.length - 1)
  }
  
  private calculateTimeToResolve(
    stateHistory: GameState[], 
    index: number, 
    resource: string, 
    targetAmount: number
  ): number {
    const generationRate = resource === 'energy' 
      ? this.calculateEnergyGenerationRate(stateHistory, index)
      : this.calculateGoldGenerationRate(stateHistory, index)
      
    const currentAmount = this.getResourceAmount(stateHistory[index], resource)
    const needed = targetAmount - currentAmount
    
    return generationRate > 0 ? needed / generationRate : 999 // Very long time if no generation
  }
  
  // ===== PREREQUISITE BOTTLENECK DETECTION =====
  
  private detectPrerequisiteBottlenecks(result: SimulationResult): PrerequisiteBottleneck[] {
    const bottlenecks: PrerequisiteBottleneck[] = []
    const actions = result.actionHistory
    
    // Look for repeated failed attempts to purchase blocked upgrades
    const failedPurchases = actions.filter(a => 
      a.type === 'purchase' && !a.success && a.failureReason === 'prerequisites'
    )
    
    // Group by item ID
    const purchaseAttempts = new Map<string, ExecutedAction[]>()
    for (const action of failedPurchases) {
      if (!purchaseAttempts.has(action.itemId)) {
        purchaseAttempts.set(action.itemId, [])
      }
      purchaseAttempts.get(action.itemId)!.push(action)
    }
    
    // Identify items with repeated failed attempts
    for (const [itemId, attempts] of purchaseAttempts) {
      if (attempts.length >= this.thresholds.decisionStuckThreshold) {
        const firstAttempt = attempts[0]
        const lastAttempt = attempts[attempts.length - 1]
        const daysStuck = (lastAttempt.timestamp - firstAttempt.timestamp) / (24 * 60)
        
        if (daysStuck >= this.thresholds.minDelayDays) {
          const item = this.gameDataStore.getItemById(itemId)
          const missingPrereqs = item?.prerequisites?.filter(prereq => 
            !this.hasPrerequisite(lastAttempt.gameState, prereq)
          ) || []
          
          bottlenecks.push({
            type: 'prerequisite',
            severity: Math.min(10, attempts.length),
            startDay: firstAttempt.timestamp / (24 * 60),
            endDay: lastAttempt.timestamp / (24 * 60),
            daysLost: daysStuck,
            description: `Unable to purchase ${item?.name || itemId} due to missing prerequisites`,
            cause: `Missing prerequisites: ${missingPrereqs.join(', ')}`,
            impact: 'Progression blocked, wasted decision cycles',
            recommendation: `Focus on unlocking: ${missingPrereqs.slice(0, 2).join(', ')}`,
            gameStateSnapshot: lastAttempt.gameState,
            relevantActions: attempts,
            parameterSettings: result.configuration.parameterOverrides,
            blockedUpgrade: itemId,
            missingPrerequisites: missingPrereqs,
            availableAlternatives: this.findAlternativeUpgrades(itemId, lastAttempt.gameState),
            costToUnblock: this.calculateUnblockingCost(missingPrereqs, lastAttempt.gameState)
          })
        }
      }
    }
    
    return bottlenecks
  }
  
  private hasPrerequisite(gameState: GameState, prereqId: string): boolean {
    // Check if prerequisite is satisfied in game state
    return gameState.progression?.unlockedUpgrades?.includes(prereqId) ||
           gameState.inventory?.tools?.has(prereqId) ||
           gameState.inventory?.weapons?.has(prereqId) ||
           false
  }
  
  private findAlternativeUpgrades(blockedItemId: string, gameState: GameState): string[] {
    // Find alternative upgrades that could be pursued instead
    // This is a simplified implementation
    const alternatives: string[] = []
    
    // Get all available items from game data
    const allItems = this.gameDataStore.getAllItems()
    
    for (const item of allItems) {
      // Check if this item is affordable and has met prerequisites
      if (item.id !== blockedItemId && 
          this.canAfford(gameState, item) &&
          this.hasAllPrerequisites(gameState, item.prerequisites || [])) {
        alternatives.push(item.id)
      }
    }
    
    return alternatives.slice(0, 3)  // Return top 3 alternatives
  }
  
  private canAfford(gameState: GameState, item: any): boolean {
    // Check if player can afford the item
    if (item.goldCost && gameState.resources.gold < item.goldCost) {
      return false
    }
    
    // Check material costs
    if (item.materialCosts) {
      for (const [material, amount] of Object.entries(item.materialCosts)) {
        if ((gameState.resources.materials?.get(material) || 0) < (amount as number)) {
          return false
        }
      }
    }
    
    return true
  }
  
  private hasAllPrerequisites(gameState: GameState, prerequisites: string[]): boolean {
    return prerequisites.every(prereq => this.hasPrerequisite(gameState, prereq))
  }
  
  private calculateUnblockingCost(missingPrereqs: string[], gameState: GameState): any {
    // Calculate the cost to unlock the missing prerequisites
    const costs = { gold: 0, energy: 0, materials: new Map<string, number>() }
    
    for (const prereqId of missingPrereqs) {
      const item = this.gameDataStore.getItemById(prereqId)
      if (item) {
        costs.gold += item.goldCost || 0
        costs.energy += item.energyCost || 0
        
        if (item.materialCosts) {
          for (const [material, amount] of Object.entries(item.materialCosts)) {
            costs.materials.set(material, (costs.materials.get(material) || 0) + (amount as number))
          }
        }
      }
    }
    
    return costs
  }
  
  // ===== DECISION BOTTLENECK DETECTION =====
  
  private detectDecisionBottlenecks(result: SimulationResult): DecisionBottleneck[] {
    const bottlenecks: DecisionBottleneck[] = []
    const actions = result.actionHistory
    
    // Look for repeated low-scoring actions (decision loops)
    const actionScores = new Map<string, { scores: number[]; actions: ExecutedAction[] }>()
    
    actions.forEach(action => {
      if (action.score !== undefined) {
        const key = `${action.type}_${action.screen}`
        if (!actionScores.has(key)) {
          actionScores.set(key, { scores: [], actions: [] })
        }
        actionScores.get(key)!.scores.push(action.score)
        actionScores.get(key)!.actions.push(action)
      }
    })
    
    // Identify actions with consistently low scores
    for (const [actionKey, data] of actionScores) {
      if (data.scores.length >= this.thresholds.decisionStuckThreshold) {
        const averageScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
        
        // If average score is low and action was repeated many times
        if (averageScore < 3 && data.scores.length > 5) {
          const firstAction = data.actions[0]
          const lastAction = data.actions[data.actions.length - 1]
          const daysStuck = (lastAction.timestamp - firstAction.timestamp) / (24 * 60)
          
          if (daysStuck >= this.thresholds.minDelayDays) {
            bottlenecks.push({
              type: 'decision',
              severity: Math.min(10, data.scores.length / 5), // More repetitions = higher severity
              startDay: firstAction.timestamp / (24 * 60),
              endDay: lastAction.timestamp / (24 * 60),
              daysLost: daysStuck,
              description: `Repeated low-value action: ${actionKey}`,
              cause: `Poor decision scoring for ${actionKey} (avg: ${averageScore.toFixed(1)})`,
              impact: 'Wasted time on ineffective actions',
              recommendation: `Review parameters for ${actionKey} actions or disable them`,
              gameStateSnapshot: lastAction.gameState,
              relevantActions: data.actions,
              parameterSettings: result.configuration.parameterOverrides,
              repeatedAction: actionKey,
              timesAttempted: data.scores.length,
              averageScore,
              betterAlternatives: this.findBetterActionAlternatives(result, actionKey, averageScore)
            })
          }
        }
      }
    }
    
    return bottlenecks
  }
  
  private findBetterActionAlternatives(
    result: SimulationResult, 
    poorAction: string, 
    poorScore: number
  ): string[] {
    const alternatives: string[] = []
    
    // Find actions with higher scores from the same time period
    const actionScores = new Map<string, number>()
    
    result.actionHistory.forEach(action => {
      if (action.score !== undefined && action.score > poorScore * 1.5) {
        const key = `${action.type}_${action.screen}`
        if (key !== poorAction) {
          actionScores.set(key, Math.max(actionScores.get(key) || 0, action.score))
        }
      }
    })
    
    // Sort by score and return top alternatives
    const sortedAlternatives = Array.from(actionScores.entries())
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .slice(0, 3)
      .map(([action]) => action)
    
    return sortedAlternatives
  }
  
  // ===== PARAMETER BOTTLENECK DETECTION =====
  
  private detectParameterBottlenecks(result: SimulationResult): ParameterBottleneck[] {
    const bottlenecks: ParameterBottleneck[] = []
    
    // Analyze parameter settings that may be causing issues
    const parameterOverrides = result.configuration.parameterOverrides || new Map()
    
    // Check for overly conservative energy thresholds
    const energyThreshold = this.getParameterValue(parameterOverrides, 'farm.thresholds.plantWhenEnergyBelow', 100)
    if (energyThreshold > 200) {
      bottlenecks.push({
        type: 'parameter',
        severity: 4,
        startDay: 1,
        endDay: result.completionDay || 35,
        daysLost: 1,
        description: 'Energy threshold too conservative',
        cause: `Energy planting threshold set too high (${energyThreshold})`,
        impact: 'Reduced farming activity and energy generation',
        recommendation: `Reduce energy threshold to 100-150`,
        gameStateSnapshot: result.gameStateHistory[0],
        relevantActions: [],
        parameterSettings: result.configuration.parameterOverrides,
        parameterPath: 'farm.thresholds.plantWhenEnergyBelow',
        currentValue: energyThreshold,
        recommendedValue: 120,
        expectedImprovement: 'Increased farming efficiency and energy generation'
      })
    }
    
    // Check for overly high gold saving thresholds
    const goldThreshold = this.getParameterValue(parameterOverrides, 'town.thresholds.saveGoldAbove', 1000)
    if (goldThreshold > 3000) {
      bottlenecks.push({
        type: 'parameter',
        severity: 5,
        startDay: 1,
        endDay: result.completionDay || 35,
        daysLost: 2,
        description: 'Gold saving threshold too high',
        cause: `Gold saving threshold set too high (${goldThreshold})`,
        impact: 'Delayed upgrades and slower progression',
        recommendation: `Reduce gold saving threshold to 1500-2000`,
        gameStateSnapshot: result.gameStateHistory[0],
        relevantActions: [],
        parameterSettings: result.configuration.parameterOverrides,
        parameterPath: 'town.thresholds.saveGoldAbove',
        currentValue: goldThreshold,
        recommendedValue: 1500,
        expectedImprovement: 'Faster upgrade acquisition and progression'
      })
    }
    
    return bottlenecks
  }
  
  private getParameterValue(overrides: Map<string, any>, path: string, defaultValue: any): any {
    // Navigate through parameter path to get value
    const override = overrides.get(path)
    return override?.value !== undefined ? override.value : defaultValue
  }
  
  // ===== HELPER METHODS =====
  
  private getRelevantActions(result: SimulationResult, period: StarvationPeriod): ExecutedAction[] {
    return result.actionHistory.filter(action => {
      const actionDay = Math.floor(action.timestamp / (24 * 60))
      return actionDay >= period.startDay && actionDay <= period.endDay
    })
  }
  
  private calculateOverallSeverity(
    bottlenecks: Bottleneck[], 
    totalDelayDays: number
  ): 'minor' | 'moderate' | 'severe' | 'critical' {
    if (totalDelayDays === 0) return 'minor'
    if (totalDelayDays < 2) return 'minor'
    if (totalDelayDays < 5) return 'moderate'
    if (totalDelayDays < 10) return 'severe'
    return 'critical'
  }
  
  private categorizeBottlenecks(bottlenecks: Bottleneck[]): {
    resourceShortages: ResourceBottleneck[]
    prerequisiteBlocks: PrerequisiteBottleneck[]
    decisionFailures: DecisionBottleneck[]
    parameterIssues: ParameterBottleneck[]
  } {
    return {
      resourceShortages: bottlenecks.filter(b => b.type === 'resource') as ResourceBottleneck[],
      prerequisiteBlocks: bottlenecks.filter(b => b.type === 'prerequisite') as PrerequisiteBottleneck[],
      decisionFailures: bottlenecks.filter(b => b.type === 'decision') as DecisionBottleneck[],
      parameterIssues: bottlenecks.filter(b => b.type === 'parameter') as ParameterBottleneck[]
    }
  }
}

