# Time Hero Simulator - Player Personas
## Document 4: Behavior Profiles & Play Patterns

---

## 📋 ACTUAL REQUIREMENTS & MVP GOALS (NEW SECTION)

### Core Purpose
Create player behavior profiles to test if Time Hero is balanced for different playstyles. We need to simulate how speedrunners, casual players, and weekend warriors progress differently through the game.

### MVP Requirements (What We're Actually Building)
1. **Three Pre-defined Personas** with simple, clear parameters
2. **Persona Selection UI** - Simple cards to pick from
3. **Basic Custom Persona Builder** - Sliders for key parameters
4. **Integration with Existing Stores** - Using Pinia Composition API
5. **Save/Load Custom Personas** - LocalStorage persistence

### What We're NOT Building (Yet)
- Complex schedule visualization (heatmaps)
- Behavior radar charts
- Machine learning adaptation
- Emotional modeling
- Social features

### ASCII UI Mockup
```
┌─────────────────────────────────────────────────────────────────┐
│ Player Personas                                     [Dashboard] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Select a Player Persona:                                      │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│  │ ⚡          │ │ 😊          │ │ 📅          │             │
│  │             │ │             │ │             │             │
│  │ SPEEDRUNNER │ │   CASUAL    │ │   WEEKEND   │             │
│  │             │ │             │ │   WARRIOR   │             │
│  │ Efficiency: │ │ Efficiency: │ │ Efficiency: │             │
│  │    95%      │ │    70%      │ │    80%      │             │
│  │             │ │             │ │             │             │
│  │ Daily Play: │ │ Daily Play: │ │ Daily Play: │             │
│  │  10 checks  │ │  2 checks   │ │  1 weekday  │             │
│  │             │ │             │ │  8 weekend  │             │
│  │ [Selected]  │ │  [Select]   │ │  [Select]   │             │
│  └─────────────┘ └─────────────┘ └─────────────┘             │
│                                                                 │
│  ┌─────────────────────────────────────────────┐              │
│  │ Custom Personas (0 saved)                   │              │
│  │                                              │              │
│  │ [+ Create New Custom Persona]                │              │
│  └─────────────────────────────────────────────┘              │
│                                                                 │
│  Selected: SPEEDRUNNER                                         │
│  ┌─────────────────────────────────────────────┐              │
│  │ Details:                                     │              │
│  │ • Optimizes every action                    │              │
│  │ • 95% efficiency rate                       │              │
│  │ • Checks game 10 times per day              │              │
│  │ • Takes calculated risks                    │              │
│  │ • Expected completion: 20 days              │              │
│  │                                              │              │
│  │ Behavior Parameters:                         │              │
│  │ Risk Tolerance:    [████████░░] 80%         │              │
│  │ Optimization:      [██████████] 100%        │              │
│  │ Learning Rate:     [█░░░░░░░░░] 10%         │              │
│  └─────────────────────────────────────────────┘              │
│                                                                 │
│  [View Details] [Edit Copy] [Use in Simulation]                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Custom Persona Builder (Modal):
┌─────────────────────────────────────────────────────────────────┐
│ Create Custom Persona                                      [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Name: [_________________________]                             │
│                                                                 │
│  Base Template: [Casual Player ▼]                              │
│                                                                 │
│  Behavior Settings:                                            │
│                                                                 │
│  Efficiency:       [░░░░░█████░] 70%                          │
│  Risk Taking:      [░░███░░░░░] 30%                          │
│  Optimization:     [░░░█████░░] 60%                          │
│  Learning Speed:   [░░░░█░░░░░] 40%                          │
│                                                                 │
│  Play Schedule:                                                │
│  Weekday Checks:   [░░█░░░░░░░] 2 per day                    │
│  Weekend Checks:   [░░░░░███░░] 6 per day                    │
│                                                                 │
│  Expected Completion: ~28 days (estimated)                     │
│                                                                 │
│  [Random] [Reset]                    [Cancel] [Save Persona]   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Data Structure (Simplified)
```typescript
interface SimplePersona {
  id: string
  name: string
  description: string
  
  // Core behavior (0-1 scale)
  efficiency: number        // How optimal their decisions are
  riskTolerance: number    // Willingness to try dangerous routes
  optimization: number     // How much they min-max
  learningRate: number     // How fast they improve
  
  // Simple schedule
  weekdayCheckIns: number  // Times per weekday
  weekendCheckIns: number  // Times per weekend day
  avgSessionLength: number // Minutes per check-in
  
  // Expectations
  targetDays: number       // Expected completion time
  
  // Focus (must sum to 1.0)
  focusAreas: {
    farming: number
    combat: number
    mining: number
    tower: number
    forge: number
  }
}
```

### Integration Points
1. **PersonaStore** (new Pinia store using Composition API)
2. **Connects to SimulationEngine** (future Phase 6)
3. **Used by SimulationSetup** (Phase 5)
4. **Saves to LocalStorage** (no backend needed)

### Success Criteria
- [ ] Can select from 3 pre-defined personas
- [ ] Can view persona details and parameters
- [ ] Can create custom personas with sliders
- [ ] Custom personas save to LocalStorage
- [ ] Personas load when returning to page
- [ ] Clear visual distinction between persona types
- [ ] Responsive dark theme matching existing UI

---

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

#### Visual Builder Interface (Using established UI patterns)
```vue
<template>
  <div class="bg-sim-surface border border-sim-border rounded-lg p-6">
    <div class="card-header border-b border-sim-border pb-4 mb-4">
      <h2 class="text-lg font-semibold text-sim-text">Create Custom Persona</h2>
    </div>
    
    <div class="card-body space-y-6">
      <!-- Basic Info Section -->
      <div class="form-section">
        <h3 class="form-section-header text-sim-text mb-3">
          <i class="fas fa-user form-section-icon text-sim-accent mr-2"></i>
          Basic Info
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-sim-muted mb-1">
              Name
            </label>
            <input v-model="formData.name" 
                   type="text"
                   placeholder="Farming Fanatic"
                   class="w-full border border-sim-border rounded-lg bg-sim-bg text-sim-text px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sim-accent focus:border-transparent" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-sim-muted mb-1">
              Icon
            </label>
            <select v-model="formData.icon"
                    class="w-full border border-sim-border rounded-lg bg-sim-bg text-sim-text px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sim-accent focus:border-transparent">
              <option value="fa-seedling">🌾 Farmer</option>
              <option value="fa-sword">⚔️ Warrior</option>
              <option value="fa-flask">🧪 Researcher</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Schedule Section -->
      <div class="form-section">
        <h3 class="form-section-header text-sim-text mb-3">
          <i class="fas fa-calendar form-section-icon text-sim-accent mr-2"></i>
          Schedule
        </h3>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-sim-muted">Weekday Check-ins</label>
            <input v-model.number="formData.weekdayCheckIns"
                   type="range" min="1" max="10" step="1"
                   class="w-full" />
            <span class="text-sm text-sim-accent">{{ formData.weekdayCheckIns }}</span>
          </div>
          
          <div>
            <label class="text-sm text-sim-muted">Weekend Check-ins</label>
            <input v-model.number="formData.weekendCheckIns"
                   type="range" min="1" max="15" step="1"
                   class="w-full" />
            <span class="text-sm text-sim-accent">{{ formData.weekendCheckIns }}</span>
          </div>
        </div>
      </div>
      
      <!-- Behavior Section -->
      <div class="form-section">
        <h3 class="form-section-header text-sim-text mb-3">
          <i class="fas fa-brain form-section-icon text-sim-accent mr-2"></i>
          Behavior
        </h3>
        
        <div class="space-y-3">
          <BehaviorSlider label="Efficiency" 
                         v-model="formData.efficiency"
                         :min="0" :max="100" />
          
          <BehaviorSlider label="Risk Taking" 
                         v-model="formData.riskTolerance"
                         :min="0" :max="100" />
          
          <BehaviorSlider label="Optimization" 
                         v-model="formData.optimization"
                         :min="0" :max="100" />
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex justify-end space-x-3 pt-4 border-t border-sim-border">
        <button @click="randomizePersona"
                class="px-4 py-2 bg-sim-surface text-sim-text border border-sim-border rounded hover:bg-slate-700 transition-colors">
          <i class="fas fa-dice mr-2"></i>
          Random
        </button>
        
        <button @click="loadTemplate"
                class="px-4 py-2 bg-sim-surface text-sim-text border border-sim-border rounded hover:bg-slate-700 transition-colors">
          <i class="fas fa-file-import mr-2"></i>
          Load Template
        </button>
        
        <button @click="savePersona"
                :disabled="!canSave"
                class="px-4 py-2 bg-sim-accent text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <i class="fas fa-save mr-2"></i>
          Save
        </button>
      </div>
    </div>
  </div>
</template>
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

#### Persona Store (Using Composition API pattern from completed phases)
```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PlayerPersona, ComparisonResult, ValidationError } from '@/types/personas'

export const usePersonaStore = defineStore('personas', () => {
  // State - using ref pattern from gameDataStore
  const presets = ref<Map<string, PlayerPersona>>(new Map([
    ['speedrunner', speedrunner],
    ['casual', casualPlayer],
    ['weekend-warrior', weekendWarrior]
  ]))
  
  const custom = ref<Map<string, PlayerPersona>>(new Map())
  const selected = ref<string>('casual')
  const isLoading = ref(false)
  
  // Editor state - similar to configuration store pattern
  const editorState = ref({
    current: null as PlayerPersona | null,
    isDirty: false,
    validation: [] as ValidationError[]
  })
  
  // Comparison state
  const comparisonState = ref({
    personas: [] as string[],
    results: null as ComparisonResult | null
  })
  
  // Computed - following established patterns
  const currentPersona = computed(() => 
    presets.value.get(selected.value) || 
    custom.value.get(selected.value)
  )
  
  const allPersonas = computed(() => [
    ...Array.from(presets.value.values()),
    ...Array.from(custom.value.values())
  ])
  
  const canSave = computed(() => 
    editorState.value.isDirty && 
    editorState.value.validation.length === 0
  )
  
  // Actions - async pattern from gameDataStore
  async function loadPersonas() {
    isLoading.value = true
    try {
      // Load from localStorage or default presets
      const stored = localStorage.getItem('customPersonas')
      if (stored) {
        const parsed = JSON.parse(stored)
        custom.value = new Map(Object.entries(parsed))
      }
    } catch (error) {
      console.error('Failed to load personas:', error)
    } finally {
      isLoading.value = false
    }
  }
  
  function createPersona(template?: string) {
    const base = template ? 
      presets.value.get(template) : 
      generateDefault()
    
    editorState.value.current = {
      ...base,
      id: `custom_${Date.now()}`,
      name: 'New Persona'
    }
    editorState.value.isDirty = false
  }
  
  function updatePersonaBehavior(updates: Partial<BehaviorProfile>) {
    if (editorState.value.current) {
      editorState.value.current.behavior = {
        ...editorState.value.current.behavior,
        ...updates
      }
      editorState.value.isDirty = true
      validatePersona()
    }
  }
  
  async function savePersona() {
    if (!canSave.value) return
    
    const persona = editorState.value.current!
    custom.value.set(persona.id, persona)
    
    // Save to localStorage
    const toStore = Object.fromEntries(custom.value)
    localStorage.setItem('customPersonas', JSON.stringify(toStore))
    
    editorState.value.isDirty = false
  }
  
  function validatePersona() {
    const errors: ValidationError[] = []
    const persona = editorState.value.current
    
    if (!persona) return
    
    // Validation logic
    if (!persona.name?.trim()) {
      errors.push({ field: 'name', message: 'Name is required' })
    }
    
    // Check focus areas sum to 1
    const focusSum = Object.values(persona.patterns.focusAreas || {})
      .reduce((sum, val) => sum + val, 0)
    
    if (Math.abs(focusSum - 1.0) > 0.01) {
      errors.push({
        field: 'focusAreas',
        message: `Focus areas must sum to 100% (currently ${focusSum * 100}%)`
      })
    }
    
    editorState.value.validation = errors
  }
  
  async function runComparison(personaIds: string[]) {
    comparisonState.value.personas = personaIds
    isLoading.value = true
    
    try {
      const simulations = await Promise.all(
        personaIds.map(id => {
          const persona = getPersona(id)
          return runSimulation(persona)
        })
      )
      
      comparisonState.value.results = analyzeResults(simulations)
    } finally {
      isLoading.value = false
    }
  }
  
  function getPersona(id: string): PlayerPersona | undefined {
    return presets.value.get(id) || custom.value.get(id)
  }
  
  // Return public interface
  return {
    // State
    presets,
    custom,
    selected,
    isLoading,
    editorState,
    comparisonState,
    
    // Computed
    currentPersona,
    allPersonas,
    canSave,
    
    // Actions
    loadPersonas,
    createPersona,
    updatePersonaBehavior,
    savePersona,
    validatePersona,
    runComparison,
    getPersona
  }
})
```

### Visualization

#### Schedule Heatmap (Using established dark theme patterns)
```vue
<template>
  <div class="bg-sim-surface border border-sim-border rounded-lg p-4">
    <h3 class="text-lg font-semibold text-sim-text mb-4">Play Schedule</h3>
    
    <div class="schedule-heatmap">
      <!-- Hour labels -->
      <div class="flex ml-16">
        <div v-for="hour in hours" :key="hour" 
             class="w-8 text-xs text-sim-muted text-center">
          {{ hour }}
        </div>
      </div>
      
      <!-- Day rows -->
      <div v-for="(day, d) in days" :key="day" class="flex items-center">
        <div class="w-16 text-sm text-sim-text">{{ day }}</div>
        
        <div v-for="hour in hours" :key="hour"
             class="w-8 h-8 border border-sim-border"
             :style="getCellStyle(d, hour)"
             :title="`${day} ${hour}:00 - ${getIntensity(d, hour) * 100}% chance`">
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  persona: PlayerPersona
}>()

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const hours = Array.from({ length: 24 }, (_, i) => i)

function getIntensity(day: number, hour: number) {
  const isWeekend = day >= 5
  const pattern = isWeekend ? 
    props.persona.schedule.weekend : 
    props.persona.schedule.weekday
  
  const slot = pattern.times.find(t => 
    hour >= t.hour && hour < t.hour + (t.duration / 60)
  )
  
  return slot ? slot.probability[pattern.times.indexOf(slot)] || 0 : 0
}

function getCellStyle(day: number, hour: number) {
  const intensity = getIntensity(day, hour)
  return {
    backgroundColor: `rgba(34, 197, 94, ${intensity * 0.8})`,
    opacity: 0.5 + (intensity * 0.5)
  }
}
</script>
```

#### Behavior Radar Chart (Using Chart.js integration)
```typescript
import { Chart, RadarController, RadialLinearScale, PointElement, LineElement } from 'chart.js'

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement)

export function createBehaviorRadar(persona: PlayerPersona, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  
  const data = {
    labels: ['Efficiency', 'Risk Taking', 'Optimization', 'Learning', 'Consistency'],
    datasets: [{
      label: persona.name,
      data: [
        persona.behavior.efficiency.base,
        persona.behavior.riskTolerance,
        persona.behavior.optimizationLevel,
        persona.behavior.learningCurve.learningRate,
        1 - persona.schedule.variance
      ],
      backgroundColor: `${persona.color}33`,
      borderColor: persona.color,
      borderWidth: 2,
      pointBackgroundColor: persona.color
    }]
  }
  
  return new Chart(ctx, {
    type: 'radar',
    data,
    options: {
      scales: {
        r: {
          min: 0,
          max: 1,
          ticks: {
            stepSize: 0.2,
            color: '#94a3b8' // text-sim-muted
          },
          grid: {
            color: '#475569' // border-sim-border
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: '#e2e8f0' // text-sim-text
          }
        }
      }
    }
  })
}
```

### Testing & Validation

#### Persona Validation
```typescript
interface PersonaValidator {
  validate(persona: PlayerPersona): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    // Check schedule feasibility
    if (persona.schedule.weekday.checkIns > 10) {
      warnings.push({
        field: 'weekday.checkIns',
        message: 'Very high weekday check-ins may be unrealistic'
      })
    }
    
    // Check efficiency ranges
    if (persona.behavior.efficiency.base > 1.0) {
      errors.push({
        field: 'efficiency.base',
        message: 'Efficiency cannot exceed 100%'
      })
    }
    
    // Check focus areas sum to 1
    const focusSum = Object.values(persona.patterns.focusAreas)
      .reduce((sum, val) => sum + val, 0)
    
    if (Math.abs(focusSum - 1.0) > 0.01) {
      errors.push({
        field: 'focusAreas',
        message: `Focus areas must sum to 100% (currently ${focusSum * 100}%)`
      })
    }
    
    return { valid: errors.length === 0, errors, warnings }
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
    }
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
    }
  }
}
```

#### Data Store Integration
```typescript
// Integration with existing gameDataStore
import { useGameDataStore } from '@/stores/gameData'

export function getAvailableUpgrades(persona: PlayerPersona): GameDataItem[] {
  const gameData = useGameDataStore()
  const currentResources = getCurrentResources()
  
  return gameData.items
    .filter(item => {
      // Check if persona can afford it
      const canAfford = 
        (!item.goldCost || currentResources.gold >= item.goldCost) &&
        (!item.energyCost || currentResources.energy >= item.energyCost)
      
      // Check if prerequisites met
      const prereqsMet = item.prerequisites.every(p => 
        ownedUpgrades.includes(p)
      )
      
      // Apply persona's decision-making filter
      const personaWants = evaluatePersonaInterest(persona, item)
      
      return canAfford && prereqsMet && personaWants
    })
}
```

### Performance Considerations

#### Persona Caching
```typescript
class PersonaCache {
  private cache = new Map<string, CachedPersona>()
  
  getCachedDecisions(persona: PlayerPersona, gameState: GameState): Decision[] {
    const key = `${persona.id}_${gameState.hash}`
    
    if (this.cache.has(key)) {
      const cached = this.cache.get(key)!
      if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
        return cached.decisions
      }
    }
    
    const decisions = this.calculateDecisions(persona, gameState)
    this.cache.set(key, { decisions, timestamp: Date.now() })
    
    return decisions
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

*Document updated: January 2025*  
*Aligned with completed Phases 1-3 implementation patterns*
