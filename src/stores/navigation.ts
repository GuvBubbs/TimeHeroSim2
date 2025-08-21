import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NavigationTab } from '@/types'

export const useNavigationStore = defineStore('navigation', () => {
  // State
  const currentPath = ref('/')
  const navigationTabs = ref<NavigationTab[]>([
    { path: '/', label: 'Dashboard', icon: 'fas fa-home' },
    { path: '/configuration', label: 'Game Configuration', icon: 'fas fa-cog' },
    { path: '/upgrade-tree', label: 'Upgrade Tree', icon: 'fas fa-project-diagram' },
    { path: '/personas', label: 'Player Personas', icon: 'fas fa-users' },
    { path: '/simulation-setup', label: 'Simulation Setup', icon: 'fas fa-sliders-h' },
    { path: '/live-monitor', label: 'Live Monitor', icon: 'fas fa-tv' },
    { path: '/reports', label: 'Reports', icon: 'fas fa-chart-bar' }
  ])

  // Getters
  const activeTab = computed(() => {
    return navigationTabs.value.find(tab => tab.path === currentPath.value)
  })

  const activeTabIndex = computed(() => {
    return navigationTabs.value.findIndex(tab => tab.path === currentPath.value)
  })

  // Actions
  function setCurrentPath(path: string) {
    currentPath.value = path
  }

  return {
    currentPath,
    navigationTabs,
    activeTab,
    activeTabIndex,
    setCurrentPath
  }
})
