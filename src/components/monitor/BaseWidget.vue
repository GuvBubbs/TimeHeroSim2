<!-- Base Widget Component for Live Monitor -->
<template>
  <div class="bg-sim-surface border border-sim-border rounded-lg p-4 h-full flex flex-col">
    <!-- Widget Header -->
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold flex items-center">
        <i v-if="icon" :class="icon" class="mr-2"></i>
        {{ title }}
      </h3>
      <div v-if="$slots.actions" class="flex items-center space-x-2">
        <slot name="actions"></slot>
      </div>
    </div>
    
    <!-- Widget Content -->
    <div class="flex-1 overflow-hidden">
      <slot></slot>
    </div>
    
    <!-- Widget Footer -->
    <div v-if="$slots.footer" class="mt-3 pt-3 border-t border-sim-border">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  icon?: string
}

defineProps<Props>()
</script>
