// Development Testing Utilities - Phase 6B
// Exposes testing tools to browser console for development

import { SimulationBridge } from '@/utils/SimulationBridge'
import { SimulationBridgeTest } from '@/utils/SimulationBridgeTest'
import { MapSerializer } from '@/utils/MapSerializer'
import { MapSerializerTest } from '@/utils/MapSerializerTest'

/**
 * Development testing utilities exposed to global scope
 */
export class DevTools {
  static initialize() {
    // Expose to window for console access
    if (typeof window !== 'undefined') {
      // Don't assign classes directly - causes constructor errors
      // Instead, provide factory functions and convenience methods
      
      // Convenience methods that work correctly
      (window as any).testWorker = async () => {
        console.log('🚀 Starting Web Worker tests...')
        await SimulationBridgeTest.runAllTests()
      }
      
      (window as any).testSerializer = () => {
        console.log('🚀 Starting MapSerializer tests...')
        MapSerializerTest.runAllTests()
      }
      
      (window as any).createTestBridge = async () => {
        console.log('🔧 Creating test bridge...')
        const bridge = new SimulationBridge()
        const config = SimulationBridgeTest.createTestConfig()
        
        console.log('📡 Initializing bridge...')
        await bridge.initialize(config)
        
        console.log('✅ Bridge ready! Use bridge.start(speed) to begin')
        return bridge
      }
      
      // Factory functions to create instances
      (window as any).createBridge = () => {
        return new SimulationBridge()
      }
      (window as any).createTestConfig = () => {
        return SimulationBridgeTest.createTestConfig()
      }
      
      // Static method access  
      (window as any).serializeConfig = (config: any) => {
        return MapSerializer.serialize(config)
      }
      (window as any).deserializeConfig = (data: any) => MapSerializer.deserialize(data)
      
      console.log('🛠️ DevTools loaded! Available commands:')
      console.log('   testWorker() - Run Web Worker tests')
      console.log('   testSerializer() - Run MapSerializer tests')
      console.log('   createTestBridge() - Create a test bridge instance')
      console.log('   createBridge() - Create new SimulationBridge')
      console.log('   createTestConfig() - Create test configuration')
      console.log('   serializeConfig(config) - Serialize configuration')
      console.log('   deserializeConfig(data) - Deserialize configuration')
    }
  }
}

// Auto-initialize in development
if (import.meta.env.DEV) {
  DevTools.initialize()
}
