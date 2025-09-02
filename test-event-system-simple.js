// Simple test to verify the event system works
import { eventBus } from './src/utils/events/EventBus.js'

console.log('Testing Event System...')

// Test basic subscription and emission
let testEventReceived = false
const unsubscribe = eventBus.on('test_event', (data) => {
  console.log('✅ Test event received:', data)
  testEventReceived = true
})

// Emit a test event
eventBus.emit('test_event', { message: 'Hello from EventBus!' })

setTimeout(() => {
  if (testEventReceived) {
    console.log('✅ Event system is working!')
  } else {
    console.log('❌ Event system failed')
  }
  
  unsubscribe()
  console.log('✅ Cleanup completed')
}, 100)
