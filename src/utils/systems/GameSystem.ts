// GameSystem Interface - Phase 10B Implementation
// Standardized interface for all core game systems

import type { GameState, GameAction, SimulationConfig, AllParameters } from '@/types'

/**
 * Standard result interface for system operations
 */
export interface SystemTickResult {
  stateChanges: Record<string, any>
  events: Array<{
    type: string
    description: string
    data?: any
    importance?: 'low' | 'medium' | 'high' | 'critical'
  }>
  completed?: boolean
}

/**
 * Result interface for action execution
 */
export interface ActionResult {
  success: boolean
  error?: string
  stateChanges: Record<string, any>
  events: Array<{
    type: string
    description: string
    data?: any
    importance?: 'low' | 'medium' | 'high' | 'critical'
  }>
}

/**
 * Validation result for action feasibility
 */
export interface ValidationResult {
  canExecute: boolean
  reason?: string
  missingResources?: Record<string, number>
  missingPrerequisites?: string[]
}

/**
 * Context for action evaluation
 */
export interface EvaluationContext {
  urgency: number
  availableEnergy: number
  availableTime: number
  currentPriorities: string[]
}

/**
 * Core game system interface - implemented by all major systems
 * Note: Systems use static methods, so this is more of a contract specification
 */
export interface GameSystemContract {
  /**
   * Evaluate what actions are possible for this system
   */
  evaluateActions(
    state: GameState, 
    config: SimulationConfig | AllParameters,
    context: EvaluationContext
  ): GameAction[]

  /**
   * Execute a specific action for this system
   */
  execute(
    action: GameAction, 
    state: GameState
  ): ActionResult

  /**
   * Process ongoing activities and state updates for this system
   */
  tick(
    deltaTime: number, 
    state: GameState
  ): SystemTickResult

  /**
   * Validate if an action can be executed
   */
  canExecute(
    action: GameAction,
    state: GameState
  ): ValidationResult
}

/**
 * Static system interface for TypeScript compliance
 * All game systems should implement these static methods
 */
export interface GameSystem {
  evaluateActions(
    state: GameState, 
    config: SimulationConfig | AllParameters,
    context: EvaluationContext
  ): GameAction[]

  execute(
    action: GameAction, 
    state: GameState
  ): ActionResult

  tick(
    deltaTime: number, 
    state: GameState
  ): SystemTickResult

  canExecute(
    action: GameAction,
    state: GameState
  ): ValidationResult
}

/**
 * Utility function to create default evaluation context
 */
export function createEvaluationContext(state: GameState): EvaluationContext {
  return {
    urgency: 0.5,
    availableEnergy: state.resources.energy.current,
    availableTime: state.resources.energy.current / 10, // Rough estimate
    currentPriorities: []
  }
}

/**
 * Utility function to create successful action result
 */
export function createSuccessResult(description: string, stateChanges: Record<string, any> = {}): ActionResult {
  return {
    success: true,
    stateChanges,
    events: [{
      type: 'action_completed',
      description,
      importance: 'medium'
    }]
  }
}

/**
 * Utility function to create failed action result
 */
export function createFailureResult(error: string): ActionResult {
  return {
    success: false,
    error,
    stateChanges: {},
    events: [{
      type: 'action_failed',
      description: `Action failed: ${error}`,
      importance: 'low'
    }]
  }
}

/**
 * Utility function to create system tick result
 */
export function createTickResult(stateChanges: Record<string, any> = {}, events: any[] = []): SystemTickResult {
  return {
    stateChanges,
    events,
    completed: false
  }
}
