import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  GameDataItem, 
  GameDataStats, 
  ValidationIssue, 
  DataFilter 
} from '@/types/game-data'
import type { CSVLoadProgress, SpecializedCSVResult } from '@/utils/csvLoader'
import { loadAllCSVFiles, loadAllSpecializedCSVFiles, calculateDataMemoryUsage } from '@/utils/csvLoader'
import { CSV_FILE_LIST } from '@/types/csv-data'

export const useGameDataStore = defineStore('gameData', () => {
  // State
  const items = ref<GameDataItem[]>([])
  const isLoading = ref(false)
  const loadProgress = ref<CSVLoadProgress | null>(null)
  const loadErrors = ref<string[]>([])
  const validationIssues = ref<ValidationIssue[]>([])
  const lastLoadTime = ref<Date | null>(null)

  // Specialized data for files that don't conform to unified schema
  const specializedData = ref<Record<string, Record<string, any>[]>>({})
  const specializedLoadErrors = ref<Record<string, string>>({})
  const specializedRowCounts = ref<Record<string, number>>({})

  // Computed getters
  const stats = computed((): GameDataStats => {
    const itemsByCategory: Record<string, number> = {}
    const itemsByFile: Record<string, number> = {}
    const itemsByType: Record<string, number> = {}

    items.value.forEach(item => {
      // Count by category
      itemsByCategory[item.category] = (itemsByCategory[item.category] || 0) + 1
      
      // Count by source file
      itemsByFile[item.sourceFile] = (itemsByFile[item.sourceFile] || 0) + 1
      
      // Count by type
      if (item.type) {
        itemsByType[item.type] = (itemsByType[item.type] || 0) + 1
      }
    })

    return {
      totalItems: items.value.length,
      itemsByCategory,
      itemsByFile,
      validationIssues: validationIssues.value,
      lastLoadTime: lastLoadTime.value || new Date(),
      memoryUsage: calculateDataMemoryUsage(items.value)
    }
  })

  const itemsByCategory = computed(() => {
    const categories: Record<string, GameDataItem[]> = {}
    items.value.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = []
      }
      categories[item.category].push(item)
    })
    return categories
  })

  const itemsByGameFeature = computed(() => {
    const features: Record<string, GameDataItem[]> = {}
    
    // Initialize all game features to ensure they appear in navigation
    CSV_FILE_LIST.forEach(fileMetadata => {
      const gameFeature = fileMetadata.gameFeature
      if (!features[gameFeature]) {
        features[gameFeature] = []
      }
    })
    
    // Add items to their respective features
    items.value.forEach(item => {
      const fileMetadata = CSV_FILE_LIST.find(f => f.filename === item.sourceFile)
      if (fileMetadata) {
        const gameFeature = fileMetadata.gameFeature
        features[gameFeature].push(item)
      }
    })
    return features
  })

  const itemsByType = computed(() => {
    const types: Record<string, GameDataItem[]> = {}
    items.value.forEach(item => {
      const type = item.type || 'unknown'
      if (!types[type]) {
        types[type] = []
      }
      types[type].push(item)
    })
    return types
  })

  const itemsByFile = computed(() => {
    const files: Record<string, GameDataItem[]> = {}
    items.value.forEach(item => {
      if (!files[item.sourceFile]) {
        files[item.sourceFile] = []
      }
      files[item.sourceFile].push(item)
    })
    return files
  })

  // Item lookup
  const getItemById = computed(() => {
    const lookup: Record<string, GameDataItem> = {}
    items.value.forEach(item => {
      lookup[item.id] = item
    })
    return (id: string) => lookup[id]
  })

  const getItemsByIds = computed(() => {
    const lookup = getItemById.value
    return (ids: string[]) => ids.map(id => lookup(id)).filter(Boolean)
  })

  // Filtering
  const getFilteredItems = computed(() => {
    return (filter: DataFilter): GameDataItem[] => {
      return items.value.filter(item => {
        // Category filter
        if (filter.category && item.category !== filter.category) {
          return false
        }

        // Type filter
        if (filter.type && item.type !== filter.type) {
          return false
        }

        // Level filters
        if (filter.minLevel !== undefined && (item.level === undefined || item.level < filter.minLevel)) {
          return false
        }
        if (filter.maxLevel !== undefined && (item.level === undefined || item.level > filter.maxLevel)) {
          return false
        }

        // Prerequisites filter
        if (filter.hasPrerequisites !== undefined) {
          const hasPrereqs = item.prerequisites.length > 0
          if (filter.hasPrerequisites !== hasPrereqs) {
            return false
          }
        }

        // Search text filter
        if (filter.searchText) {
          const searchLower = filter.searchText.toLowerCase()
          const searchFields = [
            item.id,
            item.name,
            item.type,
            item.effect,
            item.notes,
            ...item.categories,
            ...item.prerequisites
          ].filter(Boolean)
          
          const matches = searchFields.some(field => 
            field.toLowerCase().includes(searchLower)
          )
          
          if (!matches) {
            return false
          }
        }

        return true
      })
    }
  })

  // Actions
  const loadGameData = async () => {
    if (isLoading.value) return

    isLoading.value = true
    loadErrors.value = []
    validationIssues.value = []
    loadProgress.value = null

    try {
      const result = await loadAllCSVFiles((progress) => {
        loadProgress.value = progress
      })

      items.value = result.items
      loadErrors.value = result.errors
      lastLoadTime.value = new Date()

      // Run validation after loading
      await validateData()

      console.log(`✅ Loaded ${result.items.length} items from ${result.loadedFiles}/${result.totalFiles} files`)
      if (result.errors.length > 0) {
        console.warn(`⚠️ ${result.errors.length} errors during loading:`, result.errors)
      }

    } catch (error) {
      loadErrors.value = [`Failed to load game data: ${error instanceof Error ? error.message : String(error)}`]
      console.error('❌ Failed to load game data:', error)
    } finally {
      isLoading.value = false
      loadProgress.value = null
    }
  }

  // Load specialized data - separate action for loading specialized files
  const loadSpecializedData = async () => {
    try {
      console.log('🔄 Loading specialized data files...')
      const specializedResults = await loadAllSpecializedCSVFiles()

      // Process specialized results
      const newSpecializedData: Record<string, Record<string, any>[]> = {}
      const newSpecializedErrors: Record<string, string> = {}
      const newSpecializedRowCounts: Record<string, number> = {}
      
      specializedResults.forEach(result => {
        if (result.success) {
          newSpecializedData[result.filename] = result.data
          newSpecializedRowCounts[result.filename] = result.rowCount
          console.log(`✅ Loaded specialized file: ${result.filename} (${result.rowCount} rows)`)
        } else {
          newSpecializedErrors[result.filename] = result.error || 'Unknown error'
          console.error(`❌ Failed to load specialized file: ${result.filename}`, result.error)
        }
      })
      
      // Update specialized data state
      specializedData.value = newSpecializedData
      specializedLoadErrors.value = newSpecializedErrors
      specializedRowCounts.value = newSpecializedRowCounts

      console.log(`✅ Loaded ${Object.keys(newSpecializedData).length} specialized files`)
    } catch (error) {
      console.error('❌ Failed to load specialized data:', error)
    }
  }

  const validateData = async () => {
    const issues: ValidationIssue[] = []
    const itemIds = new Set(items.value.map(item => item.id))

    // Check for duplicate IDs
    const idCounts: Record<string, number> = {}
    items.value.forEach(item => {
      idCounts[item.id] = (idCounts[item.id] || 0) + 1
    })
    
    Object.entries(idCounts).forEach(([id, count]) => {
      if (count > 1) {
        issues.push({
          id: `duplicate-id-${id}`,
          level: 'error',
          message: `Duplicate ID found: ${id} (appears ${count} times)`,
          itemId: id
        })
      }
    })

    // Check prerequisites
    items.value.forEach(item => {
      item.prerequisites.forEach(prereqId => {
        if (!itemIds.has(prereqId)) {
          issues.push({
            id: `missing-prereq-${item.id}-${prereqId}`,
            level: 'error',
            message: `Item ${item.name} (${item.id}) has missing prerequisite: ${prereqId}`,
            itemId: item.id,
            sourceFile: item.sourceFile
          })
        }
      })
    })

    // Check for circular dependencies
    const checkCircularDeps = (itemId: string, visited: Set<string>, path: string[]): void => {
      if (visited.has(itemId)) {
        const cycleStart = path.indexOf(itemId)
        const cycle = path.slice(cycleStart).concat(itemId)
        issues.push({
          id: `circular-dep-${cycle.join('-')}`,
          level: 'error',
          message: `Circular dependency detected: ${cycle.join(' → ')}`,
          itemId
        })
        return
      }

      const item = getItemById.value(itemId)
      if (!item) return

      visited.add(itemId)
      path.push(itemId)

      item.prerequisites.forEach(prereqId => {
        checkCircularDeps(prereqId, new Set(visited), [...path])
      })

      visited.delete(itemId)
      path.pop()
    }

    items.value.forEach(item => {
      checkCircularDeps(item.id, new Set(), [])
    })

    // Data consistency checks
    items.value.forEach(item => {
      // Check for reasonable numeric values
      if (item.level !== undefined && (item.level < 1 || item.level > 20)) {
        issues.push({
          id: `level-range-${item.id}`,
          level: 'warning',
          message: `Item ${item.name} has unusual level: ${item.level}`,
          itemId: item.id,
          sourceFile: item.sourceFile
        })
      }

      // Check for negative costs
      if (item.goldCost !== undefined && item.goldCost < 0) {
        issues.push({
          id: `negative-gold-${item.id}`,
          level: 'warning',
          message: `Item ${item.name} has negative gold cost: ${item.goldCost}`,
          itemId: item.id,
          sourceFile: item.sourceFile
        })
      }

      if (item.energyCost !== undefined && item.energyCost < 0) {
        issues.push({
          id: `negative-energy-${item.id}`,
          level: 'warning',
          message: `Item ${item.name} has negative energy cost: ${item.energyCost}`,
          itemId: item.id,
          sourceFile: item.sourceFile
        })
      }
    })

    validationIssues.value = issues

    console.log(`🔍 Data validation complete: ${issues.length} issues found`)
    const errorCount = issues.filter(i => i.level === 'error').length
    const warningCount = issues.filter(i => i.level === 'warning').length
    if (errorCount > 0) {
      console.error(`❌ ${errorCount} validation errors`)
      issues.filter(i => i.level === 'error').forEach(issue => {
        console.error(`  - ${issue.message}`)
      })
    }
    if (warningCount > 0) {
      console.warn(`⚠️ ${warningCount} validation warnings`)
      issues.filter(i => i.level === 'warning').forEach(issue => {
        console.warn(`  - ${issue.message}`)
      })
    }
  }

  const clearData = () => {
    items.value = []
    loadErrors.value = []
    validationIssues.value = []
    lastLoadTime.value = null
  }

  // Relationship helpers
  const getPrerequisiteChain = (itemId: string): GameDataItem[] => {
    const chain: GameDataItem[] = []
    const visited = new Set<string>()

    const buildChain = (id: string) => {
      if (visited.has(id)) return // Avoid infinite loops
      visited.add(id)

      const item = getItemById.value(id)
      if (!item) return

      // Add prerequisites first (depth-first)
      item.prerequisites.forEach(prereqId => {
        buildChain(prereqId)
      })

      // Then add current item
      chain.push(item)
    }

    buildChain(itemId)
    return chain
  }

  const getItemsRequiring = (itemId: string): GameDataItem[] => {
    return items.value.filter(item => 
      item.prerequisites.includes(itemId)
    )
  }

  return {
    // State
    items,
    isLoading,
    loadProgress,
    loadErrors,
    validationIssues,
    lastLoadTime,

    // Computed
    stats,
    itemsByCategory,
    itemsByGameFeature,
    itemsByType,
    itemsByFile,
    getItemById,
    getItemsByIds,
    getFilteredItems,

    // Specialized data getters
    getSpecializedDataByFile: (filename: string) => specializedData.value[filename] || [],
    getSpecializedDataColumns: (filename: string) => {
      const data = specializedData.value[filename]
      if (!data || data.length === 0) return []
      return Object.keys(data[0]).filter(key => key.trim() !== '')
    },
    getSpecializedRowCount: (filename: string) => specializedRowCounts.value[filename] || 0,

    // Actions
    loadGameData,
    loadSpecializedData,
    validateData,
    clearData,

    // Relationships
    getPrerequisiteChain,
    getItemsRequiring
  }
})
