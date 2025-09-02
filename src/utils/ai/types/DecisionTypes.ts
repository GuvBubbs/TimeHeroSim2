// DecisionTypes - AI Decision-Making Type Definitions
// Phase 9D Implementation

import type { GameState, GameAction, AllParameters } from '../../../types'

/**
 * Core decision engine interface
 */
export interface IDecisionEngine {
  /**
   * Get the next actions for the hero to take
   */
  getNextActions(gameState: GameState, parameters: AllParameters, gameDataStore: any): DecisionResult
  
  /**
   * Check if the hero should act now based on persona scheduling
   */
  shouldHeroActNow(gameState: GameState, lastCheckinTime: number): boolean
  
  /**
   * Update the last check-in time
   */
  updateLastCheckin(gameState: GameState): number
}

/**
 * Decision result with actions and metadata
 */
export interface DecisionResult {
  actions: GameAction[]
  urgency: UrgencyLevel
  reasoning: DecisionReasoning[]
  shouldAct: boolean
  nextCheckinTime?: number
}

/**
 * Urgency levels for decision making
 */
export type UrgencyLevel = 'low' | 'normal' | 'high' | 'critical' | 'emergency'

/**
 * Reasoning for decision making
 */
export interface DecisionReasoning {
  action: string
  score: number
  reason: string
  factors: string[]
}

/**
 * System registry for action evaluation
 */
export interface SystemRegistry {
  adventure: IGameSystem
  tower: IGameSystem
  town: IGameSystem
  forge: IGameSystem
  mine: IGameSystem
  helper: IGameSystem
  farm: IGameSystem
}

/**
 * Generic game system interface
 */
export interface IGameSystem {
  evaluateActions(gameState: GameState, parameters: AllParameters, gameDataStore: any): GameAction[]
}

/**
 * Persona strategy interface
 */
export interface IPersonaStrategy {
  /**
   * Check if hero should check in now
   */
  shouldCheckIn(currentTime: number, lastCheckIn: number, gameState: GameState): boolean
  
  /**
   * Get optimization level for this persona (0.0 - 1.0)
   */
  getOptimizationLevel(): number
  
  /**
   * Get risk tolerance for this persona (0.0 - 1.0)
   */
  getRiskTolerance(): number
  
  /**
   * Get efficiency factor for this persona (0.0 - 1.0)
   */
  getEfficiency(): number
  
  /**
   * Adjust action score based on persona characteristics
   */
  adjustActionScore(action: GameAction, baseScore: number, gameState: GameState): number
  
  /**
   * Get minimum check-in interval in minutes
   */
  getMinCheckinInterval(gameState: GameState): number
}

/**
 * Action scorer interface
 */
export interface IActionScorer {
  /**
   * Score an action based on current game state and persona
   */
  scoreAction(action: GameAction, gameState: GameState, persona: IPersonaStrategy): ScoredAction
  
  /**
   * Calculate base score for action type
   */
  calculateBaseScore(action: GameAction, gameState: GameState): number
  
  /**
   * Calculate urgency multiplier
   */
  calculateUrgencyMultiplier(action: GameAction, gameState: GameState): number
  
  /**
   * Calculate future value of action
   */
  calculateFutureValue(action: GameAction, gameState: GameState): number
}

/**
 * Action with score and reasoning
 */
export interface ScoredAction {
  id: string
  type: string
  screen: string
  target?: string
  duration: number
  energyCost: number
  goldCost: number
  prerequisites: string[]
  expectedRewards: any
  score: number
  reasoning: string
  factors: ScoreFactor[]
}

/**
 * Scoring factor breakdown
 */
export interface ScoreFactor {
  name: string
  value: number
  reason: string
}

/**
 * Action filter interface
 */
export interface IActionFilter {
  /**
   * Filter actions based on prerequisites and validity
   */
  filterValidActions(actions: GameAction[], gameState: GameState, gameDataStore: any): GameAction[]
  
  /**
   * Check if a single action is valid
   */
  isActionValid(action: GameAction, gameState: GameState, gameDataStore: any): boolean
  
  /**
   * Check action prerequisites
   */
  checkPrerequisites(action: GameAction, gameState: GameState, gameDataStore: any): boolean
}

/**
 * Emergency action types
 */
export type EmergencyType = 'seed_shortage' | 'energy_critical' | 'water_critical' | 'health_critical' | 'progression_blocked'

/**
 * Action decision result
 */
export interface ActionDecision {
  action: string
  reason: string
  nextCheck: number
  priority?: number
  target?: string
  alternatives?: { action: string; score: number }[]
}

/**
 * Emergency action configuration
 */
export interface EmergencyConfig {
  type: EmergencyType
  threshold: number
  priority: number
  actionGenerator: (gameState: GameState) => GameAction[]
}
