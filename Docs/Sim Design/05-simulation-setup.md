# Time Hero Simulator - Simulation Setup
## Document 5: Configuration Wizard & Launch Control

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

#### Interface Design
```
┌─────────────────────────────────────────┐
│      Simulation Setup - Basic Config    │
├─────────────────────────────────────────┤
│                                          │
│ Simulation Name                         │
│ [Casual Player Balance Test    ]        │
│                                          │
│ Description (optional)                  │
│ [Testing if casual players can complete │
│  the game within 35 days with new      │
│  adventure balance changes.            ]│
│                                          │
│ Duration                                │
│ ● Simulate specific days: [35  ] days   │
│ ○ Run until completion                  │
│ ○ Run until bottleneck                 │
│                                          │
│ Success Criteria                        │
│ ☑ Complete game                        │
│ ☑ Within [35] days                     │
│ ☐ Reach phase: [Endgame        ▼]     │
│ ☐ No bottlenecks lasting > [3] days    │
│ ☐ Minimum efficiency: [60]%            │
│                                          │
│ Simulation Speed                        │
│ ○ Real-time (1x)                       │
│ ● Fast (100x)                          │
│ ○ Maximum                              │
│                                          │
│        [Back]            [Next →]       │
└─────────────────────────────────────────┘
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

#### Interface Design
```
┌─────────────────────────────────────────┐
│    Simulation Setup - Player Persona    │
├─────────────────────────────────────────┤
│                                          │
│ Select Persona Type                     │
│                                          │
│ ┌─────────────┐ ┌─────────────┐        │
│ │      ⚡      │ │      👤      │        │
│ │ Speedrunner │ │   Casual    │        │
│ │   95% eff   │ │   70% eff   │        │
│ │ 10 check/day│ │ 2 check/day │        │
│ └─────────────┘ └─────────────┘        │
│                                          │
│ ┌─────────────┐ ┌─────────────┐        │
│ │      📅      │ │      ➕      │        │
│ │   Weekend   │ │   Custom    │        │
│ │   Warrior   │ │   Create    │        │
│ │   80% eff   │ │     New     │        │
│ └─────────────┘ └─────────────┘        │
│                                          │
│ Persona Details                         │
│ ┌─────────────────────────────────┐    │
│ │ Efficiency: 70%                 │    │
│ │ Daily Play: 30 min              │    │
│ │ Check-ins: 2 weekday, 3 weekend │    │
│ │ Risk Level: Low (20%)           │    │
│ │ Strategy: Quality of Life       │    │
│ └─────────────────────────────────┘    │
│                                          │
│ ☐ Override persona settings            │
│                                          │
│        [← Back]          [Next →]       │
└─────────────────────────────────────────┘
```

#### Persona Overrides
```typescript
interface PersonaOverrides {
  enabled: boolean;
  
  overrides: {
    efficiency?: Partial<EfficiencyProfile>;
    schedule?: Partial<SchedulePattern>;
    decisionMaking?: Partial<DecisionProfile>;
    customBehaviors?: CustomBehavior[];
  };
  
  presets: {
    name: string;
    description: string;
    overrides: PersonaOverrides;
  }[];
}

// Example override preset
const strugglingCasual: PersonaOverrides = {
  enabled: true,
  overrides: {
    efficiency: {
      tutorial: 0.4,  // Really struggles at start
      earlyGame: 0.5
    },
    schedule: {
      variance: 0.6  // Very inconsistent
    }
  }
};
```

### Step 3: Game Data Selection

#### Interface Design
```
┌─────────────────────────────────────────┐
│     Simulation Setup - Game Data        │
├─────────────────────────────────────────┤
│                                          │
│ Configuration Source                    │
│ ● Current (unsaved changes)            │
│ ○ Default (original CSVs)              │
│ ○ Saved Configuration: [Select...  ▼]  │
│ ○ Custom Mix:                          │
│                                          │
│ Data Validation                         │
│ ┌─────────────────────────────────┐    │
│ │ ✓ 35 CSV files loaded           │    │
│ │ ✓ 2,847 data points valid       │    │
│ │ ⚠ 3 warnings (non-critical)     │    │
│ │                                  │    │
│ │ [View Details]                   │    │
│ └─────────────────────────────────┘    │
│                                          │
│ Configuration Overrides                 │
│ ☐ Override specific values             │
│                                          │
│ ┌─────────────────────────────────┐    │
│ │ Example overrides:               │    │
│ │ crops.carrot.energy: 2           │    │
│ │ adventures.meadow.difficulty: 1.5│    │
│ │ [+ Add Override]                 │    │
│ └─────────────────────────────────┘    │
│                                          │
│        [← Back]          [Next →]       │
└─────────────────────────────────────────┘
```

#### Data Configuration
```typescript
interface GameDataConfig {
  source: 'current' | 'default' | 'saved' | 'custom';
  savedConfigId?: string;
  
  customMix?: {
    base: 'current' | 'default' | 'saved';
    overrides: Map<string, any>; // file.path.to.value -> new value
  };
  
  validation: {
    status: 'valid' | 'warnings' | 'errors';
    issues: ValidationIssue[];
    canProceed: boolean;
  };
  
  experiments?: {
    parameterSweep?: ParameterSweep;
    abTest?: ABTestConfig;
  };
}

interface ParameterSweep {
  parameter: string; // Path to value
  values: any[];     // Values to test
  mode: 'sequential' | 'parallel';
}
```

### Step 4: Screen Configuration

#### Tab-Based Screen Settings
```
┌─────────────────────────────────────────┐
│    Simulation Setup - Screen Settings   │
├─────────────────────────────────────────┤
│ [Farm][Tower][Town][Adventure][Forge][Mine]│
├─────────────────────────────────────────┤
│              Farm Settings               │
│                                          │
│ Starting Conditions                     │
│ Initial Plots: [3      ]                │
│ Starting Seeds: [10 carrot, 5 potato ▼]│
│ Water Capacity: [20     ]               │
│                                          │
│ Automation Settings                     │
│ ☑ Auto-plant when seeds available      │
│ ☑ Auto-water when water available      │
│ ☑ Auto-harvest when ready              │
│ ☐ Prioritize high-value crops          │
│                                          │
│ Efficiency Modifiers                    │
│ Planting efficiency: [100]%             │
│ Watering efficiency: [95 ]%             │
│ Harvest timing: [±5 ] minutes           │
│                                          │
│ Special Rules                           │
│ ☐ Disable offline growth               │
│ ☐ Force water shortage at day [10]     │
│ ☐ Limit seed availability              │
│                                          │
│        [← Back]          [Next →]       │
└─────────────────────────────────────────┘
```

#### Screen-Specific Configurations

##### Farm Configuration
```typescript
interface FarmConfig {
  initial: {
    plots: number;
    seeds: { type: string; amount: number; }[];
    water: number;
    energy: number;
  };
  
  automation: {
    autoPlant: boolean;
    autoWater: boolean;
    autoHarvest: boolean;
    priorityStrategy: 'value' | 'time' | 'balanced';
  };
  
  efficiency: {
    plantingMod: number;   // 0.5 to 1.0
    wateringMod: number;   // 0.5 to 1.0
    harvestWindow: number; // ± minutes variance
  };
  
  specialRules: {
    disableOfflineGrowth?: boolean;
    forceWaterShortage?: { day: number; duration: number; };
    seedLimitations?: { type: string; maxPerDay: number; }[];
  };
}
```

##### Tower Configuration
```typescript
interface TowerConfig {
  initial: {
    reachLevel: number;
    autoCatcherTier: number;
    nets: number;
  };
  
  behavior: {
    activePlayMinutes: number; // Per session
    catchEfficiency: number;   // 0.5 to 1.0
    autoCatcherBonus: number;  // Multiplier
  };
  
  seedDistribution: {
    mode: 'random' | 'weighted' | 'fixed';
    weights?: Map<string, number>;
    guaranteed?: { seed: string; every: number; }[];
  };
}
```

##### Adventure Configuration
```typescript
interface AdventureConfig {
  initial: {
    unlockedRoutes: string[];
    heroLevel: number;
    startingWeapons: string[];
    startingArmor: string[];
  };
  
  combatBehavior: {
    routeSelection: 'optimal' | 'safe' | 'random' | 'rotating';
    difficultyPreference: 'short' | 'medium' | 'long' | 'adaptive';
    retreatThreshold: number; // HP percentage
  };
  
  lootModifiers: {
    goldMultiplier: number;
    materialDropRate: number;
    armorDropChance: number;
  };
  
  specialRules: {
    noDeath?: boolean;
    guaranteedBossKills?: boolean;
    forcedRoutes?: { day: number; route: string; }[];
  };
}
```

##### Mining Configuration
```typescript
interface MiningConfig {
  initial: {
    unlockedDepths: number[];
    pickaxeTier: number;
  };
  
  behavior: {
    depthStrategy: 'shallow' | 'deep' | 'balanced';
    sessionLength: { min: number; max: number; };
    toolSharpening: boolean;
  };
  
  yieldModifiers: {
    materialMultiplier: number;
    rareBonusChance: number;
    energyEfficiency: number;
  };
}
```

### Step 5: Advanced Options

#### Interface Design
```
┌─────────────────────────────────────────┐
│   Simulation Setup - Advanced Options   │
├─────────────────────────────────────────┤
│                                          │
│ Logging & Debug                         │
│ Log Level: [Standard         ▼]         │
│ ☑ Log to file                          │
│ ☑ Include timestamps                   │
│ ☐ Verbose action logging               │
│ ☐ Memory profiling                     │
│                                          │
│ Validation                              │
│ ☑ Validate prerequisites               │
│ ☑ Check resource bounds                │
│ ☑ Detect impossible states             │
│ ☐ Strict mode (fail on warning)        │
│                                          │
│ Experimental Features                   │
│ ☐ Enable A/B testing                   │
│ ┌─────────────────────────────────┐    │
│ │ Variant A: Current config       │    │
│ │ Variant B: [Select...        ▼]│    │
│ │ Sample size: [100] runs each    │    │
│ └─────────────────────────────────┘    │
│                                          │
│ ☐ Parameter sweep                      │
│ ┌─────────────────────────────────┐    │
│ │ Parameter: [crops.carrot.energy]│    │
│ │ Values: [1, 2, 3, 4, 5]         │    │
│ │ ☑ Run in parallel               │    │
│ └─────────────────────────────────┘    │
│                                          │
│ Performance                             │
│ ☑ Use web workers                      │
│ Max workers: [4    ]                    │
│ ☐ Limit memory usage to [500] MB       │
│                                          │
│        [← Back]          [Next →]       │
└─────────────────────────────────────────┘
```

#### Advanced Configuration
```typescript
interface AdvancedConfig {
  logging: {
    level: 'minimal' | 'standard' | 'detailed' | 'debug';
    toFile: boolean;
    includeTimestamps: boolean;
    verboseActions: boolean;
    memoryProfiling: boolean;
    customLoggers?: Logger[];
  };
  
  validation: {
    validatePrerequisites: boolean;
    checkResourceBounds: boolean;
    detectImpossibleStates: boolean;
    strictMode: boolean;
    customValidators?: Validator[];
  };
  
  experiments: {
    abTesting?: {
      enabled: boolean;
      variantA: SimulationConfig;
      variantB: SimulationConfig;
      sampleSize: number;
      metrics: string[];
    };
    
    parameterSweep?: {
      enabled: boolean;
      parameter: string;
      values: any[];
      parallel: boolean;
      aggregation: 'mean' | 'median' | 'all';
    };
  };
  
  performance: {
    useWebWorkers: boolean;
    maxWorkers: number;
    memoryLimit?: number;
    throttleUpdates: boolean;
    updateInterval: number; // ms
  };
  
  random: {
    seed?: number; // For reproducible randomness
    distribution: 'uniform' | 'normal' | 'exponential';
  };
}
```

### Step 6: Review & Launch

#### Interface Design
```
┌─────────────────────────────────────────┐
│    Simulation Setup - Review & Launch   │
├─────────────────────────────────────────┤
│                                          │
│ Configuration Summary                   │
│ ┌─────────────────────────────────┐    │
│ │ Name: Casual Player Balance Test│    │
│ │ Persona: Casual (70% efficiency)│    │
│ │ Duration: 35 days maximum       │    │
│ │ Data: Current + 3 overrides     │    │
│ │ Speed: Fast (100x)              │    │
│ └─────────────────────────────────┘    │
│                                          │
│ Success Criteria                        │
│ ✓ Complete game                        │
│ ✓ Within 35 days                       │
│ ✓ No bottlenecks > 3 days             │
│                                          │
│ Estimated Runtime                       │
│ Single run: ~8 seconds                  │
│ Total with analysis: ~15 seconds       │
│                                          │
│ Save Configuration                      │
│ ☑ Save this configuration              │
│ Name: [Casual Balance v2.1    ]        │
│                                          │
│ Launch Options                          │
│ ○ Run once                             │
│ ● Run [10] times (Monte Carlo)         │
│ ○ Run continuously until stopped       │
│                                          │
│    [← Back]   [Save]   [🚀 Launch]     │
└─────────────────────────────────────────┘
```

#### Launch Configuration
```typescript
interface LaunchConfig {
  summary: {
    name: string;
    persona: string;
    duration: string;
    dataSource: string;
    criteria: string[];
  };
  
  estimatedRuntime: {
    singleRun: number; // seconds
    totalTime: number; // seconds
    runsPerMinute: number;
  };
  
  saveOptions: {
    saveConfig: boolean;
    configName: string;
    autoSaveResults: boolean;
    resultsFormat: 'json' | 'csv' | 'both';
  };
  
  execution: {
    mode: 'single' | 'multiple' | 'continuous';
    count?: number;
    stopCondition?: StopCondition;
    parallel: boolean;
  };
}

interface StopCondition {
  type: 'time' | 'runs' | 'success' | 'failure';
  value: number;
}
```

### Preset Configurations

#### Quick Start Templates
```typescript
const presetConfigs = {
  'quick-test': {
    name: 'Quick Balance Check',
    duration: { mode: 'fixed', maxDays: 7 },
    persona: 'speedrunner',
    speed: 'maximum',
    logging: { level: 'minimal' }
  },
  
  'full-playthrough': {
    name: 'Complete Game Test',
    duration: { mode: 'completion' },
    persona: 'casual',
    speed: 'fast',
    logging: { level: 'standard' }
  },
  
  'bottleneck-hunt': {
    name: 'Find Bottlenecks',
    duration: { mode: 'bottleneck', bottleneckThreshold: 2 },
    persona: 'weekend-warrior',
    speed: 'fast',
    logging: { level: 'detailed' }
  },
  
  'regression-test': {
    name: 'Regression Suite',
    duration: { mode: 'fixed', maxDays: 35 },
    personaSet: ['speedrunner', 'casual', 'weekend-warrior'],
    speed: 'maximum',
    validation: { strictMode: true }
  }
};
```

### Validation System

#### Configuration Validator
```typescript
class ConfigurationValidator {
  validate(config: SimulationConfig): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Check basic config
    if (!config.basic.name) {
      errors.push({
        step: 'basic',
        field: 'name',
        message: 'Simulation name is required'
      });
    }
    
    // Check persona compatibility
    if (config.persona.schedule.weekday.checkIns < 1) {
      warnings.push({
        step: 'persona',
        field: 'schedule',
        message: 'Less than 1 check-in per day may cause issues'
      });
    }
    
    // Check data integrity
    const dataValidation = this.validateGameData(config.gameData);
    errors.push(...dataValidation.errors);
    
    // Check screen configs
    if (config.screens.farm.initial.plots < 3) {
      errors.push({
        step: 'screens',
        field: 'farm.plots',
        message: 'Minimum 3 plots required for tutorial'
      });
    }
    
    return {
      valid: errors.length === 0,
      canProceed: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      warnings
    };
  }
}
```

### State Management

#### Setup Store
```typescript
export const useSetupStore = defineStore('simulationSetup', {
  state: () => ({
    wizard: {
      currentStep: 0,
      visitedSteps: new Set<number>(),
      completedSteps: new Set<number>()
    },
    
    configuration: {
      basic: {} as BasicConfig,
      persona: {} as PersonaConfig,
      gameData: {} as GameDataConfig,
      screens: {} as ScreenConfigs,
      advanced: {} as AdvancedConfig
    },
    
    validation: {
      stepValidation: new Map<string, ValidationResult>(),
      overallValid: false
    },
    
    presets: new Map<string, SimulationConfig>(),
    recent: [] as SimulationConfig[]
  }),
  
  getters: {
    currentStepData: (state) => 
      wizardSteps[state.wizard.currentStep],
    
    canProceed: (state) => {
      const current = wizardSteps[state.wizard.currentStep];
      const validation = state.validation.stepValidation.get(current.id);
      return validation?.valid || !current.isRequired;
    },
    
    isComplete: (state) => 
      state.wizard.completedSteps.size === wizardSteps.filter(s => s.isRequired).length,
    
    configurationSummary: (state) => ({
      name: state.configuration.basic.name,
      persona: state.configuration.persona.name,
      duration: state.configuration.basic.duration,
      dataChanges: state.configuration.gameData.customMix?.overrides.size || 0
    })
  },
  
  actions: {
    nextStep() {
      if (this.canProceed) {
        this.wizard.completedSteps.add(this.wizard.currentStep);
        this.wizard.currentStep++;
        this.wizard.visitedSteps.add(this.wizard.currentStep);
      }
    },
    
    previousStep() {
      if (this.wizard.currentStep > 0) {
        this.wizard.currentStep--;
      }
    },
    
    jumpToStep(stepIndex: number) {
      if (stepIndex < this.wizard.currentStep || 
          this.wizard.visitedSteps.has(stepIndex)) {
        this.wizard.currentStep = stepIndex;
      }
    },
    
    async launchSimulation() {
      const config = this.buildFinalConfig();
      
      if (config.saveOptions.saveConfig) {
        await this.saveConfiguration(config);
      }
      
      // Navigate to Live Monitor
      router.push('/live-monitor');
      
      // Start simulation in background
      simulationStore.startSimulation(config);
    }
  }
});
```

### Integration with Simulation Engine

#### Configuration Compiler
```typescript
class ConfigurationCompiler {
  compile(wizardConfig: WizardConfiguration): EngineConfiguration {
    return {
      // Core settings
      maxDays: wizardConfig.basic.duration.maxDays,
      ticksPerMinute: 1,
      
      // Player behavior
      persona: personaStore.getPersona(wizardConfig.persona.id),
      schedule: this.compileSchedule(wizardConfig.persona),
      
      // Game data
      gameData: this.loadGameData(wizardConfig.gameData),
      
      // System configurations
      systems: {
        farm: this.compileFarmSystem(wizardConfig.screens.farm),
        tower: this.compileTowerSystem(wizardConfig.screens.tower),
        adventure: this.compileAdventureSystem(wizardConfig.screens.adventure),
        mine: this.compileMiningSystem(wizardConfig.screens.mine),
        forge: this.compileForgeSystem(wizardConfig.screens.forge),
        town: this.compileTownSystem(wizardConfig.screens.town)
      },
      
      // Execution settings
      logging: wizardConfig.advanced.logging,
      validation: wizardConfig.advanced.validation,
      performance: wizardConfig.advanced.performance,
      
      // Success criteria
      successCriteria: this.compileSuccessCriteria(wizardConfig.basic.successCriteria)
    };
  }
}
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
    config: { persona: 'speedrunner', duration: { maxDays: 20 } },
    estimatedTime: 5
  },
  {
    id: 'casual-35-day',
    name: 'Casual Full Journey',
    description: 'Standard 35-day casual progression',
    icon: 'fa-user',
    config: { persona: 'casual', duration: { maxDays: 35 } },
    estimatedTime: 10
  }
];
```

### Performance Considerations

#### Configuration Caching
```typescript
class ConfigCache {
  private cache = new LRUCache<string, CompiledConfig>(50);
  
  getCachedConfig(wizard: WizardConfiguration): CompiledConfig {
    const key = this.generateKey(wizard);
    
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const compiled = this.compiler.compile(wizard);
    this.cache.set(key, compiled);
    
    return compiled;
  }
  
  private generateKey(wizard: WizardConfiguration): string {
    return crypto.subtle.digest('SHA-256', 
      new TextEncoder().encode(JSON.stringify(wizard))
    );
  }
}
```

### Testing & Validation

#### Wizard Flow Tests
```typescript
describe('SimulationWizard', () => {
  it('should enforce required steps', () => {
    const wizard = new SimulationWizard();
    expect(wizard.canSkipToReview()).toBe(false);
    
    wizard.completeStep('basic');
    wizard.completeStep('persona');
    wizard.completeStep('gameData');
    
    expect(wizard.canSkipToReview()).toBe(true);
  });
  
  it('should validate configuration before launch', () => {
    const config = createTestConfig();
    config.basic.name = ''; // Invalid
    
    const validation = wizard.validateForLaunch(config);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContainEqual({
      field: 'name',
      message: 'Simulation name is required'
    });
  });
});
```

### Future Enhancements
1. **Configuration Templates**: Industry-standard test scenarios
2. **Batch Setup**: Configure multiple simulations at once
3. **Conditional Logic**: Steps that adapt based on previous choices
4. **Import/Export**: Share configurations with team
5. **Preset Marketplace**: Community-created test configurations

### Conclusion
The Simulation Setup wizard provides a comprehensive yet intuitive interface for configuring game balance tests. Its flexible architecture supports everything from quick validation runs to complex parameter sweeps, ensuring developers can test any aspect of Time Hero's economy with precision and reproducibility.
