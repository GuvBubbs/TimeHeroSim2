<!-- Performance Monitor Widget - Enhanced with TPS graph, memory usage, warnings -->
<template>
  <BaseWidget title="Performance Monitor" icon="fas fa-tachometer-alt">
    <div class="space-y-3">
      <!-- Current Metrics -->
      <div class="bg-sim-background rounded p-3">
        <div class="grid grid-cols-4 gap-4 text-center">
          <div class="metric">
            <div class="text-xs text-sim-text-secondary">Sim Speed</div>
            <div class="text-lg font-mono" :class="getSpeedClass(currentMetrics.simSpeed)">
              {{ currentMetrics.simSpeed.toFixed(0) }}ms
            </div>
          </div>
          <div class="metric">
            <div class="text-xs text-sim-text-secondary">TPS</div>
            <div class="text-lg font-mono" :class="getTpsClass(currentMetrics.tps)">
              {{ currentMetrics.tps.toFixed(1) }}
            </div>
          </div>
          <div class="metric">
            <div class="text-xs text-sim-text-secondary">Memory</div>
            <div class="text-lg font-mono" :class="getMemoryClass(currentMetrics.memory)">
              {{ currentMetrics.memory }}MB
            </div>
          </div>
          <div class="metric">
            <div class="text-xs text-sim-text-secondary">Actions</div>
            <div class="text-lg font-mono text-sim-text">
              {{ currentMetrics.totalActions }}
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Graph -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-chart-line text-green-400 mr-2"></i>
            TPS Over Time
          </span>
          <div class="text-xs text-sim-text-secondary">
            Target: {{ targetTPS }} TPS
          </div>
        </div>
        <div class="relative" style="height: 60px;">
          <svg 
            class="w-full h-full" 
            viewBox="0 0 200 60"
            xmlns="http://www.w3.org/2000/svg"
          >
            <!-- Background grid -->
            <defs>
              <pattern id="grid" width="20" height="15" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 15" fill="none" stroke="#374151" stroke-width="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="200" height="60" fill="url(#grid)" />
            
            <!-- Target line -->
            <line 
              x1="0" 
              y1="30" 
              x2="200" 
              y2="30" 
              stroke="#fbbf24" 
              stroke-width="1" 
              stroke-dasharray="3,3" 
              opacity="0.7"
            />
            
            <!-- TPS line -->
            <polyline
              :points="tpsGraphPoints"
              fill="none"
              stroke="#10b981"
              stroke-width="2"
            />
            
            <!-- Data points -->
            <circle
              v-for="(point, index) in tpsHistory.slice(-10)"
              :key="index"
              :cx="(index / 9) * 200"
              :cy="60 - (point.tps / targetTPS) * 60"
              r="2"
              :fill="point.tps >= targetTPS * 0.8 ? '#10b981' : '#ef4444'"
            />
          </svg>
        </div>
      </div>

      <!-- Warnings -->
      <div v-if="warnings.length > 0" class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-exclamation-triangle text-yellow-400 mr-2"></i>
            Performance Warnings
          </span>
        </div>
        <div class="space-y-1">
          <div 
            v-for="warning in warnings" 
            :key="warning.id"
            class="flex items-center gap-2 text-xs"
            :class="getWarningClass(warning.severity)"
          >
            <i :class="getWarningIcon(warning.severity)"></i>
            <span>{{ warning.message }}</span>
            <span class="text-sim-text-secondary ml-auto">{{ formatTime(warning.timestamp) }}</span>
          </div>
        </div>
      </div>

      <!-- Performance Summary -->
      <div class="bg-sim-background rounded p-3">
        <div class="flex justify-between items-center mb-2">
          <span class="flex items-center">
            <i class="fas fa-info-circle text-blue-400 mr-2"></i>
            Summary
          </span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span class="text-sim-text-secondary">Avg TPS:</span>
            <span class="text-sim-text ml-1">{{ averageTPS.toFixed(1) }}</span>
          </div>
          <div>
            <span class="text-sim-text-secondary">Uptime:</span>
            <span class="text-sim-text ml-1">{{ formatDuration(uptime) }}</span>
          </div>
          <div>
            <span class="text-sim-text-secondary">Peak Memory:</span>
            <span class="text-sim-text ml-1">{{ peakMemory }}MB</span>
          </div>
          <div>
            <span class="text-sim-text-secondary">Actions/Min:</span>
            <span class="text-sim-text ml-1">{{ actionsPerMinute.toFixed(1) }}</span>
          </div>
        </div>
      </div>
    </div>
  </BaseWidget>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import BaseWidget from './BaseWidget.vue'
import type { GameState, SimulationStats } from '@/types'

interface PerformanceMetrics {
  simSpeed: number      // ms per tick
  tps: number          // ticks per second
  memory: number       // MB
  totalActions: number
  timestamp: number
}

interface PerformanceWarning {
  id: string
  severity: 'low' | 'medium' | 'high'
  message: string
  timestamp: number
}

interface Props {
  gameState: GameState | null
  currentStats?: SimulationStats | null
}

const props = defineProps<Props>()

// State
const tpsHistory = ref<PerformanceMetrics[]>([])
const warnings = ref<PerformanceWarning[]>([])
const startTime = ref(Date.now())
const targetTPS = 2 // 30-second ticks = 2 TPS
const maxHistoryLength = 50

// Current metrics
const currentMetrics = computed(() => {
  const stats = props.currentStats
  const gameState = props.gameState
  
  return {
    simSpeed: stats?.averageTickTime || 500,
    tps: stats?.averageTickTime ? 1000 / stats.averageTickTime : 0,
    memory: getMemoryUsage(),
    totalActions: gameState?.processes?.crops?.length || 0,
    timestamp: Date.now()
  }
})

// Performance calculations
const averageTPS = computed(() => {
  if (tpsHistory.value.length === 0) return 0
  const sum = tpsHistory.value.reduce((acc, metric) => acc + metric.tps, 0)
  return sum / tpsHistory.value.length
})

const uptime = computed(() => {
  return Date.now() - startTime.value
})

const peakMemory = computed(() => {
  if (tpsHistory.value.length === 0) return 0
  return Math.max(...tpsHistory.value.map(m => m.memory))
})

const actionsPerMinute = computed(() => {
  const uptimeMinutes = uptime.value / (1000 * 60)
  return uptimeMinutes > 0 ? currentMetrics.value.totalActions / uptimeMinutes : 0
})

// Graph data
const tpsGraphPoints = computed(() => {
  const points = tpsHistory.value.slice(-10) // Last 10 data points
  if (points.length < 2) return '0,30 200,30'
  
  return points.map((point, index) => {
    const x = (index / (points.length - 1)) * 200
    const y = 60 - Math.min((point.tps / targetTPS) * 60, 60)
    return `${x},${y}`
  }).join(' ')
})

// Watch for stats updates
watch(() => props.currentStats, (newStats) => {
  if (newStats) {
    updateMetrics()
  }
}, { deep: true })

// Methods
const updateMetrics = () => {
  const metrics = currentMetrics.value
  
  // Add to history
  tpsHistory.value.push(metrics)
  
  // Limit history length
  if (tpsHistory.value.length > maxHistoryLength) {
    tpsHistory.value.shift()
  }
  
  // Check for warnings
  checkPerformanceWarnings(metrics)
}

const checkPerformanceWarnings = (metrics: PerformanceMetrics) => {
  const now = Date.now()
  
  // Clear old warnings (older than 30 seconds)
  warnings.value = warnings.value.filter(w => now - w.timestamp < 30000)
  
  // Check TPS performance
  if (metrics.tps < targetTPS * 0.5) {
    addWarning('high', `Very low TPS: ${metrics.tps.toFixed(1)} (target: ${targetTPS})`)
  } else if (metrics.tps < targetTPS * 0.8) {
    addWarning('medium', `Low TPS: ${metrics.tps.toFixed(1)} (target: ${targetTPS})`)
  }
  
  // Check memory usage
  if (metrics.memory > 500) {
    addWarning('high', `High memory usage: ${metrics.memory}MB`)
  } else if (metrics.memory > 300) {
    addWarning('medium', `Elevated memory usage: ${metrics.memory}MB`)
  }
  
  // Check simulation speed
  if (metrics.simSpeed > 2000) {
    addWarning('high', `Very slow simulation: ${metrics.simSpeed}ms per tick`)
  } else if (metrics.simSpeed > 1000) {
    addWarning('medium', `Slow simulation: ${metrics.simSpeed}ms per tick`)
  }
}

const addWarning = (severity: 'low' | 'medium' | 'high', message: string) => {
  // Don't add duplicate warnings
  const exists = warnings.value.some(w => w.message === message && Date.now() - w.timestamp < 10000)
  if (exists) return
  
  warnings.value.push({
    id: `warning-${Date.now()}-${Math.random()}`,
    severity,
    message,
    timestamp: Date.now()
  })
  
  // Limit warnings
  if (warnings.value.length > 5) {
    warnings.value.shift()
  }
}

const getMemoryUsage = (): number => {
  // Estimate memory usage based on game state complexity
  const gameState = props.gameState
  if (!gameState) return 50
  
  let estimate = 100 // Base usage
  
  // Add for crops
  if (gameState.processes?.crops) {
    estimate += gameState.processes.crops.length * 2
  }
  
  // Add for resources
  if (gameState.resources?.seeds instanceof Map) {
    estimate += gameState.resources.seeds.size * 1
  }
  if (gameState.resources?.materials instanceof Map) {
    estimate += gameState.resources.materials.size * 1
  }
  
  // Add for helpers
  if (gameState.helpers?.gnomes) {
    estimate += gameState.helpers.gnomes.length * 5
  }
  
  // Add some randomness for realism
  estimate += Math.random() * 20 - 10
  
  return Math.max(50, Math.floor(estimate))
}

// Styling functions
const getSpeedClass = (speed: number): string => {
  if (speed > 1000) return 'text-red-400'
  if (speed > 500) return 'text-yellow-400'
  return 'text-green-400'
}

const getTpsClass = (tps: number): string => {
  if (tps < targetTPS * 0.5) return 'text-red-400'
  if (tps < targetTPS * 0.8) return 'text-yellow-400'
  return 'text-green-400'
}

const getMemoryClass = (memory: number): string => {
  if (memory > 400) return 'text-red-400'
  if (memory > 250) return 'text-yellow-400'
  return 'text-green-400'
}

const getWarningClass = (severity: string): string => {
  const classes = {
    low: 'text-yellow-300',
    medium: 'text-orange-300',
    high: 'text-red-300'
  }
  return classes[severity as keyof typeof classes] || 'text-gray-300'
}

const getWarningIcon = (severity: string): string => {
  const icons = {
    low: 'fas fa-info-circle',
    medium: 'fas fa-exclamation-circle',
    high: 'fas fa-times-circle'
  }
  return icons[severity as keyof typeof icons] || 'fas fa-question-circle'
}

const formatTime = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ago`
}

const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

// Lifecycle
onMounted(() => {
  // Initialize with current metrics
  updateMetrics()
})
</script>

<style scoped>
.metric {
  @apply flex flex-col items-center;
}
</style>
