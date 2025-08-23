import { describe, it, expect, beforeEach, vi } from 'vitest'
import { validateAllPositions } from '@/utils/graphBuilder'
import { mockFarmItems } from '../fixtures/gameDataFixtures'
import type { GameDataItem } from '@/types/game-data'

// Mock console methods
vi.mock('console', () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
}))

interface PositionedNode {
  item: GameDataItem
  position: { x: number, y: number }
  lane: string
  tier: number
  withinBounds: boolean
}

interface LaneBoundary {
  lane: string
  startY: number
  endY: number
  centerY: number
  height: number
  usableHeight: number
}

describe('Boundary Validation', () => {
  let mockBoundaries: Map<string, LaneBoundary>
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up mock lane boundaries
    mockBoundaries = new Map([
      ['Farm', {
        lane: 'Farm',
        startY: 0,
        endY: 200,
        centerY: 100,
        height: 200,
        usableHeight: 160
      }],
      ['Blacksmith', {
        lane: 'Blacksmith',
        startY: 225,
        endY: 425,
        centerY: 325,
        height: 200,
        usableHeight: 160
      }],
      ['General', {
        lane: 'General',
        startY: 450,
        endY: 650,
        centerY: 550,
        height: 200,
        usableHeight: 160
      }]
    ])
  })

  describe('validateAllPositions', () => {
    it('should validate nodes within boundaries', () => {
      const validNodes: PositionedNode[] = [
        {
          item: mockFarmItems[0],
          position: { x: 200, y: 100 },
          lane: 'Farm',
          tier: 0,
          withinBounds: true
        },
        {
          item: mockFarmItems[1],
          position: { x: 380, y: 325 },
          lane: 'Blacksmith',
          tier: 1,
          withinBounds: true
        }
      ]
      
      const violations = validateAllPositions(validNodes, mockBoundaries)
      
      expect(violations).toHaveLength(0)
    })

    it('should detect top boundary violations', () => {
      const nodesWithTopViolations: PositionedNode[] = [
        {
          item: mockFarmItems[0],
          position: { x: 200, y: -50 }, // Above Farm lane
          lane: 'Farm',
          tier: 0,
          withinBounds: false
        }
      ]
      
      const violations = validateAllPositions(nodesWithTopViolations, mockBoundaries)
      
      expect(violations).toHaveLength(1)
      expect(violations[0].violationType).toBe('top')
      expect(violations[0].node.item.id).toBe(mockFarmItems[0].id)
    })

    it('should detect bottom boundary violations', () => {
      const nodesWithBottomViolations: PositionedNode[] = [
        {
          item: mockFarmItems[0],
          position: { x: 200, y: 250 }, // Below Farm lane
          lane: 'Farm',
          tier: 0,
          withinBounds: false
        }
      ]
      
      const violations = validateAllPositions(nodesWithBottomViolations, mockBoundaries)
      
      expect(violations).toHaveLength(1)
      expect(violations[0].violationType).toBe('bottom')
      expect(violations[0].node.item.id).toBe(mockFarmItems[0].id)
    })

    it('should classify violation severity correctly', () => {
      // Farm boundary: startY=0, endY=200, buffer=20, nodeHalfHeight=20
      // Valid range: minY=40, maxY=160
      const nodesWithViolations: PositionedNode[] = [
        {
          item: mockFarmItems[0],
          position: { x: 200, y: 35 }, // Minor violation (5px above minY=40)
          lane: 'Farm',
          tier: 0,
          withinBounds: false
        },
        {
          item: mockFarmItems[1],
          position: { x: 200, y: -10 }, // Critical violation (50px above minY=40)
          lane: 'Farm',
          tier: 0,
          withinBounds: false
        }
      ]
      
      const violations = validateAllPositions(nodesWithViolations, mockBoundaries)
      
      expect(violations).toHaveLength(2)
      
      // First violation should be minor (5px violation < 10px threshold)
      const minorViolation = violations.find(v => v.node.item.id === mockFarmItems[0].id)
      expect(minorViolation?.severity).toBe('minor')
      
      // Second violation should be critical (50px violation > 20px threshold)
      const majorViolation = violations.find(v => v.node.item.id === mockFarmItems[1].id)
      expect(majorViolation?.severity).toBe('critical')
    })

    it('should handle nodes in non-existent lanes', () => {
      const nodesWithInvalidLanes: PositionedNode[] = [
        {
          item: mockFarmItems[0],
          position: { x: 200, y: 100 },
          lane: 'NonExistentLane',
          tier: 0,
          withinBounds: false
        }
      ]
      
      const violations = validateAllPositions(nodesWithInvalidLanes, mockBoundaries)
      
      // Should not create violations for non-existent lanes
      expect(violations).toHaveLength(0)
    })

    it('should handle multiple violations across different lanes', () => {
      const mixedNodes: PositionedNode[] = [
        {
          item: mockFarmItems[0],
          position: { x: 200, y: -30 }, // Farm lane violation
          lane: 'Farm',
          tier: 0,
          withinBounds: false
        },
        {
          item: mockFarmItems[1],
          position: { x: 380, y: 325 }, // Valid Blacksmith position
          lane: 'Blacksmith',
          tier: 1,
          withinBounds: true
        },
        {
          item: mockFarmItems[2],
          position: { x: 560, y: 700 }, // General lane violation
          lane: 'General',
          tier: 2,
          withinBounds: false
        }
      ]
      
      const violations = validateAllPositions(mixedNodes, mockBoundaries)
      
      expect(violations).toHaveLength(2)
      
      const farmViolation = violations.find(v => v.node.lane === 'Farm')
      const generalViolation = violations.find(v => v.node.lane === 'General')
      
      expect(farmViolation).toBeDefined()
      expect(farmViolation?.violationType).toBe('top')
      
      expect(generalViolation).toBeDefined()
      expect(generalViolation?.violationType).toBe('bottom')
    })

    it('should provide accurate boundary information in violations', () => {
      const violatingNodes: PositionedNode[] = [
        {
          item: mockFarmItems[0],
          position: { x: 200, y: -50 },
          lane: 'Farm',
          tier: 0,
          withinBounds: false
        }
      ]
      
      const violations = validateAllPositions(violatingNodes, mockBoundaries)
      
      expect(violations).toHaveLength(1)
      
      const violation = violations[0]
      expect(violation.allowedBoundary).toEqual(mockBoundaries.get('Farm'))
      expect(violation.actualPosition).toEqual({ x: 200, y: -50 })
    })
  })

  describe('Boundary Tolerance', () => {
    it('should respect boundary tolerance settings', () => {
      // Test positions just outside the strict boundary but within tolerance
      const borderlineNodes: PositionedNode[] = [
        {
          item: mockFarmItems[0],
          position: { x: 200, y: 40 }, // Just at the edge of Farm lane (with node half-height and buffer)
          lane: 'Farm',
          tier: 0,
          withinBounds: true
        }
      ]
      
      const violations = validateAllPositions(borderlineNodes, mockBoundaries)
      
      // Should not violate due to tolerance
      expect(violations).toHaveLength(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty node list', () => {
      const violations = validateAllPositions([], mockBoundaries)
      expect(violations).toHaveLength(0)
    })

    it('should handle empty boundaries map', () => {
      const nodes: PositionedNode[] = [
        {
          item: mockFarmItems[0],
          position: { x: 200, y: 100 },
          lane: 'Farm',
          tier: 0,
          withinBounds: false
        }
      ]
      
      const violations = validateAllPositions(nodes, new Map())
      expect(violations).toHaveLength(0)
    })

    it('should handle nodes with extreme positions', () => {
      const extremeNodes: PositionedNode[] = [
        {
          item: mockFarmItems[0],
          position: { x: -1000, y: -1000 },
          lane: 'Farm',
          tier: 0,
          withinBounds: false
        },
        {
          item: mockFarmItems[1],
          position: { x: 10000, y: 10000 },
          lane: 'Farm',
          tier: 0,
          withinBounds: false
        }
      ]
      
      const violations = validateAllPositions(extremeNodes, mockBoundaries)
      
      expect(violations).toHaveLength(2)
      expect(violations[0].severity).toBe('critical')
      expect(violations[1].severity).toBe('critical')
    })
  })
})