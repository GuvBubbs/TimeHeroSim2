// ExportService - Multi-format Report Export System
// Supports JSON, CSV, Markdown, and LLM-optimized formats

import type { 
  AnalysisReport, 
  ComparisonResult,
  ComparisonMetrics,
  ComparisonInsight,
  ExportFormat, 
  ExportOptions 
} from '@/types/reports'

interface ExportData {
  reports: AnalysisReport[]
  metadata: {
    exportedAt: Date
    version: string
    reportCount: number
    options?: ExportOptions
  }
  analysis?: any
  comparison?: ComparisonResult
}

export class ExportService {
  
  /**
   * Export reports in the specified format
   */
  async exportReports(
    reports: AnalysisReport[], 
    format: ExportFormat, 
    options?: ExportOptions
  ): Promise<Blob> {
    const exportData = this.prepareExportData(reports, options)
    
    switch (format) {
      case 'json':
        return this.exportAsJSON(exportData)
      case 'csv':
        return this.exportAsCSV(exportData)
      case 'markdown':
        return this.exportAsMarkdown(exportData)
      case 'llm':
        return this.exportAsLLMOptimized(exportData)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }
  
  /**
   * Compare multiple reports and generate comparison analysis
   */
  compareReports(reports: AnalysisReport[]): ComparisonResult {
    if (reports.length < 2) {
      throw new Error('Need at least 2 reports for comparison')
    }
    
    const metrics = this.calculateComparisonMetrics(reports)
    const insights = this.generateComparisonInsights(reports, metrics)
    
    return {
      reports,
      metrics,
      insights
    }
  }
  
  // ===== EXPORT FORMAT IMPLEMENTATIONS =====
  
  /**
   * Export as JSON format
   */
  private exportAsJSON(exportData: ExportData): Blob {
    const jsonData = {
      exportedAt: exportData.metadata.exportedAt.toISOString(),
      version: exportData.metadata.version,
      reportCount: exportData.metadata.reportCount,
      options: exportData.metadata.options,
      reports: exportData.reports.map(report => ({
        id: report.id,
        simulationId: report.simulationId,
        generatedAt: report.generatedAt.toISOString(),
        summary: report.summary,
        progressionAnalysis: this.sanitizeProgressionAnalysis(report.progressionAnalysis),
        resourceAnalysis: this.sanitizeResourceAnalysis(report.resourceAnalysis),
        efficiencyAnalysis: this.sanitizeEfficiencyAnalysis(report.efficiencyAnalysis),
        bottleneckAnalysis: report.bottleneckAnalysis,
        decisionAnalysis: this.sanitizeDecisionAnalysis(report.decisionAnalysis),
        personaAnalysis: report.personaAnalysis,
        recommendations: report.recommendations
      })),
      comparison: exportData.comparison,
      analysis: exportData.analysis
    }
    
    const jsonString = JSON.stringify(jsonData, null, 2)
    return new Blob([jsonString], { type: 'application/json' })
  }
  
  /**
   * Export as CSV format
   */
  private exportAsCSV(exportData: ExportData): Blob {
    const headers = [
      'Report ID',
      'Simulation Name',
      'Persona',
      'Generated At',
      'Completion Status',
      'Total Days',
      'Overall Score',
      'Resource Efficiency (%)',
      'Decision Quality (%)',
      'Upgrades Purchased',
      'Adventures Completed',
      'Major Bottlenecks Count',
      'Top Bottleneck',
      'Recommendation Count'
    ]
    
    const rows = exportData.reports.map(report => [
      report.id,
      report.summary.simulationName,
      report.summary.personaName,
      report.generatedAt.toISOString(),
      report.summary.completionStatus,
      report.summary.totalDays.toString(),
      report.summary.overallScore.toString(),
      (report.summary.resourceEfficiency * 100).toFixed(1),
      (report.summary.decisionQuality * 100).toFixed(1),
      report.summary.upgradesPurchased.toString(),
      report.summary.adventuresCompleted.toString(),
      report.summary.majorBottlenecks.length.toString(),
      report.summary.majorBottlenecks[0] || '',
      report.recommendations.length.toString()
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')
    
    return new Blob([csvContent], { type: 'text/csv' })
  }
  
  /**
   * Export as Markdown format
   */
  private exportAsMarkdown(exportData: ExportData): Blob {
    const sections: string[] = []
    
    // Header
    sections.push('# Time Hero Simulation Reports\n')
    sections.push(`**Generated:** ${exportData.metadata.exportedAt.toLocaleDateString()}\n`)
    sections.push(`**Reports Included:** ${exportData.metadata.reportCount}\n`)
    
    // Summary table
    sections.push('## Summary\n')
    sections.push('| Simulation | Persona | Status | Days | Score | Efficiency |')
    sections.push('|------------|---------|--------|------|-------|------------|')
    
    exportData.reports.forEach(report => {
      const status = report.summary.completionStatus === 'success' ? '✅' :
                    report.summary.completionStatus === 'bottleneck' ? '⚠️' : '❌'
      
      sections.push(
        `| ${report.summary.simulationName} | ${report.summary.personaName} | ${status} | ` +
        `${report.summary.totalDays} | ${report.summary.overallScore} | ` +
        `${(report.summary.resourceEfficiency * 100).toFixed(0)}% |`
      )
    })
    
    sections.push('\n')
    
    // Individual report details
    sections.push('## Detailed Reports\n')
    
    exportData.reports.forEach((report, index) => {
      sections.push(`### ${index + 1}. ${report.summary.simulationName}\n`)
      sections.push(`**Persona:** ${report.summary.personaName}  `)
      sections.push(`**Status:** ${this.getStatusEmoji(report.summary.completionStatus)}  `)
      sections.push(`**Duration:** ${report.summary.totalDays} days  `)
      sections.push(`**Score:** ${report.summary.overallScore}/100\n`)
      
      // Key metrics
      sections.push('#### Key Metrics\n')
      sections.push(`- **Resource Efficiency:** ${(report.summary.resourceEfficiency * 100).toFixed(1)}%`)
      sections.push(`- **Decision Quality:** ${(report.summary.decisionQuality * 100).toFixed(1)}%`)
      sections.push(`- **Upgrades Purchased:** ${report.summary.upgradesPurchased}`)
      sections.push(`- **Adventures Completed:** ${report.summary.adventuresCompleted}\n`)
      
      // Major bottlenecks
      if (report.summary.majorBottlenecks.length > 0) {
        sections.push('#### Major Issues\n')
        report.summary.majorBottlenecks.forEach((bottleneck, i) => {
          sections.push(`${i + 1}. ${bottleneck}`)
        })
        sections.push('')
      }
      
      // Top recommendations
      if (report.recommendations.length > 0) {
        sections.push('#### Top Recommendations\n')
        report.recommendations.slice(0, 3).forEach((rec, i) => {
          sections.push(`${i + 1}. **${rec.title}**`)
          sections.push(`   - ${rec.description}`)
          sections.push(`   - Expected Impact: ${rec.expectedImprovement}`)
        })
        sections.push('')
      }
      
      sections.push('---\n')
    })
    
    // Comparison analysis if multiple reports
    if (exportData.comparison) {
      sections.push('## Comparison Analysis\n')
      sections.push(this.formatComparisonForMarkdown(exportData.comparison))
    }
    
    const content = sections.join('\n')
    return new Blob([content], { type: 'text/markdown' })
  }
  
  /**
   * Export as LLM-optimized format
   */
  private exportAsLLMOptimized(exportData: ExportData): Blob {
    const sections: string[] = []
    
    // Structured header for LLM consumption
    sections.push('# Time Hero Simulator - Analysis Report\n')
    sections.push('## Metadata')
    sections.push(`- Export Date: ${exportData.metadata.exportedAt.toISOString()}`)
    sections.push(`- Simulator Version: ${exportData.metadata.version}`)
    sections.push(`- Reports Analyzed: ${exportData.metadata.reportCount}`)
    sections.push(`- Analysis Type: ${exportData.reports.length > 1 ? 'Comparative' : 'Individual'}\n`)
    
    // Executive summary
    sections.push('## Executive Summary\n')
    sections.push(this.generateExecutiveSummary(exportData))
    
    // Key findings
    sections.push('## Key Findings\n')
    exportData.reports.forEach((report, index) => {
      sections.push(`### Report ${index + 1}: ${report.summary.simulationName}`)
      sections.push(`**Configuration:** ${report.summary.personaName} persona`)
      sections.push(`**Outcome:** ${report.summary.completionStatus.toUpperCase()} - ${report.summary.totalDays} days`)
      sections.push(`**Performance Score:** ${report.summary.overallScore}/100`)
      sections.push(`**Efficiency Metrics:**`)
      sections.push(`  - Resource Utilization: ${(report.summary.resourceEfficiency * 100).toFixed(1)}%`)
      sections.push(`  - Decision Quality: ${(report.summary.decisionQuality * 100).toFixed(1)}%`)
      
      if (report.summary.majorBottlenecks.length > 0) {
        sections.push(`**Critical Issues:**`)
        report.summary.majorBottlenecks.forEach(bottleneck => {
          sections.push(`  - ${bottleneck}`)
        })
      }
      sections.push('')
    })
    
    // Comparative analysis
    if (exportData.comparison) {
      sections.push('## Comparative Analysis\n')
      sections.push(this.formatComparisonForLLM(exportData.comparison))
    }
    
    // Actionable recommendations
    sections.push('## Actionable Recommendations\n')
    const allRecommendations = exportData.reports.flatMap(r => r.recommendations)
    const topRecommendations = this.prioritizeRecommendations(allRecommendations)
    
    topRecommendations.forEach((rec, index) => {
      sections.push(`### ${index + 1}. ${rec.title}`)
      sections.push(`**Priority:** ${rec.priority.toUpperCase()}`)
      sections.push(`**Issue:** ${rec.issue}`)
      sections.push(`**Impact:** ${rec.impact}`)
      sections.push(`**Solution:** ${rec.solution}`)
      sections.push(`**Expected Improvement:** ${rec.expectedImprovement}`)
      sections.push(`**Implementation Effort:** ${rec.effort}\n`)
    })
    
    // Structured data for further analysis
    sections.push('## Structured Data\n')
    sections.push('```json')
    sections.push(JSON.stringify({
      summary: {
        totalReports: exportData.reports.length,
        successRate: exportData.reports.filter(r => r.summary.completionStatus === 'success').length / exportData.reports.length,
        averageScore: exportData.reports.reduce((sum, r) => sum + r.summary.overallScore, 0) / exportData.reports.length,
        averageDays: exportData.reports.reduce((sum, r) => sum + r.summary.totalDays, 0) / exportData.reports.length
      },
      bottleneckPatterns: this.analyzeBottleneckPatterns(exportData.reports),
      personaPerformance: this.analyzePersonaPerformance(exportData.reports),
      recommendationFrequency: this.analyzeRecommendationFrequency(allRecommendations)
    }, null, 2))
    sections.push('```\n')
    
    const content = sections.join('\n')
    return new Blob([content], { type: 'text/plain' })
  }
  
  // ===== COMPARISON ANALYSIS =====
  
  private calculateComparisonMetrics(reports: AnalysisReport[]): ComparisonMetrics {
    const successfulReports = reports.filter(r => r.summary.completionStatus === 'success')
    
    return {
      averageScore: reports.reduce((sum, r) => sum + r.summary.overallScore, 0) / reports.length,
      averageDays: reports.reduce((sum, r) => sum + r.summary.totalDays, 0) / reports.length,
      successRate: successfulReports.length / reports.length,
      
      bestPerformer: reports.reduce((best, current) => 
        current.summary.overallScore > best.summary.overallScore ? current : best
      ),
      
      fastestCompletion: successfulReports.length > 0 ? 
        successfulReports.reduce((fastest, current) => 
          current.summary.totalDays < fastest.summary.totalDays ? current : fastest
        ) : reports[0]
    }
  }
  
  private generateComparisonInsights(
    reports: AnalysisReport[], 
    metrics: ComparisonMetrics
  ): ComparisonInsight[] {
    const insights: ComparisonInsight[] = []
    
    // Performance variation insight
    const scoreVariance = this.calculateVariance(reports.map(r => r.summary.overallScore))
    if (scoreVariance > 100) { // High variance
      insights.push({
        type: 'performance',
        title: 'High Performance Variation',
        description: `Performance scores vary significantly (variance: ${scoreVariance.toFixed(0)})`,
        impact: 'negative',
        recommendations: [
          'Review parameter configurations causing inconsistent results',
          'Identify optimal persona-parameter combinations'
        ]
      })
    }
    
    // Completion rate insight
    if (metrics.successRate < 0.8) {
      insights.push({
        type: 'bottleneck',
        title: 'Low Completion Rate',
        description: `Only ${Math.round(metrics.successRate * 100)}% of simulations completed successfully`,
        impact: 'negative',
        recommendations: [
          'Analyze common failure patterns',
          'Adjust game balance to improve completion rates'
        ]
      })
    }
    
    // Persona effectiveness insight
    const personaPerformance = this.analyzePersonaPerformance(reports)
    const bestPersona = Object.entries(personaPerformance)
      .sort(([, a], [, b]) => b.avgScore - a.avgScore)[0]
    
    if (bestPersona && bestPersona[1].avgScore > metrics.averageScore * 1.1) {
      insights.push({
        type: 'pattern',
        title: 'Optimal Persona Identified',
        description: `${bestPersona[0]} persona performs ${Math.round(((bestPersona[1].avgScore / metrics.averageScore) - 1) * 100)}% better than average`,
        impact: 'positive',
        recommendations: [
          `Use ${bestPersona[0]} persona configuration as baseline`,
          'Analyze successful patterns from this persona'
        ]
      })
    }
    
    return insights
  }
  
  // ===== HELPER METHODS =====
  
  private prepareExportData(reports: AnalysisReport[], options?: ExportOptions): ExportData {
    let comparison: ComparisonResult | undefined
    
    if (reports.length > 1 && options?.includeComparison) {
      comparison = this.compareReports(reports)
    }
    
    return {
      reports,
      metadata: {
        exportedAt: new Date(),
        version: '1.0.0',
        reportCount: reports.length,
        options
      },
      comparison
    }
  }
  
  private sanitizeProgressionAnalysis(analysis: any): any {
    // Convert Maps to objects for JSON serialization
    return {
      ...analysis,
      phaseTimings: analysis.phaseTimings ? Object.fromEntries(analysis.phaseTimings) : {},
      progressionRate: {
        ...analysis.progressionRate,
        byPhase: analysis.progressionRate?.byPhase ? Object.fromEntries(analysis.progressionRate.byPhase) : {}
      }
    }
  }
  
  private sanitizeResourceAnalysis(analysis: any): any {
    return {
      ...analysis,
      materialUtilization: analysis.materialUtilization ? Object.fromEntries(analysis.materialUtilization) : {},
      wasteAnalysis: {
        ...analysis.wasteAnalysis,
        materialsOverflow: analysis.wasteAnalysis?.materialsOverflow ? 
          Object.fromEntries(analysis.wasteAnalysis.materialsOverflow) : {}
      }
    }
  }
  
  private sanitizeEfficiencyAnalysis(analysis: any): any {
    return {
      ...analysis,
      resourceEfficiency: {
        ...analysis.resourceEfficiency,
        materials: analysis.resourceEfficiency?.materials ? 
          Object.fromEntries(analysis.resourceEfficiency.materials) : {}
      }
    }
  }
  
  private sanitizeDecisionAnalysis(analysis: any): any {
    return {
      ...analysis,
      summary: {
        ...analysis.summary,
        actionsByType: analysis.summary?.actionsByType ? Object.fromEntries(analysis.summary.actionsByType) : {},
        actionsByScreen: analysis.summary?.actionsByScreen ? Object.fromEntries(analysis.summary.actionsByScreen) : {}
      }
    }
  }
  
  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'success': return '✅ Success'
      case 'bottleneck': return '⚠️ Bottlenecked'
      case 'timeout': return '⏱️ Timed Out'
      default: return '❓ Unknown'
    }
  }
  
  private generateExecutiveSummary(exportData: ExportData): string {
    const reports = exportData.reports
    const successRate = reports.filter(r => r.summary.completionStatus === 'success').length / reports.length
    const avgCompletion = reports.reduce((sum, r) => sum + r.summary.totalDays, 0) / reports.length
    const avgScore = reports.reduce((sum, r) => sum + r.summary.overallScore, 0) / reports.length
    
    return `
Analysis of ${reports.length} simulation(s) reveals:

- **Success Rate:** ${Math.round(successRate * 100)}%
- **Average Completion Time:** ${avgCompletion.toFixed(1)} days
- **Average Performance Score:** ${Math.round(avgScore)}/100
- **Most Common Issues:** ${this.identifyCommonIssues(reports).join(', ')}
- **Key Recommendation:** ${this.identifyTopRecommendation(reports)}
    `.trim()
  }
  
  private identifyCommonIssues(reports: AnalysisReport[]): string[] {
    const issueCount = new Map<string, number>()
    
    reports.forEach(report => {
      report.summary.majorBottlenecks.forEach(bottleneck => {
        issueCount.set(bottleneck, (issueCount.get(bottleneck) || 0) + 1)
      })
    })
    
    return Array.from(issueCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([issue]) => issue)
  }
  
  private identifyTopRecommendation(reports: AnalysisReport[]): string {
    const allRecommendations = reports.flatMap(r => r.recommendations)
    const prioritized = this.prioritizeRecommendations(allRecommendations)
    
    return prioritized[0]?.title || 'No specific recommendations'
  }
  
  private prioritizeRecommendations(recommendations: any[]): any[] {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    
    return recommendations
      .sort((a, b) => {
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
        if (priorityDiff !== 0) return priorityDiff
        
        // Secondary sort by effort (lower effort first)
        const effortOrder = { low: 1, medium: 2, high: 3 }
        return (effortOrder[a.effort] || 2) - (effortOrder[b.effort] || 2)
      })
      .slice(0, 5)
  }
  
  private formatComparisonForMarkdown(comparison: ComparisonResult): string {
    const sections: string[] = []
    
    sections.push(`**Average Score:** ${Math.round(comparison.metrics.averageScore)}/100`)
    sections.push(`**Average Days:** ${comparison.metrics.averageDays.toFixed(1)}`)
    sections.push(`**Success Rate:** ${Math.round(comparison.metrics.successRate * 100)}%`)
    sections.push(`**Best Performer:** ${comparison.metrics.bestPerformer.summary.simulationName}`)
    sections.push(`**Fastest Completion:** ${comparison.metrics.fastestCompletion.summary.simulationName}\n`)
    
    if (comparison.insights.length > 0) {
      sections.push('### Key Insights\n')
      comparison.insights.forEach((insight, i) => {
        const emoji = insight.impact === 'positive' ? '✅' : insight.impact === 'negative' ? '⚠️' : 'ℹ️'
        sections.push(`${i + 1}. ${emoji} **${insight.title}**`)
        sections.push(`   ${insight.description}`)
        if (insight.recommendations.length > 0) {
          sections.push(`   Recommendations: ${insight.recommendations.join(', ')}`)
        }
      })
    }
    
    return sections.join('\n')
  }
  
  private formatComparisonForLLM(comparison: ComparisonResult): string {
    return `
**Comparison Summary:**
- Reports Analyzed: ${comparison.reports.length}
- Average Performance: ${Math.round(comparison.metrics.averageScore)}/100
- Success Rate: ${Math.round(comparison.metrics.successRate * 100)}%
- Performance Leader: ${comparison.metrics.bestPerformer.summary.simulationName} (${comparison.metrics.bestPerformer.summary.overallScore}/100)

**Critical Insights:**
${comparison.insights.map((insight, i) => 
  `${i + 1}. ${insight.title}: ${insight.description}`
).join('\n')}

**Optimization Opportunities:**
${comparison.insights.flatMap(i => i.recommendations).slice(0, 5).map((rec, i) => 
  `${i + 1}. ${rec}`
).join('\n')}
    `.trim()
  }
  
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length
  }
  
  private analyzeBottleneckPatterns(reports: AnalysisReport[]): Record<string, number> {
    const patterns = new Map<string, number>()
    
    reports.forEach(report => {
      report.summary.majorBottlenecks.forEach(bottleneck => {
        patterns.set(bottleneck, (patterns.get(bottleneck) || 0) + 1)
      })
    })
    
    return Object.fromEntries(patterns)
  }
  
  private analyzePersonaPerformance(reports: AnalysisReport[]): Record<string, { count: number; avgScore: number; avgDays: number }> {
    const personaStats = new Map<string, { scores: number[]; days: number[] }>()
    
    reports.forEach(report => {
      const persona = report.summary.personaName
      if (!personaStats.has(persona)) {
        personaStats.set(persona, { scores: [], days: [] })
      }
      personaStats.get(persona)!.scores.push(report.summary.overallScore)
      personaStats.get(persona)!.days.push(report.summary.totalDays)
    })
    
    const result: Record<string, { count: number; avgScore: number; avgDays: number }> = {}
    
    personaStats.forEach((stats, persona) => {
      result[persona] = {
        count: stats.scores.length,
        avgScore: stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length,
        avgDays: stats.days.reduce((sum, days) => sum + days, 0) / stats.days.length
      }
    })
    
    return result
  }
  
  private analyzeRecommendationFrequency(recommendations: any[]): Record<string, number> {
    const frequency = new Map<string, number>()
    
    recommendations.forEach(rec => {
      frequency.set(rec.type, (frequency.get(rec.type) || 0) + 1)
    })
    
    return Object.fromEntries(frequency)
  }
}

