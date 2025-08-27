<!-- Phase Progress Widget - Game progression bar -->
<template>
  <BaseWidget title="Game Phase Progress" icon="fas fa-chart-line">
    <div class="space-y-2">
      <!-- Compact Phase Timeline -->
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <div class="flex justify-between text-xs text-sim-text-secondary mb-1">
            <span>Tutorial</span>
            <span>Early</span>
            <span>Mid</span>
            <span>Late</span>
            <span>End</span>
          </div>
          
          <!-- Progress Bar -->
          <div class="h-2 bg-sim-background rounded-full overflow-hidden">
            <div 
              class="h-full transition-all duration-1000 bg-gradient-to-r from-green-500 to-blue-500"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>
        </div>
        
        <!-- Compact Info -->
        <div class="ml-4 text-right">
          <div class="text-sm font-semibold">{{ currentPhase?.name || 'Tutorial' }}</div>
          <div class="text-xs text-sim-text-secondary">Day {{ gameState?.time.day || 0 }} • {{ progressPercent.toFixed(1) }}%</div>
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
