<template>
  <div class="progression-tab space-y-6">
    <div class="bg-sim-card rounded-lg p-6">
      <h3 class="text-lg font-semibold text-sim-text mb-4">Phase Progression</h3>
      <p class="text-sim-text-secondary">
        Detailed phase progression analysis will be implemented here.
      </p>
      <!-- Placeholder for phase timeline visualization -->
      <div class="mt-4 p-4 bg-sim-background rounded-lg">
        <div class="text-sm text-sim-text-secondary">
          Phases completed: {{ report.summary.phasesCompleted.join(' → ') }}
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

