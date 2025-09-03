# Phase 11B - Fix Tower Prerequisites & Build Requirements

## Problem Statement
The hero can catch seeds at the tower immediately without purchasing the blueprint or building it first. This breaks the intended progression where players must invest gold and energy before accessing seed catching.

## Root Cause Analysis

### Current Issue Flow
```
Game Start → Hero has 75 gold → Goes directly to tower → Catches seeds ❌
```

### Expected Flow
```
Game Start → Town (buy blueprint 25g) → Farm (build tower 5e) → Tower (catch seeds) ✅
```

### Likely Causes
1. **Missing Build State**: Tower doesn't track built/unbuilt status
2. **No Prerequisite Check**: TowerSystem.evaluateActions() doesn't verify tower is built
3. **Incorrect Initialization**: Tower starts as "built" instead of "unbuilt"
4. **DecisionEngine Bug**: AI evaluates tower actions without checking prerequisites

## Solution Design

### Fix 1: Add Tower Build State Tracking
**Location**: Game state structure
```typescript
gameState.tower = {
  isBuilt: false,  // Starts false, becomes true after building
  currentReach: 0, // Only matters after built
  autoCatcher: null,
  // ... other tower state
}
```

### Fix 2: Enforce Prerequisites in TowerSystem
**Location**: `src/utils/systems/TowerSystem.ts`
```typescript
evaluateActions(state, params, dataStore): ActionResult[] {
  // FIRST CHECK: Is tower built?
  if (!state.tower.isBuilt) {
    return []; // No tower actions available
  }
  
  // Only evaluate seed catching if tower exists
  return this.evaluateSeedCatching(state, params, dataStore);
}
```

### Fix 3: Add Tower Building Action
**Location**: `src/utils/systems/TownSystem.ts` and `src/utils/systems/FarmSystem.ts`

**In TownSystem** - Purchase blueprint:
```typescript
// Add tower blueprint to purchase options
{
  type: 'purchase',
  target: 'tower_reach_1_blueprint',
  goldCost: 25,
  requirements: [],
  unlocks: 'tower_build_action'
}
```

**In FarmSystem** - Build tower:
```typescript
// Add tower building action (only if blueprint owned)
if (state.inventory.blueprints.includes('tower_reach_1')) {
  actions.push({
    type: 'build',
    target: 'tower',
    energyCost: 5,
    location: 'farm',
    effect: () => { state.tower.isBuilt = true; }
  });
}
```

### Fix 4: Update Starting Conditions
**Location**: `src/utils/ConfigurationManager.ts`
```typescript
initializeTowerState(): TowerState {
  return {
    isBuilt: false,        // MUST start false
    currentReach: 0,
    blueprintsOwned: [],   // Empty initially
    autoCatcherTier: 0,
    seedsCatching: null
  };
}
```

### Fix 5: Fix DecisionEngine Tower Navigation
**Location**: `src/utils/ai/DecisionEngine.ts`
```typescript
// Don't consider tower navigation unless built
if (location === 'tower' && !state.tower.isBuilt) {
  return null; // Can't go to unbuilt tower
}
```

## Implementation Checklist

- [ ] Add `isBuilt` flag to tower state
- [ ] Initialize tower as unbuilt in ConfigurationManager
- [ ] Block tower actions in TowerSystem when unbuilt
- [ ] Add tower blueprint to town purchases
- [ ] Add tower building action to farm
- [ ] Update DecisionEngine to respect tower build state
- [ ] Verify prerequisite chain works correctly

## Testing Scenarios

### Scenario 1: Fresh Start
1. Start new game
2. Verify tower actions return empty array
3. Verify hero can't navigate to tower
4. Hero should go to town first

### Scenario 2: Blueprint Purchase
1. Hero goes to town with 75 gold
2. Purchases tower_reach_1 blueprint for 25g
3. Inventory shows blueprint
4. Gold reduced to 50

### Scenario 3: Tower Building
1. Hero returns to farm with blueprint
2. Build action appears in farm actions
3. Hero spends 5 energy to build
4. Tower state changes to isBuilt: true

### Scenario 4: Tower Usage
1. After building, hero can navigate to tower
2. Seed catching actions now available
3. Normal tower gameplay proceeds

## Expected Log Output

**Before Fix**:
```
Hero navigates to tower
TowerSystem evaluates seed catching
Hero catches seeds (WRONG - tower not built!)
```

**After Fix**:
```
TowerSystem: Tower not built, no actions available
Hero navigates to town
Hero purchases tower blueprint (-25 gold)
Hero navigates to farm
Hero builds tower (-5 energy)
Tower.isBuilt = true
Hero navigates to tower
Hero catches seeds (CORRECT - tower now built!)
```

## Risk Assessment

**Medium Risk**: Changes game state structure and action flow
**Backward Compatibility**: May affect save games if tower state structure changes
**Testing Required**: Full progression path from start to tower usage

## Success Criteria

1. Hero cannot catch seeds without building tower first
2. Blueprint purchase works correctly in town
3. Tower building consumes correct resources
4. After building, tower functions normally
5. All three personas follow correct progression
6. No regression in existing tower functionality