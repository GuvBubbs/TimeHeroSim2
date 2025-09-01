// Test Helper Automation System - Phase 8D
// Tests helper rescue, assignment, and automation functionality

import { SimulationEngine } from './src/utils/SimulationEngine.js'
import { useGameDataStore } from './src/stores/gameData.js'

// Mock configuration for testing
const testConfig = {
  id: 'test-helper-automation',
  quickSetup: {
    name: 'Helper Automation Test',
    personaId: 'casual',
    duration: { mode: 'fixed', maxDays: 1 },
    dataSource: 'current',
    enableParameterOverrides: true,
    generateDetailedLogs: true
  },
  parameterOverrides: new Map(),
  effectiveParameters: {
    farm: {
      irrigation: { waterThreshold: 0.5 },
      automation: { enablePlanting: true, enableWatering: true, enableHarvesting: true }
    },
    helpers: {
      acquisition: { rescueOrder: ['gnome_waterer', 'gnome_harvester'], housingStrategy: 'immediate' },
      roleAssignment: { strategy: 'focused', customRoles: new Map() },
      training: { enableTraining: true, trainingEnergyBudget: 500 },
      efficiency: { baseEfficiency: 1.0, levelScaling: 0.1 }
    }
  }
}

async function testHelperAutomation() {
  console.log('🧪 Testing Helper Automation System...')
  
  try {
    // Initialize game data store (mock)
    const gameDataStore = {
      getItemById: (id) => {
        const mockData = {
          'gnome_waterer': { id: 'gnome_waterer', name: 'Waterer Gnome', type: 'helper' },
          'carrot': { id: 'carrot', time: '6', stages: '3', energy: '1' },
          'potato': { id: 'potato', time: '8', stages: '3', energy: '2' }
        }
        return mockData[id] || null
      }
    }
    
    // Create simulation engine
    const engine = new SimulationEngine(testConfig, gameDataStore)
    console.log('✅ SimulationEngine created successfully')
    
    // Test 1: Initial state - no helpers
    console.log('\n📋 Test 1: Initial Helper State')
    let gameState = engine.getGameState()
    console.log(`Helpers: ${gameState.helpers.gnomes.length}`)
    console.log(`Housing Capacity: ${gameState.helpers.housingCapacity}`)
    
    // Test 2: Rescue a helper
    console.log('\n📋 Test 2: Rescue Helper')
    const rescueAction = {
      id: 'rescue_test',
      type: 'rescue',
      screen: 'farm',
      target: 'gnome_waterer',
      duration: 5,
      energyCost: 10,
      goldCost: 100,
      prerequisites: [],
      expectedRewards: { items: ['gnome_waterer'] }
    }
    
    // Set up initial resources
    gameState.resources.energy.current = 100
    gameState.resources.gold = 200
    gameState.helpers.housingCapacity = 2
    
    // Execute rescue
    const rescueResult = engine.executeAction(rescueAction)
    console.log(`Rescue Success: ${rescueResult.success}`)
    
    gameState = engine.getGameState()
    console.log(`Helpers after rescue: ${gameState.helpers.gnomes.length}`)
    if (gameState.helpers.gnomes.length > 0) {
      const helper = gameState.helpers.gnomes[0]
      console.log(`Helper: ${helper.name}, Role: ${helper.role || 'none'}, Assigned: ${helper.isAssigned}`)
    }
    
    // Test 3: Assign helper to watering role
    console.log('\n📋 Test 3: Assign Helper Role')
    if (gameState.helpers.gnomes.length > 0) {
      const assignAction = {
        id: 'assign_test',
        type: 'assign_helper',
        screen: 'farm',
        target: 'gnome_waterer:waterer',
        duration: 1,
        energyCost: 5,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: {}
      }
      
      const assignResult = engine.executeAction(assignAction)
      console.log(`Assignment Success: ${assignResult.success}`)
      
      gameState = engine.getGameState()
      const helper = gameState.helpers.gnomes[0]
      console.log(`Helper after assignment: ${helper.name}, Role: ${helper.role}, Assigned: ${helper.isAssigned}`)
    }
    
    // Test 4: Set up crops that need watering
    console.log('\n📋 Test 4: Setup Crops for Helper Testing')
    gameState.processes.crops = [
      {
        plotId: 'plot_1',
        cropType: 'carrot',
        waterLevel: 0.2, // Needs watering
        growthProgress: 0.5,
        growthStage: 1,
        isReady: false,
        isDead: false
      },
      {
        plotId: 'plot_2',
        cropType: 'potato',
        waterLevel: 0.1, // Needs watering
        growthProgress: 0.3,
        growthStage: 1,
        isReady: false,
        isDead: false
      },
      {
        plotId: 'plot_3',
        cropType: 'carrot',
        waterLevel: 0.8, // Doesn't need watering
        growthProgress: 1.0,
        growthStage: 3,
        isReady: true,
        isDead: false
      }
    ]
    
    gameState.resources.water.current = 50
    gameState.resources.water.max = 100
    
    console.log('Crops setup:')
    gameState.processes.crops.forEach((crop, i) => {
      console.log(`  Plot ${i + 1}: ${crop.cropType}, Water: ${crop.waterLevel.toFixed(1)}, Ready: ${crop.isReady}`)
    })
    
    // Test 5: Run helper automation
    console.log('\n📋 Test 5: Run Helper Automation')
    console.log('Before helper processing:')
    console.log(`  Water available: ${gameState.resources.water.current}`)
    console.log(`  Crops needing water: ${gameState.processes.crops.filter(c => c.waterLevel < 0.5).length}`)
    
    // Process helpers for 1 minute
    const { HelperSystem } = await import('./src/utils/systems/HelperSystem.js')
    HelperSystem.processHelpers(gameState, 1.0, gameDataStore)
    
    console.log('After helper processing:')
    console.log(`  Water available: ${gameState.resources.water.current}`)
    console.log(`  Crops needing water: ${gameState.processes.crops.filter(c => c.waterLevel < 0.5).length}`)
    
    gameState.processes.crops.forEach((crop, i) => {
      console.log(`  Plot ${i + 1}: ${crop.cropType}, Water: ${crop.waterLevel.toFixed(1)}, Ready: ${crop.isReady}`)
    })
    
    if (gameState.helpers.gnomes.length > 0) {
      const helper = gameState.helpers.gnomes[0]
      console.log(`  Helper task: ${helper.currentTask || 'none'}`)
    }
    
    // Test 6: Test helper training
    console.log('\n📋 Test 6: Test Helper Training')
    if (gameState.helpers.gnomes.length > 0) {
      const helper = gameState.helpers.gnomes[0]
      console.log(`Before training: Efficiency ${helper.efficiency.toFixed(2)}, Experience ${helper.experience}`)
      
      const trainAction = {
        id: 'train_test',
        type: 'train_helper',
        screen: 'farm',
        target: helper.id,
        duration: 30,
        energyCost: 50,
        goldCost: 0,
        prerequisites: [],
        expectedRewards: { experience: 100 }
      }
      
      gameState.resources.energy.current = 100
      const trainResult = engine.executeAction(trainAction)
      console.log(`Training Success: ${trainResult.success}`)
      console.log(`After training: Efficiency ${helper.efficiency.toFixed(2)}, Experience ${helper.experience}`)
    }
    
    console.log('\n✅ Helper Automation System Test Complete!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error(error.stack)
  }
}

// Run the test
testHelperAutomation()
