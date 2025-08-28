<!-- Action Log Widget - Scrolling action history -->
<template>
  <BaseWidget title="Action Log" icon="fas fa-list">
    <template #actions>
      <button
        @click="toggleAutoScroll"
        class="text-xs px-2 py-1 rounded border"
        :class="{
          'bg-sim-accent text-white border-sim-accent': autoScroll,
          'bg-transparent border-sim-border text-sim-text-secondary': !autoScroll
        }"
      >
        <i class="fas fa-arrow-down mr-1"></i>
        Auto-scroll
      </button>
      <button
        @click="clearLog"
        class="text-xs px-2 py-1 rounded border border-sim-border text-sim-text-secondary hover:text-sim-text"
      >
        Clear
      </button>
    </template>

    <div class="flex flex-col h-full">
      <!-- Log entries -->
      <div 
        ref="logContainer"
        class="flex-1 overflow-y-auto space-y-1 text-sm"
        @scroll="onScroll"
      >
        <div 
          v-for="(entry, index) in visibleEntries" 
          :key="`${entry.timestamp}-${index}`"
          class="flex gap-2 p-2 rounded hover:bg-sim-background transition-colors"
          :class="getEntryClass(entry.type)"
        >
          <!-- Timestamp -->
          <div class="text-xs text-sim-text-secondary font-mono shrink-0 w-12">
            {{ formatTime(entry.timestamp) }}
          </div>
          
          <!-- Icon -->
          <div class="shrink-0 w-5 flex justify-center">
            <i :class="getActionIcon(entry.type)" class="text-sm"></i>
          </div>
          
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ entry.action }}</span>
              <span v-if="entry.score" class="text-xs text-sim-text-secondary">
                (Score: {{ entry.score.toFixed(1) }})
              </span>
            </div>
            <div v-if="entry.details" class="text-xs text-sim-text-secondary mt-1">
              {{ entry.details }}
            </div>
            <div v-if="entry.result" class="text-xs mt-1" :class="getResultClass(entry.result.type)">
              {{ entry.result.message }}
            </div>
          </div>
        </div>
        
        <!-- Empty state -->
        <div v-if="visibleEntries.length === 0" class="text-center py-8 text-sim-text-secondary">
          <i class="fas fa-clock text-2xl mb-2 block"></i>
          <div>No actions yet</div>
          <div class="text-xs mt-1">Start simulation to see activity</div>
        </div>
      </div>
      
      <!-- Filter controls -->
      <div class="mt-3 pt-3 border-t border-sim-border">
        <div class="flex flex-wrap gap-1">
          <button
            v-for="filterType in actionTypes"
            :key="filterType"
            @click="toggleFilter(filterType)"
            class="text-xs px-2 py-1 rounded border"
            :class="{
              'bg-sim-accent text-white border-sim-accent': activeFilters.includes(filterType),
              'bg-transparent border-sim-border text-sim-text-secondary': !activeFilters.includes(filterType)
            }"
          >
            <i :class="getActionIcon(filterType)" class="mr-1"></i>
            {{ formatActionType(filterType) }}
          </button>
        </div>
      </div>
    </div>
  </BaseWidget>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import BaseWidget from './BaseWidget.vue'
import type { GameEvent } from '@/types'

interface ActionLogEntry {
  timestamp: number
  type: string
  action: string
  details?: string
  score?: number
  result?: {
    type: 'success' | 'failure' | 'warning'
    message: string
  }
}

interface Props {
  events: GameEvent[]
}

const props = defineProps<Props>()

// State
const logContainer = ref<HTMLElement>()
const autoScroll = ref(true)
const activeFilters = ref<string[]>([])

// Convert events to log entries
const logEntries = computed<ActionLogEntry[]>(() => {
  // Mock entries for demonstration - in real implementation this would process props.events
  const mockEntries: ActionLogEntry[] = [
    {
      timestamp: Date.now() - 300000,
      type: 'plant',
      action: 'Plant carrot on plot 7',
      details: 'Low energy (450<500), high value crop',
      score: 8.5,
      result: { type: 'success', message: '+3 energy expected' }
    },
    {
      timestamp: Date.now() - 240000,
      type: 'harvest',
      action: 'Harvest 3 ready carrots',
      result: { type: 'success', message: '+3 energy gained' }
    },
    {
      timestamp: Date.now() - 180000,
      type: 'water',
      action: 'Water 5 dry plots',
      score: 6.2
    },
    {
      timestamp: Date.now() - 120000,
      type: 'water',
      action: 'Pump water (20→45 units)',
      result: { type: 'success', message: '+25 water' }
    },
    {
      timestamp: Date.now() - 60000,
      type: 'purchase',
      action: 'Buy Storage Shed II',
      details: 'Cost: 100g',
      result: { type: 'success', message: 'Storage capacity +20' }
    },
    {
      timestamp: Date.now() - 30000,
      type: 'move',
      action: 'Travel Farm → Town',
      details: '1 minute travel time'
    }
  ]
  
  return [...mockEntries, ...convertEventsToEntries(props.events)].sort((a, b) => b.timestamp - a.timestamp)
})

const convertEventsToEntries = (events: GameEvent[]): ActionLogEntry[] => {
  return events.map(event => ({
    timestamp: event.timestamp || Date.now(),
    type: event.type || 'unknown',
    action: event.description || 'Unknown action',
    details: (event as any).details,
    score: (event as any).score
  }))
}

const actionTypes = ['plant', 'harvest', 'water', 'craft', 'purchase', 'move', 'combat', 'mine']

const visibleEntries = computed(() => {
  if (activeFilters.value.length === 0) {
    return logEntries.value.slice(0, 100) // Limit to last 100 entries
  }
  return logEntries.value.filter(entry => 
    activeFilters.value.includes(entry.type)
  ).slice(0, 100)
})

// Methods
const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value
  if (autoScroll.value) {
    scrollToBottom()
  }
}

const clearLog = () => {
  // In real implementation, this would clear the actual log
  console.log('Clear log requested')
}

const toggleFilter = (filterType: string) => {
  const index = activeFilters.value.indexOf(filterType)
  if (index >= 0) {
    activeFilters.value.splice(index, 1)
  } else {
    activeFilters.value.push(filterType)
  }
}

const onScroll = () => {
  if (!logContainer.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = logContainer.value
  const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5
  
  // Auto-disable auto-scroll if user scrolls up
  if (!isAtBottom && autoScroll.value) {
    autoScroll.value = false
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
}

// Watch for new entries and auto-scroll
watch(() => logEntries.value.length, () => {
  if (autoScroll.value) {
    scrollToBottom()
  }
})

// Helper functions
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const getActionIcon = (type: string): string => {
  const icons: Record<string, string> = {
    plant: 'fas fa-seedling text-green-400',
    harvest: 'fas fa-cut text-yellow-400',
    water: 'fas fa-tint text-blue-400',
    craft: 'fas fa-hammer text-orange-400',
    purchase: 'fas fa-shopping-cart text-purple-400',
    move: 'fas fa-route text-gray-400',
    combat: 'fas fa-sword text-red-400',
    mine: 'fas fa-mountain text-gray-500'
  }
  return icons[type] || 'fas fa-question text-gray-400'
}

const getEntryClass = (type: string): string => {
  const classes: Record<string, string> = {
    plant: 'border-l-2 border-green-400',
    harvest: 'border-l-2 border-yellow-400',
    water: 'border-l-2 border-blue-400',
    craft: 'border-l-2 border-orange-400',
    purchase: 'border-l-2 border-purple-400',
    move: 'border-l-2 border-gray-400',
    combat: 'border-l-2 border-red-400',
    mine: 'border-l-2 border-gray-500'
  }
  return classes[type] || 'border-l-2 border-gray-400'
}

const getResultClass = (type: string): string => {
  const classes = {
    success: 'text-green-400',
    failure: 'text-red-400',
    warning: 'text-yellow-400'
  }
  return classes[type as keyof typeof classes] || 'text-sim-text-secondary'
}

const formatActionType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}
</script>
