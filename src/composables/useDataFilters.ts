import { ref, computed } from 'vue'
import type { GameDataItem, DataFilter } from '@/types/game-data'

/**
 * Composable for managing data filtering and search functionality
 */
export function useDataFilters(items: GameDataItem[]) {
  const searchQuery = ref('')
  const activeFilters = ref<DataFilter>({})
  const sortField = ref('name')
  const sortDirection = ref<'asc' | 'desc'>('asc')

  // Filter items based on search and filters
  const filteredItems = computed(() => {
    let filtered = [...items]

    // Apply search query
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim()
      filtered = filtered.filter(item => {
        const searchableFields = [
          item.id,
          item.name,
          item.type,
          item.effect,
          item.notes,
          ...item.categories,
          ...item.prerequisites
        ].filter(Boolean)

        return searchableFields.some(field => 
          field.toLowerCase().includes(query)
        )
      })
    }

    // Apply category filter
    if (activeFilters.value.category) {
      filtered = filtered.filter(item => item.category === activeFilters.value.category)
    }

    // Apply type filter
    if (activeFilters.value.type) {
      filtered = filtered.filter(item => item.type === activeFilters.value.type)
    }

    // Apply level filters
    if (activeFilters.value.minLevel !== undefined) {
      filtered = filtered.filter(item => 
        item.level !== undefined && item.level >= activeFilters.value.minLevel!
      )
    }
    if (activeFilters.value.maxLevel !== undefined) {
      filtered = filtered.filter(item => 
        item.level !== undefined && item.level <= activeFilters.value.maxLevel!
      )
    }

    // Apply prerequisites filter
    if (activeFilters.value.hasPrerequisites !== undefined) {
      const hasPrereqs = activeFilters.value.hasPrerequisites
      filtered = filtered.filter(item => 
        (item.prerequisites.length > 0) === hasPrereqs
      )
    }

    return filtered
  })

  // Sort filtered items
  const sortedAndFilteredItems = computed(() => {
    const items = [...filteredItems.value]

    return items.sort((a, b) => {
      const aVal = getFieldValue(a, sortField.value)
      const bVal = getFieldValue(b, sortField.value)

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      let comparison = 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal)
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }

      return sortDirection.value === 'asc' ? comparison : -comparison
    })
  })

  // Helper function to get field value from item
  const getFieldValue = (item: GameDataItem, field: string): any => {
    return (item as any)[field]
  }

  // Actions
  const setSearch = (query: string) => {
    searchQuery.value = query
  }

  const updateFilters = (filters: Partial<DataFilter>) => {
    activeFilters.value = { ...activeFilters.value, ...filters }
  }

  const clearFilters = () => {
    activeFilters.value = {}
    searchQuery.value = ''
  }

  const setSort = (field: string, direction?: 'asc' | 'desc') => {
    sortField.value = field
    if (direction) {
      sortDirection.value = direction
    } else {
      // Toggle direction if same field
      if (sortField.value === field) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortDirection.value = 'asc'
      }
    }
  }

  // Computed helpers
  const hasActiveFilters = computed(() => {
    return (
      searchQuery.value.trim() !== '' ||
      Object.keys(activeFilters.value).length > 0
    )
  })

  const filterCount = computed(() => {
    let count = 0
    if (searchQuery.value.trim()) count++
    if (activeFilters.value.category) count++
    if (activeFilters.value.type) count++
    if (activeFilters.value.minLevel !== undefined) count++
    if (activeFilters.value.maxLevel !== undefined) count++
    if (activeFilters.value.hasPrerequisites !== undefined) count++
    return count
  })

  return {
    // State
    searchQuery,
    activeFilters,
    sortField,
    sortDirection,

    // Computed
    filteredItems: sortedAndFilteredItems,
    hasActiveFilters,
    filterCount,

    // Actions
    setSearch,
    updateFilters,
    clearFilters,
    setSort
  }
}
