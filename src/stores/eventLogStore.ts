// Event Log Store - Pinia store for event management and history
// Provides reactive state management for the event system

import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { 
  eventBus, 
  eventLogger, 
  type BaseEvent, 
  type EventType, 
  type EventStatistics,
  type LogFilter
} from '../utils/events'

export const useEventLogStore = defineStore('eventLog', () => {
  // State
  const isConnected = ref(false)
  const eventHistory = ref<BaseEvent<any>[]>([])
  const recentEvents = ref<BaseEvent<any>[]>([])
  const statistics = reactive<EventStatistics>({
    totalEvents: 0,
    eventCounts: {} as Record<EventType, number>,
    averageEventsPerMinute: 0,
    peakEventsPerMinute: 0,
    lastEventTime: 0,
    errorCount: 0,
    warningCount: 0
  })
  
  // Reactive filters and settings
  const logLevel = ref<'debug' | 'info' | 'warning' | 'error'>('info')
  const maxHistorySize = ref(10000)
  const autoUpdate = ref(true)
  const filters = reactive<LogFilter>({
    types: undefined,
    startTime: undefined,
    endTime: undefined,
    source: undefined,
    importance: undefined,
    limit: 100
  })
  
  // Computed properties
  const errorEvents = computed(() => 
    eventHistory.value.filter(event => event.type === 'error')
  )
  
  const warningEvents = computed(() => 
    eventHistory.value.filter(event => event.type === 'warning')
  )
  
  const filteredEvents = computed(() => {
    let events = eventHistory.value
    
    if (filters.types && filters.types.length > 0) {
      events = events.filter(event => filters.types!.includes(event.type))
    }
    
    if (filters.startTime) {
      events = events.filter(event => event.timestamp >= filters.startTime!)
    }
    
    if (filters.endTime) {
      events = events.filter(event => event.timestamp <= filters.endTime!)
    }
    
    if (filters.source) {
      events = events.filter(event => event.source === filters.source)
    }
    
    if (filters.limit) {
      events = events.slice(-filters.limit)
    }
    
    return events
  })
  
  const eventTypesList = computed(() => {
    const types = new Set<EventType>()
    eventHistory.value.forEach(event => types.add(event.type))
    return Array.from(types).sort()
  })
  
  const sourcesList = computed(() => {
    const sources = new Set<string>()
    eventHistory.value.forEach(event => {
      if (event.source) sources.add(event.source)
    })
    return Array.from(sources).sort()
  })
  
  // Actions
  function connectToEventBus() {
    if (isConnected.value) {
      console.warn('🔌 EventLogStore: Already connected to event bus')
      return
    }
    
    console.log('🔌 EventLogStore: Connecting to event bus...')
    
    // Subscribe to all events
    eventBus.onAny((event: BaseEvent<any>) => {
      if (autoUpdate.value) {
        addEvent(event)
        updateStatistics()
      }
    })
    
    // Set up event logger
    eventLogger.setLogLevel(logLevel.value)
    eventLogger.setMaxHistorySize(maxHistorySize.value)
    
    isConnected.value = true
    console.log('✅ EventLogStore: Connected to event bus')
  }
  
  function disconnectFromEventBus() {
    if (!isConnected.value) {
      console.warn('🔌 EventLogStore: Not connected to event bus')
      return
    }
    
    // Note: EventBus doesn't have a direct way to remove all handlers
    // In a production system, we'd need to track unsubscribe functions
    isConnected.value = false
    console.log('🔌 EventLogStore: Disconnected from event bus')
  }
  
  function addEvent(event: BaseEvent<any>) {
    eventHistory.value.push(event)
    
    // Update recent events (keep last 50)
    recentEvents.value = eventHistory.value.slice(-50)
    
    // Trim history if needed
    if (eventHistory.value.length > maxHistorySize.value) {
      const removeCount = Math.ceil(maxHistorySize.value * 0.1)
      eventHistory.value.splice(0, removeCount)
    }
    
    // Log to event logger
    eventLogger.log(event)
  }
  
  function updateStatistics() {
    Object.assign(statistics, eventLogger.getStatistics())
  }
  
  function clearHistory() {
    eventHistory.value = []
    recentEvents.value = []
    eventLogger.clearHistory()
    updateStatistics()
    console.log('🧹 EventLogStore: Cleared event history')
  }
  
  function exportEvents(): string {
    return eventLogger.export()
  }
  
  function importEvents(data: string) {
    try {
      eventLogger.import(data)
      refreshFromLogger()
      console.log('📥 EventLogStore: Imported events successfully')
    } catch (error) {
      console.error('❌ EventLogStore: Failed to import events:', error)
      throw error
    }
  }
  
  function refreshFromLogger() {
    eventHistory.value = eventLogger.getHistory()
    recentEvents.value = eventHistory.value.slice(-50)
    updateStatistics()
  }
  
  function setLogLevel(level: 'debug' | 'info' | 'warning' | 'error') {
    logLevel.value = level
    eventLogger.setLogLevel(level)
    console.log(`📋 EventLogStore: Log level set to '${level}'`)
  }
  
  function setMaxHistorySize(size: number) {
    maxHistorySize.value = size
    eventLogger.setMaxHistorySize(size)
    
    // Trim current history if needed
    if (eventHistory.value.length > size) {
      const removeCount = eventHistory.value.length - size
      eventHistory.value.splice(0, removeCount)
    }
    
    console.log(`📋 EventLogStore: Max history size set to ${size}`)
  }
  
  function setAutoUpdate(enabled: boolean) {
    autoUpdate.value = enabled
    console.log(`📋 EventLogStore: Auto update ${enabled ? 'enabled' : 'disabled'}`)
  }
  
  function updateFilters(newFilters: Partial<LogFilter>) {
    Object.assign(filters, newFilters)
  }
  
  function clearFilters() {
    Object.assign(filters, {
      types: undefined,
      startTime: undefined,
      endTime: undefined,
      source: undefined,
      importance: undefined,
      limit: 100
    })
  }
  
  function getEventsByType(type: EventType): BaseEvent<any>[] {
    return eventHistory.value.filter(event => event.type === type)
  }
  
  function getEventsInRange(startTime: number, endTime: number): BaseEvent<any>[] {
    return eventHistory.value.filter(
      event => event.timestamp >= startTime && event.timestamp <= endTime
    )
  }
  
  function searchEvents(query: string): BaseEvent<any>[] {
    const lowerQuery = query.toLowerCase()
    return eventHistory.value.filter(event => {
      // Search in event type
      if (event.type.toLowerCase().includes(lowerQuery)) return true
      
      // Search in source
      if (event.source && event.source.toLowerCase().includes(lowerQuery)) return true
      
      // Search in data (simple string search)
      try {
        const dataStr = JSON.stringify(event.data).toLowerCase()
        if (dataStr.includes(lowerQuery)) return true
      } catch (e) {
        // Ignore JSON stringify errors
      }
      
      return false
    })
  }
  
  // Initialize connection on store creation
  function initialize() {
    connectToEventBus()
    updateStatistics()
  }
  
  return {
    // State
    isConnected,
    eventHistory,
    recentEvents,
    statistics,
    logLevel,
    maxHistorySize,
    autoUpdate,
    filters,
    
    // Computed
    errorEvents,
    warningEvents,
    filteredEvents,
    eventTypesList,
    sourcesList,
    
    // Actions
    connectToEventBus,
    disconnectFromEventBus,
    addEvent,
    updateStatistics,
    clearHistory,
    exportEvents,
    importEvents,
    refreshFromLogger,
    setLogLevel,
    setMaxHistorySize,
    setAutoUpdate,
    updateFilters,
    clearFilters,
    getEventsByType,
    getEventsInRange,
    searchEvents,
    initialize
  }
})
