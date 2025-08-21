# Time Hero Simulator - Live Monitor
## Document 6: Real-Time Simulation Visualization & Control

### Purpose & Goals
The Live Monitor provides **real-time visualization** of running simulations, displaying game state progression, resource flows, and player actions as they occur. It serves as both a debugging tool for understanding simulation behavior and a validation interface for confirming that game systems work as intended.

### Integration with Simulator Goals
- **Behavior Verification**: Watch how personas make decisions in real-time
- **Bottleneck Detection**: Identify the exact moment progression stalls
- **System Validation**: Ensure all game mechanics function correctly
- **Performance Monitoring**: Track simulation speed and resource usage
- **Interactive Debugging**: Pause, inspect, and modify running simulations

### Monitor Architecture

#### Core Display System
```typescript
interface LiveMonitor {
  simulation: {
    id: string;
    status: 'initializing' | 'running' | 'paused' | 'completed' | 'failed';
    startTime: Date;
    currentTime: Date;
    gameTime: GameTime;
  };
  
  display: {
    mode: 'overview' | 'detailed' | 'debug';
    updateRate: number; // ms between updates
    autoScroll: boolean;
    highlights: Set<string>; // Systems to highlight
  };
  
  controls: {
    speed: SimulationSpeed;
    breakpoints: Breakpoint[];
    recording: boolean;
  };
  
  metrics: {
    performance: PerformanceMetrics;
    gameState: GameStateMetrics;
    progression: ProgressionMetrics;
  };
}

interface GameTime {
  day: number;
  hour: number;
  minute: number;
  totalMinutes: number;
  
  formatted: string; // "Day 7, 14:30"
  phase: GamePhase;
  percentComplete: number;
}
```

### Layout Structure

#### Main Monitor View
```
┌─────────────────────────────────────────────────────────────┐
│ [⏸ Pause] [▶ 100x] [⏹ Stop] [📊 Export] Day 7, 14:30 (20%) │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────┐  ┌──────────────────────────┐ │
│  │    Current Location     │  │      Resources          │ │
│  │  ┌──────────────────┐  │  │  Energy: ████░░ 450/600 │ │
│  │  │                  │  │  │  Gold:   1,247          │ │
│  │  │   🌾 FARM        │  │  │  Water:  ███░░░ 45/100  │ │
│  │  │                  │  │  │  Seeds:  ████░░ 127/200 │ │
│  │  └──────────────────┘  │  │                         │ │
│  │  Time on screen: 3:45   │  │  Materials:             │ │
│  └────────────────────────┘  │  Wood: 45  Stone: 23    │ │
│                               │  Iron: 12  Silver: 2    │ │
│  ┌────────────────────────┐  └──────────────────────────┘ │
│  │    Current Action       │                               │
│  │  Planting Carrots       │  ┌──────────────────────────┐ │
│  │  Plot 7/20              │  │    Phase Progress       │ │
│  │  ▓▓▓▓▓▓▓░░░ 70%       │  │  Tutorial    ████ 100%  │ │
│  └────────────────────────┘  │  Early Game  ██░░  45%  │ │
│                               │  Mid Game    ░░░░   0%  │ │
│  ┌────────────────────────┐  │  Late Game   ░░░░   0%  │ │
│  │   Recent Actions        │  │  Endgame     ░░░░   0%  │ │
│  │  14:29 Harvested x3     │  └──────────────────────────┘ │
│  │  14:28 Watered plots    │                               │
│  │  14:27 Pumped water     │  ┌──────────────────────────┐ │
│  │  14:25 Planted x5       │  │    Screen Time          │ │
│  │  14:24 Bought upgrade   │  │  Farm:      ████  42%   │ │
│  └────────────────────────┘  │  Tower:     ██    18%   │ │
│                               │  Adventure: ██    20%   │ │
│ ┌─────────────────────────────────────────────────────┐   │ │
│ │                  Event Timeline                     │   │ │
│ │  ──●────●──────●────●●──────●──────────●──────────  │   │ │
│ │  6:00  8:00  10:00 12:00  14:00  16:00  18:00     │   │ │
│ └─────────────────────────────────────────────────────┘   │ │
└─────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### 1. Simulation Controls
```typescript
interface SimulationControls {
  status: SimulationStatus;
  speed: {
    current: number; // 1, 10, 100, 1000, -1 (max)
    available: number[];
    throttled: boolean; // If performance limited
  };
  
  // Note: Simulations are expected to take several minutes at 1x speed
  // This allows for careful observation of game mechanics and bottlenecks
  // Speed settings:
  // - 1x: Real-time visualization (several minutes for full run)
  // - 10x: Smooth accelerated view
  // - 100x: Rapid progression
  // - Max: As fast as possible (may skip visual frames)
  
  actions: {
    play(): void;
    pause(): void;
    stop(): void;
    restart(): void;
    step(): void; // Single tick advance
    
    setSpeed(multiplier: number): void;
    skipToNext(event: EventType): void;
    skipToTime(gameTime: GameTime): void;
  };
  
  breakpoints: {
    conditions: BreakpointCondition[];
    enabled: boolean;
    
    addBreakpoint(condition: BreakpointCondition): void;
    removeBreakpoint(id: string): void;
    toggleBreakpoints(): void;
  };
}

interface BreakpointCondition {
  id: string;
  type: 'time' | 'phase' | 'resource' | 'action' | 'custom';
  condition: string; // e.g., "day >= 10", "gold > 1000"
  action: 'pause' | 'log' | 'alert';
  oneTime: boolean;
}
```

**Control Bar Design**:
```typescript
const controlBarButtons = [
  { icon: 'fa-play', action: 'play', tooltip: 'Resume (Space)' },
  { icon: 'fa-pause', action: 'pause', tooltip: 'Pause (Space)' },
  { icon: 'fa-stop', action: 'stop', tooltip: 'Stop Simulation' },
  { icon: 'fa-step-forward', action: 'step', tooltip: 'Step (S)' },
  { icon: 'fa-forward', action: 'speed', tooltip: 'Speed: 100x' },
  { icon: 'fa-bug', action: 'debug', tooltip: 'Debug Mode (D)' }
];
```

#### 2. Location Visualizer
```typescript
interface LocationVisualizer {
  currentScreen: GameScreen;
  screenTime: number; // Minutes on current screen
  transition: {
    from: GameScreen;
    to: GameScreen;
    progress: number; // 0-1 animation
  } | null;
  
  miniMap: {
    screens: ScreenNode[];
    paths: ScreenPath[];
    heroPosition: Point;
  };
}

interface ScreenNode {
  id: GameScreen;
  name: string;
  icon: string;
  position: Point;
  visited: boolean;
  timeSpent: number;
  color: string;
}

// Visual representation
const screenVisuals = {
  farm: { icon: '🌾', color: '#10b981', name: 'Farm' },
  tower: { icon: '🏗️', color: '#3b82f6', name: 'Tower' },
  town: { icon: '🏪', color: '#f59e0b', name: 'Town' },
  adventure: { icon: '⚔️', color: '#ef4444', name: 'Adventure' },
  forge: { icon: '🔨', color: '#8b5cf6', name: 'Forge' },
  mine: { icon: '⛏️', color: '#6b7280', name: 'Mine' }
};
```

#### 3. Resource Tracker
```typescript
interface ResourceTracker {
  resources: {
    energy: { current: number; max: number; rate: number; };
    gold: { current: number; rate: number; };
    water: { current: number; max: number; };
    seeds: { current: number; max: number; breakdown: Map<string, number>; };
  };
  
  materials: Map<string, number>;
  
  trends: {
    energy: TrendData;
    gold: TrendData;
    efficiency: TrendData;
  };
  
  alerts: ResourceAlert[];
}

interface TrendData {
  history: { time: number; value: number; }[];
  trend: 'increasing' | 'stable' | 'decreasing';
  projection: number; // Expected value in 1 hour
}

interface ResourceAlert {
  type: 'shortage' | 'cap' | 'inefficiency';
  resource: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
}
```

**Resource Display Component**:
```vue
<template>
  <div class="resource-panel">
    <div class="resource-bar" v-for="resource in resources">
      <label>{{ resource.name }}</label>
      <div class="bar-container">
        <div 
          class="bar-fill"
          :style="{ width: resource.percentage + '%' }"
          :class="resource.alert"
        />
        <span class="value">{{ resource.current }}/{{ resource.max }}</span>
      </div>
      <span class="rate" v-if="resource.rate">
        {{ resource.rate > 0 ? '+' : '' }}{{ resource.rate }}/min
      </span>
    </div>
  </div>
</template>
```

#### 4. Action Log
```typescript
interface ActionLog {
  entries: LogEntry[];
  filters: {
    screens: Set<GameScreen>;
    types: Set<ActionType>;
    minImportance: number; // 1-5
  };
  
  display: {
    maxVisible: number;
    groupSimilar: boolean;
    showTimestamps: boolean;
    autoscroll: boolean;
  };
}

interface LogEntry {
  id: string;
  timestamp: GameTime;
  screen: GameScreen;
  type: ActionType;
  action: string;
  details?: any;
  importance: number; // 1-5
  icon?: string;
  color?: string;
}

type ActionType = 
  | 'plant' | 'harvest' | 'water'
  | 'upgrade' | 'purchase' | 'craft'
  | 'adventure' | 'combat' | 'mine'
  | 'decision' | 'optimization' | 'error';
```

**Log Entry Examples**:
```typescript
const logExamples = [
  {
    timestamp: { day: 7, hour: 14, minute: 29 },
    screen: 'farm',
    type: 'harvest',
    action: 'Harvested 3 Carrots',
    details: { crop: 'carrot', count: 3, energy: 3 },
    importance: 2,
    icon: 'fa-seedling',
    color: '#10b981'
  },
  {
    timestamp: { day: 7, hour: 14, minute: 25 },
    screen: 'town',
    type: 'upgrade',
    action: 'Purchased Storage Shed II',
    details: { cost: 100, energyCapIncrease: 350 },
    importance: 4,
    icon: 'fa-warehouse',
    color: '#f59e0b'
  }
];
```

#### 5. Phase Progress Tracker
```typescript
interface PhaseTracker {
  phases: PhaseProgress[];
  currentPhase: GamePhase;
  transitions: PhaseTransition[];
  
  milestones: {
    completed: Milestone[];
    upcoming: Milestone[];
    blocked: Milestone[];
  };
}

interface PhaseProgress {
  name: GamePhase;
  startDay: number;
  endDay?: number;
  progress: number; // 0-100
  status: 'completed' | 'active' | 'future' | 'blocked';
  
  requirements: {
    met: string[];
    pending: string[];
    blocking?: string;
  };
}

interface Milestone {
  id: string;
  name: string;
  phase: GamePhase;
  type: 'required' | 'optional';
  completed: boolean;
  day?: number;
  blockedBy?: string[];
}
```

#### 6. Screen Time Visualizer
```typescript
interface ScreenTimeVisualizer {
  distribution: Map<GameScreen, number>; // percentages
  heatmap: TimeHeatmap;
  transitions: ScreenTransition[];
  
  display: {
    type: 'pie' | 'bar' | 'treemap' | 'sankey';
    period: 'session' | 'day' | 'total';
    animated: boolean;
  };
}

interface TimeHeatmap {
  data: number[][]; // [day][hour] = intensity
  screens: GameScreen[];
  maxIntensity: number;
}

interface ScreenTransition {
  from: GameScreen;
  to: GameScreen;
  count: number;
  averageDuration: number;
}
```

### Mini Simulations

#### Screen-Specific Visualizers
Each screen can have its own mini visualization showing current activity:

##### Farm Visualizer
```typescript
interface FarmVisualizer {
  plots: PlotState[];
  waterLevel: number;
  activeAction: 'planting' | 'watering' | 'harvesting' | 'idle';
  heroPosition: { plot: number; action: string; };
  
  render(): VNode {
    return (
      <div class="farm-grid">
        {this.plots.map(plot => (
          <div class={`plot ${plot.state}`}>
            {plot.crop && <CropIcon crop={plot.crop} growth={plot.growth} />}
            {plot.water && <WaterIndicator level={plot.water} />}
          </div>
        ))}
        <HeroSprite position={this.heroPosition} />
      </div>
    );
  }
}

interface PlotState {
  id: number;
  state: 'empty' | 'planted' | 'growing' | 'ready' | 'dead';
  crop?: string;
  growth?: number; // 0-100
  water?: number; // 0-100
}
```

##### Adventure Combat Visualizer
```typescript
interface CombatVisualizer {
  heroHP: { current: number; max: number; };
  enemies: Enemy[];
  currentWave: number;
  totalWaves: number;
  
  render(): VNode {
    return (
      <div class="combat-scene">
        <div class="hero-side">
          <HeroSprite weapon={this.currentWeapon} />
          <HealthBar current={this.heroHP.current} max={this.heroHP.max} />
        </div>
        
        <div class="battlefield">
          <WaveIndicator current={this.currentWave} total={this.totalWaves} />
        </div>
        
        <div class="enemy-side">
          {this.enemies.map(enemy => (
            <EnemySprite type={enemy.type} hp={enemy.hp} />
          ))}
        </div>
      </div>
    );
  }
}
```

### Event System

#### Event Timeline
```typescript
interface EventTimeline {
  events: TimelineEvent[];
  currentTime: number;
  viewport: { start: number; end: number; };
  
  categories: {
    upgrades: boolean;
    phases: boolean;
    bottlenecks: boolean;
    achievements: boolean;
  };
}

interface TimelineEvent {
  id: string;
  time: number; // Game minutes
  type: EventType;
  category: EventCategory;
  title: string;
  description?: string;
  importance: 'minor' | 'normal' | 'major' | 'critical';
  icon: string;
  color: string;
}

// Visual timeline component
class TimelineRenderer {
  render(timeline: EventTimeline): VNode {
    const scale = this.calculateScale(timeline.viewport);
    
    return (
      <svg class="event-timeline" width="100%" height="60">
        {/* Time axis */}
        <line x1="0" y1="30" x2="100%" y2="30" stroke="#334155" />
        
        {/* Time markers */}
        {this.renderTimeMarkers(timeline.viewport, scale)}
        
        {/* Events */}
        {timeline.events
          .filter(e => e.time >= timeline.viewport.start && e.time <= timeline.viewport.end)
          .map(event => (
            <g transform={`translate(${this.timeToX(event.time, scale)}, 30)`}>
              <circle 
                r={this.getRadius(event.importance)} 
                fill={event.color}
                class="timeline-event"
                onClick={() => this.showEventDetails(event)}
              />
              <title>{event.title}</title>
            </g>
          ))
        }
        
        {/* Current time indicator */}
        <line 
          x1={this.timeToX(timeline.currentTime, scale)} 
          y1="0" 
          x2={this.timeToX(timeline.currentTime, scale)} 
          y2="60" 
          stroke="#ef4444" 
          stroke-width="2"
        />
      </svg>
    );
  }
}
```

### Performance Monitoring

#### Performance Metrics
```typescript
interface PerformanceMonitor {
  metrics: {
    simulationSpeed: number; // ticks per second
    targetSpeed: number;
    efficiency: number; // actual/target
    
    memory: {
      used: number; // MB
      limit: number;
      trend: 'stable' | 'growing' | 'shrinking';
    };
    
    cpu: {
      usage: number; // percentage
      workerUsage: number[];
    };
    
    frameRate: number; // UI updates per second
  };
  
  bottlenecks: PerformanceBottleneck[];
  
  adjustments: {
    autoThrottle: boolean;
    reducedUpdates: boolean;
    simplifiedRendering: boolean;
  };
}

interface PerformanceBottleneck {
  system: string;
  issue: string;
  impact: 'low' | 'medium' | 'high';
  solution?: string;
}
```

### Debug Mode

#### Debug Panel
```typescript
interface DebugPanel {
  enabled: boolean;
  
  sections: {
    gameState: boolean;
    decisions: boolean;
    performance: boolean;
    validation: boolean;
  };
  
  gameState: {
    raw: any; // Complete game state object
    modified: Map<string, any>; // Overridden values
  };
  
  decisions: {
    recent: Decision[];
    reasoning: DecisionReasoning[];
    overrides: DecisionOverride[];
  };
  
  commands: {
    modifyResource(resource: string, value: number): void;
    skipToPhase(phase: GamePhase): void;
    triggerEvent(event: string): void;
    forceDecision(decision: string): void;
  };
}

interface DecisionReasoning {
  decision: string;
  options: any[];
  weights: number[];
  chosen: any;
  reasoning: string[];
}
```

**Debug Interface**:
```
┌─────────────────────────────────────────┐
│            Debug Mode Active            │
├─────────────────────────────────────────┤
│ [State][Decisions][Performance][Valid]  │
├─────────────────────────────────────────┤
│ Game State Inspector                    │
│ ┌─────────────────────────────────┐    │
│ │ > farm                          │    │
│ │   plots: 20                     │    │
│ │   water: 45                     │    │
│ │   > crops                       │    │
│ │     [0]: { type: "carrot", ...} │    │
│ │ > resources                     │    │
│ │   energy: 450                   │    │
│ │   gold: 1247                    │    │
│ └─────────────────────────────────┘    │
│                                          │
│ Commands                                │
│ [Set Energy: 1000]                      │
│ [Skip to Mid Game]                      │
│ [Force Bottleneck]                      │
│ [Export State]                          │
└─────────────────────────────────────────┘
```

### State Management

#### Monitor Store
```typescript
export const useMonitorStore = defineStore('liveMonitor', {
  state: () => ({
    simulation: null as SimulationInstance | null,
    
    display: {
      mode: 'overview' as DisplayMode,
      updateRate: 100, // ms
      autoScroll: true,
      highlights: new Set<string>()
    },
    
    controls: {
      speed: 100 as number,
      paused: false,
      breakpoints: [] as Breakpoint[],
      recording: false
    },
    
    metrics: {
      performance: {} as PerformanceMetrics,
      gameState: {} as GameStateMetrics,
      progression: {} as ProgressionMetrics
    },
    
    eventLog: [] as LogEntry[],
    eventTimeline: [] as TimelineEvent[],
    
    debug: {
      enabled: false,
      sections: {
        gameState: true,
        decisions: false,
        performance: false,
        validation: false
      }
    }
  }),
  
  getters: {
    isRunning: (state) => 
      state.simulation?.status === 'running',
    
    currentGameTime: (state) => 
      state.simulation?.gameTime || { day: 0, hour: 0, minute: 0 },
    
    completionPercentage: (state) => 
      state.metrics.progression?.percentComplete || 0,
    
    recentEvents: (state) => 
      state.eventLog.slice(-10),
    
    performanceStatus: (state) => {
      const eff = state.metrics.performance?.efficiency || 1;
      if (eff > 0.9) return 'optimal';
      if (eff > 0.7) return 'good';
      if (eff > 0.5) return 'degraded';
      return 'poor';
    }
  },
  
  actions: {
    async startMonitoring(config: SimulationConfig) {
      // Initialize simulation in web worker
      this.simulation = await simulationEngine.create(config);
      
      // Set up message handlers
      this.simulation.on('tick', this.handleTick);
      this.simulation.on('event', this.handleEvent);
      this.simulation.on('complete', this.handleComplete);
      
      // Start update loop
      this.startUpdateLoop();
    },
    
    handleTick(tickData: TickData) {
      // Update game state
      this.metrics.gameState = tickData.state;
      
      // Log actions
      tickData.actions.forEach(action => {
        this.eventLog.push(this.createLogEntry(action));
      });
      
      // Check breakpoints
      this.checkBreakpoints(tickData);
      
      // Update timeline
      if (tickData.events.length > 0) {
        this.eventTimeline.push(...tickData.events);
      }
    },
    
    togglePause() {
      if (this.simulation) {
        if (this.controls.paused) {
          this.simulation.resume();
        } else {
          this.simulation.pause();
        }
        this.controls.paused = !this.controls.paused;
      }
    },
    
    setSpeed(multiplier: number) {
      if (this.simulation) {
        this.simulation.setSpeed(multiplier);
        this.controls.speed = multiplier;
      }
    },
    
    addBreakpoint(condition: BreakpointCondition) {
      this.controls.breakpoints.push(condition);
      this.simulation?.updateBreakpoints(this.controls.breakpoints);
    }
  }
});
```

### Web Worker Communication

#### Message Protocol
```typescript
interface WorkerMessage {
  type: 'tick' | 'event' | 'state' | 'performance' | 'complete' | 'error';
  timestamp: number;
  data: any;
}

class SimulationWorkerBridge {
  private worker: Worker;
  private messageQueue: WorkerMessage[] = [];
  
  constructor(config: SimulationConfig) {
    this.worker = new Worker('/workers/simulation.worker.js');
    
    this.worker.postMessage({
      type: 'init',
      config
    });
    
    this.worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      this.handleMessage(e.data);
    };
  }
  
  private handleMessage(message: WorkerMessage) {
    switch (message.type) {
      case 'tick':
        this.processTick(message.data);
        break;
        
      case 'event':
        this.processEvent(message.data);
        break;
        
      case 'performance':
        this.updatePerformance(message.data);
        break;
        
      case 'complete':
        this.handleComplete(message.data);
        break;
        
      case 'error':
        this.handleError(message.data);
        break;
    }
  }
  
  // Control methods
  pause() {
    this.worker.postMessage({ type: 'pause' });
  }
  
  resume() {
    this.worker.postMessage({ type: 'resume' });
  }
  
  setSpeed(multiplier: number) {
    this.worker.postMessage({ type: 'speed', value: multiplier });
  }
  
  terminate() {
    this.worker.terminate();
  }
}
```

### Visualization Components

#### Resource Flow Animation
```typescript
class ResourceFlowVisualizer {
  private flows: ResourceFlow[] = [];
  
  addFlow(from: Point, to: Point, resource: string, amount: number) {
    this.flows.push({
      id: generateId(),
      from,
      to,
      resource,
      amount,
      progress: 0,
      duration: 1000 // ms
    });
  }
  
  render(deltaTime: number): VNode {
    // Update flow positions
    this.flows.forEach(flow => {
      flow.progress += deltaTime / flow.duration;
    });
    
    // Remove completed flows
    this.flows = this.flows.filter(f => f.progress < 1);
    
    return (
      <svg class="resource-flows">
        {this.flows.map(flow => {
          const pos = this.interpolatePosition(flow);
          return (
            <g transform={`translate(${pos.x}, ${pos.y})`}>
              <circle r="8" fill={this.getResourceColor(flow.resource)} />
              <text text-anchor="middle" y="4" font-size="10" fill="white">
                {flow.amount}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }
}
```

#### Phase Transition Effects
```typescript
class PhaseTransitionEffect {
  show(fromPhase: GamePhase, toPhase: GamePhase) {
    return (
      <div class="phase-transition-overlay">
        <div class="phase-exit">
          <h2>{fromPhase}</h2>
          <div class="completion-badge">✓ Complete</div>
        </div>
        
        <div class="transition-arrow">→</div>
        
        <div class="phase-enter">
          <h2>{toPhase}</h2>
          <div class="unlock-text">Unlocked!</div>
        </div>
      </div>
    );
  }
}
```

### Performance Optimizations

#### Update Throttling
```typescript
class UpdateThrottler {
  private lastUpdate = 0;
  private pendingUpdates: Update[] = [];
  
  shouldUpdate(priority: number): boolean {
    const now = performance.now();
    const timeSinceUpdate = now - this.lastUpdate;
    
    // High priority always updates
    if (priority >= 9) return true;
    
    // Throttle based on performance
    const threshold = this.getThreshold();
    
    if (timeSinceUpdate > threshold) {
      this.lastUpdate = now;
      return true;
    }
    
    return false;
  }
  
  private getThreshold(): number {
    const fps = this.getCurrentFPS();
    
    if (fps > 50) return 16;   // 60fps target
    if (fps > 30) return 33;   // 30fps target
    if (fps > 20) return 50;   // 20fps target
    return 100;                 // 10fps minimum
  }
}
```

#### Component Virtualization
```typescript
class VirtualizedLog {
  private visibleRange = { start: 0, end: 20 };
  
  render(entries: LogEntry[]): VNode {
    const visibleEntries = entries.slice(
      this.visibleRange.start,
      this.visibleRange.end
    );
    
    return (
      <div 
        class="virtual-log"
        onScroll={this.handleScroll}
        style={{ height: '300px', overflow: 'auto' }}
      >
        <div style={{ height: entries.length * 30 + 'px' }}>
          <div style={{ transform: `translateY(${this.visibleRange.start * 30}px)` }}>
            {visibleEntries.map(entry => (
              <LogEntryComponent entry={entry} height={30} />
            ))}
          </div>
        </div>
      </div>
    );
  }
}
```

### Export & Recording

#### Session Recording
```typescript
interface SessionRecording {
  metadata: {
    id: string;
    startTime: Date;
    config: SimulationConfig;
    persona: string;
  };
  
  frames: RecordingFrame[];
  events: TimelineEvent[];
  
  export(): Blob {
    return new Blob([JSON.stringify({
      metadata: this.metadata,
      frames: this.compressFrames(this.frames),
      events: this.events
    })], { type: 'application/json' });
  }
  
  replay(speed: number = 1) {
    let frameIndex = 0;
    const interval = setInterval(() => {
      if (frameIndex >= this.frames.length) {
        clearInterval(interval);
        return;
      }
      
      this.renderFrame(this.frames[frameIndex]);
      frameIndex++;
    }, 100 / speed);
  }
}

interface RecordingFrame {
  timestamp: number;
  gameTime: GameTime;
  state: CompressedGameState;
  metrics: MetricsSnapshot;
}
```

### Testing & Validation

#### Monitor Tests
```typescript
describe('LiveMonitor', () => {
  it('should handle high-frequency updates', async () => {
    const monitor = new LiveMonitor();
    const updates = generateHighFrequencyUpdates(1000);
    
    const start = performance.now();
    updates.forEach(update => monitor.handleUpdate(update));
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100); // Should process 1000 updates in <100ms
    expect(monitor.droppedFrames).toBeLessThan(10);
  });
  
  it('should trigger breakpoints correctly', () => {
    const monitor = new LiveMonitor();
    monitor.addBreakpoint({
      type: 'resource',
      condition: 'gold > 1000',
      action: 'pause'
    });
    
    monitor.handleUpdate({ resources: { gold: 1001 } });
    
    expect(monitor.isPaused).toBe(true);
    expect(monitor.breakpointHit).toBeDefined();
  });
});
```

### Future Enhancements
1. **Time Travel Debugging**: Rewind and replay simulation segments
2. **Heatmap Overlays**: Visual activity density on game screens
3. **AI Narration**: Natural language description of what's happening
4. **Multiplayer Monitoring**: Compare multiple simulations side-by-side
5. **Custom Visualizers**: Plugin system for game-specific visualizations
6. **Performance Profiling**: Detailed breakdown of system bottlenecks

### Conclusion
The Live Monitor transforms abstract simulation data into an intuitive, real-time visualization that makes game balance validation both effective and engaging. Its comprehensive display system, performance optimizations, and debugging tools provide developers with complete visibility into simulation behavior, enabling rapid identification and resolution of balance issues while maintaining smooth 60fps visualization even during maximum speed simulation.
