import type { GameDataItem } from '@/types/game-data'

/**
 * Test fixtures for game data items
 */

export const createMockGameDataItem = (overrides: Partial<GameDataItem> = {}): GameDataItem => ({
  id: 'test-item-1',
  name: 'Test Item',
  category: 'Actions',
  sourceFile: 'farm_actions.csv',
  goldCost: 100,
  energyCost: 10,
  level: 1,
  prerequisites: [],
  categories: ['farm'],
  type: 'action',
  ...overrides
})

export const mockFarmItems: GameDataItem[] = [
  createMockGameDataItem({
    id: 'plant-wheat',
    name: 'Plant Wheat',
    sourceFile: 'farm_actions.csv',
    prerequisites: []
  }),
  createMockGameDataItem({
    id: 'harvest-wheat',
    name: 'Harvest Wheat',
    sourceFile: 'farm_actions.csv',
    prerequisites: ['plant-wheat']
  }),
  createMockGameDataItem({
    id: 'advanced-farming',
    name: 'Advanced Farming',
    sourceFile: 'farm_actions.csv',
    prerequisites: ['harvest-wheat']
  })
]

export const mockBlacksmithItems: GameDataItem[] = [
  createMockGameDataItem({
    id: 'iron-sword',
    name: 'Iron Sword',
    sourceFile: 'town_blacksmith.csv',
    prerequisites: []
  }),
  createMockGameDataItem({
    id: 'steel-sword',
    name: 'Steel Sword',
    sourceFile: 'town_blacksmith.csv',
    prerequisites: ['iron-sword']
  })
]

export const mockMixedItems: GameDataItem[] = [
  ...mockFarmItems,
  ...mockBlacksmithItems,
  createMockGameDataItem({
    id: 'adventure-route-1',
    name: 'Forest Path',
    sourceFile: 'adventures.csv',
    category: 'Data',
    prerequisites: []
  }),
  createMockGameDataItem({
    id: 'tower-defense',
    name: 'Tower Defense',
    sourceFile: 'tower_actions.csv',
    prerequisites: ['iron-sword']
  })
]

export const mockOvercrowdedLaneItems: GameDataItem[] = [
  // Create 10 items in the same lane and tier to test overcrowding
  ...Array.from({ length: 10 }, (_, i) => 
    createMockGameDataItem({
      id: `farm-item-${i + 1}`,
      name: `Farm Item ${i + 1}`,
      sourceFile: 'farm_actions.csv',
      prerequisites: []
    })
  )
]