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

// Performance test datasets
export const gameDataFixtures = {
  smallDataset: [
    ...mockFarmItems,
    ...mockBlacksmithItems,
    // Add more items to reach ~50 items
    ...Array.from({ length: 45 }, (_, i) => 
      createMockGameDataItem({
        id: `small-item-${i + 1}`,
        name: `Small Item ${i + 1}`,
        sourceFile: i % 2 === 0 ? 'farm_actions.csv' : 'town_blacksmith.csv',
        prerequisites: i > 0 ? [`small-item-${i}`] : []
      })
    )
  ],

  mediumDataset: [
    ...mockMixedItems,
    // Add more items to reach ~150 items
    ...Array.from({ length: 140 }, (_, i) => {
      const sourceFiles = [
        'farm_actions.csv',
        'town_blacksmith.csv', 
        'town_agronomist.csv',
        'tower_actions.csv',
        'adventures.csv'
      ]
      return createMockGameDataItem({
        id: `medium-item-${i + 1}`,
        name: `Medium Item ${i + 1}`,
        sourceFile: sourceFiles[i % sourceFiles.length],
        prerequisites: i > 0 && i % 3 === 0 ? [`medium-item-${i - 2}`] : []
      })
    })
  ],

  largeDataset: [
    ...mockMixedItems,
    // Add more items to reach ~500 items
    ...Array.from({ length: 490 }, (_, i) => {
      const sourceFiles = [
        'farm_actions.csv',
        'town_blacksmith.csv', 
        'town_agronomist.csv',
        'town_carpenter.csv',
        'town_land_steward.csv',
        'town_material_trader.csv',
        'town_skills_trainer.csv',
        'tower_actions.csv',
        'forge_actions.csv',
        'adventures.csv'
      ]
      return createMockGameDataItem({
        id: `large-item-${i + 1}`,
        name: `Large Item ${i + 1}`,
        sourceFile: sourceFiles[i % sourceFiles.length],
        category: i % 4 === 0 ? 'Unlocks' : 'Actions',
        prerequisites: i > 0 && i % 5 === 0 ? [`large-item-${Math.max(1, i - 4)}`] : []
      })
    })
  ]
}