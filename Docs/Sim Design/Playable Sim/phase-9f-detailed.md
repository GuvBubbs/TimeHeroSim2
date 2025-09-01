# Phase 9F: Extract State Manager - Detailed Implementation

## Overview
Extract ~500 lines of state management logic from SimulationEngine into a centralized StateManager. This provides atomic state updates, transaction support, validation, and efficient state tracking for all game systems.

## File Structure After Phase 9F

```
src/utils/state/
├── StateManager.ts (new ~200 lines)
├── ResourceManager.ts (new ~150 lines)
├── StateValidator.ts (new ~100 lines)
├── StateSnapshot.ts (new ~50 lines)
└── types/
    ├── StateTypes.ts (new ~50 lines)
    └── TransactionTypes.ts (new ~50 lines)
```

## Current State Management in SimulationEngine

### Methods to Extract (Lines ~2600-3100):
```typescript
// Resource management
- addEnergy(amount: number): void
- consumeEnergy(amount: number): boolean
- addGold(amount: number): void
- spendGold(amount: number): boolean
- addMaterial(material: string, amount: number): void
- consumeMaterial(material: string, amount: number): boolean
- addSeeds(seedType: string, amount: number): void
- consumeSeeds(seedType: string, amount: number): boolean
- addWater(amount: number): void
- consumeWater(amount: number): boolean

// State validation
- validateResourceState(): boolean
- checkResourceCaps(): void
- ensureStateConsistency(): void

// State updates
- updateGameState(changes: Partial<GameState>): void
- mergeStateChanges(target: GameState, changes: StateChanges): void
- applyStateTransaction(transaction: StateTransaction): boolean
```

## 1. StateManager.ts - Core State Orchestration

### Interface Design:
```typescript
export interface IStateManager {
  // Transaction management
  beginTransaction(): TransactionHandle
  commitTransaction(handle: TransactionHandle): boolean
  rollbackTransaction(handle: TransactionHandle): void
  
  // State updates
  updateState(changes: StateChanges): UpdateResult
  batchUpdate(changes: StateChanges[]): BatchUpdateResult
  
  // State queries
  getState(): Readonly<GameState>
  getSnapshot(): StateSnapshot
  restoreSnapshot(snapshot: StateSnapshot): void
  
  // Validation
  validateState(): ValidationResult
  canApplyChanges(changes: StateChanges): boolean
}

export interface TransactionHandle {
  id: string
  snapshot: StateSnapshot
  changes: StateChanges[]
  status: 'pending' | 'committed' | 'rolled_back'
}

export interface UpdateResult {
  success: boolean
  appliedChanges: StateChanges
  validationErrors: string[]
  events: StateEvent[]
}
```

### Implementation:
```typescript
export class StateManager implements IStateManager {
  private gameState: GameState
  private resourceManager: ResourceManager
  private validator: StateValidator
  private transactions: Map<string, TransactionHandle>
  private stateHistory: StateSnapshot[]
  private maxHistorySize: number = 10
  
  constructor(initialState: GameState) {
    this.gameState = initialState
    this.resourceManager = new ResourceManager(this.gameState)
    this.validator = new StateValidator()
    this.transactions = new Map()
    this.stateHistory = []
  }
  
  beginTransaction(): TransactionHandle {
    const handle: TransactionHandle = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      snapshot: this.createSnapshot(),
      changes: [],
      status: 'pending'
    }
    
    this.transactions.set(handle.id, handle)
    return handle
  }
  
  commitTransaction(handle: TransactionHandle): boolean {
    if (handle.status !== 'pending') {
      console.warn(`Transaction ${handle.id} is not pending`)
      return false
    }
    
    try {
      // Validate all changes
      for (const change of handle.changes) {
        if (!this.canApplyChanges(change)) {
          throw new Error('Invalid state changes in transaction')
        }
      }
      
      // Apply all changes atomically
      for (const change of handle.changes) {
        this.applyChangesInternal(change)
      }
      
      // Validate final state
      const validation = this.validator.validate(this.gameState)
      if (!validation.isValid) {
        throw new Error(`State validation failed: ${validation.errors.join(', ')}`)
      }
      
      handle.status = 'committed'
      this.addToHistory(handle.snapshot)
      return true
      
    } catch (error) {
      // Rollback on any error
      this.rollbackTransaction(handle)
      console.error('Transaction failed:', error)
      return false
    }
  }
  
  rollbackTransaction(handle: TransactionHandle): void {
    if (handle.status === 'rolled_back') {
      return
    }
    
    // Restore snapshot
    this.restoreSnapshot(handle.snapshot)
    handle.status = 'rolled_back'
    
    // Clean up
    this.transactions.delete(handle.id)
  }
  
  updateState(changes: StateChanges): UpdateResult {
    // Single update without transaction
    const txn = this.beginTransaction()
    
    try {
      // Validate changes
      if (!this.canApplyChanges(changes)) {
        return {
          success: false,
          appliedChanges: {},
          validationErrors: ['Changes failed validation'],
          events: []
        }
      }
      
      // Apply changes
      this.applyChangesInternal(changes)
      
      // Validate result
      const validation = this.validator.validate(this.gameState)
      if (!validation.isValid) {
        this.rollbackTransaction(txn)
        return {
          success: false,
          appliedChanges: {},
          validationErrors: validation.errors,
          events: []
        }
      }
      
      // Commit
      this.commitTransaction(txn)
      
      return {
        success: true,
        appliedChanges: changes,
        validationErrors: [],
        events: this.generateStateEvents(changes)
      }
      
    } catch (error) {
      this.rollbackTransaction(txn)
      return {
        success: false,
        appliedChanges: {},
        validationErrors: [error.message],
        events: []
      }
    }
  }
  
  private applyChangesInternal(changes: StateChanges): void {
    // Resources
    if (changes.resources) {
      this.resourceManager.updateResources(changes.resources)
    }
    
    // Location
    if (changes.location) {
      Object.assign(this.gameState.location, changes.location)
    }
    
    // Inventory
    if (changes.inventory) {
      this.updateInventory(changes.inventory)
    }
    
    // Processes
    if (changes.processes) {
      this.updateProcesses(changes.processes)
    }
    
    // Farm
    if (changes.farm) {
      Object.assign(this.gameState.farm, changes.farm)
    }
    
    // Systems
    if (changes.systems) {
      this.updateSystems(changes.systems)
    }
    
    // Unlocks
    if (changes.unlocks) {
      for (const unlock of changes.unlocks) {
        this.gameState.unlockedContent.all.add(unlock)
      }
    }
  }
  
  private createSnapshot(): StateSnapshot {
    return new StateSnapshot(
      JSON.parse(JSON.stringify(this.gameState)),
      Date.now()
    )
  }
  
  restoreSnapshot(snapshot: StateSnapshot): void {
    // Deep restore from snapshot
    this.gameState = snapshot.restore()
    
    // Recreate managers with new state reference
    this.resourceManager = new ResourceManager(this.gameState)
  }
  
  private addToHistory(snapshot: StateSnapshot): void {
    this.stateHistory.push(snapshot)
    
    // Trim history if too large
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift()
    }
  }
}
```

## 2. ResourceManager.ts - Specialized Resource Handling

```typescript
export class ResourceManager {
  private gameState: GameState
  
  constructor(gameState: GameState) {
    this.gameState = gameState
  }
  
  updateResources(changes: Partial<Resources>): void {
    // Energy
    if (changes.energy) {
      this.updateEnergy(changes.energy)
    }
    
    // Gold
    if (changes.gold !== undefined) {
      this.updateGold(changes.gold)
    }
    
    // Water
    if (changes.water) {
      this.updateWater(changes.water)
    }
    
    // Seeds
    if (changes.seeds) {
      this.updateSeeds(changes.seeds)
    }
    
    // Materials
    if (changes.materials) {
      this.updateMaterials(changes.materials)
    }
  }
  
  private updateEnergy(energyChanges: Partial<Energy>): void {
    const current = this.gameState.resources.energy
    
    if (energyChanges.current !== undefined) {
      // Enforce caps
      current.current = Math.max(0, Math.min(energyChanges.current, current.max))
    }
    
    if (energyChanges.max !== undefined) {
      current.max = Math.max(1, energyChanges.max)
      // Adjust current if it exceeds new max
      current.current = Math.min(current.current, current.max)
    }
  }
  
  private updateGold(goldAmount: number): void {
    // Never allow negative gold
    this.gameState.resources.gold = Math.max(0, goldAmount)
  }
  
  private updateWater(waterChanges: Partial<Water>): void {
    const current = this.gameState.resources.water
    
    if (waterChanges.current !== undefined) {
      current.current = Math.max(0, Math.min(waterChanges.current, current.max))
    }
    
    if (waterChanges.max !== undefined) {
      current.max = Math.max(1, waterChanges.max)
      current.current = Math.min(current.current, current.max)
    }
  }
  
  private updateSeeds(seeds: Map<string, number>): void {
    // Merge seed changes
    for (const [seedType, amount] of seeds.entries()) {
      if (amount < 0) {
        console.warn(`Attempting to set negative seeds for ${seedType}`)
        continue
      }
      
      this.gameState.resources.seeds.set(seedType, amount)
    }
    
    // Remove seeds with 0 count
    for (const [seedType, amount] of this.gameState.resources.seeds.entries()) {
      if (amount <= 0) {
        this.gameState.resources.seeds.delete(seedType)
      }
    }
  }
  
  private updateMaterials(materials: Map<string, number>): void {
    // Merge material changes
    for (const [material, amount] of materials.entries()) {
      if (amount < 0) {
        console.warn(`Attempting to set negative materials for ${material}`)
        continue
      }
      
      this.gameState.resources.materials.set(material, amount)
    }
    
    // Remove materials with 0 count
    for (const [material, amount] of this.gameState.resources.materials.entries()) {
      if (amount <= 0) {
        this.gameState.resources.materials.delete(material)
      }
    }
  }
  
  // Convenience methods for common operations
  addEnergy(amount: number): boolean {
    const newAmount = Math.min(
      this.gameState.resources.energy.current + amount,
      this.gameState.resources.energy.max
    )
    
    const added = newAmount - this.gameState.resources.energy.current
    this.gameState.resources.energy.current = newAmount
    
    return added > 0
  }
  
  consumeEnergy(amount: number): boolean {
    if (this.gameState.resources.energy.current < amount) {
      return false
    }
    
    this.gameState.resources.energy.current -= amount
    return true
  }
  
  canAfford(cost: ResourceCost): boolean {
    // Check energy
    if (cost.energy && this.gameState.resources.energy.current < cost.energy) {
      return false
    }
    
    // Check gold
    if (cost.gold && this.gameState.resources.gold < cost.gold) {
      return false
    }
    
    // Check materials
    if (cost.materials) {
      for (const [material, required] of Object.entries(cost.materials)) {
        const available = this.gameState.resources.materials.get(material) || 0
        if (available < required) {
          return false
        }
      }
    }
    
    return true
  }
  
  consumeCost(cost: ResourceCost): boolean {
    // Validate first
    if (!this.canAfford(cost)) {
      return false
    }
    
    // Consume resources
    if (cost.energy) {
      this.gameState.resources.energy.current -= cost.energy
    }
    
    if (cost.gold) {
      this.gameState.resources.gold -= cost.gold
    }
    
    if (cost.materials) {
      for (const [material, amount] of Object.entries(cost.materials)) {
        const current = this.gameState.resources.materials.get(material) || 0
        this.gameState.resources.materials.set(material, current - amount)
      }
    }
    
    return true
  }
}
```

## 3. StateValidator.ts - State Consistency Validation

```typescript
export class StateValidator {
  validate(gameState: GameState): ValidationResult {
    const errors: string[] = []
    
    // Resource validation
    const resourceErrors = this.validateResources(gameState.resources)
    errors.push(...resourceErrors)
    
    // Process validation
    const processErrors = this.validateProcesses(gameState.processes)
    errors.push(...processErrors)
    
    // Farm validation
    const farmErrors = this.validateFarm(gameState.farm)
    errors.push(...farmErrors)
    
    // Inventory validation
    const inventoryErrors = this.validateInventory(gameState.inventory)
    errors.push(...inventoryErrors)
    
    // Location validation
    const locationErrors = this.validateLocation(gameState.location)
    errors.push(...locationErrors)
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  private validateResources(resources: Resources): string[] {
    const errors: string[] = []
    
    // Energy validation
    if (resources.energy.current < 0) {
      errors.push('Energy cannot be negative')
    }
    if (resources.energy.current > resources.energy.max) {
      errors.push('Energy exceeds maximum')
    }
    if (resources.energy.max <= 0) {
      errors.push('Energy max must be positive')
    }
    
    // Gold validation
    if (resources.gold < 0) {
      errors.push('Gold cannot be negative')
    }
    
    // Water validation
    if (resources.water.current < 0) {
      errors.push('Water cannot be negative')
    }
    if (resources.water.current > resources.water.max) {
      errors.push('Water exceeds maximum')
    }
    
    // Seeds validation
    for (const [seedType, amount] of resources.seeds.entries()) {
      if (amount < 0) {
        errors.push(`Seed ${seedType} has negative amount`)
      }
    }
    
    // Materials validation
    for (const [material, amount] of resources.materials.entries()) {
      if (amount < 0) {
        errors.push(`Material ${material} has negative amount`)
      }
    }
    
    return errors
  }
  
  private validateProcesses(processes: Processes): string[] {
    const errors: string[] = []
    
    // Crop validation
    const plotIndices = new Set<number>()
    for (const crop of processes.crops) {
      if (plotIndices.has(crop.plotIndex)) {
        errors.push(`Duplicate crop on plot ${crop.plotIndex}`)
      }
      plotIndices.add(crop.plotIndex)
      
      if (crop.currentStage < 0 || crop.currentStage > crop.totalStages) {
        errors.push(`Invalid crop stage for ${crop.id}`)
      }
    }
    
    // Adventure validation
    if (processes.adventure) {
      if (processes.adventure.progress < 0 || processes.adventure.progress > 1) {
        errors.push('Adventure progress out of bounds')
      }
    }
    
    // Crafting validation
    if (processes.crafting) {
      if (processes.crafting.progress < 0 || processes.crafting.progress > 1) {
        errors.push('Crafting progress out of bounds')
      }
    }
    
    return errors
  }
  
  private validateFarm(farm: Farm): string[] {
    const errors: string[] = []
    
    if (farm.plots < 0) {
      errors.push('Farm plots cannot be negative')
    }
    
    if (farm.plots > 90) {
      errors.push('Farm plots exceed maximum (90)')
    }
    
    // Check that crops don't exceed plots
    const cropCount = farm.crops?.length || 0
    if (cropCount > farm.plots) {
      errors.push(`More crops (${cropCount}) than plots (${farm.plots})`)
    }
    
    return errors
  }
  
  private validateInventory(inventory: Inventory): string[] {
    const errors: string[] = []
    
    // Validate weapon counts
    for (const [weapon, level] of inventory.weapons.entries()) {
      if (level < 1 || level > 10) {
        errors.push(`Invalid weapon level for ${weapon}: ${level}`)
      }
    }
    
    // Validate armor
    if (inventory.armor.length > 3) {
      errors.push('Too many armor pieces (max 3)')
    }
    
    return errors
  }
  
  private validateLocation(location: Location): string[] {
    const errors: string[] = []
    
    const validLocations: GameLocation[] = ['farm', 'town', 'tower', 'forge', 'mine', 'adventure']
    
    if (!validLocations.includes(location.current)) {
      errors.push(`Invalid current location: ${location.current}`)
    }
    
    if (location.lastVisited && !validLocations.includes(location.lastVisited)) {
      errors.push(`Invalid last visited location: ${location.lastVisited}`)
    }
    
    return errors
  }
}
```

## 4. StateSnapshot.ts - Efficient State Snapshots

```typescript
export class StateSnapshot {
  private readonly data: string
  private readonly timestamp: number
  private readonly checksum: string
  
  constructor(gameState: GameState, timestamp: number) {
    this.data = this.serialize(gameState)
    this.timestamp = timestamp
    this.checksum = this.calculateChecksum(this.data)
  }
  
  restore(): GameState {
    const parsed = JSON.parse(this.data)
    
    // Restore Maps
    parsed.resources.seeds = new Map(parsed.resources.seeds)
    parsed.resources.materials = new Map(parsed.resources.materials)
    parsed.inventory.tools = new Map(parsed.inventory.tools)
    parsed.inventory.weapons = new Map(parsed.inventory.weapons)
    parsed.unlockedContent.all = new Set(parsed.unlockedContent.all)
    parsed.unlockedContent.purchasedBlueprints = new Set(parsed.unlockedContent.purchasedBlueprints)
    parsed.unlockedContent.builtStructures = new Set(parsed.unlockedContent.builtStructures)
    parsed.unlockedContent.adventureRoutes = new Set(parsed.unlockedContent.adventureRoutes)
    
    return parsed as GameState
  }
  
  private serialize(gameState: GameState): string {
    // Convert Maps and Sets to arrays for serialization
    const serializable = {
      ...gameState,
      resources: {
        ...gameState.resources,
        seeds: Array.from(gameState.resources.seeds.entries()),
        materials: Array.from(gameState.resources.materials.entries())
      },
      inventory: {
        ...gameState.inventory,
        tools: Array.from(gameState.inventory.tools.entries()),
        weapons: Array.from(gameState.inventory.weapons.entries())
      },
      unlockedContent: {
        ...gameState.unlockedContent,
        all: Array.from(gameState.unlockedContent.all),
        purchasedBlueprints: Array.from(gameState.unlockedContent.purchasedBlueprints),
        builtStructures: Array.from(gameState.unlockedContent.builtStructures),
        adventureRoutes: Array.from(gameState.unlockedContent.adventureRoutes)
      }
    }
    
    return JSON.stringify(serializable)
  }
  
  private calculateChecksum(data: string): string {
    // Simple checksum for validation
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }
  
  isValid(): boolean {
    return this.calculateChecksum(this.data) === this.checksum
  }
  
  getTimestamp(): number {
    return this.timestamp
  }
  
  getSize(): number {
    return this.data.length
  }
}
```

## Migration Strategy for Phase 9F

### Step 1: Create State Module
```bash
mkdir -p src/utils/state/types
touch src/utils/state/StateManager.ts
touch src/utils/state/ResourceManager.ts
touch src/utils/state/StateValidator.ts
touch src/utils/state/StateSnapshot.ts
```

### Step 2: Update SimulationEngine
```typescript
// SimulationEngine.ts
import { StateManager } from './state/StateManager'

export class SimulationEngine {
  private stateManager: StateManager
  
  constructor(config: SimulationConfig, gameDataStore: GameDataStore) {
    this.stateManager = new StateManager(this.createInitialState())
    // ...
  }
  
  // Replace direct state access
  get gameState(): Readonly<GameState> {
    return this.stateManager.getState()
  }
  
  // Use StateManager for updates
  private applyStateChanges(changes: StateChanges): boolean {
    const result = this.stateManager.updateState(changes)
    
    if (!result.success) {
      console.error('State update failed:', result.validationErrors)
      return false
    }
    
    // Log state events
    for (const event of result.events) {
      this.logEvent(event)
    }
    
    return true
  }
  
  // Transaction support for complex operations
  private executeComplexOperation(): boolean {
    const txn = this.stateManager.beginTransaction()
    
    try {
      // Multiple state changes
      this.stateManager.updateState(changes1)
      this.stateManager.updateState(changes2)
      this.stateManager.updateState(changes3)
      
      // Commit if all successful
      return this.stateManager.commitTransaction(txn)
      
    } catch (error) {
      // Automatic rollback
      this.stateManager.rollbackTransaction(txn)
      return false
    }
  }
}
```

### Step 3: Update Systems to Use StateManager
```typescript
// In system files
export class AdventureSystem {
  executeAction(
    action: GameAction,
    stateManager: IStateManager,
    gameDataStore: GameDataStore
  ): ActionResult {
    // Read current state
    const gameState = stateManager.getState()
    
    // Calculate changes
    const stateChanges = this.calculateChanges(action, gameState)
    
    // Apply through StateManager
    const result = stateManager.updateState(stateChanges)
    
    return {
      success: result.success,
      stateChanges: result.appliedChanges,
      events: result.events,
      error: result.validationErrors.join('; ')
    }
  }
}
```

## Testing Strategy

```typescript
describe('StateManager', () => {
  let stateManager: StateManager
  let initialState: GameState
  
  beforeEach(() => {
    initialState = createMockGameState()
    stateManager = new StateManager(initialState)
  })
  
  describe('Transactions', () => {
    it('should rollback failed transaction', () => {
      const txn = stateManager.beginTransaction()
      
      // Make invalid change
      const invalidChanges: StateChanges = {
        resources: {
          energy: { current: -100 } // Negative energy
        }
      }
      
      stateManager.updateState(invalidChanges)
      const success = stateManager.commitTransaction(txn)
      
      expect(success).toBe(false)
      expect(stateManager.getState().resources.energy.current).toBe(
        initialState.resources.energy.current
      )
    })
    
    it('should commit valid transaction', () => {
      const txn = stateManager.beginTransaction()
      
      const changes: StateChanges = {
        resources: {
          gold: 100
        }
      }
      
      stateManager.updateState(changes)
      const success = stateManager.commitTransaction(txn)
      
      expect(success).toBe(true)
      expect(stateManager.getState().resources.gold).toBe(100)
    })
  })
  
  describe('Validation', () => {
    it('should prevent invalid state', () => {
      const invalidChanges: StateChanges = {
        resources: {
          energy: { current: 1000, max: 100 } // Current exceeds max
        }
      }
      
      const result = stateManager.updateState(invalidChanges)
      
      expect(result.success).toBe(false)
      expect(result.validationErrors).toContain('Energy exceeds maximum')
    })
  })
  
  describe('Snapshots', () => {
    it('should restore from snapshot', () => {
      const snapshot = stateManager.getSnapshot()
      
      // Make changes
      stateManager.updateState({
        resources: { gold: 999 }
      })
      
      // Restore
      stateManager.restoreSnapshot(snapshot)
      
      expect(stateManager.getState().resources.gold).toBe(
        initialState.resources.gold
      )
    })
  })
})
```

## Benefits After Phase 9F

1. **Atomic Updates**: All state changes are atomic with rollback
2. **Validation**: Comprehensive state validation prevents corruption
3. **Transaction Support**: Complex operations with all-or-nothing semantics
4. **History Tracking**: State snapshots for debugging and undo
5. **SimulationEngine Reduction**: ~500 lines moved out
6. **Type Safety**: Strongly typed state changes and validation

## Common Pitfalls and Solutions

### Pitfall 1: Direct State Mutation
**Problem**: Code directly mutates gameState bypassing StateManager
**Solution**: Make gameState readonly, all changes through StateManager

### Pitfall 2: Lost Events
**Problem**: State changes don't generate proper events
**Solution**: Event generation built into StateManager

### Pitfall 3: Performance
**Problem**: Snapshots and validation slow down simulation
**Solution**: Optimize snapshot creation, cache validation results

### Pitfall 4: Memory Leaks
**Problem**: Transaction history grows unbounded
**Solution**: Limit history size, clean up completed transactions

## Performance Optimizations

1. **Lazy Snapshots**: Only create when transaction begins
2. **Incremental Validation**: Only validate changed parts
3. **Batch Updates**: Group multiple changes into single validation
4. **Copy-on-Write**: Share unchanged data between snapshots

## Next Phase Preview
Phase 9G will extract process management, consolidating all ongoing activities (crops, crafting, mining, adventures) into a unified ProcessManager with lifecycle management and completion callbacks.