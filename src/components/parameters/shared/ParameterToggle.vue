<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-sim-text">
      {{ label }}
    </label>
    
    <div class="relative">
      <button
        @click="handleToggle"
        :class="[
          'relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sim-primary focus:ring-offset-2',
          value ? 'bg-sim-primary' : 'bg-sim-border'
        ]"
      >
        <span
          :class="[
            'inline-block w-4 h-4 transform transition duration-200 ease-in-out bg-white rounded-full',
            value ? 'translate-x-6' : 'translate-x-1'
          ]"
        />
      </button>
      
      <span class="ml-3 text-sm" :class="value ? 'text-sim-primary' : 'text-sim-muted'">
        {{ value ? 'Enabled' : 'Disabled' }}
      </span>
    </div>
    
    <p v-if="description" class="text-xs text-sim-muted leading-relaxed">
      {{ description }}
    </p>
    
    <!-- Override indicator -->
    <div
      v-if="hasOverride"
      class="flex items-center justify-between p-2 bg-sim-primary/10 border border-sim-primary/30 rounded text-xs"
    >
      <span class="text-sim-primary">
        <i class="fas fa-edit mr-1"></i>
        Override: {{ value ? 'Enabled' : 'Disabled' }}
        (default: {{ originalValue ? 'Enabled' : 'Disabled' }})
      </span>
      <button
        @click="removeOverride"
        class="text-sim-primary hover:text-sim-primary-light"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useParameterStore } from '@/stores/parameters'

interface Props {
  label: string
  value: boolean
  description?: string
  path?: string // For override detection
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [value: boolean]
}>()

const parameterStore = useParameterStore()

const hasOverride = computed(() => {
  return props.path ? parameterStore.overrides.has(props.path) : false
})

const originalValue = computed(() => {
  if (props.path && hasOverride.value) {
    const override = parameterStore.overrides.get(props.path)
    return override?.originalValue ?? props.value
  }
  return props.value
})

function handleToggle() {
  emit('update', !props.value)
}

function removeOverride() {
  if (props.path) {
    parameterStore.removeOverride(props.path)
    emit('update', originalValue.value)
  }
}
</script>
