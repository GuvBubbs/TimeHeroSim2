// State Management Module - Phase 9F Implementation
// Centralized exports for state management system

export { StateManager } from '../orchestration/StateManager'
export { ResourceManager } from './ResourceManager'
export { StateValidator } from './StateValidator'
export { StateSnapshot } from './StateSnapshot'

// Types
export type {
  StateChange,
  StateChanges,
  ValidationResult,
  StateEvent,
  ResourceChangeRequest,
  ResourceChangeResult,
  StateInvariant,
  UpdateOptions
} from './types/StateTypes'

export type {
  TransactionHandle,
  TransactionResult,
  TransactionConfig,
  TransactionContext,
  TransactionStatus
} from './types/TransactionTypes'
