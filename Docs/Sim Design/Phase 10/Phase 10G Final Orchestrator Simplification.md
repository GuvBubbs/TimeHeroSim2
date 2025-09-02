# Phase 10G: Final Orchestrator Simplification

## Context Within Phase 10
This is the culmination phase where SimulationEngine becomes a pure orchestrator. All game logic has been extracted to systems, action routing is clean, and state management is consolidated. Now we create the final, minimal orchestrator.

**Previous**: Phase 10F consolidated state management (~200 lines removed)
**Current**: Final simplification to pure orchestrator (~459 lines)
**Next**: Phase 10H will test and validate everything works

**SimulationEngine Status**: ~959 lines → Target: ~500 lines for final orchestrator

## What Remains to Remove

### Helper Methods (~200 lines)
```typescript
// These utility methods should move to appropriate places:
calculateDistance()          → GeometryUtils
formatTime()                  → TimeUtils  
getRandomElement()           → RandomUtils
clamp()                      → MathUtils
deepClone()                  → ObjectUtils
validateConfig()             → ConfigValidator
parseCSV()                   → DataLoader
// ... many more
```

### Configuration Logic (~100 lines)
```typescript
// Move to ConfigurationManager:
loadConfiguration()
validateConfiguration()
mergeDefaultConfig()
applyDifficultyModifiers()
```

### Analytics & Logging (~80 lines)
```typescript
// Move to AnalyticsService:
trackAction()
logPerformance()
generateReport()
captureMetrics()
```

### Debug Methods (~79 lines)
```typescript
// Move to DebugService or remove:
dumpState()
validateState()
checkInvariants()
printDebugInfo()
```

## Target Structure

```typescript
// SimulationOrchestrator.ts - FINAL FORM (~500 lines)
class SimulationOrchestrator {
  // ============ INITIALIZATION (50 lines) ============
  private systems: SystemRegistry;
  private actionRouter: ActionRouter;
  private stateManager: StateManager;
  private eventBus: EventBus;
  private config: SimulationConfig;

  constructor(config: SimulationConfig, gameData: GameDataStore) {
    this.config = config;
    this.initializeSystems(gameData);
    this.initializeState();
    this.setupEventHandlers();
  }

  private initializeSystems(gameData: GameDataStore): void {
    this.systems = createSystemRegistry(gameData);
    this.actionRouter = new ActionRouter(this.systems);
  }

  private initializeState(): void {
    const initialState = createInitialState(this.config);
    this.stateManager = new StateManager(initialState);
  }

  // ============ MAIN LOOP (100 lines) ============
  tick(deltaTime: number): TickResult {
    // 1. Update game time
    this.updateTime(deltaTime);
    
    // 2. Process systems
    const systemResults = this.processSystems(deltaTime);
    
    // 3. Get AI decisions
    const actions = this.getAIDecisions();
    
    // 4. Execute actions
    const actionResults = this.executeActions(actions);
    
    // 5. Process events
    this.processEvents();
    
    // 6. Check game status
    const status = this.checkGameStatus();
    
    // 7. Return tick result
    return {
      state: this.stateManager.getState(),
      actions: actionResults,
      events: this.eventBus.flush(),
      status,
      deltaTime
    };
  }

  private updateTime(deltaTime: number): void {
    this.stateManager.advanceTime(deltaTime);
  }

  private processSystems(deltaTime: number): SystemTickResult[] {
    const state = this.stateManager.getState();
    const modifiers = this.systems.helper.getModifiers(state);
    
    const results: SystemTickResult[] = [];
    for (const [name, system] of Object.entries(this.systems.core)) {
      const result = system.tick(deltaTime, state, modifiers);
      results.push(result);
      
      // Apply system state changes
      if (result.stateChanges) {
        this.stateManager.applyChanges(result.stateChanges);
      }
    }
    
    return results;
  }

  // ============ AI DECISIONS (50 lines) ============
  private getAIDecisions(): GameAction[] {
    const state = this.stateManager.getState();
    const actions: GameAction[] = [];
    
    // Collect possible actions from all systems
    for (const system of Object.values(this.systems.core)) {
      const systemActions = system.evaluateActions(state, this.config);
      actions.push(...systemActions);
    }
    
    // Filter and prioritize
    const validActions = actions.filter(action => 
      this.systems.prerequisites.validate(action, state).valid
    );
    
    // Apply persona strategy
    const persona = this.config.persona || 'balanced';
    return this.prioritizeActions(validActions, persona);
  }

  private prioritizeActions(actions: GameAction[], persona: string): GameAction[] {
    // Simple prioritization (real logic in DecisionEngine if needed)
    return actions
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, this.config.maxActionsPerTick || 3);
  }

  // ============ ACTION EXECUTION (30 lines) ============
  private executeActions(actions: GameAction[]): ActionResult[] {
    const results: ActionResult[] = [];
    
    for (const action of actions) {
      const result = this.actionRouter.route(action, this.stateManager.getState());
      results.push(result);
      
      if (result.success) {
        this.eventBus.emit('action.executed', { action, result });
      } else {
        this.eventBus.emit('action.failed', { action, result });
      }
    }
    
    return results;
  }

  // ============ EVENT PROCESSING (30 lines) ============
  private processEvents(): void {
    // Events are handled by systems via subscription
    // This just ensures critical events are processed
    const criticalEvents = this.eventBus.getCritical();
    for (const event of criticalEvents) {
      this.handleCriticalEvent(event);
    }
  }

  private handleCriticalEvent(event: GameEvent): void {
    // Handle game-ending events
    if (event.type === 'game.victory' || event.type === 'game.defeat') {
      this.handleGameEnd(event);
    }
  }

  // ============ STATUS CHECKING (50 lines) ============
  private checkGameStatus(): GameStatus {
    const state = this.stateManager.getState();
    
    return {
      isComplete: this.checkVictoryConditions(state),
      isStuck: this.checkBottleneckConditions(state),
      phase: state.gamePhase,
      playtime: state.currentTime,
      score: this.calculateScore(state)
    };
  }

  private checkVictoryConditions(state: GameState): boolean {
    // Check if endgame objectives met
    return state.objectives?.endgame?.completed || false;
  }

  private checkBottleneckConditions(state: GameState): boolean {
    // Check if player is stuck
    const noEnergy = state.resources.energy === 0;
    const noActions = state.lastActionTime > state.currentTime - 300000; // 5 min
    return noEnergy && noActions;
  }

  private calculateScore(state: GameState): number {
    // Simple scoring
    return state.player.level * 1000 + 
           state.resources.gold + 
           state.farm.plots.length * 100;
  }

  // ============ PUBLIC INTERFACE (40 lines) ============
  getState(): Readonly<GameState> {
    return this.stateManager.getState();
  }

  getConfig(): Readonly<SimulationConfig> {
    return this.config;
  }

  getSystems(): Readonly<SystemRegistry> {
    return this.systems;
  }

  pause(): void {
    this.eventBus.emit('game.paused');
  }

  resume(): void {
    this.eventBus.emit('game.resumed');
  }

  save(): SaveGame {
    return {
      state: this.stateManager.getState(),
      config: this.config,
      timestamp: Date.now()
    };
  }

  load(saveGame: SaveGame): void {
    this.stateManager.setState(saveGame.state);
    this.config = saveGame.config;
    this.eventBus.emit('game.loaded');
  }

  // ============ EVENT SETUP (50 lines) ============
  private setupEventHandlers(): void {
    // System coordination events
    this.eventBus.on('resource.depleted', (resource) => {
      this.handleResourceDepletion(resource);
    });
    
    this.eventBus.on('objective.completed', (objective) => {
      this.handleObjectiveCompletion(objective);
    });
    
    // ... other critical event handlers
  }

  // ============ CLEANUP (20 lines) ============
  destroy(): void {
    this.eventBus.removeAllListeners();
    for (const system of Object.values(this.systems.core)) {
      if (system.destroy) {
        system.destroy();
      }
    }
  }
}

// ============ TOTAL: ~500 lines ============
```

## What Gets Moved Where

### Create UtilityService
```typescript
// /src/utils/UtilityService.ts
export class UtilityService {
  static calculateDistance(a: Point, b: Point): number { }
  static formatTime(seconds: number): string { }
  static clamp(value: number, min: number, max: number): number { }
  static deepClone<T>(obj: T): T { }
  static getRandomElement<T>(array: T[]): T { }
}
```

### Create ConfigurationManager
```typescript
// /src/utils/ConfigurationManager.ts
export class ConfigurationManager {
  static load(path: string): SimulationConfig { }
  static validate(config: SimulationConfig): ValidationResult { }
  static applyDefaults(config: Partial<SimulationConfig>): SimulationConfig { }
}
```

### Create DebugService
```typescript
// /src/utils/DebugService.ts
export class DebugService {
  static dumpState(state: GameState): void { }
  static validateInvariants(state: GameState): ValidationResult { }
  static captureMetrics(state: GameState): Metrics { }
}
```

## Success Criteria
- [ ] SimulationOrchestrator ≤ 500 lines (absolutely max 1000)
- [ ] Only orchestration logic remains
- [ ] No game logic in orchestrator
- [ ] No utility functions in orchestrator
- [ ] Clean, readable structure
- [ ] All functionality preserved

## Time Estimate
- **Expected**: 3 hours
- **Create new orchestrator**: 1 hour
- **Move utilities**: 1 hour
- **Final cleanup**: 1 hour
- **Risk**: Integration complexity

## Implementation Prompt for GitHub Copilot

**Attach these files:**
- `/src/utils/SimulationEngine.ts`
- `/src/utils/systems/systemRegistry.ts`
- `/src/utils/ActionRouter.ts`
- `/src/utils/StateManager.ts`
- `/src/utils/EventBus.ts`

**Prompt:**
```
Phase 10G: Create final pure orchestrator under 500 lines

CREATE NEW FILE /src/utils/SimulationOrchestrator.ts:
Start FRESH - do NOT copy SimulationEngine. Build from scratch with ONLY:

1. Constructor & initialization (~50 lines)
2. Main tick() method (~100 lines)
3. AI decision gathering (~50 lines)
4. Action execution routing (~30 lines)
5. Event processing (~30 lines)
6. Status checking (~50 lines)
7. Public interface (~40 lines)
8. Event setup (~50 lines)
9. Cleanup (~20 lines)

TOTAL TARGET: ~500 lines (MAX 1000)

EXTRACT FROM SIMULATIONENGINE:
1. Move all utility methods to /src/utils/UtilityService.ts:
   - calculateDistance, formatTime, clamp, deepClone, getRandomElement
   
2. Move configuration logic to /src/utils/ConfigurationManager.ts:
   - loadConfiguration, validateConfiguration, applyDefaults
   
3. Move debug methods to /src/utils/DebugService.ts:
   - dumpState, validateInvariants, captureMetrics

The orchestrator should ONLY:
- Initialize systems
- Call tick() on systems
- Route actions through ActionRouter
- Check win/lose conditions
- Coordinate between systems
- Emit events

NO game logic, NO direct state manipulation, NO utility functions!

After creating SimulationOrchestrator, update:
- Worker to use SimulationOrchestrator instead of SimulationEngine
- Tests to use new orchestrator

Document in /Docs/Sim Design/Phase10G-FinalOrchestrator-Complete.md:
- Final line count
- What was moved where
- Integration points
```

## Next Phase Preview
Phase 10H will thoroughly test the new architecture, fix any remaining bugs (especially the seed catching issue), update all documentation, and verify the refactor is complete and working.