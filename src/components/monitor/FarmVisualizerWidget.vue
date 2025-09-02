<!-- Farm Visualizer Widget - Stage-Based Layout -->
<template>
  <BaseWidget title="Farm Visualizer" icon="fas fa-seedling">
    <div class="bg-sim-background rounded p-3">
      <div class="flex gap-4 items-start">
        <!-- Left side: Farm Grid with separate stage titles -->
        <div class="flex-1 flex gap-3">
          <!-- Stage Labels Column -->
          <div class="stage-labels w-32 flex-shrink-0">
            <div class="stage-label text-xs font-semibold text-green-400">Starter Plot</div>
            <div class="stage-label text-xs font-semibold text-blue-400">Small Hold</div>
            <div class="stage-label text-xs font-semibold text-purple-400">Homestead</div>
            <div class="stage-label text-xs font-semibold text-orange-400">Manor Grounds</div>
            <div class="stage-label text-xs font-semibold text-yellow-400">Great Estate</div>
          </div>
          
          <!-- Plots Grid Column -->
          <div class="plots-grid flex-1">
            <!-- Stage 1: Starter Plot - 8 plots -->
            <div class="farm-row stage-1">
              <PlotCell 
                v-for="i in 8" 
                :key="`s1-${i}`" 
                :plot="getPlot(i-1)" 
                :unlocked="plotCount >= i"
              />
            </div>
            
            <!-- Stage 2: Small Hold - 12 plots -->
            <div class="farm-row stage-2">
              <PlotCell 
                v-for="i in 12" 
                :key="`s2-${i}`" 
                :plot="getPlot(i+7)" 
                :unlocked="plotCount >= i+8"
              />
            </div>
            
            <!-- Stage 3: Homestead - 20 plots -->
            <div class="farm-row stage-3">
              <PlotCell 
                v-for="i in 20" 
                :key="`s3-${i}`" 
                :plot="getPlot(i+19)" 
                :unlocked="plotCount >= i+20"
              />
            </div>
            
            <!-- Stage 4: Manor Grounds - 25 plots -->
            <div class="farm-row stage-4">
              <PlotCell 
                v-for="i in 25" 
                :key="`s4-${i}`" 
                :plot="getPlot(i+39)" 
                :unlocked="plotCount >= i+40"
              />
            </div>
            
            <!-- Stage 5: Great Estate - 25 plots -->
            <div class="farm-row stage-5">
              <PlotCell 
                v-for="i in 25" 
                :key="`s5-${i}`" 
                :plot="getPlot(i+64)" 
                :unlocked="plotCount >= i+65"
              />
            </div>
            
            <!-- Legend -->
            <div class="farm-legend mt-3">
              <div class="legend-section">
                <div class="text-xs font-semibold text-sim-text mb-1">Status:</div>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <!-- Crop Status -->
                  <span class="flex items-center gap-1">
                    <div class="w-3 h-3 rounded bg-green-600"></div>
                    Ready
                  </span>
                  <span class="flex items-center gap-1">
                    <div class="w-3 h-3 rounded bg-yellow-500"></div>
                    Growing
                  </span>
                  <span class="flex items-center gap-1">
                    <div class="w-3 h-3 rounded bg-red-600"></div>
                    Withered
                  </span>
                  <span class="flex items-center gap-1">
                    <div class="w-3 h-3 rounded bg-gray-600 opacity-20"></div>
                    Locked
                  </span>
                  <!-- Water Status -->
                  <span class="flex items-center gap-1">
                    <div class="w-3 h-3 rounded bg-blue-300"></div>
                    Wet
                  </span>
                  <span class="flex items-center gap-1">
                    <div class="w-3 h-3 rounded bg-blue-200"></div>
                    Damp
                  </span>
                  <span class="flex items-center gap-1">
                    <div class="w-3 h-3 rounded bg-yellow-800"></div>
                    Dry
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right side: Farm Summary Stats -->
        <div class="w-32 bg-sim-background-darker rounded p-3">
          <div class="text-xs font-semibold mb-3 text-center">Farm Stats</div>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between items-center">
              <span class="text-sim-text-secondary">Ready:</span>
              <span class="font-mono text-green-400">{{ farmSummary.ready }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sim-text-secondary">Growing:</span>
              <span class="font-mono text-yellow-400">{{ farmSummary.growing }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sim-text-secondary">Empty:</span>
              <span class="font-mono text-gray-400">{{ farmSummary.empty }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sim-text-secondary">Locked:</span>
              <span class="font-mono text-gray-500">{{ farmSummary.locked }}</span>
            </div>
            <div class="border-t border-sim-border pt-2 mt-2">
              <div class="flex justify-between items-center">
                <span class="text-sim-text-secondary">Total:</span>
                <span class="font-mono">{{ farmSummary.totalPlots }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseWidget>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'
import BaseWidget from './BaseWidget.vue'
import type { GameState } from '@/types'

interface Props {
  gameState: GameState | null
  widgetFarmGrid?: any
}

const props = defineProps<Props>()

// PlotCell Component - displays individual farm plots
const PlotCell = defineComponent({
  props: {
    plot: Object,
    unlocked: Boolean
  },
  setup(props) {
    const plotClass = computed(() => {
      if (!props.unlocked) return 'locked'
      if (!props.plot) return 'empty'
      if (props.plot.state === 'ready') return 'ready'
      if (props.plot.state === 'growing') return 'growing'
      if (props.plot.state === 'withered') return 'withered'
      
      // Water-based coloring for empty plots
      if (props.plot.waterLevel > 0.7) return 'plot-wet'
      if (props.plot.waterLevel > 0.3) return 'plot-damp'
      return 'plot-dry'
    })
    
    const plotIcon = computed(() => {
      if (!props.unlocked) return '⬜'
      if (!props.plot) return '⬛'
      if (props.plot.state === 'ready') return '🟩'
      if (props.plot.state === 'growing') return '🌱'
      if (props.plot.state === 'withered') return '💀'
      
      // Water-based icons for empty plots
      if (props.plot.waterLevel > 0.3) return '🌊'
      return '🏜️'
    })
    
    const plotTooltip = computed(() => {
      if (!props.unlocked) return 'Locked - expand farm'
      if (!props.plot) return 'Empty plot'
      if (props.plot.crop) return `${props.plot.crop} - ${props.plot.progress}%`
      return 'Empty plot'
    })
    
    return () => h('div',
      {
        class: `plot-cell ${plotClass.value}`,
        title: plotTooltip.value
      },
      plotIcon.value
    )
  }
})

// Current plot count from game state
const plotCount = computed(() => {
  return props.widgetFarmGrid?.summary?.totalPlots || 
         props.gameState?.progression?.farmPlots || 4
})

// Get plot data by index  
const getPlot = (index: number) => {
  if (!props.widgetFarmGrid?.plots) return null
  return props.widgetFarmGrid.plots[index] || null
}

// Farm summary with fallback
const farmSummary = computed(() => {
  if (props.widgetFarmGrid?.summary) {
    return props.widgetFarmGrid.summary
  }
  
  // Fallback summary
  return {
    ready: 0,
    growing: 0,
    empty: plotCount.value,
    locked: Math.max(0, 90 - plotCount.value), // Total possible plots - current plots
    totalPlots: plotCount.value
  }
})
</script>

<style scoped>
.stage-labels {
  display: flex;
  flex-direction: column;
}

.stage-label {
  text-align: left;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding-right: 8px;
  padding-top: 4px;
  margin-bottom: 8px;
  min-height: 32px;
  display: flex;
  align-items: flex-start;
}

.plots-grid {
  display: flex;
  flex-direction: column;
}

.farm-row {
  display: flex;
  gap: 3px;
  justify-content: flex-start;
  flex-wrap: wrap;
  align-content: flex-start;
  min-height: 32px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.plot-cell {
  width: 24px;
  height: 24px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: help;
  border-radius: 3px;
  flex-shrink: 0;
}

.plot-cell.locked {
  opacity: 0.2;
}

.plot-cell.ready {
  background-color: #15803d;
}

.plot-cell.growing {
  background-color: #eab308;
}

.plot-cell.withered {
  background-color: #dc2626;
}

.plot-cell.plot-wet {
  background-color: #4FC3F7;
}

.plot-cell.plot-damp {
  background-color: #81D4FA;
}

.plot-cell.plot-dry {
  background-color: #8D6E63;
}

.plot-cell.watered {
  background-color: #3b82f6;
}

.plot-cell.dry {
  background-color: #a3a3a3;
}

.plot-cell.empty {
  background-color: #4b5563;
}

.farm-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.8em;
  margin-top: 16px;
}

.legend-section {
  display: flex;
  flex-direction: column;
}

.legend-section .flex {
  flex-wrap: wrap;
}
</style>
