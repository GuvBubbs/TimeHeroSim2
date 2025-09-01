// CropSystem - Phase 8N Implementation
// Realistic crop growth and water management system with retention upgrades

import type { GameState, CropState } from '@/types'
import { WaterSystem } from './WaterSystem'

/**
 * Crop growth and water management system
 */
export class CropSystem {
  /**
   * Process crop growth for all active crops
   * @param gameState Current game state
   * @param deltaMinutes Time elapsed since last update
   * @param gameDataStore Data store for crop information
   */
  static processCropGrowth(gameState: GameState, deltaMinutes: number, gameDataStore: any) {
    for (const crop of gameState.processes.crops) {
      if (!crop.cropId || crop.readyToHarvest) continue
      
      // Get crop data from CSV
      const cropData = gameDataStore.getItemById(crop.cropId)
      if (!cropData) continue
      
      // Parse growth time and stages from CSV data
      const growthTime = parseInt(cropData.time) || 10
      const stages = this.parseGrowthStages(cropData.notes) || 3
      
      // Ensure crop has required fields (migration from old format)
      if (crop.maxStages === undefined) {
        crop.maxStages = stages
        crop.growthProgress = crop.growthProgress || 0
        crop.growthStage = crop.growthStage || 0
        crop.droughtTime = crop.droughtTime || 0
        
        // Convert old waterLevel (0-100) to new format (0-1) if needed
        if (crop.waterLevel > 1) {
          crop.waterLevel = crop.waterLevel / 100
        }
      }
      
      // Process water drainage using new WaterSystem with retention upgrades
      WaterSystem.processWaterDrainage(crop, deltaMinutes, gameState)
      
      // Calculate growth rate based on water availability (Phase 8N: 75% slower when dry)
      const growthRate = crop.waterLevel > 0.3 ? 1.0 : 0.25  // Changed from 0.5 to 0.25 (75% slower)
      
      // Update growth progress
      const growthIncrement = (deltaMinutes / growthTime) * growthRate
      crop.growthProgress = Math.min(1.0, crop.growthProgress + growthIncrement)
      
      // Update visual growth stage
      crop.growthStage = Math.min(crop.maxStages, Math.floor(crop.growthProgress * crop.maxStages))
      
      // Check if crop is ready for harvest
      if (crop.growthProgress >= 1.0) {
        crop.readyToHarvest = true
      }
    }
  }
  
  /**
   * Distribute water to crops that need it most (Phase 8N: Enhanced with WaterSystem)
   * @param gameState Current game state
   * @param waterAmount Total amount of water to distribute
   * @returns Amount of water actually used
   */
  static distributeWater(gameState: GameState, waterAmount: number): number {
    // Use enhanced WaterSystem distribution logic
    const result = WaterSystem.distributeWaterToCrops(gameState, waterAmount)
    return result.waterUsed
  }
  
  /**
   * Parse growth stages from crop notes field
   * @param notes Notes field from CSV (e.g., "Growth Stages 3 + Gain Energy On Harvest")
   * @returns Number of growth stages
   */
  private static parseGrowthStages(notes: string): number {
    if (!notes) return 3 // Default to 3 stages
    
    const match = notes.match(/Growth Stages (\d+)/i)
    return match ? parseInt(match[1]) : 3
  }
  
  /**
   * Get crops that are critically dry (need immediate watering)
   * @param gameState Current game state
   * @returns Array of crops with waterLevel < 0.2
   */
  static getCriticallyDryCrops(gameState: GameState): CropState[] {
    return gameState.processes.crops.filter(crop => 
      crop.waterLevel < 0.2
    )
  }
  
  /**
   * Get crops that are ready for harvest
   * @param gameState Current game state
   * @returns Array of crops ready to harvest
   */
  static getReadyToHarvestCrops(gameState: GameState): CropState[] {
    return gameState.processes.crops.filter(crop => 
      crop.readyToHarvest
    )
  }
  
  /**
   * Calculate total water needed to fully water all crops
   * @param gameState Current game state
   * @returns Total water needed
   */
  static calculateTotalWaterNeeded(gameState: GameState): number {
    return gameState.processes.crops
      .reduce((total, crop) => total + (1.0 - crop.waterLevel), 0)
  }
  
  /**
   * Get comprehensive water and crop metrics (Phase 8N integration)
   * @param gameState Current game state
   * @returns Detailed metrics for decision making
   */
  static getCropWaterMetrics(gameState: GameState): {
    totalCrops: number
    dryPlots: number
    criticalPlots: number
    readyToHarvest: number
    averageWaterLevel: number
    retentionMultiplier: number
    growthEfficiency: number
  } {
    const crops = gameState.processes.crops
    const totalCrops = crops.length
    const dryPlots = crops.filter(crop => crop.waterLevel < 0.5).length
    const criticalPlots = crops.filter(crop => crop.waterLevel < 0.2).length
    const readyToHarvest = crops.filter(crop => crop.readyToHarvest).length
    
    const averageWaterLevel = totalCrops > 0 ? 
      crops.reduce((sum, crop) => sum + crop.waterLevel, 0) / totalCrops : 0
    
    const retentionMultiplier = WaterSystem.getRetentionMultiplier(gameState)
    
    // Calculate overall growth efficiency (how many crops are growing at full rate)
    const fullGrowthCrops = crops.filter(crop => crop.waterLevel > 0.3).length
    const growthEfficiency = totalCrops > 0 ? fullGrowthCrops / totalCrops : 1.0
    
    return {
      totalCrops,
      dryPlots,
      criticalPlots,
      readyToHarvest,
      averageWaterLevel: Math.round(averageWaterLevel * 100) / 100,
      retentionMultiplier,
      growthEfficiency: Math.round(growthEfficiency * 100) / 100
    }
  }
}
