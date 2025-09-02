// ForgeSystem - Phase 9C Implementation
// Forge crafting, heat management, and material processing

import type { GameState, GameAction, AllParameters } from '@/types'

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
}
