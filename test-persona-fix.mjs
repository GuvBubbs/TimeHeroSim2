#!/usr/bin/env node

// Quick test for the hero action bug fix
// This tests the PersonaStrategy fixes directly

import { SpeedrunnerStrategy, CasualPlayerStrategy, WeekendWarriorStrategy } from '../src/utils/ai/PersonaStrategy.js'

// Mock minimal game state for testing
const mockGameState = {
  time: {
    totalMinutes: 0.5, // 30 seconds into the game
    day: 1
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

// Mock personas
const speedrunnerPersona = {
  name: 'speedrunner',
  optimization: 0.9,
  riskTolerance: 0.8,
  efficiency: 0.9
}

const casualPersona = {
  name: 'casual',
  optimization: 0.5,
  riskTolerance: 0.6,
  efficiency: 0.7
}

const weekendWarriorPersona = {
  name: 'weekend_warrior',
  optimization: 0.3,
  riskTolerance: 0.4,
  efficiency: 0.5
}

console.log('🧪 TESTING PERSONA STRATEGY FIXES')
console.log('==================================')

// Test 1: Game start (lastCheckinTime = 0)
console.log('\n📋 Test 1: Game start (lastCheckinTime = 0)')
const speedrunner = new SpeedrunnerStrategy(speedrunnerPersona)
const casual = new CasualPlayerStrategy(casualPersona)
const weekendWarrior = new WeekendWarriorStrategy(weekendWarriorPersona)

console.log(`Speedrunner shouldCheckIn: ${speedrunner.shouldCheckIn(0.5, 0, mockGameState)}`)
console.log(`Casual shouldCheckIn: ${casual.shouldCheckIn(0.5, 0, mockGameState)}`)
console.log(`Weekend Warrior shouldCheckIn: ${weekendWarrior.shouldCheckIn(0.5, 0, mockGameState)}`)

// Test 2: After some time has passed
console.log('\n📋 Test 2: After 6 minutes (past speedrunner interval)')
console.log(`Speedrunner shouldCheckIn: ${speedrunner.shouldCheckIn(6.0, 0.5, mockGameState)}`)
console.log(`Casual shouldCheckIn: ${casual.shouldCheckIn(6.0, 0.5, mockGameState)}`) 
console.log(`Weekend Warrior shouldCheckIn: ${weekendWarrior.shouldCheckIn(6.0, 0.5, mockGameState)}`)

// Test 3: After 11 minutes (past casual interval)  
console.log('\n📋 Test 3: After 11 minutes (past casual interval)')
console.log(`Speedrunner shouldCheckIn: ${speedrunner.shouldCheckIn(11.0, 0.5, mockGameState)}`)
console.log(`Casual shouldCheckIn: ${casual.shouldCheckIn(11.0, 0.5, mockGameState)}`)
console.log(`Weekend Warrior shouldCheckIn: ${weekendWarrior.shouldCheckIn(11.0, 0.5, mockGameState)}`)

// Test 4: After 16 minutes (past weekend warrior interval)
console.log('\n📋 Test 4: After 16 minutes (past weekend warrior interval)')
console.log(`Speedrunner shouldCheckIn: ${speedrunner.shouldCheckIn(16.0, 0.5, mockGameState)}`)
console.log(`Casual shouldCheckIn: ${casual.shouldCheckIn(16.0, 0.5, mockGameState)}`)
console.log(`Weekend Warrior shouldCheckIn: ${weekendWarrior.shouldCheckIn(16.0, 0.5, mockGameState)}`)

console.log('\n✅ If all personas return true for game start, the fix is working!')
console.log('📝 Check console output above for detailed decision flow')
