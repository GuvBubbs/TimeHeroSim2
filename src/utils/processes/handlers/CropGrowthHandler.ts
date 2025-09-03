// CropGrowthHandler - Phase 9G Implementation
// Handles crop growth processes using existing CropSystem

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
  CropProcessData
} from '../types/ProcessTypes'
import { FarmSystem } from '../../systems/core/FarmSystem'

export class CropGrowthHandler implements IProcessHandler {
  
  canStart(data: ProcessData, gameState: GameState): ValidationResult {
    const cropData = data as CropProcessData
    
    // Check if plot is available
    const existingCrop = gameState.processes.crops.find(crop => crop.plotId === cropData.plotId)
    if (existingCrop) {
      return {
        valid: false,
        errorMessage: `Plot ${cropData.plotId} already has a crop`
      }
    }
    
    // Check if at farm
    if (gameState.location.currentScreen !== 'farm') {
      return {
        valid: false,
        errorMessage: 'Must be at farm to plant crops'
      }
    }
    
    return { valid: true }
  }
  
  initialize(handle: ProcessHandle, data: ProcessData, gameState: GameState): InitResult {
    const cropData = data as CropProcessData
    
    // Add crop to game state crops array
    gameState.processes.crops.push({
      plotId: cropData.plotId,
      cropId: cropData.cropId,
      plantedAt: cropData.plantedAt,
      growthTimeRequired: cropData.growthTimeRequired,
      waterLevel: 1.0, // Start fully watered
      isWithered: false,
      readyToHarvest: false,
      growthProgress: 0,
      growthStage: 0,
      maxStages: 3, // Default
      droughtTime: 0
    })
    
    return { success: true, handle }
  }
  
  update(
    handle: ProcessHandle,
    deltaTime: number,
    gameState: GameState,
    gameDataStore: any
  ): ProcessUpdateResult {
    const cropData = handle.data as CropProcessData
    
    // Find the crop in the game state
    const crop = gameState.processes.crops.find(c => c.plotId === cropData.plotId)
    if (!crop) {
      return {
        handle,
        stateChanges: {},
        events: [],
        completed: false,
        failed: true,
        errorMessage: `Crop not found for plot ${cropData.plotId}`
      }
    }
    
    // Use existing CropSystem to process growth
    const previousReadyState = crop.readyToHarvest
    FarmSystem.processCropGrowth(gameState, deltaTime, gameDataStore)
    
    // Update handle progress based on crop growth
    handle.progress = crop.growthProgress
    
    const events: ProcessEvent[] = []
    
    // Check if crop became ready
    if (!previousReadyState && crop.readyToHarvest) {
      events.push({
        timestamp: gameState.time.totalMinutes,
        type: 'crop_ready',
        processId: handle.id,
        processType: handle.type,
        description: `${crop.cropId} is ready to harvest on plot ${crop.plotId}`,
        importance: 'medium',
        data: {
          cropId: crop.cropId,
          plotId: crop.plotId,
          growthTime: gameState.time.totalMinutes - crop.plantedAt
        }
      })
    }
    
    // Check if crop withered
    if (crop.isWithered) {
      events.push({
        timestamp: gameState.time.totalMinutes,
        type: 'crop_withered',
        processId: handle.id,
        processType: handle.type,
        description: `${crop.cropId} withered on plot ${crop.plotId}`,
        importance: 'high',
        data: {
          cropId: crop.cropId,
          plotId: crop.plotId
        }
      })
    }
    
    // Crop growth processes don't complete automatically - they wait for harvest
    return {
      handle,
      stateChanges: {},
      events,
      completed: false
    }
  }
  
  complete(handle: ProcessHandle, gameState: GameState): ProcessCompletionResult {
    // This shouldn't be called for crop growth - crops are completed via harvest action
    return {
      handle,
      stateChanges: {},
      events: [],
      success: true
    }
  }
  
  cancel(handle: ProcessHandle, gameState: GameState): void {
    const cropData = handle.data as CropProcessData
    
    // Remove crop from game state
    const cropIndex = gameState.processes.crops.findIndex(c => c.plotId === cropData.plotId)
    if (cropIndex >= 0) {
      gameState.processes.crops.splice(cropIndex, 1)
      console.log(`Cancelled crop growth for plot ${cropData.plotId}`)
    }
  }
  
  getMetadata(): ProcessMetadata {
    return {
      type: 'crop_growth',
      name: 'Crop Growth',
      description: 'Growing crops on farm plots',
      maxConcurrent: 50, // Can have many crops growing
      canPause: false,
      canCancel: true,
      estimatedDuration: 10 // Variable based on crop type
    }
  }
}
