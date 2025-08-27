<!-- Current Location Widget - Screen navigation display -->
<template>
  <BaseWidget title="Current Location" icon="fas fa-map-marker-alt">
    <div class="space-y-4">
      <!-- Location Map (4x3 Grid) -->
      <!-- Row 1 -->
      <div class="grid grid-cols-3 gap-2">
        <LocationButton
          v-for="location in locations.slice(0, 3)"
          :key="location.screen"
          :screen="location.screen"
          :current="currentLocation"
          :icon="location.icon"
          :name="location.name"
          :hasHelper="hasHelper && location.screen === 'farm'"
        />
      </div>
      
      <!-- Row 2 -->
      <div class="grid grid-cols-3 gap-2">
        <LocationButton
          v-for="location in locations.slice(3, 6)"
          :key="location.screen"
          :screen="location.screen"
          :current="currentLocation"
          :icon="location.icon"
          :name="location.name"
          :hasHelper="hasHelper && location.screen === 'farm'"
        />
      </div>
      
      <!-- Row 3 -->
      <div class="grid grid-cols-3 gap-2">
        <LocationButton
          v-for="location in locations.slice(6, 9)"
          :key="location.screen"
          :screen="location.screen"
          :current="currentLocation"
          :icon="location.icon"
          :name="location.name"
          :hasHelper="hasHelper && location.screen === 'farm'"
        />
      </div>
      
      <!-- Row 4 -->
      <div class="grid grid-cols-3 gap-2">
        <LocationButton
          v-for="location in locations.slice(9, 12)"
          :key="location.screen"
          :screen="location.screen"
          :current="currentLocation"
          :icon="location.icon"
          :name="location.name"
          :hasHelper="hasHelper && location.screen === 'farm'"
        />
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
import LocationButton from './LocationButton.vue'

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

const locations = [
  { screen: 'tower', name: 'Tower', icon: 'fas fa-chess-rook' },
  { screen: 'town', name: 'Town', icon: 'fas fa-city' },
  { screen: 'cave', name: 'Cave', icon: 'fas fa-dungeon' },
  
  { screen: 'farm', name: 'Farm', icon: 'fas fa-seedling' },
  { screen: 'adventure', name: 'Adventure', icon: 'fas fa-sword' },
  { screen: 'forge', name: 'Forge', icon: 'fas fa-hammer' },
  
  { screen: 'mine', name: 'Mine', icon: 'fas fa-mountain' },
  { screen: 'shop', name: 'Shop', icon: 'fas fa-store' },
  { screen: 'castle', name: 'Castle', icon: 'fas fa-chess-queen' },
  
  { screen: 'volcano', name: 'Volcano', icon: 'fas fa-volcano' },
  { screen: 'forest', name: 'Forest', icon: 'fas fa-tree' },
  { screen: 'beach', name: 'Beach', icon: 'fas fa-umbrella-beach' }
]

// Mock visit statistics
const visitStats = computed(() => {
  const stats: Record<string, number> = {}
  locations.forEach(loc => {
    stats[loc.screen] = Math.floor(Math.random() * 50) + 1
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
