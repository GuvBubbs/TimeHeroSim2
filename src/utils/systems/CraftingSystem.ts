/**
 * CraftingSystem - Phase 8F Implementation
 * 
 * Handles forge crafting mechanics including:
 * - Material consumption and tool/weapon production
 * - Forge heat optimization and furnace speed modifiers
 * - Master craft bonuses and refinement processes
 */

import { CSVDataParser } from '../CSVDataParser'
import { PrerequisiteSystem } from './PrerequisiteSystem'
import type { GameState, CraftingState, ToolState, WeaponState } from '@/types'

export class CraftingSystem {
  /**
   * Process ongoing crafting operations
   * Handles furnace speed modifiers, forge heat optimization, and completion
   */
  static processCrafting(gameState: GameState, deltaMinutes: number, gameDataStore: any): void {
    if (!gameState.processes.crafting || gameState.processes.crafting.length === 0) {
      return
    }

    // Decay forge heat over time (-50°/minute)
    if (gameState.processes.crafting.length > 0) {
      const currentCraft = gameState.processes.crafting[0]
      if (currentCraft.heat > 0) {
        currentCraft.heat = Math.max(0, currentCraft.heat - 50 * deltaMinutes)
      }
    }

    // Process the first item in queue (FIFO)
    const currentCraft = gameState.processes.crafting[0]
    if (!currentCraft || currentCraft.isComplete) {
      return
    }

    // Get crafting data from CSV
    const craftData = gameDataStore.getItemById(currentCraft.itemId)
    if (!craftData) {
      console.warn(`Craft item not found: ${currentCraft.itemId}`)
      gameState.processes.crafting.shift() // Remove invalid craft
      return
    }

    // Calculate furnace speed modifier based on available furnaces
    const speedModifier = this.getFurnaceSpeedModifier(gameState)
    
    // Calculate progress based on duration and speed modifier
    const baseDuration = craftData.time || 10 // Default 10 minutes
    const effectiveDuration = baseDuration / speedModifier
    const progressDelta = deltaMinutes / effectiveDuration

    currentCraft.progress += progressDelta

    // Check if crafting is complete
    if (currentCraft.progress >= 1.0) {
      this.completeCraft(gameState, currentCraft, craftData)
      gameState.processes.crafting.shift() // Remove completed craft
    }
  }

  /**
   * Start a new crafting operation
   * Checks prerequisites, consumes materials, and adds to queue
   */
  static startCrafting(gameState: GameState, itemId: string, gameDataStore: any): boolean {
    const craftData = gameDataStore.getItemById(itemId)
    if (!craftData) {
      console.warn(`Craft item not found: ${itemId}`)
      return false
    }

    // Check prerequisites
    if (!PrerequisiteSystem.checkPrerequisites(craftData, gameState, gameDataStore)) {
      return false
    }

    // Check energy cost
    const energyCost = craftData.energyCost || 0
    if (gameState.resources.energy.current < energyCost) {
      return false
    }

    // Check gold cost
    const goldCost = craftData.goldCost || 0
    if (gameState.resources.gold < goldCost) {
      return false
    }

    // Check material costs
    if (craftData.materialsCost) {
      const requiredMaterials = this.parseMaterialCost(craftData.materialsCost)
      if (!this.hasSufficientMaterials(gameState, requiredMaterials)) {
        return false
      }
    }

    // Consume resources
    gameState.resources.energy.current -= energyCost
    gameState.resources.gold -= goldCost

    // Consume materials
    if (craftData.materialsCost) {
      const requiredMaterials = this.parseMaterialCost(craftData.materialsCost)
      this.consumeMaterials(gameState, requiredMaterials)
    }

    // Create crafting state
    const craftingState: CraftingState = {
      itemId: itemId,
      startedAt: gameState.time.totalMinutes,
      duration: craftData.time || 10,
      progress: 0,
      heat: this.getOptimalForgeHeat(), // Start with optimal heat
      isComplete: false
    }

    // Add to crafting queue
    gameState.processes.crafting.push(craftingState)

    return true
  }

  /**
   * Complete a crafting operation
   * Adds item to inventory and handles master craft bonuses
   */
  private static completeCraft(gameState: GameState, craft: CraftingState, craftData: any): void {
    // Check forge heat success rate
    const heatSuccessRate = this.calculateHeatSuccessRate(craft.heat)
    const isSuccessful = Math.random() < heatSuccessRate

    if (!isSuccessful) {
      // Failed craft - lose some materials but not all
      console.log(`Craft failed due to poor forge heat: ${craft.heat}°`)
      return
    }

    // Determine item type and add to inventory
    if (craftData.type === 'farm_tool' || craftData.type === 'mining_tool') {
      this.addToolToInventory(gameState, craftData)
    } else if (craftData.type === 'weapon') {
      this.addWeaponToInventory(gameState, craftData)
    } else if (craftData.categories === 'Refinement') {
      this.addRefinedMaterial(gameState, craftData)
    }

    // Check for Master Craft bonus (10% chance for double output)
    if (gameState.progression.unlockedUpgrades.includes('master_craft')) {
      if (Math.random() < 0.1) {
        console.log(`Master Craft triggered! Double output for ${craftData.name}`)
        // Add the item again
        if (craftData.type === 'farm_tool' || craftData.type === 'mining_tool') {
          this.addToolToInventory(gameState, craftData)
        } else if (craftData.type === 'weapon') {
          this.addWeaponToInventory(gameState, craftData)
        } else if (craftData.categories === 'Refinement') {
          this.addRefinedMaterial(gameState, craftData)
        }
      }
    }

    craft.isComplete = true
  }

  /**
   * Get furnace speed modifier based on available furnaces
   */
  private static getFurnaceSpeedModifier(gameState: GameState): number {
    let speedModifier = 1.0

    // Check for furnace upgrades
    if (gameState.progression.unlockedUpgrades.includes('furnace_1')) {
      speedModifier = 1.2 // +20%
    }
    if (gameState.progression.unlockedUpgrades.includes('furnace_2')) {
      speedModifier = 1.4 // +40%
    }
    if (gameState.progression.unlockedUpgrades.includes('crystal_furnace')) {
      speedModifier = 1.6 // +60%
    }

    return speedModifier
  }

  /**
   * Calculate success rate based on forge heat
   * Optimal range: 2500-3500°, with falloff outside this range
   */
  private static calculateHeatSuccessRate(heat: number): number {
    const optimalMin = 2500
    const optimalMax = 3500
    const optimalMid = (optimalMin + optimalMax) / 2

    if (heat >= optimalMin && heat <= optimalMax) {
      return 1.0 // 100% success in optimal range
    }

    // Calculate distance from optimal range
    let distance: number
    if (heat < optimalMin) {
      distance = optimalMin - heat
    } else {
      distance = heat - optimalMax
    }

    // Success rate decreases with distance from optimal range
    const maxDistance = 2000 // At this distance, success rate is 0%
    const successRate = Math.max(0, 1 - (distance / maxDistance))

    return successRate
  }

  /**
   * Get optimal forge heat for starting crafts
   */
  private static getOptimalForgeHeat(): number {
    return 3000 // Middle of optimal range (2500-3500)
  }

  /**
   * Add tool to inventory
   */
  private static addToolToInventory(gameState: GameState, toolData: any): void {
    const toolState: ToolState = {
      id: toolData.id,
      durability: 100,
      maxDurability: 100,
      isEquipped: false
    }

    gameState.inventory.tools.set(toolData.id, toolState)
    console.log(`Added tool to inventory: ${toolData.name}`)
  }

  /**
   * Add weapon to inventory
   */
  private static addWeaponToInventory(gameState: GameState, weaponData: any): void {
    const weaponType = this.getWeaponType(weaponData.id)
    const level = weaponData.level || 1

    // Check if we already have this weapon type
    const existingWeapon = gameState.inventory.weapons.get(weaponType)
    
    if (existingWeapon) {
      // Upgrade to higher level if this is better
      if (level > existingWeapon.level) {
        existingWeapon.level = level
        existingWeapon.durability = 100
        existingWeapon.maxDurability = 100
        console.log(`Upgraded ${weaponType} to level ${level}`)
      }
    } else {
      // Add new weapon
      const weaponState: WeaponState = {
        id: weaponData.id,
        durability: 100,
        maxDurability: 100,
        isEquipped: false,
        level: level
      }
      
      gameState.inventory.weapons.set(weaponType, weaponState)
      console.log(`Added weapon to inventory: ${weaponData.name} (Level ${level})`)
    }
  }

  /**
   * Add refined material to resources
   */
  private static addRefinedMaterial(gameState: GameState, refinementData: any): void {
    if (refinementData.materialsGain) {
      const gainedMaterials = this.parseMaterialCost(refinementData.materialsGain)
      
      for (const [material, amount] of gainedMaterials) {
        const normalizedName = CSVDataParser.normalizeMaterialName(material)
        const current = gameState.resources.materials.get(normalizedName) || 0
        gameState.resources.materials.set(normalizedName, current + amount)
        console.log(`Refined: +${amount} ${material}`)
      }
    }
  }

  /**
   * Extract weapon type from weapon ID (e.g., "craft_spear_1" -> "spear")
   */
  private static getWeaponType(weaponId: string): string {
    const match = weaponId.match(/craft_(\w+)_\d+/)
    return match ? match[1] : weaponId
  }

  /**
   * Parse material cost from GameDataItem.materialsCost
   */
  private static parseMaterialCost(materialsCost: any): Map<string, number> {
    if (typeof materialsCost === 'string') {
      return CSVDataParser.parseMaterials(materialsCost)
    } else if (typeof materialsCost === 'object' && materialsCost !== null) {
      // Already parsed as object
      const materials = new Map<string, number>()
      for (const [material, amount] of Object.entries(materialsCost)) {
        if (typeof amount === 'number') {
          materials.set(CSVDataParser.normalizeMaterialName(material), amount)
        }
      }
      return materials
    }
    return new Map()
  }

  /**
   * Check if player has sufficient materials
   */
  private static hasSufficientMaterials(gameState: GameState, requiredMaterials: Map<string, number>): boolean {
    for (const [material, required] of requiredMaterials) {
      const normalizedName = CSVDataParser.normalizeMaterialName(material)
      const available = gameState.resources.materials.get(normalizedName) || 0
      if (available < required) {
        return false
      }
    }
    return true
  }

  /**
   * Consume materials from player resources
   */
  private static consumeMaterials(gameState: GameState, requiredMaterials: Map<string, number>): void {
    for (const [material, required] of requiredMaterials) {
      const normalizedName = CSVDataParser.normalizeMaterialName(material)
      const current = gameState.resources.materials.get(normalizedName) || 0
      gameState.resources.materials.set(normalizedName, Math.max(0, current - required))
    }
  }

  /**
   * Stoke the forge to increase heat
   * Called when player performs stoke action
   */
  static stokeForge(gameState: GameState, energyCost: number = 10): boolean {
    if (gameState.resources.energy.current < energyCost) {
      return false
    }

    gameState.resources.energy.current -= energyCost

    // Increase heat for current craft
    if (gameState.processes.crafting.length > 0) {
      const currentCraft = gameState.processes.crafting[0]
      currentCraft.heat = Math.min(5000, currentCraft.heat + 500) // Add 500°, max 5000°
      console.log(`Forge stoked! Heat: ${currentCraft.heat}°`)
      return true
    }

    return false
  }
}
