// Test script to verify the hero action bug fix
// Run this to confirm the DecisionEngine now allows actions on game start

import { DecisionEngine } from './src/utils/ai/DecisionEngine.js'

// Mock minimal game state for testing
const mockGameState = {
  time: {
    totalMinutes: 0.5, // 30 seconds into the game
    day: 1
  },
  location: {
    currentScreen: 'Farm'
  },
  progression: {
    currentPhase: 'Tutorial',
    farmPlots: 3
  },
  resources: {
    seeds: new Map([['carrot', 5]]),
    water: { current: 100, max: 100 },
    energy: { current: 50, max: 100 }
  },
  processes: {
    crops: [{}, {}, {}] // 3 empty plots
  }
}

// Mock parameters with speedrunner persona
const mockParameters = {
  persona: {
    name: 'speedrunner',
    optimization: 0.9,
    riskTolerance: 0.8,
    efficiency: 0.9
  }
}

// Mock game data store
const mockGameDataStore = {
  // Minimal mock - the action filter will handle validation
}

console.log('🧪 TESTING HERO ACTION FIX')
console.log('==========================')

const decisionEngine = new DecisionEngine()

// Test 1: Game start (should allow action)
console.log('\n📋 Test 1: Game start decision (time = 0.5 min)')
const result1 = decisionEngine.getNextActions(mockGameState, mockParameters, mockGameDataStore)
console.log(`Result: shouldAct = ${result1.shouldAct}, actions = ${result1.actions.length}`)

// Test 2: Immediate follow-up (should still work due to early game rules)
mockGameState.time.totalMinutes = 1.0
console.log('\n📋 Test 2: Follow-up decision (time = 1.0 min)')
const result2 = decisionEngine.getNextActions(mockGameState, mockParameters, mockGameDataStore)
console.log(`Result: shouldAct = ${result2.shouldAct}, actions = ${result2.actions.length}`)

// Test 3: After 5 minutes (speedrunner should act again)
mockGameState.time.totalMinutes = 6.0
console.log('\n📋 Test 3: After interval (time = 6.0 min)')
const result3 = decisionEngine.getNextActions(mockGameState, mockParameters, mockGameDataStore)
console.log(`Result: shouldAct = ${result3.shouldAct}, actions = ${result3.actions.length}`)

console.log('\n✅ Test complete - check console logs for detailed decision flow')
