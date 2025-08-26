<!-- PersonaCard.vue - Individual persona selection cards -->
<template>
  <div 
    class="card cursor-pointer transition-all duration-200 hover:scale-[1.02] p-4"
    :class="[
      isSelected ? 'ring-2 ring-sim-accent bg-sim-accent/5' : 'hover:border-sim-accent/50',
      isSelected ? 'border-sim-accent' : 'border-sim-border'
    ]"
    @click="handleSelect"
  >
    <!-- Header with icon and name -->
    <div class="flex items-center space-x-3 mb-4">
      <div 
        class="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg"
        :style="{ backgroundColor: persona.color }"
      >
        <i :class="`fas ${persona.icon}`"></i>
      </div>
      
      <div class="flex-1">
        <h3 class="font-semibold text-sim-text">
          {{ persona.name }}
        </h3>
        <p class="text-xs text-sim-muted">
          {{ persona.description }}
        </p>
      </div>
      
      <!-- Preset badge -->
      <div v-if="persona.isPreset" class="px-2 py-1 bg-sim-surface border border-sim-border rounded-md">
        <span class="text-xs font-medium text-sim-muted">Preset</span>
      </div>
    </div>
    
    <!-- Key stats -->
    <div class="space-y-3">
      <!-- Efficiency -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-sim-muted">Efficiency:</span>
        <div class="flex items-center space-x-2">
          <div class="w-16 h-1.5 bg-sim-bg rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
              :style="{ width: `${persona.efficiency * 100}%` }"
            ></div>
          </div>
          <span class="text-sm font-medium text-sim-text">
            {{ Math.round(persona.efficiency * 100) }}%
          </span>
        </div>
      </div>
      
      <!-- Daily pattern -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-sim-muted">Daily Play:</span>
        <span class="text-sm font-medium text-sim-text">
          {{ formatPlayPattern(persona) }}
        </span>
      </div>
      
      <!-- Play frequency -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-sim-muted">Daily checks:</span>
        <span class="text-sm font-medium text-sim-text">
          {{ persona.weekdayCheckIns }}wd / {{ persona.weekendCheckIns }}we
        </span>
      </div>
    </div>
    
    <!-- Selection indicator -->
    <div v-if="isSelected" class="mt-4 pt-3 border-t border-sim-accent/20">
      <div class="flex items-center justify-center text-sim-accent text-sm font-medium">
        <i class="fas fa-check-circle mr-2"></i>
        Selected
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SimplePersona } from '@/types'

interface Props {
  persona: SimplePersona
  isSelected: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [personaId: string]
}>()

function handleSelect() {
  emit('select', props.persona.id)
}

function formatPlayPattern(persona: SimplePersona): string {
  if (persona.weekdayCheckIns === persona.weekendCheckIns) {
    return `${persona.weekdayCheckIns}x daily`
  }
  
  return `${persona.weekdayCheckIns}x weekday, ${persona.weekendCheckIns}x weekend`
}
</script>
