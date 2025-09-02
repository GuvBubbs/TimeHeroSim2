# Phase 10C: Extract Process Management - Focused Refactor

## Objective
Consolidate ALL ongoing process handling (crops, crafting, mining, seed catching) into a unified ProcessManager.

## Current State
- Process handling scattered in SimulationEngine
- `processOngoingActivities()` is a huge method
- Different process types handled inconsistently

## Target State
- Create `src/utils/processes/ProcessManager.ts` (~400 lines)
- Uniform handling for all process types
- SimulationEngine reduced to ~2500 lines

## Files to Create

### 1. Create `src/utils/processes/ProcessManager.ts`

```typescript
export class ProcessManager {
  private processes: Map<string, Process>
  
  constructor(
    private stateManager: IStateManager,
    private eventBus: IEventBus
  ) {
    this.processes = new Map()
  }

  // Main interface
  tick(deltaTime: number, gameState: GameState, gameDataStore: GameDataStore): ProcessTickResult
  startProcess(type: ProcessType, data: any): string // returns processId
  cancelProcess(processId: string): boolean
  getActiveProcesses(): Process[]
  
  // Process handlers (extract from SimulationEngine)
  private processCrops(deltaTime: number, gameState: GameState): UpdateResult
  private processCrafting(deltaTime: number, gameState: GameState): UpdateResult
  private processMining(deltaTime: number, gameState: GameState): UpdateResult
  private processSeedCatching(deltaTime: number, gameState: GameState): UpdateResult
  private processBuilding(deltaTime: number, gameState: GameState): UpdateResult
}
```

### 2. Process Types

```typescript
interface Process {
  id: string
  type: ProcessType
  startTime: number
  duration: number
  progress: number
  data: any
}

type ProcessType = 'crop' | 'crafting' | 'mining' | 'adventure' | 'seed_catching' | 'building'

interface ProcessTickResult {
  updated: Process[]
  completed: Process[]
  failed: Process[]
  stateChanges: StateChanges[]
}
```

## Extraction Instructions

### Step 1: Find all process handling
Look for in SimulationEngine:
- `processOngoingActivities()` - Main method to extract
- `processCrop*`
- `processCraft*`
- `processMining*`
- `processSeed*`
- Any method with "process" in name

### Step 2: Create unified tick handler
```typescript
tick(deltaTime: number, gameState: GameState, gameDataStore: GameDataStore): ProcessTickResult {
  const result: ProcessTickResult = {
    updated: [],
    completed: [],
    failed: [],
    stateChanges: []
  }
  
  // Process each type
  if (gameState.processes.crops?.length > 0) {
    const cropResult = this.processCrops(deltaTime, gameState)
    result.updated.push(...cropResult.updated)
    // etc...
  }
  
  // Apply all state changes at once
  if (result.stateChanges.length > 0) {
    this.stateManager.batchUpdate(result.stateChanges)
  }
  
  return result
}
```

### Step 3: Update SimulationEngine
```typescript
// Replace processOngoingActivities with:
const processResult = this.processManager.tick(deltaTime, this.gameState, this.gameDataStore)

// Handle results
for (const completed of processResult.completed) {
  this.handleProcessCompletion(completed)
}
```

## Critical Fix to Include
**Seed Catching Completion Bug**: Make sure the seed catching process actually completes!
```typescript
private processSeedCatching(deltaTime: number, gameState: GameState): UpdateResult {
  const process = gameState.processes.seedCatching
  if (!process) return { updated: [], completed: [] }
  
  // UPDATE PROGRESS (this was missing!)
  process.elapsedTime = (process.elapsedTime || 0) + deltaTime
  
  if (process.elapsedTime >= process.duration) {
    // Award seeds and mark complete
    const seeds = this.calculateSeedReward(process)
    return {
      updated: [],
      completed: [{ ...process, reward: seeds }]
    }
  }
  
  return { updated: [process], completed: [] }
}
```

## Success Criteria
- [ ] All process handling in ProcessManager
- [ ] Seed catching bug fixed
- [ ] Consistent process lifecycle
- [ ] SimulationEngine ~2500 lines

## Time Estimate
2-3 hours (more complex due to variety of process types)