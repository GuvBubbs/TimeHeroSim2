// Reports Store - State Management for Simulation Analysis and Reporting
// Follows established Pinia Composition API patterns

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  SimulationResult, 
  AnalysisReport, 
  ComparisonResult,
  ExportFormat,
  ExportOptions,
  ReportFilters,
  SortField,
  SortDirection
} from '@/types/reports'
import { ReportGenerator } from '@/utils/ReportGenerator'
import { ExportService } from '@/utils/ExportService'
import { useGameDataStore } from './gameData'

export const useReportsStore = defineStore('reports', () => {
  // ===== STATE =====
  
  // Core data
  const simulationResults = ref<Map<string, SimulationResult>>(new Map())
  const analysisReports = ref<Map<string, AnalysisReport>>(new Map())
  
  // UI state
  const isGenerating = ref(false)
  const generationError = ref<string | null>(null)
  const isLoading = ref(false)
  
  // Library management
  const filters = ref<ReportFilters>({
    status: new Set(),
    personas: new Set(),
    dateRange: null,
    phases: new Set(),
    tags: new Set()
  })
  
  const sorting = ref<{ field: SortField; direction: SortDirection }>({
    field: 'date',
    direction: 'desc'
  })
  
  const selectedReports = ref<Set<string>>(new Set())
  const currentComparison = ref<ComparisonResult | null>(null)
  
  // Dependencies
  const gameDataStore = useGameDataStore()
  const reportGenerator = new ReportGenerator(gameDataStore)
  const exportService = new ExportService()
  
  // ===== COMPUTED =====
  
  const allReports = computed(() => 
    Array.from(analysisReports.value.values())
  )
  
  const recentReports = computed(() =>
    allReports.value
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
      .slice(0, 5)
  )
  
  const filteredReports = computed(() => {
    let reports = allReports.value
    
    // Apply status filter
    if (filters.value.status.size > 0) {
      reports = reports.filter(report => {
        const status = report.summary.completionStatus
        return filters.value.status.has(status)
      })
    }
    
    // Apply persona filter
    if (filters.value.personas.size > 0) {
      reports = reports.filter(report => 
        filters.value.personas.has(report.summary.personaId)
      )
    }
    
    // Apply date range filter
    if (filters.value.dateRange) {
      const { start, end } = filters.value.dateRange
      reports = reports.filter(report => 
        report.generatedAt >= start && report.generatedAt <= end
      )
    }
    
    // Apply phase filter
    if (filters.value.phases.size > 0) {
      reports = reports.filter(report =>
        report.summary.phasesCompleted.some(phase => 
          filters.value.phases.has(phase as any)
        )
      )
    }
    
    // Apply sorting
    reports.sort((a, b) => {
      const direction = sorting.value.direction === 'asc' ? 1 : -1
      
      switch (sorting.value.field) {
        case 'date':
          return direction * (a.generatedAt.getTime() - b.generatedAt.getTime())
        case 'name':
          return direction * a.summary.simulationName.localeCompare(b.summary.simulationName)
        case 'persona':
          return direction * a.summary.personaName.localeCompare(b.summary.personaName)
        case 'completion':
          return direction * (a.summary.totalDays - b.summary.totalDays)
        case 'efficiency':
          return direction * (a.summary.resourceEfficiency - b.summary.resourceEfficiency)
        case 'score':
          return direction * (a.summary.overallScore - b.summary.overallScore)
        default:
          return 0
      }
    })
    
    return reports
  })
  
  const reportStats = computed(() => ({
    total: allReports.value.length,
    successful: allReports.value.filter(r => r.summary.completionStatus === 'success').length,
    bottlenecked: allReports.value.filter(r => r.summary.completionStatus === 'bottleneck').length,
    timedOut: allReports.value.filter(r => r.summary.completionStatus === 'timeout').length,
    
    avgScore: allReports.value.length > 0 
      ? allReports.value.reduce((sum, r) => sum + r.summary.overallScore, 0) / allReports.value.length
      : 0,
    
    avgDays: allReports.value.length > 0
      ? allReports.value.reduce((sum, r) => sum + r.summary.totalDays, 0) / allReports.value.length
      : 0
  }))
  
  const canCompare = computed(() => selectedReports.value.size >= 2)
  
  // ===== ACTIONS =====
  
  /**
   * Add a completed simulation result and generate analysis report
   */
  async function addSimulationResult(result: SimulationResult): Promise<string | null> {
    try {
      isGenerating.value = true
      generationError.value = null
      
      // Store the raw simulation result
      simulationResults.value.set(result.id, result)
      
      // Generate analysis report
      const report = await reportGenerator.generateReport(result)
      analysisReports.value.set(report.id, report)
      
      // Persist to localStorage
      await saveToStorage()
      
      return report.id
    } catch (error) {
      console.error('Failed to generate report:', error)
      generationError.value = error instanceof Error ? error.message : 'Unknown error'
      return null
    } finally {
      isGenerating.value = false
    }
  }
  
  /**
   * Load all reports from localStorage
   */
  async function loadReports(): Promise<void> {
    try {
      isLoading.value = true
      await loadFromStorage()
    } catch (error) {
      console.error('Failed to load reports:', error)
      generationError.value = error instanceof Error ? error.message : 'Failed to load reports'
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Get a specific report by ID
   */
  function getReport(id: string): AnalysisReport | null {
    return analysisReports.value.get(id) || null
  }
  
  /**
   * Get a specific simulation result by ID
   */
  function getSimulationResult(id: string): SimulationResult | null {
    return simulationResults.value.get(id) || null
  }
  
  /**
   * Delete a report and its associated simulation result
   */
  async function deleteReport(id: string): Promise<void> {
    const report = analysisReports.value.get(id)
    if (report) {
      analysisReports.value.delete(id)
      simulationResults.value.delete(report.simulationId)
      selectedReports.value.delete(id)
      await saveToStorage()
    }
  }
  
  /**
   * Delete multiple reports
   */
  async function deleteReports(ids: string[]): Promise<void> {
    for (const id of ids) {
      const report = analysisReports.value.get(id)
      if (report) {
        analysisReports.value.delete(id)
        simulationResults.value.delete(report.simulationId)
        selectedReports.value.delete(id)
      }
    }
    await saveToStorage()
  }
  
  /**
   * Export reports in specified format
   */
  async function exportReports(
    reportIds: string[], 
    format: ExportFormat, 
    options?: ExportOptions
  ): Promise<Blob> {
    const reports = reportIds
      .map(id => analysisReports.value.get(id))
      .filter(Boolean) as AnalysisReport[]
      
    if (reports.length === 0) {
      throw new Error('No valid reports found for export')
    }
    
    return await exportService.exportReports(reports, format, options)
  }
  
  /**
   * Compare multiple reports and generate comparison analysis
   */
  async function compareReports(reportIds: string[]): Promise<ComparisonResult | null> {
    if (reportIds.length < 2) {
      throw new Error('Need at least 2 reports for comparison')
    }
    
    const reports = reportIds
      .map(id => getReport(id))
      .filter(Boolean) as AnalysisReport[]
      
    if (reports.length < 2) {
      throw new Error('Not enough valid reports for comparison')
    }
    
    try {
      const comparison = exportService.compareReports(reports)
      currentComparison.value = comparison
      return comparison
    } catch (error) {
      console.error('Failed to compare reports:', error)
      throw error
    }
  }
  
  // ===== FILTER & SORT MANAGEMENT =====
  
  /**
   * Update filter settings
   */
  function updateFilters(newFilters: Partial<ReportFilters>): void {
    Object.assign(filters.value, newFilters)
  }
  
  /**
   * Clear all filters
   */
  function clearFilters(): void {
    filters.value = {
      status: new Set(),
      personas: new Set(),
      dateRange: null,
      phases: new Set(),
      tags: new Set()
    }
  }
  
  /**
   * Update sorting settings
   */
  function updateSorting(field: SortField, direction?: SortDirection): void {
    sorting.value.field = field
    sorting.value.direction = direction || (
      sorting.value.field === field && sorting.value.direction === 'asc' ? 'desc' : 'asc'
    )
  }
  
  // ===== SELECTION MANAGEMENT =====
  
  /**
   * Toggle report selection
   */
  function toggleReportSelection(reportId: string): void {
    if (selectedReports.value.has(reportId)) {
      selectedReports.value.delete(reportId)
    } else {
      selectedReports.value.add(reportId)
    }
  }
  
  /**
   * Select multiple reports
   */
  function selectReports(reportIds: string[]): void {
    selectedReports.value.clear()
    reportIds.forEach(id => selectedReports.value.add(id))
  }
  
  /**
   * Clear all selections
   */
  function clearSelection(): void {
    selectedReports.value.clear()
  }
  
  /**
   * Select all filtered reports
   */
  function selectAllFiltered(): void {
    filteredReports.value.forEach(report => selectedReports.value.add(report.id))
  }
  
  // ===== PERSISTENCE =====
  
  /**
   * Save reports to localStorage
   */
  async function saveToStorage(): Promise<void> {
    try {
      const data = {
        simulationResults: Array.from(simulationResults.value.entries()),
        analysisReports: Array.from(analysisReports.value.entries()).map(([id, report]) => [
          id, 
          {
            ...report,
            generatedAt: report.generatedAt.toISOString() // Serialize dates
          }
        ]),
        timestamp: Date.now()
      }
      
      localStorage.setItem('timehero-sim-reports', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save reports to localStorage:', error)
      throw new Error('Failed to save reports')
    }
  }
  
  /**
   * Load reports from localStorage
   */
  async function loadFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('timehero-sim-reports')
      if (!stored) return
      
      const data = JSON.parse(stored)
      
      // Restore simulation results
      simulationResults.value = new Map(data.simulationResults || [])
      
      // Restore analysis reports and deserialize dates
      if (data.analysisReports) {
        const reportsArray = data.analysisReports.map(([id, report]: [string, any]) => [
          id,
          {
            ...report,
            generatedAt: new Date(report.generatedAt) // Deserialize dates
          }
        ])
        
        analysisReports.value = new Map(reportsArray)
      }
      
    } catch (error) {
      console.error('Failed to load reports from localStorage:', error)
      // Don't throw - just start with empty state
      simulationResults.value = new Map()
      analysisReports.value = new Map()
    }
  }
  
  /**
   * Clear all data (useful for testing)
   */
  async function clearAllData(): Promise<void> {
    simulationResults.value.clear()
    analysisReports.value.clear()
    selectedReports.value.clear()
    currentComparison.value = null
    clearFilters()
    
    localStorage.removeItem('timehero-sim-reports')
  }
  
  // ===== ANALYSIS HELPERS =====
  
  /**
   * Get all unique personas from reports
   */
  const availablePersonas = computed(() => {
    const personas = new Set<string>()
    allReports.value.forEach(report => {
      personas.add(report.summary.personaId)
    })
    return Array.from(personas)
  })
  
  /**
   * Get completion status distribution
   */
  const completionStatusDistribution = computed(() => {
    const distribution = new Map<string, number>()
    
    allReports.value.forEach(report => {
      const status = report.summary.completionStatus
      distribution.set(status, (distribution.get(status) || 0) + 1)
    })
    
    return distribution
  })
  
  /**
   * Get performance trends over time
   */
  const performanceTrends = computed(() => {
    const reports = allReports.value
      .sort((a, b) => a.generatedAt.getTime() - b.generatedAt.getTime())
    
    return {
      timestamps: reports.map(r => r.generatedAt.getTime()),
      scores: reports.map(r => r.summary.overallScore),
      completionDays: reports.map(r => r.summary.totalDays),
      efficiency: reports.map(r => r.summary.resourceEfficiency * 100)
    }
  })
  
  return {
    // State
    simulationResults,
    analysisReports,
    isGenerating,
    generationError,
    isLoading,
    filters,
    sorting,
    selectedReports,
    currentComparison,
    
    // Computed
    allReports,
    recentReports,
    filteredReports,
    reportStats,
    canCompare,
    availablePersonas,
    completionStatusDistribution,
    performanceTrends,
    
    // Actions
    addSimulationResult,
    loadReports,
    getReport,
    getSimulationResult,
    deleteReport,
    deleteReports,
    exportReports,
    compareReports,
    
    // Filter & Sort
    updateFilters,
    clearFilters,
    updateSorting,
    
    // Selection
    toggleReportSelection,
    selectReports,
    clearSelection,
    selectAllFiltered,
    
    // Persistence
    saveToStorage,
    loadFromStorage,
    clearAllData
  }
})

