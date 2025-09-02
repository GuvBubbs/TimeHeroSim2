// Event index file - exports all event system components

export * from './types/EventTypes'
export * from './EventBus'
export * from './EventLogger'

// Create singleton instances for common use
import { EventBus } from './EventBus'
import { EventLogger } from './EventLogger'

export const eventBus = new EventBus()
export const eventLogger = new EventLogger({ maxHistorySize: 10000 })

// Connect logger to bus
eventBus.onAny((event) => {
  eventLogger.log(event)
})
