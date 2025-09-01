# Phase 9D: Extract Decision Engine - Detailed Implementation

## Overview
Extract ~800 lines of AI decision-making logic from SimulationEngine into a dedicated DecisionEngine with persona-based strategies. This creates a clean separation between decision-making (what to do) and execution (how to do it).

## File Structure After Phase 9D

```
src/utils/ai/
├── DecisionEngine.ts (new ~300 lines)
├── PersonaStrategy.ts (new ~200 lines)
├── ActionScorer.ts (new ~200 lines)
├── ActionFilter.ts (new ~100 lines)
└── types/
    ├── DecisionTypes.ts (new ~50 lines)
    └── PersonaTypes.ts (existing, enhanced)
```

## Current Decision Logic in SimulationEngine

### Methods to Extract (Lines ~1200-2000):
```typescript
// Core decision making
- makeDecisions(): GameAction[]
- shouldHeroActNow(): boolean
- getCheckInsToday(): number
- isWeekend(): boolean

// Action evaluation orchestration  
- evaluateAllActions(): GameAction[]
- filterValidActions(actions: GameAction[]): GameAction[]
- scoreActions(actions: GameAction[]): GameAction[]
- selectBestActions(actions: GameAction[]): GameAction[]

// Persona-specific behavior
- getPersonaEfficiency(): number
- getPersonaCheckInPattern(): CheckInPattern
- adjustActionScoreForPersona(action: GameAction, score: number): number

// Priority and bottleneck handling
- getBottleneckPriorities(): ActionPriority[]
- adjustPriorityForGamePhase(priority: number): number
- calculateUrgency(gameState: GameState): UrgencyLevel
```

## 1. DecisionEngine.ts - Core Orchestrator

### Interface Design:
```typescript
export interface IDecisionEngine {
  // Main decision method
  makeDecisions(
    gameState: GameState,
    gameDataStore: GameDataStore,
    systems: SystemRegistry
  ): DecisionResult
  
  // Check-in scheduling
  shouldActNow(gameState: GameState, persona: PersonaConfig): boolean
  
  // Configuration
  setPersona(persona: PersonaConfig): void
  getPersona(): PersonaConfig
}

export interface DecisionResult {
  actions: GameAction[]
  reasoning: DecisionReasoning[]
  nextCheckIn: number // minutes until next check-in
  urgency: UrgencyLevel
}

export interface DecisionReasoning {
  action: string
  score: number
  factors: {
    baseScore: number
    personaModifier: number
    urgencyModifier: number
    bottleneckModifier: number
    explanation: string
  }
}

export interface SystemRegistry {
  adventure: IAdventureSystem
  town: ITownSystem
  tower: ITowerSystem
  forge: IForgeSystem
  farm: IFarmSystem
  mine: IMineSystem
}
```

### Implementation:
```typescript
export class DecisionEngine implements IDecisionEngine {
  private persona: PersonaConfig
  private strategy: IPersonaStrategy
  private scorer: ActionScorer
  private filter: ActionFilter
  private lastCheckIn: number = 0
  
  constructor(persona: PersonaConfig) {
    this.persona = persona
    this.strategy = PersonaStrategyFactory.create(persona)
    this.scorer = new ActionScorer(persona)
    this.filter = new ActionFilter()
  }
  
  makeDecisions(
    gameState: GameState,
    gameDataStore: GameDataStore,
    systems: SystemRegistry
  ): DecisionResult {
    // 1. Check if should act
    if (!this.shouldActNow(gameState, this.persona)) {
      return {
        actions: [],
        reasoning: [],
        nextCheckIn: this.calculateNextCheckIn(gameState),
        urgency: 'low'
      }
    }
    
    // 2. Gather all possible actions from systems
    const allActions = this.gatherActions(gameState, gameDataStore, systems)
    
    // 3. Filter valid actions based on prerequisites and resources
    const validActions = this.filter.filterValid(allActions, gameState, gameDataStore)
    
    // 4. Score actions using persona strategy
    const scoredActions = this.scorer.scoreActions(validActions, gameState, this.strategy)
    
    // 5. Detect bottlenecks and adjust priorities
    const bottlenecks = this.detectBottlenecks(gameState)
    const adjustedActions = this.adjustForBottlenecks(scoredActions, bottlenecks)
    
    // 6. Select best actions based on persona behavior
    const selectedActions = this.strategy.selectActions(adjustedActions, gameState)
    
    // 7. Generate reasoning for debugging
    const reasoning = this.generateReasoning(selectedActions, scoredActions)
    
    // Update last check-in
    this.lastCheckIn = gameState.time.totalMinutes
    
    return {
      actions: selectedActions,
      reasoning,
      nextCheckIn: this.calculateNextCheckIn(gameState),
      urgency: this.calculateUrgency(gameState, bottlenecks)
    }
  }
  
  private gatherActions(
    gameState: GameState,
    gameDataStore: GameDataStore,
    systems: SystemRegistry
  ): GameAction[] {
    const actions: GameAction[] = []
    
    // Gather from each system based on current location
    const location = gameState.location.current
    
    // Always evaluate farm actions (can return from anywhere)
    actions.push(...systems.farm.evaluateActions(gameState, gameDataStore))
    
    // Location-specific actions
    switch (location) {
      case 'farm':
        actions.push(...systems.adventure.evaluateActions(gameState, gameDataStore))
        actions.push(...systems.mine.evaluateActions(gameState, gameDataStore))
        break
      case 'town':
        actions.push(...systems.town.evaluateActions(gameState, gameDataStore))
        break
      case 'tower':
        actions.push(...systems.tower.evaluateActions(gameState, gameDataStore))
        break
      case 'forge':
        actions.push(...systems.forge.evaluateActions(gameState, gameDataStore))
        break
    }
    
    // Add navigation actions
    actions.push(...this.evaluateNavigationActions(gameState))
    
    return actions
  }
  
  shouldActNow(gameState: GameState, persona: PersonaConfig): boolean {
    const currentHour = Math.floor(gameState.time.totalMinutes / 60) % 24
    
    // Don't act at night (10 PM - 6 AM)
    if (currentHour >= 22 || currentHour < 6) {
      return false
    }
    
    // Use persona strategy for check-in pattern
    return this.strategy.shouldCheckIn(
      gameState.time.totalMinutes,
      this.lastCheckIn,
      gameState
    )
  }
}
```

## 2. PersonaStrategy.ts - Behavior Patterns

### Strategy Interface:
```typescript
export interface IPersonaStrategy {
  // Check-in scheduling
  shouldCheckIn(currentTime: number, lastCheckIn: number, gameState: GameState): boolean
  getCheckInFrequency(gameState: GameState): number // minutes between check-ins
  
  // Action selection
  selectActions(scoredActions: ScoredAction[], gameState: GameState): GameAction[]
  
  // Scoring modifiers
  getEfficiencyModifier(): number
  getRiskTolerance(): number
  getOptimizationLevel(): number
}

export interface ScoredAction extends GameAction {
  score: number
  reasoning: string
}
```

### Persona Implementations:
```typescript
export class SpeedrunnerStrategy implements IPersonaStrategy {
  shouldCheckIn(currentTime: number, lastCheckIn: number, gameState: GameState): boolean {
    // Speedrunners check in frequently
    const timeSinceLastCheckIn = currentTime - lastCheckIn
    
    // Emergency overrides
    if (this.hasEmergency(gameState)) {
      return timeSinceLastCheckIn >= 2 // Every 2 minutes in emergency
    }
    
    // Normal frequency: every 30-60 minutes
    return timeSinceLastCheckIn >= 30
  }
  
  getCheckInFrequency(gameState: GameState): number {
    // Adaptive based on game phase
    if (gameState.farm.plots < 10) return 30 // Early game: 30 min
    if (gameState.farm.plots < 40) return 45 // Mid game: 45 min
    return 60 // Late game: 60 min
  }
  
  selectActions(scoredActions: ScoredAction[], gameState: GameState): GameAction[] {
    // Speedrunners execute multiple actions per check-in
    const maxActions = 5
    const selected: GameAction[] = []
    
    // Sort by score
    const sorted = [...scoredActions].sort((a, b) => b.score - a.score)
    
    // Take top actions that don't conflict
    for (const action of sorted) {
      if (selected.length >= maxActions) break
      
      if (!this.conflictsWithSelected(action, selected)) {
        selected.push(action)
      }
    }
    
    return selected
  }
  
  getEfficiencyModifier(): number { return 0.95 }
  getRiskTolerance(): number { return 0.8 }
  getOptimizationLevel(): number { return 0.9 }
  
  private hasEmergency(gameState: GameState): boolean {
    // Check for critical situations
    return (
      gameState.resources.energy.current > gameState.resources.energy.max * 0.9 ||
      gameState.resources.seeds.size === 0 ||
      gameState.resources.water.current < 10
    )
  }
}

export class CasualPlayerStrategy implements IPersonaStrategy {
  shouldCheckIn(currentTime: number, lastCheckIn: number, gameState: GameState): boolean {
    const timeSinceLastCheckIn = currentTime - lastCheckIn
    
    // Casuals check in 2-3 times per day
    const isWeekend = [0, 6].includes(Math.floor(currentTime / 1440) % 7)
    const checkInFrequency = isWeekend ? 240 : 480 // 4 or 8 hours
    
    return timeSinceLastCheckIn >= checkInFrequency
  }
  
  selectActions(scoredActions: ScoredAction[], gameState: GameState): GameAction[] {
    // Casuals do 1-2 actions per check-in
    const sorted = [...scoredActions].sort((a, b) => b.score - a.score)
    return sorted.slice(0, 2)
  }
  
  getEfficiencyModifier(): number { return 0.7 }
  getRiskTolerance(): number { return 0.5 }
  getOptimizationLevel(): number { return 0.6 }
}

export class WeekendWarriorStrategy implements IPersonaStrategy {
  shouldCheckIn(currentTime: number, lastCheckIn: number, gameState: GameState): boolean {
    const timeSinceLastCheckIn = currentTime - lastCheckIn
    const dayOfWeek = Math.floor(currentTime / 1440) % 7
    const isWeekend = [0, 6].includes(dayOfWeek)
    
    if (isWeekend) {
      // Frequent check-ins on weekends
      return timeSinceLastCheckIn >= 60
    } else {
      // Once per weekday
      return timeSinceLastCheckIn >= 720 // 12 hours
    }
  }
  
  selectActions(scoredActions: ScoredAction[], gameState: GameState): GameAction[] {
    const dayOfWeek = Math.floor(gameState.time.totalMinutes / 1440) % 7
    const isWeekend = [0, 6].includes(dayOfWeek)
    
    const sorted = [...scoredActions].sort((a, b) => b.score - a.score)
    
    // More actions on weekends
    return sorted.slice(0, isWeekend ? 4 : 1)
  }
  
  getEfficiencyModifier(): number { return 0.8 }
  getRiskTolerance(): number { return 0.6 }
  getOptimizationLevel(): number { return 0.75 }
}

// Factory for creating strategies
export class PersonaStrategyFactory {
  static create(persona: PersonaConfig): IPersonaStrategy {
    switch (persona.type) {
      case 'speedrunner':
        return new SpeedrunnerStrategy()
      case 'casual':
        return new CasualPlayerStrategy()
      case 'weekend-warrior':
        return new WeekendWarriorStrategy()
      default:
        return new CasualPlayerStrategy()
    }
  }
}
```

## 3. ActionScorer.ts - Scoring Logic

### Scoring System:
```typescript
export class ActionScorer {
  private persona: PersonaConfig
  
  constructor(persona: PersonaConfig) {
    this.persona = persona
  }
  
  scoreActions(
    actions: GameAction[],
    gameState: GameState,
    strategy: IPersonaStrategy
  ): ScoredAction[] {
    return actions.map(action => ({
      ...action,
      score: this.calculateScore(action, gameState, strategy),
      reasoning: this.generateReasoning(action, gameState)
    }))
  }
  
  private calculateScore(
    action: GameAction,
    gameState: GameState,
    strategy: IPersonaStrategy
  ): number {
    let score = 0
    
    // 1. Base score by action type
    score += this.getBaseScore(action)
    
    // 2. Resource efficiency
    score += this.calculateEfficiencyScore(action, gameState)
    
    // 3. Game phase appropriateness
    score += this.calculatePhaseScore(action, gameState)
    
    // 4. Bottleneck resolution
    score += this.calculateBottleneckScore(action, gameState)
    
    // 5. Persona modifiers
    score *= strategy.getEfficiencyModifier()
    
    // 6. Risk adjustment
    if (this.isRiskyAction(action, gameState)) {
      score *= strategy.getRiskTolerance()
    }
    
    // 7. Emergency overrides
    if (this.isEmergencyAction(action, gameState)) {
      score = 9999 // Ultra-high priority
    }
    
    return Math.round(score)
  }
  
  private getBaseScore(action: GameAction): number {
    const baseScores: Record<string, number> = {
      'plant': 100,
      'harvest': 150,
      'pump': 80,
      'cleanup': 200,
      'build': 900, // High priority for unlocking
      'purchase': 300,
      'adventure': 250,
      'craft': 180,
      'mine': 150,
      'catch_seeds': 120,
      'move': 50
    }
    
    return baseScores[action.type] || 50
  }
  
  private calculateEfficiencyScore(action: GameAction, gameState: GameState): number {
    // Energy efficiency
    if (action.energyCost > 0) {
      const energyRatio = gameState.resources.energy.current / action.energyCost
      if (energyRatio < 2) return -50 // Penalize if low on energy
      if (energyRatio > 10) return 50 // Reward if plenty of energy
    }
    
    // Gold efficiency
    if (action.goldCost > 0) {
      const goldRatio = gameState.resources.gold / action.goldCost
      if (goldRatio < 2) return -30
      if (goldRatio > 10) return 30
    }
    
    return 0
  }
  
  private isEmergencyAction(action: GameAction, gameState: GameState): boolean {
    // Seeds emergency
    if (action.type === 'catch_seeds' || action.type === 'move' && action.target === 'tower') {
      const totalSeeds = Array.from(gameState.resources.seeds.values()).reduce((a, b) => a + b, 0)
      if (totalSeeds < gameState.farm.plots) return true
    }
    
    // Water emergency
    if (action.type === 'pump') {
      if (gameState.resources.water.current < gameState.farm.plots) return true
    }
    
    // Energy cap emergency
    if (action.type === 'harvest') {
      if (gameState.resources.energy.current > gameState.resources.energy.max * 0.8) return true
    }
    
    return false
  }
}
```

## 4. ActionFilter.ts - Validation Logic

```typescript
export class ActionFilter {
  filterValid(
    actions: GameAction[],
    gameState: GameState,
    gameDataStore: GameDataStore
  ): GameAction[] {
    return actions.filter(action => {
      // Check prerequisites
      if (!this.checkPrerequisites(action, gameState, gameDataStore)) {
        return false
      }
      
      // Check resources
      if (!this.checkResources(action, gameState)) {
        return false
      }
      
      // Check conflicts
      if (!this.checkConflicts(action, gameState)) {
        return false
      }
      
      return true
    })
  }
  
  private checkPrerequisites(
    action: GameAction,
    gameState: GameState,
    gameDataStore: GameDataStore
  ): boolean {
    if (!action.targetId) return true
    
    const item = gameDataStore.getItemById(action.targetId)
    if (!item?.prerequisites) return true
    
    const prereqs = item.prerequisites.split(';')
    for (const prereq of prereqs) {
      if (!this.hasUnlocked(prereq.trim(), gameState)) {
        return false
      }
    }
    
    return true
  }
  
  private checkResources(action: GameAction, gameState: GameState): boolean {
    // Energy check
    if (action.energyCost > gameState.resources.energy.current) {
      return false
    }
    
    // Gold check
    if (action.goldCost > gameState.resources.gold) {
      return false
    }
    
    // Materials check
    if (action.materials) {
      for (const [material, amount] of Object.entries(action.materials)) {
        const available = gameState.resources.materials.get(material) || 0
        if (available < amount) {
          return false
        }
      }
    }
    
    return true
  }
}
```

## Migration Strategy for Phase 9D

### Step 1: Create AI Module Structure
```bash
mkdir -p src/utils/ai/types
touch src/utils/ai/DecisionEngine.ts
touch src/utils/ai/PersonaStrategy.ts
touch src/utils/ai/ActionScorer.ts
touch src/utils/ai/ActionFilter.ts
touch src/utils/ai/types/DecisionTypes.ts
```

### Step 2: Update SimulationEngine Integration
```typescript
// SimulationEngine.ts
import { DecisionEngine } from './ai/DecisionEngine'
import type { SystemRegistry } from './ai/types/DecisionTypes'

export class SimulationEngine {
  private decisionEngine: DecisionEngine
  private systems: SystemRegistry
  
  constructor(config: SimulationConfig, gameDataStore: GameDataStore) {
    // Create decision engine with persona
    this.decisionEngine = new DecisionEngine(config.persona)
    
    // Register all systems
    this.systems = {
      adventure: this.adventureSystem,
      town: this.townSystem,
      tower: this.towerSystem,
      forge: this.forgeSystem,
      farm: this.farmSystem,
      mine: this.mineSystem
    }
  }
  
  // Simplified tick method
  tick(): TickResult {
    // ... update time, process ongoing activities
    
    // Make decisions through DecisionEngine
    const decisionResult = this.decisionEngine.makeDecisions(
      this.gameState,
      this.gameDataStore,
      this.systems
    )
    
    // Execute selected actions
    const executedActions = []
    for (const action of decisionResult.actions) {
      if (this.executeAction(action)) {
        executedActions.push(action)
      }
    }
    
    // Store reasoning for debugging
    this.lastDecisionReasoning = decisionResult.reasoning
    
    return {
      gameState: this.gameState,
      executedActions,
      events: this.events,
      deltaTime: this.deltaTime,
      isComplete: this.checkVictoryConditions(),
      isStuck: this.checkBottleneckConditions(),
      nextCheckIn: decisionResult.nextCheckIn
    }
  }
}
```

### Step 3: Testing Strategy
```typescript
describe('DecisionEngine', () => {
  it('should respect persona check-in patterns', () => {
    const speedrunner = new DecisionEngine({ type: 'speedrunner' })
    const casual = new DecisionEngine({ type: 'casual' })
    
    const gameState = createMockGameState()
    
    // Speedrunner should act more frequently
    expect(speedrunner.shouldActNow(gameState, speedrunnerConfig)).toBe(true)
    expect(casual.shouldActNow(gameState, casualConfig)).toBe(false)
  })
  
  it('should prioritize emergency actions', () => {
    const engine = new DecisionEngine({ type: 'speedrunner' })
    const gameState = createMockGameState({ seeds: 0, plots: 5 })
    
    const result = engine.makeDecisions(gameState, gameDataStore, systems)
    
    // Should prioritize getting seeds
    expect(result.actions[0].type).toBe('move')
    expect(result.actions[0].target).toBe('tower')
  })
})
```

## Benefits After Phase 9D

1. **Clean Separation**: Decision logic completely separated from execution
2. **Persona Flexibility**: Easy to add new personas or modify behavior
3. **Testable AI**: Can test decision-making in isolation
4. **Debugging**: Clear reasoning for every decision
5. **SimulationEngine Reduction**: ~800 lines moved out

## Common Pitfalls and Solutions

### Pitfall 1: Circular Dependencies
**Problem**: DecisionEngine needs systems, systems need GameState
**Solution**: Use interfaces and dependency injection

### Pitfall 2: Performance Impact
**Problem**: Evaluating all actions every tick is expensive
**Solution**: Cache action evaluations, only re-evaluate on state changes

### Pitfall 3: Lost Behavior
**Problem**: Subtle persona behaviors might be lost in refactor
**Solution**: Create comprehensive tests before refactoring

### Pitfall 4: Debugging Difficulty
**Problem**: Hard to understand why AI made certain decisions
**Solution**: Comprehensive reasoning system with detailed logging

## Next Phase Preview
Phase 9E will extract action execution, creating a unified execution pipeline that handles all action types consistently, with proper validation, state updates, and event generation.