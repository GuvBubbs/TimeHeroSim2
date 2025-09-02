// ExecutionTypes - Core execution system types
// Phase 9E Implementation

/**
 * Strategy interface for executing specific action types
 */
export interface ExecutionStrategy {
  canHandle(actionType: string): boolean
  execute(action: any, context: any): any
  validate?(action: any, context: any): any
}

/**
 * Action execution metadata
 */
export interface ExecutionMetadata {
  startTime: number
  endTime: number
  duration: number
  strategy: string
  stateChangesApplied: boolean
}

/**
 * Resource consumption tracking
 */
export interface ResourceConsumption {
  energy: number
  water: number
  gold: number
  materials: Map<string, number>
  time: number
}
