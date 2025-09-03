/**
 * OfflineProgressionSystem - Phase 10D Support System Integration
 * 
 * Calculates and applies progression that occurs while the player is offline.
 * Implements SupportSystem interface for proper integration.
 */

import type { 
  GameState, 
  GameAction,
  SupportSystem, 
  ValidationResult, 
  SystemEffects, 
  SystemModifier,
  OfflineProgressionResult,
  OfflineProgressionSummary 
} from '@/types'
import { FarmSystem } from '../core/FarmSystem'
import { SeedSystem } from './SeedSystem'
import { AdventureSystem } from '../core/AdventureSystem'
import { MineSystem } from '../core/MineSystem'
import { ForgeSystem } from '../core/ForgeSystem'
import { HelperSystem } from '../core/HelperSystem'
import { CSVDataParser } from '../../CSVDataParser'

interface OfflineResults {
  time: number
  cropsGrown: Array<{
    plotId: number
    cropType: string
    stage: number
    wasHarvested: boolean
  }>
  cropsHarvested: Array<{
    plotId: number
    cropType: string
    energyGained: number
  }>
  seedsCaught: Array<{
    seedType: string
    quantity: number
    source: 'auto_catcher'
  }>
  waterGenerated: number
  craftingCompleted: Array<{
    itemId: string
    quantity: number
    completedAt: number
  }>
  miningProgress: {
    finalDepth: number
    materialsFound: Array<{
      material: string
      quantity: number
    }>
    energyConsumed: number
  }
  helperActions: Array<{
    helperId: string
    action: string
    result: string
    energyUsed: number
  }>
  energyGained: number
  totalActions: number
}

interface OfflineSummary {
  title: string
  sections: Array<{
    category: string
    items: string[]
    iconEmoji?: string
  }>
}

export class OfflineProgressionSystem {
  // =============================================================================
  // SUPPORT SYSTEM INTERFACE IMPLEMENTATION
  // =============================================================================

  /**
   * Validate offline progression actions (usually none needed)
   */
  static validate(action: GameAction, state: GameState): ValidationResult {
    // Offline progression doesn't typically block actions
    // Could validate if offline progression is enabled/allowed
    return { valid: true }
  }

  /**
   * Apply offline progression effects (called when resuming from offline)
   */
  static apply(state: GameState, deltaTime?: number): void {
    if (deltaTime && deltaTime > 0) {
      // Only apply offline progression if significant time has passed
      if (deltaTime > 5) { // More than 5 minutes offline
        const results = this.calculate(state, deltaTime)
        this.applyResults(state, results)
      }
    }
  }

  /**
   * Get offline progression effects (returns empty since it's event-driven)
   */
  static getEffects(state: GameState): SystemEffects {
    return { 
      modifiers: [], // Offline progression doesn't provide ongoing modifiers
      metadata: {
        lastOfflineCheck: Date.now(),
        offlineCapable: true
      }
    }
  }

  /**
   * Apply offline progression results to game state
   */
  private static applyResults(state: GameState, results: OfflineResults): void {
    // Apply energy gains
    if (results.energyGained > 0) {
      state.resources.energy.current = Math.min(
        state.resources.energy.current + results.energyGained,
        state.resources.energy.max
      )
    }

    // Apply water generation
    if (results.waterGenerated > 0) {
      state.resources.water.current = Math.min(
        state.resources.water.current + results.waterGenerated,
        state.resources.water.max
      )
    }

    // Note: Other results would be applied by their respective systems
    // This is just the core resource updates
  }

  // =============================================================================
  // EXISTING OFFLINE PROGRESSION METHODS
  // =============================================================================

  /**
   * Calculate all offline progression and apply to game state
   */
  static calculate(gameState: GameState, offlineMinutes: number): OfflineResults {
    console.log(`⏰ OfflineProgression: Calculating ${offlineMinutes} minutes offline...`)
    
    const results: OfflineResults = {
      time: offlineMinutes,
      cropsGrown: [],
      cropsHarvested: [],
      seedsCaught: [],
      waterGenerated: 0,
      craftingCompleted: [],
      miningProgress: {
        finalDepth: gameState.processes.mining?.depth || 0,
        materialsFound: [],
        energyConsumed: 0
      },
      helperActions: [],
      energyGained: 0,
      totalActions: 0
    }

    // Process systems in logical order
    results.waterGenerated = this.processWaterGeneration(gameState, offlineMinutes)
    results.cropsGrown = this.processCropGrowth(gameState, offlineMinutes)
    results.cropsHarvested = this.processAutoHarvest(gameState, results.cropsGrown)
    results.seedsCaught = this.processSeedCollection(gameState, offlineMinutes)
    results.craftingCompleted = this.processCraftingQueue(gameState, offlineMinutes)
    results.miningProgress = this.processMiningProgress(gameState, offlineMinutes)
    results.helperActions = this.processHelperActions(gameState, offlineMinutes)
    
    // Calculate totals
    results.energyGained = results.cropsHarvested.reduce((sum, crop) => sum + crop.energyGained, 0)
    results.totalActions = results.cropsHarvested.length + 
                          results.seedsCaught.reduce((sum, s) => sum + s.quantity, 0) +
                          results.craftingCompleted.length +
                          results.helperActions.length

    console.log(`✅ OfflineProgression: Processed ${results.totalActions} offline actions`)
    
    return results
  }

  /**
   * Process water generation from auto-pumps
   */
  private static processWaterGeneration(gameState: GameState, offlineMinutes: number): number {
    const autoPumpLevel = this.getAutoPumpLevel(gameState)
    if (!autoPumpLevel) {
      return 0
    }

    // Auto-pump rates by level (% of water cap per hour)
    const AUTO_PUMP_RATES = {
      'auto_pump_1': 0.10,    // 10% per hour
      'auto_pump_2': 0.20,    // 20% per hour  
      'auto_pump_3': 0.35,    // 35% per hour
      'crystal_auto_pump': 0.50  // 50% per hour
    }

    const rate = AUTO_PUMP_RATES[autoPumpLevel] || 0
    const waterCapacity = gameState.resources.water.max
    const potentialGeneration = waterCapacity * rate * (offlineMinutes / 60)
    const actualGeneration = Math.min(
      potentialGeneration,
      waterCapacity - gameState.resources.water.current
    )

    if (actualGeneration > 0) {
      gameState.resources.water.current += actualGeneration
      console.log(`💧 Auto-pump generated ${Math.floor(actualGeneration)} water offline`)
    }

    return actualGeneration
  }

  /**
   * Process crop growth with water limitations
   */
  private static processCropGrowth(gameState: GameState, offlineMinutes: number): Array<any> {
    const cropsGrown: Array<any> = []
    
    if (!gameState.farm?.crops) {
      return cropsGrown
    }

    // Process each planted crop
    for (let plotId = 0; plotId < gameState.farm.crops.length; plotId++) {
      const crop = gameState.farm.crops[plotId]
      if (!crop.planted || !crop.cropType) continue

      const cropData = this.getCropData(gameState, crop.cropType)
      if (!cropData) continue

      const initialStage = crop.stage
      
      // Process growth over time (considering water availability)
      let remainingTime = offlineMinutes
      let currentStage = crop.stage
      
      while (remainingTime > 0 && currentStage < cropData.totalStages) {
        const timeToNextStage = cropData.stageTime - (crop.stageProgress || 0)
        
        if (remainingTime >= timeToNextStage) {
          // Check if plot has water for growth
          if (crop.water <= 0) {
            console.log(`🌱 Plot ${plotId}: Growth stopped - no water`)
            break
          }
          
          // Advance to next stage
          currentStage++
          remainingTime -= timeToNextStage
          crop.stageProgress = 0
          
          // Consume water for growth
          crop.water = Math.max(0, crop.water - 1)
          
        } else {
          // Partial progress
          crop.stageProgress = (crop.stageProgress || 0) + remainingTime
          remainingTime = 0
        }
      }
      
      crop.stage = currentStage
      
      if (crop.stage > initialStage) {
        cropsGrown.push({
          plotId,
          cropType: crop.cropType,
          stage: crop.stage,
          wasHarvested: false
        })
      }
    }

    return cropsGrown
  }

  /**
   * Process auto-harvest of mature crops
   */
  private static processAutoHarvest(gameState: GameState, cropsGrown: Array<any>): Array<any> {
    const cropsHarvested: Array<any> = []
    
    if (!gameState.farm?.crops) {
      return cropsHarvested
    }

    // Check if auto-harvest is enabled and energy cap allows
    const hasAutoHarvest = this.hasAutoHarvestUpgrade(gameState)
    if (!hasAutoHarvest) {
      return cropsHarvested
    }

    for (let plotId = 0; plotId < gameState.farm.crops.length; plotId++) {
      const crop = gameState.farm.crops[plotId]
      if (!crop.planted || !crop.cropType) continue

      const cropData = this.getCropData(gameState, crop.cropType)
      if (!cropData) continue

      // Check if crop is ready for harvest
      if (crop.stage >= cropData.totalStages) {
        const energyGain = cropData.effect || 1
        
        // Check if energy cap allows harvest
        if (gameState.resources.energy.current + energyGain <= gameState.resources.energy.max) {
          // Harvest the crop
          gameState.resources.energy.current += energyGain
          
          // Clear the plot
          crop.planted = false
          crop.cropType = ''
          crop.stage = 0
          crop.stageProgress = 0
          crop.water = 0
          
          cropsHarvested.push({
            plotId,
            cropType: crop.cropType,
            energyGained: energyGain
          })
          
          // Mark as harvested in grown crops
          const grownCrop = cropsGrown.find(c => c.plotId === plotId)
          if (grownCrop) {
            grownCrop.wasHarvested = true
          }
        }
      }
    }

    if (cropsHarvested.length > 0) {
      console.log(`🌾 Auto-harvested ${cropsHarvested.length} crops offline`)
    }

    return cropsHarvested
  }

  /**
   * Process seed collection from auto-catchers
   */
  private static processSeedCollection(gameState: GameState, offlineMinutes: number): Array<any> {
    const seedsCaught: Array<any> = []
    
    const autoCatcherTier = this.getAutoCatcherTier(gameState)
    if (!autoCatcherTier) {
      return seedsCaught
    }

    // Auto-catcher rates (seeds per minute)
    const AUTO_CATCHER_RATES = {
      'auto_catcher_1': 1/10,    // 1 seed per 10 minutes
      'auto_catcher_2': 1/5,     // 1 seed per 5 minutes  
      'auto_catcher_3': 1/2      // 1 seed per 2 minutes
    }

    const rate = AUTO_CATCHER_RATES[autoCatcherTier] || 0
    const seedsGenerated = Math.floor(offlineMinutes * rate)
    
    if (seedsGenerated > 0) {
      // Get available seed types based on tower reach
      const availableSeedTypes = this.getAvailableSeedTypes(gameState)
      
      for (let i = 0; i < seedsGenerated; i++) {
        const seedType = availableSeedTypes[Math.floor(Math.random() * availableSeedTypes.length)]
        
        // Add seed to inventory
        const currentSeeds = gameState.resources.seeds.get(seedType) || 0
        gameState.resources.seeds.set(seedType, currentSeeds + 1)
        
        // Track for results
        let existingSeed = seedsCaught.find(s => s.seedType === seedType)
        if (existingSeed) {
          existingSeed.quantity++
        } else {
          seedsCaught.push({
            seedType,
            quantity: 1,
            source: 'auto_catcher'
          })
        }
      }
      
      console.log(`🌰 Auto-catcher collected ${seedsGenerated} seeds offline`)
    }

    return seedsCaught
  }

  /**
   * Process crafting queue progress
   */
  private static processCraftingQueue(gameState: GameState, offlineMinutes: number): Array<any> {
    const craftingCompleted: Array<any> = []
    
    // Use existing CraftingSystem to process offline crafting
    // This is a simplified version - the full system would need integration
    
    if (gameState.processes?.crafting?.isActive) {
      const craftingProgress = gameState.processes.crafting
      let remainingTime = offlineMinutes
      
      while (remainingTime > 0 && craftingProgress.timeRemaining > 0) {
        const timeToComplete = craftingProgress.timeRemaining
        
        if (remainingTime >= timeToComplete) {
          // Complete current craft
          craftingCompleted.push({
            itemId: craftingProgress.itemId || 'unknown',
            quantity: 1,
            completedAt: offlineMinutes - remainingTime + timeToComplete
          })
          
          remainingTime -= timeToComplete
          
          // Clear crafting state (would normally start next in queue)
          craftingProgress.isActive = false
          craftingProgress.itemId = null
          craftingProgress.timeRemaining = 0
          
        } else {
          // Partial progress
          craftingProgress.timeRemaining -= remainingTime
          remainingTime = 0
        }
      }
    }

    return craftingCompleted
  }

  /**
   * Process mining progress
   */
  private static processMiningProgress(gameState: GameState, offlineMinutes: number): any {
    const miningProgress = {
      finalDepth: gameState.processes.mining?.depth || 0,
      materialsFound: [] as Array<any>,
      energyConsumed: 0
    }

    if (gameState.processes?.mining?.isActive) {
      // Use simplified mining progression offline
      // The actual mining would consume energy and drop materials
      const initialEnergy = gameState.resources.energy.current
      
      // Process mining using existing MiningSystem
      MineSystem.processMining(gameState, offlineMinutes)
      
      miningProgress.finalDepth = gameState.processes.mining.depth
      miningProgress.energyConsumed = initialEnergy - gameState.resources.energy.current
      
      console.log(`⛏️ Mining progressed to depth ${miningProgress.finalDepth}m offline`)
    }

    return miningProgress
  }

  /**
   * Process helper actions
   */
  private static processHelperActions(gameState: GameState, offlineMinutes: number): Array<any> {
    const helperActions: Array<any> = []
    
    // Process helpers using existing HelperSystem
    // This would calculate helper automation over time
    
    if (gameState.helpers && gameState.helpers.length > 0) {
      for (const helper of gameState.helpers) {
        if (helper.isActive && helper.role) {
          // Calculate helper efficiency over time
          const actionsPerformed = Math.floor(offlineMinutes / 30) // Helper acts every 30 minutes
          
          if (actionsPerformed > 0) {
            helperActions.push({
              helperId: helper.id,
              action: `Automated ${helper.role}`,
              result: `Performed ${actionsPerformed} actions`,
              energyUsed: actionsPerformed * 2 // 2 energy per action
            })
          }
        }
      }
    }

    return helperActions
  }

  /**
   * Generate user-friendly summary of offline progression
   */
  static displaySummary(results: OfflineResults): OfflineSummary {
    const sections = []

    // Farm section
    if (results.cropsGrown.length > 0 || results.cropsHarvested.length > 0 || results.waterGenerated > 0) {
      const farmItems = []
      
      if (results.cropsHarvested.length > 0) {
        farmItems.push(`${results.cropsHarvested.length} crops harvested (+${results.energyGained} energy)`)
      }
      
      if (results.cropsGrown.length > results.cropsHarvested.length) {
        const stillGrowing = results.cropsGrown.length - results.cropsHarvested.length
        farmItems.push(`${stillGrowing} crops grew but weren't auto-harvested`)
      }
      
      if (results.waterGenerated > 0) {
        farmItems.push(`${Math.floor(results.waterGenerated)} water generated from auto-pumps`)
      }
      
      if (farmItems.length > 0) {
        sections.push({
          category: 'Farm',
          iconEmoji: '🌾',
          items: farmItems
        })
      }
    }

    // Tower section
    if (results.seedsCaught.length > 0) {
      const totalSeeds = results.seedsCaught.reduce((sum, s) => sum + s.quantity, 0)
      sections.push({
        category: 'Tower',
        iconEmoji: '🗼',
        items: [`${totalSeeds} seeds caught by auto-catcher`]
      })
    }

    // Crafting section
    if (results.craftingCompleted.length > 0) {
      sections.push({
        category: 'Forge',
        iconEmoji: '⚒️',
        items: results.craftingCompleted.map(item => `Crafted: ${item.itemId}`)
      })
    }

    // Mining section
    if (results.miningProgress.energyConsumed > 0) {
      sections.push({
        category: 'Mine',
        iconEmoji: '⛏️',
        items: [
          `Mined to depth: ${Math.floor(results.miningProgress.finalDepth)}m`,
          `Energy used: ${Math.floor(results.miningProgress.energyConsumed)}`
        ]
      })
    }

    // Helpers section
    if (results.helperActions.length > 0) {
      sections.push({
        category: 'Helpers',
        iconEmoji: '🧙',
        items: results.helperActions.map(action => action.result)
      })
    }

    return {
      title: `While you were away (${this.formatTime(results.time)})`,
      sections
    }
  }

  /**
   * Helper: Format time duration
   */
  private static formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${Math.floor(minutes)} minutes`
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60)
      const mins = Math.floor(minutes % 60)
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`
    } else {
      const days = Math.floor(minutes / 1440)
      const hours = Math.floor((minutes % 1440) / 60)
      return hours > 0 ? `${days}d ${hours}h` : `${days} days`
    }
  }

  /**
   * Helper: Get auto-pump level
   */
  private static getAutoPumpLevel(gameState: GameState): string | null {
    const autoPumpLevels = ['crystal_auto_pump', 'auto_pump_3', 'auto_pump_2', 'auto_pump_1']
    
    for (const level of autoPumpLevels) {
      if (gameState.progression?.unlockedUpgrades?.includes(level)) {
        return level
      }
    }
    
    return null
  }

  /**
   * Helper: Get auto-catcher tier
   */
  private static getAutoCatcherTier(gameState: GameState): string | null {
    const autoCatcherTiers = ['auto_catcher_3', 'auto_catcher_2', 'auto_catcher_1']
    
    for (const tier of autoCatcherTiers) {
      if (gameState.progression?.unlockedUpgrades?.includes(tier)) {
        return tier
      }
    }
    
    return null
  }

  /**
   * Helper: Check if auto-harvest is available
   */
  private static hasAutoHarvestUpgrade(gameState: GameState): boolean {
    // Auto-harvest might be tied to helper automation or specific upgrades
    return gameState.helpers?.some(h => h.role === 'farmer' && h.isActive) || false
  }

  /**
   * Helper: Get available seed types based on tower reach
   */
  private static getAvailableSeedTypes(gameState: GameState): string[] {
    const baseSeeds = ['carrot', 'radish']
    const towerReach = gameState.progression?.towerReach || 1
    
    // Add more seed types based on tower reach level
    const seedsByReach = {
      1: ['carrot', 'radish'],
      2: ['carrot', 'radish', 'potato'],
      3: ['carrot', 'radish', 'potato', 'cabbage', 'turnip'],
      4: ['carrot', 'radish', 'potato', 'cabbage', 'turnip', 'corn', 'tomato'],
      5: ['carrot', 'radish', 'potato', 'cabbage', 'turnip', 'corn', 'tomato', 'strawberry', 'spinach']
    }
    
    return seedsByReach[Math.min(towerReach, 5)] || baseSeeds
  }

  /**
   * Helper: Get crop data from game state
   */
  private static getCropData(gameState: GameState, cropType: string): any {
    // This would normally access the CSV data through gameDataStore
    // For now, return basic crop data structure
    const basicCropData = {
      'carrot': { totalStages: 3, stageTime: 6, effect: 1 },
      'radish': { totalStages: 3, stageTime: 5, effect: 1 },
      'potato': { totalStages: 3, stageTime: 8, effect: 2 },
      'beetroot': { totalStages: 4, stageTime: 35, effect: 35 }
    }
    
    return basicCropData[cropType] || { totalStages: 3, stageTime: 10, effect: 1 }
  }
}
