# 8G - Integration & Testing - Full System Validation

## Context
- **What this phase is doing:** See Goals below.
- **What came before:** 7F - Crafting & Mining - Forge Heat & Depth Progression
- **What's coming next:** (This is the final sub‑phase in the plan.)

## Scope
### Phase 8G: Integration & Testing - Full System Validation ✅
**Goals**: Validate all systems work together correctly
**Expected Changes**:
- Full game loop functional
- Phase progression detected
- Bottlenecks identified
- Persona behaviors distinct
**Test Command**: Run 7-day simulation with each persona → Compare behaviors
**Success Criteria**: Different personas show distinct patterns, game progresses through phases

---

## Detailed Implementation Plan

## Phase 8A: Foundation - CSV Parsing & Resource Management

### Files to Modify
- `/src/utils/SimulationEngine.ts` - Add CSVDataParser class
- `/src/types/game-state.ts` - Update resource interfaces
- `/src/utils/gameDataUtils.ts` - Material parsing utilities

### Implementation Tasks

#### 1. Create CSVDataParser Class
```typescript
// Location: src/utils/CSVDataParser.ts (NEW FILE)
export class CSVDataParser {
  // Parse material requirements from CSV strings
  static parseMaterials(materialString: string): Map<string, number> {
    const materials = new Map<string, number>()
    if (!materialString || materialString === '-') return materials
    
    // Handle both "x" and "×" separators
    const parts = materialString.split(';')
    for (const part of parts) {
      const match = part.trim().match(/(.+?)\s*[x×]\s*(\d+)/i)
      if (match) {
        const materialName = match[1].trim().toLowerCase().replace(/\s+/g, '_')
        materials.set(materialName, parseInt(match[2]))
      }
    }
    return materials
  }
  
  // Parse gold cost from materials string
  static parseGoldCost(materialString: string): number {
    const materials = this.parseMaterials(materialString)
    return materials.get('gold') || 0
  }
  
  // Parse energy cost
  static parseEnergyCost(materialString: string): number {
    const materials = this.parseMaterials(materialString)
    return materials.get('energy') || 0
  }
  
  // Parse numeric values with fallback
  static parseNumericValue(value: string, defaultValue: number = 0): number {
    if (!value || value === '-') return defaultValue
    const num = parseInt(value.replace(/[^\d]/g, ''))
    return isNaN(num) ? defaultValue : num
  }
  
  // Parse duration strings (e.g., "10 min", "2 hours")
  static parseDuration(durationString: string): number {
    if (!durationString) return 0
    const match = durationString.match(/(\d+)\s*(min|hour|hr|h)/i)
    if (match) {
      const value = parseInt(match[1])
      const unit = match[2].toLowerCase()
      return unit.includes('hour') || unit === 'h' || unit === 'hr' ? value * 60 : value
    }
    return 0
  }
}
```

#### 2. Fix Material Management System
```typescript
// In SimulationEngine.ts - Update initializeMaterials
private initializeMaterials(): Map<string, number> {
  const materials = new Map<string, number>()
  
  // Standard materials from game design
  const standardMaterials = [
    'wood', 'stone', 'copper', 'iron', 'silver', 'crystal', 'mythril', 'obsidian',
    'pine_resin', 'shadow_bark', 'mountain_stone', 'cave_crystal', 
    'frozen_heart', 'molten_core', 'enchanted_wood'
  ]
  
  for (const material of standardMaterials) {
    materials.set(material, 0)
  }
  
  // Set initial values from parameters if provided
  const startingMaterials = this.parameters?.resource?.starting?.materials || {}
  for (const [material, amount] of Object.entries(startingMaterials)) {
    materials.set(material.toLowerCase(), amount as number)
  }
  
  return materials
}

// Add storage limit checking
private getStorageLimit(material: string): number {
  // Check material storage upgrades
  const storageUpgrades = [
    { id: 'material_crate_i', limit: 50 },
    { id: 'material_crate_ii', limit: 100 },
    { id: 'material_warehouse', limit: 250 },
    { id: 'material_depot', limit: 500 },
    { id: 'material_silo', limit: 1000 }
  ]
  
  for (let i = storageUpgrades.length - 1; i >= 0; i--) {
    if (this.gameState.progression.unlockedUpgrades.includes(storageUpgrades[i].id)) {
      return storageUpgrades[i].limit
    }
  }
  
  return 50 // Default storage limit
}

// Update addMaterial with storage limits
private addMaterial(materialName: string, amount: number): boolean {
  const material = materialName.toLowerCase().replace(/\s+/g, '_')
  const current = this.gameState.resources.materials.get(material) || 0
  const storageLimit = this.getStorageLimit(material)
  
  const newAmount = Math.min(current + amount, storageLimit)
  this.gameState.resources.materials.set(material, newAmount)
  
  if (newAmount < current + amount) {
    this.addEvent('warning', `Material storage full for ${material}`)
    return true // Hit storage cap
  }
  
  return false
}
```

#### 3. Update Resource Interfaces
```typescript
// In game-state.ts
interface ResourceState {
  energy: {
    current: number
    max: number
    regenerationRate: number
  }
  gold: number
  water: {
    current: number
    max: number
    autoGenRate: number // From auto-pumps
  }
  seeds: Map<string, number>
  materials: Map<string, number>
}
```

### Testing Phase 8A
```bash
# Console tests for CSV parsing
const parser = new CSVDataParser()
parser.parseMaterials("Crystal x2;Silver x5") // Should return Map with crystal:2, silver:5
parser.parseGoldCost("Gold x100;Wood x5") // Should return 100
parser.parseDuration("30 min") // Should return 30
```

---

## Phase 8B: Core Actions - Farm Cleanup & Plot Expansion

### Files to Modify
- `/src/utils/SimulationEngine.ts` - executeCleanupAction method
- `/src/utils/systems/PrerequisiteSystem.ts` - New prerequisite checking

### Implementation Tasks

#### 1. Implement Cleanup Action Execution
```typescript
// In SimulationEngine.ts - Add proper cleanup execution
private executeCleanupAction(action: GameAction): boolean {
  const cleanup = this.gameDataStore.getItemById(action.cleanupId)
  if (!cleanup) {
    console.warn(`Cleanup not found: ${action.cleanupId}`)
    return false
  }
  
  // Check prerequisites
  if (!PrerequisiteSystem.checkPrerequisites(cleanup, this.gameState, this.gameDataStore)) {
    this.addEvent('blocked', `Cannot perform ${cleanup.name}: Prerequisites not met`)
    return false
  }
  
  // Check energy cost
  const energyCost = CSVDataParser.parseEnergyCost(cleanup.materials)
  if (this.gameState.resources.energy.current < energyCost) {
    return false
  }
  
  // Check tool requirement
  if (cleanup.tool_required && cleanup.tool_required !== 'Hands') {
    const toolId = cleanup.tool_required.toLowerCase().replace(/\s+/g, '_')
    if (!this.gameState.inventory.tools.has(toolId)) {
      this.addEvent('blocked', `Need ${cleanup.tool_required} for ${cleanup.name}`)
      return false
    }
  }
  
  // Execute cleanup
  this.gameState.resources.energy.current -= energyCost
  
  // CRITICAL: Actually increase plot count!
  const plotsAdded = CSVDataParser.parseNumericValue(cleanup.plots_added, 0)
  if (plotsAdded > 0) {
    this.gameState.progression.farmPlots += plotsAdded
    this.gameState.progression.availablePlots += plotsAdded
    this.addEvent('success', `Cleared ${cleanup.name}: +${plotsAdded} plots (total: ${this.gameState.progression.farmPlots})`)
  }
  
  // Add to completed cleanups
  this.gameState.progression.completedCleanups.add(action.cleanupId)
  
  // Add material rewards if any
  if (cleanup.effects) {
    const materials = CSVDataParser.parseMaterials(cleanup.effects)
    for (const [material, amount] of materials) {
      this.addMaterial(material, amount)
      this.addEvent('resource', `Gained ${amount} ${material}`)
    }
  }
  
  // Update cleanup count for phase progression
  this.updatePhaseProgression()
  
  return true
}
```

#### 2. Create Prerequisite System
```typescript
// New file: src/utils/systems/PrerequisiteSystem.ts
export class PrerequisiteSystem {
  static checkPrerequisites(
    item: any, 
    gameState: GameState,
    gameDataStore: any
  ): boolean {
    if (!item.prerequisites) return true
    
    // Handle multiple prerequisites (array)
    const prerequisites = Array.isArray(item.prerequisites) 
      ? item.prerequisites 
      : [item.prerequisites]
    
    for (const prereqId of prerequisites) {
      if (!this.hasPrerequisite(prereqId, gameState, gameDataStore)) {
        return false
      }
    }
    
    return true
  }
  
  static hasPrerequisite(
    prereqId: string, 
    gameState: GameState,
    gameDataStore: any
  ): boolean {
    // Check if it's an unlocked upgrade
    if (gameState.progression.unlockedUpgrades.includes(prereqId)) {
      return true
    }
    
    // Check if it's a completed cleanup
    if (gameState.progression.completedCleanups.has(prereqId)) {
      return true
    }
    
    // Check if it's a completed adventure
    if (prereqId.includes('_path_') || prereqId.includes('_vale_') || prereqId.includes('_forest_')) {
      return gameState.progression.completedAdventures.has(prereqId)
    }
    
    // Check if it's a tool/weapon ownership
    if (prereqId.startsWith('has_')) {
      const toolId = prereqId.replace('has_', '')
      return gameState.inventory.tools.has(toolId) || 
             gameState.inventory.weapons.has(toolId)
    }
    
    // Check farm stages
    if (prereqId === 'small_hold') {
      return gameState.progression.farmPlots >= 20
    }
    if (prereqId === 'homestead') {
      return gameState.progression.farmPlots >= 40
    }
    if (prereqId === 'manor_grounds') {
      return gameState.progression.farmPlots >= 65
    }
    if (prereqId === 'great_estate') {
      return gameState.progression.farmPlots >= 90
    }
    
    // Check hero level
    const levelMatch = prereqId.match(/hero_level_(\d+)/)
    if (levelMatch) {
      const requiredLevel = parseInt(levelMatch[1])
      return gameState.progression.heroLevel >= requiredLevel
    }
    
    // Check phase
    const phaseMap = {
      'tutorial_complete': 'Tutorial',
      'early_game': 'Early',
      'mid_game': 'Mid',
      'late_game': 'Late',
      'end_game': 'End'
    }
    if (phaseMap[prereqId]) {
      return gameState.progression.currentPhase === phaseMap[prereqId] ||
             this.isPhaseAfter(gameState.progression.currentPhase, phaseMap[prereqId])
    }
    
    return false
  }
  
  static isPhaseAfter(current: string, required: string): boolean {
    const phaseOrder = ['Tutorial', 'Early', 'Mid', 'Late', 'End']
    return phaseOrder.indexOf(current) > phaseOrder.indexOf(required)
  }
}
```

### Testing Phase 8B
```javascript
// Start simulation and watch for cleanup actions
// Should see in ActionLog: "Cleared Clear Weeds #1: +2 plots (total: 5)"
// Check that farmPlots in GameState increases
// Verify materials are gained from cleanups with material rewards
```

---

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
        // Similar switch statement for secondary role
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
    // Collect wood from cleared stumps
    const woodPerHour = (5 + helper.level * 2) * efficiency
    const woodToAdd = Math.floor((woodPerHour / 60) * deltaMinutes)
    
    if (woodToAdd > 0 && gameState.progression.completedCleanups.has('remove_stumps_1')) {
      const current = gameState.resources.materials.get('wood') || 0
      const storageLimit = 1000 // Would need proper storage checking
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

## Phase 8E: Combat System - Adventures & Boss Fights

### Files to Modify
- `/src/utils/systems/CombatSystem.ts` - New combat simulation
- `/src/utils/SimulationEngine.ts` - Adventure execution

### Implementation Tasks

#### 1. Create Combat System
```typescript
// New file: src/utils/systems/CombatSystem.ts
export class CombatSystem {
  static simulateAdventure(
    route: any,
    weapons: Map<string, any>,
    armor: any,
    heroLevel: number,
    helpers: any[],
    parameters: any
  ): AdventureResult {
    const baseHP = 100 + (heroLevel * 20)
    let currentHP = baseHP
    let totalGold = 0
    let totalXP = 0
    const events: string[] = []
    
    // Parse route data from CSV
    const routeVariant = route.id.split('_').pop() // short, medium, or long
    const waveCount = this.getWaveCount(route, routeVariant)
    const enemyComposition = this.parseEnemyComposition(route.enemy_types)
    
    // Process waves
    for (let wave = 1; wave <= waveCount; wave++) {
      const waveResult = this.simulateWave(
        wave, 
        enemyComposition, 
        weapons, 
        armor, 
        currentHP,
        helpers
      )
      
      currentHP = waveResult.remainingHP
      events.push(`Wave ${wave}: Lost ${baseHP - currentHP} HP`)
      
      if (currentHP <= 0) {
        return {
          success: false,
          gold: 0,
          xp: 0,
          hp: 0,
          events,
          reason: `Died on wave ${wave}`
        }
      }
      
      // Apply armor effects between waves
      if (armor?.effect === 'Regeneration') {
        const heal = 3
        currentHP = Math.min(baseHP, currentHP + heal)
        events.push(`Regenerated ${heal} HP`)
      }
    }
    
    // Boss fight
    const bossResult = this.simulateBossFight(
      route.boss_type,
      weapons,
      armor,
      currentHP,
      heroLevel
    )
    
    currentHP = bossResult.remainingHP
    events.push(`Boss fight: ${bossResult.description}`)
    
    if (currentHP > 0) {
      // Victory!
      totalGold = CSVDataParser.parseNumericValue(route.gold_gain, 100)
      totalXP = CSVDataParser.parseNumericValue(route.xp_gain, 50)
      
      // Apply Gold Magnet armor effect
      if (armor?.effect === 'Gold Magnet') {
        totalGold = Math.floor(totalGold * 1.25)
        events.push('Gold Magnet: +25% gold')
      }
      
      return {
        success: true,
        gold: totalGold,
        xp: totalXP,
        hp: currentHP,
        events,
        loot: this.generateLoot(route, bossResult.bossDefeated),
        materials: this.parseMaterialRewards(route.materials_gain)
      }
    }
    
    return {
      success: false,
      gold: 0,
      xp: 0,
      hp: 0,
      events,
      reason: 'Died to boss'
    }
  }
  
  static simulateWave(
    waveNumber: number,
    composition: Map<string, number>,
    weapons: Map<string, any>,
    armor: any,
    currentHP: number,
    helpers: any[]
  ): { remainingHP: number; enemiesKilled: number } {
    let totalDamageDealt = 0
    let totalDamageTaken = 0
    let enemiesKilled = 0
    
    // Generate enemies for this wave
    const enemyCount = 1 + Math.floor(waveNumber / 3) // 1-5 enemies based on wave
    const enemies = this.generateEnemies(enemyCount, composition)
    
    for (const enemy of enemies) {
      // Select best weapon
      const weapon = this.selectBestWeapon(weapons, enemy.type)
      if (!weapon) continue
      
      // Calculate damage
      const damagePerHit = this.calculateDamage(weapon, enemy)
      const hitsToKill = Math.ceil(enemy.hp / damagePerHit)
      const timeToKill = hitsToKill / weapon.attackSpeed
      
      // Apply helper damage if fighter assigned
      const fighterHelper = helpers.find(h => h.role === 'fighter')
      if (fighterHelper) {
        const helperDamage = 5 + fighterHelper.level * 2
        enemy.hp -= helperDamage * timeToKill
      }
      
      // Calculate damage taken
      const defenseMitigation = armor ? (armor.defense / 100) : 0
      const incomingDamage = enemy.damage * timeToKill * (1 - defenseMitigation)
      
      // Apply armor special effects
      if (armor?.effect === 'Reflection' && Math.random() < 0.15) {
        totalDamageTaken += incomingDamage * 0.7 // 30% reflected
      } else if (armor?.effect === 'Evasion' && Math.random() < 0.1) {
        // Dodged entirely
      } else if (armor?.effect === 'Critical Shield' && enemiesKilled === 0) {
        // First hit negated
      } else {
        totalDamageTaken += incomingDamage
      }
      
      enemiesKilled++
      
      // Vampiric healing
      if (armor?.effect === 'Vampiric') {
        currentHP += 1 // Heal 1 HP per kill
      }
    }
    
    return {
      remainingHP: currentHP - totalDamageTaken,
      enemiesKilled
    }
  }
  
  static calculateDamage(weapon: any, enemy: any): number {
    const baseDamage = weapon.damage || 10
    
    // Weapon type advantages (pentagon system)
    const advantages = {
      'spear': 'armored_insects',
      'sword': 'predatory_beasts',
      'bow': 'flying_predators',
      'crossbow': 'venomous_crawlers',
      'wand': 'living_plants'
    }
    
    const resistances = {
      'spear': 'predatory_beasts',
      'sword': 'flying_predators',
      'bow': 'venomous_crawlers',
      'crossbow': 'living_plants',
      'wand': 'armored_insects'
    }
    
    let multiplier = 1.0
    if (advantages[weapon.type] === enemy.type) {
      multiplier = 1.5 // Advantage
    } else if (resistances[weapon.type] === enemy.type) {
      multiplier = 0.5 // Resistance
    }
    
    return baseDamage * multiplier
  }
  
  static simulateBossFight(
    bossType: string,
    weapons: Map<string, any>,
    armor: any,
    currentHP: number,
    heroLevel: number
  ): { remainingHP: number; bossDefeated: boolean; description: string } {
    const bosses = {
      'giant_slime': {
        hp: 150,
        damage: 8,
        attackSpeed: 0.5,
        weakness: null,
        quirk: 'splits'
      },
      'beetle_lord': {
        hp: 200,
        damage: 10,
        attackSpeed: 0.4,
        weakness: 'spear',
        quirk: 'hardened_shell'
      },
      'alpha_wolf': {
        hp: 250,
        damage: 12,
        attackSpeed: 0.8,
        weakness: 'sword',
        quirk: 'pack_leader'
      },
      'sky_serpent': {
        hp: 300,
        damage: 10,
        attackSpeed: 1.0,
        weakness: 'bow',
        quirk: 'aerial_phase'
      },
      'crystal_spider': {
        hp: 400,
        damage: 12,
        attackSpeed: 0.6,
        weakness: 'crossbow',
        quirk: 'web_trap'
      },
      'frost_wyrm': {
        hp: 500,
        damage: 15,
        attackSpeed: 0.7,
        weakness: 'wand',
        quirk: 'frost_armor'
      },
      'lava_titan': {
        hp: 600,
        damage: 18,
        attackSpeed: 0.5,
        weakness: 'rotating',
        quirk: 'molten_core'
      }
    }
    
    const boss = bosses[bossType] || bosses['giant_slime']
    let bossHP = boss.hp
    let totalDamage = 0
    let description = `Fighting ${bossType}`
    
    // Check if we have the weakness weapon
    const hasWeakness = boss.weakness && weapons.has(boss.weakness)
    
    // Apply quirk penalties
    if (boss.quirk === 'hardened_shell' && !hasWeakness) {
      description += ' (50% damage without spear)'
      totalDamage *= 2 // Takes twice as long
    }
    
    if (boss.quirk === 'aerial_phase' && !weapons.has('bow')) {
      totalDamage += boss.damage * 5 // 5 seconds of free damage
      description += ' (took aerial damage)'
    }
    
    if (boss.quirk === 'molten_core') {
      const burnDamage = 2 * (bossHP / 20) // 2 damage per second for entire fight
      totalDamage += burnDamage
      description += ' (burn damage throughout)'
    }
    
    // Calculate fight duration and damage
    const weapon = hasWeakness ? weapons.get(boss.weakness) : Array.from(weapons.values())[0]
    const damagePerHit = weapon ? weapon.damage * (hasWeakness ? 1.5 : 1.0) : 10
    const timeToKill = bossHP / (damagePerHit * weapon.attackSpeed)
    
    const defenseMitigation = armor ? (armor.defense / 100) : 0
    totalDamage += boss.damage * boss.attackSpeed * timeToKill * (1 - defenseMitigation)
    
    return {
      remainingHP: currentHP - totalDamage,
      bossDefeated: currentHP > totalDamage,
      description
    }
  }
  
  static generateLoot(route: any, bossDefeated: boolean): any[] {
    if (!bossDefeated) return []
    
    const loot = []
    
    // Boss materials (guaranteed)
    if (route.boss_material) {
      loot.push({
        type: 'material',
        id: route.boss_material,
        quantity: 1
      })
    }
    
    // Armor drop chance
    if (Math.random() < 0.3) { // 30% chance
      const defenseRatings = ['minimal', 'low', 'medium', 'high', 'extreme']
      const effects = ['reflection', 'evasion', 'gold_magnet', 'regeneration', 'type_resist']
      
      loot.push({
        type: 'armor',
        defense: defenseRatings[Math.floor(Math.random() * defenseRatings.length)],
        effect: effects[Math.floor(Math.random() * effects.length)],
        upgradePotential: Math.random() < 0.2 ? 'excellent' : 'average'
      })
    }
    
    return loot
  }
  
  private static getWaveCount(route: any, variant: string): number {
    const waveCounts = {
      'meadow_path': { short: 3, medium: 5, long: 8 },
      'pine_vale': { short: 4, medium: 6, long: 10 },
      'dark_forest': { short: 4, medium: 7, long: 12 },
      'mountain_pass': { short: 5, medium: 8, long: 14 },
      'crystal_caves': { short: 5, medium: 9, long: 16 },
      'frozen_tundra': { short: 6, medium: 10, long: 18 },
      'volcano_core': { short: 6, medium: 11, long: 20 }
    }
    
    const routeBase = route.id.replace(`_${variant}`, '')
    return waveCounts[routeBase]?.[variant] || 5
  }
  
  private static parseEnemyComposition(enemyTypes: string): Map<string, number> {
    const composition = new Map<string, number>()
    
    // Parse format: "Slimes (100%)" or "Beasts (60%), Slimes (40%)"
    const matches = enemyTypes.matchAll(/(\w+)\s*\((\d+)%\)/g)
    for (const match of matches) {
      const type = match[1].toLowerCase()
      const percentage = parseInt(match[2]) / 100
      composition.set(type, percentage)
    }
    
    return composition
  }
  
  private static generateEnemies(count: number, composition: Map<string, number>): any[] {
    const enemies = []
    const types = Array.from(composition.entries())
    
    for (let i = 0; i < count; i++) {
      // Random selection based on composition percentages
      const rand = Math.random()
      let cumulative = 0
      let selectedType = 'slimes'
      
      for (const [type, percentage] of types) {
        cumulative += percentage
        if (rand <= cumulative) {
          selectedType = type
          break
        }
      }
      
      enemies.push(this.createEnemy(selectedType))
    }
    
    return enemies
  }
  
  private static createEnemy(type: string): any {
    const enemyStats = {
      'slimes': { hp: 20, damage: 3, attackSpeed: 1.0 },
      'armored_insects': { hp: 30, damage: 4, attackSpeed: 0.8 },
      'predatory_beasts': { hp: 25, damage: 6, attackSpeed: 1.2 },
      'flying_predators': { hp: 20, damage: 5, attackSpeed: 1.5 },
      'venomous_crawlers': { hp: 35, damage: 4, attackSpeed: 1.0 },
      'living_plants': { hp: 40, damage: 3, attackSpeed: 0.7 }
    }
    
    return {
      type,
      ...(enemyStats[type] || enemyStats['slimes'])
    }
  }
  
  private static selectBestWeapon(weapons: Map<string, any>, enemyType: string): any {
    // Find weapon with advantage
    const advantages = {
      'armored_insects': 'spear',
      'predatory_beasts': 'sword',
      'flying_predators': 'bow',
      'venomous_crawlers': 'crossbow',
      'living_plants': 'wand'
    }
    
    const idealWeapon = advantages[enemyType]
    if (idealWeapon && weapons.has(idealWeapon)) {
      return weapons.get(idealWeapon)
    }
    
    // Return any weapon, preferring one without resistance
    for (const [type, weapon] of weapons) {
      const resistances = {
        'spear': 'predatory_beasts',
        'sword': 'flying_predators',
        'bow': 'venomous_crawlers',
        'crossbow': 'living_plants',
        'wand': 'armored_insects'
      }
      
      if (resistances[type] !== enemyType) {
        return weapon
      }
    }
    
    // Return first available weapon
    return weapons.values().next().value
  }
  
  private static parseMaterialRewards(materialsString: string): Map<string, number> {
    if (!materialsString) return new Map()
    return CSVDataParser.parseMaterials(materialsString)
  }
}
```

### Testing Phase 8E
```javascript
// Start Meadow Path Short adventure
// Check combat log for wave processing
// Verify HP decreases appropriately
// Check weapon switching based on enemy types
// Verify boss fight mechanics
// Check loot and rewards on success
```

---

## Phase 8F: Crafting & Mining - Forge Heat & Depth Progression

### Files to Modify
- `/src/utils/systems/CraftingSystem.ts` - Forge and crafting
- `/src/utils/systems/MiningSystem.ts` - Mining depth mechanics

### Implementation Tasks

#### 1. Create Crafting System
```typescript
// New file: src/utils/systems/CraftingSystem.ts
export class CraftingSystem {
  static processCrafting(gameState: GameState, deltaMinutes: number, gameDataStore: any) {
    if (!gameState.processes.crafting || gameState.processes.crafting.length === 0) {
      return
    }
    
    const currentCraft = gameState.processes.crafting[0]
    
    // Apply speed modifiers
    let speedModifier = 1.0
    
    // Furnace upgrades
    if (gameState.progression.unlockedUpgrades.includes('furnace_upgrade_i')) {
      speedModifier += 0.2
    }
    if (gameState.progression.unlockedUpgrades.includes('furnace_upgrade_ii')) {
      speedModifier += 0.4
    }
    if (gameState.progression.unlockedUpgrades.includes('crystal_furnace')) {
      speedModifier += 0.6
    }
    
    // Helper bonus
    if (currentCraft.speedModifier) {
      speedModifier *= currentCraft.speedModifier
    }
    
    // Progress crafting
    const progress = (deltaMinutes / currentCraft.duration) * speedModifier
    currentCraft.progress += progress
    
    // Check completion
    if (currentCraft.progress >= 1.0) {
      // Check success rate based on heat
      const successRate = this.calculateSuccessRate(currentCraft, gameState)
      
      if (Math.random() < successRate) {
        this.completeCraft(gameState, currentCraft, gameDataStore)
      } else {
        // Crafting failed
        gameState.events.push({
          type: 'crafting',
          description: `Failed to craft ${currentCraft.itemId}`,
          timestamp: gameState.time.totalMinutes
        })
      }
      
      // Remove from queue
      gameState.processes.crafting.shift()
    }
    
    // Update forge heat (decays over time)
    if (gameState.processes.forgeHeat > 0) {
      const heatDecay = 50 * deltaMinutes // Loses 50 degrees per minute
      gameState.processes.forgeHeat = Math.max(0, gameState.processes.forgeHeat - heatDecay)
    }
  }
  
  static calculateSuccessRate(craft: any, gameState: GameState): number {
    const baseRate = craft.successRate || 1.0
    
    // Heat affects success rate
    const idealHeat = 3000 // Optimal temperature
    const currentHeat = gameState.processes.forgeHeat || 0
    const heatDifference = Math.abs(idealHeat - currentHeat)
    
    let heatModifier = 1.0
    if (currentHeat < 2000) {
      heatModifier = 0.5 // Too cold
    } else if (currentHeat > 4000) {
      heatModifier = 0.8 // Too hot
    } else if (heatDifference < 500) {
      heatModifier = 1.0 // Perfect range
    } else {
      heatModifier = 0.9 // Acceptable range
    }
    
    return Math.min(1.0, baseRate * heatModifier)
  }
  
  static completeCraft(gameState: GameState, craft: any, gameDataStore: any) {
    const itemData = gameDataStore.getItemById(craft.itemId)
    if (!itemData) return
    
    // Determine item type and add to inventory
    if (itemData.category === 'tool' || craft.itemType === 'tool') {
      // Add tool to inventory
      gameState.inventory.tools.set(craft.itemId, {
        id: craft.itemId,
        name: itemData.name,
        owned: true,
        upgraded: false,
        tier: itemData.tier || 'base'
      })
      
      gameState.events.push({
        type: 'crafting',
        description: `Crafted ${itemData.name}`,
        timestamp: gameState.time.totalMinutes
      })
    } else if (itemData.category === 'weapon' || craft.itemType === 'weapon') {
      // Parse weapon type and level
      const weaponMatch = craft.itemId.match(/(\w+)_(\d+|[ivxlcdm]+)$/i)
      if (weaponMatch) {
        const weaponType = weaponMatch[1]
        const level = this.parseWeaponLevel(weaponMatch[2])
        
        const existing = gameState.inventory.weapons.get(weaponType) || { level: 0, damage: 10, attackSpeed: 1.0 }
        if (level > existing.level) {
          existing.level = level
          existing.damage = this.getWeaponDamage(weaponType, level)
          existing.attackSpeed = this.getWeaponSpeed(weaponType, level)
          gameState.inventory.weapons.set(weaponType, existing)
        }
      }
    } else if (itemData.category === 'upgrade') {
      // Add to unlocked upgrades
      gameState.progression.unlockedUpgrades.push(craft.itemId)
    }
    
    // Apply Master Craft chance for double output
    if (gameState.progression.unlockedUpgrades.includes('master_craft')) {
      if (Math.random() < 0.1) { // 10% chance
        // Craft another copy
        this.completeCraft(gameState, craft, gameDataStore)
        gameState.events.push({
          type: 'crafting',
          description: 'Master Craft proc! Double output!',
          timestamp: gameState.time.totalMinutes
        })
      }
    }
  }
  
  static getWeaponDamage(type: string, level: number): number {
    const baseDamage = {
      'spear': 10,
      'sword': 12,
      'bow': 8,
      'crossbow': 15,
      'wand': 7
    }
    
    return (baseDamage[type] || 10) * (1 + level * 0.5)
  }
  
  static getWeaponSpeed(type: string, level: number): number {
    const baseSpeed = {
      'spear': 1.0,
      'sword': 0.9,
      'bow': 1.2,
      'crossbow': 0.7,
      'wand': 1.5
    }
    
    return (baseSpeed[type] || 1.0) * (1 + level * 0.05)
  }
  
  static parseWeaponLevel(levelStr: string): number {
    // Handle numeric levels
    if (!isNaN(parseInt(levelStr))) {
      return parseInt(levelStr)
    }
    
    // Handle roman numerals
    const romanMap = {
      'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
      'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10
    }
    
    return romanMap[levelStr.toLowerCase()] || 1
  }
  
  static startCrafting(
    gameState: GameState,
    itemId: string,
    gameDataStore: any
  ): boolean {
    const item = gameDataStore.getItemById(itemId)
    if (!item) return false
    
    // Check prerequisites
    if (!PrerequisiteSystem.checkPrerequisites(item, gameState, gameDataStore)) {
      return false
    }
    
    // Check materials
    const requiredMaterials = CSVDataParser.parseMaterials(item.materials)
    for (const [material, amount] of requiredMaterials) {
      if (material === 'energy') {
        if (gameState.resources.energy.current < amount) {
          return false
        }
      } else if (material === 'gold') {
        if (gameState.resources.gold < amount) {
          return false
        }
      } else {
        const current = gameState.resources.materials.get(material) || 0
        if (current < amount) {
          return false
        }
      }
    }
    
    // Consume materials
    for (const [material, amount] of requiredMaterials) {
      if (material === 'energy') {
        gameState.resources.energy.current -= amount
      } else if (material === 'gold') {
        gameState.resources.gold -= amount
      } else {
        const current = gameState.resources.materials.get(material) || 0
        gameState.resources.materials.set(material, current - amount)
      }
    }
    
    // Add to crafting queue
    const craftTime = CSVDataParser.parseDuration(item.time) || 10
    const successRate = this.parseSuccessRate(item.success_rate)
    
    gameState.processes.crafting.push({
      itemId: itemId,
      itemType: item.category,
      duration: craftTime,
      progress: 0,
      successRate: successRate
    })
    
    gameState.events.push({
      type: 'crafting',
      description: `Started crafting ${item.name}`,
      timestamp: gameState.time.totalMinutes
    })
    
    return true
  }
  
  static parseSuccessRate(rateString: string): number {
    if (!rateString) return 1.0
    const match = rateString.match(/(\d+)%?/)
    if (match) {
      const rate = parseInt(match[1])
      return rate > 1 ? rate / 100 : rate
    }
    return 1.0
  }
}
```

#### 2. Create Mining System
```typescript
// New file: src/utils/systems/MiningSystem.ts
export class MiningSystem {
  static processMining(gameState: GameState, deltaMinutes: number) {
    if (!gameState.processes.mining || !gameState.processes.mining.active) return
    
    const mining = gameState.processes.mining
    
    // Calculate energy drain based on depth
    const depthTier = Math.floor(mining.depth / 500) + 1
    const baseDrain = Math.pow(2, depthTier - 1) // 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024
    
    // Apply pickaxe efficiency
    const pickaxeEfficiency = this.getPickaxeEfficiency(gameState)
    const drainModifier = mining.energyDrainModifier || 1.0 // From helper
    const actualDrain = baseDrain * deltaMinutes * (1 - pickaxeEfficiency) * drainModifier
    
    // Check if we have enough energy
    if (gameState.resources.energy.current < actualDrain) {
      // End mining session
      mining.active = false
      gameState.events.push({
        type: 'mining',
        description: `Mining ended at depth ${mining.depth}m (out of energy)`,
        timestamp: gameState.time.totalMinutes
      })
      return
    }
    
    // Consume energy
    gameState.resources.energy.current -= actualDrain
    
    // Progress deeper
    const depthProgress = 10 * deltaMinutes // 10 meters per minute
    mining.depth += depthProgress
    
    // Material drops every 30 seconds (0.5 minutes)
    mining.materialTimer = (mining.materialTimer || 0) + deltaMinutes
    while (mining.materialTimer >= 0.5) {
      this.dropMaterials(gameState, mining.depth)
      mining.materialTimer -= 0.5
    }
    
    // Check if reached target depth
    if (mining.targetDepth && mining.depth >= mining.targetDepth) {
      mining.active = false
      gameState.events.push({
        type: 'mining',
        description: `Reached target depth ${mining.targetDepth}m`,
        timestamp: gameState.time.totalMinutes
      })
    }
    
    // Tool sharpening buff
    if (mining.sharpenedUntil && gameState.time.totalMinutes > mining.sharpenedUntil) {
      mining.sharpenedUntil = null
      gameState.events.push({
        type: 'mining',
        description: 'Tool sharpening buff expired',
        timestamp: gameState.time.totalMinutes
      })
    }
  }
  
  static getPickaxeEfficiency(gameState: GameState): number {
    // Check which pickaxe is owned (highest tier)
    const pickaxes = [
      { id: 'abyss_seeker', efficiency: 0.60, bonus: 0.50 },
      { id: 'crystal_pick', efficiency: 0.45, bonus: 0.30 },
      { id: 'pickaxe_iii', efficiency: 0.30, bonus: 0.20 },
      { id: 'pickaxe_ii', efficiency: 0.15, bonus: 0.10 },
      { id: 'pickaxe_i', efficiency: 0, bonus: 0 }
    ]
    
    for (const pickaxe of pickaxes) {
      if (gameState.inventory.tools.has(pickaxe.id)) {
        // Apply sharpening buff if active
        const sharpened = gameState.processes.mining?.sharpenedUntil > gameState.time.totalMinutes
        return pickaxe.efficiency + (sharpened ? 0.25 : 0)
      }
    }
    
    return 0 // No pickaxe = no efficiency bonus
  }
  
  static dropMaterials(gameState: GameState, depth: number) {
    const depthTier = Math.floor(depth / 500) + 1
    
    // Material drop tables by depth tier
    const materialsByTier = [
      { materials: ['stone'], weights: [1.0] }, // 0-500m
      { materials: ['copper', 'stone'], weights: [0.6, 0.4] }, // 500-1000m
      { materials: ['iron', 'copper'], weights: [0.7, 0.3] }, // 1000-1500m
      { materials: ['iron'], weights: [1.0] }, // 1500-2000m
      { materials: ['silver', 'iron'], weights: [0.6, 0.4] }, // 2000-2500m
      { materials: ['silver'], weights: [1.0] }, // 2500-3000m
      { materials: ['crystal', 'silver'], weights: [0.5, 0.5] }, // 3000-3500m
      { materials: ['crystal'], weights: [1.0] }, // 3500-4000m
      { materials: ['mythril', 'crystal'], weights: [0.4, 0.6] }, // 4000-4500m
      { materials: ['obsidian', 'mythril'], weights: [0.3, 0.7] } // 4500-5000m
    ]
    
    const tierData = materialsByTier[Math.min(depthTier - 1, 9)]
    if (!tierData) return
    
    // Select material based on weights
    const rand = Math.random()
    let cumulative = 0
    let selectedMaterial = tierData.materials[0]
    
    for (let i = 0; i < tierData.materials.length; i++) {
      cumulative += tierData.weights[i]
      if (rand <= cumulative) {
        selectedMaterial = tierData.materials[i]
        break
      }
    }
    
    // Calculate quantity (scales with depth)
    let quantity = Math.floor(Math.random() * 3) + depthTier * 2 // 2-4, 4-6, 6-8, etc
    
    // Apply pickaxe material bonus
    const pickaxeBonus = this.getPickaxeMaterialBonus(gameState)
    quantity = Math.floor(quantity * (1 + pickaxeBonus))
    
    // Check for Abyss Seeker special ability (2x obsidian chance)
    if (selectedMaterial === 'obsidian' && gameState.inventory.tools.has('abyss_seeker')) {
      if (Math.random() < 0.5) { // 50% chance to double obsidian
        quantity *= 2
      }
    }
    
    // Add materials (as raw, need refinement)
    const rawMaterial = `raw_${selectedMaterial}`
    const current = gameState.resources.materials.get(rawMaterial) || 0
    const storageLimit = this.getMaterialStorageLimit(gameState)
    const actualQuantity = Math.min(quantity, storageLimit - current)
    
    if (actualQuantity > 0) {
      gameState.resources.materials.set(rawMaterial, current + actualQuantity)
      gameState.events.push({
        type: 'mining',
        description: `Found ${actualQuantity} ${rawMaterial}`,
        timestamp: gameState.time.totalMinutes
      })
    }
  }
  
  static getPickaxeMaterialBonus(gameState: GameState): number {
    const pickaxes = [
      { id: 'abyss_seeker', bonus: 0.50 },
      { id: 'crystal_pick', bonus: 0.30 },
      { id: 'pickaxe_iii', bonus: 0.20 },
      { id: 'pickaxe_ii', bonus: 0.10 },
      { id: 'pickaxe_i', bonus: 0 }
    ]
    
    for (const pickaxe of pickaxes) {
      if (gameState.inventory.tools.has(pickaxe.id)) {
        return pickaxe.bonus
      }
    }
    
    return 0
  }
  
  static getMaterialStorageLimit(gameState: GameState): number {
    const storageUpgrades = [
      { id: 'material_silo', limit: 1000 },
      { id: 'material_depot', limit: 500 },
      { id: 'material_warehouse', limit: 250 },
      { id: 'material_crate_ii', limit: 100 },
      { id: 'material_crate_i', limit: 50 }
    ]
    
    for (const upgrade of storageUpgrades) {
      if (gameState.progression.unlockedUpgrades.includes(upgrade.id)) {
        return upgrade.limit
      }
    }
    
    return 50 // Default
  }
  
  static startMining(gameState: GameState, targetDepth?: number): boolean {
    // Check if already mining
    if (gameState.processes.mining?.active) {
      return false
    }
    
    // Check if has pickaxe
    const hasPickaxe = ['pickaxe_i', 'pickaxe_ii', 'pickaxe_iii', 'crystal_pick', 'abyss_seeker']
      .some(id => gameState.inventory.tools.has(id))
    
    if (!hasPickaxe) {
      gameState.events.push({
        type: 'blocked',
        description: 'Need a pickaxe to mine',
        timestamp: gameState.time.totalMinutes
      })
      return false
    }
    
    // Check if has mining access
    if (gameState.progression.currentPhase === 'Tutorial' || 
        gameState.progression.currentPhase === 'Early') {
      gameState.events.push({
        type: 'blocked',
        description: 'Mining unlocks in Mid Game',
        timestamp: gameState.time.totalMinutes
      })
      return false
    }
    
    // Start mining
    const startDepth = this.getStartingDepth(gameState)
    gameState.processes.mining = {
      active: true,
      depth: startDepth,
      targetDepth: targetDepth || 5000,
      materialTimer: 0,
      energyDrainModifier: 1.0,
      sharpenedUntil: null
    }
    
    gameState.events.push({
      type: 'mining',
      description: `Started mining from depth ${startDepth}m`,
      timestamp: gameState.time.totalMinutes
    })
    
    return true
  }
  
  static getStartingDepth(gameState: GameState): number {
    // Check for depth shortcuts
    const shortcuts = [
      { id: 'depth_10_entry', depth: 4500 },
      { id: 'depth_9_entry', depth: 4000 },
      { id: 'depth_8_entry', depth: 3500 },
      { id: 'depth_7_entry', depth: 3000 },
      { id: 'depth_6_entry', depth: 2500 },
      { id: 'depth_5_entry', depth: 2000 },
      { id: 'depth_4_entry', depth: 1500 },
      { id: 'depth_3_entry', depth: 1000 },
      { id: 'depth_2_entry', depth: 500 }
    ]
    
    for (const shortcut of shortcuts) {
      if (gameState.progression.unlockedUpgrades.includes(shortcut.id)) {
        return shortcut.depth
      }
    }
    
    return 0 // Start from surface
  }
  
  static sharpenTool(gameState: GameState): boolean {
    if (!gameState.processes.mining?.active) {
      return false
    }
    
    // Pause mining to sharpen
    gameState.processes.mining.active = false
    
    // Set sharpening buff (5 minutes)
    gameState.processes.mining.sharpenedUntil = gameState.time.totalMinutes + 5
    
    gameState.events.push({
      type: 'mining',
      description: 'Sharpened pickaxe (-25% energy drain for 5 minutes)',
      timestamp: gameState.time.totalMinutes
    })
    
    // Resume mining
    setTimeout(() => {
      if (gameState.processes.mining) {
        gameState.processes.mining.active = true
      }
    }, 1000) // Resume after 1 second
    
    return true
  }
}
```

### Testing Phase 8F
```javascript
// Start crafting an item → Check forge heat affects success
// Mine to depth 1000 → Verify exponential energy drain
// Check material drops match depth tiers
// Verify pickaxe efficiency reduces energy consumption
// Test tool sharpening buff
```

---

## Phase 8G: Integration & Testing - Full System Validation

### Files to Modify
- `/src/utils/SimulationEngine.ts` - Integrate all systems
- `/tests/simulation.test.ts` - Comprehensive tests

### Implementation Tasks

#### 1. Update Main Tick Method
```typescript
// In SimulationEngine.ts - Complete tick integration
tick(): TickResult {
  const deltaMinutes = 1 // Each tick = 1 minute game time
  
  // 1. Update time
  this.updateGameTime(deltaMinutes)
  
  // 2. Process all systems
  try {
    // Crop growth and water
    CropSystem.processCropGrowth(this.gameState, deltaMinutes, this.gameDataStore)
    
    // Crafting and forge
    CraftingSystem.processCrafting(this.gameState, deltaMinutes, this.gameDataStore)
    
    // Mining
    MiningSystem.processMining(this.gameState, deltaMinutes)
    
    // Helpers
    HelperSystem.processHelpers(this.gameState, deltaMinutes, this.gameDataStore)
    
    // Adventure processing
    if (this.gameState.processes.adventure?.active) {
      this.processAdventure(deltaMinutes)
    }
    
    // Resource regeneration
    this.processResourceRegeneration(deltaMinutes)
    
  } catch (error) {
    console.error('Error processing systems:', error)
    this.addEvent('error', `System error: ${error.message}`)
  }
  
  // 3. AI Decision Making
  const actions = []
  if (this.shouldMakeDecision()) {
    const possibleActions = this.getAllPossibleActions()
    const scoredActions = this.scoreActions(possibleActions)
    const bestAction = this.selectBestAction(scoredActions)
    
    if (bestAction && this.executeAction(bestAction)) {
      actions.push(bestAction)
    }
  }
  
  // 4. Update progression
  this.updatePhaseProgression()
  this.checkForBottlenecks()
  
  // 5. Check victory/defeat conditions
  const isComplete = this.checkVictoryCondition()
  const isFailed = this.checkDefeatCondition()
  
  return {
    gameState: this.gameState,
    executedActions: actions,
    events: this.getRecentEvents(),
    deltaTime: deltaMinutes,
    tickCount: ++this.tickCount,
    isComplete,
    isFailed,
    isStuck: this.isBottlenecked
  }
}

// Process resource regeneration
private processResourceRegeneration(deltaMinutes: number) {
  // Energy regeneration
  const energyRegen = this.gameState.resources.energy.regenerationRate || 0.5
  this.gameState.resources.energy.current = Math.min(
    this.gameState.resources.energy.max,
    this.gameState.resources.energy.current + energyRegen * deltaMinutes
  )
  
  // Auto-pump water generation
  if (this.gameState.resources.water.autoGenRate > 0) {
    const waterGen = (this.gameState.resources.water.autoGenRate / 60) * deltaMinutes
    this.gameState.resources.water.current = Math.min(
      this.gameState.resources.water.max,
      this.gameState.resources.water.current + waterGen
    )
  }
}

// Update phase progression
private updatePhaseProgression() {
  const plots = this.gameState.progression.farmPlots
  const heroLevel = this.gameState.progression.heroLevel
  
  let newPhase = 'Tutorial'
  if (plots >= 90 || heroLevel >= 12) {
    newPhase = 'End'
  } else if (plots >= 65 || heroLevel >= 9) {
    newPhase = 'Late'
  } else if (plots >= 40 || heroLevel >= 6) {
    newPhase = 'Mid'
  } else if (plots >= 20 || heroLevel >= 3) {
    newPhase = 'Early'
  }
  
  if (newPhase !== this.gameState.progression.currentPhase) {
    this.gameState.progression.currentPhase = newPhase
    this.addEvent('milestone', `Entered ${newPhase} Game phase!`)
  }
}

// Check for bottlenecks
private checkForBottlenecks() {
  const timeSinceLastProgress = this.tickCount - this.lastProgressTick
  
  // Check if stuck (no progress in 3 days)
  if (timeSinceLastProgress > 3 * 24 * 60) {
    this.isBottlenecked = true
    
    // Analyze bottleneck cause
    if (this.gameState.resources.energy.current < 50) {
      this.bottleneckReason = 'Low energy - need more crops or energy storage'
    } else if (this.gameState.resources.gold < 100) {
      this.bottleneckReason = 'Low gold - need adventures or selling materials'
    } else if (this.gameState.progression.availablePlots < 2) {
      this.bottleneckReason = 'No available plots - need farm cleanup'
    } else if (this.gameState.resources.seeds.size === 0) {
      this.bottleneckReason = 'No seeds - need tower seed catching'
    } else {
      this.bottleneckReason = 'Unknown bottleneck - check prerequisites'
    }
  }
}
```

#### 2. Create Integration Tests
```typescript
// New file: tests/simulation.test.ts
import { SimulationEngine } from '../src/utils/SimulationEngine'
import { CSVDataParser } from '../src/utils/CSVDataParser'
import { PrerequisiteSystem } from '../src/utils/systems/PrerequisiteSystem'
import { CropSystem } from '../src/utils/systems/CropSystem'
import { HelperSystem } from '../src/utils/systems/HelperSystem'
import { CombatSystem } from '../src/utils/systems/CombatSystem'
import { CraftingSystem } from '../src/utils/systems/CraftingSystem'
import { MiningSystem } from '../src/utils/systems/MiningSystem'

describe('Phase 8A - CSV Parsing', () => {
  test('Parse materials correctly', () => {
    const materials = CSVDataParser.parseMaterials('Crystal x2;Silver x5')
    expect(materials.get('crystal')).toBe(2)
    expect(materials.get('silver')).toBe(5)
  })
  
  test('Parse gold cost', () => {
    const gold = CSVDataParser.parseGoldCost('Gold x100;Wood x5')
    expect(gold).toBe(100)
  })
  
  test('Parse duration', () => {
    const duration = CSVDataParser.parseDuration('30 min')
    expect(duration).toBe(30)
    
    const hours = CSVDataParser.parseDuration('2 hours')
    expect(hours).toBe(120)
  })
})

describe('Phase 8B - Farm Cleanup', () => {
  let engine: SimulationEngine
  
  beforeEach(() => {
    engine = new SimulationEngine(testConfig)
  })
  
  test('Cleanup increases plot count', () => {
    const initialPlots = engine.gameState.progression.farmPlots
    
    const action = {
      type: 'cleanup',
      cleanupId: 'clear_weeds_1',
      energyCost: 15
    }
    
    engine.executeAction(action)
    
    expect(engine.gameState.progression.farmPlots).toBe(initialPlots + 2)
    expect(engine.gameState.progression.completedCleanups.has('clear_weeds_1')).toBe(true)
  })
  
  test('Prerequisites block cleanup', () => {
    const action = {
      type: 'cleanup',
      cleanupId: 'clear_boulders_1', // Requires hammer+
      energyCost: 100
    }
    
    const result = engine.executeAction(action)
    expect(result).toBe(false)
  })
})

describe('Phase 8C - Crop System', () => {
  test('Crops grow with water', () => {
    const gameState = createTestGameState()
    gameState.processes.crops[0] = {
      cropType: 'carrot',
      waterLevel: 1.0,
      growthProgress: 0,
      growthStage: 0,
      isReady: false,
      isDead: false
    }
    
    // Process 6 minutes of growth (carrot takes 6 minutes)
    CropSystem.processCropGrowth(gameState, 6, testDataStore)
    
    expect(gameState.processes.crops[0].growthProgress).toBeCloseTo(1.0)
    expect(gameState.processes.crops[0].isReady).toBe(true)
  })
  
  test('Crops die without water', () => {
    const gameState = createTestGameState()
    gameState.processes.crops[0] = {
      cropType: 'carrot',
      waterLevel: 0,
      growthProgress: 0.5,
      droughtTime: 25
    }
    
    // Process 10 more minutes without water
    CropSystem.processCropGrowth(gameState, 10, testDataStore)
    
    expect(gameState.processes.crops[0].isDead).toBe(true)
  })
})

describe('Phase 8D - Helper System', () => {
  test('Waterer helper waters crops', () => {
    const gameState = createTestGameState()
    gameState.helpers.gnomes = [{
      id: 'gnome_1',
      name: 'Gnome',
      role: 'waterer',
      level: 1,
      isHoused: true
    }]
    
    gameState.processes.crops[0] = { cropType: 'carrot', waterLevel: 0.2 }
    gameState.resources.water.current = 10
    
    HelperSystem.processHelpers(gameState, 1, testDataStore)
    
    expect(gameState.processes.crops[0].waterLevel).toBeGreaterThan(0.2)
  })
  
  test('Harvester collects ready crops', () => {
    const gameState = createTestGameState()
    gameState.helpers.gnomes = [{
      id: 'gnome_2',
      role: 'harvester',
      level: 1,
      isHoused: true
    }]
    
    gameState.processes.crops[0] = { 
      cropType: 'carrot', 
      isReady: true 
    }
    
    const initialEnergy = gameState.resources.energy.current
    
    HelperSystem.processHelpers(gameState, 1, testDataStore)
    
    expect(gameState.resources.energy.current).toBeGreaterThan(initialEnergy)
    expect(gameState.processes.crops[0].cropType).toBeNull()
  })
})

describe('Phase 8E - Combat System', () => {
  test('Weapon advantages work correctly', () => {
    const damage = CombatSystem.calculateDamage(
      { type: 'spear', damage: 10 },
      { type: 'armored_insects' }
    )
    expect(damage).toBe(15) // 1.5x advantage
    
    const resistedDamage = CombatSystem.calculateDamage(
      { type: 'spear', damage: 10 },
      { type: 'predatory_beasts' }
    )
    expect(resistedDamage).toBe(5) // 0.5x resistance
  })
  
  test('Adventure simulation with success', () => {
    const weapons = new Map([
      ['sword', { damage: 10, attackSpeed: 1.0, type: 'sword' }]
    ])
    
    const result = CombatSystem.simulateAdventure(
      { id: 'meadow_path_short', boss_type: 'giant_slime', waves: 3 },
      weapons,
      { defense: 10 },
      5, // Hero level
      [], // No helpers
      {}
    )
    
    expect(result.success).toBe(true)
    expect(result.hp).toBeGreaterThan(0)
    expect(result.gold).toBeGreaterThan(0)
  })
})

describe('Phase 8F - Crafting & Mining', () => {
  test('Forge heat affects success rate', () => {
    const rate1 = CraftingSystem.calculateSuccessRate(
      { successRate: 0.9 },
      { processes: { forgeHeat: 3000 } } // Optimal
    )
    expect(rate1).toBeCloseTo(0.9)
    
    const rate2 = CraftingSystem.calculateSuccessRate(
      { successRate: 0.9 },
      { processes: { forgeHeat: 1000 } } // Too cold
    )
    expect(rate2).toBeCloseTo(0.45)
  })
  
  test('Mining depth increases energy drain', () => {
    const gameState = createTestGameState()
    gameState.processes.mining = {
      active: true,
      depth: 0
    }
    
    // Mine at depth 0 (1 energy/min)
    const energy1 = gameState.resources.energy.current
    MiningSystem.processMining(gameState, 1)
    expect(gameState.resources.energy.current).toBeCloseTo(energy1 - 1)
    
    // Mine at depth 500 (2 energy/min)
    gameState.processes.mining.depth = 500
    const energy2 = gameState.resources.energy.current
    MiningSystem.processMining(gameState, 1)
    expect(gameState.resources.energy.current).toBeCloseTo(energy2 - 2)
  })
  
  test('Material drops match depth tier', () => {
    const gameState = createTestGameState()
    
    // At depth 500-1000, should drop copper/stone
    MiningSystem.dropMaterials(gameState, 750)
    
    const hasCopper = gameState.resources.materials.has('raw_copper')
    const hasStone = gameState.resources.materials.has('raw_stone')
    const hasIron = gameState.resources.materials.has('raw_iron')
    
    expect(hasCopper || hasStone).toBe(true)
    expect(hasIron).toBe(false) // Iron starts at 1000+
  })
})

describe('Phase 8G - Full Integration', () => {
  test('Complete 7-day simulation', async () => {
    const engine = new SimulationEngine(testConfig)
    
    let ticks = 0
    const maxTicks = 7 * 24 * 60 // 7 days in minutes
    
    while (ticks < maxTicks && !engine.isComplete) {
      const result = engine.tick()
      ticks++
      
      // Verify state consistency
      expect(result.gameState.resources.energy.current).toBeGreaterThanOrEqual(0)
      expect(result.gameState.resources.gold).toBeGreaterThanOrEqual(0)
    }
    
    // Should have made progress
    expect(engine.gameState.progression.farmPlots).toBeGreaterThan(3)
    expect(engine.gameState.progression.heroLevel).toBeGreaterThanOrEqual(1)
  })
  
  test('Different personas show different patterns', async () => {
    const speedrunnerEngine = new SimulationEngine({
      ...testConfig,
      persona: { id: 'speedrunner', checkInsPerDay: 10 }
    })
    
    const casualEngine = new SimulationEngine({
      ...testConfig,
      persona: { id: 'casual', checkInsPerDay: 2 }
    })
    
    // Run both for 1 day
    const ticks = 24 * 60
    let speedrunnerActions = 0
    let casualActions = 0
    
    for (let i = 0; i < ticks; i++) {
      const speedResult = speedrunnerEngine.tick()
      const casualResult = casualEngine.tick()
      
      speedrunnerActions += speedResult.executedActions.length
      casualActions += casualResult.executedActions.length
    }
    
    // Speedrunner should take more actions
    expect(speedrunnerActions).toBeGreaterThan(casualActions * 2)
  })
  
  test('Bottleneck detection works', () => {
    const engine = new SimulationEngine(testConfig)
    
    // Force a bottleneck by removing all resources
    engine.gameState.resources.energy.current = 0
    engine.gameState.resources.gold = 0
    engine.gameState.resources.seeds.clear()
    
    // Run for 3 days
    for (let i = 0; i < 3 * 24 * 60; i++) {
      engine.tick()
    }
    
    expect(engine.isBottlenecked).toBe(true)
    expect(engine.bottleneckReason).toContain('energy')
  })
})
```

### Determinism and Seeding for Reproducible Tests

To ensure tests are reproducible and stable, implement a seeding system for all randomness:

```typescript
// At the start of SimulationEngine.ts
export class SimulationEngine {
  private random: RandomNumberGenerator
  
  constructor(parameters: any, seed?: number) {
    // Use a seeded random number generator for determinism
    this.random = new RandomNumberGenerator(seed || Date.now())
    // ...
  }
  
  // Replace all Math.random() calls with this.random.next()
  // Example: Math.random() < 0.15 becomes this.random.next() < 0.15
}

// Simple seeded RNG implementation
class RandomNumberGenerator {
  private seed: number
  
  constructor(seed: number) {
    this.seed = seed
  }
  
  next(): number {
    // Linear congruential generator
    this.seed = (this.seed * 1664525 + 1013904223) % 2147483647
    return this.seed / 2147483647
  }
}
```

**Where randomness is used (needs seeding):**
- Combat damage rolls (armor effects like Reflection, Evasion)
- Material drop selection in mining
- Loot generation after adventures
- Helper bonus seed catching
- Master Craft double output chance
- Boss quirk activations

**Test setup with fixed seed:**
```typescript
const testSeed = 12345 // Fixed seed for tests
const engine = new SimulationEngine(testConfig, testSeed)
// Results will be deterministic
```

### Testing Phase 8G
```bash
# Run all tests with deterministic seeding
npm test

# Run specific test suites
npm test -- --grep "CSV Parsing"
npm test -- --grep "Farm Cleanup"
npm test -- --grep "Full Integration"

# Watch mode for development
npm test -- --watch

# Coverage report
npm test -- --coverage
```

---

## Success Metrics

### Quantitative Goals
- ✅ CSV parsing errors: 0
- ✅ Resource tracking: 100% accurate
- ✅ Farm cleanup: Plots increase correctly
- ✅ Crop growth: Time-based with water mechanics
- ✅ Helper automation: Reduces manual work by 50%+
- ✅ Combat simulation: Matches expected HP loss
- ✅ Mining/Crafting: Resources consumed/generated correctly
- ✅ Full simulation: Runs 7+ days without errors

### Qualitative Goals
- Simulation produces believable gameplay patterns
- Different personas show distinct behaviors
- Bottlenecks are detected and reported
- Progress through game phases is realistic
- Resource economy remains balanced

---

## Implementation Notes

### File Organization
- Core parsing in `/src/utils/CSVDataParser.ts`
- Systems in `/src/utils/systems/` folder
- Tests in `/tests/` folder
- Types updated in `/src/types/game-state.ts`

### Dependencies
- No new npm packages required
- Uses existing Vue 3 + TypeScript setup
- Leverages current Pinia stores
- Compatible with Web Worker architecture

### Performance Considerations
- Systems process incrementally (per minute)
- Efficient lookups using Maps
- Minimal object creation in hot paths
- Lazy evaluation where possible

### Error Handling
- Graceful fallbacks for missing data
- Console warnings for non-critical issues
- Event logging for debugging
- Try-catch blocks around system processing

---

## Post-Implementation Checklist

- [ ] All tests passing
- [ ] No console errors during simulation
- [ ] Live Monitor widgets show real data
- [ ] Action Log shows meaningful events
- [ ] Resources update correctly
- [ ] Phase progression works
- [ ] Personas behave differently
- [ ] 7-day simulation completes
- [ ] Bottlenecks detected
- [ ] Code reviewed and documented

## Details
## Phase 8G: Integration & Testing - Full System Validation
### Files to Modify
- `/src/utils/SimulationEngine.ts` - Integrate all systems
- `/tests/simulation.test.ts` - Comprehensive tests

### Implementation Tasks

#### 1. Update Main Tick Method
```typescript
// In SimulationEngine.ts - Complete tick integration
tick(): TickResult {
  const deltaMinutes = 1 // Each tick = 1 minute game time
  
  // 1. Update time
  this.updateGameTime(deltaMinutes)
  
  // 2. Process all systems
  try {
    // Crop growth and water
    CropSystem.processCropGrowth(this.gameState, deltaMinutes, this.gameDataStore)
    
    // Crafting and forge
    CraftingSystem.processCrafting(this.gameState, deltaMinutes, this.gameDataStore)
    
    // Mining
    MiningSystem.processMining(this.gameState, deltaMinutes)
    
    // Helpers
    HelperSystem.processHelpers(this.gameState, deltaMinutes, this.gameDataStore)
    
    // Adventure processing
    if (this.gameState.processes.adventure?.active) {
      this.processAdventure(deltaMinutes)
    }
    
    // Resource regeneration
    this.processResourceRegeneration(deltaMinutes)
    
  } catch (error) {
    console.error('Error processing systems:', error)
    this.addEvent('error', `System error: ${error.message}`)
  }
  
  // 3. AI Decision Making
  const actions = []
  if (this.shouldMakeDecision()) {
    const possibleActions = this.getAllPossibleActions()
    const scoredActions = this.scoreActions(possibleActions)
    const bestAction = this.selectBestAction(scoredActions)
    
    if (bestAction && this.executeAction(bestAction)) {
      actions.push(bestAction)
    }
  }
  
  // 4. Update progression
  this.updatePhaseProgression()
  this.checkForBottlenecks()
  
  // 5. Check victory/defeat conditions
  const isComplete = this.checkVictoryCondition()
  const isFailed = this.checkDefeatCondition()
  
  return {
    gameState: this.gameState,
    executedActions: actions,
    events: this.getRecentEvents(),
    deltaTime: deltaMinutes,
    tickCount: ++this.tickCount,
    isComplete,
    isFailed,
    isStuck: this.isBottlenecked
  }
}

// Process resource regeneration
private processResourceRegeneration(deltaMinutes: number) {
  // Energy regeneration
  const energyRegen = this.gameState.resources.energy.regenerationRate || 0.5
  this.gameState.resources.energy.current = Math.min(
    this.gameState.resources.energy.max,
    this.gameState.resources.energy.current + energyRegen * deltaMinutes
  )
  
  // Auto-pump water generation
  if (this.gameState.resources.water.autoGenRate > 0) {
    const waterGen = (this.gameState.resources.water.autoGenRate / 60) * deltaMinutes
    this.gameState.resources.water.current = Math.min(
      this.gameState.resources.water.max,
      this.gameState.resources.water.current + waterGen
    )
  }
}

// Update phase progression
private updatePhaseProgression() {
  const plots = this.gameState.progression.farmPlots
  const heroLevel = this.gameState.progression.heroLevel
  
  let newPhase = 'Tutorial'
  if (plots >= 90 || heroLevel >= 12) {
    newPhase = 'End'
  } else if (plots >= 65 || heroLevel >= 9) {
    newPhase = 'Late'
  } else if (plots >= 40 || heroLevel >= 6) {
    newPhase = 'Mid'
  } else if (plots >= 20 || heroLevel >= 3) {
    newPhase = 'Early'
  }
  
  if (newPhase !== this.gameState.progression.currentPhase) {
    this.gameState.progression.currentPhase = newPhase
    this.addEvent('milestone', `Entered ${newPhase} Game phase!`)
  }
}

// Check for bottlenecks
private checkForBottlenecks() {
  const timeSinceLastProgress = this.tickCount - this.lastProgressTick
  
  // Check if stuck (no progress in 3 days)
  if (timeSinceLastProgress > 3 * 24 * 60) {
    this.isBottlenecked = true
    
    // Analyze bottleneck cause
    if (this.gameState.resources.energy.current < 50) {
      this.bottleneckReason = 'Low energy - need more crops or energy storage'
    } else if (this.gameState.resources.gold < 100) {
      this.bottleneckReason = 'Low gold - need adventures or selling materials'
    } else if (this.gameState.progression.availablePlots < 2) {
      this.bottleneckReason = 'No available plots - need farm cleanup'
    } else if (this.gameState.resources.seeds.size === 0) {
      this.bottleneckReason = 'No seeds - need tower seed catching'
    } else {
      this.bottleneckReason = 'Unknown bottleneck - check prerequisites'
    }
  }
}
```

#### 2. Create Integration Tests
```typescript
// New file: tests/simulation.test.ts
import { SimulationEngine } from '../src/utils/SimulationEngine'
import { CSVDataParser } from '../src/utils/CSVDataParser'
import { PrerequisiteSystem } from '../src/utils/systems/PrerequisiteSystem'
import { CropSystem } from '../src/utils/systems/CropSystem'
import { HelperSystem } from '../src/utils/systems/HelperSystem'
import { CombatSystem } from '../src/utils/systems/CombatSystem'
import { CraftingSystem } from '../src/utils/systems/CraftingSystem'
import { MiningSystem } from '../src/utils/systems/MiningSystem'

describe('Phase 8A - CSV Parsing', () => {
  test('Parse materials correctly', () => {
    const materials = CSVDataParser.parseMaterials('Crystal x2;Silver x5')
    expect(materials.get('crystal')).toBe(2)
    expect(materials.get('silver')).toBe(5)
  })
  
  test('Parse gold cost', () => {
    const gold = CSVDataParser.parseGoldCost('Gold x100;Wood x5')
    expect(gold).toBe(100)
  })
  
  test('Parse duration', () => {
    const duration = CSVDataParser.parseDuration('30 min')
    expect(duration).toBe(30)
    
    const hours = CSVDataParser.parseDuration('2 hours')
    expect(hours).toBe(120)
  })
})

describe('Phase 8B - Farm Cleanup', () => {
  let engine: SimulationEngine
  
  beforeEach(() => {
    engine = new SimulationEngine(testConfig)
  })
  
  test('Cleanup increases plot count', () => {
    const initialPlots = engine.gameState.progression.farmPlots
    
    const action = {
      type: 'cleanup',
      cleanupId: 'clear_weeds_1',
      energyCost: 15
    }
    
    engine.executeAction(action)
    
    expect(engine.gameState.progression.farmPlots).toBe(initialPlots + 2)
    expect(engine.gameState.progression.completedCleanups.has('clear_weeds_1')).toBe(true)
  })
  
  test('Prerequisites block cleanup', () => {
    const action = {
      type: 'cleanup',
      cleanupId: 'clear_boulders_1', // Requires hammer+
      energyCost: 100
    }
    
    const result = engine.executeAction(action)
    expect(result).toBe(false)
  })
})

describe('Phase 8C - Crop System', () => {
  test('Crops grow with water', () => {
    const gameState = createTestGameState()
    gameState.processes.crops[0] = {
      cropType: 'carrot',
      waterLevel: 1.0,
      growthProgress: 0,
      growthStage: 0,
      isReady: false,
      isDead: false
    }
    
    // Process 6 minutes of growth (carrot takes 6 minutes)
    CropSystem.processCropGrowth(gameState, 6, testDataStore)
    
    expect(gameState.processes.crops[0].growthProgress).toBeCloseTo(1.0)
    expect(gameState.processes.crops[0].isReady).toBe(true)
  })
  
  test('Crops die without water', () => {
    const gameState = createTestGameState()
    gameState.processes.crops[0] = {
      cropType: 'carrot',
      waterLevel: 0,
      growthProgress: 0.5,
      droughtTime: 25
    }
    
    // Process 10 more minutes without water
    CropSystem.processCropGrowth(gameState, 10, testDataStore)
    
    expect(gameState.processes.crops[0].isDead).toBe(true)
  })
})

describe('Phase 8D - Helper System', () => {
  test('Waterer helper waters crops', () => {
    const gameState = createTestGameState()
    gameState.helpers.gnomes = [{
      id: 'gnome_1',
      name: 'Gnome',
      role: 'waterer',
      level: 1,
      isHoused: true
    }]
    
    gameState.processes.crops[0] = { cropType: 'carrot', waterLevel: 0.2 }
    gameState.resources.water.current = 10
    
    HelperSystem.processHelpers(gameState, 1, testDataStore)
    
    expect(gameState.processes.crops[0].waterLevel).toBeGreaterThan(0.2)
  })
  
  test('Harvester collects ready crops', () => {
    const gameState = createTestGameState()
    gameState.helpers.gnomes = [{
      id: 'gnome_2',
      role: 'harvester',
      level: 1,
      isHoused: true
    }]
    
    gameState.processes.crops[0] = { 
      cropType: 'carrot', 
      isReady: true 
    }
    
    const initialEnergy = gameState.resources.energy.current
    
    HelperSystem.processHelpers(gameState, 1, testDataStore)
    
    expect(gameState.resources.energy.current).toBeGreaterThan(initialEnergy)
    expect(gameState.processes.crops[0].cropType).toBeNull()
  })
})

describe('Phase 8E - Combat System', () => {
  test('Weapon advantages work correctly', () => {
    const damage = CombatSystem.calculateDamage(
      { type: 'spear', damage: 10 },
      { type: 'armored_insects' }
    )
    expect(damage).toBe(15) // 1.5x advantage
    
    const resistedDamage = CombatSystem.calculateDamage(
      { type: 'spear', damage: 10 },
      { type: 'predatory_beasts' }
    )
    expect(resistedDamage).toBe(5) // 0.5x resistance
  })
  
  test('Adventure simulation with success', () => {
    const weapons = new Map([
      ['sword', { damage: 10, attackSpeed: 1.0, type: 'sword' }]
    ])
    
    const result = CombatSystem.simulateAdventure(
      { id: 'meadow_path_short', boss_type: 'giant_slime', waves: 3 },
      weapons,
      { defense: 10 },
      5, // Hero level
      [], // No helpers
      {}
    )
    
    expect(result.success).toBe(true)
    expect(result.hp).toBeGreaterThan(0)
    expect(result.gold).toBeGreaterThan(0)
  })
})

describe('Phase 8F - Crafting & Mining', () => {
  test('Forge heat affects success rate', () => {
    const rate1 = CraftingSystem.calculateSuccessRate(
      { successRate: 0.9 },
      { processes: { forgeHeat: 3000 } } // Optimal
    )
    expect(rate1).toBeCloseTo(0.9)
    
    const rate2 = CraftingSystem.calculateSuccessRate(
      { successRate: 0.9 },
      { processes: { forgeHeat: 1000 } } // Too cold
    )
    expect(rate2).toBeCloseTo(0.45)
  })
  
  test('Mining depth increases energy drain', () => {
    const gameState = createTestGameState()
    gameState.processes.mining = {
      active: true,
      depth: 0
    }
    
    // Mine at depth 0 (1 energy/min)
    const energy1 = gameState.resources.energy.current
    MiningSystem.processMining(gameState, 1)
    expect(gameState.resources.energy.current).toBeCloseTo(energy1 - 1)
    
    // Mine at depth 500 (2 energy/min)
    gameState.processes.mining.depth = 500
    const energy2 = gameState.resources.energy.current
    MiningSystem.processMining(gameState, 1)
    expect(gameState.resources.energy.current).toBeCloseTo(energy2 - 2)
  })
  
  test('Material drops match depth tier', () => {
    const gameState = createTestGameState()
    
    // At depth 500-1000, should drop copper/stone
    MiningSystem.dropMaterials(gameState, 750)
    
    const hasCopper = gameState.resources.materials.has('raw_copper')
    const hasStone = gameState.resources.materials.has('raw_stone')
    const hasIron = gameState.resources.materials.has('raw_iron')
    
    expect(hasCopper || hasStone).toBe(true)
    expect(hasIron).toBe(false) // Iron starts at 1000+
  })
})

describe('Phase 8G - Full Integration', () => {
  test('Complete 7-day simulation', async () => {
    const engine = new SimulationEngine(testConfig)
    
    let ticks = 0
    const maxTicks = 7 * 24 * 60 // 7 days in minutes
    
    while (ticks < maxTicks && !engine.isComplete) {
      const result = engine.tick()
      ticks++
      
      // Verify state consistency
      expect(result.gameState.resources.energy.current).toBeGreaterThanOrEqual(0)
      expect(result.gameState.resources.gold).toBeGreaterThanOrEqual(0)
    }
    
    // Should have made progress
    expect(engine.gameState.progression.farmPlots).toBeGreaterThan(3)
    expect(engine.gameState.progression.heroLevel).toBeGreaterThanOrEqual(1)
  })
  
  test('Different personas show different patterns', async () => {
    const speedrunnerEngine = new SimulationEngine({
      ...testConfig,
      persona: { id: 'speedrunner', checkInsPerDay: 10 }
    })
    
    const casualEngine = new SimulationEngine({
      ...testConfig,
      persona: { id: 'casual', checkInsPerDay: 2 }
    })
    
    // Run both for 1 day
    const ticks = 24 * 60
    let speedrunnerActions = 0
    let casualActions = 0
    
    for (let i = 0; i < ticks; i++) {
      const speedResult = speedrunnerEngine.tick()
      const casualResult = casualEngine.tick()
      
      speedrunnerActions += speedResult.executedActions.length
      casualActions += casualResult.executedActions.length
    }
    
    // Speedrunner should take more actions
    expect(speedrunnerActions).toBeGreaterThan(casualActions * 2)
  })
  
  test('Bottleneck detection works', () => {
    const engine = new SimulationEngine(testConfig)
    
    // Force a bottleneck by removing all resources
    engine.gameState.resources.energy.current = 0
    engine.gameState.resources.gold = 0
    engine.gameState.resources.seeds.clear()
    
    // Run for 3 days
    for (let i = 0; i < 3 * 24 * 60; i++) {
      engine.tick()
    }
    
    expect(engine.isBottlenecked).toBe(true)
    expect(engine.bottleneckReason).toContain('energy')
  })
})
```

### Testing Phase 8G
```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --grep "CSV Parsing"
npm test -- --grep "Farm Cleanup"
npm test -- --grep "Full Integration"

# Watch mode for development
npm test -- --watch

# Coverage report
npm test -- --coverage
```

---

## Success Metrics

### Quantitative Goals
- ✅ CSV parsing errors: 0
- ✅ Resource tracking: 100% accurate
- ✅ Farm cleanup: Plots increase correctly
- ✅ Crop growth: Time-based with water mechanics
- ✅ Helper automation: Reduces manual work by 50%+
- ✅ Combat simulation: Matches expected HP loss
- ✅ Mining/Crafting: Resources consumed/generated correctly
- ✅ Full simulation: Runs 7+ days without errors

### Qualitative Goals
- Simulation produces believable gameplay patterns
- Different personas show distinct behaviors
- Bottlenecks are detected and reported
- Progress through game phases is realistic
- Resource economy remains balanced

---

## Implementation Notes

### File Organization
- Core parsing in `/src/utils/CSVDataParser.ts`
- Systems in `/src/utils/systems/` folder
- Tests in `/tests/` folder
- Types updated in `/src/types/game-state.ts`

### Dependencies
- No new npm packages required
- Uses existing Vue 3 + TypeScript setup
- Leverages current Pinia stores
- Compatible with Web Worker architecture

### Performance Considerations
- Systems process incrementally (per minute)
- Efficient lookups using Maps
- Minimal object creation in hot paths
- Lazy evaluation where possible

### Error Handling
- Graceful fallbacks for missing data
- Console warnings for non-critical issues
- Event logging for debugging
- Try-catch blocks around system processing

---

## Post-Implementation Checklist

- [ ] All tests passing
- [ ] No console errors during simulation
- [ ] Live Monitor widgets show real data
- [ ] Action Log shows meaningful events
- [ ] Resources update correctly
- [ ] Phase progression works
- [ ] Personas behave differently
- [ ] 7-day simulation completes
- [ ] Bottlenecks detected
- [ ] Code reviewed and documented