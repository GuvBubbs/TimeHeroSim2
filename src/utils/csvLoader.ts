import Papa from 'papaparse'
import type { CSVGameDataRow, CSVFileMetadata } from '@/types/csv-data'
import { CSV_FILE_LIST } from '@/types/csv-data'
import type { GameDataItem, MaterialCost } from '@/types/game-data'

export interface CSVLoadResult {
  success: boolean
  data: GameDataItem[]
  errors: string[]
  filename: string
}

export interface CSVLoadProgress {
  loaded: number
  total: number
  currentFile?: string
  completed: boolean
}

/**
 * Parse materials string format like "Stone x5" or "Wood x20;Iron x5"
 */
function parseMaterials(materialsStr: string): MaterialCost | undefined {
  if (!materialsStr || materialsStr.trim() === '') return undefined
  
  const materials: MaterialCost = {}
  const items = materialsStr.split(';')
  
  for (const item of items) {
    const match = item.trim().match(/^(.+?)\s+x(\d+)$/i)
    if (match) {
      const materialName = match[1].trim()
      const quantity = parseInt(match[2], 10)
      if (!isNaN(quantity)) {
        materials[materialName] = quantity
      }
    }
  }
  
  return Object.keys(materials).length > 0 ? materials : undefined
}

/**
 * Parse prerequisites string (semicolon-separated)
 */
function parsePrerequisites(prereqStr: string): string[] {
  if (!prereqStr || prereqStr.trim() === '') return []
  return prereqStr.split(';').map(p => p.trim()).filter(p => p.length > 0)
}

/**
 * Parse categories string (semicolon-separated)
 */
function parseCategories(categoriesStr: string): string[] {
  if (!categoriesStr || categoriesStr.trim() === '') return []
  return categoriesStr.split(';').map(c => c.trim()).filter(c => c.length > 0)
}

/**
 * Parse boolean string ("TRUE"/"FALSE")
 */
function parseBoolean(boolStr: string): boolean | undefined {
  if (!boolStr) return undefined
  const normalized = boolStr.trim().toUpperCase()
  return normalized === 'TRUE'
}

/**
 * Parse numeric string with fallback to undefined
 */
function parseNumber(numStr: string): number | undefined {
  if (!numStr || numStr.trim() === '') return undefined
  const num = Number(numStr.trim())
  return isNaN(num) ? undefined : num
}

/**
 * Convert raw CSV row to typed GameDataItem
 */
function processCSVRow(row: CSVGameDataRow, fileMetadata: CSVFileMetadata): GameDataItem | null {
  // Skip empty rows
  if (!row.id || !row.name) return null
  
  const item: GameDataItem = {
    id: row.id,
    name: row.name,
    prerequisites: parsePrerequisites(row.prerequisite),
    type: row.type || '',
    categories: parseCategories(row.categories),
    sourceFile: fileMetadata.filename,
    category: fileMetadata.category,
    
    // Optional fields
    goldCost: parseNumber(row.gold_cost),
    goldGain: parseNumber(row.gold_gain),
    energyCost: parseNumber(row.energy_cost),
    time: parseNumber(row.time),
    materialsCost: parseMaterials(row.materials_cost),
    materialsGain: parseMaterials(row.materials_gain),
    
    level: parseNumber(row.level),
    effect: row.effect || undefined,
    ratio: parseNumber(row.ratio),
    sellPricePerUnit: parseNumber(row.sell_price_per_unit),
    minQuantity: parseNumber(row.min_quantity),
    exchangeRate: parseNumber(row.exchange_rate),
    
    windLevel: parseNumber(row.windLevel),
    seedLevel: parseNumber(row.seedLevel),
    seedPool: row.seedPool || undefined,
    
    damage: parseNumber(row.damage),
    attackSpeed: parseNumber(row.attackSpeed),
    advantageVs: row.advantageVs || undefined,
    
    length: parseNumber(row.length),
    boss: row.boss || undefined,
    bossDrop: row.boss_drop || undefined,
    commonDrop: row.common_drop || undefined,
    enemyRolls: parseNumber(row.enemy_rolls),
    depthRange: row.depth_range || undefined,
    effectPerLevel: parseNumber(row.effectPerLevel),
    
    plotsAdded: parseNumber(row.plots_added),
    totalPlots: parseNumber(row.total_plots),
    toolRequired: row.tool_required || undefined,
    repeatable: parseBoolean(row.repeatable),
    
    notes: row.notes || undefined
  }
  
  return item
}

/**
 * Load and parse a single CSV file
 */
export async function loadCSVFile(fileMetadata: CSVFileMetadata): Promise<CSVLoadResult> {
  try {
    // Determine the full path based on category
    const basePath = '/TimeHeroSim2/Data/'
    const fullPath = `${basePath}${fileMetadata.category}/${fileMetadata.filename}`
    
    // Fetch the CSV file
    const response = await fetch(fullPath)
    if (!response.ok) {
      return {
        success: false,
        data: [],
        errors: [`Failed to fetch ${fileMetadata.filename}: ${response.statusText}`],
        filename: fileMetadata.filename
      }
    }
    
    const csvText = await response.text()
    
    // Parse CSV
    const parseResult = Papa.parse<CSVGameDataRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    })
    
    if (parseResult.errors.length > 0) {
      return {
        success: false,
        data: [],
        errors: parseResult.errors.map(err => `Parse error in ${fileMetadata.filename}: ${err.message}`),
        filename: fileMetadata.filename
      }
    }
    
    // Process rows into GameDataItems
    const items: GameDataItem[] = []
    const errors: string[] = []
    
    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i]
      try {
        const item = processCSVRow(row, fileMetadata)
        if (item) {
          items.push(item)
        }
      } catch (error) {
        errors.push(`Error processing row ${i + 1} in ${fileMetadata.filename}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    
    return {
      success: true,
      data: items,
      errors,
      filename: fileMetadata.filename
    }
    
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [`Unexpected error loading ${fileMetadata.filename}: ${error instanceof Error ? error.message : String(error)}`],
      filename: fileMetadata.filename
    }
  }
}

/**
 * Load all CSV files with progress tracking
 */
export async function loadAllCSVFiles(
  progressCallback?: (progress: CSVLoadProgress) => void
): Promise<{
  items: GameDataItem[]
  errors: string[]
  loadedFiles: number
  totalFiles: number
}> {
  const allItems: GameDataItem[] = []
  const allErrors: string[] = []
  let loadedFiles = 0
  
  // Only load unified schema files - specialized files are loaded separately
  const unifiedSchemaFiles = CSV_FILE_LIST.filter(file => file.hasUnifiedSchema)
  const totalFiles = unifiedSchemaFiles.length
  
  // Load files sequentially to avoid overwhelming the browser
  for (const fileMetadata of unifiedSchemaFiles) {
    progressCallback?.({
      loaded: loadedFiles,
      total: totalFiles,
      currentFile: fileMetadata.filename,
      completed: false
    })
    
    const result = await loadCSVFile(fileMetadata)
    
    if (result.success) {
      allItems.push(...result.data)
      if (result.errors.length > 0) {
        allErrors.push(...result.errors)
      }
    } else {
      allErrors.push(...result.errors)
    }
    
    loadedFiles++
    
    progressCallback?.({
      loaded: loadedFiles,
      total: totalFiles,
      currentFile: fileMetadata.filename,
      completed: false
    })
  }
  
  progressCallback?.({
    loaded: loadedFiles,
    total: totalFiles,
    completed: true
  })
  
  return {
    items: allItems,
    errors: allErrors,
    loadedFiles,
    totalFiles
  }
}

/**
 * Calculate memory usage of loaded data (rough estimate)
 */
export function calculateDataMemoryUsage(items: GameDataItem[]): number {
  // Rough estimate: JSON stringify and count characters, multiply by 2 for UTF-16
  const jsonStr = JSON.stringify(items)
  return jsonStr.length * 2 // bytes
}

// Specialized CSV loading for files that don't conform to the unified GameDataItem schema
export interface SpecializedCSVResult {
  success: boolean
  filename: string
  data: Record<string, any>[]
  error?: string
  rowCount: number
}

export async function loadSpecializedCSVFile(fileMetadata: CSVFileMetadata): Promise<SpecializedCSVResult> {
  try {
    // Determine the full path based on category
    const basePath = '/TimeHeroSim2/Data/'
    const fullPath = `${basePath}${fileMetadata.category}/${fileMetadata.filename}`
    
    // Fetch the CSV file
    const response = await fetch(fullPath)
    if (!response.ok) {
      return {
        success: false,
        filename: fileMetadata.filename,
        data: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
        rowCount: 0
      }
    }
    
    const csvText = await response.text()
    
    // Parse CSV with PapaParse
    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim()
    })
    
    if (parseResult.errors.length > 0) {
      console.warn(`Parse warnings for ${fileMetadata.filename}:`, parseResult.errors)
    }
    
    const rawData = parseResult.data as Record<string, any>[]
    
    // Filter out completely empty rows and clean up data
    const cleanData = rawData.filter(row => {
      const hasData = Object.values(row).some(value => 
        value !== null && value !== undefined && String(value).trim() !== ''
      )
      return hasData
    })
    
    return {
      success: true,
      filename: fileMetadata.filename,
      data: cleanData,
      rowCount: cleanData.length
    }
  } catch (error) {
    return {
      success: false,
      filename: fileMetadata.filename,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      rowCount: 0
    }
  }
}

export async function loadAllSpecializedCSVFiles(): Promise<SpecializedCSVResult[]> {
  const specializedFiles = CSV_FILE_LIST.filter(file => !file.hasUnifiedSchema)
  const results: SpecializedCSVResult[] = []
  
  for (const fileMetadata of specializedFiles) {
    const result = await loadSpecializedCSVFile(fileMetadata)
    results.push(result)
  }
  
  return results
}
