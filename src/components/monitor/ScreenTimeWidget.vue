<!-- Screen Time Widget - Time distribution across screens -->
<template>
  <BaseWidget title="Screen Time" icon="fas fa-chart-pie">
    <div class="space-y-3">
      <!-- Screen Distribution -->
      <div class="bg-sim-background rounded p-3">
        <!-- Current Screen Only -->
        <div class="text-center py-4">
          <div v-if="props.widgetLocation?.currentScreen" class="space-y-2">
            <div class="text-lg font-semibold text-sim-accent">{{ props.widgetLocation.currentScreen }}</div>
            <div class="text-sm text-sim-text-secondary">Currently active screen</div>
            <div v-if="props.widgetLocation.timeOnScreen" class="text-xs text-sim-text-secondary">
              {{ Math.floor(props.widgetLocation.timeOnScreen / 60) }}m {{ props.widgetLocation.timeOnScreen % 60 }}s on screen
            </div>
          </div>
          <div v-else class="text-sm text-sim-text-secondary">
            No screen time data available
          </div>
        </div>
      </div>

      <!-- Trends -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-trending-up text-green-400 mr-2"></i>
            Trends
          </span>
        </div>
        <div class="text-xs text-sim-text-secondary text-center py-2">
          Trend data available after simulation runs longer
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
  widgetLocation?: any
  widgetTime?: any
}

const props = defineProps<Props>()
</script>
