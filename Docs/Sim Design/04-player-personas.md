# Time Hero Simulator - Player Personas
## Document 4: Behavior Profiles & Play Patterns

### Purpose & Goals
The Player Personas system models **diverse player behaviors** to test game balance across different playstyles, schedules, and skill levels. By simulating how speedrunners, casual players, and weekend warriors progress differently, we can ensure Time Hero provides a satisfying experience for all player types while maintaining economic balance.

### Integration with Simulator Goals
- **Inclusive Balance**: Ensure all player types can complete the game
- **Progression Validation**: Test that different playstyles reach milestones appropriately
- **Bottleneck Identification**: Find pain points specific to certain behaviors
- **Engagement Modeling**: Verify idle mechanics work for various check-in patterns
- **Difficulty Tuning**: Balance for both optimal and sub-optimal play

### Persona Architecture

#### Core Persona Model
```typescript
interface PlayerPersona {
  id: string;
  name: string;
  description: string;
  icon: string; // Font Awesome class
  color: string; // Theme color
  
  // Schedule patterns
  schedule: {
    weekday: DailyPattern;
    weekend: DailyPattern;
    variance: number; // 0-1, how much schedule varies
  };
  
  // Behavior parameters
  behavior: {
    efficiency: EfficiencyProfile;
    decisionMaking: DecisionProfile;
    riskTolerance: number; // 0-1
    optimizationLevel: number; // 0-1
    learningCurve: LearningProfile;
  };
  
  // Play patterns
  patterns: {
    sessionLength: SessionProfile;
    focusAreas: FocusPreferences;
    upgradeStrategy: UpgradeStrategy;
    resourceManagement: ResourceStrategy;
  };
  
  // Progression expectations
  expectations: {
    targetCompletion: number; // days
    acceptableBottlenecks: number;
    frustrationThreshold: number; // failed attempts before quit
  };
}

interface DailyPattern {
  checkIns: number; // times per day
  times: TimeSlot[]; // when they play
  probability: number[]; // chance of playing at each time
}

interface TimeSlot {
  hour: number; // 0-23
  duration: number; // minutes
  focus: 'active' | 'idle' | 'mixed';
}
```

### Pre-Configured Archetypes

#### 1. The Speedrunner
```typescript
const speedrunner: PlayerPersona = {
  id: 'speedrunner',
  name: 'Speedrunner Sam',
  description: 'Optimizes every action, knows all mechanics, plays efficiently',
  icon: 'fa-bolt',
  color: '#f59e0b', // amber
  
  schedule: {
    weekday: {
      checkIns: 10,
      times: [
        { hour: 7, duration: 5, focus: 'active' },
        { hour: 9, duration: 2, focus: 'idle' },
        { hour: 12, duration: 10, focus: 'active' },
        { hour: 14, duration: 2, focus: 'idle' },
        { hour: 18, duration: 15, focus: 'active' },
        { hour: 20, duration: 5, focus: 'mixed' },
        { hour: 22, duration: 10, focus: 'active' }
      ],
      probability: [0.9, 0.7, 0.95, 0.6, 1.0, 0.8, 0.9]
    },
    weekend: {
      checkIns: 15,
      times: generateHourlySlots(8, 23, 5), // Every hour, 5 min each
      probability: Array(15).fill(0.85)
    },
    variance: 0.1 // Very consistent
  },
  
  behavior: {
    efficiency: {
      base: 0.95,
      tutorial: 1.0,   // Perfect even in tutorial
      earlyGame: 0.98,
      midGame: 0.99,
      lateGame: 1.0,
      endGame: 1.0
    },
    decisionMaking: {
      upgradeChoice: 'optimal',
      adventureChoice: 'risk-reward',
      resourceAllocation: 'mathematical',
      helperAssignment: 'calculated'
    },
    riskTolerance: 0.8, // Takes calculated risks
    optimizationLevel: 1.0, // Maximum optimization
    learningCurve: {
      startingKnowledge: 0.9, // Already knows the game
      learningRate: 0.1, // Learns remaining 10% quickly
      maxKnowledge: 1.0
    }
  },
  
  patterns: {
    sessionLength: {
      min: 2,
      avg: 8,
      max: 30,
      distribution: 'power-law' // Many short, few long
    },
    focusAreas: {
      farming: 0.3,
      combat: 0.25,
      mining: 0.2,
      tower: 0.15,
      forge: 0.1
    },
    upgradeStrategy: 'rush-critical', // Gets key upgrades ASAP
    resourceManagement: 'aggressive' // Spends everything for progress
  },
  
  expectations: {
    targetCompletion: 20, // Expects to finish in 20 days
    acceptableBottlenecks: 2,
    frustrationThreshold: 5
  }
};
```

#### 2. The Casual Player
```typescript
const casualPlayer: PlayerPersona = {
  id: 'casual',
  name: 'Casual Casey',
  description: 'Plays for fun, makes sub-optimal choices, limited time',
  icon: 'fa-user',
  color: '#10b981', // emerald
  
  schedule: {
    weekday: {
      checkIns: 2,
      times: [
        { hour: 12, duration: 10, focus: 'mixed' }, // Lunch break
        { hour: 20, duration: 20, focus: 'active' }  // Evening
      ],
      probability: [0.5, 0.7] // Might skip lunch play
    },
    weekend: {
      checkIns: 3,
      times: [
        { hour: 10, duration: 15, focus: 'active' },
        { hour: 15, duration: 10, focus: 'idle' },
        { hour: 21, duration: 25, focus: 'mixed' }
      ],
      probability: [0.6, 0.4, 0.8]
    },
    variance: 0.4 // Inconsistent schedule
  },
  
  behavior: {
    efficiency: {
      base: 0.70,
      tutorial: 0.60,  // Struggles initially
      earlyGame: 0.65,
      midGame: 0.70,
      lateGame: 0.75,
      endGame: 0.75
    },
    decisionMaking: {
      upgradeChoice: 'intuitive', // What sounds good
      adventureChoice: 'safe', // Avoids risk
      resourceAllocation: 'balanced', // Spreads evenly
      helperAssignment: 'thematic' // What makes sense
    },
    riskTolerance: 0.2, // Very risk-averse
    optimizationLevel: 0.3, // Doesn't optimize much
    learningCurve: {
      startingKnowledge: 0.0,
      learningRate: 0.03, // Slow learner
      maxKnowledge: 0.7 // Never fully optimizes
    }
  },
  
  patterns: {
    sessionLength: {
      min: 5,
      avg: 15,
      max: 30,
      distribution: 'normal'
    },
    focusAreas: {
      farming: 0.5,  // Loves farming
      combat: 0.1,   // Avoids combat
      mining: 0.15,
      tower: 0.2,
      forge: 0.05
    },
    upgradeStrategy: 'quality-of-life', // Prioritizes convenience
    resourceManagement: 'conservative' // Saves for safety
  },
  
  expectations: {
    targetCompletion: 35, // Full timeline expected
    acceptableBottlenecks: 5,
    frustrationThreshold: 3 // Quits easily if stuck
  }
};
```

#### 3. The Weekend Warrior
```typescript
const weekendWarrior: PlayerPersona = {
  id: 'weekend-warrior',
  name: 'Weekend Warrior Wade',
  description: 'Minimal weekday play, binges on weekends',
  icon: 'fa-calendar-week',
  color: '#3b82f6', // blue
  
  schedule: {
    weekday: {
      checkIns: 1,
      times: [
        { hour: 21, duration: 5, focus: 'idle' } // Quick check before bed
      ],
      probability: [0.6] // Sometimes forgets
    },
    weekend: {
      checkIns: 8,
      times: [
        { hour: 9, duration: 30, focus: 'active' },
        { hour: 11, duration: 45, focus: 'active' },
        { hour: 14, duration: 20, focus: 'mixed' },
        { hour: 16, duration: 30, focus: 'active' },
        { hour: 19, duration: 15, focus: 'idle' },
        { hour: 21, duration: 40, focus: 'active' }
      ],
      probability: [0.9, 0.95, 0.7, 0.8, 0.6, 0.9]
    },
    variance: 0.2
  },
  
  behavior: {
    efficiency: {
      base: 0.80,
      tutorial: 0.70,
      earlyGame: 0.75,
      midGame: 0.80,
      lateGame: 0.85,
      endGame: 0.85
    },
    decisionMaking: {
      upgradeChoice: 'researched', // Looks up guides
      adventureChoice: 'progressive', // Steady advancement
      resourceAllocation: 'planned', // Plans for weekend
      helperAssignment: 'guided' // Follows recommendations
    },
    riskTolerance: 0.5,
    optimizationLevel: 0.6,
    learningCurve: {
      startingKnowledge: 0.2, // Did some research
      learningRate: 0.05,
      maxKnowledge: 0.85
    }
  },
  
  patterns: {
    sessionLength: {
      min: 5,
      avg: 30,
      max: 60,
      distribution: 'bimodal' // Short weekday, long weekend
    },
    focusAreas: {
      farming: 0.35,
      combat: 0.3,
      mining: 0.15,
      tower: 0.15,
      forge: 0.05
    },
    upgradeStrategy: 'burst', // Saves for weekend sprees
    resourceManagement: 'feast-famine' // Splurges on weekends
  },
  
  expectations: {
    targetCompletion: 28,
    acceptableBottlenecks: 4,
    frustrationThreshold: 4
  }
};
```

### Behavior Modeling

#### 1. Decision Making Engine
```typescript
class DecisionEngine {
  persona: PlayerPersona;
  gameState: GameState;
  knowledge: number; // Current knowledge level
  
  makeUpgradeDecision(): UpgradeChoice {
    const available = this.getAvailableUpgrades();
    
    switch (this.persona.behavior.decisionMaking.upgradeChoice) {
      case 'optimal':
        return this.selectOptimalUpgrade(available);
      
      case 'intuitive':
        return this.selectIntuitiveUpgrade(available);
      
      case 'researched':
        return this.selectResearchedUpgrade(available);
      
      case 'quality-of-life':
        return this.selectQoLUpgrade(available);
    }
  }
  
  selectOptimalUpgrade(upgrades: Upgrade[]): Upgrade {
    // Calculate ROI for each upgrade
    const scored = upgrades.map(u => ({
      upgrade: u,
      roi: this.calculateROI(u),
      timeToBuy: this.calculateTimeToBuy(u)
    }));
    
    // Apply efficiency modifier
    const efficiency = this.getCurrentEfficiency();
    
    // Add some randomness based on (1 - efficiency)
    scored.forEach(s => {
      s.roi *= (0.9 + Math.random() * 0.2 * (1 - efficiency));
    });
    
    // Sort by ROI/time ratio
    scored.sort((a, b) => 
      (b.roi / b.timeToBuy) - (a.roi / a.timeToBuy)
    );
    
    return scored[0].upgrade;
  }
  
  selectIntuitiveUpgrade(upgrades: Upgrade[]): Upgrade {
    // Filter by what "feels" good
    const preferences = {
      'storage': 0.3,
      'speed': 0.2,
      'automation': 0.25,
      'combat': 0.15,
      'cosmetic': 0.1
    };
    
    // Weight by preference
    const weighted = upgrades.map(u => ({
      upgrade: u,
      weight: preferences[u.category] || 0.1
    }));
    
    // Random weighted selection
    return this.weightedRandom(weighted);
  }
}
```

#### 2. Efficiency Calculator
```typescript
class EfficiencyCalculator {
  calculateActionEfficiency(
    persona: PlayerPersona,
    action: GameAction,
    gamePhase: GamePhase
  ): number {
    // Base efficiency for phase
    const phaseEfficiency = persona.behavior.efficiency[gamePhase];
    
    // Learning curve modifier
    const knowledge = this.getCurrentKnowledge(persona);
    const knowledgeModifier = 0.5 + (0.5 * knowledge);
    
    // Fatigue modifier (efficiency drops in long sessions)
    const sessionLength = this.getCurrentSessionLength();
    const fatigueModifier = Math.max(0.7, 1 - (sessionLength / 120));
    
    // Action complexity modifier
    const complexity = this.getActionComplexity(action);
    const complexityModifier = 1 - (complexity * (1 - persona.optimizationLevel));
    
    return phaseEfficiency * knowledgeModifier * fatigueModifier * complexityModifier;
  }
  
  applyEfficiencyToAction(action: GameAction, efficiency: number): GameAction {
    switch (action.type) {
      case 'plant':
        // Might plant sub-optimal seeds
        if (Math.random() > efficiency) {
          action.seedChoice = this.getSuboptimalSeed();
        }
        break;
      
      case 'adventure':
        // Might choose wrong difficulty
        if (Math.random() > efficiency) {
          action.difficulty = this.getSuboptimalDifficulty();
        }
        break;
      
      case 'upgrade':
        // Might delay purchase
        if (Math.random() > efficiency) {
          action.delay = Math.random() * 10; // 0-10 minute delay
        }
        break;
    }
    
    return action;
  }
}
```

#### 3. Schedule Manager
```typescript
class ScheduleManager {
  persona: PlayerPersona;
  currentDay: number;
  
  getNextCheckIn(): Date {
    const isWeekend = this.currentDay % 7 >= 5;
    const pattern = isWeekend ? 
      this.persona.schedule.weekend : 
      this.persona.schedule.weekday;
    
    // Get base time from pattern
    const slot = this.selectTimeSlot(pattern);
    
    // Apply variance
    const variance = this.persona.schedule.variance;
    const minuteVariance = (Math.random() - 0.5) * variance * 60;
    
    return new Date(
      this.currentDay * 24 * 60 + 
      slot.hour * 60 + 
      minuteVariance
    );
  }
  
  generateSessionActions(slot: TimeSlot): Action[] {
    const actions: Action[] = [];
    const duration = this.getActualDuration(slot);
    
    let timeRemaining = duration;
    
    while (timeRemaining > 0) {
      const action = this.selectNextAction(slot.focus, timeRemaining);
      actions.push(action);
      timeRemaining -= action.duration;
    }
    
    return actions;
  }
  
  selectNextAction(focus: string, timeAvailable: number): Action {
    const weights = this.getActionWeights(focus);
    
    // Filter actions by time available
    const possible = this.getAllActions()
      .filter(a => a.minDuration <= timeAvailable);
    
    // Weight by persona preferences
    const weighted = possible.map(a => ({
      action: a,
      weight: weights[a.category] * this.persona.patterns.focusAreas[a.screen]
    }));
    
    return this.weightedRandom(weighted);
  }
}
```

### Custom Persona Builder

#### Visual Builder Interface
```
┌─────────────────────────────────────────┐
│        Create Custom Persona            │
├─────────────────────────────────────────┤
│ Basic Info                              │
│ Name: [Farming Fanatic         ]        │
│ Icon: [🌾                    ▼]        │
│ Color: [■][■][■][■][■][■]              │
│                                          │
│ Schedule                                │
│ ┌─────────────────────────────────┐    │
│ │ Weekday Check-ins: [3    ] ▼   │    │
│ │ Weekend Check-ins: [5    ] ▼   │    │
│ │                                  │    │
│ │ Session Length:                  │    │
│ │ Min: [5  ] Avg: [20 ] Max: [40 ]│    │
│ └─────────────────────────────────┘    │
│                                          │
│ Behavior                                │
│ Efficiency: [●●●●●●○○○○] 60%           │
│ Risk Taking: [●●○○○○○○○○] 20%          │
│ Optimization: [●●●●●○○○○○] 50%         │
│ Learning Rate: [●●●●●●●○○○] 70%        │
│                                          │
│ Play Focus                              │
│ [████████░░] Farm 40%                  │
│ [████░░░░░░] Combat 20%                │
│ [████░░░░░░] Mining 20%                │
│ [██░░░░░░░░] Tower 10%                 │
│ [██░░░░░░░░] Forge 10%                 │
│                                          │
│ [Random] [Load Template] [Save]         │
└─────────────────────────────────────────┘
```

#### Persona Templates
```typescript
const personaTemplates = {
  'completionist': {
    name: 'Completionist',
    description: 'Must collect everything',
    efficiency: 0.85,
    checkIns: { weekday: 4, weekend: 6 },
    focus: 'balanced',
    strategy: 'collect-all'
  },
  
  'idle-master': {
    name: 'Idle Master',
    description: 'Maximizes offline gains',
    efficiency: 0.75,
    checkIns: { weekday: 2, weekend: 2 },
    focus: 'automation',
    strategy: 'idle-optimization'
  },
  
  'combat-focused': {
    name: 'Combat Focused',
    description: 'Prioritizes adventure progression',
    efficiency: 0.8,
    checkIns: { weekday: 3, weekend: 5 },
    focus: 'combat',
    strategy: 'power-progression'
  },
  
  'economist': {
    name: 'Economist',
    description: 'Min-maxes resource efficiency',
    efficiency: 0.9,
    checkIns: { weekday: 5, weekend: 8 },
    focus: 'optimization',
    strategy: 'economic-efficiency'
  }
};
```

### Persona Analysis

#### Comparative Metrics
```typescript
interface PersonaComparison {
  personas: PlayerPersona[];
  metrics: ComparisonMetric[];
}

interface ComparisonMetric {
  name: string;
  unit: string;
  values: Map<string, number>; // persona ID -> value
}

function comparePersonas(personas: PlayerPersona[]): PersonaComparison {
  const metrics: ComparisonMetric[] = [
    {
      name: 'Expected Completion',
      unit: 'days',
      values: new Map(personas.map(p => [p.id, p.expectations.targetCompletion]))
    },
    {
      name: 'Daily Playtime',
      unit: 'minutes',
      values: new Map(personas.map(p => [p.id, calculateDailyPlaytime(p)]))
    },
    {
      name: 'Efficiency Score',
      unit: '%',
      values: new Map(personas.map(p => [p.id, p.behavior.efficiency.base * 100]))
    },
    {
      name: 'Check-in Frequency',
      unit: 'per day',
      values: new Map(personas.map(p => [p.id, averageCheckIns(p)]))
    }
  ];
  
  return { personas, metrics };
}
```

#### Bottleneck Susceptibility
```typescript
interface BottleneckAnalysis {
  persona: PlayerPersona;
  vulnerabilities: Vulnerability[];
  recommendations: string[];
}

interface Vulnerability {
  phase: GamePhase;
  bottleneck: string;
  severity: 'low' | 'medium' | 'high';
  reason: string;
}

function analyzeBottlenecks(persona: PlayerPersona): BottleneckAnalysis {
  const vulnerabilities: Vulnerability[] = [];
  
  // Check for schedule-based vulnerabilities
  if (persona.schedule.weekday.checkIns < 2) {
    vulnerabilities.push({
      phase: 'earlyGame',
      bottleneck: 'Crop Timing',
      severity: 'high',
      reason: 'Insufficient check-ins for optimal crop rotation'
    });
  }
  
  // Check for efficiency-based vulnerabilities
  if (persona.behavior.efficiency.midGame < 0.7) {
    vulnerabilities.push({
      phase: 'midGame',
      bottleneck: 'Resource Management',
      severity: 'medium',
      reason: 'Sub-optimal decisions compound in mid-game'
    });
  }
  
  // Check for strategy vulnerabilities
  if (persona.patterns.upgradeStrategy === 'quality-of-life') {
    vulnerabilities.push({
      phase: 'lateGame',
      bottleneck: 'Power Progression',
      severity: 'medium',
      reason: 'May lack combat upgrades for late adventures'
    });
  }
  
  return {
    persona,
    vulnerabilities,
    recommendations: generateRecommendations(vulnerabilities)
  };
}
```

### State Management

#### Persona Store
```typescript
export const usePersonaStore = defineStore('personas', {
  state: () => ({
    presets: new Map<string, PlayerPersona>([
      ['speedrunner', speedrunner],
      ['casual', casualPlayer],
      ['weekend-warrior', weekendWarrior]
    ]),
    
    custom: new Map<string, PlayerPersona>(),
    
    selected: 'casual' as string,
    
    comparison: {
      personas: [] as string[],
      results: null as ComparisonResult | null
    },
    
    editor: {
      current: null as PlayerPersona | null,
      isDirty: false,
      validation: [] as ValidationError[]
    }
  }),
  
  getters: {
    currentPersona: (state) => 
      state.presets.get(state.selected) || 
      state.custom.get(state.selected),
    
    allPersonas: (state) => [
      ...Array.from(state.presets.values()),
      ...Array.from(state.custom.values())
    ],
    
    canSave: (state) => 
      state.editor.isDirty && 
      state.editor.validation.length === 0
  },
  
  actions: {
    createPersona(template?: string) {
      const base = template ? 
        this.presets.get(template) : 
        this.generateDefault();
      
      this.editor.current = {
        ...base,
        id: `custom_${Date.now()}`,
        name: 'New Persona'
      };
    },
    
    updatePersonaBehavior(updates: Partial<BehaviorProfile>) {
      if (this.editor.current) {
        this.editor.current.behavior = {
          ...this.editor.current.behavior,
          ...updates
        };
        this.editor.isDirty = true;
        this.validatePersona();
      }
    },
    
    async runComparison(personaIds: string[]) {
      this.comparison.personas = personaIds;
      
      const simulations = await Promise.all(
        personaIds.map(id => 
          this.runSimulation(this.getPersona(id))
        )
      );
      
      this.comparison.results = this.analyzeResults(simulations);
    }
  }
});
```

### Visualization

#### Schedule Heatmap
```typescript
interface ScheduleHeatmap {
  render(persona: PlayerPersona): VNode {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    const getIntensity = (day: number, hour: number) => {
      const isWeekend = day >= 5;
      const pattern = isWeekend ? 
        persona.schedule.weekend : 
        persona.schedule.weekday;
      
      const slot = pattern.times.find(t => 
        hour >= t.hour && hour < t.hour + (t.duration / 60)
      );
      
      return slot ? slot.probability : 0;
    };
    
    return (
      <div class="schedule-heatmap">
        <div class="hours">
          {hours.map(h => <div>{h}:00</div>)}
        </div>
        {days.map((day, d) => (
          <div class="day-row">
            <div class="day-label">{day}</div>
            {hours.map(h => (
              <div 
                class="hour-cell"
                style={{
                  background: `rgba(34, 197, 94, ${getIntensity(d, h)})`
                }}
                title={`${day} ${h}:00 - ${getIntensity(d, h) * 100}% chance`}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }
}
```

#### Behavior Radar Chart
```typescript
interface BehaviorRadar {
  render(persona: PlayerPersona): VNode {
    const axes = [
      { key: 'efficiency', label: 'Efficiency', max: 1 },
      { key: 'risk', label: 'Risk Taking', max: 1 },
      { key: 'optimization', label: 'Optimization', max: 1 },
      { key: 'learning', label: 'Learning', max: 1 },
      { key: 'consistency', label: 'Consistency', max: 1 }
    ];
    
    const values = {
      efficiency: persona.behavior.efficiency.base,
      risk: persona.behavior.riskTolerance,
      optimization: persona.behavior.optimizationLevel,
      learning: persona.behavior.learningCurve.learningRate,
      consistency: 1 - persona.schedule.variance
    };
    
    return <RadarChart axes={axes} values={values} color={persona.color} />;
  }
}
```

### Testing & Validation

#### Persona Validation
```typescript
interface PersonaValidator {
  validate(persona: PlayerPersona): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Check schedule feasibility
    if (persona.schedule.weekday.checkIns > 10) {
      warnings.push({
        field: 'weekday.checkIns',
        message: 'Very high weekday check-ins may be unrealistic'
      });
    }
    
    // Check efficiency ranges
    if (persona.behavior.efficiency.base > 1.0) {
      errors.push({
        field: 'efficiency.base',
        message: 'Efficiency cannot exceed 100%'
      });
    }
    
    // Check focus areas sum to 1
    const focusSum = Object.values(persona.patterns.focusAreas)
      .reduce((sum, val) => sum + val, 0);
    
    if (Math.abs(focusSum - 1.0) > 0.01) {
      errors.push({
        field: 'focusAreas',
        message: `Focus areas must sum to 100% (currently ${focusSum * 100}%)`
      });
    }
    
    return { valid: errors.length === 0, errors, warnings };
  }
}
```

### Integration Points

#### Simulation Engine Connection
```typescript
interface PersonaSimulationBridge {
  prepareSimulation(persona: PlayerPersona): SimulationConfig {
    return {
      scheduleManager: new ScheduleManager(persona),
      decisionEngine: new DecisionEngine(persona),
      efficiencyCalculator: new EfficiencyCalculator(persona),
      
      parameters: {
        maxDays: persona.expectations.targetCompletion * 1.5,
        frustrationQuit: persona.expectations.frustrationThreshold,
        logLevel: 'standard'
      }
    };
  }
  
  interpretResults(results: SimulationResults, persona: PlayerPersona): PersonaReport {
    return {
      success: results.completionDay <= persona.expectations.targetCompletion,
      bottlenecks: results.bottlenecks.filter(b => 
        b.severity > persona.expectations.acceptableBottlenecks
      ),
      efficiencyActual: results.averageEfficiency,
      efficiencyExpected: persona.behavior.efficiency.base,
      recommendations: this.generateRecommendations(results, persona)
    };
  }
}
```

### Performance Considerations

#### Persona Caching
```typescript
class PersonaCache {
  private cache = new Map<string, CachedPersona>();
  
  getCachedDecisions(persona: PlayerPersona, gameState: GameState): Decision[] {
    const key = `${persona.id}_${gameState.hash}`;
    
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
        return cached.decisions;
      }
    }
    
    const decisions = this.calculateDecisions(persona, gameState);
    this.cache.set(key, { decisions, timestamp: Date.now() });
    
    return decisions;
  }
}
```

### Future Enhancements
1. **Machine Learning**: Train personas from real player data
2. **Adaptive Personas**: Personas that evolve during simulation
3. **Social Features**: Personas that respond to community events
4. **Emotional Modeling**: Frustration, satisfaction, engagement tracking
5. **Multiplayer Personas**: Competitive/cooperative behavior patterns

### Conclusion
The Player Personas system enables comprehensive testing of Time Hero's balance across the full spectrum of player behaviors. By modeling diverse playstyles, schedules, and skill levels, we ensure the game provides satisfying progression for everyone from hardcore optimizers to casual farmers, validating that the 35-day journey works for all.
