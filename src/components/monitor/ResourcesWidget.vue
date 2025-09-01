<!-- Resources Widget - Compact Multi-Column Layout -->
<template>
  <BaseWidget title="Resources" icon="fas fa-coins">
    <div class="flex flex-col h-full">
      <!-- Primary Resources (top compact section) -->
      <div class="primary-resources mb-3">
        <!-- Row 1: Energy and Gold -->
        <div class="resource-pair mb-2">
          <div class="flex-1">
            <div class="flex justify-between items-center mb-1">
              <span class="flex items-center text-xs">
                <i class="fas fa-bolt text-yellow-400 mr-1"></i>
                Energy
              </span>
              <span class="font-mono text-xs">{{ energy.current }}/{{ energy.max }}</span>
            </div>
            <div class="w-full bg-sim-background-darker rounded-full h-1">
              <div 
                class="h-1 rounded-full transition-all duration-500"
                :class="getEnergyColor(energyPercent)"
                :style="{ width: `${energyPercent}%` }"
              ></div>
            </div>
          </div>
          <div class="w-px bg-sim-border mx-2"></div>
          <div class="flex-1">
            <div class="flex justify-between items-center">
              <span class="flex items-center text-xs">
                <i class="fas fa-coins text-yellow-500 mr-1"></i>
                Gold
              </span>
              <span class="font-mono text-xs">{{ formatNumber(resources.gold) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Row 2: Water and Total Seeds -->
        <div class="resource-pair">
          <div class="flex-1">
            <div class="flex justify-between items-center mb-1">
              <span class="flex items-center text-xs">
                <i class="fas fa-tint text-blue-400 mr-1"></i>
                Water
              </span>
              <span class="font-mono text-xs">{{ water.current }}/{{ water.max }}</span>
            </div>
            <div class="w-full bg-sim-background-darker rounded-full h-1">
              <div 
                class="h-1 bg-blue-500 rounded-full transition-all duration-500"
                :style="{ width: `${waterPercent}%` }"
              ></div>
            </div>
          </div>
          <div class="w-px bg-sim-border mx-2"></div>
          <div class="flex-1">
            <div class="flex justify-between items-center">
              <span class="flex items-center text-xs">
                <i class="fas fa-seedling text-green-400 mr-1"></i>
                Seeds
              </span>
              <span class="font-mono text-xs">{{ totalSeeds }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Bottom Split: Seeds and Materials (scrollable sections) -->
      <div class="flex-1 flex gap-2 min-h-0">
        <!-- Seeds Section (Left) -->
        <div class="flex-1 flex flex-col">
          <div class="section-header text-xs font-semibold text-green-400 mb-2">
            Seeds ({{ seedTypes.length }} types)
          </div>
          <div class="flex-1 overflow-y-auto bg-sim-background-darker rounded p-2">
            <div v-if="hasSeeds" class="space-y-1">
              <div 
                v-for="seed in seedTypes" 
                :key="seed.type"
                class="flex justify-between items-center text-xs py-1 px-1 hover:bg-sim-background rounded"
              >
                <span class="capitalize">{{ seed.type }}</span>
                <span class="font-mono text-green-400">{{ seed.count }}</span>
              </div>
            </div>
            <div v-else class="text-xs text-sim-text-secondary text-center py-4">
              No seeds available
            </div>
          </div>
        </div>

        <!-- Materials Section (Right) -->
        <div class="flex-1 flex flex-col">
          <div class="section-header text-xs font-semibold text-purple-400 mb-2">
            Materials ({{ materialCount }})
          </div>
          <div class="flex-1 overflow-y-auto bg-sim-background-darker rounded p-2">
            <div v-if="hasMaterials" class="space-y-1">
              <div 
                v-for="material in allMaterials" 
                :key="material.type"
                class="flex justify-between items-center text-xs py-1 px-1 hover:bg-sim-background rounded"
              >
                <span class="capitalize">{{ material.type }}</span>
                <span class="font-mono text-purple-400">{{ material.count }}</span>
              </div>
            </div>
            <div v-else class="text-xs text-sim-text-secondary text-center py-4">
              No materials available
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseWidget>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseWidget from './BaseWidget.vue'
import type { GameState } from '@/types'
import type { WidgetResources } from '@/utils/WidgetDataAdapter'

interface Props {
  gameState: GameState | null
  widgetResources?: WidgetResources
}

const props = defineProps<Props>()

// Reactive state - no longer needed as sections are always expanded

const resources = computed(() => {
  // Use transformed widget data if available (new event-driven approach)
  if (props.widgetResources) {
    console.log('🔄 ResourcesWidget: Using transformed widget data', {
      energy: props.widgetResources.energy.current,
      gold: props.widgetResources.gold,
      seedTypes: Object.keys(props.widgetResources.seeds).length,
      materialTypes: Object.keys(props.widgetResources.materials).length
    })
    return props.widgetResources
  }
  
  // Fallback to old format for backward compatibility
  console.log('⚠️ ResourcesWidget: Using fallback gameState resources')
  return props.gameState?.resources || {
    energy: { current: 0, max: 100, regenerationRate: 1 },
    gold: 0,
    water: { current: 0, max: 100, autoGenRate: 10 },
    seeds: {},
    materials: {}
  }
})

const energy = computed(() => resources.value.energy)
const water = computed(() => resources.value.water)

const energyPercent = computed(() => {
  return energy.value.max > 0 ? (energy.value.current / energy.value.max) * 100 : 0
})

const waterPercent = computed(() => {
  return water.value.max > 0 ? (water.value.current / water.value.max) * 100 : 0
})

const getEnergyColor = (percent: number): string => {
  if (percent > 60) return 'bg-green-500'
  if (percent > 30) return 'bg-yellow-500'
  return 'bg-red-500'
}

// Real seed and material data from game state or transformed widget data
const totalSeeds = computed(() => {
  const seedsData = resources.value.seeds
  if (!seedsData || typeof seedsData !== 'object') return 0
  
  // Handle both Map and plain object formats
  if (seedsData instanceof Map) {
    return Array.from(seedsData.values()).reduce((sum: number, count: number) => sum + count, 0)
  }
  return Object.values(seedsData).reduce((sum: number, count: number) => sum + count, 0)
})

const seedTypes = computed(() => {
  const seedsData = resources.value.seeds
  if (!seedsData || typeof seedsData !== 'object') return []
  
  // Handle both Map and plain object formats
  let entries: [string, number][]
  if (seedsData instanceof Map) {
    entries = Array.from(seedsData.entries())
  } else {
    entries = Object.entries(seedsData) as [string, number][]
  }
  
  return entries
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count) // Sort by count descending
})

const materialCount = computed(() => {
  const materialsData = resources.value.materials
  if (!materialsData || typeof materialsData !== 'object') return 0
  
  // Handle both Map and plain object formats
  if (materialsData instanceof Map) {
    return Array.from(materialsData.values()).reduce((sum: number, count: number) => sum + count, 0)
  }
  return Object.values(materialsData).reduce((sum: number, count: number) => sum + count, 0)
})

const topMaterials = computed(() => {
  const materialsData = resources.value.materials
  if (!materialsData || typeof materialsData !== 'object') return []
  
  // Handle both Map and plain object formats
  let entries: [string, number][]
  if (materialsData instanceof Map) {
    entries = Array.from(materialsData.entries())
  } else {
    entries = Object.entries(materialsData) as [string, number][]
  }
  
  return entries
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count) // Sort by count descending
    .slice(0, 3) // Top 3 materials
})

// New computed properties for compact layout
const allMaterials = computed(() => {
  const materialsData = resources.value.materials
  if (!materialsData || typeof materialsData !== 'object') return []
  
  // Handle both Map and plain object formats
  let entries: [string, number][]
  if (materialsData instanceof Map) {
    entries = Array.from(materialsData.entries())
  } else {
    entries = Object.entries(materialsData) as [string, number][]
  }
  
  return entries
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count) // Sort by count descending
})

const hasMaterials = computed(() => allMaterials.value.length > 0)

const hasSeeds = computed(() => seedTypes.value.length > 0)

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}
</script>

<style scoped>
.resource-pair {
  display: flex;
  align-items: center;
}

.section-header {
  user-select: none;
}

/* Scrollable sections styling */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Ensure full height utilization */
.h-full {
  height: 100%;
}

.flex-1 {
  flex: 1;
  min-height: 0;
}
</style>
