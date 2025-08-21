<template>
  <div class="bg-sim-surface rounded-lg p-4 h-full flex flex-col">
    <h3 class="text-lg font-semibold mb-4 text-sim-primary">Game Features</h3>
    
    <!-- Search -->
    <div class="mb-4">
      <div class="relative">
        <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-sim-muted text-sm"></i>
        <input
          :value="searchQuery"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="Search data..."
          class="w-full pl-10 pr-4 py-2 border border-sim-border rounded-lg bg-sim-background text-sim-foreground placeholder-sim-muted focus:outline-none focus:ring-2 focus:ring-sim-primary focus:border-transparent"
        />
      </div>
    </div>

    <!-- Game Features List -->
    <div class="space-y-1 overflow-y-auto flex-1">
      <!-- All Items -->
      <button
        @click="selectGameFeature(null, null)"
        :class="[
          'w-full text-left px-3 py-2 rounded-md transition-colors',
          selectedGameFeature === null 
            ? 'bg-sim-primary text-white' 
            : 'hover:bg-sim-muted hover:bg-opacity-10'
        ]"
      >
        <div class="flex items-center justify-between">
          <span class="flex items-center">
            <i class="fas fa-globe mr-2"></i>
            All Items
          </span>
          <span class="text-xs opacity-75">{{ totalItems }}</span>
        </div>
      </button>

      <!-- Game Features -->
      <div v-for="gameFeature in gameFeatures" :key="gameFeature">
        <button
          @click="toggleGameFeature(gameFeature)"
          :class="[
            'w-full text-left px-3 py-2 rounded-md transition-colors',
            selectedGameFeature === gameFeature && selectedFile === null
              ? 'bg-sim-primary text-white'
              : 'hover:bg-sim-muted hover:bg-opacity-10'
          ]"
        >
          <div class="flex items-center justify-between">
            <span class="flex items-center">
              <i :class="getGameFeatureIcon(gameFeature)" class="mr-2"></i>
              {{ gameFeature }}
              <i :class="[
                'fas ml-2 text-xs transition-transform',
                expandedFeatures.includes(gameFeature) ? 'fa-chevron-down' : 'fa-chevron-right'
              ]"></i>
            </span>
            <span class="text-xs opacity-75">{{ getFilesForGameFeature(gameFeature).length }}</span>
          </div>
        </button>

        <!-- Files within Game Feature -->
        <div v-if="expandedFeatures.includes(gameFeature)" class="ml-4 mt-1 space-y-1">
          <button
            v-for="file in getFilesForGameFeature(gameFeature)"
            :key="file.filename"
            @click="selectGameFeature(gameFeature, file.filename)"
            :class="[
              'w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors',
              selectedFile === file.filename
                ? 'bg-sim-accent text-white'
                : 'hover:bg-sim-muted hover:bg-opacity-10'
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center flex-1">
                <span class="flex-1">{{ file.displayName }}</span>
                <span :class="getCategoryBadgeClass(file.category)" class="px-2 py-0.5 text-xs rounded ml-2">
                  {{ file.category }}
                </span>
              </div>
              <span class="text-xs opacity-75 ml-2">{{ getItemCountForFile(file.filename) }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Filter Summary - Hidden as per user preference -->
    <!-- 
    <div v-if="hasActiveFilters" class="mt-4 pt-4 border-t border-sim-border">
      <div class="text-xs text-sim-muted mb-2">Active Filters:</div>
      <div class="flex flex-wrap gap-1">
        <span v-if="selectedGameFeature" class="inline-flex items-center px-2 py-1 bg-sim-primary bg-opacity-20 text-sim-primary rounded text-xs">
          {{ selectedGameFeature }}
          <button @click="clearGameFeature" class="ml-1 hover:bg-sim-primary hover:text-white rounded-full w-4 h-4 flex items-center justify-center">
            <i class="fas fa-times text-xs"></i>
          </button>
        </span>
        <span v-if="selectedFile" class="inline-flex items-center px-2 py-1 bg-sim-accent bg-opacity-20 text-sim-accent rounded text-xs">
          {{ getFileDisplayName(selectedFile) }}
          <button @click="clearFile" class="ml-1 hover:bg-sim-accent hover:text-white rounded-full w-4 h-4 flex items-center justify-center">
            <i class="fas fa-times text-xs"></i>
          </button>
        </span>
        <span v-if="searchQuery" class="inline-flex items-center px-2 py-1 bg-sim-warning bg-opacity-20 text-sim-warning rounded text-xs">
          "{{ searchQuery }}"
          <button @click="clearSearch" class="ml-1 hover:bg-sim-warning hover:text-white rounded-full w-4 h-4 flex items-center justify-center">
            <i class="fas fa-times text-xs"></i>
          </button>
        </span>
      </div>
    </div>
    -->
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CSV_FILE_LIST } from '@/types/csv-data'
import type { GameDataItem } from '@/types/game-data'
import { useGameDataStore } from '@/stores/gameData'

interface Props {
  itemsByGameFeature: Record<string, GameDataItem[]>
  totalItems: number
  selectedGameFeature: string | null
  selectedFile: string | null
  searchQuery: string
}

interface Emits {
  (e: 'update:selectedGameFeature', gameFeature: string | null): void
  (e: 'update:selectedFile', file: string | null): void
  (e: 'update:searchQuery', query: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const gameData = useGameDataStore()

// State for expanded features
const expandedFeatures = ref<string[]>([])

const hasActiveFilters = computed(() => 
  props.selectedGameFeature !== null || props.selectedFile !== null || props.searchQuery !== ''
)

const gameFeatures = computed(() => {
  // Define the desired order for game features
  const order = ['Farm', 'Tower', 'Adventure', 'Combat', 'Town', 'Forge', 'Mining', 'General']
  
  // Return features in the specified order, only including ones that exist
  return order.filter(feature => props.itemsByGameFeature[feature] !== undefined)
})

const getGameFeatureIcon = (gameFeature: string) => {
  switch (gameFeature) {
    case 'Farm': return 'fas fa-seedling'
    case 'Town': return 'fas fa-city'
    case 'Adventure': return 'fas fa-map'
    case 'Combat': return 'fas fa-shield-alt'
    case 'Forge': return 'fas fa-hammer'
    case 'Mining': return 'fas fa-tools'
    case 'Tower': return 'fas fa-building'
    case 'General': return 'fas fa-cogs'
    default: return 'fas fa-cog'
  }
}

const getCategoryBadgeClass = (category: string) => {
  switch (category) {
    case 'Actions': return 'bg-blue-100 text-blue-800'
    case 'Data': return 'bg-green-100 text-green-800'
    case 'Unlocks': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getFilesForGameFeature = (gameFeature: string) => {
  return CSV_FILE_LIST.filter(file => file.gameFeature === gameFeature)
}

const getItemCountForFile = (filename: string) => {
  // Check if this is a specialized file
  const fileMetadata = CSV_FILE_LIST.find(f => f.filename === filename)
  if (!fileMetadata) return 0
  
  if (!fileMetadata.hasUnifiedSchema) {
    // For specialized files, get count from store's specialized data
    return gameData.getSpecializedRowCount(filename)
  }
  
  // For unified files, count items normally
  const items = props.itemsByGameFeature[fileMetadata.gameFeature] || []
  return items.filter(item => item.sourceFile === filename).length
}

const getFileDisplayName = (filename: string) => {
  const file = CSV_FILE_LIST.find(f => f.filename === filename)
  return file?.displayName || filename
}

const selectGameFeature = (gameFeature: string | null, file: string | null) => {
  emit('update:selectedGameFeature', gameFeature)
  emit('update:selectedFile', file)
}

const toggleGameFeature = (gameFeature: string) => {
  if (expandedFeatures.value.includes(gameFeature)) {
    // Collapse
    expandedFeatures.value = expandedFeatures.value.filter(f => f !== gameFeature)
    // If this was selected, select the feature but clear the file
    if (props.selectedGameFeature === gameFeature && props.selectedFile) {
      emit('update:selectedFile', null)
    }
  } else {
    // Expand
    expandedFeatures.value.push(gameFeature)
  }
  
  // Select this game feature
  emit('update:selectedGameFeature', gameFeature)
  if (gameFeature !== props.selectedGameFeature) {
    // Clear file when switching features
    emit('update:selectedFile', null)
  }
}

const clearGameFeature = () => {
  emit('update:selectedGameFeature', null)
  emit('update:selectedFile', null)
}

const clearFile = () => {
  emit('update:selectedFile', null)
}

const clearSearch = () => {
  emit('update:searchQuery', '')
}

// Watch for search query changes
watch(() => props.searchQuery, (newQuery) => {
  // If we have a search query, clear selection to show all results
  if (newQuery && props.selectedGameFeature) {
    emit('update:selectedGameFeature', null)
    emit('update:selectedFile', null)
  }
})

// Auto-expand the selected game feature
watch(() => props.selectedGameFeature, (newFeature) => {
  if (newFeature && !expandedFeatures.value.includes(newFeature)) {
    expandedFeatures.value.push(newFeature)
  }
})
</script>