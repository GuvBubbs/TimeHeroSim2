// ForgeSystem - Phase 10C Implementation
// Forge crafting, heat management, and material processing
// Includes CraftingSystem functionality (merged from separate file)

import type { GameState, GameAction, AllParameters, CraftingState, ToolState, WeaponState } from '@/types'
import { CSVDataParser } from '../CSVDataParser'
import { PrerequisiteSystem } from './PrerequisiteSystem'

/**
 * Forge system for crafting and heat management
 */
export class ForgeSystem {
  /**
   * Evaluates forge-specific actions (Phase 6E Implementation)
   */
  static evaluateActions(gameState: GameState, parameters: AllParameters, gameDataStore: any): GameAction[] {
    const actions: GameAction[] = []
    const forgeParams = parameters.forge
    
    if (!forgeParams) return actions
    
    // Crafting priorities based on tool needs and materials
    const craftingQueue = gameState.processes.crafting || []
    const maxConcurrent = 3 // Default max concurrent items
    
    if (craftingQueue.length < maxConcurrent) {
      const craftableItems = ForgeSystem.getCraftableItems(gameState, gameDataStore)
      
      for (const item of craftableItems) {
        // Apply crafting priorities - simplified for now
        let priority = 1.0
        
        // Check material requirements
        const hasResources = ForgeSystem.checkMaterialRequirements(item.materials, gameState)
        const heatRequired = item.heatRequirement || 50
        const currentHeat = ForgeSystem.getForgeHeat(gameState)
        
        if (hasResources && currentHeat >= heatRequired && priority > 0.4) {
          actions.push({
            id: `craft_${item.id}_${Date.now()}`,
            type: 'craft',
            screen: 'forge',
            target: item.id,
            duration: item.craftingTime,
            energyCost: item.energyCost,
            goldCost: 0,
            prerequisites: [],
            expectedRewards: { items: [item.id] }
          })
        }
      }
    }
    
    // Heat management
    if (ForgeSystem.getForgeHeat(gameState) < 30 && (gameState.resources.materials.get('wood') || 0) >= 5) {
      actions.push({
        id: `stoke_forge_${Date.now()}`,
        type: 'stoke',
        screen: 'forge',
        target: 'heat',
        duration: 2,
        energyCost: 5,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: {}
      })
    }
    
    return actions
  }

  /**
   * Process ongoing crafting activities
   */
  static processCrafting(gameState: GameState, deltaTime: number, gameDataStore: any): {
    completed: boolean[]
    stateChanges: any
    events: any[]
  } {
    const craftingQueue = gameState.processes.crafting || []
    const completedCrafts: boolean[] = []
    const events: any[] = []
    
    for (let i = 0; i < craftingQueue.length; i++) {
      const craft = craftingQueue[i]
      
      // Update progress
      const elapsed = (gameState.time.totalMinutes - craft.startedAt)
      craft.progress = Math.min(1.0, elapsed / craft.duration)
      
      // Check if completed
      if (elapsed >= craft.duration) {
        // Complete the craft
        craft.isComplete = true
        completedCrafts.push(true)
        
        // Add crafted item to inventory
        if (!gameState.inventory.tools.has(craft.itemId)) {
          gameState.inventory.tools.set(craft.itemId, {
            id: craft.itemId,
            durability: 100,
            maxDurability: 100,
            isEquipped: false
          })
        }
        
        events.push({
          type: 'crafting_complete',
          description: `Completed crafting ${craft.itemId}`,
          rewards: { items: [craft.itemId] }
        })
      } else {
        completedCrafts.push(false)
      }
    }
    
    return {
      completed: completedCrafts,
      stateChanges: {},
      events
    }
  }

  /**
   * Get craftable items based on available recipes and materials
   */
  static getCraftableItems(gameState: GameState, gameDataStore: any): Array<{
    id: string
    materials: Map<string, number>
    craftingTime: number
    energyCost: number
    heatRequirement: number
  }> {
    const craftableItems: Array<{
      id: string
      materials: Map<string, number>
      craftingTime: number
      energyCost: number
      heatRequirement: number
    }> = []
    
    // Get forge actions from CSV data
    const forgeActions = gameDataStore.getItemsByType('forge') || []
    
    for (const action of forgeActions) {
      // Check if we have the blueprint/recipe
      if (action.prerequisite && !gameState.inventory.blueprints.has(action.prerequisite)) {
        continue
      }
      
      // Parse materials cost
      const materials = new Map<string, number>()
      if (action.materials_cost) {
        const materialPairs = action.materials_cost.split(';')
        for (const pair of materialPairs) {
          const [material, amount] = pair.trim().split(' x')
          if (material && amount) {
            materials.set(material.toLowerCase(), parseInt(amount) || 1)
          }
        }
      }
      
      craftableItems.push({
        id: action.id,
        materials,
        craftingTime: parseInt(action.time) || 10,
        energyCost: parseInt(action.energy_cost) || 0,
        heatRequirement: 50 // Default heat requirement
      })
    }
    
    return craftableItems
  }

  /**
   * Check if player has required materials for crafting
   */
  static checkMaterialRequirements(materials: Map<string, number>, gameState: GameState): boolean {
    for (const [material, required] of materials) {
      const available = gameState.resources.materials.get(material) || 0
      if (available < required) {
        return false
      }
    }
    return true
  }

  /**
   * Get current forge heat level
   */
  static getForgeHeat(gameState: GameState): number {
    // Simplified heat calculation - using a default since forgeHeat may not exist in AutomationState
    return (gameState.automation as any).forgeHeat || 0
  }

  /**
   * Update forge heat based on stoking and cooling
   */
  static updateHeat(gameState: GameState, deltaTime: number): void {
    const currentHeat = ForgeSystem.getForgeHeat(gameState)
    
    // Heat naturally cools down over time
    const coolingRate = 1 // Heat lost per minute
    const newHeat = Math.max(0, currentHeat - (coolingRate * deltaTime))
    
    ;(gameState.automation as any).forgeHeat = newHeat
  }

  /**
   * Stoke the forge to increase heat
   */
  static stokeForge(gameState: GameState, woodAmount: number): void {
    const currentHeat = ForgeSystem.getForgeHeat(gameState)
    const heatGain = woodAmount * 10 // 10 heat per wood
    const maxHeat = 100
    
    ;(gameState.automation as any).forgeHeat = Math.min(maxHeat, currentHeat + heatGain)
    
    // Consume wood
    const currentWood = gameState.resources.materials.get('wood') || 0
    gameState.resources.materials.set('wood', Math.max(0, currentWood - woodAmount))
  }

  /**
   * Calculate crafting success rate based on heat
   */
  static calculateCraftingSuccess(heat: number): boolean {
    // Simple success calculation - higher heat = better success rate
    const baseSuccessRate = 0.5
    const heatBonus = (heat / 100) * 0.4 // Up to 40% bonus
    const successRate = baseSuccessRate + heatBonus
    
    return Math.random() < successRate
  }

  /**
   * Get material refinement opportunities
   */
  static getAvailableRefinements(gameState: GameState, gameDataStore: any): Array<{
    id: string
    inputMaterial: string
    outputMaterial: string
    ratio: number
    cost: number
  }> {
    // Simplified refinement options - could be enhanced with CSV data
    const refinements: Array<{
      id: string
      inputMaterial: string
      outputMaterial: string
      ratio: number
      cost: number
    }> = []
    
    // Example: Iron ore -> Iron ingots
    if ((gameState.resources.materials.get('iron_ore') || 0) >= 5) {
      refinements.push({
        id: 'refine_iron',
        inputMaterial: 'iron_ore',
        outputMaterial: 'iron',
        ratio: 5, // 5 ore -> 1 ingot
        cost: 10 // Energy cost
      })
    }
    
    return refinements
  }

  /**
   * Execute material refinement
   */
  static executeRefinement(refinement: any, gameState: GameState): boolean {
    const inputAmount = gameState.resources.materials.get(refinement.inputMaterial) || 0
    
    if (inputAmount >= refinement.ratio && gameState.resources.energy.current >= refinement.cost) {
      // Consume input materials
      gameState.resources.materials.set(refinement.inputMaterial, inputAmount - refinement.ratio)
      
      // Produce output material
      const outputAmount = gameState.resources.materials.get(refinement.outputMaterial) || 0
      gameState.resources.materials.set(refinement.outputMaterial, outputAmount + 1)
      
      // Consume energy
      gameState.resources.energy.current -= refinement.cost
      
      return true
    }
    
    return false
  }

  // ============================================================================
  // CRAFTING SYSTEM (merged from CraftingSystem.ts)
  // ============================================================================

  /**
   * Process ongoing crafting operations with advanced heat management
   * Handles furnace speed modifiers, forge heat optimization, and completion
   */
  static processAdvancedCrafting(gameState: GameState, deltaMinutes: number, gameDataStore: any): void {
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
  static startAdvancedCrafting(gameState: GameState, itemId: string, gameDataStore: any): boolean {
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
   * Advanced stoke forge method with enhanced heat management
   * Called when player performs stoke action
   */
  static stokeForgeAdvanced(gameState: GameState, energyCost: number = 10): boolean {
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
