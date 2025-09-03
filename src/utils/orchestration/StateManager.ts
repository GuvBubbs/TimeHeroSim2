// StateManager - Phase 9F Implementation
// Centralized state management with transactions and validation

import type { GameState, GameEvent } from '../../types'
import type { 
  StateChanges, 
  StateChange, 
  ValidationResult, 
  UpdateOptions, 
  UpdateMode,
  ResourceChangeRequest,
  StateEvent
} from '../state/types/StateTypes'
import type { 
  TransactionHandle, 
  TransactionResult, 
  TransactionConfig, 
  TransactionContext 
} from '../state/types/TransactionTypes'
import { ResourceManager } from '../state/ResourceManager'
import { StateValidator } from '../state/StateValidator'
import { StateSnapshot } from '../state/StateSnapshot'

/**
 * Default transaction configuration
 */
const DEFAULT_TRANSACTION_CONFIG: TransactionConfig = {
  autoCommit: true,
  validateOnCommit: true,
  generateEvents: true,
  maxChanges: 100,
  timeoutMs: 5000
}

/**
 * Default update options
 */
const DEFAULT_UPDATE_OPTIONS: UpdateOptions = {
  mode: 'immediate',
  validateBefore: false,
  validateAfter: true,
  generateEvents: true,
  allowPartialFailure: false
}

/**
 * Main state manager for centralized state operations
 */
export class StateManager {
  private gameState: GameState
  private resourceManager: ResourceManager
  private validator: StateValidator
  private activeTransactions: Map<string, TransactionHandle> = new Map()
  private snapshots: StateSnapshot[] = []
  private maxSnapshots: number = 10

  constructor(gameState: GameState) {
    this.gameState = gameState
    this.resourceManager = new ResourceManager(gameState)
    this.validator = new StateValidator()
  }

  /**
   * Update state with a set of changes
   */
  updateState(changes: StateChanges, options: Partial<UpdateOptions> = {}): TransactionResult {
    const opts = { ...DEFAULT_UPDATE_OPTIONS, ...options }
    
    // Create transaction for the changes
    const transactionId = this.generateTransactionId()
    const transaction: TransactionHandle = {
      id: transactionId,
      status: 'pending',
      createdAt: this.gameState.time.totalMinutes,
      changes: [changes],
      events: []
    }

    try {
      // Validate before if requested
      if (opts.validateBefore) {
        const validation = this.validator.validate(this.gameState)
        if (!validation.isValid) {
          return {
            success: false,
            transactionId,
            appliedChanges: 0,
            events: [],
            error: `Pre-validation failed: ${validation.errors.join(', ')}`,
            validation
          }
        }
      }

      // Create snapshot for rollback
      if (opts.mode === 'transaction') {
        const snapshot = new StateSnapshot(this.gameState, changes.reason, changes.source)
        transaction.rollbackData = snapshot
        this.snapshots.push(snapshot)
        this.trimSnapshots()
      }

      // Apply changes
      const appliedChanges = this.applyStateChanges(changes, opts.allowPartialFailure)
      
      // Validate after if requested
      if (opts.validateAfter) {
        const validation = this.validator.validateCritical(this.gameState)
        if (!validation.isValid) {
          // Rollback if validation fails and we have snapshot
          if (transaction.rollbackData) {
            (transaction.rollbackData as StateSnapshot).restore(this.gameState)
          }
          
          transaction.status = 'rolled_back'
          return {
            success: false,
            transactionId,
            appliedChanges: 0,
            events: [],
            error: `Post-validation failed: ${validation.errors.join(', ')}`,
            validation
          }
        }
      }

      // Generate events if requested
      if (opts.generateEvents) {
        const stateEvent: StateEvent = {
          timestamp: this.gameState.time.totalMinutes,
          type: 'state_change',
          description: changes.reason,
          importance: 'medium',
          stateChanges: changes.changes
        }
        transaction.events.push(stateEvent)
      }

      transaction.status = 'committed'
      transaction.committedAt = this.gameState.time.totalMinutes

      // Store transaction for tracking
      if (opts.mode === 'transaction') {
        this.activeTransactions.set(transactionId, transaction)
      }

      return {
        success: true,
        transactionId,
        appliedChanges,
        events: transaction.events,
        error: undefined
      }

    } catch (error) {
      transaction.status = 'failed'
      return {
        success: false,
        transactionId,
        appliedChanges: 0,
        events: [],
        error: `State update failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  /**
   * Update resources using ResourceManager
   */
  updateResource(request: ResourceChangeRequest, reason: string, source: string): TransactionResult {
    const result = this.resourceManager.processResourceChange(request)
    
    if (!result.success) {
      return {
        success: false,
        transactionId: this.generateTransactionId(),
        appliedChanges: 0,
        events: [],
        error: result.error
      }
    }

    // Create state change record for tracking
    const stateChange: StateChange = {
      path: this.getResourcePath(request),
      oldValue: result.newValue - result.actualAmount,
      newValue: result.newValue,
      operation: request.operation === 'transfer' ? 'set' : request.operation as 'add' | 'subtract' | 'set'
    }

    const changes: StateChanges = {
      changes: [stateChange],
      reason,
      source
    }

    return this.updateState(changes, { generateEvents: true })
  }

  /**
   * Start a new transaction
   */
  beginTransaction(config: Partial<TransactionConfig> = {}): string {
    const fullConfig = { ...DEFAULT_TRANSACTION_CONFIG, ...config }
    const transactionId = this.generateTransactionId()
    
    const transaction: TransactionHandle = {
      id: transactionId,
      status: 'pending',
      createdAt: this.gameState.time.totalMinutes,
      changes: [],
      events: []
    }

    // Create snapshot for rollback
    const snapshot = new StateSnapshot(this.gameState, 'transaction_start', 'StateManager')
    transaction.rollbackData = snapshot
    this.snapshots.push(snapshot)
    this.trimSnapshots()

    this.activeTransactions.set(transactionId, transaction)
    
    return transactionId
  }

  /**
   * Add changes to an existing transaction
   */
  addToTransaction(transactionId: string, changes: StateChanges): boolean {
    const transaction = this.activeTransactions.get(transactionId)
    if (!transaction || transaction.status !== 'pending') {
      return false
    }

    if (transaction.changes.length >= DEFAULT_TRANSACTION_CONFIG.maxChanges) {
      return false
    }

    transaction.changes.push(changes)
    return true
  }

  /**
   * Commit a transaction
   */
  commitTransaction(transactionId: string): TransactionResult {
    const transaction = this.activeTransactions.get(transactionId)
    if (!transaction || transaction.status !== 'pending') {
      return {
        success: false,
        transactionId,
        appliedChanges: 0,
        events: [],
        error: 'Transaction not found or not pending'
      }
    }

    try {
      let totalAppliedChanges = 0

      // Apply all changes in the transaction
      for (const changes of transaction.changes) {
        const appliedChanges = this.applyStateChanges(changes, false)
        totalAppliedChanges += appliedChanges

        // Generate events
        const stateEvent: StateEvent = {
          timestamp: this.gameState.time.totalMinutes,
          type: 'state_change',
          description: changes.reason,
          importance: 'medium',
          stateChanges: changes.changes
        }
        transaction.events.push(stateEvent)
      }

      // Validate final state
      const validation = this.validator.validateCritical(this.gameState)
      if (!validation.isValid) {
        // Rollback
        if (transaction.rollbackData) {
          (transaction.rollbackData as StateSnapshot).restore(this.gameState)
        }
        
        transaction.status = 'rolled_back'
        return {
          success: false,
          transactionId,
          appliedChanges: 0,
          events: [],
          error: `Transaction validation failed: ${validation.errors.join(', ')}`,
          validation
        }
      }

      transaction.status = 'committed'
      transaction.committedAt = this.gameState.time.totalMinutes

      return {
        success: true,
        transactionId,
        appliedChanges: totalAppliedChanges,
        events: transaction.events
      }

    } catch (error) {
      // Rollback on error
      if (transaction.rollbackData) {
        (transaction.rollbackData as StateSnapshot).restore(this.gameState)
      }
      
      transaction.status = 'failed'
      return {
        success: false,
        transactionId,
        appliedChanges: 0,
        events: [],
        error: `Transaction commit failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  /**
   * Rollback a transaction
   */
  rollbackTransaction(transactionId: string): boolean {
    const transaction = this.activeTransactions.get(transactionId)
    if (!transaction) {
      return false
    }

    if (transaction.rollbackData) {
      const success = (transaction.rollbackData as StateSnapshot).restore(this.gameState)
      if (success) {
        transaction.status = 'rolled_back'
        return true
      }
    }

    return false
  }

  /**
   * Apply state changes to game state
   */
  private applyStateChanges(changes: StateChanges, allowPartialFailure: boolean): number {
    let appliedCount = 0

    for (const change of changes.changes) {
      try {
        if (this.applyStateChange(change)) {
          appliedCount++
        } else if (!allowPartialFailure) {
          throw new Error(`Failed to apply change to ${change.path}`)
        }
      } catch (error) {
        if (!allowPartialFailure) {
          throw error
        }
      }
    }

    return appliedCount
  }

  /**
   * Apply a single state change
   */
  private applyStateChange(change: StateChange): boolean {
    try {
      const pathParts = change.path.split('.')
      let current: any = this.gameState

      // Navigate to the parent object
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (current[pathParts[i]] === undefined) {
          return false
        }
        current = current[pathParts[i]]
      }

      const finalKey = pathParts[pathParts.length - 1]

      // Apply the operation (default to 'set' if not specified)
      const operation = change.operation || 'set'
      switch (operation) {
        case 'set':
          current[finalKey] = change.newValue
          break
        case 'add':
          current[finalKey] = (current[finalKey] || 0) + change.newValue
          break
        case 'subtract':
          current[finalKey] = (current[finalKey] || 0) - change.newValue
          break
        case 'multiply':
          current[finalKey] = (current[finalKey] || 0) * change.newValue
          break
        case 'append':
          if (Array.isArray(current[finalKey])) {
            current[finalKey].push(change.newValue)
          } else {
            return false
          }
          break
        case 'remove':
          if (Array.isArray(current[finalKey])) {
            const index = current[finalKey].indexOf(change.newValue)
            if (index > -1) {
              current[finalKey].splice(index, 1)
            }
          } else {
            return false
          }
          break
        default:
          return false
      }

      return true
    } catch (error) {
      console.error(`Failed to apply state change to ${change.path}:`, error)
      return false
    }
  }

  /**
   * Get resource path for state tracking
   */
  private getResourcePath(request: ResourceChangeRequest): string {
    switch (request.type) {
      case 'energy':
        return 'resources.energy.current'
      case 'gold':
        return 'resources.gold'
      case 'water':
        return 'resources.water.current'
      case 'seeds':
        return `resources.seeds.${request.itemId}`
      case 'materials':
        return `resources.materials.${request.itemId}`
      default:
        return 'unknown'
    }
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Trim snapshots to max limit
   */
  private trimSnapshots(): void {
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.splice(0, this.snapshots.length - this.maxSnapshots)
    }
  }

  /**
   * Get transaction status
   */
  getTransaction(transactionId: string): TransactionHandle | undefined {
    return this.activeTransactions.get(transactionId)
  }

  /**
   * Get resource manager instance
   */
  getResourceManager(): ResourceManager {
    return this.resourceManager
  }

  /**
   * Get validator instance
   */
  getValidator(): StateValidator {
    return this.validator
  }

  /**
   * Get current state validation
   */
  validateCurrentState(): ValidationResult {
    return this.validator.validate(this.gameState)
  }

  // ===== LOCATION MANAGEMENT =====

  /**
   * Get current player location
   */
  getCurrentLocation(): string {
    return this.gameState.location.currentScreen
  }

  /**
   * Change player location with validation and events
   */
  changeLocation(newLocation: string, reason: string = 'Location change'): TransactionResult {
    const changes: StateChanges = {
      reason,
      source: 'StateManager.changeLocation',
      changes: [{
        type: 'location_change',
        path: 'location.currentScreen',
        operation: 'set',
        oldValue: this.gameState.location.currentScreen,
        newValue: newLocation,
        metadata: {
          fromScreen: this.gameState.location.currentScreen,
          toScreen: newLocation,
          timestamp: this.gameState.time.totalMinutes
        }
      }]
    }

    // Apply the location change
    const result = this.updateState(changes, {
      mode: 'immediate',
      validateBefore: false,
      validateAfter: true,
      generateEvents: true,
      allowPartialFailure: false
    })

    // Update additional location properties if successful
    if (result.success) {
      this.gameState.location.currentScreen = newLocation as any
      this.gameState.location.timeOnScreen = 0
      this.gameState.location.screenHistory.push(newLocation as any)
      this.gameState.location.navigationReason = reason
    }

    return result
  }

  /**
   * Validate if location change is allowed
   */
  canChangeLocation(newLocation: string): { allowed: boolean, reason?: string } {
    const validLocations = ['farm', 'town', 'tower', 'forge', 'mine', 'adventure']
    
    if (!validLocations.includes(newLocation)) {
      return { allowed: false, reason: `Invalid location: ${newLocation}` }
    }

    if (this.gameState.location.currentScreen === newLocation) {
      return { allowed: false, reason: `Already at ${newLocation}` }
    }

    return { allowed: true }
  }

  /**
   * Clean up completed transactions
   */
  cleanupTransactions(): void {
    const cutoff = this.gameState.time.totalMinutes - 60 // Keep transactions for 1 hour
    
    for (const [id, transaction] of this.activeTransactions.entries()) {
      if (transaction.createdAt < cutoff && transaction.status !== 'pending') {
        this.activeTransactions.delete(id)
      }
    }
  }

  // =============================================================================
  // PHASE 10F: STATE MANAGEMENT METHODS
  // =============================================================================

  /**
   * Update game time with validation and events
   */
  updateTime(deltaTime: number): TransactionResult {
    const oldTime = {
      totalMinutes: this.gameState.time.totalMinutes,
      minute: this.gameState.time.minute,
      hour: this.gameState.time.hour,
      day: this.gameState.time.day
    }

    const changes: StateChanges = {
      reason: 'Time progression',
      source: 'StateManager.updateTime',
      changes: [
        {
          type: 'time_update',
          path: 'time.totalMinutes',
          operation: 'add',
          oldValue: this.gameState.time.totalMinutes,
          newValue: this.gameState.time.totalMinutes + deltaTime,
          metadata: { deltaTime }
        }
      ]
    }

    // Apply the time change
    this.gameState.time.totalMinutes += deltaTime
    this.gameState.time.minute += deltaTime

    // Handle hour/day rollover
    while (this.gameState.time.minute >= 60) {
      this.gameState.time.minute -= 60
      this.gameState.time.hour += 1
    }

    while (this.gameState.time.hour >= 24) {
      this.gameState.time.hour -= 24
      this.gameState.time.day += 1
    }

    return {
      success: true,
      transactionId: this.generateTransactionId(),
      appliedChanges: 1,
      events: [{
        type: 'time.updated',
        description: `Time advanced by ${deltaTime} minutes`,
        timestamp: this.gameState.time.totalMinutes,
        importance: 'low' as const,
        data: {
          deltaTime,
          oldTime,
          newTime: {
            totalMinutes: this.gameState.time.totalMinutes,
            minute: this.gameState.time.minute,
            hour: this.gameState.time.hour,
            day: this.gameState.time.day
          }
        },
        stateChanges: [{
          type: 'time_update',
          path: 'time',
          operation: 'add',
          oldValue: oldTime.totalMinutes,
          newValue: this.gameState.time.totalMinutes,
          metadata: { deltaTime }
        }]
      }]
    }
  }

  /**
   * Set time speed with validation
   */
  setTimeSpeed(speed: number): TransactionResult {
    const oldSpeed = this.gameState.time.speed
    const newSpeed = Math.max(0.1, Math.min(10, speed))

    const changes: StateChanges = {
      reason: 'Time speed change',
      source: 'StateManager.setTimeSpeed',
      changes: [{
        type: 'time_speed_change',
        path: 'time.speed',
        operation: 'set',
        oldValue: oldSpeed,
        newValue: newSpeed,
        metadata: { requestedSpeed: speed, clampedSpeed: newSpeed }
      }]
    }

    this.gameState.time.speed = newSpeed

    return {
      success: true,
      transactionId: this.generateTransactionId(),
      appliedChanges: 1,
      events: [{
        type: 'time.speedChanged',
        description: `Time speed changed from ${oldSpeed}x to ${newSpeed}x`,
        timestamp: this.gameState.time.totalMinutes,
        importance: 'medium' as const,
        data: {
          oldSpeed,
          newSpeed,
          requestedSpeed: speed
        },
        stateChanges: [{
          type: 'time_speed_change',
          path: 'time.speed',
          operation: 'set',
          oldValue: oldSpeed,
          newValue: newSpeed,
          metadata: { requestedSpeed: speed, clampedSpeed: newSpeed }
        }]
      }]
    }
  }

  /**
   * Add time to current location tracking
   */
  addLocationTime(deltaTime: number): TransactionResult {
    const oldTime = this.gameState.location.timeOnScreen

    this.gameState.location.timeOnScreen += deltaTime

    return {
      success: true,
      transactionId: this.generateTransactionId(),
      appliedChanges: 1,
      events: [{
        type: 'location.timeUpdated',
        description: `Added ${deltaTime} minutes to ${this.gameState.location.currentScreen} screen time`,
        timestamp: this.gameState.time.totalMinutes,
        importance: 'low' as const,
        data: {
          screen: this.gameState.location.currentScreen,
          deltaTime,
          oldTime,
          newTime: this.gameState.location.timeOnScreen
        },
        stateChanges: [{
          type: 'location_time_update',
          path: 'location.timeOnScreen',
          operation: 'add',
          oldValue: oldTime,
          newValue: this.gameState.location.timeOnScreen,
          metadata: { deltaTime, screen: this.gameState.location.currentScreen }
        }]
      }]
    }
  }

  /**
   * Update game progression phase
   */
  updatePhase(newPhase: string, reason?: string): TransactionResult {
    const oldPhase = this.gameState.progression.currentPhase

    if (oldPhase === newPhase) {
      return {
        success: true,
        transactionId: this.generateTransactionId(),
        appliedChanges: 0,
        events: []
      }
    }

    const changes: StateChanges = {
      reason: reason || 'Phase progression',
      source: 'StateManager.updatePhase',
      changes: [{
        type: 'phase_change',
        path: 'progression.currentPhase',
        operation: 'set',
        oldValue: oldPhase,
        newValue: newPhase,
        metadata: { reason }
      }]
    }

    this.gameState.progression.currentPhase = newPhase

    return {
      success: true,
      transactionId: this.generateTransactionId(),
      appliedChanges: 1,
      events: [{
        type: 'progression.phaseChanged',
        description: `Game phase changed from ${oldPhase} to ${newPhase}${reason ? ` (${reason})` : ''}`,
        timestamp: this.gameState.time.totalMinutes,
        importance: 'high' as const,
        data: {
          oldPhase,
          newPhase,
          reason,
          gameDay: this.gameState.time.day
        },
        stateChanges: [{
          type: 'phase_change',
          path: 'progression.currentPhase',
          operation: 'set',
          oldValue: oldPhase,
          newValue: newPhase,
          metadata: { reason }
        }]
      }]
    }
  }

  /**
   * Consume a resource with validation
   */
  consumeResource(type: 'energy' | 'water' | 'gold', amount: number): TransactionResult {
    const resource = this.gameState.resources[type]
    
    if (typeof resource === 'object' && 'current' in resource) {
      // Energy/Water with current/max structure
      if (resource.current < amount) {
        return {
          success: false,
          transactionId: this.generateTransactionId(),
          appliedChanges: 0,
          events: [],
          error: `Insufficient ${type}: need ${amount}, have ${resource.current}`
        }
      }
      resource.current -= amount
    } else {
      // Gold as number
      if (resource < amount) {
        return {
          success: false,
          transactionId: this.generateTransactionId(),
          appliedChanges: 0,
          events: [],
          error: `Insufficient ${type}: need ${amount}, have ${resource}`
        }
      }
      (this.gameState.resources[type] as number) -= amount
    }

    return {
      success: true,
      transactionId: this.generateTransactionId(),
      appliedChanges: 1,
      events: [{
        type: 'resource.consumed',
        description: `Consumed ${amount} ${type}`,
        timestamp: this.gameState.time.totalMinutes,
        importance: 'medium' as const,
        data: {
          type,
          amount,
          remaining: typeof resource === 'object' ? resource.current : resource
        },
        stateChanges: [{
          type: 'resource_consumed',
          path: `resources.${type}`,
          operation: 'subtract',
          oldValue: typeof resource === 'object' ? resource.current + amount : resource + amount,
          newValue: typeof resource === 'object' ? resource.current : resource,
          metadata: { resourceType: type, amountConsumed: amount }
        }]
      }]
    }
  }

  /**
   * Add a resource
   */
  addResource(type: 'energy' | 'water' | 'gold', amount: number): TransactionResult {
    const resource = this.gameState.resources[type]
    
    if (typeof resource === 'object' && 'current' in resource) {
      // Energy/Water with current/max structure
      const oldCurrent = resource.current
      resource.current = Math.min(resource.current + amount, resource.max)
      const actualAdded = resource.current - oldCurrent
      
      return {
        success: true,
        transactionId: this.generateTransactionId(),
        appliedChanges: 1,
        events: [{
          type: 'resource.added',
          description: `Added ${actualAdded} ${type} (capped at max)`,
          timestamp: this.gameState.time.totalMinutes,
          importance: 'medium' as const,
          data: {
            type,
            amount,
            actualAdded,
            current: resource.current,
            max: resource.max
          },
          stateChanges: [{
            type: 'resource_added',
            path: `resources.${type}.current`,
            operation: 'add',
            oldValue: oldCurrent,
            newValue: resource.current,
            metadata: { resourceType: type, requestedAmount: amount, actualAdded }
          }]
        }]
      }
    } else {
      // Gold as number
      (this.gameState.resources[type] as number) += amount
      
      return {
        success: true,
        transactionId: this.generateTransactionId(),
        appliedChanges: 1,
        events: [{
          type: 'resource.added',
          description: `Added ${amount} ${type}`,
          timestamp: this.gameState.time.totalMinutes,
          importance: 'medium' as const,
          data: {
            type,
            amount,
            current: this.gameState.resources[type]
          },
          stateChanges: [{
            type: 'resource_added',
            path: `resources.${type}`,
            operation: 'add',
            oldValue: (this.gameState.resources[type] as number) - amount,
            newValue: this.gameState.resources[type] as number,
            metadata: { resourceType: type, amountAdded: amount }
          }]
        }]
      }
    }
  }

  /**
   * Get read-only access to game state
   */
  getState(): Readonly<GameState> {
    return this.gameState
  }

  /**
   * Execute a transaction with multiple state changes
   */
  transaction<T>(fn: () => T): T {
    const transactionId = this.beginTransaction()
    
    try {
      const result = fn()
      this.commitTransaction(transactionId)
      return result
    } catch (error) {
      this.rollbackTransaction(transactionId)
      throw error
    }
  }
}
