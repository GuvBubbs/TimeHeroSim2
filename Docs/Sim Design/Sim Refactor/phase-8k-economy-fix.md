# Phase 8K - Fix Game Economy & Expand Action Variety

## Critical Issue: Fundamental Economic Model is Wrong

### Current Implementation (WRONG) ❌
```
Crops → Harvest → Gold (+50 gold)
```

### Correct Implementation (Per Game Design) ✅
```
Crops → Harvest → ENERGY → Use energy for actions → Actions produce gold/materials
```

## Core Economic Loop (From Game Design Document)

**The correct flow is:**
1. **Seeds** → Plant crops
2. **Crops** → Harvest for **ENERGY** (not gold!)
3. **Energy** → Powers ALL actions (adventures, mining, crafting, cleanup)
4. **Actions** → Generate gold, materials, XP
5. **Gold/Materials** → Buy upgrades, craft tools
6. **Upgrades** → Better seeds, more efficient farming

**Key Quote from Design Doc:**
> "Harvested crops instantly convert to energy when collected. No intermediate crop storage - energy is the universal currency. Players don't track individual food types in their energy pool."

## Phase 8K Implementation Plan

### Priority 1: Fix Harvest Action (CRITICAL) 🔴

**File**: `src/utils/SimulationEngine.ts`

#### Fix 1A: Harvest Produces Energy, Not Gold
```typescript
case 'harvest':
  // WRONG: this.gameState.resources.gold += 50
  
  // CORRECT: Convert crop to energy based on crop type
  const cropData = this.gameDataStore.getItemById(crop.cropId)
  const energyValue = parseInt(cropData?.energy_value) || 
                      parseInt(cropData?.value) || 
                      5 // Default energy
  
  this.gameState.resources.energy.current = Math.min(
    this.gameState.resources.energy.max,
    this.gameState.resources.energy.current + energyValue
  )
  
  events.push({
    timestamp: this.gameState.time.totalMinutes,
    type: 'harvest',
    description: `Harvested ${crop.cropId} for +${energyValue} energy`,
    importance: 'medium'
  })
  break
```

### Priority 2: Implement Adventure Actions for Gold 🔴

Adventures are the PRIMARY gold source, not crops!

#### Fix 2A: Add Adventure Evaluation
```typescript
private evaluateAdventureActions(): GameAction[] {
  const actions: GameAction[] = []
  
  // Need energy to go on adventures
  if (this.gameState.resources.energy.current < 50) return actions
  
  // Get available adventure routes
  const routes = this.gameDataStore.itemsByGameFeature?.['Adventure'] || []
  
  // Find meadow_path_short as starter adventure
  const meadowPath = routes.find(r => r.id === 'meadow_path_short')
  
  if (meadowPath) {
    const energyCost = parseInt(meadowPath.energy_cost) || 10
    const goldReward = parseInt(meadowPath.gold_gain) || 25
    
    actions.push({
      id: `adventure_meadow_${Date.now()}`,
      type: 'adventure',
      screen: 'adventure',
      target: 'meadow_path_short',
      duration: parseInt(meadowPath.time) || 3, // 3 minutes
      energyCost: energyCost,
      goldCost: 0,
      prerequisites: [],
      expectedRewards: { 
        gold: goldReward,
        xp: 10
      }
    })
  }
  
  return actions
}
```

#### Fix 2B: Execute Adventure Action
```typescript
case 'adventure':
  // Adventures cost energy, produce gold
  this.gameState.resources.energy.current -= action.energyCost
  
  // Get adventure data
  const adventure = this.gameDataStore.getItemById(action.target)
  const goldGain = parseInt(adventure?.gold_gain) || 25
  const xpGain = parseInt(adventure?.xp_gain) || 10
  
  // Add gold (THIS is where gold comes from!)
  this.gameState.resources.gold += goldGain
  this.gameState.progression.experience += xpGain
  
  events.push({
    timestamp: this.gameState.time.totalMinutes,
    type: 'adventure_complete',
    description: `Completed ${action.target}: +${goldGain} gold, +${xpGain} XP`,
    importance: 'high'
  })
  break
```

### Priority 3: Implement Cleanup Actions for Farm Expansion 🟡

#### Fix 3A: Add Cleanup Evaluation
```typescript
private evaluateCleanupActions(): GameAction[] {
  const actions: GameAction[] = []
  
  // Get cleanup actions from CSV
  const cleanups = this.gameDataStore.itemsByCategory?.cleanup || []
  
  // Find clear_weeds_1 (first cleanup, adds 2 plots)
  const clearWeeds = cleanups.find(c => c.id === 'clear_weeds_1')
  
  if (clearWeeds && !this.gameState.progression.completedCleanups?.has('clear_weeds_1')) {
    const energyCost = parseInt(clearWeeds.energy_cost) || 15
    const plotsAdded = parseInt(clearWeeds.plots_added) || 2
    
    if (this.gameState.resources.energy.current >= energyCost) {
      actions.push({
        id: `cleanup_weeds_${Date.now()}`,
        type: 'cleanup',
        screen: 'farm',
        target: 'clear_weeds_1',
        duration: 2,
        energyCost: energyCost,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: { 
          plots: plotsAdded
        }
      })
    }
  }
  
  return actions
}
```

#### Fix 3B: Execute Cleanup Action
```typescript
case 'cleanup':
  // Cleanups cost energy, add farm plots
  this.gameState.resources.energy.current -= action.energyCost
  
  const cleanup = this.gameDataStore.getItemById(action.target)
  const plotsAdded = parseInt(cleanup?.plots_added) || 0
  
  // Expand farm!
  if (plotsAdded > 0) {
    this.gameState.progression.farmPlots += plotsAdded
    this.gameState.progression.availablePlots += plotsAdded
  }
  
  // Mark as completed
  if (!this.gameState.progression.completedCleanups) {
    this.gameState.progression.completedCleanups = new Set()
  }
  this.gameState.progression.completedCleanups.add(action.target)
  
  events.push({
    timestamp: this.gameState.time.totalMinutes,
    type: 'cleanup_complete',
    description: `${cleanup?.name}: +${plotsAdded} plots (now ${this.gameState.progression.farmPlots} total)`,
    importance: 'high'
  })
  break
```

### Priority 4: Fix Pump Action Execution 🟡

```typescript
case 'pump':
  // Pumping costs energy, produces water
  this.gameState.resources.energy.current -= action.energyCost
  
  // Add water based on pump upgrades
  let waterAmount = 2 // Base pump
  if (this.gameState.progression.unlockedUpgrades?.includes('well_pump_i')) {
    waterAmount = 4
  }
  
  this.gameState.resources.water.current = Math.min(
    this.gameState.resources.water.max,
    this.gameState.resources.water.current + waterAmount
  )
  
  events.push({
    timestamp: this.gameState.time.totalMinutes,
    type: 'pump',
    description: `Pumped water: +${waterAmount} (now ${Math.round(this.gameState.resources.water.current)})`,
    importance: 'low'
  })
  break
```

### Priority 5: Update Action Evaluation Order 🟢

```typescript
private evaluatePossibleActions(): GameAction[] {
  const actions: GameAction[] = []
  
  // Priority order for evaluation:
  
  // 1. Pump water if low (critical for crops)
  if (this.gameState.resources.water.current < this.gameState.resources.water.max * 0.3) {
    actions.push(...this.evaluatePumpAction())
  }
  
  // 2. Harvest ready crops (generates energy)
  actions.push(...this.evaluateHarvestActions())
  
  // 3. Plant if we have seeds and water
  if (this.gameState.resources.water.current > 20) {
    actions.push(...this.evaluatePlantActions())
  }
  
  // 4. Water crops if needed
  actions.push(...this.evaluateWaterActions())
  
  // 5. Cleanup for farm expansion (if energy available)
  if (this.gameState.resources.energy.current > 30) {
    actions.push(...this.evaluateCleanupActions())
  }
  
  // 6. Adventures for gold (if energy available)
  if (this.gameState.resources.energy.current > 50) {
    actions.push(...this.evaluateAdventureActions())
  }
  
  return actions
}
```

## Expected Console Output After Fix

```
🎮 Tick 10: { energy: 95, water: 45, plots: 3 }
🌾 Harvested carrot for +1 energy (now 96)
🌱 Planted potato

🎮 Tick 30: { energy: 94, water: 40, plots: 3 }
💧 Pumped water: +2 (now 42)

🎮 Tick 60: { energy: 89, water: 38, plots: 3 }
🧹 Clear Weeds #1: +2 plots (now 5 total)

🎮 Tick 90: { energy: 74, water: 35, plots: 5 }
🌾 Harvested potato for +2 energy (now 76)

🎮 Tick 120: { energy: 76, water: 30, plots: 5 }
⚔️ Completed meadow_path_short: +25 gold, +10 XP

🎮 Tick 150: { energy: 66, water: 28, plots: 5, gold: 125 }
```

## Success Metrics

1. **Energy Economy**: Crops produce energy, not gold ✅
2. **Gold Sources**: Adventures produce gold ✅
3. **Farm Expansion**: Plots increase from 3→5→8 ✅
4. **Action Variety**: See 5+ different action types ✅
5. **Resource Flow**: Energy→Actions→Gold/Materials ✅

## Testing Validation

- [ ] Harvesting shows "+X energy" not "+X gold"
- [ ] Energy is consumed by adventures, cleanup, pumping
- [ ] Gold only increases from adventures (and later, selling materials)
- [ ] Farm plots increase via cleanup actions
- [ ] Water gets pumped when low
- [ ] Adventures execute when energy is high

## Common Mistakes to Avoid

❌ **DON'T**: Give gold for harvesting crops
❌ **DON'T**: Create energy from nothing
❌ **DON'T**: Skip energy costs for actions
✅ **DO**: Follow the economic loop precisely
✅ **DO**: Check CSV data for actual values
✅ **DO**: Log resource changes clearly