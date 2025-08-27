// GameState Types - Phase 6A Implementation
// Aligned with parameter structure and simulation requirements

/**
 * Game time tracking with multiple precision levels
 */
export interface TimeState {
  day: number
  hour: number        // 0-23
  minute: number      // 0-59
  totalMinutes: number // Total elapsed since simulation start
  speed: number       // Current simulation speed multiplier
}

/**
 * Resource tracking aligned with parameter expectations
 */
export interface ResourceState {
  energy: {
    current: number
    max: number
    regenRate: number     // Per minute
  }
  gold: number
  water: {
    current: number
    max: number
    pumpRate: number      // Per minute when pumping
  }
  seeds: {
    [cropType: string]: number
  }
  materials: {
    [materialId: string]: number
  }
}

/**
 * Game progression state
 */
export interface ProgressionState {
  heroLevel: number
  experience: number
  farmStage: number           // Land expansion level
  currentPhase: string        // Early, Mid, Late game phase
  completedAdventures: string[]
  unlockedUpgrades: string[]
  unlockedAreas: string[]
  victoryConditionsMet: boolean
}

/**
 * Tool and equipment state
 */
export interface ToolState {
  id: string
  durability: number
  maxDurability: number
  isEquipped: boolean
}

export interface WeaponState {
  id: string
  durability: number
  maxDurability: number
  isEquipped: boolean
  level: number
}

export interface ArmorState {
  id: string
  durability: number
  maxDurability: number
  isEquipped: boolean
}

/**
 * Player inventory
 */
export interface InventoryState {
  tools: Map<string, ToolState>
  weapons: Map<string, WeaponState>
  armor: Map<string, ArmorState>
  capacity: number
  currentWeight: number
}

/**
 * Crop growing state
 */
export interface CropState {
  plotId: string
  cropId: string
  plantedAt: number        // Total minutes when planted
  growthTimeRequired: number
  waterLevel: number
  isWithered: boolean
  readyToHarvest: boolean
}

/**
 * Adventure state
 */
export interface AdventureState {
  adventureId: string
  startedAt: number        // Total minutes when started
  duration: number         // Expected duration in minutes
  progress: number         // 0-1
  rewards: {
    experience: number
    gold: number
    items: string[]
  }
  isComplete: boolean
}

/**
 * Crafting process state
 */
export interface CraftingState {
  itemId: string
  startedAt: number
  duration: number
  progress: number         // 0-1
  heat: number            // For forge items
  isComplete: boolean
}

/**
 * Mining process state
 */
export interface MiningState {
  depth: number
  energyDrain: number     // Per minute
  isActive: boolean
  timeAtDepth: number
}

/**
 * Active processes
 */
export interface ProcessState {
  crops: CropState[]
  adventure: AdventureState | null
  crafting: CraftingState[]
  mining: MiningState | null
}

/**
 * Helper (gnome) state
 */
export interface GnomeState {
  id: string
  name: string
  role: string            // From helper parameters
  efficiency: number
  isAssigned: boolean
  currentTask: string | null
  experience: number
}

/**
 * Helper management state
 */
export interface HelperState {
  gnomes: GnomeState[]
  housingCapacity: number
  availableRoles: string[]
  rescueQueue: string[]   // Priority order from parameters
}

/**
 * Game screen tracking
 */
export type GameScreen = 'farm' | 'tower' | 'town' | 'adventure' | 'forge' | 'mine' | 'menu'

/**
 * Location and navigation state
 */
export interface LocationState {
  currentScreen: GameScreen
  timeOnScreen: number     // Minutes spent on current screen
  screenHistory: GameScreen[]
  navigationReason: string // Why the AI moved to this screen
}

/**
 * Automation state aligned with farm parameters
 */
export interface AutomationState {
  plantingEnabled: boolean
  plantingStrategy: string         // From farm.automation.plantingStrategy
  wateringEnabled: boolean
  harvestingEnabled: boolean
  autoCleanupEnabled: boolean
  
  // Current automation targets
  targetCrops: Map<string, number> // From parameters
  wateringThreshold: number
  energyReserve: number
}

/**
 * Priority queues from drag-and-drop parameter lists
 */
export interface PriorityState {
  cleanupOrder: string[]           // From farm.landExpansion.prioritizeCleanupOrder
  toolCrafting: string[]          // From town.blueprintStrategy.toolPriorities
  helperRescue: string[]          // From helpers.acquisition.rescueOrder
  adventurePriority: string[]     // From adventure.routing.priorityOrder
  vendorPriority: string[]        // From town.purchasing.vendorPriorities
}

/**
 * Complete game state for simulation
 */
export interface GameState {
  time: TimeState
  resources: ResourceState
  progression: ProgressionState
  inventory: InventoryState
  processes: ProcessState
  helpers: HelperState
  location: LocationState
  automation: AutomationState
  priorities: PriorityState
}

/**
 * Game action types for decision making
 */
export interface GameAction {
  id: string
  type: 'move' | 'plant' | 'water' | 'harvest' | 'adventure' | 'craft' | 'purchase' | 'rescue' | 'mine' | 'wait'
  screen: GameScreen
  target?: string          // Item ID, plot ID, etc.
  duration: number         // Expected duration in minutes
  energyCost: number
  goldCost: number
  prerequisites: string[]
  expectedRewards: {
    experience?: number
    gold?: number
    items?: string[]
    resources?: { [key: string]: number }
  }
  score?: number          // AI scoring for decision making
}

/**
 * Result of a simulation tick
 */
export interface TickResult {
  gameState: GameState
  executedActions: GameAction[]
  events: GameEvent[]
  deltaTime: number        // Minutes that passed this tick
  isComplete: boolean      // Victory conditions met
  isStuck: boolean         // Bottleneck detected
}

/**
 * Game events for logging and analysis
 */
export interface GameEvent {
  timestamp: number        // Total minutes when event occurred
  type: string
  description: string
  data?: any
  importance: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Serializable version of GameState for Web Worker communication
 */
export interface SerializedGameState {
  time: TimeState
  resources: ResourceState
  progression: ProgressionState
  inventory: {
    tools: Array<[string, ToolState]>       // Map serialized
    weapons: Array<[string, WeaponState]>   // Map serialized
    armor: Array<[string, ArmorState]>      // Map serialized
    capacity: number
    currentWeight: number
  }
  processes: ProcessState
  helpers: HelperState
  location: LocationState
  automation: {
    plantingEnabled: boolean
    plantingStrategy: string
    wateringEnabled: boolean
    harvestingEnabled: boolean
    autoCleanupEnabled: boolean
    targetCrops: Array<[string, number]>    // Map serialized
    wateringThreshold: number
    energyReserve: number
  }
  priorities: PriorityState
}
