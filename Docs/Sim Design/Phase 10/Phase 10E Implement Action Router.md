# Phase 10E: Implement Action Router

## Context Within Phase 10
The executeAction() method in SimulationEngine is a massive switch statement with dozens of cases. This phase replaces it with a clean routing pattern that dispatches actions to the appropriate systems.

**Previous**: Phase 10D integrated support systems (~300 lines removed)
**Current**: Replace executeAction() with ActionRouter (~1,000 lines removed)
**Next**: Phase 10F will consolidate state management

**SimulationEngine Status**: ~2,159 lines → Target: ~1,159 lines after this phase

## Current Problem

SimulationEngine.ts contains a massive executeAction() method:
```typescript
// Current mess - Lines 2034-3089 (~1,055 lines!)
executeAction(action: GameAction): ActionResult {
  switch(action.type) {
    case 'PLANT':
      return this.executePlantAction(action);
    case 'HARVEST':
      return this.executeHarvestAction(action);
    case 'WATER':
      return this.executeWaterAction(action);
    // ... 40+ more cases
    case 'ASSIGN_HELPER':
      return this.executeAssignHelperAction(action);
    default:
      return { success: false, reason: 'Unknown action' };
  }
}

// Plus 40+ sub-methods like:
executePlantAction(action): ActionResult { /* 50 lines */ }
executeHarvestAction(action): ActionResult { /* 45 lines */ }
// etc...
```

## New Architecture

```typescript
// ActionRouter.ts - Clean routing without implementation
class ActionRouter {
  private systems: SystemRegistry;
  private routingTable: Map<ActionType, SystemType>;

  constructor(systems: SystemRegistry) {
    this.systems = systems;
    this.routingTable = this.buildRoutingTable();
  }

  private buildRoutingTable(): Map<ActionType, SystemType> {
    return new Map([
      // Farm actions
      ['PLANT', 'farm'],
      ['HARVEST', 'farm'],
      ['WATER', 'farm'],
      ['PUMP', 'farm'],
      
      // Tower actions
      ['CATCH_SEED', 'tower'],
      ['ACTIVATE_AUTO_CATCHER', 'tower'],
      ['EXTEND_ARM', 'tower'],
      
      // Town actions
      ['PURCHASE', 'town'],
      ['BUILD', 'town'],
      ['TALK_TO_VENDOR', 'town'],
      
      // Adventure actions
      ['START_ADVENTURE', 'adventure'],
      ['FLEE', 'adventure'],
      ['EQUIP_WEAPON', 'adventure'],
      ['EQUIP_ARMOR', 'adventure'],
      
      // Mine actions
      ['START_MINING', 'mine'],
      ['SURFACE', 'mine'],
      ['BUILD_SHORTCUT', 'mine'],
      
      // Forge actions
      ['START_CRAFT', 'forge'],
      ['MANAGE_HEAT', 'forge'],
      ['REFINE_MATERIAL', 'forge'],
      
      // Helper actions
      ['ASSIGN_HELPER', 'helper'],
      ['TRAIN_HELPER', 'helper'],
      ['REASSIGN_HELPER', 'helper'],
      
      // Meta actions
      ['SAVE_GAME', 'meta'],
      ['LOAD_GAME', 'meta'],
      ['NAVIGATE', 'meta']
    ]);
  }

  route(action: GameAction, state: GameState): ActionResult {
    // 1. Get target system
    const systemType = this.routingTable.get(action.type);
    if (!systemType) {
      return { 
        success: false, 
        reason: `No system handles action type: ${action.type}` 
      };
    }

    // 2. Get system instance
    const system = this.systems[systemType];
    if (!system) {
      return { 
        success: false, 
        reason: `System not found: ${systemType}` 
      };
    }

    // 3. Validate prerequisites
    if (system.canExecute && !system.canExecute(action, state)) {
      return { 
        success: false, 
        reason: 'Prerequisites not met' 
      };
    }

    // 4. Execute through system
    try {
      return system.execute(action, state);
    } catch (error) {
      return { 
        success: false, 
        reason: `Execution error: ${error.message}` 
      };
    }
  }

  // Utility methods
  getSystemForAction(actionType: ActionType): SystemType | undefined {
    return this.routingTable.get(actionType);
  }

  getActionsForSystem(systemType: SystemType): ActionType[] {
    return Array.from(this.routingTable.entries())
      .filter(([_, system]) => system === systemType)
      .map(([action, _]) => action);
  }
}
```

## Refactoring Steps

### Step 1: Create ActionRouter
1. Create `/src/utils/ActionRouter.ts`
2. Define routing table mapping actions to systems
3. Implement route() method
4. Add error handling and validation

### Step 2: Update SimulationEngine
```typescript
// Replace entire executeAction method with:
class SimulationEngine {
  private actionRouter: ActionRouter;

  constructor() {
    // ... existing initialization
    this.actionRouter = new ActionRouter(this.systems);
  }

  executeAction(action: GameAction): ActionResult {
    // Just route - no implementation here!
    return this.actionRouter.route(action, this.gameState);
  }

  // DELETE all these methods:
  // - executePlantAction()
  // - executeHarvestAction()
  // - executeWaterAction()
  // - executePumpAction()
  // ... 40+ more execution methods
}
```

### Step 3: Ensure Systems Have execute()
Each system must implement:
```typescript
interface GameSystem {
  execute(action: GameAction, state: GameState): ActionResult;
  canExecute?(action: GameAction, state: GameState): boolean;
}

// Example: FarmSystem
class FarmSystem {
  execute(action: GameAction, state: GameState): ActionResult {
    switch(action.type) {
      case 'PLANT':
        return this.plant(action.plot, action.seed, state);
      case 'HARVEST':
        return this.harvest(action.plot, state);
      case 'WATER':
        return this.water(action.plots, state);
      case 'PUMP':
        return this.pump(action.amount, state);
      default:
        return { success: false, reason: 'Unknown farm action' };
    }
  }
}
```

## File Changes Summary

**Created:**
- `/src/utils/ActionRouter.ts` (~150 lines)

**Modified:**
- `SimulationEngine.ts` - Replace executeAction() with 3-line version

**Deleted from SimulationEngine.ts:**
- `executeAction()` - the giant switch (~100 lines)
- `executePlantAction()` (~50 lines)
- `executeHarvestAction()` (~45 lines)
- `executeWaterAction()` (~40 lines)
- `executePumpAction()` (~35 lines)
- `executeCatchSeedAction()` (~55 lines)
- `executePurchaseAction()` (~65 lines)
- `executeStartAdventureAction()` (~70 lines)
- `executeStartMiningAction()` (~55 lines)
- `executeStartCraftAction()` (~80 lines)
- `executeAssignHelperAction()` (~35 lines)
- ... and ~30 more execute methods

**Total Lines Removed:** ~1,000 lines

## Success Criteria
- [ ] ActionRouter created with complete routing table
- [ ] All action types mapped to correct systems
- [ ] SimulationEngine.executeAction() is ≤5 lines
- [ ] All execute submethods deleted from SimulationEngine
- [ ] Systems properly handle routed actions
- [ ] No action execution logic in SimulationEngine

## Time Estimate
- **Expected**: 3 hours
- **Router Creation**: 1 hour
- **Method Deletion**: 1 hour
- **System Updates**: 1 hour
- **Risk**: Missing action types, system integration

## Implementation Prompt for GitHub Copilot

**Attach these files:**
- `/src/utils/SimulationEngine.ts`
- `/src/utils/systems/systemRegistry.ts`
- `/src/types/actions.ts`
- All system files in `/src/utils/systems/`

**Prompt:**
```
Phase 10E: Replace massive executeAction() with clean ActionRouter

CREATE /src/utils/ActionRouter.ts:
```typescript
class ActionRouter {
  private routingTable: Map<ActionType, SystemType>;
  
  constructor(systems: SystemRegistry) {
    // Build routing table
  }
  
  route(action: GameAction, state: GameState): ActionResult {
    // 1. Look up system in routing table
    // 2. Call system.execute(action, state)
    // 3. Return result
  }
}
```

ROUTING TABLE should map:
- PLANT, HARVEST, WATER, PUMP → 'farm'
- CATCH_SEED, ACTIVATE_AUTO_CATCHER → 'tower'
- PURCHASE, BUILD → 'town'
- START_ADVENTURE, FLEE → 'adventure'
- START_MINING, SURFACE → 'mine'
- START_CRAFT, MANAGE_HEAT → 'forge'
- ASSIGN_HELPER, TRAIN_HELPER → 'helper'

IN SIMULATIONENGINE.TS:

1. FIND the executeAction() method (around lines 2034-3089)
2. FIND all the execute sub-methods (executePlantAction, executeHarvestAction, etc.)
3. DELETE them all (should be ~1,000 lines total)
4. REPLACE with:
```typescript
executeAction(action: GameAction): ActionResult {
  return this.actionRouter.route(action, this.gameState);
}
```

VERIFY each system has execute() method that handles its actions.

Document in /Docs/Sim Design/Phase10E-ActionRouter-Complete.md:
- Complete routing table
- Lines removed from SimulationEngine
- New SimulationEngine line count
```

## Next Phase Preview
Phase 10F will consolidate all state management, removing direct state mutations from SimulationEngine and ensuring all changes go through StateManager, removing another ~200 lines.