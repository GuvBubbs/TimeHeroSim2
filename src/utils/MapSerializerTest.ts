// MapSerializer Test - Phase 6A Validation
// Tests serialization with actual Phase 5 parameter data

import { MapSerializer, validateMapReconstruction } from '@/utils/MapSerializer'
import type { SimulationConfig, AllParameters } from '@/types'

/**
 * Test suite for MapSerializer functionality
 */
export class MapSerializerTest {
  /**
   * Creates a mock SimulationConfig with Maps for testing
   */
  static createTestConfig(): SimulationConfig {
    const parameterOverrides = new Map<string, any>()
    parameterOverrides.set('farm.automation.plantingStrategy', 'highest-value')
    parameterOverrides.set('tower.automation.targetSeedRatios', new Map([
      ['turnip', 0.4],
      ['beet', 0.3],
      ['carrot', 0.3]
    ]))

    return {
      id: 'test-config',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      quickSetup: {
        name: 'Test Simulation',
        personaId: 'casual',
        duration: { mode: 'fixed', maxDays: 7 },
        dataSource: 'current',
        enableParameterOverrides: true,
        generateDetailedLogs: false
      },
      parameterOverrides,
      isValid: true,
      validationErrors: []
    }
  }

  /**
   * Creates mock AllParameters with Maps for testing
   */
  static createTestParameters(): any {
    return {
      farm: {
        automation: {
          targetSeedRatios: new Map([
            ['turnip', 2],
            ['beet', 3],
            ['carrot', 1]
          ]),
          priorityWeights: {
            planting: 1.0,
            watering: 0.8,
            harvesting: 1.2
          }
        }
      },
      tower: {
        autoCatcher: {
          targetSeedRatios: new Map([
            ['turnip', 0.5],
            ['beet', 0.3],
            ['carrot', 0.2]
          ])
        }
      },
      decisions: {
        screenPriorities: {
          weights: new Map([
            ['farm', 1.0],
            ['tower', 0.8],
            ['town', 0.6]
          ]),
          adjustmentFactors: {
            energyLow: new Map([
              ['farm', 1.2],
              ['town', 0.5]
            ]),
            seedsLow: new Map([
              ['tower', 1.5],
              ['farm', 0.8]
            ])
          }
        }
      }
    }
  }

  /**
   * Test basic SimulationConfig serialization
   */
  static testConfigSerialization(): { success: boolean; error?: string } {
    try {
      console.log('🧪 Testing SimulationConfig serialization...')
      
      const config = this.createTestConfig()
      console.log('Original config parameterOverrides:', config.parameterOverrides)
      
      // Serialize
      const serialized = MapSerializer.serialize(config)
      console.log('Serialized parameterOverrides:', serialized.parameterOverrides)
      
      // Deserialize
      const deserialized = MapSerializer.deserialize(serialized)
      console.log('Deserialized parameterOverrides:', deserialized.parameterOverrides)
      
      // Validate Maps were reconstructed
      if (!(deserialized.parameterOverrides instanceof Map)) {
        return { success: false, error: 'parameterOverrides not reconstructed as Map' }
      }
      
      if (deserialized.parameterOverrides.size !== config.parameterOverrides?.size) {
        return { success: false, error: 'parameterOverrides size mismatch' }
      }
      
      console.log('✅ SimulationConfig serialization test passed')
      return { success: true }
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Test nested Map serialization in parameters
   */
  static testParameterSerialization(): { success: boolean; error?: string } {
    try {
      console.log('🧪 Testing parameter Map serialization...')
      
      const params = this.createTestParameters()
      console.log('Original parameters:', params)
      
      // Serialize
      const serialized = MapSerializer.serializeMapsInObject(params)
      console.log('Serialized parameters:', JSON.stringify(serialized, null, 2))
      
      // Deserialize
      const deserialized = MapSerializer.deserializeMapsInObject(serialized)
      console.log('Deserialized parameters:', deserialized)
      
      // Validate specific Maps
      const targetSeedRatios = deserialized.farm.automation.targetSeedRatios
      if (!(targetSeedRatios instanceof Map)) {
        return { success: false, error: 'farm.automation.targetSeedRatios not reconstructed as Map' }
      }
      
      const screenWeights = deserialized.decisions.screenPriorities.weights
      if (!(screenWeights instanceof Map)) {
        return { success: false, error: 'decisions.screenPriorities.weights not reconstructed as Map' }
      }
      
      const energyFactors = deserialized.decisions.screenPriorities.adjustmentFactors.energyLow
      if (!(energyFactors instanceof Map)) {
        return { success: false, error: 'nested adjustmentFactors.energyLow not reconstructed as Map' }
      }
      
      // Test values are preserved
      if (targetSeedRatios.get('turnip') !== 2) {
        return { success: false, error: 'Map values not preserved correctly' }
      }
      
      console.log('✅ Parameter serialization test passed')
      return { success: true }
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Test roundtrip integrity
   */
  static testRoundtripIntegrity(): { success: boolean; error?: string } {
    try {
      console.log('🧪 Testing roundtrip integrity...')
      
      const params = this.createTestParameters()
      
      // Use the built-in roundtrip test
      const result = MapSerializer.testRoundtrip(params)
      
      if (!result.success) {
        return result
      }
      
      // Additional validation with our validator
      const serialized = MapSerializer.serializeMapsInObject(params)
      const deserialized = MapSerializer.deserializeMapsInObject(serialized)
      const errors = validateMapReconstruction(params, deserialized)
      
      if (errors.length > 0) {
        return { success: false, error: `Validation errors: ${errors.join(', ')}` }
      }
      
      console.log('✅ Roundtrip integrity test passed')
      return { success: true }
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Run all tests
   */
  static runAllTests(): void {
    console.log('🚀 Starting MapSerializer test suite...\n')
    
    const tests = [
      { name: 'Config Serialization', test: () => this.testConfigSerialization() },
      { name: 'Parameter Serialization', test: () => this.testParameterSerialization() },
      { name: 'Roundtrip Integrity', test: () => this.testRoundtripIntegrity() }
    ]
    
    let passed = 0
    let failed = 0
    
    for (const { name, test } of tests) {
      const result = test()
      if (result.success) {
        passed++
        console.log(`✅ ${name}: PASSED\n`)
      } else {
        failed++
        console.error(`❌ ${name}: FAILED - ${result.error}\n`)
      }
    }
    
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`)
    
    if (failed === 0) {
      console.log('🎉 All tests passed! MapSerializer is ready for Web Worker communication.')
    } else {
      console.log('⚠️  Some tests failed. MapSerializer needs fixes before proceeding.')
    }
  }
}

// Export for use in browser console or test runner
if (typeof window !== 'undefined') {
  (window as any).MapSerializerTest = MapSerializerTest
}
