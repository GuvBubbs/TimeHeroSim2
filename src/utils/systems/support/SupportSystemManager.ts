/**
 * SupportSystemManager - Phase 10D Integration
 * 
 * Coordinates all support systems and provides unified interface
 * for validation, effects, and integration with core systems.
 */

import type { 
  GameState, 
  GameAction, 
  ValidationResult, 
  SystemEffects, 
  SystemModifier 
} from '@/types'
import { HelperSystem } from '../core/HelperSystem'
import { OfflineProgressionSystem } from './OfflineProgressionSystem'
import { PrerequisiteSystem } from './PrerequisiteSystem'

export class SupportSystemManager {
  /**
   * Validate an action against all support systems
   */
  static validateAction(action: GameAction, state: GameState): ValidationResult {
    // Check prerequisites first (most restrictive)
    const prereqResult = PrerequisiteSystem.validate(action, state)
    if (!prereqResult.valid) {
      return prereqResult
    }

    // Check helper system validation
    const helperResult = HelperSystem.validate(action, state)
    if (!helperResult.valid) {
      return helperResult
    }

    // Check offline progression validation
    const offlineResult = OfflineProgressionSystem.validate(action, state)
    if (!offlineResult.valid) {
      return offlineResult
    }

    return { valid: true }
  }

  /**
   * Apply all support system effects
   */
  static applyEffects(state: GameState, deltaTime: number): void {
    // Apply helper system effects
    HelperSystem.apply(state, deltaTime)
    
    // Apply offline progression if needed
    OfflineProgressionSystem.apply(state, deltaTime)
    
    // Prerequisites don't apply effects, they only validate
    PrerequisiteSystem.apply(state, deltaTime)
  }

  /**
   * Get all system modifiers from support systems
   */
  static getAllModifiers(state: GameState): SystemModifier[] {
    const allModifiers: SystemModifier[] = []

    // Get helper modifiers
    const helperEffects = HelperSystem.getEffects(state)
    allModifiers.push(...helperEffects.modifiers)

    // Get offline progression modifiers (usually none)
    const offlineEffects = OfflineProgressionSystem.getEffects(state)
    allModifiers.push(...offlineEffects.modifiers)

    // Get prerequisite modifiers (usually none)
    const prereqEffects = PrerequisiteSystem.getEffects(state)
    allModifiers.push(...prereqEffects.modifiers)

    return allModifiers
  }

  /**
   * Get combined system effects
   */
  static getCombinedEffects(state: GameState): SystemEffects {
    const modifiers = this.getAllModifiers(state)
    
    // Combine metadata from all systems
    const helperEffects = HelperSystem.getEffects(state)
    const offlineEffects = OfflineProgressionSystem.getEffects(state)
    const prereqEffects = PrerequisiteSystem.getEffects(state)

    return {
      modifiers,
      metadata: {
        helper: helperEffects.metadata,
        offline: offlineEffects.metadata,
        prerequisite: prereqEffects.metadata
      }
    }
  }

  /**
   * Apply modifiers to a base value
   */
  static applyModifiers(baseValue: number, target: string, modifiers: SystemModifier[]): number {
    let result = baseValue
    
    // Apply modifiers in order: add, multiply, override
    const targetModifiers = modifiers.filter(m => m.target === target)
    
    // First apply additive modifiers
    for (const mod of targetModifiers.filter(m => m.type === 'add')) {
      result += (mod.value as number)
    }

    // Then apply multiplicative modifiers
    for (const mod of targetModifiers.filter(m => m.type === 'multiply')) {
      result *= (mod.value as number)
    }

    // Finally apply override modifiers (last one wins)
    const overrides = targetModifiers.filter(m => m.type === 'override')
    if (overrides.length > 0) {
      result = overrides[overrides.length - 1].value as number
    }

    return result
  }

  /**
   * Check if a boolean modifier is enabled
   */
  static isBooleanModifierEnabled(target: string, modifiers: SystemModifier[]): boolean {
    const targetModifiers = modifiers.filter(m => m.target === target)
    
    // Check for enable/disable modifiers
    const enableModifiers = targetModifiers.filter(m => m.type === 'enable')
    const disableModifiers = targetModifiers.filter(m => m.type === 'disable')
    
    // Disable takes precedence
    if (disableModifiers.length > 0) {
      return false
    }
    
    // Then enable
    if (enableModifiers.length > 0) {
      return true
    }
    
    // Default state (unchanged)
    return false
  }

  /**
   * Get modifiers for a specific system target
   */
  static getModifiersForTarget(target: string, modifiers: SystemModifier[]): SystemModifier[] {
    return modifiers.filter(m => m.target === target || m.target.startsWith(target + '.'))
  }

  /**
   * Handle offline time when simulation resumes
   */
  static handleOfflineTime(state: GameState, offlineMinutes: number): void {
    if (offlineMinutes > 5) { // Only process if offline for more than 5 minutes
      console.log(`📴 Processing ${offlineMinutes} minutes of offline time...`)
      OfflineProgressionSystem.apply(state, offlineMinutes)
    }
  }
}
