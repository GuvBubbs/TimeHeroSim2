// SeedCatchingHandler - Phase 9G Implementation
// Fixed seed catching completion bug

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
  SeedCatchingProcessData
} from '../types/ProcessTypes'

export class SeedCatchingHandler implements IProcessHandler {
  
  canStart(data: ProcessData, gameState: GameState): ValidationResult {
    const seedData = data as SeedCatchingProcessData
    
    // Check if already seed catching
    if (gameState.processes.seedCatching) {
      return {
        valid: false,
        errorMessage: 'Already performing seed catching'
      }
    }
    
    // Check if at tower
    if (gameState.location.currentScreen !== 'tower') {
      return {
        valid: false,
        errorMessage: 'Must be at tower to catch seeds'
      }
    }
    
    // Check if has net (simplified - would need proper inventory check)
    if (!seedData.netType) {
      return {
        valid: false,
        errorMessage: 'Must have a net to catch seeds'
      }
    }
    
    return { valid: true }
  }
  
  initialize(handle: ProcessHandle, data: ProcessData, gameState: GameState): InitResult {
    const seedData = data as SeedCatchingProcessData
    
    // Create seed catching state in game state
    gameState.processes.seedCatching = {
      startedAt: handle.startTime,
      duration: seedData.duration,
      progress: 0,
      windLevel: seedData.windLevel,
      netType: seedData.netType,
      expectedSeeds: seedData.expectedSeeds,
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
    const seedCatch = gameState.processes.seedCatching
    if (!seedCatch) {
      return {
        handle,
        stateChanges: {},
        events: [],
        completed: false,
        failed: true,
        errorMessage: 'Seed catching state not found'
      }
    }
    
    // FIX: Calculate elapsed time from start time, not from last update
    const elapsedTime = gameState.time.totalMinutes - seedCatch.startedAt
    
    // Update progress based on elapsed time
    seedCatch.progress = Math.min(1.0, elapsedTime / seedCatch.duration)
    handle.progress = seedCatch.progress
    
    // Debug logging
    console.log(`🔍 SEED CATCH UPDATE: elapsedTime=${elapsedTime.toFixed(1)}, duration=${seedCatch.duration}, progress=${seedCatch.progress.toFixed(3)}`)
    
    const events: ProcessEvent[] = []
    
    // Check if completed
    const completed = seedCatch.progress >= 1.0
    if (completed) {
      console.log(`🎯 SEED CATCH COMPLETION: Progress reached 100%`)
      seedCatch.isComplete = true
    }
    
    return {
      handle,
      stateChanges: {},
      events,
      completed
    }
  }
  
  complete(handle: ProcessHandle, gameState: GameState): ProcessCompletionResult {
    const seedCatch = gameState.processes.seedCatching
    if (!seedCatch) {
      return {
        handle,
        stateChanges: {},
        events: [],
        success: false
      }
    }
    
    // Calculate seeds awarded
    const seedsAwarded = seedCatch.expectedSeeds
    
    // Add seeds to inventory (mix based on tower reach)
    const carrotSeeds = Math.floor(seedsAwarded * 0.6)
    const radishSeeds = Math.floor(seedsAwarded * 0.4)
    
    const stateChanges = {
      resources: {
        seeds: new Map([
          ['carrot', carrotSeeds],
          ['radish', radishSeeds]
        ])
      }
    }
    
    const events = [{
      timestamp: gameState.time.totalMinutes,
      type: 'seed_catching_complete',
      processId: handle.id,
      processType: handle.type,
      description: `Seed catching complete! Caught ${seedsAwarded} seeds using ${seedCatch.netType} net`,
      importance: 'high' as const,
      data: {
        totalSeeds: seedsAwarded,
        carrotSeeds,
        radishSeeds,
        netType: seedCatch.netType
      }
    }]
    
    // Clear the seed catching state
    gameState.processes.seedCatching = null
    
    console.log(`🌰 SEED CATCHING COMPLETE: +${seedsAwarded} seeds (${carrotSeeds} carrot, ${radishSeeds} radish)`)
    
    return {
      handle,
      stateChanges,
      events,
      success: true,
      rewards: {
        seeds: seedsAwarded,
        breakdown: { carrot: carrotSeeds, radish: radishSeeds }
      }
    }
  }
  
  cancel(handle: ProcessHandle, gameState: GameState): void {
    // Clear the seed catching state
    gameState.processes.seedCatching = null
    console.log(`Cancelled seed catching: ${handle.id}`)
  }
  
  getMetadata(): ProcessMetadata {
    return {
      type: 'seed_catching',
      name: 'Seed Catching',
      description: 'Catch falling seeds from the tower',
      maxConcurrent: 1,
      canPause: false,
      canCancel: true,
      estimatedDuration: 5 // Variable based on net and wind
    }
  }
}
