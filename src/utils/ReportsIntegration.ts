import type { SimulationBridge } from './SimulationBridge'
import type { GameState, SimulationStats, CompletionData } from '@/types'
import type { SimulationResult } from '@/types/reports'
import { useReportsStore } from '@/stores/reports'
import { useGameDataStore } from '@/stores/gameData'

/**
 * Integration layer between Live Monitor and Reports system.
 * Automatically generates reports when simulations complete.
 */
export class ReportsIntegration {
  private static instance: ReportsIntegration | null = null
  
  private reportsStore = useReportsStore()
  private gameDataStore = useGameDataStore()
  
  private constructor() {}
  
  static getInstance(): ReportsIntegration {
    if (!ReportsIntegration.instance) {
      ReportsIntegration.instance = new ReportsIntegration()
    }
    return ReportsIntegration.instance
  }
  
  /**
   * Attaches report generation to simulation completion events
   */
  attachToSimulationBridge(bridge: SimulationBridge): void {
    bridge.onComplete(async (completionData: CompletionData) => {
      try {
        await this.handleSimulationCompletion(completionData)
      } catch (error) {
        console.error('❌ ReportsIntegration: Failed to generate report:', error)
        // Don't let report generation failure affect the rest of the completion flow
      }
    })
    
    console.log('✅ ReportsIntegration: Attached to SimulationBridge')
  }
  
  /**
   * Handles simulation completion by generating and saving a report
   */
  private async handleSimulationCompletion(completionData: CompletionData): Promise<void> {
    console.log('📊 ReportsIntegration: Generating report for completed simulation...')
    
    const simulationResult: SimulationResult = {
      id: this.generateSimulationId(),
      simulationName: this.generateSimulationName(completionData),
      personaName: this.getPersonaName(completionData),
      completionReason: completionData.reason,
      finalState: completionData.finalState,
      stats: completionData.stats,
      completedAt: new Date(),
      success: completionData.reason === 'victory',
      summary: completionData.summary || 'Simulation completed'
    }
    
    // Generate the full report
    await this.reportsStore.createReport(simulationResult)
    
    console.log(`✅ ReportsIntegration: Report generated for ${simulationResult.simulationName}`)
    
    // Optional: Show success notification
    this.showCompletionNotification(simulationResult)
  }
  
  /**
   * Generates a unique ID for the simulation
   */
  private generateSimulationId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 5)
    return `sim_${timestamp}_${random}`
  }
  
  /**
   * Generates a descriptive name for the simulation
   */
  private generateSimulationName(completionData: CompletionData): string {
    const date = new Date().toISOString().split('T')[0]
    const persona = this.getPersonaName(completionData)
    const result = completionData.reason === 'victory' ? 'Victory' : 
                  completionData.reason === 'bottleneck' ? 'Bottlenecked' : 'Stopped'
    
    return `${persona} - ${result} (${date})`
  }
  
  /**
   * Extracts persona name from completion data
   */
  private getPersonaName(completionData: CompletionData): string {
    // Try to get persona from final state
    const persona = completionData.finalState?.metadata?.persona
    
    if (persona) {
      // Format persona name nicely
      return persona.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }
    
    return 'Unknown Persona'
  }
  
  /**
   * Shows a notification when a report is generated
   */
  private showCompletionNotification(simulationResult: SimulationResult): void {
    // Create a simple toast notification
    const notification = document.createElement('div')
    notification.className = `
      fixed top-4 right-4 z-50 
      bg-sim-surface border border-sim-accent 
      rounded-lg p-4 shadow-lg
      max-w-sm
      transform translate-x-full
      transition-transform duration-300 ease-out
    `
    
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <i class="fas fa-chart-line text-sim-accent text-lg"></i>
        </div>
        <div class="min-w-0 flex-1">
          <h4 class="text-sm font-medium text-sim-text mb-1">
            Report Generated
          </h4>
          <p class="text-xs text-sim-text-secondary mb-2">
            ${simulationResult.simulationName}
          </p>
          <p class="text-xs text-sim-text-secondary">
            ${simulationResult.success ? '✅ Victory' : '⚠️ ' + simulationResult.completionReason}
            • ${simulationResult.stats.daysPassed} days
          </p>
        </div>
        <button 
          onclick="this.parentElement.parentElement.remove()"
          class="flex-shrink-0 text-sim-text-secondary hover:text-sim-text"
        >
          <i class="fas fa-times text-sm"></i>
        </button>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)'
    }, 100)
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(full)'
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove()
        }
      }, 300)
    }, 5000)
  }
  
  /**
   * Manual report generation for existing simulation data
   */
  async generateReportFromData(
    finalState: GameState, 
    stats: SimulationStats, 
    options: {
      simulationName?: string
      personaName?: string
      reason?: 'victory' | 'bottleneck' | 'manual'
    } = {}
  ): Promise<string> {
    const simulationResult: SimulationResult = {
      id: this.generateSimulationId(),
      simulationName: options.simulationName || `Manual Report (${new Date().toISOString().split('T')[0]})`,
      personaName: options.personaName || 'Manual Entry',
      completionReason: options.reason || 'manual',
      finalState,
      stats,
      completedAt: new Date(),
      success: options.reason === 'victory',
      summary: `Manual report generation`
    }
    
    const reportId = await this.reportsStore.createReport(simulationResult)
    return reportId
  }
}

// Export singleton instance for easy access
export const reportsIntegration = ReportsIntegration.getInstance()

