# Phase 10E: Create SimulationOrchestrator - Final Integration

## Objective
Transform the reduced SimulationEngine into a clean orchestrator that coordinates all extracted modules.

## Current State
- SimulationEngine: ~2150 lines (after Phases 10A-D)
- Still contains mixed responsibilities
- Some system-specific logic remains

## Target State
- Rename to `SimulationOrchestrator.ts`
- Clean orchestration-only code: ~800-1000 lines
- Pure coordination, no implementation details

## Major Refactoring Tasks

### 1. Clean Up Remaining System Logic

**Identify and extract remaining system code**:
```typescript
// Look for any remaining:
- Forge logic → Create ForgeSystem.ts
- Mine logic → Create MineSystem.ts
- Helper logic → Create HelperSystem.ts
- Any other game-specific logic
```

### 2. Restructure Main Class

```typescript
export class SimulationOrchestrator {
  // Module instances (no game logic here!)
  private systems: {
    farm: FarmSystem
    adventure: AdventureSystem
    town: TownSystem
    tower: TowerSystem
    forge: ForgeSystem
    mine: MineSystem
    helper: HelperSystem
  }
  
  private modules: {
    stateManager: StateManager
    processManager: ProcessManager
    decisionEngine: DecisionEngine
    validationService: ValidationService
    eventBus: EventBus
  }
  
  // High-level state only
  private config: SimulationConfig
  private tickCount: number = 0
  private isRunning: boolean = false
  
  constructor(config: SimulationConfig, gameDataStore: GameDataStore) {
    this.config = config
    this.initializeModules(gameDataStore)
    this.initializeSystems()
    this.connectModules()
  }
}
```

### 3. Clean Tick Method

```typescript
tick(): TickResult {
  if (!this.isRunning) return this.createEmptyResult()
  
  // 1. Calculate timing
  const deltaTime = this.calculateDeltaTime()
  
  // 2. Update game time
  this.modules.stateManager.updateGameTime(deltaTime)
  
  // 3. Process ongoing activities
  const processResult = this.modules.processManager.tick(
    deltaTime,
    this.getGameState(),
    this.gameDataStore
  )
  
  // 4. Make AI decisions
  const decisions = this.modules.decisionEngine.makeDecisions(
    this.getGameState(),
    this.gameDataStore,
    this.systems
  )
  
  // 5. Execute actions
  const executionResult = this.executeActions(decisions.actions)
  
  // 6. Check game conditions
  const conditions = this.checkConditions()
  
  // 7. Update tick count
  this.tickCount++
  
  // 8. Emit tick event
  this.modules.eventBus.emit('tick_complete', {
    tick: this.tickCount,
    deltaTime,
    actions: executionResult.executed,
    processes: processResult.completed
  })
  
  // 9. Return clean result
  return {
    gameState: this.getGameState(),
    tickCount: this.tickCount,
    deltaTime,
    executedActions: executionResult.executed,
    completedProcesses: processResult.completed,
    isComplete: conditions.victory,
    isBottlenecked: conditions.bottleneck
  }
}
```

### 4. Action Routing

```typescript
private executeActions(actions: GameAction[]): ExecutionResult {
  const executed: GameAction[] = []
  const failed: GameAction[] = []
  
  for (const action of actions) {
    // Validate first
    const validation = this.modules.validationService.canPerform(
      action,
      this.getGameState(),
      this.gameDataStore
    )
    
    if (!validation.canPerform) {
      failed.push(action)
      this.modules.eventBus.emit('action_failed', {
        action,
        reason: validation.errors.join(', ')
      })
      continue
    }
    
    // Route to appropriate system
    const result = this.routeAction(action)
    
    if (result.success) {
      executed.push(action)
      this.modules.eventBus.emit('action_executed', { action, result })
    } else {
      failed.push(action)
    }
  }
  
  return { executed, failed }
}

private routeAction(action: GameAction): ActionResult {
  // Pure routing - no logic!
  const gameState = this.getGameState()
  const gameDataStore = this.gameDataStore
  
  switch (action.type) {
    case 'plant':
    case 'harvest':
    case 'pump':
    case 'cleanup':
      return this.systems.farm.executeAction(action, gameState, gameDataStore)
      
    case 'adventure':
      return this.systems.adventure.executeAction(action, gameState, gameDataStore)
      
    case 'purchase':
      return this.systems.town.executeAction(action, gameState, gameDataStore)
      
    case 'catch_seeds':
      return this.systems.tower.executeAction(action, gameState, gameDataStore)
      
    case 'craft':
      return this.systems.forge.executeAction(action, gameState, gameDataStore)
      
    case 'mine':
      return this.systems.mine.executeAction(action, gameState, gameDataStore)
      
    case 'manage_helper':
      return this.systems.helper.executeAction(action, gameState, gameDataStore)
      
    default:
      return { success: false, error: `Unknown action type: ${action.type}` }
  }
}
```

### 5. Module Initialization

```typescript
private initializeModules(gameDataStore: GameDataStore): void {
  // Create initial game state
  const initialState = this.createInitialState()
  
  // Initialize core modules
  this.modules = {
    stateManager: new StateManager(initialState),
    eventBus: new EventBus(),
    validationService: new ValidationService(gameDataStore),
    processManager: new ProcessManager(),
    decisionEngine: new DecisionEngine(this.config.persona)
  }
}

private initializeSystems(): void {
  // Initialize game systems with dependencies
  const deps = {
    stateManager: this.modules.stateManager,
    eventBus: this.modules.eventBus,
    validationService: this.modules.validationService
  }
  
  this.systems = {
    farm: new FarmSystem(deps),
    adventure: new AdventureSystem(deps),
    town: new TownSystem(deps),
    tower: new TowerSystem({ ...deps, processManager: this.modules.processManager }),
    forge: new ForgeSystem(deps),
    mine: new MineSystem(deps),
    helper: new HelperSystem(deps)
  }
}

private connectModules(): void {
  // Wire up inter-module connections
  this.modules.decisionEngine.setSystems(this.systems)
  this.modules.processManager.setSystems(this.systems)
  
  // Setup event listeners
  this.setupEventListeners()
}
```

### 6. Clean Up Methods to Remove

**Remove all of these**:
- Any method that manipulates game state directly
- Any method with game logic (calculations, formulas)
- Any method specific to a game system
- Console.log statements (use eventBus)

**Keep only**:
- Initialization methods
- Coordination methods
- High-level flow control
- Module communication

## File Structure After Phase 10E

```
src/utils/
├── SimulationOrchestrator.ts (800-1000 lines)
├── systems/
│   ├── FarmSystem.ts (300 lines)
│   ├── AdventureSystem.ts (250 lines)
│   ├── TownSystem.ts (200 lines)
│   ├── TowerSystem.ts (150 lines)
│   ├── ForgeSystem.ts (200 lines)
│   ├── MineSystem.ts (150 lines)
│   └── HelperSystem.ts (200 lines)
├── processes/
│   └── ProcessManager.ts (400 lines)
├── ai/
│   ├── DecisionEngine.ts (existing)
│   ├── PersonaStrategy.ts (existing)
│   └── ActionScorer.ts (existing)
├── state/
│   └── StateManager.ts (existing)
└── validation/
    └── ValidationService.ts (existing)
```

## Success Criteria
- [ ] SimulationOrchestrator ≤ 1000 lines
- [ ] NO game logic in orchestrator
- [ ] All systems properly initialized
- [ ] Clean tick() method
- [ ] Pure action routing
- [ ] All modules connected

## Testing After Refactor
```typescript
// Quick validation:
const orchestrator = new SimulationOrchestrator(config, gameDataStore)

// Check structure:
console.log(orchestrator.systems) // Should have all 7 systems
console.log(orchestrator.modules) // Should have all 5 modules

// Run simulation:
orchestrator.start()
const result = orchestrator.tick()
console.log(result) // Should have clean structure

// Verify functionality:
// - Hero makes decisions
// - Actions execute
// - Processes update
// - State changes
```

## Common Issues to Fix

1. **Import paths**: Update all imports to use SimulationOrchestrator
2. **System references**: Ensure all systems can find each other
3. **Event listeners**: Re-wire event handlers after moving code
4. **State access**: Use stateManager.getState() consistently
5. **Missing systems**: Don't forget to extract Forge, Mine, Helper

## Time Estimate
1-2 hours for extraction and cleanup
1 hour for testing and debugging

Total: 2-3 hours