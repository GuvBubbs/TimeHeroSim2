<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div 
      class="bg-sim-surface rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-sim-border">
        <div>
          <h2 class="text-2xl font-bold text-sim-text">
            {{ report?.summary.simulationName || 'Report Details' }}
          </h2>
          <div v-if="report" class="flex items-center gap-2 text-sim-text-secondary mt-1">
            <i :class="personaIcon" class="w-4 h-4"></i>
            <span>{{ report.summary.personaName }}</span>
            <span>•</span>
            <span>{{ formatDate(report.generatedAt) }}</span>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <button 
            @click="exportReport"
            class="px-3 py-1 text-sm bg-sim-accent text-white rounded hover:bg-blue-600"
          >
            <i class="fas fa-download mr-1"></i>
            Export
          </button>
          <button 
            @click="$emit('close')"
            class="p-2 text-sim-text-secondary hover:text-sim-text rounded-lg hover:bg-sim-background"
          >
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
      </div>
      
      <!-- Loading state -->
      <div v-if="!report" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <i class="fas fa-spinner fa-spin text-3xl text-sim-accent mb-4"></i>
          <p class="text-sim-text-secondary">Loading report...</p>
        </div>
      </div>
      
      <!-- Content -->
      <div v-else class="flex-1 overflow-hidden flex">
        <!-- Navigation tabs -->
        <div class="w-48 bg-sim-card border-r border-sim-border">
          <div class="p-4">
            <nav class="space-y-1">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                class="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors"
                :class="activeTab === tab.id 
                  ? 'bg-sim-accent text-white' 
                  : 'text-sim-text-secondary hover:text-sim-text hover:bg-sim-background'"
              >
                <i :class="tab.icon" class="w-4 h-4 mr-2"></i>
                {{ tab.name }}
              </button>
            </nav>
          </div>
        </div>
        
        <!-- Tab content -->
        <div class="flex-1 overflow-y-auto">
          <div class="p-6">
            <!-- Summary Tab -->
            <div v-if="activeTab === 'summary'">
              <SummaryTab :report="report" />
            </div>
            
            <!-- Progression Tab -->
            <div v-else-if="activeTab === 'progression'">
              <ProgressionTab :report="report" />
            </div>
            
            <!-- Resources Tab -->
            <div v-else-if="activeTab === 'resources'">
              <ResourcesTab :report="report" />
            </div>
            
            <!-- Efficiency Tab -->
            <div v-else-if="activeTab === 'efficiency'">
              <EfficiencyTab :report="report" />
            </div>
            
            <!-- Bottlenecks Tab -->
            <div v-else-if="activeTab === 'bottlenecks'">
              <BottlenecksTab :report="report" />
            </div>
            
            <!-- Decisions Tab -->
            <div v-else-if="activeTab === 'decisions'">
              <DecisionsTab :report="report" />
            </div>
            
            <!-- Recommendations Tab -->
            <div v-else-if="activeTab === 'recommendations'">
              <RecommendationsTab :report="report" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useReportsStore } from '@/stores/reports'
import type { AnalysisReport } from '@/types/reports'

// Tab components (simplified inline for now)
import SummaryTab from '@/components/reports/tabs/SummaryTab.vue'
import ProgressionTab from '@/components/reports/tabs/ProgressionTab.vue'
import ResourcesTab from '@/components/reports/tabs/ResourcesTab.vue'
import EfficiencyTab from '@/components/reports/tabs/EfficiencyTab.vue'
import BottlenecksTab from '@/components/reports/tabs/BottlenecksTab.vue'
import DecisionsTab from '@/components/reports/tabs/DecisionsTab.vue'
import RecommendationsTab from '@/components/reports/tabs/RecommendationsTab.vue'

// Props and emits
const props = defineProps<{
  reportId: string
}>()

const emit = defineEmits<{
  close: []
}>()

// Store
const reportsStore = useReportsStore()

// Local state
const report = ref<AnalysisReport | null>(null)
const activeTab = ref('summary')

// Tab configuration
const tabs = [
  { id: 'summary', name: 'Summary', icon: 'fas fa-chart-pie' },
  { id: 'progression', name: 'Progression', icon: 'fas fa-chart-line' },
  { id: 'resources', name: 'Resources', icon: 'fas fa-coins' },
  { id: 'efficiency', name: 'Efficiency', icon: 'fas fa-tachometer-alt' },
  { id: 'bottlenecks', name: 'Bottlenecks', icon: 'fas fa-exclamation-triangle' },
  { id: 'decisions', name: 'Decisions', icon: 'fas fa-brain' },
  { id: 'recommendations', name: 'Recommendations', icon: 'fas fa-lightbulb' }
]

// Computed properties
const personaIcon = computed(() => {
  if (!report.value) return ''
  
  const icons: Record<string, string> = {
    speedrunner: 'fas fa-bolt text-yellow-400',
    casual: 'fas fa-smile text-green-400',
    'weekend-warrior': 'fas fa-calendar-week text-blue-400',
    custom: 'fas fa-user text-purple-400'
  }
  return icons[report.value.summary.personaId] || 'fas fa-user text-gray-400'
})

// Methods
onMounted(async () => {
  report.value = reportsStore.getReport(props.reportId)
})

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function exportReport() {
  if (!report.value) return
  
  try {
    const blob = await reportsStore.exportReports([report.value.id], 'markdown')
    
    // Trigger download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.value.summary.simulationName.replace(/\s+/g, '_')}_report.md`
    a.click()
    
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export report:', error)
  }
}

// Handle Escape key
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Modal animation */
.modal-enter-active, .modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>

