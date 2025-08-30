<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-sim-surface rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-sim-border">
        <h2 class="text-2xl font-bold text-sim-text">
          Compare Reports ({{ reportIds.length }})
        </h2>
        <button 
          @click="$emit('close')"
          class="p-2 text-sim-text-secondary hover:text-sim-text rounded-lg hover:bg-sim-background"
        >
          <i class="fas fa-times text-lg"></i>
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
        <!-- Loading state -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <div class="text-center">
            <i class="fas fa-spinner fa-spin text-3xl text-sim-accent mb-4"></i>
            <p class="text-sim-text-secondary">Analyzing reports...</p>
          </div>
        </div>
        
        <!-- Comparison content -->
        <div v-else-if="comparisonResult" class="space-y-6">
          <!-- Summary metrics -->
          <div class="bg-sim-card rounded-lg p-6">
            <h3 class="text-lg font-semibold text-sim-text mb-4">Comparison Summary</h3>
            <div class="grid grid-cols-4 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-sim-accent">
                  {{ Math.round(comparisonResult.metrics.averageScore) }}
                </div>
                <div class="text-sm text-sim-text-secondary">Avg Score</div>
              </div>
              
              <div class="text-center">
                <div class="text-2xl font-bold text-sim-text">
                  {{ comparisonResult.metrics.averageDays.toFixed(1) }}
                </div>
                <div class="text-sm text-sim-text-secondary">Avg Days</div>
              </div>
              
              <div class="text-center">
                <div class="text-2xl font-bold text-green-400">
                  {{ Math.round(comparisonResult.metrics.successRate * 100) }}%
                </div>
                <div class="text-sm text-sim-text-secondary">Success Rate</div>
              </div>
              
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-400">
                  {{ reportIds.length }}
                </div>
                <div class="text-sm text-sim-text-secondary">Reports</div>
              </div>
            </div>
          </div>
          
          <!-- Best performer -->
          <div class="bg-sim-card rounded-lg p-6">
            <h3 class="text-lg font-semibold text-sim-text mb-4">Best Performer</h3>
            <div class="flex items-center gap-4">
              <div class="text-2xl">🏆</div>
              <div>
                <div class="font-semibold text-sim-text">
                  {{ comparisonResult.metrics.bestPerformer.summary.simulationName }}
                </div>
                <div class="text-sim-text-secondary">
                  {{ comparisonResult.metrics.bestPerformer.summary.personaName }} • 
                  Score: {{ comparisonResult.metrics.bestPerformer.summary.overallScore }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Insights -->
          <div v-if="comparisonResult.insights.length > 0" class="bg-sim-card rounded-lg p-6">
            <h3 class="text-lg font-semibold text-sim-text mb-4">Key Insights</h3>
            <div class="space-y-3">
              <div 
                v-for="insight in comparisonResult.insights"
                :key="insight.title"
                class="p-4 rounded-lg"
                :class="insight.impact === 'positive' ? 'bg-green-50 border border-green-200' : 
                       insight.impact === 'negative' ? 'bg-red-50 border border-red-200' : 
                       'bg-blue-50 border border-blue-200'"
              >
                <h4 class="font-medium text-sm mb-2" 
                    :class="insight.impact === 'positive' ? 'text-green-800' :
                           insight.impact === 'negative' ? 'text-red-800' :
                           'text-blue-800'">
                  {{ insight.title }}
                </h4>
                <p class="text-sm" 
                   :class="insight.impact === 'positive' ? 'text-green-700' :
                          insight.impact === 'negative' ? 'text-red-700' :
                          'text-blue-700'">
                  {{ insight.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Error state -->
        <div v-else-if="error" class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-4"></i>
          <p class="text-red-600">{{ error }}</p>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 p-6 border-t border-sim-border bg-sim-card">
        <button 
          @click="$emit('close')"
          class="px-4 py-2 text-sim-text border border-sim-border rounded-lg hover:bg-sim-background"
        >
          Close
        </button>
        
        <button 
          v-if="comparisonResult"
          @click="exportComparison"
          class="px-4 py-2 bg-sim-accent text-white rounded-lg hover:bg-blue-600"
        >
          <i class="fas fa-download mr-2"></i>
          Export Comparison
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useReportsStore } from '@/stores/reports'
import type { ComparisonResult } from '@/types/reports'

const props = defineProps<{
  reportIds: string[]
}>()

const emit = defineEmits<{
  close: []
}>()

const reportsStore = useReportsStore()

const isLoading = ref(true)
const comparisonResult = ref<ComparisonResult | null>(null)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    comparisonResult.value = await reportsStore.compareReports(props.reportIds)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to compare reports'
  } finally {
    isLoading.value = false
  }
})

async function exportComparison() {
  if (!comparisonResult.value) return
  
  try {
    const blob = await reportsStore.exportReports(props.reportIds, 'markdown', { includeComparison: true })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'simulation_comparison.md'
    a.click()
    
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Failed to export comparison:', err)
  }
}
</script>

