<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-bold">Game Configuration</h2>
      <div class="text-sm text-sim-muted">
        Data Management
        <span v-if="gameData.stats.totalItems > 0" class="ml-2">
          • {{ gameData.stats.totalItems }} items loaded
        </span>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="gameData.isLoading" class="card">
      <div class="card-body">
        <div class="text-center py-12">
          <i class="fas fa-spinner fa-spin text-4xl text-sim-primary mb-4"></i>
          <p>Loading game data...</p>
          <div v-if="gameData.loadProgress" class="mt-2 max-w-md mx-auto">
            <div class="text-sm text-sim-muted mb-2">{{ gameData.loadProgress.currentFile }}</div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-sim-primary h-2 rounded-full transition-all duration-300"
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
            class="px-4 py-2 bg-sim-primary text-white rounded hover:bg-sim-primary-dark transition-colors"
          >
            Load Game Data
          </button>
        </div>
      </div>
    </div>

    <!-- Main Configuration Interface -->
    <div v-else class="grid grid-cols-4 gap-6 h-screen-minus-nav">
      <!-- Sidebar -->
      <div class="col-span-1">
        <CategorySidebar
          :items-by-category="gameData.itemsByCategory"
          :total-items="gameData.stats.totalItems"
          v-model:selected-category="selectedCategory"
          v-model:selected-type="selectedType"
          v-model:search-query="searchQuery"
        />
      </div>

      <!-- Main Content Area -->
      <div class="col-span-2 overflow-hidden">
        <DataTable
          :items="filteredItems"
          :title="getTableTitle()"
        />
      </div>

      <!-- Filters Sidebar -->
      <div class="col-span-1">
        <DataFilters
          v-model:filters="additionalFilters"
          :available-files="availableFiles"
        />
      </div>
    </div>

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
import CategorySidebar from '@/components/GameConfiguration/CategorySidebar.vue'
import DataTable from '@/components/GameConfiguration/DataTable.vue'
import DataFilters from '@/components/GameConfiguration/DataFilters.vue'
import type { DataFilter } from '@/types/game-data'

const gameData = useGameDataStore()

// State
const selectedCategory = ref<string | null>(null)
const selectedType = ref<string | null>(null)
const searchQuery = ref('')
const additionalFilters = ref<any>({})

// Computed
const availableFiles = computed(() => 
  Object.keys(gameData.itemsByFile)
)

const baseFilter = computed((): DataFilter => ({
  category: selectedCategory.value || undefined,
  type: selectedType.value || undefined,
  searchText: searchQuery.value || undefined
}))

const combinedFilters = computed((): DataFilter => ({
  ...baseFilter.value,
  ...additionalFilters.value
}))

const filteredItems = computed(() => {
  if (!gameData.getFilteredItems) return []
  
  let items = gameData.getFilteredItems(combinedFilters.value)
  
  // Apply additional custom filters
  if (additionalFilters.value.minGoldCost !== undefined) {
    items = items.filter(item => 
      item.goldCost !== undefined && item.goldCost >= additionalFilters.value.minGoldCost
    )
  }
  
  if (additionalFilters.value.maxGoldCost !== undefined) {
    items = items.filter(item => 
      item.goldCost !== undefined && item.goldCost <= additionalFilters.value.maxGoldCost
    )
  }
  
  if (additionalFilters.value.sourceFile) {
    items = items.filter(item => item.sourceFile === additionalFilters.value.sourceFile)
  }
  
  if (additionalFilters.value.hasGoldCost) {
    items = items.filter(item => item.goldCost !== undefined)
  }
  
  if (additionalFilters.value.hasEnergyCost) {
    items = items.filter(item => item.energyCost !== undefined)
  }
  
  if (additionalFilters.value.hasMaterialsCost) {
    items = items.filter(item => item.materialsCost !== undefined)
  }
  
  if (additionalFilters.value.isRepeatable !== undefined) {
    items = items.filter(item => item.repeatable === additionalFilters.value.isRepeatable)
  }
  
  return items
})

const getTableTitle = () => {
  if (selectedCategory.value && selectedType.value) {
    return `${selectedCategory.value} - ${selectedType.value}`
  }
  if (selectedCategory.value) {
    return selectedCategory.value
  }
  if (searchQuery.value) {
    return `Search: "${searchQuery.value}"`
  }
  return 'All Game Data'
}

// Methods
const loadData = async () => {
  await gameData.loadGameData()
}

// Auto-load data on mount if not already loaded
onMounted(() => {
  if (gameData.stats.totalItems === 0 && !gameData.isLoading) {
    loadData()
  }
})
</script>

<style scoped>
.h-screen-minus-nav {
  height: calc(100vh - 200px);
}
</style>
