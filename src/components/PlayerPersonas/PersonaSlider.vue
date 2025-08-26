<!-- PersonaSlider.vue - Reusable slider component for persona parameters -->
<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-sim-text">
        {{ label }}
      </label>
      <span class="text-sm text-sim-muted">
        {{ displayValue }}
      </span>
    </div>
    
    <div class="relative">
      <!-- Slider track -->
      <div class="h-2 bg-sim-bg rounded-full relative">
        <!-- Fill -->
        <div 
          class="h-full rounded-full transition-all duration-200"
          :class="fillClass"
          :style="{ width: `${percentage}%` }"
        ></div>
        
        <!-- Thumb -->
        <div
          class="absolute top-1/2 w-4 h-4 bg-white border-2 border-sim-accent rounded-full cursor-pointer transform -translate-y-1/2 hover:scale-110 transition-transform"
          :style="{ left: `calc(${percentage}% - 8px)` }"
        ></div>
      </div>
      
      <!-- Input range (invisible but functional) -->
      <input
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        @input="handleInput"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        :disabled="disabled"
      />
    </div>
    
    <!-- Description -->
    <p v-if="description" class="text-xs text-sim-muted">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: number
  label: string
  min?: number
  max?: number
  step?: number
  unit?: string
  description?: string
  disabled?: boolean
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple'
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 1,
  step: 0.01,
  unit: '%',
  color: 'blue'
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const percentage = computed(() => {
  return ((props.modelValue - props.min) / (props.max - props.min)) * 100
})

const displayValue = computed(() => {
  if (props.unit === '%') {
    return `${Math.round(props.modelValue * 100)}%`
  }
  if (props.unit === 'times') {
    return `${props.modelValue} ${props.modelValue === 1 ? 'time' : 'times'}`
  }
  if (props.unit === 'min') {
    return `${props.modelValue} min`
  }
  if (props.unit === 'days') {
    return `${props.modelValue} days`
  }
  return `${props.modelValue}${props.unit}`
})

const fillClass = computed(() => {
  switch (props.color) {
    case 'green': return 'bg-emerald-500'
    case 'amber': return 'bg-amber-500'
    case 'red': return 'bg-red-500'
    case 'purple': return 'bg-purple-500'
    default: return 'bg-blue-500'
  }
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  emit('update:modelValue', value)
}
</script>
