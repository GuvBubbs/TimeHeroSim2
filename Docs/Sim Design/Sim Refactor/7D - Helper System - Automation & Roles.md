# 7D - Helper System - Automation & Roles

## Context
- **What this phase is doing:** See Goals below.
- **What came before:** 7C - Crop System - Growth & Water Mechanics
- **What's coming next:** 7E - Combat System - Adventures & Boss Fights

## Scope
### Phase 8D: Helper System - Automation & Roles 👥
**Goals**: Make helpers actually help with farm automation
**Expected Changes**:
- Helpers perform assigned roles
- Automation reduces manual work
- Training improves efficiency
- Housing requirements enforced
**Test Command**: Rescue gnome → Assign to watering → Check if crops get watered automatically
**Success Criteria**: HelperManagementWidget shows active helpers, automation visible in ActionLog

## Details
## Phase 8D: Helper System - Automation & Roles
### Files to Modify
- `/src/utils/systems/HelperSystem.ts` - New helper automation
- `/src/utils/SimulationEngine.ts` - Integrate helper processing

### Implementation Tasks

#### 1. Create Helper System
```typescript
// New file: src/utils/systems/HelperSystem.ts
export class HelperSystem {
  static processHelpers(gameState: GameState, deltaMinutes: number, gameDataStore: any) {
    for (const helper of gameState.helpers.gnomes) {
      if (!helper.isHoused || !helper.role) continue
      
      const efficiency = this.calculateEfficiency(helper)
      
      switch (helper.role) {
        case 'waterer':
          this.processWatererHelper(gameState, helper, efficiency, deltaMinutes)
          break
        case 'pump_operator':
          this.processPumpOperatorHelper(gameState, helper, efficiency, deltaMinutes)
          break
        case 'sower':
          this.processSowerHelper(gameState, helper, efficiency, deltaMinutes)
          break
        case 'harvester':
          this.processHarvesterHelper(gameState, helper, efficiency, deltaMinutes)
          break
        case 'miner':
          this.processMinerHelper(gameState, helper, efficiency, deltaMinutes)
          break
        case 'fighter':
        case 'support':
          // Combat helpers handled in adventure system
          break
        case 'seed_catcher':
          this.processSeedCatcherHelper(gameState, helper, efficiency, deltaMinutes)
          break
        case 'forager':
          this.processForagerHelper(gameState, helper, efficiency, deltaMinutes)
          break
        case 'refiner':
          this.processRefinerHelper(gameState, helper, efficiency, deltaMinutes)
          break
      }
      
      // Handle dual-role if Master Academy built
      if (helper.secondaryRole && gameState.progression.unlockedUpgrades.includes('master_academy')) {
        // Process secondary role at 75% efficiency
        const secondaryEfficiency = efficiency * 0.75
        
        // FULL SECONDARY ROLE IMPLEMENTATION
        switch (helper.secondaryRole) {
          case 'waterer':
            this.processWatererHelper(gameState, helper, secondaryEfficiency, deltaMinutes)
            break
          case 'pump_operator':
            this.processPumpOperatorHelper(gameState, helper, secondaryEfficiency, deltaMinutes)
            break
          case 'sower':
            this.processSowerHelper(gameState, helper, secondaryEfficiency, deltaMinutes)
            break
          case 'harvester':
            this.processHarvesterHelper(gameState, helper, secondaryEfficiency, deltaMinutes, gameDataStore)
            break
          case 'miner':
            this.processMinerHelper(gameState, helper, secondaryEfficiency, deltaMinutes)
            break
          case 'seed_catcher':
            this.processSeedCatcherHelper(gameState, helper, secondaryEfficiency, deltaMinutes)
            break
          case 'forager':
            this.processForagerHelper(gameState, helper, secondaryEfficiency, deltaMinutes)
            break
          case 'refiner':
            this.processRefinerHelper(gameState, helper, secondaryEfficiency, deltaMinutes)
            break
        }
      }
    }
  }
  
  static calculateEfficiency(helper: any): number {
    const baseEfficiency = 1.0
    const levelBonus = helper.level * 0.1 // +10% per level
    return baseEfficiency + levelBonus
  }
  
  static processWatererHelper(gameState: GameState, helper: any, efficiency: number, deltaMinutes: number) {
    const plotsPerMinute = (5 + helper.level) * efficiency // Base 5 + 1 per level
    const plotsToWater = Math.floor(plotsPerMinute * deltaMinutes)
    
    // Find dry plots and water them
    const dryPlots = gameState.processes.crops
      .filter(c => c.cropType && !c.isDead && c.waterLevel < 0.5)
      .slice(0, plotsToWater)
    
    let watered = 0
    for (const plot of dryPlots) {
      if (gameState.resources.water.current > 0) {
        const waterNeeded = 1.0 - plot.waterLevel
        const waterUsed = Math.min(waterNeeded, gameState.resources.water.current)
        plot.waterLevel += waterUsed
        gameState.resources.water.current -= waterUsed
        watered++
      }
    }
    
    if (watered > 0) {
      gameState.helpers.lastHelperAction = `${helper.name} watered ${watered} plots`
    }
  }
  
  static processPumpOperatorHelper(gameState: GameState, helper: any, efficiency: number, deltaMinutes: number) {
    const waterPerHour = (20 + helper.level * 5) * efficiency // Base 20 + 5 per level
    const waterToAdd = (waterPerHour / 60) * deltaMinutes
    
    const actualWater = Math.min(waterToAdd, gameState.resources.water.max - gameState.resources.water.current)
    if (actualWater > 0) {
      gameState.resources.water.current += actualWater
      gameState.helpers.lastHelperAction = `${helper.name} pumped ${Math.floor(actualWater)} water`
    }
  }
  
  static processSowerHelper(gameState: GameState, helper: any, efficiency: number, deltaMinutes: number) {
    const seedsPerMinute = (3 + helper.level) * efficiency // Base 3 + 1 per level
    const seedsToPlant = Math.floor(seedsPerMinute * deltaMinutes)
    
    // Find empty plots
    const emptyPlots = gameState.processes.crops
      .filter(c => !c.cropType && !c.isDead)
      .slice(0, seedsToPlant)
    
    // Get best available seeds (highest energy value)
    const availableSeeds = Array.from(gameState.resources.seeds.entries())
      .filter(([type, count]) => count > 0)
      .sort((a, b) => {
        const cropA = gameDataStore.getItemById(a[0])
        const cropB = gameDataStore.getItemById(b[0])
        const energyA = CSVDataParser.parseNumericValue(cropA?.energy_per_harvest || '0')
        const energyB = CSVDataParser.parseNumericValue(cropB?.energy_per_harvest || '0')
        return energyB - energyA
      })
    
    let planted = 0
    for (const plot of emptyPlots) {
      if (availableSeeds.length === 0) break
      
      const [seedType, count] = availableSeeds[0]
      plot.cropType = seedType
      plot.growthProgress = 0
      plot.growthStage = 0
      plot.isReady = false
      
      gameState.resources.seeds.set(seedType, count - 1)
      if (count - 1 === 0) {
        availableSeeds.shift()
      }
      planted++
    }
    
    if (planted > 0) {
      gameState.helpers.lastHelperAction = `${helper.name} planted ${planted} seeds`
    }
  }
  
  static processHarvesterHelper(gameState: GameState, helper: any, efficiency: number, deltaMinutes: number, gameDataStore: any) {
    const plotsPerMinute = (4 + helper.level) * efficiency // Base 4 + 1 per level
    const plotsToHarvest = Math.floor(plotsPerMinute * deltaMinutes)
    
    // Find ready crops
    const readyCrops = gameState.processes.crops
      .filter(c => c.isReady && c.cropType)
      .slice(0, plotsToHarvest)
    
    let harvested = 0
    let totalEnergy = 0
    
    for (const crop of readyCrops) {
      const cropData = gameDataStore.getItemById(crop.cropType)
      if (cropData) {
        const energy = CSVDataParser.parseNumericValue(cropData.energy_per_harvest, 1)
        
        // Check if we can store the energy
        if (gameState.resources.energy.current + energy <= gameState.resources.energy.max) {
          gameState.resources.energy.current += energy
          totalEnergy += energy
          
          // LOG ENERGY GAIN FOR VISIBILITY
          gameState.events.push({
            type: 'harvest',
            description: `Harvested ${cropData.name}: +${energy} energy`,
            timestamp: gameState.time.totalMinutes
          })
          
          // Clear the plot
          crop.cropType = null
          crop.isReady = false
          crop.growthProgress = 0
          crop.growthStage = 0
          harvested++
        }
      }
    }
    
    if (harvested > 0) {
      gameState.helpers.lastHelperAction = `${helper.name} harvested ${harvested} crops (+${totalEnergy} energy)`
    }
  }
  
  static processMinerHelper(gameState: GameState, helper: any, efficiency: number, deltaMinutes: number) {
    // Reduce mining energy drain when active
    if (gameState.processes.mining && gameState.processes.mining.active) {
      const reduction = 0.15 + (helper.level * 0.03) // 15% base + 3% per level
      gameState.processes.mining.energyDrainModifier = 1 - (reduction * efficiency)
    }
  }
  
  static processSeedCatcherHelper(gameState: GameState, helper: any, efficiency: number, deltaMinutes: number) {
    // Increase auto-catcher efficiency
    const bonusSeeds = ((0.1 + helper.level * 0.02) * efficiency * deltaMinutes) / 10 // Small chance for bonus seeds
    if (Math.random() < bonusSeeds) {
      // Add a random seed based on current tower reach
      const seedLevel = Math.min(gameState.progression.towerReach - 2, 9)
      if (seedLevel >= 0) {
        // Add seed of appropriate level
        const seedType = `seed_level_${seedLevel}` // This would need proper seed type mapping
        const current = gameState.resources.seeds.get(seedType) || 0
        gameState.resources.seeds.set(seedType, current + 1)
        gameState.helpers.lastHelperAction = `${helper.name} caught bonus seed`
      }
    }
  }
  
  static processForagerHelper(gameState: GameState, helper: any, efficiency: number, deltaMinutes: number) {
    // Import getStorageLimit from 7A implementation
    import { getStorageLimit } from '../SimulationEngine'
    
    // Collect wood from cleared stumps
    const woodPerHour = (5 + helper.level * 2) * efficiency
    const woodToAdd = Math.floor((woodPerHour / 60) * deltaMinutes)
    
    if (woodToAdd > 0 && gameState.progression.completedCleanups.has('remove_stumps_1')) {
      const current = gameState.resources.materials.get('wood') || 0
      const storageLimit = getStorageLimit(gameState, 'wood') // Use shared function from 7A
      const actualWood = Math.min(woodToAdd, storageLimit - current)
      
      if (actualWood > 0) {
        gameState.resources.materials.set('wood', current + actualWood)
        gameState.helpers.lastHelperAction = `${helper.name} gathered ${actualWood} wood`
      }
    }
  }
  
  static processRefinerHelper(gameState: GameState, helper: any, efficiency: number, deltaMinutes: number) {
    // Speed up forge refinement
    if (gameState.processes.crafting && gameState.processes.crafting.length > 0) {
      const speedBonus = 0.05 + (helper.level * 0.01) // 5% base + 1% per level
      gameState.processes.crafting[0].speedModifier = 1 + (speedBonus * efficiency)
    }
  }
}
```

#### 2. Helper Management Actions
```typescript
// In SimulationEngine.ts - Add helper actions
private executeAssignHelperAction(action: GameAction): boolean {
  const helper = this.gameState.helpers.gnomes.find(g => g.id === action.helperId)
  if (!helper) return false
  
  // Check if helper is housed
  if (!helper.isHoused) {
    this.addEvent('blocked', `${helper.name} needs housing before working`)
    return false
  }
  
  // Assign role
  const oldRole = helper.role
  helper.role = action.role
  
  this.addEvent('helper', `Assigned ${helper.name} to ${action.role} role`)
  
  // Handle dual-role assignment if Master Academy exists
  if (action.secondaryRole && this.gameState.progression.unlockedUpgrades.includes('master_academy')) {
    helper.secondaryRole = action.secondaryRole
    this.addEvent('helper', `${helper.name} also assigned to ${action.secondaryRole} (75% efficiency)`)
  }
  
  return true
}

private executeTrainHelperAction(action: GameAction): boolean {
  const helper = this.gameState.helpers.gnomes.find(g => g.id === action.helperId)
  if (!helper || helper.level >= 10) return false
  
  // Calculate training cost
  const energyCost = 50 * Math.pow(2, helper.level) // Exponential cost
  const trainingTime = 30 * (helper.level + 1) // 30 min per level
  
  if (this.gameState.resources.energy.current < energyCost) {
    return false
  }
  
  // Start training
  this.gameState.resources.energy.current -= energyCost
  helper.training = {
    targetLevel: helper.level + 1,
    progress: 0,
    totalTime: trainingTime
  }
  
  this.addEvent('helper', `Started training ${helper.name} to level ${helper.level + 1}`)
  return true
}
```

### Testing Phase 8D
```javascript
// Rescue a gnome → Build housing → Assign to watering
// Plant crops without water → Wait → Check if helper waters them
// Assign to harvesting → Plant and grow crops → Verify automatic harvest
// Check HelperManagementWidget shows correct roles and activity
```

---
