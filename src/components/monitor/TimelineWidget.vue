<!-- Timeline Widget - Events across the day -->
<template>
  <BaseWidget title="Timeline" icon="fas fa-clock">
    <div class="space-y-3">
      <!-- Time Scale -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between text-xs text-sim-text-secondary mb-2">
          <span v-for="hour in timeMarkers" :key="hour">{{ formatHour(hour) }}</span>
        </div>
        
        <!-- Timeline Bar -->
        <div class="relative bg-sim-background-darker h-4 rounded">
          <!-- Background Progress Line -->
          <div class="absolute top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-gray-600"></div>
          
          <!-- Current Time Indicator -->
          <div 
            v-if="currentTimePosition >= 0"
            class="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full animate-pulse z-10" 
            :style="{ left: `${currentTimePosition}%` }"
            :title="`Current: ${formatGameTime(gameTime)}`"
          ></div>
          
          <!-- Event Markers -->
          <div
            v-for="(event, index) in timelineEvents"
            :key="`event-${index}`"
            class="absolute top-1/2 transform -translate-y-1/2 rounded-full cursor-help"
            :class="getEventClass(event.type)"
            :style="{ 
              left: `${event.position}%`, 
              width: `${getEventSize(event.importance)}px`,
              height: `${getEventSize(event.importance)}px`,
              marginLeft: `-${getEventSize(event.importance) / 2}px`,
              marginTop: `-${getEventSize(event.importance) / 2}px`
            }"
            :title="getEventTooltip(event)"
          ></div>
        </div>
        
        <!-- Day Progress -->
        <div class="mt-2 flex justify-between text-xs">
          <span class="text-sim-text-secondary">Day {{ currentDay }}</span>
          <span class="text-sim-text">{{ dayEventsCount }} events today</span>
          <span class="text-sim-text-secondary">{{ dayProgress }}% complete</span>
        </div>
      </div>

      <!-- Recent Events -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-history text-blue-400 mr-2"></i>
            Recent Events
          </span>
        </div>
        <div class="text-xs space-y-1 max-h-20 overflow-y-auto">
          <div 
            v-for="(event, index) in recentEvents" 
            :key="`${event.timestamp}-${index}`"
            class="flex justify-between items-center"
          >
            <div class="flex items-center gap-1">
              <i :class="getEventIcon(event.type)" class="text-xs"></i>
              <span class="truncate">{{ event.description }}</span>
            </div>
            <span class="text-sim-text-secondary font-mono shrink-0">
              {{ formatEventTime(event.timestamp) }}
            </span>
          </div>
          
          <div v-if="recentEvents.length === 0" class="text-sim-text-secondary text-center py-2">
            No recent events
          </div>
        </div>
      </div>

      <!-- Upcoming Milestones -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-calendar-check text-green-400 mr-2"></i>
            Upcoming
          </span>
        </div>
        <div class="text-xs space-y-1">
          <div 
            v-for="milestone in upcomingMilestones" 
            :key="milestone.name"
            class="flex justify-between"
          >
            <span>{{ milestone.name }}</span>
            <span class="text-sim-text-secondary">{{ milestone.timeUntil }}</span>
          </div>
          
          <div v-if="upcomingMilestones.length === 0" class="text-sim-text-secondary text-center py-1">
            No upcoming milestones
          </div>
        </div>
      </div>
    </div>
  </BaseWidget>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseWidget from './BaseWidget.vue'
import type { GameState, GameEvent } from '@/types'

interface Props {
  gameState: GameState | null
  events?: GameEvent[]
}

interface TimelineEvent {
  timestamp: number
  position: number
  type: string
  description: string
  importance: 'low' | 'medium' | 'high' | 'critical'
}

interface Milestone {
  name: string
  timeUntil: string
}

const props = defineProps<Props>()

// Time configuration (6 AM to 8 PM = 14 hours)
const timeMarkers = [6, 8, 10, 12, 14, 16, 18, 20]
const startHour = 6
const endHour = 20
const timeSpanHours = endHour - startHour

// Current game time
const gameTime = computed(() => {
  if (!props.gameState?.time) {
    return { day: 1, hour: 12, minute: 0, totalMinutes: 0 }
  }
  return props.gameState.time
})

const currentDay = computed(() => gameTime.value.day)

// Calculate current time position on timeline (0-100%)
const currentTimePosition = computed(() => {
  const { hour, minute } = gameTime.value
  if (hour < startHour || hour >= endHour) return -1 // Outside display range
  
  const totalMinutesFromStart = (hour - startHour) * 60 + minute
  const totalTimeSpanMinutes = timeSpanHours * 60
  
  return Math.min(100, (totalMinutesFromStart / totalTimeSpanMinutes) * 100)
})

// Day progress percentage
const dayProgress = computed(() => {
  const { hour, minute } = gameTime.value
  const totalMinutesInDay = 24 * 60
  const currentMinutes = hour * 60 + minute
  return Math.round((currentMinutes / totalMinutesInDay) * 100)
})

// Filter events for today
const todayEvents = computed(() => {
  const events = props.events || []
  const currentDayStart = (currentDay.value - 1) * 24 * 60 // Start of current day in total minutes
  const currentDayEnd = currentDay.value * 24 * 60 // End of current day
  
  return events.filter(event => {
    const eventTime = event.timestamp || 0
    return eventTime >= currentDayStart && eventTime < currentDayEnd
  })
})

// Convert events to timeline positions
const timelineEvents = computed<TimelineEvent[]>(() => {
  return todayEvents.value.map(event => {
    const eventTime = event.timestamp || 0
    const dayStartMinutes = (currentDay.value - 1) * 24 * 60
    const eventMinutesFromDayStart = eventTime - dayStartMinutes
    
    // Convert to hours and minutes within the day
    const eventHour = Math.floor(eventMinutesFromDayStart / 60)
    const eventMinute = eventMinutesFromDayStart % 60
    
    // Calculate position on timeline (only for visible hours 6-20)
    let position = -1
    if (eventHour >= startHour && eventHour < endHour) {
      const minutesFromTimelineStart = (eventHour - startHour) * 60 + eventMinute
      const timelineSpanMinutes = timeSpanHours * 60
      position = (minutesFromTimelineStart / timelineSpanMinutes) * 100
    }
    
    return {
      timestamp: event.timestamp || 0,
      position,
      type: event.type,
      description: event.description,
      importance: event.importance || 'low'
    }
  }).filter(event => event.position >= 0) // Only show events within visible timeline
})

// Recent events (last 5)
const recentEvents = computed(() => {
  return [...todayEvents.value]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 5)
})

// Count of today's events
const dayEventsCount = computed(() => todayEvents.value.length)

// Upcoming milestones (mock data based on game progression)
const upcomingMilestones = computed<Milestone[]>(() => {
  const milestones: Milestone[] = []
  
  // Phase transition milestone
  const currentPhase = props.gameState?.progression?.currentPhase
  if (currentPhase !== 'End') {
    milestones.push({
      name: 'Next Phase',
      timeUntil: 'in 2.3 days'
    })
  }
  
  // Level up milestone
  const heroLevel = props.gameState?.progression?.heroLevel || 1
  if (heroLevel < 20) {
    milestones.push({
      name: `Level ${heroLevel + 1}`,
      timeUntil: 'in 4 hours'
    })
  }
  
  // Farm expansion milestone
  const farmStage = props.gameState?.progression?.farmStage || 1
  if (farmStage < 5) {
    milestones.push({
      name: 'Farm Expansion',
      timeUntil: 'in 1.2 days'
    })
  }
  
  return milestones.slice(0, 3) // Show up to 3 milestones
})

// Helper functions
const formatHour = (hour: number): string => {
  return `${hour}:00`
}

const formatGameTime = (time: { hour: number; minute: number }): string => {
  return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`
}

const formatEventTime = (timestamp: number): string => {
  const dayStartMinutes = (currentDay.value - 1) * 24 * 60
  const eventMinutesFromDayStart = timestamp - dayStartMinutes
  
  const hour = Math.floor(eventMinutesFromDayStart / 60)
  const minute = eventMinutesFromDayStart % 60
  
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

const getEventClass = (type: string): string => {
  const classes: Record<string, string> = {
    plant: 'bg-green-400',
    harvest: 'bg-yellow-400',
    water: 'bg-blue-400',
    craft: 'bg-orange-400',
    purchase: 'bg-purple-400',
    move: 'bg-gray-400',
    combat: 'bg-red-400',
    mine: 'bg-gray-500',
    level_up: 'bg-yellow-500',
    phase_change: 'bg-blue-500'
  }
  return classes[type] || 'bg-gray-400'
}

const getEventIcon = (type: string): string => {
  const icons: Record<string, string> = {
    plant: 'fas fa-seedling text-green-400',
    harvest: 'fas fa-cut text-yellow-400',
    water: 'fas fa-tint text-blue-400',
    craft: 'fas fa-hammer text-orange-400',
    purchase: 'fas fa-shopping-cart text-purple-400',
    move: 'fas fa-route text-gray-400',
    combat: 'fas fa-sword text-red-400',
    mine: 'fas fa-mountain text-gray-500',
    level_up: 'fas fa-arrow-up text-yellow-500',
    phase_change: 'fas fa-flag text-blue-500'
  }
  return icons[type] || 'fas fa-question text-gray-400'
}

const getEventSize = (importance: string): number => {
  const sizes = {
    low: 6,
    medium: 8,
    high: 10,
    critical: 12
  }
  return sizes[importance as keyof typeof sizes] || 8
}

const getEventTooltip = (event: TimelineEvent): string => {
  const time = formatEventTime(event.timestamp)
  return `${time}: ${event.description}`
}
</script>
