// AdventureHandler - Phase 9G Implementation
// Handles adventure processes

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
  AdventureProcessData
} from '../types/ProcessTypes'

export class AdventureHandler implements IProcessHandler {
  
  canStart(data: ProcessData, gameState: GameState): ValidationResult {
    const adventureData = data as AdventureProcessData
    
    // Check if already on adventure
    if (gameState.processes.adventure) {
      return {
        valid: false,
        errorMessage: 'Already on an adventure'
      }
    }
    
    // Check if at adventure screen
    if (gameState.location.currentScreen !== 'adventure') {
      return {
        valid: false,
        errorMessage: 'Must be at adventure screen to start adventure'
      }
    }
    
    // Check energy (simplified - would need proper calculation)
    if (gameState.resources.energy.current < 20) {
      return {
        valid: false,
        errorMessage: 'Need at least 20 energy for adventure'
      }
    }
    
    return { valid: true }
  }
  
  initialize(handle: ProcessHandle, data: ProcessData, gameState: GameState): InitResult {
    const adventureData = data as AdventureProcessData
    
    // Create adventure state
    gameState.processes.adventure = {
      adventureId: adventureData.adventureId,
      startedAt: handle.startTime,
      duration: adventureData.expectedDuration,
      progress: 0,
      rewards: {
        experience: 0,
        gold: 0,
        items: []
      },
      isComplete: false
    }
    
    return { success: true, handle }
  }
  
  update(
    handle: ProcessHandle,
    deltaTime: number,
    gameState: GameState,
    gameDataStore: any
  ): ProcessUpdateResult {
    const adventure = gameState.processes.adventure
    if (!adventure) {
      return {
        handle,
        stateChanges: {},
        events: [],
        completed: false,
        failed: true,
        errorMessage: 'Adventure state not found'
      }
    }
    
    // Calculate progress based on elapsed time
    const elapsedTime = gameState.time.totalMinutes - adventure.startedAt
    adventure.progress = Math.min(1.0, elapsedTime / adventure.duration)
    handle.progress = adventure.progress
    
    const events: ProcessEvent[] = []
    
    // Check if completed
    const completed = adventure.progress >= 1.0
    if (completed) {
      adventure.isComplete = true
      events.push({
        timestamp: gameState.time.totalMinutes,
        type: 'adventure_complete',
        processId: handle.id,
        processType: handle.type,
        description: `Adventure ${adventure.adventureId} completed!`,
        importance: 'high',
        data: {
          adventureId: adventure.adventureId,
          duration: elapsedTime
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
    const adventure = gameState.processes.adventure
    if (!adventure) {
      return {
        handle,
        stateChanges: {},
        events: [],
        success: false
      }
    }
    
    // Award rewards (simplified)
    const stateChanges = {
      resources: {
        gold: adventure.rewards.gold,
      },
      progression: {
        experience: adventure.rewards.experience,
        completedAdventures: [adventure.adventureId]
      }
    }
    
    // Clear adventure state
    gameState.processes.adventure = null
    
    return {
      handle,
      stateChanges,
      events: [],
      success: true,
      rewards: adventure.rewards
    }
  }
  
  cancel(handle: ProcessHandle, gameState: GameState): void {
    // Clear adventure state
    gameState.processes.adventure = null
    console.log(`Cancelled adventure: ${handle.id}`)
  }
  
  getMetadata(): ProcessMetadata {
    return {
      type: 'adventure',
      name: 'Adventure',
      description: 'Exploring adventure routes for rewards',
      maxConcurrent: 1,
      canPause: false,
      canCancel: true,
      estimatedDuration: 15 // Variable based on route
    }
  }
}
