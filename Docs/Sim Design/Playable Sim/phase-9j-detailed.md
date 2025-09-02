# Phase 9J: Core Engine Simplification - Detailed Implementation

## Overview
Complete the refactor by transforming SimulationEngine from a 5659-line monolith into a clean ~500-line orchestrator. This phase integrates all extracted modules, removes remaining implementation details, and establishes clear module interfaces.

## Final Architecture

```
SimulationOrchestrator (~500 lines)
├── Initialization (~50 lines)
├── Main Loop (~100 lines)
├── Module Coordination (~150 lines)
├── State Management (~100 lines)
└── External Interface (~100 lines)

Coordinating:
├── DecisionEngine (AI decisions)
├── ActionExecutor (action execution)
├── StateManager (state management)
├── ProcessManager (ongoing processes)
├── ValidationService (rule validation)
├── EventBus (event system)
└── Systems/ (game-specific logic)
    ├── AdventureSystem
    ├── TownSystem
    ├── TowerSystem
    ├── ForgeSystem
    ├── FarmSystem
    └── MineSystem
```

## 1. SimulationOrchestrator.ts - The Final Form

### Core Interface:
```typescript
export interface ISimulationOrchestrator {
  // Lifecycle
  initialize(): Promise<void>
  tick(): TickResult
  pause(): void
  resume(): void
  reset(): void
  destroy(): void
  
  // State access
  getState(): Readonly<GameState>
  getSnapshot(): SimulationSnapshot
  restoreSnapshot(snapshot: SimulationSnapshot): void
  
  // Configuration
  setPersona(persona: PersonaConfig): void
  setSpeed(speed: number): void
  
  // Events
  getEventBus(): IEventBus
  getEventHistory(): Event<any>[]
  
  // Analysis
  getStatistics(): SimulationStatistics
  isComplete(): boolean
  isBottlenecked(): boolean
}

export interface TickResult {
  gameState: Readonly<GameState>
  executedActions: GameAction[]
  completedProcesses: ProcessHandle[]
  events: Event<any>[]
  deltaTime: number
  statistics: TickStatistics
}

export interface SimulationSnapshot {
  gameState: GameState
  timestamp: number
  tickCount: number
  metadata: any
}
```

### Implementation:
```typescript
export class SimulationOrchestrator implements ISimulationOrchestrator {
  // Core modules
  private stateManager: IStateManager
  private decisionEngine: IDecisionEngine
  private actionExecutor: IActionExecutor
  private processManager: IProcessManager
  private validationService: IValidationService
  private eventBus: IEventBus
  
  // Game systems
  private systems: SystemRegistry
  
  // Configuration
  private config: SimulationConfig
  private gameDataStore: GameDataStore
  
  // Runtime state
  private tickCount: number = 0
  private lastTickTime: number = 0
  private isPaused: boolean = false
  private speed: number = 1
  
  constructor(config: SimulationConfig, gameDataStore: GameDataStore) {
    this.config = config
    this.gameDataStore = gameDataStore
    
    // Initialize modules
    this.initializeModules()
    
    // Wire up module connections
    this.connectModules()
  }
  
  private initializeModules(): void {
    // Create initial state
    const initialState = this.createInitialState()
    
    // Core modules
    this.stateManager = new StateManager(initialState)
    this.eventBus = new EventBus(new EventLogger())
    this.validationService = new ValidationService(this.gameDataStore)
    this.processManager = new ProcessManager()
    this.actionExecutor = new ActionExecutor()
    this.decisionEngine = new DecisionEngine(this.config.persona)
    
    // Game systems
    this.systems = {
      adventure: new AdventureSystem(this.eventBus),
      town: new TownSystem(this.eventBus),
      tower: new TowerSystem(this.eventBus),
      forge: new ForgeSystem(this.eventBus),
      farm: new FarmSystem(this.eventBus),
      mine: new MineSystem(this.eventBus)
    }
  }
  
  private connectModules(): void {
    // Connect systems to decision engine
    this.decisionEngine.setSystems(this.systems)
    
    // Connect executor to state manager
    this.actionExecutor.setStateManager(this.stateManager)
    
    // Connect process manager to state manager
    this.processManager.setStateManager(this.stateManager)
    
    // Setup event listeners
    this.setupEventListeners()
  }
  
  private setupEventListeners(): void {
    // Listen for state changes
    this.eventBus.on('state_changed', (event) => {
      this.handleStateChange(event.data.changes)
    })
    
    // Listen for bottlenecks
    this.eventBus.on('bottleneck_detected', (event) => {
      this.handleBottleneck(event.data)
    })
    
    // Listen for completion
    this.eventBus.on('victory_achieved', (event) => {
      this.handleVictory(event.data)
    })
    
    // Listen for errors
    this.eventBus.on('error', (event) => {
      this.handleError(event.data)
    })
  }
  
  async initialize(): Promise<void> {
    // Validate game data
    const dataValidation = await this.validateGameData()
    if (!dataValidation.valid) {
      throw new Error(`Invalid game data: ${dataValidation.errors.join(', ')}`)
    }
    
    // Initialize systems
    for (const system of Object.values(this.systems)) {
      await system.initialize?.(this.gameDataStore)
    }
    
    // Emit initialization event
    this.eventBus.emit('simulation_initialized', {
      config: this.config,
      gameState: this.getState()
    })
  }
  
  tick(): TickResult {
    if (this.isPaused) {
      return this.createEmptyTickResult()
    }
    
    // Calculate delta time
    const currentTime = Date.now()
    const deltaTime = this.calculateDeltaTime(currentTime)
    this.lastTickTime = currentTime
    
    // Update game time
    this.updateGameTime(deltaTime)
    
    // Process ongoing activities
    const processResult = this.processOngoingActivities(deltaTime)
    
    // Make decisions
    const decisions = this.makeDecisions()
    
    // Execute actions
    const executionResult = this.executeActions(decisions.actions)
    
    // Check conditions
    this.checkConditions()
    
    // Update statistics
    this.updateStatistics(deltaTime, executionResult, processResult)
    
    // Increment tick count
    this.tickCount++
    
    // Emit tick event
    const tickResult = this.createTickResult(
      executionResult,
      processResult,
      deltaTime
    )
    
    this.eventBus.emit('tick_completed', tickResult)
    
    return tickResult
  }
  
  private processOngoingActivities(deltaTime: number): ProcessTickResult {
    // Let ProcessManager handle all ongoing processes
    const result = this.processManager.tick(
      deltaTime,
      this.getState(),
      this.gameDataStore
    )
    
    // Apply state changes from processes
    if (result.stateChanges) {
      const updateResult = this.stateManager.updateState(result.stateChanges)
      
      if (!updateResult.success) {
        this.eventBus.emit('error', {
          message: 'Failed to apply process state changes',
          context: { stateChanges: result.stateChanges, errors: updateResult.validationErrors }
        })
      }
    }
    
    // Emit events for completed processes
    for (const completed of result.completed) {
      this.eventBus.emit('process_completed', {
        processId: completed.id,
        type: completed.type,
        result: completed.data
      })
    }
    
    return result
  }
  
  private makeDecisions(): DecisionResult {
    // Let DecisionEngine handle all AI logic
    const decisionResult = this.decisionEngine.makeDecisions(
      this.getState(),
      this.gameDataStore,
      this.systems
    )
    
    // Log decision reasoning for debugging
    if (this.config.debug && decisionResult.reasoning.length > 0) {
      console.log('Decision reasoning:', decisionResult.reasoning)
    }
    
    return decisionResult
  }
  
  private executeActions(actions: GameAction[]): ExecutionResult {
    const executed: GameAction[] = []
    const failed: GameAction[] = []
    
    for (const action of actions) {
      // Validate action first
      const validation = this.validationService.validateAction(
        action,
        this.getState(),
        this.gameDataStore
      )
      
      if (!validation.valid) {
        this.eventBus.emit('action_failed', {
          action,
          error: validation.errors.map(e => e.message).join('; ')
        })
        failed.push(action)
        continue
      }
      
      // Execute action
      const result = this.actionExecutor.execute(
        action,
        this.getState(),
        this.gameDataStore,
        this.systems
      )
      
      if (result.success) {
        // Apply state changes
        const updateResult = this.stateManager.updateState(result.stateChanges)
        
        if (updateResult.success) {
          executed.push(action)
          
          this.eventBus.emit('action_executed', {
            action,
            result
          })
        } else {
          failed.push(action)
          
          this.eventBus.emit('action_failed', {
            action,
            error: updateResult.validationErrors.join('; ')
          })
        }
      } else {
        failed.push(action)
      }
    }
    
    return { executed, failed }
  }
  
  private checkConditions(): void {
    // Check victory
    if (this.checkVictoryConditions()) {
      this.eventBus.emit('victory_achieved', {
        tickCount: this.tickCount,
        gameState: this.getState()
      })
    }
    
    // Check bottlenecks
    const bottleneck = this.checkBottleneckConditions()
    if (bottleneck) {
      this.eventBus.emit('bottleneck_detected', bottleneck)
    }
  }
  
  private checkVictoryConditions(): boolean {
    const state = this.getState()
    
    // Victory: 90 plots OR level 15
    return state.farm.plots >= 90 || state.hero.level >= 15
  }
  
  private checkBottleneckConditions(): BottleneckInfo | null {
    const state = this.getState()
    
    // Simple bottleneck detection
    if (state.resources.energy.current === 0 && 
        state.resources.seeds.size === 0 &&
        state.resources.gold < 50) {
      return {
        type: 'resource_deadlock',
        details: 'No resources to progress',
        suggestedAction: 'Wait for crops or restart'
      }
    }
    
    // Check for stalled progression
    if (this.tickCount > 1000 && state.farm.plots < 10) {
      return {
        type: 'progression_stalled',
        details: 'Farm expansion too slow',
        suggestedAction: 'Focus on cleanup actions'
      }
    }
    
    return null
  }
  
  private createInitialState(): GameState {
    return {
      time: { day: 1, hour: 6, minute: 0, totalMinutes: 0 },
      resources: {
        energy: { current: 100, max: 150 },
        gold: 0,
        water: { current: 20, max: 20 },
        seeds: new Map([['carrot', 5], ['radish', 3]]),
        materials: new Map()
      },
      location: { current: 'farm', lastVisited: null },
      farm: {
        plots: 3,
        stage: 1,
        crops: []
      },
      hero: {
        level: 1,
        xp: 0,
        hp: { current: 120, max: 120 }
      },
      inventory: {
        tools: new Map(),
        weapons: new Map(),
        armor: []
      },
      unlockedContent: {
        all: new Set(['farm', 'town']),
        purchasedBlueprints: new Set(),
        builtStructures: new Set(),
        adventureRoutes: new Set()
      },
      processes: {
        crops: [],
        adventure: null,
        crafting: null,
        mining: null,
        seedCatching: null,
        building: null
      },
      systems: {
        forge: null,
        tower: null
      }
    }
  }
  
  // External interface methods
  
  getState(): Readonly<GameState> {
    return this.stateManager.getState()
  }
  
  getSnapshot(): SimulationSnapshot {
    return {
      gameState: JSON.parse(JSON.stringify(this.getState())),
      timestamp: Date.now(),
      tickCount: this.tickCount,
      metadata: {
        config: this.config,
        statistics: this.getStatistics()
      }
    }
  }
  
  restoreSnapshot(snapshot: SimulationSnapshot): void {
    this.stateManager.restoreSnapshot(snapshot.gameState)
    this.tickCount = snapshot.tickCount
    
    this.eventBus.emit('snapshot_restored', {
      timestamp: snapshot.timestamp,
      tickCount: snapshot.tickCount
    })
  }
  
  pause(): void {
    this.isPaused = true
    this.eventBus.emit('simulation_paused', {})
  }
  
  resume(): void {
    this.isPaused = false
    this.lastTickTime = Date.now()
    this.eventBus.emit('simulation_resumed', {})
  }
  
  reset(): void {
    const initialState = this.createInitialState()
    this.stateManager = new StateManager(initialState)
    this.tickCount = 0
    this.lastTickTime = 0
    
    this.eventBus.emit('simulation_reset', {})
  }
  
  destroy(): void {
    // Clean up all modules
    this.eventBus.clear()
    this.processManager.clear()
    
    // Clear references
    this.systems = null as any
    this.stateManager = null as any
    
    this.eventBus.emit('simulation_destroyed', {})
  }
  
  setPersona(persona: PersonaConfig): void {
    this.config.persona = persona
    this.decisionEngine.setPersona(persona)
    
    this.eventBus.emit('persona_changed', { persona })
  }
  
  setSpeed(speed: number): void {
    this.speed = Math.max(0.1, Math.min(10, speed))
    
    this.eventBus.emit('speed_changed', { speed: this.speed })
  }
  
  getEventBus(): IEventBus {
    return this.eventBus
  }
  
  getEventHistory(): Event<any>[] {
    return this.eventBus.getHistory()
  }
  
  getStatistics(): SimulationStatistics {
    return {
      tickCount: this.tickCount,
      realTimeElapsed: Date.now() - this.startTime,
      gameTimeElapsed: this.getState().time.totalMinutes,
      actionsExecuted: this.totalActionsExecuted,
      processesCompleted: this.totalProcessesCompleted,
      eventsEmitted: this.eventBus.getEventCount(),
      currentBottlenecks: this.currentBottlenecks,
      resourceEfficiency: this.calculateResourceEfficiency(),
      progressionRate: this.calculateProgressionRate()
    }
  }
  
  isComplete(): boolean {
    return this.checkVictoryConditions()
  }
  
  isBottlenecked(): boolean {
    return this.checkBottleneckConditions() !== null
  }
}
```

## 2. Module Interface Definitions

### SystemRegistry Interface:
```typescript
export interface SystemRegistry {
  adventure: IAdventureSystem
  town: ITownSystem
  tower: ITowerSystem
  forge: IForgeSystem
  farm: IFarmSystem
  mine: IMineSystem
}

export interface IGameSystem {
  // Lifecycle
  initialize?(gameDataStore: GameDataStore): Promise<void>
  destroy?(): void
  
  // Action evaluation
  evaluateActions(gameState: GameState, gameDataStore: GameDataStore): GameAction[]
  
  // Action execution
  executeAction(action: GameAction, gameState: GameState, gameDataStore: GameDataStore): ActionResult
  
  // Process handling (if applicable)
  processUpdate?(deltaTime: number, gameState: GameState, gameDataStore: GameDataStore): ProcessResult
}
```

### Module Connection Pattern:
```typescript
export class ModuleConnector {
  static connectModules(modules: {
    stateManager: IStateManager
    decisionEngine: IDecisionEngine
    actionExecutor: IActionExecutor
    processManager: IProcessManager
    validationService: IValidationService
    eventBus: IEventBus
    systems: SystemRegistry
  }): void {
    // Inject dependencies
    modules.decisionEngine.setSystems(modules.systems)
    modules.decisionEngine.setValidationService(modules.validationService)
    
    modules.actionExecutor.setStateManager(modules.stateManager)
    modules.actionExecutor.setValidationService(modules.validationService)
    modules.actionExecutor.setEventBus(modules.eventBus)
    
    modules.processManager.setStateManager(modules.stateManager)
    modules.processManager.setEventBus(modules.eventBus)
    
    // Setup cross-module event handlers
    modules.eventBus.on('state_changed', (event) => {
      modules.validationService.clearCache()
    })
    
    modules.eventBus.on('process_completed', (event) => {
      // Trigger decision re-evaluation
      modules.decisionEngine.invalidateCache()
    })
  }
}
```

## 3. Migration Checklist

### Final Cleanup Tasks:
- [ ] Rename SimulationEngine.ts to SimulationOrchestrator.ts
- [ ] Remove all extracted methods from original file
- [ ] Update all imports throughout codebase
- [ ] Remove unused imports and dependencies
- [ ] Add comprehensive JSDoc comments
- [ ] Update type definitions

### Code Organization:
```typescript
// SimulationOrchestrator.ts structure
// Lines 1-50: Imports and interfaces
// Lines 51-150: Constructor and initialization
// Lines 151-250: Main tick loop
// Lines 251-350: Module coordination
// Lines 351-450: External interface
// Lines 451-500: Helper methods
```

### Testing After Refactor:
```typescript
describe('SimulationOrchestrator', () => {
  let orchestrator: SimulationOrchestrator
  let config: SimulationConfig
  let gameDataStore: GameDataStore
  
  beforeEach(() => {
    config = createDefaultConfig()
    gameDataStore = createMockDataStore()
    orchestrator = new SimulationOrchestrator(config, gameDataStore)
  })
  
  describe('Initialization', () => {
    it('should initialize all modules', async () => {
      await orchestrator.initialize()
      
      expect(orchestrator.getState()).toBeDefined()
      expect(orchestrator.getEventBus()).toBeDefined()
    })
  })
  
  describe('Tick Processing', () => {
    it('should process tick successfully', () => {
      const result = orchestrator.tick()
      
      expect(result.gameState).toBeDefined()
      expect(result.deltaTime).toBeGreaterThan(0)
    })
    
    it('should respect pause state', () => {
      orchestrator.pause()
      
      const result = orchestrator.tick()
      
      expect(result.executedActions).toHaveLength(0)
    })
  })
  
  describe('Module Integration', () => {
    it('should coordinate all modules', () => {
      const eventSpy = jest.fn()
      orchestrator.getEventBus().onAny(eventSpy)
      
      orchestrator.tick()
      
      expect(eventSpy).toHaveBeenCalled()
    })
  })
})
```

## 4. Documentation Updates

### Update SimulationEngine-As-Built.md:
```markdown
# SimulationOrchestrator Architecture

## Overview
The SimulationOrchestrator is a clean ~500-line orchestrator that coordinates all game simulation modules. It follows the Single Responsibility Principle, handling only orchestration while delegating all implementation to specialized modules.

## Architecture
- **Lines of Code**: ~500 (down from 5659)
- **Responsibilities**: Module coordination, tick processing, external interface
- **Dependencies**: 6 core modules + 6 game systems

## Module Structure
1. **DecisionEngine**: AI decision-making (800 lines)
2. **ActionExecutor**: Action execution (600 lines)
3. **StateManager**: State management (500 lines)
4. **ProcessManager**: Process handling (400 lines)
5. **ValidationService**: Rule validation (300 lines)
6. **EventBus**: Event system (200 lines)

## Benefits
- **Maintainability**: Each module has single responsibility
- **Testability**: Modules can be tested in isolation
- **Extensibility**: New systems easily added
- **Performance**: Potential for parallel processing
- **Clarity**: Clear separation of concerns
```

## 5. Performance Optimizations

### After Refactor:
```typescript
export class PerformanceOptimizer {
  static optimizeOrchestrator(orchestrator: SimulationOrchestrator): void {
    // Enable module caching
    orchestrator.enableCaching({
      validation: true,
      prerequisites: true,
      decisions: true
    })
    
    // Configure batch processing
    orchestrator.setBatchSize({
      actions: 10,
      processes: 50,
      events: 100
    })
    
    // Setup throttling
    orchestrator.setThrottling({
      decisions: 30, // Max decisions per tick
      events: 1000, // Max events per tick
      updates: 60 // Max state updates per second
    })
  }
}
```

## Final Benefits Summary

### Before Refactor:
- **SimulationEngine.ts**: 5659 lines
- **Responsibilities**: Everything
- **Testability**: Difficult
- **Maintainability**: Poor
- **Extensibility**: Limited

### After Refactor:
- **SimulationOrchestrator.ts**: ~500 lines
- **Total Code**: ~5600 lines (same, but organized)
- **Files**: 20+ focused modules
- **Testability**: Excellent (isolated modules)
- **Maintainability**: Excellent (single responsibility)
- **Extensibility**: Excellent (plugin architecture)
- **Performance**: Better (caching, parallel potential)
- **Debugging**: Better (event system, clear flow)

## Common Integration Issues and Solutions

### Issue 1: Circular Dependencies
**Problem**: Modules trying to import each other
**Solution**: Use dependency injection and interfaces

### Issue 2: State Synchronization
**Problem**: Modules have different views of state
**Solution**: Single source of truth in StateManager

### Issue 3: Event Order
**Problem**: Events processed in wrong order
**Solution**: Event queue with priority system

### Issue 4: Module Communication
**Problem**: Modules can't communicate
**Solution**: EventBus for loose coupling

## Conclusion

The refactor transforms a monolithic 5659-line file into a clean, modular architecture with:
- Clear separation of concerns
- Testable modules
- Extensible design
- Improved performance
- Better debugging capabilities

The SimulationOrchestrator now serves as a thin coordination layer, delegating all actual work to specialized modules. This architecture is maintainable, scalable, and follows software engineering best practices.