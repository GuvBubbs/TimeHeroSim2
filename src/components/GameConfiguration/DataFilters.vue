<template>
  <div class="bg-sim-surface rounded-lg p-4">
    <h3 class="text-lg font-semibold mb-4 text-sim-primary">Filters</h3>
    
    <div class="space-y-4">
      <!-- Level Range -->
      <div>
        <label class="block text-sm font-medium text-sim-foreground mb-2">Level Range</label>
        <div class="grid grid-cols-2 gap-2">
          <div>
                    <input
          :value="localFilters.minLevel"
          @input="localFilters.minLevel = parseFloat(($event.target as HTMLInputElement).value) || undefined"
          type="number"
          placeholder="Min"
          min="1"
          max="20"
          class="w-full px-3 py-2 border border-sim-border rounded-md bg-sim-background text-sim-foreground focus:outline-none focus:ring-2 focus:ring-sim-primary focus:border-transparent"
        />
          </div>
          <div>
                    <input
          :value="localFilters.maxLevel"
          @input="localFilters.maxLevel = parseFloat(($event.target as HTMLInputElement).value) || undefined"
          type="number"
          placeholder="Max"
          min="1"
          max="20"
          class="w-full px-3 py-2 border border-sim-border rounded-md bg-sim-background text-sim-foreground focus:outline-none focus:ring-2 focus:ring-sim-primary focus:border-transparent"
        />
          </div>
        </div>
      </div>

      <!-- Cost Range -->
      <div>
        <label class="block text-sm font-medium text-sim-foreground mb-2">Gold Cost Range</label>
        <div class="grid grid-cols-2 gap-2">
          <div>
                    <input
          :value="localFilters.minGoldCost"
          @input="localFilters.minGoldCost = parseFloat(($event.target as HTMLInputElement).value) || undefined"
          type="number"
          placeholder="Min Gold"
          min="0"
          class="w-full px-3 py-2 border border-sim-border rounded-md bg-sim-background text-sim-foreground focus:outline-none focus:ring-2 focus:ring-sim-primary focus:border-transparent"
        />
          </div>
          <div>
                    <input
          :value="localFilters.maxGoldCost"
          @input="localFilters.maxGoldCost = parseFloat(($event.target as HTMLInputElement).value) || undefined"
          type="number"
          placeholder="Max Gold"
          min="0"
          class="w-full px-3 py-2 border border-sim-border rounded-md bg-sim-background text-sim-foreground focus:outline-none focus:ring-2 focus:ring-sim-primary focus:border-transparent"
        />
          </div>
        </div>
      </div>

      <!-- Prerequisites -->
      <div>
        <label class="block text-sm font-medium text-sim-foreground mb-2">Prerequisites</label>
        <select
          :value="localFilters.hasPrerequisites"
          @change="localFilters.hasPrerequisites = ($event.target as HTMLSelectElement).value === 'true' ? true : ($event.target as HTMLSelectElement).value === 'false' ? false : undefined"
          class="w-full px-3 py-2 border border-sim-border rounded-md bg-sim-background text-sim-foreground focus:outline-none focus:ring-2 focus:ring-sim-primary focus:border-transparent"
        >
          <option :value="undefined">All Items</option>
          <option :value="true">Has Prerequisites</option>
          <option :value="false">No Prerequisites</option>
        </select>
      </div>

      <!-- Source File -->
      <div v-if="availableFiles.length > 0">
        <label class="block text-sm font-medium text-sim-foreground mb-2">Source File</label>
        <select
          :value="localFilters.sourceFile"
          @change="localFilters.sourceFile = ($event.target as HTMLSelectElement).value"
          class="w-full px-3 py-2 border border-sim-border rounded-md bg-sim-background text-sim-foreground focus:outline-none focus:ring-2 focus:ring-sim-primary focus:border-transparent"
        >
          <option value="">All Files</option>
          <option v-for="file in availableFiles" :key="file" :value="file">
            {{ getFileDisplayName(file) }}
          </option>
        </select>
      </div>

      <!-- Has Costs -->
      <div>
        <label class="block text-sm font-medium text-sim-foreground mb-2">Item Properties</label>
        <div class="space-y-2">
          <label class="flex items-center text-sm">
            <input
              :checked="localFilters.hasGoldCost"
              @change="localFilters.hasGoldCost = ($event.target as HTMLInputElement).checked"
              type="checkbox"
              class="mr-2 rounded border-sim-border text-sim-primary focus:ring-sim-primary"
            />
            Has Gold Cost
          </label>
          <label class="flex items-center text-sm">
            <input
              :checked="localFilters.hasEnergyCost"
              @change="localFilters.hasEnergyCost = ($event.target as HTMLInputElement).checked"
              type="checkbox"
              class="mr-2 rounded border-sim-border text-sim-primary focus:ring-sim-primary"
            />
            Has Energy Cost
          </label>
          <label class="flex items-center text-sm">
            <input
              :checked="localFilters.hasMaterialsCost"
              @change="localFilters.hasMaterialsCost = ($event.target as HTMLInputElement).checked"
              type="checkbox"
              class="mr-2 rounded border-sim-border text-sim-primary focus:ring-sim-primary"
            />
            Has Materials Cost
          </label>
          <label class="flex items-center text-sm">
            <input
              :checked="localFilters.isRepeatable"
              @change="localFilters.isRepeatable = ($event.target as HTMLInputElement).checked"
              type="checkbox"
              class="mr-2 rounded border-sim-border text-sim-primary focus:ring-sim-primary"
            />
            Is Repeatable
          </label>
        </div>
      </div>
    </div>

    <!-- Filter Actions -->
    <div class="mt-6 pt-4 border-t border-sim-border flex space-x-2">
      <button
        @click="applyFilters"
        class="flex-1 px-4 py-2 bg-sim-primary text-white rounded-md hover:bg-sim-primary-dark transition-colors"
      >
        <i class="fas fa-filter mr-2"></i>
        Apply Filters
      </button>
      <button
        @click="clearFilters"
        class="px-4 py-2 border border-sim-border rounded-md hover:bg-sim-muted hover:bg-opacity-10 transition-colors"
      >
        <i class="fas fa-times mr-2"></i>
        Clear
      </button>
    </div>

    <!-- Active Filters Summary -->
    <div v-if="hasActiveFilters" class="mt-4 pt-4 border-t border-sim-border">
      <div class="text-sm font-medium text-sim-foreground mb-2">Active Filters:</div>
      <div class="space-y-1 text-xs text-sim-muted">
        <div v-if="appliedFilters.minLevel || appliedFilters.maxLevel">
          Level: {{ appliedFilters.minLevel || 'Any' }} - {{ appliedFilters.maxLevel || 'Any' }}
        </div>
        <div v-if="appliedFilters.minGoldCost || appliedFilters.maxGoldCost">
          Gold: {{ appliedFilters.minGoldCost || 'Any' }} - {{ appliedFilters.maxGoldCost || 'Any' }}
        </div>
        <div v-if="appliedFilters.hasPrerequisites !== undefined">
          Prerequisites: {{ appliedFilters.hasPrerequisites ? 'Required' : 'None' }}
        </div>
        <div v-if="appliedFilters.sourceFile">
          File: {{ getFileDisplayName(appliedFilters.sourceFile) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DataFilter } from '@/types/game-data'

interface ExtendedDataFilter extends DataFilter {
  minGoldCost?: number
  maxGoldCost?: number
  sourceFile?: string
  hasGoldCost?: boolean
  hasEnergyCost?: boolean
  hasMaterialsCost?: boolean
  isRepeatable?: boolean
}

interface Props {
  filters: ExtendedDataFilter
  availableFiles: string[]
}

interface Emits {
  (e: 'update:filters', filters: ExtendedDataFilter): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local filter state for form inputs
const localFilters = ref<ExtendedDataFilter>({ ...props.filters })
const appliedFilters = ref<ExtendedDataFilter>({ ...props.filters })

const hasActiveFilters = computed(() => {
  const filters = appliedFilters.value
  return !!(
    filters.minLevel ||
    filters.maxLevel ||
    filters.minGoldCost ||
    filters.maxGoldCost ||
    filters.hasPrerequisites !== undefined ||
    filters.sourceFile ||
    filters.hasGoldCost ||
    filters.hasEnergyCost ||
    filters.hasMaterialsCost ||
    filters.isRepeatable
  )
})

const getFileDisplayName = (filename: string) => {
  // Remove .csv extension and make it more readable
  return filename.replace('.csv', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const applyFilters = () => {
  appliedFilters.value = { ...localFilters.value }
  emit('update:filters', appliedFilters.value)
}

const clearFilters = () => {
  const emptyFilters: ExtendedDataFilter = {}
  localFilters.value = emptyFilters
  appliedFilters.value = emptyFilters
  emit('update:filters', emptyFilters)
}

// Watch for external filter changes
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
  appliedFilters.value = { ...newFilters }
}, { deep: true })
</script>
