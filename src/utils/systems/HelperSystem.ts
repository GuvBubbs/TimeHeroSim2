// HelperSystem - Phase 8M Helper Automation with Level Scaling
// Handles all helper automation with proper level scaling formulas and dual-role support

import type { GameState, GnomeState } from '@/types'
import { GnomeHousingSystem } from './GnomeHousing'

export interface HelperScaling {
  base: number
  perLevel: number
  formula: (level: number) => number
}

/**
 * Helper level scaling formulas - Phase 8M implementation
 */
export const HELPER_SCALING: Record<string, HelperScaling> = {
  waterer: {
    base: 5,           // plots/minute
    perLevel: 1,       // additional plots per level
    formula: (level: number) => 5 + level  // 5-15 at L0-L10
  },
  
  pump_operator: {
    base: 20,          // water/hour
    perLevel: 5,
    formula: (level: number) => 20 + (level * 5)  // 20-70 at L0-L10
  },
  
  sower: {
    base: 3,
    perLevel: 1,
    formula: (level: number) => 3 + level  // 3-13 at L0-L10
  },
  
  harvester: {
    base: 4,
    perLevel: 1,
    formula: (level: number) => 4 + level  // 4-14 at L0-L10
  },
  
  miners_friend: {
    base: 0.15,        // 15% energy reduction
    perLevel: 0.03,    // 3% per level
    formula: (level: number) => 0.15 + (level * 0.03)  // 15-45% at L0-L10
  },
  
  adventure_fighter: {
    base: 5,           // damage
    perLevel: 2,
    formula: (level: number) => 5 + (level * 2)  // 5-25 damage at L0-L10
  },
  
  adventure_support: {
    base: 1,           // HP per 30 sec
    perLevel: 0.2,     // Increases healing rate
    formula: (level: number) => 1 + (level * 0.2)  // 1-3 HP/30s at L0-L10
  },
  
  seed_catcher: {
    base: 0.10,        // 10% catch bonus
    perLevel: 0.02,
    formula: (level: number) => 0.10 + (level * 0.02)  // 10-30% at L0-L10
  },
  
  forager: {
    base: 5,           // wood/hour from stumps
    perLevel: 2,
    formula: (level: number) => 5 + (level * 2)  // 5-25 wood/hour at L0-L10
  },
  
  refiner: {
    base: 0.05,        // 5% speed bonus
    perLevel: 0.01,
    formula: (level: number) => 0.05 + (level * 0.01)  // 5-15% at L0-L10
  }
}

export class HelperSystem {
  /**
   * Main helper processing method - called every tick
   * Processes all active helpers and their assigned roles with housing validation
   */
  static processHelpers(gameState: GameState, deltaMinutes: number, gameDataStore: any): void {
    if (!gameState.helpers?.gnomes || gameState.helpers.gnomes.length === 0) {
      return
    }

    // Validate housing before processing
    const housingValidation = GnomeHousingSystem.validateGnomeHousing(gameState)

    // Process each gnome
    for (const gnome of gameState.helpers.gnomes) {
      // Skip if not assigned (not housed or no role)
      if (!gnome.isAssigned || !gnome.role) {
        continue
      }

      // Get gnome level for scaling calculations
      const gnomeLevel = gnome.level || 0

      // Process primary role with level-based scaling
      this.processHelperRole(gameState, gnome, gnome.role, gnomeLevel, deltaMinutes, gameDataStore, 1.0)

      // Handle dual-role if Master Academy is unlocked
      if (gameState.progression.unlockedUpgrades.includes('master_academy')) {
        const secondaryRole = this.getSecondaryRole(gnome)
        if (secondaryRole && secondaryRole !== gnome.role) {
          // Process secondary role at 75% efficiency
          this.processHelperRole(gameState, gnome, secondaryRole, gnomeLevel, deltaMinutes, gameDataStore, 0.75)
        }
      }
    }
  }

  /**
   * Process a specific helper role with level-based scaling
   */
  private static processHelperRole(
    gameState: GameState, 
    gnome: GnomeState, 
    role: string, 
    gnomeLevel: number,
    deltaMinutes: number, 
    gameDataStore: any,
    efficiencyMultiplier: number = 1.0
  ): void {
    switch (role) {
      case 'waterer':
        this.processWatererHelper(gameState, gnome, gnomeLevel, deltaMinutes, efficiencyMultiplier)
        break
      case 'pump':
      case 'pump_operator':
        this.processPumpOperatorHelper(gameState, gnome, gnomeLevel, deltaMinutes, efficiencyMultiplier)
        break
      case 'sower':
      case 'planter':
        this.processSowerHelper(gameState, gnome, gnomeLevel, deltaMinutes, gameDataStore, efficiencyMultiplier)
        break
      case 'harvester':
        this.processHarvesterHelper(gameState, gnome, gnomeLevel, deltaMinutes, efficiencyMultiplier)
        break
      case 'miner':
      case 'miners_friend':
        this.processMinerHelper(gameState, gnome, gnomeLevel, deltaMinutes, efficiencyMultiplier)
        break
      case 'catcher':
      case 'seed_catcher':
        this.processSeedCatcherHelper(gameState, gnome, gnomeLevel, deltaMinutes, efficiencyMultiplier)
        break
      case 'forager':
        this.processForagerHelper(gameState, gnome, gnomeLevel, deltaMinutes, efficiencyMultiplier)
        break
      case 'refiner':
        this.processRefinerHelper(gameState, gnome, gnomeLevel, deltaMinutes, efficiencyMultiplier)
        break
      case 'fighter':
      case 'adventure_fighter':
        this.processAdventureFighterHelper(gameState, gnome, gnomeLevel, deltaMinutes, efficiencyMultiplier)
        break
      case 'support':
      case 'adventure_support':
        this.processAdventureSupportHelper(gameState, gnome, gnomeLevel, deltaMinutes, efficiencyMultiplier)
        break
      default:
        console.warn(`Unknown helper role: ${role}`)
    }
  }

  /**
   * Waterer Helper: Waters crops automatically
   * Level scaling: 5 + level plots/minute (5-15 at L0-L10)
   */
  private static processWatererHelper(
    gameState: GameState, 
    gnome: GnomeState, 
    gnomeLevel: number, 
    deltaMinutes: number, 
    efficiencyMultiplier: number
  ): void {
    if (!gameState.processes?.crops) return

    // Calculate plots to water using level scaling formula
    const scaling = HELPER_SCALING.waterer
    const plotsPerMinute = scaling.formula(gnomeLevel) * efficiencyMultiplier
    const plotsToWater = Math.floor(plotsPerMinute * deltaMinutes)

    if (plotsToWater <= 0) return

    // Find dry plots that need watering
    const dryPlots = gameState.processes.crops
      .filter(crop => crop.cropType && crop.waterLevel < 0.5)
      .slice(0, plotsToWater)

    let plotsWatered = 0
    // Water the plots if we have water available
    for (const plot of dryPlots) {
      if (gameState.resources.water.current > 0) {
        plot.waterLevel = 1.0
        gameState.resources.water.current--
        plotsWatered++
      } else {
        break // No more water available
      }
    }

    if (plotsWatered > 0) {
      gnome.currentTask = `watered_${plotsWatered}_plots`
    }
  }

  /**
   * Pump Operator Helper: Generates water passively
   * Level scaling: 20 + (level * 5) water/hour (20-70 at L0-L10)
   */
  private static processPumpOperatorHelper(
    gameState: GameState, 
    gnome: GnomeState, 
    gnomeLevel: number, 
    deltaMinutes: number, 
    efficiencyMultiplier: number
  ): void {
    const scaling = HELPER_SCALING.pump_operator
    const waterPerHour = scaling.formula(gnomeLevel) * efficiencyMultiplier
    const waterGenerated = Math.floor((waterPerHour * deltaMinutes) / 60)

    if (waterGenerated > 0) {
      const maxWater = gameState.resources.water.max
      const currentWater = gameState.resources.water.current
      const actualGenerated = Math.min(waterGenerated, maxWater - currentWater)
      
      gameState.resources.water.current += actualGenerated
      gnome.currentTask = `generated_${actualGenerated}_water`
    }
  }

  /**
   * Sower Helper: Plants seeds automatically after harvest
   * Level scaling: 3 + level seeds/minute (3-13 at L0-L10), prefers high-energy seeds
   */
  private static processSowerHelper(
    gameState: GameState, 
    gnome: GnomeState, 
    gnomeLevel: number, 
    deltaMinutes: number, 
    gameDataStore: any, 
    efficiencyMultiplier: number
  ): void {
    if (!gameState.processes?.crops) return

    const scaling = HELPER_SCALING.sower
    const seedsPerMinute = scaling.formula(gnomeLevel) * efficiencyMultiplier
    const seedsToPlant = Math.floor(seedsPerMinute * deltaMinutes)

    if (seedsToPlant <= 0) return

    // Find empty plots that can be planted
    const emptyPlots = gameState.processes.crops
      .filter(crop => !crop.cropType && crop.waterLevel > 0.3) // Only plant in watered plots
      .slice(0, seedsToPlant)

    if (emptyPlots.length === 0) return

    // Get available seeds, sorted by energy value (prefer high-energy seeds)
    const availableSeeds = this.getAvailableSeedsForPlanting(gameState, gameDataStore)
    
    let plantsPlanted = 0
    for (const plot of emptyPlots) {
      if (availableSeeds.length === 0) break

      const seedType = availableSeeds[0].id
      if (gameState.resources.seeds.get(seedType) > 0) {
        // Plant the seed
        plot.cropType = seedType
        plot.growthProgress = 0
        plot.growthStage = 0
        plot.isReady = false
        plot.isDead = false
        
        // Consume seed
        const currentSeeds = gameState.resources.seeds.get(seedType) || 0
        gameState.resources.seeds.set(seedType, currentSeeds - 1)
        
        plantsPlanted++
      }
    }

    if (plantsPlanted > 0) {
      gnome.currentTask = `planted_${plantsPlanted}_seeds`
    }
  }

  /**
   * Harvester Helper: Collects and stores crops
   * Level scaling: 4 + level plots/minute (4-14 at L0-L10)
   */
  private static processHarvesterHelper(
    gameState: GameState, 
    gnome: GnomeState, 
    gnomeLevel: number, 
    deltaMinutes: number, 
    efficiencyMultiplier: number
  ): void {
    if (!gameState.processes?.crops) return

    const scaling = HELPER_SCALING.harvester
    const plotsPerMinute = scaling.formula(gnomeLevel) * efficiencyMultiplier
    const plotsToHarvest = Math.floor(plotsPerMinute * deltaMinutes)

    if (plotsToHarvest <= 0) return

    // Find ready crops to harvest
    const readyCrops = gameState.processes.crops
      .filter(crop => crop.isReady && crop.cropType && !crop.isDead)
      .slice(0, plotsToHarvest)

    let totalEnergyHarvested = 0
    let plotsHarvested = 0
    for (const crop of readyCrops) {
      // Calculate energy from crop (simplified - would normally look up crop data)
      const energyValue = this.getCropEnergyValue(crop.cropType) || 1
      
      // Check if we have energy storage space
      if (gameState.resources.energy.current + energyValue <= gameState.resources.energy.max) {
        gameState.resources.energy.current += energyValue
        totalEnergyHarvested += energyValue
        plotsHarvested++
        
        // Clear the plot
        crop.cropType = null
        crop.isReady = false
        crop.growthProgress = 0
        crop.growthStage = 0
      }
    }

    if (plotsHarvested > 0) {
      gnome.currentTask = `harvested_${plotsHarvested}_plots_${totalEnergyHarvested}_energy`
    }
  }

  /**
   * Miner Helper: Reduces mining energy cost
   * Level scaling: 15% + (level * 3%) energy reduction (15-45% at L0-L10)
   */
  private static processMinerHelper(
    gameState: GameState, 
    gnome: GnomeState, 
    gnomeLevel: number, 
    deltaMinutes: number, 
    efficiencyMultiplier: number
  ): void {
    if (!gameState.processes?.mining) return

    // Calculate energy drain reduction using level scaling
    const scaling = HELPER_SCALING.miners_friend
    const drainReduction = scaling.formula(gnomeLevel) * efficiencyMultiplier

    // Apply reduction to current mining operation
    if (gameState.processes.mining.energyDrainRate) {
      gameState.processes.mining.energyDrainRate *= (1 - drainReduction)
      gnome.currentTask = `reducing_mining_drain_${Math.round(drainReduction * 100)}%`
    }
  }

  /**
   * Seed Catcher Helper: Boosts tower efficiency
   * Level scaling: 10% + (level * 2%) catch bonus (10-30% at L0-L10)
   */
  private static processSeedCatcherHelper(
    gameState: GameState, 
    gnome: GnomeState, 
    gnomeLevel: number, 
    deltaMinutes: number, 
    efficiencyMultiplier: number
  ): void {
    // Calculate bonus rate using level scaling
    const scaling = HELPER_SCALING.seed_catcher
    const bonusRate = scaling.formula(gnomeLevel) * efficiencyMultiplier
    const bonusChance = bonusRate * deltaMinutes / 60 // Per hour rate

    if (Math.random() < bonusChance) {
      // Add a random seed based on current tower reach level
      const seedTypes = Array.from(gameState.resources.seeds.keys())
      if (seedTypes.length > 0) {
        const randomSeed = seedTypes[Math.floor(Math.random() * seedTypes.length)]
        const currentSeeds = gameState.resources.seeds.get(randomSeed) || 0
        gameState.resources.seeds.set(randomSeed, currentSeeds + 1)
        gnome.currentTask = `caught_bonus_${randomSeed}`
      }
    }
  }

  /**
   * Forager Helper: Collects wood from stumps
   * Level scaling: 5 + (level * 2) wood/hour (5-25 at L0-L10)
   */
  private static processForagerHelper(
    gameState: GameState, 
    gnome: GnomeState, 
    gnomeLevel: number, 
    deltaMinutes: number, 
    efficiencyMultiplier: number
  ): void {
    const scaling = HELPER_SCALING.forager
    const woodPerHour = scaling.formula(gnomeLevel) * efficiencyMultiplier
    const woodGenerated = Math.floor((woodPerHour * deltaMinutes) / 60)

    if (woodGenerated > 0) {
      // Check if we have completed stump cleanups (simplified check)
      const hasStumps = gameState.progression.completedCleanups.has('remove_stumps') || 
                       gameState.progression.completedCleanups.has('split_small_stumps')

      if (hasStumps) {
        const currentWood = gameState.resources.materials.get('wood') || 0
        gameState.resources.materials.set('wood', currentWood + woodGenerated)
        gnome.currentTask = `foraged_${woodGenerated}_wood`
      }
    }
  }

  /**
   * Refiner Helper: Assists at forge
   * Level scaling: 5% + (level * 1%) refinement speed bonus (5-15% at L0-L10)
   */
  private static processRefinerHelper(
    gameState: GameState, 
    gnome: GnomeState, 
    gnomeLevel: number, 
    deltaMinutes: number, 
    efficiencyMultiplier: number
  ): void {
    if (!gameState.processes?.crafting || gameState.processes.crafting.length === 0) return

    // Calculate speed bonus using level scaling
    const scaling = HELPER_SCALING.refiner
    const speedBonus = scaling.formula(gnomeLevel) * efficiencyMultiplier

    const currentCraft = gameState.processes.crafting[0]
    if (currentCraft) {
      // Increase progress based on speed bonus
      const bonusProgress = (speedBonus * deltaMinutes) / currentCraft.duration
      currentCraft.progress += bonusProgress
      gnome.currentTask = `refining_${currentCraft.itemId}_${Math.round(speedBonus * 100)}%_bonus`
    }
  }

  /**
   * Adventure Fighter Helper: Assists in combat
   * Level scaling: 5 + (level * 2) damage (5-25 at L0-L10)
   */
  private static processAdventureFighterHelper(
    gameState: GameState, 
    gnome: GnomeState, 
    gnomeLevel: number, 
    deltaMinutes: number, 
    efficiencyMultiplier: number
  ): void {
    if (!gameState.processes?.adventure) return

    // Calculate damage using level scaling
    const scaling = HELPER_SCALING.adventure_fighter
    const helperDamage = Math.floor(scaling.formula(gnomeLevel) * efficiencyMultiplier)
    gnome.currentTask = `combat_assist_${helperDamage}_damage`
  }

  /**
   * Adventure Support Helper: Assists in combat healing
   * Level scaling: 1 + (level * 0.2) HP per 30 sec (1-3 HP/30s at L0-L10)
   */
  private static processAdventureSupportHelper(
    gameState: GameState, 
    gnome: GnomeState, 
    gnomeLevel: number, 
    deltaMinutes: number, 
    efficiencyMultiplier: number
  ): void {
    if (!gameState.processes?.adventure) return

    // Calculate healing using level scaling (convert to per minute rate)
    const scaling = HELPER_SCALING.adventure_support
    const healPerThirtySeconds = scaling.formula(gnomeLevel) * efficiencyMultiplier
    const healRate = (healPerThirtySeconds * 2) // Convert to per minute
    const healingAmount = Math.floor(healRate * deltaMinutes)

    if (healingAmount > 0) {
      // This would typically heal the hero during adventures
      gnome.currentTask = `healing_${healingAmount}_hp`
    }
  }

  /**
   * Helper method to get secondary role for dual-role helpers
   */
  private static getSecondaryRole(gnome: GnomeState): string | null {
    // Check if gnome has a secondary role stored in currentTask
    if (gnome.currentTask && gnome.currentTask.startsWith('dual_role_')) {
      return gnome.currentTask.replace('dual_role_', '')
    }
    
    // Fallback: Auto-assign complementary roles for high-level gnomes
    if (gnome.level && gnome.level >= 5) {
      switch (gnome.role) {
        case 'waterer':
          return 'pump_operator' // Water management combo
        case 'sower':
          return 'harvester' // Farming combo
        case 'adventure_fighter':
          return 'adventure_support' // Combat combo
        case 'forager':
          return 'refiner' // Production combo
        default:
          return null
      }
    }
    return null
  }

  /**
   * Set dual role for a gnome (Master Academy required)
   * @param gnome The gnome to assign dual role to
   * @param primaryRole Primary role 
   * @param secondaryRole Secondary role
   * @param gameState Current game state
   * @returns Success status
   */
  static setDualRole(
    gnome: GnomeState, 
    primaryRole: string, 
    secondaryRole: string, 
    gameState: GameState
  ): boolean {
    // Check if Master Academy is unlocked
    if (!gameState.progression.unlockedUpgrades.includes('master_academy')) {
      return false
    }

    // Check if gnome is housed
    if (!gnome.isAssigned) {
      return false
    }

    // Cannot assign same role twice
    if (primaryRole === secondaryRole) {
      return false
    }

    // Check if roles are valid
    const validRoles = Object.keys(HELPER_SCALING)
    if (!validRoles.includes(primaryRole) || !validRoles.includes(secondaryRole)) {
      return false
    }

    gnome.role = primaryRole
    // Store secondary role in currentTask for now (in full implementation, use gnome.secondaryRole)
    gnome.currentTask = `dual_role_${secondaryRole}`
    
    return true
  }

  /**
   * Get all available helper roles
   */
  static getAvailableRoles(): string[] {
    return Object.keys(HELPER_SCALING)
  }

  /**
   * Calculate helper effectiveness at specific level
   */
  static calculateHelperEffectiveness(role: string, level: number): number {
    const scaling = HELPER_SCALING[role]
    if (!scaling) return 0
    
    return scaling.formula(level)
  }

  /**
   * Helper method to get available seeds sorted by energy value
   */
  private static getAvailableSeedsForPlanting(gameState: GameState, gameDataStore: any): any[] {
    const seeds: any[] = []
    
    for (const [seedType, count] of gameState.resources.seeds.entries()) {
      if (count > 0) {
        const seedData = gameDataStore?.getItemById?.(seedType)
        if (seedData) {
          seeds.push({
            id: seedType,
            count,
            energyValue: this.getCropEnergyValue(seedType) || 1
          })
        }
      }
    }

    // Sort by energy value (descending - prefer high-energy crops)
    return seeds.sort((a, b) => b.energyValue - a.energyValue)
  }

  /**
   * Helper method to get crop energy value
   */
  private static getCropEnergyValue(cropType: string): number {
    // Simplified energy values - in full implementation would look up from game data
    const energyValues: { [key: string]: number } = {
      'carrot': 1,
      'radish': 1,
      'potato': 2,
      'cabbage': 3,
      'turnip': 2,
      'corn': 5,
      'tomato': 4,
      'strawberry': 8,
      'spinach': 5,
      'onion': 6,
      'garlic': 8,
      'cucumber': 12,
      'leek': 10,
      'wheat': 12,
      'asparagus': 20,
      'cauliflower': 18,
      'caisim': 15,
      'pumpkin': 25,
      'watermelon': 35,
      'honeydew': 30,
      'pineapple': 40,
      'beetroot': 35,
      'eggplant': 30,
      'soybean': 45,
      'yam': 50,
      'bell_pepper_green': 45,
      'bell_pepper_red': 55,
      'bell_pepper_yellow': 65,
      'shallot': 60
    }

    return energyValues[cropType] || 1
  }
}
