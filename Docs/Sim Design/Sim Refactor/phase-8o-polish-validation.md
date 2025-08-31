# Phase 8O: Polish & Validation

## Overview
Comprehensive validation of prerequisite chains, tool effects, and game progression. Polish AI decision-making and implement missing systems.

## Priority: LOWER - Final polish and edge cases

## 1. Prerequisite Chain Validation

### CSV Dependency Validator
```javascript
class PrerequisiteValidator {
  constructor(csvData) {
    this.items = csvData.allItems
    this.errors = []
    this.warnings = []
    this.chains = new Map()
  }
  
  validateAll() {
    // Check for circular dependencies
    this.checkCircularDependencies()
    
    // Validate all prerequisites exist
    this.validatePrerequisiteExistence()
    
    // Check farm stage requirements
    this.validateFarmStageGating()
    
    // Validate tool requirements
    this.validateToolDependencies()
    
    // Check material availability
    this.validateMaterialChains()
    
    // Verify bootstrap economy (50g start fixes weapon blueprint access)
    this.validateBootstrapEconomy()
    
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      dependencyTree: this.buildDependencyTree()
    }
  }
  
  validateBootstrapEconomy() {
    // Check that starting 50 gold allows first weapon blueprint
    const swordBlueprint = this.items.find(i => i.id === 'blueprint_sword_i')
    if (swordBlueprint?.goldCost > 50) {
      this.errors.push({
        type: 'bootstrap_failure',
        message: 'Sword I blueprint costs more than starting gold (50g)',
        item: swordBlueprint.id,
        cost: swordBlueprint.goldCost
      })
    }
    
    // Verify adventure is accessible with basic sword
    const meadowPath = this.items.find(i => i.id === 'meadow_path_short')
    if (meadowPath?.prerequisites && !meadowPath.prerequisites.includes('tutorial')) {
      this.warnings.push({
        type: 'progression_block',
        message: 'First adventure may be blocked by prerequisites',
        item: meadowPath.id
      })
    }
  }
  
  checkCircularDependencies() {
    const visited = new Set()
    const recursionStack = new Set()
    
    const hasCycle = (itemId, path = []) => {
      if (recursionStack.has(itemId)) {
        this.errors.push({
          type: 'circular_dependency',
          item: itemId,
          cycle: [...path, itemId]
        })
        return true
      }
      
      if (visited.has(itemId)) return false
      
      visited.add(itemId)
      recursionStack.add(itemId)
      
      const item = this.items.find(i => i.id === itemId)
      if (item?.prerequisites) {
        const prereqs = item.prerequisites.split(';')
        for (const prereq of prereqs) {
          if (hasCycle(prereq.trim(), [...path, itemId])) {
            return true
          }
        }
      }
      
      recursionStack.delete(itemId)
      return false
    }
    
    this.items.forEach(item => hasCycle(item.id))
  }
  
  validateFarmStageGating() {
    const stageGates = {
      'homestead': 'small_hold_complete',
      'manor_grounds': 'homestead_complete', 
      'great_estate': 'manor_grounds_complete'
    }
    
    this.items.forEach(item => {
      const requiredStage = this.detectRequiredFarmStage(item)
      if (requiredStage && !this.hasPrerequisite(item, stageGates[requiredStage])) {
        this.warnings.push({
          type: 'missing_stage_gate',
          item: item.id,
          requiredStage,
          suggestion: `Add prerequisite: ${stageGates[requiredStage]}`
        })
      }
    })
  }
}
```

### Tool Gating Verification
```javascript
const TOOL_GATES = {
  // Cleanup -> Required Tool
  'clear_small_boulders': 'hammer',
  'break_boulders': 'hammer',
  'crack_boulders': 'hammer_plus',
  'break_mineral_deposit': 'hammer_plus',
  'break_stone_monoliths': 'stone_breaker',
  
  'split_small_stumps': 'axe',
  'remove_stumps': 'axe',
  'clear_thickets': 'axe_plus',
  'buck_fallen_trunks': 'axe_plus',
  'cut_ancient_roots': 'world_splitter',
  
  'level_molehills': 'shovel',
  'dig_buried_stones': 'shovel',
  'eliminate_molehills': 'shovel_plus',
  'landscape_section': 'shovel_plus',
  'flatten_hill': 'earth_mover',
  
  'till_soil': 'hoe',
  'homestead_till': 'hoe_plus',
  'manor_till': 'terra_former'
}

function validateToolRequirements(cleanupAction) {
  const requiredTool = TOOL_GATES[cleanupAction.id]
  if (!requiredTool) return true
  
  const hasToolInPrereqs = cleanupAction.prerequisites?.includes(requiredTool)
  const hasToolInInventory = gameState.inventory.tools.has(requiredTool)
  
  if (!hasToolInPrereqs && !hasToolInInventory) {
    return {
      valid: false,
      error: `Cleanup ${cleanupAction.id} requires ${requiredTool}`
    }
  }
  
  return true
}
```

## 2. Missing Game Systems

### Offline Progression Calculator
```javascript
class OfflineProgressionSystem {
  calculate(gameState, offlineMinutes) {
    const results = {
      time: offlineMinutes,
      cropsGrown: [],
      cropsHarvested: [],
      seedsCaught: [],
      waterGenerated: 0,
      craftingCompleted: [],
      miningProgress: {},
      helperActions: []
    }
    
    // Process crop growth with water limitations
    results.cropsGrown = this.processCropGrowth(gameState, offlineMinutes)
    
    // Auto-harvest mature crops if energy cap allows
    results.cropsHarvested = this.processHarvests(gameState, results.cropsGrown)
    
    // Calculate auto-catcher seeds
    if (gameState.tower.autoCatcher) {
      const catcherTier = gameState.tower.autoCatcherLevel
      const rate = AUTO_CATCHERS[catcherTier].rate
      results.seedsCaught = Math.floor(offlineMinutes * rate)
    }
    
    // Generate water from auto-pumps
    if (gameState.farm.autoPump) {
      const pumpLevel = gameState.farm.autoPumpLevel
      const rate = AUTO_PUMP_SYSTEMS[pumpLevel].effect.offlineRate
      results.waterGenerated = Math.min(
        gameState.resources.water.max * rate * (offlineMinutes / 60),
        gameState.resources.water.max - gameState.resources.water.current
      )
    }
    
    // Continue crafting queue
    results.craftingCompleted = this.processCrafting(gameState, offlineMinutes)
    
    // Continue mining if energy available
    if (gameState.mining.active) {
      results.miningProgress = this.processMining(gameState, offlineMinutes)
    }
    
    // Process helper actions
    results.helperActions = this.processHelpers(gameState, offlineMinutes)
    
    return results
  }
  
  displaySummary(results) {
    return {
      title: `While you were away (${this.formatTime(results.time)})`,
      sections: [
        {
          category: 'Farm',
          items: [
            `${results.cropsHarvested.length} crops harvested (+${results.energyGained} energy)`,
            `${results.waterGenerated} water generated`
          ]
        },
        {
          category: 'Tower',
          items: [`${results.seedsCaught.length} seeds caught`]
        },
        {
          category: 'Crafting',
          items: results.craftingCompleted.map(item => `Crafted: ${item.name}`)
        },
        {
          category: 'Helpers',
          items: results.helperActions.map(action => action.description)
        }
      ]
    }
  }
}
```

### Route Enemy Roll Persistence
```javascript
class RouteRollSystem {
  constructor() {
    // Store rolls per route/difficulty combination
    this.activeRolls = new Map() // Key: "route_id:difficulty"
  }
  
  getRoll(routeId, difficulty) {
    const key = `${routeId}:${difficulty}`
    
    if (!this.activeRolls.has(key)) {
      this.activeRolls.set(key, this.generateRoll(routeId))
    }
    
    return this.activeRolls.get(key)
  }
  
  generateRoll(routeId) {
    const routeData = ROUTE_ENEMY_COMPOSITIONS[routeId]
    const roll = {
      timestamp: Date.now(),
      enemies: []
    }
    
    // Generate enemy composition based on route rules
    routeData.enemyTypes.forEach(type => {
      const count = this.rollEnemyCount(type.min, type.max)
      roll.enemies.push({
        type: type.name,
        count,
        percentage: (count / totalEnemies) * 100
      })
    })
    
    return roll
  }
  
  clearRoll(routeId, difficulty, outcome) {
    const key = `${routeId}:${difficulty}`
    
    // Only clear on completion or failure
    if (outcome === 'complete' || outcome === 'failed') {
      this.activeRolls.delete(key)
      console.log(`Route roll cleared: ${key} (${outcome})`)
    }
  }
}
```

### Mining Tool Effects
```javascript
const PICKAXE_EFFECTS = {
  pickaxe_i: {
    energyReduction: 0,
    materialBonus: 0,
    maxDepth: 10,
    special: null
  },
  
  pickaxe_ii: {
    energyReduction: 0.15,  // 15% less energy drain
    materialBonus: 0.10,     // 10% more materials
    maxDepth: 10,
    special: null
  },
  
  pickaxe_iii: {
    energyReduction: 0.30,
    materialBonus: 0.20,
    maxDepth: 10,
    special: null
  },
  
  crystal_pick: {
    energyReduction: 0.45,
    materialBonus: 0.30,
    maxDepth: 10,
    special: null
  },
  
  abyss_seeker: {
    energyReduction: 0.60,
    materialBonus: 0.50,
    maxDepth: 10,
    special: {
      effect: 'double_obsidian_chance',
      multiplier: 2.0
    }
  }
}

class MiningSystem {
  calculateEnergyDrain(depth, pickaxe) {
    const baseDrain = Math.pow(2, depth)  // 2^depth per minute
    const reduction = PICKAXE_EFFECTS[pickaxe]?.energyReduction || 0
    return baseDrain * (1 - reduction)
  }
  
  calculateMaterialDrop(baseMaterials, pickaxe) {
    const bonus = PICKAXE_EFFECTS[pickaxe]?.materialBonus || 0
    return baseMaterials.map(mat => ({
      ...mat,
      amount: Math.floor(mat.amount * (1 + bonus))
    }))
  }
  
  applySpecialEffect(materials, pickaxe) {
    const special = PICKAXE_EFFECTS[pickaxe]?.special
    if (!special) return materials
    
    if (special.effect === 'double_obsidian_chance') {
      return materials.map(mat => {
        if (mat.type === 'obsidian') {
          return { ...mat, amount: mat.amount * special.multiplier }
        }
        return mat
      })
    }
    
    return materials
  }
}
```

## 3. AI Decision-Making Polish

### Improved Action Scoring
```javascript
class EnhancedDecisionEngine {
  scoreAction(action, gameState, persona) {
    let score = 0
    
    // Base score from action priority
    score += this.getBasePriority(action)
    
    // Efficiency multiplier
    score *= this.getEfficiencyMultiplier(action, gameState)
    
    // Persona preference
    score *= this.getPersonaPreference(action, persona)
    
    // Bottleneck resolution bonus
    if (this.resolvesBottleneck(action, gameState)) {
      score *= 2.0
    }
    
    // Resource efficiency
    score *= this.getResourceEfficiency(action, gameState)
    
    // Time efficiency (prefer quick actions when many tasks pending)
    if (gameState.pendingTasks > 5) {
      score *= (60 / action.duration)  // Favor shorter actions
    }
    
    return score
  }
  
  getBottleneckPriorities(gameState) {
    const bottlenecks = []
    
    // Check for water shortage
    if (gameState.resources.water.current < gameState.farm.plots * 2) {
      bottlenecks.push({ type: 'water', priority: 10 })
    }
    
    // Check for seed shortage
    const totalSeeds = Array.from(gameState.resources.seeds.values()).reduce((a, b) => a + b, 0)
    if (totalSeeds < gameState.farm.plots) {
      bottlenecks.push({ type: 'seeds', priority: 8 })
    }
    
    // Check for plot shortage
    const usedPlots = gameState.farm.crops.filter(c => c.planted).length
    if (usedPlots / gameState.farm.plots > 0.9) {
      bottlenecks.push({ type: 'plots', priority: 7 })
    }
    
    // Check for tool requirements
    const nextCleanup = this.getNextCleanup(gameState)
    if (nextCleanup && !this.hasRequiredTool(nextCleanup, gameState)) {
      bottlenecks.push({ type: 'tool', priority: 9, tool: nextCleanup.requiredTool })
    }
    
    return bottlenecks.sort((a, b) => b.priority - a.priority)
  }
}
```

### Persona Behavior Refinement
```javascript
const REFINED_PERSONAS = {
  speedrunner: {
    checkInsPerDay: { weekday: 10, weekend: 10 },
    efficiency: 0.95,
    preferences: {
      farming: 0.7,      // Lower priority on farming
      adventures: 0.9,   // High priority on progression
      crafting: 1.0,     // Maximum efficiency in crafting
      mining: 0.8,       // Good mining efficiency
      helpers: 1.0       // Optimal helper management
    },
    strategy: 'aggressive_expansion'
  },
  
  casual: {
    checkInsPerDay: { weekday: 2, weekend: 2 },
    efficiency: 0.70,
    preferences: {
      farming: 1.0,      // Focus on reliable farming
      adventures: 0.5,   // Less risky adventures
      crafting: 0.6,     // Some crafting mistakes
      mining: 0.4,       // Minimal mining
      helpers: 0.7       // Decent helper usage
    },
    strategy: 'steady_progress'
  },
  
  'weekend-warrior': {
    checkInsPerDay: { weekday: 1, weekend: 8 },
    efficiency: 0.80,
    preferences: {
      farming: 0.8,      // Good farming on weekends
      adventures: 1.0,   // Big adventure pushes
      crafting: 0.7,     // Batch crafting on weekends
      mining: 0.9,       // Deep mining sessions
      helpers: 0.6       // Some helper neglect
    },
    strategy: 'burst_progress'
  }
}
```

## 4. Edge Case Handling

### Resource Overflow Protection
```javascript
class ResourceManager {
  addResource(type, amount, storage) {
    const current = storage[type] || 0
    const max = this.getMaxStorage(type)
    const added = Math.min(amount, max - current)
    const overflow = amount - added
    
    if (overflow > 0) {
      console.warn(`Resource overflow: ${overflow} ${type} lost (storage full)`)
      this.recordOverflow(type, overflow)
    }
    
    storage[type] = current + added
    
    return {
      added,
      overflow,
      newTotal: storage[type]
    }
  }
}
```

### Save State Validation
```javascript
class SaveStateValidator {
  validate(saveState) {
    const issues = []
    
    // Check version compatibility
    if (saveState.version !== CURRENT_SAVE_VERSION) {
      issues.push({
        severity: 'warning',
        message: `Save version mismatch: ${saveState.version} vs ${CURRENT_SAVE_VERSION}`
      })
    }
    
    // Validate resource bounds
    Object.entries(saveState.resources).forEach(([key, resource]) => {
      if (resource.current > resource.max) {
        issues.push({
          severity: 'error',
          message: `Resource ${key} exceeds max: ${resource.current} > ${resource.max}`,
          fix: () => { resource.current = resource.max }
        })
      }
    })
    
    // Check for impossible states
    if (saveState.farm.plots > 90) {
      issues.push({
        severity: 'error',
        message: `Too many plots: ${saveState.farm.plots} (max 90)`,
        fix: () => { saveState.farm.plots = 90 }
      })
    }
    
    // Apply automatic fixes for errors
    issues.filter(i => i.severity === 'error' && i.fix).forEach(i => i.fix())
    
    return {
      valid: !issues.some(i => i.severity === 'error'),
      issues,
      fixedCount: issues.filter(i => i.fix).length
    }
  }
}
```

## Testing Checklist

### Prerequisite Validation
- [ ] No circular dependencies in CSV data
- [ ] All referenced prerequisites exist
- [ ] Farm stage gates properly enforced
- [ ] Tool requirements block invalid actions
- [ ] Material requirements prevent impossible crafts

### System Completeness
- [ ] Offline progression calculates correctly
- [ ] Route enemy rolls persist between attempts
- [ ] Pickaxe effects apply to mining
- [ ] Tool sharpening reduces energy drain by 25%
- [ ] Abyss Seeker doubles obsidian drops

### AI Behavior  
- [ ] Speedrunner reaches 90 plots in 15-20 days
- [ ] Casual shows steady daily progress
- [ ] Weekend Warrior has burst patterns
- [ ] Bottlenecks detected and resolved
- [ ] No infinite loops in decision making

### Edge Cases
- [ ] Resource overflow handled gracefully
- [ ] Save state corruption detected and fixed
- [ ] Invalid CSV data rejected with clear errors
- [ ] Memory leaks prevented in long simulations
- [ ] Performance remains stable over 21 days

## Success Metrics
- Complete 21-day simulation without crashes
- No invalid states or impossible actions
- CSV validation catches all dependency issues
- AI makes sensible decisions for each persona
- Performance: <100ms per tick at max speed

## Files to Modify
1. `src/utils/validators/PrerequisiteValidator.ts` - New comprehensive validator
2. `src/utils/systems/OfflineProgressionSystem.ts` - New offline calculator
3. `src/utils/systems/RouteRollSystem.ts` - New roll persistence
4. `src/utils/SimulationEngine.ts` - Enhanced AI decision making
5. `src/utils/SaveStateManager.ts` - Save validation and fixing
6. `src/utils/systems/MiningSystem.ts` - Pickaxe effects implementation