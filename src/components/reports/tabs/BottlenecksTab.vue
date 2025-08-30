<template>
  <div class="bottlenecks-tab space-y-6">
    <div class="bg-sim-card rounded-lg p-6">
      <h3 class="text-lg font-semibold text-sim-text mb-4">Bottleneck Analysis</h3>
      <div v-if="report.summary.majorBottlenecks.length > 0" class="space-y-3">
        <div 
          v-for="(bottleneck, index) in report.summary.majorBottlenecks"
          :key="index"
          class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div class="flex items-center">
            <i class="fas fa-exclamation-triangle text-yellow-600 mr-3"></i>
            <span class="text-yellow-800">{{ bottleneck }}</span>
          </div>
        </div>
      </div>
      <div v-else class="text-sim-text-secondary">
        No major bottlenecks detected in this simulation.
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

