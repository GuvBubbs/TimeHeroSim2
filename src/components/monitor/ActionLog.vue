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
          <!-- Tick Number -->
          <div class="text-xs text-sim-text-secondary font-mono shrink-0 w-12">
            T{{ formatTick(entry.timestamp) }}
          </div>
          
          <!-- Icon -->
          <div class="shrink-0 w-5 flex justify-center">
            <span class="text-sm">{{ getActionIcon(entry.type) }}</span>
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
  widgetTimeline?: any
}

const props = defineProps<Props>()

// State
const logContainer = ref<HTMLElement>()
const autoScroll = ref(true)
const activeFilters = ref<string[]>([])

// Convert events to log entries
const logEntries = computed<ActionLogEntry[]>(() => {
  // Only show real events - no mock data when simulation running
  const mockEntries: ActionLogEntry[] = []
  
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
    scrollToTop()
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
  
  const { scrollTop } = logContainer.value
  const isAtTop = scrollTop <= 5
  
  // Auto-disable auto-scroll if user scrolls down from top
  if (!isAtTop && autoScroll.value) {
    autoScroll.value = false
  }
}

const scrollToTop = async () => {
  await nextTick()
  if (logContainer.value) {
    logContainer.value.scrollTop = 0
  }
}

// Watch for new entries and auto-scroll
watch(() => logEntries.value.length, () => {
  if (autoScroll.value) {
    scrollToTop()
  }
})

// Helper functions
const formatTick = (timestamp: number): string => {
  // Convert timestamp (total minutes) to tick number
  // Assuming 30-second ticks (0.5 minutes per tick)
  const ticksPerMinute = 2
  return Math.floor(timestamp * ticksPerMinute).toString()
}

const getActionIcon = (type: string): string => {
  const icons: Record<string, string> = {
    // Farm actions
    plant: '🌱',
    water: '💧', 
    harvest: '🌾',
    cleanup: '🧹',
    pump: '🚰',
    
    // Combat actions
    combat: '⚔️',
    victory: '🏆',
    defeat: '💀',
    
    // Craft actions
    craft: '🔨',
    refine: '🔥',
    forge: '⚒️',
    stoke: '🔥',
    
    // Town actions
    purchase: '💰',
    upgrade: '📈',
    train: '📚',
    
    // Mine actions
    mine: '⛏️',
    
    // Tower actions
    catch_seeds: '🪝',
    
    // Helper actions
    helper: '👥',
    rescue: '🆘',
    assign_role: '👷',
    train_helper: '🎓',
    
    // Navigation
    move: '🚶',
    
    // Economy
    gold: '🪙',
    energy: '⚡',
    
    // Adventure
    adventure: '🗡️',
    
    // Default
    default: '•'
  }
  return icons[type] || icons.default
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
