<template>
  <div class="efficiency-tab space-y-6">
    <div class="bg-sim-card rounded-lg p-6">
      <h3 class="text-lg font-semibold text-sim-text mb-4">Efficiency Analysis</h3>
      <p class="text-sim-text-secondary mb-4">
        Efficiency metrics and optimization opportunities.
      </p>
      
      <div class="grid grid-cols-2 gap-4">
        <div class="p-4 bg-sim-background rounded-lg">
          <div class="text-sm text-sim-text-secondary mb-1">Resource Efficiency</div>
          <div class="text-2xl font-bold text-blue-400">
            {{ Math.round(report.summary.resourceEfficiency * 100) }}%
          </div>
        </div>
        
        <div class="p-4 bg-sim-background rounded-lg">
          <div class="text-sm text-sim-text-secondary mb-1">Decision Quality</div>
          <div class="text-2xl font-bold text-green-400">
            {{ Math.round(report.summary.decisionQuality * 100) }}%
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AnalysisReport } from '@/types/reports'

defineProps<{
  report: AnalysisReport
}>()
</script>

