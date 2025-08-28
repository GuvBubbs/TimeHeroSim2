/**
 * Example implementation for integrating Reports with Live Monitor
 * 
 * This file demonstrates how to connect the Reports system to the 
 * Live Monitor's simulation completion workflow.
 */

import { SimulationBridge } from './SimulationBridge'
import { reportsIntegration } from './ReportsIntegration'

/**
 * Example: How to integrate reports into an existing Live Monitor setup
 */
export function setupReportsIntegration(bridge: SimulationBridge) {
  // Attach the reports integration to the simulation bridge
  // This will automatically generate reports when simulations complete
  reportsIntegration.attachToSimulationBridge(bridge)
  
  console.log('✅ Reports integration attached to Live Monitor')
}

/**
 * Example: Manual report generation from existing data
 */
export async function generateManualReport(simulationData: {
  finalState: any,
  stats: any,
  simulationName?: string,
  personaName?: string,
  reason?: 'victory' | 'bottleneck' | 'manual'
}) {
  const reportId = await reportsIntegration.generateReportFromData(
    simulationData.finalState,
    simulationData.stats,
    {
      simulationName: simulationData.simulationName,
      personaName: simulationData.personaName,
      reason: simulationData.reason
    }
  )
  
  console.log(`📊 Manual report generated: ${reportId}`)
  return reportId
}

/**
 * Usage in LiveMonitorView.vue:
 * 
 * ```typescript
 * import { setupReportsIntegration } from '@/utils/reports-integration-example'
 * 
 * const initializeSimulation = async () => {
 *   try {
 *     if (!bridge.value) {
 *       bridge.value = new SimulationBridge()
 *     }
 * 
 *     // Setup reports integration BEFORE initializing
 *     setupReportsIntegration(bridge.value)
 * 
 *     const testConfig = SimulationBridgeTest.createTestConfig()
 *     await bridge.value.initialize(testConfig)
 *     
 *     bridgeStatus.isInitialized = true
 *   } catch (error) {
 *     console.error('❌ LiveMonitor: Initialization failed:', error)
 *   }
 * }
 * ```
 * 
 * That's it! Reports will now be automatically generated when simulations complete.
 */
