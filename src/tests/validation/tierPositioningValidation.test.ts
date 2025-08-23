import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  buildGraphElements,
  validatePrerequisitePositioning,
  validateTierAlignmentAcrossLanes,
  validatePrerequisiteEdgeConnections,
  validateTierBasedPositioning,
  validateTierSwimLaneIntegration
} from '@/utils/graphBuilder'
import type { GameDataItem } from '@/types/game-data'

// Mock console methods to avoid noise in tests
vi.mock('console', () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
}))

describe('Tier-Based Positioning Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Prerequisite Positioning Validation (Requirement 6.1)', () => {
    it('should validate that prerequisites are positioned to the left', () => {
      const items: GameDataItem[] = [
        {
          id: 'base-item',
          name: 'Base Item',
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
          id: 'dependent-item',
          name: 'Dependent Item',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 200,
          energyCost: 20,
          level: 2,
          prerequisites: ['base-item'],
          categories: ['farm'],
          type: 'action'
        }
      ]

      const result = buildGraphElements(items)
      const positionedNodes = result.nodes.map(node => ({
        item: node.data.fullData || { id: node.data.id, name: node.data.label } as GameDataItem,
        position: node.position,
        lane: node.data.swimLane,
        tier: node.data.tier,
        withinBounds: true
      }))

      const validation = validatePrerequisitePositioning(items, positionedNodes)
      
      expect(validation.passed).toBe(true)
      expect(validation.issues.filter(i => i.severity === 'error')).toHaveLength(0)
      
      // Verify the actual positioning
      const baseNode = result.nodes.find(n => n.data.id === 'base-item')
      const dependentNode = result.nodes.find(n => n.data.id === 'dependent-item')
      
      expect(baseNode).toBeDefined()
      expect(dependentNode).toBeDefined()
      expect(baseNode!.position.x).toBeLessThan(dependentNode!.position.x)
    })

    it('should detect prerequisite positioning violations', () => {
      const items: GameDataItem[] = [
        {
          id: 'item-1',
          name: 'Item 1',
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
          id: 'item-2',
          name: 'Item 2',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 200,
          energyCost: 20,
          level: 2,
          prerequisites: ['item-1'],
          categories: ['farm'],
          type: 'action'
        }
      ]

      // Create manually positioned nodes with violation (prerequisite to the right)
      const positionedNodes = [
        {
          item: items[0],
          position: { x: 400, y: 100 }, // item-1 to the right
          lane: 'Farm',
          tier: 0,
          withinBounds: true
        },
        {
          item: items[1],
          position: { x: 200, y: 100 }, // item-2 to the left (violation)
          lane: 'Farm',
          tier: 1,
          withinBounds: true
        }
      ]

      const validation = validatePrerequisitePositioning(items, positionedNodes)
      
      expect(validation.passed).toBe(false)
      expect(validation.issues.filter(i => i.severity === 'error')).toHaveLength(1)
      expect(validation.issues[0].message).toContain('is not to the left of')
    })
  })

  describe('Tier Alignment Across Lanes Validation (Requirement 6.2)', () => {
    it('should validate tier alignment across different lanes', () => {
      const items: GameDataItem[] = [
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
        }
      ]

      const result = buildGraphElements(items)
      const positionedNodes = result.nodes.map(node => ({
        item: node.data.fullData || { id: node.data.id, name: node.data.label } as GameDataItem,
        position: node.position,
        lane: node.data.swimLane,
        tier: node.data.tier,
        withinBounds: true
      }))

      const validation = validateTierAlignmentAcrossLanes(positionedNodes, result.laneBoundaries)
      
      expect(validation.passed).toBe(true)
      expect(validation.issues.filter(i => i.severity === 'error')).toHaveLength(0)
      
      // Verify same-tier nodes have similar X positions
      const farmTier0 = result.nodes.find(n => n.data.id === 'farm-tier-0')
      const blacksmithTier0 = result.nodes.find(n => n.data.id === 'blacksmith-tier-0')
      
      expect(farmTier0).toBeDefined()
      expect(blacksmithTier0).toBeDefined()
      expect(Math.abs(farmTier0!.position.x - blacksmithTier0!.position.x)).toBeLessThan(10)
    })

    it('should detect tier alignment violations', () => {
      const items: GameDataItem[] = [
        {
          id: 'item-1',
          name: 'Item 1',
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
          id: 'item-2',
          name: 'Item 2',
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

      const result = buildGraphElements(items)
      
      // Create manually positioned nodes with alignment violation
      const positionedNodes = [
        {
          item: items[0],
          position: { x: 200, y: 100 },
          lane: 'Farm',
          tier: 0,
          withinBounds: true
        },
        {
          item: items[1],
          position: { x: 300, y: 200 }, // Different X position for same tier
          lane: 'Blacksmith',
          tier: 0,
          withinBounds: true
        }
      ]

      const validation = validateTierAlignmentAcrossLanes(positionedNodes, result.laneBoundaries)
      
      expect(validation.issues.filter(i => i.message.includes('inconsistent X positions'))).toHaveLength(1)
    })
  })

  describe('Prerequisite Edge Connections Validation (Requirement 6.4)', () => {
    it('should validate prerequisite edge connections', () => {
      const items: GameDataItem[] = [
        {
          id: 'source-item',
          name: 'Source Item',
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
          id: 'target-item',
          name: 'Target Item',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 200,
          energyCost: 20,
          level: 2,
          prerequisites: ['source-item'],
          categories: ['farm'],
          type: 'action'
        }
      ]

      const result = buildGraphElements(items)
      const positionedNodes = result.nodes.map(node => ({
        item: node.data.fullData || { id: node.data.id, name: node.data.label } as GameDataItem,
        position: node.position,
        lane: node.data.swimLane,
        tier: node.data.tier,
        withinBounds: true
      }))

      const validation = validatePrerequisiteEdgeConnections(items, positionedNodes, result.laneBoundaries)
      
      expect(validation.passed).toBe(true)
      expect(validation.issues.filter(i => i.severity === 'error')).toHaveLength(0)
      
      // Verify edge was created
      const edge = result.edges.find(e => 
        e.data.source === 'source-item' && e.data.target === 'target-item'
      )
      expect(edge).toBeDefined()
    })

    it('should detect invalid edge directions', () => {
      const items: GameDataItem[] = [
        {
          id: 'item-1',
          name: 'Item 1',
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
          id: 'item-2',
          name: 'Item 2',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 200,
          energyCost: 20,
          level: 2,
          prerequisites: ['item-1'],
          categories: ['farm'],
          type: 'action'
        }
      ]

      // Create manually positioned nodes with invalid edge direction
      const positionedNodes = [
        {
          item: items[0],
          position: { x: 400, y: 100 }, // item-1 to the right
          lane: 'Farm',
          tier: 0,
          withinBounds: true
        },
        {
          item: items[1],
          position: { x: 200, y: 100 }, // item-2 to the left (invalid direction)
          lane: 'Farm',
          tier: 1,
          withinBounds: true
        }
      ]

      const result = buildGraphElements(items)
      const validation = validatePrerequisiteEdgeConnections(items, positionedNodes, result.laneBoundaries)
      
      expect(validation.passed).toBe(false)
      expect(validation.issues.filter(i => i.message.includes('Invalid edge direction'))).toHaveLength(1)
    })
  })

  describe('Comprehensive Tier-Based Positioning Integration', () => {
    it('should validate all tier-based positioning requirements together', () => {
      const complexItems: GameDataItem[] = [
        // Tier 0 items in different lanes
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
          id: 'blacksmith-base',
          name: 'Blacksmith Base',
          category: 'Unlocks',
          sourceFile: 'town_blacksmith.csv',
          goldCost: 100,
          energyCost: 10,
          level: 1,
          prerequisites: [],
          categories: ['weapon'],
          type: 'unlock'
        },
        // Tier 1 items with cross-lane dependencies
        {
          id: 'farm-advanced',
          name: 'Farm Advanced',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 200,
          energyCost: 20,
          level: 2,
          prerequisites: ['farm-base'],
          categories: ['farm'],
          type: 'action'
        },
        {
          id: 'blacksmith-advanced',
          name: 'Blacksmith Advanced',
          category: 'Unlocks',
          sourceFile: 'town_blacksmith.csv',
          goldCost: 200,
          energyCost: 20,
          level: 2,
          prerequisites: ['blacksmith-base', 'farm-base'], // Cross-lane dependency
          categories: ['weapon'],
          type: 'unlock'
        },
        // Tier 2 item
        {
          id: 'master-item',
          name: 'Master Item',
          category: 'Actions',
          sourceFile: 'farm_actions.csv',
          goldCost: 300,
          energyCost: 30,
          level: 3,
          prerequisites: ['farm-advanced', 'blacksmith-advanced'],
          categories: ['farm'],
          type: 'action'
        }
      ]

      const result = buildGraphElements(complexItems)
      const positionedNodes = result.nodes.map(node => ({
        item: node.data.fullData || { id: node.data.id, name: node.data.label } as GameDataItem,
        position: node.position,
        lane: node.data.swimLane,
        tier: node.data.tier,
        withinBounds: true
      }))

      const validationResults = validateTierBasedPositioning(complexItems, positionedNodes, result.laneBoundaries)
      
      // All validation tests should pass
      validationResults.forEach(validation => {
        expect(validation.passed).toBe(true)
        expect(validation.issues.filter(i => i.severity === 'error')).toHaveLength(0)
      })

      // Verify specific positioning requirements
      const farmBase = result.nodes.find(n => n.data.id === 'farm-base')
      const blacksmithBase = result.nodes.find(n => n.data.id === 'blacksmith-base')
      const farmAdvanced = result.nodes.find(n => n.data.id === 'farm-advanced')
      const blacksmithAdvanced = result.nodes.find(n => n.data.id === 'blacksmith-advanced')
      const masterItem = result.nodes.find(n => n.data.id === 'master-item')

      // Tier 0 items should be aligned horizontally
      expect(Math.abs(farmBase!.position.x - blacksmithBase!.position.x)).toBeLessThan(10)
      
      // Tier 1 items should be aligned horizontally and to the right of tier 0
      expect(Math.abs(farmAdvanced!.position.x - blacksmithAdvanced!.position.x)).toBeLessThan(10)
      expect(farmAdvanced!.position.x).toBeGreaterThan(farmBase!.position.x)
      
      // Master item should be to the right of all prerequisites
      expect(masterItem!.position.x).toBeGreaterThan(farmAdvanced!.position.x)
      expect(masterItem!.position.x).toBeGreaterThan(blacksmithAdvanced!.position.x)
      
      // All items should be within their lane boundaries
      result.nodes.forEach(node => {
        const boundary = result.laneBoundaries.get(node.data.swimLane)
        expect(boundary).toBeDefined()
        if (boundary) {
          expect(node.position.y).toBeGreaterThanOrEqual(boundary.startY)
          expect(node.position.y).toBeLessThanOrEqual(boundary.endY)
        }
      })
    })

    it('should validate tier-swimlane integration specifically', () => {
      const items: GameDataItem[] = [
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
        }
      ]

      const result = buildGraphElements(items)
      const positionedNodes = result.nodes.map(node => ({
        item: node.data.fullData || { id: node.data.id, name: node.data.label } as GameDataItem,
        position: node.position,
        lane: node.data.swimLane,
        tier: node.data.tier,
        withinBounds: true
      }))

      const validation = validateTierSwimLaneIntegration(items, positionedNodes, result.laneBoundaries)
      
      expect(validation.passed).toBe(true)
      expect(validation.issues.filter(i => i.severity === 'error')).toHaveLength(0)
      
      // Verify specific integration metrics
      expect(validation.metrics?.totalTiers).toBeGreaterThan(0)
      expect(validation.metrics?.boundaryViolations).toBe(0)
      expect(validation.metrics?.tierRelationshipViolations).toBe(0)
      expect(validation.metrics?.positioningViolations).toBe(0)
    })
  })
})