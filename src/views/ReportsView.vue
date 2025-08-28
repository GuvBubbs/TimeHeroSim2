<template>
  <div class="reports-view min-h-screen bg-sim-background text-sim-text">
    <!-- Header -->
    <div class="bg-sim-surface border-b border-sim-border p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-sim-accent mb-2">Simulation Reports</h1>
          <p class="text-sim-text-secondary">
            Analysis and insights from completed simulations
          </p>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- Quick stats -->
          <div class="text-sm text-sim-text-secondary mr-4">
            {{ reportStats.total }} reports • {{ Math.round(reportStats.avgScore) }} avg score
          </div>
          
          <button 
            @click="showComparison = true"
            :disabled="!canCompare"
            class="px-4 py-2 bg-sim-accent text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i class="fas fa-balance-scale mr-2"></i>
            Compare ({{ selectedReports.size }})
          </button>
          
          <button 
            @click="showExportModal = true"
            :disabled="selectedReports.size === 0"
            class="px-4 py-2 bg-sim-surface border border-sim-border text-sim-text rounded-lg hover:bg-slate-700 disabled:opacity-50"
          >
            <i class="fas fa-download mr-2"></i>
            Export
          </button>
        </div>
      </div>
    </div>

    <!-- Filters and Controls -->
    <div class="bg-sim-card border-b border-sim-border p-4">
      <div class="flex items-center gap-4 mb-4">
        <!-- Search -->
        <div class="flex-1 max-w-md">
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-sim-muted"></i>
            <input 
              v-model="searchQuery"
              type="text"
              placeholder="Search reports..."
              class="w-full pl-10 pr-4 py-2 bg-sim-bg border border-sim-border rounded-lg text-sim-text focus:ring-2 focus:ring-sim-accent"
            />
          </div>
        </div>
        
        <!-- Persona filter -->
        <select 
          v-model="selectedPersona" 
          class="px-4 py-2 bg-sim-bg border border-sim-border rounded-lg text-sim-text"
        >
          <option value="">All Personas</option>
          <option v-for="persona in availablePersonas" :key="persona" :value="persona">
            {{ formatPersonaName(persona) }}
          </option>
        </select>
        
        <!-- Status filter -->
        <select 
          v-model="selectedStatus"
          class="px-4 py-2 bg-sim-bg border border-sim-border rounded-lg text-sim-text"
        >
          <option value="">All Status</option>
          <option value="success">✅ Completed</option>
          <option value="timeout">⏱️ Timed Out</option>
          <option value="bottleneck">⚠️ Bottlenecked</option>
        </select>
        
        <!-- Sort controls -->
        <select 
          v-model="sortField"
          class="px-4 py-2 bg-sim-bg border border-sim-border rounded-lg text-sim-text"
        >
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
          <option value="persona">Sort by Persona</option>
          <option value="score">Sort by Score</option>
          <option value="completion">Sort by Days</option>
        </select>
        
        <button 
          @click="toggleSortDirection"
          class="px-3 py-2 bg-sim-surface border border-sim-border rounded-lg text-sim-text hover:bg-slate-700"
        >
          <i :class="sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
        </button>
      </div>
      
      <!-- Filter summary -->
      <div class="flex items-center justify-between text-sm">
        <div class="text-sim-text-secondary">
          Showing {{ filteredReports.length }} of {{ allReports.length }} reports
          <span v-if="selectedReports.size > 0">
            • {{ selectedReports.size }} selected
          </span>
        </div>
        
        <div class="flex items-center gap-2">
          <button 
            v-if="hasActiveFilters"
            @click="clearFilters"
            class="text-sim-accent hover:text-blue-400"
          >
            Clear filters
          </button>
          
          <button 
            v-if="filteredReports.length > 0"
            @click="selectAllVisible"
            class="text-sim-accent hover:text-blue-400"
          >
            Select all visible
          </button>
          
          <button 
            v-if="selectedReports.size > 0"
            @click="clearSelection"
            class="text-sim-accent hover:text-blue-400"
          >
            Clear selection
          </button>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <i class="fas fa-spinner fa-spin text-3xl text-sim-accent mb-4"></i>
        <p class="text-sim-text-secondary">Loading reports...</p>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="allReports.length === 0" class="flex items-center justify-center py-16">
      <div class="text-center">
        <i class="fas fa-chart-line text-6xl text-sim-muted mb-6"></i>
        <h3 class="text-xl font-semibold text-sim-text mb-2">No reports found</h3>
        <p class="text-sim-text-secondary mb-6 max-w-md">
          Complete a simulation to generate your first report with detailed analysis and insights.
        </p>
        <router-link 
          to="/simulation-setup"
          class="inline-flex items-center px-6 py-3 bg-sim-accent text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <i class="fas fa-play mr-2"></i>
          Start New Simulation
        </router-link>
      </div>
    </div>

    <!-- No filtered results -->
    <div v-else-if="filteredReports.length === 0" class="flex items-center justify-center py-16">
      <div class="text-center">
        <i class="fas fa-filter text-4xl text-sim-muted mb-4"></i>
        <h3 class="text-lg font-semibold text-sim-text mb-2">No matching reports</h3>
        <p class="text-sim-text-secondary mb-4">
          Try adjusting your filters to see more results.
        </p>
        <button 
          @click="clearFilters"
          class="px-4 py-2 bg-sim-accent text-white rounded-lg hover:bg-blue-600"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Reports Grid -->
    <div v-else class="p-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <ReportCard
          v-for="report in filteredReports"
          :key="report.id"
          :report="report"
          :selected="selectedReports.has(report.id)"
          @click="viewReport(report.id)"
          @select="toggleSelection(report.id)"
        />
      </div>
    </div>

    <!-- Report Detail Modal -->
    <ReportDetailModal 
      v-if="selectedReportId"
      :report-id="selectedReportId"
      @close="selectedReportId = null"
    />
    
    <!-- Comparison Modal -->
    <ComparisonModal
      v-if="showComparison"
      :report-ids="Array.from(selectedReports)"
      @close="showComparison = false"
    />
    
    <!-- Export Modal -->
    <ExportModal
      v-if="showExportModal"
      :report-ids="Array.from(selectedReports)"
      @close="showExportModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useReportsStore } from '@/stores/reports'
import type { SortField, SortDirection } from '@/types/reports'
import ReportCard from '@/components/reports/ReportCard.vue'
import ReportDetailModal from '@/components/reports/ReportDetailModal.vue'
import ComparisonModal from '@/components/reports/ComparisonModal.vue'
import ExportModal from '@/components/reports/ExportModal.vue'

// Store
const reportsStore = useReportsStore()

// Local state
const searchQuery = ref('')
const selectedPersona = ref('')
const selectedStatus = ref('')
const sortField = ref<SortField>('date')
const sortDirection = ref<SortDirection>('desc')

const selectedReportId = ref<string | null>(null)
const showComparison = ref(false)
const showExportModal = ref(false)

// Computed properties
const { 
  allReports, 
  filteredReports, 
  selectedReports, 
  availablePersonas, 
  reportStats,
  canCompare,
  isLoading
} = reportsStore

const hasActiveFilters = computed(() => {
  return searchQuery.value.trim() !== '' ||
         selectedPersona.value !== '' ||
         selectedStatus.value !== ''
})

// Watch for filter changes and update store
watch([searchQuery, selectedPersona, selectedStatus], () => {
  updateStoreFilters()
})

watch([sortField, sortDirection], () => {
  reportsStore.updateSorting(sortField.value, sortDirection.value)
})

// Methods
onMounted(async () => {
  await reportsStore.loadReports()
})

function updateStoreFilters() {
  const statusSet = new Set()
  if (selectedStatus.value) {
    statusSet.add(selectedStatus.value)
  }
  
  const personaSet = new Set()
  if (selectedPersona.value) {
    personaSet.add(selectedPersona.value)
  }
  
  reportsStore.updateFilters({
    status: statusSet,
    personas: personaSet
  })
}

function clearFilters() {
  searchQuery.value = ''
  selectedPersona.value = ''
  selectedStatus.value = ''
  reportsStore.clearFilters()
}

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
}

function viewReport(reportId: string) {
  selectedReportId.value = reportId
}

function toggleSelection(reportId: string) {
  reportsStore.toggleReportSelection(reportId)
}

function selectAllVisible() {
  const visibleIds = filteredReports.value.map(r => r.id)
  reportsStore.selectReports(visibleIds)
}

function clearSelection() {
  reportsStore.clearSelection()
}

function formatPersonaName(personaId: string): string {
  return personaId.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}
</script>

<style scoped>
.reports-view {
  /* Ensure consistent styling with other views */
}
</style>