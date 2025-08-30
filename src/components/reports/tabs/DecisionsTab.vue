<template>
  <div class="decisions-tab space-y-6">
    <div class="bg-sim-card rounded-lg p-6">
      <h3 class="text-lg font-semibold text-sim-text mb-4">Decision Analysis</h3>
      <p class="text-sim-text-secondary">
        Action patterns and decision quality analysis will be implemented here.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AnalysisReport } from '@/types/reports'

defineProps<{
  report: AnalysisReport
}>()
</script>

