<template>
  <div 
    class="report-card bg-sim-surface border border-sim-border rounded-lg p-6 hover:border-sim-accent transition-colors cursor-pointer relative"
    :class="{ 'ring-2 ring-sim-accent': selected }"
    @click="$emit('click')"
  >
    <!-- Selection checkbox -->
    <div class="absolute top-4 right-4">
      <input 
        type="checkbox" 
        :checked="selected"
        @click.stop="$emit('select')"
        class="w-4 h-4 text-sim-accent bg-sim-bg border border-sim-border rounded focus:ring-sim-accent"
      />
    </div>
    
    <!-- Header -->
    <div class="mb-4">
      <h3 class="text-lg font-semibold text-sim-text mb-1 pr-8">
        {{ report.summary.simulationName }}
      </h3>
      <div class="flex items-center gap-2 text-sm text-sim-text-secondary">
        <i :class="personaIcon" class="w-4 h-4"></i>
        <span>{{ report.summary.personaName }}</span>
        <span>•</span>
        <time :title="report.generatedAt.toLocaleString()">
          {{ formatDate(report.generatedAt) }}
        </time>
      </div>
    </div>
    
    <!-- Status Badge -->
    <div class="mb-4">
      <span 
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        :class="statusBadgeClass"
      >
        <i :class="statusIcon" class="w-3 h-3 mr-1"></i>
        {{ statusText }}
      </span>
    </div>
    
    <!-- Key Metrics -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div class="text-center">
        <div class="text-2xl font-bold" :class="scoreColorClass">
          {{ report.summary.overallScore }}
        </div>
        <div class="text-xs text-sim-text-secondary">Overall Score</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-sim-text">
          {{ report.summary.totalDays }}
        </div>
        <div class="text-xs text-sim-text-secondary">Days</div>
      </div>
    </div>
    
    <!-- Progress Bars -->
    <div class="space-y-3 mb-4">
      <!-- Resource Efficiency -->
      <div class="space-y-1">
        <div class="flex justify-between text-xs">
          <span class="text-sim-text-secondary">Resource Efficiency</span>
          <span class="text-sim-text font-mono">
            {{ Math.round(report.summary.resourceEfficiency * 100) }}%
          </span>
        </div>
        <div class="w-full bg-sim-background rounded-full h-2">
          <div 
            class="h-2 rounded-full transition-all duration-300"
            :class="getEfficiencyBarClass(report.summary.resourceEfficiency)"
            :style="{ width: `${report.summary.resourceEfficiency * 100}%` }"
          ></div>
        </div>
      </div>
      
      <!-- Decision Quality -->
      <div class="space-y-1">
        <div class="flex justify-between text-xs">
          <span class="text-sim-text-secondary">Decision Quality</span>
          <span class="text-sim-text font-mono">
            {{ Math.round(report.summary.decisionQuality * 100) }}%
          </span>
        </div>
        <div class="w-full bg-sim-background rounded-full h-2">
          <div 
            class="h-2 rounded-full transition-all duration-300"
            :class="getEfficiencyBarClass(report.summary.decisionQuality)"
            :style="{ width: `${report.summary.decisionQuality * 100}%` }"
          ></div>
        </div>
      </div>
    </div>
    
    <!-- Bottom Info -->
    <div class="flex justify-between items-center text-xs text-sim-text-secondary">
      <div class="flex items-center gap-3">
        <span title="Upgrades purchased">
          <i class="fas fa-arrow-up mr-1"></i>
          {{ report.summary.upgradesPurchased }}
        </span>
        <span title="Adventures completed">
          <i class="fas fa-sword mr-1"></i>
          {{ report.summary.adventuresCompleted }}
        </span>
      </div>
      
      <!-- Bottleneck indicator -->
      <div v-if="report.summary.majorBottlenecks.length > 0" class="flex items-center">
        <i class="fas fa-exclamation-triangle text-yellow-500 mr-1"></i>
        <span class="text-yellow-500">
          {{ report.summary.majorBottlenecks.length }} issue{{ report.summary.majorBottlenecks.length === 1 ? '' : 's' }}
        </span>
      </div>
      
      <!-- Recommendation indicator -->
      <div v-else-if="report.recommendations.length > 0" class="flex items-center">
        <i class="fas fa-lightbulb text-blue-400 mr-1"></i>
        <span class="text-blue-400">
          {{ report.recommendations.length }} tip{{ report.recommendations.length === 1 ? '' : 's' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AnalysisReport } from '@/types/reports'

// Props and emits
const props = defineProps<{
  report: AnalysisReport
  selected: boolean
}>()

const emit = defineEmits<{
  click: []
  select: []
}>()

// Computed properties
const personaIcon = computed(() => {
  const icons: Record<string, string> = {
    speedrunner: 'fas fa-bolt text-yellow-400',
    casual: 'fas fa-smile text-green-400',
    'weekend-warrior': 'fas fa-calendar-week text-blue-400',
    custom: 'fas fa-user text-purple-400'
  }
  return icons[props.report.summary.personaId] || 'fas fa-user text-gray-400'
})

const statusBadgeClass = computed(() => {
  const classes = {
    success: 'bg-green-100 text-green-800 border-green-200',
    timeout: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    bottleneck: 'bg-red-100 text-red-800 border-red-200'
  }
  return `border ${classes[props.report.summary.completionStatus] || 'bg-gray-100 text-gray-800 border-gray-200'}`
})

const statusIcon = computed(() => {
  const icons = {
    success: 'fas fa-check',
    timeout: 'fas fa-clock',
    bottleneck: 'fas fa-exclamation-triangle'
  }
  return icons[props.report.summary.completionStatus] || 'fas fa-question'
})

const statusText = computed(() => {
  const texts = {
    success: 'Completed',
    timeout: 'Timed Out',
    bottleneck: 'Bottlenecked'
  }
  return texts[props.report.summary.completionStatus] || 'Unknown'
})

const scoreColorClass = computed(() => {
  const score = props.report.summary.overallScore
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
})

// Methods
function getEfficiencyBarClass(efficiency: number): string {
  if (efficiency >= 0.8) return 'bg-green-500'
  if (efficiency >= 0.6) return 'bg-yellow-500'
  if (efficiency >= 0.4) return 'bg-orange-500'
  return 'bg-red-500'
}

function formatDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}
</script>

<style scoped>
.report-card {
  transition: all 0.2s ease-in-out;
}

.report-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.report-card.ring-2 {
  transform: translateY(-1px);
}
</style>
