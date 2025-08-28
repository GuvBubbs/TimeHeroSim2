<template>
  <div class="recommendations-tab space-y-6">
    <div v-if="report.recommendations.length > 0" class="space-y-4">
      <div 
        v-for="recommendation in report.recommendations"
        :key="recommendation.id"
        class="bg-sim-card rounded-lg p-6"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-sim-text">{{ recommendation.title }}</h3>
          <span 
            class="px-3 py-1 text-sm rounded-full font-medium"
            :class="priorityBadgeClass(recommendation.priority)"
          >
            {{ recommendation.priority.toUpperCase() }}
          </span>
        </div>
        
        <p class="text-sim-text-secondary mb-4">{{ recommendation.description }}</p>
        
        <div class="space-y-2 text-sm">
          <div><strong>Issue:</strong> {{ recommendation.issue }}</div>
          <div><strong>Impact:</strong> {{ recommendation.impact }}</div>
          <div><strong>Solution:</strong> {{ recommendation.solution }}</div>
          <div class="text-blue-600"><strong>Expected Improvement:</strong> {{ recommendation.expectedImprovement }}</div>
        </div>
        
        <div class="mt-4 text-xs text-sim-text-secondary">
          Implementation effort: {{ recommendation.effort }}
        </div>
      </div>
    </div>
    
    <div v-else class="bg-sim-card rounded-lg p-6">
      <h3 class="text-lg font-semibold text-sim-text mb-4">No Recommendations</h3>
      <p class="text-sim-text-secondary">
        This simulation performed well with no specific recommendations for improvement.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AnalysisReport } from '@/types/reports'

defineProps<{
  report: AnalysisReport
}>()

function priorityBadgeClass(priority: string): string {
  const classes = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  }
  return classes[priority] || 'bg-gray-100 text-gray-800'
}
</script>
