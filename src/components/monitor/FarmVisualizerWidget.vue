<!-- Farm Visualizer Widget - Grid of farm plots -->
<template>
  <BaseWidget title="Farm Visualizer" icon="fas fa-seedling">
    <div class="space-y-3">
      <!-- Farm Grid Placeholder -->
      <div class="bg-sim-background rounded p-3">
        <div class="grid grid-cols-10 gap-0.5 mb-3">
          <div 
            v-for="plot in 20" 
            :key="plot"
            class="w-8 h-8 bg-sim-background-darker rounded text-xs flex items-center justify-center border"
            :class="getPlotClass(plot)"
          >
            <span class="text-xs">{{ getPlotIcon(plot) }}</span>
          </div>
        </div>
        
        <!-- Legend -->
        <div class="text-xs space-y-1">
          <div class="flex items-center gap-4">
            <span>🥕 = Ready</span>
            <span>🌱 = Growing</span>
            <span>🚫 = Locked</span>
            <span>👤 = Hero</span>
          </div>
        </div>
      </div>

      <!-- Farm Summary -->
      <div class="bg-sim-background rounded p-3">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div class="text-sim-text-secondary">Ready:</div>
            <div class="font-mono">3 crops</div>
          </div>
          <div>
            <div class="text-sim-text-secondary">Growing:</div>
            <div class="font-mono">7 crops</div>
          </div>
          <div>
            <div class="text-sim-text-secondary">Empty:</div>
            <div class="font-mono">10 plots</div>
          </div>
          <div>
            <div class="text-sim-text-secondary">Locked:</div>
            <div class="font-mono">10 plots</div>
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

// Mock plot states for demonstration
function getPlotClass(plot: number): string {
  if (plot <= 3) return 'bg-green-700'  // Ready crops
  if (plot <= 10) return 'bg-yellow-700'  // Growing
  if (plot <= 20) return 'bg-gray-600'  // Empty
  return 'bg-gray-800'  // Locked
}

function getPlotIcon(plot: number): string {
  if (plot === 5) return '👤'  // Hero position
  if (plot <= 3) return '🥕'  // Ready crops
  if (plot <= 10) return '🌱'  // Growing
  if (plot <= 20) return ''  // Empty
  return '🚫'  // Locked
}
</script>
