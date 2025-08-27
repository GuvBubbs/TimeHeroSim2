<template>
  <div 
    class="relative p-2 rounded border-2 transition-all"
    :class="{
      'border-sim-accent bg-sim-accent/20 text-sim-accent': current === screen,
      'border-sim-border bg-sim-background hover:border-sim-border-hover': current !== screen
    }"
  >
    <i :class="icon" class="text-lg block mb-1"></i>
    <div class="text-xs font-semibold">{{ name }}</div>
    
    <!-- Helper indicator -->
    <div 
      v-if="hasHelper && screen === 'farm'" 
      class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
      title="Helper present"
    ></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  screen: string
  current: string
  icon: string
  name: string
  hasHelper?: boolean
}>()
</script>
