/**
 * Support System Types - Phase 10D Integration
 * 
 * Defines interfaces for support systems that modify and validate behavior
 * of core and activity systems.
 */

import type { GameState, GameAction } from './game-state'

/**
 * Base interface for all support systems (using static methods)
 */
export interface SupportSystemStatic {
  /**
   * Validate an action against system-specific requirements
   */
  validate(action: GameAction, state: GameState): ValidationResult
  
  /**
   * Apply system effects to game state (called every tick)
   */
  apply(state: GameState, deltaTime?: number): void
  
  /**
   * Get current system effects/modifiers
   */
  getEffects(state: GameState): SystemEffects
}

/**
 * Base interface for support systems (instance methods - for future use)
 */
export interface SupportSystem {
  /**
   * Validate an action against system-specific requirements
   */
  validate(action: GameAction, state: GameState): ValidationResult
  
  /**
   * Apply system effects to game state (called every tick)
   */
  apply(state: GameState, deltaTime?: number): void
  
  /**
   * Get current system effects/modifiers
   */
  getEffects(state: GameState): SystemEffects
}

/**
 * Result of validation check
 */
export interface ValidationResult {
  valid: boolean
  reason?: string
  requirements?: string[]
}

/**
 * System effects that modify other systems
 */
export interface SystemEffects {
  modifiers: SystemModifier[]
  metadata?: Record<string, any>
}

/**
 * Individual system modifier
 */
export interface SystemModifier {
  source: 'helper' | 'offline' | 'prerequisite' | 'automation'
  type: 'multiply' | 'add' | 'override' | 'enable' | 'disable'
  value: number | boolean
  target: string // e.g., 'farm.harvestSpeed', 'tower.catchRate'
  description?: string
}

/**
 * Offline progression results
 */
export interface OfflineProgressionResult {
  timeProcessed: number
  summary: OfflineProgressionSummary
  modifiersApplied: SystemModifier[]
}

/**
 * Offline progression summary for UI display
 */
export interface OfflineProgressionSummary {
  title: string
  sections: Array<{
    category: string
    items: string[]
    iconEmoji?: string
  }>
}

/**
 * Helper assignment and efficiency data
 */
export interface HelperEfficiency {
  helperId: string
  role: string
  level: number
  efficiency: number
  modifiers: SystemModifier[]
}

/**
 * Prerequisite check context
 */
export interface PrerequisiteContext {
  actionType?: string
  itemId?: string
  upgradeId?: string
  requirements?: string[]
}
