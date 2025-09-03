# Phase 10F: State Management Consolidation

## Context Within Phase 10
Direct state mutations are scattered throughout SimulationEngine, making it hard to track changes and implement features like undo/redo or state replay. This phase consolidates all state changes through StateManager.

**Previous**: Phase 10E implemented ActionRouter (~1,000 lines removed)
**Current**: Consolidate state management (~200 lines removed)
**Next**: Phase 10G will create the final clean orchestrator

**SimulationEngine Status**: ~1,159 lines → Target: ~959 lines after this phase

## Current Problem

SimulationEngine has direct state mutations everywhere:
```typescript
// Current - Direct mutations scattered throughout
this.gameState.resources.energy -= action.cost;
this.gameState.farm.plots[plotId].crop = newCrop;
this.gameState.farm.plots[plotId].growthStage++;
this.gameState.player.experience += xpGained;
this.gameState.town.vendors[vendorId].inventory.splice(index, 1);
this.gameState.adventure.active = null;

// Over 200+ direct mutations throughout the file!
```

## Target Architecture

```typescript
// StateManager - All changes go through here
class StateManager {
  private state: GameState;
  private history: StateSnapshot[] = [];
  private listeners: StateListener[] = [];

  // Resource management
  consumeResource(resource: ResourceType, amount: number): boolean {
    if (this.state.resources[resource] < amount) {
      return false;
    }
    this.state.resources[resource] -= amount;
    this.emit('resourceConsumed', { resource, amount });
    return true;
  }

  addResource(resource: ResourceType, amount: number): void {
    this.state.resources[resource] += amount;
    this.emit('resourceAdded', { resource, amount });
  }

  // Farm management
  updatePlot(plotId: number, changes: Partial<Plot>): void {
    Object.assign(this.state.farm.plots[plotId], changes);
    this.emit('plotUpdated', { plotId, changes });
  }

  // Player management
  addExperience(amount: number): void {
    this.state.player.experience += amount;
    const oldLevel = this.state.player.level;
    this.updateLevel();
    if (this.state.player.level > oldLevel) {
      this.emit('levelUp', { 
        oldLevel, 
        newLevel: this.state.player.level 
      });
    }
  }

  // Transaction support
  transaction<T>(fn: () => T): T {
    const snapshot = this.createSnapshot();
    try {
      const result = fn();
      this.commit();
      return result;
    } catch (error) {
      this.rollback(snapshot);
      throw error;
    }
  }

  // State access (read-only)
  getState(): Readonly<GameState> {
    return this.state;
  }

  // Event system
  private emit(event: string, data: any): void {
    this.listeners.forEach(listener => 
      listener(event, data)
    );
  }
}
```

## Refactoring Pattern

### Step 1: Identify State Mutation Patterns
Common patterns to find and replace:
```typescript
// Pattern 1: Direct resource modification
// OLD:
this.gameState.resources.energy -= 50;
// NEW:
this.stateManager.consumeResource('energy', 50);

// Pattern 2: Object property updates
// OLD:
this.gameState.farm.plots[0].crop = 'wheat';
this.gameState.farm.plots[0].growthStage = 1;
// NEW:
this.stateManager.updatePlot(0, { 
  crop: 'wheat', 
  growthStage: 1 
});

// Pattern 3: Array modifications
// OLD:
this.gameState.inventory.items.push(newItem);
// NEW:
this.stateManager.addInventoryItem(newItem);

// Pattern 4: Complex state updates
// OLD:
this.gameState.adventure.active = {
  route: routeId,
  startTime: currentTime,
  heroHP: this.gameState.player.maxHP
};
// NEW:
this.stateManager.startAdventure(routeId, currentTime);
```

### Step 2: StateManager Methods to Add

```typescript
// Add these methods to StateManager
class StateManager {
  // Resource Management
  consumeResource(type: ResourceType, amount: number): boolean
  addResource(type: ResourceType, amount: number): void
  transferResource(from: ResourceType, to: ResourceType, rate: number): void

  // Farm Management  
  updatePlot(id: number, changes: Partial<Plot>): void
  harvestPlot(id: number): HarvestResult
  plantSeed(plotId: number, seedType: string): void

  // Player Management
  addExperience(amount: number): void
  updateHealth(change: number): void
  setLocation(screen: ScreenType): void

  // Inventory Management
  addInventoryItem(item: Item): boolean
  removeInventoryItem(itemId: string): boolean
  equipItem(itemId: string, slot: SlotType): void

  // Adventure Management
  startAdventure(routeId: string, loadout: Loadout): void
  updateAdventureProgress(progress: number): void
  completeAdventure(result: AdventureResult): void

  // Town Management
  purchaseItem(vendorId: string, itemId: string): boolean
  unlockBuilding(buildingId: string): void
  
  // Helper Management
  assignHelper(helperId: string, role: HelperRole): void
  levelUpHelper(helperId: string): void
}
```

### Step 3: Event Integration

```typescript
// Connect StateManager to EventBus
class SimulationEngine {
  constructor() {
    // ... existing setup
    
    // Connect state changes to event bus
    this.stateManager.on('resourceConsumed', (data) => {
      this.eventBus.emit('game.resource.consumed', data);
    });
    
    this.stateManager.on('levelUp', (data) => {
      this.eventBus.emit('player.levelUp', data);
      this.checkUnlocks(data.newLevel);
    });
    
    this.stateManager.on('plotUpdated', (data) => {
      this.eventBus.emit('farm.plot.updated', data);
    });
  }
}
```

## Migration Strategy

### Phase 1: Add StateManager Methods
1. Add methods for common operations
2. Include event emission
3. Add validation where needed

### Phase 2: Replace Direct Mutations
1. Search for `this.gameState.` in SimulationEngine
2. Replace each with appropriate StateManager call
3. Test after each replacement batch

### Phase 3: Remove State Access
1. Replace `this.gameState` with `this.stateManager.getState()`
2. Ensure state is read-only outside StateManager
3. Add TypeScript readonly markers

## Success Criteria
- [ ] Zero direct state mutations in SimulationEngine
- [ ] All state changes through StateManager methods
- [ ] Events firing for major state changes
- [ ] Transaction support for complex operations
- [ ] SimulationEngine reduced by ~200 lines
- [ ] State is read-only outside StateManager

## Time Estimate
- **Expected**: 2 hours
- **Method Addition**: 45 minutes
- **Mutation Replacement**: 45 minutes
- **Testing & Validation**: 30 minutes
- **Risk**: Missing edge cases

## Implementation Prompt for GitHub Copilot

**Attach these files:**
- `/src/utils/SimulationEngine.ts`
- `/src/utils/StateManager.ts`
- `/src/utils/EventBus.ts`
- `/src/types/gameState.ts`

**Prompt:**
```
Phase 10F: Remove all direct state mutations from SimulationEngine

STEP 1 - ENHANCE STATEMANAGER:
Add these method categories to StateManager:
1. Resource methods (consumeResource, addResource)
2. Farm methods (updatePlot, plantSeed, harvestPlot)
3. Player methods (addExperience, updateHealth)
4. Inventory methods (addItem, removeItem, equipItem)
5. Adventure methods (startAdventure, updateProgress)
6. Helper methods (assignHelper, levelUpHelper)

Each method should:
- Validate the operation
- Update state
- Emit an event

STEP 2 - FIND AND REPLACE MUTATIONS:
Search SimulationEngine for patterns:
- `this.gameState.` (should find 200+ instances)
- Direct array modifications (push, splice, pop)
- Direct property assignments

Replace each with StateManager method:
```typescript
// OLD:
this.gameState.resources.energy -= cost;
// NEW:
this.stateManager.consumeResource('energy', cost);

// OLD:
this.gameState.farm.plots[id].crop = crop;
// NEW:
this.stateManager.updatePlot(id, { crop });
```

STEP 3 - MAKE STATE READONLY:
Change all references:
```typescript
// OLD:
const state = this.gameState;
// NEW:
const state = this.stateManager.getState();
```

STEP 4 - ADD TRANSACTIONS:
For complex operations:
```typescript
this.stateManager.transaction(() => {
  this.stateManager.consumeResource('energy', 100);
  this.stateManager.addResource('gold', 50);
  this.stateManager.addExperience(10);
});
```

Document in /Docs/Sim Design/Phase10F-StateManagement-Complete.md:
- Number of mutations replaced
- StateManager methods added
- Event types created
```

## Next Phase Preview
Phase 10G will perform the final simplification, creating a pure orchestrator under 1,000 lines by removing all remaining game logic and helper methods, reducing SimulationEngine to its final form.