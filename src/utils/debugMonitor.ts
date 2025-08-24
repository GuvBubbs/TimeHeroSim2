/**
 * Debug and Monitoring System for Swimlane Positioning
 * Provides comprehensive debugging tools, visual boundary highlighting,
 * assignment statistics, and real-time position monitoring
 */

import type { GameDataItem } from '@/types/game-data'
import { LAYOUT_CONSTANTS } from './graphBuilder'

// Complete swim lanes including individual town vendors
const SWIM_LANES = [
  'Farm',              // Row 0
  'Vendors',           // Row 1 - Town vendors (general)
  'Blacksmith',        // Row 2 - Town blacksmith items  
  'Agronomist',        // Row 3 - Town agronomist items
  'Carpenter',         // Row 4 - Town carpenter items
  'Land Steward',      // Row 5 - Town land steward items
  'Material Trader',   // Row 6 - Town material trader items
  'Skills Trainer',    // Row 7 - Town skills trainer items
  'Adventure',         // Row 8 - Adventure routes
  'Combat',            // Row 9 - Combat items
  'Forge',             // Row 10 - Forge items
  'Mining',            // Row 11 - Mining items
  'Tower',             // Row 12 - Tower items
  'General'            // Row 13 - Catch-all
]

// Debug configuration interface
export interface DebugConfig {
  enableConsoleLogging: boolean
  enableVisualBoundaries: boolean
  enableAssignmentStats: boolean
  enablePositionMonitoring: boolean
  enableDetailedCalculations: boolean
  logLevel: 'minimal' | 'standard' | 'verbose' | 'debug'
}

// Assignment statistics interface
export interface AssignmentStatistics {
  totalItems: number
  assignmentsByLane: Map<string, number>
  assignmentsBySource: Map<string, number>
  assignmentsByFeature: Map<string, number>
  unassignedItems: GameDataItem[]
  assignmentReasons: Map<string, string>
  timestamp: number
}

// Position monitoring data interface
export interface PositionMonitoringData {
  nodeId: string
  nodeName: string
  lane: string
  tier: number
  calculatedPosition: { x: number, y: number }
  finalPosition: { x: number, y: number }
  adjustmentApplied: boolean
  adjustmentReason?: string
  withinBounds: boolean
  calculationTime: number
  timestamp: number
}

// Visual boundary data interface
export interface VisualBoundaryData {
  lane: string
  startY: number
  endY: number
  centerY: number
  height: number
  usableHeight: number
  nodeCount: number
  overcrowded: boolean
}

// Debug monitoring class
export class DebugMonitor {
  private config: DebugConfig
  private assignmentStats: AssignmentStatistics | null = null
  private positionMonitoringData: PositionMonitoringData[] = []
  private visualBoundaryData: VisualBoundaryData[] = []
  private assignmentLogs: Array<{
    itemId: string
    itemName: string
    assignedLane: string
    reason: string
    sourceFile?: string
    gameFeature?: string
    category?: string
    timestamp: number
  }> = []
  private sessionStartTime: number = 0

  constructor(config: Partial<DebugConfig> = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableVisualBoundaries: false,
      enableAssignmentStats: true,
      enablePositionMonitoring: false,
      enableDetailedCalculations: false,
      logLevel: 'standard',
      ...config
    }
  }

  /**
   * Start a new debug session
   */
  startSession(): void {
    this.sessionStartTime = performance.now()
    this.positionMonitoringData = []
    this.visualBoundaryData = []
    this.assignmentLogs = []
    
    if (this.config.enableConsoleLogging && this.config.logLevel !== 'minimal') {
      console.log(`\n🔍 DEBUG MONITOR SESSION STARTED`)
      console.log(`═══════════════════════════════════`)
      console.log(`Timestamp: ${new Date().toISOString()}`)
      console.log(`Configuration:`)
      console.log(`  Console Logging: ${this.config.enableConsoleLogging}`)
      console.log(`  Visual Boundaries: ${this.config.enableVisualBoundaries}`)
      console.log(`  Assignment Stats: ${this.config.enableAssignmentStats}`)
      console.log(`  Position Monitoring: ${this.config.enablePositionMonitoring}`)
      console.log(`  Log Level: ${this.config.logLevel}`)
      console.log(``)
    }
  }

  /**
   * Log swimlane assignment with detailed reasoning
   */
  logSwimLaneAssignment(
    item: GameDataItem,
    assignedLane: string,
    reason: string,
    sourceFile?: string,
    gameFeature?: string
  ): void {
    if (!this.config.enableConsoleLogging) return

    const logData = {
      itemId: item.id,
      itemName: item.name || item.id,
      assignedLane,
      reason,
      sourceFile: sourceFile || item.sourceFile,
      gameFeature,
      category: item.category,
      timestamp: Date.now()
    }

    // Store assignment data for summary - no individual logging
    this.assignmentLogs.push(logData)
    
    // Only log individual assignments in debug mode
    if (this.config.logLevel === 'debug') {
      console.log(`🏊 LANE ASSIGNMENT: ${logData.itemName}`)
      console.log(`   Lane: ${assignedLane}`)
      console.log(`   Reason: ${reason}`)
      if (sourceFile) console.log(`   Source: ${sourceFile}`)
      if (gameFeature) console.log(`   Feature: ${gameFeature}`)
      console.log(`   Category: ${item.category}`)
      console.log(``)
    }
    // No individual logging for standard/verbose modes
  }

  /**
   * Log position calculation with detailed steps
   */
  logPositionCalculation(
    item: GameDataItem,
    lane: string,
    tier: number,
    calculatedPosition: { x: number, y: number },
    finalPosition: { x: number, y: number },
    calculationSteps: Array<{ step: string, value: any, description: string }>,
    calculationTime: number
  ): void {
    const adjustmentApplied = calculatedPosition.x !== finalPosition.x || calculatedPosition.y !== finalPosition.y
    const withinBounds = true // This would be determined by boundary validation

    // Always store monitoring data when position monitoring is enabled, regardless of console logging
    if (this.config.enablePositionMonitoring) {
      this.positionMonitoringData.push({
        nodeId: item.id,
        nodeName: item.name || item.id,
        lane,
        tier,
        calculatedPosition,
        finalPosition,
        adjustmentApplied,
        adjustmentReason: adjustmentApplied ? 'Position adjusted for boundary compliance' : undefined,
        withinBounds,
        calculationTime,
        timestamp: Date.now()
      })
    }

    if (!this.config.enableConsoleLogging) return

    if (this.config.enableDetailedCalculations && (this.config.logLevel === 'debug' || this.config.logLevel === 'verbose')) {
      console.log(`\n📐 POSITION CALCULATION: ${item.name || item.id}`)
      console.log(`   Lane: ${lane}, Tier: ${tier}`)
      console.log(`   Calculation Steps:`)
      calculationSteps.forEach((step, index) => {
        console.log(`     ${index + 1}. ${step.step}: ${step.value} (${step.description})`)
      })
      console.log(`   Calculated: (${calculatedPosition.x}, ${calculatedPosition.y})`)
      console.log(`   Final: (${finalPosition.x}, ${finalPosition.y})`)
      if (adjustmentApplied) {
        console.log(`   ⚠️ Position adjusted`)
      }
      console.log(`   Calculation time: ${calculationTime.toFixed(2)}ms`)
      console.log(``)
    }
  }

  /**
   * Generate assignment statistics
   */
  generateAssignmentStatistics(items: GameDataItem[], determineSwimLane: (item: GameDataItem) => string): AssignmentStatistics {
    const stats: AssignmentStatistics = {
      totalItems: items.length,
      assignmentsByLane: new Map(),
      assignmentsBySource: new Map(),
      assignmentsByFeature: new Map(),
      unassignedItems: [],
      assignmentReasons: new Map(),
      timestamp: Date.now()
    }

    // Initialize lane counts
    SWIM_LANES.forEach(lane => {
      stats.assignmentsByLane.set(lane, 0)
    })

    // Analyze each item
    items.forEach(item => {
      const assignedLane = determineSwimLane(item)
      
      // Count by lane
      const currentCount = stats.assignmentsByLane.get(assignedLane) || 0
      stats.assignmentsByLane.set(assignedLane, currentCount + 1)

      // Count by source file
      if (item.sourceFile) {
        const sourceCount = stats.assignmentsBySource.get(item.sourceFile) || 0
        stats.assignmentsBySource.set(item.sourceFile, sourceCount + 1)
      }

      // Count by category/feature
      if (item.category) {
        const featureCount = stats.assignmentsByFeature.get(item.category) || 0
        stats.assignmentsByFeature.set(item.category, featureCount + 1)
      }

      // Track assignment reason (simplified)
      if (assignedLane === 'General') {
        stats.unassignedItems.push(item)
        stats.assignmentReasons.set(item.id, 'Fallback to General lane')
      } else {
        stats.assignmentReasons.set(item.id, `Assigned to ${assignedLane}`)
      }
    })

    this.assignmentStats = stats

    if (this.config.enableAssignmentStats && this.config.enableConsoleLogging) {
      this.logAssignmentStatistics(stats)
    }

    return stats
  }

  /**
   * Log assignment statistics
   */
  private logAssignmentStatistics(stats: AssignmentStatistics): void {
    console.log(`\n📊 ASSIGNMENT STATISTICS`)
    console.log(`═══════════════════════`)
    console.log(`Total Items: ${stats.totalItems}`)
    console.log(`Unassigned Items: ${stats.unassignedItems.length}`)
    console.log(``)

    console.log(`📋 Items by Lane:`)
    stats.assignmentsByLane.forEach((count, lane) => {
      const percentage = ((count / stats.totalItems) * 100).toFixed(1)
      const bar = '█'.repeat(Math.floor(count / 5)) // Simple bar chart
      console.log(`   ${lane.padEnd(15)}: ${count.toString().padStart(3)} (${percentage}%) ${bar}`)
    })
    console.log(``)

    if (stats.assignmentsBySource.size > 0) {
      console.log(`📁 Items by Source File:`)
      const sortedSources = Array.from(stats.assignmentsBySource.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10) // Top 10
      
      sortedSources.forEach(([source, count]) => {
        const percentage = ((count / stats.totalItems) * 100).toFixed(1)
        console.log(`   ${source.padEnd(25)}: ${count.toString().padStart(3)} (${percentage}%)`)
      })
      console.log(``)
    }

    if (stats.unassignedItems.length > 0) {
      console.log(`⚠️ Unassigned Items (using General lane):`)
      stats.unassignedItems.slice(0, 5).forEach(item => {
        console.log(`   • ${item.name || item.id} (${item.sourceFile || 'unknown source'})`)
      })
      if (stats.unassignedItems.length > 5) {
        console.log(`   ... and ${stats.unassignedItems.length - 5} more`)
      }
      console.log(``)
    }
  }

  /**
   * Record visual boundary data for debugging
   */
  recordVisualBoundaryData(boundaries: Map<string, any>): void {
    this.visualBoundaryData = []
    
    boundaries.forEach((boundary, lane) => {
      this.visualBoundaryData.push({
        lane,
        startY: boundary.startY,
        endY: boundary.endY,
        centerY: boundary.centerY,
        height: boundary.height,
        usableHeight: boundary.usableHeight,
        nodeCount: 0, // Will be updated when nodes are positioned
        overcrowded: false // Will be determined based on node density
      })
    })

    if (this.config.enableConsoleLogging && this.config.logLevel === 'debug') {
      console.log(`\n🏗️ VISUAL BOUNDARY DATA RECORDED`)
      console.log(`═══════════════════════════════════`)
      this.visualBoundaryData.forEach(boundary => {
        console.log(`   ${boundary.lane}: Y ${boundary.startY}-${boundary.endY} (height: ${boundary.height}px)`)
      })
      console.log(``)
    }
  }

  /**
   * Generate visual boundary elements for Cytoscape
   */
  generateVisualBoundaryElements(): any[] {
    if (!this.config.enableVisualBoundaries) return []

    const elements: any[] = []

    this.visualBoundaryData.forEach((boundary, index) => {
      // Create boundary rectangle
      elements.push({
        data: {
          id: `boundary-${boundary.lane}`,
          type: 'boundary'
        },
        position: {
          x: LAYOUT_CONSTANTS.LANE_START_X - 50, // Position to the left of nodes
          y: boundary.centerY
        },
        classes: 'debug-boundary',
        style: {
          'width': '30px',
          'height': `${boundary.height}px`,
          'background-color': index % 2 === 0 ? '#ff000020' : '#00ff0020',
          'border-width': '1px',
          'border-color': index % 2 === 0 ? '#ff0000' : '#00ff00',
          'border-style': 'dashed',
          'shape': 'rectangle',
          'z-index': -5,
          'events': 'no'
        }
      })

      // Create boundary label
      elements.push({
        data: {
          id: `boundary-label-${boundary.lane}`,
          label: `${boundary.lane}\n${boundary.height}px`,
          type: 'boundary-label'
        },
        position: {
          x: LAYOUT_CONSTANTS.LANE_START_X - 80,
          y: boundary.centerY
        },
        classes: 'debug-boundary-label',
        style: {
          'width': '60px',
          'height': '40px',
          'background-color': '#000000aa',
          'color': '#ffffff',
          'font-size': '8px',
          'text-valign': 'center',
          'text-halign': 'center',
          'shape': 'rectangle',
          'z-index': 10,
          'events': 'no'
        }
      })
    })

    return elements
  }

  /**
   * Generate a clean assignment summary
   */
  generateAssignmentSummary(): void {
    if (!this.config.enableConsoleLogging || this.assignmentLogs.length === 0) return

    const laneStats = new Map<string, number>()
    const reasonStats = new Map<string, number>()
    const warnings: string[] = []
    const errors: string[] = []

    // Analyze assignments
    this.assignmentLogs.forEach(log => {
      // Count by lane
      laneStats.set(log.assignedLane, (laneStats.get(log.assignedLane) || 0) + 1)
      
      // Count by reason
      reasonStats.set(log.reason, (reasonStats.get(log.reason) || 0) + 1)
      
      // Check for potential issues
      if (log.reason.includes('fallback') || log.reason.includes('unknown')) {
        warnings.push(`${log.itemName}: ${log.reason}`)
      }
      
      if (log.assignedLane === 'General' && !log.reason.includes('General')) {
        warnings.push(`${log.itemName}: Assigned to General lane (${log.reason})`)
      }
    })

    // Generate clean summary
    console.log(`\n🏊 SWIMLANE ASSIGNMENT SUMMARY`)
    console.log(`═══════════════════════════════`)
    console.log(`Total items processed: ${this.assignmentLogs.length}`)
    
    // Show lane distribution
    console.log(`\nLane Distribution:`)
    const sortedLanes = Array.from(laneStats.entries()).sort((a, b) => b[1] - a[1])
    sortedLanes.forEach(([lane, count]) => {
      const percentage = ((count / this.assignmentLogs.length) * 100).toFixed(1)
      console.log(`  ${lane}: ${count} items (${percentage}%)`)
    })

    // Show warnings if any
    if (warnings.length > 0) {
      console.log(`\n⚠️ Warnings (${warnings.length}):`)
      warnings.slice(0, 5).forEach(warning => console.log(`  • ${warning}`))
      if (warnings.length > 5) {
        console.log(`  ... and ${warnings.length - 5} more warnings`)
      }
    }

    // Show errors if any
    if (errors.length > 0) {
      console.log(`\n❌ Errors (${errors.length}):`)
      errors.slice(0, 5).forEach(error => console.log(`  • ${error}`))
      if (errors.length > 5) {
        console.log(`  ... and ${errors.length - 5} more errors`)
      }
    }

    if (warnings.length === 0 && errors.length === 0) {
      console.log(`\n✅ All assignments completed successfully`)
    }

    console.log(``)
  }

  /**
   * Generate real-time monitoring report
   */
  generateMonitoringReport(): {
    sessionDuration: number
    assignmentStats: AssignmentStatistics | null
    positioningMetrics: {
      totalCalculations: number
      averageCalculationTime: number
      adjustmentRate: number
      boundaryViolations: number
    }
    recommendations: string[]
  } {
    const sessionDuration = performance.now() - this.sessionStartTime

    const positioningMetrics = {
      totalCalculations: this.positionMonitoringData.length,
      averageCalculationTime: this.positionMonitoringData.length > 0 
        ? this.positionMonitoringData.reduce((sum, data) => sum + data.calculationTime, 0) / this.positionMonitoringData.length
        : 0,
      adjustmentRate: this.positionMonitoringData.length > 0
        ? (this.positionMonitoringData.filter(data => data.adjustmentApplied).length / this.positionMonitoringData.length) * 100
        : 0,
      boundaryViolations: this.positionMonitoringData.filter(data => !data.withinBounds).length
    }

    const recommendations: string[] = []
    
    if (positioningMetrics.adjustmentRate > 20) {
      recommendations.push('High position adjustment rate - consider reviewing initial positioning algorithm')
    }
    
    if (positioningMetrics.boundaryViolations > 0) {
      recommendations.push(`${positioningMetrics.boundaryViolations} boundary violations detected - review lane height calculations`)
    }
    
    if (this.assignmentStats && this.assignmentStats.unassignedItems.length > 0) {
      recommendations.push(`${this.assignmentStats.unassignedItems.length} items using fallback General lane - improve assignment logic`)
    }

    return {
      sessionDuration,
      assignmentStats: this.assignmentStats,
      positioningMetrics,
      recommendations
    }
  }

  /**
   * Export monitoring data to JSON
   */
  exportMonitoringData(): string {
    const report = this.generateMonitoringReport()
    return JSON.stringify({
      ...report,
      positionMonitoringData: this.positionMonitoringData,
      visualBoundaryData: this.visualBoundaryData,
      config: this.config,
      exportTimestamp: new Date().toISOString()
    }, null, 2)
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DebugConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    if (this.config.enableConsoleLogging) {
      console.log(`🔧 Debug monitor configuration updated:`, newConfig)
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): DebugConfig {
    return { ...this.config }
  }

  /**
   * Get assignment statistics
   */
  getAssignmentStatistics(): AssignmentStatistics | null {
    return this.assignmentStats
  }

  /**
   * Get position monitoring data
   */
  getPositionMonitoringData(): PositionMonitoringData[] {
    return [...this.positionMonitoringData]
  }

  /**
   * Get visual boundary data
   */
  getVisualBoundaryData(): VisualBoundaryData[] {
    return [...this.visualBoundaryData]
  }

  /**
   * Clear all monitoring data
   */
  clearMonitoringData(): void {
    this.positionMonitoringData = []
    this.visualBoundaryData = []
    this.assignmentStats = null
    this.assignmentLogs = []
    
    if (this.config.enableConsoleLogging) {
      console.log(`🧹 Debug monitoring data cleared`)
    }
  }
}

// Global debug monitor instance
export const debugMonitor = new DebugMonitor()

// Convenience functions for easy access
export const startDebugSession = () => debugMonitor.startSession()
export const logSwimLaneAssignment = (item: GameDataItem, lane: string, reason: string, sourceFile?: string, gameFeature?: string) => 
  debugMonitor.logSwimLaneAssignment(item, lane, reason, sourceFile, gameFeature)
export const logPositionCalculation = (item: GameDataItem, lane: string, tier: number, calculated: { x: number, y: number }, final: { x: number, y: number }, steps: any[], time: number) =>
  debugMonitor.logPositionCalculation(item, lane, tier, calculated, final, steps, time)
export const generateAssignmentStatistics = (items: GameDataItem[], determineSwimLane: (item: GameDataItem) => string) =>
  debugMonitor.generateAssignmentStatistics(items, determineSwimLane)
export const recordVisualBoundaryData = (boundaries: Map<string, any>) =>
  debugMonitor.recordVisualBoundaryData(boundaries)
export const generateVisualBoundaryElements = () => debugMonitor.generateVisualBoundaryElements()
export const generateMonitoringReport = () => debugMonitor.generateMonitoringReport()
export const generateAssignmentSummary = () => debugMonitor.generateAssignmentSummary()
export const exportMonitoringData = () => debugMonitor.exportMonitoringData()
export const updateDebugConfig = (config: Partial<DebugConfig>) => debugMonitor.updateConfig(config)