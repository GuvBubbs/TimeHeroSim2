<!-- Current Location Widget - Screen navigation display -->
<template>
  <BaseWidget title="Current Location" icon="fas fa-map-marker-alt">
    <div class="space-y-2">
      <!-- Cross-shaped Layout -->
      <!-- Row 1: Tower -->
      <div class="grid grid-cols-3 gap-1">
        <div></div>
        <div class="bg-sim-background rounded px-2 py-1.5 text-center border text-sm"
             :class="currentLocation === 'tower' ? 'bg-sim-accent text-white' : ''">
          Tower
        </div>
        <div></div>
      </div>
      
      <!-- Row 2: Town - Farm - Adventure -->
      <div class="grid grid-cols-3 gap-1">
        <div class="bg-sim-background rounded px-2 py-1.5 text-center border text-sm"
             :class="currentLocation === 'town' ? 'bg-sim-accent text-white' : ''">
          Town
        </div>
        <div class="bg-sim-background rounded px-2 py-1.5 text-center border text-sm relative"
             :class="currentLocation === 'farm' ? 'bg-sim-accent text-white' : ''">
          Farm <span class="ml-1">👤</span>
        </div>
        <div class="bg-sim-background rounded px-2 py-1.5 text-center border text-sm"
             :class="currentLocation === 'adventure' ? 'bg-sim-accent text-white' : ''">
          Adventure
        </div>
      </div>
      
      <!-- Row 3: Forge -->
      <div class="grid grid-cols-3 gap-1">
        <div></div>
        <div class="bg-sim-background rounded px-2 py-1.5 text-center border text-sm"
             :class="currentLocation === 'forge' ? 'bg-sim-accent text-white' : ''">
          Forge
        </div>
        <div></div>
      </div>
      
      <!-- Row 4: Mine -->
      <div class="grid grid-cols-3 gap-1">
        <div></div>
        <div class="bg-sim-background rounded px-2 py-1.5 text-center border text-sm"
             :class="currentLocation === 'mine' ? 'bg-sim-accent text-white' : ''">
          Mine
        </div>
        <div></div>
      </div>
      
      <!-- Location Stats -->
      <div class="bg-sim-background rounded p-2 space-y-1">
        <div class="flex justify-between text-xs">
          <span>Time here:</span>
          <span class="font-mono">{{ formatDuration(timeOnScreen) }}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span>Visits today:</span>
          <span class="font-mono">{{ visitsToday }}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span>Total visits:</span>
          <span class="font-mono">{{ totalVisits }}</span>
        </div>
      </div>
    </div>
  </BaseWidget>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GameState } from '@/types'
import BaseWidget from './BaseWidget.vue'

interface Props {
  gameState?: GameState | null
  widgetLocation?: any
}

const props = defineProps<Props>()

// Real location data from widget adapter or game state
const currentLocation = computed(() => {
  return props.widgetLocation?.currentScreen || 
         props.gameState?.location?.currentScreen || 'farm'
})

const hasHelper = computed(() => {
  return props.gameState?.helpers?.gnomes?.some(gnome => 
    gnome.isAssigned && gnome.currentTask !== null
  ) || false
})

// Real time and visit statistics
const timeOnScreen = computed(() => {
  return props.widgetLocation?.timeOnScreen || 
         props.gameState?.location?.timeOnScreen || 0
})

const visitsToday = computed(() => {
  // Get from widget location data if available
  if (props.widgetLocation?.visitsToday) {
    return props.widgetLocation.visitsToday
  }
  
  // Calculate from game state location history if available
  if (props.gameState?.location?.screenHistory) {
    const today = Math.floor((props.gameState.time?.day || 1))
    return props.gameState.location.screenHistory.filter(entry => 
      entry.screen === currentLocation.value && 
      Math.floor(entry.day) === today
    ).length
  }
  
  // Fallback to a reasonable default
  return 1
})

const totalVisits = computed(() => {
  // Get from widget location data if available
  if (props.widgetLocation?.totalVisits) {
    return props.widgetLocation.totalVisits
  }
  
  // Calculate from game state location history if available
  if (props.gameState?.location?.screenHistory) {
    return props.gameState.location.screenHistory.filter(entry => 
      entry.screen === currentLocation.value
    ).length
  }
  
  // Fallback to a reasonable default based on visits today
  return Math.max(visitsToday.value, 1)
})

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>
