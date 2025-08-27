<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-sim-text">
      {{ label }}
      <span v-if="unit" class="text-sim-muted text-xs">
        ({{ formatValue(value) }}{{ unit }})
      </span>
    </label>
    
    <div class="relative">
      <input
        :value="value"
        @input="handleInput"
        :min="min"
        :max="max"
        :step="step"
        type="range"
        class="w-full h-2 bg-sim-surface rounded-lg appearance-none cursor-pointer slider"
      />
      
      <!-- Value indicator -->
      <div
        class="absolute top-0 h-2 bg-sim-primary rounded-lg pointer-events-none"
        :style="{ width: `${((value - min) / (max - min)) * 100}%` }"
      ></div>
      
      <!-- Thumb -->
      <div
        class="absolute top-0 w-4 h-4 bg-sim-primary rounded-full transform -translate-y-1 -translate-x-2 pointer-events-none shadow-lg"
        :style="{ left: `${((value - min) / (max - min)) * 100}%` }"
      ></div>
    </div>
    
    <div class="flex justify-between text-xs text-sim-muted">
      <span>{{ formatValue(min) }}{{ unit || '' }}</span>
      <span>{{ formatValue(max) }}{{ unit || '' }}</span>
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
        Override: {{ formatValue(value) }}{{ unit || '' }}
        (default: {{ formatValue(originalValue) }}{{ unit || '' }})
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
    parameterStore.removeOverride(props.path)
    emit('update', originalValue.value)
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
