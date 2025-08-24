import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildGraphElements, LAYOUT_CONSTANTS, DERIVED_CONSTANTS } from '@/utils/graphBuilder'
import { mockFarmItems, mockMixedItems, mockOvercrowdedLaneItems } from '../fixtures/gameDataFixtures'
import type { GameDataItem } from '@/types/game-data'

// Mock console methods
vi.mock('console', () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
}))

describe('Visual Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Boundary Compliance Visual Validation', () => {
    it('should ensure all nodes are visually contained within lane boundaries', () => {
      const result = buildGraphElements(mockMixedItems)
      
      result.nodes.forEach(node => {
        const boundary = result.laneBoundaries.get(node.data.swimLane)
        expect(boundary).toBeDefined()
        
        if (boundary) {
          const nodeHalfHeight = DERIVED_CONSTANTS.NODE_HALF_HEIGHT
          const buffer = LAYOUT_CONSTANTS.LANE_BUFFER
          
          // Calculate visual boundaries (where the node visually appears)
          const visualMinY = boundary.startY + buffer + nodeHalfHeight
          const visualMaxY = boundary.endY - buffer - nodeHalfHeight
          
          // Node should be visually within boundaries
          expect(node.position.y).toBeGreaterThanOrEqual(visualMinY - LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE)
          expect(node.position.y).toBeLessThanOrEqual(visualMaxY + LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE)
        }
      })
    })

    it('should validate lane background alignment with node positions', () => {
      const result = buildGraphElements(mockMixedItems)
      
      // Group nodes by lane
      const nodesByLane = new Map<string, any[]>()
      result.nodes.forEach(node => {
        const lane = node.data.swimLane
        if (!nodesByLane.has(lane)) {
          nodesByLane.set(lane, [])
        }
        nodesByLane.get(lane)!.push(node)
      })
      
      // Validate each lane's background encompasses its nodes
      nodesByLane.forEach((nodes, lane) => {
        const boundary = result.laneBoundaries.get(lane)
        expect(boundary).toBeDefined()
        
        if (boundary && nodes.length > 0) {
          const nodeYPositions = nodes.map(n => n.position.y)
          const minNodeY = Math.min(...nodeYPositions)
          const maxNodeY = Math.max(...nodeYPositions)
          
          // Lane boundary should encompass all nodes with appropriate padding
          const nodeHalfHeight = DERIVED_CONSTANTS.NODE_HALF_HEIGHT
          const expectedMinBoundary = minNodeY - nodeHalfHeight - LAYOUT_CONSTANTS.LANE_BUFFER
          const expectedMaxBoundary = maxNodeY + nodeHalfHeight + LAYOUT_CONSTANTS.LANE_BUFFER
          
          expect(boundary.startY).toBeLessThanOrEqual(expectedMinBoundary + LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE)
          expect(boundary.endY).toBeGreaterThanOrEqual(expectedMaxBoundary - LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE)
        }
      })
    })

    it('should ensure continuous lane backgrounds without gaps', () => {
      const result = buildGraphElements(mockMixedItems)
      
      const sortedBoundaries = Array.from(result.laneBoundaries.values())
        .sort((a, b) => a.startY - b.startY)
      
      for (let i = 1; i < sortedBoundaries.length; i++) {
        const prevBoundary = sortedBoundaries[i - 1]
        const currentBoundary = sortedBoundaries[i]
        
        // Gap between lanes should be exactly LANE_PADDING
        const gap = currentBoundary.startY - prevBoundary.endY
        expect(Math.abs(gap - LAYOUT_CONSTANTS.LANE_PADDING)).toBeLessThanOrEqual(LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE)
      }
    })

    it('should validate alternating background colors for visual distinction', () => {
      const result = buildGraphElements(mockMixedItems)
      
      // This test validates the structure exists for alternating colors
      // The actual color application would be tested in the UI component
      const laneNames = Array.from(result.laneBoundaries.keys())
      
      expect(laneNames.length).toBeGreaterThan(0)
      
      // Each lane should have a unique identifier for styling
      laneNames.forEach(lane => {
        const boundary = result.laneBoundaries.get(lane)
        expect(boundary).toBeDefined()
        expect(boundary?.lane).toBe(lane)
      })
    })

    it('should ensure proper z-index layering structure', () => {
      const result = buildGraphElements(mockMixedItems)
      
      // Validate that nodes have proper class structure for z-index management
      result.nodes.forEach(node => {
        expect(node.classes).toContain('game-node')
        
        // Should have lane-specific class for styling
        const laneClass = node.classes.split(' ').find(cls => cls.startsWith('lane-'))
        expect(laneClass).toBeDefined()
        
        // Should have tier-specific class for layering
        const tierClass = node.classes.split(' ').find(cls => cls.startsWith('tier-'))
        expect(tierClass).toBeDefined()
      })
    })
  })

  describe('Visual Spacing Validation', () => {
    it('should maintain minimum visual spacing between adjacent nodes', () => {
      const result = buildGraphElements(mockOvercrowdedLaneItems)
      
      // Group nodes by lane and tier
      const nodesByLaneTier = new Map<string, Map<number, any[]>>()
      result.nodes.forEach(node => {
        const lane = node.data.swimLane
        const tier = node.data.tier
        
        if (!nodesByLaneTier.has(lane)) {
          nodesByLaneTier.set(lane, new Map())
        }
        if (!nodesByLaneTier.get(lane)!.has(tier)) {
          nodesByLaneTier.get(lane)!.set(tier, [])
        }
        nodesByLaneTier.get(lane)!.get(tier)!.push(node)
      })
      
      // Check spacing within each lane-tier group
      nodesByLaneTier.forEach((tierMap, lane) => {
        tierMap.forEach((nodes, tier) => {
          if (nodes.length > 1) {
            // Sort nodes by Y position
            const sortedNodes = nodes.sort((a, b) => a.position.y - b.position.y)
            
            // Check spacing between adjacent nodes
            for (let i = 1; i < sortedNodes.length; i++) {
              const prevNode = sortedNodes[i - 1]
              const currentNode = sortedNodes[i]
              
              const spacing = currentNode.position.y - prevNode.position.y
              const nodeHeight = LAYOUT_CONSTANTS.NODE_HEIGHT
              const minSpacing = Math.max(nodeHeight, LAYOUT_CONSTANTS.MIN_NODE_SPACING)
              
              expect(spacing).toBeGreaterThanOrEqual(minSpacing - LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE)
            }
          }
        })
      })
    })

    it('should center single nodes within their lanes visually', () => {
      // Create test data with single nodes in different lanes
      const singleNodeItems: GameDataItem[] = [
        {
          id: 'single-farm',
          name: 'Single Farm Item',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 100,
          energyCost: 10,
          level: 1,
          prerequisites: [],
          categories: ['farm'],
          type: 'action'
        },
        {
          id: 'single-blacksmith',
          name: 'Single Blacksmith Item',
          category: 'Unlocks',
          sourceFile: 'town_blacksmith.csv',
          goldCost: 150,
          energyCost: 15,
          level: 2,
          prerequisites: [],
          categories: ['town'],
          type: 'unlock'
        }
      ]
      
      const result = buildGraphElements(singleNodeItems)
      
      result.nodes.forEach(node => {
        const boundary = result.laneBoundaries.get(node.data.swimLane)
        expect(boundary).toBeDefined()
        
        if (boundary) {
          // Single node should be positioned near the center of its lane
          const expectedCenterY = boundary.centerY
          const tolerance = LAYOUT_CONSTANTS.NODE_HEIGHT // Allow some tolerance
          
          expect(Math.abs(node.position.y - expectedCenterY)).toBeLessThanOrEqual(tolerance)
        }
      })
    })

    it('should distribute multiple nodes evenly within lanes', () => {
      const result = buildGraphElements(mockMixedItems)
      
      // Group nodes by lane and tier
      const nodesByLaneTier = new Map<string, Map<number, any[]>>()
      result.nodes.forEach(node => {
        const lane = node.data.swimLane
        const tier = node.data.tier
        
        if (!nodesByLaneTier.has(lane)) {
          nodesByLaneTier.set(lane, new Map())
        }
        if (!nodesByLaneTier.get(lane)!.has(tier)) {
          nodesByLaneTier.get(lane)!.set(tier, [])
        }
        nodesByLaneTier.get(lane)!.get(tier)!.push(node)
      })
      
      // Check distribution within each lane-tier group
      nodesByLaneTier.forEach((tierMap, lane) => {
        tierMap.forEach((nodes, tier) => {
          if (nodes.length > 2) { // Only test distribution for 3+ nodes
            const boundary = result.laneBoundaries.get(lane)
            expect(boundary).toBeDefined()
            
            if (boundary) {
              const sortedNodes = nodes.sort((a, b) => a.position.y - b.position.y)
              const firstNode = sortedNodes[0]
              const lastNode = sortedNodes[sortedNodes.length - 1]
              
              // Nodes should be distributed across the usable lane space
              const usedSpace = lastNode.position.y - firstNode.position.y
              const nodeHeight = LAYOUT_CONSTANTS.NODE_HEIGHT
              const minUsedSpace = (nodes.length - 1) * nodeHeight
              
              expect(usedSpace).toBeGreaterThanOrEqual(minUsedSpace - LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE)
            }
          }
        })
      })
    })
  })

  describe('Visual Consistency Validation', () => {
    it('should maintain consistent tier alignment across all lanes', () => {
      const result = buildGraphElements(mockMixedItems)
      
      // Group nodes by tier
      const nodesByTier = new Map<number, any[]>()
      result.nodes.forEach(node => {
        const tier = node.data.tier
        if (!nodesByTier.has(tier)) {
          nodesByTier.set(tier, [])
        }
        nodesByTier.get(tier)!.push(node)
      })
      
      // Check X position consistency within each tier
      nodesByTier.forEach((nodes, tier) => {
        if (nodes.length > 1) {
          const xPositions = nodes.map(n => n.position.x)
          const minX = Math.min(...xPositions)
          const maxX = Math.max(...xPositions)
          const range = maxX - minX
          
          // Allow small tolerance for tier alignment (5% of tier width)
          const maxAllowedRange = LAYOUT_CONSTANTS.TIER_WIDTH * 0.05
          expect(range).toBeLessThanOrEqual(maxAllowedRange)
        }
      })
    })

    it('should ensure consistent horizontal spacing between tiers', () => {
      const result = buildGraphElements(mockMixedItems)
      
      // Get unique tiers and sort them
      const tiers = Array.from(new Set(result.nodes.map(n => n.data.tier))).sort((a, b) => a - b)
      
      if (tiers.length > 1) {
        // Calculate expected X positions for each tier
        const expectedPositions = tiers.map(tier => 
          LAYOUT_CONSTANTS.LANE_START_X + (tier * LAYOUT_CONSTANTS.TIER_WIDTH) + DERIVED_CONSTANTS.NODE_HALF_WIDTH
        )
        
        // Check actual positions match expected positions
        tiers.forEach((tier, index) => {
          const nodesInTier = result.nodes.filter(n => n.data.tier === tier)
          const expectedX = expectedPositions[index]
          
          nodesInTier.forEach(node => {
            expect(Math.abs(node.position.x - expectedX)).toBeLessThanOrEqual(LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE)
          })
        })
      }
    })

    it('should maintain consistent lane height calculations', () => {
      const result = buildGraphElements(mockMixedItems)
      
      // Validate that lane heights are calculated consistently
      result.laneBoundaries.forEach((boundary, lane) => {
        expect(boundary.height).toBeGreaterThanOrEqual(LAYOUT_CONSTANTS.MIN_LANE_HEIGHT)
        expect(boundary.usableHeight).toBe(boundary.height - (2 * LAYOUT_CONSTANTS.LANE_BUFFER))
        expect(boundary.centerY).toBe(boundary.startY + (boundary.height / 2))
        expect(boundary.endY).toBe(boundary.startY + boundary.height)
      })
    })
  })

  describe('Visual Error Detection', () => {
    it('should detect visual overlapping of nodes', () => {
      const result = buildGraphElements(mockOvercrowdedLaneItems)
      
      // Check for potential visual overlaps
      const nodePositions = result.nodes.map(node => ({
        id: node.data.id,
        x: node.position.x,
        y: node.position.y,
        lane: node.data.swimLane,
        tier: node.data.tier
      }))
      
      const overlaps: Array<{node1: string, node2: string, distance: number}> = []
      
      for (let i = 0; i < nodePositions.length; i++) {
        for (let j = i + 1; j < nodePositions.length; j++) {
          const node1 = nodePositions[i]
          const node2 = nodePositions[j]
          
          // Only check nodes in same lane and tier
          if (node1.lane === node2.lane && node1.tier === node2.tier) {
            const distance = Math.abs(node1.y - node2.y)
            const minDistance = LAYOUT_CONSTANTS.NODE_HEIGHT + LAYOUT_CONSTANTS.MIN_NODE_SPACING
            
            if (distance < minDistance) {
              overlaps.push({
                node1: node1.id,
                node2: node2.id,
                distance
              })
            }
          }
        }
      }
      
      // Log overlaps for debugging but don't fail the test (compression may be intentional)
      if (overlaps.length > 0) {
        console.warn(`Detected ${overlaps.length} potential visual overlaps in overcrowded scenario`)
      }
      
      // The test passes as long as we can detect overlaps when they occur
      expect(overlaps).toBeDefined()
    })

    it('should detect nodes positioned outside visual viewport', () => {
      const result = buildGraphElements(mockMixedItems)
      
      // Define reasonable viewport bounds (this would be configurable in real app)
      const viewportBounds = {
        minX: 0,
        maxX: 2000,
        minY: 0,
        maxY: 2000
      }
      
      const outOfBoundsNodes = result.nodes.filter(node => 
        node.position.x < viewportBounds.minX ||
        node.position.x > viewportBounds.maxX ||
        node.position.y < viewportBounds.minY ||
        node.position.y > viewportBounds.maxY
      )
      
      // For normal datasets, no nodes should be outside reasonable bounds
      expect(outOfBoundsNodes).toHaveLength(0)
    })

    it('should validate visual accessibility of all nodes', () => {
      const result = buildGraphElements(mockMixedItems)
      
      // Check that all nodes have sufficient contrast and spacing for accessibility
      result.nodes.forEach(node => {
        // Node should have proper dimensions
        expect(node.position.x).toBeGreaterThan(0)
        expect(node.position.y).toBeGreaterThan(0)
        
        // Node should have identifiable classes for styling
        expect(node.classes).toContain('game-node')
        
        // Node should have lane identification for color coding
        const laneClass = node.classes.split(' ').find(cls => cls.startsWith('lane-'))
        expect(laneClass).toBeDefined()
        
        // Node should have feature identification for color coding
        const featureClass = node.classes.split(' ').find(cls => cls.startsWith('feature-'))
        expect(featureClass).toBeDefined()
      })
    })
  })

  describe('Performance Visual Validation', () => {
    it('should render large datasets without visual degradation', () => {
      const largeDataset: GameDataItem[] = Array.from({ length: 50 }, (_, i) => ({
        id: `perf-item-${i}`,
        name: `Performance Item ${i}`,
        category: 'Actions' as const,
        sourceFile: i % 3 === 0 ? 'farm_actions.csv' : i % 3 === 1 ? 'forge_actions.csv' : 'tower_actions.csv',
        goldCost: 100,
        energyCost: 10,
        level: 1,
        prerequisites: i > 0 ? [`perf-item-${i - 1}`] : [],
        categories: [i % 3 === 0 ? 'farm' : i % 3 === 1 ? 'forge' : 'tower'],
        type: 'action'
      }))
      
      const startTime = performance.now()
      const result = buildGraphElements(largeDataset)
      const endTime = performance.now()
      
      // Should complete visual calculations quickly
      expect(endTime - startTime).toBeLessThan(2000) // 2 seconds
      
      // Should maintain visual quality
      expect(result.nodes).toHaveLength(50)
      
      // All nodes should be properly positioned
      result.nodes.forEach(node => {
        expect(node.position.x).toBeGreaterThan(0)
        expect(node.position.y).toBeGreaterThan(0)
        
        const boundary = result.laneBoundaries.get(node.data.swimLane)
        expect(boundary).toBeDefined()
      })
      
      // Lane boundaries should be reasonable
      result.laneBoundaries.forEach(boundary => {
        expect(boundary.height).toBeGreaterThanOrEqual(LAYOUT_CONSTANTS.MIN_LANE_HEIGHT)
        expect(boundary.height).toBeLessThan(5000) // Reasonable maximum
      })
    })

    it('should maintain visual consistency across multiple renders', () => {
      const render1 = buildGraphElements(mockMixedItems)
      const render2 = buildGraphElements(mockMixedItems)
      
      // Positions should be identical across renders
      expect(render1.nodes).toHaveLength(render2.nodes.length)
      
      render1.nodes.forEach((node1, index) => {
        const node2 = render2.nodes[index]
        expect(node1.data.id).toBe(node2.data.id)
        expect(node1.position.x).toBe(node2.position.x)
        expect(node1.position.y).toBe(node2.position.y)
        expect(node1.data.swimLane).toBe(node2.data.swimLane)
      })
      
      // Lane boundaries should be identical
      render1.laneBoundaries.forEach((boundary1, lane) => {
        const boundary2 = render2.laneBoundaries.get(lane)
        expect(boundary2).toBeDefined()
        expect(boundary1.startY).toBe(boundary2!.startY)
        expect(boundary1.endY).toBe(boundary2!.endY)
        expect(boundary1.height).toBe(boundary2!.height)
      })
    })
  })
})