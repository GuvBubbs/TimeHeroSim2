# Phase 10B: Extract Core Game Loop Systems

## Context Within Phase 10
Following the cleanup in Phase 10A, we now begin the actual extraction process. This phase focuses on the three core game loop systems that run continuously: Farm, Tower, and Town. These are the most frequently accessed systems and form the backbone of the game's idle mechanics.

**Previous**: Phase 10A consolidated duplicate systems and created a clean starting point
**Current**: Extract ~1,700 lines of core game logic from SimulationEngine
**Next**: Phase 10C will extract activity systems (Adventure, Mine, Forge)

## Extraction Targets

### FarmSystem Extraction (~800 lines)
**From SimulationEngine.ts:**
- `evaluateFarmActions()` - Lines 721-892
- `executePlantAction()` - Lines 2145-2198  
- `executeHarvestAction()` - Lines 2199-2245
- `executeWaterAction()` - Lines 2246-2289
- `executePumpAction()` - Lines 2290-2325
- `updateCropGrowth()` - Lines 3421-3487
- `processCropStates()` - Lines 3488-3542
- `checkWaterNeeds()` - Lines 3543-3578
- All farm-related helper methods

### TowerSystem Extraction (~400 lines)
**From SimulationEngine.ts:**
- `evaluateTowerActions()` - Lines 1245-1389
- `executeCatchSeedAction()` - Lines 2456-2512
- `executeAutoCatcherAction()` - Lines 2513-2548
- `processSeedGeneration()` - Lines 3678-3724
- `calculateSeedPool()` - Lines 3725-3759
- Tower progression logic

### TownSystem Extraction (~500 lines)
**From SimulationEngine.ts:**
- `evaluateTownActions()` - Lines 1567-1742
- `executePurchaseAction()` - Lines 2678-2745
- `executeBuildAction()` - Lines 2746-2812
- `evaluateVendorOptions()` - Lines 3845-3912
- `checkAffordability()` - Lines 3913-3947
- Vendor interaction logic

## Implementation Pattern

Each system should implement this interface:
```typescript
interface CoreGameSystem {
  // Evaluation - what actions are possible?
  evaluateActions(
    state: GameState, 
    config: SimulationConfig,
    context: EvaluationContext
  ): PossibleAction[];

  // Execution - perform an action
  execute(
    action: GameAction, 
    state: GameState
  ): ActionResult;

  // Processing - tick-based updates
  tick(
    deltaTime: number, 
    state: GameState
  ): SystemTickResult;

  // Validation - can this action be performed?
  canExecute(
    action: GameAction,
    state: GameState
  ): ValidationResult;
}
```

## File Structure After Phase 10B

```
/src/utils/systems/
├── FarmSystem.ts (~1000 lines)
│   ├── evaluateActions()
│   ├── plant()
│   ├── harvest()
│   ├── water()
│   ├── pump()
│   └── tick() - crop growth, water consumption
│
├── TowerSystem.ts (~500 lines)
│   ├── evaluateActions()
│   ├── catchSeed()
│   ├── processAutoCatcher()
│   ├── generateSeeds()
│   └── tick() - seed generation
│
└── TownSystem.ts (~600 lines)
    ├── evaluateActions()
    ├── purchase()
    ├── build()
    ├── getVendorInventory()
    └── tick() - vendor refreshes

SimulationEngine.ts: ~3,959 lines (down from 5,659)
```

## Critical Extraction Rules

### DO:
1. **MOVE** the code to the system file
2. **DELETE** the code from SimulationEngine
3. **PRESERVE** the logic exactly (refactor later)
4. **UPDATE** method calls in SimulationEngine to use systems
5. **TEST** after each system extraction

### DON'T:
1. **DON'T** leave copies in SimulationEngine
2. **DON'T** refactor while moving (just extract)
3. **DON'T** break existing interfaces
4. **DON'T** skip testing between extractions

## Integration Points

After extraction, SimulationEngine will call systems like:
```typescript
// OLD: Direct evaluation
const farmActions = this.evaluateFarmActions(state, config);

// NEW: Through system
const farmActions = this.systems.farm.evaluateActions(state, config, context);

// OLD: Direct execution  
this.executePlantAction(action, state);

// NEW: Through system
this.systems.farm.execute(action, state);

// OLD: Direct processing
this.updateCropGrowth(deltaTime);

// NEW: Through system
this.systems.farm.tick(deltaTime, state);
```

## Success Criteria
- [ ] FarmSystem contains all farm logic (~800 lines moved)
- [ ] TowerSystem contains all tower logic (~400 lines moved)
- [ ] TownSystem contains all town logic (~500 lines moved)
- [ ] SimulationEngine reduced by ~1,700 lines
- [ ] All tests still pass
- [ ] No duplicate code remains

## Time Estimate
- **Expected**: 4 hours
- **Per System**: ~1.3 hours
- **Risk**: Complex interdependencies

## Implementation Prompt for GitHub Copilot

**Attach these files:**
- `/src/utils/SimulationEngine.ts`
- `/src/utils/systems/FarmSystem.ts`
- `/src/utils/systems/TowerSystem.ts`
- `/src/utils/systems/TownSystem.ts`
- `/src/types/gameState.ts`
- `/src/types/actions.ts`

**Prompt:**
```
Phase 10B: Extract core game loop systems from SimulationEngine.ts

GOAL: Move ~1,700 lines from SimulationEngine to the three core systems.

FOR FARMSYSTEM:
1. FIND in SimulationEngine.ts:
   - evaluateFarmActions() (lines ~721-892)
   - executePlantAction() (lines ~2145-2198)
   - executeHarvestAction() (lines ~2199-2245)
   - executeWaterAction() (lines ~2246-2289)
   - executePumpAction() (lines ~2290-2325)
   - updateCropGrowth() and related methods

2. MOVE to FarmSystem.ts:
   - Add these methods to the FarmSystem class
   - Adjust 'this' references to work with system context
   - Keep logic identical (don't refactor yet)

3. DELETE from SimulationEngine.ts:
   - Remove the moved methods completely
   - Replace calls with: this.systems.farm.methodName()

FOR TOWERSYSTEM:
1. FIND and MOVE:
   - evaluateTowerActions() 
   - executeCatchSeedAction()
   - executeAutoCatcherAction()
   - Seed generation/distribution logic

2. FIX the seed catching bug while moving the code

FOR TOWNSYSTEM:
1. FIND and MOVE:
   - evaluateTownActions()
   - executePurchaseAction()
   - executeBuildAction()
   - Vendor evaluation logic

CRITICAL: After moving code to a system, DELETE it from SimulationEngine!

Update /Docs/Sim Design/Phase10B-Extraction-Report.md with:
- Lines moved per system
- New SimulationEngine line count
- Methods successfully extracted
```

## Next Phase Preview
Phase 10C will extract the activity systems (Adventure, Mine, Forge) which handle longer-duration player activities, removing another ~1,500 lines from SimulationEngine.