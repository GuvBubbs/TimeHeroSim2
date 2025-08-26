/**
 * Validation Reporter for Upgrade Tree Layout
 * Phase 7: Enhanced error handling and validation
 */

import type { ValidationIssue } from '@/types'

export interface ValidationReport {
  issues: ValidationIssue[]
  warnings: ValidationIssue[]
  errors: ValidationIssue[]
  summary: {
    totalIssues: number
    errorCount: number
    warningCount: number
    infoCount: number
  }
}

class ValidationReporter {
  private issues: ValidationIssue[] = []

  addIssue(issue: ValidationIssue) {
    this.issues.push({
      ...issue,
      timestamp: Date.now()
    })
  }

  addError(type: string, message: string, metrics?: Record<string, any>) {
    this.addIssue({
      type,
      message,
      severity: 'error',
      metrics
    })
  }

  addWarning(type: string, message: string, metrics?: Record<string, any>) {
    this.addIssue({
      type,
      message,
      severity: 'warning',
      metrics
    })
  }

  addInfo(type: string, message: string, metrics?: Record<string, any>) {
    this.addIssue({
      type,
      message,
      severity: 'info',
      metrics
    })
  }

  getReport(): ValidationReport {
    const errors = this.issues.filter(i => i.severity === 'error')
    const warnings = this.issues.filter(i => i.severity === 'warning')
    const infos = this.issues.filter(i => i.severity === 'info')

    return {
      issues: [...this.issues],
      warnings,
      errors,
      summary: {
        totalIssues: this.issues.length,
        errorCount: errors.length,
        warningCount: warnings.length,
        infoCount: infos.length
      }
    }
  }

  clear() {
    this.issues = []
  }

  hasErrors(): boolean {
    return this.issues.some(i => i.severity === 'error')
  }

  hasWarnings(): boolean {
    return this.issues.some(i => i.severity === 'warning')
  }

  // Methods expected by graphBuilder.ts
  startValidation() {
    this.clear()
    console.log('Validation started')
  }

  generateReport(issues: ValidationIssue[]) {
    return this.getReport()
  }

  recordPositionCalculation(data: any) {
    this.addInfo('position-calculation', 'Position calculated', data)
  }
}

export const validationReporter = new ValidationReporter()
export type { ValidationIssue }
