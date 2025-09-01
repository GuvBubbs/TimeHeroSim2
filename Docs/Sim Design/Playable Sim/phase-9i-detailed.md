# Phase 9I: Extract Event System - Detailed Implementation

## Overview
Extract ~200 lines of event handling and logging from SimulationEngine into a robust EventBus system. This creates a pub/sub architecture for all game events, enabling loose coupling between systems and comprehensive event tracking.

## File Structure After Phase 9I

```
src/utils/events/
├── EventBus.ts (new ~100 lines)
├── EventLogger.ts (new ~80 lines)
├── EventReplay.ts (new ~50 lines)
├── EventFilters.ts (new ~30 lines)
└── types/
    ├── EventTypes.ts (new ~100 lines)
    └── EventHandlers.ts (new ~50 lines)
```

## Current Event Handling in SimulationEngine

### Methods to Extract (Lines ~3800-4000):
```typescript
// Event logging
- logEvent(event: GameEvent): void
- logAction(action: GameAction, success: boolean): void
- logStateChange(change: StateChange): void
- logError(error: Error, context: any): void

// Event processing
- processEvents(events: GameEvent[]): void
- emitEvent(type: string, data: any): void
- notifyListeners(event: GameEvent): void

// Event history
- getEventHistory(): GameEvent[]
- clearEventHistory(): void
- replayEvents(events: GameEvent[]): void
```

## 1. EventBus.ts - Central Event System

### Interface Design:
```typescript
export interface IEventBus {
  // Event emission
  emit<T extends EventType>(type: T, data: EventData[T]): void
  emitAsync<T extends EventType>(type: T, data: EventData[T]): Promise<void>
  
  // Event subscription
  on<T extends EventType>(type: T, handler: EventHandler<T>): UnsubscribeFn
  once<T extends EventType>(type: T, handler: EventHandler<T>): UnsubscribeFn
  off<T extends EventType>(type: T, handler: EventHandler<T>): void
  
  // Wildcard subscription
  onAny(handler: WildcardHandler): UnsubscribeFn
  
  // Event filtering
  addFilter(filter: EventFilter): void
  removeFilter(filter: EventFilter): void
  
  // Management
  clear(): void
  getListenerCount(type?: EventType): number
  getEventTypes(): EventType[]
}

export type EventType = 
  | 'action_executed'
  | 'action_failed'
  | 'state_changed'
  | 'resource_changed'
  | 'process_started'
  | 'process_completed'
  | 'process_failed'
  | 'crop_planted'
  | 'crop_harvested'
  | 'adventure_started'
  | 'adventure_completed'
  | 'item_purchased'
  | 'structure_built'
  | 'level_up'
  | 'achievement_unlocked'
  | 'bottleneck_detected'
  | 'error'
  | 'warning'
  | 'info'

export interface EventData {
  action_executed: { action: GameAction; result: ActionResult }
  action_failed: { action: GameAction; error: string }
  state_changed: { changes: StateChanges; source: string }
  resource_changed: { resource: string; oldValue: number; newValue: number }
  process_started: { processId: string; type: ProcessType; data: any }
  process_completed: { processId: string; type: ProcessType; result: any }
  crop_planted: { cropId: string; plotIndex: number }
  crop_harvested: { cropId: string; energy: number }
  adventure_started: { routeId: string; length: string }
  adventure_completed: { routeId: string; rewards: any }
  item_purchased: { itemId: string; cost: ResourceCost }
  structure_built: { structureId: string; unlocks: string[] }
  level_up: { oldLevel: number; newLevel: number; xp: number }
  achievement_unlocked: { achievementId: string; name: string }
  bottleneck_detected: { type: string; details: any }
  error: { message: string; stack?: string; context?: any }
  warning: { message: string; context?: any }
  info: { message: string; data?: any }
}

export type EventHandler<T extends EventType> = (
  event: Event<T>
) => void | Promise<void>

export type WildcardHandler = (
  event: Event<EventType>
) => void | Promise<void>

export type UnsubscribeFn = () => void

export interface Event<T extends EventType> {
  type: T
  data: EventData[T]
  timestamp: number
  source?: string
  metadata?: any
}
```

### Implementation:
```typescript
export class EventBus implements IEventBus {
  private handlers: Map<EventType, Set<EventHandler<any>>>
  private wildcardHandlers: Set<WildcardHandler>
  private filters: EventFilter[]
  private eventQueue: Event<any>[]
  private isProcessing: boolean
  private logger?: IEventLogger
  
  constructor(logger?: IEventLogger) {
    this.handlers = new Map()
    this.wildcardHandlers = new Set()
    this.filters = []
    this.eventQueue = []
    this.isProcessing = false
    this.logger = logger
  }
  
  emit<T extends EventType>(type: T, data: EventData[T]): void {
    const event: Event<T> = {
      type,
      data,
      timestamp: Date.now(),
      source: this.getCallSource()
    }
    
    // Apply filters
    if (!this.shouldEmit(event)) {
      return
    }
    
    // Log event
    this.logger?.log(event)
    
    // Queue event to prevent recursive emissions
    this.eventQueue.push(event)
    
    if (!this.isProcessing) {
      this.processEventQueue()
    }
  }
  
  async emitAsync<T extends EventType>(type: T, data: EventData[T]): Promise<void> {
    const event: Event<T> = {
      type,
      data,
      timestamp: Date.now(),
      source: this.getCallSource()
    }
    
    // Apply filters
    if (!this.shouldEmit(event)) {
      return
    }
    
    // Log event
    this.logger?.log(event)
    
    // Process handlers asynchronously
    const handlers = this.handlers.get(type) || new Set()
    const promises: Promise<void>[] = []
    
    // Type-specific handlers
    for (const handler of handlers) {
      promises.push(this.safeHandleAsync(handler, event))
    }
    
    // Wildcard handlers
    for (const handler of this.wildcardHandlers) {
      promises.push(this.safeHandleAsync(handler, event))
    }
    
    await Promise.all(promises)
  }
  
  on<T extends EventType>(type: T, handler: EventHandler<T>): UnsubscribeFn {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    
    this.handlers.get(type)!.add(handler)
    
    return () => this.off(type, handler)
  }
  
  once<T extends EventType>(type: T, handler: EventHandler<T>): UnsubscribeFn {
    const wrappedHandler: EventHandler<T> = (event) => {
      handler(event)
      this.off(type, wrappedHandler)
    }
    
    return this.on(type, wrappedHandler)
  }
  
  off<T extends EventType>(type: T, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(type)
    if (handlers) {
      handlers.delete(handler)
      
      if (handlers.size === 0) {
        this.handlers.delete(type)
      }
    }
  }
  
  onAny(handler: WildcardHandler): UnsubscribeFn {
    this.wildcardHandlers.add(handler)
    
    return () => {
      this.wildcardHandlers.delete(handler)
    }
  }
  
  private processEventQueue(): void {
    this.isProcessing = true
    
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!
      
      // Process type-specific handlers
      const handlers = this.handlers.get(event.type) || new Set()
      for (const handler of handlers) {
        this.safeHandle(handler, event)
      }
      
      // Process wildcard handlers
      for (const handler of this.wildcardHandlers) {
        this.safeHandle(handler, event)
      }
    }
    
    this.isProcessing = false
  }
  
  private safeHandle(handler: Function, event: Event<any>): void {
    try {
      handler(event)
    } catch (error) {
      console.error('Event handler error:', error)
      
      // Emit error event (but avoid infinite loop)
      if (event.type !== 'error') {
        this.emit('error', {
          message: `Handler error for ${event.type}`,
          stack: error.stack,
          context: { event, error }
        })
      }
    }
  }
  
  private async safeHandleAsync(handler: Function, event: Event<any>): Promise<void> {
    try {
      await handler(event)
    } catch (error) {
      console.error('Async event handler error:', error)
      
      if (event.type !== 'error') {
        this.emit('error', {
          message: `Async handler error for ${event.type}`,
          stack: error.stack,
          context: { event, error }
        })
      }
    }
  }
  
  private shouldEmit(event: Event<any>): boolean {
    for (const filter of this.filters) {
      if (!filter(event)) {
        return false
      }
    }
    return true
  }
  
  private getCallSource(): string {
    // Get calling function from stack trace
    const stack = new Error().stack
    if (!stack) return 'unknown'
    
    const lines = stack.split('\n')
    // Skip first 3 lines (Error, this function, emit function)
    const callerLine = lines[3] || 'unknown'
    
    // Extract function name
    const match = callerLine.match(/at (\S+)/)
    return match ? match[1] : 'unknown'
  }
  
  clear(): void {
    this.handlers.clear()
    this.wildcardHandlers.clear()
    this.eventQueue = []
  }
  
  getListenerCount(type?: EventType): number {
    if (type) {
      return (this.handlers.get(type)?.size || 0) + this.wildcardHandlers.size
    }
    
    let total = this.wildcardHandlers.size
    for (const handlers of this.handlers.values()) {
      total += handlers.size
    }
    return total
  }
  
  getEventTypes(): EventType[] {
    return Array.from(this.handlers.keys())
  }
}

export type EventFilter = (event: Event<any>) => boolean
```

## 2. EventLogger.ts - Event Logging and History

```typescript
export interface IEventLogger {
  log(event: Event<any>): void
  getHistory(filter?: LogFilter): Event<any>[]
  clearHistory(): void
  export(): string
  import(data: string): void
}

export interface LogFilter {
  types?: EventType[]
  startTime?: number
  endTime?: number
  source?: string
  limit?: number
}

export class EventLogger implements IEventLogger {
  private history: Event<any>[]
  private maxHistorySize: number
  private logToConsole: boolean
  private logLevel: LogLevel
  
  constructor(options: EventLoggerOptions = {}) {
    this.history = []
    this.maxHistorySize = options.maxHistorySize || 10000
    this.logToConsole = options.logToConsole ?? true
    this.logLevel = options.logLevel || 'info'
  }
  
  log(event: Event<any>): void {
    // Add to history
    this.history.push(event)
    
    // Trim history if too large
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
    }
    
    // Console logging
    if (this.logToConsole && this.shouldLog(event)) {
      this.logToConsole(event)
    }
  }
  
  private shouldLog(event: Event<any>): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warning', 'error']
    const eventLevel = this.getEventLevel(event)
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const eventLevelIndex = levels.indexOf(eventLevel)
    
    return eventLevelIndex >= currentLevelIndex
  }
  
  private getEventLevel(event: Event<any>): LogLevel {
    switch (event.type) {
      case 'error':
        return 'error'
      case 'warning':
        return 'warning'
      case 'info':
      case 'action_executed':
      case 'state_changed':
        return 'info'
      default:
        return 'debug'
    }
  }
  
  private logToConsole(event: Event<any>): void {
    const level = this.getEventLevel(event)
    const timestamp = new Date(event.timestamp).toISOString()
    const message = `[${timestamp}] ${event.type}`
    
    switch (level) {
      case 'error':
        console.error(message, event.data)
        break
      case 'warning':
        console.warn(message, event.data)
        break
      case 'info':
        console.info(message, event.data)
        break
      default:
        console.log(message, event.data)
    }
  }
  
  getHistory(filter?: LogFilter): Event<any>[] {
    let filtered = [...this.history]
    
    if (filter) {
      if (filter.types) {
        filtered = filtered.filter(e => filter.types!.includes(e.type))
      }
      
      if (filter.startTime) {
        filtered = filtered.filter(e => e.timestamp >= filter.startTime!)
      }
      
      if (filter.endTime) {
        filtered = filtered.filter(e => e.timestamp <= filter.endTime!)
      }
      
      if (filter.source) {
        filtered = filtered.filter(e => e.source === filter.source)
      }
      
      if (filter.limit) {
        filtered = filtered.slice(-filter.limit)
      }
    }
    
    return filtered
  }
  
  clearHistory(): void {
    this.history = []
  }
  
  export(): string {
    return JSON.stringify(this.history, null, 2)
  }
  
  import(data: string): void {
    try {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        this.history = parsed
      }
    } catch (error) {
      console.error('Failed to import event history:', error)
    }
  }
  
  getStatistics(): EventStatistics {
    const stats: EventStatistics = {
      totalEvents: this.history.length,
      eventCounts: {},
      averageEventsPerMinute: 0,
      peakEventsPerMinute: 0
    }
    
    // Count events by type
    for (const event of this.history) {
      stats.eventCounts[event.type] = (stats.eventCounts[event.type] || 0) + 1
    }
    
    // Calculate rate statistics
    if (this.history.length > 0) {
      const firstTime = this.history[0].timestamp
      const lastTime = this.history[this.history.length - 1].timestamp
      const durationMinutes = (lastTime - firstTime) / 60000
      
      if (durationMinutes > 0) {
        stats.averageEventsPerMinute = this.history.length / durationMinutes
      }
    }
    
    return stats
  }
}

export interface EventLoggerOptions {
  maxHistorySize?: number
  logToConsole?: boolean
  logLevel?: LogLevel
}

export type LogLevel = 'debug' | 'info' | 'warning' | 'error'

export interface EventStatistics {
  totalEvents: number
  eventCounts: Record<string, number>
  averageEventsPerMinute: number
  peakEventsPerMinute: number
}
```

## 3. EventReplay.ts - Event Replay System

```typescript
export class EventReplay {
  private eventBus: IEventBus
  private speed: number
  private isPlaying: boolean
  private currentIndex: number
  private events: Event<any>[]
  private replayTimer?: NodeJS.Timeout
  
  constructor(eventBus: IEventBus) {
    this.eventBus = eventBus
    this.speed = 1
    this.isPlaying = false
    this.currentIndex = 0
    this.events = []
  }
  
  loadEvents(events: Event<any>[]): void {
    this.events = [...events]
    this.currentIndex = 0
  }
  
  play(speed: number = 1): void {
    if (this.isPlaying) return
    
    this.speed = speed
    this.isPlaying = true
    this.scheduleNextEvent()
  }
  
  pause(): void {
    this.isPlaying = false
    
    if (this.replayTimer) {
      clearTimeout(this.replayTimer)
      this.replayTimer = undefined
    }
  }
  
  stop(): void {
    this.pause()
    this.currentIndex = 0
  }
  
  stepForward(): void {
    if (this.currentIndex < this.events.length) {
      this.replayEvent(this.events[this.currentIndex])
      this.currentIndex++
    }
  }
  
  stepBackward(): void {
    // Note: This would require state snapshots to properly implement
    console.warn('Step backward not implemented - requires state snapshots')
  }
  
  private scheduleNextEvent(): void {
    if (!this.isPlaying || this.currentIndex >= this.events.length) {
      this.stop()
      return
    }
    
    const currentEvent = this.events[this.currentIndex]
    const nextEvent = this.events[this.currentIndex + 1]
    
    // Replay current event
    this.replayEvent(currentEvent)
    this.currentIndex++
    
    if (nextEvent) {
      // Calculate delay until next event
      const delay = (nextEvent.timestamp - currentEvent.timestamp) / this.speed
      
      this.replayTimer = setTimeout(() => {
        this.scheduleNextEvent()
      }, Math.max(0, delay))
    } else {
      this.stop()
    }
  }
  
  private replayEvent(event: Event<any>): void {
    // Mark as replay to avoid double-logging
    const replayEvent = {
      ...event,
      metadata: {
        ...event.metadata,
        isReplay: true,
        originalTimestamp: event.timestamp,
        replayTimestamp: Date.now()
      }
    }
    
    this.eventBus.emit(event.type, event.data)
  }
  
  getProgress(): ReplayProgress {
    return {
      currentIndex: this.currentIndex,
      totalEvents: this.events.length,
      isPlaying: this.isPlaying,
      speed: this.speed,
      currentTime: this.events[this.currentIndex]?.timestamp || 0,
      totalTime: this.events.length > 0
        ? this.events[this.events.length - 1].timestamp - this.events[0].timestamp
        : 0
    }
  }
}

export interface ReplayProgress {
  currentIndex: number
  totalEvents: number
  isPlaying: boolean
  speed: number
  currentTime: number
  totalTime: number
}
```

## Migration Strategy for Phase 9I

### Step 1: Create Event Module
```bash
mkdir -p src/utils/events/types
touch src/utils/events/EventBus.ts
touch src/utils/events/EventLogger.ts
touch src/utils/events/EventReplay.ts
touch src/utils/events/EventFilters.ts
```

### Step 2: Update SimulationEngine
```typescript
// SimulationEngine.ts
import { EventBus } from './events/EventBus'
import { EventLogger } from './events/EventLogger'

export class SimulationEngine {
  private eventBus: EventBus
  private eventLogger: EventLogger
  
  constructor(config: SimulationConfig, gameDataStore: GameDataStore) {
    this.eventLogger = new EventLogger({
      maxHistorySize: 10000,
      logLevel: config.debug ? 'debug' : 'info'
    })
    this.eventBus = new EventBus(this.eventLogger)
    
    // Setup event handlers
    this.setupEventHandlers()
    // ...
  }
  
  private setupEventHandlers(): void {
    // Handle bottleneck detection
    this.eventBus.on('bottleneck_detected', (event) => {
      console.warn('Bottleneck detected:', event.data)
      this.handleBottleneck(event.data)
    })
    
    // Handle errors
    this.eventBus.on('error', (event) => {
      console.error('System error:', event.data)
    })
    
    // Handle achievements
    this.eventBus.on('achievement_unlocked', (event) => {
      console.log('Achievement unlocked:', event.data.name)
    })
  }
  
  // Replace direct logging with events
  private executeAction(action: GameAction): boolean {
    const result = this.executor.execute(action, this.gameState, this.gameDataStore, this.systems)
    
    if (result.success) {
      this.eventBus.emit('action_executed', {
        action,
        result
      })
    } else {
      this.eventBus.emit('action_failed', {
        action,
        error: result.error || 'Unknown error'
      })
    }
    
    return result.success
  }
  
  // Expose event bus for external listeners
  getEventBus(): IEventBus {
    return this.eventBus
  }
  
  // Get event history for analysis
  getEventHistory(filter?: LogFilter): Event<any>[] {
    return this.eventLogger.getHistory(filter)
  }
}
```

### Step 3: Connect Systems to Event Bus
```typescript
// In system files
export class AdventureSystem {
  private eventBus: IEventBus
  
  constructor(eventBus: IEventBus) {
    this.eventBus = eventBus
  }
  
  startAdventure(routeId: string, length: string, gameState: GameState): void {
    // ... start adventure logic
    
    this.eventBus.emit('adventure_started', {
      routeId,
      length
    })
  }
  
  completeAdventure(routeId: string, rewards: any): void {
    // ... complete adventure logic
    
    this.eventBus.emit('adventure_completed', {
      routeId,
      rewards
    })
  }
}
```

## Testing Strategy

```typescript
describe('EventBus', () => {
  let eventBus: EventBus
  
  beforeEach(() => {
    eventBus = new EventBus()
  })
  
  it('should emit and handle events', (done) => {
    eventBus.on('test_event', (event) => {
      expect(event.data.value).toBe(42)
      done()
    })
    
    eventBus.emit('test_event', { value: 42 })
  })
  
  it('should handle once subscriptions', () => {
    let count = 0
    
    eventBus.once('test_event', () => {
      count++
    })
    
    eventBus.emit('test_event', {})
    eventBus.emit('test_event', {})
    
    expect(count).toBe(1)
  })
  
  it('should support wildcard handlers', () => {
    const events: string[] = []
    
    eventBus.onAny((event) => {
      events.push(event.type)
    })
    
    eventBus.emit('event1', {})
    eventBus.emit('event2', {})
    
    expect(events).toEqual(['event1', 'event2'])
  })
})

describe('EventLogger', () => {
  it('should maintain event history', () => {
    const logger = new EventLogger({ maxHistorySize: 100 })
    const eventBus = new EventBus(logger)
    
    eventBus.emit('test1', { value: 1 })
    eventBus.emit('test2', { value: 2 })
    
    const history = logger.getHistory()
    expect(history).toHaveLength(2)
    expect(history[0].type).toBe('test1')
    expect(history[1].type).toBe('test2')
  })
  
  it('should filter event history', () => {
    const logger = new EventLogger()
    const eventBus = new EventBus(logger)
    
    eventBus.emit('action_executed', { action: {}, result: {} })
    eventBus.emit('error', { message: 'test error' })
    
    const errors = logger.getHistory({ types: ['error'] })
    expect(errors).toHaveLength(1)
    expect(errors[0].type).toBe('error')
  })
})
```

## Benefits After Phase 9I

1. **Loose Coupling**: Systems communicate through events
2. **Event History**: Complete audit trail of all events
3. **Debugging**: Event replay for reproducing issues
4. **Extensibility**: Easy to add new event handlers
5. **SimulationEngine Reduction**: ~200 lines moved out
6. **Analytics**: Event statistics and analysis

## Common Pitfalls and Solutions

### Pitfall 1: Event Storms
**Problem**: Too many events overwhelming the system
**Solution**: Event filtering and throttling

### Pitfall 2: Memory Leaks
**Problem**: Event handlers not cleaned up
**Solution**: Unsubscribe functions and weak references

### Pitfall 3: Infinite Loops
**Problem**: Event handlers triggering more events
**Solution**: Event queue and processing flag

## Next Phase Preview
Phase 9J will complete the refactor by simplifying SimulationEngine into a pure orchestrator, coordinating all extracted modules and reducing it to under 500 lines.