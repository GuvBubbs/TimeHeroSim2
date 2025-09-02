// Simple test to verify event system functionality
import { eventBus, eventLogger } from './src/utils/events'

console.log('🧪 Testing event system...')

// Test 1: Basic event emission and handling
let testEventReceived = false
const unsubscribe = eventBus.on('info', (event) => {
  console.log('✅ Test 1 passed: Event received:', event.type)
  testEventReceived = true
})

eventBus.emit('info', {
  message: 'Test message',
  source: 'test-script'
})

// Test 2: Event logging
const historyBefore = eventLogger.getHistory().length
eventBus.emit('resource_changed', {
  resource: 'energy',
  oldValue: 100,
  newValue: 90,
  delta: -10,
  source: 'test'
})

const historyAfter = eventLogger.getHistory().length
if (historyAfter > historyBefore) {
  console.log('✅ Test 2 passed: Event logged successfully')
} else {
  console.log('❌ Test 2 failed: Event not logged')
}

// Test 3: Event statistics
const stats = eventLogger.getStatistics()
console.log('✅ Test 3: Event statistics:', {
  totalEvents: stats.totalEvents,
  eventTypes: Object.keys(stats.eventCounts).length
})

// Cleanup
unsubscribe()

console.log('🎉 Event system tests completed')

export { testEventReceived }
