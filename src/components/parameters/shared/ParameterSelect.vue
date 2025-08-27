<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-sim-text">
      {{ label }}
    </label>
    
    <select
      :value="value"
      @change="handleChange"
      class="w-full px-3 py-2 bg-sim-surface border border-sim-border rounded-lg focus:ring-2 focus:ring-sim-primary focus:border-transparent"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    
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
        Override: {{ getCurrentLabel(value) }}
        (default: {{ getCurrentLabel(originalValue) }})
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
    parameterStore.removeOverride(props.path)
    emit('update', originalValue.value)
  }
}
</script>
