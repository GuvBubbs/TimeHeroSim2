# Phase 9G: Extract Process Manager - Detailed Implementation

## Overview
Extract ~400 lines of ongoing process management from SimulationEngine into a unified ProcessManager. This consolidates crop growth, crafting, mining, adventures, and seed catching into a single system with consistent lifecycle management.

## File Structure After Phase 9G

```
src/utils/processes/
├── ProcessManager.ts (new ~200 lines)
├── ProcessRegistry.ts (new ~100 lines)
├── ProcessLifecycle.ts (new ~50 lines)
└── types/
    ├── ProcessTypes.ts (new ~50 lines)
    └── ProcessHandlers.ts (new ~100 lines)
```

## Current Process Management in SimulationEngine

### Methods to Extract (Lines ~3100-3500):
```typescript
// Process orchestration
- processOngoingActivities(deltaTime: number): ProcessEvent[]
- checkProcessCompletions(): CompletedProcess[]
- cleanupCompletedProcesses(): void

// Specific process handling
- processCropGrowth(deltaTime: number): void
- processAdventure(deltaTime: number): void
- processCrafting(deltaTime: number): void
- processMining(deltaTime: number): void
- processSeedCatching(deltaTime: number): void
- processHelperTraining(deltaTime: number): void

// Process lifecycle
- startProcess(type: ProcessType, data: any): boolean
- updateProcess(processId: string, updates: any): void
- completeProcess(processId: string): ProcessResult
- cancelProcess(processId: string): void
```

## 1. ProcessManager.ts - Central Process Orchestration

### Interface Design:
```typescript
export interface IProcessManager {
  // Process lifecycle
  startProcess(type: ProcessType, data: ProcessData): ProcessHandle
  updateProcess(handle: ProcessHandle, deltaTime: number): ProcessUpdateResult
  completeProcess(handle: ProcessHandle): ProcessCompletionResult
  cancelProcess(handle: ProcessHandle): void
  
  // Batch processing
  tick(deltaTime: number, gameState: GameState, gameDataStore: GameDataStore): TickResult
  
  // Process queries
  getActiveProcesses(): ProcessHandle[]
  getProcess(id: string): ProcessHandle | undefined
  hasActiveProcess(type: ProcessType): boolean
  
  // Registration
  registerHandler(type: ProcessType, handler: IProcessHandler): void
}

export interface ProcessHandle {
  id: string
  type: ProcessType
  data: ProcessData
  startTime: number
  lastUpdate: number
  progress: number
  state: ProcessState
}

export interface ProcessUpdateResult {
  handle: ProcessHandle
  stateChanges: StateChanges
  events: ProcessEvent[]
  completed: boolean
}

export interface TickResult {
  updated: ProcessHandle[]
  completed: ProcessHandle[]
  stateChanges: StateChanges
  events: ProcessEvent[]
}

export type ProcessType = 
  | 'crop_growth'
  | 'adventure'
  | 'crafting'
  | 'mining'
  | 'seed_catching'
  | 'helper_training'
  | 'building'

export type ProcessState = 
  | 'starting'
  | 'running'
  | 'completing'
  | 'completed'
  | 'cancelled'
  | 'failed'
```

### Implementation:
```typescript
export class ProcessManager implements IProcessManager {
  private processes: Map<string, ProcessHandle>
  private handlers: Map<ProcessType, IProcessHandler>
  private registry: ProcessRegistry
  private nextProcessId: number = 1
  
  constructor() {
    this.processes = new Map()
    this.handlers = new Map()
    this.registry = new ProcessRegistry()
    this.initializeHandlers()
  }
  
  startProcess(type: ProcessType, data: ProcessData): ProcessHandle {
    const handler = this.handlers.get(type)
    if (!handler) {
      throw new Error(`No handler registered for process type: ${type}`)
    }
    
    // Validate process can start
    const validation = handler.canStart(data)
    if (!validation.valid) {
      throw new Error(`Cannot start process: ${validation.error}`)
    }
    
    // Create process handle
    const handle: ProcessHandle = {
      id: `${type}_${this.nextProcessId++}_${Date.now()}`,
      type,
      data,
      startTime: Date.now(),
      lastUpdate: Date.now(),
      progress: 0,
      state: 'starting'
    }
    
    // Initialize through handler
    const initResult = handler.initialize(handle, data)
    if (initResult.stateChanges) {
      handle.data = { ...handle.data, ...initResult.stateChanges }
    }
    
    // Register process
    this.processes.set(handle.id, handle)
    handle.state = 'running'
    
    return handle
  }
  
  tick(deltaTime: number, gameState: GameState, gameDataStore: GameDataStore): TickResult {
    const updated: ProcessHandle[] = []
    const completed: ProcessHandle[] = []
    const allStateChanges: StateChanges = {}
    const allEvents: ProcessEvent[] = []
    
    // Process each active process
    for (const handle of this.processes.values()) {
      if (handle.state !== 'running') continue
      
      const handler = this.handlers.get(handle.type)
      if (!handler) continue
      
      // Update process
      const updateResult = handler.update(handle, deltaTime, gameState, gameDataStore)
      
      // Apply state changes
      this.mergeStateChanges(allStateChanges, updateResult.stateChanges)
      allEvents.push(...updateResult.events)
      
      // Update handle
      handle.progress = updateResult.progress
      handle.lastUpdate = Date.now()
      updated.push(handle)
      
      // Check completion
      if (updateResult.completed) {
        const completionResult = this.completeProcess(handle)
        this.mergeStateChanges(allStateChanges, completionResult.stateChanges)
        allEvents.push(...completionResult.events)
        completed.push(handle)
      }
    }
    
    // Clean up completed processes
    for (const handle of completed) {
      this.processes.delete(handle.id)
    }
    
    return {
      updated,
      completed,
      stateChanges: allStateChanges,
      events: allEvents
    }
  }
  
  completeProcess(handle: ProcessHandle): ProcessCompletionResult {
    const handler = this.handlers.get(handle.type)
    if (!handler) {
      throw new Error(`No handler for process type: ${handle.type}`)
    }
    
    handle.state = 'completing'
    
    // Get completion result from handler
    const result = handler.complete(handle)
    
    handle.state = 'completed'
    
    return result
  }
  
  private initializeHandlers(): void {
    // Register all process handlers
    this.registerHandler('crop_growth', new CropGrowthHandler())
    this.registerHandler('adventure', new AdventureHandler())
    this.registerHandler('crafting', new CraftingHandler())
    this.registerHandler('mining', new MiningHandler())
    this.registerHandler('seed_catching', new SeedCatchingHandler())
    this.registerHandler('helper_training', new HelperTrainingHandler())
  }
  
  registerHandler(type: ProcessType, handler: IProcessHandler): void {
    this.handlers.set(type, handler)
    this.registry.register(type, handler.getMetadata())
  }
  
  private mergeStateChanges(target: StateChanges, source: StateChanges): void {
    // Merge resources
    if (source.resources) {
      target.resources = {
        ...target.resources,
        ...source.resources
      }
    }
    
    // Merge other changes...
    // Implementation continues...
  }
}
```

## 2. Process Handlers - Type-Specific Logic

### Handler Interface:
```typescript
export interface IProcessHandler {
  // Lifecycle methods
  canStart(data: ProcessData): ValidationResult
  initialize(handle: ProcessHandle, data: ProcessData): InitResult
  update(handle: ProcessHandle, deltaTime: number, gameState: GameState, gameDataStore: GameDataStore): ProcessUpdateResult
  complete(handle: ProcessHandle): ProcessCompletionResult
  cancel(handle: ProcessHandle): void
  
  // Metadata
  getMetadata(): ProcessMetadata
}

export interface ProcessMetadata {
  type: ProcessType
  name: string
  description: string
  maxConcurrent: number
  canPause: boolean
  canCancel: boolean
}
```

### Example Handler - CropGrowthHandler:
```typescript
export class CropGrowthHandler implements IProcessHandler {
  canStart(data: ProcessData): ValidationResult {
    // Validate crop can be planted
    if (!data.cropId) {
      return { valid: false, error: 'No crop specified' }
    }
    
    if (!data.plotIndex && data.plotIndex !== 0) {
      return { valid: false, error: 'No plot specified' }
    }
    
    return { valid: true }
  }
  
  initialize(handle: ProcessHandle, data: ProcessData): InitResult {
    return {
      stateChanges: {
        plantedAt: handle.startTime,
        currentStage: 0,
        lastWatered: handle.startTime,
        isWatered: true,
        growthProgress: 0
      }
    }
  }
  
  update(
    handle: ProcessHandle,
    deltaTime: number,
    gameState: GameState,
    gameDataStore: GameDataStore
  ): ProcessUpdateResult {
    const cropData = gameDataStore.getItemById(handle.data.cropId)
    if (!cropData) {
      return this.createErrorResult(handle, 'Crop data not found')
    }
    
    const stateChanges: StateChanges = {}
    const events: ProcessEvent[] = []
    
    // Check water status
    const waterStatus = this.checkWaterStatus(handle, gameState)
    if (waterStatus.needsWater) {
      events.push({
        type: 'crop_needs_water',
        processId: handle.id,
        message: `Crop at plot ${handle.data.plotIndex} needs water`
      })
    }
    
    // Calculate growth rate
    const growthRate = waterStatus.isWatered ? 1.0 : 0.3 // 30% speed when dry
    const growthDuration = cropData.duration * 60 // Convert to seconds
    
    // Update progress
    const progressDelta = (deltaTime / growthDuration) * growthRate
    handle.progress = Math.min(1.0, handle.progress + progressDelta)
    
    // Check stage progression
    const totalStages = cropData.stages || 3
    const currentStage = Math.floor(handle.progress * totalStages)
    
    if (currentStage > handle.data.currentStage) {
      handle.data.currentStage = currentStage
      events.push({
        type: 'crop_stage_complete',
        processId: handle.id,
        message: `${cropData.name} reached stage ${currentStage}/${totalStages}`
      })
    }
    
    // Check completion
    const completed = handle.progress >= 1.0
    
    return {
      handle,
      stateChanges,
      events,
      completed
    }
  }
  
  complete(handle: ProcessHandle): ProcessCompletionResult {
    const cropData = handle.data
    
    return {
      stateChanges: {
        // Mark crop as ready for harvest
        processes: {
          readyCrops: [
            {
              id: handle.id,
              cropId: cropData.cropId,
              plotIndex: cropData.plotIndex,
              maturedAt: Date.now()
            }
          ]
        }
      },
      events: [
        {
          type: 'crop_ready',
          processId: handle.id,
          message: `${cropData.cropId} is ready to harvest at plot ${cropData.plotIndex}`
        }
      ],
      rewards: {
        // No immediate rewards - player must harvest
      }
    }
  }
  
  cancel(handle: ProcessHandle): void {
    // Remove crop from plot
    handle.state = 'cancelled'
  }
  
  getMetadata(): ProcessMetadata {
    return {
      type: 'crop_growth',
      name: 'Crop Growth',
      description: 'Manages crop growth cycles',
      maxConcurrent: 90, // Max farm plots
      canPause: false,
      canCancel: true
    }
  }
  
  private checkWaterStatus(handle: ProcessHandle, gameState: GameState): WaterStatus {
    const timeSinceWatered = Date.now() - handle.data.lastWatered
    const waterDuration = 30 * 60 * 1000 // 30 minutes
    
    return {
      isWatered: timeSinceWatered < waterDuration,
      needsWater: timeSinceWatered > waterDuration * 0.8,
      dryTime: Math.max(0, timeSinceWatered - waterDuration)
    }
  }
}
```

### SeedCatchingHandler - Fix for Current Bug:
```typescript
export class SeedCatchingHandler implements IProcessHandler {
  update(
    handle: ProcessHandle,
    deltaTime: number,
    gameState: GameState,
    gameDataStore: GameDataStore
  ): ProcessUpdateResult {
    // FIX: Properly track elapsed time
    const elapsedTime = (handle.data.elapsedTime || 0) + deltaTime
    handle.data.elapsedTime = elapsedTime
    
    // Default 5-minute sessions
    const sessionDuration = handle.data.duration || 300
    
    // Update progress
    handle.progress = Math.min(1.0, elapsedTime / sessionDuration)
    
    // Check completion
    const completed = elapsedTime >= sessionDuration
    
    const events: ProcessEvent[] = []
    
    if (completed) {
      events.push({
        type: 'seed_catching_session_complete',
        processId: handle.id,
        message: `Completed ${sessionDuration / 60} minute seed catching session`
      })
    }
    
    return {
      handle,
      stateChanges: {},
      events,
      completed
    }
  }
  
  complete(handle: ProcessHandle): ProcessCompletionResult {
    // Calculate seeds caught based on wind level and duration
    const windLevel = handle.data.windLevel || 1
    const duration = handle.data.duration || 300
    const catchRate = this.getCatchRate(windLevel)
    
    // Calculate seeds caught
    const seedsCaught = Math.floor((duration / 60) * catchRate)
    
    // Determine seed types based on wind level
    const seedTypes = this.getSeedTypes(windLevel)
    const seedsPerType = Math.floor(seedsCaught / seedTypes.length)
    
    const seedRewards: Map<string, number> = new Map()
    for (const seedType of seedTypes) {
      seedRewards.set(seedType, seedsPerType)
    }
    
    return {
      stateChanges: {
        resources: {
          seeds: seedRewards
        }
      },
      events: [
        {
          type: 'seeds_collected',
          processId: handle.id,
          message: `Caught ${seedsCaught} seeds at wind level ${windLevel}`
        }
      ],
      rewards: {
        seeds: Object.fromEntries(seedRewards)
      }
    }
  }
  
  private getCatchRate(windLevel: number): number {
    // Seeds per minute by wind level
    const rates = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6]
    return rates[Math.min(windLevel - 1, rates.length - 1)]
  }
  
  private getSeedTypes(windLevel: number): string[] {
    // Seed types available at each wind level
    const seedsByLevel = [
      ['carrot', 'radish'],
      ['potato', 'turnip'],
      ['corn', 'tomato'],
      ['strawberry', 'spinach'],
      ['onion', 'garlic'],
      ['cucumber', 'leek'],
      ['wheat', 'asparagus'],
      ['cauliflower', 'pumpkin'],
      ['watermelon', 'pineapple'],
      ['beetroot', 'yam']
    ]
    
    // Return all seeds up to this wind level
    const available: string[] = []
    for (let i = 0; i < Math.min(windLevel, seedsByLevel.length); i++) {
      available.push(...seedsByLevel[i])
    }
    
    return available
  }
}
```

## 3. ProcessRegistry.ts - Process Metadata Management

```typescript
export class ProcessRegistry {
  private registry: Map<ProcessType, ProcessMetadata>
  private activeCount: Map<ProcessType, number>
  
  constructor() {
    this.registry = new Map()
    this.activeCount = new Map()
  }
  
  register(type: ProcessType, metadata: ProcessMetadata): void {
    this.registry.set(type, metadata)
    this.activeCount.set(type, 0)
  }
  
  canStart(type: ProcessType): boolean {
    const metadata = this.registry.get(type)
    if (!metadata) return false
    
    const current = this.activeCount.get(type) || 0
    return current < metadata.maxConcurrent
  }
  
  incrementActive(type: ProcessType): void {
    const current = this.activeCount.get(type) || 0
    this.activeCount.set(type, current + 1)
  }
  
  decrementActive(type: ProcessType): void {
    const current = this.activeCount.get(type) || 0
    this.activeCount.set(type, Math.max(0, current - 1))
  }
  
  getMetadata(type: ProcessType): ProcessMetadata | undefined {
    return this.registry.get(type)
  }
  
  getAllMetadata(): ProcessMetadata[] {
    return Array.from(this.registry.values())
  }
  
  getActiveCount(type: ProcessType): number {
    return this.activeCount.get(type) || 0
  }
  
  getTotalActive(): number {
    let total = 0
    for (const count of this.activeCount.values()) {
      total += count
    }
    return total
  }
}
```

## Migration Strategy for Phase 9G

### Step 1: Create Process Module
```bash
mkdir -p src/utils/processes/types
touch src/utils/processes/ProcessManager.ts
touch src/utils/processes/ProcessRegistry.ts
touch src/utils/processes/ProcessLifecycle.ts
```

### Step 2: Create Handlers for Each Process Type
```typescript
// Create handler for each process type
touch src/utils/processes/handlers/CropGrowthHandler.ts
touch src/utils/processes/handlers/AdventureHandler.ts
touch src/utils/processes/handlers/CraftingHandler.ts
touch src/utils/processes/handlers/MiningHandler.ts
touch src/utils/processes/handlers/SeedCatchingHandler.ts
touch src/utils/processes/handlers/HelperTrainingHandler.ts
```

### Step 3: Update SimulationEngine
```typescript
// SimulationEngine.ts
import { ProcessManager } from './processes/ProcessManager'

export class SimulationEngine {
  private processManager: ProcessManager
  
  constructor(config: SimulationConfig, gameDataStore: GameDataStore) {
    this.processManager = new ProcessManager()
    // ...
  }
  
  // Simplified tick processing
  tick(): TickResult {
    // Update time
    this.updateTime(deltaTime)
    
    // Process all ongoing activities through ProcessManager
    const processResult = this.processManager.tick(
      deltaTime,
      this.gameState,
      this.gameDataStore
    )
    
    // Apply state changes from processes
    if (processResult.stateChanges) {
      this.stateManager.updateState(processResult.stateChanges)
    }
    
    // Log process events
    for (const event of processResult.events) {
      this.logEvent(event)
    }
    
    // Continue with decision making...
  }
  
  // Start new processes through ProcessManager
  private startAdventure(routeId: string, length: string): boolean {
    try {
      const handle = this.processManager.startProcess('adventure', {
        routeId,
        length,
        startTime: this.gameState.time.totalMinutes
      })
      
      return true
    } catch (error) {
      console.error('Failed to start adventure:', error)
      return false
    }
  }
}
```

## Testing Strategy

```typescript
describe('ProcessManager', () => {
  let processManager: ProcessManager
  let gameState: GameState
  
  beforeEach(() => {
    processManager = new ProcessManager()
    gameState = createMockGameState()
  })
  
  describe('Crop Growth', () => {
    it('should handle complete crop lifecycle', () => {
      // Start crop
      const handle = processManager.startProcess('crop_growth', {
        cropId: 'carrot',
        plotIndex: 0,
        duration: 600 // 10 minutes
      })
      
      expect(handle.state).toBe('running')
      
      // Simulate time passing
      const result1 = processManager.tick(300, gameState, gameDataStore)
      expect(handle.progress).toBeCloseTo(0.5, 2)
      
      // Complete growth
      const result2 = processManager.tick(300, gameState, gameDataStore)
      expect(result2.completed).toContain(handle)
    })
  })
  
  describe('Seed Catching Bug Fix', () => {
    it('should complete seed catching after duration', () => {
      const handle = processManager.startProcess('seed_catching', {
        windLevel: 3,
        duration: 300 // 5 minutes
      })
      
      // Process full duration
      const result = processManager.tick(300, gameState, gameDataStore)
      
      expect(result.completed).toContain(handle)
      expect(result.stateChanges.resources?.seeds).toBeDefined()
    })
  })
})
```

## Benefits After Phase 9G

1. **Unified Process Management**: All processes handled consistently
2. **Bug Fix**: Seed catching completion properly handled
3. **Lifecycle Management**: Clear start/update/complete flow
4. **Process Registry**: Track and limit concurrent processes
5. **SimulationEngine Reduction**: ~400 lines moved out
6. **Extensibility**: Easy to add new process types

## Common Pitfalls and Solutions

### Pitfall 1: Process State Synchronization
**Problem**: Process state gets out of sync with game state
**Solution**: Single source of truth in ProcessManager

### Pitfall 2: Memory Leaks
**Problem**: Completed processes not cleaned up
**Solution**: Automatic cleanup after completion

### Pitfall 3: Performance
**Problem**: Too many processes updating every tick
**Solution**: Process priorities and update throttling

## Next Phase Preview
Phase 9H will extract prerequisites and validation, creating a comprehensive validation service that handles all prerequisite checking, dependency validation, and game rule enforcement.