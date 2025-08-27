<!-- Timeline Widget - Events across the day -->
<template>
  <BaseWidget title="Timeline" icon="fas fa-clock">
    <div class="space-y-3">
      <!-- Time Scale -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between text-xs text-sim-text-secondary mb-2">
          <span>6:00</span>
          <span>8:00</span>
          <span>10:00</span>
          <span>12:00</span>
          <span>14:00</span>
          <span>16:00</span>
          <span>18:00</span>
          <span>20:00</span>
        </div>
        
        <!-- Timeline Bar -->
        <div class="relative bg-sim-background-darker h-4 rounded">
          <!-- Progress Line -->
          <div class="absolute top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-gray-600"></div>
          
          <!-- Events -->
          <div class="absolute top-1/2 transform -translate-y-1/2 left-1/4 w-2 h-2 bg-green-400 rounded-full" title="Wake up"></div>
          <div class="absolute top-1/2 transform -translate-y-1/2 left-1/3 w-2 h-2 bg-blue-400 rounded-full" title="Check 1"></div>
          <div class="absolute top-1/2 transform -translate-y-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full" title="Purchase"></div>
          <div class="absolute top-1/2 transform -translate-y-1/2 left-2/3 w-3 h-3 bg-red-500 rounded-full animate-pulse" title="NOW"></div>
        </div>
        
        <!-- Event Labels -->
        <div class="flex justify-between text-xs text-sim-text-secondary mt-2">
          <span>Wake</span>
          <span>Check 1</span>
          <span>Buy</span>
          <span>NOW</span>
          <span>Dinner</span>
        </div>
      </div>

      <!-- Upcoming Events -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-calendar-check text-blue-400 mr-2"></i>
            Upcoming
          </span>
        </div>
        <div class="text-xs space-y-1">
          <div class="flex justify-between">
            <span>Check-in</span>
            <span class="text-sim-text-secondary">in 25 min</span>
          </div>
          <div class="flex justify-between">
            <span>Phase Transition</span>
            <span class="text-sim-text-secondary">in 2.3 days</span>
          </div>
        </div>
      </div>
    </div>
  </BaseWidget>
</template>

<script setup lang="ts">
import BaseWidget from './BaseWidget.vue'
import type { GameState } from '@/types'

interface Props {
  gameState: GameState | null
}

defineProps<Props>()
</script>
