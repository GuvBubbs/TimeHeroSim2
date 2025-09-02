// Event Types - Type-safe event definitions for TimeHero Simulator
// Implements comprehensive event system with strict typing

import type { GameAction, GameState } from '../../../types'

/**
 * State changes interface for tracking modifications
 */
export interface StateChanges {
  resources?: { [key: string]: { old: number; new: number } }
  location?: { old: string; new: string }
  inventory?: { [key: string]: { old: number; new: number } }
  progression?: { [key: string]: { old: any; new: any } }
  automation?: { [key: string]: { old: any; new: any } }
  [key: string]: any
}

/**
 * All possible event types in the simulation
 */
export type EventType = 
  | 'action_executed'
  | 'action_failed'
  | 'state_changed'
  | 'resource_changed'
  | 'process_started'
  | 'process_completed'
  | 'process_failed'
  | 'crop_planted'
  | 'crop_harvested'
  | 'adventure_started'
  | 'adventure_completed'
  | 'item_purchased'
  | 'structure_built'
  | 'level_up'
  | 'achievement_unlocked'
  | 'bottleneck_detected'
  | 'tick_processed'
  | 'simulation_started'
  | 'simulation_paused'
  | 'simulation_stopped'
  | 'validation_failed'
  | 'error'
  | 'warning'
  | 'info'

/**
 * Event data payloads for each event type
 */
export interface EventDataMap {
  action_executed: {
    action: GameAction
    result: {
      success: boolean
      stateChanges?: StateChanges
      events?: any[]
    }
    executionTime?: number
  }
  action_failed: {
    action: GameAction
    error: string
    reason?: string
    context?: any
  }
  state_changed: {
    changes: StateChanges
    source: string
    gameState?: Partial<GameState>
  }
  resource_changed: {
    resource: string
    oldValue: number
    newValue: number
    delta: number
    source?: string
  }
  process_started: {
    processId: string
    type: string
    data: any
    expectedDuration?: number
  }
  process_completed: {
    processId: string
    type: string
    result: any
    actualDuration?: number
  }
  process_failed: {
    processId: string
    type: string
    error: string
    data?: any
  }
  crop_planted: {
    cropId: string
    plotIndex: number
    energy: number
    seeds: number
  }
  crop_harvested: {
    cropId: string
    plotIndex: number
    energy: number
    yield: number
  }
  adventure_started: {
    routeId: string
    length: string
    energyCost: number
    expectedRewards?: any
  }
  adventure_completed: {
    routeId: string
    length: string
    rewards: {
      gold: number
      xp: number
      loot: string[]
    }
    actualDuration: number
  }
  item_purchased: {
    itemId: string
    itemType: string
    cost: {
      gold?: number
      materials?: { [key: string]: number }
    }
    vendor?: string
  }
  structure_built: {
    structureId: string
    blueprintId: string
    unlocks: string[]
    cost: {
      energy?: number
      materials?: { [key: string]: number }
      time?: number
    }
  }
  level_up: {
    oldLevel: number
    newLevel: number
    xp: number
    totalXp: number
  }
  achievement_unlocked: {
    achievementId: string
    name: string
    description?: string
    reward?: any
  }
  bottleneck_detected: {
    type: string
    details: any
    priority: number
    suggestions?: string[]
  }
  tick_processed: {
    tickCount: number
    deltaTime: number
    executedActions: number
    gameDay: number
    gameTime: string
  }
  simulation_started: {
    config: any
    personaId: string
    startTime: number
  }
  simulation_paused: {
    reason: string
    tickCount: number
    gameDay: number
  }
  simulation_stopped: {
    reason: 'victory' | 'bottleneck' | 'manual' | 'error'
    tickCount: number
    gameDay: number
    finalState?: Partial<GameState>
  }
  validation_failed: {
    action: GameAction
    reason: string
    details?: any
  }
  error: {
    message: string
    stack?: string
    context?: any
    source?: string
  }
  warning: {
    message: string
    context?: any
    source?: string
  }
  info: {
    message: string
    data?: any
    source?: string
  }
}

/**
 * Base event structure
 */
export interface BaseEvent<T extends EventType> {
  type: T
  data: EventDataMap[T]
  timestamp: number
  source?: string
  metadata?: {
    gameDay?: number
    gameTime?: string
    tickCount?: number
    [key: string]: any
  }
}

/**
 * Event handler function type
 */
export type EventHandler<T extends EventType> = (
  event: BaseEvent<T>
) => void | Promise<void>

/**
 * Wildcard event handler that receives all events
 */
export type WildcardHandler = (
  event: BaseEvent<EventType>
) => void | Promise<void>

/**
 * Function to unsubscribe from events
 */
export type UnsubscribeFn = () => void

/**
 * Event filter function
 */
export type EventFilter = (event: BaseEvent<any>) => boolean

/**
 * Event importance levels
 */
export type EventImportance = 'low' | 'medium' | 'high' | 'critical'

/**
 * Log levels for event logging
 */
export type LogLevel = 'debug' | 'info' | 'warning' | 'error'

/**
 * Event statistics interface
 */
export interface EventStatistics {
  totalEvents: number
  eventCounts: Record<EventType, number>
  averageEventsPerMinute: number
  peakEventsPerMinute: number
  lastEventTime: number
  errorCount: number
  warningCount: number
}

/**
 * Event logger options
 */
export interface EventLoggerOptions {
  maxHistorySize?: number
  logToConsole?: boolean
  logLevel?: LogLevel
  includeMetadata?: boolean
  timestampFormat?: 'relative' | 'absolute'
}

/**
 * Log filter for querying event history
 */
export interface LogFilter {
  types?: EventType[]
  startTime?: number
  endTime?: number
  source?: string
  importance?: EventImportance
  limit?: number
  offset?: number
}

/**
 * Event replay progress information
 */
export interface ReplayProgress {
  currentIndex: number
  totalEvents: number
  isPlaying: boolean
  speed: number
  currentTime: number
  totalTime: number
  eventsPerSecond: number
}
