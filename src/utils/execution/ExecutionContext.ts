// ExecutionContext - Context for action execution
// Phase 9E Implementation

import type { GameState, AllParameters } from '../../types'

/**
 * Context information needed for action execution
 */
export interface ExecutionContext {
  gameState: GameState
  parameters: AllParameters
  gameDataStore: any
  timestamp: number
}

/**
 * Creates an execution context from the current game state
 */
export function createExecutionContext(
  gameState: GameState, 
  parameters: AllParameters, 
  gameDataStore: any
): ExecutionContext {
  return {
    gameState,
    parameters,
    gameDataStore,
    timestamp: gameState.time.totalMinutes
  }
}
