<template>
  <div class="summary-tab space-y-6">
    <!-- Header Stats -->
    <div class="grid grid-cols-4 gap-6">
      <div class="bg-sim-card rounded-lg p-4 text-center">
        <div class="text-3xl font-bold" :class="scoreColorClass">
          {{ report.summary.overallScore }}
        </div>
        <div class="text-sm text-sim-text-secondary mt-1">Overall Score</div>
      </div>
      
      <div class="bg-sim-card rounded-lg p-4 text-center">
        <div class="text-3xl font-bold text-sim-text">
          {{ report.summary.totalDays }}
        </div>
        <div class="text-sm text-sim-text-secondary mt-1">Days Completed</div>
      </div>
      
      <div class="bg-sim-card rounded-lg p-4 text-center">
        <div class="text-3xl font-bold text-blue-400">
          {{ Math.round(report.summary.resourceEfficiency * 100) }}%
        </div>
        <div class="text-sm text-sim-text-secondary mt-1">Resource Efficiency</div>
      </div>
      
      <div class="bg-sim-card rounded-lg p-4 text-center">
        <div class="text-3xl font-bold text-green-400">
          {{ Math.round(report.summary.decisionQuality * 100) }}%
        </div>
        <div class="text-sm text-sim-text-secondary mt-1">Decision Quality</div>
      </div>
    </div>
    
    <!-- Status and Completion -->
    <div class="bg-sim-card rounded-lg p-6">
      <h3 class="text-lg font-semibold text-sim-text mb-4">Completion Status</h3>
      <div class="flex items-center gap-4">
        <div class="flex items-center">
          <span 
            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
            :class="statusBadgeClass"
          >
            <i :class="statusIcon" class="w-4 h-4 mr-2"></i>
            {{ statusText }}
          </span>
        </div>
        
        <div class="text-sim-text-secondary">
          Phases completed: {{ report.summary.phasesCompleted.join(', ') }}
        </div>
      </div>
    </div>
    
    <!-- Key Achievements -->
    <div class="bg-sim-card rounded-lg p-6">
      <h3 class="text-lg font-semibold text-sim-text mb-4">Key Achievements</h3>
      <div class="grid grid-cols-2 gap-6">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sim-text-secondary">Upgrades Purchased</span>
            <span class="font-mono text-sim-text">{{ report.summary.upgradesPurchased }}</span>
          </div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sim-text-secondary">Adventures Completed</span>
            <span class="font-mono text-sim-text">{{ report.summary.adventuresCompleted }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sim-text-secondary">Progression Rate</span>
            <span class="font-mono text-sim-text">{{ report.summary.progressionRate.toFixed(2) }} phases/day</span>
          </div>
        </div>
        
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sim-text-secondary">Persona Used</span>
            <span class="text-sim-text">{{ report.summary.personaName }}</span>
          </div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sim-text-secondary">Generated On</span>
            <span class="text-sim-text">{{ formatDate(report.generatedAt) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sim-text-secondary">Report ID</span>
            <span class="font-mono text-xs text-sim-text-secondary">{{ report.id.slice(0, 8) }}...</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Major Issues -->
    <div v-if="report.summary.majorBottlenecks.length > 0" class="bg-sim-card rounded-lg p-6">
      <h3 class="text-lg font-semibold text-sim-text mb-4 flex items-center">
        <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
        Major Issues Detected
      </h3>
      <div class="space-y-2">
        <div 
          v-for="(bottleneck, index) in report.summary.majorBottlenecks"
          :key="index"
          class="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <i class="fas fa-warning text-yellow-600 mr-3"></i>
          <span class="text-yellow-800">{{ bottleneck }}</span>
        </div>
      </div>
    </div>
    
    <!-- Resource Waste -->
    <div v-if="report.summary.wastedResources.length > 0" class="bg-sim-card rounded-lg p-6">
      <h3 class="text-lg font-semibold text-sim-text mb-4 flex items-center">
        <i class="fas fa-trash text-red-500 mr-2"></i>
        Resource Waste
      </h3>
      <div class="space-y-2">
        <div 
          v-for="(waste, index) in report.summary.wastedResources"
          :key="index"
          class="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <div class="flex items-center">
            <i class="fas fa-exclamation-circle text-red-600 mr-3"></i>
            <span class="text-red-800">{{ waste.resource }}</span>
          </div>
          <div class="text-red-800 font-mono">
            {{ waste.amount }} wasted ({{ waste.reason }})
          </div>
        </div>
      </div>
    </div>
    
    <!-- Top Recommendations Preview -->
    <div v-if="report.recommendations.length > 0" class="bg-sim-card rounded-lg p-6">
      <h3 class="text-lg font-semibold text-sim-text mb-4 flex items-center">
        <i class="fas fa-lightbulb text-blue-500 mr-2"></i>
        Top Recommendations
      </h3>
      <div class="space-y-3">
        <div 
          v-for="recommendation in report.recommendations.slice(0, 3)"
          :key="recommendation.id"
          class="border border-sim-border rounded-lg p-4"
        >
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-medium text-sim-text">{{ recommendation.title }}</h4>
            <span 
              class="px-2 py-1 text-xs rounded-full font-medium"
              :class="priorityBadgeClass(recommendation.priority)"
            >
              {{ recommendation.priority.toUpperCase() }}
            </span>
          </div>
          <p class="text-sm text-sim-text-secondary mb-2">{{ recommendation.description }}</p>
          <p class="text-sm text-blue-600">{{ recommendation.expectedImprovement }}</p>
        </div>
      </div>
      
      <div v-if="report.recommendations.length > 3" class="mt-4 text-center">
        <button class="text-sim-accent hover:text-blue-400 text-sm">
          View all {{ report.recommendations.length }} recommendations →
        </button>
      </div>
    </div>
    
    <!-- Performance Summary -->
    <div class="bg-sim-card rounded-lg p-6">
      <h3 class="text-lg font-semibold text-sim-text mb-4">Performance Summary</h3>
      <div class="space-y-4">
        <!-- Resource Efficiency Bar -->
        <div>
          <div class="flex justify-between text-sm mb-1">
            <span class="text-sim-text-secondary">Resource Efficiency</span>
            <span class="text-sim-text">{{ Math.round(report.summary.resourceEfficiency * 100) }}%</span>
          </div>
          <div class="w-full bg-sim-background rounded-full h-3">
            <div 
              class="h-3 rounded-full transition-all duration-300"
              :class="getEfficiencyBarClass(report.summary.resourceEfficiency)"
              :style="{ width: `${report.summary.resourceEfficiency * 100}%` }"
            ></div>
          </div>
        </div>
        
        <!-- Decision Quality Bar -->
        <div>
          <div class="flex justify-between text-sm mb-1">
            <span class="text-sim-text-secondary">Decision Quality</span>
            <span class="text-sim-text">{{ Math.round(report.summary.decisionQuality * 100) }}%</span>
          </div>
          <div class="w-full bg-sim-background rounded-full h-3">
            <div 
              class="h-3 rounded-full transition-all duration-300"
              :class="getEfficiencyBarClass(report.summary.decisionQuality)"
              :style="{ width: `${report.summary.decisionQuality * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AnalysisReport } from '@/types/reports'

const props = defineProps<{
  report: AnalysisReport
}>()

const scoreColorClass = computed(() => {
  const score = props.report.summary.overallScore
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
})

const statusBadgeClass = computed(() => {
  const classes = {
    success: 'bg-green-100 text-green-800',
    timeout: 'bg-yellow-100 text-yellow-800',
    bottleneck: 'bg-red-100 text-red-800'
  }
  return classes[props.report.summary.completionStatus] || 'bg-gray-100 text-gray-800'
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
    success: 'Successfully Completed',
    timeout: 'Timed Out',
    bottleneck: 'Stopped by Bottlenecks'
  }
  return texts[props.report.summary.completionStatus] || 'Unknown Status'
})

function priorityBadgeClass(priority: string): string {
  const classes = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  }
  return classes[priority] || 'bg-gray-100 text-gray-800'
}

function getEfficiencyBarClass(efficiency: number): string {
  if (efficiency >= 0.8) return 'bg-green-500'
  if (efficiency >= 0.6) return 'bg-yellow-500'
  if (efficiency >= 0.4) return 'bg-orange-500'
  return 'bg-red-500'
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.summary-tab {
  max-width: none;
}
</style>
