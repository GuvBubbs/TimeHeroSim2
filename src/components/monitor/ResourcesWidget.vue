<!-- Resources Widget - Energy/gold/water/seeds display -->
<template>
  <BaseWidget title="Resources" icon="fas fa-coins">
    <div class="space-y-3">
      <!-- Energy -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-bolt text-yellow-400 mr-2"></i>
            Energy
          </span>
          <span class="font-mono">{{ energy.current }}/{{ energy.max }}</span>
        </div>
        <div class="w-full bg-sim-background-darker rounded-full h-2">
          <div 
            class="h-2 rounded-full transition-all duration-500"
            :class="getEnergyColor(energyPercent)"
            :style="{ width: `${energyPercent}%` }"
          ></div>
        </div>
      </div>

      <!-- Gold -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center">
          <span class="flex items-center">
            <i class="fas fa-coins text-yellow-500 mr-2"></i>
            Gold
          </span>
          <span class="font-mono">{{ formatNumber(resources.gold) }}</span>
        </div>
      </div>

      <!-- Water -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-tint text-blue-400 mr-2"></i>
            Water
          </span>
          <span class="font-mono">{{ water.current }}/{{ water.max }}</span>
        </div>
        <div class="w-full bg-sim-background-darker rounded-full h-2">
          <div 
            class="h-2 bg-blue-500 rounded-full transition-all duration-500"
            :style="{ width: `${waterPercent}%` }"
          ></div>
        </div>
      </div>

      <!-- Seeds -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-seedling text-green-400 mr-2"></i>
            Seeds
          </span>
          <span class="font-mono">{{ totalSeeds }} total</span>
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
        </div>
        
        <div v-else class="text-xs text-sim-text-secondary">
          No seeds in inventory
        </div>
      </div>

      <!-- Materials (if any) -->
      <div v-if="materialCount > 0" class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-cube text-purple-400 mr-2"></i>
            Materials
          </span>
          <span class="font-mono">{{ materialCount }} items</span>
        </div>
        
        <div class="text-xs space-y-1">
          <div 
            v-for="material in topMaterials" 
            :key="material.type"
            class="flex justify-between"
          >
            <span class="capitalize">{{ material.type }}:</span>
            <span class="font-mono">{{ material.count }}</span>
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

interface Props {
  gameState: GameState | null
}

const props = defineProps<Props>()

const resources = computed(() => {
  return props.gameState?.resources || {
    energy: { current: 0, max: 100 },
    gold: 0,
    water: { current: 0, max: 100 }
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

// Mock seed and material data - in real implementation this would come from inventory
const totalSeeds = computed(() => {
  // TODO: Calculate from actual inventory
  return Math.floor(Math.random() * 100) + 20
})

const seedTypes = computed(() => {
  // TODO: Get from actual game state inventory
  const mockSeeds = [
    { type: 'carrot', count: 12 },
    { type: 'turnip', count: 8 },
    { type: 'beet', count: 5 },
    { type: 'potato', count: 15 }
  ]
  return mockSeeds.filter(seed => seed.count > 0)
})

const materialCount = computed(() => {
  // TODO: Calculate from actual inventory
  return Math.floor(Math.random() * 50) + 10
})

const topMaterials = computed(() => {
  // TODO: Get from actual game state inventory
  const mockMaterials = [
    { type: 'wood', count: 25 },
    { type: 'stone', count: 18 },
    { type: 'iron', count: 7 }
  ]
  return mockMaterials.slice(0, 3)
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
