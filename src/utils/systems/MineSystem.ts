/**
 * MiningSystem - Phase 8F + 8O Implementation
 * 
 * Handles mining mechanics including:
 * - Exponential energy drain by depth with pickaxe efficiency (0/15/30/45/60%)
 * - Material bonuses by pickaxe tier (0/10/20/30/50%)
 * - Abyss Seeker special effect (2x obsidian drops)
 * - Depth progression and material drops by tier
 * - Tool sharpening and temporary efficiency boosts
 */

import { CSVDataParser } from '../CSVDataParser'
import type { GameState, MiningState } from '@/types'

export class MineSystem {
  /**
   * Process ongoing mining operations
   * Handles energy drain, depth progression, and material drops
   */
  static processMining(gameState: GameState, deltaMinutes: number): void {
    if (!gameState.processes.mining || !gameState.processes.mining.isActive) {
      return
    }

    const mining = gameState.processes.mining

    // Calculate base energy drain: 2^(depth/500) per minute
    const depthTier = Math.floor(mining.depth / 500) + 1
    const baseEnergyDrain = Math.pow(2, depthTier - 1) // 1, 2, 4, 8, 16...

    // Apply pickaxe efficiency
    const pickaxeEfficiency = this.getPickaxeEfficiency(gameState)
    const actualEnergyDrain = baseEnergyDrain * (1 - pickaxeEfficiency) * deltaMinutes

    // Apply tool sharpening bonus if active
    const sharpenBonus = this.getSharpenBonus(gameState)
    const finalEnergyDrain = actualEnergyDrain * (1 - sharpenBonus)

    // Drain energy
    gameState.resources.energy.current -= finalEnergyDrain
    mining.energyDrain = finalEnergyDrain / deltaMinutes // Store per-minute rate

    // Progress depth (10 meters per minute)
    const depthProgress = 10 * deltaMinutes
    mining.depth += depthProgress
    mining.timeAtDepth += deltaMinutes

    // Drop materials every 30 seconds (0.5 minutes)
    const materialDropInterval = 0.5
    const timeSinceLastDrop = mining.timeAtDepth % materialDropInterval
    
    if (timeSinceLastDrop < deltaMinutes) {
      // We crossed a material drop boundary
      const dropCount = Math.floor(mining.timeAtDepth / materialDropInterval) - 
                       Math.floor((mining.timeAtDepth - deltaMinutes) / materialDropInterval)
      
      for (let i = 0; i < dropCount; i++) {
        this.dropMaterials(gameState, mining.depth)
      }
    }

    // End mining if out of energy
    if (gameState.resources.energy.current <= 0) {
      gameState.processes.mining.isActive = false
      gameState.resources.energy.current = 0
      console.log(`Mining stopped - out of energy at depth ${mining.depth}m`)
    }
  }

  /**
   * Drop materials based on current depth tier
   * Materials are added as raw_[material] requiring refinement
   * Applies pickaxe material bonuses and special effects
   */
  static dropMaterials(gameState: GameState, depth: number): void {
    const depthTier = Math.floor(depth / 500) + 1
    
    // Material types by depth tier (0-indexed for array access)
    const materialsByTier = [
      ['stone'],                    // 0-500m (tier 1)
      ['copper', 'stone'],          // 500-1000m (tier 2)
      ['iron', 'copper'],           // 1000-1500m (tier 3)
      ['iron'],                     // 1500-2000m (tier 4)
      ['silver', 'iron'],           // 2000-2500m (tier 5)
      ['silver'],                   // 2500-3000m (tier 6)
      ['crystal', 'silver'],        // 3000-3500m (tier 7)
      ['crystal'],                  // 3500-4000m (tier 8)
      ['mythril', 'crystal'],       // 4000-4500m (tier 9)
      ['obsidian', 'mythril']       // 4500-5000m (tier 10)
    ]

    const tierIndex = Math.min(depthTier - 1, materialsByTier.length - 1)
    const availableMaterials = materialsByTier[tierIndex]
    
    if (!availableMaterials || availableMaterials.length === 0) {
      return
    }

    // Select random material from tier
    const material = availableMaterials[Math.floor(Math.random() * availableMaterials.length)]
    
    // Calculate base quantity based on depth tier (deeper = more materials)
    const baseQuantity = Math.floor(Math.random() * 3) + 1 // 1-3 base
    const tierBonus = Math.floor(depthTier / 2) // +0, +1, +2, +3, +4...
    let quantity = baseQuantity + tierBonus

    // Apply pickaxe material bonus
    const materialBonus = this.getMaterialBonus(gameState)
    quantity = Math.floor(quantity * (1 + materialBonus))

    // Apply special pickaxe effects
    quantity = this.applySpecialEffect(gameState, material, quantity)

    // Add as raw material requiring refinement
    const rawMaterialName = `raw_${material}`
    const normalizedName = CSVDataParser.normalizeMaterialName(rawMaterialName)
    
    const current = gameState.resources.materials.get(normalizedName) || 0
    gameState.resources.materials.set(normalizedName, current + quantity)
    
    const bonusText = materialBonus > 0 ? ` (+${Math.floor(materialBonus * 100)}% pickaxe bonus)` : ''
    console.log(`Mined: +${quantity} ${rawMaterialName} at depth ${depth}m${bonusText}`)
  }

  /**
   * Start mining operation
   */
  static startMining(gameState: GameState): boolean {
    // Check if already mining
    if (gameState.processes.mining && gameState.processes.mining.isActive) {
      return false
    }

    // Check energy requirement (need at least 10 energy to start)
    if (gameState.resources.energy.current < 10) {
      return false
    }

    // Initialize mining state
    const miningState: MiningState = {
      depth: 0,
      energyDrain: 1, // Will be calculated in processMining
      isActive: true,
      timeAtDepth: 0
    }

    gameState.processes.mining = miningState
    console.log('Started mining operation')
    return true
  }

  /**
   * Stop mining operation
   */
  static stopMining(gameState: GameState): void {
    if (gameState.processes.mining) {
      gameState.processes.mining.isActive = false
      console.log(`Stopped mining at depth ${gameState.processes.mining.depth}m`)
    }
  }

  /**
   * Get pickaxe efficiency based on equipped pickaxe
   */
  private static getPickaxeEfficiency(gameState: GameState): number {
    // Check for pickaxe tools in inventory
    const pickaxes = [
      { id: 'pickaxe_1', efficiency: 0 },      // Base pickaxe (0% efficiency)
      { id: 'pickaxe_2', efficiency: 0.15 },   // -15% energy drain
      { id: 'pickaxe_3', efficiency: 0.30 },   // -30% energy drain
      { id: 'crystal_pick', efficiency: 0.45 }, // -45% energy drain
      { id: 'abyss_seeker', efficiency: 0.60 }  // -60% energy drain
    ]

    let bestEfficiency = 0

    for (const pickaxe of pickaxes) {
      const tool = gameState.inventory.tools.get(pickaxe.id)
      if (tool && tool.durability > 0) {
        bestEfficiency = Math.max(bestEfficiency, pickaxe.efficiency)
      }
    }

    return bestEfficiency
  }

  /**
   * Get material bonus based on equipped pickaxe
   * Returns multiplier for additional materials (0.0 to 0.5)
   */
  private static getMaterialBonus(gameState: GameState): number {
    // Material bonus by pickaxe tier
    const pickaxes = [
      { id: 'pickaxe_1', materialBonus: 0.0 },    // +0% materials
      { id: 'pickaxe_2', materialBonus: 0.10 },   // +10% materials
      { id: 'pickaxe_3', materialBonus: 0.20 },   // +20% materials
      { id: 'crystal_pick', materialBonus: 0.30 }, // +30% materials
      { id: 'abyss_seeker', materialBonus: 0.50 }  // +50% materials
    ]

    let bestBonus = 0

    for (const pickaxe of pickaxes) {
      const tool = gameState.inventory.tools.get(pickaxe.id)
      if (tool && tool.durability > 0) {
        bestBonus = Math.max(bestBonus, pickaxe.materialBonus)
      }
    }

    return bestBonus
  }

  /**
   * Apply special pickaxe effects (e.g., Abyss Seeker double obsidian)
   */
  private static applySpecialEffect(gameState: GameState, material: string, quantity: number): number {
    // Check if Abyss Seeker is equipped
    const abyssSeeker = gameState.inventory.tools.get('abyss_seeker')
    if (abyssSeeker && abyssSeeker.durability > 0) {
      // Abyss Seeker special effect: double obsidian drops
      if (material === 'obsidian') {
        console.log(`🌟 Abyss Seeker special effect: Double obsidian! ${quantity} → ${quantity * 2}`)
        return quantity * 2
      }
    }

    return quantity
  }

  /**
   * Sharpen tool to reduce energy drain by 25% for 5 minutes
   */
  static sharpenTool(gameState: GameState, energyCost: number = 5): boolean {
    if (gameState.resources.energy.current < energyCost) {
      return false
    }

    gameState.resources.energy.current -= energyCost

    // Set sharpening effect (store end time)
    const sharpenDuration = 5 // 5 minutes
    const sharpenEndTime = gameState.time.totalMinutes + sharpenDuration
    
    // Store in game state (we'll need to add this to the state interface)
    // For now, we'll use a simple approach and store it in a way that works
    if (!(gameState as any).temporaryEffects) {
      (gameState as any).temporaryEffects = {}
    }
    
    (gameState as any).temporaryEffects.sharpenedTool = {
      endTime: sharpenEndTime,
      bonus: 0.25 // 25% reduction
    }

    console.log(`Tool sharpened! 25% energy reduction for ${sharpenDuration} minutes`)
    return true
  }

  /**
   * Get current sharpening bonus (0-0.25)
   */
  private static getSharpenBonus(gameState: GameState): number {
    const effects = (gameState as any).temporaryEffects
    if (!effects || !effects.sharpenedTool) {
      return 0
    }

    const sharpenEffect = effects.sharpenedTool
    if (gameState.time.totalMinutes >= sharpenEffect.endTime) {
      // Effect expired, clean up
      delete effects.sharpenedTool
      return 0
    }

    return sharpenEffect.bonus
  }

  /**
   * Get mining depth tier for display/logic purposes
   */
  static getDepthTier(depth: number): number {
    return Math.floor(depth / 500) + 1
  }

  /**
   * Get depth tier name for display
   */
  static getDepthTierName(depth: number): string {
    const tier = this.getDepthTier(depth)
    const tierNames = [
      'Surface Layer',      // Tier 1: 0-500m
      'Copper Veins',       // Tier 2: 500-1000m
      'Iron Seams',         // Tier 3: 1000-1500m
      'Deep Iron',          // Tier 4: 1500-2000m
      'Silver Pockets',     // Tier 5: 2000-2500m
      'Silver Lodes',       // Tier 6: 2500-3000m
      'Crystal Caves',      // Tier 7: 3000-3500m
      'Crystal Core',       // Tier 8: 3500-4000m
      'Mythril Veins',      // Tier 9: 4000-4500m
      'The Abyss'           // Tier 10: 4500-5000m
    ]

    return tierNames[Math.min(tier - 1, tierNames.length - 1)] || 'Unknown Depths'
  }

  /**
   * Get expected materials for a depth tier
   */
  static getExpectedMaterials(depth: number): string[] {
    const depthTier = this.getDepthTier(depth)
    
    const materialsByTier = [
      ['Raw Stone'],                           // Tier 1
      ['Raw Copper', 'Raw Stone'],             // Tier 2
      ['Raw Iron', 'Raw Copper'],              // Tier 3
      ['Raw Iron'],                            // Tier 4
      ['Raw Silver', 'Raw Iron'],              // Tier 5
      ['Raw Silver'],                          // Tier 6
      ['Raw Crystal', 'Raw Silver'],           // Tier 7
      ['Raw Crystal'],                         // Tier 8
      ['Raw Mythril', 'Raw Crystal'],          // Tier 9
      ['Raw Obsidian', 'Raw Mythril']          // Tier 10
    ]

    const tierIndex = Math.min(depthTier - 1, materialsByTier.length - 1)
    return materialsByTier[tierIndex] || []
  }

  /**
   * Calculate estimated energy drain per minute at depth
   */
  static calculateEnergyDrain(depth: number, pickaxeEfficiency: number = 0): number {
    const depthTier = Math.floor(depth / 500) + 1
    const baseEnergyDrain = Math.pow(2, depthTier - 1)
    return baseEnergyDrain * (1 - pickaxeEfficiency)
  }
}
