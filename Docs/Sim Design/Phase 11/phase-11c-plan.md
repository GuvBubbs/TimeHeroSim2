# Phase 11C - Complete Early Game Flow Verification & Fix

## Objective
Verify and fix the complete early game progression flow from start through first adventure, ensuring all systems work together correctly.

## Expected Early Game Flow (from starting-conditions.md)
1. ✅ Plant 2 seeds, have 1 empty plot
2. ✅ Pump water (free)
3. ✅ Water and harvest crops for energy
4. ❓ Go to town, buy tower blueprint (25g)
5. ❓ Return to farm, build tower (5 energy)
6. ❓ Go to tower, catch seeds
7. ❓ Plant more seeds for energy
8. ❓ Buy Sword I blueprint (50g)
9. ❓ Craft sword at forge
10. ❓ Go on first adventure

## Known Issues to Verify

### 1. Tower Building Flow
**Check**: After buying blueprint, does hero build the tower?
- Blueprint purchase working?
- Build action appearing on farm?
- Hero executing build action?
- Tower state updating correctly?

### 2. Seed Catching System
**Check**: Can hero catch seeds after tower is built?
- Navigation to tower working?
- Catch_seeds action generating?
- Seeds being added to inventory?
- Auto-catcher progression?

### 3. Forge System Integration
**Check**: Can hero craft sword after buying blueprint?
- Forge accessible?
- Craft action for sword appearing?
- Materials available (wood/stone)?
- Crafting process completing?

### 4. Adventure Readiness
**Check**: Can hero start adventures with sword?
- Adventure routes accessible?
- Combat system recognizing sword?
- Energy costs correct?
- Rewards being granted?

## Debugging Points to Add

### TownSystem.ts
```typescript
// Log blueprint purchases clearly
console.log(`🏪 BLUEPRINT PURCHASE: ${action.target} for ${action.goldCost}g`)
console.log(`📋 Current blueprints: ${Array.from(state.inventory.blueprints)}`)
```

### FarmSystem.ts
```typescript
// Log tower building
if (action.target === 'tower') {
  console.log(`🏗️ TOWER BUILD: Available? ${hasTowerBlueprint && !towerBuilt}`)
  console.log(`🔨 Energy cost: ${action.energyCost}, Current: ${state.resources.energy.current}`)
}
```

### TowerSystem.ts
```typescript
// Log seed catching
console.log(`🌱 TOWER STATUS: Built=${state.tower.isBuilt}, Reach=${state.tower.currentReach}`)
console.log(`🎣 Seed catching available: ${canCatchSeeds}`)
```

### ForgeSystem.ts
```typescript
// Log crafting availability
console.log(`⚔️ SWORD CRAFTING: Blueprint=${hasSwordBlueprint}, Materials=${materials}`)
```

## Critical Validation Points

### Phase Gate 1: Tower Access
- **Requirement**: Must have blueprint AND build tower
- **Validation**: Tower.isBuilt must be true before seed catching
- **Energy Gate**: Must have 5+ energy to build

### Phase Gate 2: Combat Readiness
- **Requirement**: Must have sword equipped
- **Validation**: Inventory.weapons includes 'sword_1'
- **Resource Gate**: Need materials for crafting

### Phase Gate 3: Adventure Start
- **Requirement**: Sword equipped + sufficient energy
- **Validation**: Can evaluate adventure actions
- **Energy Gate**: 10+ energy for short adventure

## Potential Fixes Needed

### 1. Tower Building Priority
```typescript
// In ActionScorer.ts
if (action.type === 'build' && action.target === 'tower') {
  score = 950; // Very high priority after blueprint purchase
}
```

### 2. Seed Catching Action Generation
```typescript
// In TowerSystem.ts
if (!state.tower.isBuilt) {
  console.warn('⚠️ Tower not built, cannot catch seeds')
  return [];
}
```

### 3. Forge Access Logic
```typescript
// In DecisionEngine.ts
// Ensure forge is considered when hero has blueprints to craft
if (state.inventory.blueprints.size > 0) {
  consideredScreens.push('forge');
}
```

### 4. Material Collection
```typescript
// May need to add wood/stone collection actions
// Or ensure starting materials are sufficient
```

## Success Metrics

### Early Game Milestones (within 100 ticks)
1. ✅ Tower blueprint purchased (tick ~20-30)
2. ✅ Tower built (tick ~40-50)  
3. ✅ 5+ seeds collected (tick ~60-70)
4. ✅ Sword blueprint purchased (tick ~70-80)
5. ✅ Sword crafted (tick ~80-90)
6. ✅ First adventure started (tick ~90-100)

### Resource Checkpoints
- **Tick 20**: Energy 10+, Gold 50
- **Tick 40**: Energy 20+, Gold 25
- **Tick 60**: Energy 40+, Seeds 5+
- **Tick 80**: Energy 60+, Sword crafted
- **Tick 100**: First adventure complete

## Testing Protocol

1. **Run fresh simulation** with verbose logging
2. **Track each milestone** with timestamps
3. **Identify first failure point** in progression
4. **Fix blocking issue** with targeted solution
5. **Repeat until complete flow works**

## Risk Areas

### High Risk
- Tower building not triggering after blueprint purchase
- Forge system not accessible or functional
- Material requirements blocking sword crafting

### Medium Risk  
- Seed catching rate too low
- Energy generation insufficient
- Gold shortage for sword blueprint

### Low Risk
- Navigation delays between screens
- Minor scoring imbalances
- Logging verbosity issues