// Phase 10I - Performance and Integration Test
// Simple Node.js test to verify SimulationOrchestrator integration

import { SimulationOrchestrator } from './src/utils/SimulationOrchestrator.js'

console.log('🧪 Phase 10I Integration Test - Starting...')

// Simple test configuration
const testConfig = {
  persona: 'speedrunner',
  parameters: {
    persona: {
      baseActionsPerTick: 3,
      riskTolerance: 0.8,
      planningHorizon: 10
    },
    simulation: {
      endGameCriteria: {
        victoryConditions: ['all_adventures_complete'],
        maxDays: 30,
        targetLevel: 50
      }
    }
  },
  gameDataStore: {
    allItems: [
      { id: 'test_item', name: 'Test Item', type: 'action', prerequisites: [] }
    ]
  }
}

try {
  console.log('⚡ Creating SimulationOrchestrator...')
  const orchestrator = new SimulationOrchestrator(testConfig, testConfig.gameDataStore)
  
  console.log('⏱️  Running 10 tick performance test...')
  const startTime = Date.now()
  
  for (let i = 0; i < 10; i++) {
    const result = orchestrator.tick()
    if (i === 0) {
      console.log(`✅ First tick result:`, {
        deltaTime: result.deltaTime,
        day: result.gameState.time.day,
        tickCount: result.tickCount,
        executedActions: result.executedActions.length
      })
    }
  }
  
  const endTime = Date.now()
  const totalTime = endTime - startTime
  
  console.log(`⚡ Performance Test Results:`)
  console.log(`   - 10 ticks completed in ${totalTime}ms`)
  console.log(`   - Average per tick: ${totalTime / 10}ms`)
  console.log(`   - Projected 1000 ticks: ${(totalTime / 10) * 1000}ms`)
  
  if ((totalTime / 10) * 1000 < 1000) {
    console.log('✅ PERFORMANCE TEST PASSED - Under 1000ms target!')
  } else {
    console.log('❌ PERFORMANCE TEST FAILED - Over 1000ms target')
  }
  
  console.log('✅ SimulationOrchestrator integration working!')
  
} catch (error) {
  console.error('❌ Integration test failed:', error.message)
  process.exit(1)
}
