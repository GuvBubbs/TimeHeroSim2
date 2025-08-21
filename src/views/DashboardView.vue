<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-bold">Dashboard</h2>
      <div class="text-sm text-sim-muted">
        System Overview
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- System Status Card -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-server mr-2"></i>
          System Status
        </div>
        <div class="card-body">
          <div class="text-center py-8 text-sim-muted">
            <i class="fas fa-check-circle text-4xl text-sim-success mb-2"></i>
            <p>Ready for Phase 1</p>
            <p class="text-xs mt-2">Data loading system pending</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions Card -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-bolt mr-2"></i>
          Quick Actions
        </div>
        <div class="card-body">
          <div class="text-center py-8 text-sim-muted">
            <p>Coming in Phase 4</p>
          </div>
        </div>
      </div>

      <!-- Data Health Card -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-heartbeat mr-2"></i>
          Data Health
        </div>
        <div class="card-body">
          <div class="text-center py-8 text-sim-muted">
            <p>No data loaded</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Simulations Table -->
    <div class="card">
      <div class="card-header">
        <i class="fas fa-history mr-2"></i>
        Recent Simulations
      </div>
      <div class="card-body">
        <div class="text-center py-12 text-sim-muted">
          <i class="fas fa-inbox text-4xl mb-4"></i>
          <p>No simulations yet</p>
          <p class="text-xs mt-2">Simulation engine coming in Phase 5</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Dashboard stub - functionality coming in later phases
</script>
