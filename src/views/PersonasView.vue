<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold">Player Personas</h2>
        <div class="text-sm text-sim-muted">
          Player Behavior Profiles & Simulation Parameters
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <!-- Stats badge -->
        <div class="bg-sim-surface border border-sim-border rounded-lg px-3 py-2">
          <div class="text-xs text-sim-muted">Personas</div>
          <div class="text-sm font-medium text-sim-text">
            {{ personaStore.personaCount.presets }} presets, {{ personaStore.personaCount.custom }} custom
          </div>
        </div>
        
        <!-- Create button -->
        <button
          @click="handleCreatePersona"
          class="btn btn-primary"
        >
          <i class="fas fa-plus mr-2"></i>
          Create Custom
        </button>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="personaStore.isLoading" class="card">
      <div class="card-body text-center py-12">
        <i class="fas fa-spinner fa-spin text-4xl text-sim-muted mb-4"></i>
        <p class="text-sim-muted">Loading personas...</p>
      </div>
    </div>
    
    <!-- Main content -->
    <div v-else class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Persona Selection (Left 2/3) -->
      <div class="xl:col-span-2 space-y-6">
        <!-- Preset Personas -->
        <div class="card">
          <div class="card-header">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <i class="fas fa-star text-amber-500"></i>
                <span>Preset Personas</span>
              </div>
              <div class="text-xs text-sim-muted">
                Choose a predefined playstyle
              </div>
            </div>
          </div>
          <div class="card-body">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <PersonaCard
                v-for="persona in presetPersonas"
                :key="persona.id"
                :persona="persona"
                :is-selected="personaStore.selected === persona.id"
                @select="handleSelectPersona"
              />
            </div>
          </div>
        </div>
        
        <!-- Custom Personas -->
        <div class="card">
          <div class="card-header">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <i class="fas fa-user-cog text-blue-500"></i>
                <span>Custom Personas</span>
                <span class="text-xs bg-sim-bg px-2 py-1 rounded-md text-sim-muted">
                  {{ customPersonas.length }} saved
                </span>
              </div>
              <button
                @click="handleCreatePersona"
                class="text-sm btn btn-secondary"
              >
                <i class="fas fa-plus mr-1"></i>
                Create New
              </button>
            </div>
          </div>
          <div class="card-body">
            <!-- Empty state -->
            <div v-if="customPersonas.length === 0" class="text-center py-8">
              <i class="fas fa-user-plus text-4xl text-sim-muted mb-4"></i>
              <p class="text-sim-muted mb-2">No custom personas yet</p>
              <p class="text-xs text-sim-muted mb-4">
                Create personalized behavior profiles for different playstyles
              </p>
              <button
                @click="handleCreatePersona"
                class="btn btn-primary"
              >
                <i class="fas fa-plus mr-2"></i>
                Create Your First Persona
              </button>
            </div>
            
            <!-- Custom personas grid -->
            <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PersonaCard
                v-for="persona in customPersonas"
                :key="persona.id"
                :persona="persona"
                :is-selected="personaStore.selected === persona.id"
                @select="handleSelectPersona"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Selected Persona Details (Right 1/3) -->
      <div class="xl:col-span-1">
        <PersonaDetails
          :persona="personaStore.currentPersona"
          @edit="handleEditPersona"
          @delete="handleDeletePersona"
          @use-in-simulation="handleUseInSimulation"
        />
      </div>
    </div>
    
    <!-- Error state -->
    <div v-if="personaStore.lastError" class="card border-red-500 bg-red-500/5">
      <div class="card-body">
        <div class="flex items-center space-x-3">
          <i class="fas fa-exclamation-triangle text-red-500"></i>
          <div>
            <div class="font-medium text-red-700">Error Loading Personas</div>
            <div class="text-sm text-red-600">{{ personaStore.lastError }}</div>
          </div>
          <button
            @click="personaStore.loadPersonas"
            class="ml-auto btn btn-secondary"
          >
            <i class="fas fa-redo mr-2"></i>
            Retry
          </button>
        </div>
      </div>
    </div>
    
    <!-- PersonaBuilder Modal -->
    <PersonaBuilder
      :show="showBuilder"
      @close="showBuilder = false"
      @save="handlePersonaSaved"
    />
    
    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showDeleteConfirm = false"
    >
      <div class="bg-sim-surface border border-sim-border rounded-lg p-6 max-w-md mx-4" @click.stop>
        <div class="flex items-center space-x-3 mb-4">
          <i class="fas fa-exclamation-triangle text-red-500 text-xl"></i>
          <h3 class="text-lg font-semibold text-sim-text">Delete Persona</h3>
        </div>
        
        <p class="text-sim-muted mb-6">
          Are you sure you want to delete "{{ deletingPersona?.name }}"? This action cannot be undone.
        </p>
        
        <div class="flex space-x-3">
          <button
            @click="showDeleteConfirm = false"
            class="flex-1 btn btn-secondary"
          >
            Cancel
          </button>
          <button
            @click="confirmDelete"
            class="flex-1 btn btn-danger"
          >
            <i class="fas fa-trash mr-2"></i>
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePersonaStore } from '@/stores/personas'
import { useRouter } from 'vue-router'
import type { SimplePersona } from '@/types'

// Components
import PersonaCard from '@/components/PlayerPersonas/PersonaCard.vue'
import PersonaDetails from '@/components/PlayerPersonas/PersonaDetails.vue'
import PersonaBuilder from '@/components/PlayerPersonas/PersonaBuilder.vue'

const router = useRouter()
const personaStore = usePersonaStore()

// State
const showBuilder = ref(false)
const showDeleteConfirm = ref(false)
const deletingPersona = ref<SimplePersona | null>(null)

// Computed
const presetPersonas = computed(() => Array.from(personaStore.presets.values()))
const customPersonas = computed(() => personaStore.customPersonas)

// Actions
function handleSelectPersona(personaId: string) {
  personaStore.selectPersona(personaId)
}

function handleCreatePersona() {
  personaStore.createPersona()
  showBuilder.value = true
}

function handleEditPersona() {
  const currentPersona = personaStore.currentPersona
  personaStore.editPersona(currentPersona.id)
  showBuilder.value = true
}

function handleDeletePersona() {
  const currentPersona = personaStore.currentPersona
  if (!currentPersona.isPreset) {
    deletingPersona.value = currentPersona
    showDeleteConfirm.value = true
  }
}

function confirmDelete() {
  if (deletingPersona.value) {
    personaStore.deletePersona(deletingPersona.value.id)
    deletingPersona.value = null
    showDeleteConfirm.value = false
  }
}

function handlePersonaSaved(persona: SimplePersona) {
  // PersonaBuilder already handles saving via store
  showBuilder.value = false
}

function handleUseInSimulation() {
  // Phase 5 Integration Hook - navigate to simulation setup
  const config = personaStore.getSimulationConfig()
  console.log('Starting simulation with persona config:', config)
  
  // Navigate to simulation setup with persona pre-selected
  router.push({
    path: '/simulation-setup',
    query: { persona: personaStore.selected }
  })
}

// Lifecycle
onMounted(() => {
  personaStore.loadPersonas()
})
</script>
