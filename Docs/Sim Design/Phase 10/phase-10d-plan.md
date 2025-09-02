# Phase 10D: Extract Town and Tower Systems - Focused Refactor

## Objective
Extract Town and Tower systems from SimulationEngine into dedicated modules. These are smaller systems that should be quick to extract.

## Current State
- SimulationEngine: ~2500 lines (after Phases 10A-C)
- Town logic (purchases, blueprints) still embedded
- Tower logic (seed catching, navigation) still embedded

## Target State
- Create `src/utils/systems/TownSystem.ts` (~200 lines)
- Create `src/utils/systems/TowerSystem.ts` (~150 lines)
- SimulationEngine reduced to ~2150 lines

## Files to Create/Modify

### 1. Create `src/utils/systems/TownSystem.ts`

```typescript
export class TownSystem {
  constructor(
    private eventBus: IEventBus,
    private stateManager: IStateManager,
    private validationService: IValidationService
  ) {}

  // Methods to extract from SimulationEngine:
  evaluateActions(gameState: GameState, gameDataStore: GameDataStore): GameAction[]
  executePurchase(action: GameAction, gameState: GameState, gameDataStore: GameDataStore): ActionResult
  
  // Helper methods:
  private canAffordItem(itemId: string, gameState: GameState, gameDataStore: GameDataStore): boolean
  private getPurchasableItems(gameState: GameState, gameDataStore: GameDataStore): GameDataItem[]
  private applyPurchase(itemId: string, gameState: GameState): void
  private unlockBlueprint(blueprintId: string, gameState: GameState): void
}
```

### 2. Create `src/utils/systems/TowerSystem.ts`

```typescript
export class TowerSystem {
  constructor(
    private eventBus: IEventBus,
    private stateManager: IStateManager,
    private validationService: IValidationService,
    private processManager: ProcessManager  // For starting seed catching
  ) {}

  // Methods to extract:
  evaluateActions(gameState: GameState, gameDataStore: GameDataStore): GameAction[]
  executeAction(action: GameAction, gameState: GameState, gameDataStore: GameDataStore): ActionResult
  
  // Tower-specific methods:
  private startSeedCatching(windLevel: number, duration: number, gameState: GameState): string
  private canAccessWindLevel(level: number, gameState: GameState): boolean
  private getAvailableWindLevels(gameState: GameState): number[]
  private shouldReturnToFarm(gameState: GameState): boolean
}
```

## Extraction Instructions

### Town System Extraction

1. **Find all town-related code**:
   - Search for: `evaluateTownActions`, `purchase`, `blueprint`, `vendor`
   - Look for shop/buying logic
   - Find gold spending code

2. **Move purchase logic**:
   ```typescript
   // From SimulationEngine:
   if (action.type === 'purchase') {
     // 50+ lines of purchase logic
   }
   
   // To TownSystem:
   executePurchase(action: GameAction, gameState: GameState, gameDataStore: GameDataStore): ActionResult {
     // Same logic, but using stateManager for state changes
   }
   ```

3. **State management pattern**:
   ```typescript
   // Use stateManager for purchases:
   this.stateManager.updateResource({
     type: 'gold',
     operation: 'subtract',
     amount: cost
   })
   
   // Emit events:
   this.eventBus.emit('item_purchased', {
     itemId,
     cost,
     timestamp: gameState.time.totalMinutes
   })
   ```

### Tower System Extraction

1. **Find tower code**:
   - Search for: `tower`, `seed`, `catch`, `wind`
   - Look for seed catching initiation
   - Find tower navigation logic

2. **Extract seed catching**:
   ```typescript
   // Tower initiates, ProcessManager handles ongoing
   startSeedCatching(windLevel: number, duration: number, gameState: GameState): string {
     const processId = this.processManager.startProcess('seed_catching', {
       windLevel,
       duration,
       startTime: gameState.time.totalMinutes
     })
     
     this.eventBus.emit('seed_catching_started', { windLevel, duration })
     return processId
   }
   ```

3. **Smart tower exit logic**:
   ```typescript
   shouldReturnToFarm(gameState: GameState): boolean {
     const totalSeeds = Array.from(gameState.resources.seeds.values()).reduce((a, b) => a + b, 0)
     const targetSeeds = Math.max(gameState.farm.plots * 2, 6)
     return totalSeeds >= targetSeeds
   }
   ```

## Integration Pattern

### Update SimulationEngine

```typescript
// Add systems to constructor:
private townSystem: TownSystem
private towerSystem: TowerSystem

constructor() {
  // ... existing systems
  this.townSystem = new TownSystem(this.eventBus, this.stateManager, this.validationService)
  this.towerSystem = new TowerSystem(this.eventBus, this.stateManager, this.validationService, this.processManager)
}

// In evaluateAllActions():
switch (gameState.location.current) {
  case 'town':
    actions.push(...this.townSystem.evaluateActions(gameState, gameDataStore))
    break
  case 'tower':
    actions.push(...this.towerSystem.evaluateActions(gameState, gameDataStore))
    break
}

// In executeAction():
case 'purchase':
  return this.townSystem.executePurchase(action, gameState, gameDataStore)
case 'catch_seeds':
  return this.towerSystem.executeAction(action, gameState, gameDataStore)
```

## Success Criteria
- [ ] All town logic in TownSystem
- [ ] All tower logic in TowerSystem
- [ ] SimulationEngine ~2150 lines
- [ ] Purchases still work
- [ ] Seed catching still initiates
- [ ] Tower navigation logic preserved

## Testing Checklist
```typescript
// Town System:
// 1. Start simulation
// 2. Navigate to town
// 3. Purchase a blueprint
// 4. Verify gold deducted
// 5. Verify blueprint unlocked

// Tower System:
// 1. Navigate to tower
// 2. Start seed catching
// 3. Verify process starts
// 4. Check auto-return when seeds sufficient
```

## Common Pitfalls
1. Don't forget tower needs ProcessManager for seed catching
2. Ensure purchase validation uses ValidationService
3. Keep purchase unlocks working (blueprints enable building)
4. Preserve seed threshold logic for tower exit

## Time Estimate
1 hour total (these are smaller, simpler systems)