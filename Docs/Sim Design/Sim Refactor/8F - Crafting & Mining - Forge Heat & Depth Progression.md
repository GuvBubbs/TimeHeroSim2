# 8F - Crafting & Mining - Forge Heat & Depth Progression

## Context
- **What this phase is doing:** See Goals below.
- **What came before:** 7E - Combat System - Adventures & Boss Fights
- **What's coming next:** 7G - Integration & Testing - Full System Validation

## Scope
### Phase 8F: Crafting & Mining - Forge Heat & Depth Progression 🔨
**Goals**: Implement forge crafting and mining depth systems
**Expected Changes**:
- Heat management affects success rates
- Material consumption for crafting
- Depth-based energy drain (exponential)
- Material drops by depth tier
- Tool effects applied
**Test Command**: Mine to depth 500 → Craft iron tool → Check materials consumed
**Success Criteria**: Mining drains energy exponentially, crafting adds tools to inventory

## Details
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
