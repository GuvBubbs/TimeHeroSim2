// WidgetDataAdapter - Transforms GameState to widget-friendly formats
// Handles Map->Object conversion and provides safe defaults

import type { GameState, GameAction, GameEvent } from '@/types'

export interface WidgetCurrentAction {
  action: GameAction | null
  progress: number
  timeRemaining: number
  nextAction: GameAction | null
}

export interface WidgetFarmGrid {
  plots: Array<{
    id: string
    index: number
    state: 'empty' | 'growing' | 'ready' | 'withered' | 'locked'
    cropId?: string
    cropName?: string
    waterLevel: number
    growthProgress: number
    position: { x: number; y: number }
  }>
  summary: {
    ready: number
    growing: number  
    empty: number
    locked: number
    totalPlots: number
  }
  heroPosition?: { x: number; y: number }
}

export interface WidgetHelper {
  id: string
  name: string
  level: number
  role: string
  efficiency: number
  isAssigned: boolean
  currentTask: string | null
  experience: number
}

export interface WidgetHelpers {
  gnomes: WidgetHelper[]
  housingCapacity: number
  currentHoused: number
  availableRoles: string[]
  rescueQueue: string[]
}

export interface WidgetEquipment {
  tools: Record<string, {
    name: string
    level: number
    isEquipped: boolean
    durability?: number
    maxDurability?: number
  }>
  weapons: Record<string, {
    name: string
    level: number
    damage: number
    isEquipped: boolean
    durability?: number
    maxDurability?: number
  }>
  armor: Record<string, {
    name: string
    defense: number
    isEquipped: boolean
    durability?: number
    maxDurability?: number
  }>
}

export interface WidgetTimelineEvent {
  id: string
  timestamp: number
  type: string
  description: string
  importance: 'low' | 'medium' | 'high'
  data?: any
}

export interface WidgetTimeline {
  recentEvents: WidgetTimelineEvent[]
  eventsByType: Record<string, number>
  importantMilestones: WidgetTimelineEvent[]
}

export interface WidgetUpgradeNode {
  id: string
  name: string
  isUnlocked: boolean
  isVisible: boolean
  prerequisites: string[]
  cost: Record<string, number>
  category: string
  phase: string
}

export interface WidgetUpgrades {
  unlockedUpgrades: WidgetUpgradeNode[]
  availableUpgrades: WidgetUpgradeNode[]
  lockedUpgrades: WidgetUpgradeNode[]
  upgradesByPhase: Record<string, WidgetUpgradeNode[]>
  progressionPath: string[]
}

export interface WidgetPhaseProgress {
  currentPhase: string
  phaseProgress: number
  nextMilestone: string
  milestonesCompleted: string[]
  milestonesRemaining: string[]
  estimatedTimeToNext: number
}

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
  static transformAll(gameState: GameState | null, recentEvents?: GameEvent[]) {
    return {
      resources: this.transformResources(gameState),
      progression: this.transformProgression(gameState),
      location: this.transformLocation(gameState),
      time: this.transformTime(gameState),
      processes: this.transformProcesses(gameState),
      currentAction: this.transformCurrentAction(gameState),
      farmGrid: this.transformFarmVisualization(gameState),
      helpers: this.transformHelpers(gameState),
      equipment: this.transformEquipment(gameState),
      timeline: this.transformTimeline(gameState, recentEvents),
      upgrades: this.transformUpgrades(gameState),
      phaseProgress: this.transformPhaseProgress(gameState),
      inventory: this.transformInventory(gameState)
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

  /**
   * Transforms current action data from processes
   */
  static transformCurrentAction(gameState: GameState | null): WidgetCurrentAction {
    if (!gameState?.processes) {
      return {
        action: null,
        progress: 0,
        timeRemaining: 0,
        nextAction: null
      }
    }

    const processes = gameState.processes
    let currentAction: GameAction | null = null
    let progress = 0
    let timeRemaining = 0

    // Check for ongoing adventure
    if (processes.adventure && !processes.adventure.isComplete) {
      const adventure = processes.adventure
      currentAction = {
        id: adventure.adventureId || 'adventure',
        type: 'adventure',
        screen: 'adventure',
        target: adventure.adventureId || 'Unknown Route',
        duration: adventure.duration || 15,
        energyCost: adventure.energyCost || 20,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: adventure.rewards || {}
      }
      progress = (adventure.progress || 0) * 100
      timeRemaining = Math.max(0, (adventure.duration || 15) * (1 - (adventure.progress || 0)))
    }
    // Check for ongoing crafting
    else if (processes.crafting && processes.crafting.length > 0) {
      const crafting = processes.crafting[0]
      currentAction = {
        id: crafting.itemId || 'craft',
        type: 'craft',
        screen: 'forge',
        target: crafting.itemId || 'Unknown Item',
        duration: crafting.duration || 10,
        energyCost: 10,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: { items: [crafting.itemId] }
      }
      progress = (crafting.progress || 0) * 100
      timeRemaining = Math.max(0, (crafting.duration || 10) * (1 - (crafting.progress || 0)))
    }
    // Check for active mining
    else if (processes.mining && processes.mining.isActive) {
      const mining = processes.mining
      currentAction = {
        id: 'mining',
        type: 'mine',
        screen: 'mine',
        target: `Depth ${mining.depth || 1}`,
        duration: 0, // Continuous
        energyCost: mining.energyDrain || 3,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: { resources: { stone: 5, iron: 2 } }
      }
      progress = 0 // Continuous activity
      timeRemaining = 0
    }

    return {
      action: currentAction,
      progress,
      timeRemaining,
      nextAction: null // TODO: Implement next action prediction
    }
  }

  /**
   * Transforms crop data to farm visualization grid
   */
  static transformFarmVisualization(gameState: GameState | null): WidgetFarmGrid {
    if (!gameState?.processes?.crops || !gameState.progression?.farmPlots) {
      return {
        plots: [],
        summary: { ready: 0, growing: 0, empty: 0, locked: 0, totalPlots: 0 },
        heroPosition: { x: 2, y: 2 }
      }
    }

    const totalPlots = gameState.progression.farmPlots || 4
    const crops = gameState.processes.crops || []
    const plotsPerRow = 5 // Grid width
    const maxPlots = 50 // Maximum possible plots

    // Create plot grid
    const plots = []
    const cropMap = new Map(crops.map(crop => [crop.plotId, crop]))

    for (let i = 0; i < maxPlots; i++) {
      const plotId = `plot_${i + 1}`
      const x = i % plotsPerRow
      const y = Math.floor(i / plotsPerRow)
      
      let state: 'empty' | 'growing' | 'ready' | 'withered' | 'locked' = 'locked'
      let cropId = undefined
      let cropName = undefined
      let waterLevel = 0
      let growthProgress = 0

      if (i < totalPlots) {
        const crop = cropMap.get(plotId)
        if (crop) {
          if (crop.isWithered) {
            state = 'withered'
          } else if (crop.readyToHarvest) {
            state = 'ready'
          } else {
            state = 'growing'
          }
          cropId = crop.cropId
          cropName = this.formatCropName(crop.cropId)
          waterLevel = crop.waterLevel || 0
          
          // Calculate growth progress
          if (gameState.time) {
            const elapsed = gameState.time.totalMinutes - crop.plantedAt
            growthProgress = Math.min(elapsed / crop.growthTimeRequired, 1.0)
          }
        } else {
          state = 'empty'
        }
      }

      plots.push({
        id: plotId,
        index: i,
        state,
        cropId,
        cropName,
        waterLevel,
        growthProgress,
        position: { x, y }
      })
    }

    // Calculate summary
    const summary = {
      ready: plots.filter(p => p.state === 'ready').length,
      growing: plots.filter(p => p.state === 'growing').length,
      empty: plots.filter(p => p.state === 'empty').length,
      locked: plots.filter(p => p.state === 'locked').length,
      totalPlots
    }

    return {
      plots,
      summary,
      heroPosition: { x: 2, y: 2 } // Fixed position for now
    }
  }

  /**
   * Transforms helper/gnome data
   */
  static transformHelpers(gameState: GameState | null): WidgetHelpers {
    if (!gameState?.helpers) {
      return {
        gnomes: [],
        housingCapacity: 0,
        currentHoused: 0,
        availableRoles: [],
        rescueQueue: []
      }
    }

    const helpers = gameState.helpers
    const gnomes: WidgetHelper[] = (helpers.gnomes || []).map(gnome => ({
      id: gnome.id || 'unknown',
      name: gnome.name || this.formatHelperName(gnome.id),
      level: this.calculateHelperLevel(gnome.efficiency || 1.0),
      role: gnome.role || 'Unassigned',
      efficiency: gnome.efficiency || 1.0,
      isAssigned: gnome.isAssigned || false,
      currentTask: gnome.currentTask || null,
      experience: gnome.experience || 0
    }))

    return {
      gnomes,
      housingCapacity: helpers.housingCapacity || 0,
      currentHoused: gnomes.filter(g => g.isAssigned).length,
      availableRoles: helpers.availableRoles || ['waterer', 'harvester', 'planter'],
      rescueQueue: helpers.rescueQueue || []
    }
  }

  /**
   * Transforms equipment data (enhanced version of transformInventory)
   */
  static transformEquipment(gameState: GameState | null): WidgetEquipment {
    if (!gameState?.inventory) {
      return {
        tools: {},
        weapons: {},
        armor: {}
      }
    }

    const inventory = gameState.inventory

    // Transform tools
    const tools: Record<string, any> = {}
    if (inventory.tools instanceof Map) {
      inventory.tools.forEach((data, type) => {
        tools[type] = {
          name: this.formatItemName(type),
          level: data.level || 1,
          isEquipped: data.isEquipped || false,
          durability: data.durability,
          maxDurability: data.maxDurability
        }
      })
    }

    // Transform weapons
    const weapons: Record<string, any> = {}
    if (inventory.weapons instanceof Map) {
      inventory.weapons.forEach((data, type) => {
        weapons[type] = {
          name: this.formatItemName(type),
          level: data.level || 1,
          damage: data.damage || 10,
          isEquipped: data.isEquipped || false,
          durability: data.durability,
          maxDurability: data.maxDurability
        }
      })
    }

    // Transform armor
    const armor: Record<string, any> = {}
    if (inventory.armor instanceof Map) {
      inventory.armor.forEach((data, type) => {
        armor[type] = {
          name: this.formatItemName(type),
          defense: data.defense || 5,
          isEquipped: data.isEquipped || false,
          durability: data.durability,
          maxDurability: data.maxDurability
        }
      })
    }

    return {
      tools,
      weapons,
      armor
    }
  }

  /**
   * Transforms timeline events for timeline widget
   */
  static transformTimeline(gameState: GameState | null, recentEvents?: GameEvent[]): WidgetTimeline {
    const events: WidgetTimelineEvent[] = []
    const eventsByType: Record<string, number> = {}

    // Transform recent events if provided
    if (recentEvents) {
      recentEvents.slice(0, 50).forEach(event => {
        const widgetEvent: WidgetTimelineEvent = {
          id: `event_${event.timestamp}`,
          timestamp: event.timestamp,
          type: event.type,
          description: event.description,
          importance: event.importance,
          data: (event as any).data
        }
        events.push(widgetEvent)
        eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
      })
    }

    // Identify important milestones
    const importantMilestones = events.filter(event => 
      event.importance === 'high' || 
      ['phase_transition', 'adventure_complete', 'farm_stage_transition'].includes(event.type)
    )

    return {
      recentEvents: events,
      eventsByType,
      importantMilestones
    }
  }

  /**
   * Transforms upgrade data for mini upgrade tree
   */
  static transformUpgrades(gameState: GameState | null): WidgetUpgrades {
    if (!gameState?.progression) {
      return {
        unlockedUpgrades: [],
        availableUpgrades: [],
        lockedUpgrades: [],
        upgradesByPhase: {},
        progressionPath: []
      }
    }

    const progression = gameState.progression
    const unlockedIds = progression.unlockedUpgrades || []
    
    // Mock upgrade data for now - in real implementation would query gameDataStore
    const allUpgrades: WidgetUpgradeNode[] = [
      {
        id: 'watering_can_i',
        name: 'Watering Can I',
        isUnlocked: unlockedIds.includes('watering_can_i'),
        isVisible: true,
        prerequisites: [],
        cost: { gold: 50 },
        category: 'tool',
        phase: 'Early'
      },
      {
        id: 'hoe_i',
        name: 'Hoe I',
        isUnlocked: unlockedIds.includes('hoe_i'),
        isVisible: true,
        prerequisites: [],
        cost: { gold: 75 },
        category: 'tool',
        phase: 'Early'
      },
      {
        id: 'storage_shed_i',
        name: 'Storage Shed I',
        isUnlocked: unlockedIds.includes('storage_shed_i'),
        isVisible: unlockedIds.includes('watering_can_i'),
        prerequisites: ['watering_can_i'],
        cost: { gold: 200 },
        category: 'infrastructure',
        phase: 'Early'
      }
    ]

    const unlockedUpgrades = allUpgrades.filter(u => u.isUnlocked)
    const availableUpgrades = allUpgrades.filter(u => !u.isUnlocked && u.isVisible && 
      u.prerequisites.every(prereq => unlockedIds.includes(prereq)))
    const lockedUpgrades = allUpgrades.filter(u => !u.isUnlocked && (!u.isVisible || 
      !u.prerequisites.every(prereq => unlockedIds.includes(prereq))))

    const upgradesByPhase: Record<string, WidgetUpgradeNode[]> = {}
    allUpgrades.forEach(upgrade => {
      if (!upgradesByPhase[upgrade.phase]) {
        upgradesByPhase[upgrade.phase] = []
      }
      upgradesByPhase[upgrade.phase].push(upgrade)
    })

    return {
      unlockedUpgrades,
      availableUpgrades,
      lockedUpgrades,
      upgradesByPhase,
      progressionPath: unlockedIds
    }
  }

  /**
   * Transforms phase progress data
   */
  static transformPhaseProgress(gameState: GameState | null): WidgetPhaseProgress {
    if (!gameState?.progression) {
      return {
        currentPhase: 'Early',
        phaseProgress: 0,
        nextMilestone: 'Expand Farm',
        milestonesCompleted: [],
        milestonesRemaining: ['Expand Farm', 'Build Tools', 'Explore World'],
        estimatedTimeToNext: 0
      }
    }

    const progression = gameState.progression
    const currentPhase = progression.currentPhase || 'Early'
    
    // Calculate phase progress based on farm plots and hero level
    let phaseProgress = 0
    let nextMilestone = 'Unknown'
    let milestonesCompleted: string[] = []
    let milestonesRemaining: string[] = []

    switch (currentPhase) {
      case 'Tutorial':
      case 'Early':
        phaseProgress = Math.min((progression.farmPlots / 20) * 100, 100)
        nextMilestone = progression.farmPlots >= 10 ? 'Mid Game' : 'Expand Farm to 10 plots'
        milestonesCompleted = progression.farmPlots >= 5 ? ['Basic Farm Setup'] : []
        milestonesRemaining = progression.farmPlots < 20 ? ['Expand Farm', 'Build Tools'] : ['Enter Mid Game']
        break
      case 'Mid':
        phaseProgress = Math.min(((progression.farmPlots - 20) / 40) * 100, 100)
        nextMilestone = progression.farmPlots >= 40 ? 'Late Game' : 'Expand Farm to 40 plots'
        milestonesCompleted = ['Basic Farm Setup', 'Tool Crafting']
        milestonesRemaining = progression.farmPlots < 60 ? ['Large Farm', 'Advanced Tools'] : ['Enter Late Game']
        break
      case 'Late':
        phaseProgress = Math.min(((progression.farmPlots - 60) / 30) * 100, 100)
        nextMilestone = progression.farmPlots >= 90 ? 'Victory' : 'Great Estate (90 plots)'
        milestonesCompleted = ['Basic Farm Setup', 'Tool Crafting', 'Large Farm']
        milestonesRemaining = progression.farmPlots < 90 ? ['Great Estate', 'Master Level'] : ['Victory']
        break
      default:
        phaseProgress = 100
        nextMilestone = 'Victory Achieved'
        milestonesCompleted = ['Basic Farm Setup', 'Tool Crafting', 'Large Farm', 'Great Estate']
        milestonesRemaining = []
    }

    // Estimate time to next milestone (rough calculation)
    const plotsPerDay = 2 // Rough estimate
    const plotsNeeded = Math.max(0, this.getNextMilestonePlots(currentPhase) - progression.farmPlots)
    const estimatedTimeToNext = plotsNeeded / plotsPerDay

    return {
      currentPhase,
      phaseProgress,
      nextMilestone,
      milestonesCompleted,
      milestonesRemaining,
      estimatedTimeToNext
    }
  }

  // Helper methods
  private static formatCropName(cropId: string): string {
    return cropId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  private static formatHelperName(id: string): string {
    return id.replace('_gnome', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  private static formatItemName(itemId: string): string {
    return itemId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  private static calculateHelperLevel(efficiency: number): number {
    // Convert efficiency (1.0-2.0) to level (1-10)
    return Math.floor((efficiency - 1.0) / 0.1) + 1
  }

  private static getNextMilestonePlots(phase: string): number {
    switch (phase) {
      case 'Tutorial':
      case 'Early': return 20
      case 'Mid': return 60
      case 'Late': return 90
      default: return 90
    }
  }
}
