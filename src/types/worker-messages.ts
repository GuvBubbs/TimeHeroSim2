// Worker Message Types - Phase 6B
// Type-safe communication between main thread and Web Worker

import type { 
  GameAction,
  GameEvent,
  TickResult,
  SerializedGameState
} from '@/types'

import type { SerializedSimulationConfig } from '@/utils/MapSerializer'

/**
 * Messages sent FROM main thread TO worker
 */
export type WorkerInputMessage = 
  | InitializeMessage
  | StartMessage
  | PauseMessage
  | SetSpeedMessage
  | StopMessage
  | GetStateMessage

export interface InitializeMessage {
  type: 'initialize'
  data: {
    config: SerializedSimulationConfig
    serializedParameters?: any // Additional parameter data if needed
  }
}

export interface StartMessage {
  type: 'start'
  data?: {
    speed?: number // Optional speed override
  }
}

export interface PauseMessage {
  type: 'pause'
}

export interface SetSpeedMessage {
  type: 'setSpeed'
  data: {
    speed: number // 0.1x to 1000x multiplier
  }
}

export interface StopMessage {
  type: 'stop'
}

export interface GetStateMessage {
  type: 'getState'
}

/**
 * Messages sent FROM worker TO main thread
 */
export type WorkerOutputMessage = 
  | ReadyMessage
  | TickMessage
  | StateMessage
  | CompleteMessage
  | ErrorMessage
  | StatsMessage

export interface ReadyMessage {
  type: 'ready'
  data: {
    initialized: boolean
    engineVersion: string
  }
}

export interface TickMessage {
  type: 'tick'
  data: {
    gameState: SerializedGameState
    executedActions: GameAction[]
    events: GameEvent[]
    deltaTime: number
    tickCount: number
    isComplete: boolean
    isStuck: boolean
  }
}

export interface StateMessage {
  type: 'state'
  data: {
    gameState: SerializedGameState
    stats: SimulationStats
  }
}

export interface CompleteMessage {
  type: 'complete'
  data: {
    reason: 'victory' | 'bottleneck' | 'manual' | 'error'
    finalState: SerializedGameState
    stats: SimulationStats
    summary: string
  }
}

export interface ErrorMessage {
  type: 'error'
  data: {
    message: string
    stack?: string
    fatal: boolean
  }
}

export interface StatsMessage {
  type: 'stats'
  data: SimulationStats
}

/**
 * Simulation statistics
 */
export interface SimulationStats {
  tickCount: number
  daysPassed: number
  realTimeElapsed: number // milliseconds
  simulationTimeElapsed: number // game minutes
  currentSpeed: number
  averageTickTime: number // milliseconds per tick
  isRunning: boolean
  phase: string
  memoryUsage?: number // MB if available
}

/**
 * Worker state for internal tracking
 */
export interface WorkerState {
  initialized: boolean
  running: boolean
  engine: any // SimulationEngine instance
  startTime: number
  lastTickTime: number
  tickTimes: number[] // For calculating average
  errorCount: number
}
