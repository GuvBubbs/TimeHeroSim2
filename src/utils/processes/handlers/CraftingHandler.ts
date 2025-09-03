// CraftingHandler - Phase 9G Implementation
// Handles crafting processes using ForgeSystem (CraftingSystem merged)

import type { GameState } from '../../../types'
import type { 
  IProcessHandler,
  ProcessHandle,
  ProcessData,
  ProcessUpdateResult,
  ProcessCompletionResult,
  ValidationResult,
  InitResult,
  ProcessMetadata,
  ProcessEvent,
  CraftingProcessData
} from '../types/ProcessTypes'
import { ForgeSystem } from '../../systems/core/ForgeSystem'

export class CraftingHandler implements IProcessHandler {
  
  canStart(data: ProcessData, gameState: GameState): ValidationResult {
    const craftData = data as CraftingProcessData
    
    // Check if at forge/town
    if (gameState.location.currentScreen !== 'town' && gameState.location.currentScreen !== 'forge') {
      return {
        valid: false,
        errorMessage: 'Must be at forge or town to craft items'
      }
    }
    
    // Check energy cost
    if (craftData.energyCost && gameState.resources.energy.current < craftData.energyCost) {
      return {
        valid: false,
        errorMessage: 'Not enough energy to start crafting'
      }
    }
    
    // Check materials
    if (craftData.materialsCost) {
      for (const [material, required] of Array.from(craftData.materialsCost.entries())) {
        const available = gameState.resources.materials.get(material) || 0
        if (available < required) {
          return {
            valid: false,
            errorMessage: `Not enough ${material} (need ${required}, have ${available})`
          }
        }
      }
    }
    
    return { valid: true }
  }
  
  initialize(handle: ProcessHandle, data: ProcessData, gameState: GameState): InitResult {
    const craftData = data as CraftingProcessData
    
    // Consume energy
    if (craftData.energyCost) {
      gameState.resources.energy.current -= craftData.energyCost
    }
    
    // Consume materials
    if (craftData.materialsCost) {
      for (const [material, required] of Array.from(craftData.materialsCost.entries())) {
        const current = gameState.resources.materials.get(material) || 0
        gameState.resources.materials.set(material, current - required)
      }
    }
    
    // Add to crafting queue in game state
    gameState.processes.crafting.push({
      itemId: craftData.itemId,
      startedAt: handle.startTime,
      duration: craftData.expectedDuration,
      progress: 0,
      heat: 3000, // Optimal starting heat
      isComplete: false
    })
    
    return { success: true, handle }
  }
  
  update(
    handle: ProcessHandle,
    deltaTime: number,
    gameState: GameState,
    gameDataStore: any
  ): ProcessUpdateResult {
    const craftData = handle.data as CraftingProcessData
    
    // Find the crafting item in the queue
    const craftingItem = gameState.processes.crafting.find(c => c.itemId === craftData.itemId && c.startedAt === handle.startTime)
    if (!craftingItem) {
      return {
        handle,
        stateChanges: {},
        events: [],
        completed: false,
        failed: true,
        errorMessage: `Crafting item ${craftData.itemId} not found in queue`
      }
    }
    
    // Use ForgeSystem to process crafting (CraftingSystem merged)
    const previousProgress = craftingItem.progress
    ForgeSystem.processCrafting(gameState, deltaTime, gameDataStore)
    
    // Update handle progress
    handle.progress = craftingItem.progress
    
    const events: ProcessEvent[] = []
    
    // Check if completed
    const completed = craftingItem.isComplete
    if (completed) {
      events.push({
        timestamp: gameState.time.totalMinutes,
        type: 'crafting_complete',
        processId: handle.id,
        processType: handle.type,
        description: `Finished crafting ${craftData.itemId}`,
        importance: 'medium',
        data: {
          itemId: craftData.itemId,
          duration: gameState.time.totalMinutes - craftingItem.startedAt
        }
      })
    }
    
    return {
      handle,
      stateChanges: {},
      events,
      completed
    }
  }
  
  complete(handle: ProcessHandle, gameState: GameState): ProcessCompletionResult {
    const craftData = handle.data as CraftingProcessData
    
    // Remove from crafting queue
    const itemIndex = gameState.processes.crafting.findIndex(c => 
      c.itemId === craftData.itemId && c.startedAt === handle.startTime)
    if (itemIndex >= 0) {
      gameState.processes.crafting.splice(itemIndex, 1)
    }
    
    // Crafted item should already be added to inventory by ForgeSystem
    return {
      handle,
      stateChanges: {},
      events: [],
      success: true,
      rewards: {
        itemId: craftData.itemId
      }
    }
  }
  
  cancel(handle: ProcessHandle, gameState: GameState): void {
    const craftData = handle.data as CraftingProcessData
    
    // Remove from crafting queue
    const itemIndex = gameState.processes.crafting.findIndex(c => 
      c.itemId === craftData.itemId && c.startedAt === handle.startTime)
    if (itemIndex >= 0) {
      gameState.processes.crafting.splice(itemIndex, 1)
      console.log(`Cancelled crafting of ${craftData.itemId}`)
    }
  }
  
  getMetadata(): ProcessMetadata {
    return {
      type: 'crafting',
      name: 'Crafting',
      description: 'Crafting items in the forge',
      maxConcurrent: 10, // Can have multiple items in queue
      canPause: false,
      canCancel: true,
      estimatedDuration: 10 // Variable based on item
    }
  }
}
