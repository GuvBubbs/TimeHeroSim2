# Time Hero Simulator - Simulation Setup
## Document 5: Configuration Wizard & Launch Control

---

## 📋 ACTUAL REQUIREMENTS & MVP GOALS (NEW SECTION)

### Core Purpose
Create a multi-step wizard interface to configure simulation parameters before launching. This connects the persona system (Phase 4) with the game data (Phases 1-3) and prepares everything needed for the simulation engine (Phase 6).

### MVP Requirements (What We're Actually Building)
1. **3-Step Wizard** with progress indicator
2. **Step 1: Basic Config** - Name, duration, speed
3. **Step 2: Persona Selection** - Choose from Phase 4 personas
4. **Step 3: Review & Launch** - Summary and start button
5. **Save/Load Configurations** - LocalStorage persistence
6. **Integration with Existing Stores** - Game data, personas, configuration

### What We're NOT Building (Yet)
- Screen-by-screen parameter tweaking
- Advanced validation options
- A/B testing setup
- Batch simulations
- Complex success criteria

### ASCII UI Mockup
```
┌─────────────────────────────────────────────────────────────────┐
│ Simulation Setup                               [Back to Dashboard] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Progress: [■■■■■■■■□□□□] Step 2 of 3                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  Step 1: Basic Configuration ✓                          │  │
│  │  ─────────────────────────────                          │  │
│  │  Name: [Casual Player Test Run_______________]          │  │
│  │                                                          │  │
│  │  Duration:                                              │  │
│  │  ○ Fixed: [35] days                                     │  │
│  │  ● Run until completion                                 │  │
│  │  ○ Run until stuck for [3] days                         │  │
│  │                                                          │  │
│  │  Speed:                                                 │  │
│  │  ○ Real-time (1x) - Watch in detail                     │  │
│  │  ● Fast (100x) - Normal testing                         │  │
│  │  ○ Maximum - Quick validation                           │  │
│  │                                                          │  │
│  │  [◀ Previous]                          [Next ▶]         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Quick Templates:                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ ⚡ Speed Test│ │ 📊 Full Run │ │ 🔍 Find Issue│            │
│  │  20 days    │ │  35 days    │ │  Until stuck │            │
│  │  Maximum    │ │  Fast       │ │  Real-time   │            │
│  │  [Load]     │ │  [Load]     │ │  [Load]      │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Step 2: Select Persona
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Step 2: Select Player Persona                          │
│  ─────────────────────────────                          │
│                                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ ⚡          │ │ 😊          │ │ 📅          │      │
│  │ SPEEDRUNNER │ │   CASUAL    │ │   WEEKEND   │      │
│  │   95% eff   │ │   70% eff   │ │   80% eff   │      │
│  │ [Selected]  │ │  [Select]   │ │  [Select]   │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
│                                                          │
│  Selected Details:                                      │
│  • Efficiency: 95%                                      │
│  • Daily checks: 10 weekday, 15 weekend                │
│  • Expected completion: 20 days                         │
│  • Strategy: Optimal decisions                          │
│                                                          │
│  Data Source:                                            │
│  ● Use current configuration (17 files, 3 modified)     │
│  ○ Use default CSV data                                 │
│  ○ Load saved configuration: [_________▼]               │
│                                                          │
│  [◀ Previous]                          [Next ▶]         │
└──────────────────────────────────────────────────────────┘

Step 3: Review & Launch
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Step 3: Review & Launch                                │
│  ──────────────────────                                 │
│                                                          │
│  Simulation Summary:                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Name:     Casual Player Test Run                │   │
│  │ Persona:  Speedrunner (95% efficiency)          │   │
│  │ Duration: Until completion                      │   │
│  │ Speed:    Fast (100x)                           │   │
│  │ Data:     Current config (3 changes)            │   │
│  │                                                  │   │
│  │ Estimated Time: ~5 minutes                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  Options:                                               │
│  ☑ Save this configuration for later                    │
│  ☐ Generate detailed logs                              │
│  ☐ Include memory profiling                            │
│                                                          │
│  Recent Runs:                                           │
│  • Casual 35-day test - Completed (32 days) ✓          │
│  • Weekend warrior test - Failed (bottleneck day 18) ✗  │
│  • Speedrun validation - Completed (19 days) ✓          │
│                                                          │
│  [◀ Previous]  [Save Config]    [🚀 Launch Simulation]  │
└──────────────────────────────────────────────────────────┘
```

### Key Data Structure (Simplified)
```typescript
interface SimulationConfig {
  // Basic settings
  name: string
  duration: {
    mode: 'fixed' | 'completion' | 'bottleneck'
    maxDays?: number
    stuckThreshold?: number
  }
  speed: 'realtime' | 'fast' | 'maximum'
  
  // Persona from Phase 4
  personaId: string
  
  // Data source
  dataSource: 'current' | 'default' | 'saved'
  savedConfigId?: string
  
  // Options
  generateLogs: boolean
  memoryProfiling: boolean
  saveConfig: boolean
}
```

### Wizard State Management
```typescript
interface WizardState {
  currentStep: 0 | 1 | 2
  config: Partial<SimulationConfig>
  validation: {
    step1: boolean
    step2: boolean
    step3: boolean
  }
  canProceed: boolean
  canGoBack: boolean
}
```

### Integration Points
1. **SetupStore** (new Pinia store using Composition API)
2. **Uses PersonaStore** from Phase 4
3. **Uses GameDataStore** from Phase 1
4. **Saves to LocalStorage** for persistence
5. **Launches to LiveMonitor** (future Phase 7)

### Success Criteria
- [ ] 3-step wizard with progress indicator
- [ ] Can configure basic simulation parameters
- [ ] Can select personas from Phase 4
- [ ] Shows summary before launch
- [ ] Saves configurations to LocalStorage
- [ ] Can load saved configurations
- [ ] Quick templates for common scenarios
- [ ] Dark theme consistent with existing UI

---

### Purpose & Goals
The Simulation Setup provides a **guided configuration wizard** for preparing and launching game simulations. It enables developers to fine-tune simulation parameters, select personas, configure individual game systems, and establish success criteria before initiating a balance test run.

### Integration with Simulator Goals
- **Precise Testing**: Configure exact conditions for reproducible tests
- **Scenario Validation**: Test specific game situations and edge cases
- **Parameter Sweeping**: Run multiple configurations to find optimal values
- **Regression Testing**: Ensure balance changes don't break other systems
- **Hypothesis Testing**: Set up controlled experiments with clear outcomes

### Setup Architecture

#### Wizard Flow
```typescript
interface SimulationWizard {
  steps: WizardStep[];
  currentStep: number;
  configuration: SimulationConfig;
  validation: ValidationState;
  
  canProceed: boolean;
  canGoBack: boolean;
  isComplete: boolean;
}

interface WizardStep {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  component: Component;
  validation: () => ValidationResult;
  
  // Navigation
  isRequired: boolean;
  dependsOn?: string[]; // Other step IDs
  skipIf?: (config: SimulationConfig) => boolean;
}

const wizardSteps: WizardStep[] = [
  {
    id: 'basic',
    title: 'Basic Configuration',
    subtitle: 'Name, duration, and goals',
    icon: 'fa-cog',
    component: BasicConfigStep,
    validation: validateBasicConfig,
    isRequired: true
  },
  {
    id: 'persona',
    title: 'Player Persona',
    subtitle: 'Select or create player behavior',
    icon: 'fa-user',
    component: PersonaSelectionStep,
    validation: validatePersona,
    isRequired: true
  },
  {
    id: 'gameData',
    title: 'Game Data',
    subtitle: 'Choose configuration version',
    icon: 'fa-database',
    component: DataSelectionStep,
    validation: validateGameData,
    isRequired: true
  },
  {
    id: 'screens',
    title: 'Screen Settings',
    subtitle: 'Configure individual systems',
    icon: 'fa-sliders',
    component: ScreenConfigStep,
    validation: validateScreens,
    isRequired: false
  },
  {
    id: 'advanced',
    title: 'Advanced Options',
    subtitle: 'Logging, validation, experiments',
    icon: 'fa-flask',
    component: AdvancedOptionsStep,
    validation: validateAdvanced,
    isRequired: false
  },
  {
    id: 'review',
    title: 'Review & Launch',
    subtitle: 'Confirm settings and start',
    icon: 'fa-rocket',
    component: ReviewLaunchStep,
    validation: () => ({ valid: true }),
    isRequired: true
  }
];
```

### Step 1: Basic Configuration

#### Interface Design (Using established UI patterns)
```vue
<template>
  <div class="bg-sim-surface border border-sim-border rounded-lg p-6">
    <div class="card-header border-b border-sim-border pb-4 mb-6">
      <h2 class="text-lg font-semibold text-sim-text">Simulation Setup - Basic Config</h2>
    </div>
    
    <div class="card-body space-y-6">
      <!-- Simulation Name -->
      <div class="form-section">
        <label class="block text-sm font-medium text-sim-muted mb-2">
          Simulation Name
        </label>
        <input v-model="config.name"
               type="text"
               placeholder="Casual Player Balance Test"
               class="w-full border border-sim-border rounded-lg bg-sim-bg text-sim-text px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sim-accent focus:border-transparent" />
      </div>
      
      <!-- Description -->
      <div class="form-section">
        <label class="block text-sm font-medium text-sim-muted mb-2">
          Description (optional)
        </label>
        <textarea v-model="config.description"
                  rows="3"
                  placeholder="Testing if casual players can complete the game within 35 days with new adventure balance changes."
                  class="w-full border border-sim-border rounded-lg bg-sim-bg text-sim-text px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sim-accent focus:border-transparent" />
      </div>
      
      <!-- Duration -->
      <div class="form-section">
        <h3 class="text-sm font-medium text-sim-text mb-3">Duration</h3>
        <div class="space-y-2">
          <label class="flex items-center">
            <input v-model="config.duration.mode" 
                   type="radio" 
                   value="fixed"
                   class="mr-2 text-sim-accent focus:ring-sim-accent" />
            <span class="text-sim-text">Simulate specific days:</span>
            <input v-model.number="config.duration.maxDays"
                   type="number"
                   :disabled="config.duration.mode !== 'fixed'"
                   class="ml-2 w-20 border border-sim-border rounded bg-sim-bg text-sim-text px-2 py-1 disabled:opacity-50" />
            <span class="ml-2 text-sim-muted">days</span>
          </label>
          
          <label class="flex items-center">
            <input v-model="config.duration.mode" 
                   type="radio" 
                   value="completion"
                   class="mr-2 text-sim-accent focus:ring-sim-accent" />
            <span class="text-sim-text">Run until completion</span>
          </label>
          
          <label class="flex items-center">
            <input v-model="config.duration.mode" 
                   type="radio" 
                   value="bottleneck"
                   class="mr-2 text-sim-accent focus:ring-sim-accent" />
            <span class="text-sim-text">Run until bottleneck</span>
          </label>
        </div>
      </div>
      
      <!-- Success Criteria -->
      <div class="form-section">
        <h3 class="text-sm font-medium text-sim-text mb-3">Success Criteria</h3>
        <div class="space-y-2">
          <label class="flex items-center">
            <input v-model="config.successCriteria.mustComplete" 
                   type="checkbox"
                   class="mr-2 text-sim-accent focus:ring-sim-accent" />
            <span class="text-sim-text">Complete game</span>
          </label>
          
          <label class="flex items-center">
            <input v-model="config.successCriteria.withinDays" 
                   type="checkbox"
                   class="mr-2 text-sim-accent focus:ring-sim-accent" />
            <span class="text-sim-text">Within</span>
            <input v-model.number="config.successCriteria.maxDays"
                   type="number"
                   :disabled="!config.successCriteria.withinDays"
                   class="ml-2 w-20 border border-sim-border rounded bg-sim-bg text-sim-text px-2 py-1 disabled:opacity-50" />
            <span class="ml-2 text-sim-muted">days</span>
          </label>
        </div>
      </div>
      
      <!-- Simulation Speed -->
      <div class="form-section">
        <h3 class="text-sm font-medium text-sim-text mb-3">Simulation Speed</h3>
        <div class="space-y-2">
          <label class="flex items-center">
            <input v-model="config.executionSpeed" 
                   type="radio" 
                   value="realtime"
                   class="mr-2 text-sim-accent focus:ring-sim-accent" />
            <span class="text-sim-text">Real-time (1x)</span>
          </label>
          
          <label class="flex items-center">
            <input v-model="config.executionSpeed" 
                   type="radio" 
                   value="fast"
                   class="mr-2 text-sim-accent focus:ring-sim-accent" />
            <span class="text-sim-text">Fast (100x)</span>
          </label>
          
          <label class="flex items-center">
            <input v-model="config.executionSpeed" 
                   type="radio" 
                   value="maximum"
                   class="mr-2 text-sim-accent focus:ring-sim-accent" />
            <span class="text-sim-text">Maximum</span>
          </label>
        </div>
      </div>
      
      <!-- Navigation -->
      <div class="flex justify-between pt-6 border-t border-sim-border">
        <button @click="goBack"
                class="px-4 py-2 bg-sim-surface text-sim-text border border-sim-border rounded hover:bg-slate-700 transition-colors">
          <i class="fas fa-arrow-left mr-2"></i>
          Back
        </button>
        
        <button @click="goNext"
                :disabled="!canProceed"
                class="px-4 py-2 bg-sim-accent text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          Next
          <i class="fas fa-arrow-right ml-2"></i>
        </button>
      </div>
    </div>
  </div>
</template>
```

#### Configuration Model
```typescript
interface BasicConfig {
  name: string;
  description?: string;
  
  duration: {
    mode: 'fixed' | 'completion' | 'bottleneck';
    maxDays?: number;
    bottleneckThreshold?: number; // Days stuck
  };
  
  successCriteria: {
    mustComplete: boolean;
    maxDays?: number;
    targetPhase?: GamePhase;
    maxBottleneckDuration?: number;
    minEfficiency?: number;
    customCriteria?: CustomCriterion[];
  };
  
  executionSpeed: 'realtime' | 'fast' | 'maximum';
  
  metadata: {
    tags: string[];
    category: 'balance' | 'regression' | 'experiment' | 'custom';
    priority: 'low' | 'normal' | 'high';
  };
}
```

### Step 2: Persona Selection

#### Interface Design (Using card patterns from Dashboard)
```vue
<template>
  <div class="bg-sim-surface border border-sim-border rounded-lg p-6">
    <div class="card-header border-b border-sim-border pb-4 mb-6">
      <h2 class="text-lg font-semibold text-sim-text">Simulation Setup - Player Persona</h2>
    </div>
    
    <div class="card-body">
      <!-- Persona Grid -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <!-- Speedrunner Card -->
        <div @click="selectPersona('speedrunner')"
             :class="getPersonaCardClass('speedrunner')"
             class="cursor-pointer p-4 rounded-lg border-2 transition-all">
          <div class="text-center">
            <i class="fas fa-bolt text-3xl mb-2 text-amber-500"></i>
            <h3 class="font-semibold text-sim-text">Speedrunner</h3>
            <p class="text-sm text-sim-muted">95% efficiency</p>
            <p class="text-sm text-sim-muted">10 check/day</p>
          </div>
        </div>
        
        <!-- Casual Card -->
        <div @click="selectPersona('casual')"
             :class="getPersonaCardClass('casual')"
             class="cursor-pointer p-4 rounded-lg border-2 transition-all">
          <div class="text-center">
            <i class="fas fa-user text-3xl mb-2 text-emerald-500"></i>
            <h3 class="font-semibold text-sim-text">Casual</h3>
            <p class="text-sm text-sim-muted">70% efficiency</p>
            <p class="text-sm text-sim-muted">2 check/day</p>
          </div>
        </div>
        
        <!-- Weekend Warrior Card -->
        <div @click="selectPersona('weekend-warrior')"
             :class="getPersonaCardClass('weekend-warrior')"
             class="cursor-pointer p-4 rounded-lg border-2 transition-all">
          <div class="text-center">
            <i class="fas fa-calendar-week text-3xl mb-2 text-blue-500"></i>
            <h3 class="font-semibold text-sim-text">Weekend Warrior</h3>
            <p class="text-sm text-sim-muted">80% efficiency</p>
            <p class="text-sm text-sim-muted">1 weekday / 8 weekend</p>
          </div>
        </div>
        
        <!-- Custom Card -->
        <div @click="createCustomPersona"
             class="cursor-pointer p-4 rounded-lg border-2 border-dashed border-sim-border hover:border-sim-accent transition-all">
          <div class="text-center">
            <i class="fas fa-plus text-3xl mb-2 text-sim-accent"></i>
            <h3 class="font-semibold text-sim-text">Custom</h3>
            <p class="text-sm text-sim-muted">Create New</p>
          </div>
        </div>
      </div>
      
      <!-- Persona Details -->
      <div v-if="selectedPersona" 
           class="bg-sim-bg border border-sim-border rounded-lg p-4">
        <h3 class="font-semibold text-sim-text mb-3">Persona Details</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-sim-muted">Efficiency:</span>
            <span class="text-sim-text">{{ (selectedPersona.behavior.efficiency.base * 100).toFixed(0) }}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sim-muted">Daily Play:</span>
            <span class="text-sim-text">{{ calculateDailyPlaytime(selectedPersona) }} min</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sim-muted">Check-ins:</span>
            <span class="text-sim-text">{{ selectedPersona.schedule.weekday.checkIns }} weekday, {{ selectedPersona.schedule.weekend.checkIns }} weekend</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sim-muted">Risk Level:</span>
            <span class="text-sim-text">{{ getRiskLevel(selectedPersona.behavior.riskTolerance) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sim-muted">Strategy:</span>
            <span class="text-sim-text">{{ selectedPersona.patterns.upgradeStrategy }}</span>
          </div>
        </div>
      </div>
      
      <!-- Override Option -->
      <div class="mt-4">
        <label class="flex items-center">
          <input v-model="enableOverrides" 
                 type="checkbox"
                 class="mr-2 text-sim-accent focus:ring-sim-accent" />
          <span class="text-sim-text">Override persona settings</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
function getPersonaCardClass(personaId: string) {
  if (selectedPersonaId.value === personaId) {
    return 'border-sim-accent bg-sim-accent bg-opacity-10'
  }
  return 'border-sim-border hover:border-sim-accent'
}

function getRiskLevel(tolerance: number): string {
  if (tolerance < 0.3) return 'Low (20%)'
  if (tolerance < 0.6) return 'Medium (50%)'
  return 'High (80%)'
}
</script>
```

### Step 3: Game Data Selection

#### Interface Design (Using validation patterns from Dashboard)
```vue
<template>
  <div class="bg-sim-surface border border-sim-border rounded-lg p-6">
    <div class="card-header border-b border-sim-border pb-4 mb-6">
      <h2 class="text-lg font-semibold text-sim-text">Simulation Setup - Game Data</h2>
    </div>
    
    <div class="card-body space-y-6">
      <!-- Configuration Source -->
      <div class="form-section">
        <h3 class="text-sm font-medium text-sim-text mb-3">Configuration Source</h3>
        <div class="space-y-2">
          <label class="flex items-center">
            <input v-model="config.source" 
                   type="radio" 
                   value="current"
                   class="mr-2 text-sim-accent focus:ring-sim-accent" />
            <span class="text-sim-text">Current (unsaved changes)</span>
          </label>
          
          <label class="flex items-center">
            <input v-model="config.source" 
                   type="radio" 
                   value="default"
                   class="mr-2 text-sim-accent focus:ring-sim-accent" />
            <span class="text-sim-text">Default (original CSVs)</span>
          </label>
          
          <label class="flex items-center">
            <input v-model="config.source" 
                   type="radio" 
                   value="saved"
                   class="mr-2 text-sim-accent focus:ring-sim-accent" />
            <span class="text-sim-text">Saved Configuration:</span>
            <select v-model="config.savedConfigId"
                    :disabled="config.source !== 'saved'"
                    class="ml-2 border border-sim-border rounded bg-sim-bg text-sim-text px-2 py-1 disabled:opacity-50">
              <option value="">Select...</option>
              <option v-for="cfg in savedConfigs" :key="cfg.id" :value="cfg.id">
                {{ cfg.name }}
              </option>
            </select>
          </label>
        </div>
      </div>
      
      <!-- Data Validation (Similar to Dashboard) -->
      <div class="bg-sim-bg border border-sim-border rounded-lg p-4">
        <h3 class="font-semibold text-sim-text mb-3">Data Validation</h3>
        <div class="space-y-2">
          <div class="flex items-center">
            <i class="fas fa-check-circle text-sim-success mr-2"></i>
            <span class="text-sim-text">{{ gameData.stats.totalItems }} data points loaded</span>
          </div>
          
          <div class="flex items-center">
            <i class="fas fa-check-circle text-sim-success mr-2"></i>
            <span class="text-sim-text">{{ Object.keys(gameData.stats.itemsByFile).length }} CSV files valid</span>
          </div>
          
          <div v-if="warningCount > 0" class="flex items-center">
            <i class="fas fa-exclamation-triangle text-sim-warning mr-2"></i>
            <span class="text-sim-text">{{ warningCount }} warnings (non-critical)</span>
          </div>
          
          <button v-if="gameData.validationIssues.length > 0"
                  @click="showValidationDetails = !showValidationDetails"
                  class="text-sim-accent hover:text-blue-400 text-sm transition-colors">
            <i class="fas fa-eye mr-1"></i>
            View Details
          </button>
        </div>
        
        <!-- Validation Details (expandable) -->
        <div v-if="showValidationDetails" class="mt-3 pt-3 border-t border-sim-border">
          <div v-for="issue in gameData.validationIssues" 
               :key="issue.id"
               class="text-xs p-2 mb-1 rounded"
               :class="getIssueClass(issue.level)">
            <div class="font-medium">{{ issue.level.toUpperCase() }}</div>
            <div>{{ issue.message }}</div>
          </div>
        </div>
      </div>
      
      <!-- Configuration Overrides -->
      <div class="form-section">
        <label class="flex items-center mb-3">
          <input v-model="enableOverrides" 
                 type="checkbox"
                 class="mr-2 text-sim-accent focus:ring-sim-accent" />
          <span class="text-sim-text">Override specific values</span>
        </label>
        
        <div v-if="enableOverrides" 
             class="bg-sim-bg border border-sim-border rounded-lg p-3">
          <div class="text-xs text-sim-muted mb-2">Example overrides:</div>
          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <input placeholder="crops.carrot.energy"
                     class="flex-1 border border-sim-border rounded bg-sim-surface text-sim-text px-2 py-1 text-sm" />
              <input placeholder="2"
                     class="w-20 border border-sim-border rounded bg-sim-surface text-sim-text px-2 py-1 text-sm" />
              <button class="text-sim-error hover:text-red-400">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <button @click="addOverride"
                  class="mt-2 text-sim-accent hover:text-blue-400 text-sm transition-colors">
            <i class="fas fa-plus mr-1"></i>
            Add Override
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
```

### State Management

#### Setup Store (Using Composition API pattern from completed phases)
```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameDataStore } from '@/stores/gameData'
import { usePersonaStore } from '@/stores/personas'
import type { SimulationConfig, WizardStep, ValidationResult } from '@/types/simulation'

export const useSetupStore = defineStore('simulationSetup', () => {
  const router = useRouter()
  const gameData = useGameDataStore()
  const personaStore = usePersonaStore()
  
  // Wizard state
  const currentStep = ref(0)
  const visitedSteps = ref<Set<number>>(new Set([0]))
  const completedSteps = ref<Set<number>>(new Set())
  const isLoading = ref(false)
  
  // Configuration state
  const configuration = ref<SimulationConfig>({
    basic: {
      name: '',
      description: '',
      duration: { mode: 'fixed', maxDays: 35 },
      successCriteria: {
        mustComplete: true,
        maxDays: 35
      },
      executionSpeed: 'fast',
      metadata: {
        tags: [],
        category: 'balance',
        priority: 'normal'
      }
    },
    persona: {
      id: 'casual',
      overrides: {
        enabled: false,
        overrides: {}
      }
    },
    gameData: {
      source: 'current',
      validation: {
        status: 'valid',
        issues: [],
        canProceed: true
      }
    },
    screens: {
      farm: {
        initial: {
          plots: 3,
          seeds: [{ type: 'carrot', amount: 10 }],
          water: 20,
          energy: 50
        },
        automation: {
          autoPlant: true,
          autoWater: true,
          autoHarvest: true,
          priorityStrategy: 'value'
        },
        efficiency: {
          plantingMod: 1.0,
          wateringMod: 0.95,
          harvestWindow: 5
        }
      }
    },
    advanced: {
      logging: {
        level: 'standard',
        toFile: false,
        includeTimestamps: true,
        verboseActions: false,
        memoryProfiling: false
      },
      validation: {
        validatePrerequisites: true,
        checkResourceBounds: true,
        detectImpossibleStates: true,
        strictMode: false
      },
      performance: {
        useWebWorkers: true,
        maxWorkers: 4,
        throttleUpdates: true,
        updateInterval: 100
      }
    }
  })
  
  // Validation state
  const stepValidation = ref<Map<string, ValidationResult>>(new Map())
  
  // Presets and recent configurations
  const presets = ref<Map<string, SimulationConfig>>(new Map())
  const recentConfigs = ref<SimulationConfig[]>([])
  
  // Computed properties
  const currentStepData = computed(() => wizardSteps[currentStep.value])
  
  const canProceed = computed(() => {
    const current = wizardSteps[currentStep.value]
    const validation = stepValidation.value.get(current.id)
    return validation?.valid || !current.isRequired
  })
  
  const canGoBack = computed(() => currentStep.value > 0)
  
  const isComplete = computed(() => {
    const requiredSteps = wizardSteps.filter(s => s.isRequired)
    return requiredSteps.every(s => completedSteps.value.has(wizardSteps.indexOf(s)))
  })
  
  const configurationSummary = computed(() => ({
    name: configuration.value.basic.name,
    persona: personaStore.getPersona(configuration.value.persona.id)?.name || 'Unknown',
    duration: configuration.value.basic.duration.maxDays 
      ? `${configuration.value.basic.duration.maxDays} days` 
      : configuration.value.basic.duration.mode,
    dataChanges: configuration.value.gameData.customMix?.overrides.size || 0,
    speed: configuration.value.basic.executionSpeed
  }))
  
  // Actions
  function nextStep() {
    if (!canProceed.value) return
    
    completedSteps.value.add(currentStep.value)
    currentStep.value++
    visitedSteps.value.add(currentStep.value)
    validateCurrentStep()
  }
  
  function previousStep() {
    if (!canGoBack.value) return
    currentStep.value--
  }
  
  function jumpToStep(stepIndex: number) {
    if (stepIndex < currentStep.value || visitedSteps.value.has(stepIndex)) {
      currentStep.value = stepIndex
      validateCurrentStep()
    }
  }
  
  function validateCurrentStep() {
    const step = wizardSteps[currentStep.value]
    const result = step.validation()
    stepValidation.value.set(step.id, result)
  }
  
  function updateConfiguration(stepId: string, updates: any) {
    // Update specific step configuration
    if (stepId === 'basic') {
      configuration.value.basic = { ...configuration.value.basic, ...updates }
    } else if (stepId === 'persona') {
      configuration.value.persona = { ...configuration.value.persona, ...updates }
    }
    // ... etc for other steps
    
    validateCurrentStep()
  }
  
  async function saveConfiguration(name?: string) {
    const configName = name || configuration.value.basic.name
    const toSave = {
      ...configuration.value,
      savedAt: new Date().toISOString()
    }
    
    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem('savedSimulations') || '{}')
    saved[configName] = toSave
    localStorage.setItem('savedSimulations', JSON.stringify(saved))
    
    // Add to recent
    recentConfigs.value.unshift(toSave)
    if (recentConfigs.value.length > 10) {
      recentConfigs.value.pop()
    }
  }
  
  async function loadConfiguration(configName: string) {
    const saved = JSON.parse(localStorage.getItem('savedSimulations') || '{}')
    if (saved[configName]) {
      configuration.value = saved[configName]
      validateAllSteps()
    }
  }
  
  function validateAllSteps() {
    wizardSteps.forEach(step => {
      const result = step.validation()
      stepValidation.value.set(step.id, result)
    })
  }
  
  function buildFinalConfig(): EngineConfiguration {
    // Compile configuration for simulation engine
    return {
      maxDays: configuration.value.basic.duration.maxDays || 35,
      ticksPerMinute: 1,
      persona: personaStore.getPersona(configuration.value.persona.id)!,
      gameData: gameData.items,
      systems: configuration.value.screens,
      logging: configuration.value.advanced.logging,
      validation: configuration.value.advanced.validation,
      performance: configuration.value.advanced.performance,
      successCriteria: configuration.value.basic.successCriteria
    }
  }
  
  async function launchSimulation() {
    if (!isComplete.value) return
    
    isLoading.value = true
    
    try {
      const config = buildFinalConfig()
      
      if (configuration.value.basic.metadata.tags.includes('save')) {
        await saveConfiguration()
      }
      
      // Store configuration for Live Monitor
      localStorage.setItem('currentSimulation', JSON.stringify(config))
      
      // Navigate to Live Monitor
      await router.push('/live-monitor')
      
      // Start simulation will be handled by Live Monitor
    } finally {
      isLoading.value = false
    }
  }
  
  function reset() {
    currentStep.value = 0
    visitedSteps.value = new Set([0])
    completedSteps.value = new Set()
    stepValidation.value = new Map()
    
    // Reset to default configuration
    configuration.value = {
      basic: {
        name: '',
        description: '',
        duration: { mode: 'fixed', maxDays: 35 },
        successCriteria: { mustComplete: true, maxDays: 35 },
        executionSpeed: 'fast',
        metadata: { tags: [], category: 'balance', priority: 'normal' }
      },
      persona: { id: 'casual', overrides: { enabled: false, overrides: {} } },
      gameData: { source: 'current', validation: { status: 'valid', issues: [], canProceed: true } },
      screens: { /* ... default screen configs ... */ },
      advanced: { /* ... default advanced configs ... */ }
    }
  }
  
  // Load presets on initialization
  async function loadPresets() {
    // Load built-in presets
    presets.value.set('quick-test', {
      basic: {
        name: 'Quick Balance Check',
        duration: { mode: 'fixed', maxDays: 7 },
        executionSpeed: 'maximum'
      },
      persona: { id: 'speedrunner' }
      // ... etc
    } as SimulationConfig)
    
    // Load saved configurations
    const saved = JSON.parse(localStorage.getItem('savedSimulations') || '{}')
    Object.entries(saved).forEach(([name, config]) => {
      presets.value.set(name, config as SimulationConfig)
    })
  }
  
  // Return public interface
  return {
    // State
    currentStep,
    visitedSteps,
    completedSteps,
    configuration,
    stepValidation,
    presets,
    recentConfigs,
    isLoading,
    
    // Computed
    currentStepData,
    canProceed,
    canGoBack,
    isComplete,
    configurationSummary,
    
    // Actions
    nextStep,
    previousStep,
    jumpToStep,
    validateCurrentStep,
    updateConfiguration,
    saveConfiguration,
    loadConfiguration,
    validateAllSteps,
    launchSimulation,
    reset,
    loadPresets
  }
})
```

### Quick Launch Features

#### One-Click Presets
```typescript
interface QuickLaunch {
  presets: {
    id: string;
    name: string;
    description: string;
    icon: string;
    config: Partial<SimulationConfig>;
    estimatedTime: number;
  }[];
  
  recentConfigs: {
    name: string;
    timestamp: Date;
    config: SimulationConfig;
    results?: SimulationResults;
  }[];
  
  favorites: string[]; // Preset IDs
}

const quickLaunchPresets = [
  {
    id: 'speedrun-test',
    name: 'Speedrun Validation',
    description: 'Can optimal play complete in 20 days?',
    icon: 'fa-bolt',
    config: { 
      persona: { id: 'speedrunner' },
      basic: { duration: { mode: 'fixed', maxDays: 20 } }
    },
    estimatedTime: 5
  },
  {
    id: 'casual-35-day',
    name: 'Casual Full Journey',
    description: 'Standard 35-day casual progression',
    icon: 'fa-user',
    config: { 
      persona: { id: 'casual' },
      basic: { duration: { mode: 'fixed', maxDays: 35 } }
    },
    estimatedTime: 10
  },
  {
    id: 'bottleneck-hunt',
    name: 'Find Bottlenecks',
    description: 'Identify progression blocking points',
    icon: 'fa-search',
    config: { 
      basic: { duration: { mode: 'bottleneck', bottleneckThreshold: 2 } },
      advanced: { logging: { level: 'detailed' } }
    },
    estimatedTime: 15
  },
  {
    id: 'regression-suite',
    name: 'Regression Test',
    description: 'Full test across all personas',
    icon: 'fa-check-circle',
    config: { 
      basic: { 
        duration: { mode: 'fixed', maxDays: 35 },
        metadata: { category: 'regression' }
      }
    },
    estimatedTime: 30
  }
];
```

### Performance Considerations

#### Configuration Caching
```typescript
class ConfigCache {
  private cache = new Map<string, CompiledConfig>()
  
  getCachedConfig(wizard: WizardConfiguration): CompiledConfig {
    const key = this.generateKey(wizard)
    
    if (this.cache.has(key)) {
      return this.cache.get(key)
    }
    
    const compiled = this.compiler.compile(wizard)
    this.cache.set(key, compiled)
    
    return compiled
  }
  
  private generateKey(wizard: WizardConfiguration): string {
    // Create hash of configuration for caching
    return btoa(JSON.stringify(wizard)).slice(0, 16)
  }
}
```

### Testing & Validation

#### Wizard Flow Tests
```typescript
describe('SimulationWizard', () => {
  it('should enforce required steps', () => {
    const setupStore = useSetupStore()
    
    // Can't skip to review without completing required steps
    expect(setupStore.isComplete).toBe(false)
    
    // Complete required steps
    setupStore.configuration.basic.name = 'Test Simulation'
    setupStore.validateCurrentStep()
    setupStore.nextStep()
    
    setupStore.configuration.persona.id = 'casual'
    setupStore.validateCurrentStep()
    setupStore.nextStep()
    
    setupStore.configuration.gameData.source = 'default'
    setupStore.validateCurrentStep()
    setupStore.nextStep()
    
    // Now should be complete
    expect(setupStore.isComplete).toBe(true)
  })
  
  it('should validate configuration before launch', () => {
    const setupStore = useSetupStore()
    setupStore.configuration.basic.name = '' // Invalid
    
    setupStore.validateCurrentStep()
    const validation = setupStore.stepValidation.get('basic')
    
    expect(validation?.valid).toBe(false)
    expect(validation?.errors).toContainEqual({
      field: 'name',
      message: 'Simulation name is required'
    })
  })
})
```

### Integration with Other Systems

#### Connection to Game Data
```typescript
// Use actual game data from completed Phase 1
import { useGameDataStore } from '@/stores/gameData'

function loadGameDataForSimulation(config: GameDataConfig) {
  const gameData = useGameDataStore()
  
  switch (config.source) {
    case 'current':
      // Use current in-memory data (may have unsaved changes)
      return gameData.items
      
    case 'default':
      // Reload from original CSV files
      gameData.loadGameData()
      return gameData.items
      
    case 'saved':
      // Load specific saved configuration
      const saved = localStorage.getItem(`config_${config.savedConfigId}`)
      return saved ? JSON.parse(saved) : gameData.items
      
    case 'custom':
      // Apply overrides to base configuration
      const base = gameData.items
      const modified = applyOverrides(base, config.customMix?.overrides)
      return modified
  }
}
```

#### Connection to Persona System
```typescript
// Use personas from Phase 4
import { usePersonaStore } from '@/stores/personas'

function getPersonaForSimulation(personaConfig: PersonaConfig) {
  const personaStore = usePersonaStore()
  const basePersona = personaStore.getPersona(personaConfig.id)
  
  if (!basePersona) {
    throw new Error(`Persona ${personaConfig.id} not found`)
  }
  
  if (personaConfig.overrides.enabled) {
    // Apply overrides to base persona
    return {
      ...basePersona,
      ...personaConfig.overrides.overrides
    }
  }
  
  return basePersona
}
```

### Future Enhancements
1. **Configuration Templates**: Industry-standard test scenarios
2. **Batch Setup**: Configure multiple simulations at once
3. **Conditional Logic**: Steps that adapt based on previous choices
4. **Import/Export**: Share configurations with team
5. **Preset Marketplace**: Community-created test configurations
6. **A/B Testing Wizard**: Specialized flow for comparison tests
7. **Parameter Sweep Wizard**: Automated multi-value testing

### Conclusion
The Simulation Setup wizard provides a comprehensive yet intuitive interface for configuring game balance tests. Built on the established patterns from Phases 1-3, it integrates seamlessly with the existing data layer, configuration system, and upcoming persona system. Its flexible architecture supports everything from quick validation runs to complex parameter sweeps, ensuring developers can test any aspect of Time Hero's economy with precision and reproducibility.

*Document updated: January 2025*  
*Aligned with completed Phases 1-3 implementation patterns*
