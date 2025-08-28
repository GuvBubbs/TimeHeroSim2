# Phase 6 Updates - Post Phase 5 Implementation Review

## Overview

After reviewing the completed Phase 5 implementation, several adjustments are needed for Phase 6 to properly integrate with the sophisticated parameter system that was built. Phase 5 delivered a more comprehensive system than originally planned, with Map objects, drag-and-drop priority lists, and detailed parameter structures that require special handling.

---

## Key Discoveries from Phase 5 Implementation

### 1. Parameter System Complexity
- **Maps are used extensively**: `targetSeedRatios`, `materialValues`, `screenPriorities`, `vendorPriorities`, etc.
- **Priority lists from drag-and-drop**: Arrays that define execution order
- **Deep nested structures**: Multiple levels of configuration objects
- **Override system**: Tracks parameter changes with timestamps and original values

### 2. Existing Infrastructure
- ✅ **ConfigurationCompiler**: Already built and functional in `/src/utils/ConfigurationCompiler.ts`
- ✅ **SimulationConfig interface**: Well-defined with all necessary fields
- ✅ **Parameter persistence**: LocalStorage handling with Map reconstruction
- ✅ **AllParameters interface**: Complete structure for all 9 game systems
- ⚠️ **No worker infrastructure**: No existing Web Worker setup or simulation engine

### 3. Data Structure Highlights
```typescript
// Phase 5 uses Maps extensively
interface TowerParameters {
  autoCatcher: {
    targetSeedRatios: Map<string, number>  // Can't pass directly to worker
  }
}

interface DecisionParameters {
  screenPriorities: {
    weights: Map<string, number>  // Needs serialization
    adjustmentFactors: {
      energyLow: Map<string, number>
      seedsLow: Map<string, number>
      // etc.
    }
  }
}
```

---

## Required Phase 6 Adjustments

### 1. Map Serialization Layer (NEW - Phase 6A)

**Problem**: Web Workers can't receive Map objects directly through postMessage.

**Solution**: Create serialization utilities before worker setup.

```typescript
// /src/utils/MapSerializer.ts
export class MapSerializer {
  static serialize(config: SimulationConfig): SerializedConfig {
    return {
      ...config,
      parameterOverrides: config.parameterOverrides ? 
        Array.from(config.parameterOverrides.entries()) : [],
      // Recursively convert all Maps in parameters
      parameters: this.serializeMapsInObject(config.parameters)
    }
  }
  
  static deserialize(data: SerializedConfig): SimulationConfig {
    return {
      ...data,
      parameterOverrides: new Map(data.parameterOverrides),
      parameters: this.deserializeMapsInObject(data.parameters)
    }
  }
  
  private static serializeMapsInObject(obj: any): any {
    // Recursively find and convert Maps to arrays
    // Handle nested structures
  }
}
```

### 2. GameState Alignment (Phase 6A)

Update GameState to match parameter expectations:

```typescript
interface GameState {
  // ... existing fields ...
  
  // Add fields that parameters expect to modify
  automation: {
    plantingEnabled: boolean  // from farm.automation.autoPlant
    plantingStrategy: string  // from farm.automation.plantingStrategy
    wateringEnabled: boolean  // from farm.automation.autoWater
    // etc.
  }
  
  // Priority queues from drag-and-drop lists
  priorities: {
    cleanupOrder: string[]     // from farm.landExpansion.prioritizeCleanupOrder
    toolCrafting: string[]     // from town.blueprintStrategy.toolPriorities
    helperRescue: string[]     // from helpers.acquisition.rescueOrder
    // etc.
  }
}
```

### 3. Decision Engine Parameter Integration (Phase 6E)

The decision engine needs significant updates to use the detailed parameters:

```typescript
class DecisionEngine {
  private parameters: AllParameters
  private priorityQueues: Map<string, string[]>
  
  scoreAction(action: GameAction): number {
    let score = 0
    
    // Use parameter weights from Maps
    const screenWeight = this.parameters.decisions.screenPriorities.weights.get(action.screen) || 1.0
    
    // Apply priority list ordering
    const priorityIndex = this.getPriorityIndex(action)
    score *= (10 - priorityIndex) / 10  // Higher priority = higher score
    
    // Use nested parameter structures
    if (action.type === 'plant') {
      const strategy = this.parameters.farm.automation.plantingStrategy
      score = this.applyPlantingStrategy(action, strategy, score)
    }
    
    return score
  }
}
```

### 4. Worker Communication Updates (Phase 6B)

Modify worker setup to handle serialization:

```typescript
// SimulationBridge.ts
export class SimulationBridge {
  async initialize(config: SimulationConfig): Promise<void> {
    // Serialize config before sending to worker
    const serializedConfig = MapSerializer.serialize(config)
    
    this.worker.postMessage({
      type: 'init',
      data: serializedConfig
    })
  }
}

// simulation.worker.ts
self.addEventListener('message', (event) => {
  if (event.data.type === 'init') {
    // Deserialize config in worker
    const config = MapSerializer.deserialize(event.data.data)
    engine = new SimulationEngine(config)
  }
})
```

---

## Updated Mini-Phase Plan

### Phase 6A: GameState & Map Serialization ⚠️ UPDATED
**New First Priority**: Create Map serialization layer before anything else

**Deliverables**:
1. ✅ Create `/src/utils/MapSerializer.ts`
2. ✅ Test serialization with Phase 5 parameter data
3. ✅ Create GameState interface aligned with parameters
4. ✅ Stub SimulationEngine with proper config handling
5. ✅ Basic tick() that uses serialized parameters

**Testing**:
- [ ] Can serialize/deserialize SimulationConfig with Maps
- [ ] Parameters maintain structure through serialization
- [ ] GameState includes all parameter-controlled fields

### Phase 6B: Web Worker with Serialization ⚠️ UPDATED
**Changes**: Must handle Map serialization from the start

**Additional Deliverables**:
- ✅ SimulationBridge uses MapSerializer
- ✅ Worker deserializes config properly
- ✅ Test with actual Phase 5 parameter data

### Phase 6C-6D: Live Monitor (No Changes)
These phases remain the same - UI widgets don't need Map handling.

### Phase 6E: Enhanced Decision Engine ⚠️ MAJOR UPDATES
**Changes**: Must use the sophisticated parameter structure

**Updated Deliverables**:
1. ✅ Decision engine uses Map-based weights
2. ✅ Priority lists from drag-and-drop drive action order
3. ✅ Strategy selections affect behavior
4. ✅ Nested parameter structures properly accessed
5. ✅ Vendor priorities influence purchases
6. ✅ Helper priorities affect role assignment

**New Complexity**:
```typescript
// Example: Using drag-and-drop priority lists
private evaluateTownPurchases(): GameAction[] {
  const priorities = this.parameters.town.blueprintStrategy.toolPriorities
  const actions: GameAction[] = []
  
  // Process in priority order from drag-and-drop list
  for (const toolId of priorities) {
    if (this.canAfford(toolId) && !this.owns(toolId)) {
      actions.push(this.createPurchaseAction(toolId))
    }
  }
  
  return actions
}
```

### Phase 6F: Advanced Widgets (Minor Updates)
**Changes**: Display parameter influence in UI

**Additional Features**:
- Show active strategy in Current Action widget
- Display priority queue in Next Decision widget
- Show parameter overrides affecting current decision

---

## Integration Touchpoints

### 1. Launching Simulation
```typescript
// From SimulationSetupView.vue
const launchSimulation = () => {
  const config = simulationStore.saveConfig()
  
  // Config already includes parameterOverrides as Map
  // ConfigurationCompiler already merges everything
  
  localStorage.setItem('currentSimulation', JSON.stringify(
    MapSerializer.serialize(config)  // NEW: Must serialize
  ))
  
  router.push('/live-monitor')
}
```

### 2. Reading Config in Live Monitor
```typescript
// In LiveMonitorView.vue onMounted()
const serializedConfig = JSON.parse(
  localStorage.getItem('currentSimulation') || '{}'
)
const config = MapSerializer.deserialize(serializedConfig)  // NEW: Must deserialize

bridge = new SimulationBridge()
await bridge.initialize(config)
```

---

## Critical Implementation Notes

### 1. Map Handling is Essential
- **Every Map must be serialized** before worker communication
- **Test serialization thoroughly** with actual parameter data
- **Consider using a library** like `superjson` if manual serialization becomes complex

### 2. Parameter Usage Patterns
```typescript
// Parameters use different patterns that need handling:

// 1. Simple values
const multiplier = params.farm.cropMechanics.growthTimeMultiplier

// 2. Maps (needs .get())
const weight = params.decisions.screenPriorities.weights.get('farm')

// 3. Priority arrays (needs indexOf)
const priority = params.town.blueprintStrategy.toolPriorities.indexOf('hoe')

// 4. Strategy enums
switch (params.farm.automation.plantingStrategy) {
  case 'highest-value': // ...
  case 'fastest-growth': // ...
}
```

### 3. Testing with Real Data
Always test with actual Phase 5 parameter configurations:
```typescript
// Load real parameter data
const paramStore = useParameterStore()
const config = ConfigurationCompiler.compile(quickSetup)

// Test serialization
const serialized = MapSerializer.serialize(config)
const deserialized = MapSerializer.deserialize(serialized)

// Verify Maps reconstructed properly
expect(deserialized.parameterOverrides).toBeInstanceOf(Map)
```

---

## Recommended Development Order

1. **Start with MapSerializer** (Phase 6A first task)
2. **Test with Phase 5 data** before proceeding
3. **Build GameState** to match parameter structure
4. **Create Worker** with serialization from day 1
5. **Implement Decision Engine** using real parameter values
6. **Add UI widgets** to visualize parameter influence

---

## Success Criteria Updates

### Phase 6A Success
- ✅ MapSerializer handles all parameter Maps
- ✅ GameState aligns with parameter structure
- ✅ Config passes through serialization intact

### Phase 6E Success
- ✅ Decision engine uses Map-based weights
- ✅ Priority lists drive action order
- ✅ Strategies affect behavior
- ✅ All parameter types properly consumed

### Phase 6F Success
- ✅ UI shows parameter influence
- ✅ Can see why AI made decisions
- ✅ Parameter overrides visible in action

---

## Conclusion

Phase 5 delivered a more sophisticated parameter system than originally envisioned. Phase 6 must be adapted to properly consume this rich configuration data, with special attention to:

1. **Map serialization** for Web Worker communication
2. **Priority list consumption** from drag-and-drop interfaces
3. **Strategy-based decision making** using parameter selections
4. **Deep parameter access** through nested structures

The main architectural change is adding a serialization layer (MapSerializer) as the very first task of Phase 6A, before any other implementation begins.

---

*Document created: January 2025*  
*Purpose: Align Phase 6 implementation with completed Phase 5 system*
