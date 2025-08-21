import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // State
  const appVersion = ref('0.1.0')
  const currentPhase = ref('Phase 0')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const hasError = computed(() => error.value !== null)

  // Actions
  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  function clearError() {
    error.value = null
  }

  return {
    appVersion,
    currentPhase,
    isLoading,
    error,
    hasError,
    setLoading,
    setError,
    clearError
  }
})
