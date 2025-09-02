// Quick test of the Event System
// This tests the core event bus functionality

import { EventBus } from './src/utils/events/EventBus.js'

console.log('🧪 Testing EventBus System...')

// Create event bus
const eventBus = new EventBus()

// Test basic event emission and subscription
let receivedEvent = null
const unsubscribe = eventBus.on('info', (event) => {
  receivedEvent = event
  console.log('📨 Received event:', event)
})

// Emit test event
eventBus.emit('info', { 
  message: 'Test event from EventBus', 
  data: { test: true } 
})

// Check if event was received
if (receivedEvent) {
  console.log('✅ Event system working - received:', receivedEvent.data.message)
} else {
  console.log('❌ Event system failed - no event received')
}

// Test unsubscribe
unsubscribe()
receivedEvent = null
eventBus.emit('info', { message: 'Should not be received' })

if (!receivedEvent) {
  console.log('✅ Unsubscribe working - no event received after unsubscribe')
} else {
  console.log('❌ Unsubscribe failed - still receiving events')
}

// Test wildcard handler
let wildcardCount = 0
const wildcardUnsubscribe = eventBus.onAny((event) => {
  wildcardCount++
  console.log('🌐 Wildcard received:', event.type)
})

eventBus.emit('info', { message: 'Wildcard test 1' })
eventBus.emit('error', { message: 'Wildcard test 2', error: 'test' })

if (wildcardCount === 2) {
  console.log('✅ Wildcard handler working - received 2 events')
} else {
  console.log('❌ Wildcard handler failed - received', wildcardCount, 'events')
}

wildcardUnsubscribe()

console.log('🏁 EventBus test complete')
