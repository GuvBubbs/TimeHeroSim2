<template>
  <div class="space-y-3">
    <label class="block text-sm font-semibold text-sim-text">
      {{ label }}
    </label>
    
    <div class="flex items-center space-x-3">
      <button
        @click="handleToggle"
        :class="[
          'relative inline-flex items-center h-8 rounded-full w-14 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sim-primary focus:ring-offset-2 focus:ring-offset-sim-bg border-2',
          value ? 'bg-sim-primary border-sim-primary' : 'bg-sim-border border-sim-border hover:border-sim-muted'
        ]"
      >
        <span
          :class="[
            'inline-block w-6 h-6 transform transition duration-200 ease-in-out bg-white rounded-full shadow-lg border border-gray-300',
            value ? 'translate-x-6' : 'translate-x-1'
          ]"
        />
      </button>
      
      <span class="text-sm font-medium" :class="value ? 'text-sim-primary' : 'text-sim-muted'">
        {{ value ? 'Enabled' : 'Disabled' }}
      </span>
    </div>
    
    <p v-if="description" class="text-sm text-sim-muted leading-relaxed">
      {{ description }}
    </p>
    
    <!-- Override indicator -->
    <div
      v-if="hasOverride"
      class="flex items-center justify-between p-3 bg-sim-primary/20 border border-sim-primary/50 rounded-lg text-sm"
    >
      <span class="text-sim-primary font-medium">
        <i class="fas fa-edit mr-2"></i>
        Override: {{ value ? 'Enabled' : 'Disabled' }}
        <span class="text-sim-muted ml-1">(default: {{ originalValue ? 'Enabled' : 'Disabled' }})</span>
      </span>
      <button
        @click="removeOverride"
        class="ml-3 px-2 py-1 text-sim-primary hover:text-white hover:bg-sim-primary rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sim-primary"
        title="Remove override"
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
  // If no override, get the default value from the parameters
  if (props.path) {
    return parameterStore.getNestedValue(parameterStore.parameters, props.path)
  }
  return props.value
})

function handleToggle() {
  emit('update', !props.value)
}

function removeOverride() {
  if (props.path) {
    // Get the original value from the default parameters before removing override
    const defaultValue = parameterStore.getNestedValue(parameterStore.parameters, props.path)
    parameterStore.removeOverride(props.path)
    // Emit the default value to update the component
    emit('update', defaultValue)
  }
}
</script>
