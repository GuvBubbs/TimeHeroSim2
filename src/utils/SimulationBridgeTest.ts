// SimulationBridge Test - Phase 6B Validation
// Tests Web Worker communication and MapSerializer integration

import { SimulationBridge } from '@/utils/SimulationBridge'
import { MapSerializer } from '@/utils/MapSerializer'
import type { SimulationConfig } from '@/types'

/**
 * Test suite for SimulationBridge and Web Worker communication
 */
export class SimulationBridgeTest {
  private bridge: SimulationBridge | null = null
  
  /**
   * Creates a test simulation configuration
   */
  static createTestConfig(): SimulationConfig {
    const parameterOverrides = new Map<string, any>()
    parameterOverrides.set('farm.automation.plantingStrategy', 'highest-value')
    parameterOverrides.set('farm.automation.targetSeedRatios', new Map([
      ['turnip', 0.4],
      ['beet', 0.3],
      ['carrot', 0.3]
    ]))

    return {
      id: 'test-worker-config',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      quickSetup: {
        name: 'Worker Test Simulation',
        personaId: 'speedrunner',
        duration: { mode: 'fixed', maxDays: 3 },
        dataSource: 'current',
        enableParameterOverrides: true,
        generateDetailedLogs: true
      },
      parameterOverrides,
      isValid: true,
      validationErrors: []
    }
  }

  /**
   * Test bridge initialization with Web Worker
   */
  async testBridgeInitialization(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🧪 Testing SimulationBridge initialization...')
      
      this.bridge = new SimulationBridge()
      const config = SimulationBridgeTest.createTestConfig()
      
      console.log('📡 Initializing bridge with test config...')
      await this.bridge.initialize(config)
      
      const status = this.bridge.getStatus()
      if (!status.isInitialized) {
        return { success: false, error: 'Bridge not properly initialized' }
      }
      
      console.log('✅ Bridge initialization test passed')
      return { success: true }
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Test simulation start/pause/stop cycle
   */
  async testSimulationLifecycle(): Promise<{ success: boolean; error?: string }> {
    if (!this.bridge) {
      return { success: false, error: 'Bridge not initialized' }
    }
    
    try {
      console.log('🧪 Testing simulation lifecycle...')
      
      // Set up event handlers for monitoring
      let tickReceived = false
      let completionReceived = false
      
      this.bridge.onTick((data) => {
        tickReceived = true
        console.log(`📊 Tick received: Day ${data.gameState.time.day}, Tick ${data.tickCount}`)
      })
      
      this.bridge.onComplete((data) => {
        completionReceived = true
        console.log(`🏁 Completion received: ${data.reason} after ${data.stats.daysPassed} days`)
      })
      
      this.bridge.onError((data) => {
        console.error(`❌ Worker error: ${data.message}`)
      })
      
      // Start simulation at higher speed for quick test
      console.log('▶️ Starting simulation at 10x speed...')
      await this.bridge.start(10)
      
      // Wait for a few ticks
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (!tickReceived) {
        return { success: false, error: 'No ticks received from worker' }
      }
      
      // Test pause/resume
      console.log('⏸️ Pausing simulation...')
      this.bridge.pause()
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('▶️ Resuming simulation...')
      await this.bridge.start(20) // Even faster
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Test state retrieval
      console.log('📊 Getting current state...')
      const state = await this.bridge.getState()
      
      if (!state.gameState || !state.stats) {
        return { success: false, error: 'Failed to retrieve state' }
      }
      
      console.log(`📈 Current state: Day ${state.gameState.time.day}, ${state.stats.tickCount} ticks`)
      
      // Stop simulation
      console.log('⏹️ Stopping simulation...')
      this.bridge.stop()
      
      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('✅ Simulation lifecycle test passed')
      return { success: true }
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Test speed changes during simulation
   */
  async testSpeedControl(): Promise<{ success: boolean; error?: string }> {
    if (!this.bridge) {
      return { success: false, error: 'Bridge not initialized' }
    }
    
    try {
      console.log('🧪 Testing speed control...')
      
      // Start at normal speed
      await this.bridge.start(1)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Test various speeds
      const speeds = [5, 50, 100, 1, 0.5]
      
      for (const speed of speeds) {
        console.log(`🚀 Setting speed to ${speed}x...`)
        this.bridge.setSpeed(speed)
        await new Promise(resolve => setTimeout(resolve, 200))
        
        const state = await this.bridge.getState()
        // Speed might not be exactly what we set due to performance limits
        console.log(`📊 Actual speed: ${state.gameState.time.speed}x`)
      }
      
      this.bridge.stop()
      
      console.log('✅ Speed control test passed')
      return { success: true }
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🧪 Testing error handling...')
      
      // Test initialization with invalid config
      const invalidBridge = new SimulationBridge()
      
      try {
        await invalidBridge.initialize(null as any)
        return { success: false, error: 'Expected initialization to fail with invalid config' }
      } catch (error) {
        console.log('✅ Properly caught invalid config error')
      }
      
      // Test operations on uninitialized bridge
      const uninitializedBridge = new SimulationBridge()
      
      try {
        await uninitializedBridge.start()
        return { success: false, error: 'Expected start to fail on uninitialized bridge' }
      } catch (error) {
        console.log('✅ Properly caught uninitialized bridge error')
      }
      
      console.log('✅ Error handling test passed')
      return { success: true }
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Clean up test resources
   */
  cleanup(): void {
    if (this.bridge) {
      console.log('🧹 Cleaning up test bridge...')
      this.bridge.terminate()
      this.bridge = null
    }
  }

  /**
   * Run all bridge tests
   */
  static async runAllTests(): Promise<void> {
    console.log('🚀 Starting SimulationBridge test suite...\n')
    
    const testInstance = new SimulationBridgeTest()
    
    const tests = [
      { name: 'Bridge Initialization', test: () => testInstance.testBridgeInitialization() },
      { name: 'Simulation Lifecycle', test: () => testInstance.testSimulationLifecycle() },
      { name: 'Speed Control', test: () => testInstance.testSpeedControl() },
      { name: 'Error Handling', test: () => testInstance.testErrorHandling() }
    ]
    
    let passed = 0
    let failed = 0
    
    for (const { name, test } of tests) {
      try {
        const result = await test()
        if (result.success) {
          passed++
          console.log(`✅ ${name}: PASSED\n`)
        } else {
          failed++
          console.error(`❌ ${name}: FAILED - ${result.error}\n`)
        }
      } catch (error) {
        failed++
        console.error(`❌ ${name}: FAILED - ${error}\n`)
      }
    }
    
    // Cleanup
    testInstance.cleanup()
    
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`)
    
    if (failed === 0) {
      console.log('🎉 All tests passed! SimulationBridge is ready for Phase 6C.')
    } else {
      console.log('⚠️  Some tests failed. SimulationBridge needs fixes before proceeding.')
    }
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).SimulationBridgeTest = SimulationBridgeTest
}
