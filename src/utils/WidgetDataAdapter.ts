// WidgetDataAdapter - Transforms GameState to widget-friendly formats
// Handles Map->Object conversion and provides safe defaults

import type { GameState, GameAction, GameEvent } from '@/types'
import { useGameDataStore } from '@/stores/gameData'

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
   * Transforms current action data from processes with enhanced action detection
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
    // Check for farm actions in progress
    else if (processes.crops && processes.crops.length > 0) {
      // Check if any crops are actively being worked on
      const activeCrop = processes.crops.find(crop => 
        crop.isBeingWorked || 
        (crop.plantedAt && !crop.readyToHarvest && !crop.isWithered)
      )
      
      if (activeCrop) {
        currentAction = {
          id: `farming_${activeCrop.cropId}`,
          type: 'plant',
          screen: 'farm',
          target: activeCrop.cropId || 'Unknown Crop',
          duration: activeCrop.growthTimeRequired || 30,
          energyCost: 5,
          goldCost: 0,
          prerequisites: [],
          expectedRewards: { crops: [activeCrop.cropId] }
        }
        
        // Calculate progress for growing crops
        if (gameState.time && activeCrop.plantedAt) {
          const elapsed = gameState.time.totalMinutes - activeCrop.plantedAt
          progress = Math.min((elapsed / activeCrop.growthTimeRequired) * 100, 100)
          timeRemaining = Math.max(0, activeCrop.growthTimeRequired - elapsed)
        }
      }
    }

    // Get next action from automation or decision system
    let nextAction: GameAction | null = null
    if (gameState.automation?.nextDecision) {
      const next = gameState.automation.nextDecision
      nextAction = {
        id: next.action || 'evaluate',
        type: next.action || 'evaluate',
        screen: 'farm', // Default screen
        target: next.target || '',
        duration: next.estimatedDuration || 0,
        energyCost: next.energyCost || 0,
        goldCost: next.goldCost || 0,
        prerequisites: [],
        score: next.priority,
        reason: next.reason
      } as GameAction & { score?: number; reason?: string }
    }

    return {
      action: currentAction,
      progress,
      timeRemaining,
      nextAction
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
   * Transforms equipment data - Complete tools/weapons/armor system
   */
  static transformEquipment(gameState: GameState | null): WidgetEquipment {
    const inventory = gameState?.inventory

    // Define all possible equipment slots
    const allTools = ['hoe', 'hammer', 'axe', 'shovel', 'pickaxe', 'watercan']
    const allWeapons = ['spear', 'sword', 'bow', 'crossbow', 'wand']
    
    // Transform tools - show all possible tools
    const tools: Record<string, any> = {}
    for (const toolName of allTools) {
      let toolData = null
      
      // Check if tool exists in inventory
      if (inventory?.tools instanceof Map) {
        toolData = inventory.tools.get(toolName)
      } else if (inventory?.tools && typeof inventory.tools === 'object') {
        toolData = (inventory.tools as any)[toolName]
      }
      
      tools[toolName] = {
        name: this.formatItemName(toolName),
        level: toolData?.level || 0,
        isEquipped: toolData?.isEquipped || false,
        durability: toolData?.durability,
        maxDurability: toolData?.maxDurability
      }
    }

    // Transform weapons - show all possible weapons
    const weapons: Record<string, any> = {}
    for (const weaponName of allWeapons) {
      let weaponData = null
      
      // Check if weapon exists in inventory
      if (inventory?.weapons instanceof Map) {
        weaponData = inventory.weapons.get(weaponName)
      } else if (inventory?.weapons && typeof inventory.weapons === 'object') {
        weaponData = (inventory.weapons as any)[weaponName]
      }
      
      weapons[weaponName] = {
        name: this.formatItemName(weaponName),
        level: weaponData?.level || 0,
        damage: weaponData?.damage || 0,
        isEquipped: weaponData?.isEquipped || false,
        durability: weaponData?.durability,
        maxDurability: weaponData?.maxDurability
      }
    }

    // Transform armor - show 3 armor slots
    const armor: Record<string, any> = {}
    const armorSlots = ['slot1', 'slot2', 'slot3']
    
    if (inventory?.armor instanceof Map) {
      const armorArray = Array.from(inventory.armor.values())
      for (let i = 0; i < 3; i++) {
        const armorPiece = armorArray[i]
        if (armorPiece) {
          armor[armorSlots[i]] = {
            name: armorPiece.name || this.formatItemName(armorPiece.type || `armor_${i+1}`),
            defense: armorPiece.defense || 0,
            effect: armorPiece.effect,
            isEquipped: armorPiece.isEquipped || false,
            durability: armorPiece.durability,
            maxDurability: armorPiece.maxDurability
          }
        }
      }
    } else if (inventory?.armor && typeof inventory.armor === 'object') {
      const armorEntries = Object.entries(inventory.armor)
      for (let i = 0; i < 3; i++) {
        if (armorEntries[i]) {
          const [key, armorPiece] = armorEntries[i]
          armor[armorSlots[i]] = {
            name: (armorPiece as any).name || this.formatItemName(key),
            defense: (armorPiece as any).defense || 0,
            effect: (armorPiece as any).effect,
            isEquipped: (armorPiece as any).isEquipped || false,
            durability: (armorPiece as any).durability,
            maxDurability: (armorPiece as any).maxDurability
          }
        }
      }
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
   * Transforms phase progress data based on CSV phase transitions
   */
  static transformPhaseProgress(gameState: GameState | null): WidgetPhaseProgress {
    if (!gameState?.progression) {
      return {
        currentPhase: 'Tutorial',
        phaseProgress: 0,
        nextMilestone: 'Complete tutorial area',
        milestonesCompleted: [],
        milestonesRemaining: ['Complete tutorial area', 'Expand Farm', 'Build Tools'],
        estimatedTimeToNext: 0
      }
    }

    const progression = gameState.progression
    const unlockedUpgrades = progression.unlockedUpgrades || []
    
    // Phase transition rules from phase_transitions.csv
    const phaseTransitions = [
      {
        id: 'tutorial_to_early',
        from: 'Tutorial',
        to: 'Early Game',
        prerequisites: ['clear_weeds_2', 'craft_hoe'],
        description: 'Complete tutorial area'
      },
      {
        id: 'early_to_mid', 
        from: 'Early Game',
        to: 'Mid Game',
        prerequisites: ['homestead_deed'],
        description: 'Reach Small Hold completion'
      },
      {
        id: 'mid_to_late',
        from: 'Mid Game', 
        to: 'Late Game',
        prerequisites: ['manor_grounds_deed'],
        description: 'Reach Homestead completion'
      },
      {
        id: 'late_to_endgame',
        from: 'Late Game',
        to: 'Endgame', 
        prerequisites: ['great_estate_deed'],
        description: 'Reach Manor Grounds completion'
      },
      {
        id: 'endgame_to_postgame',
        from: 'Endgame',
        to: 'Post-game',
        prerequisites: ['sacred_clearing'],
        description: 'Complete Great Estate'
      }
    ]
    
    // Determine current phase by checking which transitions are completed
    let currentPhase = 'Tutorial'
    let currentTransitionIndex = 0
    
    for (let i = 0; i < phaseTransitions.length; i++) {
      const transition = phaseTransitions[i]
      const hasAllPrereqs = transition.prerequisites.every(prereq => 
        unlockedUpgrades.includes(prereq)
      )
      
      if (hasAllPrereqs) {
        currentPhase = transition.to
        currentTransitionIndex = i + 1
      } else {
        break
      }
    }

    // Calculate progress toward next transition
    let phaseProgress = 0
    let nextMilestone = 'Victory Achieved'
    let estimatedTimeToNext = 0
    
    if (currentTransitionIndex < phaseTransitions.length) {
      const nextTransition = phaseTransitions[currentTransitionIndex]
      const completedPrereqs = nextTransition.prerequisites.filter(prereq =>
        unlockedUpgrades.includes(prereq)
      )
      
      phaseProgress = (completedPrereqs.length / nextTransition.prerequisites.length) * 100
      nextMilestone = nextTransition.description
      
      // Rough estimate based on missing prerequisites
      const missingPrereqs = nextTransition.prerequisites.length - completedPrereqs.length
      estimatedTimeToNext = missingPrereqs * 2 // Rough estimate: 2 days per prerequisite
    } else {
      phaseProgress = 100
      nextMilestone = 'Victory Achieved'
    }
    
    // Build milestones completed and remaining
    const milestonesCompleted: string[] = []
    const milestonesRemaining: string[] = []
    
    for (let i = 0; i < phaseTransitions.length; i++) {
      const transition = phaseTransitions[i]
      const hasAllPrereqs = transition.prerequisites.every(prereq => 
        unlockedUpgrades.includes(prereq)
      )
      
      if (hasAllPrereqs) {
        milestonesCompleted.push(transition.description)
      } else {
        milestonesRemaining.push(transition.description)
      }
    }

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


}
