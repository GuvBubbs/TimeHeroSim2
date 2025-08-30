# 8C - Crop System - Growth & Water Mechanics

## Context
- **What this phase is doing:** See Goals below.
- **What came before:** 7B - Core Actions - Farm Cleanup & Plot Expansion
- **What's coming next:** 7D - Helper System - Automation & Roles

## Scope
### Phase 8C: Crop System - Growth & Water Mechanics 💧
**Goals**: Implement realistic crop growth with water requirements
**Expected Changes**:
- Crops grow based on time and water
- Water consumption and distribution
- Death from drought
- Proper harvesting with energy gain
**Test Command**: Plant crops → Add water → Advance time → Check FarmVisualizerWidget
**Success Criteria**: Crops show growth stages, ready indicator appears, energy increases on harvest

## Details
## Phase 8C: Crop System - Growth & Water Mechanics
### Files to Modify
- `/src/utils/systems/CropSystem.ts` - New crop growth system
- `/src/utils/SimulationEngine.ts` - Integrate crop processing

### Implementation Tasks

#### 1. Create Crop System
```typescript
// New file: src/utils/systems/CropSystem.ts
export class CropSystem {
  static processCropGrowth(gameState: GameState, deltaMinutes: number, gameDataStore: any) {
    for (let i = 0; i < gameState.processes.crops.length; i++) {
      const crop = gameState.processes.crops[i]
      
      if (!crop.cropType || crop.isReady || crop.isDead) continue
      
      // Get crop data from CSV
      const cropData = gameDataStore.getItemById(crop.cropType)
      if (!cropData) continue
      
      const growthTime = CSVDataParser.parseNumericValue(cropData.time, 10)
      const stages = CSVDataParser.parseNumericValue(cropData.stages, 3)
      
      // Calculate growth based on water
      const growthRate = crop.waterLevel > 0.3 ? 1.0 : 0.5 // Half speed when dry
      crop.growthProgress += (deltaMinutes / growthTime) * growthRate
      
      // Update growth stage for visual display
      crop.growthStage = Math.min(stages, Math.floor(crop.growthProgress * stages))
      
      // Check if ready to harvest
      if (crop.growthProgress >= 1.0) {
        crop.isReady = true
        crop.growthStage = stages // Final stage
      }
      
      // Water consumption (1% per minute)
      crop.waterLevel = Math.max(0, crop.waterLevel - 0.01 * deltaMinutes)
      
      // Death check - crops die if completely dry for too long
      if (crop.waterLevel <= 0) {
        crop.droughtTime = (crop.droughtTime || 0) + deltaMinutes
        if (crop.droughtTime > 30) { // 30 minutes without water = death
          crop.isDead = true
          crop.cropType = null
        }
      } else {
        crop.droughtTime = 0 // Reset drought timer when watered
      }
    }
  }
  
  /**
   * Distributes water to crops that need it
   * @param gameState - Current game state
   * @param waterAmount - Amount of water units available to distribute
   * @returns Number of water units actually consumed (not plot count)
   * 
   * WATER UNITS CLARIFICATION:
   * - waterLevel: 0.0 to 1.0 (percentage of water in plot)
   * - waterAmount: Actual water resource units from resources.water.current
   * - waterUsed: Water units consumed, subtracted from resources.water.current
   * - Each plot can hold 1.0 water units when full
   */
  static distributeWater(gameState: GameState, waterAmount: number): number {
    // Find crops that need water
    const dryPlots = gameState.processes.crops
      .filter(c => c.cropType && !c.isDead && c.waterLevel < 1.0)
      .sort((a, b) => a.waterLevel - b.waterLevel) // Water driest first
    
    let waterUsed = 0
    for (const plot of dryPlots) {
      if (waterAmount <= 0) break
      
      const waterNeeded = 1.0 - plot.waterLevel
      const waterToAdd = Math.min(waterNeeded, waterAmount)
      
      plot.waterLevel += waterToAdd
      waterAmount -= waterToAdd
      waterUsed += waterToAdd
    }
    
    return waterUsed
  }
}
```

#### 2. Implement Water Actions
```typescript
// In SimulationEngine.ts - Add water action execution
private executeWaterAction(action: GameAction): boolean {
  // Check water availability
  const waterAvailable = this.gameState.resources.water.current
  if (waterAvailable < 1) {
    return false
  }
  
  // Check energy cost (small energy cost for watering)
  const energyCost = 1
  if (this.gameState.resources.energy.current < energyCost) {
    return false
  }
  
  // Determine water amount based on tool
  let waterAmount = 1 // Base: water 1 plot
  if (this.gameState.inventory.tools.has('watering_can_ii')) {
    waterAmount = 2
  } else if (this.gameState.inventory.tools.has('sprinkler_can')) {
    waterAmount = 4
  } else if (this.gameState.inventory.tools.has('rain_bringer')) {
    waterAmount = 8
  }
  
  // Use available water (limited by what we have)
  const actualWaterUsed = Math.min(waterAmount, waterAvailable)
  
  // Distribute water to crops
  const waterDistributed = CropSystem.distributeWater(this.gameState, actualWaterUsed)
  
  if (waterDistributed > 0) {
    this.gameState.resources.water.current -= waterDistributed
    this.gameState.resources.energy.current -= energyCost
    this.addEvent('action', `Watered ${waterDistributed} plots`)
    return true
  }
  
  return false
}

// Add pump water action
private executePumpAction(action: GameAction): boolean {
  // Check if at max capacity
  if (this.gameState.resources.water.current >= this.gameState.resources.water.max) {
    return false
  }
  
  // Determine pump efficiency
  let pumpRate = 2 // Base: 2 water per pump
  if (this.gameState.progression.unlockedUpgrades.includes('well_pump_i')) {
    pumpRate = 4
  }
  if (this.gameState.progression.unlockedUpgrades.includes('well_pump_ii')) {
    pumpRate = 8
  }
  if (this.gameState.progression.unlockedUpgrades.includes('well_pump_iii')) {
    pumpRate = 15
  }
  if (this.gameState.progression.unlockedUpgrades.includes('steam_pump')) {
    pumpRate = 30
  }
  if (this.gameState.progression.unlockedUpgrades.includes('crystal_pump')) {
    pumpRate = 60
  }
  
  // Pump water (limited by capacity)
  const waterToPump = Math.min(pumpRate, this.gameState.resources.water.max - this.gameState.resources.water.current)
  this.gameState.resources.water.current += waterToPump
  
  this.addEvent('action', `Pumped ${waterToPump} water`)
  return true
}
```

### Testing Phase 8C
```javascript
// Plant a crop → Check FarmVisualizerWidget shows plant
// Add water → Verify waterLevel increases
// Advance time → Check growthProgress increases
// Let crop dry out → Verify slower growth or death
// Harvest ready crop → Verify energy gain
```

---
