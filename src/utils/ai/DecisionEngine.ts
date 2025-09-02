// DecisionEngine - AI Decision-Making Orchestrator
// Phase 9D Implementation

import type { GameState, GameAction, AllParameters, SimplePersona } from '../../types'
import type { 
  IDecisionEngine, 
  DecisionResult, 
  UrgencyLevel, 
  DecisionReasoning,
  SystemRegistry 
} from './types/DecisionTypes'

import { PersonaStrategyFactory } from './PersonaStrategy'
import { ActionScorer } from './ActionScorer'
import { ActionFilter } from './ActionFilter'
import { SeedSystem } from '../systems/SeedSystem'

// Import existing systems
import { TowerSystem } from '../systems/TowerSystem'
import { TownSystem } from '../systems/TownSystem'
import { AdventureSystem } from '../systems/AdventureSystem'
import { ForgeSystem } from '../systems/ForgeSystem'
import { HelperSystem } from '../systems/HelperSystem'

/**
 * Core decision engine that orchestrates AI decision-making
 */
export class DecisionEngine implements IDecisionEngine {
  private actionScorer: ActionScorer
  private actionFilter: ActionFilter
  private lastCheckinTime: number = 0

  constructor() {
    this.actionScorer = new ActionScorer()
    this.actionFilter = new ActionFilter()
  }

  getNextActions(gameState: GameState, parameters: AllParameters, gameDataStore: any): DecisionResult {
    const persona = this.extractPersonaFromParameters(parameters)
    const personaStrategy = PersonaStrategyFactory.create(persona)
    
    // Check if hero should act now
    const shouldAct = this.shouldHeroActNow(gameState, this.lastCheckinTime)
    if (!shouldAct) {
      return {
        actions: [],
        urgency: 'low',
        reasoning: [],
        shouldAct: false,
        nextCheckinTime: this.calculateNextCheckinTime(gameState, personaStrategy)
      }
    }

    // Update last checkin time
    this.lastCheckinTime = gameState.time.totalMinutes

    console.log(`🎯 DECISION ENGINE: Starting evaluation for ${persona.name} persona`)

    // 1. Evaluate emergency actions first
    const emergencyActions = this.evaluateEmergencyActions(gameState, parameters, gameDataStore)
    
    // 2. Evaluate screen-specific actions
    const screenActions = this.evaluateScreenActions(gameState, parameters, gameDataStore)
    
    // 3. Evaluate helper actions
    const helperActions = this.evaluateHelperActions(gameState, parameters, gameDataStore)
    
    // 4. Evaluate navigation actions
    const navigationActions = this.evaluateNavigationActions(gameState, parameters, gameDataStore)
    
    // Combine all actions
    const allActions = [
      ...emergencyActions,
      ...screenActions,
      ...helperActions,
      ...navigationActions
    ]

    console.log(`🔍 DECISION ENGINE: ${allActions.length} total actions before filtering:`)
    for (const action of allActions) {
      console.log(`   - ${action.type} (${action.target || action.id}) at ${action.screen || 'no screen'}`)
    }

    // 5. Filter valid actions
    const validActions = this.actionFilter.filterValidActions(allActions, gameState, gameDataStore)
    
    // 6. Score and prioritize actions
    const scoredActions = validActions.map(action => 
      this.actionScorer.scoreAction(action, gameState, personaStrategy)
    )
    
    // Sort by score and select top actions
    scoredActions.sort((a, b) => b.score - a.score)
    
    // Return top 3 actions (don't overwhelm the system)
    const topActions = scoredActions.slice(0, 3)
    
    // Calculate urgency level
    const urgency = this.calculateUrgencyLevel(topActions, gameState)
    
    // Generate reasoning
    const reasoning: DecisionReasoning[] = topActions.map((action, index) => ({
      action: `${action.type} (${action.target || action.id})`,
      score: action.score,
      reason: action.reasoning,
      factors: action.factors.map(f => `${f.name}: ${f.reason}`)
    }))

    console.log(`🎯 DECISION ENGINE RESULTS: ${validActions.length} valid actions, top 3:`)
    for (let i = 0; i < topActions.length; i++) {
      const action = topActions[i]
      console.log(`   ${i + 1}. ${action.type} (${action.target || action.id}) - Score: ${action.score}`)
    }

    return {
      actions: topActions,
      urgency,
      reasoning,
      shouldAct: true
    }
  }

  shouldHeroActNow(gameState: GameState, lastCheckinTime: number): boolean {
    const persona = this.extractPersonaFromState(gameState)
    const personaStrategy = PersonaStrategyFactory.create(persona)
    
    const currentTime = gameState.time.totalMinutes
    return personaStrategy.shouldCheckIn(currentTime, lastCheckinTime, gameState)
  }

  updateLastCheckin(gameState: GameState): number {
    this.lastCheckinTime = gameState.time.totalMinutes
    return this.lastCheckinTime
  }

  private evaluateEmergencyActions(gameState: GameState, parameters: AllParameters, gameDataStore: any): GameAction[] {
    const actions: GameAction[] = []
    
    // Emergency actions always enabled for seed emergencies
    if (parameters.decisions?.interrupts?.enabled || true) {
      
      // PHASE 8N: Emergency seed collection
      const seedMetrics = SeedSystem.getSeedMetrics(gameState)
      const farmPlots = gameState.progression.farmPlots || 3
      const criticalThreshold = farmPlots
      
      if (seedMetrics.totalSeeds < criticalThreshold) {
        console.log(`🚨 EMERGENCY: Critical seed shortage (${seedMetrics.totalSeeds} < ${criticalThreshold})`)
        
        // Emergency navigation to tower if not there
        if (gameState.location.currentScreen !== 'tower') {
          actions.push({
            id: `emergency_tower_nav_${Date.now()}`,
            type: 'move',
            screen: gameState.location.currentScreen,
            target: 'tower',
            toScreen: 'tower',
            description: 'Emergency navigation to tower for seed collection',
            duration: 1,
            energyCost: 0,
            goldCost: 0,
            prerequisites: [],
            expectedRewards: {}
          })
        } else {
          // Emergency seed catching at tower
          actions.push({
            id: `emergency_catch_seeds_${Date.now()}`,
            type: 'catch_seeds',
            screen: 'tower',
            target: '1', // Ground level
            duration: 5,
            energyCost: 0,
            goldCost: 0,
            prerequisites: [],
            expectedRewards: { items: ['seeds'] }
          })
        }
      }

      // Water crisis emergency
      if (gameState.resources.water.current < gameState.resources.water.max * 0.1) {
        console.log(`🚨 EMERGENCY: Critical water shortage`)
        actions.push({
          id: `emergency_pump_${Date.now()}`,
          type: 'pump',
          screen: 'farm',
          duration: 2,
          energyCost: 5,
          goldCost: 0,
          prerequisites: [],
          expectedRewards: { water: 20 }
        })
      }

      // Energy crisis emergency (harvest ready crops)
      if (gameState.resources.energy.current < 10) {
        const readyToHarvest = gameState.processes.crops.filter(crop => crop.readyToHarvest)
        if (readyToHarvest.length > 0) {
          console.log(`🚨 EMERGENCY: Critical energy shortage, harvesting ready crops`)
          actions.push({
            id: `emergency_harvest_${Date.now()}`,
            type: 'harvest',
            screen: 'farm',
            target: readyToHarvest[0].plotId,
            duration: 2,
            energyCost: 0,
            goldCost: 0,
            prerequisites: [],
            expectedRewards: { energy: 5, items: [readyToHarvest[0].cropId] }
          })
        }
      }
    }
    
    if (actions.length > 0) {
      console.log(`🚨 EMERGENCY ACTIONS GENERATED: ${actions.length} actions`)
      for (const action of actions) {
        console.log(`   - ${action.type}: ${action.target || action.id}`)
      }
    }
    
    return actions
  }

  private evaluateScreenActions(gameState: GameState, parameters: AllParameters, gameDataStore: any): GameAction[] {
    const screen = gameState.location.currentScreen
    
    switch (screen) {
      case 'farm':
        return this.evaluateFarmActions(gameState, parameters, gameDataStore)
      case 'tower':
        return TowerSystem.evaluateActions(gameState, parameters, gameDataStore)
      case 'town':
        return TownSystem.evaluateActions(gameState, parameters, gameDataStore)
      case 'adventure':
        return AdventureSystem.evaluateActions(gameState, parameters, gameDataStore)
      case 'forge':
        return ForgeSystem.evaluateActions(gameState, parameters, gameDataStore)
      case 'mine':
        return this.evaluateMineActions(gameState, parameters, gameDataStore)
      default:
        return []
    }
  }

  private evaluateHelperActions(gameState: GameState, parameters: AllParameters, gameDataStore: any): GameAction[] {
    // For now, return empty array - helpers will be implemented later
    // TODO: Implement helper action evaluation when HelperSystem.evaluateActions is available
    return []
  }

  private evaluateNavigationActions(gameState: GameState, parameters: AllParameters, gameDataStore: any): GameAction[] {
    const actions: GameAction[] = []
    const currentScreen = gameState.location.currentScreen
    
    // Navigation priorities based on current needs
    const priorities = [
      { screen: 'farm', reason: 'farm maintenance', score: 30 },
      { screen: 'tower', reason: 'seed collection', score: 25 },
      { screen: 'town', reason: 'purchases and trading', score: 20 },
      { screen: 'adventure', reason: 'gold and experience', score: 15 },
      { screen: 'forge', reason: 'crafting equipment', score: 10 },
      { screen: 'mine', reason: 'material gathering', score: 10 }
    ]

    for (const priority of priorities) {
      if (priority.screen !== currentScreen) {
        const navigationReason = this.getNavigationReason(priority.screen, gameState)
        
        if (navigationReason.score > 0) {
          actions.push({
            id: `nav_${priority.screen}_${Date.now()}`,
            type: 'move',
            screen: currentScreen,
            target: priority.screen,
            toScreen: priority.screen as any, // TODO: Fix GameScreen type
            description: navigationReason.reason,
            duration: 1,
            energyCost: 0,
            goldCost: 0,
            prerequisites: [],
            expectedRewards: {},
            score: navigationReason.score
          })
        }
      }
    }
    
    return actions
  }

  private evaluateFarmActions(gameState: GameState, parameters: AllParameters, gameDataStore: any): GameAction[] {
    const actions: GameAction[] = []
    
    // Harvest ready crops (highest priority)
    const readyToHarvest = gameState.processes.crops.filter(crop => crop.readyToHarvest)
    if (readyToHarvest.length > 0 && gameState.automation.harvestingEnabled) {
      actions.push({
        id: `harvest_${Date.now()}`,
        type: 'harvest',
        screen: 'farm',
        target: readyToHarvest[0].plotId,
        duration: 2,
        energyCost: 0, // Harvesting is FREE
        goldCost: 0,
        prerequisites: [],
        expectedRewards: { energy: 2, items: [readyToHarvest[0].cropId] }
      })
    }
    
    // Water crops that need it
    const needsWatering = gameState.processes.crops.filter(crop => 
      crop.waterLevel < gameState.automation.wateringThreshold && 
      !crop.readyToHarvest
    )
    
    if (needsWatering.length > 0 && gameState.resources.water.current > 5) {
      actions.push({
        id: `water_${Date.now()}`,
        type: 'water',
        screen: 'farm',
        target: needsWatering[0].plotId,
        duration: 1,
        energyCost: 2,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: {}
      })
    }
    
    // Plant seeds in empty plots
    const emptyPlots = gameState.progression.farmPlots - gameState.processes.crops.length
    const totalSeeds = Array.from(gameState.resources.seeds.values()).reduce((sum: number, count: number) => sum + count, 0)
    
    if (emptyPlots > 0 && (totalSeeds as number) > 0 && gameState.resources.energy.current > 20) {
      // Select best seed to plant
      const bestSeed = this.selectCropToPlant(gameState, gameDataStore)
      if (bestSeed) {
        actions.push({
          id: `plant_${Date.now()}`,
          type: 'plant',
          screen: 'farm',
          target: bestSeed,
          duration: 2,
          energyCost: 8,
          goldCost: 0,
          prerequisites: [],
          expectedRewards: {}
        })
      }
    }
    
    // Water pumping when water is low
    if (gameState.resources.water.current < gameState.resources.water.max * 0.3) {
      actions.push({
        id: `pump_${Date.now()}`,
        type: 'pump',
        screen: 'farm',
        duration: 2,
        energyCost: 5,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: { water: 20 }
      })
    }
    
    return actions
  }

  private evaluateMineActions(gameState: GameState, parameters: AllParameters, gameDataStore: any): GameAction[] {
    const actions: GameAction[] = []
    
    // Basic mining action if we need materials
    const materials = gameState.resources.materials
    const commonMaterials = ['stone', 'copper', 'iron']
    const hasLowMaterials = commonMaterials.some(mat => (materials.get(mat) || 0) < 10)
    
    if (hasLowMaterials && gameState.resources.energy.current > 30) {
      actions.push({
        id: `mine_${Date.now()}`,
        type: 'mine',
        screen: 'mine',
        duration: 5,
        energyCost: 15,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: { materials: { stone: 3, copper: 2 } }
      })
    }
    
    return actions
  }

  private selectCropToPlant(gameState: GameState, gameDataStore: any): string | null {
    // Simple crop selection - prefer crops we have seeds for
    const seeds = gameState.resources.seeds
    const availableSeeds = Array.from(seeds.entries()).filter(([_, count]) => count > 0)
    
    if (availableSeeds.length === 0) return null
    
    // Sort by count (plant what we have most of)
    availableSeeds.sort((a, b) => b[1] - a[1])
    return availableSeeds[0][0]
  }

  private getNavigationReason(screen: string, gameState: GameState): { reason: string; score: number } {
    switch (screen) {
      case 'tower':
        const seedMetrics = SeedSystem.getSeedMetrics(gameState)
        const farmPlots = gameState.progression.farmPlots || 3
        if (seedMetrics.totalSeeds < farmPlots * 2) {
          return { reason: 'Need seeds for planting', score: 50 }
        }
        return { reason: 'Regular seed collection', score: 10 }
        
      case 'town':
        if (gameState.resources.gold > 100) {
          return { reason: 'Have gold for purchases', score: 40 }
        }
        return { reason: 'Check for available upgrades', score: 15 }
        
      case 'adventure':
        if (gameState.resources.gold < 50 && gameState.resources.energy.current > 50) {
          return { reason: 'Need gold income', score: 35 }
        }
        return { reason: 'Adventure for rewards', score: 20 }
        
      case 'mine':
        const materials = gameState.resources.materials
        const hasLowMaterials = ['stone', 'copper', 'iron'].some(mat => (materials.get(mat) || 0) < 10)
        if (hasLowMaterials) {
          return { reason: 'Need materials for crafting', score: 30 }
        }
        return { reason: 'Gather materials', score: 8 }
        
      default:
        return { reason: 'General activity', score: 5 }
    }
  }

  private calculateUrgencyLevel(actions: GameAction[], gameState: GameState): UrgencyLevel {
    if (actions.length === 0) return 'low'
    
    const highestScore = actions[0]?.score || 0
    
    if (highestScore >= 900) return 'emergency'
    if (highestScore >= 500) return 'critical'
    if (highestScore >= 200) return 'high'
    if (highestScore >= 100) return 'normal'
    return 'low'
  }

  private calculateNextCheckinTime(gameState: GameState, personaStrategy: any): number {
    const currentTime = gameState.time.totalMinutes
    const interval = personaStrategy.getMinCheckinInterval(gameState)
    return currentTime + interval
  }

  private extractPersonaFromParameters(parameters: AllParameters): SimplePersona {
    // Extract persona from parameters - fallback to casual if not found
    // TODO: Add persona to AllParameters type
    return (parameters as any).persona || {
      id: 'casual',
      name: 'Casual Casey',
      description: 'Default casual player',
      icon: 'fa-user',
      color: '#10b981',
      efficiency: 0.7,
      riskTolerance: 0.3,
      optimization: 0.6,
      learningRate: 0.4,
      weekdayCheckIns: 2,
      weekendCheckIns: 2,
      avgSessionLength: 15,
      isPreset: true
    }
  }

  private extractPersonaFromState(gameState: GameState): SimplePersona {
    // For now, extract from game state or use default
    // TODO: Store persona config in game state
    return {
      id: 'casual',
      name: 'Casual Casey',
      description: 'Default casual player',
      icon: 'fa-user',
      color: '#10b981',
      efficiency: 0.7,
      riskTolerance: 0.3,
      optimization: 0.6,
      learningRate: 0.4,
      weekdayCheckIns: 2,
      weekendCheckIns: 2,
      avgSessionLength: 15,
      isPreset: true
    }
  }
}
