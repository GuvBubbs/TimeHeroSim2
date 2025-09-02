// EventBus - Central pub/sub event system for TimeHero Simulator
// Implements comprehensive event routing with async handler support

import type { 
  EventType, 
  EventDataMap, 
  BaseEvent, 
  EventHandler, 
  WildcardHandler, 
  UnsubscribeFn, 
  EventFilter 
} from './types/EventTypes'

/**
 * Event bus interface
 */
export interface IEventBus {
  // Event emission
  emit<T extends EventType>(type: T, data: EventDataMap[T], metadata?: any): void
  emitAsync<T extends EventType>(type: T, data: EventDataMap[T], metadata?: any): Promise<void>
  
  // Event subscription
  on<T extends EventType>(type: T, handler: EventHandler<T>): UnsubscribeFn
  once<T extends EventType>(type: T, handler: EventHandler<T>): UnsubscribeFn
  off<T extends EventType>(type: T, handler: EventHandler<T>): void
  
  // Wildcard subscription
  onAny(handler: WildcardHandler): UnsubscribeFn
  
  // Event filtering
  addFilter(filter: EventFilter): void
  removeFilter(filter: EventFilter): void
  
  // Game metadata management
  updateGameMetadata(metadata: { tickCount?: number; gameDay?: number; gameTime?: string }): void
  
  // Management
  clear(): void
  getListenerCount(type?: EventType): number
  getEventTypes(): EventType[]
  isProcessing(): boolean
}

/**
 * Central event bus implementation
 */
export class EventBus implements IEventBus {
  private handlers: Map<EventType, Set<EventHandler<any>>>
  private wildcardHandlers: Set<WildcardHandler>
  private filters: EventFilter[]
  private eventQueue: BaseEvent<any>[]
  private processing: boolean = false
  private gameMetadata: {
    tickCount?: number
    gameDay?: number
    gameTime?: string
  } = {}
  
  constructor() {
    this.handlers = new Map()
    this.wildcardHandlers = new Set()
    this.filters = []
    this.eventQueue = []
    
    console.log('🌐 EventBus: Initialized')
  }
  
  /**
   * Emit an event synchronously
   */
  emit<T extends EventType>(type: T, data: EventDataMap[T], metadata?: any): void {
    const event: BaseEvent<T> = {
      type,
      data,
      timestamp: Date.now(),
      source: this.getCallSource(),
      metadata: {
        ...this.gameMetadata,
        ...metadata
      }
    }
    
    this.queueEvent(event)
    this.processEventQueue()
  }
  
  /**
   * Emit an event asynchronously
   */
  async emitAsync<T extends EventType>(type: T, data: EventDataMap[T], metadata?: any): Promise<void> {
    const event: BaseEvent<T> = {
      type,
      data,
      timestamp: Date.now(),
      source: this.getCallSource(),
      metadata: {
        ...this.gameMetadata,
        ...metadata
      }
    }
    
    this.queueEvent(event)
    await this.processEventQueueAsync()
  }
  
  /**
   * Subscribe to events of a specific type
   */
  on<T extends EventType>(type: T, handler: EventHandler<T>): UnsubscribeFn {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    
    this.handlers.get(type)!.add(handler)
    
    return () => this.off(type, handler)
  }
  
  /**
   * Subscribe to a single event occurrence
   */
  once<T extends EventType>(type: T, handler: EventHandler<T>): UnsubscribeFn {
    const wrappedHandler: EventHandler<T> = (event) => {
      handler(event)
      this.off(type, wrappedHandler)
    }
    
    return this.on(type, wrappedHandler)
  }
  
  /**
   * Unsubscribe from events
   */
  off<T extends EventType>(type: T, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(type)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.handlers.delete(type)
      }
    }
  }
  
  /**
   * Subscribe to all events
   */
  onAny(handler: WildcardHandler): UnsubscribeFn {
    this.wildcardHandlers.add(handler)
    return () => {
      this.wildcardHandlers.delete(handler)
    }
  }
  
  /**
   * Add an event filter
   */
  addFilter(filter: EventFilter): void {
    this.filters.push(filter)
  }
  
  /**
   * Remove an event filter
   */
  removeFilter(filter: EventFilter): void {
    const index = this.filters.indexOf(filter)
    if (index > -1) {
      this.filters.splice(index, 1)
    }
  }
  
  /**
   * Clear all handlers and filters
   */
  clear(): void {
    this.handlers.clear()
    this.wildcardHandlers.clear()
    this.filters = []
    this.eventQueue = []
    console.log('🧹 EventBus: Cleared all handlers and filters')
  }
  
  /**
   * Get number of listeners for a type or total
   */
  getListenerCount(type?: EventType): number {
    if (type) {
      return this.handlers.get(type)?.size || 0
    }
    
    let total = this.wildcardHandlers.size
    this.handlers.forEach((handlers) => {
      total += handlers.size
    })
    return total
  }
  
  /**
   * Get all registered event types
   */
  getEventTypes(): EventType[] {
    return Array.from(this.handlers.keys())
  }
  
  /**
   * Check if events are currently being processed
   */
  isProcessing(): boolean {
    return this.processing
  }
  
  /**
   * Update game metadata for events
   */
  updateGameMetadata(metadata: { tickCount?: number; gameDay?: number; gameTime?: string }): void {
    this.gameMetadata = { ...this.gameMetadata, ...metadata }
  }
  
  /**
   * Get current event queue size
   */
  getQueueSize(): number {
    return this.eventQueue.length
  }
  
  // Private methods
  
  /**
   * Queue an event for processing
   */
  private queueEvent(event: BaseEvent<any>): void {
    if (this.shouldEmitEvent(event)) {
      this.eventQueue.push(event)
    }
  }
  
  /**
   * Process event queue synchronously
   */
  private processEventQueue(): void {
    if (this.processing) return
    
    this.processing = true
    
    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!
        this.handleEvent(event)
      }
    } catch (error) {
      console.error('❌ EventBus: Error processing event queue:', error)
    } finally {
      this.processing = false
    }
  }
  
  /**
   * Process event queue asynchronously
   */
  private async processEventQueueAsync(): Promise<void> {
    if (this.processing) return
    
    this.processing = true
    
    try {
      const promises: Promise<void>[] = []
      
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!
        promises.push(this.handleEventAsync(event))
      }
      
      await Promise.all(promises)
    } catch (error) {
      console.error('❌ EventBus: Error processing async event queue:', error)
    } finally {
      this.processing = false
    }
  }
  
  /**
   * Handle a single event synchronously
   */
  private handleEvent(event: BaseEvent<any>): void {
    // Handle specific type handlers
    const typeHandlers = this.handlers.get(event.type)
    if (typeHandlers) {
      typeHandlers.forEach((handler) => {
        this.safeHandle(handler, event)
      })
    }
    
    // Handle wildcard handlers
    this.wildcardHandlers.forEach((handler) => {
      this.safeHandle(handler, event)
    })
  }
  
  /**
   * Handle a single event asynchronously
   */
  private async handleEventAsync(event: BaseEvent<any>): Promise<void> {
    const promises: Promise<void>[] = []
    
    // Handle specific type handlers
    const typeHandlers = this.handlers.get(event.type)
    if (typeHandlers) {
      typeHandlers.forEach((handler) => {
        promises.push(this.safeHandleAsync(handler, event))
      })
    }
    
    // Handle wildcard handlers
    this.wildcardHandlers.forEach((handler) => {
      promises.push(this.safeHandleAsync(handler, event))
    })
    
    await Promise.all(promises)
  }
  
  /**
   * Safely execute a handler with error catching
   */
  private safeHandle(handler: Function, event: BaseEvent<any>): void {
    try {
      const result = handler(event)
      
      // Handle async handlers that return promises
      if (result && typeof result.catch === 'function') {
        result.catch((error: any) => {
          console.error(`❌ EventBus: Async handler error for ${event.type}:`, error)
        })
      }
    } catch (error) {
      console.error(`❌ EventBus: Handler error for ${event.type}:`, error)
    }
  }
  
  /**
   * Safely execute a handler asynchronously
   */
  private async safeHandleAsync(handler: Function, event: BaseEvent<any>): Promise<void> {
    try {
      await handler(event)
    } catch (error) {
      console.error(`❌ EventBus: Async handler error for ${event.type}:`, error)
    }
  }
  
  /**
   * Check if an event should be emitted based on filters
   */
  private shouldEmitEvent(event: BaseEvent<any>): boolean {
    for (const filter of this.filters) {
      if (!filter(event)) {
        return false
      }
    }
    return true
  }
  
  /**
   * Get the calling function name from stack trace
   */
  private getCallSource(): string {
    const stack = new Error().stack
    if (!stack) return 'unknown'
    
    const lines = stack.split('\n')
    // Skip Error, getCallSource, emit/emitAsync, and look for actual caller
    const callerLine = lines[4] || lines[3] || lines[2]
    
    const match = callerLine.match(/at\s+([^(]+)/)
    return match ? match[1].trim() : 'unknown'
  }
}

/**
 * Global event bus instance
 */
export const eventBus = new EventBus()

/**
 * Event bus factory for creating isolated instances
 */
export function createEventBus(): EventBus {
  return new EventBus()
}
