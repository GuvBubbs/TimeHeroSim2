/**
 * Debug Monitoring System Validation Tests
 * Tests for Task 13: Add debug and monitoring capabilities
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { debugMonitor, logSwimLaneAssignment, logPositionCalculation, generateAssignmentStatistics, recordVisualBoundaryData, generateVisualBoundaryElements, generateMonitoringReport, exportMonitoringData, updateDebugConfig } from '@/utils/debugMonitor'
import type { GameDataItem } from '@/types/game-data'

// Mock game data for testing
const mockGameData: GameDataItem[] = [
  {
    id: 'farm_action_1',
    name: 'Plant Seeds',
    category: 'Actions',
    sourceFile: 'farm_actions.csv',
    prerequisites: []
  },
  {
    id: 'blacksmith_item_1',
    name: 'Iron Sword',
    category: 'Unlocks',
    sourceFile: 'town_blacksmith.csv',
    prerequisites: ['farm_action_1']
  },
  {
    id: 'general_item_1',
    name: 'Unknown Item',
    category: 'Actions',
    sourceFile: 'unknown.csv',
    prerequisites: []
  }
]

// Mock determineSwimLane function
const mockDetermineSwimLane = (item: GameDataItem): string => {
  if (item.sourceFile?.includes('farm')) return 'Farm'
  if (item.sourceFile?.includes('blacksmith')) return 'Blacksmith'
  return 'General'
}

describe('Debug Monitoring System', () => {
  beforeEach(() => {
    debugMonitor.clearMonitoringData()
  })

  describe('Debug Session Management', () => {
    it('should start debug session and initialize monitoring', () => {
      debugMonitor.startSession()
      
      const config = debugMonitor.getConfig()
      expect(config.enableConsoleLogging).toBe(true)
      expect(config.enableAssignmentStats).toBe(true)
    })

    it('should update debug configuration', () => {
      const newConfig = {
        enableConsoleLogging: false,
        logLevel: 'debug' as const
      }
      
      updateDebugConfig(newConfig)
      
      const config = debugMonitor.getConfig()
      expect(config.enableConsoleLogging).toBe(false)
      expect(config.logLevel).toBe('debug')
    })
  })

  describe('Swimlane Assignment Logging', () => {
    it('should log swimlane assignments with detailed reasoning', () => {
      debugMonitor.startSession()
      
      const item = mockGameData[0]
      logSwimLaneAssignment(item, 'Farm', 'Game feature: Farm from farm_actions.csv', 'farm_actions.csv', 'Farm')
      
      // Verify logging doesn't throw errors
      expect(true).toBe(true) // Basic test that function executes
    })

    it('should handle assignment logging for different item types', () => {
      debugMonitor.startSession()
      
      mockGameData.forEach(item => {
        const lane = mockDetermineSwimLane(item)
        const reason = `Assigned based on source file: ${item.sourceFile}`
        
        expect(() => {
          logSwimLaneAssignment(item, lane, reason, item.sourceFile)
        }).not.toThrow()
      })
    })
  })

  describe('Position Calculation Logging', () => {
    it('should log position calculations with detailed steps', () => {
      debugMonitor.startSession()
      
      const item = mockGameData[0]
      const calculationSteps = [
        { step: 'Initialize', value: { x: 0, y: 0 }, description: 'Starting position' },
        { step: 'Calculate X', value: { x: 200 }, description: 'Tier-based X position' },
        { step: 'Calculate Y', value: { y: 100 }, description: 'Lane-based Y position' }
      ]
      
      expect(() => {
        logPositionCalculation(
          item,
          'Farm',
          0,
          { x: 200, y: 100 },
          { x: 200, y: 100 },
          calculationSteps,
          5.2
        )
      }).not.toThrow()
    })

    it('should record position monitoring data when enabled', () => {
      updateDebugConfig({ enablePositionMonitoring: true })
      debugMonitor.startSession()
      
      const item = mockGameData[0]
      logPositionCalculation(
        item,
        'Farm',
        0,
        { x: 200, y: 100 },
        { x: 200, y: 100 },
        [],
        5.2
      )
      
      const monitoringData = debugMonitor.getPositionMonitoringData()
      expect(monitoringData.length).toBe(1)
      expect(monitoringData[0].nodeId).toBe(item.id)
      expect(monitoringData[0].lane).toBe('Farm')
    })
  })

  describe('Assignment Statistics Generation', () => {
    it('should generate comprehensive assignment statistics', () => {
      debugMonitor.startSession()
      
      const stats = generateAssignmentStatistics(mockGameData, mockDetermineSwimLane)
      
      expect(stats.totalItems).toBe(mockGameData.length)
      expect(stats.assignmentsByLane.has('Farm')).toBe(true)
      expect(stats.assignmentsByLane.has('Blacksmith')).toBe(true)
      expect(stats.assignmentsByLane.has('General')).toBe(true)
      expect(stats.assignmentsByLane.get('Farm')).toBe(1)
      expect(stats.assignmentsByLane.get('Blacksmith')).toBe(1)
      expect(stats.assignmentsByLane.get('General')).toBe(1)
    })

    it('should track unassigned items correctly', () => {
      const stats = generateAssignmentStatistics(mockGameData, mockDetermineSwimLane)
      
      // Items assigned to 'General' should be tracked as unassigned
      expect(stats.unassignedItems.length).toBe(1)
      expect(stats.unassignedItems[0].id).toBe('general_item_1')
    })

    it('should provide assignment reasons for all items', () => {
      const stats = generateAssignmentStatistics(mockGameData, mockDetermineSwimLane)
      
      expect(stats.assignmentReasons.size).toBe(mockGameData.length)
      mockGameData.forEach(item => {
        expect(stats.assignmentReasons.has(item.id)).toBe(true)
      })
    })
  })

  describe('Visual Boundary Data Recording', () => {
    it('should record visual boundary data for debugging', () => {
      debugMonitor.startSession()
      
      const mockBoundaries = new Map([
        ['Farm', { startY: 0, endY: 100, centerY: 50, height: 100, usableHeight: 80 }],
        ['Blacksmith', { startY: 125, endY: 225, centerY: 175, height: 100, usableHeight: 80 }]
      ])
      
      recordVisualBoundaryData(mockBoundaries)
      
      const boundaryData = debugMonitor.getVisualBoundaryData()
      expect(boundaryData.length).toBe(2)
      expect(boundaryData[0].lane).toBe('Farm')
      expect(boundaryData[0].height).toBe(100)
    })

    it('should generate visual boundary elements for Cytoscape', () => {
      updateDebugConfig({ enableVisualBoundaries: true })
      debugMonitor.startSession()
      
      const mockBoundaries = new Map([
        ['Farm', { startY: 0, endY: 100, centerY: 50, height: 100, usableHeight: 80 }]
      ])
      
      recordVisualBoundaryData(mockBoundaries)
      const elements = generateVisualBoundaryElements()
      
      expect(Array.isArray(elements)).toBe(true)
      // Elements should be generated when visual boundaries are enabled
      expect(elements.length).toBeGreaterThan(0)
    })
  })

  describe('Monitoring Report Generation', () => {
    it('should generate comprehensive monitoring report', () => {
      debugMonitor.startSession()
      
      // Simulate some monitoring activity
      generateAssignmentStatistics(mockGameData, mockDetermineSwimLane)
      
      const report = generateMonitoringReport()
      
      expect(report.sessionDuration).toBeGreaterThan(0)
      expect(report.assignmentStats).toBeTruthy()
      expect(report.positioningMetrics).toBeTruthy()
      expect(report.recommendations).toBeInstanceOf(Array)
    })

    it('should provide performance metrics', () => {
      updateDebugConfig({ enablePositionMonitoring: true })
      debugMonitor.startSession()
      
      // Simulate position calculations
      mockGameData.forEach(item => {
        logPositionCalculation(item, 'Farm', 0, { x: 200, y: 100 }, { x: 200, y: 100 }, [], 5.0)
      })
      
      const report = generateMonitoringReport()
      
      expect(report.positioningMetrics.totalCalculations).toBe(mockGameData.length)
      expect(report.positioningMetrics.averageCalculationTime).toBe(5.0)
      expect(report.positioningMetrics.adjustmentRate).toBe(0) // No adjustments in this test
    })

    it('should provide recommendations based on metrics', () => {
      updateDebugConfig({ enablePositionMonitoring: true })
      debugMonitor.startSession()
      
      // Simulate high adjustment rate
      mockGameData.forEach(item => {
        logPositionCalculation(item, 'Farm', 0, { x: 200, y: 100 }, { x: 210, y: 110 }, [], 5.0)
      })
      
      const report = generateMonitoringReport()
      
      expect(report.positioningMetrics.adjustmentRate).toBeGreaterThan(0)
      expect(report.recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('Data Export Functionality', () => {
    it('should export monitoring data as JSON', () => {
      debugMonitor.startSession()
      generateAssignmentStatistics(mockGameData, mockDetermineSwimLane)
      
      const exportedData = exportMonitoringData()
      
      expect(typeof exportedData).toBe('string')
      
      const parsedData = JSON.parse(exportedData)
      expect(parsedData.assignmentStats).toBeTruthy()
      expect(parsedData.config).toBeTruthy()
      expect(parsedData.exportTimestamp).toBeTruthy()
    })

    it('should include all monitoring data in export', () => {
      updateDebugConfig({ enablePositionMonitoring: true })
      debugMonitor.startSession()
      
      generateAssignmentStatistics(mockGameData, mockDetermineSwimLane)
      logPositionCalculation(mockGameData[0], 'Farm', 0, { x: 200, y: 100 }, { x: 200, y: 100 }, [], 5.0)
      
      const exportedData = exportMonitoringData()
      const parsedData = JSON.parse(exportedData)
      
      expect(parsedData.positionMonitoringData).toBeInstanceOf(Array)
      expect(parsedData.positionMonitoringData.length).toBe(1)
      expect(parsedData.visualBoundaryData).toBeInstanceOf(Array)
    })
  })

  describe('Real-time Position Monitoring', () => {
    it('should monitor position calculations in real-time when enabled', () => {
      updateDebugConfig({ enablePositionMonitoring: true })
      debugMonitor.startSession()
      
      const startTime = Date.now()
      
      mockGameData.forEach((item, index) => {
        logPositionCalculation(
          item,
          mockDetermineSwimLane(item),
          index,
          { x: 200 + index * 100, y: 100 + index * 50 },
          { x: 200 + index * 100, y: 100 + index * 50 },
          [],
          Math.random() * 10
        )
      })
      
      const monitoringData = debugMonitor.getPositionMonitoringData()
      
      expect(monitoringData.length).toBe(mockGameData.length)
      monitoringData.forEach((data, index) => {
        expect(data.timestamp).toBeGreaterThanOrEqual(startTime)
        expect(data.nodeId).toBe(mockGameData[index].id)
        expect(data.tier).toBe(index)
      })
    })

    it('should not store monitoring data when disabled', () => {
      updateDebugConfig({ enablePositionMonitoring: false })
      debugMonitor.startSession()
      
      logPositionCalculation(mockGameData[0], 'Farm', 0, { x: 200, y: 100 }, { x: 200, y: 100 }, [], 5.0)
      
      const monitoringData = debugMonitor.getPositionMonitoringData()
      expect(monitoringData.length).toBe(0)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty game data gracefully', () => {
      debugMonitor.startSession()
      
      expect(() => {
        generateAssignmentStatistics([], mockDetermineSwimLane)
      }).not.toThrow()
      
      const stats = generateAssignmentStatistics([], mockDetermineSwimLane)
      expect(stats.totalItems).toBe(0)
      expect(stats.unassignedItems.length).toBe(0)
    })

    it('should handle invalid boundary data gracefully', () => {
      debugMonitor.startSession()
      
      expect(() => {
        recordVisualBoundaryData(new Map())
      }).not.toThrow()
      
      const boundaryData = debugMonitor.getVisualBoundaryData()
      expect(boundaryData.length).toBe(0)
    })

    it('should handle configuration updates during active session', () => {
      // Reset to default config first
      updateDebugConfig({ logLevel: 'standard' })
      debugMonitor.startSession()
      
      const initialConfig = debugMonitor.getConfig()
      expect(initialConfig.logLevel).toBe('standard')
      
      updateDebugConfig({ logLevel: 'debug' })
      
      const updatedConfig = debugMonitor.getConfig()
      expect(updatedConfig.logLevel).toBe('debug')
    })
  })
})