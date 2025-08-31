<!-- Screen Time Widget - Time distribution across screens with aggregation -->
<template>
  <BaseWidget title="Screen Time" icon="fas fa-chart-pie">
    <div class="space-y-3">
      <!-- Current Screen -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-map-marker-alt text-sim-accent mr-2"></i>
            Current Screen
          </span>
        </div>
        <div class="text-center">
          <div class="text-lg font-semibold text-sim-accent">{{ currentScreen }}</div>
          <div class="text-sm text-sim-text-secondary">{{ formatDuration(currentScreenTime) }} this session</div>
          <div class="text-xs text-sim-text-secondary">{{ currentScreenVisits }} visits today</div>
        </div>
      </div>

      <!-- Time Distribution -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-3">
          <span class="flex items-center">
            <i class="fas fa-chart-bar text-green-400 mr-2"></i>
            Time Distribution
          </span>
        </div>
        <div class="space-y-2">
          <div 
            v-for="screen in screenStats" 
            :key="screen.screen"
            class="flex items-center gap-2"
          >
            <div class="w-12 text-xs text-sim-text-secondary">{{ screen.screen }}</div>
            <div class="flex-1 bg-sim-background-darker rounded-full h-2 relative overflow-hidden">
              <div 
                class="h-full transition-all duration-300"
                :class="getScreenColor(screen.screen)"
                :style="{ width: `${screen.percentage}%` }"
              ></div>
            </div>
            <div class="w-12 text-xs text-sim-text text-right">{{ screen.percentage }}%</div>
          </div>
        </div>
      </div>

      <!-- Visit Statistics -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-list-ol text-blue-400 mr-2"></i>
            Visit Stats
          </span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="text-center">
            <div class="text-sim-text-secondary">Most Visited</div>
            <div class="text-sim-text font-semibold">{{ trends.mostVisited }}</div>
          </div>
          <div class="text-center">
            <div class="text-sim-text-secondary">Switches/Hour</div>
            <div class="text-sim-text font-semibold">{{ trends.screenSwitchFrequency.toFixed(1) }}</div>
          </div>
        </div>
      </div>

      <!-- Session Summary -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-clock text-yellow-400 mr-2"></i>
            Session
          </span>
        </div>
        <div class="text-xs text-center">
          <div class="text-sim-text-secondary">Total Time: {{ formatDuration(trends.sessionDuration) }}</div>
          <div class="text-sim-text-secondary">Avg per Screen: {{ formatDuration(trends.averageSessionLength) }}</div>
        </div>
      </div>
    </div>
  </BaseWidget>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseWidget from './BaseWidget.vue'
import { ScreenTimeTracker, type GameScreen, type ScreenStats, type ScreenTimeTrends } from '@/utils/ScreenTimeTracker'
import type { GameState } from '@/types'

interface Props {
  gameState: GameState | null
  widgetLocation?: any
  widgetTime?: any
}

const props = defineProps<Props>()

// Create screen time tracker instance
const screenTracker = ref<ScreenTimeTracker>(new ScreenTimeTracker('farm', 0))

// Computed values based on current game state
const currentTime = computed(() => {
  return props.gameState?.time?.totalMinutes || 0
})

const currentScreen = computed(() => {
  return (props.gameState?.location?.currentScreen as GameScreen) || 'farm'
})

const currentScreenTime = computed(() => {
  return screenTracker.value.getCurrentScreenTime(currentTime.value)
})

const currentScreenVisits = computed(() => {
  const stats = screenTracker.value.getScreenStats(currentScreen.value, currentTime.value)
  return stats.visitsToday
})

const screenStats = computed(() => {
  return screenTracker.value.getAllScreenStats(currentTime.value)
    .filter(stat => stat.currentTime > 0) // Only show screens with time
    .sort((a, b) => b.currentTime - a.currentTime) // Sort by time descending
})

const trends = computed(() => {
  return screenTracker.value.getTrends(currentTime.value)
})

// Watch for screen changes
watch(currentScreen, (newScreen, oldScreen) => {
  if (newScreen !== oldScreen && oldScreen) {
    screenTracker.value.changeScreen(newScreen, currentTime.value)
  }
}, { immediate: true })

// Watch for time updates
watch(currentTime, (newTime) => {
  screenTracker.value.updateCurrentTime(newTime)
})

// Helper functions
const formatDuration = (minutes: number): string => {
  if (minutes < 1) return '< 1m'
  if (minutes < 60) return `${Math.floor(minutes)}m`
  
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  return `${hours}h ${mins}m`
}

const getScreenColor = (screen: GameScreen): string => {
  const colors: Record<GameScreen, string> = {
    farm: 'bg-green-500',
    tower: 'bg-blue-500',
    town: 'bg-purple-500',
    adventure: 'bg-red-500',
    forge: 'bg-orange-500',
    mine: 'bg-gray-500',
    menu: 'bg-yellow-500'
  }
  return colors[screen] || 'bg-gray-400'
}
</script>
