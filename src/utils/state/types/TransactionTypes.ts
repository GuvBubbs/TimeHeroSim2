// Transaction Types - Phase 9F Implementation
// Types for transaction-based state management

import type { StateChanges, StateEvent, ValidationResult } from './StateTypes'
import type { GameState } from '../../../types'

/**
 * Transaction status
 */
export type TransactionStatus = 'pending' | 'committed' | 'rolled_back' | 'failed'

/**
 * Transaction handle for tracking state transactions
 */
export interface TransactionHandle {
  id: string
  status: TransactionStatus
  createdAt: number
  committedAt?: number
  changes: StateChanges[]
  events: StateEvent[]
  rollbackData?: any
}

/**
 * Transaction configuration
 */
export interface TransactionConfig {
  autoCommit: boolean
  validateOnCommit: boolean
  generateEvents: boolean
  maxChanges: number
  timeoutMs: number
}

/**
 * Result of transaction operations
 */
export interface TransactionResult {
  success: boolean
  transactionId: string
  appliedChanges: number
  events: StateEvent[]
  error?: string
  validation?: ValidationResult
}

/**
 * Transaction context for operations
 */
export interface TransactionContext {
  transactionId: string
  gameState: GameState
  timestamp: number
  source: string
}

/**
 * Rollback information for state recovery
 */
export interface RollbackData {
  transactionId: string
  previousState: any // snapshot of relevant state before transaction
  changeOrder: string[] // order in which changes were applied
}
