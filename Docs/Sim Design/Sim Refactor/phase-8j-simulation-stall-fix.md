# Phase 8J - Fix Simulation Stalling & Complete Integration

## Critical Issue: Simulation Engine Stalls After Initial Actions

### Current Behavior 🔴
```
Tick 1: executedActions: 2 (plant, water)
Tick 2: executedActions: 0
Tick 3: executedActions: 0
... continues with 0 actions forever
```

### Root Cause Analysis

The simulation is getting stuck because:

1. **Hero check-in logic is too restrictive** - After first check-in, conditions for next check-in aren't met
2. **Action prerequisites become unsatisfiable** - After initial actions, no valid actions remain
3. **Screen navigation broken** - Hero stuck on one screen, can't access other game systems
4. **Resource regeneration insufficient** - Energy/water not recovering to enable new actions

## Investigation Points

### 1. Check-in Logic Problem
```typescript
// In shouldHeroActNow()
// After first check-in at minute 481, next check-in would be:
// 481 + 480 + random = ~961 minutes (16 hours!)
// This means hero won't act again until next day
```

### 2. Action Evaluation Bottlenecks
```typescript
// Possible issues:
- All crops planted, no seeds left
- No water available, pump action not evaluated
- No energy for any actions
- Prerequisites too strict (tools required but can't craft)
- Navigation actions not being generated
```

### 3. Missing Action Types
```typescript
// Currently only evaluating:
- evaluateFarmActions() // plant, harvest, water
// Missing:
- evaluatePumpAction() // Critical for water generation!
- evaluateNavigationActions() // Move between screens
- evaluateTowerActions() // Seed catching
- evaluateCleanupActions() // Farm expansion
```

## Phase 8J Implementation Plan

### Priority 1: Fix Simulation Stalling 🔴

#### Task 1A: Fix Check-in Logic
**File**: `src/utils/SimulationEngine.ts`

```typescript
private shouldHeroActNow(): boolean {
  // Reduce check-in interval for testing
  const minutesPerCheckin = this.persona.checkInsPerDay > 0 
    ? 60 // Check every hour instead of 480 minutes
    : 1440
    
  // Allow check-ins during active hours (6am-10pm)
  const currentHour = Math.floor(this.gameState.time.totalMinutes / 60) % 24
  if (currentHour < 6 || currentHour >= 22) return false
  
  // Add energy-based trigger
  if (this.gameState.resources.energy.current > 
      this.gameState.resources.energy.max * 0.8) {
    return true // Act when energy is high
  }
  
  // Regular interval check
  const timeSinceLastCheckin = this.gameState.time.totalMinutes - this.lastCheckinTime
  return timeSinceLastCheckin >= minutesPerCheckin
}
```

#### Task 1B: Add Pump Action Evaluator
**File**: `src/utils/SimulationEngine.ts`

```typescript
private evaluatePumpAction(): GameAction[] {
  const actions: GameAction[] = []
  
  // Check if water is low
  if (this.gameState.resources.water.current < 
      this.gameState.resources.water.max * 0.5) {
    actions.push({
      id: `pump_${Date.now()}`,
      type: 'pump',
      screen: 'farm',
      target: 'well',
      duration: 1,
      energyCost: 5,
      goldCost: 0,
      prerequisites: [],
      expectedRewards: { water: 10 }
    })
  }
  
  return actions
}
```

#### Task 1C: Ensure Energy Regeneration
**File**: `src/utils/SimulationEngine.ts`

```typescript
private processOngoingActivities(deltaTime: number): GameEvent[] {
  // Add energy regeneration
  const energyRegen = 0.5 * deltaTime // 0.5 energy per minute
  this.gameState.resources.energy.current = Math.min(
    this.gameState.resources.energy.max,
    this.gameState.resources.energy.current + energyRegen
  )
  
  // Log regeneration for debugging
  if (this.tickCount % 60 === 0) { // Every 60 ticks
    console.log('⚡ Energy regenerated to:', 
      this.gameState.resources.energy.current)
  }
}
```

### Priority 2: Implement Missing Action Evaluators 🟡

#### Task 2A: Cleanup Actions (Farm Expansion)
```typescript
private evaluateCleanupActions(): GameAction[] {
  const cleanups = this.gameDataStore.itemsByCategory?.cleanup || []
  const actions: GameAction[] = []
  
  for (const cleanup of cleanups) {
    // Check if already completed
    if (this.gameState.progression.completedCleanups?.has(cleanup.id)) continue
    
    // Check prerequisites
    if (!this.checkPrerequisites(cleanup)) continue
    
    // Check energy
    const energyCost = parseInt(cleanup.energy_cost) || 0
    if (this.gameState.resources.energy.current < energyCost + 20) continue
    
    actions.push({
      id: `cleanup_${cleanup.id}_${Date.now()}`,
      type: 'cleanup',
      screen: 'farm',
      target: cleanup.id,
      duration: 5,
      energyCost: energyCost,
      goldCost: 0,
      prerequisites: cleanup.prerequisite ? [cleanup.prerequisite] : [],
      expectedRewards: { 
        plots: parseInt(cleanup.plots_added) || 0,
        materials: cleanup.materials_gain || ''
      }
    })
  }
  
  return actions
}
```

#### Task 2B: Adventure Actions
```typescript
private evaluateAdventureActions(): GameAction[] {
  const routes = this.gameDataStore.itemsByGameFeature?.['Adventure'] || []
  const actions: GameAction[] = []
  
  // Only evaluate if hero has enough energy
  if (this.gameState.resources.energy.current < 50) return actions
  
  for (const route of routes.slice(0, 3)) { // Check first 3 routes
    const energyCost = parseInt(route.energy_cost) || 50
    
    if (this.gameState.resources.energy.current >= energyCost) {
      actions.push({
        id: `adventure_${route.id}_${Date.now()}`,
        type: 'adventure',
        screen: 'adventure',
        target: route.id,
        duration: parseInt(route.time) || 15,
        energyCost: energyCost,
        goldCost: 0,
        prerequisites: route.prerequisite ? [route.prerequisite] : [],
        expectedRewards: {
          gold: parseInt(route.gold_gain) || 0,
          xp: parseInt(route.xp_gain) || 0
        }
      })
    }
  }
  
  return actions
}
```

### Priority 3: Complete Remaining Widgets 🟢

#### Task 3: Update Remaining 7 Widgets
**Files**: All in `src/components/monitor/`

1. **CurrentActionWidget** - Show actual current action
2. **PhaseProgressWidget** - Real phase progression
3. **TimelineWidget** - Plot real events
4. **MiniUpgradeTreeWidget** - Show purchased upgrades
5. **CurrentLocationWidget** - Dynamic location
6. **PerformanceMonitorWidget** - Real metrics
7. **ResourcesWidget** - Ensure all resources shown

### Priority 4: Fix TypeScript Errors 🟢

Focus on critical errors that block compilation:
- Missing type exports
- Undefined property access
- Type mismatches in reports

## Testing Validation Checklist

### Simulation Health
- [ ] Actions execute continuously (not just tick 1)
- [ ] Energy regenerates over time
- [ ] Water can be pumped when low
- [ ] Hero check-ins happen regularly

### Action Variety
- [ ] Farm actions: plant, harvest, water, pump
- [ ] Cleanup actions: clear_weeds_1 (+2 plots)
- [ ] Adventure actions: meadow_path_short
- [ ] Navigation: farm → town → farm

### Widget Updates
- [ ] All 13 widgets show real data
- [ ] No placeholder/mock data visible
- [ ] Updates happen every tick
- [ ] Empty states when no data

### CSV Integration
- [ ] Crop growth uses CSV times
- [ ] Cleanup actions from CSV
- [ ] Adventure routes from CSV

## Success Metrics

1. **Simulation runs for 100+ ticks** without stalling
2. **10+ different actions** execute in a session
3. **Farm expands** from 3 → 5 → 8 plots
4. **All 13 widgets** display real data
5. **0 TypeScript errors** on build

## Implementation Order

1. **Fix stalling** (Task 1A-1C) - 2 hours
2. **Add evaluators** (Task 2A-2B) - 2 hours
3. **Test & debug** - 1 hour
4. **Complete widgets** (Task 3) - 2 hours
5. **Fix TypeScript** (Task 4) - 1 hour

**Total: 8 hours**

## Debug Logging to Add

```typescript
// Add to tick() method
console.log(`Tick ${this.tickCount}:`, {
  energy: this.gameState.resources.energy.current,
  water: this.gameState.resources.water.current,
  shouldAct: this.shouldHeroActNow(),
  possibleActions: decisions.length,
  lastCheckin: this.lastCheckinTime
})
```