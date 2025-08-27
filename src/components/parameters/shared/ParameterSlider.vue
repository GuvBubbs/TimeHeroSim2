<template>
  <div class="space-y-3">
    <label class="block text-sm font-semibold text-sim-text">
      {{ label }}
      <span v-if="unit" class="text-sim-primary text-sm font-medium ml-2">
        ({{ formatValue(value) }}{{ unit }})
      </span>
    </label>
    
    <div class="relative">
      <!-- Track background - always visible -->
      <div class="w-full h-3 bg-sim-border rounded-lg"></div>
      
      <!-- Value indicator -->
      <div
        class="absolute top-0 h-3 bg-gradient-to-r from-sim-primary to-sim-primary-light rounded-lg pointer-events-none"
        :style="{ width: `${((value - min) / (max - min)) * 100}%` }"
      ></div>
      
      <!-- Invisible input slider -->
      <input
        :value="value"
        @input="handleInput"
        :min="min"
        :max="max"
        :step="step"
        type="range"
        class="absolute top-0 w-full h-3 opacity-0 cursor-pointer focus:outline-none"
      />
      
      <!-- Thumb -->
      <div
        class="absolute top-0 w-5 h-5 bg-white border-2 border-sim-primary rounded-full transform -translate-y-1 -translate-x-2.5 pointer-events-none shadow-lg"
        :style="{ left: `${((value - min) / (max - min)) * 100}%` }"
      ></div>
    </div>
    
    <div class="flex justify-between text-xs text-sim-muted font-medium">
      <span>{{ formatValue(min) }}{{ unit || '' }}</span>
      <span>{{ formatValue(max) }}{{ unit || '' }}</span>
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
        Override: {{ formatValue(value) }}{{ unit || '' }}
        <span class="text-sim-muted ml-1">(default: {{ formatValue(originalValue) }}{{ unit || '' }})</span>
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
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  description?: string
  displayMultiplier?: number
  path?: string // For override detection
}

const props = withDefaults(defineProps<Props>(), {
  step: 0.1,
  displayMultiplier: 1
})

const emit = defineEmits<{
  update: [value: number]
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

function formatValue(val: number): string {
  const displayVal = val * props.displayMultiplier
  
  if (props.displayMultiplier === 100) {
    // Percentage display
    return Math.round(displayVal).toString()
  } else if (props.step >= 1) {
    // Integer display
    return Math.round(displayVal).toString()
  } else {
    // Decimal display
    return displayVal.toFixed(1)
  }
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const newValue = parseFloat(target.value)
  emit('update', newValue)
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

<style scoped>
.slider {
  background: linear-gradient(to right, 
    rgb(var(--sim-border)) 0%, 
    rgb(var(--sim-border)) var(--progress, 0%), 
    rgb(var(--sim-surface)) var(--progress, 0%), 
    rgb(var(--sim-surface)) 100%);
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgb(var(--sim-primary));
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgb(var(--sim-primary));
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
</style>
