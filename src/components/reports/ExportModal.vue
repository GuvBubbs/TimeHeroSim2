<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-sim-surface rounded-lg shadow-xl w-full max-w-lg">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-sim-border">
        <h2 class="text-xl font-bold text-sim-text">
          Export {{ reportIds.length > 1 ? 'Reports' : 'Report' }}
        </h2>
        <button 
          @click="$emit('close')"
          class="p-2 text-sim-text-secondary hover:text-sim-text rounded-lg hover:bg-sim-background"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Format Selection -->
        <div>
          <label class="block text-sm font-medium text-sim-text mb-3">Export Format</label>
          <div class="grid grid-cols-2 gap-3">
            <label 
              v-for="format in formats"
              :key="format.value"
              class="flex items-center p-3 border border-sim-border rounded-lg cursor-pointer hover:border-sim-accent"
              :class="{ 'border-sim-accent bg-sim-accent/10': exportOptions.format === format.value }"
            >
              <input 
                type="radio" 
                :value="format.value" 
                v-model="exportOptions.format"
                class="sr-only"
              />
              <div class="flex items-center gap-3">
                <i :class="format.icon" class="text-sim-accent"></i>
                <div>
                  <div class="text-sm font-medium text-sim-text">{{ format.name }}</div>
                  <div class="text-xs text-sim-text-secondary">{{ format.description }}</div>
                </div>
              </div>
            </label>
          </div>
        </div>
        
        <!-- Options -->
        <div>
          <label class="block text-sm font-medium text-sim-text mb-3">Export Options</label>
          <div class="space-y-3">
            <label class="flex items-center gap-3">
              <input 
                type="checkbox" 
                v-model="exportOptions.includeSummary"
                class="form-checkbox text-sim-accent border-sim-border"
              />
              <span class="text-sim-text">Include Summary</span>
            </label>
            
            <label class="flex items-center gap-3">
              <input 
                type="checkbox" 
                v-model="exportOptions.includeDetailed"
                class="form-checkbox text-sim-accent border-sim-border"
              />
              <span class="text-sim-text">Include Detailed Analysis</span>
            </label>
            
            <label class="flex items-center gap-3">
              <input 
                type="checkbox" 
                v-model="exportOptions.includeRecommendations"
                class="form-checkbox text-sim-accent border-sim-border"
              />
              <span class="text-sim-text">Include Recommendations</span>
            </label>
            
            <label 
              v-if="reportIds.length > 1"
              class="flex items-center gap-3"
            >
              <input 
                type="checkbox" 
                v-model="exportOptions.includeComparison"
                class="form-checkbox text-sim-accent border-sim-border"
              />
              <span class="text-sim-text">Include Comparison Analysis</span>
            </label>
          </div>
        </div>
        
        <!-- Report Selection (for multiple reports) -->
        <div v-if="reportIds.length > 1">
          <label class="block text-sm font-medium text-sim-text mb-3">
            Reports to Export ({{ selectedReports.length }})
          </label>
          <div class="max-h-48 overflow-y-auto space-y-2 border border-sim-border rounded-lg p-3">
            <label 
              v-for="reportId in reportIds"
              :key="reportId"
              class="flex items-center gap-3 p-2 rounded hover:bg-sim-background"
            >
              <input 
                type="checkbox" 
                :value="reportId"
                v-model="selectedReports"
                class="form-checkbox text-sim-accent border-sim-border"
              />
              <div class="min-w-0 flex-1">
                <div class="text-sm font-medium text-sim-text truncate">
                  {{ getReportName(reportId) }}
                </div>
                <div class="text-xs text-sim-text-secondary">
                  {{ getReportPersona(reportId) }} • {{ getReportDate(reportId) }}
                </div>
              </div>
            </label>
          </div>
        </div>
        
        <!-- Preview info -->
        <div class="bg-sim-card p-4 rounded-lg">
          <h4 class="text-sm font-medium text-sim-text mb-2">Export Preview</h4>
          <div class="text-sm text-sim-text-secondary space-y-1">
            <div>Format: {{ formatLabels[exportOptions.format] }}</div>
            <div>Reports: {{ exportReportCount }}</div>
            <div>Estimated size: {{ estimatedSize }}</div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="flex items-center justify-between p-6 border-t border-sim-border bg-sim-card">
        <button 
          @click="$emit('close')"
          class="px-4 py-2 text-sim-text border border-sim-border rounded-lg hover:bg-sim-background"
        >
          Cancel
        </button>
        
        <button 
          @click="handleExport"
          :disabled="isExporting || exportReportCount === 0"
          class="px-4 py-2 bg-sim-accent text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i v-if="isExporting" class="fas fa-spinner fa-spin mr-2"></i>
          <i v-else class="fas fa-download mr-2"></i>
          {{ isExporting ? 'Exporting...' : 'Export' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useReportsStore } from '@/stores/reports'
import type { ExportFormat, ExportOptions } from '@/types/reports'

const props = defineProps<{
  reportIds: string[]
}>()

const emit = defineEmits<{
  close: []
  exported: []
}>()

const reportsStore = useReportsStore()
const isExporting = ref(false)

const exportOptions = ref<ExportOptions>({
  format: 'json',
  includeSummary: true,
  includeDetailed: true,
  includeRecommendations: true,
  includeComparison: props.reportIds.length > 1
})

const selectedReports = ref<string[]>([...props.reportIds])

const formats = [
  {
    value: 'json' as ExportFormat,
    name: 'JSON',
    description: 'Machine readable',
    icon: 'fas fa-code'
  },
  {
    value: 'csv' as ExportFormat,
    name: 'CSV',
    description: 'Spreadsheet format',
    icon: 'fas fa-table'
  },
  {
    value: 'markdown' as ExportFormat,
    name: 'Markdown',
    description: 'Human readable',
    icon: 'fas fa-file-alt'
  },
  {
    value: 'llm' as ExportFormat,
    name: 'LLM',
    description: 'AI optimized',
    icon: 'fas fa-robot'
  }
]

const formatLabels: Record<ExportFormat, string> = {
  json: 'JSON',
  csv: 'CSV',
  markdown: 'Markdown',
  llm: 'LLM Format'
}

const exportReportCount = computed(() => selectedReports.value.length)

const estimatedSize = computed(() => {
  const baseSize = exportReportCount.value * 50 // KB per report
  const multiplier = exportOptions.value.includeDetailed ? 3 : 1
  const size = baseSize * multiplier
  
  if (size > 1024) {
    return `~${(size / 1024).toFixed(1)} MB`
  }
  return `~${size} KB`
})

function getReportName(reportId: string): string {
  const report = reportsStore.library.reports.find(r => r.id === reportId)
  return report?.metadata.name || 'Unknown Report'
}

function getReportPersona(reportId: string): string {
  const report = reportsStore.library.reports.find(r => r.id === reportId)
  return report?.data.summary.personaName || 'Unknown'
}

function getReportDate(reportId: string): string {
  const report = reportsStore.library.reports.find(r => r.id === reportId)
  if (!report) return ''
  
  return new Date(report.metadata.createdAt).toLocaleDateString()
}

async function handleExport() {
  if (exportReportCount.value === 0) return
  
  isExporting.value = true
  
  try {
    const blob = await reportsStore.exportReports(selectedReports.value, exportOptions.value.format, exportOptions.value)
    
    // Create download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const prefix = selectedReports.value.length === 1 ? 'report' : 'reports'
    const extension = exportOptions.value.format === 'json' ? 'json' : 
                     exportOptions.value.format === 'csv' ? 'csv' :
                     exportOptions.value.format === 'markdown' ? 'md' : 'txt'
    
    a.download = `${prefix}_${timestamp}.${extension}`
    a.click()
    
    URL.revokeObjectURL(url)
    
    emit('exported')
    emit('close')
  } catch (error) {
    console.error('Export failed:', error)
    // TODO: Show error toast
  } finally {
    isExporting.value = false
  }
}
</script>

