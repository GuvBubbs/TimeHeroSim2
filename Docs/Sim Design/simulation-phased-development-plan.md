# Time Hero Simulator - Simulation Phased Development Plan
## Breaking Down Phase 5 & 6 into Mini-Phases

---

## Quick Phase Overview

**Phase 5: Simulation Setup & Parameters**
- **5A**: Basic setup page with persona selection
- **5B**: Parameter navigation structure  
- **5C**: Core parameter screens (Farm, Tower, Town)
- **5D**: Advanced parameter screens (Adventure, Combat, Helpers)
- **5E**: Override system and configuration compiler

**Phase 6: Simulation Engine & Live Monitor**
- **6A**: GameState and stub simulation engine
- **6B**: Web Worker setup with basic messaging
- **6C**: Live Monitor layout with stub widgets
- **6D**: Core widgets (Resources, Location, Actions)
- **6E**: Decision engine and action execution
- **6F**: Advanced widgets and polish

---

## Phase 5: Simulation Setup & Parameter Control

### Phase 5A: Basic Setup Interface
**Goal**: Create the single-page setup screen with persona selection

**Deliverables**:
```typescript
// Basic setup page that works
- Simulation name input
- Persona card selector (using Phase 4 personas)
- Duration mode selector (fixed/completion/bottleneck)
- Speed selector (1x/100x/max)
- Launch button that saves config to localStorage
- Link to parameter editor (stub for now)
```

**Implementation**:
- Create `/views/SimulationSetup.vue`
- Reuse persona cards from Phase 4
- Simple form with Tailwind styling
- Save configuration to localStorage on launch
- Navigate to Live Monitor (even though it's empty)

**Testing Checklist**:
- [ ] Can enter simulation name
- [ ] Can select from 3+ personas
- [ ] Can choose duration mode
- [ ] Can select speed
- [ ] Config saves to localStorage when launched
- [ ] Navigation to Live Monitor works

**Success**: Can configure and "launch" a simulation (even though nothing runs yet)

---

### Phase 5B: Parameter Editor Navigation
**Goal**: Create the parameter editor structure with navigation

**Deliverables**:
```typescript
// Parameter editor with working navigation
- Tab navigation for 9 parameter screens
- Sidebar with screen categories
- Active state indicators
- Stub content for each screen
- Back button to setup page
```

**Implementation**:
- Create `/components/parameters/ParameterEditor.vue`
- Create `/components/parameters/ParameterNavigation.vue`
- 9 stub components for each parameter screen
- Use existing dark theme patterns
- Navigation similar to Game Configuration

**Stub Components**:
```vue
<!-- FarmParameters.vue -->
<template>
  <div class="p-4">
    <h2>Farm System Parameters</h2>
    <p>Farm parameter controls will go here</p>
  </div>
</template>
```

**Testing Checklist**:
- [ ] All 9 parameter screens accessible
- [ ] Navigation highlights active screen
- [ ] Can navigate between screens smoothly
- [ ] Back to setup works
- [ ] UI matches app theme

**Success**: Complete parameter editor shell with navigation

---

### Phase 5C: Core Parameter Screens
**Goal**: Implement Farm, Tower, and Town parameter screens

**Deliverables**:
```typescript
// Three fully functional parameter screens
- Farm Parameters:
  - Initial state controls
  - Growth mechanics sliders
  - Automation toggles
  - Priority weights
  
- Tower Parameters:
  - Catch mechanics
  - Auto-catcher settings
  - Unlock progression
  
- Town Parameters:
  - Purchase behavior
  - Vendor priorities
  - Material trading
```

**Implementation**:
- Create parameter interfaces in TypeScript
- Build form components with v-model binding
- Use sliders for multipliers (0.1x to 5.0x)
- Use number inputs for specific values
- Group related parameters in cards
- Store changes in `parameterStore`

**Example Component Structure**:
```vue
<template>
  <div class="parameter-screen">
    <!-- Growth Mechanics Card -->
    <div class="param-card">
      <h3>Growth Mechanics</h3>
      <div class="param-group">
        <label>Growth Speed</label>
        <input type="range" v-model="params.growthMultiplier" 
               min="0.1" max="5" step="0.1">
        <span>{{ params.growthMultiplier }}x</span>
      </div>
    </div>
  </div>
</template>
```

**Testing Checklist**:
- [ ] All form controls work and bind to data
- [ ] Values persist when switching screens
- [ ] Sliders show current values
- [ ] Reset to defaults button works
- [ ] Parameter changes saved to store

**Success**: Can modify core game parameters with visual feedback

---

### Phase 5D: Advanced Parameter Screens
**Goal**: Implement remaining 6 parameter screens

**Deliverables**:
```typescript
// Remaining parameter screens
- Adventure Parameters (combat, risk, routes)
- Forge Parameters (crafting, heat, priorities)
- Mine Parameters (depths, energy drain)
- Helper Parameters (roles, training)
- Resource Parameters (storage, generation)
- Decision Parameters (global AI behavior)
```

**Implementation Focus**:
- Complex nested structures for decision parameters
- Conditional UI (show fields based on strategy selected)
- Array editing for priority lists
- Map editing for material targets
- Import/export parameter sets as JSON

**Special Features**:
```typescript
// Decision Parameters need special UI
- Strategy selector with different fields per strategy
- Action chain builder (drag & drop)
- Interrupt condition editor
- Milestone timeline
```

**Testing Checklist**:
- [ ] All 6 screens have working controls
- [ ] Complex data structures properly edited
- [ ] Conditional UI shows/hides correctly
- [ ] Can import/export parameters
- [ ] Validation prevents invalid values

**Success**: Complete parameter control over simulation behavior

---

### Phase 5E: Configuration Compiler & Integration
**Goal**: Connect parameters to simulation engine

**Deliverables**:
```typescript
// Configuration compilation system
- ConfigurationCompiler class
- Parameter validation
- Override system UI
- Save/load named configurations
- Integration with quick setup
```

**Implementation**:
```typescript
class ConfigurationCompiler {
  compile(setup, parameters, overrides) {
    // Merges all configuration sources
    // Validates final configuration
    // Returns compiled config for engine
  }
}
```

**Override UI Features**:
- Add override by path (e.g., "farm.growth.multiplier")
- See active overrides in a list
- Quick presets (Easy, Hard, Speed Run)
- Conditional overrides with triggers

**Testing Checklist**:
- [ ] Parameters compile into valid configuration
- [ ] Overrides properly applied
- [ ] Can save/load configurations
- [ ] Validation catches errors
- [ ] Integration with setup page works

**Success**: Complete configuration system ready for simulation engine

---

## Phase 6: Simulation Engine & Live Monitor

### Phase 6A: GameState & Stub Engine
**Goal**: Create the core GameState structure and a minimal simulation engine

**Deliverables**:
```typescript
// Basic simulation that ticks
- Complete GameState interface
- SimulationEngine class (stub)
- Basic tick() function that advances time
- Initial state generator
- Simple state transitions
```

**Stub Implementation**:
```typescript
class SimulationEngine {
  tick() {
    // Just advance time for now
    this.state.time.minute++
    if (this.state.time.minute >= 60) {
      this.state.time.hour++
      this.state.time.minute = 0
    }
    
    // Fake some resource changes
    if (Math.random() > 0.5) {
      this.state.resources.energy.current += 1
    }
    
    return {
      state: this.state,
      actions: [],
      events: []
    }
  }
}
```

**Testing Checklist**:
- [ ] GameState structure matches documentation
- [ ] Engine initializes with config
- [ ] Time advances properly
- [ ] Can call tick() repeatedly
- [ ] State updates tracked

**Success**: Have a ticking simulation (even if it doesn't do much)

---

### Phase 6B: Web Worker Architecture
**Goal**: Move simulation to Web Worker with messaging

**Deliverables**:
```typescript
// Working Web Worker setup
- simulation.worker.ts file
- SimulationBridge class
- Message passing protocol
- Start/pause/stop controls
- Speed control
```

**Implementation Steps**:
1. Create worker file with message handlers
2. Move SimulationEngine to worker
3. Create bridge class for main thread
4. Set up event emitter pattern
5. Handle initialization and control messages

**Worker Test Harness**:
```typescript
// Simple test in console
const bridge = new SimulationBridge()
await bridge.initialize(config)
bridge.on('tick', (data) => console.log(data))
bridge.start()
```

**Testing Checklist**:
- [ ] Worker loads without errors
- [ ] Can send messages to worker
- [ ] Receive tick updates from worker
- [ ] Start/pause/stop work
- [ ] No UI blocking at max speed

**Success**: Simulation runs in background thread with communication

---

### Phase 6C: Live Monitor Layout & Navigation
**Goal**: Create the Live Monitor screen structure with stub widgets

**Deliverables**:
```vue
// Complete screen layout
- Control bar (play/pause, speed, time display)
- CSS Grid layout for widgets
- 13 stub widget components
- Widget positioning system
- Responsive design for 1440x900
```

**Stub Widgets**:
```vue
<!-- Each widget starts as a placeholder -->
<template>
  <div class="widget-card">
    <h3><i :class="icon"></i> {{ title }}</h3>
    <div class="widget-content">
      <p>{{ title }} data will appear here</p>
    </div>
  </div>
</template>
```

**Widget List**:
1. Phase Progress Bar
2. Current Location
3. Resources
4. Equipment
5. Current Action
6. Action Log
7. Farm Visualizer
8. Helper Management
9. Mini Upgrade Tree
10. Timeline
11. Screen Time
12. Next Decision
13. Performance

**Testing Checklist**:
- [ ] All 13 widgets visible
- [ ] Grid layout works
- [ ] Control bar functional
- [ ] Time display updates
- [ ] Responsive at target resolution

**Success**: Complete Live Monitor UI shell ready for data

---

### Phase 6D: Core Widget Implementation
**Goal**: Implement the most important widgets with real data

**Deliverables**:
```typescript
// Working core widgets
1. Resources Widget (energy, gold, water, seeds, materials)
2. Current Location Widget (screen display with hero icon)
3. Current Action Widget (what's happening now)
4. Action Log Widget (scrolling history)
5. Phase Progress Widget (game progression)
```

**Implementation Priority**:
1. Connect widgets to GameState from worker
2. Resources widget with bars and numbers
3. Location widget with screen layout
4. Action display with progress bars
5. Scrolling action log with formatting

**Resource Widget Example**:
```vue
<template>
  <div class="resources-widget">
    <div class="resource-bar">
      <label>Energy</label>
      <div class="bar">
        <div class="fill" :style="{width: energyPercent + '%'}"></div>
      </div>
      <span>{{ current }}/{{ max }}</span>
    </div>
  </div>
</template>
```

**Testing Checklist**:
- [ ] Resources update in real-time
- [ ] Location shows current screen
- [ ] Actions display with details
- [ ] Action log scrolls and formats
- [ ] Phase progress accurate

**Success**: Can watch simulation progress with core information

---

### Phase 6E: Decision Engine Implementation
**Goal**: Implement the actual decision-making logic

**Deliverables**:
```typescript
// Complete decision system
- Action enumeration (getAllPossibleActions)
- Prerequisite checking
- Action scoring based on parameters
- Action execution with state changes
- Helper action processing
```

**Implementation Order**:
1. Start with Farm actions (plant, water, harvest)
2. Add screen navigation
3. Add Town purchases
4. Add Tower seed catching
5. Add Adventure selection
6. Add Forge crafting
7. Add Mining
8. Add Helper management

**Testing with Different Personas**:
- Speedrunner: Should rush upgrades
- Casual: Should play slowly
- Weekend Warrior: Should batch activities

**Testing Checklist**:
- [ ] Hero makes logical decisions
- [ ] Actions respect prerequisites
- [ ] Different personas behave differently
- [ ] Parameters affect behavior
- [ ] State updates correctly

**Success**: Simulation makes intelligent decisions and progresses

---

### Phase 6F: Advanced Widgets & Polish
**Goal**: Implement remaining widgets and polish the experience

**Deliverables**:
```typescript
// Remaining widgets
1. Farm Visualizer (grid of plots)
2. Helper Management (gnomes and roles)
3. Mini Upgrade Tree (dependency view)
4. Timeline (event history)
5. Screen Time Chart
6. Next Decision Preview
7. Performance Monitor
```

**Farm Visualizer Features**:
```typescript
// Visual grid showing:
- Crop states (empty, growing, ready)
- Water levels
- Hero position
- Helper positions
- Plot status (locked/available)
```

**Polish Items**:
- Smooth update animations
- Color coding for actions
- Tooltips on hover
- Auto-scroll toggles
- Performance optimization
- Debug mode overlay

**Testing Checklist**:
- [ ] All widgets show correct data
- [ ] Farm visualizer updates properly
- [ ] Helper display accurate
- [ ] Timeline shows events
- [ ] Performance stays smooth
- [ ] Debug mode helpful

**Success**: Complete, polished Live Monitor with all features

---

## Implementation Guidelines

### Development Order
1. **Start with Phase 5A** - Get basic setup working
2. **Jump to Phase 6A-6B** - Get simulation ticking in worker
3. **Back to Phase 5B-5C** - Build parameter screens
4. **Then Phase 6C-6D** - Create monitor with core widgets
5. **Complete Phase 5D-5E** - Finish parameters
6. **Finish with Phase 6E-6F** - Complete simulation logic

### Stub Strategy
- Every component starts as a stub
- Stubs show structure and layout
- Real functionality added incrementally
- App always runs, even with stubs

### Testing Strategy
- Test each mini-phase before moving on
- Use console.log liberally in early phases
- Create test buttons for worker commands
- Verify state changes in Vue DevTools

### Communication Between Phases
- Phase 5 outputs: `SimulationConfig` in localStorage
- Phase 6 inputs: Reads config and starts simulation
- Bridge: `SimulationBridge` class handles all communication
- State: `GameState` is source of truth

---

## Dependencies & Prerequisites

### Required from Previous Phases
- **Phase 1**: CSV data loaded in `gameDataStore`
- **Phase 2**: Configuration editing patterns
- **Phase 3**: Upgrade tree for dependency checking
- **Phase 4**: Personas for behavior configuration

### New Systems Needed
- Web Worker setup with Vite
- Parameter storage system
- Real-time widget updates
- Performance monitoring

---

## Risk Mitigation

### Potential Issues
1. **Worker communication complexity**
   - Mitigation: Start simple, add complexity gradually
   
2. **Performance with many widgets**
   - Mitigation: Update only changed widgets
   
3. **State synchronization**
   - Mitigation: Unidirectional data flow

4. **Parameter validation**
   - Mitigation: Validate at compilation time

---

## Success Metrics

### Phase 5 Complete When
- [ ] Can configure any parameter
- [ ] Parameters affect simulation
- [ ] Can save/load configurations
- [ ] Override system works

### Phase 6 Complete When
- [ ] 35-day simulation runs smoothly
- [ ] All widgets show correct data
- [ ] Different personas behave differently
- [ ] Can observe and understand AI decisions
- [ ] Performance acceptable at max speed

---

## Notes for Implementation

### For Claude/Copilot
When implementing each mini-phase:
1. Reference the main Phase 5/6 documents for details
2. Use existing patterns from Phase 1-4
3. Keep TypeScript interfaces consistent
4. Follow established dark theme classes
5. Test thoroughly before moving to next phase

### Key Files to Create
```
/views/
  SimulationSetup.vue
  LiveMonitor.vue

/components/parameters/
  ParameterEditor.vue
  FarmParameters.vue
  (... 8 more parameter screens)

/components/monitor/
  ControlBar.vue
  ResourcesWidget.vue
  LocationWidget.vue
  (... 11 more widgets)

/utils/
  SimulationEngine.ts
  simulation.worker.ts
  SimulationBridge.ts
  ConfigurationCompiler.ts

/stores/
  parameterStore.ts
  monitorStore.ts
```

---

*Document created: January 2025*  
*Purpose: Implementation roadmap for simulation features*
*Phases: 5A-5E (Setup) and 6A-6F (Engine & Monitor)*
