// EventLogger - Structured event logging and history management
// Provides comprehensive logging capabilities with filtering and export

import type { 
  BaseEvent,
  EventType,
  LogLevel,
  LogFilter,
  EventLoggerOptions,
  EventStatistics
} from './types/EventTypes'

/**
 * Event logger interface
 */
export interface IEventLogger {
  log(event: BaseEvent<any>): void
  getHistory(filter?: LogFilter): BaseEvent<any>[]
  clearHistory(): void
  export(): string
  import(data: string): void
  getStatistics(): EventStatistics
  setLogLevel(level: LogLevel): void
  setMaxHistorySize(size: number): void
}

/**
 * Event logger implementation
 */
export class EventLogger implements IEventLogger {
  private history: BaseEvent<any>[]
  private maxHistorySize: number
  private logToConsole: boolean
  private logLevel: LogLevel
  private includeMetadata: boolean
  private timestampFormat: 'relative' | 'absolute'
  private startTime: number
  
  constructor(options: EventLoggerOptions = {}) {
    this.history = []
    this.maxHistorySize = options.maxHistorySize || 10000
    this.logToConsole = options.logToConsole ?? true
    this.logLevel = options.logLevel || 'info'
    this.includeMetadata = options.includeMetadata ?? true
    this.timestampFormat = options.timestampFormat || 'relative'
    this.startTime = Date.now()
    
    console.log(`📋 EventLogger: Initialized with log level '${this.logLevel}', max history: ${this.maxHistorySize}`)
  }
  
  /**
   * Log an event
   */
  log(event: BaseEvent<any>): void {
    // Check if we should log this event based on level
    if (!this.shouldLog(event)) {
      return
    }
    
    // Add to history with size management
    this.history.push(event)
    if (this.history.length > this.maxHistorySize) {
      // Remove oldest events, keeping the most recent
      const removeCount = Math.ceil(this.maxHistorySize * 0.1) // Remove 10%
      this.history.splice(0, removeCount)
    }
    
    // Log to console if enabled
    if (this.logToConsole) {
      this.logToConsoleFormatted(event)
    }
  }
  
  /**
   * Get event history with optional filtering
   */
  getHistory(filter?: LogFilter): BaseEvent<any>[] {
    let filtered = [...this.history]
    
    if (filter) {
      // Filter by event types
      if (filter.types && filter.types.length > 0) {
        filtered = filtered.filter(event => filter.types!.includes(event.type))
      }
      
      // Filter by time range
      if (filter.startTime !== undefined) {
        filtered = filtered.filter(event => event.timestamp >= filter.startTime!)
      }
      
      if (filter.endTime !== undefined) {
        filtered = filtered.filter(event => event.timestamp <= filter.endTime!)
      }
      
      // Filter by source
      if (filter.source) {
        filtered = filtered.filter(event => event.source === filter.source)
      }
      
      // Filter by importance
      if (filter.importance) {
        filtered = filtered.filter(event => this.getEventImportance(event) === filter.importance)
      }
      
      // Apply offset and limit
      if (filter.offset) {
        filtered = filtered.slice(filter.offset)
      }
      
      if (filter.limit) {
        filtered = filtered.slice(0, filter.limit)
      }
    }
    
    return filtered
  }
  
  /**
   * Clear event history
   */
  clearHistory(): void {
    const clearedCount = this.history.length
    this.history = []
    console.log(`🧹 EventLogger: Cleared ${clearedCount} events from history`)
  }
  
  /**
   * Export event history as JSON
   */
  export(): string {
    const exportData = {
      metadata: {
        exportTime: Date.now(),
        totalEvents: this.history.length,
        logLevel: this.logLevel,
        startTime: this.startTime
      },
      events: this.history
    }
    
    return JSON.stringify(exportData, null, 2)
  }
  
  /**
   * Import event history from JSON
   */
  import(data: string): void {
    try {
      const importData = JSON.parse(data)
      
      if (importData.events && Array.isArray(importData.events)) {
        this.history = importData.events
        console.log(`📥 EventLogger: Imported ${importData.events.length} events`)
      } else {
        throw new Error('Invalid import data format')
      }
    } catch (error) {
      console.error('❌ EventLogger: Failed to import data:', error)
      throw error
    }
  }
  
  /**
   * Get event statistics
   */
  getStatistics(): EventStatistics {
    const now = Date.now()
    const eventCounts: Record<string, number> = {}
    let errorCount = 0
    let warningCount = 0
    let lastEventTime = 0
    
    // Count events by type and calculate statistics
    for (const event of this.history) {
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1
      
      if (event.type === 'error') errorCount++
      if (event.type === 'warning') warningCount++
      
      if (event.timestamp > lastEventTime) {
        lastEventTime = event.timestamp
      }
    }
    
    // Calculate rate statistics
    const totalTimeMinutes = (now - this.startTime) / (1000 * 60)
    const averageEventsPerMinute = totalTimeMinutes > 0 ? this.history.length / totalTimeMinutes : 0
    
    // Calculate peak events per minute (sliding window)
    let peakEventsPerMinute = 0
    const windowSize = 60 * 1000 // 1 minute window
    
    for (let i = 0; i < this.history.length; i++) {
      const windowStart = this.history[i].timestamp
      const windowEnd = windowStart + windowSize
      
      const eventsInWindow = this.history.filter(
        event => event.timestamp >= windowStart && event.timestamp < windowEnd
      ).length
      
      if (eventsInWindow > peakEventsPerMinute) {
        peakEventsPerMinute = eventsInWindow
      }
    }
    
    return {
      totalEvents: this.history.length,
      eventCounts: eventCounts as Record<EventType, number>,
      averageEventsPerMinute,
      peakEventsPerMinute,
      lastEventTime,
      errorCount,
      warningCount
    }
  }
  
  /**
   * Set log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level
    console.log(`📋 EventLogger: Log level set to '${level}'`)
  }
  
  /**
   * Set maximum history size
   */
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size
    
    // Trim history if necessary
    if (this.history.length > size) {
      const removeCount = this.history.length - size
      this.history.splice(0, removeCount)
      console.log(`📋 EventLogger: Trimmed ${removeCount} old events, max size now ${size}`)
    }
  }
  
  /**
   * Get events by type
   */
  getEventsByType(type: EventType): BaseEvent<any>[] {
    return this.history.filter(event => event.type === type)
  }
  
  /**
   * Get recent events (last N events)
   */
  getRecentEvents(count: number = 100): BaseEvent<any>[] {
    return this.history.slice(-count)
  }
  
  /**
   * Get events in time range
   */
  getEventsInRange(startTime: number, endTime: number): BaseEvent<any>[] {
    return this.history.filter(
      event => event.timestamp >= startTime && event.timestamp <= endTime
    )
  }
  
  // Private methods
  
  /**
   * Check if an event should be logged based on level
   */
  private shouldLog(event: BaseEvent<any>): boolean {
    const eventLevel = this.getEventLevel(event)
    const levels: LogLevel[] = ['debug', 'info', 'warning', 'error']
    
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const eventLevelIndex = levels.indexOf(eventLevel)
    
    return eventLevelIndex >= currentLevelIndex
  }
  
  /**
   * Get log level for an event
   */
  private getEventLevel(event: BaseEvent<any>): LogLevel {
    switch (event.type) {
      case 'error':
      case 'action_failed':
      case 'process_failed':
      case 'validation_failed':
        return 'error'
      
      case 'warning':
      case 'bottleneck_detected':
        return 'warning'
      
      case 'tick_processed':
      case 'state_changed':
      case 'resource_changed':
        return 'debug'
      
      default:
        return 'info'
    }
  }
  
  /**
   * Get event importance level
   */
  private getEventImportance(event: BaseEvent<any>): 'low' | 'medium' | 'high' | 'critical' {
    switch (event.type) {
      case 'error':
      case 'simulation_stopped':
        return 'critical'
      
      case 'bottleneck_detected':
      case 'validation_failed':
      case 'action_failed':
        return 'high'
      
      case 'level_up':
      case 'achievement_unlocked':
      case 'adventure_completed':
      case 'structure_built':
        return 'medium'
      
      default:
        return 'low'
    }
  }
  
  /**
   * Log event to console with formatting
   */
  private logToConsoleFormatted(event: BaseEvent<any>): void {
    const level = this.getEventLevel(event)
    const timestamp = this.formatTimestamp(event.timestamp)
    const metadata = this.includeMetadata && event.metadata ? 
      ` [${JSON.stringify(event.metadata)}]` : ''
    
    const message = `${timestamp} [${level.toUpperCase()}] ${event.type}: ${this.getEventDescription(event)}${metadata}`
    
    // Use appropriate console method based on level
    switch (level) {
      case 'error':
        console.error(message)
        break
      case 'warning':
        console.warn(message)
        break
      case 'debug':
        console.debug(message)
        break
      default:
        console.log(message)
    }
  }
  
  /**
   * Format timestamp based on settings
   */
  private formatTimestamp(timestamp: number): string {
    if (this.timestampFormat === 'absolute') {
      return new Date(timestamp).toISOString()
    } else {
      const elapsed = timestamp - this.startTime
      const minutes = Math.floor(elapsed / (1000 * 60))
      const seconds = Math.floor((elapsed % (1000 * 60)) / 1000)
      return `+${minutes}:${seconds.toString().padStart(2, '0')}`
    }
  }
  
  /**
   * Get human-readable description for an event
   */
  private getEventDescription(event: BaseEvent<any>): string {
    switch (event.type) {
      case 'action_executed':
        return `Executed ${event.data.action.type} action`
      
      case 'action_failed':
        return `Failed to execute ${event.data.action.type}: ${event.data.error}`
      
      case 'resource_changed':
        return `${event.data.resource}: ${event.data.oldValue} → ${event.data.newValue}`
      
      case 'crop_planted':
        return `Planted ${event.data.cropId} in plot ${event.data.plotIndex}`
      
      case 'crop_harvested':
        return `Harvested ${event.data.cropId} from plot ${event.data.plotIndex}`
      
      case 'level_up':
        return `Level up! ${event.data.oldLevel} → ${event.data.newLevel} (${event.data.xp} XP)`
      
      case 'bottleneck_detected':
        return `Bottleneck detected: ${event.data.type}`
      
      case 'tick_processed':
        return `Tick ${event.data.tickCount} processed (Day ${event.data.gameDay})`
      
      default:
        return event.type.replace(/_/g, ' ')
    }
  }
}

/**
 * Default event logger instance
 */
export const eventLogger = new EventLogger()
