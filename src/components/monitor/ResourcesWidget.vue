<!-- Resources Widget - Energy/gold/water/seeds display -->
<template>
  <BaseWidget title="Resources" icon="fas fa-coins">
    <div class="space-y-2">
      <!-- Energy -->
      <div class="bg-sim-background rounded p-2">
        <div class="flex justify-between items-center mb-1">
          <span class="flex items-center text-sm">
            <i class="fas fa-bolt text-yellow-400 mr-1"></i>
            Energy
          </span>
          <span class="font-mono text-sm">{{ energy.current }}/{{ energy.max }}</span>
        </div>
        <div class="w-full bg-sim-background-darker rounded-full h-1.5">
          <div 
            class="h-1.5 rounded-full transition-all duration-500"
            :class="getEnergyColor(energyPercent)"
            :style="{ width: `${energyPercent}%` }"
          ></div>
        </div>
      </div>

      <!-- Gold -->
      <div class="bg-sim-background rounded p-2">
        <div class="flex justify-between items-center">
          <span class="flex items-center text-sm">
            <i class="fas fa-coins text-yellow-500 mr-1"></i>
            Gold
          </span>
          <span class="font-mono text-sm">{{ formatNumber(resources.gold) }}</span>
        </div>
      </div>

      <!-- Water -->
      <div class="bg-sim-background rounded p-2">
        <div class="flex justify-between items-center mb-1">
          <span class="flex items-center text-sm">
            <i class="fas fa-tint text-blue-400 mr-1"></i>
            Water
          </span>
          <span class="font-mono text-sm">{{ water.current }}/{{ water.max }}</span>
        </div>
        <div class="w-full bg-sim-background-darker rounded-full h-1.5">
          <div 
            class="h-1.5 bg-blue-500 rounded-full transition-all duration-500"
            :style="{ width: `${waterPercent}%` }"
          ></div>
        </div>
      </div>

      <!-- Seeds -->
      <div class="bg-sim-background rounded p-2">
        <div class="flex justify-between items-center mb-1">
          <span class="flex items-center text-sm">
            <i class="fas fa-seedling text-green-400 mr-1"></i>
            Seeds
          </span>
          <span class="font-mono text-sm">{{ totalSeeds }} total</span>
        </div>
        
        <!-- Seed breakdown -->
        <div v-if="seedTypes.length > 0" class="text-xs space-y-1">
          <div 
            v-for="seed in seedTypes.slice(0, 4)" 
            :key="seed.type"
            class="flex justify-between"
          >
            <span class="capitalize">{{ seed.type }}:</span>
            <span class="font-mono">{{ seed.count }}</span>
          </div>
          <div v-if="seedTypes.length > 4" class="text-sim-text-secondary">
            +{{ seedTypes.length - 4 }} more types
          </div>
        
        <div v-if="seedTypes.length === 0" class="text-xs text-sim-text-secondary">
          No seeds in inventory
        </div>
        </div>
      </div>

      <!-- Materials -->
      <div class="bg-sim-background rounded p-2">
        <div class="flex justify-between items-center mb-1">
          <span class="flex items-center text-sm">
            <i class="fas fa-cube text-purple-400 mr-1"></i>
            Materials
          </span>
          <span class="font-mono text-sm">{{ materialCount }} items</span>
        </div>
        
        <div v-if="topMaterials.length > 0" class="text-xs space-y-1">
          <div 
            v-for="material in topMaterials" 
            :key="material.type"
            class="flex justify-between"
          >
            <span class="capitalize">{{ material.type }}:</span>
            <span class="font-mono">{{ material.count }}</span>
          </div>
        
        <div v-if="topMaterials.length === 0" class="text-xs text-sim-text-secondary">
          No materials in inventory
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
