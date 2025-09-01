/**
 * CSVDataParser - Phase 8A Implementation
 * 
 * Robust CSV data parsing for Time Hero simulation engine.
 * Handles material strings, costs, durations, and numeric values with proper validation.
 */

export class CSVDataParser {
  /**
   * Parses material requirements from strings like "Crystal x2;Silver x5"
   * Handles both "x" and "×" separators, normalizes material names
   * 
   * @param materialString - Input string with materials and quantities
   * @returns Map of normalized material names to quantities
   */
  static parseMaterials(materialString: string): Map<string, number> {
    const materials = new Map<string, number>()
    
    if (!materialString || typeof materialString !== 'string') {
      return materials
    }
    
    // Split by semicolon to handle multiple materials
    const parts = materialString.split(';')
    
    for (const part of parts) {
      if (!part.trim()) continue
      
      // Handle both "x" and "×" separators, case insensitive
      const match = part.trim().match(/(.+?)\s*[x×]\s*(\d+)/i)
      
      if (match) {
        const materialName = this.normalizeMaterialName(match[1].trim())
        const quantity = parseInt(match[2])
        
        if (materialName && !isNaN(quantity) && quantity > 0) {
          // If material already exists, add to existing quantity
          const existing = materials.get(materialName) || 0
          materials.set(materialName, existing + quantity)
        }
      }
    }
    
    return materials
  }
  
  /**
   * Extracts gold cost from material string
   * Looks for patterns like "Gold x100" or "Gold ×50"
   * 
   * @param materialString - Input string that may contain gold cost
   * @returns Gold amount or 0 if not found
   */
  static parseGoldCost(materialString: string): number {
    if (!materialString || typeof materialString !== 'string') {
      return 0
    }
    
    // Look for gold cost pattern (case insensitive)
    const goldMatch = materialString.match(/gold\s*[x×]\s*(\d+)/i)
    
    if (goldMatch) {
      const amount = parseInt(goldMatch[1])
      return isNaN(amount) ? 0 : amount
    }
    
    return 0
  }
  
  /**
   * Extracts energy cost from material string
   * Looks for patterns like "Energy x20" or "Energy ×15"
   * 
   * @param materialString - Input string that may contain energy cost
   * @returns Energy amount or 0 if not found
   */
  static parseEnergyCost(materialString: string): number {
    if (!materialString || typeof materialString !== 'string') {
      return 0
    }
    
    // Look for energy cost pattern (case insensitive)
    const energyMatch = materialString.match(/energy\s*[x×]\s*(\d+)/i)
    
    if (energyMatch) {
      const amount = parseInt(energyMatch[1])
      return isNaN(amount) ? 0 : amount
    }
    
    return 0
  }
  
  /**
   * Parses numeric values with fallback to default
   * Handles strings with non-numeric characters by extracting digits
   * 
   * @param value - Input value (string or number)
   * @param defaultValue - Fallback value if parsing fails
   * @returns Parsed number or default
   */
  static parseNumericValue(value: string | number, defaultValue: number = 0): number {
    if (typeof value === 'number') {
      return isNaN(value) ? defaultValue : value
    }
    
    if (!value || typeof value !== 'string') {
      return defaultValue
    }
    
    // Remove all non-digit characters and parse
    const cleanedValue = value.replace(/[^\d.-]/g, '')
    
    if (!cleanedValue) {
      return defaultValue
    }
    
    const parsed = parseFloat(cleanedValue)
    return isNaN(parsed) ? defaultValue : parsed
  }
  
  /**
   * Parses duration strings like "10 min", "2 hours", "30 minutes"
   * Converts everything to minutes for consistency
   * 
   * @param durationString - Input duration string
   * @returns Duration in minutes
   */
  static parseDuration(durationString: string): number {
    if (!durationString || typeof durationString !== 'string') {
      return 0
    }
    
    const input = durationString.toLowerCase().trim()
    
    // Try to match hours first
    const hourMatch = input.match(/(\d+(?:\.\d+)?)\s*h(?:our)?s?/i)
    if (hourMatch) {
      const hours = parseFloat(hourMatch[1])
      return isNaN(hours) ? 0 : Math.round(hours * 60)
    }
    
    // Try to match minutes
    const minuteMatch = input.match(/(\d+(?:\.\d+)?)\s*m(?:in)?(?:ute)?s?/i)
    if (minuteMatch) {
      const minutes = parseFloat(minuteMatch[1])
      return isNaN(minutes) ? 0 : Math.round(minutes)
    }
    
    // Try to match seconds (convert to minutes)
    const secondMatch = input.match(/(\d+(?:\.\d+)?)\s*s(?:ec)?(?:ond)?s?/i)
    if (secondMatch) {
      const seconds = parseFloat(secondMatch[1])
      return isNaN(seconds) ? 0 : Math.round(seconds / 60)
    }
    
    // If no unit specified, try to extract just the number and assume minutes
    const numberMatch = input.match(/(\d+(?:\.\d+)?)/)
    if (numberMatch) {
      const value = parseFloat(numberMatch[1])
      return isNaN(value) ? 0 : Math.round(value)
    }
    
    return 0
  }
  
  /**
   * Normalizes material names for consistent storage
   * Converts to lowercase, replaces spaces with underscores, removes special chars
   * 
   * @param materialName - Raw material name from CSV
   * @returns Normalized material name
   */
  static normalizeMaterialName(materialName: string): string {
    if (!materialName || typeof materialName !== 'string') {
      return ''
    }
    
    return materialName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')           // Replace spaces with underscores
      .replace(/[^a-z0-9_]/g, '')     // Remove special characters except underscores
      .replace(/_{2,}/g, '_')         // Replace multiple underscores with single
      .replace(/^_|_$/g, '')          // Remove leading/trailing underscores
  }
  
  /**
   * Parses prerequisite strings that may contain multiple requirements
   * Handles semicolon-separated lists and normalizes IDs
   * 
   * @param prerequisiteString - Input prerequisite string
   * @returns Array of normalized prerequisite IDs
   */
  static parsePrerequisites(prerequisiteString: string): string[] {
    if (!prerequisiteString || typeof prerequisiteString !== 'string') {
      return []
    }
    
    return prerequisiteString
      .split(';')
      .map(prereq => prereq.trim())
      .filter(prereq => prereq.length > 0)
      .map(prereq => this.normalizeId(prereq))
  }
  
  /**
   * Normalizes IDs for consistent referencing
   * Similar to material names but preserves more characters for IDs
   * 
   * @param id - Raw ID from CSV
   * @returns Normalized ID
   */
  static normalizeId(id: string): string {
    if (!id || typeof id !== 'string') {
      return ''
    }
    
    return id
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')           // Replace spaces with underscores
      .replace(/[^a-z0-9_-]/g, '')    // Keep letters, numbers, underscores, hyphens
      .replace(/_{2,}/g, '_')         // Replace multiple underscores with single
      .replace(/^_|_$/g, '')          // Remove leading/trailing underscores
  }
  
  /**
   * Parses effect strings that describe what an item does
   * Extracts numeric values and effect types
   * 
   * @param effectString - Input effect description
   * @returns Object with parsed effects
   */
  static parseEffects(effectString: string): { [key: string]: number | string } {
    const effects: { [key: string]: number | string } = {}
    
    if (!effectString || typeof effectString !== 'string') {
      return effects
    }
    
    const input = effectString.toLowerCase()
    
    // Parse common effect patterns
    const patterns = [
      { regex: /\+(\d+)\s*gold/i, key: 'gold_bonus', type: 'number' },
      { regex: /\+(\d+)\s*xp/i, key: 'xp_bonus', type: 'number' },
      { regex: /\+(\d+)\s*energy/i, key: 'energy_bonus', type: 'number' },
      { regex: /\+(\d+)%\s*efficiency/i, key: 'efficiency_bonus', type: 'number' },
      { regex: /\+(\d+)\s*plots?/i, key: 'plots_added', type: 'number' },
      { regex: /\+(\d+)\s*storage/i, key: 'storage_bonus', type: 'number' },
      { regex: /-(\d+)%\s*energy\s*drain/i, key: 'energy_drain_reduction', type: 'number' },
      { regex: /(\d+)\s*minutes?\s*faster/i, key: 'time_reduction', type: 'number' }
    ]
    
    for (const pattern of patterns) {
      const match = input.match(pattern.regex)
      if (match) {
        const value = parseInt(match[1])
        if (!isNaN(value)) {
          effects[pattern.key] = value
        }
      }
    }
    
    // Store original effect string for reference
    effects.original_text = effectString
    
    return effects
  }
  
  /**
   * Validates that a parsed material map is reasonable
   * Checks for common issues like negative quantities or invalid materials
   * 
   * @param materials - Parsed materials map
   * @returns Validation result with any warnings
   */
  static validateMaterials(materials: Map<string, number>): {
    isValid: boolean
    warnings: string[]
  } {
    const warnings: string[] = []
    let isValid = true
    
    // Standard materials from the game design
    const validMaterials = new Set([
      'wood', 'stone', 'copper', 'iron', 'silver', 'crystal', 'mythril', 'obsidian',
      'pine_resin', 'shadow_bark', 'mountain_stone', 'cave_crystal', 
      'frozen_heart', 'molten_core', 'enchanted_wood', 'gold', 'energy'
    ])
    
    for (const [material, quantity] of materials.entries()) {
      // Check for negative quantities
      if (quantity < 0) {
        warnings.push(`Negative quantity for ${material}: ${quantity}`)
        isValid = false
      }
      
      // Check for unreasonably large quantities
      if (quantity > 10000) {
        warnings.push(`Very large quantity for ${material}: ${quantity}`)
      }
      
      // Check for unknown materials (warning only, not invalid)
      if (!validMaterials.has(material)) {
        warnings.push(`Unknown material: ${material}`)
      }
    }
    
    return { isValid, warnings }
  }
  
  /**
   * Utility method to convert a materials map back to string format
   * Useful for debugging and display purposes
   * 
   * @param materials - Materials map to convert
   * @returns String representation like "Crystal x2;Silver x5"
   */
  static materialsToString(materials: Map<string, number>): string {
    const parts: string[] = []
    
    for (const [material, quantity] of materials.entries()) {
      if (quantity > 0) {
        // Convert back to display format (capitalize first letter)
        const displayName = material.charAt(0).toUpperCase() + material.slice(1).replace(/_/g, ' ')
        parts.push(`${displayName} x${quantity}`)
      }
    }
    
    return parts.join(';')
  }
}
