// ActionRouter.ts - Phase 10E Implementation
// Clean routing pattern that dispatches actions to appropriate systems

import type { GameAction, GameState } from '@/types'
import type { ActionResult } from './systems/core/GameSystem'
import type { SystemType } from './systems/systemRegistry'

// Import all systems
import { FarmSystem } from './systems/core/FarmSystem'
import { TowerSystem } from './systems/core/TowerSystem'
import { TownSystem } from './systems/core/TownSystem'
import { AdventureSystem } from './systems/core/AdventureSystem'
import { ForgeSystem } from './systems/core/ForgeSystem'
import { MineSystem } from './systems/core/MineSystem'
import { HelperSystem } from './systems/core/HelperSystem'

/**
 * Action types that can be routed to systems
 */
export type ActionType = GameAction['type']

/**
 * System registry interface for action routing
 */
interface SystemRegistry {
  farm: typeof FarmSystem
  tower: typeof TowerSystem
  town: typeof TownSystem
  adventure: typeof AdventureSystem
  forge: typeof ForgeSystem
  mine: typeof MineSystem
  helper: typeof HelperSystem
}

/**
 * ActionRouter - Clean routing without implementation
 * Replaces massive switch statements with clean dispatch to systems
 */
export class ActionRouter {
  private systems: SystemRegistry
  private routingTable: Map<ActionType, SystemType>

  constructor() {
    this.systems = {
      farm: FarmSystem,
      tower: TowerSystem,
      town: TownSystem,
      adventure: AdventureSystem,
      forge: ForgeSystem,
      mine: MineSystem,
      helper: HelperSystem
    }
    this.routingTable = this.buildRoutingTable()
  }

  /**
   * Build the routing table mapping action types to systems
   */
  private buildRoutingTable(): Map<ActionType, SystemType> {
    return new Map([
      // Farm actions
      ['plant', 'farm'],
      ['harvest', 'farm'],
      ['water', 'farm'],
      ['pump', 'farm'],
      ['cleanup', 'farm'],
      
      // Tower actions
      ['catch_seeds', 'tower'],
      
      // Town actions
      ['purchase', 'town'],
      ['build', 'town'],
      ['sell_material', 'town'],
      ['train', 'town'],
      
      // Adventure actions
      ['adventure', 'adventure'],
      
      // Mine actions
      ['mine', 'mine'],
      
      // Forge actions
      ['craft', 'forge'],
      ['stoke', 'forge'],
      
      // Helper actions
      ['assign_role', 'helper'],
      ['train_helper', 'helper'],
      ['rescue', 'helper']
      
      // Note: 'move' and 'wait' actions handled separately as they don't belong to specific systems
    ])
  }

  /**
   * Route action to appropriate system and execute
   */
  route(action: GameAction, state: GameState): ActionResult {
    // Handle special actions that don't route to systems
    if (action.type === 'move') {
      return this.handleMoveAction(action, state)
    }
    
    if (action.type === 'wait') {
      return this.handleWaitAction(action, state)
    }

    // 1. Get target system
    const systemType = this.routingTable.get(action.type)
    if (!systemType) {
      return { 
        success: false, 
        events: [],
        stateChanges: {},
        error: `No system handles action type: ${action.type}` 
      }
    }

    // 2. Get system instance
    const system = this.systems[systemType as keyof SystemRegistry]
    if (!system) {
      return { 
        success: false, 
        events: [],
        stateChanges: {},
        error: `System not found: ${systemType}` 
      }
    }

    // 3. Execute through system (skip validation for now - systems will handle it internally)
    try {
      return system.execute(action, state)
    } catch (error) {
      return { 
        success: false, 
        events: [],
        stateChanges: {},
        error: `Execution error: ${error instanceof Error ? error.message : String(error)}` 
      }
    }
  }

  /**
   * Handle move actions (navigation between screens)
   */
  private handleMoveAction(action: GameAction, state: GameState): ActionResult {
    const targetScreen = action.target || action.toScreen
    if (!targetScreen) {
      return { 
        success: false, 
        events: [], 
        stateChanges: {},
        error: 'No target screen specified' 
      }
    }

    // Basic movement logic - update location
    const previousScreen = state.location.currentScreen
    state.location.currentScreen = targetScreen as any
    state.location.timeOnScreen = 0
    state.location.screenHistory.push(targetScreen as any)
    state.location.navigationReason = action.description || `Moved to ${targetScreen}`

    return {
      success: true,
      stateChanges: {
        'location.currentScreen': targetScreen,
        'location.timeOnScreen': 0
      },
      events: [{
        type: 'movement',
        description: `Moved from ${previousScreen} to ${targetScreen}`,
        data: { 
          from: previousScreen,
          to: targetScreen,
          reason: action.description 
        }
      }]
    }
  }

  /**
   * Handle wait actions (simple delay)
   */
  private handleWaitAction(action: GameAction, state: GameState): ActionResult {
    // Wait action just consumes time, no state changes needed
    return {
      success: true,
      stateChanges: {},
      events: [{
        type: 'wait',
        description: `Waited for ${action.duration} minutes`,
        data: { duration: action.duration }
      }]
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Get system type for a given action type
   */
  getSystemForAction(actionType: ActionType): SystemType | undefined {
    return this.routingTable.get(actionType)
  }

  /**
   * Get all action types handled by a system
   */
  getActionsForSystem(systemType: SystemType): ActionType[] {
    return Array.from(this.routingTable.entries())
      .filter(([_, system]) => system === systemType)
      .map(([action, _]) => action)
  }

  /**
   * Get all registered systems
   */
  getRegisteredSystems(): SystemType[] {
    return Object.keys(this.systems) as SystemType[]
  }

  /**
   * Check if an action type is handled by any system
   */
  canRoute(actionType: ActionType): boolean {
    return this.routingTable.has(actionType) || actionType === 'move' || actionType === 'wait'
  }

  /**
   * Get routing table for debugging/documentation
   */
  getRoutingTable(): Map<ActionType, SystemType> {
    return new Map(this.routingTable)
  }
}
