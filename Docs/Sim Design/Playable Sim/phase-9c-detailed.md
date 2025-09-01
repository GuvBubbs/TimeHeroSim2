# Phase 9C: Extract System-Specific Actions - Detailed Implementation

## Overview
Extract ~1500 lines of system-specific action evaluation and execution from SimulationEngine into dedicated system files. This phase focuses on Adventure, Town, Tower, and Forge systems.

## File Structure After Phase 9C

```
src/utils/systems/
├── AdventureSystem.ts (new ~400 lines)
├── TownSystem.ts (new ~350 lines)
├── TowerSystem.ts (new ~300 lines)
├── ForgeSystem.ts (new ~350 lines)
├── CropSystem.ts (existing)
├── SeedSystem.ts (existing)
├── WaterSystem.ts (existing)
├── HelperSystem.ts (existing)
├── CombatSystem.ts (existing)
├── CraftingSystem.ts (existing)
└── MiningSystem.ts (existing)
```

## 1. AdventureSystem.ts - Detailed Structure

### Methods to Extract from SimulationEngine:
```typescript
// Lines ~2800-3200 in current SimulationEngine
- evaluateAdventureActions(currentLocation: GameLocation): GameAction[]
- canStartAdventure(routeId: string): boolean
- calculateAdventureRisk(routeId: string): number
- executeAdventureAction(action: GameAction): boolean
- startAdventure(routeId: string, length: 'short' | 'medium' | 'long'): void
- processOngoingAdventure(deltaTime: number): void
- completeAdventure(success: boolean): void
- calculateCombatOutcome(route: any, length: string): boolean
- dropArmor(boss: string): void
- awardAdventureRewards(route: any, length: string): void
```

### New AdventureSystem Interface:
```typescript
export interface IAdventureSystem {
  // Action evaluation
  evaluateActions(gameState: GameState, gameDataStore: GameDataStore): GameAction[]
  
  // Action execution
  executeAction(action: GameAction, gameState: GameState, gameDataStore: GameDataStore): ActionResult
  
  // Process ongoing adventures
  processAdventure(gameState: GameState, deltaTime: number, gameDataStore: GameDataStore): ProcessResult
  
  // Utility methods
  canStartAdventure(gameState: GameState, routeId: string, gameDataStore: GameDataStore): boolean
  calculateRisk(gameState: GameState, routeId: string, gameDataStore: GameDataStore): RiskLevel
}

export interface ActionResult {
  success: boolean
  stateChanges: Partial<GameState>
  events: GameEvent[]
  error?: string
}

export interface ProcessResult {
  completed: boolean
  stateChanges: Partial<GameState>
  events: GameEvent[]
}
```

### Implementation Pattern:
```typescript
export class AdventureSystem implements IAdventureSystem {
  evaluateActions(gameState: GameState, gameDataStore: GameDataStore): GameAction[] {
    const actions: GameAction[] = []
    
    // Check if already in adventure
    if (gameState.processes.adventure) {
      return [] // Can't start new adventure while one is ongoing
    }
    
    // Get available routes based on prerequisites
    const routes = gameDataStore.getItemsByCategory('adventures')
    for (const route of routes) {
      if (this.canStartAdventure(gameState, route.id, gameDataStore)) {
        // Add actions for short/medium/long variants
        for (const length of ['short', 'medium', 'long']) {
          actions.push(this.createAdventureAction(route, length, gameState))
        }
      }
    }
    
    return actions
  }
  
  executeAction(action: GameAction, gameState: GameState, gameDataStore: GameDataStore): ActionResult {
    // Validate prerequisites
    if (!this.canStartAdventure(gameState, action.targetId, gameDataStore)) {
      return { success: false, stateChanges: {}, events: [], error: 'Prerequisites not met' }
    }
    
    // Calculate energy cost
    const route = gameDataStore.getItemById(action.targetId)
    const energyCost = this.calculateEnergyCost(route, action.metadata.length)
    
    // Check resources
    if (gameState.resources.energy.current < energyCost) {
      return { success: false, stateChanges: {}, events: [], error: 'Insufficient energy' }
    }
    
    // Start adventure
    const stateChanges: Partial<GameState> = {
      resources: {
        ...gameState.resources,
        energy: {
          ...gameState.resources.energy,
          current: gameState.resources.energy.current - energyCost
        }
      },
      processes: {
        ...gameState.processes,
        adventure: {
          routeId: action.targetId,
          length: action.metadata.length,
          startTime: gameState.time.totalMinutes,
          duration: this.calculateDuration(route, action.metadata.length),
          progress: 0
        }
      },
      location: { current: 'adventure', lastVisited: gameState.location.current }
    }
    
    return {
      success: true,
      stateChanges,
      events: [{
        type: 'adventure_started',
        message: `Started ${action.metadata.length} adventure: ${route.name}`,
        timestamp: gameState.time.totalMinutes
      }]
    }
  }
}
```

### Migration Strategy:
1. Create AdventureSystem.ts with interface
2. Copy methods from SimulationEngine (don't delete yet)
3. Adapt methods to new interface pattern
4. Update SimulationEngine to use AdventureSystem
5. Test thoroughly
6. Remove old methods from SimulationEngine

## 2. TownSystem.ts - Detailed Structure

### Methods to Extract:
```typescript
// Lines ~3400-3750 in current SimulationEngine
- evaluateTownActions(): GameAction[]
- evaluatePurchaseActions(): GameAction[]
- evaluateBlueprintPurchases(): GameAction[]
- executePurchaseAction(action: GameAction): boolean
- canAffordPurchase(itemId: string): boolean
- purchaseBlueprint(blueprintId: string): void
- purchaseUpgrade(upgradeId: string): void
- unlockNewContent(itemId: string): void
- calculatePurchaseCost(item: any): ResourceCost
```

### New TownSystem Interface:
```typescript
export interface ITownSystem {
  // Action evaluation
  evaluateActions(gameState: GameState, gameDataStore: GameDataStore): GameAction[]
  
  // Purchase execution
  executePurchase(action: GameAction, gameState: GameState, gameDataStore: GameDataStore): ActionResult
  
  // Utility methods
  canAfford(gameState: GameState, itemId: string, gameDataStore: GameDataStore): boolean
  getPurchasableItems(gameState: GameState, gameDataStore: GameDataStore): GameDataItem[]
}

export interface PurchaseMetadata {
  vendor: string
  itemType: 'blueprint' | 'upgrade' | 'material' | 'skill'
  cost: ResourceCost
  unlocks: string[]
}
```

### Key Implementation Details:
```typescript
export class TownSystem implements ITownSystem {
  evaluateActions(gameState: GameState, gameDataStore: GameDataStore): GameAction[] {
    const actions: GameAction[] = []
    
    // Only evaluate if in town
    if (gameState.location.current !== 'town') {
      return []
    }
    
    // Get all vendors
    const vendors = ['blacksmith', 'agronomist', 'land_steward', 'carpenter', 'skills_trainer']
    
    for (const vendor of vendors) {
      const items = this.getVendorItems(vendor, gameDataStore)
      
      for (const item of items) {
        if (this.canPurchase(gameState, item, gameDataStore)) {
          actions.push({
            id: `purchase_${item.id}_${Date.now()}`,
            type: 'purchase',
            targetId: item.id,
            name: `Buy ${item.name}`,
            energyCost: 0,
            goldCost: item.gold || 0,
            materials: this.parseMaterials(item.materials),
            metadata: {
              vendor,
              itemType: this.getItemType(item),
              unlocks: this.getUnlocks(item)
            }
          })
        }
      }
    }
    
    return actions
  }
  
  private canPurchase(gameState: GameState, item: GameDataItem, gameDataStore: GameDataStore): boolean {
    // Check if already owned
    if (this.isOwned(gameState, item.id)) return false
    
    // Check prerequisites
    if (!this.checkPrerequisites(gameState, item, gameDataStore)) return false
    
    // Check resources
    if (!this.canAfford(gameState, item)) return false
    
    return true
  }
}
```

## 3. TowerSystem.ts - Detailed Structure

### Methods to Extract:
```typescript
// Lines ~2500-2800 in current SimulationEngine
- evaluateTowerActions(): GameAction[]
- evaluateSeedCatchingActions(): GameAction[]
- startSeedCatching(): void
- processSeedCatching(deltaTime: number): void
- completeSeedCatching(): void
- calculateCatchRate(windLevel: number): number
- navigateToWindLevel(level: number): void
```

### Critical Bug Fix During Extraction:
```typescript
// CURRENT BUG: Seed catching never completes
// In processOngoingActivities(), seed catching completion is not properly handled

// FIX in new TowerSystem:
processSeedCatching(gameState: GameState, deltaTime: number, gameDataStore: GameDataStore): ProcessResult {
  const process = gameState.processes.seedCatching
  if (!process) return { completed: false, stateChanges: {}, events: [] }
  
  // Update progress
  process.elapsedTime = (process.elapsedTime || 0) + deltaTime
  
  // Check completion (5 minutes default)
  if (process.elapsedTime >= process.duration) {
    // Calculate seeds caught
    const seedsCaught = this.calculateSeedsCaught(process.windLevel, process.duration)
    
    // Award seeds
    const stateChanges = this.awardSeeds(gameState, seedsCaught)
    
    // Clear process
    delete gameState.processes.seedCatching
    
    return {
      completed: true,
      stateChanges,
      events: [{
        type: 'seed_catching_complete',
        message: `Caught ${seedsCaught} seeds at wind level ${process.windLevel}`,
        timestamp: gameState.time.totalMinutes
      }]
    }
  }
  
  return { completed: false, stateChanges: {}, events: [] }
}
```

### Smart Tower Exit Logic:
```typescript
evaluateActions(gameState: GameState, gameDataStore: GameDataStore): GameAction[] {
  const actions: GameAction[] = []
  
  // Only evaluate if at tower
  if (gameState.location.current !== 'tower') {
    return []
  }
  
  // Check if should return to farm
  const seedCount = this.getTotalSeeds(gameState)
  const plotCount = gameState.farm.plots
  const seedTarget = Math.max(plotCount * 2, 6)
  
  if (seedCount >= seedTarget) {
    // Auto-generate return to farm action
    actions.push({
      id: `auto_return_farm_${Date.now()}`,
      type: 'move',
      target: 'farm',
      name: 'Return to Farm (seeds sufficient)',
      energyCost: 0,
      score: 1000 // High priority to leave
    })
  } else {
    // Generate seed catching actions
    const windLevels = this.getAccessibleWindLevels(gameState)
    for (const level of windLevels) {
      actions.push(this.createCatchAction(level, gameState))
    }
  }
  
  return actions
}
```

## 4. ForgeSystem.ts - Detailed Structure

### Methods to Extract:
```typescript
// Lines ~3750-4100 in current SimulationEngine
- evaluateForgeActions(): GameAction[]
- evaluateCraftingActions(): GameAction[]
- evaluateRefinementActions(): GameAction[]
- startCrafting(recipeId: string): void
- processCrafting(deltaTime: number): void
- completeCrafting(): void
- manageHeat(deltaTime: number): void
- calculateCraftingSuccess(heat: number): boolean
```

### Heat Management Integration:
```typescript
export class ForgeSystem implements IForgeSystem {
  private updateHeat(gameState: GameState, deltaTime: number): void {
    const forge = gameState.systems.forge
    if (!forge) return
    
    // Heat decay when idle
    if (!gameState.processes.crafting) {
      forge.currentHeat = Math.max(
        forge.minIdleHeat,
        forge.currentHeat - (50 * deltaTime / 60)
      )
    }
    
    // Heat management during crafting
    if (gameState.processes.crafting && forge.autoBellows) {
      // Auto-bellows maintains optimal heat
      const optimalHeat = 3000
      if (forge.currentHeat < optimalHeat) {
        forge.currentHeat = Math.min(
          optimalHeat,
          forge.currentHeat + (100 * deltaTime / 60)
        )
      }
    }
  }
  
  processCrafting(gameState: GameState, deltaTime: number, gameDataStore: GameDataStore): ProcessResult {
    // Update heat first
    this.updateHeat(gameState, deltaTime)
    
    const process = gameState.processes.crafting
    if (!process) return { completed: false, stateChanges: {}, events: [] }
    
    // Update progress based on furnace speed
    const speedMultiplier = 1 + (gameState.systems.forge?.furnaceLevel || 0) * 0.2
    process.progress += (deltaTime / process.duration) * speedMultiplier
    
    // Check completion
    if (process.progress >= 1) {
      return this.completeCrafting(gameState, process, gameDataStore)
    }
    
    return { completed: false, stateChanges: {}, events: [] }
  }
}
```

## Migration Checklist for Phase 9C

### Step 1: Create New System Files
- [ ] Create AdventureSystem.ts with interface
- [ ] Create TownSystem.ts with interface  
- [ ] Create TowerSystem.ts with interface
- [ ] Create ForgeSystem.ts with interface

### Step 2: Extract Methods
- [ ] Copy methods to new files (keep originals for now)
- [ ] Adapt to new interface pattern
- [ ] Fix any TypeScript errors
- [ ] Add proper imports

### Step 3: Update SimulationEngine
```typescript
// In SimulationEngine constructor
private adventureSystem: IAdventureSystem
private townSystem: ITownSystem
private towerSystem: ITowerSystem
private forgeSystem: IForgeSystem

constructor(config: SimulationConfig, gameDataStore: GameDataStore) {
  // ... existing code
  this.adventureSystem = new AdventureSystem()
  this.townSystem = new TownSystem()
  this.towerSystem = new TowerSystem()
  this.forgeSystem = new ForgeSystem()
}

// In evaluateAllActions()
private evaluateAllActions(): GameAction[] {
  const actions: GameAction[] = []
  
  // Use new systems
  actions.push(...this.adventureSystem.evaluateActions(this.gameState, this.gameDataStore))
  actions.push(...this.townSystem.evaluateActions(this.gameState, this.gameDataStore))
  actions.push(...this.towerSystem.evaluateActions(this.gameState, this.gameDataStore))
  actions.push(...this.forgeSystem.evaluateActions(this.gameState, this.gameDataStore))
  
  // Keep existing farm actions for now
  actions.push(...this.evaluateFarmActions())
  
  return actions
}

// In executeAction()
private executeAction(action: GameAction): boolean {
  switch (action.type) {
    case 'adventure':
      const result = this.adventureSystem.executeAction(action, this.gameState, this.gameDataStore)
      if (result.success) {
        this.applyStateChanges(result.stateChanges)
        this.logEvents(result.events)
      }
      return result.success
      
    case 'purchase':
      const purchaseResult = this.townSystem.executePurchase(action, this.gameState, this.gameDataStore)
      // ... handle result
      
    // ... other cases
  }
}
```

### Step 4: Test Each System
- [ ] Test adventure starting and completion
- [ ] Test town purchases and blueprint flow
- [ ] Test tower seed catching (verify bug fix)
- [ ] Test forge crafting and heat management

### Step 5: Clean Up
- [ ] Remove extracted methods from SimulationEngine
- [ ] Update imports throughout codebase
- [ ] Run full simulation test
- [ ] Update SimulationEngine-As-Built.md

## Common Pitfalls to Avoid

1. **State Mutations**: Always return state changes, don't mutate directly
2. **Event Logging**: Ensure all events are properly returned and logged
3. **Prerequisites**: Maintain prerequisite checking in new systems
4. **Resource Validation**: Always validate resources before execution
5. **Process Coordination**: Ensure processes don't conflict

## Testing Strategy

```typescript
// Test each system in isolation
describe('AdventureSystem', () => {
  it('should evaluate available adventures', () => {
    const gameState = createMockGameState()
    const actions = adventureSystem.evaluateActions(gameState, gameDataStore)
    expect(actions).toHaveLength(3) // short, medium, long
  })
  
  it('should execute adventure start', () => {
    const action = createAdventureAction()
    const result = adventureSystem.executeAction(action, gameState, gameDataStore)
    expect(result.success).toBe(true)
    expect(result.stateChanges.processes.adventure).toBeDefined()
  })
})
```

## Benefits After Phase 9C

1. **Reduced Complexity**: SimulationEngine drops from 5659 to ~4159 lines
2. **System Isolation**: Each game system has its own file
3. **Bug Fixes**: Seed catching completion fixed during extraction
4. **Testability**: Systems can be tested independently
5. **Maintainability**: Changes to one system don't affect others

## Next Phase Preview
Phase 9D will extract the decision-making logic, creating a clean separation between "what to do" (DecisionEngine) and "how to do it" (System implementations).