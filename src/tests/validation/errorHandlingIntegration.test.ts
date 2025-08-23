import { describe, it, expect, beforeEach } from 'vitest'
import { buildGraphElements, getUserFriendlyErrors, generateErrorRecoveryReport } from '@/utils/graphBuilder'
import type { GameDataItem } from '@/types/game-data'

describe('Error Handling Integration Tests', () => {
  const mockGameData: GameDataItem[] = [
    {
      id: 'farm-item-1',
      name: 'Basic Crop',
      category: 'Actions',
      sourceFile: 'farm_actions.csv',
      prerequisites: []
    },
    {
      id: 'farm-item-2',
      name: 'Advanced Crop',
      category: 'Actions', 
      sourceFile: 'farm_actions.csv',
      prerequisites: ['farm-item-1']
    },
    {
      id: 'blacksmith-item-1',
      name: 'Iron Sword',
      category: 'Unlocks',
      sourceFile: 'town_blacksmith.csv',
      prerequisites: []
    },
    {
      id: 'blacksmith-item-2',
      name: 'Steel Sword',
      category: 'Unlocks',
      sourceFile: 'town_blacksmith.csv', 
      prerequisites: ['blacksmith-item-1']
    },
    // Add many items to same lane to trigger overcrowding
    ...Array.from({ length: 15 }, (_, index) => ({
      id: `farm-overcrowd-${index}`,
      name: `Farm Item ${index}`,
      category: 'Actions' as const,
      sourceFile: 'farm_actions.csv',
      prerequisites: []
    }))
  ]

  beforeEach(() => {
    // Clear any existing errors
    const errors = getUserFriendlyErrors()
    if (errors.length > 0) {
      console.log('Clearing previous errors:', errors.length)
    }
  })

  it('should handle graph building with error recovery', () => {
    const result = buildGraphElements(mockGameData)
    
    // Should successfully build graph even with potential issues
    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.edges.length).toBeGreaterThan(0)
    expect(result.laneHeights.size).toBeGreaterThan(0)
    expect(result.laneBoundaries.size).toBeGreaterThan(0)
    
    // Should have error recovery report
    expect(result.errorRecoveryReport).toBeDefined()
    expect(result.errorRecoveryReport.summary).toBeTruthy()
    
    // Check if any recoveries were applied
    const report = generateErrorRecoveryReport()
    console.log('Error Recovery Report:', report.summary)
    
    if (report.totalRecoveries > 0) {
      console.log('Recoveries by strategy:', report.recoveriesByStrategy)
      expect(report.recoveriesByStrategy).toBeDefined()
    }
    
    if (report.totalErrors > 0) {
      console.log('Errors by severity:', report.errorsBySeverity)
      expect(report.errorsBySeverity).toBeDefined()
    }
  })

  it('should position all nodes within their lane boundaries', () => {
    const result = buildGraphElements(mockGameData)
    
    // Check that all nodes are positioned within their lane boundaries
    result.nodes.forEach(node => {
      const boundary = result.laneBoundaries.get(node.data.swimLane)
      expect(boundary).toBeDefined()
      
      if (boundary) {
        const nodeHalfHeight = 20 // NODE_HEIGHT / 2
        const minY = boundary.startY + 20 + nodeHalfHeight // LANE_BUFFER + nodeHalfHeight
        const maxY = boundary.endY - 20 - nodeHalfHeight // LANE_BUFFER + nodeHalfHeight
        
        expect(node.position.y).toBeGreaterThanOrEqual(minY - 1) // Small tolerance
        expect(node.position.y).toBeLessThanOrEqual(maxY + 1) // Small tolerance
      }
    })
  })

  it('should handle empty data gracefully', () => {
    const result = buildGraphElements([])
    
    expect(result.nodes.length).toBe(0)
    expect(result.edges.length).toBe(0)
    expect(result.laneHeights.size).toBeGreaterThan(0) // Should still have lane structure
    expect(result.laneBoundaries.size).toBeGreaterThan(0)
    
    const report = generateErrorRecoveryReport()
    expect(report.totalErrors).toBe(0)
    expect(report.totalRecoveries).toBe(0)
  })

  it('should handle malformed data with error recovery', () => {
    const malformedData: GameDataItem[] = [
      {
        id: 'malformed-1',
        name: 'Malformed Item',
        category: 'Actions',
        sourceFile: 'unknown_file.csv', // Unknown source file
        prerequisites: ['non-existent-prereq'] // Non-existent prerequisite
      }
    ]
    
    const result = buildGraphElements(malformedData)
    
    // Should still build graph despite malformed data
    expect(result.nodes.length).toBe(1)
    expect(result.nodes[0].data.swimLane).toBe('General') // Should fallback to General lane
    
    // Check if any user-friendly errors were generated
    const errors = getUserFriendlyErrors()
    console.log('User-friendly errors for malformed data:', errors.length)
    
    // Should have error recovery report
    const report = generateErrorRecoveryReport()
    expect(report.summary).toBeTruthy()
  })

  it('should maintain consistent positioning across multiple builds', () => {
    const result1 = buildGraphElements(mockGameData)
    const result2 = buildGraphElements(mockGameData)
    
    // Should produce consistent results
    expect(result1.nodes.length).toBe(result2.nodes.length)
    expect(result1.edges.length).toBe(result2.edges.length)
    
    // Node positions should be consistent (within tolerance)
    result1.nodes.forEach((node1, index) => {
      const node2 = result2.nodes[index]
      expect(node1.data.id).toBe(node2.data.id)
      expect(Math.abs(node1.position.x - node2.position.x)).toBeLessThan(1)
      expect(Math.abs(node1.position.y - node2.position.y)).toBeLessThan(1)
    })
  })
})