// StateSnapshot - Phase 9F Implementation
// Efficient state snapshots for rollback and debugging

import type { GameState } from '../../types'

/**
 * Snapshot metadata
 */
export interface SnapshotMetadata {
  id: string
  timestamp: number
  reason: string
  source: string
  size: number
}

/**
 * State snapshot for rollback capability
 */
export class StateSnapshot {
  private readonly data: string
  private readonly metadata: SnapshotMetadata

  constructor(gameState: GameState, reason: string, source: string) {
    this.metadata = {
      id: this.generateId(),
      timestamp: gameState.time.totalMinutes,
      reason,
      source,
      size: 0
    }

    // Create deep copy of relevant state (not the entire gameState to save memory)
    const snapshotData = this.createSnapshotData(gameState)
    this.data = JSON.stringify(snapshotData)
    this.metadata.size = this.data.length
  }

  /**
   * Create snapshot data from game state (only essential parts)
   */
  private createSnapshotData(gameState: GameState): any {
    return {
      resources: {
        energy: { ...gameState.resources.energy },
        gold: gameState.resources.gold,
        water: { ...gameState.resources.water },
        seeds: new Map(gameState.resources.seeds),
        materials: new Map(gameState.resources.materials)
      },
      progression: { ...gameState.progression },
      time: { ...gameState.time },
      inventory: {
        tools: new Map(gameState.inventory.tools),
        weapons: new Map(gameState.inventory.weapons),
        armor: new Map(gameState.inventory.armor),
        blueprints: new Map(gameState.inventory.blueprints),
        capacity: gameState.inventory.capacity,
        currentWeight: gameState.inventory.currentWeight
      },
      processes: {
        crops: [...gameState.processes.crops],
        adventure: gameState.processes.adventure ? { ...gameState.processes.adventure } : null,
        crafting: [...gameState.processes.crafting],
        mining: gameState.processes.mining ? { ...gameState.processes.mining } : null,
        seedCatching: gameState.processes.seedCatching ? { ...gameState.processes.seedCatching } : null
      },
      location: { ...gameState.location },
      helpers: {
        gnomes: [...gameState.helpers.gnomes],
        housingCapacity: gameState.helpers.housingCapacity,
        availableRoles: [...gameState.helpers.availableRoles],
        rescueQueue: [...gameState.helpers.rescueQueue]
      },
      automation: { ...gameState.automation }
    }
  }

  /**
   * Restore state from snapshot
   */
  restore(gameState: GameState): boolean {
    try {
      const snapshotData = JSON.parse(this.data)

      // Restore resources
      gameState.resources.energy = { ...snapshotData.resources.energy }
      gameState.resources.gold = snapshotData.resources.gold
      gameState.resources.water = { ...snapshotData.resources.water }
      gameState.resources.seeds = new Map(snapshotData.resources.seeds)
      gameState.resources.materials = new Map(snapshotData.resources.materials)

      // Restore progression
      Object.assign(gameState.progression, snapshotData.progression)

      // Restore time
      Object.assign(gameState.time, snapshotData.time)

      // Restore inventory
      gameState.inventory.tools = new Map(snapshotData.inventory.tools)
      gameState.inventory.weapons = new Map(snapshotData.inventory.weapons)
      gameState.inventory.armor = new Map(snapshotData.inventory.armor)
      gameState.inventory.blueprints = new Map(snapshotData.inventory.blueprints)
      gameState.inventory.capacity = snapshotData.inventory.capacity
      gameState.inventory.currentWeight = snapshotData.inventory.currentWeight

      // Restore processes
      gameState.processes.crops = [...snapshotData.processes.crops]
      gameState.processes.adventure = snapshotData.processes.adventure
      gameState.processes.crafting = [...snapshotData.processes.crafting]
      gameState.processes.mining = snapshotData.processes.mining
      gameState.processes.seedCatching = snapshotData.processes.seedCatching

      // Restore location
      Object.assign(gameState.location, snapshotData.location)

      // Restore helpers
      gameState.helpers.gnomes = [...snapshotData.helpers.gnomes]
      gameState.helpers.housingCapacity = snapshotData.helpers.housingCapacity
      gameState.helpers.availableRoles = [...snapshotData.helpers.availableRoles]
      gameState.helpers.rescueQueue = [...snapshotData.helpers.rescueQueue]

      // Restore automation
      Object.assign(gameState.automation, snapshotData.automation)

      return true
    } catch (error) {
      console.error('Failed to restore state snapshot:', error)
      return false
    }
  }

  /**
   * Get snapshot metadata
   */
  getMetadata(): SnapshotMetadata {
    return { ...this.metadata }
  }

  /**
   * Generate unique snapshot ID
   */
  private generateId(): string {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get snapshot size in bytes
   */
  getSize(): number {
    return this.metadata.size
  }

  /**
   * Check if snapshot is valid
   */
  isValid(): boolean {
    try {
      JSON.parse(this.data)
      return true
    } catch {
      return false
    }
  }
}
