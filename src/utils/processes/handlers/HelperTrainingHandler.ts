// HelperTrainingHandler - Phase 9G Implementation
// Handles helper training processes

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
  HelperTrainingProcessData
} from '../types/ProcessTypes'

export class HelperTrainingHandler implements IProcessHandler {
  
  canStart(data: ProcessData, gameState: GameState): ValidationResult {
    const trainingData = data as HelperTrainingProcessData
    
    // Check if at town (training location)
    if (gameState.location.currentScreen !== 'town') {
      return {
        valid: false,
        errorMessage: 'Must be at town to train helpers'
      }
    }
    
    // Check if helper exists and is available
    const helper = gameState.helpers.gnomes.find(g => g.id === trainingData.helperId)
    if (!helper) {
      return {
        valid: false,
        errorMessage: `Helper ${trainingData.helperId} not found`
      }
    }
    
    if (helper.currentTask) {
      return {
        valid: false,
        errorMessage: `Helper ${helper.name} is already busy`
      }
    }
    
    return { valid: true }
  }
  
  initialize(handle: ProcessHandle, data: ProcessData, gameState: GameState): InitResult {
    const trainingData = data as HelperTrainingProcessData
    
    // Mark helper as training
    const helper = gameState.helpers.gnomes.find(g => g.id === trainingData.helperId)
    if (helper) {
      helper.currentTask = `training_${trainingData.skill}`
    }
    
    return { success: true, handle }
  }
  
  update(
    handle: ProcessHandle,
    deltaTime: number,
    gameState: GameState,
    gameDataStore: any
  ): ProcessUpdateResult {
    const trainingData = handle.data as HelperTrainingProcessData
    
    // Calculate progress based on elapsed time
    const elapsedTime = gameState.time.totalMinutes - handle.startTime
    handle.progress = Math.min(1.0, elapsedTime / trainingData.duration)
    
    const events: ProcessEvent[] = []
    
    // Check if completed
    const completed = handle.progress >= 1.0
    if (completed) {
      events.push({
        timestamp: gameState.time.totalMinutes,
        type: 'helper_training_complete',
        processId: handle.id,
        processType: handle.type,
        description: `Helper training in ${trainingData.skill} completed!`,
        importance: 'medium',
        data: {
          helperId: trainingData.helperId,
          skill: trainingData.skill,
          xpGain: trainingData.xpGain
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
    const trainingData = handle.data as HelperTrainingProcessData
    
    // Find helper and apply training
    const helper = gameState.helpers.gnomes.find(g => g.id === trainingData.helperId)
    if (helper) {
      helper.experience += trainingData.xpGain
      helper.currentTask = null
      
      // Could also update helper efficiency based on training
      helper.efficiency = Math.min(1.0, helper.efficiency + 0.1)
    }
    
    const stateChanges = {
      // Helper changes are applied directly above
    }
    
    return {
      handle,
      stateChanges,
      events: [],
      success: true,
      rewards: {
        helperId: trainingData.helperId,
        xpGain: trainingData.xpGain
      }
    }
  }
  
  cancel(handle: ProcessHandle, gameState: GameState): void {
    const trainingData = handle.data as HelperTrainingProcessData
    
    // Clear helper task
    const helper = gameState.helpers.gnomes.find(g => g.id === trainingData.helperId)
    if (helper) {
      helper.currentTask = null
    }
    
    console.log(`Cancelled helper training: ${handle.id}`)
  }
  
  getMetadata(): ProcessMetadata {
    return {
      type: 'helper_training',
      name: 'Helper Training',
      description: 'Training helpers to improve their skills',
      maxConcurrent: 5, // Can train multiple helpers
      canPause: false,
      canCancel: true,
      estimatedDuration: 30 // Variable based on skill
    }
  }
}
