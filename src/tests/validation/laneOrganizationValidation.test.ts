import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildGraphElements, LAYOUT_CONSTANTS } from '@/utils/graphBuilder'
import { mockFarmItems, mockBlacksmithItems, mockMixedItems, mockOvercrowdedLaneItems } from '../fixtures/gameDataFixtures'
import type { GameDataItem } from '@/types/game-data'

// Mock console methods
vi.mock('console', () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
}))

describe('Lane Organization Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Lane Structure Validation', () => {
    it('should organize all 14 defined swim lanes correctly', () => {
      const allLaneItems: GameDataItem[] = [
        // Farm
        { id: 'farm-1', name: 'Farm Item', category: 'Actions', sourceFile: 'farm_actions.csv', goldCost: 100, energyCost: 10, level: 1, prerequisites: [], categories: ['farm'], type: 'action' },
        // Town vendors
        { id: 'blacksmith-1', name: 'Blacksmith Item', category: 'Unlocks', sourceFile: 'town_blacksmith.csv', goldCost: 100, energyCost: 10, level: 1, prerequisites: [], categories: ['town'], type: 'unlock' },
        { id: 'agronomist-1', name: 'Agronomist Item', category: 'Unlocks', sourceFile: 'town_agronomist.csv', goldCost: 100, energyCost: 10, level: 1, prerequisites: [], categories: ['town'], type: 'unlock' },
        { id: 'carpenter-1', name: 'Carpenter Item', category: 'Unlocks', sourceFile: 'town_carpenter.csv', goldCost: 100, energyCost: 10, level: 1, prerequisites: [], categories: ['town'], type: 'unlock' },
        { id: 'land-steward-1', name: 'Land Steward Item', category: 'Unlocks', sourceFile: 'town_land_steward.csv', goldCost: 100, energyCost: 10, level: 1, prerequisites: [], categories: ['town'], type: 'unlock' },
        { id: 'material-trader-1', name: 'Material Trader Item', category: 'Actions', sourceFile: 'town_material_trader.csv', goldCost: 100, energyCost: 10, level: 1, prerequisites: [], categories: ['town'], type: 'action' },
        { id: 'skills-trainer-1', name: 'Skills Trainer Item', category: 'Unlocks', sourceFile: 'town_skills_trainer.csv', goldCost: 100, energyCost: 10, level: 1, prerequisites: [], categories: ['town'], type: 'unlock' },
        // Game features
        { id: 'forge-1', name: 'Forge Item', category: 'Actions', sourceFile: 'forge_actions.csv', goldCost: 100, energyCost: 10, level: 1, prerequisites: [], categories: ['forge'], type: 'action' },
        { id: 'tower-1', name: 'Tower Item', category: 'Actions', sourceFile: 'tower_actions.csv', goldCost: 100, energyCost: 10, level: 1, prerequisites: [], categories: ['tower'], type: 'action' },
        // General fallback
        { id: 'general-1', name: 'General Item', category: 'Actions', sourceFile: 'unknown.csv', goldCost: 100, energyCost: 10, level: 1, prerequisites: [], categories: [], type: 'action' }
      ]
      
      const result = buildGraphElements(allLaneItems)
      
      // Verify lane organization
      const expectedLanes = ['Farm', 'Blacksmith', 'Agronomist', 'Carpenter', 'Land Steward', 'Material Trader', 'Skills Trainer', 'Forge', 'Tower', 'General']
      const actualLanes = new Set(result.nodes.map(node => node.data.swimLane))
      
      expectedLanes.forEach(lane => {
        expect(actualLanes.has(lane)).toBe(true)
      })
      
      // Verify lane boundaries exist for all used lanes
      expectedLanes.forEach(lane => {
        expect(result.laneBoundaries.has(lane)).toBe(true)
      })
    })

    it('should maintain consistent lane ordering', () => {
      const result = buildGraphElements(mockMixedItems)
      
      // Get all lane boundaries and sort by startY
      const sortedBoundaries = Array.from(result.laneBoundaries.values())
        .sort((a, b) => a.startY - b.startY)
      
      // Verify lanes are in expected order (Farm should be first, etc.)
      const expectedOrder = ['Farm', 'Vendors', 'Blacksmith', 'Agronomist', 'Carpenter', 'Land Steward', 'Material Trader', 'Skills Trainer', 'Adventure', 'Combat', 'Forge', 'Mining', 'Tower', 'General']
      
      // Check that used lanes appear in correct relative order
      const usedLanes = sortedBoundaries.map(b => b.lane)
      const usedLaneIndices = usedLanes.map(lane => expectedOrder.indexOf(lane))
      
      // Indices should be in ascending order
      for (let i = 1; i < usedLaneIndices.length; i++) {
        expect(usedLaneIndices[i]).toBeGreaterThan(usedLaneIndices[i - 1])
      }
    })

    it('should create proper lane boundaries with correct spacing', () => {
      const result = buildGraphElements(mockMixedItems)
      
      const sortedBoundaries = Array.from(result.laneBoundaries.values())
        .sort((a, b) => a.startY - b.startY)
      
      // First lane should start with proper padding
      expect(sortedBoundaries[0].startY).toBe(LAYOUT_CONSTANTS.LANE_PADDING)
      
      // Check spacing between adjacent lanes
      for (let i = 1; i < sortedBoundaries.length; i++) {
        const prevBoundary = sortedBoundaries[i - 1]
        const currentBoundary = sortedBoundaries[i]
        
        const gap = currentBoundary.startY - prevBoundary.endY
        expect(gap).toBe(LAYOUT_CONSTANTS.LANE_PADDING)
      }
      
      // Each boundary should have correct internal structure
      sortedBoundaries.forEach(boundary => {
        expect(boundary.height).toBeGreaterThanOrEqual(LAYOUT_CONSTANTS.MIN_LANE_HEIGHT)
        expect(boundary.usableHeight).toBe(boundary.height - (2 * LAYOUT_CONSTANTS.LANE_BUFFER))
        expect(boundary.centerY).toBe(boundary.startY + (boundary.height / 2))
        expect(boundary.endY).toBe(boundary.startY + boundary.height)
      })
    })

    it('should handle empty lanes appropriately', () => {
      // Create dataset that only uses a few lanes
      const sparseDataset: GameDataItem[] = [
        {
          id: 'farm-only',
          name: 'Farm Only Item',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 100,
          energyCost: 10,
          level: 1,
          prerequisites: [],
          categories: ['farm'],
          type: 'action'
        }
      ]
      
      const result = buildGraphElements(sparseDataset)
      
      // Should only create boundaries for used lanes
      expect(result.laneBoundaries.has('Farm')).toBe(true)
      expect(result.laneBoundaries.size).toBeGreaterThanOrEqual(1)
      
      // Farm lane should have appropriate height even with single item
      const farmBoundary = result.laneBoundaries.get('Farm')
      expect(farmBoundary).toBeDefined()
      expect(farmBoundary!.height).toBeGreaterThanOrEqual(LAYOUT_CONSTANTS.MIN_LANE_HEIGHT)
    })
  })

  describe('Lane Content Organization', () => {
    it('should distribute nodes correctly within lanes', () => {
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
      
      // Verify each lane contains only its assigned nodes
      nodesByLane.forEach((nodes, lane) => {
        const boundary = result.laneBoundaries.get(lane)
        expect(boundary).toBeDefined()
        
        nodes.forEach(node => {
          expect(node.data.swimLane).toBe(lane)
          
          // Node should be within lane boundaries
          const nodeHalfHeight = LAYOUT_CONSTANTS.NODE_HEIGHT / 2
          const minY = boundary!.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
          const maxY = boundary!.endY - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
          
          expect(node.position.y).toBeGreaterThanOrEqual(minY - LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE)
          expect(node.position.y).toBeLessThanOrEqual(maxY + LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE)
        })
      })
    })

    it('should organize nodes by tiers within lanes', () => {
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
      
      // Verify tier organization within each lane
      nodesByLaneTier.forEach((tierMap, lane) => {
        tierMap.forEach((nodes, tier) => {
          // All nodes in same tier should have similar X positions
          if (nodes.length > 1) {
            const xPositions = nodes.map(n => n.position.x)
            const minX = Math.min(...xPositions)
            const maxX = Math.max(...xPositions)
            const range = maxX - minX
            
            // Allow small tolerance for tier alignment
            expect(range).toBeLessThanOrEqual(LAYOUT_CONSTANTS.TIER_WIDTH * 0.1)
          }
          
          // All nodes should have correct tier assignment
          nodes.forEach(node => {
            expect(node.data.tier).toBe(tier)
          })
        })
      })
    })

    it('should handle overcrowded lanes with proper organization', () => {
      const result = buildGraphElements(mockOvercrowdedLaneItems)
      
      // All items should be in Farm lane
      result.nodes.forEach(node => {
        expect(node.data.swimLane).toBe('Farm')
      })
      
      const farmBoundary = result.laneBoundaries.get('Farm')
      expect(farmBoundary).toBeDefined()
      
      // Lane should be tall enough to accommodate all nodes
      const nodeCount = result.nodes.length
      const minRequiredHeight = nodeCount * LAYOUT_CONSTANTS.NODE_HEIGHT
      
      expect(farmBoundary!.height).toBeGreaterThanOrEqual(minRequiredHeight)
      
      // All nodes should be within the expanded lane
      result.nodes.forEach(node => {
        const nodeHalfHeight = LAYOUT_CONSTANTS.NODE_HEIGHT / 2
        const minY = farmBoundary!.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
        const maxY = farmBoundary!.endY - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
        
        expect(node.position.y).toBeGreaterThanOrEqual(minY - LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE)
        expect(node.position.y).toBeLessThanOrEqual(maxY + LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE)
      })
    })
  })

  describe('Lane Height Calculation', () => {
    it('should calculate lane heights based on content', () => {
      const result = buildGraphElements(mockMixedItems)
      
      // Group nodes by lane to count content
      const nodesByLane = new Map<string, any[]>()
      result.nodes.forEach(node => {
        const lane = node.data.swimLane
        if (!nodesByLane.has(lane)) {
          nodesByLane.set(lane, [])
        }
        nodesByLane.get(lane)!.push(node)
      })
      
      // Verify lane heights match content
      nodesByLane.forEach((nodes, lane) => {
        const boundary = result.laneBoundaries.get(lane)
        expect(boundary).toBeDefined()
        
        // Group nodes by tier within this lane
        const nodesByTier = new Map<number, any[]>()
        nodes.forEach(node => {
          const tier = node.data.tier
          if (!nodesByTier.has(tier)) {
            nodesByTier.set(tier, [])
          }
          nodesByTier.get(tier)!.push(node)
        })
        
        // Find tier with maximum nodes
        let maxNodesInTier = 0
        nodesByTier.forEach((tierNodes) => {
          maxNodesInTier = Math.max(maxNodesInTier, tierNodes.length)
        })
        
        // Lane height should accommodate the maximum nodes in any tier
        const minRequiredHeight = Math.max(
          LAYOUT_CONSTANTS.MIN_LANE_HEIGHT,
          maxNodesInTier * LAYOUT_CONSTANTS.NODE_HEIGHT + (2 * LAYOUT_CONSTANTS.LANE_BUFFER)
        )
        
        expect(boundary!.height).toBeGreaterThanOrEqual(minRequiredHeight)
      })
    })

    it('should use minimum height for empty or single-node lanes', () => {
      const singleNodeDataset: GameDataItem[] = [
        {
          id: 'single-item',
          name: 'Single Item',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 100,
          energyCost: 10,
          level: 1,
          prerequisites: [],
          categories: ['farm'],
          type: 'action'
        }
      ]
      
      const result = buildGraphElements(singleNodeDataset)
      
      const farmBoundary = result.laneBoundaries.get('Farm')
      expect(farmBoundary).toBeDefined()
      
      // Single node lane should use minimum height or calculated height, whichever is larger
      expect(farmBoundary!.height).toBeGreaterThanOrEqual(LAYOUT_CONSTANTS.MIN_LANE_HEIGHT)
    })

    it('should scale lane heights appropriately for large content', () => {
      // Create dataset with many nodes in same tier
      const manyNodesDataset: GameDataItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `many-${i}`,
        name: `Many Item ${i}`,
        category: 'Actions' as const,
        sourceFile: 'farm_actions.csv',
        goldCost: 100,
        energyCost: 10,
        level: 1,
        prerequisites: [], // All in same tier
        categories: ['farm'],
        type: 'action'
      }))
      
      const result = buildGraphElements(manyNodesDataset)
      
      const farmBoundary = result.laneBoundaries.get('Farm')
      expect(farmBoundary).toBeDefined()
      
      // Lane should be tall enough for 20 nodes
      const minRequiredHeight = 20 * LAYOUT_CONSTANTS.NODE_HEIGHT + (2 * LAYOUT_CONSTANTS.LANE_BUFFER)
      expect(farmBoundary!.height).toBeGreaterThanOrEqual(minRequiredHeight)
      
      // All nodes should fit within the calculated boundary
      result.nodes.forEach(node => {
        const nodeHalfHeight = LAYOUT_CONSTANTS.NODE_HEIGHT / 2
        const minY = farmBoundary!.startY + LAYOUT_CONSTANTS.LANE_BUFFER + nodeHalfHeight
        const maxY = farmBoundary!.endY - LAYOUT_CONSTANTS.LANE_BUFFER - nodeHalfHeight
        
        expect(node.position.y).toBeGreaterThanOrEqual(minY - LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE)
        expect(node.position.y).toBeLessThanOrEqual(maxY + LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE)
      })
    })
  })

  describe('Cross-Lane Organization', () => {
    it('should maintain consistent tier alignment across different lanes', () => {
      const crossLaneDataset: GameDataItem[] = [
        {
          id: 'farm-tier-0',
          name: 'Farm Tier 0',
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
          id: 'blacksmith-tier-0',
          name: 'Blacksmith Tier 0',
          category: 'Unlocks',
          sourceFile: 'town_blacksmith.csv',
          goldCost: 100,
          energyCost: 10,
          level: 1,
          prerequisites: [],
          categories: ['town'],
          type: 'unlock'
        },
        {
          id: 'farm-tier-1',
          name: 'Farm Tier 1',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 200,
          energyCost: 20,
          level: 2,
          prerequisites: ['farm-tier-0'],
          categories: ['farm'],
          type: 'action'
        },
        {
          id: 'blacksmith-tier-1',
          name: 'Blacksmith Tier 1',
          category: 'Unlocks',
          sourceFile: 'town_blacksmith.csv',
          goldCost: 200,
          energyCost: 20,
          level: 2,
          prerequisites: ['blacksmith-tier-0'],
          categories: ['town'],
          type: 'unlock'
        }
      ]
      
      const result = buildGraphElements(crossLaneDataset)
      
      // Group nodes by tier
      const nodesByTier = new Map<number, any[]>()
      result.nodes.forEach(node => {
        const tier = node.data.tier
        if (!nodesByTier.has(tier)) {
          nodesByTier.set(tier, [])
        }
        nodesByTier.get(tier)!.push(node)
      })
      
      // Check tier alignment
      nodesByTier.forEach((nodes, tier) => {
        if (nodes.length > 1) {
          const xPositions = nodes.map(n => n.position.x)
          const minX = Math.min(...xPositions)
          const maxX = Math.max(...xPositions)
          const range = maxX - minX
          
          // Nodes in same tier should have very similar X positions
          expect(range).toBeLessThanOrEqual(LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE * 2)
        }
      })
    })

    it('should handle prerequisite relationships across lanes', () => {
      const crossLanePrereqDataset: GameDataItem[] = [
        {
          id: 'farm-base',
          name: 'Farm Base',
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
          id: 'blacksmith-depends-on-farm',
          name: 'Blacksmith Depends on Farm',
          category: 'Unlocks',
          sourceFile: 'town_blacksmith.csv',
          goldCost: 200,
          energyCost: 20,
          level: 2,
          prerequisites: ['farm-base'], // Cross-lane dependency
          categories: ['town'],
          type: 'unlock'
        }
      ]
      
      const result = buildGraphElements(crossLanePrereqDataset)
      
      const farmNode = result.nodes.find(n => n.data.id === 'farm-base')
      const blacksmithNode = result.nodes.find(n => n.data.id === 'blacksmith-depends-on-farm')
      
      expect(farmNode).toBeDefined()
      expect(blacksmithNode).toBeDefined()
      
      // Farm node should be in earlier tier
      expect(farmNode!.data.tier).toBeLessThan(blacksmithNode!.data.tier)
      
      // Farm node should be positioned to the left
      expect(farmNode!.position.x).toBeLessThan(blacksmithNode!.position.x)
      
      // Should be in different lanes
      expect(farmNode!.data.swimLane).toBe('Farm')
      expect(blacksmithNode!.data.swimLane).toBe('Blacksmith')
    })

    it('should maintain lane separation with proper spacing', () => {
      const result = buildGraphElements(mockMixedItems)
      
      // Get all unique Y positions from nodes
      const allYPositions = result.nodes.map(n => n.position.y).sort((a, b) => a - b)
      
      // Group nodes by lane
      const nodesByLane = new Map<string, any[]>()
      result.nodes.forEach(node => {
        const lane = node.data.swimLane
        if (!nodesByLane.has(lane)) {
          nodesByLane.set(lane, [])
        }
        nodesByLane.get(lane)!.push(node)
      })
      
      // Check that nodes from different lanes don't overlap
      const laneRanges = new Map<string, {minY: number, maxY: number}>()
      nodesByLane.forEach((nodes, lane) => {
        const yPositions = nodes.map(n => n.position.y)
        laneRanges.set(lane, {
          minY: Math.min(...yPositions) - LAYOUT_CONSTANTS.NODE_HEIGHT / 2,
          maxY: Math.max(...yPositions) + LAYOUT_CONSTANTS.NODE_HEIGHT / 2
        })
      })
      
      // Check for overlaps between different lanes
      const laneNames = Array.from(laneRanges.keys())
      for (let i = 0; i < laneNames.length; i++) {
        for (let j = i + 1; j < laneNames.length; j++) {
          const range1 = laneRanges.get(laneNames[i])!
          const range2 = laneRanges.get(laneNames[j])!
          
          // Ranges should not overlap (with small tolerance)
          const overlap = Math.max(0, Math.min(range1.maxY, range2.maxY) - Math.max(range1.minY, range2.minY))
          expect(overlap).toBeLessThanOrEqual(LAYOUT_CONSTANTS.BOUNDARY_TOLERANCE)
        }
      }
    })
  })

  describe('Lane Organization Error Handling', () => {
    it('should handle items with invalid lane assignments gracefully', () => {
      const invalidItems: GameDataItem[] = [
        {
          id: 'invalid-source',
          name: 'Invalid Source',
          category: 'Actions',
          sourceFile: '', // Empty source file
          goldCost: 100,
          energyCost: 10,
          level: 1,
          prerequisites: [],
          categories: [],
          type: 'action'
        },
        {
          id: 'malformed-source',
          name: 'Malformed Source',
          category: 'Actions',
          sourceFile: 'malformed_file_name_without_extension',
          goldCost: 100,
          energyCost: 10,
          level: 1,
          prerequisites: [],
          categories: [],
          type: 'action'
        }
      ]
      
      const result = buildGraphElements(invalidItems)
      
      // Should fallback to General lane
      result.nodes.forEach(node => {
        expect(node.data.swimLane).toBe('General')
      })
      
      // Should create proper boundary for General lane
      expect(result.laneBoundaries.has('General')).toBe(true)
      const generalBoundary = result.laneBoundaries.get('General')
      expect(generalBoundary!.height).toBeGreaterThanOrEqual(LAYOUT_CONSTANTS.MIN_LANE_HEIGHT)
    })

    it('should handle circular dependencies in lane organization', () => {
      const circularItems: GameDataItem[] = [
        {
          id: 'circular-a',
          name: 'Circular A',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 100,
          energyCost: 10,
          level: 1,
          prerequisites: ['circular-b'],
          categories: ['farm'],
          type: 'action'
        },
        {
          id: 'circular-b',
          name: 'Circular B',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 100,
          energyCost: 10,
          level: 1,
          prerequisites: ['circular-a'],
          categories: ['farm'],
          type: 'action'
        }
      ]
      
      expect(() => buildGraphElements(circularItems)).not.toThrow()
      
      const result = buildGraphElements(circularItems)
      
      // Both should be in Farm lane
      result.nodes.forEach(node => {
        expect(node.data.swimLane).toBe('Farm')
      })
      
      // Should create proper organization despite circular dependency
      expect(result.nodes).toHaveLength(2)
      expect(result.laneBoundaries.has('Farm')).toBe(true)
    })

    it('should maintain organization consistency under stress', () => {
      // Create a complex dataset with many edge cases
      const stressDataset: GameDataItem[] = []
      
      // Add items with various edge cases
      for (let i = 0; i < 50; i++) {
        stressDataset.push({
          id: `stress-${i}`,
          name: `Stress Item ${i}`,
          category: i % 2 === 0 ? 'Actions' : 'Unlocks',
          sourceFile: i % 10 === 0 ? '' : `source-${i % 5}.csv`,
          goldCost: 100 + i,
          energyCost: 10 + i,
          level: Math.floor(i / 10) + 1,
          prerequisites: i > 0 && i % 7 !== 0 ? [`stress-${Math.max(0, i - 3)}`] : [],
          categories: [`category-${i % 3}`],
          type: 'action'
        })
      }
      
      const result = buildGraphElements(stressDataset)
      
      // Should handle all items
      expect(result.nodes).toHaveLength(50)
      
      // Should create reasonable lane organization
      expect(result.laneBoundaries.size).toBeGreaterThan(0)
      
      // All nodes should be properly positioned
      result.nodes.forEach(node => {
        expect(node.position.x).toBeGreaterThan(0)
        expect(node.position.y).toBeGreaterThan(0)
        expect(node.data.swimLane).toBeDefined()
        
        const boundary = result.laneBoundaries.get(node.data.swimLane)
        expect(boundary).toBeDefined()
      })
    })
  })
})