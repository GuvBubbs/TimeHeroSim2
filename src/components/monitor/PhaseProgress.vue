<!-- Phase Progress Widget - Game progression bar -->
<template>
  <BaseWidget title="Game Phase Progress" icon="fas fa-chart-line">
    <div class="space-y-4">
      <!-- Phase Timeline -->
      <div class="relative">
        <div class="flex justify-between text-xs text-sim-text-secondary mb-2">
          <span>Tutorial</span>
          <span>Early</span>
          <span>Mid</span>
          <span>Late</span>
          <span>End</span>
        </div>
        
        <!-- Progress Bar -->
        <div class="h-3 bg-sim-background rounded-full overflow-hidden">
          <div 
            class="h-full transition-all duration-1000 bg-gradient-to-r from-green-500 to-blue-500"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
        
        <!-- Phase Markers -->
        <div class="flex justify-between mt-1">
          <div 
            v-for="(phase, index) in phases" 
            :key="phase.name"
            class="flex flex-col items-center"
            :class="{
              'text-sim-accent': currentPhaseIndex >= index,
              'text-sim-text-secondary': currentPhaseIndex < index
            }"
          >
            <div 
              class="w-2 h-2 rounded-full"
              :class="{
                'bg-sim-accent': currentPhaseIndex >= index,
                'bg-sim-text-secondary': currentPhaseIndex < index
              }"
            ></div>
          </div>
        </div>
      </div>
      
      <!-- Current Phase Info -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="font-semibold">{{ currentPhase?.name || 'Unknown' }}</span>
          <span class="text-sm text-sim-text-secondary">
            Day {{ gameState?.time.day || 0 }}
          </span>
        </div>
        
        <div class="text-sm text-sim-text-secondary">
          {{ currentPhase?.description || 'No phase information available' }}
        </div>
        
        <div class="mt-2 text-xs">
          <div class="flex justify-between">
            <span>Progress:</span>
            <span>{{ progressPercent.toFixed(1) }}%</span>
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

// Game phases configuration
const phases = [
  { name: 'Tutorial', description: 'Learning basic mechanics', maxDay: 3 },
  { name: 'Early', description: 'Establishing farm and basic tools', maxDay: 10 },
  { name: 'Mid', description: 'Expanding operations and combat', maxDay: 20 },
  { name: 'Late', description: 'Advanced upgrades and optimization', maxDay: 30 },
  { name: 'End', description: 'Final objectives and mastery', maxDay: 35 }
]

const currentPhaseIndex = computed(() => {
  if (!props.gameState) return 0
  
  const day = props.gameState.time.day
  for (let i = 0; i < phases.length; i++) {
    if (day <= phases[i].maxDay) {
      return i
    }
  }
  return phases.length - 1
})

const currentPhase = computed(() => {
  return phases[currentPhaseIndex.value]
})

const progressPercent = computed(() => {
  if (!props.gameState) return 0
  
  const day = props.gameState.time.day
  const maxDay = 35 // Total simulation length
  
  return Math.min((day / maxDay) * 100, 100)
})
</script>
