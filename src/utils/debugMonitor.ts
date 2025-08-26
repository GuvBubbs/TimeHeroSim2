/**
 * Debug Monitor for Upgrade Tree Layout
 * Phase 7: Enhanced debugging and monitoring capabilities
 */

interface DebugConfig {
  enabled: boolean
  logLevel: 'silent' | 'error' | 'warn' | 'info' | 'debug'
  showTimestamps: boolean
  showStackTrace: boolean
}

class DebugMonitor {
  private config: DebugConfig = {
    enabled: import.meta.env.DEV,
    logLevel: 'info',
    showTimestamps: true,
    showStackTrace: false
  }

  private logs: Array<{
    level: string
    message: string
    data?: any
    timestamp: number
  }> = []

  configure(config: Partial<DebugConfig>) {
    this.config = { ...this.config, ...config }
  }

  private shouldLog(level: string): boolean {
    if (!this.config.enabled) return false
    
    const levels = ['silent', 'error', 'warn', 'info', 'debug']
    const currentLevelIndex = levels.indexOf(this.config.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    
    return messageLevelIndex <= currentLevelIndex
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = this.config.showTimestamps 
      ? `[${new Date().toLocaleTimeString()}] ` 
      : ''
    
    const prefix = `${timestamp}[UPGRADE-TREE:${level.toUpperCase()}]`
    
    return data ? `${prefix} ${message}` : `${prefix} ${message}`
  }

  debug(message: string, data?: any) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), data)
      this.logs.push({
        level: 'debug',
        message,
        data,
        timestamp: Date.now()
      })
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), data)
      this.logs.push({
        level: 'info',
        message,
        data,
        timestamp: Date.now()
      })
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), data)
      this.logs.push({
        level: 'warn',
        message,
        data,
        timestamp: Date.now()
      })
    }
  }

  error(message: string, data?: any) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), data)
      this.logs.push({
        level: 'error',
        message,
        data,
        timestamp: Date.now()
      })
    }
  }

  getLogs() {
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
  }

  // Methods expected by graphBuilder.ts
  startSession() {
    this.info('Debug session started')
    return this
  }

  generateAssignmentSummary() {
    this.info('Generating assignment summary')
    return this.logs.filter(log => log.message.includes('assigned'))
  }

  generateMonitoringReport() {
    return {
      totalLogs: this.logs.length,
      errorCount: this.logs.filter(log => log.level === 'error').length,
      warningCount: this.logs.filter(log => log.level === 'warn').length,
      logs: this.getLogs()
    }
  }
}

export const debugMonitor = new DebugMonitor()

// Specialized logging functions for layout operations
export function logSwimLaneAssignment(
  nodeId: string, 
  swimlane: string, 
  reason?: string, 
  sourceFile?: string, 
  gameFeature?: string
) {
  debugMonitor.debug(`Node assigned to swimlane`, {
    nodeId,
    swimlane,
    reason,
    sourceFile,
    gameFeature
  })
}

export function logPositionCalculation(
  nodeId: string, 
  position: { x: number; y: number } | string, 
  tier?: number,
  calculatedPosition1?: any,
  calculatedPosition2?: any,
  debugSteps?: any,
  calculationTime?: number
) {
  debugMonitor.debug(`Position calculated for node`, {
    nodeId,
    position,
    tier,
    calculatedPosition1,
    calculatedPosition2,
    debugSteps,
    calculationTime
  })
}

export function recordVisualBoundaryData(boundaries: Record<string, any>) {
  debugMonitor.debug(`Visual boundaries recorded`, boundaries)
}
