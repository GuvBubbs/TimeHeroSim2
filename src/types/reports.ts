// Reports System Type Definitions
// Comprehensive interfaces for simulation analysis and reporting

import type { GameState, GameEvent, ExecutedAction } from './simulation'
import type { PlayerPersona } from './personas'
import type { SimulationConfig } from './simulation'

// ===== CORE REPORT STRUCTURES =====

export interface SimulationResult {
  // Metadata
  id: string
  name: string
  timestamp: Date
  configuration: SimulationConfig
  
  // Completion status
  completed: boolean
  completionDay: number | null
  completionReason: 'victory' | 'max_days' | 'bottleneck' | 'error'
  
  // Raw simulation data
  gameStateHistory: GameState[]          // Snapshots at key moments
  actionHistory: ExecutedAction[]        // Every action taken
  eventHistory: GameEvent[]              // Major milestones
  performanceMetrics: PerformanceData    // Speed, memory, efficiency metrics
  
  // Processing metadata
  processedAt?: Date
  reportGenerated?: boolean
}

export interface AnalysisReport {
  id: string
  simulationId: string
  generatedAt: Date
  
  // High-level summary
  summary: ReportSummary
  
  // Detailed analysis sections
  progressionAnalysis: ProgressionAnalysis
  resourceAnalysis: ResourceAnalysis
  efficiencyAnalysis: EfficiencyAnalysis
  bottleneckAnalysis: BottleneckAnalysis
  decisionAnalysis: DecisionAnalysis
  personaAnalysis: PersonaAnalysis
  
  // Recommendations
  recommendations: Recommendation[]
  
  // Export metadata
  exportFormats: ExportFormat[]
}

export interface ReportSummary {
  // Basic identification
  simulationName: string
  personaId: string
  personaName: string
  
  // Basic completion info
  totalDays: number
  completionStatus: 'success' | 'timeout' | 'bottleneck'
  overallScore: number  // 0-100 performance rating
  
  // Key metrics
  resourceEfficiency: number      // 0-1 scale
  decisionQuality: number        // 0-1 scale  
  progressionRate: number        // phases per day
  
  // Major achievements
  phasesCompleted: string[]
  upgradesPurchased: number
  adventuresCompleted: number
  
  // Critical issues
  majorBottlenecks: string[]
  wastedResources: ResourceWaste[]
}

// ===== ANALYSIS STRUCTURES =====

export interface ProgressionAnalysis {
  phaseTimings: Map<GamePhase, PhasePerformance>
  milestoneAchievements: Milestone[]
  progressionRate: {
    overall: number              // Average phases per day
    byPhase: Map<GamePhase, number>
    trajectory: TimeSeriesData   // Progress over time
  }
  stuckPoints: StuckPoint[]      // Where progress stalled
}

export interface PhasePerformance {
  phase: GamePhase
  startDay: number
  endDay: number | null
  daysSpent: number
  completed: boolean
  
  // Key activities during phase
  majorPurchases: PurchaseEvent[]
  criticalDecisions: DecisionEvent[]
  resourceGrowth: ResourceGrowthData
  
  // Performance vs expectations
  expectedDuration: number
  actualDuration: number
  efficiencyRating: number
}

export interface ResourceAnalysis {
  energyUtilization: ResourceUtilization
  goldUtilization: ResourceUtilization
  materialUtilization: Map<string, ResourceUtilization>
  
  wasteAnalysis: {
    energyCapped: number         // Energy lost to cap
    goldIdle: number            // Gold sitting unused
    materialsOverflow: Map<string, number>
  }
  
  generationEfficiency: {
    farmProductivity: number     // Energy per day from farming
    adventureROI: number        // Gold per energy spent adventuring
    miningYield: number         // Materials per energy mining
  }
}

export interface ResourceUtilization {
  resource: string
  totalGenerated: number
  totalConsumed: number
  peakAmount: number
  averageAmount: number
  utilizationRate: number       // 0-1, how efficiently used
  
  timeline: TimeSeriesData      // Resource over time
  majorEvents: ResourceEvent[]  // Large gains/expenditures
}

export interface EfficiencyAnalysis {
  resourceEfficiency: ResourceEfficiencyAnalysis
  timeAllocation: TimeAllocationAnalysis
  decisionEfficiency: DecisionEfficiencyAnalysis
  actionOptimality: ActionOptimalityAnalysis
  
  improvementOpportunities: ImprovementOpportunity[]
  benchmarkComparisons: BenchmarkComparison[]
}

export interface ResourceEfficiencyAnalysis {
  energy: ResourceEfficiencyMetrics
  gold: ResourceEfficiencyMetrics
  materials: Map<string, ResourceEfficiencyMetrics>
  time: TimeEfficiencyMetrics
  
  overallRating: number  // 0-100
}

export interface ResourceEfficiencyMetrics {
  totalGenerated: number
  totalConsumed: number
  wastedToCap: number
  utilizationRate: number
  
  farmProductivity?: number
  adventureROI?: number
  
  efficiency: number  // 0-1 scale
}

// ===== BOTTLENECK ANALYSIS =====

export interface BottleneckAnalysis {
  detectedBottlenecks: Bottleneck[]
  severity: 'minor' | 'moderate' | 'severe' | 'critical'
  totalDelayDays: number
  
  categories: {
    resourceShortages: ResourceBottleneck[]
    prerequisiteBlocks: PrerequisiteBottleneck[]
    decisionFailures: DecisionBottleneck[]
    parameterIssues: ParameterBottleneck[]
  }
}

export interface Bottleneck {
  type: 'resource' | 'prerequisite' | 'decision' | 'parameter'
  severity: number              // 0-10 scale
  startDay: number
  endDay: number
  daysLost: number
  
  description: string
  cause: string
  impact: string
  recommendation: string
  
  // Supporting data
  gameStateSnapshot: GameState
  relevantActions: ExecutedAction[]
  parameterSettings: any
}

export interface ResourceBottleneck extends Bottleneck {
  resource: string
  requiredAmount: number
  availableAmount: number
  generationRate: number        // How much being produced
  consumptionRate: number       // How much being used
  timeToResolve: number         // Days until sufficient
}

export interface PrerequisiteBottleneck extends Bottleneck {
  blockedUpgrade: string
  missingPrerequisites: string[]
  availableAlternatives: string[]
  costToUnblock: ResourceCost
}

export interface DecisionBottleneck extends Bottleneck {
  repeatedAction: string
  timesAttempted: number
  averageScore: number
  betterAlternatives: string[]
}

export interface ParameterBottleneck extends Bottleneck {
  parameterPath: string
  currentValue: any
  recommendedValue: any
  expectedImprovement: string
}

// ===== DECISION ANALYSIS =====

export interface DecisionAnalysis {
  summary: {
    totalActions: number
    actionsByType: Map<ActionType, number>
    actionsByScreen: Map<GameScreen, number>
    actionsPerDay: number
    actionsPerSession: number
  }
  
  patterns: {
    sequences: ActionSequence[]
    frequencies: ActionFrequency[]
    efficiency: ActionEfficiency[]
  }
  
  optimization: {
    inefficientActions: IneffcientAction[]
    missedOpportunities: MissedOpportunity[]
    suggestions: OptimizationSuggestion[]
  }
}

export interface ActionSequence {
  actions: ExecutedAction[]
  frequency: number
  efficiency: number
  context: string
}

export interface IneffcientAction {
  action: ExecutedAction
  reason: string
  betterAlternative: ExecutedAction
  efficiencyLoss: number
}

export interface MissedOpportunity {
  time: GameTime
  opportunity: string
  impact: string
  prevention: string
}

// ===== PERSONA ANALYSIS =====

export interface PersonaAnalysis {
  personaId: string
  personaName: string
  
  behaviorAlignment: {
    checkInFrequency: {
      expected: number
      actual: number
      variance: number
    }
    riskTolerance: {
      expected: number
      actual: number
      riskEvents: RiskEvent[]
    }
    activityPatterns: {
      expectedScreenTime: Map<string, number>
      actualScreenTime: Map<string, number>
      alignmentScore: number
    }
  }
  
  effectiveness: {
    personaScore: number         // How well persona performed
    comparisonToOthers: PersonaComparison[]
    strengths: string[]
    weaknesses: string[]
  }
}

export interface RiskEvent {
  time: GameTime
  action: string
  riskLevel: number
  outcome: 'success' | 'failure'
  impact: string
}

export interface PersonaComparison {
  otherPersona: string
  metric: string
  thisValue: number
  otherValue: number
  advantage: number  // Positive = this persona better
}

// ===== RECOMMENDATION SYSTEM =====

export interface Recommendation {
  id: string
  type: 'parameter' | 'strategy' | 'balance' | 'persona'
  priority: 'low' | 'medium' | 'high' | 'critical'
  
  title: string
  description: string
  
  issue: string
  impact: string
  solution: string
  
  // Implementation details
  parameterChanges?: ParameterChange[]
  expectedImprovement: string
  effort: 'low' | 'medium' | 'high'
  
  // Supporting evidence
  evidence: RecommendationEvidence[]
  relatedBottlenecks: string[]
}

export interface ParameterChange {
  path: string
  currentValue: any
  recommendedValue: any
  reason: string
}

export interface RecommendationEvidence {
  type: 'statistic' | 'pattern' | 'comparison' | 'threshold'
  description: string
  value: string | number
  source: string
}

// ===== COMPARISON SYSTEM =====

export interface ComparisonResult {
  reports: AnalysisReport[]
  metrics: ComparisonMetrics
  insights: ComparisonInsight[]
}

export interface ComparisonMetrics {
  averageScore: number
  averageDays: number
  successRate: number
  
  bestPerformer: AnalysisReport
  fastestCompletion: AnalysisReport
}

export interface ComparisonInsight {
  type: 'performance' | 'efficiency' | 'bottleneck' | 'pattern'
  title: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
  recommendations: string[]
}

// ===== EXPORT SYSTEM =====

export interface ExportData {
  reports: AnalysisReport[]
  metadata: ExportMetadata
  analysis?: ComparisonResult
  comparison?: ComparisonResult
}

export interface ExportMetadata {
  exportDate: Date
  version: string
  reportCount: number
  options?: ExportOptions
}

export interface ExportOptions {
  includeRawData: boolean
  includeAnalysis: boolean
  includeComparison: boolean
  includeCharts: boolean
  template?: string
  compression: boolean
}

export type ExportFormat = 'json' | 'csv' | 'markdown' | 'pdf' | 'llm'

// ===== SUPPORTING TYPES =====

export type GamePhase = 'Tutorial' | 'Early' | 'Mid' | 'Late' | 'End' | 'Post'
export type GameScreen = 'farm' | 'tower' | 'town' | 'adventure' | 'forge' | 'mine'
export type ActionType = string  // From simulation types

export interface GameTime {
  day: number
  hour: number
  minute: number
  totalMinutes: number
}

export interface TimeSeriesData {
  timestamps: number[]
  values: number[]
}

export interface ResourceWaste {
  resource: string
  amount: number
  reason: string
  day: number
}

export interface ResourceEvent {
  time: GameTime
  type: 'gain' | 'loss' | 'waste'
  amount: number
  source: string
}

export interface Milestone {
  id: string
  name: string
  day: number
  time: GameTime
  category: 'upgrade' | 'unlock' | 'achievement' | 'phase'
  impact: 'minor' | 'moderate' | 'major' | 'critical'
  dependencies: string[]
}

export interface StuckPoint {
  startDay: number
  endDay: number
  reason: string
  resolution: string | null
}

export interface PurchaseEvent {
  time: GameTime
  itemId: string
  itemName: string
  goldCost: number
  category: string
}

export interface DecisionEvent {
  time: GameTime
  action: string
  score: number
  alternatives: string[]
  outcome: string
}

export interface ResourceGrowthData {
  energy: { start: number; end: number; growth: number }
  gold: { start: number; end: number; growth: number }
  materials: Map<string, { start: number; end: number; growth: number }>
}

export interface PerformanceData {
  avgTicksPerSecond: number
  memoryUsage: number
  cpuUsage: number
  frameDrops: number
  errors: string[]
}

export interface ResourceCost {
  gold?: number
  energy?: number
  materials?: Map<string, number>
}

export interface TimeAllocationAnalysis {
  screenTimeDistribution: Map<string, number>
  idealDistribution: Map<string, number>
  efficiency: number
  recommendations: string[]
}

export interface DecisionEfficiencyAnalysis {
  averageActionScore: number
  scoreTrend: TimeSeriesData
  highPerformingActions: string[]
  lowPerformingActions: string[]
}

export interface ActionOptimalityAnalysis {
  optimalActions: number
  suboptimalActions: number
  missedOpportunities: number
  optimizationPotential: number
}

export interface ActionEfficiency {
  action: string
  frequency: number
  averageScore: number
  efficiency: number
}

export interface ActionFrequency {
  action: string
  count: number
  percentage: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface ImprovementOpportunity {
  area: string
  currentValue: number
  potentialValue: number
  improvement: number
  effort: 'low' | 'medium' | 'high'
  steps: string[]
}

export interface BenchmarkComparison {
  metric: string
  value: number
  benchmark: number
  performance: 'above' | 'at' | 'below'
  percentile: number
}

export interface TimeEfficiencyMetrics {
  activeTimeRatio: number
  screenTimeOptimality: number
  sessionEfficiency: number
  idleTimeWaste: number
}

export interface OptimizationSuggestion {
  category: string
  suggestion: string
  expectedGain: number
  difficulty: 'easy' | 'moderate' | 'hard'
  implementation: string[]
}

// ===== CHART DATA =====

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
  fill?: boolean
}

// ===== FILTER & SORT TYPES =====

export interface ReportFilters {
  status: Set<'success' | 'timeout' | 'bottleneck'>
  personas: Set<string>
  dateRange: { start: Date; end: Date } | null
  phases: Set<GamePhase>
  tags: Set<string>
}

export type SortField = 'date' | 'name' | 'persona' | 'completion' | 'efficiency' | 'score'
export type SortDirection = 'asc' | 'desc'
export type ViewMode = 'summary' | 'detailed' | 'raw'

// ===== ERROR HANDLING =====

export interface ReportError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
