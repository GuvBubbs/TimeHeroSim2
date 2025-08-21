<template>
  <nav class="bg-sim-surface border-b border-sim-border sticky top-0 z-40">
    <div class="container mx-auto px-4">
      <div class="flex space-x-1 overflow-x-auto">
        <RouterLink
          v-for="tab in navigationTabs"
          :key="tab.path"
          :to="tab.path"
          class="nav-tab"
          :class="{ 'active': isActive(tab.path) }"
        >
          <i :class="tab.icon" class="mr-2"></i>
          {{ tab.label }}
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const navigationTabs = [
  { path: '/', label: 'Dashboard', icon: 'fas fa-home' },
  { path: '/configuration', label: 'Game Configuration', icon: 'fas fa-cog' },
  { path: '/upgrade-tree', label: 'Upgrade Tree', icon: 'fas fa-project-diagram' },
  { path: '/personas', label: 'Player Personas', icon: 'fas fa-users' },
  { path: '/simulation-setup', label: 'Simulation Setup', icon: 'fas fa-sliders-h' },
  { path: '/live-monitor', label: 'Live Monitor', icon: 'fas fa-tv' },
  { path: '/reports', label: 'Reports', icon: 'fas fa-chart-bar' }
]

const isActive = (path: string) => {
  return route.path === path
}
</script>

<style scoped>
.nav-tab {
  @apply px-4 py-3 flex items-center text-sm font-medium transition-colors;
  @apply text-sim-muted hover:text-sim-text;
  @apply border-b-2 border-transparent;
}

.nav-tab.active {
  @apply text-sim-accent border-sim-accent;
}
</style>
