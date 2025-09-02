// ActionResult - Execution result types
// Phase 9E Implementation

import type { GameEvent } from '../../../types'

/**
 * Result of an action execution attempt
 */
export interface ActionResult {
  success: boolean
  events: GameEvent[]
  error?: string
  rollback?: () => void
  metadata?: any
}

/**
 * State changes that an action can make
 */
export interface StateChanges {
  resources?: {
    energy?: number
    water?: number
    gold?: number
    materials?: Map<string, number>
    seeds?: Map<string, number>
  }
  location?: {
    currentScreen?: string
    timeOnScreen?: number
    navigationReason?: string
  }
  progression?: {
    farmPlots?: number
    availablePlots?: number
    farmStage?: number
    heroLevel?: number
    experience?: number
    currentPhase?: string
    completedCleanups?: Set<string>
    completedAdventures?: string[]
    unlockedUpgrades?: string[]
  }
  inventory?: {
    blueprints?: Map<string, any>
    tools?: Map<string, any>
    weapons?: Map<string, any>
    armor?: Map<string, any>
  }
  processes?: {
    crops?: any[]
    crafting?: any[]
    mining?: any
    seedCatching?: any
    adventure?: any
  }
  helpers?: {
    gnomes?: any[]
    housingCapacity?: number
  }
  automation?: {
    wateringEnabled?: boolean
    researchActive?: boolean
    combatActive?: boolean
    energyReserve?: number
    nextDecision?: any
  }
}

/**
 * Validation result for action execution
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Context needed for action execution
 */
export interface ExecutionContext {
  gameState: any
  parameters: any
  gameDataStore: any
  timestamp: number
}

/**
 * Result of executing multiple actions in a batch
 */
export interface BatchExecutionResult {
  executed: ActionResult[]
  totalEvents: GameEvent[]
  succeeded: number
  failed: number
  errors: string[]
}
