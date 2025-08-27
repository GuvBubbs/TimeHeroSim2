<!-- LiveMonitor View - Phase 6B Testing Implementation -->
<template>
  <div class="min-h-screen bg-sim-background text-sim-text p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-sim-accent mb-2">Live Monitor</h1>
      <p class="text-sim-text-secondary">
        Phase 6B Testing - Web Worker Simulation Engine
      </p>
    </div>

    <!-- Status Panel -->
    <div class="bg-sim-surface border border-sim-border rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Simulation Status</h2>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div class="text-center">
          <div class="text-2xl font-bold" :class="{
            'text-green-400': bridgeStatus.isInitialized,
            'text-red-400': !bridgeStatus.isInitialized
          }">
            {{ bridgeStatus.isInitialized ? 'Ready' : 'Not Ready' }}
          </div>
          <div class="text-sm text-sim-text-secondary">Bridge Status</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold" :class="{
            'text-green-400': bridgeStatus.isRunning,
            'text-yellow-400': !bridgeStatus.isRunning && bridgeStatus.isInitialized,
            'text-red-400': !bridgeStatus.isInitialized
          }">
            {{ bridgeStatus.isRunning ? 'Running' : 'Stopped' }}
          </div>
          <div class="text-sm text-sim-text-secondary">Simulation</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-sim-accent">
            {{ currentStats?.currentSpeed?.toFixed(1) || '0' }}x
          </div>
          <div class="text-sm text-sim-text-secondary">Speed</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-sim-accent">
            {{ currentStats?.daysPassed || 0 }}
          </div>
          <div class="text-sm text-sim-text-secondary">Days</div>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex flex-wrap gap-3">
        <button 
          @click="initializeSimulation"
          :disabled="bridgeStatus.isInitialized"
          class="btn-primary"
        >
          <i class="fas fa-cog mr-2"></i>
          Initialize
        </button>
        
        <button 
          @click="startSimulation"
          :disabled="!bridgeStatus.isInitialized || bridgeStatus.isRunning"
          class="btn-success"
        >
          <i class="fas fa-play mr-2"></i>
          Start
        </button>
        
        <button 
          @click="pauseSimulation"
          :disabled="!bridgeStatus.isRunning"
          class="btn-warning"
        >
          <i class="fas fa-pause mr-2"></i>
          Pause
        </button>
        
        <button 
          @click="stopSimulation"
          :disabled="!bridgeStatus.isInitialized"
          class="btn-danger"
        >
          <i class="fas fa-stop mr-2"></i>
          Stop
        </button>
        
        <select 
          v-model="selectedSpeed" 
          @change="changeSpeed"
          :disabled="!bridgeStatus.isInitialized"
          class="bg-sim-surface border border-sim-border rounded px-3 py-2"
        >
          <option value="0.5">0.5x</option>
          <option value="1">1x</option>
          <option value="5">5x</option>
          <option value="10">10x</option>
          <option value="50">50x</option>
          <option value="100">100x</option>
        </select>
      </div>
    </div>

    <!-- Game State Preview -->
    <div v-if="currentState" class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Time & Resources -->
      <div class="bg-sim-surface border border-sim-border rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-3">Time & Resources</h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span>Day:</span>
            <span class="font-mono">{{ currentState.time.day }}</span>
          </div>
          <div class="flex justify-between">
            <span>Time:</span>
            <span class="font-mono">{{ formatTime(currentState.time) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Energy:</span>
            <span class="font-mono">{{ currentState.resources.energy.current }}/{{ currentState.resources.energy.max }}</span>
          </div>
          <div class="flex justify-between">
            <span>Gold:</span>
            <span class="font-mono">{{ currentState.resources.gold }}</span>
          </div>
          <div class="flex justify-between">
            <span>Water:</span>
            <span class="font-mono">{{ currentState.resources.water.current }}/{{ currentState.resources.water.max }}</span>
          </div>
        </div>
      </div>

      <!-- Progression -->
      <div class="bg-sim-surface border border-sim-border rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-3">Progression</h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span>Hero Level:</span>
            <span class="font-mono">{{ currentState.progression.heroLevel }}</span>
          </div>
          <div class="flex justify-between">
            <span>Farm Stage:</span>
            <span class="font-mono">{{ currentState.progression.farmStage }}</span>
          </div>
          <div class="flex justify-between">
            <span>Phase:</span>
            <span class="font-mono">{{ currentState.progression.currentPhase }}</span>
          </div>
          <div class="flex justify-between">
            <span>Screen:</span>
            <span class="font-mono">{{ currentState.location.currentScreen }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Log -->
    <div class="bg-sim-surface border border-sim-border rounded-lg p-4">
      <h3 class="text-lg font-semibold mb-3">Recent Events</h3>
      <div class="h-64 overflow-y-auto space-y-1">
        <div v-for="event in recentEvents.slice(-20)" :key="`${event.timestamp}-${Math.random()}`" 
             class="text-sm font-mono flex justify-between">
          <span class="text-sim-text-secondary">{{ formatTimestamp(event.timestamp) }}</span>
          <span>{{ event.description }}</span>
        </div>
        <div v-if="recentEvents.length === 0" class="text-sim-text-secondary text-center py-8">
          No events yet. Start the simulation to see activity.
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="errorMessage" class="mt-6 bg-red-900/20 border border-red-500 rounded-lg p-4">
      <h3 class="text-lg font-semibold text-red-400 mb-2">Error</h3>
      <p class="text-red-300">{{ errorMessage }}</p>
      <button @click="errorMessage = ''" class="mt-2 text-sm text-red-400 hover:text-red-300">
        Dismiss
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { SimulationBridge } from '@/utils/SimulationBridge'
import { SimulationBridgeTest } from '@/utils/SimulationBridgeTest'
import type { GameState, GameEvent, SimulationStats } from '@/types'

// State
const bridge = ref<SimulationBridge | null>(null)
const currentState = ref<GameState | null>(null)
const currentStats = ref<SimulationStats | null>(null)
const recentEvents = ref<GameEvent[]>([])
const selectedSpeed = ref('1')
const errorMessage = ref('')

const bridgeStatus = reactive({
  isInitialized: false,
  isRunning: false,
  hasWorker: false
})

// Methods
async function initializeSimulation() {
  try {
    errorMessage.value = ''
    
    console.log('🚀 Initializing simulation...')
    bridge.value = new SimulationBridge()
    
    // Set up event handlers
    bridge.value.onTick((data) => {
      currentState.value = data.gameState
      recentEvents.value.push(...data.events)
      
      // Keep only last 100 events
      if (recentEvents.value.length > 100) {
        recentEvents.value = recentEvents.value.slice(-100)
      }
    })
    
    bridge.value.onComplete((data) => {
      console.log('🏁 Simulation complete:', data.summary)
      recentEvents.value.push({
        timestamp: Date.now(),
        type: 'completion',
        description: data.summary,
        importance: 'critical'
      })
      updateBridgeStatus()
    })
    
    bridge.value.onError((data) => {
      console.error('❌ Simulation error:', data.message)
      errorMessage.value = data.message
    })
    
    // Create test configuration
    const config = SimulationBridgeTest.createTestConfig()
    
    // Initialize
    await bridge.value.initialize(config)
    
    console.log('✅ Simulation initialized successfully')
    updateBridgeStatus()
    
  } catch (error) {
    console.error('❌ Initialization failed:', error)
    errorMessage.value = error instanceof Error ? error.message : 'Initialization failed'
  }
}

async function startSimulation() {
  if (!bridge.value) return
  
  try {
    await bridge.value.start(parseFloat(selectedSpeed.value))
    console.log(`▶️ Simulation started at ${selectedSpeed.value}x speed`)
    updateBridgeStatus()
  } catch (error) {
    console.error('❌ Start failed:', error)
    errorMessage.value = error instanceof Error ? error.message : 'Start failed'
  }
}

function pauseSimulation() {
  if (!bridge.value) return
  
  bridge.value.pause()
  console.log('⏸️ Simulation paused')
  updateBridgeStatus()
}

function stopSimulation() {
  if (!bridge.value) return
  
  bridge.value.stop()
  console.log('⏹️ Simulation stopped')
  updateBridgeStatus()
}

function changeSpeed() {
  if (!bridge.value) return
  
  const speed = parseFloat(selectedSpeed.value)
  bridge.value.setSpeed(speed)
  console.log(`🚀 Speed changed to ${speed}x`)
}

function updateBridgeStatus() {
  if (bridge.value) {
    const status = bridge.value.getStatus()
    bridgeStatus.isInitialized = status.isInitialized
    bridgeStatus.isRunning = status.isRunning
    bridgeStatus.hasWorker = status.hasWorker
  }
}

function formatTime(time: { hour: number; minute: number }) {
  return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`
}

function formatTimestamp(timestamp: number) {
  const minutes = timestamp % 60
  const hours = Math.floor(timestamp / 60) % 24
  const days = Math.floor(timestamp / (60 * 24))
  
  if (days > 0) {
    return `D${days} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  } else {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }
}

// Stats polling
const statsInterval = ref<number | null>(null)

onMounted(() => {
  console.log('📊 LiveMonitor mounted - Phase 6B Testing')
  
  // Poll for stats every second
  statsInterval.value = setInterval(async () => {
    if (bridge.value && bridgeStatus.isInitialized) {
      try {
        const result = await bridge.value.getState()
        currentStats.value = result.stats
      } catch (error) {
        // Ignore polling errors
      }
    }
  }, 1000)
})

onBeforeUnmount(() => {
  console.log('🧹 LiveMonitor unmounting')
  
  if (statsInterval.value) {
    clearInterval(statsInterval.value)
  }
  
  if (bridge.value) {
    bridge.value.terminate()
  }
})
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-success {
  @apply bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-warning {
  @apply bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-danger {
  @apply bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
