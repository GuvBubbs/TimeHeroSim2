// ResourceManager - Phase 9F Implementation
// Specialized resource handling with storage limits and validation

import type { GameState } from '../../types'
import type { ResourceChangeRequest, ResourceChangeResult } from './types/StateTypes'
import { CSVDataParser } from '../CSVDataParser'

/**
 * Storage limits for different materials
 */
const MATERIAL_STORAGE_LIMITS = {
  // Basic materials
  wood: { base: 50, tiers: [100, 250, 500, 1000, 2500, 10000] },
  stone: { base: 50, tiers: [100, 250, 500, 1000, 2500, 10000] },
  copper: { base: 25, tiers: [50, 125, 250, 500, 1250, 5000] },
  iron: { base: 25, tiers: [50, 125, 250, 500, 1250, 5000] },
  
  // Advanced materials
  silver: { base: 10, tiers: [20, 50, 100, 200, 500, 2000] },
  crystal: { base: 5, tiers: [10, 25, 50, 100, 250, 1000] },
  mythril: { base: 3, tiers: [6, 15, 30, 60, 150, 600] },
  obsidian: { base: 2, tiers: [4, 10, 20, 40, 100, 400] },
  
  // Special materials (no storage limits)
  pine_resin: { base: 999999, tiers: [] },
  shadow_bark: { base: 999999, tiers: [] },
  mountain_stone: { base: 999999, tiers: [] },
  cave_crystal: { base: 999999, tiers: [] },
  frozen_heart: { base: 999999, tiers: [] },
  enchanted_wood: { base: 999999, tiers: [] },
  molten_core: { base: 999999, tiers: [] }
}

/**
 * Storage upgrade tiers
 */
const STORAGE_UPGRADES = [
  'material_crate_i',      // Tier 1
  'material_crate_ii',     // Tier 2
  'material_warehouse',    // Tier 3
  'material_depot',        // Tier 4
  'material_silo',         // Tier 5
  'grand_warehouse',       // Tier 6
  'infinite_vault'         // Tier 7
]

/**
 * Resource manager for centralized resource operations
 */
export class ResourceManager {
  private gameState: GameState

  constructor(gameState: GameState) {
    this.gameState = gameState
  }

  /**
   * Process a resource change request
   */
  processResourceChange(request: ResourceChangeRequest): ResourceChangeResult {
    switch (request.type) {
      case 'energy':
        return this.processEnergyChange(request)
      case 'gold':
        return this.processGoldChange(request)
      case 'water':
        return this.processWaterChange(request)
      case 'seeds':
        return this.processSeedChange(request)
      case 'materials':
        return this.processMaterialChange(request)
      default:
        return {
          success: false,
          actualAmount: 0,
          overflow: 0,
          newValue: 0,
          hitLimit: false,
          error: `Unknown resource type: ${request.type}`
        }
    }
  }

  /**
   * Process energy changes
   */
  private processEnergyChange(request: ResourceChangeRequest): ResourceChangeResult {
    const energy = this.gameState.resources.energy
    const oldValue = energy.current

    switch (request.operation) {
      case 'add': {
        const newValue = request.enforceLimit !== false 
          ? Math.min(energy.max, energy.current + request.amount)
          : energy.current + request.amount
        
        const actualAmount = newValue - oldValue
        const overflow = request.amount - actualAmount
        
        energy.current = newValue
        
        return {
          success: true,
          actualAmount,
          overflow,
          newValue,
          hitLimit: overflow > 0,
          error: undefined
        }
      }
      
      case 'subtract': {
        if (energy.current < request.amount) {
          return {
            success: false,
            actualAmount: 0,
            overflow: 0,
            newValue: energy.current,
            hitLimit: false,
            error: `Insufficient energy: need ${request.amount}, have ${energy.current}`
          }
        }
        
        energy.current -= request.amount
        
        return {
          success: true,
          actualAmount: -request.amount,
          overflow: 0,
          newValue: energy.current,
          hitLimit: false,
          error: undefined
        }
      }
      
      case 'set': {
        const newValue = request.enforceLimit !== false
          ? Math.min(energy.max, request.amount)
          : request.amount
        
        const actualAmount = newValue - oldValue
        energy.current = Math.max(0, newValue)
        
        return {
          success: true,
          actualAmount,
          overflow: 0,
          newValue: energy.current,
          hitLimit: false,
          error: undefined
        }
      }
      
      default:
        return {
          success: false,
          actualAmount: 0,
          overflow: 0,
          newValue: energy.current,
          hitLimit: false,
          error: `Unsupported energy operation: ${request.operation}`
        }
    }
  }

  /**
   * Process gold changes
   */
  private processGoldChange(request: ResourceChangeRequest): ResourceChangeResult {
    const oldValue = this.gameState.resources.gold

    switch (request.operation) {
      case 'add': {
        this.gameState.resources.gold += request.amount
        
        return {
          success: true,
          actualAmount: request.amount,
          overflow: 0,
          newValue: this.gameState.resources.gold,
          hitLimit: false,
          error: undefined
        }
      }
      
      case 'subtract': {
        if (this.gameState.resources.gold < request.amount) {
          return {
            success: false,
            actualAmount: 0,
            overflow: 0,
            newValue: this.gameState.resources.gold,
            hitLimit: false,
            error: `Insufficient gold: need ${request.amount}, have ${this.gameState.resources.gold}`
          }
        }
        
        this.gameState.resources.gold -= request.amount
        
        return {
          success: true,
          actualAmount: -request.amount,
          overflow: 0,
          newValue: this.gameState.resources.gold,
          hitLimit: false,
          error: undefined
        }
      }
      
      case 'set': {
        this.gameState.resources.gold = Math.max(0, request.amount)
        
        return {
          success: true,
          actualAmount: this.gameState.resources.gold - oldValue,
          overflow: 0,
          newValue: this.gameState.resources.gold,
          hitLimit: false,
          error: undefined
        }
      }
      
      default:
        return {
          success: false,
          actualAmount: 0,
          overflow: 0,
          newValue: this.gameState.resources.gold,
          hitLimit: false,
          error: `Unsupported gold operation: ${request.operation}`
        }
    }
  }

  /**
   * Process water changes
   */
  private processWaterChange(request: ResourceChangeRequest): ResourceChangeResult {
    const water = this.gameState.resources.water
    const oldValue = water.current

    switch (request.operation) {
      case 'add': {
        const newValue = request.enforceLimit !== false 
          ? Math.min(water.max, water.current + request.amount)
          : water.current + request.amount
        
        const actualAmount = newValue - oldValue
        const overflow = request.amount - actualAmount
        
        water.current = newValue
        
        return {
          success: true,
          actualAmount,
          overflow,
          newValue,
          hitLimit: overflow > 0,
          error: undefined
        }
      }
      
      case 'subtract': {
        if (water.current < request.amount) {
          return {
            success: false,
            actualAmount: 0,
            overflow: 0,
            newValue: water.current,
            hitLimit: false,
            error: `Insufficient water: need ${request.amount}, have ${water.current}`
          }
        }
        
        water.current = Math.max(0, water.current - request.amount)
        
        return {
          success: true,
          actualAmount: -request.amount,
          overflow: 0,
          newValue: water.current,
          hitLimit: false,
          error: undefined
        }
      }
      
      case 'set': {
        const newValue = request.enforceLimit !== false
          ? Math.min(water.max, request.amount)
          : request.amount
        
        const actualAmount = newValue - oldValue
        water.current = Math.max(0, newValue)
        
        return {
          success: true,
          actualAmount,
          overflow: 0,
          newValue: water.current,
          hitLimit: false,
          error: undefined
        }
      }
      
      default:
        return {
          success: false,
          actualAmount: 0,
          overflow: 0,
          newValue: water.current,
          hitLimit: false,
          error: `Unsupported water operation: ${request.operation}`
        }
    }
  }

  /**
   * Process seed changes
   */
  private processSeedChange(request: ResourceChangeRequest): ResourceChangeResult {
    if (!request.itemId) {
      return {
        success: false,
        actualAmount: 0,
        overflow: 0,
        newValue: 0,
        hitLimit: false,
        error: 'Seed ID is required for seed operations'
      }
    }

    const seeds = this.gameState.resources.seeds
    const oldValue = seeds.get(request.itemId) || 0

    switch (request.operation) {
      case 'add': {
        const newValue = oldValue + request.amount
        seeds.set(request.itemId, newValue)
        
        return {
          success: true,
          actualAmount: request.amount,
          overflow: 0,
          newValue,
          hitLimit: false,
          error: undefined
        }
      }
      
      case 'subtract': {
        if (oldValue < request.amount) {
          return {
            success: false,
            actualAmount: 0,
            overflow: 0,
            newValue: oldValue,
            hitLimit: false,
            error: `Insufficient seeds: need ${request.amount} ${request.itemId}, have ${oldValue}`
          }
        }
        
        const newValue = oldValue - request.amount
        seeds.set(request.itemId, newValue)
        
        return {
          success: true,
          actualAmount: -request.amount,
          overflow: 0,
          newValue,
          hitLimit: false,
          error: undefined
        }
      }
      
      case 'set': {
        const newValue = Math.max(0, request.amount)
        seeds.set(request.itemId, newValue)
        
        return {
          success: true,
          actualAmount: newValue - oldValue,
          overflow: 0,
          newValue,
          hitLimit: false,
          error: undefined
        }
      }
      
      default:
        return {
          success: false,
          actualAmount: 0,
          overflow: 0,
          newValue: oldValue,
          hitLimit: false,
          error: `Unsupported seed operation: ${request.operation}`
        }
    }
  }

  /**
   * Process material changes with storage limits
   */
  private processMaterialChange(request: ResourceChangeRequest): ResourceChangeResult {
    if (!request.itemId) {
      return {
        success: false,
        actualAmount: 0,
        overflow: 0,
        newValue: 0,
        hitLimit: false,
        error: 'Material ID is required for material operations'
      }
    }

    // Normalize material name
    const normalizedName = CSVDataParser.normalizeMaterialName(request.itemId)
    if (!normalizedName) {
      return {
        success: false,
        actualAmount: 0,
        overflow: 0,
        newValue: 0,
        hitLimit: false,
        error: `Invalid material name: ${request.itemId}`
      }
    }

    const materials = this.gameState.resources.materials
    const oldValue = materials.get(normalizedName) || 0

    switch (request.operation) {
      case 'add': {
        const storageLimit = this.getStorageLimit(normalizedName)
        
        const newValue = request.enforceLimit !== false 
          ? Math.min(storageLimit, oldValue + request.amount)
          : oldValue + request.amount
        
        const actualAmount = newValue - oldValue
        const overflow = request.amount - actualAmount
        
        materials.set(normalizedName, newValue)
        
        return {
          success: true,
          actualAmount,
          overflow,
          newValue,
          hitLimit: overflow > 0,
          error: undefined
        }
      }
      
      case 'subtract': {
        if (oldValue < request.amount) {
          return {
            success: false,
            actualAmount: 0,
            overflow: 0,
            newValue: oldValue,
            hitLimit: false,
            error: `Insufficient materials: need ${request.amount} ${normalizedName}, have ${oldValue}`
          }
        }
        
        const newValue = oldValue - request.amount
        materials.set(normalizedName, newValue)
        
        return {
          success: true,
          actualAmount: -request.amount,
          overflow: 0,
          newValue,
          hitLimit: false,
          error: undefined
        }
      }
      
      case 'set': {
        const storageLimit = this.getStorageLimit(normalizedName)
        const newValue = request.enforceLimit !== false
          ? Math.min(storageLimit, Math.max(0, request.amount))
          : Math.max(0, request.amount)
        
        const actualAmount = newValue - oldValue
        materials.set(normalizedName, newValue)
        
        return {
          success: true,
          actualAmount,
          overflow: 0,
          newValue,
          hitLimit: false,
          error: undefined
        }
      }
      
      default:
        return {
          success: false,
          actualAmount: 0,
          overflow: 0,
          newValue: oldValue,
          hitLimit: false,
          error: `Unsupported material operation: ${request.operation}`
        }
    }
  }

  /**
   * Get storage limit for a material based on upgrades
   */
  private getStorageLimit(materialName: string): number {
    const limits = MATERIAL_STORAGE_LIMITS[materialName as keyof typeof MATERIAL_STORAGE_LIMITS]
    if (!limits) {
      // Default limit for unknown materials
      return 50
    }

    let tierIndex = 0
    const upgrades = this.gameState.progression.unlockedUpgrades

    // Find highest unlocked tier
    for (let i = 0; i < STORAGE_UPGRADES.length; i++) {
      if (upgrades.includes(STORAGE_UPGRADES[i])) {
        tierIndex = i + 1
      }
    }

    // Return appropriate limit
    if (tierIndex === 0) {
      return limits.base
    } else {
      const tierLimitIndex = tierIndex - 1
      return tierLimitIndex < limits.tiers.length 
        ? limits.tiers[tierLimitIndex] 
        : limits.tiers[limits.tiers.length - 1]
    }
  }

  /**
   * Check if enough resources exist for a set of requirements
   */
  canAfford(requirements: { [key: string]: number }): boolean {
    for (const [resource, amount] of Object.entries(requirements)) {
      const normalizedName = CSVDataParser.normalizeMaterialName(resource)
      
      if (resource === 'energy') {
        if (this.gameState.resources.energy.current < amount) return false
      } else if (resource === 'gold') {
        if (this.gameState.resources.gold < amount) return false
      } else if (resource === 'water') {
        if (this.gameState.resources.water.current < amount) return false
      } else if (normalizedName) {
        const available = this.gameState.resources.materials.get(normalizedName) || 0
        if (available < amount) return false
      } else {
        // Check seeds
        const available = this.gameState.resources.seeds.get(resource) || 0
        if (available < amount) return false
      }
    }
    
    return true
  }

  /**
   * Get current resource amounts
   */
  getResourceAmounts(): { [key: string]: number } {
    const amounts: { [key: string]: number } = {
      energy: this.gameState.resources.energy.current,
      gold: this.gameState.resources.gold,
      water: this.gameState.resources.water.current
    }

    // Add seeds
    for (const [seedType, amount] of this.gameState.resources.seeds.entries()) {
      amounts[`seed_${seedType}`] = amount
    }

    // Add materials
    for (const [material, amount] of this.gameState.resources.materials.entries()) {
      amounts[material] = amount
    }

    return amounts
  }
}
