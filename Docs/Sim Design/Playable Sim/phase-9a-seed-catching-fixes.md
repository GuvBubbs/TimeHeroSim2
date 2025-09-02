# Phase 9A: Tower Prerequisites & Seed System Fixes

## Critical Discovery: Tower Must Be Built First!

The simulation incorrectly assumes the tower screen is available from the start. The actual flow requires:

### Correct Tower Access Flow
1. **Town**: Purchase `blueprint_tower_reach_1` from Carpenter (25 gold)
2. **Farm**: Build `tower_reach_1` using blueprint (5 energy, 2 minutes)
3. **Tower**: Only then can hero navigate to tower screen
4. **Seeds**: Catch seeds at the newly built tower

## Issues Identified

### Priority 1: Tower Prerequisites Not Checked
**Location**: `src/utils/SimulationEngine.ts` - Navigation and decision systems
- **Problem**: Hero tries to navigate to tower without checking if it exists
- **Symptom**: Navigation fails or hero gets stuck
- **Impact**: Entire seed collection system fails

### Priority 2: Screen Availability Not Tracked
**Location**: `GameState.progression.unlockedAreas`
- **Problem**: Tower is in `unlockedAreas` from start (hardcoded as `['farm']`)
- **Symptom**: AI thinks tower is available when it's not
- **Impact**: Invalid navigation attempts

### Priority 3: Blueprint → Build Flow Missing
**Location**: Decision making and action evaluation
- **Problem**: No logic to buy blueprints then build structures
- **Symptom**: Hero never builds required infrastructure
- **Impact**: Game progression blocked

### Priority 4: Seed Catching Process Issues
**Location**: `executeAction()` case 'catch_seeds'
- **Problem**: Seed catching executes instantly instead of over time
- **Symptom**: No duration, no seeds added
- **Impact**: Even if tower exists, seeds aren't collected

### Priority 5: Navigation Consistency
**Location**: Multiple navigation methods
- **Problem**: Mixed use of `target` vs `toScreen`
- **Symptom**: Inconsistent navigation behavior
- **Impact**: Hero movement unreliable

## Root Cause Analysis

The simulation assumes a simplified game state where all screens are available. The actual game requires:
1. **Economic progression**: Earn gold through adventures/harvests
2. **Blueprint acquisition**: Purchase from appropriate vendors
3. **Construction**: Build structures on farm
4. **Unlock screens**: Only then access new areas

## Proposed Solutions

### Solution 1: Track Built Structures
```typescript
// Add to GameState
builtStructures: Set<string> = new Set(['farm']) // Only farm exists initially

// Check before navigation
private canNavigateToScreen(screen: GameScreen): boolean {
  switch(screen) {
    case 'tower':
      return this.gameState.builtStructures.has('tower_reach_1')
    case 'forge':
      return this.gameState.builtStructures.has('forge')
    // etc...
  }
}
```

### Solution 2: Blueprint Purchase Logic
```typescript
// In evaluateTownActions()
private evaluateBlueprintPurchases(): GameAction[] {
  const actions: GameAction[] = []
  
  // Priority: Tower first (for seeds)
  if (!this.gameState.inventory.blueprints.has('blueprint_tower_reach_1') &&
      this.gameState.resources.gold >= 25) {
    actions.push({
      id: 'buy_tower_blueprint',
      type: 'purchase',
      screen: 'town',
      target: 'blueprint_tower_reach_1',
      vendor: 'carpenter',
      goldCost: 25,
      // ...
    })
  }
  
  return actions
}
```

### Solution 3: Build Action Evaluation
```typescript
// In evaluateFarmActions()
private evaluateBuildActions(): GameAction[] {
  const actions: GameAction[] = []
  
  // Check for tower blueprint and build if not built
  if (this.gameState.inventory.blueprints.has('blueprint_tower_reach_1') &&
      !this.gameState.builtStructures.has('tower_reach_1') &&
      this.gameState.resources.energy.current >= 5) {
    actions.push({
      id: 'build_tower',
      type: 'build',
      screen: 'farm',
      target: 'tower_reach_1',
      duration: 2,
      energyCost: 5,
      prerequisites: ['blueprint_tower_reach_1'],
      // ...
    })
  }
  
  return actions
}
```

### Solution 4: Seed Catching as Process
```typescript
// Add to ProcessState
seedCatching?: {
  startedAt: number
  duration: number
  expectedSeeds: number
  windLevel: number
  progress: number
  isComplete: boolean
}

// In processOngoingActivities()
if (this.gameState.processes.seedCatching) {
  const process = this.gameState.processes.seedCatching
  process.progress = (this.gameState.time.totalMinutes - process.startedAt) / process.duration
  
  if (process.progress >= 1.0 && !process.isComplete) {
    // Add seeds to inventory
    const result = SeedSystem.completeCatchingProcess(this.gameState, process)
    this.gameState.processes.seedCatching = null
  }
}
```

## Implementation Priority

1. **CRITICAL**: Add structure tracking and prerequisite checking
2. **CRITICAL**: Implement blueprint → build flow
3. **HIGH**: Fix seed catching to be a timed process
4. **MEDIUM**: Add proper screen availability checks
5. **LOW**: Standardize navigation system

## Early Game Flow (Corrected)

1. **Start**: 3 plots, 75 gold, 0 energy, farm only
2. **Harvest initial crops**: Gain energy (not gold!)
3. **Clean farm**: Expand plots using energy
4. **Adventure**: Meadow Path for gold (consume energy)
5. **Town**: Buy `blueprint_tower_reach_1` (25 gold)
6. **Farm**: Build `tower_reach_1` (5 energy)
7. **Tower**: Now accessible! Catch seeds
8. **Farm**: Plant caught seeds
9. **Cycle**: Farm → Energy → Adventures → Gold → Upgrades

## Testing Checklist

- [ ] Hero earns gold through adventures (not harvests)
- [ ] Hero buys tower blueprint from carpenter
- [ ] Hero builds tower on farm
- [ ] Tower screen becomes available after building
- [ ] Hero can navigate to tower only after it exists
- [ ] Seed catching creates a timed process
- [ ] Seeds are added after process completes
- [ ] Hero plants seeds successfully
- [ ] Full economic cycle works

## Debug Points

```typescript
console.log(`💰 ECONOMY: Gold from adventures only, energy from crops`)
console.log(`📋 BLUEPRINT: Checking for ${blueprintId} in inventory`)
console.log(`🔨 BUILD: Constructing ${structure} on farm`)
console.log(`🏗️ STRUCTURES: Built = ${Array.from(builtStructures)}`)
console.log(`🚫 BLOCKED: Cannot navigate to ${screen} - not built yet`)
console.log(`✅ UNLOCKED: ${screen} now available after building`)
```