<template>
  <div class="min-h-screen bg-sim-bg text-sim-text">
    <AppHeader />
    <AppNavigation />
    <main class="container mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AppNavigation from './AppNavigation.vue'
</script>
