<template>
  <div class="space-y-3">
    <label class="block text-sm font-semibold text-sim-text">
      {{ label }}
    </label>
    
    <select
      :value="value"
      @change="handleChange"
      class="w-full px-4 py-3 bg-sim-surface border border-sim-border rounded-lg focus:ring-2 focus:ring-sim-primary focus:border-sim-primary text-sim-text font-medium appearance-none cursor-pointer hover:border-sim-primary-light transition-colors"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        class="bg-sim-surface text-sim-text"
      >
        {{ option.label }}
      </option>
    </select>
    
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
        Override: {{ getCurrentLabel(value) }}
        <span class="text-sim-muted ml-1">(default: {{ getCurrentLabel(originalValue) }})</span>
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

interface SelectOption {
  value: string | number
  label: string
}

interface Props {
  label: string
  value: string | number
  options: SelectOption[]
  description?: string
  path?: string // For override detection
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [value: string | number]
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

function getCurrentLabel(val: string | number): string {
  const option = props.options.find(opt => opt.value === val)
  return option?.label || val.toString()
}

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const newValue = target.value
  
  // Try to convert to number if the original value was a number
  const convertedValue = typeof props.value === 'number' ? parseFloat(newValue) : newValue
  
  emit('update', convertedValue)
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
