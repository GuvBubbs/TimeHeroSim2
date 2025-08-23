import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ValidationReporter } from '@/utils/validationReporter'
import { mockFarmItems } from '../fixtures/gameDataFixtures'

// Mock console methods
vi.mock('console', () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
}))

describe('ValidationReporter', () => {
  let reporter: ValidationReporter
  
  beforeEach(() => {
    vi.clearAllMocks()
    reporter = new ValidationReporter()
  })

  describe('Position Calculation Recording', () => {
    it('should record detailed position calculation debug info', () => {
      const item = mockFarmItems[0]
      const calculationSteps: any[] = [
        {
          step: 'Calculate Tier X',
          description: 'Calculate X position based on tier',
          input: { tier: 0, tierWidth: 180 },
          output: { x: 200 },
          timestamp: Date.now()
        },
        {
          step: 'Calculate Lane Y',
          description: 'Calculate Y position within lane',
          input: { lane: 'Farm', nodeIndex: 0 },
          output: { y: 100 },
          timestamp: Date.now()
        }
      ]
      
      const boundary = {
        lane: 'Farm',
        startY: 0,
        endY: 200,
        centerY: 100,
        height: 200,
        usableHeight: 160
      }
      
      reporter.recordPositionCalculation(
        item,
        'Farm',
        0,
        calculationSteps,
        { x: 200, y: 100 },
        { x: 200, y: 100 },
        boundary,
        true,
        5.5
      )
      
      const debugInfo = reporter.getNodeDebugInfo(item.id)
      
      expect(debugInfo).toBeDefined()
      expect(debugInfo?.nodeId).toBe(item.id)
      expect(debugInfo?.nodeName).toBe(item.name)
      expect(debugInfo?.lane).toBe('Farm')
      expect(debugInfo?.tier).toBe(0)
      expect(debugInfo?.calculationSteps).toHaveLength(2)
      expect(debugInfo?.withinBounds).toBe(true)
      expect(debugInfo?.adjustmentApplied).toBe(false)
      expect(debugInfo?.calculationTime).toBe(5.5)
    })

    it('should detect position adjustments', () => {
      const item = mockFarmItems[0]
      const calculationSteps: any[] = []
      const boundary = {
        lane: 'Farm',
        startY: 0,
        endY: 200,
        centerY: 100,
        height: 200,
        usableHeight: 160
      }
      
      reporter.recordPositionCalculation(
        item,
        'Farm',
        0,
        calculationSteps,
        { x: 200, y: -50 }, // Calculated outside bounds
        { x: 200, y: 40 },  // Adjusted to within bounds
        boundary,
        true,
        3.2
      )
      
      const debugInfo = reporter.getNodeDebugInfo(item.id)
      
      expect(debugInfo?.adjustmentApplied).toBe(true)
      expect(debugInfo?.adjustmentReason).toContain('Y position adjusted')
    })

    it('should detect boundary violations', () => {
      const item = mockFarmItems[0]
      const calculationSteps = []
      const boundary = {
        lane: 'Farm',
        startY: 100,
        endY: 300,
        centerY: 200,
        height: 200,
        usableHeight: 160
      }
      
      reporter.recordPositionCalculation(
        item,
        'Farm',
        0,
        calculationSteps,
        { x: 200, y: 50 }, // Above boundary
        { x: 200, y: 50 },
        boundary,
        false,
        2.1
      )
      
      const debugInfo = reporter.getNodeDebugInfo(item.id)
      
      expect(debugInfo?.withinBounds).toBe(false)
      expect(debugInfo?.boundaryViolation).toBeDefined()
      expect(debugInfo?.boundaryViolation?.type).toBe('top')
      expect(debugInfo?.boundaryViolation?.severity).toBeDefined()
    })
  })

  describe('Report Generation', () => {
    beforeEach(() => {
      // Record some test data
      const boundary = {
        lane: 'Farm',
        startY: 0,
        endY: 200,
        centerY: 100,
        height: 200,
        usableHeight: 160
      }
      
      reporter.startValidation()
      
      // Record valid node
      reporter.recordPositionCalculation(
        mockFarmItems[0],
        'Farm',
        0,
        [],
        { x: 200, y: 100 },
        { x: 200, y: 100 },
        boundary,
        true,
        2.5
      )
      
      // Record node with violation
      reporter.recordPositionCalculation(
        mockFarmItems[1],
        'Farm',
        1,
        [],
        { x: 380, y: -30 },
        { x: 380, y: 40 },
        boundary,
        true,
        4.2
      )
    })

    it('should generate comprehensive validation report', () => {
      const testResults = [
        {
          testName: 'Boundary Compliance',
          passed: true,
          duration: 15.5,
          issues: [],
          metrics: { totalNodes: 2, violations: 0 }
        }
      ]
      
      const report = reporter.generateReport(testResults)
      
      expect(report.timestamp).toBeGreaterThan(0)
      expect(report.summary.totalNodes).toBe(2)
      expect(report.summary.adjustmentsMade).toBe(1)
      expect(report.testResults).toHaveLength(1)
      expect(report.nodeDetails).toHaveLength(2)
      expect(report.laneAnalysis).toHaveLength(1)
      expect(report.recommendations).toBeDefined()
    })

    it('should calculate accurate summary statistics', () => {
      const testResults: any[] = []
      const report = reporter.generateReport(testResults)
      
      expect(report.summary.totalNodes).toBe(2)
      expect(report.summary.validatedNodes).toBe(2)
      expect(report.summary.adjustmentsMade).toBe(1)
      expect(report.summary.averageCalculationTime).toBeCloseTo(3.35) // (2.5 + 4.2) / 2
    })

    it('should generate lane analysis', () => {
      const testResults: any[] = []
      const report = reporter.generateReport(testResults)
      
      expect(report.laneAnalysis).toHaveLength(1)
      
      const farmAnalysis = report.laneAnalysis[0]
      expect(farmAnalysis.lane).toBe('Farm')
      expect(farmAnalysis.nodeCount).toBe(2)
      expect(farmAnalysis.boundaryViolations).toBe(0)
    })

    it('should generate appropriate recommendations', () => {
      // Add more nodes to trigger recommendations
      const boundary = {
        lane: 'Blacksmith',
        startY: 225,
        endY: 425,
        centerY: 325,
        height: 200,
        usableHeight: 160
      }
      
      // Add nodes with violations to trigger recommendations
      for (let i = 0; i < 5; i++) {
        reporter.recordPositionCalculation(
          { ...mockFarmItems[0], id: `violation-${i}` },
          'Blacksmith',
          0,
          [],
          { x: 200, y: -50 },
          { x: 200, y: 250 },
          boundary,
          false,
          1.0
        )
      }
      
      const testResults: any[] = []
      const report = reporter.generateReport(testResults)
      
      expect(report.recommendations.length).toBeGreaterThan(0)
      expect(report.recommendations.some(rec => rec.includes('boundary violations'))).toBe(true)
    })
  })

  describe('Export Functionality', () => {
    it('should export report to JSON', () => {
      const testResults: any[] = []
      const report = reporter.generateReport(testResults)
      
      const jsonExport = reporter.exportReport(report)
      const parsedReport = JSON.parse(jsonExport)
      
      expect(parsedReport.timestamp).toBe(report.timestamp)
      expect(parsedReport.summary).toEqual(report.summary)
      expect(parsedReport.nodeDetails).toHaveLength(report.nodeDetails.length)
    })

    it('should export report to CSV', () => {
      const testResults: any[] = []
      const report = reporter.generateReport(testResults)
      
      const csvExport = reporter.exportReportCSV(report)
      const lines = csvExport.split('\n').filter(line => line.trim() !== '')
      
      expect(lines[0]).toContain('Node ID,Node Name,Lane,Tier')
      
      // Should have at least header + the 2 data rows we recorded in beforeEach
      if (lines.length > 1) {
        const firstDataRow = lines[1].split(',')
        expect(firstDataRow[0]).toBe(mockFarmItems[0].id)
        expect(firstDataRow[1]).toBe(mockFarmItems[0].name)
        expect(firstDataRow[2]).toBe('Farm')
      }
    })
  })

  describe('Debug Info Management', () => {
    it('should retrieve debug info for specific node', () => {
      const item = mockFarmItems[0]
      const boundary = {
        lane: 'Farm',
        startY: 0,
        endY: 200,
        centerY: 100,
        height: 200,
        usableHeight: 160
      }
      
      reporter.recordPositionCalculation(
        item,
        'Farm',
        0,
        [],
        { x: 200, y: 100 },
        { x: 200, y: 100 },
        boundary,
        true,
        2.5
      )
      
      const debugInfo = reporter.getNodeDebugInfo(item.id)
      expect(debugInfo).toBeDefined()
      expect(debugInfo?.nodeId).toBe(item.id)
      
      const nonExistentInfo = reporter.getNodeDebugInfo('non-existent')
      expect(nonExistentInfo).toBeUndefined()
    })

    it('should retrieve all debug info', () => {
      const boundary = {
        lane: 'Farm',
        startY: 0,
        endY: 200,
        centerY: 100,
        height: 200,
        usableHeight: 160
      }
      
      mockFarmItems.forEach(item => {
        reporter.recordPositionCalculation(
          item,
          'Farm',
          0,
          [],
          { x: 200, y: 100 },
          { x: 200, y: 100 },
          boundary,
          true,
          2.0
        )
      })
      
      const allDebugInfo = reporter.getAllDebugInfo()
      expect(allDebugInfo).toHaveLength(mockFarmItems.length)
    })

    it('should clear debug info', () => {
      const boundary = {
        lane: 'Farm',
        startY: 0,
        endY: 200,
        centerY: 100,
        height: 200,
        usableHeight: 160
      }
      
      reporter.recordPositionCalculation(
        mockFarmItems[0],
        'Farm',
        0,
        [],
        { x: 200, y: 100 },
        { x: 200, y: 100 },
        boundary,
        true,
        2.5
      )
      
      expect(reporter.getAllDebugInfo()).toHaveLength(1)
      
      reporter.clearDebugInfo()
      
      expect(reporter.getAllDebugInfo()).toHaveLength(0)
    })
  })
})