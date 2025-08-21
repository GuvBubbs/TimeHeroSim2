import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue')
  },
  {
    path: '/configuration',
    name: 'configuration',
    component: () => import('@/views/ConfigurationView.vue')
  },
  {
    path: '/upgrade-tree',
    name: 'upgrade-tree',
    component: () => import('@/views/UpgradeTreeView.vue')
  },
  {
    path: '/personas',
    name: 'personas',
    component: () => import('@/views/PersonasView.vue')
  },
  {
    path: '/simulation-setup',
    name: 'simulation-setup',
    component: () => import('@/views/SimulationSetupView.vue')
  },
  {
    path: '/live-monitor',
    name: 'live-monitor',
    component: () => import('@/views/LiveMonitorView.vue')
  },
  {
    path: '/reports',
    name: 'reports',
    component: () => import('@/views/ReportsView.vue')
  }
]

const router = createRouter({
  history: createWebHistory('/TimeHeroSim2/'),
  routes
})

export default router
