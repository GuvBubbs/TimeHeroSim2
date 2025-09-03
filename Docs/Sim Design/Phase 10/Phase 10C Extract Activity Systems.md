# Phase 10C: Extract Activity Systems

## Context Within Phase 10
With core game loops extracted in Phase 10B, we now tackle the activity systems - longer-duration player actions that involve complex state management and progression tracking.

**Previous**: Phase 10B extracted Farm, Tower, Town systems (~1,700 lines removed)
**Current**: Extract Adventure, Mine, Forge systems (~1,500 lines)
**Next**: Phase 10D will integrate support systems

**SimulationEngine Status**: ~3,959 lines → Target: ~2,459 lines after this phase

## Extraction Targets

### AdventureSystem Enhancement (~600 lines)
**From SimulationEngine.ts:**
- `evaluateAdventureActions()` - Lines 1834-2001
- `executeStartAdventureAction()` - Lines 2876-2945
- `processAdventure()` - Lines 3234-3298
- `processCombat()` - Lines 3299-3387
- `calculateDamage()` - Lines 3388-3412
- `distributeLoot()` - Lines 3413-3445
- Adventure state management

**Also merge in:**
- RouteEnemyRollSystem.ts (entire file)
- CombatSystem.ts (if still separate)

### MineSystem Creation (~400 lines)
**From SimulationEngine.ts:**
- `evaluateMineActions()` - Lines 1456-1567
- `executeStartMiningAction()` - Lines 2623-2677
- `processMining()` - Lines 3123-3189
- `calculateDepthProgress()` - Lines 3190-3215
- `collectMaterials()` - Lines 3216-3244
- Mining state management

**Also:**
- Rename MiningSystem.ts → MineSystem.ts for consistency

### ForgeSystem Enhancement (~500 lines)
**From SimulationEngine.ts:**
- `evaluateForgeActions()` - Lines 1678-1823
- `executeStartCraftAction()` - Lines 2534-2612
- `processForgeQueue()` - Lines 3567-3634
- `manageHeat()` - Lines 3635-3678
- `calculateCraftingSuccess()` - Lines 3679-3701
- Crafting queue management

**Also merge in:**
- CraftingSystem.ts (if still separate)

## System Consolidation Pattern

```typescript
// AdventureSystem.ts - Complete adventure handling
class AdventureSystem {
  // From base system
  evaluateActions(state, config): PossibleAction[]
  execute(action, state): ActionResult
  tick(deltaTime, state): SystemTickResult
  
  // Adventure specific
  startAdventure(route, loadout, state): AdventureStart
  processCombat(deltaTime, state): CombatResult
  rollEnemies(route): EnemyComposition  // from RouteEnemyRollSystem
  calculateDamage(attacker, defender): number
  distributeLoot(adventureResult, state): LootResult
  
  // State management
  getActiveAdventure(state): Adventure | null
  isAdventureComplete(adventure): boolean
}
```

## Migration Strategy

### Step 1: Merge Sub-Systems
```bash
# Merge RouteEnemyRollSystem into AdventureSystem
cat RouteEnemyRollSystem.ts >> AdventureSystem.ts
rm RouteEnemyRollSystem.ts

# Merge CraftingSystem into ForgeSystem
cat CraftingSystem.ts >> ForgeSystem.ts
rm CraftingSystem.ts
```

### Step 2: Extract from SimulationEngine
For each system:
1. Locate all related methods in SimulationEngine
2. Copy to target system file
3. Adjust context (this.gameState → state parameter)
4. DELETE from SimulationEngine
5. Update SimulationEngine calls to use system

### Step 3: Update References
```typescript
// SimulationEngine.ts - Update all references
// OLD:
const adventureActions = this.evaluateAdventureActions(state);
this.processAdventure(deltaTime);

// NEW:
const adventureActions = this.systems.adventure.evaluateActions(state, config);
this.systems.adventure.tick(deltaTime, state);
```

## File Structure After Phase 10C

```
/src/utils/systems/
├── AdventureSystem.ts (~800 lines)
│   └── Includes: Combat, RouteRolls, Loot
├── MineSystem.ts (~500 lines)  
│   └── Renamed from MiningSystem
├── ForgeSystem.ts (~700 lines)
│   └── Includes: Crafting, Heat management
│
├── [DELETED] RouteEnemyRollSystem.ts
├── [DELETED] CombatSystem.ts
├── [DELETED] CraftingSystem.ts

SimulationEngine.ts: ~2,459 lines (down from 3,959)
```

## Known Issues to Fix

### Adventure System
- Enemy rolls not persisting correctly
- Combat damage calculations off by factor of 10
- Loot distribution missing boss materials

### Mine System  
- Energy drain not exponential as designed
- Material collection at wrong intervals
- Depth shortcuts not working

### Forge System
- Heat management not affecting success rates
- Batch crafting not queuing properly
- Material consumption happening before success check

## Success Criteria
- [ ] AdventureSystem fully integrated (~600 lines moved)
- [ ] MineSystem created and working (~400 lines moved)
- [ ] ForgeSystem complete with crafting (~500 lines moved)
- [ ] Sub-systems merged and deleted
- [ ] SimulationEngine reduced to ~2,459 lines
- [ ] Known bugs fixed during extraction

## Time Estimate
- **Expected**: 3 hours
- **Per System**: ~1 hour
- **Risk**: Complex state management, bug fixes

## Implementation Prompt for GitHub Copilot

**Attach these files:**
- `/src/utils/SimulationEngine.ts`
- `/src/utils/systems/AdventureSystem.ts`
- `/src/utils/systems/MineSystem.ts` (or MiningSystem.ts)
- `/src/utils/systems/ForgeSystem.ts`
- `/src/utils/systems/RouteEnemyRollSystem.ts`
- `/src/utils/systems/CombatSystem.ts`
- `/src/utils/systems/CraftingSystem.ts`

**Prompt:**
```
Phase 10C: Extract activity systems from SimulationEngine (~1,500 lines to move)

FIRST - CONSOLIDATE SUB-SYSTEMS:
1. Merge RouteEnemyRollSystem.ts into AdventureSystem.ts, then DELETE it
2. Merge CombatSystem.ts into AdventureSystem.ts, then DELETE it
3. Merge CraftingSystem.ts into ForgeSystem.ts, then DELETE it
4. Rename MiningSystem.ts to MineSystem.ts

SECOND - EXTRACT FROM SIMULATIONENGINE:

FOR ADVENTURESYSTEM:
- FIND these methods (around lines 1834-2001, 2876-3445):
  - evaluateAdventureActions()
  - executeStartAdventureAction()  
  - processAdventure()
  - processCombat()
  - calculateDamage()
  - distributeLoot()
- MOVE to AdventureSystem class
- FIX the combat damage calculation (off by 10x)
- DELETE from SimulationEngine

FOR MINESYSTEM:
- FIND these methods (around lines 1456-1567, 2623-3244):
  - evaluateMineActions()
  - executeStartMiningAction()
  - processMining()
  - calculateDepthProgress()
  - collectMaterials()
- MOVE to MineSystem class
- FIX exponential energy drain (should be 2^depth)
- DELETE from SimulationEngine

FOR FORGESYSTEM:
- FIND these methods (around lines 1678-1823, 2534-3701):
  - evaluateForgeActions()
  - executeStartCraftAction()
  - processForgeQueue()
  - manageHeat()
  - calculateCraftingSuccess()
- MOVE to ForgeSystem class
- FIX heat affecting success rates
- DELETE from SimulationEngine

CRITICAL: DELETE all moved code from SimulationEngine!

Update /Docs/Sim Design/Phase10C-Activities-Complete.md with extraction metrics.
```

## Next Phase Preview
Phase 10D will integrate the support systems (Helpers, Offline, Prerequisites) that modify and validate the behavior of core and activity systems, removing another ~300 lines.