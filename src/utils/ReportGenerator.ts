// ReportGenerator - Core Analysis Engine for Simulation Reports
// Processes raw simulation data into structured insights and recommendations

import type { 
  SimulationResult, 
  AnalysisReport, 
  ReportSummary,
  ProgressionAnalysis,
  ResourceAnalysis,
  EfficiencyAnalysis,
  BottleneckAnalysis,
  DecisionAnalysis,
  PersonaAnalysis,
  Recommendation,
  PhasePerformance,
  ResourceUtilization,
  GamePhase,
  GameTime,
  Bottleneck
} from '@/types/reports'
import type { GameDataStore } from '@/stores/gameData'
import { BottleneckAnalyzer } from './BottleneckAnalyzer'
import { EfficiencyAnalyzer } from './EfficiencyAnalyzer'

interface AnalysisConfig {
  enableBottleneckDetection: boolean
  enableEfficiencyAnalysis: boolean
  enablePersonaAnalysis: boolean
  generateRecommendations: boolean
  detailLevel: 'basic' | 'standard' | 'comprehensive'
}

export class ReportGenerator {
  private gameDataStore: GameDataStore
  private analysisConfig: AnalysisConfig
  private bottleneckAnalyzer: BottleneckAnalyzer
  private efficiencyAnalyzer: EfficiencyAnalyzer
  
  constructor(gameDataStore: GameDataStore, config?: Partial<AnalysisConfig>) {
    this.gameDataStore = gameDataStore
    this.analysisConfig = {
      enableBottleneckDetection: true,
      enableEfficiencyAnalysis: true,
      enablePersonaAnalysis: true,
      generateRecommendations: true,
      detailLevel: 'standard',
      ...config
    }
    
    this.bottleneckAnalyzer = new BottleneckAnalyzer(gameDataStore)
    this.efficiencyAnalyzer = new EfficiencyAnalyzer()
  }
  
  async generateReport(simulationResult: SimulationResult): Promise<AnalysisReport> {
    // 1. Validate input data
    this.validateSimulationData(simulationResult)
    
    // 2. Generate core analysis sections
    const summary = this.generateSummary(simulationResult)
    const progressionAnalysis = this.analyzeProgression(simulationResult)
    const resourceAnalysis = this.analyzeResources(simulationResult)
    
    // 3. Generate optional detailed analysis
    let bottleneckAnalysis: BottleneckAnalysis
    let efficiencyAnalysis: EfficiencyAnalysis
    let decisionAnalysis: DecisionAnalysis
    let personaAnalysis: PersonaAnalysis
    
    if (this.analysisConfig.enableBottleneckDetection) {
      bottleneckAnalysis = await this.bottleneckAnalyzer.analyze(simulationResult)
    } else {
      bottleneckAnalysis = this.createEmptyBottleneckAnalysis()
    }
    
    if (this.analysisConfig.enableEfficiencyAnalysis) {
      efficiencyAnalysis = this.efficiencyAnalyzer.analyzeEfficiency(simulationResult)
    } else {
      efficiencyAnalysis = this.createEmptyEfficiencyAnalysis()
    }
    
    decisionAnalysis = this.analyzeDecisions(simulationResult)
    
    if (this.analysisConfig.enablePersonaAnalysis) {
      personaAnalysis = this.analyzePersona(simulationResult)
    } else {
      personaAnalysis = this.createEmptyPersonaAnalysis()
    }
    
    // 4. Generate recommendations
    let recommendations: Recommendation[] = []
    if (this.analysisConfig.generateRecommendations) {
      recommendations = this.generateRecommendations({
        summary,
        bottleneckAnalysis,
        efficiencyAnalysis,
        decisionAnalysis,
        personaAnalysis
      })
    }
    
    // 5. Compile final report
    const report: AnalysisReport = {
      id: this.generateReportId(),
      simulationId: simulationResult.id,
      generatedAt: new Date(),
      summary,
      progressionAnalysis,
      resourceAnalysis,
      efficiencyAnalysis,
      bottleneckAnalysis,
      decisionAnalysis,
      personaAnalysis,
      recommendations,
      exportFormats: []
    }
    
    return report
  }
  
  // ===== SUMMARY GENERATION =====
  
  private generateSummary(result: SimulationResult): ReportSummary {
    const finalState = result.gameStateHistory[result.gameStateHistory.length - 1]
    const totalActions = result.actionHistory.length
    
    // Calculate overall performance score (0-100)
    let score = 0
    
    // Completion bonus (0-40 points)
    if (result.completed) {
      score += 40
      if (result.completionDay && result.completionDay <= 25) score += 10  // Fast completion bonus
      if (result.completionDay && result.completionDay <= 20) score += 10  // Very fast bonus
    }
    
    // Resource efficiency (0-20 points)  
    const resourceEfficiency = this.calculateResourceEfficiency(result)
    score += resourceEfficiency * 20
    
    // Decision quality (0-20 points)
    const decisionQuality = this.calculateDecisionQuality(result)
    score += decisionQuality * 20
    
    // Progress consistency (0-20 points)
    const progressConsistency = this.calculateProgressConsistency(result)
    score += progressConsistency * 20
    
    return {
      simulationName: result.name,
      personaId: result.configuration.persona?.id || 'unknown',
      personaName: result.configuration.persona?.name || 'Unknown',
      totalDays: result.completionDay || result.gameStateHistory.length,
      completionStatus: this.getCompletionStatus(result),
      overallScore: Math.round(score),
      resourceEfficiency,
      decisionQuality,
      progressionRate: this.calculateProgressionRate(result),
      phasesCompleted: this.getCompletedPhases(result),
      upgradesPurchased: this.countUpgradesPurchased(result),
      adventuresCompleted: this.countAdventuresCompleted(result),
      majorBottlenecks: this.identifyMajorBottlenecks(result),
      wastedResources: this.calculateWastedResources(result)
    }
  }
  
  private calculateResourceEfficiency(result: SimulationResult): number {
    const finalState = result.gameStateHistory[result.gameStateHistory.length - 1]
    
    // Simple efficiency calculation based on final resource state
    let efficiency = 0.8  // Base efficiency
    
    // Penalize for unused resources at end
    if (finalState.resources.energy.current / finalState.resources.energy.max > 0.9) {
      efficiency -= 0.1  // High unused energy = inefficient
    }
    
    if (finalState.resources.gold > 5000 && !result.completed) {
      efficiency -= 0.1  // High unused gold when incomplete = inefficient
    }
    
    // Bonus for completion
    if (result.completed) {
      efficiency += 0.1
    }
    
    return Math.max(0, Math.min(1, efficiency))
  }
  
  private calculateDecisionQuality(result: SimulationResult): number {
    if (result.actionHistory.length === 0) return 0
    
    // Calculate average action scores if available
    const scoredActions = result.actionHistory.filter(a => a.score !== undefined)
    if (scoredActions.length === 0) return 0.5  // Default quality
    
    const averageScore = scoredActions.reduce((sum, a) => sum + (a.score || 0), 0) / scoredActions.length
    
    // Normalize to 0-1 scale (assuming scores are 0-10)
    return Math.max(0, Math.min(1, averageScore / 10))
  }
  
  private calculateProgressConsistency(result: SimulationResult): number {
    // Measure how consistently progress was made
    // For now, simple implementation
    if (result.completed) return 1.0
    if (result.completionReason === 'bottleneck') return 0.3
    return 0.6
  }
  
  private getCompletionStatus(result: SimulationResult): 'success' | 'timeout' | 'bottleneck' {
    if (result.completed) return 'success'
    if (result.completionReason === 'bottleneck') return 'bottleneck'
    return 'timeout'
  }
  
  private calculateProgressionRate(result: SimulationResult): number {
    const phases = this.getCompletedPhases(result)
    const days = result.completionDay || result.gameStateHistory.length
    return days > 0 ? phases.length / days : 0
  }
  
  private getCompletedPhases(result: SimulationResult): string[] {
    // Extract completed phases from game state history
    // This is a simplified implementation
    const phases: string[] = ['Tutorial']
    
    const finalState = result.gameStateHistory[result.gameStateHistory.length - 1]
    if (finalState.progression?.currentPhase) {
      const phaseOrder: GamePhase[] = ['Tutorial', 'Early', 'Mid', 'Late', 'End']
      const currentIndex = phaseOrder.indexOf(finalState.progression.currentPhase)
      
      for (let i = 0; i <= currentIndex; i++) {
        if (!phases.includes(phaseOrder[i])) {
          phases.push(phaseOrder[i])
        }
      }
    }
    
    return phases
  }
  
  private countUpgradesPurchased(result: SimulationResult): number {
    return result.actionHistory.filter(a => a.type === 'purchase' && a.success).length
  }
  
  private countAdventuresCompleted(result: SimulationResult): number {
    return result.actionHistory.filter(a => a.type === 'start_adventure' && a.success).length
  }
  
  private identifyMajorBottlenecks(result: SimulationResult): string[] {
    // Simple bottleneck identification
    const bottlenecks: string[] = []
    
    // Check for energy starvation periods
    const hasEnergyIssues = result.gameStateHistory.some(state => 
      state.resources.energy.current < 10
    )
    if (hasEnergyIssues) {
      bottlenecks.push('Energy shortages detected')
    }
    
    // Check for failed purchases (gold shortage)
    const failedPurchases = result.actionHistory.filter(a => 
      a.type === 'purchase' && !a.success && a.failureReason === 'insufficient_gold'
    )
    if (failedPurchases.length > 5) {
      bottlenecks.push('Gold shortage limiting upgrades')
    }
    
    return bottlenecks
  }
  
  private calculateWastedResources(result: SimulationResult): any[] {
    // Calculate resource waste - simplified implementation
    return []
  }
  
  // ===== PROGRESSION ANALYSIS =====
  
  private analyzeProgression(result: SimulationResult): ProgressionAnalysis {
    // Analyze progression through phases
    const phaseTimings = this.calculatePhaseTimings(result)
    const milestoneAchievements = this.extractMilestones(result)
    const progressionRate = this.calculateDetailedProgressionRate(result)
    const stuckPoints = this.identifyStuckPoints(result)
    
    return {
      phaseTimings,
      milestoneAchievements,
      progressionRate,
      stuckPoints
    }
  }
  
  private calculatePhaseTimings(result: SimulationResult): Map<GamePhase, PhasePerformance> {
    const timings = new Map<GamePhase, PhasePerformance>()
    
    // Simplified phase timing calculation
    const phases: GamePhase[] = ['Tutorial', 'Early', 'Mid', 'Late', 'End']
    let currentDay = 1
    
    phases.forEach((phase, index) => {
      const expectedDuration = this.getExpectedPhaseDuration(phase)
      const actualDuration = expectedDuration  // Placeholder - would calculate from state history
      
      timings.set(phase, {
        phase,
        startDay: currentDay,
        endDay: currentDay + actualDuration,
        daysSpent: actualDuration,
        completed: index < phases.length - 1, // All except last are completed
        majorPurchases: [],
        criticalDecisions: [],
        resourceGrowth: {
          energy: { start: 50, end: 100, growth: 50 },
          gold: { start: 0, end: 1000, growth: 1000 },
          materials: new Map()
        },
        expectedDuration,
        actualDuration,
        efficiencyRating: actualDuration <= expectedDuration ? 1.0 : expectedDuration / actualDuration
      })
      
      currentDay += actualDuration
    })
    
    return timings
  }
  
  private getExpectedPhaseDuration(phase: GamePhase): number {
    const durations: Record<GamePhase, number> = {
      'Tutorial': 3,
      'Early': 7,
      'Mid': 10,
      'Late': 8,
      'End': 4,
      'Post': 3
    }
    return durations[phase] || 5
  }
  
  private extractMilestones(result: SimulationResult): any[] {
    // Extract major milestones from action history
    return result.actionHistory
      .filter(a => a.type === 'purchase' && a.success)
      .slice(0, 10)  // Top 10 purchases as milestones
      .map(action => ({
        id: action.id || `milestone_${action.timestamp}`,
        name: action.itemId || 'Unknown Purchase',
        day: Math.floor(action.timestamp / (24 * 60)),
        time: this.convertToGameTime(action.timestamp),
        category: 'upgrade' as const,
        impact: 'moderate' as const,
        dependencies: []
      }))
  }
  
  private calculateDetailedProgressionRate(result: SimulationResult): any {
    const phases = this.getCompletedPhases(result)
    const totalDays = result.completionDay || result.gameStateHistory.length
    
    return {
      overall: totalDays > 0 ? phases.length / totalDays : 0,
      byPhase: new Map(), // Would calculate phase-specific rates
      trajectory: {
        timestamps: [0, totalDays * 24 * 60],
        values: [0, phases.length]
      }
    }
  }
  
  private identifyStuckPoints(result: SimulationResult): any[] {
    // Identify periods where progress stalled
    return []  // Simplified implementation
  }
  
  // ===== RESOURCE ANALYSIS =====
  
  private analyzeResources(result: SimulationResult): ResourceAnalysis {
    const finalState = result.gameStateHistory[result.gameStateHistory.length - 1]
    
    // Analyze energy utilization
    const energyUtilization = this.analyzeResourceUtilization(result, 'energy')
    const goldUtilization = this.analyzeResourceUtilization(result, 'gold')
    const materialUtilization = new Map<string, ResourceUtilization>()
    
    // Simplified material analysis
    if (finalState.resources.materials) {
      for (const [material, amount] of finalState.resources.materials) {
        materialUtilization.set(material, {
          resource: material,
          totalGenerated: amount * 2, // Estimate
          totalConsumed: amount,
          peakAmount: amount,
          averageAmount: amount * 0.7,
          utilizationRate: 0.8,
          timeline: { timestamps: [], values: [] },
          majorEvents: []
        })
      }
    }
    
    return {
      energyUtilization,
      goldUtilization,
      materialUtilization,
      wasteAnalysis: {
        energyCapped: 0,
        goldIdle: 0,
        materialsOverflow: new Map()
      },
      generationEfficiency: {
        farmProductivity: this.calculateFarmProductivity(result),
        adventureROI: this.calculateAdventureROI(result),
        miningYield: this.calculateMiningYield(result)
      }
    }
  }
  
  private analyzeResourceUtilization(result: SimulationResult, resource: string): ResourceUtilization {
    const finalState = result.gameStateHistory[result.gameStateHistory.length - 1]
    
    let currentAmount = 0
    let totalGenerated = 0
    let totalConsumed = 0
    
    if (resource === 'energy') {
      currentAmount = finalState.resources.energy.current
      // Estimate generation/consumption from action history
      totalGenerated = result.actionHistory.filter(a => a.energyGain).reduce((sum, a) => sum + (a.energyGain || 0), 0)
      totalConsumed = result.actionHistory.filter(a => a.energyCost).reduce((sum, a) => sum + (a.energyCost || 0), 0)
    } else if (resource === 'gold') {
      currentAmount = finalState.resources.gold
      totalGenerated = result.actionHistory.filter(a => a.goldGain).reduce((sum, a) => sum + (a.goldGain || 0), 0)
      totalConsumed = result.actionHistory.filter(a => a.goldCost).reduce((sum, a) => sum + (a.goldCost || 0), 0)
    }
    
    return {
      resource,
      totalGenerated,
      totalConsumed,
      peakAmount: Math.max(totalGenerated, currentAmount),
      averageAmount: (totalGenerated + currentAmount) / 2,
      utilizationRate: totalGenerated > 0 ? totalConsumed / totalGenerated : 0,
      timeline: { timestamps: [], values: [] },
      majorEvents: []
    }
  }
  
  private calculateFarmProductivity(result: SimulationResult): number {
    const farmActions = result.actionHistory.filter(a => a.screen === 'farm')
    const energyFromFarm = farmActions.reduce((sum, a) => sum + (a.energyGain || 0), 0)
    const totalDays = result.completionDay || result.gameStateHistory.length
    return totalDays > 0 ? energyFromFarm / totalDays : 0
  }
  
  private calculateAdventureROI(result: SimulationResult): number {
    const adventureActions = result.actionHistory.filter(a => a.type === 'start_adventure' && a.success)
    if (adventureActions.length === 0) return 0
    
    const totalGold = adventureActions.reduce((sum, a) => sum + (a.goldGain || 0), 0)
    const totalEnergy = adventureActions.reduce((sum, a) => sum + (a.energyCost || 0), 0)
    
    return totalEnergy > 0 ? totalGold / totalEnergy : 0
  }
  
  private calculateMiningYield(result: SimulationResult): number {
    const miningActions = result.actionHistory.filter(a => a.screen === 'mine')
    const totalMaterials = miningActions.reduce((sum, a) => sum + (a.materialsGained || 0), 0)
    const totalEnergy = miningActions.reduce((sum, a) => sum + (a.energyCost || 0), 0)
    
    return totalEnergy > 0 ? totalMaterials / totalEnergy : 0
  }
  
  // ===== DECISION ANALYSIS =====
  
  private analyzeDecisions(result: SimulationResult): DecisionAnalysis {
    const actions = result.actionHistory
    const actionsByType = new Map<string, number>()
    const actionsByScreen = new Map<string, number>()
    
    // Count actions by type and screen
    actions.forEach(action => {
      actionsByType.set(action.type, (actionsByType.get(action.type) || 0) + 1)
      actionsByScreen.set(action.screen, (actionsByScreen.get(action.screen) || 0) + 1)
    })
    
    const totalDays = result.completionDay || result.gameStateHistory.length
    
    return {
      summary: {
        totalActions: actions.length,
        actionsByType,
        actionsByScreen,
        actionsPerDay: totalDays > 0 ? actions.length / totalDays : 0,
        actionsPerSession: actions.length / Math.max(1, this.estimateSessionCount(result))
      },
      patterns: {
        sequences: [],
        frequencies: Array.from(actionsByType.entries()).map(([action, count]) => ({
          action,
          count,
          percentage: (count / actions.length) * 100,
          trend: 'stable' as const
        })),
        efficiency: []
      },
      optimization: {
        inefficientActions: [],
        missedOpportunities: [],
        suggestions: []
      }
    }
  }
  
  private estimateSessionCount(result: SimulationResult): number {
    // Estimate number of play sessions based on persona
    const persona = result.configuration.persona
    if (!persona) return 1
    
    const totalDays = result.completionDay || result.gameStateHistory.length
    return totalDays * (persona.schedule?.weekday?.checkIns || 2)
  }
  
  // ===== PERSONA ANALYSIS =====
  
  private analyzePersona(result: SimulationResult): PersonaAnalysis {
    const persona = result.configuration.persona
    if (!persona) {
      return this.createEmptyPersonaAnalysis()
    }
    
    return {
      personaId: persona.id,
      personaName: persona.name,
      behaviorAlignment: {
        checkInFrequency: {
          expected: persona.schedule?.weekday?.checkIns || 2,
          actual: this.calculateActualCheckIns(result),
          variance: 0  // Would calculate variance
        },
        riskTolerance: {
          expected: persona.behavior?.riskTolerance || 0.5,
          actual: this.calculateActualRiskTolerance(result),
          riskEvents: []
        },
        activityPatterns: {
          expectedScreenTime: new Map(),
          actualScreenTime: this.calculateScreenTime(result),
          alignmentScore: 0.8
        }
      },
      effectiveness: {
        personaScore: this.calculatePersonaEffectiveness(result),
        comparisonToOthers: [],
        strengths: this.identifyPersonaStrengths(result, persona),
        weaknesses: this.identifyPersonaWeaknesses(result, persona)
      }
    }
  }
  
  private calculateActualCheckIns(result: SimulationResult): number {
    const totalDays = result.completionDay || result.gameStateHistory.length
    // Estimate from action frequency
    return result.actionHistory.length / Math.max(1, totalDays)
  }
  
  private calculateActualRiskTolerance(result: SimulationResult): number {
    // Analyze risky actions taken
    const riskyActions = result.actionHistory.filter(a => 
      a.type === 'start_adventure' || 
      (a.type === 'purchase' && (a.goldCost || 0) > 1000)
    )
    return riskyActions.length / Math.max(1, result.actionHistory.length)
  }
  
  private calculateScreenTime(result: SimulationResult): Map<string, number> {
    const screenTime = new Map<string, number>()
    
    result.actionHistory.forEach(action => {
      if (action.screen) {
        screenTime.set(action.screen, (screenTime.get(action.screen) || 0) + 1)
      }
    })
    
    return screenTime
  }
  
  private calculatePersonaEffectiveness(result: SimulationResult): number {
    // Rate how well the persona performed
    let score = 0.5  // Base score
    
    if (result.completed) score += 0.3
    if (result.completionDay && result.completionDay < 30) score += 0.2
    
    return Math.min(1.0, score)
  }
  
  private identifyPersonaStrengths(result: SimulationResult, persona: any): string[] {
    const strengths: string[] = []
    
    if (result.completed) {
      strengths.push('Successfully completed the simulation')
    }
    
    if (persona.id === 'speedrunner' && result.completionDay && result.completionDay < 25) {
      strengths.push('Fast completion matching speedrunner goals')
    }
    
    return strengths
  }
  
  private identifyPersonaWeaknesses(result: SimulationResult, persona: any): string[] {
    const weaknesses: string[] = []
    
    if (!result.completed) {
      weaknesses.push('Failed to complete the simulation')
    }
    
    return weaknesses
  }
  
  // ===== RECOMMENDATION GENERATION =====
  
  private generateRecommendations(analysisResults: {
    summary: ReportSummary
    bottleneckAnalysis: BottleneckAnalysis
    efficiencyAnalysis: EfficiencyAnalysis
    decisionAnalysis: DecisionAnalysis
    personaAnalysis: PersonaAnalysis
  }): Recommendation[] {
    const recommendations: Recommendation[] = []
    
    // Generate bottleneck-based recommendations
    analysisResults.bottleneckAnalysis.detectedBottlenecks.forEach((bottleneck, index) => {
      if (bottleneck.severity >= 5) {  // Only high-severity bottlenecks
        recommendations.push({
          id: `bottleneck_${index}`,
          type: 'parameter',
          priority: bottleneck.severity >= 8 ? 'critical' : 'high',
          title: `Address ${bottleneck.type} bottleneck`,
          description: bottleneck.recommendation,
          issue: bottleneck.cause,
          impact: bottleneck.impact,
          solution: bottleneck.recommendation,
          expectedImprovement: `Could save ${bottleneck.daysLost.toFixed(1)} days`,
          effort: 'medium',
          evidence: [{
            type: 'statistic',
            description: 'Days lost to this issue',
            value: bottleneck.daysLost,
            source: 'Bottleneck Analysis'
          }],
          relatedBottlenecks: [bottleneck.type]
        })
      }
    })
    
    // Generate efficiency-based recommendations
    if (analysisResults.summary.resourceEfficiency < 0.7) {
      recommendations.push({
        id: 'resource_efficiency',
        type: 'strategy',
        priority: 'medium',
        title: 'Improve Resource Efficiency',
        description: 'Resource utilization is below optimal levels',
        issue: `Resource efficiency at ${Math.round(analysisResults.summary.resourceEfficiency * 100)}%`,
        impact: 'Slower progression and potential resource waste',
        solution: 'Review resource management parameters and automation settings',
        expectedImprovement: 'Up to 15% faster completion times',
        effort: 'low',
        evidence: [{
          type: 'statistic',
          description: 'Current resource efficiency',
          value: `${Math.round(analysisResults.summary.resourceEfficiency * 100)}%`,
          source: 'Efficiency Analysis'
        }],
        relatedBottlenecks: ['resource_shortage']
      })
    }
    
    // Generate completion-based recommendations
    if (!analysisResults.summary.completionStatus || analysisResults.summary.completionStatus !== 'success') {
      recommendations.push({
        id: 'completion_failure',
        type: 'balance',
        priority: 'critical',
        title: 'Address Completion Failure',
        description: 'Simulation failed to complete successfully',
        issue: `Simulation ended with status: ${analysisResults.summary.completionStatus}`,
        impact: 'Players may be unable to complete the game',
        solution: 'Review game balance and difficulty progression',
        expectedImprovement: 'Improved player completion rates',
        effort: 'high',
        evidence: [{
          type: 'threshold',
          description: 'Completion status',
          value: analysisResults.summary.completionStatus,
          source: 'Summary Analysis'
        }],
        relatedBottlenecks: analysisResults.summary.majorBottlenecks
      })
    }
    
    return recommendations.slice(0, 5)  // Limit to top 5 recommendations
  }
  
  // ===== HELPER METHODS =====
  
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private validateSimulationData(result: SimulationResult): void {
    if (!result.id) throw new Error('SimulationResult missing required id')
    if (!result.gameStateHistory || result.gameStateHistory.length === 0) {
      throw new Error('SimulationResult missing game state history')
    }
    if (!result.actionHistory) {
      throw new Error('SimulationResult missing action history')  
    }
  }
  
  private convertToGameTime(totalMinutes: number): GameTime {
    const day = Math.floor(totalMinutes / (24 * 60)) + 1
    const minutesInDay = totalMinutes % (24 * 60)
    const hour = Math.floor(minutesInDay / 60)
    const minute = minutesInDay % 60
    
    return { day, hour, minute, totalMinutes }
  }
  
  // ===== EMPTY ANALYSIS CREATORS =====
  
  private createEmptyBottleneckAnalysis(): BottleneckAnalysis {
    return {
      detectedBottlenecks: [],
      severity: 'minor',
      totalDelayDays: 0,
      categories: {
        resourceShortages: [],
        prerequisiteBlocks: [],
        decisionFailures: [],
        parameterIssues: []
      }
    }
  }
  
  private createEmptyEfficiencyAnalysis(): EfficiencyAnalysis {
    return {
      resourceEfficiency: {
        energy: { efficiency: 0.5, totalGenerated: 0, totalConsumed: 0, wastedToCap: 0, utilizationRate: 0.5 },
        gold: { efficiency: 0.5, totalGenerated: 0, totalConsumed: 0, wastedToCap: 0, utilizationRate: 0.5 },
        materials: new Map(),
        time: { activeTimeRatio: 0.5, screenTimeOptimality: 0.5, sessionEfficiency: 0.5, idleTimeWaste: 0 },
        overallRating: 50
      },
      timeAllocation: { screenTimeDistribution: new Map(), idealDistribution: new Map(), efficiency: 0.5, recommendations: [] },
      decisionEfficiency: { averageActionScore: 5, scoreTrend: { timestamps: [], values: [] }, highPerformingActions: [], lowPerformingActions: [] },
      actionOptimality: { optimalActions: 0, suboptimalActions: 0, missedOpportunities: 0, optimizationPotential: 0 },
      improvementOpportunities: [],
      benchmarkComparisons: []
    }
  }
  
  private createEmptyPersonaAnalysis(): PersonaAnalysis {
    return {
      personaId: 'unknown',
      personaName: 'Unknown',
      behaviorAlignment: {
        checkInFrequency: { expected: 2, actual: 2, variance: 0 },
        riskTolerance: { expected: 0.5, actual: 0.5, riskEvents: [] },
        activityPatterns: { expectedScreenTime: new Map(), actualScreenTime: new Map(), alignmentScore: 0.5 }
      },
      effectiveness: {
        personaScore: 0.5,
        comparisonToOthers: [],
        strengths: [],
        weaknesses: []
      }
    }
  }
}

