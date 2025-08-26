import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GameDataItem } from '@/types/game-data'

export interface ConfigurationChange {
  itemId: string
  field: keyof GameDataItem
  originalValue: any
  newValue: any
  timestamp: Date
}

export interface ConfigurationSet {
  id: string
  name: string
  description: string
  changes: Record<string, Partial<GameDataItem>>
  created: Date
  modified: Date
}

export const useConfigurationStore = defineStore('configuration', () => {
  // State
  const activeChanges = ref<Record<string, Partial<GameDataItem>>>({})
  const changeHistory = ref<ConfigurationChange[]>([])
  const savedSets = ref<ConfigurationSet[]>([])
  const activeSetId = ref<string | null>(null)

  // Computed
  const hasChanges = computed(() => Object.keys(activeChanges.value).length > 0)
  
  const changeCount = computed(() => {
    return Object.values(activeChanges.value).reduce((count, changes) => {
      return count + Object.keys(changes).length
    }, 0)
  })

  const getItemChanges = computed(() => {
    return (itemId: string): Partial<GameDataItem> | undefined => {
      return activeChanges.value[itemId]
    }
  })

  const isItemModified = computed(() => {
    return (itemId: string): boolean => {
      return activeChanges.value[itemId] !== undefined
    }
  })

  const getModifiedValue = computed(() => {
    return <T extends keyof GameDataItem>(itemId: string, field: T, originalValue: GameDataItem[T]): GameDataItem[T] => {
      const changes = activeChanges.value[itemId]
      if (changes && field in changes) {
        return changes[field] as GameDataItem[T]
      }
      return originalValue
    }
  })

  const modifiedItemIds = computed(() => {
    return Object.keys(activeChanges.value)
  })

  // Actions
  const setItemValue = <T extends keyof GameDataItem>(
    itemId: string,
    field: T,
    value: GameDataItem[T],
    originalValue: GameDataItem[T]
  ) => {
    // Initialize item changes if not exists
    if (!activeChanges.value[itemId]) {
      activeChanges.value[itemId] = {}
    }

    // Store the change
    const oldValue = activeChanges.value[itemId][field]
    activeChanges.value[itemId][field] = value

    // Record in history
    changeHistory.value.push({
      itemId,
      field,
      originalValue,
      newValue: value,
      timestamp: new Date()
    })

    // If the value is the same as original, remove the change
    if (value === originalValue) {
      delete activeChanges.value[itemId][field]
      
      // If no more changes for this item, remove the item entirely
      if (Object.keys(activeChanges.value[itemId]).length === 0) {
        delete activeChanges.value[itemId]
      }
    }

    // Limit history size
    if (changeHistory.value.length > 1000) {
      changeHistory.value = changeHistory.value.slice(-500)
    }
  }

  const resetItemChanges = (itemId: string) => {
    delete activeChanges.value[itemId]
  }

  const resetAllChanges = () => {
    activeChanges.value = {}
    changeHistory.value.push({
      itemId: 'all',
      field: 'id', // placeholder
      originalValue: 'reset',
      newValue: 'reset',
      timestamp: new Date()
    })
  }

  const applyChanges = (changes: Record<string, Partial<GameDataItem>>) => {
    Object.entries(changes).forEach(([itemId, itemChanges]) => {
      if (!activeChanges.value[itemId]) {
        activeChanges.value[itemId] = {}
      }
      Object.assign(activeChanges.value[itemId], itemChanges)
    })
  }

  // Configuration Sets
  const createConfigurationSet = (name: string, description: string = ''): ConfigurationSet => {
    const configSet: ConfigurationSet = {
      id: `config_${Date.now()}`,
      name,
      description,
      changes: { ...activeChanges.value },
      created: new Date(),
      modified: new Date()
    }

    savedSets.value.push(configSet)
    return configSet
  }

  const loadConfigurationSet = (setId: string) => {
    const configSet = savedSets.value.find(set => set.id === setId)
    if (configSet) {
      activeChanges.value = { ...configSet.changes }
      activeSetId.value = setId
    }
  }

  const updateConfigurationSet = (setId: string, updates: Partial<Pick<ConfigurationSet, 'name' | 'description'>>) => {
    const configSet = savedSets.value.find(set => set.id === setId)
    if (configSet) {
      Object.assign(configSet, updates, { modified: new Date() })
    }
  }

  const saveCurrentAsSet = (name: string, description: string = ''): ConfigurationSet => {
    return createConfigurationSet(name, description)
  }

  const deleteConfigurationSet = (setId: string) => {
    const index = savedSets.value.findIndex(set => set.id === setId)
    if (index >= 0) {
      savedSets.value.splice(index, 1)
      if (activeSetId.value === setId) {
        activeSetId.value = null
      }
    }
  }

  const exportConfiguration = (): string => {
    return JSON.stringify({
      changes: activeChanges.value,
      sets: savedSets.value,
      exported: new Date().toISOString()
    }, null, 2)
  }

  const importConfiguration = (configJson: string): boolean => {
    try {
      const config = JSON.parse(configJson)
      
      if (config.changes) {
        activeChanges.value = config.changes
      }
      
      if (config.sets && Array.isArray(config.sets)) {
        savedSets.value = config.sets.map((set: any) => ({
          ...set,
          created: new Date(set.created),
          modified: new Date(set.modified)
        }))
      }
      
      return true
    } catch (error) {
      console.error('Failed to import configuration:', error)
      return false
    }
  }

  // Persistence
  const saveToLocalStorage = () => {
    try {
      const data = {
        activeChanges: activeChanges.value,
        savedSets: savedSets.value,
        activeSetId: activeSetId.value
      }
      localStorage.setItem('time-hero-sim-config', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save configuration to localStorage:', error)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem('time-hero-sim-config')
      if (stored) {
        const data = JSON.parse(stored)
        if (data.activeChanges) {
          activeChanges.value = data.activeChanges
        }
        if (data.savedSets) {
          savedSets.value = data.savedSets.map((set: any) => ({
            ...set,
            created: new Date(set.created),
            modified: new Date(set.modified)
          }))
        }
        if (data.activeSetId) {
          activeSetId.value = data.activeSetId
        }
      }
    } catch (error) {
      console.error('Failed to load configuration from localStorage:', error)
    }
  }

  return {
    // State
    activeChanges,
    changeHistory,
    savedSets,
    activeSetId,

    // Computed
    hasChanges,
    changeCount,
    getItemChanges,
    isItemModified,
    getModifiedValue,
    modifiedItemIds,

    // Actions
    setItemValue,
    resetItemChanges,
    resetAllChanges,
    applyChanges,

    // Configuration Sets
    createConfigurationSet,
    loadConfigurationSet,
    updateConfigurationSet,
    saveCurrentAsSet,
    deleteConfigurationSet,

    // Import/Export
    exportConfiguration,
    importConfiguration,

    // Persistence
    saveToLocalStorage,
    loadFromLocalStorage
  }
})
