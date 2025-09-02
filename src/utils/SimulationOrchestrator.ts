// SimulationOrchestrator - Pure orchestration layer
// Phase 9J Implementation - Clean coordination of all simulation modules

import { MapSerializer } from './MapSerializer'
import { DecisionEngine } from './ai/DecisionEngine'
import { ActionExecutor } from './execution/ActionExecutor'
import { StateManager } from './state'
import { ProcessManager } from './processes'
import { validationService } from './validation'
import { eventBus, type IEventBus } from './events'
import { HelperSystem } from './systems/HelperSystem'
import { WaterSystem } from './systems/WaterSystem'
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
 * Core simulation orchestrator that coordinates all simulation modules
 * This is a pure orchestration layer - all implementation details are in specialized modules
 */
export class SimulationOrchestrator {
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
      throw new Error('SimulationOrchestrator requires a valid gameDataStore with CSV data')
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
    
    // Initialize validation service with game data
    validationService.initialize(gameDataStore)
    
    // Initialize event bus integration
    this.eventBus = eventBus
    this.setupEventBusIntegration()
  }

  /**
   * Main simulation tick - coordinates all modules
   */
  tick(): TickResult {
    console.log('⏰ SimulationOrchestrator: tick() called, tickCount:', this.tickCount, 'totalMinutes:', this.gameState.time.totalMinutes, 'isRunning:', this.isRunning)
    
    const startTime = this.gameState.time.totalMinutes
    const deltaTime = this.calculateDeltaTime()
    
    try {
      // 1. Update time
      this.updateTime(deltaTime)
      
      // 2. Process all ongoing activities
      const processResult = this.processManager.tick(deltaTime, this.gameState, this.gameDataStore)
      
      // 3. Process other systems
      this.updateGameSystems(deltaTime)
      
      // 4. Make AI decisions
      const decisionResult = this.decisionEngine.getNextActions(this.gameState, this.parameters, this.gameDataStore)
      const decisions = decisionResult.actions
      
      // 5. Execute actions
      const { executedActions, actionEvents } = this.executeActions(decisions)
      
      // 6. Update systems and check conditions
      this.updateAutomation()
      this.updatePhaseProgression()
      
      // 7. Check completion conditions
      const isComplete = this.checkVictoryConditions()
      const isStuck = this.checkBottleneckConditions()
      
      this.tickCount++
      
      // Debug logging
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

  /**
   * Pause simulation
   */
  pause(): void {
    this.isRunning = false
  }

  /**
   * Resume simulation
   */
  resume(): void {
    this.isRunning = true
  }

  /**
   * Stop simulation
   */
  stop(): void {
    this.isRunning = false
  }

  // =============================================================================
  // PRIVATE METHODS - Orchestration logic only
  // =============================================================================

  /**
   * Extract parameters from configuration
   */
  private extractParametersFromConfig(config: SimulationConfig): AllParameters {
    // Create baseline parameters
    let baseParameters = this.createDefaultParameters()
    
    // Handle serialized parameters if provided
    if (config.parameters) {
      try {
        const serializedParams = config.parameters instanceof Map ? config.parameters : new Map(Object.entries(config.parameters))
        baseParameters = this.mergeParameters(baseParameters, serializedParams)
      } catch (error) {
        console.warn('Failed to deserialize parameters from config:', error)
      }
    }
    
    // Apply any parameter overrides
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
        automation: { plantingEnabled: true, wateringEnabled: true, harvestingEnabled: true },
        priorities: { cropPreference: ['turnip', 'carrot', 'potato'], wateringThreshold: 0.3 },
        timing: { plantingFrequency: 30, harvestCheckFrequency: 10 }
      },
      tower: {
        automation: { catchingEnabled: true, autoUpgradeEnabled: true },
        priorities: { upgradeOrder: ['reach', 'autocatcher', 'nets'] },
        timing: { catchingFrequency: 60 }
      },
      town: {
        automation: { tradingEnabled: true, upgradeEnabled: true },
        priorities: { blueprintPreference: ['infrastructure', 'automation', 'cosmetic'] },
        timing: { visitFrequency: 120 }
      },
      decisions: {
        checkins: { enabled: true, frequency: 30, urgencyThreshold: 0.7 },
        priorities: { safety: 0.8, efficiency: 0.6, exploration: 0.4 },
        interrupts: { enabled: true, emergencyThreshold: 0.9 }
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
      return personaMap[config.quickSetup.personaId] || personaMap['casual']
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
        energy: { current: 100, maximum: 100 },
        water: { current: 20, maximum: 20 },
        gold: 50,
        seeds: this.initializeSeeds(),
        materials: this.initializeMaterials()
      },
      progression: {
        farmPlots: 3,
        unlockedAreas: ['farm'],
        completedTutorials: [],
        availablePlots: 3,
        nextPlotCost: 100
      },
      inventory: {
        tools: new Map([['watering_can', 1], ['hoe', 1]]),
        weapons: new Map(),
        armor: new Map(),
        capacity: 50,
        currentWeight: 0
      },
      processes: {
        crops: [],
        adventures: [],
        training: [],
        crafting: [],
        mining: [],
        construction: []
      },
      helpers: [],
      location: {
        currentScreen: 'farm',
        history: ['farm']
      },
      automation: {
        plantingEnabled: true,
        plantingStrategy: 'optimal',
        wateringEnabled: true,
        harvestingEnabled: true,
        autoCleanupEnabled: false,
        targetCrops: new Map([['turnip', 1], ['carrot', 1], ['potato', 1]]),
        wateringThreshold: 0.3,
        energyReserve: 10
      },
      priorities: {
        crops: ['turnip', 'carrot', 'potato'],
        upgrades: ['farm_plots', 'water_capacity', 'energy_capacity'],
        helpers: ['farming', 'water_management', 'seed_collection']
      }
    }
  }

  /**
   * Initialize starting seeds
   */
  private initializeSeeds(): Map<string, number> {
    return new Map([
      ['turnip', 10],
      ['carrot', 5],
      ['potato', 3]
    ])
  }

  /**
   * Initialize starting materials
   */
  private initializeMaterials(): Map<string, number> {
    return new Map([
      ['wood', 20],
      ['stone', 10]
    ])
  }

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
  }

  /**
   * Update game systems that aren't in ProcessManager yet
   */
  private updateGameSystems(deltaTime: number): void {
    try {
      // Process helper automation
      HelperSystem.processHelpers(this.gameState, deltaTime, this.gameDataStore)
    } catch (error) {
      console.error('Error in HelperSystem.processHelpers:', error)
    }

    try {
      // Process auto-pump water generation
      WaterSystem.processAutoPumpGeneration(this.gameState, deltaTime)
    } catch (error) {
      console.error('Error in WaterSystem.processAutoPumpGeneration:', error)
    }

    try {
      // Process auto-catcher seed collection
      const towerReach = this.getCurrentTowerReach()
      SeedSystem.processAutoCatcher(this.gameState, deltaTime, towerReach)
    } catch (error) {
      console.error('Error in SeedSystem.processAutoCatcher:', error)
    }
  }

  /**
   * Execute actions using ActionExecutor
   */
  private executeActions(decisions: GameAction[]): { executedActions: GameAction[], actionEvents: GameEvent[] } {
    const executedActions: GameAction[] = []
    const actionEvents: GameEvent[] = []
    
    for (const action of decisions) {
      try {
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
    
    // Update DecisionEngine lastCheckinTime after successful actions
    if (executedActions.length > 0) {
      this.decisionEngine.updateLastCheckin(this.gameState)
    }
    
    return { executedActions, actionEvents }
  }

  /**
   * Update automation systems
   */
  private updateAutomation(): void {
    // Automation logic should be in dedicated modules
    // This is just a placeholder for now
  }

  /**
   * Update phase progression
   */
  private updatePhaseProgression(): void {
    // Phase progression logic should be in StateManager
    // This is just a placeholder for now
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
        level: 1, // Placeholder
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
        level: 1, // Placeholder
        gold: this.gameState.resources.gold,
        lastProgressDay: this.gameState.time.day
      }
    }
    
    return false
  }

  /**
   * Get current tower reach for seed catching
   */
  private getCurrentTowerReach(): number {
    // This should be moved to TowerSystem
    return 10 // Placeholder
  }

  /**
   * Convert process event to game event
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
    if (this.gameState.progression.farmPlots < 10) return 'Early Game'
    if (this.gameState.progression.farmPlots < 30) return 'Mid Game'
    return 'Late Game'
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
    // Subscribe to relevant events
    this.eventBus.on('state_changed', (event) => {
      console.log('📊 State changed:', event.data)
    })

    this.eventBus.on('action_executed', (event) => {
      console.log('⚡ Action executed:', event.data.action.type)
    })

    // Update event bus with initial metadata
    this.updateEventBusMetadata()
  }

  /**
   * Update event bus metadata
   */
  private updateEventBusMetadata(): void {
    this.eventBus.emit('simulation_started', {
      timestamp: this.gameState.time.totalMinutes,
      persona: this.persona.name,
      config: {
        plantingEnabled: this.gameState.automation.plantingEnabled,
        wateringEnabled: this.gameState.automation.wateringEnabled,
        harvestingEnabled: this.gameState.automation.harvestingEnabled
      }
    })
  }
}
