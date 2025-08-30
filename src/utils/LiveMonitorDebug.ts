// LiveMonitorDebug - Debugging utilities for data flow testing
// Add to browser console: window.liveMonitorDebug = liveMonitorDebug

import { WidgetDataAdapter } from './WidgetDataAdapter'

export class LiveMonitorDebug {
  /**
   * Test the data flow from a mock GameState to widget formats
   */
  static testDataTransformation() {
    console.log('🧪 LiveMonitorDebug: Testing data transformation pipeline...')
    
    // Create a mock GameState similar to what SimulationEngine produces
    const mockGameState = {
      time: {
        day: 3,
        hour: 14,
        minute: 30,
        totalMinutes: 3270,
        speed: 5
      },
      resources: {
        energy: {
          current: 85,
          max: 150,
          regenerationRate: 1.2
        },
        gold: 245,
        water: {
          current: 120,
          max: 200,
          autoGenRate: 15
        },
        seeds: new Map([
          ['turnip', 12],
          ['carrot', 8],
          ['potato', 15],
          ['beet', 3]
        ]),
        materials: new Map([
          ['wood', 25],
          ['stone', 18],
          ['iron', 7],
          ['copper', 12],
          ['silver', 2]
        ])
      },
      progression: {
        heroLevel: 4,
        experience: 850,
        farmStage: 2,
        farmPlots: 12,
        availablePlots: 10,
        currentPhase: 'Early',
        completedAdventures: ['meadow_path_short'],
        unlockedUpgrades: ['watering_can_ii', 'storage_shed_i'],
        unlockedAreas: ['farm', 'tower', 'town']
      },
      location: {
        currentScreen: 'farm',
        timeOnScreen: 45,
        navigationReason: 'AI farming decision'
      },
      processes: {
        crops: [
          {
            plotId: 'plot_1',
            cropId: 'turnip',
            plantedAt: 3200,
            growthTimeRequired: 60,
            waterLevel: 0.8,
            isWithered: false,
            readyToHarvest: true
          },
          {
            plotId: 'plot_2',
            cropId: 'carrot',
            plantedAt: 3150,
            growthTimeRequired: 90,
            waterLevel: 0.6,
            isWithered: false,
            readyToHarvest: false
          }
        ],
        adventure: null,
        crafting: [],
        mining: null
      },
      inventory: {
        tools: new Map([
          ['watering_can_ii', { level: 2, durability: 85, isEquipped: true }]
        ]),
        weapons: new Map([
          ['sword', { level: 1, durability: 100, isEquipped: true }]
        ]),
        armor: new Map(),
        capacity: 100,
        currentWeight: 45
      },
      automation: {
        plantingEnabled: true,
        plantingStrategy: 'highest-value',
        wateringEnabled: true,
        harvestingEnabled: true,
        autoCleanupEnabled: false,
        targetCrops: new Map([['turnip', 0.4], ['carrot', 0.3], ['potato', 0.3]]),
        wateringThreshold: 30,
        energyReserve: 20
      },
      priorities: {
        cleanupOrder: ['weeds', 'rocks', 'trees'],
        toolCrafting: [],
        helperRescue: [],
        adventurePriority: ['meadow_path'],
        vendorPriority: ['blacksmith', 'general']
      }
    } as any
    
    // Test transformation
    console.log('📊 Original GameState (sample):', {
      day: mockGameState.time.day,
      energy: mockGameState.resources.energy.current,
      gold: mockGameState.resources.gold,
      seedsMap: mockGameState.resources.seeds,
      materialsMap: mockGameState.resources.materials
    })
    
    // Transform using WidgetDataAdapter
    const transformed = WidgetDataAdapter.transformAll(mockGameState)
    
    console.log('✨ Transformed Widget Data:', {
      time: transformed.time,
      resources: {
        energy: transformed.resources.energy,
        gold: transformed.resources.gold,
        seeds: transformed.resources.seeds, // Should be plain object now
        materials: transformed.resources.materials // Should be plain object now
      },
      progression: transformed.progression,
      location: transformed.location
    })
    
    // Validate the transformation
    const isValid = this.validateTransformation(mockGameState, transformed)
    console.log(`${isValid ? '✅' : '❌'} Transformation validation: ${isValid ? 'PASSED' : 'FAILED'}`)
    
    return { original: mockGameState, transformed, isValid }
  }
  
  /**
   * Validate that transformation preserved essential data
   */
  static validateTransformation(original: any, transformed: any): boolean {
    try {
      // Check time preservation
      if (transformed.time.day !== original.time.day) return false
      if (transformed.time.hour !== original.time.hour) return false
      
      // Check resource preservation
      if (transformed.resources.energy.current !== original.resources.energy.current) return false
      if (transformed.resources.gold !== original.resources.gold) return false
      
      // Check Map->Object conversion for seeds
      const originalSeedsTotal = Array.from(original.resources.seeds.values()).reduce((a, b) => a + b, 0)
      const transformedSeedsTotal = Object.values(transformed.resources.seeds).reduce((a: any, b: any) => a + b, 0)
      if (originalSeedsTotal !== transformedSeedsTotal) return false
      
      // Check Map->Object conversion for materials
      const originalMaterialsTotal = Array.from(original.resources.materials.values()).reduce((a, b) => a + b, 0)
      const transformedMaterialsTotal = Object.values(transformed.resources.materials).reduce((a: any, b: any) => a + b, 0)
      if (originalMaterialsTotal !== transformedMaterialsTotal) return false
      
      return true
    } catch (error) {
      console.error('Validation error:', error)
      return false
    }
  }
  
  /**
   * Check current live monitor state in browser console
   */
  static inspectLiveMonitorState() {
    console.log('🔍 LiveMonitorDebug: Inspecting current state...')
    
    // Try to access Vue app instance data
    try {
      const vueElements = document.querySelectorAll('[data-v-inspector]')
      console.log(`Found ${vueElements.length} Vue elements`)
      
      // Look for the LiveMonitorView specifically
      const monitorElement = document.querySelector('.min-h-screen.bg-sim-background')
      if (monitorElement) {
        console.log('✅ Found LiveMonitorView element')
        // In a real implementation, we'd access the Vue component instance here
        // For now, just suggest checking the console for our debug logs
      } else {
        console.log('❌ LiveMonitorView element not found')
      }
    } catch (error) {
      console.error('Error inspecting Vue state:', error)
    }
    
    console.log('💡 To see real-time data flow:')
    console.log('  1. Go to LiveMonitor page')
    console.log('  2. Initialize simulation')
    console.log('  3. Start simulation')
    console.log('  4. Look for these console messages:')
    console.log('     - "🔄 SimulationBridge: Processing tick message"')
    console.log('     - "📊 LiveMonitor: Updating widgets with gameState"')
    console.log('     - "🔄 ResourcesWidget: Using transformed widget data"')
  }
  
  /**
   * Generate test events to verify event handling
   */
  static simulateTickEvent() {
    console.log('🎭 LiveMonitorDebug: Simulating tick event...')
    
    const mockTickEvent = {
      type: 'tick',
      data: {
        gameState: this.testDataTransformation().original,
        executedActions: [
          {
            id: 'test_harvest',
            type: 'harvest',
            screen: 'farm',
            target: 'plot_1',
            duration: 2,
            energyCost: 3,
            goldCost: 0
          }
        ],
        events: [
          {
            timestamp: 3270,
            type: 'action_harvest',
            description: 'Harvested turnip from plot_1',
            importance: 'medium'
          }
        ],
        deltaTime: 1,
        tickCount: 127,
        isComplete: false,
        isStuck: false
      }
    }
    
    console.log('📤 Mock tick event created:', mockTickEvent)
    console.log('💡 In a real scenario, this would be sent from the worker to SimulationBridge')
    
    return mockTickEvent
  }
}

// Make available globally for browser console debugging
declare global {
  interface Window {
    liveMonitorDebug: typeof LiveMonitorDebug
  }
}

if (typeof window !== 'undefined') {
  window.liveMonitorDebug = LiveMonitorDebug
}

export const liveMonitorDebug = LiveMonitorDebug
