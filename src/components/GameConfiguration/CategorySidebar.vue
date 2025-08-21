<template>
  <div class="bg-sim-surface rounded-lg p-4 h-full">
    <h3 class="text-lg font-semibold mb-4 text-sim-primary">Data Categories</h3>
    
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

    <!-- Category List -->
    <div class="space-y-1 overflow-y-auto max-h-96">
      <!-- All Items -->
      <button
        @click="selectCategory(null)"
        :class="[
          'w-full text-left px-3 py-2 rounded-md transition-colors',
          selectedCategory === null 
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

      <!-- Categories -->
      <div v-for="[category, items] in Object.entries(itemsByCategory)" :key="category">
        <button
          @click="selectCategory(category)"
          :class="[
            'w-full text-left px-3 py-2 rounded-md transition-colors',
            selectedCategory === category
              ? 'bg-sim-primary text-white'
              : 'hover:bg-sim-muted hover:bg-opacity-10'
          ]"
        >
          <div class="flex items-center justify-between">
            <span class="flex items-center">
              <i :class="getCategoryIcon(category)" class="mr-2"></i>
              {{ getCategoryDisplayName(category) }}
            </span>
            <span class="text-xs opacity-75">{{ items.length }}</span>
          </div>
        </button>

        <!-- Sub-categories (Types within category) -->
        <div v-if="selectedCategory === category && getTypesForCategory(category).length > 1" class="ml-4 mt-1 space-y-1">
          <button
            v-for="type in getTypesForCategory(category)"
            :key="type"
            @click="selectType(type)"
            :class="[
              'w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors',
              selectedType === type
                ? 'bg-sim-accent text-white'
                : 'hover:bg-sim-muted hover:bg-opacity-10'
            ]"
          >
            <div class="flex items-center justify-between">
              <span class="capitalize">{{ type || 'Unknown' }}</span>
              <span class="text-xs opacity-75">{{ getItemCountForType(category, type) }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Filter Summary -->
    <div v-if="hasActiveFilters" class="mt-4 pt-4 border-t border-sim-border">
      <div class="text-xs text-sim-muted mb-2">Active Filters:</div>
      <div class="flex flex-wrap gap-1">
        <span v-if="selectedCategory" class="inline-flex items-center px-2 py-1 bg-sim-primary bg-opacity-20 text-sim-primary rounded text-xs">
          {{ getCategoryDisplayName(selectedCategory) }}
          <button @click="clearCategory" class="ml-1 hover:bg-sim-primary hover:text-white rounded-full w-4 h-4 flex items-center justify-center">
            <i class="fas fa-times text-xs"></i>
          </button>
        </span>
        <span v-if="selectedType" class="inline-flex items-center px-2 py-1 bg-sim-accent bg-opacity-20 text-sim-accent rounded text-xs">
          {{ selectedType }}
          <button @click="clearType" class="ml-1 hover:bg-sim-accent hover:text-white rounded-full w-4 h-4 flex items-center justify-center">
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
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { GameDataItem } from '@/types/game-data'

interface Props {
  itemsByCategory: Record<string, GameDataItem[]>
  totalItems: number
  selectedCategory: string | null
  selectedType: string | null
  searchQuery: string
}

interface Emits {
  (e: 'update:selectedCategory', category: string | null): void
  (e: 'update:selectedType', type: string | null): void
  (e: 'update:searchQuery', query: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const hasActiveFilters = computed(() => 
  props.selectedCategory !== null || props.selectedType !== null || props.searchQuery !== ''
)

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Actions': return 'fas fa-tools'
    case 'Data': return 'fas fa-database'
    case 'Unlocks': return 'fas fa-unlock-alt'
    default: return 'fas fa-folder'
  }
}

const getCategoryDisplayName = (category: string) => {
  switch (category) {
    case 'Actions': return 'Actions'
    case 'Data': return 'Core Data'
    case 'Unlocks': return 'Unlocks'
    default: return category
  }
}

const getTypesForCategory = (category: string) => {
  const items = props.itemsByCategory[category] || []
  const types = new Set(items.map(item => item.type).filter(Boolean))
  return Array.from(types).sort()
}

const getItemCountForType = (category: string, type: string) => {
  const items = props.itemsByCategory[category] || []
  return items.filter(item => item.type === type).length
}

const selectCategory = (category: string | null) => {
  emit('update:selectedCategory', category)
  if (category !== props.selectedCategory) {
    // Clear type when switching categories
    emit('update:selectedType', null)
  }
}

const selectType = (type: string) => {
  emit('update:selectedType', type)
}

const clearCategory = () => {
  emit('update:selectedCategory', null)
  emit('update:selectedType', null)
}

const clearType = () => {
  emit('update:selectedType', null)
}

const clearSearch = () => {
  emit('update:searchQuery', '')
}

// Watch for search query changes
watch(() => props.searchQuery, (newQuery) => {
  // If we have a search query, clear category selection to show all results
  if (newQuery && props.selectedCategory) {
    emit('update:selectedCategory', null)
    emit('update:selectedType', null)
  }
})
</script>
