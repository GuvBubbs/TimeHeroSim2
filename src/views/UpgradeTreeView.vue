<template>
  <div class="upgrade-tree-view h-full relative">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-3xl font-bold">Upgrade Tree</h2>
      <div class="text-sm text-sim-muted">
        Interactive Dependency Graph
      </div>
    </div>
    
    <!-- Graph container -->
    <div ref="cyContainer" class="cytoscape-container bg-sim-surface rounded-lg border border-sim-border relative"></div>
    
    <!-- Loading indicator -->
    <div v-if="isLoading" class="loading-overlay absolute inset-0 bg-sim-surface/80 flex flex-col items-center justify-center rounded-lg">
      <i class="fas fa-spinner fa-spin text-4xl text-sim-accent mb-4"></i>
      <p class="text-sim-text">Building dependency graph...</p>
      <p class="text-xs text-sim-muted mt-1">Loading {{ filteredItemsCount }} items</p>
    </div>
    
    <!-- Node Controls (click-based) -->
    <div v-if="selectedNode" 
         class="node-controls absolute pointer-events-none z-50"
         :style="nodeControlsPosition">
      <div class="flex flex-col gap-1 pointer-events-auto">
        <button @click.stop="openEditModal(selectedNode)"
                class="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs flex items-center justify-center transition-colors shadow-lg">
          <i class="fas fa-edit"></i>
        </button>
        <button @click.stop="showFamilyTree(selectedNode)"
                class="w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded text-xs flex items-center justify-center transition-colors shadow-lg">
          <i class="fas fa-project-diagram"></i>
        </button>
      </div>
    </div>
    
    <!-- Search Bar -->
    <div class="search-bar absolute top-4 left-4 w-80 max-w-sm">
      <div class="relative">
        <input v-model="searchQuery"
               @input="filterNodes"
               placeholder="Search items..."
               class="w-full px-4 py-2 pl-10 bg-sim-surface border border-sim-border rounded-lg text-sim-text placeholder-sim-muted focus:outline-none focus:border-sim-accent transition-colors">
        <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-sim-muted text-sm"></i>
        <button v-if="searchQuery" 
                @click="clearSearch"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-sim-muted hover:text-sim-text transition-colors">
          <i class="fas fa-times text-sm"></i>
        </button>
      </div>
      
      <!-- Search Stats -->
      <div v-if="searchQuery && searchStats" class="mt-2 text-xs text-sim-muted bg-sim-surface border border-sim-border rounded px-2 py-1">
        <i class="fas fa-filter mr-1"></i>
        {{ searchStats.visible }} of {{ searchStats.total }} items visible
      </div>
    </div>

    <!-- Controls Panel -->
    <div class="controls-panel absolute top-4 right-4 bg-sim-surface rounded-lg shadow-lg p-2 space-y-2">
      <!-- Material Edges Toggle -->
      <div class="controls-section border-b border-sim-border pb-2">
        <label class="flex items-center space-x-2 text-sm cursor-pointer">
          <input type="checkbox" v-model="showMaterialEdges" @change="toggleMaterialEdges" 
                 class="accent-sim-accent">
          <span><i class="fas fa-exchange-alt mr-1 text-xs"></i>Material Flows</span>
        </label>
      </div>
      
      <!-- Debug Controls -->
      <div class="controls-section border-b border-sim-border pb-2">
        <label class="flex items-center space-x-2 text-sm cursor-pointer">
          <input type="checkbox" v-model="showDebugBoundaries" @change="toggleDebugBoundaries" 
                 class="accent-sim-accent">
          <span><i class="fas fa-border-style mr-1 text-xs"></i>Lane Boundaries</span>
        </label>
        <button @click="showDebugPanel = !showDebugPanel"
                class="w-full mt-1 px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs transition-colors">
          <i class="fas fa-bug mr-1"></i>Debug Panel
        </button>
        <button v-if="isPerformanceMonitoringEnabled" 
                @click="showPerformancePanel = !showPerformancePanel"
                class="w-full mt-1 px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs transition-colors">
          <i class="fas fa-tachometer-alt mr-1"></i>Performance
        </button>
      </div>
      
      <!-- Zoom Controls -->
      <div class="controls-section space-x-1">
        <button @click="zoomIn" 
                class="px-3 py-2 bg-sim-accent text-white rounded hover:bg-blue-600 transition-colors" 
                title="Zoom In">
          <i class="fas fa-plus"></i>
        </button>
        <button @click="zoomOut"
                class="px-3 py-2 bg-sim-accent text-white rounded hover:bg-blue-600 transition-colors"
                title="Zoom Out">
          <i class="fas fa-minus"></i>
        </button>
        <button @click="fitGraph"
                class="px-3 py-2 bg-sim-accent text-white rounded hover:bg-blue-600 transition-colors"
                title="Fit to View">
          <i class="fas fa-expand"></i>
        </button>
      </div>
    </div>
    
    <!-- Family Tree Mode Indicator (when not searching) -->
    <div v-if="familyTreeMode && !searchQuery" 
         class="family-tree-indicator absolute top-20 left-4 bg-sim-surface rounded-lg shadow-lg p-3 z-40">
      <div class="flex items-center justify-between">
        <span class="text-sm">
          <i class="fas fa-filter mr-2 text-green-500"></i>
          Showing connections for: <strong>{{ familyTreeRoot?.name }}</strong>
        </span>
        <button @click="exitFamilyTree"
                class="ml-4 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm transition-colors">
          Show All
        </button>
      </div>
        </div>
    
    <!-- Graph Stats with Validation Status -->
    <div v-if="!isLoading && graphStats" class="graph-stats absolute bottom-4 left-4 bg-sim-surface rounded-lg shadow-lg p-3 text-sm">
      <div class="flex items-center space-x-4 text-sim-muted">
        <span><i class="fas fa-circle mr-1 text-xs"></i>{{ graphStats.nodes }} nodes</span>
        <span><i class="fas fa-arrow-right mr-1 text-xs"></i>{{ graphStats.edges }} edges</span>
        <span><i class="fas fa-layer-group mr-1 text-xs"></i>{{ graphStats.lanes }} lanes</span>
        
        <!-- Validation Status Indicator -->
        <button v-if="validationSummary" 
                @click="showValidationPanel = !showValidationPanel"
                class="flex items-center space-x-1 px-2 py-1 rounded transition-colors"
                :class="validationSummary.failedTests === 0 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'">
          <i :class="validationSummary.failedTests === 0 ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'" class="text-xs"></i>
          <span>{{ validationSummary.passedTests }}/{{ validationSummary.totalTests }}</span>
        </button>
      </div>
    </div>
    
    <!-- Validation Panel -->
    <div v-if="showValidationPanel && validationSummary" 
         class="validation-panel absolute bottom-20 left-4 bg-sim-surface rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-y-auto">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-sim-text">Position Validation</h3>
        <button @click="showValidationPanel = false" 
                class="text-sim-muted hover:text-sim-text">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- Validation Summary -->
      <div class="mb-4 p-3 rounded" 
           :class="validationSummary.failedTests === 0 ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'">
        <div class="text-sm">
          <div class="flex justify-between">
            <span>Tests Passed:</span>
            <span class="font-mono">{{ validationSummary.passedTests }}/{{ validationSummary.totalTests }}</span>
          </div>
          <div class="flex justify-between">
            <span>Total Issues:</span>
            <span class="font-mono">{{ validationSummary.totalIssues }}</span>
          </div>
          <div class="flex justify-between" v-if="validationSummary.errorCount > 0">
            <span>Errors:</span>
            <span class="font-mono text-red-400">{{ validationSummary.errorCount }}</span>
          </div>
          <div class="flex justify-between" v-if="validationSummary.warningCount > 0">
            <span>Warnings:</span>
            <span class="font-mono text-yellow-400">{{ validationSummary.warningCount }}</span>
          </div>
        </div>
      </div>
      
      <!-- Validation Results Details -->
      <div v-if="validationResults.length > 0" class="space-y-2">
        <div v-for="result in validationResults" :key="result.testName" 
             class="p-2 rounded border text-xs"
             :class="result.passed ? 'bg-green-900/10 border-green-700' : 'bg-red-900/10 border-red-700'">
          <div class="flex items-center justify-between mb-1">
            <span class="font-medium">{{ result.testName }}</span>
            <i :class="result.passed ? 'fas fa-check text-green-400' : 'fas fa-times text-red-400'"></i>
          </div>
          
          <!-- Show issues if any -->
          <div v-if="result.issues && result.issues.length > 0" class="space-y-1">
            <div v-for="issue in result.issues.slice(0, 3)" :key="issue.message" 
                 class="flex items-start space-x-1">
              <i :class="issue.severity === 'error' ? 'fas fa-times text-red-400' : 
                         issue.severity === 'warning' ? 'fas fa-exclamation-triangle text-yellow-400' : 
                         'fas fa-info-circle text-blue-400'" 
                 class="text-xs mt-0.5"></i>
              <span class="text-sim-muted">{{ issue.message }}</span>
            </div>
            <div v-if="result.issues.length > 3" class="text-sim-muted italic">
              ... and {{ result.issues.length - 3 }} more issues
            </div>
          </div>
          
          <!-- Show metrics if available -->
          <div v-if="result.metrics" class="mt-2 pt-2 border-t border-sim-border">
            <div v-for="(value, key) in result.metrics" :key="key" 
                 class="flex justify-between text-sim-muted">
              <span>{{ key }}:</span>
              <span class="font-mono">{{ typeof value === 'number' ? value.toFixed(1) : value }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Run Tests Button -->
      <div class="mt-4 pt-3 border-t border-sim-border">
        <button @click="runValidationTests" 
                class="w-full px-3 py-2 bg-sim-accent text-white rounded hover:bg-blue-600 transition-colors text-sm mb-2">
          <i class="fas fa-play mr-2"></i>Run Validation Tests
        </button>
        <button @click="runIntegrationTests" 
                class="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm">
          <i class="fas fa-cogs mr-2"></i>Run Integration Tests
        </button>
      </div>
    </div>
    
    <!-- Debug Panel -->
    <div v-if="showDebugPanel" 
         class="debug-panel absolute top-4 left-1/2 transform -translate-x-1/2 bg-sim-surface rounded-lg shadow-lg p-4 max-w-4xl max-h-96 overflow-y-auto z-50">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-sim-text flex items-center">
          <i class="fas fa-bug mr-2"></i>Debug Monitor
        </h3>
        <button @click="showDebugPanel = false" 
                class="text-sim-muted hover:text-sim-text">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- Debug Controls -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="space-y-2">
          <h4 class="text-sm font-medium text-sim-text">Debug Options</h4>
          <label class="flex items-center space-x-2 text-xs cursor-pointer">
            <input type="checkbox" v-model="debugConfig.enableConsoleLogging" @change="updateDebugConfig" 
                   class="accent-sim-accent">
            <span>Console Logging</span>
          </label>
          <label class="flex items-center space-x-2 text-xs cursor-pointer">
            <input type="checkbox" v-model="debugConfig.enableAssignmentStats" @change="updateDebugConfig" 
                   class="accent-sim-accent">
            <span>Assignment Statistics</span>
          </label>
          <label class="flex items-center space-x-2 text-xs cursor-pointer">
            <input type="checkbox" v-model="debugConfig.enablePositionMonitoring" @change="updateDebugConfig" 
                   class="accent-sim-accent">
            <span>Position Monitoring</span>
          </label>
        </div>
        
        <div class="space-y-2">
          <h4 class="text-sm font-medium text-sim-text">Log Level</h4>
          <select v-model="debugConfig.logLevel" @change="updateDebugConfig" 
                  class="w-full px-2 py-1 bg-sim-surface border border-sim-border rounded text-xs">
            <option value="minimal">Minimal</option>
            <option value="standard">Standard</option>
            <option value="verbose">Verbose</option>
            <option value="debug">Debug</option>
          </select>
          
          <button @click="exportDebugData" 
                  class="w-full px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs transition-colors">
            <i class="fas fa-download mr-1"></i>Export Debug Data
          </button>
        </div>
      </div>
      
      <!-- Assignment Statistics -->
      <div v-if="assignmentStats" class="mb-4">
        <h4 class="text-sm font-medium text-sim-text mb-2">Assignment Statistics</h4>
        <div class="grid grid-cols-3 gap-2 text-xs">
          <div class="bg-sim-background rounded p-2">
            <div class="text-sim-muted">Total Items</div>
            <div class="font-mono text-lg">{{ assignmentStats.totalItems }}</div>
          </div>
          <div class="bg-sim-background rounded p-2">
            <div class="text-sim-muted">Unassigned</div>
            <div class="font-mono text-lg" :class="assignmentStats.unassignedItems.length > 0 ? 'text-yellow-400' : 'text-green-400'">
              {{ assignmentStats.unassignedItems.length }}
            </div>
          </div>
          <div class="bg-sim-background rounded p-2">
            <div class="text-sim-muted">Active Lanes</div>
            <div class="font-mono text-lg">{{ activeLaneCount }}</div>
          </div>
        </div>
        
        <!-- Lane Distribution Chart -->
        <div class="mt-3">
          <div class="text-xs text-sim-muted mb-1">Items per Lane:</div>
          <div class="space-y-1">
            <div v-for="[lane, count] in sortedLaneAssignments" :key="lane" 
                 class="flex items-center justify-between text-xs">
              <span class="w-24 truncate">{{ lane }}</span>
              <div class="flex-1 mx-2 bg-sim-background rounded-full h-2 overflow-hidden">
                <div class="h-full bg-sim-accent transition-all duration-300" 
                     :style="{ width: `${(count / assignmentStats.totalItems) * 100}%` }"></div>
              </div>
              <span class="font-mono w-8 text-right">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Debug Report -->
      <div v-if="debugReport" class="mb-4">
        <h4 class="text-sm font-medium text-sim-text mb-2">Performance Metrics</h4>
        <div class="grid grid-cols-4 gap-2 text-xs">
          <div class="bg-sim-background rounded p-2">
            <div class="text-sim-muted">Session Time</div>
            <div class="font-mono">{{ (debugReport.sessionDuration / 1000).toFixed(1) }}s</div>
          </div>
          <div class="bg-sim-background rounded p-2">
            <div class="text-sim-muted">Calculations</div>
            <div class="font-mono">{{ debugReport.positioningMetrics.totalCalculations }}</div>
          </div>
          <div class="bg-sim-background rounded p-2">
            <div class="text-sim-muted">Avg Time</div>
            <div class="font-mono">{{ debugReport.positioningMetrics.averageCalculationTime.toFixed(2) }}ms</div>
          </div>
          <div class="bg-sim-background rounded p-2">
            <div class="text-sim-muted">Adjustments</div>
            <div class="font-mono" :class="debugReport.positioningMetrics.adjustmentRate > 20 ? 'text-yellow-400' : 'text-green-400'">
              {{ debugReport.positioningMetrics.adjustmentRate.toFixed(1) }}%
            </div>
          </div>
        </div>
        
        <!-- Recommendations -->
        <div v-if="debugReport.recommendations.length > 0" class="mt-3">
          <div class="text-xs text-sim-muted mb-1">Recommendations:</div>
          <div class="space-y-1">
            <div v-for="rec in debugReport.recommendations" :key="rec" 
                 class="text-xs text-yellow-400 flex items-start">
              <i class="fas fa-lightbulb mr-1 mt-0.5 text-xs"></i>
              <span>{{ rec }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Performance Panel -->
    <div v-if="showPerformancePanel && isPerformanceMonitoringEnabled" 
         class="performance-panel absolute top-4 right-1/2 transform translate-x-1/2 bg-sim-surface rounded-lg shadow-lg p-4 max-w-4xl max-h-96 overflow-y-auto z-50">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-sim-text flex items-center">
          <i class="fas fa-tachometer-alt mr-2"></i>Performance Monitor
        </h3>
        <button @click="showPerformancePanel = false" 
                class="text-sim-muted hover:text-sim-text">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- Performance Controls -->
      <div class="grid grid-cols-3 gap-2 mb-4">
        <button @click="runPerformanceProfile" 
                class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs transition-colors">
          <i class="fas fa-play mr-1"></i>Profile
        </button>
        <button @click="optimizePerformance" 
                class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs transition-colors">
          <i class="fas fa-rocket mr-1"></i>Optimize
        </button>
        <button @click="exportPerformanceData" 
                class="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs transition-colors">
          <i class="fas fa-download mr-1"></i>Export
        </button>
      </div>
      
      <!-- Performance Metrics -->
      <div v-if="performanceReport" class="space-y-4">
        <!-- Session Overview -->
        <div class="bg-sim-background rounded p-3">
          <h4 class="text-sm font-medium text-sim-text mb-2">Session Overview</h4>
          <div class="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div class="text-sim-muted">Total Duration</div>
              <div class="font-mono text-lg">{{ (performanceReport.totalDuration / 1000).toFixed(1) }}s</div>
            </div>
            <div>
              <div class="text-sim-muted">Operations</div>
              <div class="font-mono text-lg">{{ performanceReport.metrics.length }}</div>
            </div>
          </div>
        </div>
        
        <!-- Memory Usage -->
        <div v-if="performanceReport.memoryUsage" class="bg-sim-background rounded p-3">
          <h4 class="text-sm font-medium text-sim-text mb-2">Memory Usage</h4>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div class="text-sim-muted">Initial</div>
              <div class="font-mono">{{ (performanceReport.memoryUsage.initialMemory / 1024 / 1024).toFixed(1) }}MB</div>
            </div>
            <div>
              <div class="text-sim-muted">Peak</div>
              <div class="font-mono">{{ (performanceReport.memoryUsage.peakMemory / 1024 / 1024).toFixed(1) }}MB</div>
            </div>
            <div>
              <div class="text-sim-muted">Final</div>
              <div class="font-mono">{{ (performanceReport.memoryUsage.finalMemory / 1024 / 1024).toFixed(1) }}MB</div>
            </div>
          </div>
        </div>
        
        <!-- Performance Bottlenecks -->
        <div v-if="performanceReport.bottlenecks && performanceReport.bottlenecks.length > 0" 
             class="bg-sim-background rounded p-3">
          <h4 class="text-sm font-medium text-sim-text mb-2">Performance Issues</h4>
          <div class="space-y-2">
            <div v-for="bottleneck in performanceReport.bottlenecks.slice(0, 5)" 
                 :key="bottleneck.operation" 
                 class="flex items-center justify-between text-xs p-2 rounded"
                 :class="bottleneck.severity === 'critical' ? 'bg-red-900/20 border border-red-700' : 
                         bottleneck.severity === 'severe' ? 'bg-orange-900/20 border border-orange-700' : 
                         'bg-yellow-900/20 border border-yellow-700'">
              <div class="flex items-center space-x-2">
                <i :class="bottleneck.severity === 'critical' ? 'fas fa-exclamation-triangle text-red-400' : 
                           bottleneck.severity === 'severe' ? 'fas fa-exclamation-triangle text-orange-400' : 
                           'fas fa-exclamation-triangle text-yellow-400'"></i>
                <span>{{ bottleneck.operation }}</span>
              </div>
              <span class="font-mono">{{ bottleneck.duration.toFixed(1) }}ms</span>
            </div>
          </div>
        </div>
        
        <!-- Recommendations -->
        <div v-if="performanceReport.recommendations && performanceReport.recommendations.length > 0" 
             class="bg-sim-background rounded p-3">
          <h4 class="text-sm font-medium text-sim-text mb-2">Recommendations</h4>
          <div class="space-y-1">
            <div v-for="rec in performanceReport.recommendations" :key="rec" 
                 class="text-xs text-blue-400 flex items-start">
              <i class="fas fa-lightbulb mr-1 mt-0.5 text-xs"></i>
              <span>{{ rec }}</span>
            </div>
          </div>
        </div>
        
        <!-- Recent Metrics -->
        <div class="bg-sim-background rounded p-3">
          <h4 class="text-sm font-medium text-sim-text mb-2">Recent Operations</h4>
          <div class="space-y-1 max-h-32 overflow-y-auto">
            <div v-for="metric in performanceReport.metrics.slice(-10)" 
                 :key="metric.name + metric.startTime" 
                 class="flex items-center justify-between text-xs">
              <span class="truncate">{{ metric.name }}</span>
              <span class="font-mono ml-2" 
                    :class="(metric.duration || 0) > 100 ? 'text-yellow-400' : 'text-green-400'">
                {{ (metric.duration || 0).toFixed(1) }}ms
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- No Data Message -->
      <div v-else class="text-center text-sim-muted py-8">
        <i class="fas fa-chart-line text-4xl mb-4"></i>
        <p>No performance data available</p>
        <p class="text-xs mt-1">Click "Profile" to start monitoring</p>
      </div>
    </div>

    <!-- REUSE EXISTING MODAL! -->
    <EditItemModal 
      v-if="editingItem"
      :show="!!editingItem"
      :item="editingItem"
      @save="handleSaveItem"
      @close="editingItem = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import cytoscape from 'cytoscape'
import cola from 'cytoscape-cola'
import fcose from 'cytoscape-fcose'
import { useGameDataStore } from '@/stores/gameData'
import { useConfigurationStore } from '@/stores/configuration'
import { buildGraphElements, addMaterialEdges, runAllAutomatedTests } from '@/utils/graphBuilder'
import { debugMonitor, updateDebugConfig as updateDebugMonitorConfig, exportMonitoringData, generateVisualBoundaryElements } from '@/utils/debugMonitor'
import { getPerformanceMonitor, initializePerformanceMonitor, cleanupPerformanceMonitor, withPerformanceTracking } from '@/utils/performanceMonitor'
import { getOptimizedPositioningEngine, cleanupOptimizedPositioning } from '@/utils/optimizedPositioning'
import EditItemModal from '@/components/GameConfiguration/EditItemModal.vue'
import type { GameDataItem } from '@/types/game-data'

// Register layouts
cytoscape.use(cola)
cytoscape.use(fcose)

const gameData = useGameDataStore()
const configStore = useConfigurationStore()

const cyContainer = ref<HTMLElement>()
const isLoading = ref(true)
let cy: cytoscape.Core

// Modal and interaction state
const editingItem = ref<GameDataItem | null>(null)
const selectedNode = ref<GameDataItem | null>(null)
const nodeControlsPosition = ref<Record<string, string>>({})
const familyTreeMode = ref(false)
const familyTreeRoot = ref<GameDataItem | null>(null)
const showMaterialEdges = ref(false)
const searchQuery = ref('')
const searchStats = ref<{ visible: number, total: number } | null>(null)

// Computed properties
const filteredItemsCount = computed(() => {
  return gameData.items.filter(item => 
    item.category === 'Actions' || item.category === 'Unlocks'
  ).length
})

// Debug computed properties
const activeLaneCount = computed(() => {
  if (!assignmentStats.value) return 0
  return Array.from(assignmentStats.value.assignmentsByLane.values()).filter(count => count > 0).length
})

const sortedLaneAssignments = computed(() => {
  if (!assignmentStats.value) return []
  return Array.from(assignmentStats.value.assignmentsByLane.entries())
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
})

const graphStats = ref<{ nodes: number, edges: number, lanes: number } | null>(null)
const validationResults = ref<any[]>([])
const validationSummary = ref<any | null>(null)
const showValidationPanel = ref(false)

// Debug monitoring state
const showDebugPanel = ref(false)
const showDebugBoundaries = ref(false)
const assignmentStats = ref<any | null>(null)
const debugReport = ref<any | null>(null)
const debugConfig = ref({
  enableConsoleLogging: true,
  enableVisualBoundaries: false,
  enableAssignmentStats: true,
  enablePositionMonitoring: false,
  enableDetailedCalculations: false,
  logLevel: 'standard' as 'minimal' | 'standard' | 'verbose' | 'debug'
})

// Performance monitoring state
const performanceReport = ref<any | null>(null)
const showPerformancePanel = ref(false)
const performanceMonitor = ref<any | null>(null)

// Check if performance monitoring is enabled
const isPerformanceMonitoringEnabled = computed(() => {
  return typeof window !== 'undefined' && (window as any).ENABLE_PERFORMANCE_MONITORING === true
})

// Cytoscape graph methods  
const zoomIn = () => {
  if (cy) {
    cy.zoom(cy.zoom() * 1.2)
    cy.center()
  }
}

const zoomOut = () => {
  if (cy) {
    cy.zoom(cy.zoom() * 0.8) 
    cy.center()
  }
}

const fitGraph = () => {
  if (cy) {
    cy.fit()
  }
}

// Modal and family tree methods
const openEditModal = (item: GameDataItem) => {
  editingItem.value = item
  console.log(`📝 Opening edit modal for: ${item.name} (${item.id})`)
}

const handleSaveItem = (updatedItem: GameDataItem) => {
  // Update in configuration store (already handles everything!)
  configStore.updateItem(updatedItem)
  
  console.log(`💾 Saved item: ${updatedItem.name} (${updatedItem.id})`)
  
  // Close modal
  editingItem.value = null
  
  // Rebuild graph to reflect changes
  rebuildGraph()
}

const toggleMaterialEdges = () => {
  // Remove verbose toggle logging
  rebuildGraph()
}

// Enhanced search functionality with smooth transitions
const filterNodes = () => {
  if (!cy) return
  
  const query = searchQuery.value.toLowerCase().trim()
  let visibleCount = 0
  let totalCount = 0
  
  // Add smooth transition for search filtering
  cy.nodes().forEach(node => {
    totalCount++
    const data = node.data()
    const matches = !query || 
                   data.label.toLowerCase().includes(query) ||
                   data.id.toLowerCase().includes(query) ||
                   (data.fullData.type && data.fullData.type.toLowerCase().includes(query)) ||
                   (data.swimLane && data.swimLane.toLowerCase().includes(query))
    
    if (matches) {
      // Smooth fade-in transition
      node.animate({
        style: { 
          'display': 'element',
          'opacity': 1
        }
      }, {
        duration: 200,
        easing: 'ease-out'
      })
      visibleCount++
    } else {
      // Smooth fade-out transition
      node.animate({
        style: { 
          'opacity': 0.1
        }
      }, {
        duration: 150,
        easing: 'ease-in',
        complete: () => {
          node.style('display', 'none')
        }
      })
    }
  })
  
  // Update edges visibility with smooth transitions
  cy.edges().forEach(edge => {
    const sourceVisible = edge.source().style('display') !== 'none'
    const targetVisible = edge.target().style('display') !== 'none'
    
    if (sourceVisible && targetVisible) {
      edge.animate({
        style: { 
          'display': 'element',
          'opacity': 1
        }
      }, {
        duration: 200,
        easing: 'ease-out'
      })
    } else {
      edge.animate({
        style: { 
          'opacity': 0.1
        }
      }, {
        duration: 150,
        easing: 'ease-in',
        complete: () => {
          edge.style('display', 'none')
        }
      })
    }
  })
  
  // Update search stats
  searchStats.value = { visible: visibleCount, total: totalCount }
  
  // Smooth fit to visible nodes if search is active
  if (query) {
    setTimeout(() => {
      const visibleNodes = cy.nodes().filter(node => node.style('display') !== 'none')
      if (visibleNodes.length > 0) {
        cy.animate({
          fit: {
            eles: visibleNodes,
            padding: 50
          }
        }, {
          duration: 300,
          easing: 'ease-out'
        })
      }
    }, 250) // Wait for fade transitions to complete
  }
  
  console.log(`🔍 Search "${query}": ${visibleCount}/${totalCount} nodes visible`)
}

const clearSearch = () => {
  searchQuery.value = ''
  searchStats.value = null
  
  if (cy) {
    // Smooth transition to show all elements
    cy.elements().animate({
      style: { 
        'display': 'element',
        'opacity': 1
      }
    }, {
      duration: 300,
      easing: 'ease-out',
      complete: () => {
        // Smooth fit to all elements
        cy.animate({
          fit: {
            eles: cy.elements(),
            padding: 30
          }
        }, {
          duration: 400,
          easing: 'ease-out'
        })
      }
    })
  }
  
  console.log('🔍 Search cleared - showing all nodes')
}

const showFamilyTree = (item: GameDataItem) => {
  if (!cy) return
  
  familyTreeMode.value = true
  familyTreeRoot.value = item
  
  console.log(`🌳 Showing family tree for: ${item.name}`)
  
  // Get all connected nodes
  const node = cy.getElementById(item.id)
  const connected = node.predecessors().union(node.successors()).union(node)
  const nonConnected = cy.elements().not(connected)
  
  // Smooth fade out non-connected elements
  nonConnected.animate({
    style: { 
      'opacity': 0.1
    }
  }, {
    duration: 200,
    easing: 'ease-in',
    complete: () => {
      nonConnected.style('display', 'none')
    }
  })
  
  // Highlight connected elements
  connected.animate({
    style: { 
      'opacity': 1
    }
  }, {
    duration: 300,
    easing: 'ease-out'
  })
  
  // Smooth fit to visible elements
  setTimeout(() => {
    cy.animate({
      fit: {
        eles: connected,
        padding: 50
      }
    }, {
      duration: 400,
      easing: 'ease-out'
    })
  }, 250)
}

const exitFamilyTree = () => {
  if (!cy) return
  
  familyTreeMode.value = false
  familyTreeRoot.value = null
  
  console.log('🌳 Exiting family tree mode')
  
  // Smooth transition to show all elements
  cy.elements().animate({
    style: { 
      'display': 'element',
      'opacity': 1
    }
  }, {
    duration: 300,
    easing: 'ease-out',
    complete: () => {
      // Smooth fit to all elements
      cy.animate({
        fit: {
          eles: cy.elements(),
          padding: 30
        }
      }, {
        duration: 400,
        easing: 'ease-out'
      })
    }
  })
}

const runValidationTests = async () => {
  console.log('🧪 Running validation tests...')
  
  try {
    const testResults = runAllAutomatedTests(gameData.items)
    
    // Update validation results with test results
    validationResults.value = [...(validationResults.value || []), ...testResults]
    
    // Update summary
    const allResults = validationResults.value
    const passedTests = allResults.filter(r => r.passed).length
    const totalTests = allResults.length
    const allIssues = allResults.flatMap(r => r.issues || [])
    
    validationSummary.value = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      totalIssues: allIssues.length,
      errorCount: allIssues.filter(i => i.severity === 'error').length,
      warningCount: allIssues.filter(i => i.severity === 'warning').length
    }
    
    // Remove verbose validation logging
    
  } catch (error) {
    console.error('❌ Error running validation tests:', error)
  }
}

// Comprehensive integration test for final polish
const runIntegrationTests = async () => {
  console.log('🔧 Running comprehensive integration tests...')
  
  try {
    // Test 1: Graph rebuild functionality
    console.log('📊 Testing graph rebuild...')
    await rebuildGraph()
    
    // Test 2: Search functionality with transitions
    console.log('🔍 Testing search functionality...')
    searchQuery.value = 'farm'
    filterNodes()
    await new Promise(resolve => setTimeout(resolve, 500)) // Wait for transitions
    
    clearSearch()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Test 3: Family tree functionality
    console.log('🌳 Testing family tree functionality...')
    const testItem = gameData.items.find(item => item.category === 'Actions')
    if (testItem) {
      showFamilyTree(testItem)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      exitFamilyTree()
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // Test 4: Material edges toggle
    console.log('🔗 Testing material edges...')
    showMaterialEdges.value = true
    toggleMaterialEdges()
    await new Promise(resolve => setTimeout(resolve, 300))
    
    showMaterialEdges.value = false
    toggleMaterialEdges()
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Test 5: Debug boundaries
    console.log('🔍 Testing debug boundaries...')
    showDebugBoundaries.value = true
    toggleDebugBoundaries()
    await new Promise(resolve => setTimeout(resolve, 300))
    
    showDebugBoundaries.value = false
    toggleDebugBoundaries()
    
    // Test 6: Validation tests
    console.log('✅ Running validation tests...')
    await runValidationTests()
    
    // Test 7: Performance monitoring (if enabled)
    if (isPerformanceMonitoringEnabled.value) {
      console.log('⚡ Testing performance monitoring...')
      runPerformanceProfile()
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log('🎉 All integration tests completed successfully!')
    
    // Return comprehensive test results
    return {
      success: true,
      testsRun: [
        'Graph rebuild',
        'Search functionality', 
        'Family tree mode',
        'Material edges toggle',
        'Debug boundaries',
        'Validation tests',
        ...(isPerformanceMonitoringEnabled.value ? ['Performance monitoring'] : [])
      ],
      validationSummary: validationSummary.value,
      graphStats: graphStats.value
    }
    
  } catch (error) {
    console.error('❌ Integration tests failed:', error)
    return {
      success: false,
      error: error.message,
      testsRun: []
    }
  }
}

// Debug methods
const updateDebugConfig = () => {
  updateDebugMonitorConfig(debugConfig.value)
  
  // Update visual boundaries if enabled
  if (debugConfig.value.enableVisualBoundaries !== showDebugBoundaries.value) {
    showDebugBoundaries.value = debugConfig.value.enableVisualBoundaries
    toggleDebugBoundaries()
  }
}

const toggleDebugBoundaries = () => {
  debugConfig.value.enableVisualBoundaries = showDebugBoundaries.value
  updateDebugMonitorConfig(debugConfig.value)
  
  if (cy) {
    // Remove existing boundary elements
    cy.nodes('[type="boundary"], [type="boundary-label"]').remove()
    
    if (showDebugBoundaries.value) {
      // Add visual boundary elements
      const boundaryElements = generateVisualBoundaryElements()
      if (boundaryElements.length > 0) {
        cy.add(boundaryElements)
        console.log(`🔍 Added ${boundaryElements.length} debug boundary elements`)
      }
    }
  }
}

const exportDebugData = () => {
  try {
    const debugData = exportMonitoringData()
    const blob = new Blob([debugData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `swimlane-debug-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    console.log('📄 Debug data exported successfully')
  } catch (error) {
    console.error('❌ Error exporting debug data:', error)
  }
}

// Performance monitoring methods
const runPerformanceProfile = () => {
  if (!isPerformanceMonitoringEnabled.value) {
    console.log('Performance monitoring is disabled. Enable with window.ENABLE_PERFORMANCE_MONITORING = true')
    return
  }
  
  console.log('🔍 Running performance profile...')
  
  const monitor = getPerformanceMonitor()
  monitor.startMetric('performance-profile')
  
  // Trigger a full rebuild to measure performance
  rebuildGraph().then(() => {
    monitor.endMetric('performance-profile')
    performanceReport.value = monitor.generatePerformanceReport()
    showPerformancePanel.value = true
    
    console.log('📊 Performance profile completed')
  })
}

const optimizePerformance = () => {
  if (!isPerformanceMonitoringEnabled.value) {
    console.log('Performance monitoring is disabled. Enable with window.ENABLE_PERFORMANCE_MONITORING = true')
    return
  }
  
  console.log('⚡ Optimizing performance...')
  
  const monitor = getPerformanceMonitor()
  const engine = getOptimizedPositioningEngine()
  
  // Clear caches and optimize memory
  monitor.clearCache()
  engine.optimizeMemoryUsage()
  
  // Force garbage collection if available
  if ('gc' in window && typeof (window as any).gc === 'function') {
    (window as any).gc()
  }
  
  // Update performance report
  performanceReport.value = monitor.generatePerformanceReport()
  
  console.log('✅ Performance optimization completed')
}

const exportPerformanceData = () => {
  try {
    if (!performanceReport.value) {
      console.warn('No performance data available')
      return
    }
    
    const data = JSON.stringify(performanceReport.value, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    console.log('📄 Performance data exported successfully')
  } catch (error) {
    console.error('❌ Error exporting performance data:', error)
  }
}

// Cleanup function for component unmount
const cleanup = () => {
  if (isPerformanceMonitoringEnabled.value) {
    cleanupPerformanceMonitor()
    cleanupOptimizedPositioning()
  }
}

const rebuildGraph = async () => {
  if (!cy || !cyContainer.value) return
  
  // Build new elements with validation and debug monitoring
  const { 
    nodes, 
    edges, 
    laneHeights, 
    validationResults: newValidationResults, 
    validationSummary: newValidationSummary,
    assignmentStats: newAssignmentStats,
    debugReport: newDebugReport
  } = buildGraphElements(gameData.items)
  
  // Update validation state
  validationResults.value = newValidationResults || []
  validationSummary.value = newValidationSummary || null
  
  // Update debug state
  assignmentStats.value = newAssignmentStats || null
  debugReport.value = newDebugReport || null
  
  // Add material edges if enabled
  if (showMaterialEdges.value) {
    addMaterialEdges(gameData.items, edges, showMaterialEdges.value)
  }
  
  // Update stats
  graphStats.value = {
    nodes: nodes.length,
    edges: edges.length,
    lanes: 14
  }
  
  // Smooth transition for graph rebuild
  // First fade out existing elements
  cy.elements().animate({
    style: { 
      'opacity': 0.1
    }
  }, {
    duration: 150,
    easing: 'ease-in',
    complete: () => {
      // Replace elements after fade out
      cy.elements().remove()
      cy.add({ nodes, edges })
      
      // Re-add swim lane visuals
      addSwimLaneVisuals()
      
      // Add debug boundary elements if enabled
      if (showDebugBoundaries.value) {
        const boundaryElements = generateVisualBoundaryElements()
        if (boundaryElements.length > 0) {
          cy.add(boundaryElements)
        }
      }
      
      // Re-setup event handlers
      setupEventHandlers()
      
      // Fade in new elements
      cy.elements().style('opacity', 0)
      cy.elements().animate({
        style: { 
          'opacity': 1
        }
      }, {
        duration: 300,
        easing: 'ease-out'
      })
    }
  })
  
  // Update container size using consistent constants
  const LANE_PADDING = 25  // Match graphBuilder.ts LAYOUT_CONSTANTS.LANE_PADDING
  const TIER_WIDTH = 180   // Match graphBuilder.ts LAYOUT_CONSTANTS.TIER_WIDTH
  const LANE_START_X = 200 // Match graphBuilder.ts LAYOUT_CONSTANTS.LANE_START_X
  
  const totalHeight = Array.from(laneHeights.values()).reduce((sum, h) => sum + h, 0) + 
                      (14 * LANE_PADDING) + 40  // 14 lanes + extra padding
  const maxTier = Math.max(...nodes.map(n => n.data.tier))
  const totalWidth = Math.max(window.innerWidth, LANE_START_X + ((maxTier + 1) * TIER_WIDTH) + 100)
  
  const container = cyContainer.value!
  container.style.width = `${totalWidth}px`
  container.style.height = `${Math.max(600, totalHeight)}px`
  
  // Force proper z-index ordering on rebuild too
  setTimeout(() => {
    cy.nodes('.lane-background').forEach(node => {
      node.style({ 
        'z-index': -10,
        'z-index-compare': 'manual',
        'events': 'no'
      })
      node.lock()
      node.ungrabify()
    })
    
    cy.edges().forEach(edge => {
      edge.style({ 
        'z-index': 5,
        'z-index-compare': 'manual'
      })
    })
    
    cy.nodes('.lane-label').forEach(node => {
      node.style({ 
        'z-index': 100,
        'z-index-compare': 'manual'
      })
      node.lock()
      node.ungrabify()
    })
    
    cy.nodes('.game-node').forEach(node => {
      node.style({ 
        'z-index': 10,
        'z-index-compare': 'manual'
      })
      node.lock()
      node.ungrabify()
    })
    
    cy.forceRender()
    // Remove verbose rebuild completion logging
  }, 50)
  
  // Re-fit
  cy.fit()
}

// Add visual swim lane backgrounds with dynamic heights
const addSwimLaneVisuals = () => {
  if (!cy) return
  
  // Use the same lane list as graphBuilder.ts for consistency
  const SWIM_LANES = [
    'Farm',              // Row 0
    'Vendors',           // Row 1 - Town vendors (general)
    'Blacksmith',        // Row 2 - Town blacksmith items  
    'Agronomist',        // Row 3 - Town agronomist items
    'Carpenter',         // Row 4 - Town carpenter items
    'Land Steward',      // Row 5 - Town land steward items
    'Material Trader',   // Row 6 - Town material trader items
    'Skills Trainer',    // Row 7 - Town skills trainer items
    'Adventure',         // Row 8 - Adventure routes
    'Combat',            // Row 9 - Combat items
    'Forge',             // Row 10 - Forge items
    'Mining',            // Row 11 - Mining items
    'Tower',             // Row 12 - Tower items
    'General'            // Row 13 - Catch-all
  ]
  
  // Wait for nodes to be fully rendered before calculating sizes
  setTimeout(() => {
    // Get all game nodes (must exist first)
    const allGameNodes = cy.nodes('.game-node')
    if (allGameNodes.length === 0) {
      console.warn('No game nodes found for swimlane sizing')
      return
    }
    
    // Only log swimlane creation in debug mode
    if (debugConfig.value.logLevel === 'debug') {
      console.log(`📏 Creating swimlane backgrounds for ${allGameNodes.length} nodes`)
    }
    
    // Calculate graph bounds for background sizing
    const graphBounds = allGameNodes.boundingBox()
    const graphWidth = Math.max(graphBounds.x2 - graphBounds.x1 + 400, window.innerWidth - 100) // Ensure full width coverage
    const graphCenterX = graphBounds.x1 + (graphWidth / 2)
    
    // Use the same constants as graphBuilder.ts for consistency
    const LANE_PADDING = 25
    const LANE_BUFFER = 20
    
    // Calculate lane boundaries using the same logic as graphBuilder.ts
    let cumulativeY = LANE_PADDING
    
    SWIM_LANES.forEach((lane, laneIndex) => {
      const laneNodes = allGameNodes.filter(node => node.data('swimLane') === lane)
      
      let laneHeight
      let laneCenterY
      let backgroundOpacity = 0.4
      let backgroundColor
      
      // Feature-based background colors with enhanced tinting
      const laneColors: Record<string, string> = {
        'Farm': '#1a3d2e',           // Enhanced green tint
        'Vendors': '#3d1f1f',        // Enhanced red tint
        'Blacksmith': '#3d2f1a',     // Enhanced amber tint
        'Agronomist': '#1a2f23',     // Enhanced dark green tint
        'Carpenter': '#2a1f3d',      // Enhanced violet tint
        'Land Steward': '#1a2f3d',   // Enhanced sky tint
        'Material Trader': '#3d2a1a', // Enhanced orange tint
        'Skills Trainer': '#3d1f2f', // Enhanced pink tint
        'Adventure': '#3d2a1a',      // Enhanced orange tint
        'Combat': '#3d1f1f',         // Enhanced red tint
        'Forge': '#3d321a',          // Enhanced yellow tint
        'Mining': '#1a2a3d',         // Enhanced cyan tint
        'Tower': '#2a1f3d',          // Enhanced purple tint
        'General': '#2a2a2a'         // Enhanced gray tint
      }

      if (laneNodes.length === 0) {
        // Empty lane - minimal height
        laneHeight = 80
        laneCenterY = cumulativeY + (laneHeight / 2)
        backgroundOpacity = 0.4 // Higher opacity for empty lanes
        backgroundColor = laneColors[lane] || (laneIndex % 2 === 0 ? '#1e293b' : '#0f172a')
      } else {
        // Lane with nodes - calculate height based on actual node distribution
        const nodePositions = laneNodes.map(node => node.position().y)
        const minNodeY = Math.min(...nodePositions)
        const maxNodeY = Math.max(...nodePositions)
        const nodeRange = maxNodeY - minNodeY
        
        // Calculate height with proper padding (matching graphBuilder.ts logic)
        laneHeight = Math.max(100, nodeRange + (LANE_BUFFER * 2) + 40) // Extra padding for visual separation
        laneCenterY = cumulativeY + (laneHeight / 2)
        
        // Feature-based background colors for visual distinction
        backgroundColor = laneColors[lane] || (laneIndex % 2 === 0 ? '#1a2332' : '#0f172a')
        backgroundOpacity = 0.8 // Higher opacity for lanes with nodes
        
        // Remove individual lane logs - they're too verbose
      }
      
      // Create background rectangle
      cy.add({
        group: 'nodes',
        data: { 
          id: `lane-bg-${lane}`, 
          label: '',
          laneIndex: laneIndex // Store for color calculation
        },
        position: { x: graphCenterX, y: laneCenterY },
        classes: 'lane-background',
        selectable: false,
        grabbable: false,
        locked: true
      })
      
      // Create lane label
      cy.add({
        group: 'nodes',
        data: { 
          id: `lane-label-${lane}`, 
          label: lane,
          laneIndex: laneIndex
        },
        position: { x: 100, y: laneCenterY }, // Fixed position on left side
        classes: 'lane-label',
        selectable: false,
        grabbable: false,
        locked: true
      })
      
      // Feature-based border colors
      const borderColors: Record<string, string> = {
        'Farm': '#047857',           // Green border
        'Vendors': '#b91c1c',        // Red border
        'Blacksmith': '#d97706',     // Amber border
        'Agronomist': '#065f46',     // Dark green border
        'Carpenter': '#7c3aed',      // Violet border
        'Land Steward': '#0891b2',   // Sky border
        'Material Trader': '#ea580c', // Orange border
        'Skills Trainer': '#db2777', // Pink border
        'Adventure': '#c2410c',      // Orange border
        'Combat': '#991b1b',         // Dark red border
        'Forge': '#a16207',          // Yellow border
        'Mining': '#0e7490',         // Cyan border
        'Tower': '#6d28d9',          // Purple border
        'General': '#4b5563'         // Gray border
      }

      // Apply styles immediately to ensure proper rendering
      const bgNode = cy.getElementById(`lane-bg-${lane}`)
      if (bgNode.length > 0) {
        bgNode.style({
          'width': graphWidth,
          'height': laneHeight,
          'background-color': backgroundColor,
          'background-opacity': backgroundOpacity,
          'border-width': 1,
          'border-color': borderColors[lane] || '#334155',
          'border-opacity': 0.4,
          'z-index': -10, // Ensure it's behind everything
          'events': 'no',
          'overlay-opacity': 0
        })
      }
      
      // Feature-based label background colors (darker versions)
      const labelColors: Record<string, string> = {
        'Farm': '#064e3b',           // Dark green
        'Vendors': '#7f1d1d',        // Dark red
        'Blacksmith': '#92400e',     // Dark amber
        'Agronomist': '#065f46',     // Dark green
        'Carpenter': '#5b21b6',      // Dark violet
        'Land Steward': '#0c4a6e',   // Dark sky
        'Material Trader': '#9a3412', // Dark orange
        'Skills Trainer': '#9d174d', // Dark pink
        'Adventure': '#9a3412',      // Dark orange
        'Combat': '#7f1d1d',         // Dark red
        'Forge': '#92400e',          // Dark yellow
        'Mining': '#0c4a6e',         // Dark cyan
        'Tower': '#5b21b6',          // Dark purple
        'General': '#374151'         // Dark gray
      }

      const labelNode = cy.getElementById(`lane-label-${lane}`)
      if (labelNode.length > 0) {
        labelNode.style({
          'width': '120px',
          'height': '30px',
          'background-color': labelColors[lane] || '#1e293b',
          'background-opacity': 0.9,
          'border-width': 1,
          'border-color': borderColors[lane] || '#475569',
          'color': laneNodes.length > 0 ? '#f8fafc' : '#94a3b8', // Brighter text for active lanes
          'font-size': '12px',
          'font-weight': 'bold',
          'text-valign': 'center',
          'text-halign': 'center',
          'z-index': 100, // Ensure labels are always visible
          'overlay-opacity': 0
        })
      }
      
      // Move to next lane position
      cumulativeY += laneHeight + LANE_PADDING
    })
    
    // Force proper z-index layering
    setTimeout(() => {
      // Backgrounds at the bottom
      cy.nodes('.lane-background').forEach(node => {
        node.style('z-index', -10)
        node.lock()
        node.ungrabify()
      })
      
      // Labels above backgrounds but below nodes
      cy.nodes('.lane-label').forEach(node => {
        node.style('z-index', 100)
        node.lock()
        node.ungrabify()
      })
      
      // Game nodes on top
      cy.nodes('.game-node').forEach(node => {
        node.style('z-index', 10)
      })
      
      // Edges in middle
      cy.edges().forEach(edge => {
        edge.style('z-index', 5)
      })
      
      cy.forceRender()
      
      const backgroundCount = cy.nodes('.lane-background').length
      const labelCount = cy.nodes('.lane-label').length
      // Remove verbose background creation logging
      
    }, 50) // Small delay to ensure all elements are added
    
  }, 200) // Wait for nodes to be fully positioned
}

// Helper function for calculating prerequisite depth (needed for visualization)
const calculatePrerequisiteDepth = (item: GameDataItem, allItems: GameDataItem[]): number => {
  if (!item.prerequisites || item.prerequisites.length === 0) {
    return 0
  }
  
  let maxDepth = 0
  const visited = new Set<string>()
  
  function getDepth(itemId: string): number {
    if (visited.has(itemId)) return 0
    visited.add(itemId)
    
    const currentItem = allItems.find(i => i.id === itemId)
    if (!currentItem || !currentItem.prerequisites || currentItem.prerequisites.length === 0) {
      return 0
    }
    
    let max = 0
    for (const prereqId of currentItem.prerequisites) {
      max = Math.max(max, getDepth(prereqId) + 1)
    }
    return max
  }
  
  maxDepth = getDepth(item.id)
  return maxDepth
}

const initializeGraph = async () => {
  if (!cyContainer.value) {
    console.error('❌ Cytoscape container not available')
    return
  }
  
  isLoading.value = true
  
  try {
    // Remove verbose initialization logging
    
    // Build elements from game data with validation
    const { nodes, edges, laneHeights, validationResults: initialValidationResults, validationSummary: initialValidationSummary } = buildGraphElements(gameData.items)
    
    // Store validation results
    validationResults.value = initialValidationResults || []
    validationSummary.value = initialValidationSummary || null
    
    // Add material edges if enabled
    if (showMaterialEdges.value) {
      addMaterialEdges(gameData.items, edges, showMaterialEdges.value)
    }
    
    // Update stats
    graphStats.value = {
      nodes: nodes.length,
      edges: edges.length,
      lanes: 14 // We have 14 swim lanes (including individual town vendors)
    }
    
    // Initialize Cytoscape
    cy = cytoscape({
      container: cyContainer.value,
      
      elements: { nodes, edges },
      
      style: [
        // Updated node styles for reduced size and better spacing
        {
          selector: 'node.game-node',
          style: {
            'background-color': '#1e293b',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#e2e8f0',
            'font-size': '11px',  // Reduced from 12px
            'font-family': 'system-ui, sans-serif',
            'width': '140px',  // Reduced from 200px
            'height': '40px',  // Reduced from 50px
            'shape': 'round-rectangle',
            'border-width': 2,
            'border-color': '#475569',
            'text-wrap': 'wrap',
            'text-max-width': '130px',  // Adjusted for new width
            'padding': '5px',  // Reduced from 10px
            'overlay-padding': '6px',
            'z-compound-depth': 'top',
            'z-index': 10,
            'overlay-opacity': 0,
            'min-zoomed-font-size': 8,
            'events': 'yes',
            'transition-property': 'background-color, border-color',
            'transition-duration': '0.2s'
          }
        },
        
        // Feature-specific colors (base colors for game systems)
        { selector: '.feature-farm', style: { 'background-color': '#059669', 'border-color': '#047857' } },        // Green - Farm
        { selector: '.feature-town', style: { 'background-color': '#dc2626', 'border-color': '#b91c1c' } },        // Red - Town
        { selector: '.feature-adventure', style: { 'background-color': '#ea580c', 'border-color': '#c2410c' } },   // Orange - Adventure
        { selector: '.feature-combat', style: { 'background-color': '#b91c1c', 'border-color': '#991b1b' } },      // Dark Red - Combat
        { selector: '.feature-forge', style: { 'background-color': '#ca8a04', 'border-color': '#a16207' } },       // Yellow - Forge
        { selector: '.feature-mining', style: { 'background-color': '#0891b2', 'border-color': '#0e7490' } },      // Cyan - Mining
        { selector: '.feature-tower', style: { 'background-color': '#7c3aed', 'border-color': '#6d28d9' } },       // Purple - Tower
        { selector: '.feature-general', style: { 'background-color': '#6b7280', 'border-color': '#4b5563' } },     // Gray - General
        
        // Swimlane-specific colors (override feature colors for unique lane identification)
        { selector: '.lane-farm', style: { 'background-color': '#059669', 'border-color': '#047857' } },           // Green - Farm
        { selector: '.lane-vendors', style: { 'background-color': '#dc2626', 'border-color': '#b91c1c' } },        // Red - General Vendors
        { selector: '.lane-blacksmith', style: { 'background-color': '#f59e0b', 'border-color': '#d97706' } },     // Amber - Blacksmith
        { selector: '.lane-agronomist', style: { 'background-color': '#047857', 'border-color': '#065f46' } },     // Dark Green - Agronomist
        { selector: '.lane-carpenter', style: { 'background-color': '#8b5cf6', 'border-color': '#7c3aed' } },      // Violet - Carpenter
        { selector: '.lane-land-steward', style: { 'background-color': '#06b6d4', 'border-color': '#0891b2' } },   // Sky - Land Steward
        { selector: '.lane-material-trader', style: { 'background-color': '#f97316', 'border-color': '#ea580c' } }, // Orange - Material Trader
        { selector: '.lane-skills-trainer', style: { 'background-color': '#ec4899', 'border-color': '#db2777' } }, // Pink - Skills Trainer
        { selector: '.lane-adventure', style: { 'background-color': '#ea580c', 'border-color': '#c2410c' } },      // Orange - Adventure
        { selector: '.lane-combat', style: { 'background-color': '#b91c1c', 'border-color': '#991b1b' } },         // Dark Red - Combat
        { selector: '.lane-forge', style: { 'background-color': '#ca8a04', 'border-color': '#a16207' } },          // Yellow - Forge
        { selector: '.lane-mining', style: { 'background-color': '#0891b2', 'border-color': '#0e7490' } },         // Cyan - Mining
        { selector: '.lane-tower', style: { 'background-color': '#7c3aed', 'border-color': '#6d28d9' } },          // Purple - Tower
        { selector: '.lane-general', style: { 'background-color': '#6b7280', 'border-color': '#4b5563' } },        // Gray - General
        
        // Grid-aligned edge styles (Civ V style) - ENHANCED VISIBILITY
        {
          selector: 'edge.edge-prerequisite',
          style: {
            'width': 4,
            'line-color': '#64748b',  // Light slate for good visibility
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            'target-arrow-width': 3,
            'arrow-scale': 1.5,
            'curve-style': 'taxi',  // 90° corners
            'taxi-direction': 'horizontal',
            'taxi-turn': '50px',
            'taxi-turn-min-distance': 30,
            'edge-distances': 'node-position',
            'control-point-step-size': 40,
            'opacity': 1,
            'z-index': 2,
            'z-index-compare': 'manual',
            'overlay-color': '#64748b',
            'overlay-opacity': 0.1
          }
        },
        
        // Highlighted edge style (for dependency chains)
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': '#fbbf24',
            'target-arrow-color': '#fbbf24',
            'width': 4,
            'opacity': 1,
            'z-index': 10,
            'curve-style': 'taxi',
            'taxi-direction': 'horizontal',
            'taxi-turn': '50px'
          }
        },
        
        // Material edges with taxi routing
        {
          selector: 'edge.edge-material',
          style: {
            'line-style': 'dashed',
            'line-dash-pattern': [10, 5],
            'line-color': '#10b981',
            'target-arrow-color': '#10b981',
            'opacity': 0.6,
            'width': 2,
            'curve-style': 'taxi',
            'taxi-direction': 'horizontal',
            'taxi-turn': '30px'
          }
        },
        
        // Remove invalid node:hover selector - using click-based interaction
        // Hover effects handled via JavaScript events, not CSS selectors
        
        {
          selector: '.highlighted',
          style: {
            'border-color': '#fbbf24',
            'border-width': 3,
            'z-index': 999
          }
        },
        
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.3
          }
        },
        
        // Lane backgrounds with feature-based tinting - ENHANCED Z-INDEX CONTROL
        {
          selector: '.lane-background',
          style: {
            'shape': 'rectangle',
            'background-color': (ele: any) => {
              const lane = ele.data('id').replace('lane-bg-', '')
              const laneIndex = ele.data('laneIndex') || 0
              
              // Feature-based background colors with enhanced tinting
              const laneColors: Record<string, string> = {
                'Farm': '#1a3d2e',           // Enhanced green tint
                'Vendors': '#3d1f1f',        // Enhanced red tint
                'Blacksmith': '#3d2f1a',     // Enhanced amber tint
                'Agronomist': '#1a2f23',     // Enhanced dark green tint
                'Carpenter': '#2a1f3d',      // Enhanced violet tint
                'Land Steward': '#1a2f3d',   // Enhanced sky tint
                'Material Trader': '#3d2a1a', // Enhanced orange tint
                'Skills Trainer': '#3d1f2f', // Enhanced pink tint
                'Adventure': '#3d2a1a',      // Enhanced orange tint
                'Combat': '#3d1f1f',         // Enhanced red tint
                'Forge': '#3d321a',          // Enhanced yellow tint
                'Mining': '#1a2a3d',         // Enhanced cyan tint
                'Tower': '#2a1f3d',          // Enhanced purple tint
                'General': '#2a2a2a'         // Enhanced gray tint
              }
              
              // Use lane-specific color or fall back to alternating pattern
              return laneColors[lane] || (laneIndex % 2 === 0 ? '#1a2332' : '#0f172a')
            },
            'background-opacity': (ele: any) => {
              const lane = ele.data('id').replace('lane-bg-', '')
              // Check if lane has nodes by looking for game nodes with this swimlane
              const hasNodes = cy.nodes('.game-node').some(node => node.data('swimLane') === lane)
              return hasNodes ? 0.8 : 0.4 // Higher opacity for more visible tinting
            },
            'border-width': 1,
            'border-color': (ele: any) => {
              const lane = ele.data('id').replace('lane-bg-', '')
              
              // Feature-based border colors (lighter versions of background)
              const borderColors: Record<string, string> = {
                'Farm': '#047857',           // Green border
                'Vendors': '#b91c1c',        // Red border
                'Blacksmith': '#d97706',     // Amber border
                'Agronomist': '#065f46',     // Dark green border
                'Carpenter': '#7c3aed',      // Violet border
                'Land Steward': '#0891b2',   // Sky border
                'Material Trader': '#ea580c', // Orange border
                'Skills Trainer': '#db2777', // Pink border
                'Adventure': '#c2410c',      // Orange border
                'Combat': '#991b1b',         // Dark red border
                'Forge': '#a16207',          // Yellow border
                'Mining': '#0e7490',         // Cyan border
                'Tower': '#6d28d9',          // Purple border
                'General': '#4b5563'         // Gray border
              }
              
              return borderColors[lane] || '#334155'
            },
            'border-opacity': 0.4,
            'border-style': 'solid',
            'z-index': -10,  // Very negative to ensure it's behind everything
            'z-index-compare': 'manual',
            'overlay-opacity': 0,
            'events': 'no',  // Disable all events
            'selectable': false,
            'grabbable': false
          }
        },
        
        // Swim lane labels with feature-based styling
        {
          selector: '.lane-label',
          style: {
            'shape': 'rectangle',
            'width': '120px',
            'height': '30px',
            'background-color': (ele: any) => {
              const lane = ele.data('label')
              
              // Feature-based label background colors (darker versions)
              const labelColors: Record<string, string> = {
                'Farm': '#064e3b',           // Dark green
                'Vendors': '#7f1d1d',        // Dark red
                'Blacksmith': '#92400e',     // Dark amber
                'Agronomist': '#065f46',     // Dark emerald
                'Carpenter': '#5b21b6',      // Dark violet
                'Land Steward': '#0c4a6e',   // Dark sky
                'Material Trader': '#9a3412', // Dark orange
                'Skills Trainer': '#9d174d', // Dark pink
                'Adventure': '#9a3412',      // Dark orange
                'Combat': '#7f1d1d',         // Dark red
                'Forge': '#92400e',          // Dark yellow
                'Mining': '#0c4a6e',         // Dark cyan
                'Tower': '#5b21b6',          // Dark purple
                'General': '#374151'         // Dark gray
              }
              
              return labelColors[lane] || '#1e293b'
            },
            'background-opacity': 0.9,
            'border-width': 1,
            'border-color': (ele: any) => {
              const lane = ele.data('label')
              
              // Feature-based border colors (same as swimlane borders)
              const borderColors: Record<string, string> = {
                'Farm': '#047857',           // Green border
                'Vendors': '#b91c1c',        // Red border
                'Blacksmith': '#d97706',     // Amber border
                'Agronomist': '#065f46',     // Dark green border
                'Carpenter': '#7c3aed',      // Violet border
                'Land Steward': '#0891b2',   // Sky border
                'Material Trader': '#ea580c', // Orange border
                'Skills Trainer': '#db2777', // Pink border
                'Adventure': '#c2410c',      // Orange border
                'Combat': '#991b1b',         // Dark red border
                'Forge': '#a16207',          // Yellow border
                'Mining': '#0e7490',         // Cyan border
                'Tower': '#6d28d9',          // Purple border
                'General': '#4b5563'         // Gray border
              }
              
              return borderColors[lane] || '#475569'
            },
            'border-opacity': 0.8,
            'label': 'data(label)',  // Display the node's label text
            'text-valign': 'center',
            'text-halign': 'center',
            'font-weight': 'bold',
            'font-size': '12px',
            'color': (ele: any) => {
              const lane = ele.data('label')
              // Check if lane has nodes
              const hasNodes = cy.nodes('.game-node').some(node => node.data('swimLane') === lane)
              return hasNodes ? '#f8fafc' : '#94a3b8' // Brighter text for active lanes
            },
            'z-index': 100, // High z-index to ensure visibility above backgrounds
            'z-index-compare': 'manual',
            'overlay-opacity': 0,
            'events': 'no',
            'selectable': false,
            'grabbable': false
          }
        }
      ],
      
      layout: {
        name: 'preset',  // Use our calculated positions
        fit: false,      // Don't auto-fit, we want horizontal scroll
        padding: 30
      },
      
      // Update viewport settings for horizontal scrolling
      minZoom: 0.3,
      maxZoom: 2,
      wheelSensitivity: 0.2,
      
      // Set initial viewport to show leftmost nodes
      pan: { x: 50, y: 50 },
      zoom: 1,
      
      // Performance settings for ~400 nodes
      textureOnViewport: true,
      motionBlur: false,       // OFF for better performance
      hideEdgesOnViewport: false, // Keep edges visible for better UX
      hideLabelsOnViewport: false, // Keep labels visible
      pixelRatio: 1,           // Lower for better performance
      
      // Interaction settings - DISABLE NODE DRAGGING
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      selectionType: 'single',
      autoungrabify: true  // Disable node dragging globally
    })
    
    // Add event handlers
    setupEventHandlers()
    
    // Add swim lane visuals
    addSwimLaneVisuals()
    
    // Calculate and set container size using consistent constants
    const LANE_PADDING = 25  // Match graphBuilder.ts constants
    const TIER_WIDTH = 180
    const LANE_START_X = 200
    
    const totalHeight = Array.from(laneHeights.values()).reduce((sum, h) => sum + h, 0) + 
                        (14 * LANE_PADDING) + 40  // 14 lanes + extra padding
    const maxTier = Math.max(...nodes.map(n => n.data.tier))
    const totalWidth = Math.max(window.innerWidth, LANE_START_X + ((maxTier + 1) * TIER_WIDTH) + 100)
    
    const container = cyContainer.value!
    container.style.width = `${totalWidth}px`
    container.style.height = `${Math.max(600, totalHeight)}px`
    
    // FORCE PROPER Z-INDEX ORDERING - ENHANCED
    setTimeout(() => {
      // Enforce strict z-index layering for proper visual hierarchy
      cy.nodes('.lane-background').forEach(node => {
        node.style({ 
          'z-index': -10, 
          'z-index-compare': 'manual',
          'events': 'no' 
        })
        node.lock()
        node.ungrabify()
      })
      
      cy.edges().forEach(edge => {
        edge.style({ 
          'z-index': 5,
          'z-index-compare': 'manual'
        })
      })
      
      cy.nodes('.lane-label').forEach(node => {
        node.style({ 
          'z-index': 100,
          'z-index-compare': 'manual'
        })
        node.lock()
        node.ungrabify()
      })
      
      cy.nodes('.game-node').forEach(node => {
        node.style({ 
          'z-index': 10,
          'z-index-compare': 'manual'
        })
        node.lock()
        node.ungrabify()
      })
      
      cy.forceRender()
      // Remove verbose layout completion logging
    }, 50) // Increased delay to ensure all elements are added
    
    // COMPREHENSIVE EDGE DEBUG LOGGING
    const edgeCount = cy.edges().length
    const nodeCount = cy.nodes('.game-node').length
    
    // Only log graph summary in debug mode
    if (debugConfig.value.logLevel === 'debug') {
      console.log(`🗺️ GRAPH SUMMARY: ${nodeCount} nodes, ${edgeCount} edges`)
    }
    
    if (edgeCount === 0) {
      console.error('❌ NO EDGES CREATED! Running comprehensive diagnostics...')
      
      const treeItems = gameData.items.filter(item => 
        item.category === 'Actions' || item.category === 'Unlocks'
      )
      
      console.log(`🔎 Analyzing ${treeItems.length} tree items:`)
      
      let totalPrereqs = 0
      let foundPrereqs = 0
      let invalidTierPrereqs = 0
      
      treeItems.forEach(item => {
        if (item.prerequisites?.length > 0) {
          const itemTier = calculatePrerequisiteDepth(item, treeItems)
          console.log(`
📄 ${item.name} (${item.id}, tier ${itemTier}) requires:`, item.prerequisites)
          
          item.prerequisites.forEach(prereqId => {
            totalPrereqs++
            const found = treeItems.find(i => i.id === prereqId)
            if (!found) {
              console.error(`  ❌ ${prereqId} NOT FOUND in filtered items`)
            } else {
              foundPrereqs++
              const prereqTier = calculatePrerequisiteDepth(found, treeItems)
              if (prereqTier >= itemTier) {
                invalidTierPrereqs++
                console.warn(`  ⚠️ ${found.name} (tier ${prereqTier}) invalid - not left of ${item.name} (tier ${itemTier})`)
              } else {
                // Remove individual edge logging
              }
            }
          })
        }
      })
      
      console.log(`
📊 PREREQUISITES ANALYSIS:`)
      console.log(`- Total prerequisites: ${totalPrereqs}`)
      console.log(`- Found prerequisites: ${foundPrereqs}`)
      console.log(`- Missing prerequisites: ${totalPrereqs - foundPrereqs}`)
      console.log(`- Invalid tier prerequisites: ${invalidTierPrereqs}`)
      console.log(`- Valid edges created: ${foundPrereqs - invalidTierPrereqs}`)
      
      // Try to force edge creation as fallback
      if (edgeCount === 0 && foundPrereqs > invalidTierPrereqs) {
        console.log('🔧 Attempting fallback edge creation...')
        setTimeout(() => {
          const fallbackEdges: any[] = []
          treeItems.forEach(item => {
            if (item.prerequisites?.length > 0) {
              item.prerequisites.forEach(prereqId => {
                const found = treeItems.find(i => i.id === prereqId)
                if (found) {
                  fallbackEdges.push({
                    data: {
                      id: `fallback-${prereqId}-to-${item.id}`,
                      source: prereqId,
                      target: item.id,
                      type: 'prerequisite'
                    },
                    classes: 'edge-prerequisite'
                  })
                }
              })
            }
          })
          
          if (fallbackEdges.length > 0) {
            cy.add(fallbackEdges)
            // Remove fallback edge logging
            cy.forceRender()
          }
        }, 100)
      }
    } else {
      // Keep only essential edge creation summary
      console.log(`Graph: ${nodeCount} nodes, ${edgeCount} edges`)
      
      // Log edge details
      cy.edges('.edge-prerequisite').forEach(edge => {
        const data = edge.data()
        const sourceNode = cy.getElementById(data.source)
        const targetNode = cy.getElementById(data.target)
        // Edge created successfully (removed verbose logging)
      })
    }
    
    // Fit to viewport
    await nextTick()
    cy.fit()
    
    // Remove duplicate graph summary
    
  } catch (error) {
    console.error('❌ Failed to initialize graph:', error)
  } finally {
    isLoading.value = false
  }
}

const setupEventHandlers = () => {
  if (!cy) return
  
  // Node click handler for selection and controls
  cy.on('tap', 'node', (evt) => {
    const node = evt.target
    const data = node.data()
    
    // Set selected node
    selectedNode.value = data.fullData
    
    // Clear previous highlighting
    cy.elements().removeClass('highlighted dimmed')
    
    // Highlight dependency chain
    const predecessors = node.predecessors()
    const successors = node.successors()
    const connected = predecessors.union(successors).union(node)
    
    connected.addClass('highlighted')
    cy.elements().not(connected).addClass('dimmed')
    
    // Position controls to the right of the node
    const pos = node.renderedPosition()
    const zoom = cy.zoom()
    const pan = cy.pan()
    
    nodeControlsPosition.value = {
      left: `${pos.x + (90 * zoom) + pan.x}px`,  // 90px is half node width
      top: `${pos.y - (25 * zoom) + pan.y}px`,   // Center vertically
      transform: `scale(${Math.max(0.8, Math.min(1.2, zoom))})`  // Scale with zoom
    }
    
    console.log(`📍 Selected: ${data.label} (${data.id}) | Lane: ${data.swimLane} | Tier: ${data.tier}`)
  })
  
  // Clear selection on background tap
  cy.on('tap', (evt) => {
    if (evt.target === cy) {
      cy.elements().removeClass('highlighted dimmed')
      selectedNode.value = null
    }
  })
}

onMounted(async () => {
  // Initialize debug monitor configuration
  updateDebugMonitorConfig(debugConfig.value)
  
  // Ensure data is loaded
  if (gameData.items.length === 0) {
    await gameData.loadGameData()
  }
  
  console.log(`📊 Found ${gameData.items.length} total items, ${filteredItemsCount.value} are Actions/Unlocks`)
  
  // Initialize graph
  await initializeGraph()
  
  // Initialize performance monitoring only if explicitly enabled
  if (isPerformanceMonitoringEnabled.value) {
    performanceMonitor.value = initializePerformanceMonitor({
      enableCaching: true,
      enableBatching: true,
      enableMemoryOptimization: true,
      profileMemoryUsage: true,
      trackRenderTimes: true
    })
    performanceReport.value = performanceMonitor.value.generatePerformanceReport()
  }
})

onUnmounted(() => {
  // Cleanup performance monitoring and optimized positioning
  cleanup()
})
</script>

<style scoped>
.upgrade-tree-view {
  height: calc(100vh - 120px); /* Account for header space */
}

.cytoscape-container {
  height: calc(100% - 80px); /* Account for header within this view */
  min-height: 600px;
}

.loading-overlay {
  z-index: 1000;
}

.zoom-controls {
  z-index: 100;
}

.graph-stats {
  z-index: 100;
}

/* Ensure proper responsive behavior */
@media (max-width: 768px) {
  .zoom-controls {
    position: fixed;
    top: auto;
    bottom: 20px;
    right: 20px;
  }
  
  .graph-stats {
    position: fixed;
    bottom: 20px;
    left: 20px;
    font-size: 12px;
  }
}
</style>