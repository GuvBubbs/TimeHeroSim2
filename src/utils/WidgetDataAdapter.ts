// WidgetDataAdapter - Transforms GameState to widget-friendly formats
// Handles Map->Object conversion and provides safe defaults

import type { GameState } from '@/types'

export interface WidgetResources {
  energy: {
    current: number
    max: number
    regenerationRate: number
  }
  gold: number
  water: {
    current: number
    max: number
    autoGenRate: number
  }
  seeds: Record<string, number>
  materials: Record<string, number>
}

export interface WidgetProgression {
  heroLevel: number
  experience: number
  farmStage: number
  farmPlots: number
  availablePlots: number
  currentPhase: string
  completedAdventures: string[]
  unlockedUpgrades: string[]
  unlockedAreas: string[]
}

export interface WidgetLocation {
  currentScreen: string
  timeOnScreen: number
  navigationReason: string
}

export interface WidgetTime {
  day: number
  hour: number
  minute: number
  totalMinutes: number
  speed: number
}

export interface WidgetProcesses {
  crops: Array<{
    plotId: string
    cropId: string
    plantedAt: number
    growthTimeRequired: number
    waterLevel: number
    isWithered: boolean
    readyToHarvest: boolean
  }>
  adventure: any | null
  crafting: any[]
  mining: any | null
}

export class WidgetDataAdapter {
  /**
   * Transforms GameState to widget-friendly resource format
   */
  static transformResources(gameState: GameState | null): WidgetResources {
    if (!gameState?.resources) {
      return {
        energy: { current: 0, max: 100, regenerationRate: 1 },
        gold: 0,
        water: { current: 0, max: 100, autoGenRate: 10 },
        seeds: {},
        materials: {}
      }
    }

    const resources = gameState.resources

    // Convert Maps to plain objects for widget consumption
    const seeds: Record<string, number> = {}
    if (resources.seeds instanceof Map) {
      resources.seeds.forEach((count, type) => {
        seeds[type] = count
      })
    } else if (resources.seeds && typeof resources.seeds === 'object') {
      Object.assign(seeds, resources.seeds)
    }

    const materials: Record<string, number> = {}
    if (resources.materials instanceof Map) {
      resources.materials.forEach((count, type) => {
        materials[type] = count
      })
    } else if (resources.materials && typeof resources.materials === 'object') {
      Object.assign(materials, resources.materials)
    }

    return {
      energy: {
        current: resources.energy?.current || 0,
        max: resources.energy?.max || 100,
        regenerationRate: resources.energy?.regenerationRate || 1
      },
      gold: resources.gold || 0,
      water: {
        current: resources.water?.current || 0,
        max: resources.water?.max || 100,
        autoGenRate: resources.water?.autoGenRate || 10
      },
      seeds,
      materials
    }
  }

  /**
   * Transforms GameState to widget-friendly progression format
   */
  static transformProgression(gameState: GameState | null): WidgetProgression {
    if (!gameState?.progression) {
      return {
        heroLevel: 1,
        experience: 0,
        farmStage: 1,
        farmPlots: 4,
        availablePlots: 4,
        currentPhase: 'Early',
        completedAdventures: [],
        unlockedUpgrades: [],
        unlockedAreas: ['farm']
      }
    }

    const progression = gameState.progression

    return {
      heroLevel: progression.heroLevel || 1,
      experience: progression.experience || 0,
      farmStage: progression.farmStage || 1,
      farmPlots: progression.farmPlots || 4,
      availablePlots: progression.availablePlots || 4,
      currentPhase: progression.currentPhase || 'Early',
      completedAdventures: progression.completedAdventures || [],
      unlockedUpgrades: progression.unlockedUpgrades || [],
      unlockedAreas: progression.unlockedAreas || ['farm']
    }
  }

  /**
   * Transforms GameState to widget-friendly location format
   */
  static transformLocation(gameState: GameState | null): WidgetLocation {
    if (!gameState?.location) {
      return {
        currentScreen: 'farm',
        timeOnScreen: 0,
        navigationReason: 'Initial state'
      }
    }

    return {
      currentScreen: gameState.location.currentScreen || 'farm',
      timeOnScreen: gameState.location.timeOnScreen || 0,
      navigationReason: gameState.location.navigationReason || 'Unknown'
    }
  }

  /**
   * Transforms GameState to widget-friendly time format
   */
  static transformTime(gameState: GameState | null): WidgetTime {
    if (!gameState?.time) {
      return {
        day: 1,
        hour: 8,
        minute: 0,
        totalMinutes: 480,
        speed: 1
      }
    }

    return {
      day: gameState.time.day || 1,
      hour: gameState.time.hour || 8,
      minute: gameState.time.minute || 0,
      totalMinutes: gameState.time.totalMinutes || 480,
      speed: gameState.time.speed || 1
    }
  }

  /**
   * Transforms GameState to widget-friendly processes format
   */
  static transformProcesses(gameState: GameState | null): WidgetProcesses {
    if (!gameState?.processes) {
      return {
        crops: [],
        adventure: null,
        crafting: [],
        mining: null
      }
    }

    return {
      crops: gameState.processes.crops || [],
      adventure: gameState.processes.adventure || null,
      crafting: gameState.processes.crafting || [],
      mining: gameState.processes.mining || null
    }
  }

  /**
   * Transforms full GameState to all widget formats
   */
  static transformAll(gameState: GameState | null) {
    return {
      resources: this.transformResources(gameState),
      progression: this.transformProgression(gameState),
      location: this.transformLocation(gameState),
      time: this.transformTime(gameState),
      processes: this.transformProcesses(gameState)
    }
  }

  /**
   * Validates that a GameState has the expected structure
   */
  static validateGameState(gameState: any): boolean {
    if (!gameState) return false
    
    // Check required top-level properties
    const requiredProps = ['time', 'resources', 'progression', 'location', 'processes']
    for (const prop of requiredProps) {
      if (!gameState[prop]) {
        console.warn(`WidgetDataAdapter: GameState missing required property: ${prop}`)
        return false
      }
    }

    return true
  }

  /**
   * Safely extracts inventory data from GameState
   */
  static transformInventory(gameState: GameState | null) {
    if (!gameState?.inventory) {
      return {
        tools: {},
        weapons: {},
        armor: {},
        capacity: 100,
        currentWeight: 0
      }
    }

    const inventory = gameState.inventory

    // Convert Maps to plain objects
    const tools: Record<string, any> = {}
    if (inventory.tools instanceof Map) {
      inventory.tools.forEach((data, type) => {
        tools[type] = data
      })
    }

    const weapons: Record<string, any> = {}
    if (inventory.weapons instanceof Map) {
      inventory.weapons.forEach((data, type) => {
        weapons[type] = data
      })
    }

    const armor: Record<string, any> = {}
    if (inventory.armor instanceof Map) {
      inventory.armor.forEach((data, type) => {
        armor[type] = data
      })
    }

    return {
      tools,
      weapons,
      armor,
      capacity: inventory.capacity || 100,
      currentWeight: inventory.currentWeight || 0
    }
  }
}
