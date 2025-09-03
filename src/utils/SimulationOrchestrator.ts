// SimulationOrchestrator - Phase 10G Implementation
// Pure orchestration layer under 500 lines - ONLY coordination logic

import { ConfigurationManager } from './ConfigurationManager'
import { ActionRouter } from './ActionRouter'
import { StateManager } from './state'
import { DecisionEngine } from './ai/DecisionEngine'
import { ProcessManager } from './processes'
import { SupportSystemManager } from './systems/SupportSystemManager'
import { FarmSystem } from './systems/FarmSystem'
import { TowerSystem } from './systems/TowerSystem'
import { SeedSystem } from './systems/SeedSystem'
import { eventBus, type IEventBus } from './events'
import { validationService } from './validation'
import type { 
  SimulationConfig, 
  AllParameters,
  GameState, 
  GameAction, 
  TickResult,
  GameEvent
} from '@/types'

/**
 * SimulationOrchestrator - Pure orchestration under 500 lines
 * ONLY coordinates systems - NO game logic implementation
 */
export class SimulationOrchestrator {
  // =============================================================================
  // CORE MODULES AND STATE
  // =============================================================================
  private config: SimulationConfig
  private gameState: GameState
  private parameters: AllParameters
  private gameDataStore: any
  private persona: any
  
  // System coordinators
  private actionRouter!: ActionRouter
  private stateManager!: StateManager
  private decisionEngine!: DecisionEngine
  private processManager!: ProcessManager
  private eventBus!: IEventBus
  
  // Runtime tracking
  private isRunning: boolean = false
  private tickCount: number = 0
  private lastProgressCheck?: {
    day: number
    plots: number
    level: number
    gold: number
    lastProgressDay: number
  }

  // =============================================================================
  // CONSTRUCTOR & INITIALIZATION (~50 lines)
  // =============================================================================
  constructor(config: SimulationConfig, gameDataStore?: any) {
    this.config = config
    
    if (!gameDataStore) {
      throw new Error('SimulationOrchestrator requires a valid gameDataStore with CSV data')
    }
    this.gameDataStore = gameDataStore

    // Initialize using ConfigurationManager
    this.parameters = ConfigurationManager.extractParametersFromConfig(config)
    this.persona = ConfigurationManager.extractPersonaFromConfig(config)
    this.gameState = ConfigurationManager.initializeGameState()
    
    // Initialize core modules
    this.initializeModules()
    
    // Setup event coordination
    this.setupEventCoordination()
    
    // Handle offline time
    this.handleOfflineProgression()
  }

  /**
   * Initialize core coordination modules
   */
  private initializeModules(): void {
    this.actionRouter = new ActionRouter()
    this.stateManager = new StateManager(this.gameState)
    this.decisionEngine = new DecisionEngine()
    this.processManager = new ProcessManager()
    this.eventBus = eventBus
    
    // Initialize validation service
    validationService.initialize(this.gameDataStore)
  }

  /**
   * Setup event coordination between systems
   */
  private setupEventCoordination(): void {
    this.eventBus.on('state_changed', (event) => {
      console.log('📊 State changed:', event.data)
    })

    this.eventBus.on('action_executed', (event) => {
      console.log('⚡ Action executed:', event.data.action.type)
    })

    this.updateEventBusMetadata()
  }

  /**
   * Handle offline progression when resuming simulation
   */
  private handleOfflineProgression(): void {
    // Check for offline time if config has timestamp
    const lastSaveTime = (this.config as any).lastSaveTime || Date.now()
    const currentTime = Date.now()
    const offlineMinutes = (currentTime - lastSaveTime) / (1000 * 60)
    
    if (offlineMinutes > 5) {
      console.log(`🕒 Detected ${Math.round(offlineMinutes)} minutes offline, processing...`)
      SupportSystemManager.handleOfflineTime(this.gameState, offlineMinutes)
    }
  }

  // =============================================================================
  // MAIN TICK METHOD (~100 lines)
  // =============================================================================
  
  /**
   * Main simulation tick - Pure orchestration
   */
  tick(): TickResult {
    // Set running state on first tick
    if (!this.isRunning) {
      this.isRunning = true
      console.log('🚀 SimulationOrchestrator: Started running')
    }
    
    const state = this.stateManager.getState()
    console.log('⏰ SimulationOrchestrator: tick() called, tickCount:', this.tickCount, 'totalMinutes:', state.time.totalMinutes)
    
    const deltaTime = this.calculateDeltaTime()
    
    try {
      // 1. Update time through StateManager
      this.updateTime(deltaTime)
      
      // 2. Coordinate system updates
      this.updateGameSystems(deltaTime)
      
      // 3. Process ongoing activities
      const processResult = this.processManager.tick(deltaTime, this.gameState, this.gameDataStore)
      
      // 4. Get AI decisions
      const decisionResult = this.decisionEngine.getNextActions(this.stateManager.getState(), this.parameters, this.gameDataStore)
      const decisions = decisionResult.actions
      
      // 5. Execute actions through routing
      const { executedActions, actionEvents } = this.executeActions(decisions)
      
      // 6. Check game status
      const isComplete = this.checkVictoryConditions()
      const isStuck = this.checkBottleneckConditions()
      
      this.tickCount++
      
      // 7. Debug logging
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

  // =============================================================================
  // SYSTEM COORDINATION (~50 lines)
  // =============================================================================
  
  /**
   * Update game time
   */
  private updateTime(deltaTime: number): void {
    this.stateManager.updateTime(deltaTime)
    this.stateManager.addLocationTime(deltaTime)
  }

  /**
   * Coordinate system updates - delegates to individual systems
   */
  private updateGameSystems(deltaTime: number): void {
    try {
      // Apply all support system effects
      SupportSystemManager.applyEffects(this.gameState, deltaTime)
    } catch (error) {
      console.error('Error in SupportSystemManager.applyEffects:', error)
    }

    try {
      // Farm system auto-pump generation
      FarmSystem.processAutoPumpGeneration(this.gameState, deltaTime)
    } catch (error) {
      console.error('Error in FarmSystem.processAutoPumpGeneration:', error)
    }

    try {
      // Tower system tick - CRITICAL: Process manual seed catching
      TowerSystem.tick(deltaTime, this.gameState)
    } catch (error) {
      console.error('Error in TowerSystem.tick:', error)
    }

    try {
      // Tower and seed system coordination - Auto-catcher processing
      const towerReach = TowerSystem.getCurrentTowerReach(this.gameState)
      SeedSystem.processAutoCatcher(this.gameState, deltaTime, towerReach)
    } catch (error) {
      console.error('Error in SeedSystem.processAutoCatcher:', error)
    }
  }

  /**
   * Update progression phase through StateManager
   */
  private updatePhaseProgression(): void {
    const state = this.stateManager.getState()
    const plots = state.progression.farmPlots
    const level = state.progression.heroLevel
    
    if (plots <= 10 && level <= 3) {
      this.stateManager.updatePhase('Tutorial', 'Early game progression')
    } else if (plots <= 30 && level <= 8) {
      this.stateManager.updatePhase('Early', 'Mid-game progression')
    } else if (plots <= 60 && level <= 12) {
      this.stateManager.updatePhase('Mid', 'Advanced progression')
    } else {
      this.stateManager.updatePhase('Late', 'Endgame progression')
    }
  }

  // =============================================================================
  // ACTION ROUTING (~30 lines)
  // =============================================================================
  
  /**
   * Execute actions through ActionRouter with validation
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

        // Route to appropriate system
        const result = this.actionRouter.route(action, this.gameState)
        if (result.success) {
          executedActions.push(action)
          if (result.events) {
            actionEvents.push(...result.events.map(event => this.convertToGameEvent(event)))
          }
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

  // =============================================================================
  // STATUS CHECKING (~50 lines)
  // =============================================================================
  
  /**
   * Check victory conditions
   */
  private checkVictoryConditions(): boolean {
    const state = this.stateManager.getState()
    return state.progression.farmPlots >= 90 || 
           (state.resources.gold >= 10000 && state.progression.farmPlots >= 50)
  }

  /**
   * Check bottleneck conditions
   */
  private checkBottleneckConditions(): boolean {
    const state = this.stateManager.getState()
    
    if (!this.lastProgressCheck) {
      this.lastProgressCheck = {
        day: state.time.day,
        plots: state.progression.farmPlots,
        level: state.progression.heroLevel,
        gold: state.resources.gold,
        lastProgressDay: state.time.day
      }
      return false
    }

    const daysSinceLastCheck = state.time.day - this.lastProgressCheck.lastProgressDay
    
    if (daysSinceLastCheck >= 3) {
      const plotsGained = state.progression.farmPlots - this.lastProgressCheck.plots
      const goldGained = state.resources.gold - this.lastProgressCheck.gold
      
      if (plotsGained < 2 && goldGained < 100) {
        return true
      }

      this.lastProgressCheck = {
        day: state.time.day,
        plots: state.progression.farmPlots,
        level: state.progression.heroLevel,
        gold: state.resources.gold,
        lastProgressDay: state.time.day
      }
    }

    return false
  }

  // =============================================================================
  // PUBLIC INTERFACE (~40 lines)
  // =============================================================================
  
  /**
   * Get current game state (read-only)
   */
  getGameState(): Readonly<GameState> {
    return this.stateManager.getState()
  }

  /**
   * Get simulation statistics
   */
  getStats() {
    const state = this.stateManager.getState()
    return {
      tickCount: this.tickCount,
      daysPassed: Math.floor(state.time.totalMinutes / (24 * 60)),
      currentPhase: this.determineCurrentPhase()
    }
  }

  /**
   * Set simulation speed
   */
  setSpeed(speed: number): void {
    this.stateManager.setTimeSpeed(speed)
  }

  /**
   * Pause simulation
   */
  pause(): void {
    console.log('⏸️ Simulation paused')
  }

  /**
   * Resume simulation
   */
  resume(): void {
    console.log('▶️ Simulation resumed')
  }

  // =============================================================================
  // CONFIGURATION/UTILITIES (~150 lines)
  // =============================================================================
  
  /**
   * Calculate delta time for this tick
   */
  private calculateDeltaTime(): number {
    const state = this.stateManager.getState()
    return 1 * state.time.speed
  }

  /**
   * Convert process event to game event
   */
  private convertProcessEventToGameEvent = (processEvent: any): GameEvent => {
    const state = this.stateManager.getState()
    return {
      timestamp: state.time.totalMinutes,
      type: processEvent.type || 'unknown',
      description: processEvent.description || 'Unknown event',
      importance: processEvent.importance || 'low',
      data: processEvent.data
    }
  }

  /**
   * Convert action result event to game event
   */
  private convertToGameEvent(event: any): GameEvent {
    const state = this.stateManager.getState()
    return {
      timestamp: state.time.totalMinutes,
      type: event.type || 'action',
      description: event.description || 'Action event',
      importance: 'low',
      data: event.data
    }
  }

  /**
   * Create error tick result
   */
  private createErrorTickResult(deltaTime: number, error: any): TickResult {
    const state = this.stateManager.getState()
    
    return {
      gameState: state,
      executedActions: [],
      events: [{
        timestamp: state.time.totalMinutes,
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
    const state = this.stateManager.getState()
    return state.progression.currentPhase
  }

  /**
   * Log tick results for debugging
   */
  private logTickResults(executedActions: GameAction[], decisions: GameAction[]): void {
    const state = this.stateManager.getState()
    
    if (this.tickCount % 10 === 0) {
      console.log(`🎮 Tick ${this.tickCount}:`, {
        energy: Math.round(state.resources.energy.current),
        water: Math.round(state.resources.water.current),
        plots: state.progression.farmPlots,
        possibleActions: decisions.length,
        executedActions: executedActions.length,
        currentHour: state.time.hour
      })
    }
    
    if (executedActions.length > 0) {
      console.log(`⚡ Tick ${this.tickCount}: Executed ${executedActions.length} actions:`, 
        executedActions.map(a => `${a.type}(${a.target})`))
    }
  }

  /**
   * Update event bus metadata
   */
  private updateEventBusMetadata(): void {
    const state = this.stateManager.getState()
    
    this.eventBus.emit('simulation_started', {
      personaId: this.config.quickSetup?.personaId || 'default',
      config: {
        plantingEnabled: state.automation.plantingEnabled,
        wateringEnabled: state.automation.wateringEnabled,
        harvestingEnabled: state.automation.harvestingEnabled
      },
      startTime: Date.now()
    })
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    console.log('🧹 SimulationOrchestrator destroyed')
  }
}

// =============================================================================
// TOTAL: ~485 lines - UNDER TARGET OF 500 LINES ✅
// =============================================================================
