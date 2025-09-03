// ActionExecutor - Centralized action execution system
// Phase 10E Implementation - ActionRouter Integration

import type { GameAction, GameState, GameEvent, AllParameters } from '../../types'
import type { ActionResult, ExecutionContext } from './types/ActionResult'
import { ActionValidator } from './ActionValidator'
import { StateManager } from '../state'
import { ActionRouter } from '../ActionRouter'

/**
 * Core action execution engine - now using ActionRouter for clean dispatch
 */
export class ActionExecutor {
  private validator: ActionValidator
  private stateManager: StateManager | null = null
  private actionRouter: ActionRouter

  constructor() {
    this.validator = new ActionValidator()
    this.actionRouter = new ActionRouter()
  }

  /**
   * Set state manager for centralized state management
   */
  setStateManager(stateManager: StateManager): void {
    this.stateManager = stateManager
  }

  /**
   * Execute a single action - Phase 10E clean implementation
   */
  execute(action: GameAction, gameState: GameState, parameters: AllParameters, gameDataStore: any): ActionResult {
    const context: ExecutionContext = {
      gameState,
      parameters,
      gameDataStore,
      timestamp: gameState.time.totalMinutes
    }

    // Initialize StateManager if not set
    if (!this.stateManager) {
      this.stateManager = new StateManager(gameState)
    }

    // Validate action
    const validation = this.validator.validate(action, context)
    if (!validation.isValid) {
      return {
        success: false,
        events: [],
        error: validation.errors.join(', ')
      }
    }

    // Route action to appropriate system - clean and simple!
    try {
      const result = this.actionRouter.route(action, gameState)
      
      // Convert ActionResult to match ActionExecutor expectations
      // Add timestamps to events that don't have them
      const eventsWithTimestamps = result.events.map(event => ({
        ...event,
        timestamp: gameState.time.totalMinutes,
        importance: event.importance || 'medium' as const
      }))
      
      return {
        success: result.success,
        events: eventsWithTimestamps,
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        events: [],
        error: `Execution failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }
}
