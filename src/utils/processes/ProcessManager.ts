// ProcessManager - Phase 9G Implementation
// Central process orchestration and management

import type { GameState } from '../../types'
import type { 
  ProcessType, 
  ProcessHandle, 
  ProcessData,
  ProcessTickResult,
  ProcessCompletionResult,
  ProcessUpdateResult,
  ValidationResult,
  StateChanges,
  ProcessEvent,
  IProcessHandler
} from './types/ProcessTypes'
import { ProcessRegistry } from './ProcessRegistry'

// Import process handlers
import { CropGrowthHandler } from './handlers/CropGrowthHandler'
import { AdventureHandler } from './handlers/AdventureHandler'
import { CraftingHandler } from './handlers/CraftingHandler'
import { MiningHandler } from './handlers/MiningHandler'
import { SeedCatchingHandler } from './handlers/SeedCatchingHandler'
import { HelperTrainingHandler } from './handlers/HelperTrainingHandler'

/**
 * Central process manager for all ongoing activities
 */
export class ProcessManager {
  private registry: ProcessRegistry
  private nextProcessId: number = 1
  
  constructor() {
    this.registry = new ProcessRegistry()
    this.initializeHandlers()
  }
  
  /**
   * Initialize all process handlers
   */
  private initializeHandlers(): void {
    // Register crop growth handler
    const cropHandler = new CropGrowthHandler()
    this.registry.register('crop_growth', cropHandler.getMetadata(), cropHandler)
    
    // Register adventure handler
    const adventureHandler = new AdventureHandler()
    this.registry.register('adventure', adventureHandler.getMetadata(), adventureHandler)
    
    // Register crafting handler
    const craftingHandler = new CraftingHandler()
    this.registry.register('crafting', craftingHandler.getMetadata(), craftingHandler)
    
    // Register mining handler
    const miningHandler = new MiningHandler()
    this.registry.register('mining', miningHandler.getMetadata(), miningHandler)
    
    // Register seed catching handler
    const seedCatchingHandler = new SeedCatchingHandler()
    this.registry.register('seed_catching', seedCatchingHandler.getMetadata(), seedCatchingHandler)
    
    // Register helper training handler
    const helperTrainingHandler = new HelperTrainingHandler()
    this.registry.register('helper_training', helperTrainingHandler.getMetadata(), helperTrainingHandler)
  }
  
  /**
   * Main tick method - processes all active processes
   */
  tick(
    deltaTime: number, 
    gameState: GameState, 
    gameDataStore: any
  ): ProcessTickResult {
    const updated: ProcessHandle[] = []
    const completed: ProcessHandle[] = []
    const failed: ProcessHandle[] = []
    const allStateChanges: StateChanges = {}
    const allEvents: ProcessEvent[] = []

    const activeProcesses = this.registry.getActiveProcesses()
    
    // Debug: Log ProcessManager tick only if there are active processes
    if (activeProcesses.length > 0) {
      console.log('⚙️ ProcessManager: Ticking with', activeProcesses.length, 'active processes')
    }    // Process each active process
    for (const handle of activeProcesses) {
      const handler = this.registry.getHandler(handle.type)
      if (!handler) {
        console.warn(`No handler found for process type: ${handle.type}`)
        continue
      }
      
      try {
        // Update the process
        const result = handler.update(handle, deltaTime, gameState, gameDataStore)
        
        // Merge state changes
        this.mergeStateChanges(allStateChanges, result.stateChanges)
        
        // Add events
        allEvents.push(...result.events)
        
        // Track updated processes
        updated.push(result.handle)
        
        // Handle completion
        if (result.completed) {
          const completionResult = handler.complete(result.handle, gameState)
          completed.push(result.handle)
          
          // Merge completion state changes
          this.mergeStateChanges(allStateChanges, completionResult.stateChanges)
          allEvents.push(...completionResult.events)
          
          // Remove from active processes
          this.registry.removeActiveProcess(result.handle.id)
        } else if (result.failed) {
          failed.push(result.handle)
          this.registry.removeActiveProcess(result.handle.id)
          
          // Add failure event
          allEvents.push({
            timestamp: gameState.time.totalMinutes,
            type: 'process_failed',
            processId: result.handle.id,
            processType: result.handle.type,
            description: result.errorMessage || `${result.handle.type} process failed`,
            importance: 'high'
          })
        }
      } catch (error) {
        console.error(`Error processing ${handle.type}:`, error)
        failed.push(handle)
        this.registry.removeActiveProcess(handle.id)
        
        allEvents.push({
          timestamp: gameState.time.totalMinutes,
          type: 'process_error',
          processId: handle.id,
          processType: handle.type,
          description: `${handle.type} process encountered an error: ${error}`,
          importance: 'high'
        })
      }
    }
    
    // Apply state changes to game state
    this.applyStateChanges(gameState, allStateChanges)
    
    return {
      updated,
      completed,
      failed,
      stateChanges: allStateChanges,
      events: allEvents
    }
  }
  
  /**
   * Start a new process
   */
  startProcess(
    type: ProcessType, 
    data: ProcessData, 
    gameState: GameState
  ): ProcessHandle | null {
    const handler = this.registry.getHandler(type)
    if (!handler) {
      console.warn(`No handler found for process type: ${type}`)
      return null
    }
    
    // Check if we can start this process type
    if (!this.registry.canStartProcess(type)) {
      console.warn(`Cannot start ${type}: maximum concurrent processes reached`)
      return null
    }
    
    // Validate the process can be started
    const validation = handler.canStart(data, gameState)
    if (!validation.valid) {
      console.warn(`Cannot start ${type}: ${validation.errorMessage}`)
      return null
    }
    
    // Create process handle
    const handle: ProcessHandle = {
      id: `${type}_${this.nextProcessId++}`,
      type,
      data,
      startTime: gameState.time.totalMinutes,
      lastUpdate: gameState.time.totalMinutes,
      progress: 0,
      state: 'starting',
      metadata: handler.getMetadata()
    }
    
    // Initialize the process
    const initResult = handler.initialize(handle, data, gameState)
    if (!initResult.success) {
      console.warn(`Failed to initialize ${type}: ${initResult.errorMessage}`)
      return null
    }
    
    // Register as active
    handle.state = 'running'
    this.registry.addActiveProcess(handle)
    
    console.log(`🚀 ProcessManager: Started ${type} process: ${handle.id}`)
    return handle
  }
  
  /**
   * Cancel a process
   */
  cancelProcess(processId: string, gameState: GameState): boolean {
    const handle = this.registry.getActiveProcess(processId)
    if (!handle) {
      return false
    }
    
    const handler = this.registry.getHandler(handle.type)
    if (!handler) {
      return false
    }
    
    // Cancel the process
    handler.cancel(handle, gameState)
    handle.state = 'cancelled'
    
    // Remove from active processes
    this.registry.removeActiveProcess(processId)
    
    console.log(`Cancelled ${handle.type} process: ${processId}`)
    return true
  }
  
  /**
   * Get active processes
   */
  getActiveProcesses(): ProcessHandle[] {
    return this.registry.getActiveProcesses()
  }
  
  /**
   * Get active processes by type
   */
  getActiveProcessesByType(type: ProcessType): ProcessHandle[] {
    return this.registry.getActiveProcessesByType(type)
  }
  
  /**
   * Check if a process type has active instances
   */
  hasActiveProcess(type: ProcessType): boolean {
    return this.registry.getActiveCount(type) > 0
  }
  
  /**
   * Get process by ID
   */
  getProcess(processId: string): ProcessHandle | undefined {
    return this.registry.getActiveProcess(processId)
  }
  
  /**
   * Get registry statistics
   */
  getStats() {
    return this.registry.getStats()
  }
  
  /**
   * Merge state changes from multiple processes
   */
  private mergeStateChanges(target: StateChanges, source: StateChanges): void {
    if (!source) return
    
    // Merge resources
    if (source.resources) {
      if (!target.resources) target.resources = {}
      
      if (source.resources.energy) {
        if (!target.resources.energy) target.resources.energy = {}
        if (source.resources.energy.current !== undefined) {
          target.resources.energy.current = (target.resources.energy.current || 0) + source.resources.energy.current
        }
        if (source.resources.energy.max !== undefined) {
          target.resources.energy.max = source.resources.energy.max
        }
      }
      
      if (source.resources.gold !== undefined) {
        target.resources.gold = (target.resources.gold || 0) + source.resources.gold
      }
      
      if (source.resources.water) {
        if (!target.resources.water) target.resources.water = {}
        if (source.resources.water.current !== undefined) {
          target.resources.water.current = (target.resources.water.current || 0) + source.resources.water.current
        }
        if (source.resources.water.max !== undefined) {
          target.resources.water.max = source.resources.water.max
        }
      }
      
      if (source.resources.seeds) {
        if (!target.resources.seeds) target.resources.seeds = new Map()
        for (const [seed, amount] of Array.from(source.resources.seeds.entries())) {
          const current = target.resources.seeds.get(seed) || 0
          target.resources.seeds.set(seed, current + amount)
        }
      }
      
      if (source.resources.materials) {
        if (!target.resources.materials) target.resources.materials = new Map()
        for (const [material, amount] of Array.from(source.resources.materials.entries())) {
          const current = target.resources.materials.get(material) || 0
          target.resources.materials.set(material, current + amount)
        }
      }
    }
    
    // Merge inventory (simplified for now)
    if (source.inventory) {
      if (!target.inventory) target.inventory = {}
      // Inventory merging would need more complex logic
    }
    
    // Merge progression
    if (source.progression) {
      if (!target.progression) target.progression = {}
      if (source.progression.experience !== undefined) {
        target.progression.experience = (target.progression.experience || 0) + source.progression.experience
      }
      if (source.progression.heroLevel !== undefined) {
        target.progression.heroLevel = source.progression.heroLevel
      }
      if (source.progression.unlockedUpgrades) {
        if (!target.progression.unlockedUpgrades) target.progression.unlockedUpgrades = []
        target.progression.unlockedUpgrades.push(...source.progression.unlockedUpgrades)
      }
      if (source.progression.completedAdventures) {
        if (!target.progression.completedAdventures) target.progression.completedAdventures = []
        target.progression.completedAdventures.push(...source.progression.completedAdventures)
      }
    }
    
    // Merge location
    if (source.location) {
      if (!target.location) target.location = {}
      if (source.location.currentScreen) {
        target.location.currentScreen = source.location.currentScreen
      }
    }
    
    // Merge processes
    if (source.processes) {
      if (!target.processes) target.processes = {}
      if (source.processes.add) {
        if (!target.processes.add) target.processes.add = []
        target.processes.add.push(...source.processes.add)
      }
      if (source.processes.remove) {
        if (!target.processes.remove) target.processes.remove = []
        target.processes.remove.push(...source.processes.remove)
      }
      if (source.processes.update) {
        if (!target.processes.update) target.processes.update = []
        target.processes.update.push(...source.processes.update)
      }
    }
  }
  
  /**
   * Apply accumulated state changes to the game state
   */
  private applyStateChanges(gameState: GameState, changes: StateChanges): void {
    if (!changes) return
    
    // Apply resource changes
    if (changes.resources) {
      if (changes.resources.energy) {
        if (changes.resources.energy.current !== undefined) {
          gameState.resources.energy.current = Math.max(0, 
            Math.min(gameState.resources.energy.max, 
              gameState.resources.energy.current + changes.resources.energy.current))
        }
        if (changes.resources.energy.max !== undefined) {
          gameState.resources.energy.max = changes.resources.energy.max
        }
      }
      
      if (changes.resources.gold !== undefined) {
        gameState.resources.gold = Math.max(0, gameState.resources.gold + changes.resources.gold)
      }
      
      if (changes.resources.water) {
        if (changes.resources.water.current !== undefined) {
          gameState.resources.water.current = Math.max(0,
            Math.min(gameState.resources.water.max,
              gameState.resources.water.current + changes.resources.water.current))
        }
        if (changes.resources.water.max !== undefined) {
          gameState.resources.water.max = changes.resources.water.max
        }
      }
      
      if (changes.resources.seeds) {
        for (const [seed, amount] of Array.from(changes.resources.seeds.entries())) {
          const current = gameState.resources.seeds.get(seed) || 0
          gameState.resources.seeds.set(seed, Math.max(0, current + amount))
        }
      }
      
      if (changes.resources.materials) {
        for (const [material, amount] of Array.from(changes.resources.materials.entries())) {
          const current = gameState.resources.materials.get(material) || 0
          gameState.resources.materials.set(material, Math.max(0, current + amount))
        }
      }
    }
    
    // Apply progression changes
    if (changes.progression) {
      if (changes.progression.experience !== undefined) {
        gameState.progression.experience += changes.progression.experience
      }
      if (changes.progression.heroLevel !== undefined) {
        gameState.progression.heroLevel = changes.progression.heroLevel
      }
      if (changes.progression.unlockedUpgrades) {
        for (const upgrade of changes.progression.unlockedUpgrades) {
          if (!gameState.progression.unlockedUpgrades.includes(upgrade)) {
            gameState.progression.unlockedUpgrades.push(upgrade)
          }
        }
      }
      if (changes.progression.completedAdventures) {
        for (const adventure of changes.progression.completedAdventures) {
          if (!gameState.progression.completedAdventures.includes(adventure)) {
            gameState.progression.completedAdventures.push(adventure)
          }
        }
      }
    }
    
    // Apply location changes
    if (changes.location?.currentScreen) {
      gameState.location.currentScreen = changes.location.currentScreen as any
    }
  }
}
