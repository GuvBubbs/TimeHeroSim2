// WaterSystem - Phase 8N Implementation
// Complete water management including retention systems and auto-pumps

import type { GameState, CropState } from '@/types'

/**
 * Water retention upgrade configuration
 */
export const WATER_RETENTION = {
  base: {
    waterPerPlot: 1,
    durationMinutes: 30,  // Base water lasts 30 minutes
    drainRate: 1/30       // 1 water per 30 minutes
  },
  
  upgrades: {
    mulch_beds: {
      cost: 300,
      prereq: 'water_tank_ii',
      effect: {
        durationMultiplier: 1.25,  // 25% longer = 37.5 minutes
        description: 'Plots retain water 25% longer'
      }
    },
    
    irrigation_channels: {
      cost: 1500,
      prereq: ['mulch_beds', 'homestead'],
      effect: {
        durationMultiplier: 1.50,  // 50% longer = 45 minutes
        description: 'Plots retain water 50% longer'
      }
    },
    
    crystal_irrigation: {
      cost: 8000,
      prereq: ['irrigation_channels', 'manor_grounds'],
      effect: {
        durationMultiplier: 1.75,  // 75% longer = 52.5 minutes
        description: 'Plots retain water 75% longer'
      }
    }
  }
}

/**
 * Auto-pump system configuration
 */
export const AUTO_PUMP_SYSTEMS = {
  auto_pump_i: {
    cost: 200,
    prereq: 'water_tank_ii',
    materials: { copper: 5 },
    effect: {
      offlineRate: 0.10,  // 10% of cap per hour
      description: 'Generates water while offline'
    }
  },
  
  auto_pump_ii: {
    cost: 1000,
    prereq: ['auto_pump_i', 'water_tank_iii'],
    materials: { iron: 10 },
    effect: {
      offlineRate: 0.20,  // 20% of cap per hour
      description: 'Improved offline water generation'
    }
  },
  
  auto_pump_iii: {
    cost: 5000,
    prereq: ['auto_pump_ii', 'reservoir'],
    materials: { silver: 5 },
    effect: {
      offlineRate: 0.35,  // 35% of cap per hour
      description: 'Advanced offline water generation'
    }
  },
  
  crystal_pump: {
    cost: 25000,
    prereq: ['auto_pump_iii', 'crystal_reservoir'],
    materials: { crystal: 3 },
    effect: {
      offlineRate: 0.50,  // 50% of cap per hour
      description: 'Maximum offline water generation'
    }
  }
}

/**
 * Watering tool efficiency configuration
 */
export const WATERING_TOOLS = {
  hands: {
    plotsPerAction: 1,
    timePerAction: 2,  // seconds
    available: 'always'
  },
  
  watering_can_ii: {
    plotsPerAction: 2,
    timePerAction: 3,  // seconds
    craftCost: { copper: 5, wood: 3 }
  },
  
  sprinkler_can: {
    plotsPerAction: 4,
    timePerAction: 4,  // seconds
    craftCost: { silver: 3, pine_resin: 1 }
  },
  
  rain_bringer: {
    plotsPerAction: 8,
    timePerAction: 5,  // seconds
    craftCost: { crystal: 1, frozen_heart: 1 },
    specialEffect: 'plots_stay_wet_50_longer'
  }
}

/**
 * Water management system for Phase 8N
 */
export class WaterSystem {
  /**
   * Calculate water retention duration based on upgrades
   */
  static calculateWaterDuration(baseMinutes: number, gameState: GameState): number {
    const retentionMultiplier = this.getRetentionMultiplier(gameState)
    return baseMinutes * retentionMultiplier
  }

  /**
   * Get water retention multiplier based on unlocked upgrades
   */
  static getRetentionMultiplier(gameState: GameState): number {
    const upgrades = gameState.progression.unlockedUpgrades
    
    // Check upgrades in order (higher tier overrides lower)
    if (upgrades.includes('crystal_irrigation')) {
      return WATER_RETENTION.upgrades.crystal_irrigation.effect.durationMultiplier
    }
    if (upgrades.includes('irrigation_channels')) {
      return WATER_RETENTION.upgrades.irrigation_channels.effect.durationMultiplier
    }
    if (upgrades.includes('mulch_beds')) {
      return WATER_RETENTION.upgrades.mulch_beds.effect.durationMultiplier
    }
    
    return 1.0 // Base retention (no upgrades)
  }

  /**
   * Process water drainage for crops with retention upgrades
   */
  static processWaterDrainage(crop: CropState, deltaTime: number, gameState: GameState): void {
    if (!crop.cropId) return
    
    const retentionMultiplier = this.getRetentionMultiplier(gameState)
    const baseDrainRate = WATER_RETENTION.base.drainRate
    
    // Apply retention multiplier to reduce drain rate
    const actualDrainRate = baseDrainRate / retentionMultiplier
    
    // Process drainage
    const waterLoss = actualDrainRate * deltaTime / 60 // Convert to per-minute rate
    crop.waterLevel = Math.max(0, Math.round((crop.waterLevel - waterLoss) * 10000) / 10000) // Fix floating point precision
    
    // Update drought time tracking
    if (crop.waterLevel <= 0) {
      crop.droughtTime = (crop.droughtTime || 0) + deltaTime
    } else {
      crop.droughtTime = 0
    }
  }

  /**
   * Calculate offline water generation from auto-pumps
   */
  static calculateOfflineWater(timeDeltaMinutes: number, waterCapacity: number, gameState: GameState): {
    generated: number
    message: string
    pumpLevel: string | null
  } {
    const hoursOffline = timeDeltaMinutes / 60
    const pumpLevel = this.getHighestPumpLevel(gameState)
    
    if (!pumpLevel) {
      return { generated: 0, message: '', pumpLevel: null }
    }
    
    const pumpRate = AUTO_PUMP_SYSTEMS[pumpLevel].effect.offlineRate
    const waterGenerated = waterCapacity * pumpRate * hoursOffline
    const actualGenerated = Math.min(waterGenerated, waterCapacity)
    
    return {
      generated: Math.floor(actualGenerated),
      message: `${pumpLevel} generated ${Math.floor(actualGenerated)} water while away`,
      pumpLevel
    }
  }

  /**
   * Get the highest level auto-pump that the player owns
   */
  static getHighestPumpLevel(gameState: GameState): keyof typeof AUTO_PUMP_SYSTEMS | null {
    const upgrades = gameState.progression.unlockedUpgrades
    
    // Check in descending order of quality
    const pumpOrder: (keyof typeof AUTO_PUMP_SYSTEMS)[] = [
      'crystal_pump',
      'auto_pump_iii', 
      'auto_pump_ii',
      'auto_pump_i'
    ]
    
    for (const pump of pumpOrder) {
      if (upgrades.includes(pump)) {
        return pump
      }
    }
    
    return null
  }

  /**
   * Calculate watering efficiency based on equipped tools and helpers
   */
  static calculateWateringEfficiency(gameState: GameState): {
    totalPlotsPerMinute: number
    waterConsumed: number
    toolEfficiency: number
  } {
    const tools = gameState.inventory.tools
    let toolData = WATERING_TOOLS.hands // Default to hands
    
    // Check for equipped watering tools (best tool wins)
    const toolOrder = ['rain_bringer', 'sprinkler_can', 'watering_can_ii'] as const
    for (const toolName of toolOrder) {
      if (tools.has(toolName) && tools.get(toolName)?.isEquipped) {
        toolData = WATERING_TOOLS[toolName]
        break
      }
    }
    
    // Calculate base efficiency from tool
    const plotsPerMinute = (60 / toolData.timePerAction) * toolData.plotsPerAction
    
    // Add helper contribution (waterer helpers)
    const watererHelpers = gameState.helpers.gnomes.filter(
      g => g.isAssigned && g.role === 'waterer'
    )
    
    let helperPlots = 0
    for (const helper of watererHelpers) {
      const helperLevel = helper.level || 0
      helperPlots += 5 + helperLevel // 5-15 plots/min based on level
    }
    
    const totalPlotsPerMinute = plotsPerMinute + helperPlots
    const waterConsumed = totalPlotsPerMinute // 1 water per plot
    
    return {
      totalPlotsPerMinute,
      waterConsumed,
      toolEfficiency: plotsPerMinute / WATERING_TOOLS.hands.plotsPerAction // Efficiency relative to hands
    }
  }

  /**
   * Process automatic water generation from pumps (per-tick)
   */
  static processAutoPumpGeneration(gameState: GameState, deltaTime: number): {
    waterGenerated: number
    pumpLevel: string | null
  } {
    const pumpLevel = this.getHighestPumpLevel(gameState)
    
    if (!pumpLevel) {
      return { waterGenerated: 0, pumpLevel: null }
    }
    
    // Convert offline rate to per-minute rate
    const pumpRate = AUTO_PUMP_SYSTEMS[pumpLevel].effect.offlineRate
    const waterPerMinute = (gameState.resources.water.max * pumpRate) / 60
    const waterGenerated = waterPerMinute * deltaTime
    
    // Apply water to current resources (capped at max)
    const currentWater = gameState.resources.water.current
    const maxWater = gameState.resources.water.max
    const actualGenerated = Math.min(waterGenerated, maxWater - currentWater)
    
    if (actualGenerated > 0) {
      gameState.resources.water.current += actualGenerated
    }
    
    return {
      waterGenerated: Math.floor(actualGenerated * 10) / 10, // Round to 1 decimal
      pumpLevel
    }
  }

  /**
   * Get critical water management metrics for decision making
   */
  static getWaterMetrics(gameState: GameState): {
    waterPercent: number
    dryPlots: number
    criticalPlots: number
    retentionMultiplier: number
    pumpLevel: string | null
    efficiency: number
  } {
    const water = gameState.resources.water
    const waterPercent = water.current / water.max
    
    const crops = gameState.processes.crops
    const dryPlots = crops.filter(crop => crop.waterLevel < 0.5).length
    const criticalPlots = crops.filter(crop => crop.waterLevel < 0.2).length
    
    const retentionMultiplier = this.getRetentionMultiplier(gameState)
    const pumpLevel = this.getHighestPumpLevel(gameState)
    const efficiency = this.calculateWateringEfficiency(gameState)
    
    return {
      waterPercent,
      dryPlots,
      criticalPlots,
      retentionMultiplier,
      pumpLevel,
      efficiency: efficiency.toolEfficiency
    }
  }

  /**
   * Distribute water efficiently to crops that need it most
   */
  static distributeWaterToCrops(gameState: GameState, waterAmount: number): {
    waterUsed: number
    plotsWatered: number
    priorities: string[]
  } {
    const cropsNeedingWater = gameState.processes.crops
      .filter(crop => crop.waterLevel < 1.0 && crop.cropId) // Only crops with plants
      .sort((a, b) => a.waterLevel - b.waterLevel) // Driest first
    
    if (cropsNeedingWater.length === 0) {
      return { waterUsed: 0, plotsWatered: 0, priorities: [] }
    }
    
    let waterUsed = 0
    let plotsWatered = 0
    const priorities: string[] = []
    
    // Prioritize critically dry plots first
    const criticalPlots = cropsNeedingWater.filter(crop => crop.waterLevel < 0.2)
    const normalPlots = cropsNeedingWater.filter(crop => crop.waterLevel >= 0.2)
    
    const allPlots = [...criticalPlots, ...normalPlots]
    
    for (const crop of allPlots) {
      if (waterUsed >= waterAmount) break
      
      const waterNeeded = 1.0 - crop.waterLevel
      const waterToGive = Math.min(waterNeeded, waterAmount - waterUsed, 1.0)
      
      if (waterToGive > 0) {
        crop.waterLevel = Math.min(1.0, Math.round((crop.waterLevel + waterToGive) * 10000) / 10000) // Fix floating point precision
        waterUsed = Math.round((waterUsed + waterToGive) * 10000) / 10000 // Fix floating point precision
        plotsWatered++
        
        const priority = crop.waterLevel < 0.2 ? 'critical' : 'normal'
        priorities.push(`${crop.cropId}:${priority}`)
      }
    }
    
    return { waterUsed, plotsWatered, priorities }
  }
}
