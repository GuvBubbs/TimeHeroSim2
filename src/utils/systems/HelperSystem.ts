// HelperSystem - Phase 8D Helper Automation Implementation
// Handles all helper automation including watering, harvesting, mining assistance, etc.

import type { GameState, GnomeState } from '@/types'

export class HelperSystem {
  /**
   * Main helper processing method - called every tick
   * Processes all active helpers and their assigned roles
   */
  static processHelpers(gameState: GameState, deltaMinutes: number, gameDataStore: any): void {
    if (!gameState.helpers?.gnomes || gameState.helpers.gnomes.length === 0) {
      return
    }

    // Process each gnome
    for (const gnome of gameState.helpers.gnomes) {
      // Skip if not assigned (equivalent to not housed or no role)
      if (!gnome.isAssigned || !gnome.role) {
        continue
      }

      // Calculate efficiency: base efficiency already includes level scaling
      const efficiency = gnome.efficiency || 1.0

      // Process primary role
      this.processHelperRole(gameState, gnome, gnome.role, efficiency, deltaMinutes, gameDataStore)

      // Handle dual-role if Master Academy is unlocked
      // Check if master_academy is in unlocked upgrades
      if (gameState.progression.unlockedUpgrades.includes('master_academy')) {
        // For now, assume secondary role is stored in currentTask if it's a role name
        const secondaryRole = this.getSecondaryRole(gnome)
        if (secondaryRole && secondaryRole !== gnome.role) {
          // Process secondary role at 75% efficiency
          this.processHelperRole(gameState, gnome, secondaryRole, efficiency * 0.75, deltaMinutes, gameDataStore)
        }
      }
    }
  }

  /**
   * Process a specific helper role
   */
  private static processHelperRole(
    gameState: GameState, 
    gnome: GnomeState, 
    role: string, 
    efficiency: number, 
    deltaMinutes: number, 
    gameDataStore: any
  ): void {
    switch (role) {
      case 'waterer':
        this.processWatererHelper(gameState, gnome, efficiency, deltaMinutes)
        break
      case 'pump':
      case 'pump_operator':
        this.processPumpOperatorHelper(gameState, gnome, efficiency, deltaMinutes)
        break
      case 'sower':
      case 'planter':
        this.processSowerHelper(gameState, gnome, efficiency, deltaMinutes, gameDataStore)
        break
      case 'harvester':
        this.processHarvesterHelper(gameState, gnome, efficiency, deltaMinutes)
        break
      case 'miner':
      case 'miners_friend':
        this.processMinerHelper(gameState, gnome, efficiency, deltaMinutes)
        break
      case 'catcher':
      case 'seed_catcher':
        this.processSeedCatcherHelper(gameState, gnome, efficiency, deltaMinutes)
        break
      case 'forager':
        this.processForagerHelper(gameState, gnome, efficiency, deltaMinutes)
        break
      case 'refiner':
        this.processRefinerHelper(gameState, gnome, efficiency, deltaMinutes)
        break
      case 'fighter':
      case 'adventure_fighter':
        this.processAdventureFighterHelper(gameState, gnome, efficiency, deltaMinutes)
        break
      case 'support':
      case 'adventure_support':
        this.processAdventureSupportHelper(gameState, gnome, efficiency, deltaMinutes)
        break
      default:
        console.warn(`Unknown helper role: ${role}`)
    }
  }

  /**
   * Waterer Helper: Waters crops automatically
   * Base: 5 plots/minute, +1 per level (efficiency incorporates level)
   */
  private static processWatererHelper(gameState: GameState, gnome: GnomeState, efficiency: number, deltaMinutes: number): void {
    if (!gameState.processes?.crops) return

    // Calculate plots to water based on efficiency (which includes level scaling)
    const basePlotsPerMinute = 5
    const plotsToWater = Math.floor(basePlotsPerMinute * efficiency * deltaMinutes)

    if (plotsToWater <= 0) return

    // Find dry plots that need watering
    const dryPlots = gameState.processes.crops
      .filter(crop => crop.cropType && crop.waterLevel < 0.5)
      .slice(0, plotsToWater)

    // Water the plots if we have water available
    for (const plot of dryPlots) {
      if (gameState.resources.water.current > 0) {
        plot.waterLevel = 1.0
        gameState.resources.water.current--
        
        // Update gnome's current task
        gnome.currentTask = `watered_plot_${plot.id || 'unknown'}`
      } else {
        break // No more water available
      }
    }
  }

  /**
   * Pump Operator Helper: Generates water passively
   * Base: +20 water/hour, +5 per level
   */
  private static processPumpOperatorHelper(gameState: GameState, gnome: GnomeState, efficiency: number, deltaMinutes: number): void {
    const baseWaterPerHour = 20
    const waterGenerated = Math.floor((baseWaterPerHour * efficiency * deltaMinutes) / 60)

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
   * Base: 3 seeds/minute, +1 per level, prefers high-energy seeds
   */
  private static processSowerHelper(gameState: GameState, gnome: GnomeState, efficiency: number, deltaMinutes: number, gameDataStore: any): void {
    if (!gameState.processes?.crops) return

    const baseSeedsPerMinute = 3
    const seedsToPlant = Math.floor(baseSeedsPerMinute * efficiency * deltaMinutes)

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
        gnome.currentTask = `planted_${seedType}`
      }
    }
  }

  /**
   * Harvester Helper: Collects and stores crops
   * Base: 4 plots/minute, +1 per level
   */
  private static processHarvesterHelper(gameState: GameState, gnome: GnomeState, efficiency: number, deltaMinutes: number): void {
    if (!gameState.processes?.crops) return

    const basePlotsPerMinute = 4
    const plotsToHarvest = Math.floor(basePlotsPerMinute * efficiency * deltaMinutes)

    if (plotsToHarvest <= 0) return

    // Find ready crops to harvest
    const readyCrops = gameState.processes.crops
      .filter(crop => crop.isReady && crop.cropType && !crop.isDead)
      .slice(0, plotsToHarvest)

    let totalEnergyHarvested = 0
    for (const crop of readyCrops) {
      // Calculate energy from crop (simplified - would normally look up crop data)
      const energyValue = this.getCropEnergyValue(crop.cropType) || 1
      
      // Check if we have energy storage space
      if (gameState.resources.energy.current + energyValue <= gameState.resources.energy.max) {
        gameState.resources.energy.current += energyValue
        totalEnergyHarvested += energyValue
        
        // Clear the plot
        crop.cropType = null
        crop.isReady = false
        crop.growthProgress = 0
        crop.growthStage = 0
      }
    }

    if (totalEnergyHarvested > 0) {
      gnome.currentTask = `harvested_${totalEnergyHarvested}_energy`
    }
  }

  /**
   * Miner Helper: Reduces mining energy cost
   * Base: -15% energy drain, -3% per level
   */
  private static processMinerHelper(gameState: GameState, gnome: GnomeState, efficiency: number, deltaMinutes: number): void {
    if (!gameState.processes?.mining) return

    // Calculate energy drain reduction based on efficiency
    const baseDrainReduction = 0.15 // 15%
    const drainReduction = baseDrainReduction * efficiency

    // Apply reduction to current mining operation
    if (gameState.processes.mining.energyDrainRate) {
      gameState.processes.mining.energyDrainRate *= (1 - drainReduction)
      gnome.currentTask = `reducing_mining_drain_${Math.round(drainReduction * 100)}%`
    }
  }

  /**
   * Seed Catcher Helper: Boosts tower efficiency
   * Base: +10% catch rate, +2% per level
   */
  private static processSeedCatcherHelper(gameState: GameState, gnome: GnomeState, efficiency: number, deltaMinutes: number): void {
    // This would typically modify tower catch rates
    // For now, we'll add bonus seeds based on efficiency
    const baseBonusRate = 0.1 // 10% bonus
    const bonusChance = baseBonusRate * efficiency * deltaMinutes / 60 // Per hour rate

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
   * Base: 5 wood/hour, +2 per level
   */
  private static processForagerHelper(gameState: GameState, gnome: GnomeState, efficiency: number, deltaMinutes: number): void {
    const baseWoodPerHour = 5
    const woodGenerated = Math.floor((baseWoodPerHour * efficiency * deltaMinutes) / 60)

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
   * Base: +5% refinement speed, +1% per level
   */
  private static processRefinerHelper(gameState: GameState, gnome: GnomeState, efficiency: number, deltaMinutes: number): void {
    if (!gameState.processes?.crafting || gameState.processes.crafting.length === 0) return

    // Apply speed bonus to current crafting
    const baseSpeedBonus = 0.05 // 5%
    const speedBonus = baseSpeedBonus * efficiency

    const currentCraft = gameState.processes.crafting[0]
    if (currentCraft) {
      // Increase progress based on speed bonus
      const bonusProgress = (speedBonus * deltaMinutes) / currentCraft.duration
      currentCraft.progress += bonusProgress
      gnome.currentTask = `refining_${currentCraft.itemId}`
    }
  }

  /**
   * Adventure Fighter Helper: Assists in combat
   * Base: 5 neutral damage/hit, +2 per level
   */
  private static processAdventureFighterHelper(gameState: GameState, gnome: GnomeState, efficiency: number, deltaMinutes: number): void {
    if (!gameState.processes?.adventure) return

    // This would typically modify combat calculations
    // For now, we'll just track that the helper is assisting
    const baseDamage = 5
    const helperDamage = Math.floor(baseDamage * efficiency)
    gnome.currentTask = `combat_assist_${helperDamage}_damage`
  }

  /**
   * Adventure Support Helper: Assists in combat
   * Base: Heals 1 HP/30 sec, +2 damage per level
   */
  private static processAdventureSupportHelper(gameState: GameState, gnome: GnomeState, efficiency: number, deltaMinutes: number): void {
    if (!gameState.processes?.adventure) return

    // Calculate healing based on efficiency
    const baseHealRate = 2 // HP per minute (1 HP per 30 sec)
    const healingAmount = Math.floor(baseHealRate * efficiency * deltaMinutes)

    if (healingAmount > 0) {
      // This would typically heal the hero during adventures
      gnome.currentTask = `healing_${healingAmount}_hp`
    }
  }

  /**
   * Helper method to get secondary role for dual-role helpers
   */
  private static getSecondaryRole(gnome: GnomeState): string | null {
    // For now, assume secondary role is stored in a specific format in currentTask
    // In a full implementation, this would be a separate field
    if (gnome.currentTask && gnome.currentTask.startsWith('secondary_')) {
      return gnome.currentTask.replace('secondary_', '')
    }
    return null
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
