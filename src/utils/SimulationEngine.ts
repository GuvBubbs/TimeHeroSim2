// SimulationEngine - Pure Orchestration Layer (Phase 9J Refactor)
// Coordinates all simulation modules without implementation details

import { MapSerializer } from './MapSerializer'
import { DecisionEngine } from './ai/DecisionEngine'
import { ActionExecutor } from './execution/ActionExecutor'
import { StateManager } from './state'
import { ProcessManager } from './processes'
import { validationService } from './validation'
import { eventBus, type IEventBus } from './events'
import { SupportSystemManager } from './systems/SupportSystemManager'
import { FarmSystem } from './systems/FarmSystem'
import { TowerSystem } from './systems/TowerSystem'
import { SeedSystem } from './systems/SeedSystem'
import type { 
  SimulationConfig, 
  AllParameters,
  GameState, 
  GameAction, 
  TickResult,
  GameEvent,
  TimeState,
  ResourceState,
  ProgressionState,
  InventoryState,
  ProcessState,
  HelperState,
  LocationState,
  AutomationState,
  PriorityState,
  GameScreen,
  BlueprintState
} from '@/types'

/**
 * Core simulation engine - Pure orchestration layer
 * All implementation details have been moved to specialized modules
 */
export class SimulationEngine {
  private config: SimulationConfig
  private gameState: GameState
  private parameters: AllParameters
  private gameDataStore: any
  private persona: any
  
  // Core modules
  private decisionEngine: DecisionEngine
  private actionExecutor: ActionExecutor
  private stateManager: StateManager
  private processManager: ProcessManager
  private eventBus: IEventBus
  
  // Runtime state
  private isRunning: boolean = false
  private tickCount: number = 0
  private lastProgressCheck?: {
    day: number
    plots: number
    level: number
    gold: number
    lastProgressDay: number
  }
  
  constructor(config: SimulationConfig, gameDataStore?: any) {
    this.config = config
    this.parameters = this.extractParametersFromConfig(config)
    
    if (!gameDataStore) {
      throw new Error('SimulationEngine requires a valid gameDataStore with CSV data')
    }
    
    this.gameDataStore = gameDataStore
    this.persona = this.extractPersonaFromConfig(config)
    this.gameState = this.initializeGameState()
    
    // Initialize all modules
    this.decisionEngine = new DecisionEngine()
    this.actionExecutor = new ActionExecutor()
    this.stateManager = new StateManager(this.gameState)
    this.processManager = new ProcessManager()
    this.actionExecutor.setStateManager(this.stateManager)
    
    // Initialize validation service
    validationService.initialize(gameDataStore)
    
    // Initialize event bus integration
    this.eventBus = eventBus
    this.setupEventBusIntegration()

    // Handle any offline time if resuming simulation
    this.handleOfflineProgression()
  }

  /**
   * Handle offline progression when resuming simulation
   */
  private handleOfflineProgression(): void {
    // In a real implementation, this would check for saved state and time difference
    // For now, this is a placeholder for the integration pattern
    const lastSaveTime = this.config.lastSaveTime || Date.now()
    const currentTime = Date.now()
    const offlineMinutes = (currentTime - lastSaveTime) / (1000 * 60)
    
    if (offlineMinutes > 5) {
      console.log(`🕒 Detected ${Math.round(offlineMinutes)} minutes offline, processing...`)
      SupportSystemManager.handleOfflineTime(this.gameState, offlineMinutes)
    }
  }

  /**
   * Main simulation tick - Pure orchestration
   */
  tick(): TickResult {
    console.log('⏰ SimulationEngine: tick() called, tickCount:', this.tickCount, 'totalMinutes:', this.gameState.time.totalMinutes, 'isRunning:', this.isRunning)
    
    const deltaTime = this.calculateDeltaTime()
    
    try {
      // 1. Update time
      this.updateTime(deltaTime)
      
      // 2. Process all ongoing activities through ProcessManager
      const processResult = this.processManager.tick(deltaTime, this.gameState, this.gameDataStore)
      
      // 3. Update game systems that aren't in ProcessManager yet
      this.updateGameSystems(deltaTime)
      
      // 4. Make AI decisions through DecisionEngine
      const decisionResult = this.decisionEngine.getNextActions(this.gameState, this.parameters, this.gameDataStore)
      const decisions = decisionResult.actions
      
      // 5. Execute actions through ActionExecutor
      const { executedActions, actionEvents } = this.executeActions(decisions)
      
      // 6. Update automation and progression
      this.updateAutomation()
      this.updatePhaseProgression()
      
      // 7. Check completion conditions
      const isComplete = this.checkVictoryConditions()
      const isStuck = this.checkBottleneckConditions()
      
      this.tickCount++
      
      // 8. Debug logging
      this.logTickResults(executedActions, decisions)
      
      return {
        gameState: this.gameState,
        executedActions,
        events: [...processResult.events.map(this.convertProcessEventToGameEvent), ...actionEvents],
        deltaTime,
        isComplete,
        isStuck
      }
    } catch (error) {
      console.error('Critical error in simulation tick:', error)
      return this.createErrorTickResult(deltaTime, error)
    }
  }

  /**
   * Get current game state (read-only)
   */
  getGameState(): Readonly<GameState> {
    return this.gameState
  }

  /**
   * Get simulation statistics
   */
  getStats() {
    return {
      tickCount: this.tickCount,
      daysPassed: Math.floor(this.gameState.time.totalMinutes / (24 * 60)),
      currentPhase: this.determineCurrentPhase()
    }
  }

  /**
   * Set simulation speed
   */
  setSpeed(speed: number): void {
    this.gameState.time.speed = Math.max(0.1, Math.min(10, speed))
  }

  // =============================================================================
  // PRIVATE ORCHESTRATION METHODS - Configuration and initialization only
  // =============================================================================

  /**
   * Extract parameters from configuration
   */
  private extractParametersFromConfig(config: SimulationConfig): AllParameters {
    let baseParameters = this.createDefaultParameters()
    
    // Apply parameter overrides
    if (config.parameterOverrides && config.parameterOverrides.size > 0) {
      baseParameters = this.applyParameterOverrides(baseParameters, config.parameterOverrides)
    }
    
    return baseParameters
  }

  /**
   * Create default parameters
   */
  private createDefaultParameters(): AllParameters {
    return {
      farm: {
        automation: { autoPlant: true, autoWater: true, autoHarvest: true },
        priorities: { cropPreference: ['carrot', 'radish'], wateringThreshold: 0.3 }
      },
      tower: {
        priorities: { upgradeOrder: ['reach', 'autocatcher', 'nets'] }
      },
      town: {
        priorities: { blueprintPreference: ['infrastructure', 'automation', 'cosmetic'] }
      },
      decisions: {
        checkins: { enabled: true, frequency: 30, urgencyThreshold: 0.7 },
        priorities: { safety: 0.8, efficiency: 0.6, exploration: 0.4 },
        interrupts: { enabled: true, emergencyMode: { threshold: 0.9, actions: [] } }
      },
      persona: { strategy: 'balanced', riskTolerance: 0.5, explorationBias: 0.3 }
    }
  }

  /**
   * Apply parameter overrides
   */
  private applyParameterOverrides(baseParameters: AllParameters, overrides: Map<string, any>): AllParameters {
    const result = JSON.parse(JSON.stringify(baseParameters))
    
    for (const [path, value] of overrides) {
      this.setParameterByPath(result, path, value)
    }
    
    return result
  }

  /**
   * Set parameter by dot notation path
   */
  private setParameterByPath(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    let current = obj
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current)) {
        current[key] = {}
      }
      current = current[key]
    }
    
    current[keys[keys.length - 1]] = value
  }

  /**
   * Merge parameters from serialized data
   */
  private mergeParameters(base: AllParameters, serialized: any): AllParameters {
    return { ...base, ...serialized }
  }

  /**
   * Extract persona from configuration
   */
  private extractPersonaFromConfig(config: SimulationConfig): any {
    if (config.quickSetup?.personaId) {
      const personaMap = {
        'speedrunner': { name: 'Speedrunner', strategy: 'aggressive', riskTolerance: 0.8, explorationBias: 0.2 },
        'casual': { name: 'Casual Player', strategy: 'balanced', riskTolerance: 0.5, explorationBias: 0.5 },
        'weekend_warrior': { name: 'Weekend Warrior', strategy: 'efficient', riskTolerance: 0.3, explorationBias: 0.7 }
      }
      return personaMap[config.quickSetup.personaId as keyof typeof personaMap] || personaMap['casual']
    }
    return { name: 'Default', strategy: 'balanced', riskTolerance: 0.5, explorationBias: 0.5 }
  }

  /**
   * Initialize game state
   */
  private initializeGameState(): GameState {
    return {
      time: {
        totalMinutes: 0,
        day: 1,
        hour: 6,
        minute: 0,
        speed: 1
      },
      resources: {
        energy: { current: 3, max: 100, regenerationRate: 0 },
        water: { current: 0, max: 20, autoGenRate: 0 },
        gold: 75,
        seeds: this.initializeSeeds(),
        materials: this.initializeMaterials()
      },
      progression: {
        heroLevel: 1,
        experience: 0,
        farmStage: 1,
        farmPlots: 3,
        availablePlots: 3,
        currentPhase: 'Tutorial',
        completedAdventures: [],
        completedCleanups: new Set(),
        unlockedUpgrades: [],
        unlockedAreas: ['farm'],
        builtStructures: new Set(['farm']),
        victoryConditionsMet: false
      },
      inventory: {
        tools: new Map(),
        weapons: new Map(),
        armor: new Map(),
        blueprints: new Map(),
        capacity: 50,
        currentWeight: 0
      },
      processes: {
        crops: [],
        adventures: [],
        training: [],
        crafting: [],
        mining: { depth: 0, energyDrain: 0, isActive: false, timeAtDepth: 0 },
        construction: []
      },
      helpers: {
        gnomes: [],
        housingCapacity: 3,
        currentHousing: 0,
        availableRoles: ['farming', 'water_management'],
        rescueQueue: []
      },
      location: {
        currentScreen: 'farm',
        timeOnScreen: 0,
        screenHistory: ['farm'],
        navigationReason: 'Initial spawn'
      },
      automation: {
        plantingEnabled: true,
        plantingStrategy: 'optimal',
        wateringEnabled: true,
        harvestingEnabled: true,
        autoCleanupEnabled: false,
        targetCrops: new Map([['carrot', 0.5], ['radish', 0.5]]),
        wateringThreshold: 0.3,
        energyReserve: 10
      },
      priorities: {
        upgradeOrder: ['farm_plots', 'water_capacity', 'energy_capacity'],
        helperRoles: ['farming', 'water_management', 'seed_collection']
      }
    }
  }

  /**
   * Initialize starting seeds
   */
  private initializeSeeds(): Map<string, number> {
    return new Map([
      ['carrot', 1],
      ['radish', 1]
    ])
  }

  /**
   * Initialize starting materials
   */
  private initializeMaterials(): Map<string, number> {
    return new Map()
  }

  // =============================================================================
  // PRIVATE ORCHESTRATION METHODS - Coordination logic only
  // =============================================================================

  /**
   * Calculate delta time for this tick
   */
  private calculateDeltaTime(): number {
    return 1 * this.gameState.time.speed
  }

  /**
   * Update game time
   */
  private updateTime(deltaTime: number): void {
    this.gameState.time.totalMinutes += deltaTime
    this.gameState.time.minute += deltaTime
    
    // Handle hour rollover
    while (this.gameState.time.minute >= 60) {
      this.gameState.time.minute -= 60
      this.gameState.time.hour += 1
    }
    
    // Handle day rollover
    while (this.gameState.time.hour >= 24) {
      this.gameState.time.hour -= 24
      this.gameState.time.day += 1
    }
    
    // Update location time tracking
    this.gameState.location.timeOnScreen += deltaTime
  }

  /**
   * Update game systems not yet in ProcessManager
   */
  private updateGameSystems(deltaTime: number): void {
    try {
      // Apply all support system effects via SupportSystemManager
      SupportSystemManager.applyEffects(this.gameState, deltaTime)
    } catch (error) {
      console.error('Error in SupportSystemManager.applyEffects:', error)
    }

    try {
      FarmSystem.processAutoPumpGeneration(this.gameState, deltaTime)
    } catch (error) {
      console.error('Error in FarmSystem.processAutoPumpGeneration:', error)
    }

    try {
      const towerReach = TowerSystem.getCurrentTowerReach(this.gameState)
      SeedSystem.processAutoCatcher(this.gameState, deltaTime, towerReach)
    } catch (error) {
      console.error('Error in SeedSystem.processAutoCatcher:', error)
    }
  }

  /**
   * Execute actions through ActionExecutor with support system validation
   */
  private executeActions(decisions: GameAction[]): { executedActions: GameAction[], actionEvents: GameEvent[] } {
    const executedActions: GameAction[] = []
    const actionEvents: GameEvent[] = []
    
    for (const action of decisions) {
      try {
        // Validate action through support systems first
        const validation = SupportSystemManager.validateAction(action, this.gameState)
        if (!validation.valid) {
          console.warn(`Action ${action.type} blocked by support system: ${validation.reason}`)
          continue
        }

        const result = this.actionExecutor.execute(action, this.gameState, this.parameters, this.gameDataStore)
        if (result.success) {
          executedActions.push(action)
          actionEvents.push(...result.events)
        } else if (result.error) {
          console.warn(`Action ${action.type} failed: ${result.error}`)
        }
      } catch (error) {
        console.error(`Error executing action ${action.type}:`, error)
      }
    }
    
    // Update DecisionEngine checkin time after successful actions
    if (executedActions.length > 0) {
      this.decisionEngine.updateLastCheckin(this.gameState)
    }
    
    return { executedActions, actionEvents }
  }

  /**
   * Update automation systems (placeholder - logic should be in dedicated modules)
   */
  private updateAutomation(): void {
    // Automation logic delegated to individual systems
  }

  /**
   * Update phase progression (placeholder - logic should be in StateManager)
   */
  private updatePhaseProgression(): void {
    // Phase progression logic delegated to StateManager
    const plots = this.gameState.progression.farmPlots
    const level = this.gameState.progression.heroLevel
    
    if (plots <= 10 && level <= 3) {
      this.gameState.progression.currentPhase = 'Tutorial'
    } else if (plots <= 30 && level <= 8) {
      this.gameState.progression.currentPhase = 'Early'
    } else if (plots <= 60 && level <= 12) {
      this.gameState.progression.currentPhase = 'Mid'
    } else {
      this.gameState.progression.currentPhase = 'Late'
    }
  }

  /**
   * Check victory conditions
   */
  private checkVictoryConditions(): boolean {
    return this.gameState.progression.farmPlots >= 90 || 
           (this.gameState.resources.gold >= 10000 && this.gameState.progression.farmPlots >= 50)
  }

  /**
   * Check bottleneck conditions
   */
  private checkBottleneckConditions(): boolean {
    if (!this.lastProgressCheck) {
      this.lastProgressCheck = {
        day: this.gameState.time.day,
        plots: this.gameState.progression.farmPlots,
        level: this.gameState.progression.heroLevel,
        gold: this.gameState.resources.gold,
        lastProgressDay: this.gameState.time.day
      }
      return false
    }

    const daysSinceLastCheck = this.gameState.time.day - this.lastProgressCheck.lastProgressDay
    
    if (daysSinceLastCheck >= 7) {
      const plotsGained = this.gameState.progression.farmPlots - this.lastProgressCheck.plots
      const goldGained = this.gameState.resources.gold - this.lastProgressCheck.gold
      
      if (plotsGained === 0 && goldGained < 100) {
        return true // Bottlenecked
      }
      
      // Update progress check
      this.lastProgressCheck = {
        day: this.gameState.time.day,
        plots: this.gameState.progression.farmPlots,
        level: this.gameState.progression.heroLevel,
        gold: this.gameState.resources.gold,
        lastProgressDay: this.gameState.time.day
      }
    }
    
    return false
  }

  /**
   * Get current tower reach (should be moved to TowerSystem)
   */
  private convertProcessEventToGameEvent(processEvent: any): GameEvent {
    return {
      timestamp: processEvent.timestamp,
      type: processEvent.type,
      description: processEvent.description,
      importance: processEvent.importance || 'low'
    }
  }

  /**
   * Create error tick result
   */
  private createErrorTickResult(deltaTime: number, error: any): TickResult {
    return {
      gameState: this.gameState,
      executedActions: [],
      events: [{
        timestamp: this.gameState.time.totalMinutes,
        type: 'error',
        description: `Simulation error: ${error}`,
        importance: 'high'
      }],
      deltaTime,
      isComplete: false,
      isStuck: true
    }
  }

  /**
   * Determine current game phase
   */
  private determineCurrentPhase(): string {
    return this.gameState.progression.currentPhase
  }

  /**
   * Log tick results for debugging
   */
  private logTickResults(executedActions: GameAction[], decisions: GameAction[]): void {
    if (this.tickCount % 10 === 0) {
      console.log(`🎮 Tick ${this.tickCount}:`, {
        energy: Math.round(this.gameState.resources.energy.current),
        water: Math.round(this.gameState.resources.water.current),
        plots: this.gameState.progression.farmPlots,
        possibleActions: decisions.length,
        executedActions: executedActions.length,
        currentHour: this.gameState.time.hour
      })
    }
    
    if (executedActions.length > 0) {
      console.log(`⚡ Tick ${this.tickCount}: Executed ${executedActions.length} actions:`, 
        executedActions.map(a => `${a.type}(${a.target})`))
    }
  }

  /**
   * Setup event bus integration
   */
  private setupEventBusIntegration(): void {
    this.eventBus.on('state_changed', (event) => {
      console.log('📊 State changed:', event.data)
    })

    this.eventBus.on('action_executed', (event) => {
      console.log('⚡ Action executed:', event.data.action.type)
    })

    this.updateEventBusMetadata()
  }

  /**
   * Update event bus metadata
   */
  private updateEventBusMetadata(): void {
    this.eventBus.emit('simulation_started', {
      personaId: this.config.quickSetup?.personaId || 'default',
      config: {
        plantingEnabled: this.gameState.automation.plantingEnabled,
        wateringEnabled: this.gameState.automation.wateringEnabled,
        harvestingEnabled: this.gameState.automation.harvestingEnabled
      },
      startTime: Date.now()
    })
  }
}
