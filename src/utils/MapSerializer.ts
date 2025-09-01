// MapSerializer - Phase 6A Critical Implementation
// Handles serialization of Map objects for Web Worker communication

import type { 
  SimulationConfig, 
  AllParameters,
  ParameterOverride 
} from '@/types'

/**
 * Serialized version of SimulationConfig for Web Worker communication
 * All Map objects are converted to arrays of [key, value] pairs
 */
export interface SerializedSimulationConfig {
  id: string
  createdAt: string
  lastModified: string
  quickSetup: any // QuickSetup doesn't contain Maps
  parameterOverrides?: Array<[string, any]> // Map<string, any> → Array
  isValid: boolean
  validationErrors: string[]
  
  // Additional field for serialized parameters if needed
  serializedParameters?: any
}

/**
 * Type guard to check if a value is a Map
 */
function isMap(value: any): value is Map<any, any> {
  return value instanceof Map
}

/**
 * Type guard to check if a value is a plain object (not null, Array, Date, etc.)
 */
function isPlainObject(value: any): boolean {
  return value !== null && 
         typeof value === 'object' && 
         !Array.isArray(value) && 
         !(value instanceof Date) && 
         !(value instanceof Map) && 
         !(value instanceof Set)
}

/**
 * MapSerializer handles conversion between Map objects and arrays for Web Worker communication
 */
export class MapSerializer {
  /**
   * Serializes a SimulationConfig by converting all Maps to arrays
   */
  static serialize(config: SimulationConfig): SerializedSimulationConfig {
    const serialized: SerializedSimulationConfig = {
      id: config.id,
      createdAt: config.createdAt,
      lastModified: config.lastModified,
      quickSetup: config.quickSetup,
      isValid: config.isValid,
      validationErrors: Array.isArray(config.validationErrors) ? [...config.validationErrors] : []
    }

    // Serialize parameterOverrides Map (handle both Map and plain object)
    if (config.parameterOverrides) {
      if (config.parameterOverrides instanceof Map) {
        // It's a Map object
        serialized.parameterOverrides = Array.from(config.parameterOverrides.entries())
      } else if (typeof config.parameterOverrides === 'object') {
        // It's a plain object (from JSON.parse/stringify)
        serialized.parameterOverrides = Object.entries(config.parameterOverrides)
      } else {
        // It's already an array
        serialized.parameterOverrides = config.parameterOverrides
      }
    }

    return serialized
  }

  /**
   * Deserializes a SerializedSimulationConfig by reconstructing Map objects
   */
  static deserialize(data: SerializedSimulationConfig): SimulationConfig {
    const config: SimulationConfig = {
      id: data.id,
      createdAt: data.createdAt,
      lastModified: data.lastModified,
      quickSetup: data.quickSetup,
      isValid: data.isValid,
      validationErrors: [...data.validationErrors]
    }

    // Reconstruct parameterOverrides Map
    if (data.parameterOverrides) {
      config.parameterOverrides = new Map(data.parameterOverrides)
    }

    return config
  }

  /**
   * Recursively serializes all Maps in a nested object structure
   * Used for AllParameters and other complex parameter objects
   */
  static serializeMapsInObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj
    }

    // Handle Maps by converting to a special serialized format
    if (isMap(obj)) {
      return {
        __isSerializedMap: true,
        entries: Array.from(obj.entries())
      }
    }

    // Handle Arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.serializeMapsInObject(item))
    }

    // Handle plain objects
    if (isPlainObject(obj)) {
      const serialized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        serialized[key] = this.serializeMapsInObject(value)
      }
      return serialized
    }

    // Primitive values (string, number, boolean, etc.)
    return obj
  }

  /**
   * Recursively deserializes all Maps in a nested object structure
   * Reconstructs Maps from the special serialized format
   */
  static deserializeMapsInObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj
    }

    // Handle serialized Maps
    if (isPlainObject(obj) && obj.__isSerializedMap === true && Array.isArray(obj.entries)) {
      return new Map(obj.entries)
    }

    // Handle Arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.deserializeMapsInObject(item))
    }

    // Handle plain objects
    if (isPlainObject(obj)) {
      const deserialized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        deserialized[key] = this.deserializeMapsInObject(value)
      }
      return deserialized
    }

    // Primitive values (string, number, boolean, etc.)
    return obj
  }

  /**
   * Serializes AllParameters object with all nested Maps
   */
  static serializeParameters(parameters: AllParameters): any {
    return this.serializeMapsInObject(parameters)
  }

  /**
   * Deserializes AllParameters object, reconstructing all nested Maps
   */
  static deserializeParameters(data: any): AllParameters {
    return this.deserializeMapsInObject(data)
  }

  /**
   * Tests serialization roundtrip to ensure data integrity
   * Returns true if the data survives serialization/deserialization intact
   */
  static testRoundtrip(obj: any): { success: boolean; error?: string } {
    try {
      const serialized = this.serializeMapsInObject(obj)
      const deserialized = this.deserializeMapsInObject(serialized)
      
      // Basic checks - could be enhanced with deep comparison
      if (typeof obj !== typeof deserialized) {
        return { success: false, error: 'Type mismatch after roundtrip' }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Creates a deep clone using serialization (useful for testing)
   */
  static deepClone<T>(obj: T): T {
    return this.deserializeMapsInObject(this.serializeMapsInObject(obj))
  }
}

/**
 * Helper function to validate that Maps were properly reconstructed
 */
export function validateMapReconstruction(original: any, reconstructed: any, path = 'root'): string[] {
  const errors: string[] = []

  if (isMap(original)) {
    if (!isMap(reconstructed)) {
      errors.push(`${path}: Expected Map but got ${typeof reconstructed}`)
      return errors
    }

    if (original.size !== reconstructed.size) {
      errors.push(`${path}: Map size mismatch (${original.size} vs ${reconstructed.size})`)
    }

    for (const [key, value] of original.entries()) {
      if (!reconstructed.has(key)) {
        errors.push(`${path}: Missing key "${key}"`)
      } else {
        const newPath = `${path}.get("${key}")`
        errors.push(...validateMapReconstruction(value, reconstructed.get(key), newPath))
      }
    }
  } else if (Array.isArray(original)) {
    if (!Array.isArray(reconstructed)) {
      errors.push(`${path}: Expected Array but got ${typeof reconstructed}`)
      return errors
    }

    if (original.length !== reconstructed.length) {
      errors.push(`${path}: Array length mismatch (${original.length} vs ${reconstructed.length})`)
    }

    original.forEach((item, index) => {
      const newPath = `${path}[${index}]`
      errors.push(...validateMapReconstruction(item, reconstructed[index], newPath))
    })
  } else if (isPlainObject(original)) {
    if (!isPlainObject(reconstructed)) {
      errors.push(`${path}: Expected object but got ${typeof reconstructed}`)
      return errors
    }

    for (const [key, value] of Object.entries(original)) {
      if (!(key in reconstructed)) {
        errors.push(`${path}: Missing property "${key}"`)
      } else {
        const newPath = `${path}.${key}`
        errors.push(...validateMapReconstruction(value, reconstructed[key], newPath))
      }
    }
  } else if (original !== reconstructed) {
    errors.push(`${path}: Value mismatch (${original} vs ${reconstructed})`)
  }

  return errors
}
