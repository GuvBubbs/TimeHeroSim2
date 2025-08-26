<!-- PersonaDetails.vue - Selected persona details panel -->
<template>
  <div class="card">
    <div class="card-header">
      <div class="flex items-center space-x-3">
        <div 
          class="w-8 h-8 rounded-full flex items-center justify-center text-white"
          :style="{ backgroundColor: persona.color }"
        >
          <i :class="`fas ${persona.icon}`"></i>
        </div>
        <div>
          <h3 class="font-semibold">{{ persona.name }}</h3>
          <p class="text-sm text-sim-muted">Selected Persona</p>
        </div>
      </div>
    </div>
    
    <div class="card-body space-y-6">
      <!-- Description -->
      <div>
        <h4 class="text-sm font-medium text-sim-text mb-2">Description</h4>
        <p class="text-sm text-sim-muted">{{ persona.description }}</p>
      </div>
      
      <!-- Behavior Parameters -->
      <div>
        <h4 class="text-sm font-medium text-sim-text mb-3">Behavior Parameters</h4>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-sim-muted">Efficiency</span>
            <div class="flex items-center space-x-2">
              <div class="w-20 h-2 bg-sim-bg rounded-full overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                  :style="{ width: `${persona.efficiency * 100}%` }"
                ></div>
              </div>
              <span class="text-sm font-medium text-sim-text w-12 text-right">
                {{ Math.round(persona.efficiency * 100) }}%
              </span>
            </div>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-sm text-sim-muted">Risk Tolerance</span>
            <div class="flex items-center space-x-2">
              <div class="w-20 h-2 bg-sim-bg rounded-full overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"
                  :style="{ width: `${persona.riskTolerance * 100}%` }"
                ></div>
              </div>
              <span class="text-sm font-medium text-sim-text w-12 text-right">
                {{ Math.round(persona.riskTolerance * 100) }}%
              </span>
            </div>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-sm text-sim-muted">Optimization</span>
            <div class="flex items-center space-x-2">
              <div class="w-20 h-2 bg-sim-bg rounded-full overflow-hidden">
                <div 
                  class="h-full bg-blue-500 rounded-full"
                  :style="{ width: `${persona.optimization * 100}%` }"
                ></div>
              </div>
              <span class="text-sm font-medium text-sim-text w-12 text-right">
                {{ Math.round(persona.optimization * 100) }}%
              </span>
            </div>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-sm text-sim-muted">Learning Rate</span>
            <div class="flex items-center space-x-2">
              <div class="w-20 h-2 bg-sim-bg rounded-full overflow-hidden">
                <div 
                  class="h-full bg-purple-500 rounded-full"
                  :style="{ width: `${persona.learningRate * 100}%` }"
                ></div>
              </div>
              <span class="text-sm font-medium text-sim-text w-12 text-right">
                {{ Math.round(persona.learningRate * 100) }}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Play Schedule -->
      <div>
        <h4 class="text-sm font-medium text-sim-text mb-3">Play Schedule</h4>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div class="bg-sim-surface border border-sim-border rounded-lg p-3">
            <div class="text-lg font-semibold text-sim-text">{{ persona.weekdayCheckIns }}</div>
            <div class="text-xs text-sim-muted">Weekday Check-ins</div>
          </div>
          <div class="bg-sim-surface border border-sim-border rounded-lg p-3">
            <div class="text-lg font-semibold text-sim-text">{{ persona.weekendCheckIns }}</div>
            <div class="text-xs text-sim-muted">Weekend Check-ins</div>
          </div>
          <div class="bg-sim-surface border border-sim-border rounded-lg p-3">
            <div class="text-lg font-semibold text-sim-text">{{ persona.avgSessionLength }}</div>
            <div class="text-xs text-sim-muted">Minutes per Session</div>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="pt-4 border-t border-sim-border">
        <div class="flex space-x-3">
          <button
            @click="$emit('edit')"
            class="flex-1 btn btn-secondary"
          >
            <i class="fas fa-edit mr-2"></i>
            {{ persona.isPreset ? 'Create Copy' : 'Edit' }}
          </button>
          
          <button
            @click="$emit('useInSimulation')"
            class="flex-1 btn btn-primary"
          >
            <i class="fas fa-play mr-2"></i>
            Use in Simulation
          </button>
        </div>
        
        <!-- Delete button for custom personas -->
        <button
          v-if="!persona.isPreset"
          @click="$emit('delete')"
          class="w-full mt-2 btn btn-danger"
        >
          <i class="fas fa-trash mr-2"></i>
          Delete Persona
        </button>
      </div>
      
      <!-- Metadata for custom personas -->
      <div v-if="!persona.isPreset && (persona.createdAt || persona.lastModified)" class="pt-4 border-t border-sim-border">
        <h4 class="text-sm font-medium text-sim-text mb-2">Metadata</h4>
        <div class="text-xs text-sim-muted space-y-1">
          <div v-if="persona.createdAt">
            Created: {{ formatDate(persona.createdAt) }}
          </div>
          <div v-if="persona.lastModified">
            Modified: {{ formatDate(persona.lastModified) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SimplePersona } from '@/types'

interface Props {
  persona: SimplePersona
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: []
  delete: []
  useInSimulation: []
}>()

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
