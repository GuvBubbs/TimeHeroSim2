# Phase 10B: Extract Adventure System - Focused Refactor

## Objective
Extract adventure and combat logic from SimulationEngine into AdventureSystem. Keep scope tight and achievable.

## Current State
- Adventure logic mixed in SimulationEngine
- Combat calculations scattered
- Boss mechanics embedded in main file

## Target State
- Create `src/utils/systems/AdventureSystem.ts` (~250 lines)
- SimulationEngine reduced by another ~250 lines

## Files to Create/Modify

### 1. Create `src/utils/systems/AdventureSystem.ts`

```typescript
export class AdventureSystem {
  constructor(
    private eventBus: IEventBus,
    private stateManager: IStateManager,
    private validationService: IValidationService
  ) {}

  // Core methods to extract:
  evaluateActions(gameState: GameState, gameDataStore: GameDataStore): GameAction[]
  startAdventure(action: GameAction, gameState: GameState, gameDataStore: GameDataStore): ActionResult
  processAdventure(gameState: GameState, deltaTime: number): ProcessResult
  completeAdventure(gameState: GameState, success: boolean): CompletionResult
  
  // Combat methods:
  private calculateCombatOutcome(route: any, equipment: Equipment): CombatResult
  private applyBossChallenge(boss: string, equipment: Equipment): number
  private calculateDamage(weaponType: string, enemyType: string): number
}
```

### 2. Extraction Pattern

```typescript
// Move from SimulationEngine:
private processOngoingAdventure(deltaTime: number) {
  // ~100 lines of adventure logic
}

// To AdventureSystem:
processAdventure(gameState: GameState, deltaTime: number): ProcessResult {
  // Same logic, but using this.stateManager for state changes
}
```

## Specific Instructions

### Step 1: Identify all adventure methods
Search SimulationEngine for:
- `adventure` (case insensitive)
- `combat`
- `boss`
- `route`
- `enemy`

### Step 2: Extract in order
1. First extract evaluation methods
2. Then execution methods
3. Finally helper/calculation methods
4. Update all references

### Step 3: State management pattern
```typescript
// Use stateManager for all changes:
const result = this.stateManager.updateState({
  changes: [{
    path: 'processes.adventure',
    newValue: adventureProcess,
    operation: 'set'
  }],
  reason: 'Adventure started',
  source: 'AdventureSystem'
})
```

## Success Criteria
- [ ] All adventure logic in AdventureSystem
- [ ] Combat calculations consolidated
- [ ] Boss mechanics properly extracted
- [ ] SimulationEngine ~2900 lines (down from ~3150)

## Time Estimate
1-2 hours for extraction and testing