/**
 * Quick validation test to verify centralized validation system
 * Phase 9H Implementation Test
 */

import { validationService } from '../src/utils/validation'
import type { GameAction, GameState } from '../src/types'

// Mock game state for testing
const mockGameState: Partial<GameState> = {
  resources: {
    energy: { current: 100, max: 200, regenerationRate: 1 },
    gold: 500,
    water: { current: 50, max: 100, autoGenRate: 1 },
    seeds: new Map([['wheat', 5], ['corn', 2]]),
    materials: new Map([['wood', 10], ['stone', 3]])
  },
  progression: {
    heroLevel: 5,
    experience: 1000,
    farmStage: 2,
    farmPlots: 25,
    availablePlots: 20,
    currentPhase: 'Early',
    completedAdventures: [],
    completedCleanups: new Set(['cleanup_001']),
    unlockedUpgrades: ['upgrade_001', 'blueprint_tower_reach_1'],
    unlockedAreas: ['farm', 'town'],
    builtStructures: new Set(['farm']),
    victoryConditionsMet: false
  },
  location: {
    currentScreen: 'farm',
    timeOnScreen: 60,
    navigationReason: 'initial'
  }
} as GameState

// Mock game data store
const mockGameDataStore = {
  getItemById: (id: string) => {
    if (id === 'cleanup_002') {
      return {
        id: 'cleanup_002',
        name: 'Clear Stones',
        prerequisites: ['cleanup_001'],
        energyCost: 20,
        goldCost: 0
      }
    }
    return null
  }
}

// Test actions
const testActions: GameAction[] = [
  // Valid planting action
  {
    id: 'plant_001',
    type: 'plant',
    screen: 'farm',
    target: 'wheat',
    duration: 1,
    energyCost: 10,
    goldCost: 0,
    prerequisites: [],
    expectedRewards: { experience: 5 }
  },
  
  // Invalid planting action (insufficient seeds)
  {
    id: 'plant_002',
    type: 'plant',
    screen: 'farm',
    target: 'tomato', // Not in seeds map
    duration: 1,
    energyCost: 10,
    goldCost: 0,
    prerequisites: [],
    expectedRewards: { experience: 5 }
  },
  
  // Valid cleanup action
  {
    id: 'cleanup_002',
    type: 'cleanup',
    screen: 'farm',
    target: 'cleanup_002',
    duration: 5,
    energyCost: 20,
    goldCost: 0,
    prerequisites: ['cleanup_001'],
    expectedRewards: { plots: 2 }
  },
  
  // Invalid cleanup action (insufficient energy)
  {
    id: 'cleanup_003',
    type: 'cleanup',
    screen: 'farm',
    target: 'cleanup_003',
    duration: 5,
    energyCost: 150, // More than available
    goldCost: 0,
    prerequisites: [],
    expectedRewards: { plots: 3 }
  }
]

/**
 * Run validation tests
 */
export function runValidationTests() {
  console.log('🧪 Testing Centralized Validation System (Phase 9H)')
  console.log('='.repeat(60))
  
  // Initialize validation service
  validationService.initialize(mockGameDataStore)
  
  // Test each action
  testActions.forEach((action, index) => {
    console.log(`\n📋 Test ${index + 1}: ${action.type} action - ${action.target}`)
    
    const result = validationService.canPerform(action, mockGameState, mockGameDataStore)
    
    console.log(`   Can Perform: ${result.canPerform ? '✅' : '❌'}`)
    
    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.join(', ')}`)
    }
    
    if (result.warnings.length > 0) {
      console.log(`   Warnings: ${result.warnings.join(', ')}`)
    }
    
    if (result.missingPrerequisites.length > 0) {
      console.log(`   Missing Prerequisites: ${result.missingPrerequisites.join(', ')}`)
    }
    
    if (result.resourceIssues.length > 0) {
      console.log(`   Resource Issues: ${result.resourceIssues.join(', ')}`)
    }
  })
  
  // Test resource validation
  console.log(`\n🔍 Resource Validation Test`)
  const resourceValidation = validationService.validateResources(testActions[0], mockGameState)
  console.log(`   Energy: ${resourceValidation.energy.sufficient ? '✅' : '❌'} (${resourceValidation.energy.available}/${resourceValidation.energy.required})`)
  console.log(`   Gold: ${resourceValidation.gold.sufficient ? '✅' : '❌'} (${resourceValidation.gold.available}/${resourceValidation.gold.required})`)
  
  // Test validation statistics
  console.log(`\n📊 Validation Statistics`)
  const stats = validationService.getStats()
  console.log(`   Cache Size: ${stats.cacheStats.size}`)
  console.log(`   Circular Dependencies: ${stats.circularDependencies}`)
  
  console.log('\n✅ Validation System Tests Complete!')
  console.log('='.repeat(60))
}

// Export for potential use in actual test suite
export { mockGameState, mockGameDataStore, testActions }
