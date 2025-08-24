import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildGraphElements } from '@/utils/graphBuilder'
import { mockFarmItems, mockBlacksmithItems, mockMixedItems } from '../fixtures/gameDataFixtures'
import type { GameDataItem } from '@/types/game-data'

// Mock console methods
vi.mock('console', () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
}))

describe('Swimlane Assignment Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('determineSwimLane Logic', () => {
    it('should assign farm items to Farm lane', () => {
      const result = buildGraphElements(mockFarmItems)
      
      result.nodes.forEach(node => {
        expect(node.data.swimLane).toBe('Farm')
        expect(node.classes).toContain('lane-farm')
        expect(node.classes).toContain('feature-farm')
      })
    })

    it('should assign blacksmith items to Blacksmith lane', () => {
      const result = buildGraphElements(mockBlacksmithItems)
      
      result.nodes.forEach(node => {
        expect(node.data.swimLane).toBe('Blacksmith')
        expect(node.classes).toContain('lane-blacksmith')
        expect(node.classes).toContain('feature-town')
      })
    })

    it('should handle town vendor file mapping correctly', () => {
      const townVendorItems: GameDataItem[] = [
        {
          id: 'agronomist-item',
          name: 'Agronomist Item',
          category: 'Unlocks',
          sourceFile: 'town_agronomist.csv',
          goldCost: 100,
          energyCost: 10,
          level: 1,
          prerequisites: [],
          categories: ['town'],
          type: 'unlock'
        },
        {
          id: 'carpenter-item',
          name: 'Carpenter Item',
          category: 'Unlocks',
          sourceFile: 'town_carpenter.csv',
          goldCost: 150,
          energyCost: 15,
          level: 2,
          prerequisites: [],
          categories: ['town'],
          type: 'unlock'
        },
        {
          id: 'land-steward-item',
          name: 'Land Steward Item',
          category: 'Unlocks',
          sourceFile: 'town_land_steward.csv',
          goldCost: 200,
          energyCost: 20,
          level: 3,
          prerequisites: [],
          categories: ['town'],
          type: 'unlock'
        }
      ]
      
      const result = buildGraphElements(townVendorItems)
      
      expect(result.nodes[0].data.swimLane).toBe('Agronomist')
      expect(result.nodes[1].data.swimLane).toBe('Carpenter')
      expect(result.nodes[2].data.swimLane).toBe('Land Steward')
    })

    it('should handle game feature mapping from source files', () => {
      const gameFeatureItems: GameDataItem[] = [
        {
          id: 'forge-item',
          name: 'Forge Item',
          category: 'Actions',
          sourceFile: 'forge_actions.csv',
          goldCost: 100,
          energyCost: 10,
          level: 1,
          prerequisites: [],
          categories: ['forge'],
          type: 'action'
        },
        {
          id: 'tower-item',
          name: 'Tower Item',
          category: 'Actions',
          sourceFile: 'tower_actions.csv',
          goldCost: 150,
          energyCost: 15,
          level: 2,
          prerequisites: [],
          categories: ['tower'],
          type: 'action'
        },
        {
          id: 'adventure-item',
          name: 'Adventure Item',
          category: 'Data',
          sourceFile: 'adventures.csv',
          goldCost: 200,
          energyCost: 20,
          level: 3,
          prerequisites: [],
          categories: ['adventure'],
          type: 'adventure'
        }
      ]
      
      const result = buildGraphElements(gameFeatureItems)
      
      // Only Actions/Unlocks should be in the tree
      expect(result.nodes).toHaveLength(2)
      expect(result.nodes[0].data.swimLane).toBe('Forge')
      expect(result.nodes[1].data.swimLane).toBe('Tower')
    })

    it('should use fallback logic for unrecognized items', () => {
      const unknownItems: GameDataItem[] = [
        {
          id: 'unknown-item',
          name: 'Unknown Item',
          category: 'Actions',
          sourceFile: 'unknown_file.csv',
          goldCost: 100,
          energyCost: 10,
          level: 1,
          prerequisites: [],
          categories: ['unknown'],
          type: 'unknown'
        }
      ]
      
      const result = buildGraphElements(unknownItems)
      
      expect(result.nodes[0].data.swimLane).toBe('General')
      expect(result.nodes[0].classes).toContain('lane-general')
    })

    it('should provide consistent assignment for same input data', () => {
      const result1 = buildGraphElements(mockMixedItems)
      const result2 = buildGraphElements(mockMixedItems)
      
      expect(result1.nodes).toHaveLength(result2.nodes.length)
      
      result1.nodes.forEach((node1, index) => {
        const node2 = result2.nodes[index]
        expect(node1.data.swimLane).toBe(node2.data.swimLane)
        expect(node1.data.id).toBe(node2.data.id)
      })
    })

    it('should handle edge cases in source file parsing', () => {
      const edgeCaseItems: GameDataItem[] = [
        {
          id: 'no-source-file',
          name: 'No Source File',
          category: 'Actions',
          sourceFile: '',
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
          sourceFile: 'malformed_file_name',
          goldCost: 100,
          energyCost: 10,
          level: 1,
          prerequisites: [],
          categories: [],
          type: 'action'
        }
      ]
      
      const result = buildGraphElements(edgeCaseItems)
      
      // Should fallback to General lane
      result.nodes.forEach(node => {
        expect(node.data.swimLane).toBe('General')
      })
    })
  })

  describe('Assignment Validation and Logging', () => {
    it('should validate assignment consistency across multiple builds', () => {
      const assignments1 = new Map<string, string>()
      const assignments2 = new Map<string, string>()
      
      const result1 = buildGraphElements(mockMixedItems)
      result1.nodes.forEach(node => {
        assignments1.set(node.data.id, node.data.swimLane)
      })
      
      const result2 = buildGraphElements(mockMixedItems)
      result2.nodes.forEach(node => {
        assignments2.set(node.data.id, node.data.swimLane)
      })
      
      // Assignments should be identical
      assignments1.forEach((lane, itemId) => {
        expect(assignments2.get(itemId)).toBe(lane)
      })
    })

    it('should provide assignment statistics', () => {
      const result = buildGraphElements(mockMixedItems)
      
      // Count assignments per lane
      const laneStats = new Map<string, number>()
      result.nodes.forEach(node => {
        const lane = node.data.swimLane
        laneStats.set(lane, (laneStats.get(lane) || 0) + 1)
      })
      
      expect(laneStats.size).toBeGreaterThan(0)
      
      // Should have at least Farm and Blacksmith lanes
      expect(laneStats.has('Farm')).toBe(true)
      expect(laneStats.has('Blacksmith')).toBe(true)
      
      // Total should match node count
      const totalAssigned = Array.from(laneStats.values()).reduce((sum, count) => sum + count, 0)
      expect(totalAssigned).toBe(result.nodes.length)
    })

    it('should handle all 14 defined swim lanes', () => {
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
      
      const expectedLanes = ['Farm', 'Blacksmith', 'Agronomist', 'Carpenter', 'Land Steward', 'Material Trader', 'Skills Trainer', 'Forge', 'Tower', 'General']
      const actualLanes = new Set(result.nodes.map(node => node.data.swimLane))
      
      expectedLanes.forEach(lane => {
        expect(actualLanes.has(lane)).toBe(true)
      })
    })
  })

  describe('Feature-Based Node Coloring', () => {
    it('should apply correct feature classes to nodes', () => {
      const result = buildGraphElements(mockMixedItems)
      
      result.nodes.forEach(node => {
        // Should have feature-based class
        const featureClass = node.classes.split(' ').find(cls => cls.startsWith('feature-'))
        expect(featureClass).toBeDefined()
        
        // Should have lane-based class
        const laneClass = node.classes.split(' ').find(cls => cls.startsWith('lane-'))
        expect(laneClass).toBeDefined()
        
        // Should have category-based class
        const categoryClass = node.classes.split(' ').find(cls => cls.startsWith('category-'))
        expect(categoryClass).toBeDefined()
      })
    })

    it('should distinguish between different game systems with colors', () => {
      const farmResult = buildGraphElements(mockFarmItems)
      const blacksmithResult = buildGraphElements(mockBlacksmithItems)
      
      // Farm items should have farm feature class
      farmResult.nodes.forEach(node => {
        expect(node.classes).toContain('feature-farm')
        expect(node.classes).toContain('lane-farm')
      })
      
      // Blacksmith items should have town feature class
      blacksmithResult.nodes.forEach(node => {
        expect(node.classes).toContain('feature-town')
        expect(node.classes).toContain('lane-blacksmith')
      })
    })

    it('should apply consistent color scheme across all nodes', () => {
      const result = buildGraphElements(mockMixedItems)
      
      // Group nodes by feature
      const featureGroups = new Map<string, any[]>()
      result.nodes.forEach(node => {
        const featureClass = node.classes.split(' ').find(cls => cls.startsWith('feature-'))
        if (featureClass) {
          const feature = featureClass.replace('feature-', '')
          if (!featureGroups.has(feature)) {
            featureGroups.set(feature, [])
          }
          featureGroups.get(feature)!.push(node)
        }
      })
      
      // All nodes in same feature group should have same feature class
      featureGroups.forEach((nodes, feature) => {
        nodes.forEach(node => {
          expect(node.classes).toContain(`feature-${feature}`)
        })
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle items with missing or invalid data', () => {
      const invalidItems: GameDataItem[] = [
        {
          id: '',
          name: '',
          category: 'Actions',
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
      expect(result.nodes[0].data.swimLane).toBe('General')
    })

    it('should handle items with circular dependencies in assignment', () => {
      const circularItems: GameDataItem[] = [
        {
          id: 'item-a',
          name: 'Item A',
          category: 'Actions',
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
          category: 'Actions',
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
      
      // Both should be assigned to Farm lane regardless of circular dependency
      result.nodes.forEach(node => {
        expect(node.data.swimLane).toBe('Farm')
      })
    })

    it('should handle large numbers of items efficiently', () => {
      const largeItemSet: GameDataItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: `large-item-${i}`,
        name: `Large Item ${i}`,
        category: 'Actions' as const,
        sourceFile: i % 2 === 0 ? 'farm_actions.csv' : 'forge_actions.csv',
        goldCost: 100,
        energyCost: 10,
        level: 1,
        prerequisites: [],
        categories: [i % 2 === 0 ? 'farm' : 'forge'],
        type: 'action'
      }))
      
      const startTime = performance.now()
      const result = buildGraphElements(largeItemSet)
      const endTime = performance.now()
      
      expect(result.nodes).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
      
      // Should have correct lane distribution
      const farmNodes = result.nodes.filter(node => node.data.swimLane === 'Farm')
      const forgeNodes = result.nodes.filter(node => node.data.swimLane === 'Forge')
      
      expect(farmNodes).toHaveLength(50)
      expect(forgeNodes).toHaveLength(50)
    })
  })
})