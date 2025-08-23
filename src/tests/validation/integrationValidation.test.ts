import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildGraphElements, validationReporter } from '@/utils/graphBuilder'
import { mockMixedItems, mockOvercrowdedLaneItems } from '../fixtures/gameDataFixtures'

// Mock console methods
vi.mock('console', () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
}))

describe('Integration Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    validationReporter.clearDebugInfo()
  })

  describe('buildGraphElements with Comprehensive Validation', () => {
    it('should build graph elements with comprehensive validation', () => {
      const result = buildGraphElements(mockMixedItems)
      
      expect(result.nodes).toBeDefined()
      expect(result.edges).toBeDefined()
      expect(result.laneHeights).toBeDefined()
      expect(result.laneBoundaries).toBeDefined()
      expect(result.validationResults).toBeDefined()
      expect(result.validationSummary).toBeDefined()
      expect(result.comprehensiveReport).toBeDefined()
    })

    it('should record detailed debug information for all nodes', () => {
      buildGraphElements(mockMixedItems)
      
      const allDebugInfo = validationReporter.getAllDebugInfo()
      
      // Should have debug info for all tree items (Actions/Unlocks only)
      const expectedTreeItems = mockMixedItems.filter(item => 
        item.category === 'Actions' || item.category === 'Unlocks'
      )
      
      expect(allDebugInfo.length).toBe(expectedTreeItems.length)
      
      // Each debug info should have complete calculation steps
      allDebugInfo.forEach(debugInfo => {
        expect(debugInfo.nodeId).toBeDefined()
        expect(debugInfo.nodeName).toBeDefined()
        expect(debugInfo.lane).toBeDefined()
        expect(debugInfo.tier).toBeGreaterThanOrEqual(0)
        expect(debugInfo.calculationSteps).toBeDefined()
        expect(debugInfo.calculationSteps.length).toBeGreaterThan(0)
        expect(debugInfo.calculatedPosition).toBeDefined()
        expect(debugInfo.finalPosition).toBeDefined()
        expect(debugInfo.boundary).toBeDefined()
        expect(debugInfo.calculationTime).toBeGreaterThan(0)
      })
    })

    it('should generate comprehensive validation report', () => {
      const result = buildGraphElements(mockMixedItems)
      
      expect(result.comprehensiveReport).toBeDefined()
      expect(result.comprehensiveReport.timestamp).toBeGreaterThan(0)
      expect(result.comprehensiveReport.summary).toBeDefined()
      expect(result.comprehensiveReport.testResults).toBeDefined()
      expect(result.comprehensiveReport.nodeDetails).toBeDefined()
      expect(result.comprehensiveReport.laneAnalysis).toBeDefined()
      expect(result.comprehensiveReport.recommendations).toBeDefined()
      
      // Summary should have accurate counts
      const expectedTreeItems = mockMixedItems.filter(item => 
        item.category === 'Actions' || item.category === 'Unlocks'
      )
      expect(result.comprehensiveReport.summary.totalNodes).toBe(expectedTreeItems.length)
    })

    it('should handle overcrowded lanes with proper validation', () => {
      const result = buildGraphElements(mockOvercrowdedLaneItems)
      
      expect(result.comprehensiveReport).toBeDefined()
      
      // Should detect overcrowding issues
      const farmLaneAnalysis = result.comprehensiveReport.laneAnalysis.find(lane => lane.lane === 'Farm')
      expect(farmLaneAnalysis).toBeDefined()
      expect(farmLaneAnalysis?.nodeCount).toBe(mockOvercrowdedLaneItems.length)
      
      // May be marked as overcrowded due to many nodes in same tier
      if (farmLaneAnalysis?.overcrowded) {
        expect(result.comprehensiveReport.recommendations.some(rec => 
          rec.includes('overcrowded')
        )).toBe(true)
      }
    })

    it('should validate all nodes are within boundaries', () => {
      const result = buildGraphElements(mockMixedItems)
      
      // Check that all nodes are positioned within their lane boundaries
      result.nodes.forEach(node => {
        const boundary = result.laneBoundaries.get(node.data.swimLane)
        expect(boundary).toBeDefined()
        
        if (boundary) {
          const nodeHalfHeight = 20 // NODE_HEIGHT / 2
          const buffer = 20 // LANE_BUFFER
          const minY = boundary.startY + buffer + nodeHalfHeight
          const maxY = boundary.endY - buffer - nodeHalfHeight
          
          // Allow some tolerance for boundary enforcement
          expect(node.position.y).toBeGreaterThanOrEqual(minY - 5)
          expect(node.position.y).toBeLessThanOrEqual(maxY + 5)
        }
      })
    })

    it('should maintain tier consistency across lanes', () => {
      const result = buildGraphElements(mockMixedItems)
      
      // Group nodes by tier
      const tierGroups = new Map<number, any[]>()
      result.nodes.forEach(node => {
        const tier = node.data.tier
        if (!tierGroups.has(tier)) {
          tierGroups.set(tier, [])
        }
        tierGroups.get(tier)!.push(node)
      })
      
      // Check that nodes in the same tier have similar X positions
      tierGroups.forEach((nodes, tier) => {
        if (nodes.length > 1) {
          const xPositions = nodes.map(n => n.position.x)
          const minX = Math.min(...xPositions)
          const maxX = Math.max(...xPositions)
          const range = maxX - minX
          
          // Allow some tolerance for tier alignment (10% of tier width)
          const tierWidth = 180 // LAYOUT_CONSTANTS.TIER_WIDTH
          expect(range).toBeLessThanOrEqual(tierWidth * 0.1)
        }
      })
    })

    it('should export validation report in multiple formats', () => {
      buildGraphElements(mockMixedItems)
      
      const report = validationReporter.generateReport([])
      
      // Test JSON export
      const jsonExport = validationReporter.exportReport(report)
      expect(() => JSON.parse(jsonExport)).not.toThrow()
      
      const parsedReport = JSON.parse(jsonExport)
      expect(parsedReport.timestamp).toBe(report.timestamp)
      expect(parsedReport.summary).toEqual(report.summary)
      
      // Test CSV export
      const csvExport = validationReporter.exportReportCSV(report)
      const lines = csvExport.split('\n')
      expect(lines.length).toBeGreaterThan(1) // Header + data rows
      expect(lines[0]).toContain('Node ID,Node Name,Lane,Tier')
    })
  })

  describe('Performance Validation', () => {
    it('should complete validation within acceptable time limits', () => {
      const startTime = performance.now()
      
      buildGraphElements(mockMixedItems)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete within 1 second for small datasets
      expect(duration).toBeLessThan(1000)
    })

    it('should handle large datasets efficiently', () => {
      // Create a larger dataset
      const largeDataset = Array.from({ length: 50 }, (_, i) => ({
        id: `large-item-${i}`,
        name: `Large Item ${i}`,
        category: 'Actions' as const,
        sourceFile: 'farm_actions.csv',
        goldCost: 100,
        energyCost: 10,
        level: 1,
        prerequisites: i > 0 ? [`large-item-${i - 1}`] : [],
        categories: ['farm'],
        type: 'action'
      }))
      
      const startTime = performance.now()
      
      const result = buildGraphElements(largeDataset)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should still complete within reasonable time for larger datasets
      expect(duration).toBeLessThan(5000) // 5 seconds
      expect(result.nodes).toHaveLength(50)
      expect(result.comprehensiveReport.summary.totalNodes).toBe(50)
    })
  })

  describe('Error Handling', () => {
    it('should handle empty item list gracefully', () => {
      const result = buildGraphElements([])
      
      expect(result.nodes).toHaveLength(0)
      expect(result.edges).toHaveLength(0)
      expect(result.comprehensiveReport).toBeDefined()
      expect(result.comprehensiveReport.summary.totalNodes).toBe(0)
    })

    it('should handle items with invalid data gracefully', () => {
      const invalidItems = [
        {
          id: '',
          name: '',
          category: 'Actions' as const,
          sourceFile: '',
          goldCost: 0,
          energyCost: 0,
          level: 0,
          prerequisites: [],
          categories: [],
          type: ''
        }
      ]
      
      expect(() => buildGraphElements(invalidItems)).not.toThrow()
      
      const result = buildGraphElements(invalidItems)
      expect(result.nodes).toHaveLength(1)
      expect(result.comprehensiveReport.summary.totalNodes).toBe(1)
    })

    it('should handle circular dependencies gracefully', () => {
      const circularItems = [
        {
          id: 'item-a',
          name: 'Item A',
          category: 'Actions' as const,
          sourceFile: 'farm_actions.csv',
          goldCost: 100,
          energyCost: 10,
          level: 1,
          prerequisites: ['item-b'],
          categories: ['farm'],
          type: 'action'
        },
        {
          id: 'item-b',
          name: 'Item B',
          category: 'Actions' as const,
          sourceFile: 'farm_actions.csv',
          goldCost: 100,
          energyCost: 10,
          level: 1,
          prerequisites: ['item-a'],
          categories: ['farm'],
          type: 'action'
        }
      ]
      
      expect(() => buildGraphElements(circularItems)).not.toThrow()
      
      const result = buildGraphElements(circularItems)
      expect(result.nodes).toHaveLength(2)
    })
  })
})