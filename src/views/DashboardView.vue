<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-bold">Dashboard</h2>
      <div class="text-sm text-sim-muted">
        System Overview
        <span v-if="gameData.lastLoadTime" class="ml-2">
          • Last updated {{ formatLastUpdate(gameData.lastLoadTime) }}
        </span>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- System Status Card -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-server mr-2"></i>
          System Status
        </div>
        <div class="card-body">
          <div v-if="gameData.isLoading" class="text-center py-8">
            <i class="fas fa-spinner fa-spin text-4xl text-sim-primary mb-2"></i>
            <p class="text-sim-muted">Loading game data...</p>
            <div v-if="gameData.loadProgress" class="mt-2">
              <div class="text-xs text-sim-muted">
                {{ gameData.loadProgress.currentFile }}
              </div>
              <div class="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div 
                  class="bg-sim-primary h-1 rounded-full transition-all duration-300"
                  :style="{ width: `${(gameData.loadProgress.loaded / gameData.loadProgress.total) * 100}%` }"
                ></div>
              </div>
              <div class="text-xs text-sim-muted mt-1">
                {{ gameData.loadProgress.loaded }} / {{ gameData.loadProgress.total }} files
              </div>
            </div>
          </div>
          
          <div v-else-if="gameData.loadErrors.length > 0" class="text-center py-8">
            <i class="fas fa-exclamation-triangle text-4xl text-sim-warning mb-2"></i>
            <p class="text-sim-muted">Data loading issues</p>
            <p class="text-xs mt-2 text-sim-error">{{ gameData.loadErrors.length }} errors</p>
          </div>
          
          <div v-else-if="gameData.stats.totalItems > 0" class="py-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-sim-success">{{ gameData.stats.totalItems }}</div>
                <div class="text-xs text-sim-muted">Items Loaded</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-sim-primary">{{ Object.keys(gameData.stats.itemsByFile).length }}</div>
                <div class="text-xs text-sim-muted">Item Files</div>
              </div>
              <div class="text-center">
                <div class="text-sm font-bold text-sim-accent">{{ formatBytes(gameData.stats.memoryUsage) }}</div>
                <div class="text-xs text-sim-muted">Memory</div>
              </div>
              <div class="text-center">
                <div class="text-sm font-bold">{{ Object.keys(gameData.stats.itemsByCategory).length }}</div>
                <div class="text-xs text-sim-muted">Categories</div>
              </div>
            </div>
          </div>
          
          <div v-else class="text-center py-8">
            <i class="fas fa-download text-4xl text-sim-muted mb-2"></i>
            <p class="text-sim-muted">No data loaded</p>
            <button 
              @click="loadData" 
              class="mt-2 px-4 py-2 bg-sim-primary text-white rounded hover:bg-sim-primary-dark transition-colors"
            >
              Load Game Data
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Actions Card -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-bolt mr-2"></i>
          Quick Actions
        </div>
        <div class="card-body">
          <div class="space-y-2">
            <button 
              @click="loadData"
              :disabled="gameData.isLoading"
              class="w-full px-3 py-2 bg-sim-primary text-white rounded hover:bg-sim-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <i class="fas fa-sync mr-2"></i>
              {{ gameData.isLoading ? 'Loading...' : 'Reload Data' }}
            </button>
            
            <button 
              @click="validateData"
              :disabled="gameData.isLoading || gameData.stats.totalItems === 0"
              class="w-full px-3 py-2 bg-sim-accent text-white rounded hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <i class="fas fa-check mr-2"></i>
              Validate Data
            </button>
            
            <div class="pt-2 text-xs text-sim-muted">
              <div v-if="configStore.hasChanges">
                <i class="fas fa-edit mr-1"></i>
                {{ configStore.changeCount }} changes pending
              </div>
              <div v-else>
                <i class="fas fa-check mr-1"></i>
                Configuration clean
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Health Card -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-heartbeat mr-2"></i>
          Data Health
        </div>
        <div class="card-body">
          <div v-if="gameData.stats.totalItems === 0" class="text-center py-8 text-sim-muted">
            <i class="fas fa-question-circle text-4xl mb-2"></i>
            <p>No data to analyze</p>
          </div>
          
          <div v-else class="py-4">
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm">Validation Issues</span>
                <span class="font-bold" :class="{
                  'text-sim-success': totalIssues === 0,
                  'text-sim-warning': totalIssues > 0 && errorCount === 0,
                  'text-sim-error': errorCount > 0
                }">
                  {{ totalIssues }}
                </span>
              </div>
              
              <div v-if="errorCount > 0" class="flex justify-between items-center text-sm">
                <span class="text-sim-error">Errors</span>
                <span class="text-sim-error font-bold">{{ errorCount }}</span>
              </div>
              
              <div v-if="warningCount > 0" class="flex justify-between items-center text-sm">
                <span class="text-sim-warning">Warnings</span>
                <span class="text-sim-warning font-bold">{{ warningCount }}</span>
              </div>
              
              <!-- Unified Schema Files -->
              <div class="flex justify-between items-center text-sm">
                <span class="text-sim-muted">Item Files</span>
                <span class="font-bold">{{ Object.keys(gameData.stats.itemsByFile).length }}/{{ expectedFileCount }}</span>
              </div>
              
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-300"
                  :class="{
                    'bg-sim-success': unifiedSchemaScore >= 90,
                    'bg-sim-warning': unifiedSchemaScore >= 70 && unifiedSchemaScore < 90,
                    'bg-sim-error': unifiedSchemaScore < 70
                  }"
                  :style="{ width: `${unifiedSchemaScore}%` }"
                ></div>
              </div>
              
              <!-- Specialized Schema Files -->
              <div class="flex justify-between items-center text-sm">
                <span class="text-sim-muted">Config Files</span>
                <span class="font-bold">{{ specializedFilesCount }}/{{ totalSpecializedFiles }}</span>
              </div>
              
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-300"
                  :class="{
                    'bg-sim-accent': specializedSchemaScore >= 90,
                    'bg-orange-400': specializedSchemaScore >= 70 && specializedSchemaScore < 90,
                    'bg-sim-error': specializedSchemaScore < 70
                  }"
                  :style="{ width: `${specializedSchemaScore}%` }"
                ></div>
              </div>
              
              <div class="pt-2">
                <div class="text-center text-xs text-sim-muted">
                  Overall Health: {{ Math.round(overallHealth) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Simulations Table -->
    <div class="card">
      <div class="card-header">
        <i class="fas fa-history mr-2"></i>
        Recent Simulations
      </div>
      <div class="card-body">
        <div class="text-center py-12 text-sim-muted">
          <i class="fas fa-inbox text-4xl mb-4"></i>
          <p>No simulations yet</p>
          <p class="text-xs mt-2">Simulation engine coming in Phase 5</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useGameDataStore } from '@/stores/gameData'
import { useConfigurationStore } from '@/stores/configuration'
import { CSV_FILE_LIST, UNIFIED_SCHEMA_FILES } from '@/types/csv-data'

const gameData = useGameDataStore()
const configStore = useConfigurationStore()

const expectedFileCount = UNIFIED_SCHEMA_FILES.length

const totalIssues = computed(() => gameData.validationIssues.length)
const errorCount = computed(() => gameData.validationIssues.filter(issue => issue.level === 'error').length)
const warningCount = computed(() => gameData.validationIssues.filter(issue => issue.level === 'warning').length)

// Specialized schema files tracking
const specializedSchemaFiles = CSV_FILE_LIST.filter(file => !file.hasUnifiedSchema)
const totalSpecializedFiles = specializedSchemaFiles.length

const specializedFilesCount = computed(() => {
  // For specialized files, we just count that they exist (since they always load successfully)
  // In a real implementation, you might want to track their actual loading status
  return totalSpecializedFiles
})

const unifiedSchemaScore = computed(() => {
  if (gameData.stats.totalItems === 0) return 0
  
  const loadedFiles = Object.keys(gameData.stats.itemsByFile).length
  let score = (loadedFiles / expectedFileCount) * 100
  
  // Deduct for validation issues (only affects unified schema files)
  const errorPenalty = errorCount.value * 5 // 5 points per error
  const warningPenalty = warningCount.value * 1 // 1 point per warning
  score = Math.max(0, score - errorPenalty - warningPenalty)
  
  return score
})

const specializedSchemaScore = computed(() => {
  // Specialized files are always considered healthy if they exist
  // You could add more sophisticated checking here in the future
  return (specializedFilesCount.value / totalSpecializedFiles) * 100
})

const overallHealth = computed(() => {
  // Weighted average: unified schemas are more critical (70%) than specialized (30%)
  const unifiedWeight = 0.7
  const specializedWeight = 0.3
  
  return (unifiedSchemaScore.value * unifiedWeight) + (specializedSchemaScore.value * specializedWeight)
})

const formatLastUpdate = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const loadData = async () => {
  await gameData.loadGameData()
}

const validateData = async () => {
  await gameData.validateData()
}

onMounted(() => {
  // Load data if not already loaded
  if (gameData.stats.totalItems === 0 && !gameData.isLoading) {
    loadData()
  }
  
  // Load saved configuration
  configStore.loadFromLocalStorage()
})
</script>
