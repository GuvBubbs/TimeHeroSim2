import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildGraphElements } from '@/utils/graphBuilder'
import { mockMixedItems } from '../fixtures/gameDataFixtures'
import type { GameDataItem } from '@/types/game-data'

// Mock console methods to avoid noise in tests
vi.mock('console', () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
}))

describe('Tier-Based Positioning Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Graph Building with Tier Integration', () => {
    it('should build graph with proper tier-based positioning', () => {
      const result = buildGraphElements(mockMixedItems)
      
      expect(result.nodes).toBeDefined()
      expect(result.edges).toBeDefined()
      expect(result.laneHeights).toBeDefined()
      expect(result.laneBoundaries).toBeDefined()
      
      // Verify nodes have tier information
      result.nodes.forEach(node => {
        expect(node.data.tier).toBeDefined()
        expect(node.data.tier).toBeGreaterThanOrEqual(0)
        expect(node.data.swimLane).toBeDefined()
        expect(node.position.x).toBeGreaterThan(0)
        expect(node.position.y).toBeGreaterThan(0)
      })
    })

    it('should maintain prerequisite left-to-right flow', () => {
      // Create items with clear prerequisite chain
      const chainItems: GameDataItem[] = [
        {
          id: 'tier-0-item',
          name: 'Tier 0 Item',
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
          id: 'tier-1-item',
          name: 'Tier 1 Item',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 200,
          energyCost: 20,
          level: 2,
          prerequisites: ['tier-0-item'],
          categories: ['farm'],
          type: 'action'
        },
        {
          id: 'tier-2-item',
          name: 'Tier 2 Item',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 300,
          energyCost: 30,
          level: 3,
          prerequisites: ['tier-1-item'],
          categories: ['farm'],
          type: 'action'
        }
      ]
      
      const result = buildGraphElements(chainItems)
      
      // Find nodes by ID
      const tier0Node = result.nodes.find(n => n.data.id === 'tier-0-item')
      const tier1Node = result.nodes.find(n => n.data.id === 'tier-1-item')
      const tier2Node = result.nodes.find(n => n.data.id === 'tier-2-item')
      
      expect(tier0Node).toBeDefined()
      expect(tier1Node).toBeDefined()
      expect(tier2Node).toBeDefined()
      
      // Verify left-to-right flow (prerequisite positioning)
      expect(tier0Node!.position.x).toBeLessThan(tier1Node!.position.x)
      expect(tier1Node!.position.x).toBeLessThan(tier2Node!.position.x)
      
      // Verify tier values
      expect(tier0Node!.data.tier).toBe(0)
      expect(tier1Node!.data.tier).toBe(1)
      expect(tier2Node!.data.tier).toBe(2)
      
      // Verify prerequisite edges are created
      const edges = result.edges.filter(e => 
        (e.data.source === 'tier-0-item' && e.data.target === 'tier-1-item') ||
        (e.data.source === 'tier-1-item' && e.data.target === 'tier-2-item')
      )
      expect(edges).toHaveLength(2)
    })

    it('should maintain lane containment with tier positioning', () => {
      // Create items in different lanes but same tier
      const sameTierItems: GameDataItem[] = [
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
          categories: ['weapon'],
          type: 'unlock'
        }
      ]
      
      const result = buildGraphElements(sameTierItems)
      
      const farmNode = result.nodes.find(n => n.data.id === 'farm-tier-0')
      const blacksmithNode = result.nodes.find(n => n.data.id === 'blacksmith-tier-0')
      
      expect(farmNode).toBeDefined()
      expect(blacksmithNode).toBeDefined()
      
      // Both should be in tier 0 (same X position)
      expect(farmNode!.data.tier).toBe(0)
      expect(blacksmithNode!.data.tier).toBe(0)
      expect(Math.abs(farmNode!.position.x - blacksmithNode!.position.x)).toBeLessThan(5) // Allow small tolerance
      
      // Should be in different lanes (different Y positions)
      expect(farmNode!.data.swimLane).toBe('Farm')
      expect(blacksmithNode!.data.swimLane).toBe('Blacksmith')
      expect(Math.abs(farmNode!.position.y - blacksmithNode!.position.y)).toBeGreaterThan(50) // Should be in different lanes
      
      // Both should be within their respective lane boundaries
      const farmBoundary = result.laneBoundaries.get('Farm')
      const blacksmithBoundary = result.laneBoundaries.get('Blacksmith')
      
      expect(farmBoundary).toBeDefined()
      expect(blacksmithBoundary).toBeDefined()
      
      if (farmBoundary && blacksmithBoundary) {
        expect(farmNode!.position.y).toBeGreaterThanOrEqual(farmBoundary.startY)
        expect(farmNode!.position.y).toBeLessThanOrEqual(farmBoundary.endY)
        
        expect(blacksmithNode!.position.y).toBeGreaterThanOrEqual(blacksmithBoundary.startY)
        expect(blacksmithNode!.position.y).toBeLessThanOrEqual(blacksmithBoundary.endY)
      }
    })

    it('should handle complex prerequisite chains across lanes', () => {
      // Create cross-lane prerequisite chain
      const crossLaneItems: GameDataItem[] = [
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
          id: 'blacksmith-depends-farm',
          name: 'Blacksmith Depends Farm',
          category: 'Unlocks',
          sourceFile: 'town_blacksmith.csv',
          goldCost: 200,
          energyCost: 20,
          level: 2,
          prerequisites: ['farm-base'], // Cross-lane dependency
          categories: ['weapon'],
          type: 'unlock'
        },
        {
          id: 'farm-advanced',
          name: 'Farm Advanced',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 300,
          energyCost: 30,
          level: 3,
          prerequisites: ['blacksmith-depends-farm'], // Back to farm lane
          categories: ['farm'],
          type: 'action'
        }
      ]
      
      const result = buildGraphElements(crossLaneItems)
      
      const farmBase = result.nodes.find(n => n.data.id === 'farm-base')
      const blacksmithDepends = result.nodes.find(n => n.data.id === 'blacksmith-depends-farm')
      const farmAdvanced = result.nodes.find(n => n.data.id === 'farm-advanced')
      
      expect(farmBase).toBeDefined()
      expect(blacksmithDepends).toBeDefined()
      expect(farmAdvanced).toBeDefined()
      
      // Verify tier progression (left-to-right flow)
      expect(farmBase!.data.tier).toBe(0)
      expect(blacksmithDepends!.data.tier).toBe(1)
      expect(farmAdvanced!.data.tier).toBe(2)
      
      expect(farmBase!.position.x).toBeLessThan(blacksmithDepends!.position.x)
      expect(blacksmithDepends!.position.x).toBeLessThan(farmAdvanced!.position.x)
      
      // Verify lane assignments
      expect(farmBase!.data.swimLane).toBe('Farm')
      expect(blacksmithDepends!.data.swimLane).toBe('Blacksmith')
      expect(farmAdvanced!.data.swimLane).toBe('Farm')
      
      // Verify prerequisite edges
      const edges = result.edges.filter(e => 
        (e.data.source === 'farm-base' && e.data.target === 'blacksmith-depends-farm') ||
        (e.data.source === 'blacksmith-depends-farm' && e.data.target === 'farm-advanced')
      )
      expect(edges).toHaveLength(2)
    })
  })

  describe('Tier Positioning Constants', () => {
    it('should use consistent tier width spacing', () => {
      const chainItems: GameDataItem[] = [
        {
          id: 'tier-0',
          name: 'Tier 0',
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
          id: 'tier-1',
          name: 'Tier 1',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 200,
          energyCost: 20,
          level: 2,
          prerequisites: ['tier-0'],
          categories: ['farm'],
          type: 'action'
        },
        {
          id: 'tier-2',
          name: 'Tier 2',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 300,
          energyCost: 30,
          level: 3,
          prerequisites: ['tier-1'],
          categories: ['farm'],
          type: 'action'
        },
        {
          id: 'tier-3',
          name: 'Tier 3',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 400,
          energyCost: 40,
          level: 4,
          prerequisites: ['tier-2'],
          categories: ['farm'],
          type: 'action'
        }
      ]
      
      const result = buildGraphElements(chainItems)
      
      const tier0Node = result.nodes.find(n => n.data.id === 'tier-0')
      const tier1Node = result.nodes.find(n => n.data.id === 'tier-1')
      const tier2Node = result.nodes.find(n => n.data.id === 'tier-2')
      const tier3Node = result.nodes.find(n => n.data.id === 'tier-3')
      
      expect(tier0Node).toBeDefined()
      expect(tier1Node).toBeDefined()
      expect(tier2Node).toBeDefined()
      expect(tier3Node).toBeDefined()
      
      // Calculate spacing between consecutive tiers
      const tier0To1Spacing = tier1Node!.position.x - tier0Node!.position.x
      const tier1To2Spacing = tier2Node!.position.x - tier1Node!.position.x
      const tier2To3Spacing = tier3Node!.position.x - tier2Node!.position.x
      
      // All tier spacings should be equal (consistent TIER_WIDTH)
      expect(Math.abs(tier1To2Spacing - tier0To1Spacing)).toBeLessThan(5) // Allow small tolerance
      expect(Math.abs(tier2To3Spacing - tier0To1Spacing)).toBeLessThan(5) // Allow small tolerance
      
      // Verify tier values are calculated correctly
      expect(tier0Node!.data.tier).toBe(0)
      expect(tier1Node!.data.tier).toBe(1)
      expect(tier2Node!.data.tier).toBe(2)
      expect(tier3Node!.data.tier).toBe(3)
      
      // Test multi-tier spacing: tier 0 to tier 3 should be 3x the single tier spacing
      const tier0To3Spacing = tier3Node!.position.x - tier0Node!.position.x
      expect(Math.abs(tier0To3Spacing - (tier0To1Spacing * 3))).toBeLessThan(10)
    })
  })
})