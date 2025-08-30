<!-- Farm Visualizer Widget - Grid of farm plots -->
<template>
  <BaseWidget title="Farm Visualizer" icon="fas fa-seedling">
    <div class="space-y-3">
      <!-- Farm Grid -->
      <div class="bg-sim-background rounded p-3">
        <div class="grid grid-cols-10 gap-0.5 mb-3" v-if="props.widgetFarmGrid?.plots">
          <div 
            v-for="plot in props.widgetFarmGrid.plots" 
            :key="plot.id"
            class="w-8 h-8 bg-sim-background-darker rounded text-xs flex items-center justify-center border"
            :class="getRealPlotClass(plot)"
          >
            <span class="text-xs">{{ getRealPlotIcon(plot) }}</span>
          </div>
        </div>
        <!-- Fallback when no data -->
        <div class="grid grid-cols-10 gap-0.5 mb-3" v-else>
          <div 
            v-for="plot in 20" 
            :key="plot"
            class="w-8 h-8 bg-sim-background-darker rounded text-xs flex items-center justify-center border bg-gray-600"
          >
            <span class="text-xs">🚫</span>
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
        <div class="grid grid-cols-2 gap-4 text-sm" v-if="props.widgetFarmGrid?.summary">
          <div>
            <div class="text-sim-text-secondary">Ready:</div>
            <div class="font-mono">{{ props.widgetFarmGrid.summary.ready }} crops</div>
          </div>
          <div>
            <div class="text-sim-text-secondary">Growing:</div>
            <div class="font-mono">{{ props.widgetFarmGrid.summary.growing }} crops</div>
          </div>
          <div>
            <div class="text-sim-text-secondary">Empty:</div>
            <div class="font-mono">{{ props.widgetFarmGrid.summary.empty }} plots</div>
          </div>
          <div>
            <div class="text-sim-text-secondary">Locked:</div>
            <div class="font-mono">{{ props.widgetFarmGrid.summary.locked }} plots</div>
          </div>
        </div>
        <!-- Fallback when no data -->
        <div class="grid grid-cols-2 gap-4 text-sm" v-else>
          <div>
            <div class="text-sim-text-secondary">Ready:</div>
            <div class="font-mono">0 crops</div>
          </div>
          <div>
            <div class="text-sim-text-secondary">Growing:</div>
            <div class="font-mono">0 crops</div>
          </div>
          <div>
            <div class="text-sim-text-secondary">Empty:</div>
            <div class="font-mono">0 plots</div>
          </div>
          <div>
            <div class="text-sim-text-secondary">Locked:</div>
            <div class="font-mono">0 plots</div>
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
  widgetFarmGrid?: any
}

const props = defineProps<Props>()

// Real plot states from simulation data
function getRealPlotClass(plot: any): string {
  switch (plot.state) {
    case 'ready': return 'bg-green-700'
    case 'growing': return 'bg-yellow-700'
    case 'empty': return 'bg-gray-600'
    case 'locked': return 'bg-gray-800'
    case 'withered': return 'bg-red-700'
    default: return 'bg-gray-600'
  }
}

function getRealPlotIcon(plot: any): string {
  // Check if hero is at this plot
  if (props.widgetFarmGrid?.heroPosition && 
      plot.position.x === props.widgetFarmGrid.heroPosition.x && 
      plot.position.y === props.widgetFarmGrid.heroPosition.y) {
    return '👤'
  }
  
  switch (plot.state) {
    case 'ready': return '🥕'
    case 'growing': return '🌱'
    case 'withered': return '💀'
    case 'empty': return ''
    case 'locked': return '🚫'
    default: return ''
  }
}

// Legacy mock functions (kept for fallback)
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
