# Time Hero Simulation - Required Refactors

## Priority 1: Critical Foundation Fixes (Do These First)

### 1. Fix CSV Data Parsing & Integration
**File**: `src/utils/SimulationEngine.ts`
```typescript
// CURRENT PROBLEM: Parsing methods are incomplete and error-prone
// SOLUTION: Create robust CSV data parser class

class CSVDataParser {
  // Parse material requirements properly
  static parseMaterials(materialString: string): Map<string, number> {
    const materials = new Map<string, number>()
    if (!materialString) return materials
    
    // Handle both "x" and "×" separators
    const parts = materialString.split(';')
    for (const part of parts) {
      const match = part.trim().match(/(.+?)\s*[x×]\s*(\d+)/i)
      if (match) {
        materials.set(match[1].trim().toLowerCase(), parseInt(match[2]))
      }
    }
    return materials
  }
  
  // Parse all numeric values from CSV properly
  static parseNumericValue(value: string, defaultValue: number = 0): number {
    if (!value) return defaultValue
    const num = parseInt(value.replace(/[^\d]/g, ''))
    return isNaN(num) ? defaultValue : num
  }
}
```

### 2. Implement Action Execution System
**File**: `src/utils/SimulationEngine.ts` - `executeAction()` method
```typescript
private executeAction(action: GameAction): boolean {
  switch (action.type) {
    case 'plant':
      return this.executePlantAction(action)
    case 'harvest':
      return this.executeHarvestAction(action)
    case 'water':
      return this.executeWaterAction(action)
    case 'cleanup':
      return this.executeCleanupAction(action) // NEW - Critical for progression
    case 'purchase':
      return this.executePurchaseAction(action)
    case 'craft':
      return this.executeCraftAction(action)
    case 'mine':
      return this.executeMineAction(action)
    case 'adventure':
      return this.executeAdventureAction(action)
    case 'catch_seeds':
      return this.executeCatchSeedsAction(action)
    case 'assign_helper':
      return this.executeAssignHelperAction(action)
    case 'train_helper':
      return this.executeTrainHelperAction(action)
    default:
      console.warn(`Unknown action type: ${action.type}`)
      return false
  }
}

// Add proper cleanup action execution
private executeCleanupAction(action: GameAction): boolean {
  const cleanup = this.gameDataStore.getItemById(action.cleanupId)
  if (!cleanup) return false
  
  // Check prerequisites
  if (!this.checkPrerequisites(cleanup)) return false
  
  // Consume resources
  this.gameState.resources.energy.current -= action.energyCost
  
  // Add to completed cleanups
  this.gameState.progression.completedCleanups.add(action.cleanupId)
  
  // CRITICAL: Actually increase plot count!
  const plotsAdded = parseInt(cleanup.plots_added) || 0
  this.gameState.progression.farmPlots += plotsAdded
  this.gameState.progression.availablePlots += plotsAdded
  
  // Add material rewards if any
  if (cleanup.materials_gain) {
    const materials = CSVDataParser.parseMaterials(cleanup.materials_gain)
    for (const [material, amount] of materials) {
      this.addMaterial(material, amount)
    }
  }
  
  return true
}
```

## Priority 2: Core Game Systems

### 3. Implement Crop Growth System
**File**: `src/utils/systems/CropSystem.ts` (NEW FILE)
```typescript
export class CropSystem {
  static processCropGrowth(gameState: GameState, deltaMinutes: number) {
    for (const crop of gameState.processes.crops) {
      if (!crop.cropType || crop.isReady || crop.isDead) continue
      
      // Get crop data from CSV
      const cropData = gameDataStore.getItemById(crop.cropType)
      if (!cropData) continue
      
      const growthTime = parseInt(cropData.time) || 10
      const stages = parseInt(cropData.stages) || 3
      
      // Calculate growth based on water
      const growthRate = crop.waterLevel > 0.3 ? 1.0 : 0.5
      crop.growthProgress += (deltaMinutes / growthTime) * growthRate
      
      // Update stage
      crop.growthStage = Math.min(stages, Math.floor(crop.growthProgress * stages))
      
      // Check if ready
      if (crop.growthProgress >= 1.0) {
        crop.isReady = true
      }
      
      // Water consumption
      crop.waterLevel = Math.max(0, crop.waterLevel - 0.01 * deltaMinutes)
      
      // Death check
      if (crop.waterLevel <= 0 && Math.random() < 0.01) {
        crop.isDead = true
      }
    }
  }
}
```

### 4. Implement Combat Simulation
**File**: `src/utils/systems/CombatSystem.ts` (NEW FILE)
```typescript
export class CombatSystem {
  static simulateAdventure(
    route: any,
    weapons: Map<string, any>,
    armor: any,
    heroLevel: number,
    parameters: any
  ): AdventureResult {
    const heroHP = 100 + (heroLevel * 20)
    let currentHP = heroHP
    let totalGold = 0
    let totalXP = 0
    
    // Process waves based on route configuration
    const waveCount = route.waves || 5
    for (let wave = 0; wave < waveCount; wave++) {
      const enemies = this.generateWave(route.enemy_rolls)
      
      for (const enemy of enemies) {
        // Find best weapon matchup
        const weapon = this.selectBestWeapon(weapons, enemy.type)
        const damage = this.calculateDamage(weapon, enemy)
        
        // Time to kill enemy
        const ttk = enemy.hp / damage
        
        // Damage taken
        const defenseMitigation = armor ? armor.defense / 100 : 0
        const incomingDamage = enemy.damage * ttk * (1 - defenseMitigation)
        currentHP -= incomingDamage
        
        if (currentHP <= 0) {
          return { success: false, gold: 0, xp: 0, hp: 0 }
        }
      }
      
      // Apply armor effects between waves
      if (armor?.effect === 'Regeneration') {
        currentHP = Math.min(heroHP, currentHP + 3)
      }
      
      totalGold += 10 * wave
      totalXP += 5 * wave
    }
    
    // Boss fight
    if (route.boss) {
      const bossDamage = this.simulateBossFight(route.boss, weapons, armor, currentHP)
      currentHP -= bossDamage
      
      if (currentHP > 0) {
        totalGold += parseInt(route.gold_gain) || 100
        totalXP += parseInt(route.xp_gain) || 50
      }
    }
    
    return {
      success: currentHP > 0,
      gold: totalGold,
      xp: totalXP,
      hp: currentHP,
      loot: currentHP > 0 ? this.generateLoot(route) : []
    }
  }
  
  static calculateDamage(weapon: any, enemy: any): number {
    const baseDamage = weapon.damage || 10
    
    // Pentagon advantage system
    const advantages = {
      'spear': 'armored_insects',
      'sword': 'beasts',
      'bow': 'flying',
      'crossbow': 'crawlers',
      'wand': 'plants'
    }
    
    let multiplier = 1.0
    if (advantages[weapon.type] === enemy.type) {
      multiplier = 1.5
    } else if (this.isResisted(weapon.type, enemy.type)) {
      multiplier = 0.5
    }
    
    return baseDamage * multiplier * weapon.attackSpeed
  }
}
```

### 5. Implement Helper System
**File**: `src/utils/systems/HelperSystem.ts` (NEW FILE)
```typescript
export class HelperSystem {
  static processHelpers(gameState: GameState, deltaMinutes: number) {
    for (const helper of gameState.helpers.gnomes) {
      if (!helper.isHoused || !helper.role) continue
      
      const efficiency = this.calculateEfficiency(helper)
      
      switch (helper.role) {
        case 'waterer':
          this.processWatererHelper(gameState, helper, efficiency, deltaMinutes)
          break
        case 'planter':
          this.processPlanterHelper(gameState, helper, efficiency, deltaMinutes)
          break
        case 'harvester':
          this.processHarvesterHelper(gameState, helper, efficiency, deltaMinutes)
          break
        case 'miner':
          // Reduce mining energy drain
          if (gameState.processes.mining) {
            gameState.processes.mining.energyDrainRate *= (1 - efficiency * 0.3)
          }
          break
      }
      
      // Handle dual-role if Master Academy built
      if (helper.secondaryRole && gameState.helpers.specialBuildings.has('master_academy')) {
        // Process secondary role at 75% efficiency
        // ... similar switch statement with efficiency * 0.75
      }
    }
  }
  
  static processWatererHelper(gameState: GameState, helper: any, efficiency: number, deltaMinutes: number) {
    const plotsPerMinute = 5 + helper.level // Base 5 + 1 per level
    const plotsToWater = Math.floor(plotsPerMinute * efficiency * deltaMinutes)
    
    // Find dry plots and water them
    const dryPlots = gameState.processes.crops
      .filter(c => c.cropType && c.waterLevel < 0.5)
      .slice(0, plotsToWater)
    
    for (const plot of dryPlots) {
      if (gameState.resources.water.current > 0) {
        plot.waterLevel = 1.0
        gameState.resources.water.current--
      }
    }
  }
}
```

## Priority 3: Resource & Progression Management

### 6. Fix Material Management System
**File**: `src/utils/SimulationEngine.ts`
```typescript
// Initialize materials properly
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
  
  return materials
}

// Add material with storage limits
private addMaterial(materialName: string, amount: number): boolean {
  const material = materialName.toLowerCase().replace(/\s+/g, '_')
  const current = this.gameState.resources.materials.get(material) || 0
  const storageLimit = this.getStorageLimit(material)
  
  const newAmount = Math.min(current + amount, storageLimit)
  this.gameState.resources.materials.set(material, newAmount)
  
  return newAmount < current + amount // Return true if hit storage cap
}
```

### 7. Implement Prerequisite System
**File**: `src/utils/systems/PrerequisiteSystem.ts` (NEW FILE)
```typescript
export class PrerequisiteSystem {
  static checkPrerequisites(
    item: any, 
    gameState: GameState,
    gameDataStore: any
  ): boolean {
    if (!item.prerequisite) return true
    
    // Handle multiple prerequisites (semicolon separated)
    const prerequisites = item.prerequisite.split(';').map(p => p.trim())
    
    for (const prereq of prerequisites) {
      if (!this.hasPrerequisite(prereq, gameState, gameDataStore)) {
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
    // Check various prerequisite types
    
    // 1. Check if it's an unlocked upgrade
    if (gameState.progression.unlockedUpgrades.includes(prereqId)) {
      return true
    }
    
    // 2. Check if it's a completed cleanup
    if (gameState.progression.completedCleanups.has(prereqId)) {
      return true
    }
    
    // 3. Check if it's a tool/weapon
    if (prereqId.startsWith('craft_')) {
      const toolId = prereqId.replace('craft_', '')
      return gameState.inventory.tools.has(toolId) || 
             gameState.inventory.weapons.has(toolId)
    }
    
    // 4. Check farm stages
    if (prereqId.startsWith('farm_stage_')) {
      const requiredStage = parseInt(prereqId.replace('farm_stage_', ''))
      return gameState.progression.farmStage >= requiredStage
    }
    
    // 5. Check hero level
    if (prereqId.startsWith('hero_level_')) {
      const requiredLevel = parseInt(prereqId.replace('hero_level_', ''))
      return gameState.progression.heroLevel >= requiredLevel
    }
    
    // 6. Check if it's a blueprint (needs to be purchased first)
    if (prereqId.startsWith('blueprint_')) {
      return gameState.progression.unlockedUpgrades.includes(prereqId)
    }
    
    return false
  }
}
```

## Priority 4: Game Loop Integration

### 8. Fix the Main Tick Processing
**File**: `src/utils/SimulationEngine.ts` - `tick()` method
```typescript
tick(): TickResult {
  const deltaMinutes = 1 // Each tick = 1 minute
  
  // 1. Update time
  this.updateGameTime(deltaMinutes)
  
  // 2. Process all ongoing systems
  CropSystem.processCropGrowth(this.gameState, deltaMinutes)
  CraftingSystem.processCrafting(this.gameState, deltaMinutes)
  MiningSystem.processMining(this.gameState, deltaMinutes)
  HelperSystem.processHelpers(this.gameState, deltaMinutes)
  
  // 3. Check if current adventure completed
  if (this.gameState.processes.adventure) {
    const result = this.checkAdventureCompletion()
    if (result) {
      this.applyAdventureRewards(result)
    }
  }
  
  // 4. Make AI decisions
  const actions = this.makeDecisions()
  const executedActions = []
  
  for (const action of actions) {
    if (this.executeAction(action)) {
      executedActions.push(action)
      // Only execute one action per tick for realism
      break
    }
  }
  
  // 5. Check phase progression
  this.updateGamePhase()
  
  // 6. Check for events and bottlenecks
  const events = this.checkForEvents()
  const isStuck = this.checkForBottleneck()
  
  return {
    gameState: this.gameState,
    executedActions,
    events,
    deltaTime: deltaMinutes,
    tickCount: ++this.tickCount,
    isComplete: this.checkVictoryCondition(),
    isStuck
  }
}
```

### 9. Add Mining System
**File**: `src/utils/systems/MiningSystem.ts` (NEW FILE)
```typescript
export class MiningSystem {
  static processMining(gameState: GameState, deltaMinutes: number) {
    if (!gameState.processes.mining) return
    
    const mining = gameState.processes.mining
    
    // Energy drain (exponential by depth)
    const depthTier = Math.floor(mining.depth / 500) + 1
    const baseDrain = Math.pow(2, depthTier - 1) // 1, 2, 4, 8, 16...
    const energyDrain = baseDrain * deltaMinutes
    
    // Apply pickaxe efficiency
    const pickaxeEfficiency = this.getPickaxeEfficiency(gameState)
    const actualDrain = energyDrain * (1 - pickaxeEfficiency)
    
    gameState.resources.energy.current -= actualDrain
    
    // Depth progression
    mining.depth += 10 * deltaMinutes // 10 meters per minute
    
    // Material drops every 30 seconds
    mining.materialTimer = (mining.materialTimer || 0) + deltaMinutes
    if (mining.materialTimer >= 0.5) {
      this.dropMaterials(gameState, mining.depth)
      mining.materialTimer = 0
    }
    
    // End mining if out of energy
    if (gameState.resources.energy.current <= 0) {
      gameState.processes.mining = null
      gameState.resources.energy.current = 0
    }
  }
  
  static dropMaterials(gameState: GameState, depth: number) {
    const depthTier = Math.floor(depth / 500) + 1
    
    // Material types by depth tier
    const materialsByTier = [
      ['stone'], // 0-500
      ['copper', 'stone'], // 500-1000
      ['iron', 'copper'], // 1000-1500
      ['iron'], // 1500-2000
      ['silver', 'iron'], // 2000-2500
      ['silver'], // 2500-3000
      ['crystal', 'silver'], // 3000-3500
      ['crystal'], // 3500-4000
      ['mythril', 'crystal'], // 4000-4500
      ['obsidian', 'mythril'] // 4500-5000
    ]
    
    const availableMaterials = materialsByTier[Math.min(depthTier - 1, 9)]
    if (!availableMaterials) return
    
    // Drop random materials from tier
    const material = availableMaterials[Math.floor(Math.random() * availableMaterials.length)]
    const quantity = Math.floor(Math.random() * 3) + depthTier * 2
    
    const current = gameState.resources.materials.get(material) || 0
    gameState.resources.materials.set(material, current + quantity)
  }
}
```

### 10. Add Forge/Crafting System
**File**: `src/utils/systems/CraftingSystem.ts` (NEW FILE)
```typescript
export class CraftingSystem {
  static processCrafting(gameState: GameState, deltaMinutes: number) {
    if (!gameState.processes.crafting || gameState.processes.crafting.length === 0) {
      return
    }
    
    const currentCraft = gameState.processes.crafting[0]
    
    // Progress crafting
    currentCraft.progress += deltaMinutes / currentCraft.duration
    
    // Check completion
    if (currentCraft.progress >= 1.0) {
      this.completeCraft(gameState, currentCraft)
      gameState.processes.crafting.shift()
    }
    
    // Update forge heat (decays over time)
    if (gameState.processes.forgeHeat) {
      gameState.processes.forgeHeat = Math.max(0, gameState.processes.forgeHeat - 10 * deltaMinutes)
    }
  }
  
  static completeCraft(gameState: GameState, craft: any) {
    const itemData = gameDataStore.getItemById(craft.itemId)
    if (!itemData) return
    
    // Add to appropriate inventory
    if (itemData.type === 'tool') {
      gameState.inventory.tools.set(craft.itemId, {
        id: craft.itemId,
        owned: true,
        upgraded: false
      })
    } else if (itemData.type === 'weapon') {
      const existingWeapon = gameState.inventory.weapons.get(itemData.weaponType) || { level: 0 }
      existingWeapon.level = Math.max(existingWeapon.level, itemData.level || 1)
      gameState.inventory.weapons.set(itemData.weaponType, existingWeapon)
    }
    
    // Apply master craft chance
    if (gameState.progression.unlockedUpgrades.includes('master_craft')) {
      if (Math.random() < 0.1) {
        // Double output - add another copy
        this.completeCraft(gameState, craft)
      }
    }
  }
}
```

## Testing Recommendations

### Create Integration Tests
```typescript
// test/simulation.integration.test.ts
describe('Simulation Integration Tests', () => {
  test('Farm cleanup actions increase plot count', async () => {
    const engine = new SimulationEngine(testConfig)
    const initialPlots = engine.gameState.progression.farmPlots
    
    // Execute cleanup action
    const cleanupAction = {
      type: 'cleanup',
      cleanupId: 'clear_weeds_1',
      energyCost: 15
    }
    
    engine.executeAction(cleanupAction)
    
    expect(engine.gameState.progression.farmPlots).toBe(initialPlots + 2)
    expect(engine.gameState.progression.completedCleanups.has('clear_weeds_1')).toBe(true)
  })
  
  test('Combat simulation produces reasonable results', async () => {
    const result = CombatSystem.simulateAdventure(
      meadowPathRoute,
      new Map([['sword', { damage: 10, attackSpeed: 1.0 }]]),
      { defense: 10, effect: 'none' },
      5, // Hero level
      {}
    )
    
    expect(result.success).toBe(true)
    expect(result.hp).toBeGreaterThan(0)
    expect(result.gold).toBeGreaterThan(0)
  })
  
  test('Helpers provide automation benefits', async () => {
    const engine = new SimulationEngine(testConfig)
    
    // Add a waterer helper
    engine.gameState.helpers.gnomes.push({
      id: 'gnome_1',
      role: 'waterer',
      level: 5,
      isHoused: true
    })
    
    // Set some dry crops
    engine.gameState.processes.crops[0].waterLevel = 0.1
    
    // Process helpers
    HelperSystem.processHelpers(engine.gameState, 1)
    
    expect(engine.gameState.processes.crops[0].waterLevel).toBe(1.0)
  })
})
```

## Conclusion

These refactors address the critical gaps between the game design and current implementation. The priority order ensures that foundational systems are fixed first, allowing subsequent systems to build on a solid base.

**Estimated effort**: 
- Priority 1: 2-3 days
- Priority 2: 3-4 days  
- Priority 3: 2-3 days
- Priority 4: 2-3 days
- Testing: 1-2 days

**Total: 10-15 days** to achieve 80%+ simulation accuracy