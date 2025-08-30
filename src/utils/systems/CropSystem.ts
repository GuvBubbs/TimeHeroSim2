// CropSystem - Phase 8C Implementation
// Realistic crop growth and water management system

import type { GameState, CropState } from '@/types'

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
      
      // Calculate growth rate based on water availability
      const growthRate = crop.waterLevel > 0.3 ? 1.0 : 0.5
      
      // Update growth progress
      const growthIncrement = (deltaMinutes / growthTime) * growthRate
      crop.growthProgress = Math.min(1.0, crop.growthProgress + growthIncrement)
      
      // Update visual growth stage
      crop.growthStage = Math.min(crop.maxStages, Math.floor(crop.growthProgress * crop.maxStages))
      
      // Check if crop is ready for harvest
      if (crop.growthProgress >= 1.0) {
        crop.readyToHarvest = true
      }
      
      // Water consumption (0.01 per minute base rate)
      const waterConsumption = 0.01 * deltaMinutes
      crop.waterLevel = Math.max(0, crop.waterLevel - waterConsumption)
      
      // Track drought time for potential future mechanics
      if (crop.waterLevel <= 0) {
        crop.droughtTime += deltaMinutes
      } else {
        // Reset drought timer when watered
        crop.droughtTime = 0
      }
    }
  }
  
  /**
   * Distribute water to crops that need it most
   * @param gameState Current game state
   * @param waterAmount Total amount of water to distribute
   * @returns Amount of water actually used
   */
  static distributeWater(gameState: GameState, waterAmount: number): number {
    // Find crops that need water (not at full water)
    const cropsNeedingWater = gameState.processes.crops.filter(crop => 
      crop.waterLevel < 1.0
    )
    
    if (cropsNeedingWater.length === 0) {
      return 0 // No crops need water
    }
    
    // Sort by water level (driest first)
    cropsNeedingWater.sort((a, b) => a.waterLevel - b.waterLevel)
    
    let waterUsed = 0
    let remainingWater = waterAmount
    
    // Distribute water evenly, prioritizing driest crops
    for (const crop of cropsNeedingWater) {
      if (remainingWater <= 0) break
      
      // Calculate how much water this crop needs to reach full (1.0)
      const waterNeeded = 1.0 - crop.waterLevel
      
      // Give this crop water (limited by what's available)
      const waterToGive = Math.min(waterNeeded, remainingWater / cropsNeedingWater.length)
      
      crop.waterLevel = Math.min(1.0, crop.waterLevel + waterToGive)
      waterUsed += waterToGive
      remainingWater -= waterToGive
    }
    
    return waterUsed
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
}
