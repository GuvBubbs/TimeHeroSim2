// MiningHandler - Phase 9G Implementation
// Handles mining processes using existing MiningSystem

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
  MiningProcessData
} from '../types/ProcessTypes'
import { MineSystem } from '../../systems/core/MineSystem'

export class MiningHandler implements IProcessHandler {
  
  canStart(data: ProcessData, gameState: GameState): ValidationResult {
    // Check if already mining
    if (gameState.processes.mining && gameState.processes.mining.isActive) {
      return {
        valid: false,
        errorMessage: 'Already mining'
      }
    }
    
    // Check if at mine/town
    if (gameState.location.currentScreen !== 'town' && gameState.location.currentScreen !== 'mine') {
      return {
        valid: false,
        errorMessage: 'Must be at mine or town to start mining'
      }
    }
    
    // Check energy requirement
    if (gameState.resources.energy.current < 10) {
      return {
        valid: false,
        errorMessage: 'Need at least 10 energy to start mining'
      }
    }
    
    return { valid: true }
  }
  
  initialize(handle: ProcessHandle, data: ProcessData, gameState: GameState): InitResult {
    // Use MiningSystem to start mining
    const success = MineSystem.startMining(gameState)
    
    if (!success) {
      return {
        success: false,
        errorMessage: 'Failed to start mining'
      }
    }
    
    return { success: true, handle }
  }
  
  update(
    handle: ProcessHandle,
    deltaTime: number,
    gameState: GameState,
    gameDataStore: any
  ): ProcessUpdateResult {
    const miningState = gameState.processes.mining
    if (!miningState || !miningState.isActive) {
      return {
        handle,
        stateChanges: {},
        events: [],
        completed: false,
        failed: true,
        errorMessage: 'Mining state not found or inactive'
      }
    }
    
    // Use existing MiningSystem to process
    const previousDepth = miningState.depth
    MineSystem.processMining(gameState, deltaTime)
    
    // Update handle progress (based on depth or energy remaining)
    const maxEnergy = gameState.resources.energy.max
    const currentEnergy = gameState.resources.energy.current
    handle.progress = Math.max(0, 1 - (currentEnergy / maxEnergy)) // Progress based on energy depletion
    
    const events: ProcessEvent[] = []
    
    // Add material discovery events if depth increased significantly
    const depthIncrease = miningState.depth - previousDepth
    if (depthIncrease >= 500) { // Reached new tier
      events.push({
        timestamp: gameState.time.totalMinutes,
        type: 'mining_tier_reached',
        processId: handle.id,
        processType: handle.type,
        description: `Reached depth ${miningState.depth}m - new materials available!`,
        importance: 'medium',
        data: {
          depth: miningState.depth,
          tier: MineSystem.getDepthTier(miningState.depth),
          tierName: MineSystem.getDepthTierName(miningState.depth)
        }
      })
    }
    
    // Check if mining stopped (out of energy)
    const completed = !miningState.isActive
    if (completed) {
      events.push({
        timestamp: gameState.time.totalMinutes,
        type: 'mining_complete',
        processId: handle.id,
        processType: handle.type,
        description: `Mining session complete. Reached depth ${miningState.depth}m`,
        importance: 'medium',
        data: {
          finalDepth: miningState.depth,
          reason: currentEnergy <= 0 ? 'out_of_energy' : 'manual_stop'
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
    // Mining completion is handled by MiningSystem.stopMining
    const miningState = gameState.processes.mining
    if (miningState) {
      MineSystem.stopMining(gameState)
    }
    
    return {
      handle,
      stateChanges: {},
      events: [],
      success: true,
      rewards: {
        finalDepth: miningState?.depth || 0
      }
    }
  }
  
  cancel(handle: ProcessHandle, gameState: GameState): void {
    // Stop mining using MiningSystem
    MineSystem.stopMining(gameState)
    console.log(`Cancelled mining: ${handle.id}`)
  }
  
  getMetadata(): ProcessMetadata {
    return {
      type: 'mining',
      name: 'Mining',
      description: 'Mining for materials in the depths',
      maxConcurrent: 1,
      canPause: false,
      canCancel: true,
      estimatedDuration: 20 // Variable based on energy and pickaxe
    }
  }
}
