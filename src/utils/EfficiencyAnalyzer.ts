// EfficiencyAnalyzer - Resource and Time Efficiency Analysis
// Analyzes how effectively resources were used and time was allocated

import type {
  SimulationResult,
  EfficiencyAnalysis,
  ResourceEfficiencyAnalysis,
  ResourceEfficiencyMetrics,
  TimeEfficiencyMetrics,
  TimeAllocationAnalysis,
  DecisionEfficiencyAnalysis,
  ActionOptimalityAnalysis,
  ImprovementOpportunity,
  BenchmarkComparison,
  TimeSeriesData
} from '@/types/reports'

export class EfficiencyAnalyzer {
  
  analyzeEfficiency(result: SimulationResult): EfficiencyAnalysis {
    return {
      resourceEfficiency: this.analyzeResourceEfficiency(result),
      timeAllocation: this.analyzeTimeAllocation(result),
      decisionEfficiency: this.analyzeDecisionEfficiency(result),
      actionOptimality: this.analyzeActionOptimality(result),
      
      improvementOpportunities: this.identifyImprovementOpportunities(result),
      benchmarkComparisons: this.generateBenchmarkComparisons(result)
    }
  }
  
  // ===== RESOURCE EFFICIENCY ANALYSIS =====
  
  private analyzeResourceEfficiency(result: SimulationResult): ResourceEfficiencyAnalysis {
    const finalState = result.gameStateHistory[result.gameStateHistory.length - 1]
    const totalDays = result.completionDay || result.gameStateHistory.length
    
    // Energy efficiency metrics
    const energyStats = this.calculateEnergyStats(result)
    const energyMetrics: ResourceEfficiencyMetrics = {
      totalGenerated: energyStats.totalGenerated,
      totalConsumed: energyStats.totalConsumed,
      wastedToCap: energyStats.wastedToCap,
      utilizationRate: energyStats.totalGenerated > 0 ? energyStats.totalConsumed / energyStats.totalGenerated : 0,
      
      farmProductivity: energyStats.totalGenerated / Math.max(1, totalDays),
      adventureROI: this.calculateAdventureROI(result),
      
      efficiency: energyStats.totalGenerated > 0 ? 
        1.0 - (energyStats.wastedToCap / energyStats.totalGenerated) : 0
    }
    
    // Gold efficiency metrics
    const goldStats = this.calculateGoldStats(result)
    const goldMetrics: ResourceEfficiencyMetrics = {
      totalGenerated: goldStats.totalGenerated,
      totalConsumed: goldStats.totalConsumed,
      wastedToCap: goldStats.wastedToCap,
      utilizationRate: goldStats.totalGenerated > 0 ? goldStats.totalConsumed / goldStats.totalGenerated : 0,
      efficiency: goldStats.totalGenerated > 0 ? 
        goldStats.totalConsumed / goldStats.totalGenerated : 0
    }
    
    // Material efficiency metrics
    const materialMetrics = this.analyzeMaterialEfficiency(result)
    
    // Time efficiency metrics
    const timeMetrics = this.analyzeTimeEfficiency(result)
    
    // Calculate overall rating
    const efficiencyValues = [
      energyMetrics.efficiency,
      goldMetrics.efficiency,
      timeMetrics.activeTimeRatio,
      timeMetrics.sessionEfficiency
    ]
    const overallRating = efficiencyValues.reduce((sum, val) => sum + val, 0) / efficiencyValues.length * 100
    
    return {
      energy: energyMetrics,
      gold: goldMetrics,
      materials: materialMetrics,
      time: timeMetrics,
      overallRating: Math.round(overallRating)
    }
  }
  
  private calculateEnergyStats(result: SimulationResult): {
    totalGenerated: number
    totalConsumed: number
    wastedToCap: number
  } {
    let totalGenerated = 0
    let totalConsumed = 0
    let wastedToCap = 0
    
    // Analyze energy from actions
    result.actionHistory.forEach(action => {
      if (action.energyGain) {
        totalGenerated += action.energyGain
      }
      if (action.energyCost) {
        totalConsumed += action.energyCost
      }
    })
    
    // Analyze energy waste from state history
    result.gameStateHistory.forEach((state, index) => {
      if (index > 0) {
        const prevState = result.gameStateHistory[index - 1]
        
        // Check if energy was at cap (potential waste)
        if (state.resources.energy.current >= state.resources.energy.max * 0.95 &&
            prevState.resources.energy.current >= prevState.resources.energy.max * 0.95) {
          // Estimate waste - this is simplified
          wastedToCap += 5  // Assume 5 energy wasted per tick at cap
        }
      }
    })
    
    return { totalGenerated, totalConsumed, wastedToCap }
  }
  
  private calculateGoldStats(result: SimulationResult): {
    totalGenerated: number
    totalConsumed: number
    wastedToCap: number
  } {
    let totalGenerated = 0
    let totalConsumed = 0
    
    // Analyze gold from actions
    result.actionHistory.forEach(action => {
      if (action.goldGain) {
        totalGenerated += action.goldGain
      }
      if (action.goldCost) {
        totalConsumed += action.goldCost
      }
    })
    
    // Gold doesn't have a cap, so no waste from capping
    const wastedToCap = 0
    
    return { totalGenerated, totalConsumed, wastedToCap }
  }
  
  private calculateAdventureROI(result: SimulationResult): number {
    const adventureActions = result.actionHistory.filter(a => 
      a.type === 'start_adventure' && a.success
    )
    
    if (adventureActions.length === 0) return 0
    
    const totalGold = adventureActions.reduce((sum, a) => sum + (a.goldGain || 0), 0)
    const totalEnergy = adventureActions.reduce((sum, a) => sum + (a.energyCost || 0), 0)
    
    return totalEnergy > 0 ? totalGold / totalEnergy : 0
  }
  
  private analyzeMaterialEfficiency(result: SimulationResult): Map<string, ResourceEfficiencyMetrics> {
    const materialMetrics = new Map<string, ResourceEfficiencyMetrics>()
    const finalState = result.gameStateHistory[result.gameStateHistory.length - 1]
    
    if (finalState.resources.materials) {
      finalState.resources.materials.forEach((amount, material) => {
        // Calculate material generation/consumption from actions
        let generated = 0
        let consumed = 0
        
        result.actionHistory.forEach(action => {
          if (action.materialsGained && action.materialsGained[material]) {
            generated += action.materialsGained[material]
          }
          if (action.materialCosts && action.materialCosts[material]) {
            consumed += action.materialCosts[material]
          }
        })
        
        materialMetrics.set(material, {
          totalGenerated: generated,
          totalConsumed: consumed,
          wastedToCap: 0, // Materials don't typically have caps
          utilizationRate: generated > 0 ? consumed / generated : 0,
          efficiency: generated > 0 ? consumed / generated : 0
        })
      })
    }
    
    return materialMetrics
  }
  
  private analyzeTimeEfficiency(result: SimulationResult): TimeEfficiencyMetrics {
    const totalDays = result.completionDay || result.gameStateHistory.length
    const totalMinutes = totalDays * 24 * 60
    
    // Calculate active time (time when actions were being performed)
    const actionCount = result.actionHistory.length
    const estimatedActiveMinutes = actionCount * 2 // Assume 2 minutes per action
    const activeTimeRatio = Math.min(1.0, estimatedActiveMinutes / totalMinutes)
    
    // Calculate screen time optimality
    const screenTimeOptimality = this.calculateScreenTimeOptimality(result)
    
    // Calculate session efficiency
    const sessionEfficiency = this.calculateSessionEfficiency(result)
    
    // Calculate idle time waste
    const idleTimeWaste = Math.max(0, 1.0 - activeTimeRatio)
    
    return {
      activeTimeRatio,
      screenTimeOptimality,
      sessionEfficiency,
      idleTimeWaste
    }
  }
  
  private calculateScreenTimeOptimality(result: SimulationResult): number {
    // Analyze how optimally time was distributed across screens
    const screenTime = new Map<string, number>()
    
    result.actionHistory.forEach(action => {
      if (action.screen) {
        screenTime.set(action.screen, (screenTime.get(action.screen) || 0) + 1)
      }
    })
    
    // Compare to ideal distribution (this is simplified)
    const idealDistribution = new Map([
      ['farm', 0.4],
      ['tower', 0.15],
      ['town', 0.2],
      ['adventure', 0.15],
      ['forge', 0.05],
      ['mine', 0.05]
    ])
    
    let totalDeviation = 0
    const totalActions = result.actionHistory.length
    
    idealDistribution.forEach((ideal, screen) => {
      const actual = (screenTime.get(screen) || 0) / Math.max(1, totalActions)
      totalDeviation += Math.abs(ideal - actual)
    })
    
    // Return optimality (1.0 = perfect, 0.0 = completely wrong)
    return Math.max(0, 1.0 - totalDeviation)
  }
  
  private calculateSessionEfficiency(result: SimulationResult): number {
    // Measure how efficiently each play session was used
    // This is simplified - would need more detailed session data
    
    const persona = result.configuration.persona
    if (!persona) return 0.5
    
    const totalDays = result.completionDay || result.gameStateHistory.length
    const expectedCheckIns = totalDays * (persona.schedule?.weekday?.checkIns || 2)
    const actualActions = result.actionHistory.length
    
    // Rough efficiency calculation
    return Math.min(1.0, actualActions / Math.max(1, expectedCheckIns * 3))
  }
  
  // ===== TIME ALLOCATION ANALYSIS =====
  
  private analyzeTimeAllocation(result: SimulationResult): TimeAllocationAnalysis {
    const screenTimeDistribution = new Map<string, number>()
    const totalActions = result.actionHistory.length
    
    // Calculate actual screen time distribution
    result.actionHistory.forEach(action => {
      if (action.screen) {
        screenTimeDistribution.set(action.screen, (screenTimeDistribution.get(action.screen) || 0) + 1)
      }
    })
    
    // Convert to percentages
    screenTimeDistribution.forEach((count, screen) => {
      screenTimeDistribution.set(screen, count / Math.max(1, totalActions))
    })
    
    // Ideal distribution based on game balance
    const idealDistribution = new Map([
      ['farm', 0.35],    // Primary resource generation
      ['town', 0.25],    // Upgrades and purchases
      ['adventure', 0.20], // Gold and XP
      ['tower', 0.10],   // Seeds
      ['forge', 0.05],   // Tools and weapons
      ['mine', 0.05]     // Materials
    ])
    
    // Calculate efficiency score
    let totalDeviation = 0
    idealDistribution.forEach((ideal, screen) => {
      const actual = screenTimeDistribution.get(screen) || 0
      totalDeviation += Math.abs(ideal - actual)
    })
    
    const efficiency = Math.max(0, 1.0 - totalDeviation)
    
    // Generate recommendations
    const recommendations: string[] = []
    idealDistribution.forEach((ideal, screen) => {
      const actual = screenTimeDistribution.get(screen) || 0
      if (actual < ideal - 0.1) {
        recommendations.push(`Spend more time on ${screen} screen (${Math.round(actual * 100)}% vs ideal ${Math.round(ideal * 100)}%)`)
      } else if (actual > ideal + 0.1) {
        recommendations.push(`Reduce time on ${screen} screen (${Math.round(actual * 100)}% vs ideal ${Math.round(ideal * 100)}%)`)
      }
    })
    
    return {
      screenTimeDistribution,
      idealDistribution,
      efficiency,
      recommendations
    }
  }
  
  // ===== DECISION EFFICIENCY ANALYSIS =====
  
  private analyzeDecisionEfficiency(result: SimulationResult): DecisionEfficiencyAnalysis {
    const scoredActions = result.actionHistory.filter(a => a.score !== undefined)
    
    if (scoredActions.length === 0) {
      return {
        averageActionScore: 5,
        scoreTrend: { timestamps: [], values: [] },
        highPerformingActions: [],
        lowPerformingActions: []
      }
    }
    
    // Calculate average score
    const averageScore = scoredActions.reduce((sum, a) => sum + (a.score || 0), 0) / scoredActions.length
    
    // Create score trend over time
    const scoreTrend: TimeSeriesData = {
      timestamps: scoredActions.map(a => a.timestamp),
      values: scoredActions.map(a => a.score || 0)
    }
    
    // Identify high and low performing actions
    const actionScores = new Map<string, { scores: number[]; count: number }>()
    
    scoredActions.forEach(action => {
      const key = `${action.type}_${action.screen}`
      if (!actionScores.has(key)) {
        actionScores.set(key, { scores: [], count: 0 })
      }
      actionScores.get(key)!.scores.push(action.score!)
      actionScores.get(key)!.count++
    })
    
    // Calculate average scores for each action type
    const actionAverages = new Map<string, number>()
    actionScores.forEach((data, action) => {
      const average = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
      actionAverages.set(action, average)
    })
    
    // Sort by performance
    const sortedActions = Array.from(actionAverages.entries()).sort(([, a], [, b]) => b - a)
    
    const highPerformingActions = sortedActions
      .filter(([, score]) => score > averageScore * 1.2)
      .slice(0, 5)
      .map(([action]) => action)
      
    const lowPerformingActions = sortedActions
      .filter(([, score]) => score < averageScore * 0.8)
      .slice(-5)
      .map(([action]) => action)
    
    return {
      averageActionScore: averageScore,
      scoreTrend,
      highPerformingActions,
      lowPerformingActions
    }
  }
  
  // ===== ACTION OPTIMALITY ANALYSIS =====
  
  private analyzeActionOptimality(result: SimulationResult): ActionOptimalityAnalysis {
    const scoredActions = result.actionHistory.filter(a => a.score !== undefined)
    
    if (scoredActions.length === 0) {
      return {
        optimalActions: 0,
        suboptimalActions: 0,
        missedOpportunities: 0,
        optimizationPotential: 0
      }
    }
    
    const averageScore = scoredActions.reduce((sum, a) => sum + (a.score || 0), 0) / scoredActions.length
    
    // Count optimal vs suboptimal actions
    const optimalActions = scoredActions.filter(a => (a.score || 0) > averageScore * 1.2).length
    const suboptimalActions = scoredActions.filter(a => (a.score || 0) < averageScore * 0.8).length
    
    // Estimate missed opportunities (actions that could have been better)
    const missedOpportunities = suboptimalActions
    
    // Calculate optimization potential
    const currentPerformance = scoredActions.reduce((sum, a) => sum + (a.score || 0), 0)
    const potentialPerformance = scoredActions.length * 10 // Assuming max score is 10
    const optimizationPotential = potentialPerformance > 0 ? 
      (potentialPerformance - currentPerformance) / potentialPerformance : 0
    
    return {
      optimalActions,
      suboptimalActions,
      missedOpportunities,
      optimizationPotential
    }
  }
  
  // ===== IMPROVEMENT OPPORTUNITIES =====
  
  private identifyImprovementOpportunities(result: SimulationResult): ImprovementOpportunity[] {
    const opportunities: ImprovementOpportunity[] = []
    
    // Energy efficiency improvement
    const energyStats = this.calculateEnergyStats(result)
    if (energyStats.wastedToCap > 100) {
      opportunities.push({
        area: 'Energy Management',
        currentValue: energyStats.efficiency * 100,
        potentialValue: Math.min(95, energyStats.efficiency * 100 + 15),
        improvement: 15,
        effort: 'low',
        steps: [
          'Increase energy storage capacity',
          'Improve automation timing',
          'Adjust energy consumption parameters'
        ]
      })
    }
    
    // Gold utilization improvement
    const goldStats = this.calculateGoldStats(result)
    const goldUtilization = goldStats.totalGenerated > 0 ? goldStats.totalConsumed / goldStats.totalGenerated : 0
    if (goldUtilization < 0.8) {
      opportunities.push({
        area: 'Gold Utilization',
        currentValue: goldUtilization * 100,
        potentialValue: 90,
        improvement: 90 - (goldUtilization * 100),
        effort: 'medium',
        steps: [
          'Reduce gold saving thresholds',
          'Prioritize earlier upgrades',
          'Increase purchase frequency'
        ]
      })
    }
    
    // Time allocation improvement
    const timeMetrics = this.analyzeTimeEfficiency(result)
    if (timeMetrics.activeTimeRatio < 0.7) {
      opportunities.push({
        area: 'Time Allocation',
        currentValue: timeMetrics.activeTimeRatio * 100,
        potentialValue: 85,
        improvement: 85 - (timeMetrics.activeTimeRatio * 100),
        effort: 'medium',
        steps: [
          'Increase check-in frequency',
          'Optimize session planning',
          'Reduce idle time between actions'
        ]
      })
    }
    
    return opportunities
  }
  
  // ===== BENCHMARK COMPARISONS =====
  
  private generateBenchmarkComparisons(result: SimulationResult): BenchmarkComparison[] {
    const comparisons: BenchmarkComparison[] = []
    
    // Completion time benchmark
    const completionDays = result.completionDay || 35
    comparisons.push({
      metric: 'Completion Time',
      value: completionDays,
      benchmark: 28, // Target completion time
      performance: completionDays <= 28 ? 'at' : completionDays <= 32 ? 'below' : 'below',
      percentile: Math.max(0, Math.min(100, (35 - completionDays) / 7 * 100))
    })
    
    // Resource efficiency benchmark
    const resourceEfficiency = this.analyzeResourceEfficiency(result)
    comparisons.push({
      metric: 'Resource Efficiency',
      value: resourceEfficiency.overallRating,
      benchmark: 75, // Target efficiency
      performance: resourceEfficiency.overallRating >= 75 ? 'above' : 
                  resourceEfficiency.overallRating >= 60 ? 'at' : 'below',
      percentile: resourceEfficiency.overallRating
    })
    
    // Action count benchmark
    const totalActions = result.actionHistory.length
    const totalDays = result.completionDay || result.gameStateHistory.length
    const actionsPerDay = totalActions / Math.max(1, totalDays)
    comparisons.push({
      metric: 'Actions Per Day',
      value: actionsPerDay,
      benchmark: 15, // Target actions per day
      performance: actionsPerDay >= 15 ? 'above' : 
                  actionsPerDay >= 10 ? 'at' : 'below',
      percentile: Math.min(100, actionsPerDay / 20 * 100)
    })
    
    return comparisons
  }
}

