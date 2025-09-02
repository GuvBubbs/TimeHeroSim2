// ProcessTypes - Phase 9G Implementation
// Standardized process interfaces and types

import type { GameState, GameEvent } from '../../../types'

/**
 * Process type enumeration
 */
export type ProcessType = 
  | 'crop_growth'
  | 'adventure' 
  | 'crafting'
  | 'mining'
  | 'seed_catching'
  | 'helper_training'

/**
 * Process state enumeration
 */
export type ProcessState = 
  | 'starting'
  | 'running'
  | 'completing'
  | 'completed'
  | 'cancelled'
  | 'failed'

/**
 * Base process data interface
 */
export interface ProcessData {
  id?: string
  type: ProcessType
  startTime?: number
  [key: string]: any
}

/**
 * Process handle for tracking active processes
 */
export interface ProcessHandle {
  id: string
  type: ProcessType
  data: ProcessData
  startTime: number
  lastUpdate: number
  progress: number
  state: ProcessState
  metadata?: ProcessMetadata
}

/**
 * Process update result
 */
export interface ProcessUpdateResult {
  handle: ProcessHandle
  stateChanges: StateChanges
  events: ProcessEvent[]
  completed: boolean
  failed?: boolean
  errorMessage?: string
}

/**
 * Process tick result
 */
export interface ProcessTickResult {
  updated: ProcessHandle[]
  completed: ProcessHandle[]
  failed: ProcessHandle[]
  stateChanges: StateChanges
  events: ProcessEvent[]
}

/**
 * Process completion result
 */
export interface ProcessCompletionResult {
  handle: ProcessHandle
  stateChanges: StateChanges
  events: ProcessEvent[]
  success: boolean
  rewards?: any
}

/**
 * Process validation result
 */
export interface ValidationResult {
  valid: boolean
  errorMessage?: string
  requirements?: string[]
}

/**
 * Process initialization result
 */
export interface InitResult {
  success: boolean
  handle?: ProcessHandle
  errorMessage?: string
}

/**
 * Process metadata
 */
export interface ProcessMetadata {
  type: ProcessType
  name: string
  description: string
  maxConcurrent: number
  canPause: boolean
  canCancel: boolean
  estimatedDuration?: number
}

/**
 * State changes interface
 */
export interface StateChanges {
  resources?: {
    energy?: { current?: number; max?: number }
    gold?: number
    water?: { current?: number; max?: number }
    seeds?: Map<string, number>
    materials?: Map<string, number>
  }
  inventory?: {
    tools?: Map<string, any>
    weapons?: Map<string, any>
    armor?: Map<string, any>
  }
  progression?: {
    heroLevel?: number
    experience?: number
    unlockedUpgrades?: string[]
    completedAdventures?: string[]
  }
  location?: {
    currentScreen?: string
  }
  processes?: {
    add?: ProcessHandle[]
    remove?: string[]
    update?: ProcessHandle[]
  }
}

/**
 * Process event interface
 */
export interface ProcessEvent {
  timestamp: number
  type: string
  processId: string
  processType: ProcessType
  description: string
  importance: 'low' | 'medium' | 'high'
  data?: any
}

/**
 * Process handler interface
 */
export interface IProcessHandler {
  // Lifecycle methods
  canStart(data: ProcessData, gameState: GameState): ValidationResult
  initialize(handle: ProcessHandle, data: ProcessData, gameState: GameState): InitResult
  update(
    handle: ProcessHandle, 
    deltaTime: number, 
    gameState: GameState, 
    gameDataStore: any
  ): ProcessUpdateResult
  complete(handle: ProcessHandle, gameState: GameState): ProcessCompletionResult
  cancel(handle: ProcessHandle, gameState: GameState): void
  
  // Metadata
  getMetadata(): ProcessMetadata
}

/**
 * Specific process data types
 */
export interface CropProcessData extends ProcessData {
  type: 'crop_growth'
  plotId: string
  cropId: string
  plantedAt: number
  growthTimeRequired: number
}

export interface AdventureProcessData extends ProcessData {
  type: 'adventure'
  adventureId: string
  routeLength: 'Short' | 'Medium' | 'Long'
  expectedDuration: number
}

export interface CraftingProcessData extends ProcessData {
  type: 'crafting'
  itemId: string
  expectedDuration: number
  materialsCost: Map<string, number>
  energyCost: number
}

export interface MiningProcessData extends ProcessData {
  type: 'mining'
  depth: number
  energyDrain: number
}

export interface SeedCatchingProcessData extends ProcessData {
  type: 'seed_catching'
  duration: number
  windLevel: number
  netType: string
  expectedSeeds: number
}

export interface HelperTrainingProcessData extends ProcessData {
  type: 'helper_training'
  helperId: string
  skill: string
  duration: number
  xpGain: number
}
