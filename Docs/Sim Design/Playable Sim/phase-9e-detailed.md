# Phase 9E: Extract Action Executor - Detailed Implementation

## Overview
Extract ~600 lines of action execution logic from SimulationEngine into a centralized ActionExecutor. This creates a unified execution pipeline for all action types with consistent validation, state updates, and event generation.

## File Structure After Phase 9E

```
src/utils/execution/
├── ActionExecutor.ts (new ~250 lines)
├── ActionValidator.ts (new ~150 lines)
├── StateUpdater.ts (new ~150 lines)
├── ExecutionContext.ts (new ~50 lines)
└── types/
    ├── ActionResult.ts (new ~50 lines)
    └── ExecutionTypes.ts (new ~50 lines)
```

## Current Execution Logic in SimulationEngine

### Methods to Extract (Lines ~2000-2600):
```typescript
// Core execution
- executeAction(action: GameAction): boolean
- executeMultipleActions(actions: GameAction[]): ExecutionResult[]

// Type-specific execution
- executePlantAction(action: GameAction): boolean
- executeHarvestAction(action: GameAction): boolean
- executePumpAction(action: GameAction): boolean
- executeCleanupAction(action: GameAction): boolean
- executeBuildAction(action: GameAction): boolean
- executePurchaseAction(action: GameAction): boolean
- executeNavigationAction(action: GameAction): boolean
- executeCatchSeedsAction(action: GameAction): boolean

// State updates from actions
- applyActionEffects(action: GameAction): void
- consumeActionResources(action: GameAction): void
- updateLocationFromAction(action: GameAction): void
- addActionRewards(action: GameAction): void

// Validation before execution
- canExecuteAction(action: GameAction): boolean
- validateActionResources(action: GameAction): boolean
- validateActionPrerequisites(action: GameAction): boolean
```

## 1. ActionExecutor.ts - Central Execution Pipeline

### Interface Design:
```typescript
export interface IActionExecutor {
  // Main execution method
  execute(
    action: GameAction,
    gameState: GameState,
    gameDataStore: GameDataStore,
    systems: SystemRegistry
  ): ActionResult
  
  // Batch execution
  executeBatch(
    actions: GameAction[],
    gameState: GameState,
    gameDataStore: GameDataStore,
    systems: SystemRegistry
  ): BatchExecutionResult
  
  // Validation
  canExecute(
    action: GameAction,
    gameState: GameState,
    gameDataStore: GameDataStore
  ): ValidationResult
}

export interface ActionResult {
  success: boolean
  action: GameAction
  stateChanges: StateChanges
  events: GameEvent[]
  error?: string
  rollback?: () => void
}

export interface BatchExecutionResult {
  executed: ActionResult[]
  failed: ActionResult[]
  totalStateChanges: StateChanges
  events: GameEvent[]
}

export interface StateChanges {
  resources?: Partial<Resources>
  location?: Partial<Location>
  inventory?: Partial<Inventory>
  processes?: Partial<Processes>
  unlocks?: string[]
  farm?: Partial<Farm>
  systems?: Partial<Systems>
}
```

### Implementation:
```typescript
export class ActionExecutor implements IActionExecutor {
  private validator: ActionValidator
  private stateUpdater: StateUpdater
  private executionStrategies: Map<string, ExecutionStrategy>
  
  constructor() {
    this.validator = new ActionValidator()
    this.stateUpdater = new StateUpdater()
    this.executionStrategies = this.initializeStrategies()
  }
  
  execute(
    action: GameAction,
    gameState: GameState,
    gameDataStore: GameDataStore,
    systems: SystemRegistry
  ): ActionResult {
    // 1. Create execution context
    const context = new ExecutionContext(gameState, gameDataStore, systems)
    
    // 2. Validate action
    const validation = this.validator.validate(action, context)
    if (!validation.isValid) {
      return {
        success: false,
        action,
        stateChanges: {},
        events: [],
        error: validation.error
      }
    }
    
    // 3. Create state snapshot for rollback
    const snapshot = this.createSnapshot(gameState)
    
    try {
      // 4. Get execution strategy for action type
      const strategy = this.executionStrategies.get(action.type)
      if (!strategy) {
        throw new Error(`No execution strategy for action type: ${action.type}`)
      }
      
      // 5. Execute action through strategy
      const result = strategy.execute(action, context)
      
      // 6. Apply state changes
      this.stateUpdater.applyChanges(gameState, result.stateChanges)
      
      // 7. Generate events
      const events = this.generateEvents(action, result, gameState)
      
      return {
        success: true,
        action,
        stateChanges: result.stateChanges,
        events,
        rollback: () => this.restoreSnapshot(gameState, snapshot)
      }
      
    } catch (error) {
      // Rollback on error
      this.restoreSnapshot(gameState, snapshot)
      
      return {
        success: false,
        action,
        stateChanges: {},
        events: [],
        error: error.message
      }
    }
  }
  
  executeBatch(
    actions: GameAction[],
    gameState: GameState,
    gameDataStore: GameDataStore,
    systems: SystemRegistry
  ): BatchExecutionResult {
    const executed: ActionResult[] = []
    const failed: ActionResult[] = []
    const allEvents: GameEvent[] = []
    const totalChanges: StateChanges = {}
    
    // Create transaction snapshot
    const transactionSnapshot = this.createSnapshot(gameState)
    
    try {
      for (const action of actions) {
        const result = this.execute(action, gameState, gameDataStore, systems)
        
        if (result.success) {
          executed.push(result)
          allEvents.push(...result.events)
          this.mergeStateChanges(totalChanges, result.stateChanges)
        } else {
          failed.push(result)
          
          // Optionally stop batch on failure
          if (this.shouldStopBatchOnFailure(action)) {
            break
          }
        }
      }
      
      return {
        executed,
        failed,
        totalStateChanges: totalChanges,
        events: allEvents
      }
      
    } catch (error) {
      // Rollback entire batch on critical error
      this.restoreSnapshot(gameState, transactionSnapshot)
      throw error
    }
  }
  
  private initializeStrategies(): Map<string, ExecutionStrategy> {
    const strategies = new Map<string, ExecutionStrategy>()
    
    strategies.set('plant', new PlantExecutionStrategy())
    strategies.set('harvest', new HarvestExecutionStrategy())
    strategies.set('pump', new PumpExecutionStrategy())
    strategies.set('cleanup', new CleanupExecutionStrategy())
    strategies.set('build', new BuildExecutionStrategy())
    strategies.set('purchase', new PurchaseExecutionStrategy())
    strategies.set('move', new NavigationExecutionStrategy())
    strategies.set('catch_seeds', new CatchSeedsExecutionStrategy())
    strategies.set('adventure', new AdventureExecutionStrategy())
    strategies.set('craft', new CraftExecutionStrategy())
    strategies.set('mine', new MineExecutionStrategy())
    
    return strategies
  }
}
```

## 2. Execution Strategies - Type-Specific Logic

### Base Strategy Interface:
```typescript
export interface ExecutionStrategy {
  execute(action: GameAction, context: ExecutionContext): ExecutionResult
}

export interface ExecutionResult {
  stateChanges: StateChanges
  metadata?: any
}
```

### Example Strategies:
```typescript
export class PlantExecutionStrategy implements ExecutionStrategy {
  execute(action: GameAction, context: ExecutionContext): ExecutionResult {
    const { gameState, gameDataStore } = context
    
    // Get crop data
    const cropId = action.targetId
    const cropData = gameDataStore.getItemById(cropId)
    if (!cropData) {
      throw new Error(`Crop not found: ${cropId}`)
    }
    
    // Find available plot
    const plotIndex = this.findAvailablePlot(gameState.farm)
    if (plotIndex === -1) {
      throw new Error('No available plots')
    }
    
    // Consume seed
    const seedCount = gameState.resources.seeds.get(cropId) || 0
    if (seedCount < 1) {
      throw new Error(`No ${cropId} seeds available`)
    }
    
    // Create state changes
    const stateChanges: StateChanges = {
      resources: {
        seeds: new Map(gameState.resources.seeds).set(cropId, seedCount - 1)
      },
      processes: {
        crops: [
          ...gameState.processes.crops,
          {
            id: `crop_${plotIndex}_${Date.now()}`,
            cropId,
            plotIndex,
            plantedAt: gameState.time.totalMinutes,
            currentStage: 0,
            totalStages: cropData.stages || 3,
            growthDuration: cropData.duration || 10,
            lastWatered: gameState.time.totalMinutes,
            isWatered: true
          }
        ]
      }
    }
    
    return { stateChanges }
  }
  
  private findAvailablePlot(farm: Farm): number {
    for (let i = 0; i < farm.plots; i++) {
      const isOccupied = farm.crops?.some(c => c.plotIndex === i)
      if (!isOccupied) return i
    }
    return -1
  }
}

export class HarvestExecutionStrategy implements ExecutionStrategy {
  execute(action: GameAction, context: ExecutionContext): ExecutionResult {
    const { gameState, gameDataStore } = context
    
    // Find crop to harvest
    const crop = gameState.processes.crops.find(c => c.id === action.targetId)
    if (!crop) {
      throw new Error(`Crop not found: ${action.targetId}`)
    }
    
    // Get crop data for energy value
    const cropData = gameDataStore.getItemById(crop.cropId)
    const energyValue = cropData?.effect || 1
    
    // Calculate new energy (respect cap)
    const currentEnergy = gameState.resources.energy.current
    const maxEnergy = gameState.resources.energy.max
    const newEnergy = Math.min(currentEnergy + energyValue, maxEnergy)
    
    // Remove crop from processes
    const newCrops = gameState.processes.crops.filter(c => c.id !== action.targetId)
    
    // Create state changes
    const stateChanges: StateChanges = {
      resources: {
        energy: {
          current: newEnergy,
          max: maxEnergy
        }
      },
      processes: {
        crops: newCrops
      }
    }
    
    return { 
      stateChanges,
      metadata: { energyGained: newEnergy - currentEnergy }
    }
  }
}

export class BuildExecutionStrategy implements ExecutionStrategy {
  execute(action: GameAction, context: ExecutionContext): ExecutionResult {
    const { gameState, gameDataStore } = context
    
    // Get structure data
    const structureId = action.targetId
    const structureData = gameDataStore.getItemById(structureId)
    if (!structureData) {
      throw new Error(`Structure not found: ${structureId}`)
    }
    
    // Consume resources
    const energyCost = action.energyCost || 0
    const materials = action.materials || {}
    
    const newEnergy = gameState.resources.energy.current - energyCost
    const newMaterials = new Map(gameState.resources.materials)
    
    for (const [material, amount] of Object.entries(materials)) {
      const current = newMaterials.get(material) || 0
      newMaterials.set(material, current - amount)
    }
    
    // Add to built structures
    const newBuiltStructures = new Set(gameState.unlockedContent.builtStructures)
    newBuiltStructures.add(structureId)
    
    // Check what this unlocks
    const unlocks = this.getUnlocks(structureId, gameDataStore)
    
    // Create state changes
    const stateChanges: StateChanges = {
      resources: {
        energy: { current: newEnergy },
        materials: newMaterials
      },
      unlocks: [structureId, ...unlocks],
      inventory: {
        builtStructures: newBuiltStructures
      }
    }
    
    return { stateChanges }
  }
  
  private getUnlocks(structureId: string, gameDataStore: GameDataStore): string[] {
    // Check what this structure unlocks
    const unlocks: string[] = []
    
    if (structureId === 'tower_base') {
      unlocks.push('tower_reach_1', 'tower') // Unlock tower screen and first reach
    }
    
    // Add other unlock logic
    
    return unlocks
  }
}

export class NavigationExecutionStrategy implements ExecutionStrategy {
  execute(action: GameAction, context: ExecutionContext): ExecutionResult {
    const { gameState } = context
    
    const targetLocation = action.target as GameLocation
    
    // Validate navigation is allowed
    if (!this.canNavigateTo(targetLocation, gameState)) {
      throw new Error(`Cannot navigate to ${targetLocation}`)
    }
    
    // Create state changes
    const stateChanges: StateChanges = {
      location: {
        current: targetLocation,
        lastVisited: gameState.location.current
      }
    }
    
    return { stateChanges }
  }
  
  private canNavigateTo(location: GameLocation, gameState: GameState): boolean {
    // Check if location is unlocked
    switch (location) {
      case 'farm':
        return true // Always accessible
      case 'town':
        return true // Unlocked from start
      case 'tower':
        return gameState.unlockedContent.builtStructures?.has('tower_reach_1') || false
      case 'forge':
        return gameState.unlockedContent.builtStructures?.has('forge_base') || false
      case 'mine':
        return gameState.unlockedContent.purchasedBlueprints?.has('pickaxe_1') || false
      default:
        return false
    }
  }
}
```

## 3. ActionValidator.ts - Pre-Execution Validation

```typescript
export class ActionValidator {
  validate(action: GameAction, context: ExecutionContext): ValidationResult {
    const errors: string[] = []
    
    // 1. Check prerequisites
    const prereqResult = this.validatePrerequisites(action, context)
    if (!prereqResult.isValid) {
      errors.push(prereqResult.error!)
    }
    
    // 2. Check resources
    const resourceResult = this.validateResources(action, context)
    if (!resourceResult.isValid) {
      errors.push(resourceResult.error!)
    }
    
    // 3. Check location
    const locationResult = this.validateLocation(action, context)
    if (!locationResult.isValid) {
      errors.push(locationResult.error!)
    }
    
    // 4. Check conflicts
    const conflictResult = this.validateNoConflicts(action, context)
    if (!conflictResult.isValid) {
      errors.push(conflictResult.error!)
    }
    
    // 5. Type-specific validation
    const typeResult = this.validateActionType(action, context)
    if (!typeResult.isValid) {
      errors.push(typeResult.error!)
    }
    
    return {
      isValid: errors.length === 0,
      error: errors.join('; ')
    }
  }
  
  private validatePrerequisites(action: GameAction, context: ExecutionContext): ValidationResult {
    if (!action.targetId) return { isValid: true }
    
    const item = context.gameDataStore.getItemById(action.targetId)
    if (!item) return { isValid: true }
    
    if (item.prerequisites) {
      const prereqs = item.prerequisites.split(';').map(p => p.trim())
      for (const prereq of prereqs) {
        if (!this.hasPrerequisite(prereq, context.gameState)) {
          return {
            isValid: false,
            error: `Missing prerequisite: ${prereq}`
          }
        }
      }
    }
    
    return { isValid: true }
  }
  
  private validateResources(action: GameAction, context: ExecutionContext): ValidationResult {
    const { gameState } = context
    
    // Energy validation
    if (action.energyCost && action.energyCost > 0) {
      if (gameState.resources.energy.current < action.energyCost) {
        return {
          isValid: false,
          error: `Insufficient energy: need ${action.energyCost}, have ${gameState.resources.energy.current}`
        }
      }
    }
    
    // Gold validation
    if (action.goldCost && action.goldCost > 0) {
      if (gameState.resources.gold < action.goldCost) {
        return {
          isValid: false,
          error: `Insufficient gold: need ${action.goldCost}, have ${gameState.resources.gold}`
        }
      }
    }
    
    // Materials validation
    if (action.materials) {
      for (const [material, required] of Object.entries(action.materials)) {
        const available = gameState.resources.materials.get(material) || 0
        if (available < required) {
          return {
            isValid: false,
            error: `Insufficient ${material}: need ${required}, have ${available}`
          }
        }
      }
    }
    
    return { isValid: true }
  }
  
  private validateLocation(action: GameAction, context: ExecutionContext): ValidationResult {
    const { gameState } = context
    
    // Some actions require specific locations
    const locationRequirements: Record<string, GameLocation[]> = {
      'plant': ['farm'],
      'harvest': ['farm'],
      'pump': ['farm'],
      'cleanup': ['farm'],
      'purchase': ['town'],
      'catch_seeds': ['tower'],
      'craft': ['forge'],
      'mine': ['mine']
    }
    
    const requiredLocations = locationRequirements[action.type]
    if (requiredLocations && !requiredLocations.includes(gameState.location.current)) {
      return {
        isValid: false,
        error: `Action ${action.type} requires location: ${requiredLocations.join(' or ')}`
      }
    }
    
    return { isValid: true }
  }
  
  private validateNoConflicts(action: GameAction, context: ExecutionContext): ValidationResult {
    const { gameState } = context
    
    // Can't start adventure while one is ongoing
    if (action.type === 'adventure' && gameState.processes.adventure) {
      return {
        isValid: false,
        error: 'Adventure already in progress'
      }
    }
    
    // Can't craft while crafting
    if (action.type === 'craft' && gameState.processes.crafting) {
      return {
        isValid: false,
        error: 'Crafting already in progress'
      }
    }
    
    // Can't mine while mining
    if (action.type === 'mine' && gameState.processes.mining) {
      return {
        isValid: false,
        error: 'Mining already in progress'
      }
    }
    
    return { isValid: true }
  }
}
```

## 4. StateUpdater.ts - State Mutation Logic

```typescript
export class StateUpdater {
  applyChanges(gameState: GameState, changes: StateChanges): void {
    // Apply changes in specific order to avoid conflicts
    
    // 1. Resources first (most fundamental)
    if (changes.resources) {
      this.updateResources(gameState, changes.resources)
    }
    
    // 2. Inventory changes
    if (changes.inventory) {
      this.updateInventory(gameState, changes.inventory)
    }
    
    // 3. Unlocks
    if (changes.unlocks) {
      this.addUnlocks(gameState, changes.unlocks)
    }
    
    // 4. Location changes
    if (changes.location) {
      this.updateLocation(gameState, changes.location)
    }
    
    // 5. Process changes
    if (changes.processes) {
      this.updateProcesses(gameState, changes.processes)
    }
    
    // 6. Farm changes
    if (changes.farm) {
      this.updateFarm(gameState, changes.farm)
    }
    
    // 7. System changes
    if (changes.systems) {
      this.updateSystems(gameState, changes.systems)
    }
    
    // Validate state after all changes
    this.validateState(gameState)
  }
  
  private updateResources(gameState: GameState, resourceChanges: Partial<Resources>): void {
    // Energy
    if (resourceChanges.energy) {
      gameState.resources.energy = {
        ...gameState.resources.energy,
        ...resourceChanges.energy
      }
    }
    
    // Gold
    if (resourceChanges.gold !== undefined) {
      gameState.resources.gold = resourceChanges.gold
    }
    
    // Water
    if (resourceChanges.water) {
      gameState.resources.water = {
        ...gameState.resources.water,
        ...resourceChanges.water
      }
    }
    
    // Seeds (Map)
    if (resourceChanges.seeds) {
      gameState.resources.seeds = new Map(resourceChanges.seeds)
    }
    
    // Materials (Map)
    if (resourceChanges.materials) {
      gameState.resources.materials = new Map(resourceChanges.materials)
    }
  }
  
  private addUnlocks(gameState: GameState, unlocks: string[]): void {
    for (const unlock of unlocks) {
      gameState.unlockedContent.all.add(unlock)
      
      // Categorize unlock
      if (unlock.includes('blueprint')) {
        gameState.unlockedContent.purchasedBlueprints.add(unlock)
      } else if (unlock.includes('structure') || unlock.includes('tower_reach')) {
        gameState.unlockedContent.builtStructures.add(unlock)
      } else if (unlock.includes('route')) {
        gameState.unlockedContent.adventureRoutes.add(unlock)
      }
    }
  }
  
  private validateState(gameState: GameState): void {
    // Ensure resources don't exceed caps
    if (gameState.resources.energy.current > gameState.resources.energy.max) {
      gameState.resources.energy.current = gameState.resources.energy.max
    }
    
    if (gameState.resources.water.current > gameState.resources.water.max) {
      gameState.resources.water.current = gameState.resources.water.max
    }
    
    // Ensure no negative resources
    if (gameState.resources.energy.current < 0) {
      throw new Error('Energy went negative!')
    }
    
    if (gameState.resources.gold < 0) {
      throw new Error('Gold went negative!')
    }
  }
}
```

## Migration Strategy for Phase 9E

### Step 1: Create Execution Module
```bash
mkdir -p src/utils/execution/types
touch src/utils/execution/ActionExecutor.ts
touch src/utils/execution/ActionValidator.ts
touch src/utils/execution/StateUpdater.ts
touch src/utils/execution/ExecutionContext.ts
```

### Step 2: Extract Execution Strategies
For each action type, create a strategy:
1. Copy the execution logic from SimulationEngine
2. Convert to strategy pattern
3. Ensure proper state change generation
4. Add proper error handling

### Step 3: Update SimulationEngine
```typescript
// SimulationEngine.ts
import { ActionExecutor } from './execution/ActionExecutor'

export class SimulationEngine {
  private executor: ActionExecutor
  
  constructor(config: SimulationConfig, gameDataStore: GameDataStore) {
    this.executor = new ActionExecutor()
    // ...
  }
  
  // Simplified execution
  private executeActions(actions: GameAction[]): ActionResult[] {
    const batchResult = this.executor.executeBatch(
      actions,
      this.gameState,
      this.gameDataStore,
      this.systems
    )
    
    // Log events
    for (const event of batchResult.events) {
      this.logEvent(event)
    }
    
    return batchResult.executed
  }
}
```

## Testing Strategy

```typescript
describe('ActionExecutor', () => {
  let executor: ActionExecutor
  let gameState: GameState
  let gameDataStore: GameDataStore
  
  beforeEach(() => {
    executor = new ActionExecutor()
    gameState = createMockGameState()
    gameDataStore = createMockDataStore()
  })
  
  describe('Plant Action', () => {
    it('should plant crop and consume seed', () => {
      gameState.resources.seeds.set('carrot', 5)
      
      const action: GameAction = {
        id: 'plant_1',
        type: 'plant',
        targetId: 'carrot',
        name: 'Plant Carrot',
        energyCost: 0
      }
      
      const result = executor.execute(action, gameState, gameDataStore, systems)
      
      expect(result.success).toBe(true)
      expect(gameState.resources.seeds.get('carrot')).toBe(4)
      expect(gameState.processes.crops).toHaveLength(1)
    })
    
    it('should fail if no seeds available', () => {
      gameState.resources.seeds.set('carrot', 0)
      
      const action: GameAction = {
        id: 'plant_1',
        type: 'plant',
        targetId: 'carrot',
        name: 'Plant Carrot',
        energyCost: 0
      }
      
      const result = executor.execute(action, gameState, gameDataStore, systems)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('No carrot seeds')
    })
  })
  
  describe('Rollback', () => {
    it('should provide rollback function', () => {
      const initialGold = gameState.resources.gold
      
      const action: GameAction = {
        id: 'purchase_1',
        type: 'purchase',
        targetId: 'blueprint_hoe',
        goldCost: 50
      }
      
      const result = executor.execute(action, gameState, gameDataStore, systems)
      
      expect(gameState.resources.gold).toBe(initialGold - 50)
      
      // Rollback
      result.rollback!()
      
      expect(gameState.resources.gold).toBe(initialGold)
    })
  })
})
```

## Benefits After Phase 9E

1. **Unified Execution**: All actions go through same pipeline
2. **Consistent Validation**: Single validation point
3. **Transaction Support**: Rollback capability for all actions
4. **Type Safety**: Strongly typed state changes
5. **SimulationEngine Reduction**: ~600 lines moved out
6. **Better Testing**: Each execution strategy testable in isolation

## Common Pitfalls and Solutions

### Pitfall 1: State Mutation Side Effects
**Problem**: Direct state mutations can cause inconsistencies
**Solution**: Always work with state changes objects, apply atomically

### Pitfall 2: Missing Validation
**Problem**: Actions execute without proper validation
**Solution**: Comprehensive validation before any execution

### Pitfall 3: Event Generation
**Problem**: Events not properly generated for UI updates
**Solution**: Consistent event generation in execution pipeline

### Pitfall 4: Resource Race Conditions
**Problem**: Multiple actions consuming same resources
**Solution**: Atomic batch execution with proper ordering

## Performance Optimizations

1. **Strategy Caching**: Reuse strategy instances
2. **Validation Caching**: Cache prerequisite checks
3. **State Snapshots**: Efficient snapshot creation
4. **Batch Execution**: Process multiple actions efficiently

## Next Phase Preview
Phase 9F will extract state management, creating a centralized state manager with transaction support, validation, and efficient update mechanisms.