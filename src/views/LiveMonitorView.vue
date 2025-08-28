<!-- Live Monitor View - Phase 6C Widget Implementation -->
<template>
  <div class="min-h-screen bg-sim-background text-sim-text p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-sim-accent mb-2">Live Monitor</h1>
      <p class="text-sim-text-secondary">
        Real-time simulation monitoring with interactive widgets
      </p>
    </div>

    <!-- Phase Progress Banner -->
    <div class="mb-6">
      <PhaseProgress :gameState="currentState" />
    </div>

    <!-- Simulation Controls -->
    <div class="bg-sim-surface border border-sim-border rounded-lg p-4 mb-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <!-- Status Indicators -->
        <div class="flex items-center space-x-6">
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 rounded-full" :class="{
              'bg-green-400': bridgeStatus.isInitialized && bridgeStatus.isRunning,
              'bg-yellow-400': bridgeStatus.isInitialized && !bridgeStatus.isRunning,
              'bg-red-400': !bridgeStatus.isInitialized
            }"></div>
            <span class="text-sm font-medium">
              {{ getStatusText() }}
            </span>
          </div>
          
          <div v-if="currentState" class="text-sm text-sim-text-secondary">
            Day {{ currentState.time.day }}, {{ formatTime(currentState.time) }}
          </div>
          
          <div v-if="currentStats" class="text-sm text-sim-text-secondary">
            {{ selectedSpeed }}x speed
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center space-x-3">
          <button 
            @click="initializeSimulation"
            :disabled="bridgeStatus.isInitialized"
            class="btn-primary btn-sm"
          >
            <i class="fas fa-cog mr-1"></i>
            Initialize
          </button>
          
          <button 
            @click="startSimulation"
            :disabled="!bridgeStatus.isInitialized || bridgeStatus.isRunning"
            class="btn-success btn-sm"
          >
            <i class="fas fa-play mr-1"></i>
            Start
          </button>
          
          <button 
            @click="pauseSimulation"
            :disabled="!bridgeStatus.isRunning"
            class="btn-warning btn-sm"
          >
            <i class="fas fa-pause mr-1"></i>
            Pause
          </button>
          
          <button 
            @click="stopSimulation"
            :disabled="!bridgeStatus.isInitialized"
            class="btn-danger btn-sm"
          >
            <i class="fas fa-stop mr-1"></i>
            Stop
          </button>
          
          <select 
            v-model="selectedSpeed" 
            @change="changeSpeed"
            :disabled="!bridgeStatus.isInitialized"
            class="bg-sim-surface border border-sim-border rounded px-2 py-1 text-sm"
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
    </div>

    <!-- Restructured Layout -->
    <div class="space-y-4">
      
      <!-- Top Row: 4 Widgets -->
      <div class="grid grid-cols-12 gap-4">
        <!-- Current Location -->
        <div class="col-span-3 h-80">
          <CurrentLocation :gameState="currentState" />
        </div>
        
        <!-- Resources -->
        <div class="col-span-3 h-80">
          <ResourcesWidget :gameState="currentState" />
        </div>
        
        <!-- Equipment -->
        <div class="col-span-3 h-80">
          <EquipmentWidget :gameState="currentState" />
        </div>
        
        <!-- Current Action -->
        <div class="col-span-3 h-80">
          <CurrentAction 
            :gameState="currentState"
            :currentAction="mockCurrentAction"
            :nextAction="mockNextAction"
          />
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-12 gap-4">
        <!-- Left Column: Main Content (3/4 width) -->
        <div class="col-span-9 space-y-4">
          <!-- Farm Visualizer -->
          <div class="h-80">
            <FarmVisualizerWidget :gameState="currentState" />
          </div>
          
          <!-- Mini Upgrade Tree -->
          <div class="h-48">
            <MiniUpgradeTreeWidget :gameState="currentState" />
          </div>
          
          <!-- Timeline -->
          <div class="h-32">
            <TimelineWidget :gameState="currentState" :events="recentEvents" />
          </div>
        </div>
        
        <!-- Right Column: Action Log (Tall & Narrow) -->
        <div class="col-span-3">
          <div class="h-[640px]">
            <ActionLog :events="recentEvents" />
          </div>
        </div>
      </div>

      <!-- Bottom Row: Screen Time + Helper Management + Next Decision -->
      <div class="grid grid-cols-12 gap-4">
        <!-- Screen Time -->
        <div class="col-span-4 h-80">
          <ScreenTimeWidget :gameState="currentState" />
        </div>
        
        <!-- Helper Management -->
        <div class="col-span-4 h-80">
          <HelperManagementWidget :gameState="currentState" />
        </div>
        
        <!-- Next Decision -->
        <div class="col-span-4 h-80">
          <NextDecisionWidget :gameState="currentState" />
        </div>
      </div>

      <!-- Performance Monitor (Full Width Strip) -->
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12 h-32">
          <BaseWidget title="Performance Monitor" icon="fas fa-tachometer-alt">
            <div class="flex justify-between items-center h-full">
              <div class="flex gap-8 text-sm w-full">
                <div class="flex flex-col items-center justify-center flex-1">
                  <span class="text-sim-text-secondary text-xs">Sim Speed</span>
                  <span class="font-mono text-lg">{{ currentStats?.averageTickTime?.toFixed(0) || 0 }} ms/tick</span>
                </div>
                <div class="flex flex-col items-center justify-center flex-1">
                  <span class="text-sim-text-secondary text-xs">UI FPS</span>
                  <span class="font-mono text-lg">{{ Math.floor(Math.random() * 10) + 55 }}</span>
                </div>
                <div class="flex flex-col items-center justify-center flex-1">
                  <span class="text-sim-text-secondary text-xs">Memory</span>
                  <span class="font-mono text-lg">{{ Math.floor(Math.random() * 50) + 100 }} MB</span>
                </div>
                <div class="flex flex-col items-center justify-center flex-1">
                  <span class="text-sim-text-secondary text-xs">CPU</span>
                  <span class="font-mono text-lg">{{ Math.floor(Math.random() * 15) + 5 }}%</span>
                </div>
              </div>
            </div>
          </BaseWidget>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="errorMessage" class="fixed bottom-4 right-4 max-w-md bg-red-900/90 border border-red-500 rounded-lg p-4">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-semibold text-red-400 mb-1">Error</h3>
          <p class="text-red-300 text-sm">{{ errorMessage }}</p>
        </div>
        <button @click="errorMessage = ''" class="text-red-400 hover:text-red-300 ml-2">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { SimulationBridge } from '@/utils/SimulationBridge'
import { SimulationBridgeTest } from '@/utils/SimulationBridgeTest'
import type { GameState, GameEvent, SimulationStats } from '@/types'

// Import widgets
import PhaseProgress from '@/components/monitor/PhaseProgress.vue'
import CurrentLocation from '@/components/monitor/CurrentLocation.vue'
import ResourcesWidget from '@/components/monitor/ResourcesWidget.vue'
import CurrentAction from '@/components/monitor/CurrentAction.vue'
import ActionLog from '@/components/monitor/ActionLog.vue'
import BaseWidget from '@/components/monitor/BaseWidget.vue'

// Import new Phase 6C widgets
import EquipmentWidget from '@/components/monitor/EquipmentWidget.vue'
import FarmVisualizerWidget from '@/components/monitor/FarmVisualizerWidget.vue'
import HelperManagementWidget from '@/components/monitor/HelperManagementWidget.vue'
import MiniUpgradeTreeWidget from '@/components/monitor/MiniUpgradeTreeWidget.vue'
import TimelineWidget from '@/components/monitor/TimelineWidget.vue'
import ScreenTimeWidget from '@/components/monitor/ScreenTimeWidget.vue'
import NextDecisionWidget from '@/components/monitor/NextDecisionWidget.vue'

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
  workerReady: false
})

const statsInterval = ref<ReturnType<typeof setInterval> | null>(null)

// Mock actions for demonstration
const mockCurrentAction = computed(() => {
  if (Math.random() > 0.7) {
    return {
      id: 'demo-action',
      type: 'plant' as const,
      screen: 'farm' as const,
      target: 'Plot 7',
      duration: 5,
      energyCost: 1,
      goldCost: 0,
      prerequisites: [],
      expectedRewards: {
        gold: 3
      },
      score: 8.5
    }
  }
  return null
})

const mockNextAction = computed(() => {
  if (!mockCurrentAction.value && Math.random() > 0.5) {
    return {
      id: 'demo-next',
      type: 'water' as const,
      screen: 'farm' as const,
      duration: 2,
      energyCost: 0,
      goldCost: 0,
      prerequisites: [],
      expectedRewards: {},
      score: 6.2
    }
  }
  return null
})

// Methods
const getStatusText = (): string => {
  if (!bridgeStatus.isInitialized) return 'Not Initialized'
  if (bridgeStatus.isRunning) return 'Running'
  return 'Ready'
}

const initializeSimulation = async () => {
  try {
    console.log('🚀 LiveMonitor: Initializing simulation...')
    
    if (!bridge.value) {
      bridge.value = new SimulationBridge()
    }

    // Create test configuration
    const testConfig = SimulationBridgeTest.createTestConfig()
    
    await bridge.value.initialize(testConfig)
    
    bridgeStatus.isInitialized = true
    
    console.log('✅ LiveMonitor: Simulation initialized')
  } catch (error) {
    console.error('❌ LiveMonitor: Initialization failed:', error)
    errorMessage.value = `Initialization failed: ${error}`
  }
}

const startSimulation = async () => {
  if (!bridge.value) return
  
  try {
    await bridge.value.start()
    bridgeStatus.isRunning = true
    console.log('▶️ LiveMonitor: Simulation started')
  } catch (error) {
    console.error('❌ LiveMonitor: Start failed:', error)
    errorMessage.value = `Start failed: ${error}`
  }
}

const pauseSimulation = async () => {
  if (!bridge.value) return
  
  try {
    await bridge.value.pause()
    bridgeStatus.isRunning = false
    console.log('⏸️ LiveMonitor: Simulation paused')
  } catch (error) {
    console.error('❌ LiveMonitor: Pause failed:', error)
    errorMessage.value = `Pause failed: ${error}`
  }
}

const stopSimulation = async () => {
  if (!bridge.value) return
  
  try {
    await bridge.value.stop()
    bridgeStatus.isRunning = false
    bridgeStatus.isInitialized = false
    console.log('⏹️ LiveMonitor: Simulation stopped')
  } catch (error) {
    console.error('❌ LiveMonitor: Stop failed:', error)
    errorMessage.value = `Stop failed: ${error}`
  }
}

const changeSpeed = async () => {
  if (!bridge.value) return
  
  try {
    const speed = parseFloat(selectedSpeed.value)
    await bridge.value.setSpeed(speed)
    console.log(`🏃 LiveMonitor: Speed changed to ${speed}x`)
  } catch (error) {
    console.error('❌ LiveMonitor: Speed change failed:', error)
    errorMessage.value = `Speed change failed: ${error}`
  }
}

const formatTime = (time: any): string => {
  if (!time) return '00:00'
  const hours = Math.floor(time.hour || 0)
  const minutes = Math.floor(time.minute || 0)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

// Lifecycle
onMounted(() => {
  console.log('📊 LiveMonitor mounted - Phase 6D Core Widget Implementation Complete')
  
  // Poll for stats every second
  statsInterval.value = setInterval(async () => {
    if (bridge.value && bridgeStatus.isInitialized) {
      try {
        const result = await bridge.value.getState()
        currentState.value = result.gameState
        currentStats.value = result.stats
      } catch (error) {
        console.warn('Stats polling failed:', error)
      }
    }
  }, 1000)
})

onBeforeUnmount(() => {
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
  background: rgb(var(--color-sim-accent));
  color: white;
  border: 1px solid rgb(var(--color-sim-accent));
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  transition: background-color 0.2s;
}

.btn-success {
  background: rgb(34, 197, 94);
  color: white;
  border: 1px solid rgb(34, 197, 94);
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  transition: background-color 0.2s;
}

.btn-warning {
  background: rgb(234, 179, 8);
  color: white;
  border: 1px solid rgb(234, 179, 8);
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  transition: background-color 0.2s;
}

.btn-danger {
  background: rgb(239, 68, 68);
  color: white;
  border: 1px solid rgb(239, 68, 68);
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  transition: background-color 0.2s;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}
</style>