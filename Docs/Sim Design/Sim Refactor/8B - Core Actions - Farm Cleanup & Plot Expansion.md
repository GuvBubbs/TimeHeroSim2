# 8B - Core Actions - Farm Cleanup & Plot Expansion

## Context
- **What this phase is doing:** See Goals below.
- **What came before:** 7A - Foundation - CSV Parsing & Resource Management
- **What's coming next:** 7C - Crop System - Growth & Water Mechanics

## Scope
### Phase 8B: Core Actions - Farm Cleanup & Plot Expansion 🌱
**Goals**: Make farm cleanups actually increase plot count
**Expected Changes**:
- Cleanup actions increase farm plots
- Material rewards from cleanups added
- Prerequisites properly checked
- Progression tracked
**Test Command**: Start simulation → Watch ActionLog → Verify "clear_weeds_1" increases plots from 3→5
**Success Criteria**: Plot count increases match CSV data, materials gained

## Details
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
