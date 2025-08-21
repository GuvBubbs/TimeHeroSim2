import { computed } from 'vue'
import { useGameDataStore } from '@/stores/gameData'
import type { GameDataItem, DataFilter } from '@/types/game-data'

/**
 * Composable for easy access to game data with common operations
 */
export function useGameData() {
  const gameDataStore = useGameDataStore()

  const isLoading = computed(() => gameDataStore.isLoading)
  const hasData = computed(() => gameDataStore.stats.totalItems > 0)
  const stats = computed(() => gameDataStore.stats)
  const validationIssues = computed(() => gameDataStore.validationIssues)

  // Data access
  const getAllItems = () => gameDataStore.items
  const getItemById = (id: string) => gameDataStore.getItemById(id)
  const getItemsByCategory = (category: string) => gameDataStore.itemsByCategory[category] || []
  const getItemsByType = (type: string) => gameDataStore.itemsByType[type] || []
  const getFilteredItems = (filter: DataFilter) => gameDataStore.getFilteredItems(filter)

  // Relationship helpers
  const getPrerequisiteChain = (itemId: string) => gameDataStore.getPrerequisiteChain(itemId)
  const getItemsRequiring = (itemId: string) => gameDataStore.getItemsRequiring(itemId)
  
  // Check if an item can be unlocked given a set of unlocked items
  const canUnlock = (itemId: string, unlockedItems: Set<string>): boolean => {
    const item = getItemById(itemId)
    if (!item) return false
    
    return item.prerequisites.every(prereqId => unlockedItems.has(prereqId))
  }

  // Get all items that can be unlocked given current unlocks
  const getUnlockableItems = (unlockedItems: Set<string>): GameDataItem[] => {
    return getAllItems().filter(item => 
      !unlockedItems.has(item.id) && canUnlock(item.id, unlockedItems)
    )
  }

  // Calculate total cost for an item including all prerequisites
  const calculateTotalCost = (itemId: string) => {
    const chain = getPrerequisiteChain(itemId)
    const totalCost = {
      gold: 0,
      energy: 0,
      materials: {} as Record<string, number>
    }

    chain.forEach(item => {
      if (item.goldCost) totalCost.gold += item.goldCost
      if (item.energyCost) totalCost.energy += item.energyCost
      if (item.materialsCost) {
        Object.entries(item.materialsCost).forEach(([material, quantity]) => {
          totalCost.materials[material] = (totalCost.materials[material] || 0) + quantity
        })
      }
    })

    return totalCost
  }

  // Data operations
  const loadData = () => gameDataStore.loadGameData()
  const validateData = () => gameDataStore.validateData()
  const clearData = () => gameDataStore.clearData()

  return {
    // State
    isLoading,
    hasData,
    stats,
    validationIssues,

    // Data access
    getAllItems,
    getItemById,
    getItemsByCategory,
    getItemsByType,
    getFilteredItems,

    // Relationships
    getPrerequisiteChain,
    getItemsRequiring,
    canUnlock,
    getUnlockableItems,
    calculateTotalCost,

    // Operations
    loadData,
    validateData,
    clearData
  }
}
