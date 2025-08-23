import type { GameDataItem } from '@/types/game-data'
import { LAYOUT_CONSTANTS, DERIVED_CONSTANTS } from './graphBuilder'

/**
 * Enhanced Debug Output and Validation Reporting System
 * Provides comprehensive debug information for position calculations and boundary checks
 */

export interface DetailedPositionDebug {
  nodeId: string
  nodeName: string
  lane: string
  tier: number
  
  // Position calculation steps
  calculationSteps: {
    step: string
    description: string
    input: Record<string, any>
    output: Record<string, any>
    timestamp: number
  }[]
  
  // Final results
  calculatedPosition: { x: number, y: number }
  finalPosition: { x: number, y: number }
  adjustmentApplied: boolean
  adjustmentReason?: string
  
  // Boundary information
  boundary: {
    lane: string
    startY: number
    endY: number
    centerY: number
    height: number
    usableHeight: number
  }
  
  // Validation results
  withinBounds: boolean
  boundaryViolation?: {
    type: 'top' | 'bottom'
    severity: 'minor' | 'major' | 'critical'
    distance: number
  }
  
  // Performance metrics
  calculationTime: number
  validationTime: number
}

export interface ValidationReport {
  timestamp: number
  summary: {
    totalNodes: number
    validatedNodes: number
    boundaryViolations: number
    adjustmentsMade: number
    averageCalculationTime: number
    totalValidationTime: number
  }
  
  testResults: {
    testName: string
    passed: boolean
    duration: number
    issues: Array<{
      severity: 'error' | 'warning' | 'info'
      message: string
      nodeId?: string
      lane?: string
    }>
    metrics?: Record<string, number>
  }[]
  
  nodeDetails: DetailedPositionDebug[]
  
  recommendations: string[]
  
  // Lane-specific analysis
  laneAnalysis: {
    lane: string
    nodeCount: number
    averageSpacing: number
    overcrowded: boolean
    boundaryViolations: number
    heightUtilization: number
  }[]
}

export class ValidationReporter {
  private debugInfo: DetailedPositionDebug[] = []
  private startTime: number = 0
  
  /**
   * Start a new validation session
   */
  startValidation(): void {
    this.startTime = performance.now()
    this.debugInfo = []
    
    // Only log if detailed logging is enabled
    if (this.isDetailedLoggingEnabled()) {
      console.log(`\n🔍 STARTING COMPREHENSIVE VALIDATION SESSION`)
      console.log(`═══════════════════════════════════════════`)
      console.log(`Timestamp: ${new Date().toISOString()}`)
    }
  }
  
  /**
   * Record detailed position calculation debug info
   */
  recordPositionCalculation(
    item: GameDataItem,
    lane: string,
    tier: number,
    calculationSteps: DetailedPositionDebug['calculationSteps'],
    calculatedPosition: { x: number, y: number },
    finalPosition: { x: number, y: number },
    boundary: DetailedPositionDebug['boundary'],
    withinBounds: boolean,
    calculationTime: number
  ): void {
    const debugInfo: DetailedPositionDebug = {
      nodeId: item.id,
      nodeName: item.name || item.id,
      lane,
      tier,
      calculationSteps,
      calculatedPosition,
      finalPosition,
      adjustmentApplied: calculatedPosition.x !== finalPosition.x || calculatedPosition.y !== finalPosition.y,
      adjustmentReason: this.getAdjustmentReason(calculatedPosition, finalPosition),
      boundary,
      withinBounds,
      boundaryViolation: this.calculateBoundaryViolation(finalPosition, boundary),
      calculationTime,
      validationTime: 0 // Will be set during validation
    }
    
    this.debugInfo.push(debugInfo)
    
    // Log detailed calculation steps if enabled
    if (this.isDetailedLoggingEnabled()) {
      this.logDetailedCalculation(debugInfo)
    }
  }
  
  /**
   * Generate comprehensive validation report
   */
  generateReport(testResults: ValidationReport['testResults']): ValidationReport {
    const endTime = performance.now()
    const totalValidationTime = endTime - this.startTime
    
    const report: ValidationReport = {
      timestamp: Date.now(),
      summary: this.generateSummary(totalValidationTime),
      testResults,
      nodeDetails: this.debugInfo,
      recommendations: this.generateRecommendations(),
      laneAnalysis: this.generateLaneAnalysis()
    }
    
    this.logValidationReport(report)
    
    return report
  }
  
  /**
   * Export validation report to JSON
   */
  exportReport(report: ValidationReport): string {
    return JSON.stringify(report, null, 2)
  }
  
  /**
   * Export validation report to CSV
   */
  exportReportCSV(report: ValidationReport): string {
    const headers = [
      'Node ID',
      'Node Name',
      'Lane',
      'Tier',
      'Calculated X',
      'Calculated Y',
      'Final X',
      'Final Y',
      'Adjustment Applied',
      'Within Bounds',
      'Boundary Violation Type',
      'Boundary Violation Severity',
      'Calculation Time (ms)',
      'Validation Time (ms)'
    ]
    
    const rows = report.nodeDetails.map(node => [
      node.nodeId,
      node.nodeName,
      node.lane,
      node.tier.toString(),
      node.calculatedPosition.x.toFixed(2),
      node.calculatedPosition.y.toFixed(2),
      node.finalPosition.x.toFixed(2),
      node.finalPosition.y.toFixed(2),
      node.adjustmentApplied.toString(),
      node.withinBounds.toString(),
      node.boundaryViolation?.type || '',
      node.boundaryViolation?.severity || '',
      node.calculationTime.toFixed(2),
      node.validationTime.toFixed(2)
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }
  
  /**
   * Get debug info for specific node
   */
  getNodeDebugInfo(nodeId: string): DetailedPositionDebug | undefined {
    return this.debugInfo.find(info => info.nodeId === nodeId)
  }
  
  /**
   * Get all debug info
   */
  getAllDebugInfo(): DetailedPositionDebug[] {
    return [...this.debugInfo]
  }
  
  /**
   * Clear debug info
   */
  clearDebugInfo(): void {
    this.debugInfo = []
  }
  
  // Private helper methods
  
  private getAdjustmentReason(calculated: { x: number, y: number }, final: { x: number, y: number }): string | undefined {
    if (calculated.x !== final.x && calculated.y !== final.y) {
      return 'Position adjusted for both X and Y coordinates'
    } else if (calculated.x !== final.x) {
      return 'X position adjusted for tier alignment'
    } else if (calculated.y !== final.y) {
      return 'Y position adjusted for boundary compliance'
    }
    return undefined
  }
  
  private calculateBoundaryViolation(
    position: { x: number, y: number },
    boundary: DetailedPositionDebug['boundary']
  ): DetailedPositionDebug['boundaryViolation'] {
    const nodeHalfHeight = DERIVED_CONSTANTS.NODE_HALF_HEIGHT
    const buffer = LAYOUT_CONSTANTS.LANE_BUFFER
    
    const minY = boundary.startY + buffer + nodeHalfHeight
    const maxY = boundary.endY - buffer - nodeHalfHeight
    
    if (position.y < minY) {
      const distance = minY - position.y
      return {
        type: 'top',
        severity: distance > LAYOUT_CONSTANTS.LANE_BUFFER ? 'critical' : distance > LAYOUT_CONSTANTS.LANE_BUFFER / 2 ? 'major' : 'minor',
        distance
      }
    } else if (position.y > maxY) {
      const distance = position.y - maxY
      return {
        type: 'bottom',
        severity: distance > LAYOUT_CONSTANTS.LANE_BUFFER ? 'critical' : distance > LAYOUT_CONSTANTS.LANE_BUFFER / 2 ? 'major' : 'minor',
        distance
      }
    }
    
    return undefined
  }
  
  private generateSummary(totalValidationTime: number): ValidationReport['summary'] {
    const boundaryViolations = this.debugInfo.filter(info => info.boundaryViolation).length
    const adjustmentsMade = this.debugInfo.filter(info => info.adjustmentApplied).length
    const averageCalculationTime = this.debugInfo.length > 0 
      ? this.debugInfo.reduce((sum, info) => sum + info.calculationTime, 0) / this.debugInfo.length
      : 0
    
    return {
      totalNodes: this.debugInfo.length,
      validatedNodes: this.debugInfo.filter(info => info.withinBounds).length,
      boundaryViolations,
      adjustmentsMade,
      averageCalculationTime,
      totalValidationTime
    }
  }
  
  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    const summary = this.generateSummary(0)
    
    if (summary.boundaryViolations > 0) {
      recommendations.push(`Review lane height calculations - ${summary.boundaryViolations} boundary violations detected`)
    }
    
    if (summary.adjustmentsMade > summary.totalNodes * 0.1) {
      recommendations.push('High number of position adjustments - consider reviewing initial positioning algorithm')
    }
    
    if (summary.averageCalculationTime > 10) {
      recommendations.push('Position calculation performance may need optimization')
    }
    
    const overcrowdedLanes = this.generateLaneAnalysis().filter(lane => lane.overcrowded)
    if (overcrowdedLanes.length > 0) {
      recommendations.push(`Consider increasing height for overcrowded lanes: ${overcrowdedLanes.map(l => l.lane).join(', ')}`)
    }
    
    return recommendations
  }
  
  private generateLaneAnalysis(): ValidationReport['laneAnalysis'] {
    const laneGroups = new Map<string, DetailedPositionDebug[]>()
    
    // Group debug info by lane
    this.debugInfo.forEach(info => {
      if (!laneGroups.has(info.lane)) {
        laneGroups.set(info.lane, [])
      }
      laneGroups.get(info.lane)!.push(info)
    })
    
    // Analyze each lane
    return Array.from(laneGroups.entries()).map(([lane, nodes]) => {
      const nodeCount = nodes.length
      const boundaryViolations = nodes.filter(n => n.boundaryViolation).length
      
      // Calculate average spacing
      const yPositions = nodes.map(n => n.finalPosition.y).sort((a, b) => a - b)
      let averageSpacing = 0
      if (yPositions.length > 1) {
        const spacings = []
        for (let i = 1; i < yPositions.length; i++) {
          spacings.push(yPositions[i] - yPositions[i - 1])
        }
        averageSpacing = spacings.reduce((sum, spacing) => sum + spacing, 0) / spacings.length
      }
      
      // Determine if overcrowded (average spacing < minimum comfortable spacing)
      const minComfortableSpacing = LAYOUT_CONSTANTS.NODE_PADDING + DERIVED_CONSTANTS.NODE_HALF_HEIGHT
      const overcrowded = averageSpacing > 0 && averageSpacing < minComfortableSpacing
      
      // Calculate height utilization
      const boundary = nodes[0]?.boundary
      const heightUtilization = boundary ? (nodeCount * LAYOUT_CONSTANTS.NODE_HEIGHT) / boundary.usableHeight : 0
      
      return {
        lane,
        nodeCount,
        averageSpacing,
        overcrowded,
        boundaryViolations,
        heightUtilization
      }
    })
  }
  
  private isDetailedLoggingEnabled(): boolean {
    // Only enable detailed logging when explicitly requested
    return (typeof window !== 'undefined' && (window as any).ENABLE_DETAILED_VALIDATION_LOGGING === true) ||
           (typeof process !== 'undefined' && process.env.ENABLE_DETAILED_VALIDATION_LOGGING === 'true')
  }
  
  private logDetailedCalculation(debugInfo: DetailedPositionDebug): void {
    console.log(`\n🔧 DETAILED CALCULATION: ${debugInfo.nodeName} (${debugInfo.nodeId})`)
    console.log(`   Lane: ${debugInfo.lane}, Tier: ${debugInfo.tier}`)
    
    debugInfo.calculationSteps.forEach((step, index) => {
      console.log(`   Step ${index + 1}: ${step.step}`)
      console.log(`     ${step.description}`)
      if (Object.keys(step.input).length > 0) {
        console.log(`     Input:`, step.input)
      }
      if (Object.keys(step.output).length > 0) {
        console.log(`     Output:`, step.output)
      }
    })
    
    console.log(`   Calculated Position: (${debugInfo.calculatedPosition.x}, ${debugInfo.calculatedPosition.y})`)
    console.log(`   Final Position: (${debugInfo.finalPosition.x}, ${debugInfo.finalPosition.y})`)
    
    if (debugInfo.adjustmentApplied) {
      console.log(`   ⚠️ Adjustment Applied: ${debugInfo.adjustmentReason}`)
    }
    
    if (debugInfo.boundaryViolation) {
      console.log(`   ❌ Boundary Violation: ${debugInfo.boundaryViolation.type} (${debugInfo.boundaryViolation.severity})`)
    } else {
      console.log(`   ✅ Within Bounds`)
    }
    
    console.log(`   Calculation Time: ${debugInfo.calculationTime.toFixed(2)}ms`)
  }
  
  private logValidationReport(report: ValidationReport): void {
    // Only log detailed reports if explicitly enabled
    if (!this.isDetailedLoggingEnabled()) {
      // Just log a brief summary
      if (report.summary.boundaryViolations > 0 || report.testResults.some(t => !t.passed)) {
        console.warn(`⚠️ Validation found ${report.summary.boundaryViolations} boundary violations in ${report.summary.totalNodes} nodes`)
      }
      return
    }
    
    console.log(`\n📊 COMPREHENSIVE VALIDATION REPORT`)
    console.log(`═══════════════════════════════════`)
    console.log(`Generated: ${new Date(report.timestamp).toISOString()}`)
    console.log(``)
    
    // Summary
    console.log(`📈 SUMMARY:`)
    console.log(`   Total Nodes: ${report.summary.totalNodes}`)
    console.log(`   Validated Nodes: ${report.summary.validatedNodes}`)
    console.log(`   Boundary Violations: ${report.summary.boundaryViolations}`)
    console.log(`   Adjustments Made: ${report.summary.adjustmentsMade}`)
    console.log(`   Average Calculation Time: ${report.summary.averageCalculationTime.toFixed(2)}ms`)
    console.log(`   Total Validation Time: ${report.summary.totalValidationTime.toFixed(2)}ms`)
    console.log(``)
    
    // Test Results
    console.log(`🧪 TEST RESULTS:`)
    report.testResults.forEach(test => {
      const status = test.passed ? '✅' : '❌'
      console.log(`   ${status} ${test.testName} (${test.duration.toFixed(2)}ms)`)
      if (test.issues.length > 0) {
        test.issues.forEach(issue => {
          const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️'
          console.log(`      ${icon} ${issue.message}`)
        })
      }
    })
    console.log(``)
    
    // Lane Analysis
    console.log(`🏊 LANE ANALYSIS:`)
    report.laneAnalysis.forEach(lane => {
      const status = lane.overcrowded ? '⚠️' : '✅'
      console.log(`   ${status} ${lane.lane}: ${lane.nodeCount} nodes, avg spacing: ${lane.averageSpacing.toFixed(1)}px`)
      if (lane.boundaryViolations > 0) {
        console.log(`      ❌ ${lane.boundaryViolations} boundary violations`)
      }
      console.log(`      Height utilization: ${(lane.heightUtilization * 100).toFixed(1)}%`)
    })
    console.log(``)
    
    // Recommendations
    if (report.recommendations.length > 0) {
      console.log(`💡 RECOMMENDATIONS:`)
      report.recommendations.forEach(rec => {
        console.log(`   • ${rec}`)
      })
      console.log(``)
    }
    
    console.log(`🔍 Use getNodeDebugInfo(nodeId) for detailed node analysis`)
    console.log(`📄 Use exportReport() to save full report as JSON`)
    console.log(``)
  }
}

// Global reporter instance
export const validationReporter = new ValidationReporter()