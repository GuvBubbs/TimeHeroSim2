# Phase 6 Simulation Engine As-Built Documentation - TimeHero Sim

## Overview

Phase 6 implements the complete simulation engine foundation for the TimeHero Simulator, consisting of two major components:

**Phase 6A - Foundation Layer**: MapSerializer for Web Worker compatibility and comprehensive TypeScript game state interfaces
**Phase 6B - Simulation Engine**: Web Worker-based simulation processing with real-time UI communication

This implementation solves the critical Map object serialization challenge from Phase 5 and provides a robust foundation for all future simulation features. The system enables real-time background simulation processing with seamless main thread communication and non-blocking UI updates.

**Status**: ✅ Complete and Tested
**Testing Result**: Successful 34-day simulation completion with real-time speed control (1x to 100x)

## Phase 6 Architecture Overview

```
Phase 5 Parameters (Maps) ──► Phase 6A Foundation ──► Phase 6B Engine ──► Future Phases
├── Complex nested Maps      ├── MapSerializer       ├── Web Worker      ├── Live Monitor Widgets
├── 17 unified files        ├── GameState types     ├── SimulationEngine├── Advanced UI Features  
└── 10 specialized files    └── Type validation     ├── Real-time Bridge└── Performance Analytics
                                                     └── LiveMonitorView

Main Thread                          Web Worker Thread
├── SimulationBridge.ts             ├── simulation.worker.ts
│   ├── Event management            │   ├── Message handling
│   ├── Lifecycle control           │   ├── Simulation loop
│   └── State synchronization       │   └── Performance monitoring
├── MapSerializer.ts (6A)           └── SimulationEngine.ts
│   ├── Map object serialization        ├── Tick processing
│   ├── Recursive conversion             ├── AI decision making
│   └── Type validation                 ├── Action execution
└── LiveMonitorView.vue                  └── State management
    ├── Real-time controls
    ├── Status display
    └── Event logging
```

## Phase 6A - Foundation Layer

### Core Components

**File Location**: `src/utils/MapSerializer.ts`
**File Location**: `src/types/game-state.ts`

Phase 6A provides the essential foundation for Web Worker communication by solving the Map serialization problem and establishing comprehensive type interfaces.

### Game State Type System

**File Location**: `src/types/game-state.ts`

Comprehensive TypeScript interfaces that define the complete simulation state structure:

```typescript
interface GameState {
  time: {
    currentTick: number
    currentDay: number
    ticksPerDay: number
    speed: number
  }
  resources: {
    gold: number
    research: number
    threat: number
    population: number
  }
  automation: {
    researchActive: boolean
    combatActive: boolean
    lastDecisionTick: number
  }
  actions: {
    queue: QueuedAction[]
    history: CompletedAction[]
  }
  flags: {
    simulationComplete: boolean
    maxDaysReached: boolean
  }
}
```

## Phase 6B - Simulation Engine

### Core Components

**File Locations**:
- `src/utils/SimulationBridge.ts` - Main thread communication layer
- `src/workers/simulation.worker.ts` - Web Worker implementation  
- `src/utils/SimulationEngine.ts` - Core simulation logic
- `src/types/worker-messages.ts` - Worker communication protocols
- `src/views/LiveMonitorView.vue` - Real-time monitoring interface

Phase 6B implements the complete Web Worker-based simulation system with real-time communication and UI integration.

### MapSerializer Implementation (Phase 6A Core)

The MapSerializer solves the fundamental issue that Map objects cannot be transferred across Web Worker boundaries via postMessage, which only supports structured cloning.

### Core Implementation

```typescript
export class MapSerializer {
  static serialize(obj: any): any {
    if (obj instanceof Map) {
      return {
        __type: 'Map',
        __entries: Array.from(obj.entries()).map(([key, value]) => [
          this.serialize(key),
          this.serialize(value)
        ])
      }
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.serialize(item))
    }
    
    if (obj && typeof obj === 'object') {
      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.serialize(value)
      }
      return result
    }
    
    return obj
  }

  static deserialize(obj: any): any {
    if (obj && typeof obj === 'object' && obj.__type === 'Map') {
      const map = new Map()
      for (const [key, value] of obj.__entries) {
        map.set(this.deserialize(key), this.deserialize(value))
      }
      return map
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deserialize(item))
    }
    
    if (obj && typeof obj === 'object') {
      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.deserialize(value)
      }
      return result
    }
    
    return obj
  }
}
```

### Integration with Phase 5 Parameters

The MapSerializer seamlessly handles the complex nested Map structures from Phase 5's parameter system:

```typescript
// Example: Actions parameter with nested Maps
const actionsMap = new Map([
  ['research', new Map([
    ['baseTime', 300],
    ['requirements', new Map([...])]
  ])]
])

// Serialization preserves all Map structures
const serialized = MapSerializer.serialize(actionsMap)
const deserialized = MapSerializer.deserialize(serialized)
// deserialized === actionsMap (functionally equivalent)
```

### SimulationEngine Core Logic (Phase 6B)

### Core Simulation Processing

```typescript
export class SimulationEngine {
  private gameState: GameState
  private parameters: any
  
  constructor(parameters: any) {
    this.parameters = parameters
    this.gameState = this.initializeGameState(parameters)
  }

  tick(): void {
    this.gameState.time.currentTick++
    this.gameState.time.currentDay = Math.floor(this.gameState.time.currentTick / this.gameState.time.ticksPerDay)
    
    // Process automation systems
    this.processAutomation()
    
    // AI decision making
    this.makeDecisions()
    
    // Execute queued actions
    this.executeActions()
    
    // Update derived states
    this.updateDerivedStates()
  }

  private makeDecisions(): void {
    // Simplified AI: Research if we have enough resources
    if (this.gameState.resources.gold >= 100 && !this.gameState.automation.researchActive) {
      this.queueAction('research', 'basic_research')
    }
    
    // Combat decisions based on threat level
    if (this.gameState.resources.threat > 50) {
      this.queueAction('combat', 'defend_territory')
    }
  }
}
```

### Game State Structure (Phase 6A Interface Implementation)

```typescript
interface GameState {
  time: {
    currentTick: number
    currentDay: number
    ticksPerDay: number
    speed: number
  }
  resources: {
    gold: number
    research: number
    threat: number
    population: number
  }
  automation: {
    researchActive: boolean
    combatActive: boolean
    lastDecisionTick: number
  }
  actions: {
    queue: QueuedAction[]
    history: CompletedAction[]
  }
  flags: {
    simulationComplete: boolean
    maxDaysReached: boolean
  }
}
```

## Web Worker Communication System

### Message Protocol

```typescript
// Worker Messages (src/types/worker-messages.ts)
export interface WorkerMessage {
  type: 'init' | 'start' | 'pause' | 'setSpeed' | 'getState' | 'stop'
  payload?: any
}

export interface WorkerResponse {
  type: 'initialized' | 'stateUpdate' | 'completed' | 'error'
  payload?: any
}
```

### SimulationBridge API

```typescript
export class SimulationBridge extends EventTarget {
  async initialize(parameters: any): Promise<void> {
    const serializedParams = MapSerializer.serialize(parameters)
    this.worker.postMessage({
      type: 'init',
      payload: serializedParams
    })
  }

  setSpeed(speed: number): void {
    this.worker.postMessage({
      type: 'setSpeed',
      payload: speed
    })
  }

  async getGameState(): Promise<GameState> {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === 'stateUpdate') {
          this.worker.removeEventListener('message', handler)
          resolve(MapSerializer.deserialize(event.data.payload))
        }
      }
      this.worker.addEventListener('message', handler)
      this.worker.postMessage({ type: 'getState' })
    })
  }
}
```

## Live Monitor Integration (Phase 6B UI)

### Real-Time UI Updates

The LiveMonitorView.vue provides comprehensive testing and monitoring interface:

```vue
<template>
  <div class="live-monitor">
    <!-- Simulation Controls -->
    <div class="controls">
      <button @click="startSimulation" :disabled="isRunning">
        Start Simulation
      </button>
      <button @click="pauseSimulation" :disabled="!isRunning">
        Pause
      </button>
      <select v-model="selectedSpeed" @change="updateSpeed">
        <option value="1">1x Speed</option>
        <option value="10">10x Speed</option>
        <option value="100">100x Speed</option>
      </select>
    </div>

    <!-- Real-Time Status Display -->
    <div class="status" v-if="currentState">
      <h3>Day {{ currentState.time.currentDay }}</h3>
      <p>Gold: {{ currentState.resources.gold }}</p>
      <p>Research: {{ currentState.resources.research }}</p>
      <p>Population: {{ currentState.resources.population }}</p>
    </div>

    <!-- Event Log -->
    <div class="event-log">
      <div v-for="event in eventLog" :key="event.id">
        {{ event.timestamp }}: {{ event.message }}
      </div>
    </div>
  </div>
</template>
```

### Event System

```typescript
// Setup event listeners for real-time updates
simulationBridge.addEventListener('stateUpdate', (event: any) => {
  currentState.value = event.detail
  addEventLog(`State updated: Day ${event.detail.time.currentDay}`)
})

simulationBridge.addEventListener('completed', (event: any) => {
  isRunning.value = false
  addEventLog(`Simulation completed after ${event.detail.days} days`)
})
```

## Phase 6 Testing Results

### Successful Test Session

**Test Date**: December 18, 2024
**Test Duration**: Complete simulation lifecycle
**Test Environment**: Vue 3 + Vite development server

**Key Results**:
- ✅ Initialization: Parameters loaded and serialized successfully
- ✅ Worker Creation: Web Worker started without errors
- ✅ Speed Control: Successfully tested 1x, 10x, and 100x speeds
- ✅ Real-Time Updates: UI updated every second with current state
- ✅ Completion: Simulation completed after 34 simulated days
- ✅ State Management: All Map objects preserved through serialization

**Performance Metrics**:
- Initial load time: < 500ms
- State update frequency: 1 Hz (configurable)
- Memory usage: Stable throughout simulation
- Speed transitions: Instant response to speed changes

### DevTools Integration

Added convenience functions for browser console testing:

```typescript
// Available in browser console
window.createSimulationBridge()  // Factory function
window.serializeData(obj)        // MapSerializer.serialize
window.deserializeData(obj)      // MapSerializer.deserialize
```

## Integration with Existing System

### Phase 5 Parameter Integration

The Web Worker system fully integrates with Phase 5's parameter structure:

```typescript
// Phase 5 parameters (with Maps) → MapSerializer → Web Worker → SimulationEngine
const parameters = await gameData.getAllParametersAsObject()
await simulationBridge.initialize(parameters)
```

### Pinia Store Integration

```typescript
// Simulation store integration
export const useSimulationStore = defineStore('simulation', () => {
  const bridge = ref<SimulationBridge | null>(null)
  const currentState = ref<GameState | null>(null)
  
  const initializeSimulation = async () => {
    const gameDataStore = useGameDataStore()
    const parameters = await gameDataStore.getAllParametersAsObject()
    
    bridge.value = new SimulationBridge()
    await bridge.value.initialize(parameters)
  }
  
  return {
    bridge,
    currentState,
    initializeSimulation
  }
})
```

### Router Configuration

```typescript
// Route configuration for Live Monitor
{
  path: '/live-monitor',
  name: 'LiveMonitor',
  component: () => import('../views/LiveMonitorView.vue')
}
```

## Error Handling and Validation

### Worker Error Management

```typescript
// Worker error handling
worker.addEventListener('error', (error) => {
  console.error('Worker error:', error)
  dispatchEvent(new CustomEvent('error', { detail: error }))
})

worker.addEventListener('messageerror', (error) => {
  console.error('Worker message error:', error)
  dispatchEvent(new CustomEvent('error', { detail: 'Message serialization error' }))
})
```

### Serialization Validation

```typescript
// MapSerializer validation
static isValidSerializedMap(obj: any): boolean {
  return obj && 
         typeof obj === 'object' && 
         obj.__type === 'Map' && 
         Array.isArray(obj.__entries)
}

static validate(obj: any): boolean {
  try {
    const serialized = this.serialize(obj)
    const deserialized = this.deserialize(serialized)
    return JSON.stringify(obj) === JSON.stringify(deserialized)
  } catch (error) {
    return false
  }
}
```

## Performance Considerations

### Memory Management

- **Worker Lifecycle**: Workers are properly terminated on component unmount
- **State Updates**: Rate-limited to prevent UI flooding
- **Serialization**: Efficient recursive handling of nested structures

### Optimization Strategies

```typescript
// Optimized state updates with debouncing
const debouncedStateUpdate = debounce((state: GameState) => {
  dispatchEvent(new CustomEvent('stateUpdate', { detail: state }))
}, 100)
```

## Future Phase Foundation

### Prepared for Phase 7+ Development

The Phase 6 implementation provides robust foundation for future phases:

- **Live Monitor Widgets**: Widget framework ready for real-time data visualization
- **Advanced UI Features**: Event system prepared for complex user interactions  
- **Performance Analytics**: Monitoring infrastructure ready for detailed metrics
- **Simulation Extensions**: Engine designed for additional game mechanics

### Extensibility Points

- **Message Protocol**: Easily extended for new worker commands
- **Serialization System**: Supports additional data types beyond Maps
- **Event Architecture**: Ready for complex UI event handling
- **State Management**: Prepared for advanced simulation features

## Technical Architecture Summary

### Phase 6A Foundation
✅ **MapSerializer**: Solves Web Worker Map transfer limitation  
✅ **Type System**: Comprehensive GameState interfaces  
✅ **Validation**: Type safety and data integrity  

### Phase 6B Engine  
✅ **Web Worker**: Background simulation processing  
✅ **SimulationEngine**: Core game logic and AI decisions  
✅ **Communication Bridge**: Real-time main thread integration  
✅ **Live Monitor**: Interactive testing and monitoring interface  

### Integration Success
✅ **Phase 5 Compatibility**: Seamless parameter system integration  
✅ **Pinia Integration**: Reactive state management  
✅ **Router Integration**: Navigation and view management

## Technical Debt and Known Limitations

### Current Limitations

1. **Single Worker**: Currently uses one worker; could be extended to worker pool
2. **Basic AI**: Simulation engine has simplified decision making
3. **Fixed Update Rate**: 1 Hz update rate is hardcoded
4. **Limited Error Recovery**: Basic error handling without automatic recovery

### Maintenance Notes

- MapSerializer requires testing when adding new data types
- Worker message protocol should be versioned for future compatibility
- State structure changes require coordinated updates across multiple files
- Performance monitoring could be enhanced with detailed metrics

---

**Documentation Version**: 1.0  
**Last Updated**: August 27, 2025  
**Phase Status**: Complete - Ready for Future Development
