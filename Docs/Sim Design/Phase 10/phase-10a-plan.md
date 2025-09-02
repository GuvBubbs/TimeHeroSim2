# Phase 10A: Extract Farm Actions - Focused Refactor

## Objective
Extract ONLY farm-related actions from SimulationEngine into a dedicated FarmSystem module. This is a smaller, more achievable scope than the original Phase 9C.

## Current State
- SimulationEngine: ~3450 lines
- Farm logic scattered throughout
- Methods like `evaluateFarmActions()`, `executePlantAction()`, `executeHarvestAction()` still in main file

## Target State
- Create `src/utils/systems/FarmSystem.ts` (~300 lines)
- Move ALL farm-specific logic out of SimulationEngine
- SimulationEngine reduced to ~3150 lines

## Files to Create/Modify

### 1. Create `src/utils/systems/FarmSystem.ts`

```typescript
export class FarmSystem {
  constructor(
    private eventBus: IEventBus,
    private stateManager: IStateManager,
    private validationService: IValidationService
  ) {}

  // Methods to extract from SimulationEngine:
  evaluateActions(gameState: GameState, gameDataStore: GameDataStore): GameAction[]
  executePlantAction(action: GameAction, gameState: GameState): ActionResult
  executeHarvestAction(action: GameAction, gameState: GameState): ActionResult
  executePumpAction(action: GameAction, gameState: GameState): ActionResult
  executeCleanupAction(action: GameAction, gameState: GameState): ActionResult
  
  // Helper methods:
  private findAvailablePlot(gameState: GameState): number
  private getCropAtPlot(plotIndex: number, gameState: GameState): CropProcess | null
  private getReadyCrops(gameState: GameState): CropProcess[]
  private calculateWaterNeeded(gameState: GameState): number
}
```

### 2. Update SimulationEngine

Remove these methods:
- `evaluateFarmActions()` (~50 lines)
- `executePlantAction()` (~40 lines)
- `executeHarvestAction()` (~35 lines)
- `executePumpAction()` (~30 lines)
- `executeCleanupAction()` (~45 lines)
- Helper methods (~100 lines)

Add:
```typescript
private farmSystem: FarmSystem

constructor() {
  this.farmSystem = new FarmSystem(this.eventBus, this.stateManager, this.validationService)
}
```

## Specific Extraction Instructions

### Step 1: Create FarmSystem class
1. Copy the farm-related methods from SimulationEngine
2. Update method signatures to match the interface
3. Replace direct state mutations with stateManager calls
4. Replace console.log with eventBus.emit

### Step 2: Update method implementations
```typescript
// Before (in SimulationEngine):
this.gameState.resources.energy.current -= energyCost

// After (in FarmSystem):
this.stateManager.updateResource({
  type: 'energy',
  operation: 'subtract',
  amount: energyCost
})
```

### Step 3: Wire up in SimulationEngine
```typescript
// In evaluateAllActions():
if (location === 'farm') {
  actions.push(...this.farmSystem.evaluateActions(this.gameState, this.gameDataStore))
}

// In executeAction():
case 'plant':
  return this.farmSystem.executePlantAction(action, this.gameState)
```

## Success Criteria
- [ ] All farm methods moved to FarmSystem
- [ ] SimulationEngine reduced by ~300 lines
- [ ] All farm actions still work
- [ ] No direct state mutations in FarmSystem
- [ ] Uses stateManager for all state changes

## Testing Checklist
```typescript
// Quick test in console:
const sim = simulationStore.currentSimulation
sim.farmSystem // Should exist
sim.executePlantAction // Should NOT exist (moved to farmSystem)

// Functional test:
// 1. Start simulation
// 2. Verify hero can plant seeds
// 3. Verify crops grow
// 4. Verify hero can harvest
// 5. Verify water pumping works
```

## Common Issues to Avoid
1. Don't forget to pass gameDataStore to methods that need it
2. Ensure all state changes go through stateManager
3. Keep the original method logic intact (just move it)
4. Update all references in SimulationEngine

## Time Estimate
This should take 1-2 hours to implement properly.