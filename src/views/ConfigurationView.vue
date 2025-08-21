<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-bold">Game Configuration</h2>
      <div class="flex items-center gap-4">
        <button 
          @click="forceReloadData"
          :disabled="gameData.isLoading"
          class="px-3 py-1 text-sm bg-sim-accent text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <i class="fas fa-sync mr-1"></i>
          {{ gameData.isLoading ? 'Loading...' : 'Refresh Data' }}
        </button>
      <div class="text-sm text-sim-muted">
        Data Management
        <span v-if="gameData.stats.totalItems > 0" class="ml-2">
          • {{ gameData.stats.totalItems }} items loaded
        </span>
          <span v-if="gameData.lastLoadTime" class="ml-2">
            • Updated {{ formatLastUpdate(gameData.lastLoadTime) }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="gameData.isLoading" class="card">
      <div class="card-body">
        <div class="text-center py-12">
          <i class="fas fa-spinner fa-spin text-4xl text-sim-accent mb-4"></i>
          <p>Loading game data...</p>
          <div v-if="gameData.loadProgress" class="mt-2 max-w-md mx-auto">
            <div class="text-sm text-sim-muted mb-2">{{ gameData.loadProgress.currentFile }}</div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-sim-accent h-2 rounded-full transition-all duration-300"
                :style="{ width: `${(gameData.loadProgress.loaded / gameData.loadProgress.total) * 100}%` }"
              ></div>
            </div>
            <div class="text-sm text-sim-muted mt-1">
              {{ gameData.loadProgress.loaded }} / {{ gameData.loadProgress.total }} files
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else-if="gameData.stats.totalItems === 0" class="card">
      <div class="card-body">
        <div class="text-center py-12 text-sim-muted">
          <i class="fas fa-database text-4xl mb-4"></i>
          <p>No game data loaded</p>
          <p class="text-sm mt-2 mb-4">Load game data to view and manage configuration</p>
          <button 
            @click="loadData"
            class="px-4 py-2 bg-sim-accent text-white rounded hover:bg-blue-600 transition-colors"
          >
            Load Game Data
          </button>
        </div>
      </div>
    </div>

    <!-- Two-Tier Navigation Configuration Interface -->
    <div v-else class="game-configuration">
      <!-- Top Level Tabs -->
      <div class="top-tabs flex gap-2 mb-4">
        <button 
          v-for="screen in gameScreens" 
          :key="screen.id"
          @click="currentScreen = screen.id"
          :class="{ 
            'bg-blue-500 text-white border-2 border-blue-600 shadow-md': currentScreen === screen.id,
            'bg-sim-surface hover:bg-slate-800 border-2 border-transparent': currentScreen !== screen.id
          }"
          class="px-4 py-2 rounded-t transition-colors flex items-center space-x-2"
        >
          <i :class="screen.icon"></i>
          <span>{{ screen.name }}</span>
        </button>
      </div>
      
      <!-- Second Level Tabs -->
      <div class="sub-tabs flex gap-1 mb-4">
        <button 
          v-for="category in currentCategories" 
          :key="category.id"
          @click="currentCategory = category.id"
          :class="{ 
            'bg-sim-accent text-white border border-blue-400 shadow-sm': currentCategory === category.id,
            'bg-sim-surface hover:bg-slate-800 border border-transparent': currentCategory !== category.id
          }"
          class="px-3 py-1 text-sm rounded transition-colors flex items-center space-x-2"
        >
          <span>{{ category.name }}</span>
          <span 
            :class="getDataTypeBadgeClass(getDataTypeForCategory(category.files))"
            class="px-1.5 py-0.5 text-xs rounded-full font-medium"
          >
            {{ getDataTypeForCategory(category.files) }}
          </span>
          <span class="text-xs opacity-75">({{ category.count }})</span>
        </button>
      </div>
      
      <!-- Search Bar and Actions -->
      <div class="flex gap-4 mb-4">
        <div class="flex-1 relative">
          <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-sim-muted text-sm"></i>
          <input 
            v-model="searchQuery" 
            @input="debouncedSearch"
            placeholder="Search across all data..."
            class="w-full pl-10 pr-4 py-2 border border-sim-border rounded-lg bg-sim-surface text-sim-text placeholder-sim-muted focus:outline-none focus:ring-2 focus:ring-sim-accent focus:border-transparent"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-sim-muted hover:text-slate-200"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <button
          @click="showAddModal = true"
          class="px-4 py-2 bg-sim-accent text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <i class="fas fa-plus"></i>
          <span>Add Item</span>
        </button>
      </div>

      <!-- Data Table -->
        <DataTable
        :items="filteredData"
          :title="getTableTitle()"
          :is-specialized="isSpecializedFile"
          :specialized-columns="specializedColumns"
        @edit-item="handleEditItem"
        />
      </div>

    <!-- Unsaved Changes Indicator -->
    <div 
      v-if="configStore.hasChanges" 
      class="fixed bottom-4 right-4 bg-yellow-500 text-white p-4 rounded-lg shadow-lg z-50 flex items-center space-x-4"
    >
      <div class="flex items-center space-x-2">
        <i class="fas fa-exclamation-triangle"></i>
        <span class="font-medium">
          {{ configStore.changeCount }} unsaved change{{ configStore.changeCount !== 1 ? 's' : '' }}
        </span>
      </div>
      <div class="flex items-center space-x-2">
        <button
          @click="resetChanges"
          class="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors text-sm"
          title="Reset all changes"
        >
          <i class="fas fa-undo mr-1"></i>
          Reset
        </button>
        <button
          @click="saveChanges"
          class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-sm"
          title="Save changes to localStorage"
        >
          <i class="fas fa-save mr-1"></i>
          Save
        </button>
      </div>
    </div>

    <!-- Add Item Modal -->
    <AddItemModal
      :show="showAddModal"
      :game-feature="currentScreen"
      :category="getCurrentCategoryName()"
      @close="showAddModal = false"
      @item-added="handleItemAdded"
    />

    <!-- Edit Item Modal -->
    <EditItemModal
      :show="showEditModal"
      :item="editingItem"
      :is-specialized="isSpecializedFile"
      @close="handleCloseEditModal"
      @save="handleSaveEditedItem"
    />

    <!-- Error State -->
    <div v-if="gameData.loadErrors.length > 0" class="card border-sim-error">
      <div class="card-header text-sim-error">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        Loading Errors
      </div>
      <div class="card-body">
        <div class="space-y-2 max-h-40 overflow-y-auto">
          <div 
            v-for="(error, index) in gameData.loadErrors" 
            :key="index"
            class="text-sm text-sim-error bg-sim-error bg-opacity-10 p-2 rounded"
          >
            {{ error }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useGameDataStore } from '@/stores/gameData'
import { useConfigurationStore } from '@/stores/configuration'
import { CSV_FILE_LIST } from '@/types/csv-data'
import DataTable from '@/components/GameConfiguration/DataTable.vue'
import AddItemModal from '@/components/GameConfiguration/AddItemModal.vue'
import EditItemModal from '@/components/GameConfiguration/EditItemModal.vue'
import type { DataFilter, GameDataItem } from '@/types/game-data'

const gameData = useGameDataStore()
const configStore = useConfigurationStore()

// Auto-load data when component mounts
onMounted(async () => {
  if (gameData.stats.totalItems === 0 && !gameData.isLoading) {
    await loadData()
  }
  // Load specialized data if not already loaded
  await gameData.loadSpecializedData()
  
  // Load any saved configuration changes from localStorage
  configStore.loadFromLocalStorage()
})

// Navigation State
const currentScreen = ref<string>('Farm')
const currentCategory = ref<string>('')
const searchQuery = ref('')
const loading = ref(false)

// Modal state
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingItem = ref<GameDataItem | Record<string, any> | null>(null)

// Debounced search
let searchTimeout: NodeJS.Timeout | null = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    // Search is handled by the filteredData computed
  }, 300)
}

// Game screen configuration following Phase 2 requirements
const gameScreens = computed(() => [
  { id: 'Farm', name: 'Farm', icon: 'fas fa-seedling' },
  { id: 'Tower', name: 'Tower', icon: 'fas fa-building' },
  { id: 'Town', name: 'Town', icon: 'fas fa-city' },
  { id: 'Adventure', name: 'Adventure', icon: 'fas fa-map' },
  { id: 'Combat', name: 'Combat', icon: 'fas fa-shield-alt' },
  { id: 'Forge', name: 'Forge', icon: 'fas fa-hammer' },
  { id: 'Mining', name: 'Mine', icon: 'fas fa-tools' },
  { id: 'General', name: 'General', icon: 'fas fa-cogs' }
])

// Category mapping for each game screen
const screenCategories = computed(() => {
  const categories: Record<string, Array<{id: string, name: string, files: string[], count: number}>> = {}
  
  // Build categories based on files available for each game feature
  gameScreens.value.forEach(screen => {
    if (screen.id === 'Combat') {
      // Special handling for Combat tab - show all combat-related files
      const combatFiles = CSV_FILE_LIST.filter(file => file.gameFeature === 'Combat')
      categories[screen.id] = combatFiles.map(file => ({
        id: file.displayName.toLowerCase().replace(/\s+/g, '_'),
        name: file.displayName,
        files: [file.filename],
        count: getItemCountForCategory('Combat', [file.filename])
      }))
    } else if (screen.id === 'General') {
      // Special handling for General tab - show phase transitions
      const generalFiles = CSV_FILE_LIST.filter(file => file.gameFeature === 'General')
      categories[screen.id] = generalFiles.map(file => ({
        id: file.displayName.toLowerCase().replace(/\s+/g, '_'),
        name: file.displayName,
        files: [file.filename],
        count: getItemCountForCategory('General', [file.filename])
      }))
    } else {
      // Normal handling for other tabs
      const files = CSV_FILE_LIST.filter(file => file.gameFeature === screen.id)
      const categoryMap = new Map<string, string[]>()
      
      // Group files by their display names (simplified categories)
      files.forEach(file => {
        const categoryKey = file.displayName
        if (!categoryMap.has(categoryKey)) {
          categoryMap.set(categoryKey, [])
        }
        categoryMap.get(categoryKey)!.push(file.filename)
      })
      
      categories[screen.id] = Array.from(categoryMap.entries()).map(([name, fileList]) => ({
        id: name.toLowerCase().replace(/\s+/g, '_'),
        name,
        files: fileList,
        count: getItemCountForCategory(screen.id, fileList)
      }))
    }
  })
  
  return categories
})

// Get item count for a category
const getItemCountForCategory = (gameFeature: string, files: string[]) => {
  let count = 0
  files.forEach(filename => {
    const fileMetadata = CSV_FILE_LIST.find(f => f.filename === filename)
    if (!fileMetadata) return
    
    if (!fileMetadata.hasUnifiedSchema) {
      // For specialized files, get count from store
      count += gameData.getSpecializedRowCount(filename)
    } else {
      // For unified files, count items
      const items = gameData.itemsByGameFeature[gameFeature] || []
      count += items.filter(item => item.sourceFile === filename).length
    }
  })
  return count
}

// Get data type for a category based on its files
const getDataTypeForCategory = (files: string[]) => {
  if (files.length === 0) return 'Data'
  
  // Get the category of the first file (assuming all files in a category have the same type)
  const fileMetadata = CSV_FILE_LIST.find(f => f.filename === files[0])
  return fileMetadata?.category || 'Data'
}

// Get badge styling for data type
const getDataTypeBadgeClass = (dataType: 'Actions' | 'Data' | 'Unlocks') => {
  switch (dataType) {
    case 'Actions':
      return 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
    case 'Unlocks':  
      return 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
    case 'Data':
      return 'bg-green-600/20 text-green-300 border border-green-500/30'
    default:
      return 'bg-gray-600/20 text-gray-300 border border-gray-500/30'
  }
}

// Get current categories for selected screen
const currentCategories = computed(() => {
  const categories = screenCategories.value[currentScreen.value] || []
  return categories
})

// Initialize category selection when screen changes
watch(currentScreen, (newScreen) => {
  const categories = screenCategories.value[newScreen] || []
  if (categories.length > 0) {
    currentCategory.value = categories[0].id
  } else {
    currentCategory.value = ''
  }
}, { immediate: true })

// Determine if current selection uses specialized data
const isSpecializedFile = computed(() => {
  const category = currentCategories.value.find(c => c.id === currentCategory.value)
  if (!category || category.files.length === 0) return false
  
  const firstFile = category.files[0]
  const fileMetadata = CSV_FILE_LIST.find(f => f.filename === firstFile)
  return fileMetadata ? !fileMetadata.hasUnifiedSchema : false
})

// Get specialized data for current selection
const specializedItems = computed(() => {
  const category = currentCategories.value.find(c => c.id === currentCategory.value)
  if (!category || !isSpecializedFile.value || category.files.length === 0) return []
  
  // For now, show data from the first file in the category
  const firstFile = category.files[0]
  return gameData.getSpecializedDataByFile(firstFile)
})

const specializedColumns = computed(() => {
  const category = currentCategories.value.find(c => c.id === currentCategory.value)
  if (!category || !isSpecializedFile.value || category.files.length === 0) return []
  
  const firstFile = category.files[0]
  return gameData.getSpecializedDataColumns(firstFile)
})

// Main data filtering logic
const filteredData = computed(() => {
  const category = currentCategories.value.find(c => c.id === currentCategory.value)
  if (!category) return []
  
  // Handle specialized files differently
  if (isSpecializedFile.value) {
    let items = specializedItems.value
    
    // Apply search filter to specialized data
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      items = items.filter((item: any) => {
        return Object.values(item).some(value => 
          String(value).toLowerCase().includes(query)
        )
      })
    }
    
    return items
  }
  
  // Handle unified schema files
  let items = gameData.items.filter(item => {
    // Filter by current screen's files
    return category.files.includes(item.sourceFile)
  })
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      (item.effect && item.effect.toLowerCase().includes(query)) ||
      (item.type && item.type.toLowerCase().includes(query))
    )
  }
  
  return items
})

// Table title generation
const getTableTitle = () => {
  const screen = gameScreens.value.find(s => s.id === currentScreen.value)
  const category = currentCategories.value.find(c => c.id === currentCategory.value)
  
  if (screen && category) {
    const itemCount = isSpecializedFile.value 
      ? specializedItems.value.length 
      : filteredData.value.length
    return `${screen.name} - ${category.name} (${itemCount} items)`
  }
  
  if (searchQuery.value) {
    return `Search: "${searchQuery.value}" (${filteredData.value.length} results)`
  }
  
  return 'Game Data'
}

// Event handlers
const clearSearch = () => {
  searchQuery.value = ''
}

const getCurrentCategoryName = () => {
  const category = currentCategories.value.find(c => c.id === currentCategory.value)
  return category?.name || 'Item'
}

const handleItemAdded = (newItem: GameDataItem) => {
  // The item has already been added to the configuration store
  // We could optionally trigger a refresh or show a success message
  console.log('New item added:', newItem)
}

const handleEditItem = (item: GameDataItem | Record<string, any>) => {
  editingItem.value = item
  showEditModal.value = true
}

const handleCloseEditModal = () => {
  showEditModal.value = false
  editingItem.value = null
}

const handleSaveEditedItem = (updatedItem: GameDataItem | Record<string, any>) => {
  // Save all field changes to the configuration store
  Object.entries(updatedItem).forEach(([field, value]) => {
    if (field === 'id') return // Skip ID field updates
    
    const originalValue = editingItem.value?.[field]
    if (originalValue !== value) {
      configStore.setItemValue(
        updatedItem.id as string,
        field as keyof GameDataItem,
        value,
        originalValue
      )
    }
  })
  
  showEditModal.value = false
  editingItem.value = null
  console.log('Item updated:', updatedItem.name)
}

const saveChanges = () => {
  try {
    configStore.saveToLocalStorage()
    // Show success feedback
    showToast('Changes saved successfully!', 'success')
  } catch (error) {
    console.error('Failed to save changes:', error)
    showToast('Failed to save changes', 'error')
  }
}

const resetChanges = () => {
  if (confirm('Are you sure you want to reset all changes? This cannot be undone.')) {
    configStore.resetAllChanges()
    showToast('All changes have been reset', 'info')
  }
}

// Simple toast notification (placeholder - could be replaced with a proper toast library)
const showToast = (message: string, type: 'success' | 'error' | 'info') => {
  // For now, just use console and could be replaced with a proper notification system
  console.log(`${type.toUpperCase()}: ${message}`)
  
  // Could implement a proper toast notification here
  // For demonstration, we'll just show an alert
  if (type === 'error') {
    alert(`Error: ${message}`)
  }
}

// Methods
const loadData = async () => {
  loading.value = true
  try {
  await gameData.loadGameData()
  await gameData.loadSpecializedData()
  } finally {
    loading.value = false
  }
}

const forceReloadData = async () => {
  console.log('🔄 Force reloading game data...')
  await gameData.loadGameData()
  await gameData.loadSpecializedData()
  console.log('✅ Data reload complete:', gameData.stats.totalItems, 'items')
}

const formatLastUpdate = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}
</script>

<style scoped>
.h-screen-minus-nav {
  height: calc(100vh - 200px);
}
</style>
