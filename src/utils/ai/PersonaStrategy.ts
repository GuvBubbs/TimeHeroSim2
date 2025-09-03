// PersonaStrategy - Persona-based AI Behavior Patterns
// Phase 9D Implementation

import type { GameState, SimplePersona } from '../../types'
import type { ActionDecision, IPersonaStrategy } from './types/DecisionTypes'
import type { GameAction } from '../../types'

/**
 * Base persona strategy with common behavior
 */
export abstract class BasePersonaStrategy implements IPersonaStrategy {
  protected persona: SimplePersona

  constructor(persona: SimplePersona) {
    this.persona = persona
  }

  abstract shouldCheckIn(currentTime: number, lastCheckIn: number, gameState: GameState): boolean
  abstract getMinCheckinInterval(gameState: GameState): number

  getOptimizationLevel(): number {
    return this.persona.optimization
  }

  getRiskTolerance(): number {
    return this.persona.riskTolerance
  }

  getEfficiency(): number {
    return this.persona.efficiency
  }

  adjustActionScore(action: GameAction, baseScore: number, gameState: GameState): number {
    let adjustedScore = baseScore

    // Apply efficiency multiplier
    adjustedScore *= this.getEfficiency()

    // Apply optimization adjustments
    if (action.type === 'plant' || action.type === 'build') {
      adjustedScore *= (0.5 + this.getOptimizationLevel() * 0.5)
    }

    // Apply risk tolerance adjustments
    if (action.type === 'adventure' || action.type === 'mine') {
      const riskFactor = this.getRiskTolerance()
      adjustedScore *= (0.3 + riskFactor * 0.7)
    }

    return adjustedScore
  }

  /**
   * Check base conditions that apply to all personas
   */
  protected checkBaseConditions(currentTime: number, lastCheckIn: number, gameState: GameState): boolean {
    // CRITICAL FIX: Allow immediate action on game start (lastCheckIn === 0)
    if (lastCheckIn === 0) {
      console.log(`🎯 PERSONA: Game start detected, allowing immediate action`);
      return true;
    }
    
    // CRITICAL FIX: Always allow actions in first 10 hours for active gameplay
    // This must come BEFORE night time check to override time interpretation issues
    if (currentTime < 600) { // First 10 hours
      console.log(`🎯 PERSONA: Early game period (${currentTime} < 600 min), allowing action`);
      return true // Allow multiple check-ins during initial gameplay
    }
    
    const currentHour = Math.floor((currentTime % (24 * 60)) / 60)
    
    // Don't act at night (10 PM to 6 AM) - only after early game period
    if (currentHour < 6 || currentHour >= 22) {
      console.log(`🎯 PERSONA: Night time (hour ${currentHour}), blocking action`);
      return false;
    }

    return true
  }

  /**
   * Calculate emergency check-in intervals
   */
  protected getEmergencyInterval(gameState: GameState): number {
    // Emergency conditions that override normal check-in patterns
    const farmPlots = gameState.progression.farmPlots || 3
    
    // Seed shortage emergency
    const totalSeeds = Array.from(gameState.resources.seeds.values()).reduce((sum: number, count: number) => sum + count, 0)
    if (totalSeeds < farmPlots) {
      return 2 // Check every 2 minutes during seed crisis
    }
    
    // Low water emergency
    if (gameState.resources.water.current < gameState.resources.water.max * 0.2) {
      return 5 // Check every 5 minutes for water crisis
    }
    
    // High energy (prevent waste)
    if (gameState.resources.energy.current > gameState.resources.energy.max * 0.85) {
      return 10 // Check every 10 minutes when energy is high
    }
    
    // Ready crops
    const readyToHarvest = gameState.processes.crops.filter(crop => crop.readyToHarvest).length
    if (readyToHarvest > 0) {
      return 8 // Check every 8 minutes when crops are ready
    }
    
    return Infinity // No emergency
  }
}

/**
 * Speedrunner strategy - Optimizes every action, knows all mechanics
 */
export class SpeedrunnerStrategy extends BasePersonaStrategy {
  shouldCheckIn(currentTime: number, lastCheckIn: number, gameState: GameState): boolean {
    if (!this.checkBaseConditions(currentTime, lastCheckIn, gameState)) {
      return false
    }

    // CRITICAL FIX: Allow immediate action on game start
    if (lastCheckIn === 0) {
      console.log(`🎯 SPEEDRUNNER: Game start - allowing immediate action`);
      return true;
    }

    const timeSinceLastCheckin = currentTime - lastCheckIn
    const emergencyInterval = this.getEmergencyInterval(gameState)
    
    // Handle emergencies first
    if (timeSinceLastCheckin >= emergencyInterval) {
      console.log(`🎯 SPEEDRUNNER: Emergency interval triggered (${timeSinceLastCheckin} >= ${emergencyInterval})`);
      return true
    }

    // Add fallback for stuck heroes (prevent infinite deadlock)
    const MAX_IDLE_TIME = 30; // 30 minutes max idle
    if (timeSinceLastCheckin > MAX_IDLE_TIME) {
      console.warn(`⚠️ SPEEDRUNNER: Hero stuck for too long (${timeSinceLastCheckin} > ${MAX_IDLE_TIME}), forcing check-in`);
      return true;
    }

    // Speedrunner checks in very frequently - every 5 minutes
    const baseInterval = 5; // Fixed 5 minutes for speedrunner
    const shouldAct = timeSinceLastCheckin >= baseInterval;
    console.log(`🎯 SPEEDRUNNER: Time check: ${timeSinceLastCheckin} >= ${baseInterval} = ${shouldAct}`);
    return shouldAct;
  }

  getMinCheckinInterval(gameState: GameState): number {
    // Speedrunners are very active
    const farmPlots = gameState.progression.farmPlots || 3
    const activeCrops = gameState.processes.crops.filter(crop => crop.cropId && !crop.readyToHarvest).length
    const plotUtilization = farmPlots > 0 ? activeCrops / farmPlots : 0
    
    // Adjust based on game phase and utilization
    if (gameState.progression.currentPhase === 'Tutorial') {
      return plotUtilization < 0.8 ? 5 : 8
    }
    
    return plotUtilization < 0.6 ? 8 : 12
  }

  adjustActionScore(action: GameAction, baseScore: number, gameState: GameState): number {
    let adjustedScore = super.adjustActionScore(action, baseScore, gameState)
    
    // Speedrunners heavily optimize for efficiency and progression
    if (action.type === 'build' || action.type === 'purchase') {
      adjustedScore *= 1.3 // 30% bonus for progression actions
    }
    
    if (action.type === 'move' && action.description?.includes('blueprint')) {
      adjustedScore *= 1.5 // 50% bonus for blueprint navigation
    }
    
    // Bonus for automation setups
    if (action.type === 'assign_role' || action.target?.includes('pump')) {
      adjustedScore *= 1.2
    }
    
    return adjustedScore
  }
}

/**
 * Casual strategy - Plays for fun, makes sub-optimal choices, limited time
 */
export class CasualPlayerStrategy extends BasePersonaStrategy {
  shouldCheckIn(currentTime: number, lastCheckIn: number, gameState: GameState): boolean {
    if (!this.checkBaseConditions(currentTime, lastCheckIn, gameState)) {
      return false
    }

    // CRITICAL FIX: Allow immediate action on game start
    if (lastCheckIn === 0) {
      console.log(`🎯 CASUAL: Game start - allowing immediate action`);
      return true;
    }

    const timeSinceLastCheckin = currentTime - lastCheckIn
    const emergencyInterval = this.getEmergencyInterval(gameState)
    
    // Handle emergencies (but less aggressively than speedrunner)
    if (timeSinceLastCheckin >= emergencyInterval * 1.5) {
      console.log(`🎯 CASUAL: Emergency interval triggered (${timeSinceLastCheckin} >= ${emergencyInterval * 1.5})`);
      return true
    }

    // Add fallback for stuck heroes
    const MAX_IDLE_TIME = 45; // 45 minutes max idle for casual
    if (timeSinceLastCheckin > MAX_IDLE_TIME) {
      console.warn(`⚠️ CASUAL: Hero stuck for too long (${timeSinceLastCheckin} > ${MAX_IDLE_TIME}), forcing check-in`);
      return true;
    }

    // Casual players check in every 10 minutes
    const baseInterval = 10; // Fixed 10 minutes for casual
    const shouldAct = timeSinceLastCheckin >= baseInterval;
    console.log(`🎯 CASUAL: Time check: ${timeSinceLastCheckin} >= ${baseInterval} = ${shouldAct}`);
    return shouldAct;
  }

  getMinCheckinInterval(gameState: GameState): number {
    // Casual players are less active
    const weekdayCheckIns = this.persona.weekdayCheckIns || 2
    const weekendCheckIns = this.persona.weekendCheckIns || 2
    
    // Simulate weekend vs weekday behavior
    const dayOfWeek = Math.floor(gameState.time.day % 7)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    const dailyCheckIns = isWeekend ? weekendCheckIns : weekdayCheckIns
    const minutesPerDay = 16 * 60 // 16 active hours per day (6 AM to 10 PM)
    
    return Math.floor(minutesPerDay / Math.max(dailyCheckIns, 1))
  }

  adjustActionScore(action: GameAction, baseScore: number, gameState: GameState): number {
    let adjustedScore = super.adjustActionScore(action, baseScore, gameState)
    
    // Casual players prefer simple, fun actions
    if (action.type === 'harvest' || action.type === 'plant') {
      adjustedScore *= 1.1 // Slight bonus for farming
    }
    
    // Less interest in optimization
    if (action.type === 'assign_role' || action.type === 'purchase') {
      adjustedScore *= 0.8 // 20% penalty for automation/optimization
    }
    
    // More interest in exploration
    if (action.type === 'adventure') {
      adjustedScore *= 1.2 // 20% bonus for adventures
    }
    
    return adjustedScore
  }
}

/**
 * Weekend Warrior strategy - Minimal weekday play, binges on weekends
 */
export class WeekendWarriorStrategy extends BasePersonaStrategy {
  shouldCheckIn(currentTime: number, lastCheckIn: number, gameState: GameState): boolean {
    if (!this.checkBaseConditions(currentTime, lastCheckIn, gameState)) {
      return false
    }

    // CRITICAL FIX: Allow immediate action on game start
    if (lastCheckIn === 0) {
      console.log(`🎯 WEEKEND_WARRIOR: Game start - allowing immediate action`);
      return true;
    }

    const timeSinceLastCheckin = currentTime - lastCheckIn
    const emergencyInterval = this.getEmergencyInterval(gameState)
    
    // Handle emergencies
    if (timeSinceLastCheckin >= emergencyInterval) {
      console.log(`🎯 WEEKEND_WARRIOR: Emergency interval triggered (${timeSinceLastCheckin} >= ${emergencyInterval})`);
      return true
    }

    // Add fallback for stuck heroes
    const MAX_IDLE_TIME = 60; // 60 minutes max idle for weekend warrior
    if (timeSinceLastCheckin > MAX_IDLE_TIME) {
      console.warn(`⚠️ WEEKEND_WARRIOR: Hero stuck for too long (${timeSinceLastCheckin} > ${MAX_IDLE_TIME}), forcing check-in`);
      return true;
    }

    // Weekend warrior checks in every 15 minutes
    const baseInterval = 15; // Fixed 15 minutes for weekend warrior
    const shouldAct = timeSinceLastCheckin >= baseInterval;
    console.log(`🎯 WEEKEND_WARRIOR: Time check: ${timeSinceLastCheckin} >= ${baseInterval} = ${shouldAct}`);
    return shouldAct;
  }

  getMinCheckinInterval(gameState: GameState): number {
    const dayOfWeek = Math.floor(gameState.time.day % 7)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    if (isWeekend) {
      // Very active on weekends - every 10-15 minutes
      return 12
    } else {
      // Much less active on weekdays - every 60-120 minutes
      return 80
    }
  }

  adjustActionScore(action: GameAction, baseScore: number, gameState: GameState): number {
    let adjustedScore = super.adjustActionScore(action, baseScore, gameState)
    
    const dayOfWeek = Math.floor(gameState.time.day % 7)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    if (isWeekend) {
      // More aggressive on weekends
      adjustedScore *= 1.2
      
      // Focus on progress during weekend binges
      if (action.type === 'build' || action.type === 'adventure' || action.type === 'mine') {
        adjustedScore *= 1.3
      }
    } else {
      // Conservative on weekdays
      adjustedScore *= 0.7
      
      // Only essential actions on weekdays
      if (action.type !== 'harvest' && action.type !== 'water') {
        adjustedScore *= 0.5
      }
    }
    
    return adjustedScore
  }
}

/**
 * Factory for creating persona strategies
 */
export class PersonaStrategyFactory {
  static create(persona: SimplePersona): IPersonaStrategy {
    switch (persona.id) {
      case 'speedrunner':
        return new SpeedrunnerStrategy(persona)
      case 'casual':
        return new CasualPlayerStrategy(persona)
      case 'weekend-warrior':
        return new WeekendWarriorStrategy(persona)
      default:
        // Default to casual for unknown personas
        return new CasualPlayerStrategy(persona)
    }
  }
}
