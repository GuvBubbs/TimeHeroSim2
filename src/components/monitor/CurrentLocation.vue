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
      <div class="bg-sim-background rounded p-3 space-y-2">
        <div class="flex justify-between text-sm">
          <span>Time here:</span>
          <span class="font-mono">{{ formatDuration(timeOnScreen) }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span>Visits today:</span>
          <span class="font-mono">{{ visitsToday }}</span>
        </div>
        <div class="flex justify-between text-sm">
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
}

const props = defineProps<Props>()

// Mock location data
const currentLocation = computed(() => props.gameState?.location.currentScreen || 'farm')
const hasHelper = computed(() => {
  return props.gameState?.helpers?.gnomes?.some(gnome => 
    gnome.isAssigned && gnome.currentTask !== null
  ) || false
})

// Mock visit statistics for main screens
const visitStats = computed(() => {
  const screens = ['tower', 'town', 'farm', 'adventure', 'forge', 'mine']
  const stats: Record<string, number> = {}
  screens.forEach(screen => {
    stats[screen] = Math.floor(Math.random() * 50) + 1
  })
  return stats
})

// Computed values for display
const timeOnScreen = computed(() => {
  return props.gameState?.location.timeOnScreen || Math.floor(Math.random() * 300) + 60
})

const visitsToday = computed(() => {
  return visitStats.value[currentLocation.value] || 0
})

const totalVisits = computed(() => {
  return Object.values(visitStats.value).reduce((sum, visits) => sum + visits, 0)
})

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>
